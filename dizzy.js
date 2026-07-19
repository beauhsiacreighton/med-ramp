/* =========================================================
   Dizziness Intake — Application Logic
   Static, client-side only. No build step required.
   ========================================================= */

/* ---------------------------------------------------------
   CONFIGURATION — edit these values
   --------------------------------------------------------- */

// Paste your OpenRouter API key between the quotes below.
// Get one at https://openrouter.ai/keys
// WARNING: Any key placed here is visible to anyone who views this
// site's source code. For a public deployment, proxy this request
// through a small server or serverless function instead of calling
// OpenRouter directly from the browser with an embedded key.
const OPENROUTER_API_KEY = "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";

// Any model available on OpenRouter can be used here.
// See https://openrouter.ai/models for the full list.
const OPENROUTER_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/* ---------------------------------------------------------
   SYSTEM PROMPT sent to the LLM
   --------------------------------------------------------- */
const SYSTEM_PROMPT = `You are an Otolaryngology (ENT) physician assistant preparing clinical
decision support for a physician who has not yet seen the patient.

Using ONLY the information provided in the patient intake JSON below, do the following:

1. Write a concise, physician-quality History of Present Illness (HPI) suitable for an ENT
   clinic note. Use complete sentences and standard clinical phrasing, the way an ENT resident
   would document it (for example: "The patient presents with a 3-day history of episodic
   spinning vertigo triggered by turning over in bed...").
2. List pertinent positives (relevant findings the patient endorsed).
3. List pertinent negatives (relevant findings the patient explicitly denied that help narrow
   the differential).
4. List potential red flags present in the history (findings that could suggest a dangerous
   central, cardiovascular, or otherwise urgent cause).
5. Provide a possible differential diagnosis, ranked from most to least likely given ONLY the
   history provided. For each diagnosis, give one or two sentences explaining why it is
   included, based only on the patient's responses.
6. Explicitly list any additional history or examination findings that would be required to
   narrow the differential further (e.g., HINTS exam, orthostatic vitals, audiometry), since
   this tool cannot perform a physical examination.

Rules you must follow strictly:
- Do NOT invent or assume information that was not provided.
- Do NOT hallucinate findings, exam results, or history.
- Do NOT recommend treatment.
- Do NOT claim diagnostic certainty.
- Do NOT state a definitive diagnosis — only a ranked differential with reasoning.
- Explicitly state when information is missing or would be needed to clarify the picture.
- Make clear this is decision support only, not a diagnosis.

Respond ONLY with a single valid JSON object and nothing else — no markdown formatting, no
code fences, no commentary before or after it. The JSON object must match exactly this shape:

{
  "hpi": "string — the full HPI paragraph(s)",
  "pertinent_positives": ["string", "..."],
  "pertinent_negatives": ["string", "..."],
  "red_flags": ["string", "..."],
  "differential_diagnosis": [
    { "diagnosis": "string", "rationale": "string" }
  ],
  "missing_information": ["string", "..."]
}

If a category has nothing to report, return an empty array for it (not a placeholder string).`;

/* ---------------------------------------------------------
   QUESTION SCHEMA
   Each step: id, section, type, title, subtitle, options,
   required, condition(answers) -> bool
   --------------------------------------------------------- */
const YN_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const STEPS = [
  // ---------- Demographics ----------
  {
    id: "age", section: "Demographics", type: "number",
    title: "How old are you?",
    placeholder: "Age in years",
    required: true,
  },
  {
    id: "sex", section: "Demographics", type: "single",
    title: "What is your sex?",
    subtitle: "This helps place your symptoms in clinical context.",
    required: true,
    options: [
      { value: "female", label: "Female" },
      { value: "male", label: "Male" },
      { value: "other", label: "Other" },
      { value: "prefer_not_to_say", label: "Prefer not to say" },
    ],
  },

  // ---------- Chief complaint ----------
  {
    id: "symptom_type", section: "Chief Complaint", type: "single",
    title: "Which best describes what you feel?",
    subtitle: "Choose the closest match — it's okay if it's not exact.",
    required: true,
    options: [
      { value: "vertigo", label: "A spinning or whirling sensation" },
      { value: "presyncope", label: "Feeling like I might faint or black out" },
      { value: "imbalance", label: "Unsteadiness or trouble walking or balancing" },
      { value: "vague", label: "A vague floating or rocking feeling" },
      { value: "unsure", label: "Hard to describe" },
    ],
  },

  // ---------- Timing (TiTrATE) ----------
  {
    id: "course", section: "Timing", type: "single",
    title: "Is your dizziness constant, or does it come and go?",
    required: true,
    options: [
      { value: "constant", label: "It's constant — hasn't gone away since it started" },
      { value: "episodic", label: "It comes and goes in separate episodes" },
    ],
  },
  {
    id: "onset_speed", section: "Timing", type: "single",
    title: "When it started, did it come on suddenly or gradually?",
    required: true,
    condition: (a) => a.course === "constant",
    options: [
      { value: "sudden", label: "Suddenly — over seconds to minutes" },
      { value: "gradual", label: "Gradually — over hours to days" },
    ],
  },
  {
    id: "constant_duration", section: "Timing", type: "single",
    title: "How long has this constant dizziness been going on?",
    required: true,
    condition: (a) => a.course === "constant",
    options: [
      { value: "under_24h", label: "Less than 24 hours" },
      { value: "1_3_days", label: "1–3 days" },
      { value: "4_7_days", label: "4–7 days" },
      { value: "over_1wk", label: "More than a week" },
    ],
  },
  {
    id: "still_present", section: "Timing", type: "single",
    title: "Are you still feeling dizzy right now?",
    required: true,
    condition: (a) => a.course === "constant",
    options: YN_OPTIONS,
  },
  {
    id: "episode_count", section: "Timing", type: "single",
    title: "Is this the first episode you've ever had, or have there been others?",
    required: true,
    condition: (a) => a.course === "episodic",
    options: [
      { value: "first", label: "This is the first episode I've ever had" },
      { value: "few", label: "I've had a few episodes before" },
      { value: "many", label: "I've had many episodes over time" },
    ],
  },
  {
    id: "episode_duration", section: "Timing", type: "single",
    title: "About how long does each episode last?",
    required: true,
    condition: (a) => a.course === "episodic",
    options: [
      { value: "seconds", label: "A few seconds" },
      { value: "under_1min", label: "About 30 seconds to a minute" },
      { value: "min_to_hour", label: "Several minutes, up to about an hour" },
      { value: "hours", label: "Several hours" },
      { value: "half_day_plus", label: "More than 12 hours, up to a few days" },
    ],
  },
  {
    id: "episode_frequency", section: "Timing", type: "text",
    title: "How often do the episodes happen?",
    subtitle: "Optional — a rough estimate is fine.",
    placeholder: "e.g., twice a week, once a month",
    required: false,
    condition: (a) => a.course === "episodic",
  },
  {
    id: "illness_duration", section: "Timing", type: "single",
    title: "How long ago did this first start happening?",
    required: true,
    condition: (a) => a.course === "episodic",
    options: [
      { value: "today_yesterday", label: "Today or yesterday" },
      { value: "past_week", label: "This past week" },
      { value: "past_month", label: "This past month" },
      { value: "several_months", label: "Several months ago" },
      { value: "year_plus", label: "A year or more ago" },
    ],
  },

  // ---------- Triggers ----------
  {
    id: "triggers", section: "Triggers", type: "multi",
    title: "What brings on the dizziness, or makes it worse?",
    subtitle: "Select all that apply.",
    required: true,
    options: [
      { value: "positional", label: "Rolling over in bed, or tilting my head back" },
      { value: "orthostatic", label: "Standing up quickly from sitting or lying down" },
      { value: "pressure", label: "Loud sounds, straining, or pressure changes (coughing, sneezing)" },
      { value: "spontaneous", label: "Nothing in particular — it happens on its own" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "positional_duration", section: "Triggers", type: "single",
    title: "Once triggered by a position change, how long does the spinning last?",
    required: true,
    condition: (a) => (a.triggers || []).includes("positional"),
    options: [
      { value: "under_30s", label: "Under 30 seconds" },
      { value: "30_60s", label: "About 30–60 seconds" },
      { value: "over_1min", label: "More than a minute" },
    ],
  },
  {
    id: "positional_delay", section: "Triggers", type: "single",
    title: "Does the spinning start right away, or after a short delay?",
    required: true,
    condition: (a) => (a.triggers || []).includes("positional"),
    options: [
      { value: "immediate", label: "Right away" },
      { value: "delayed", label: "After a few seconds' delay" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "orthostatic_symptoms", section: "Triggers", type: "multi",
    title: "When you stand up, have you noticed any of these?",
    required: true,
    condition: (a) => (a.triggers || []).includes("orthostatic"),
    options: [
      { value: "improves_sitting", label: "Lightheadedness that improves after sitting or lying back down" },
      { value: "vision_graying", label: "Vision going gray or dark briefly" },
      { value: "palpitations", label: "Heart racing or pounding" },
      { value: "none", label: "None of these" },
    ],
  },
  {
    id: "pressure_symptoms", section: "Triggers", type: "multi",
    title: "With loud sounds, straining, or pressure changes, have you noticed any of these?",
    required: true,
    condition: (a) => (a.triggers || []).includes("pressure"),
    options: [
      { value: "pulsatile_tinnitus", label: "Ringing that pulses with your heartbeat" },
      { value: "autophony", label: "Hearing your own voice or breathing unusually loudly" },
      { value: "sound_triggered_spin", label: "Spinning triggered by sound or pressure" },
      { value: "none", label: "None of these" },
    ],
  },

  // ---------- Ear symptoms ----------
  {
    id: "hearing_loss", section: "Ear Symptoms", type: "single",
    title: "Have you noticed any hearing loss?",
    required: true,
    options: YN_OPTIONS,
  },
  {
    id: "hearing_loss_side", section: "Ear Symptoms", type: "single",
    title: "Is the hearing loss in one ear or both?",
    required: true,
    condition: (a) => a.hearing_loss === "yes",
    options: [
      { value: "one_ear", label: "One ear" },
      { value: "both_ears", label: "Both ears" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "tinnitus", section: "Ear Symptoms", type: "single",
    title: "Do you have ringing or buzzing in your ears (tinnitus)?",
    required: true,
    options: YN_OPTIONS,
  },
  {
    id: "ear_fullness", section: "Ear Symptoms", type: "single",
    title: "Do you feel fullness or pressure in either ear?",
    required: true,
    options: YN_OPTIONS,
  },
  {
    id: "ear_symptom_fluctuation", section: "Ear Symptoms", type: "single",
    title: "Do these ear symptoms come and go along with the dizziness, or have they been constant?",
    required: true,
    condition: (a) => a.hearing_loss === "yes" || a.tinnitus === "yes" || a.ear_fullness === "yes",
    options: [
      { value: "with_episodes", label: "Come and go with the dizziness episodes" },
      { value: "constant", label: "Constant, and not clearly related to the episodes" },
      { value: "unsure", label: "Not sure" },
    ],
  },

  // ---------- Headache / migraine ----------
  {
    id: "headache", section: "Headache & Migraine", type: "single",
    title: "Do you have a headache during or around your dizziness?",
    required: true,
    options: YN_OPTIONS,
  },
  {
    id: "migraine_features", section: "Headache & Migraine", type: "multi",
    title: "During episodes, do you notice any of the following?",
    required: true,
    condition: (a) => a.headache === "yes",
    options: [
      { value: "photophobia", label: "Sensitivity to light" },
      { value: "phonophobia", label: "Sensitivity to sound" },
      { value: "aura", label: "Visual sparkles, zigzag lines, or blind spots before the headache" },
      { value: "nausea", label: "Nausea along with the headache" },
      { value: "none", label: "None of these" },
    ],
  },
  {
    id: "migraine_history", section: "Headache & Migraine", type: "single",
    title: "Have you ever been diagnosed with migraines, or do you get recurring headaches with sensitivity to light or sound?",
    required: true,
    options: YN_OPTIONS,
  },

  // ---------- Neurological red flags ----------
  {
    id: "neuro_symptoms", section: "Neurological Symptoms", type: "multi",
    title: "During or around your dizziness, have you had any of the following?",
    subtitle: "Select all that apply — these help rule out more serious causes.",
    required: true,
    options: [
      { value: "diplopia", label: "Double vision" },
      { value: "dysarthria", label: "Slurred speech" },
      { value: "dysphagia", label: "Difficulty swallowing" },
      { value: "numbness", label: "Numbness or tingling in your face or body" },
      { value: "weakness", label: "Weakness in an arm or leg" },
      { value: "severe_ataxia", label: "Severe trouble walking — needed help or support" },
      { value: "loc", label: "Loss of consciousness or fainting" },
      { value: "none", label: "None of these" },
    ],
  },

  // ---------- Other red flags ----------
  {
    id: "sudden_headache", section: "Other Symptoms", type: "single",
    title: "Have you had a new, severe headache or neck pain along with the dizziness?",
    required: true,
    options: YN_OPTIONS,
  },
  {
    id: "fever", section: "Other Symptoms", type: "single",
    title: "Do you currently have a fever?",
    required: true,
    options: YN_OPTIONS,
  },
  {
    id: "trauma", section: "Other Symptoms", type: "single",
    title: "Have you had a recent head or neck injury?",
    required: true,
    options: YN_OPTIONS,
  },
  {
    id: "poor_oral_intake", section: "Other Symptoms", type: "single",
    title: "Have you been vomiting a lot, or unable to eat or drink normally, because of the dizziness?",
    required: true,
    options: YN_OPTIONS,
  },
  {
    id: "vascular_risk_factors", section: "Other Symptoms", type: "multi",
    title: "Do you have any of the following?",
    subtitle: "Select all that apply.",
    required: true,
    options: [
      { value: "hypertension", label: "High blood pressure" },
      { value: "diabetes", label: "Diabetes" },
      { value: "high_cholesterol", label: "High cholesterol" },
      { value: "smoking", label: "Current or past smoking" },
      { value: "prior_stroke_tia", label: "Prior stroke or TIA (mini-stroke)" },
      { value: "afib", label: "Irregular heartbeat (such as atrial fibrillation)" },
      { value: "none", label: "None of these" },
    ],
  },

  // ---------- Medications ----------
  {
    id: "medications", section: "Medications", type: "textarea",
    title: "What medications are you currently taking?",
    subtitle: "Optional — include over-the-counter medications and supplements if you can.",
    placeholder: "List medications here, or leave blank if none",
    required: false,
  },
  {
    id: "recent_medication_changes", section: "Medications", type: "single",
    title: "Have you started any new medications or changed doses recently?",
    required: true,
    options: YN_OPTIONS,
  },
  {
    id: "medication_changes_detail", section: "Medications", type: "text",
    title: "What changed?",
    subtitle: "Optional",
    placeholder: "e.g., started a new blood pressure medication 2 weeks ago",
    required: false,
    condition: (a) => a.recent_medication_changes === "yes",
  },
  {
    id: "alcohol_caffeine", section: "Medications", type: "text",
    title: "Any recent changes in alcohol or caffeine intake?",
    subtitle: "Optional",
    placeholder: "e.g., no change, or increased coffee intake",
    required: false,
  },

  // ---------- Medical history ----------
  {
    id: "recent_uri", section: "Medical History", type: "single",
    title: "Have you had a cold, flu, or ear infection in the past few weeks?",
    required: true,
    options: YN_OPTIONS,
  },
  {
    id: "ear_history", section: "Medical History", type: "single",
    title: "Do you have a history of ear problems or ear surgery?",
    required: true,
    options: YN_OPTIONS,
  },
  {
    id: "ear_history_detail", section: "Medical History", type: "text",
    title: "Please briefly describe your ear history",
    subtitle: "Optional",
    placeholder: "e.g., ear tubes as a child, chronic ear infections",
    required: false,
    condition: (a) => a.ear_history === "yes",
  },
  {
    id: "prior_similar_episodes", section: "Medical History", type: "single",
    title: "Has anything like this happened before, even mild or different?",
    required: true,
    condition: (a) => a.course === "constant",
    options: YN_OPTIONS,
  },

  // ---------- Functional impact ----------
  {
    id: "falls", section: "Functional Impact", type: "single",
    title: "Has this caused you to fall, or nearly fall?",
    required: true,
    options: YN_OPTIONS,
  },
  {
    id: "functional_impact", section: "Functional Impact", type: "single",
    title: "Is this affecting your ability to do your daily activities?",
    required: true,
    options: YN_OPTIONS,
  },

  // ---------- Final ----------
  {
    id: "additional_comments", section: "Additional Information", type: "textarea",
    title: "Is there anything else you'd like your doctor to know?",
    required: false,
  },
];

/* ---------------------------------------------------------
   STATE
   --------------------------------------------------------- */
let answers = {};
let currentStepId = STEPS[0].id;
let lastResultPayload = null; // cached structured data for retry

/* ---------------------------------------------------------
   DOM REFERENCES
   --------------------------------------------------------- */
const screens = {
  welcome: document.getElementById("screen-welcome"),
  questions: document.getElementById("screen-questions"),
  loading: document.getElementById("screen-loading"),
  error: document.getElementById("screen-error"),
  results: document.getElementById("screen-results"),
};

const questionContainer = document.getElementById("questionContainer");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const progressFill = document.getElementById("progressFill");
const progressLabel = document.getElementById("progressLabel");
const progressTrack = document.getElementById("progressTrack");
const horizonLine = document.getElementById("horizonLine");
const horizonDot = document.getElementById("horizonDot");

/* ---------------------------------------------------------
   HELPERS: visible step list & navigation
   --------------------------------------------------------- */
function getVisibleSteps() {
  return STEPS.filter((s) => !s.condition || s.condition(answers));
}

function getStepById(id) {
  return STEPS.find((s) => s.id === id);
}

function currentPosition() {
  const visible = getVisibleSteps();
  return visible.findIndex((s) => s.id === currentStepId);
}

function goToScreen(name) {
  Object.values(screens).forEach((el) => (el.dataset.active = "false"));
  screens[name].dataset.active = "true";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------------------------------------------------------
   RENDERING
   --------------------------------------------------------- */
function checkIconSvg() {
  return '<svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function renderStep(step) {
  questionContainer.innerHTML = "";

  const eyebrow = document.createElement("div");
  eyebrow.className = "q-eyebrow";
  eyebrow.textContent = step.section;
  questionContainer.appendChild(eyebrow);

  const title = document.createElement("h2");
  title.className = "q-title";
  title.textContent = step.title;
  questionContainer.appendChild(title);

  if (step.subtitle) {
    const sub = document.createElement("p");
    sub.className = "q-subtitle";
    sub.textContent = step.subtitle;
    questionContainer.appendChild(sub);
  }

  if (!step.required) {
    const tag = document.createElement("span");
    tag.className = "q-optional-tag";
    tag.textContent = "Optional";
    questionContainer.appendChild(tag);
  }

  const existing = answers[step.id];

  if (step.type === "single" || step.type === "multi") {
    const isYesNo = step.options === YN_OPTIONS;
    const list = document.createElement("div");
    list.className = "options-list" + (isYesNo ? " yesno-row" : "");

    step.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-btn" + (step.type === "single" ? " is-radio" : "");
      const isSelected =
        step.type === "single" ? existing === opt.value : Array.isArray(existing) && existing.includes(opt.value);
      btn.setAttribute("aria-pressed", isSelected ? "true" : "false");

      const check = document.createElement("span");
      check.className = "option-check";
      check.innerHTML = checkIconSvg();
      btn.appendChild(check);

      const label = document.createElement("span");
      label.textContent = opt.label;
      btn.appendChild(label);

      btn.addEventListener("click", () => {
        if (step.type === "single") {
          answers[step.id] = opt.value;
          renderStep(step); // re-render to show selection
        } else {
          const arr = Array.isArray(answers[step.id]) ? [...answers[step.id]] : [];
          const idx = arr.indexOf(opt.value);
          if (opt.value === "none" || opt.value === "unsure") {
            // exclusive-ish options: selecting "none"/"unsure" clears others
            if (idx > -1) {
              answers[step.id] = arr.filter((v) => v !== opt.value);
            } else {
              answers[step.id] = [opt.value];
            }
          } else {
            let next = arr.filter((v) => v !== "none" && v !== "unsure");
            if (idx > -1) {
              next = next.filter((v) => v !== opt.value);
            } else {
              next.push(opt.value);
            }
            answers[step.id] = next;
          }
          renderStep(step);
        }
        updateNextButtonState(step);
      });

      list.appendChild(btn);
    });

    questionContainer.appendChild(list);
  }

  if (step.type === "text") {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "text-input";
    input.placeholder = step.placeholder || "";
    input.value = existing || "";
    input.addEventListener("input", () => {
      answers[step.id] = input.value;
      updateNextButtonState(step);
    });
    questionContainer.appendChild(input);
    setTimeout(() => input.focus(), 50);
  }

  if (step.type === "textarea") {
    const textarea = document.createElement("textarea");
    textarea.className = "textarea-input";
    textarea.placeholder = step.placeholder || "";
    textarea.value = existing || "";
    textarea.addEventListener("input", () => {
      answers[step.id] = textarea.value;
      updateNextButtonState(step);
    });
    questionContainer.appendChild(textarea);
  }

  if (step.type === "number") {
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = "120";
    input.inputMode = "numeric";
    input.className = "number-input";
    input.placeholder = step.placeholder || "";
    input.value = existing || "";
    input.addEventListener("input", () => {
      answers[step.id] = input.value;
      updateNextButtonState(step);
    });
    questionContainer.appendChild(input);
    setTimeout(() => input.focus(), 50);
  }

  updateNextButtonState(step);
  updateProgress();
  updateBackButtonVisibility();
}

function isStepAnswered(step) {
  const val = answers[step.id];
  if (step.type === "multi") return Array.isArray(val) && val.length > 0;
  if (val === undefined || val === null) return false;
  if (typeof val === "string") return val.trim().length > 0;
  return true;
}

function updateNextButtonState(step) {
  const visible = getVisibleSteps();
  const isLast = visible[visible.length - 1].id === step.id;
  nextBtn.textContent = isLast ? "Submit" : "Next";
  if (step.required) {
    nextBtn.disabled = !isStepAnswered(step);
  } else {
    nextBtn.disabled = false;
  }
}

function updateBackButtonVisibility() {
  const pos = currentPosition();
  backBtn.style.visibility = pos <= 0 ? "hidden" : "visible";
}

function updateProgress() {
  const visible = getVisibleSteps();
  const pos = currentPosition();
  const total = visible.length;
  const pct = total > 0 ? Math.round(((pos + 1) / total) * 100) : 0;

  progressFill.style.width = pct + "%";
  progressTrack.setAttribute("aria-valuenow", String(pct));
  progressLabel.textContent = `Question ${pos + 1} of ${total}`;

  // Signature "balance horizon": tilts at the start, levels out as you finish
  const maxTilt = 7; // degrees
  const tilt = maxTilt * (1 - pct / 100);
  horizonLine.style.transform = `rotate(${tilt}deg)`;
  const dotX = 4 + (196 - 4) * (pct / 100);
  horizonDot.setAttribute("cx", String(dotX));
}

/* ---------------------------------------------------------
   NAVIGATION
   --------------------------------------------------------- */
function goNext() {
  const step = getStepById(currentStepId);
  if (step.required && !isStepAnswered(step)) return;

  const visible = getVisibleSteps();
  const pos = visible.findIndex((s) => s.id === currentStepId);

  if (pos === visible.length - 1) {
    submitQuestionnaire();
    return;
  }

  currentStepId = visible[pos + 1].id;
  renderStep(getStepById(currentStepId));
}

function goBack() {
  const visible = getVisibleSteps();
  const pos = visible.findIndex((s) => s.id === currentStepId);
  if (pos <= 0) return;
  currentStepId = visible[pos - 1].id;
  renderStep(getStepById(currentStepId));
}

document.getElementById("startBtn").addEventListener("click", () => {
  goToScreen("questions");
  currentStepId = getVisibleSteps()[0].id;
  renderStep(getStepById(currentStepId));
});

nextBtn.addEventListener("click", goNext);
backBtn.addEventListener("click", goBack);

/* ---------------------------------------------------------
   BUILD STRUCTURED JSON FROM ANSWERS
   --------------------------------------------------------- */
function buildStructuredData() {
  const a = answers;
  return {
    demographics: {
      age: a.age || "",
      sex: a.sex || "",
    },
    chief_complaint: {
      symptom_type: a.symptom_type || "",
    },
    timing: {
      course: a.course || "",
      onset_speed: a.onset_speed || "",
      constant_duration: a.constant_duration || "",
      still_present: a.still_present || "",
      episode_count: a.episode_count || "",
      episode_duration: a.episode_duration || "",
      episode_frequency: a.episode_frequency || "",
      illness_duration: a.illness_duration || "",
    },
    triggers: {
      trigger_types: a.triggers || [],
      positional_episode_length: a.positional_duration || "",
      positional_onset_delay: a.positional_delay || "",
      orthostatic_symptoms: a.orthostatic_symptoms || [],
      sound_pressure_symptoms: a.pressure_symptoms || [],
    },
    ear_symptoms: {
      hearing_loss: a.hearing_loss || "",
      hearing_loss_side: a.hearing_loss_side || "",
      tinnitus: a.tinnitus || "",
      ear_fullness: a.ear_fullness || "",
      symptom_fluctuation_with_episodes: a.ear_symptom_fluctuation || "",
    },
    headache_migraine: {
      headache_with_episodes: a.headache || "",
      migraine_features: a.migraine_features || [],
      history_of_migraine: a.migraine_history || "",
    },
    neurological_symptoms: {
      symptoms: (a.neuro_symptoms || []).filter((v) => v !== "none"),
    },
    other_red_flags: {
      sudden_severe_headache_or_neck_pain: a.sudden_headache || "",
      fever: a.fever || "",
      recent_head_or_neck_trauma: a.trauma || "",
      poor_oral_intake_or_persistent_vomiting: a.poor_oral_intake || "",
      vascular_risk_factors: (a.vascular_risk_factors || []).filter((v) => v !== "none"),
    },
    medications: {
      current_medications: a.medications || "",
      recent_medication_changes: a.recent_medication_changes || "",
      medication_changes_detail: a.medication_changes_detail || "",
      alcohol_caffeine_changes: a.alcohol_caffeine || "",
    },
    medical_history: {
      recent_uri_or_ear_infection: a.recent_uri || "",
      history_of_ear_problems_or_surgery: a.ear_history || "",
      ear_history_detail: a.ear_history_detail || "",
      prior_similar_episodes: a.prior_similar_episodes || "",
    },
    functional_impact: {
      falls_or_near_falls: a.falls || "",
      affects_daily_activities: a.functional_impact || "",
    },
    additional_comments: a.additional_comments || "",
  };
}

/* ---------------------------------------------------------
   HUMAN-READABLE LABEL LOOKUPS (for Patient Summary)
   --------------------------------------------------------- */
function labelFor(stepId, value) {
  const step = getStepById(stepId);
  if (!step || !step.options) return value;
  const found = step.options.find((o) => o.value === value);
  return found ? found.label : value;
}

function labelListFor(stepId, values) {
  if (!Array.isArray(values) || values.length === 0) return "None reported";
  return values.map((v) => labelFor(stepId, v)).join(", ");
}

function buildPatientSummaryRows() {
  const a = answers;
  const rows = [];
  rows.push(["Age", a.age || "Not provided"]);
  rows.push(["Sex", labelFor("sex", a.sex) || "Not provided"]);
  rows.push(["Main symptom", labelFor("symptom_type", a.symptom_type)]);
  rows.push(["Course", labelFor("course", a.course)]);

  if (a.course === "constant") {
    rows.push(["Onset", labelFor("onset_speed", a.onset_speed)]);
    rows.push(["Duration so far", labelFor("constant_duration", a.constant_duration)]);
    rows.push(["Still present now", labelFor("still_present", a.still_present)]);
    if (a.prior_similar_episodes) rows.push(["Prior similar episodes", labelFor("prior_similar_episodes", a.prior_similar_episodes)]);
  }
  if (a.course === "episodic") {
    rows.push(["Episode history", labelFor("episode_count", a.episode_count)]);
    rows.push(["Typical episode length", labelFor("episode_duration", a.episode_duration)]);
    if (a.episode_frequency) rows.push(["Frequency", a.episode_frequency]);
    rows.push(["First started", labelFor("illness_duration", a.illness_duration)]);
  }

  rows.push(["Triggers", labelListFor("triggers", a.triggers)]);
  if ((a.triggers || []).includes("positional")) {
    rows.push(["Positional episode length", labelFor("positional_duration", a.positional_duration)]);
    rows.push(["Onset delay after position change", labelFor("positional_delay", a.positional_delay)]);
  }
  if ((a.triggers || []).includes("orthostatic")) {
    rows.push(["Symptoms on standing", labelListFor("orthostatic_symptoms", a.orthostatic_symptoms)]);
  }
  if ((a.triggers || []).includes("pressure")) {
    rows.push(["Sound/pressure symptoms", labelListFor("pressure_symptoms", a.pressure_symptoms)]);
  }

  rows.push(["Hearing loss", labelFor("hearing_loss", a.hearing_loss)]);
  if (a.hearing_loss === "yes") rows.push(["Hearing loss side", labelFor("hearing_loss_side", a.hearing_loss_side)]);
  rows.push(["Tinnitus", labelFor("tinnitus", a.tinnitus)]);
  rows.push(["Ear fullness", labelFor("ear_fullness", a.ear_fullness)]);
  if (a.ear_symptom_fluctuation) rows.push(["Ear symptom pattern", labelFor("ear_symptom_fluctuation", a.ear_symptom_fluctuation)]);

  rows.push(["Headache with episodes", labelFor("headache", a.headache)]);
  if (a.headache === "yes") rows.push(["Migraine features", labelListFor("migraine_features", a.migraine_features)]);
  rows.push(["History of migraines", labelFor("migraine_history", a.migraine_history)]);

  rows.push(["Neurological symptoms", labelListFor("neuro_symptoms", (a.neuro_symptoms || []).filter((v) => v !== "none"))]);

  rows.push(["New severe headache/neck pain", labelFor("sudden_headache", a.sudden_headache)]);
  rows.push(["Fever", labelFor("fever", a.fever)]);
  rows.push(["Recent head/neck trauma", labelFor("trauma", a.trauma)]);
  rows.push(["Poor oral intake / persistent vomiting", labelFor("poor_oral_intake", a.poor_oral_intake)]);
  rows.push(["Vascular risk factors", labelListFor("vascular_risk_factors", (a.vascular_risk_factors || []).filter((v) => v !== "none"))]);

  rows.push(["Current medications", a.medications || "None reported"]);
  rows.push(["Recent medication changes", labelFor("recent_medication_changes", a.recent_medication_changes)]);
  if (a.medication_changes_detail) rows.push(["Medication change detail", a.medication_changes_detail]);
  if (a.alcohol_caffeine) rows.push(["Alcohol/caffeine changes", a.alcohol_caffeine]);

  rows.push(["Recent cold/flu/ear infection", labelFor("recent_uri", a.recent_uri)]);
  rows.push(["History of ear problems/surgery", labelFor("ear_history", a.ear_history)]);
  if (a.ear_history_detail) rows.push(["Ear history detail", a.ear_history_detail]);

  rows.push(["Falls or near-falls", labelFor("falls", a.falls)]);
  rows.push(["Affects daily activities", labelFor("functional_impact", a.functional_impact)]);

  if (a.additional_comments) rows.push(["Additional comments", a.additional_comments]);

  return rows;
}

/* ---------------------------------------------------------
   SUBMIT + LLM CALL
   --------------------------------------------------------- */
async function submitQuestionnaire() {
  const structuredData = buildStructuredData();
  lastResultPayload = structuredData;
  goToScreen("loading");

  try {
    const result = await callOpenRouter(structuredData);
    renderResults(result);
    goToScreen("results");
  } catch (err) {
    console.error(err);
    document.getElementById("errorMessage").textContent =
      err && err.message ? err.message : "We couldn't generate your summary. Please try again.";
    goToScreen("error");
  }
}

document.getElementById("retryBtn").addEventListener("click", () => {
  if (lastResultPayload) {
    goToScreen("loading");
    callOpenRouter(lastResultPayload)
      .then((result) => {
        renderResults(result);
        goToScreen("results");
      })
      .catch((err) => {
        console.error(err);
        document.getElementById("errorMessage").textContent =
          err && err.message ? err.message : "We couldn't generate your summary. Please try again.";
        goToScreen("error");
      });
  } else {
    goToScreen("welcome");
  }
});

async function callOpenRouter(structuredData) {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === "YOUR_OPENROUTER_API_KEY") {
    throw new Error(
      "No OpenRouter API key has been configured yet. Add your key to the OPENROUTER_API_KEY constant near the top of script.js."
    );
  }

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": window.location.href,
      "X-Title": "Dizziness Intake Assistant",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: "Patient intake responses (structured JSON):\n\n" + JSON.stringify(structuredData, null, 2),
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`OpenRouter request failed (${response.status}). ${text}`.trim());
  }

  const data = await response.json();
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

  if (!content) {
    throw new Error("The model returned an empty response.");
  }

  return parseModelJSON(content);
}

function parseModelJSON(raw) {
  let text = raw.trim();
  // Strip code fences if the model added them despite instructions
  text = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  try {
    const parsed = JSON.parse(text);
    return {
      hpi: parsed.hpi || "",
      pertinent_positives: Array.isArray(parsed.pertinent_positives) ? parsed.pertinent_positives : [],
      pertinent_negatives: Array.isArray(parsed.pertinent_negatives) ? parsed.pertinent_negatives : [],
      red_flags: Array.isArray(parsed.red_flags) ? parsed.red_flags : [],
      differential_diagnosis: Array.isArray(parsed.differential_diagnosis) ? parsed.differential_diagnosis : [],
      missing_information: Array.isArray(parsed.missing_information) ? parsed.missing_information : [],
    };
  } catch (e) {
    return {
      hpi: raw,
      pertinent_positives: [],
      pertinent_negatives: [],
      red_flags: [],
      differential_diagnosis: [],
      missing_information: ["The model's response could not be parsed as structured JSON; showing raw output in the HPI section."],
    };
  }
}

/* ---------------------------------------------------------
   RENDER RESULTS
   --------------------------------------------------------- */
function fillList(elId, items, emptyText) {
  const el = document.getElementById(elId);
  el.innerHTML = "";
  if (!items || items.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-note";
    li.textContent = emptyText;
    el.appendChild(li);
    return;
  }
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    el.appendChild(li);
  });
}

function renderResults(result) {
  // Patient Summary
  const summaryEl = document.getElementById("patientSummary");
  summaryEl.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "summary-grid";
  buildPatientSummaryRows().forEach(([key, val]) => {
    const row = document.createElement("div");
    row.className = "summary-row";
    const k = document.createElement("div");
    k.className = "summary-key";
    k.textContent = key;
    const v = document.createElement("div");
    v.className = "summary-val";
    v.textContent = val;
    row.appendChild(k);
    row.appendChild(v);
    grid.appendChild(row);
  });
  summaryEl.appendChild(grid);

  // HPI
  document.getElementById("hpiText").textContent = result.hpi || "No HPI was generated.";

  // Lists
  fillList("pertinentPositives", result.pertinent_positives, "None reported.");
  fillList("pertinentNegatives", result.pertinent_negatives, "None reported.");
  fillList("redFlagsList", result.red_flags, "No red flags identified from the information provided.");
  fillList("missingInfoList", result.missing_information, "No additional information flagged as missing.");

  // Differential diagnosis
  const dxEl = document.getElementById("differentialList");
  dxEl.innerHTML = "";
  if (!result.differential_diagnosis || result.differential_diagnosis.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-note";
    li.textContent = "No differential diagnosis was generated.";
    dxEl.appendChild(li);
  } else {
    result.differential_diagnosis.forEach((dx) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.className = "dx-name";
      name.textContent = dx.diagnosis || "Unspecified";
      const rationale = document.createElement("span");
      rationale.className = "dx-rationale";
      rationale.textContent = dx.rationale || "";
      li.appendChild(name);
      li.appendChild(rationale);
      dxEl.appendChild(li);
    });
  }

  lastResultPayload = { structuredData: lastResultPayload, result };
}

/* ---------------------------------------------------------
   COPY BUTTONS
   --------------------------------------------------------- */
function showCopyConfirm(msg) {
  const el = document.getElementById("copyConfirm");
  el.textContent = msg;
  setTimeout(() => {
    if (el.textContent === msg) el.textContent = "";
  }, 2500);
}

function currentResult() {
  return lastResultPayload && lastResultPayload.result ? lastResultPayload.result : null;
}

document.getElementById("copyHpiBtn").addEventListener("click", async () => {
  const result = currentResult();
  const text = result && result.hpi ? result.hpi : document.getElementById("hpiText").textContent;
  try {
    await navigator.clipboard.writeText(text);
    showCopyConfirm("HPI copied to clipboard.");
  } catch (e) {
    showCopyConfirm("Could not copy automatically — please select and copy manually.");
  }
});

document.getElementById("copyReportBtn").addEventListener("click", async () => {
  const result = currentResult();
  if (!result) return;

  const lines = [];
  lines.push("PRE-VISIT DIZZINESS SUMMARY");
  lines.push("(Decision support only — not a diagnosis)");
  lines.push("");
  lines.push("PATIENT SUMMARY");
  buildPatientSummaryRows().forEach(([k, v]) => lines.push(`- ${k}: ${v}`));
  lines.push("");
  lines.push("HISTORY OF PRESENT ILLNESS (HPI)");
  lines.push(result.hpi || "");
  lines.push("");
  lines.push("PERTINENT POSITIVES");
  (result.pertinent_positives || []).forEach((i) => lines.push(`- ${i}`));
  lines.push("");
  lines.push("PERTINENT NEGATIVES");
  (result.pertinent_negatives || []).forEach((i) => lines.push(`- ${i}`));
  lines.push("");
  lines.push("POSSIBLE DIFFERENTIAL DIAGNOSIS");
  (result.differential_diagnosis || []).forEach((dx, i) => lines.push(`${i + 1}. ${dx.diagnosis} — ${dx.rationale}`));
  lines.push("");
  lines.push("POTENTIAL RED FLAGS");
  (result.red_flags || []).forEach((i) => lines.push(`- ${i}`));
  lines.push("");
  lines.push("MISSING IMPORTANT INFORMATION");
  (result.missing_information || []).forEach((i) => lines.push(`- ${i}`));

  const text = lines.join("\n");
  try {
    await navigator.clipboard.writeText(text);
    showCopyConfirm("Full report copied to clipboard.");
  } catch (e) {
    showCopyConfirm("Could not copy automatically — please select and copy manually.");
  }
});

document.getElementById("restartBtn").addEventListener("click", () => {
  if (confirm("Start a new interview? Your current answers will be cleared.")) {
    resetApp();
  }
});

function resetApp() {
  answers = {};
  currentStepId = STEPS[0].id;
  lastResultPayload = null;
  goToScreen("welcome");
}
