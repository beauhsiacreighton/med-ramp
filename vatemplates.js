/*
  BUILT_IN_TEMPLATES
  -------------------
  These are structural skeletons only — headers and blank fields.
  All clinical content (findings, plans, risks discussed, dosing, etc.)
  is filled in by the resident at the time of documentation.
  Edit this file directly (or use the in-app editor) to match your
  own attendings' preferences. Blanks use square brackets, e.g. [___]
  or [L/R] — the app treats any [bracketed] text as a fillable field.
*/

window.BUILT_IN_TEMPLATES = [
  {
    id: "new-patient-general",
    shorthand: ".NEWPTENT",
    title: "New Patient — General ENT",
    noteType: "Clinic Note",
    subspecialty: "General",
    tags: ["new patient", "intake", "history and physical"],
    body:
`NEW PATIENT — OTOLARYNGOLOGY

CC: [___]

HPI: [Age]-year-old [M/F] presenting with [___]. Onset [___], duration [___],
associated symptoms [___]. Prior workup/treatment: [___].

PMH: [___]
PSH: [___]
MEDICATIONS: [___]
ALLERGIES: [___]
SOCIAL HX: Tobacco [___], alcohol [___], occupation [___]
FAMILY HX: [___]

ROS: Otherwise negative except as noted above.

EXAM:
General: [___]
Ears: [___]
Nose: [___]
Oral cavity/Oropharynx: [___]
Neck: [___]
[Flexible laryngoscopy performed / not performed]: [___]

ASSESSMENT: [___]

PLAN:
1. [___]
2. [___]
3. Follow up [interval]`
  },

  {
    id: "tonsillectomy-op",
    shorthand: ".TONSILLECTOMY",
    title: "Tonsillectomy (+/- Adenoidectomy) — Operative Note",
    noteType: "Op Note",
    subspecialty: "General",
    tags: ["tonsil", "adenoid", "airway", "pediatric", "surgery"],
    body:
`PREOPERATIVE DIAGNOSIS: [___]
POSTOPERATIVE DIAGNOSIS: Same

PROCEDURE(S): Tonsillectomy [+/- adenoidectomy]
SURGEON: [___]
ANESTHESIA: General, [ETT / LMA]
EBL: [___] mL
COMPLICATIONS: None

INDICATION: [___]

FINDINGS: Tonsils [size, e.g., 3+/4] bilaterally. Adenoid pad [___].

DESCRIPTION OF PROCEDURE:
Patient brought to OR, general anesthesia induced without complication.
Positioned supine, [mouth gag] placed and airway secured.
Tonsils removed using [technique, e.g., electrocautery/coblation/cold dissection].
Hemostasis achieved with [___].
[Adenoidectomy performed using ___, hemostasis with ___.]
Sponge and instrument counts correct x2. Patient extubated awake,
tolerated procedure well, transported to PACU in stable condition.

DISPOSITION: [___]`
  },

  {
    id: "septoplasty-op",
    shorthand: ".SEPTOPLASTY",
    title: "Septoplasty — Operative Note",
    noteType: "Op Note",
    subspecialty: "Rhinology",
    tags: ["nasal", "septum", "surgery", "deviated septum"],
    body:
`PREOPERATIVE DIAGNOSIS: Nasal septal deviation with [obstruction / other]
POSTOPERATIVE DIAGNOSIS: Same

PROCEDURE: Septoplasty [+/- turbinate reduction, ___]
SURGEON: [___]
ANESTHESIA: [General / MAC], [ETT / LMA]
EBL: [___] mL
COMPLICATIONS: None

INDICATION: [___]

DESCRIPTION OF PROCEDURE:
Patient positioned supine, [general/local] anesthesia achieved.
Nasal cavity injected with [___] bilaterally.
Left hemitransfixion incision made, mucoperichondrial flaps elevated
bilaterally exposing the deviated septal cartilage/bone.
Deviated segments of [cartilage / bony septum] resected/straightened,
preserving [___] cm dorsal and caudal L-strut.
[Turbinate reduction performed: technique ___.]
Flaps re-approximated, incision closed with [suture].
[Splints / no splints] placed. [Packing / no packing] placed.
Hemostasis confirmed. Patient tolerated procedure well.

DISPOSITION: [___]`
  },

  {
    id: "fess-op",
    shorthand: ".FESS",
    title: "Functional Endoscopic Sinus Surgery — Operative Note",
    noteType: "Op Note",
    subspecialty: "Rhinology",
    tags: ["sinus", "endoscopic", "surgery", "CRS"],
    body:
`PREOPERATIVE DIAGNOSIS: Chronic rhinosinusitis [with/without polyposis], [laterality]
POSTOPERATIVE DIAGNOSIS: Same

PROCEDURE(S):
- [Bilateral/Unilateral] maxillary antrostomy
- Anterior [+/- posterior] ethmoidectomy
- [Frontal sinusotomy / Sphenoidotomy — if performed]
SURGEON: [___]
ANESTHESIA: General, [ETT]
EBL: [___] mL
COMPLICATIONS: None

INDICATION: [___]
PREOP IMAGING: CT sinus reviewed, showing [___]

DESCRIPTION OF PROCEDURE:
Patient positioned supine, general anesthesia induced.
Nasal cavities decongested/injected with [___].
0-degree endoscope introduced. [Describe uncinectomy, antrostomy,
ethmoidectomy, frontal/sphenoid work performed, laterality, and any
image guidance used.]
Hemostasis achieved with [___]. [Packing / no packing] placed.
Sponge and instrument counts correct. Patient tolerated procedure well.

DISPOSITION: [___]`
  },

  {
    id: "thyroid-lobectomy-op",
    shorthand: ".THYROIDLOBE",
    title: "Thyroid Lobectomy — Operative Note",
    noteType: "Op Note",
    subspecialty: "Head & Neck",
    tags: ["thyroid", "neck", "surgery", "endocrine"],
    body:
`PREOPERATIVE DIAGNOSIS: [Thyroid nodule, laterality] — [Bethesda category / indication]
POSTOPERATIVE DIAGNOSIS: Same

PROCEDURE: [Left/Right] thyroid lobectomy [+/- isthmusectomy]
SURGEON: [___]
ANESTHESIA: General, [ETT, nerve monitoring tube if used]
EBL: [___] mL
COMPLICATIONS: None
NERVE MONITORING: [Recurrent laryngeal nerve signal present at start/end: ___]

INDICATION: [___]

DESCRIPTION OF PROCEDURE:
Patient positioned supine with shoulder roll, neck extended.
Transverse cervical incision made at [___], platysma flaps raised.
Strap muscles divided in the midline / retracted.
[Laterality] thyroid lobe mobilized, superior and inferior pedicles
identified and ligated with preservation of the recurrent laryngeal
nerve [confirmed with monitoring] and parathyroid glands
[number identified/preserved/autotransplanted: ___].
Specimen removed and sent for [frozen section / permanent pathology].
Hemostasis confirmed, [drain placed / no drain].
Wound closed in layers. Patient tolerated procedure well.

DISPOSITION: [___]`
  },

  {
    id: "myringotomy-tubes",
    shorthand: ".MYRINGOTOMYTUBES",
    title: "Myringotomy with Tube Placement — Op/Procedure Note",
    noteType: "Procedure Note",
    subspecialty: "Otology",
    tags: ["ear tubes", "PE tubes", "pediatric", "myringotomy"],
    body:
`PREOPERATIVE DIAGNOSIS: [Recurrent AOM / OME / Eustachian tube dysfunction], [laterality]
POSTOPERATIVE DIAGNOSIS: Same

PROCEDURE: Bilateral myringotomy and tympanostomy tube placement
SURGEON: [___]
ANESTHESIA: [General mask / MAC]
EBL: Minimal
COMPLICATIONS: None

FINDINGS: [Effusion present bilaterally: serous/mucoid/purulent, or as noted]

DESCRIPTION OF PROCEDURE:
Patient positioned supine. Operating microscope used to visualize
[right/left] tympanic membrane. Radial myringotomy incision made in
the anteroinferior quadrant. [Effusion suctioned, described as ___.]
Tympanostomy tube placed without difficulty. Repeated on contralateral side.
Patient tolerated procedure well, no immediate complications.

DISPOSITION: [___]
FOLLOW-UP: Recheck in clinic in [interval], ear precautions reviewed with family.`
  },

  {
    id: "tracheostomy-procedure",
    shorthand: ".TRACH",
    title: "Tracheostomy — Procedure Note",
    noteType: "Procedure Note",
    subspecialty: "Head & Neck",
    tags: ["airway", "tracheostomy", "ICU", "surgery"],
    body:
`PREOPERATIVE DIAGNOSIS: [Prolonged mechanical ventilation / upper airway obstruction / ___]
POSTOPERATIVE DIAGNOSIS: Same

PROCEDURE: [Open / Percutaneous] tracheostomy
SURGEON: [___]
ANESTHESIA: General, [existing ETT advanced/withdrawn as needed]
EBL: [___] mL
COMPLICATIONS: None
TUBE PLACED: [type/size], cuff [inflated], secured with [___]

INDICATION: [___]

DESCRIPTION OF PROCEDURE:
Patient positioned supine with shoulder roll, neck extended, prepped
and draped in standard sterile fashion. [Vertical/horizontal] incision
made [___] cm below cricoid. Dissection carried down through
subcutaneous tissue and strap muscles in the midline. Thyroid isthmus
[divided / retracted]. Trachea identified and entered at the
[level, e.g., 2nd-3rd tracheal ring]. Existing ETT withdrawn under
direct visualization, tracheostomy tube inserted, position confirmed
by [end-tidal CO2 / bronchoscopy / bilateral breath sounds].
Tube secured with [sutures / ties]. Hemostasis confirmed.
Patient tolerated procedure well.

DISPOSITION: [___]`
  },

  {
    id: "epistaxis-urgent",
    shorthand: ".EPISTAXISED",
    title: "Epistaxis — Clinic / Urgent Visit Note",
    noteType: "Clinic Note",
    subspecialty: "Rhinology",
    tags: ["epistaxis", "nosebleed", "urgent", "bleeding"],
    body:
`CC: Epistaxis

HPI: [Age]-year-old [M/F] presenting with [right/left/bilateral] epistaxis,
onset [___], duration/volume [___], anticoagulant/antiplatelet use [___],
prior episodes [___], trauma history [___].

VITALS REVIEWED: [___]

EXAM:
Anterior rhinoscopy: [bleeding site if identified, e.g., Kiesselbach's plexus] [L/R]
[Nasal endoscopy performed: findings ___]

ASSESSMENT: [Anterior / posterior] epistaxis, [etiology if known]

INTERVENTIONS PERFORMED:
[ ] Direct pressure
[ ] Topical vasoconstrictor: [___]
[ ] Cauterization: [silver nitrate / electrocautery], site [___]
[ ] Anterior packing placed: [type ___]
[ ] Posterior packing / balloon device: [___]

PLAN:
1. [___]
2. Precautions reviewed (avoid nose blowing/straining, humidification, etc.)
3. Follow up [interval] for pack removal / recheck`
  },

  {
    id: "post-op-check",
    shorthand: ".POSTOPCHECK",
    title: "Post-Operative Check — Follow-Up Note",
    noteType: "Clinic Note",
    subspecialty: "General",
    tags: ["postop", "follow up", "wound check"],
    body:
`POST-OPERATIVE VISIT

Procedure performed: [___] on [date]
POD #: [___]

INTERVAL HISTORY: Patient reports [pain level, diet tolerance, activity,
any concerning symptoms]. [No / Yes —] fevers, bleeding, drainage, or
other concerns.

EXAM:
Incision/surgical site: [clean, dry, intact / other findings]
[Relevant focused exam, e.g., otoscopy, endoscopy, neck exam]: [___]

ASSESSMENT: [Healing as expected / concern for ___]

PLAN:
1. [___]
2. [Suture/staple/pack removal if applicable]
3. Follow up [interval] or PRN`
  },

  {
    id: "peds-audiology-consult",
    shorthand: ".PEDSAUDIOCONSULT",
    title: "Pediatric Hearing Loss — Consult Note",
    noteType: "Consult",
    subspecialty: "Peds ENT",
    tags: ["pediatric", "hearing loss", "audiology", "consult"],
    body:
`REASON FOR CONSULT: Evaluation of [hearing loss / failed newborn screen / ___]

HPI: [Age] [M/F] referred for [___]. Newborn hearing screen result: [___].
Risk factors for hearing loss: [NICU stay, family history, ototoxic meds,
craniofacial anomaly, in-utero infection — as applicable]: [___]
Speech/language development: [___]
Prior audiologic testing: [___]

PMH/BIRTH HISTORY: [___]
FAMILY HISTORY OF HEARING LOSS: [___]

EXAM:
Otoscopy: [___]
[Tympanometry / OAE / ABR results if available]: [___]

ASSESSMENT: [___]

PLAN:
1. [Audiology referral / repeat testing: type and timing]
2. [Genetics referral if indicated]
3. [Imaging if indicated]
4. Follow up [interval]`
  },

  {
    id: "discharge-instructions-ent",
    shorthand: ".DISCHARGEENT",
    title: "ENT Post-Op Discharge Instructions",
    noteType: "Discharge",
    subspecialty: "General",
    tags: ["discharge", "patient instructions", "postop"],
    body:
`DISCHARGE INSTRUCTIONS — [PROCEDURE NAME]

You had the following procedure today: [___]

WHAT TO EXPECT:
- [Expected symptoms, e.g., pain, drainage, congestion, duration]

ACTIVITY:
- [Restrictions, e.g., avoid heavy lifting/straining for ___]

DIET:
- [___]

WOUND / SITE CARE:
- [___]

MEDICATIONS:
- [Reconcile with current medication list — do not include specific doses
   here; complete at time of discharge per current orders]

CALL YOUR CARE TEAM OR GO TO THE EMERGENCY ROOM IF YOU HAVE:
- [Warning signs specific to this procedure, e.g., uncontrolled bleeding,
   fever, difficulty breathing, worsening pain]

FOLLOW-UP APPOINTMENT:
- [Date/interval and location]

QUESTIONS: Contact [clinic/service] at [___]`
  },

  {
    id: "neck-mass-workup",
    shorthand: ".NECKMASSWORKUP",
    title: "Neck Mass — Consult / Workup Note",
    noteType: "Consult",
    subspecialty: "Head & Neck",
    tags: ["neck mass", "workup", "consult", "oncology"],
    body:
`REASON FOR CONSULT: Evaluation of neck mass

HPI: [Age]-year-old [M/F] with [___]-week history of [right/left/midline]
neck mass. Associated symptoms: [pain, dysphagia, odynophagia, weight loss,
voice change, otalgia — as applicable]: [___]
Tobacco/alcohol use: [___]
Prior head and neck cancer or radiation: [___]

EXAM:
Neck: [location, size, mobility, consistency of mass]: [___]
Oral cavity/oropharynx: [___]
[Flexible laryngoscopy performed]: [___]

IMAGING REVIEWED: [___]
PRIOR BIOPSY/FNA RESULTS: [___]

ASSESSMENT: Neck mass, [laterality], concern for [___]; differential
includes [reactive/inflammatory, congenital, salivary, thyroid, malignant].

PLAN:
1. [Imaging: CT/MRI/US neck with/without contrast]
2. [FNA / core biopsy]
3. [Referral to tumor board if indicated]
4. Follow up [interval] to review results`
  },

  {
    id: "flexible-laryngoscopy",
    shorthand: ".FLEXLARYNGOSCOPY",
    title: "Flexible Laryngoscopy — Procedure Note",
    noteType: "Procedure Note",
    subspecialty: "Laryngology",
    tags: ["laryngoscopy", "voice", "scope", "procedure"],
    body:
`PROCEDURE: Flexible fiberoptic laryngoscopy

INDICATION: [___]

CONSENT: Risks, benefits, and alternatives discussed including but not
limited to discomfort, epistaxis, gagging, and vasovagal response;
patient verbalized understanding and consent obtained.

TECHNIQUE:
Flexible endoscope passed transnasally through the [right/left] naris
after topical [decongestant/anesthetic] applied. Scope advanced to
visualize the nasopharynx, oropharynx, hypopharynx, and larynx.

FINDINGS:
Nasal cavity/nasopharynx: [___]
Base of tongue/oropharynx: [___]
Supraglottis: [___]
Glottis / vocal folds: [mobility, edema, lesions — describe] [___]
Subglottis (as visualized): [___]

IMPRESSION: [___]

PLAN: [___]

Patient tolerated the procedure well without immediate complication.`
  },

  {
    id: "osa-consult",
    shorthand: ".OSACONSULT",
    title: "Obstructive Sleep Apnea — Consult Note",
    noteType: "Consult",
    subspecialty: "Sleep",
    tags: ["sleep apnea", "OSA", "consult", "snoring"],
    body:
`REASON FOR CONSULT: Evaluation for obstructive sleep apnea / surgical candidacy

HPI: [Age]-year-old [M/F] with [___] history of snoring, witnessed apneas,
daytime somnolence (Epworth score if available: [___]). BMI: [___].
Prior sleep study: [date, AHI, results]: [___]
CPAP trial: [tolerance/adherence, reasons for intolerance if applicable]: [___]

PMH relevant to airway: [___]

EXAM:
BMI: [___]  Neck circumference: [___]
Nasal exam: [septum, turbinates]: [___]
Oropharynx: Modified Mallampati [___], tonsil size [___], palate [___]
Flexible laryngoscopy / Muller maneuver (if performed): [___]

ASSESSMENT: [Mild/moderate/severe] OSA by AHI [___], [CPAP tolerant/intolerant]

PLAN:
1. [Repeat/optimize CPAP, alternative PAP interface]
2. [DISE — drug-induced sleep endoscopy — if surgical eval pursued]
3. [Surgical options to discuss: ___]
4. [Weight management / medical optimization referral]
5. Follow up [interval]`
  },

  {
    id: "rhinoplasty-consult",
    shorthand: ".RHINOPLASTYCONSULT",
    title: "Rhinoplasty / Facial Plastics — Consult Note",
    noteType: "Consult",
    subspecialty: "Facial Plastics",
    tags: ["rhinoplasty", "facial plastics", "consult", "cosmetic", "functional"],
    body:
`REASON FOR CONSULT: Evaluation for [functional / cosmetic / combined] rhinoplasty

HPI: [Age]-year-old [M/F] presenting with concerns of [nasal obstruction /
dorsal profile / tip appearance / prior trauma / revision] — [___].
Onset/duration: [___]
Prior nasal surgery: [___]
Nasal breathing function (e.g., NOSE score if used): [___]

EXAM:
External nasal exam: [dorsum, tip, symmetry, skin thickness]: [___]
Internal nasal valve: [___]
Septum: [___]
Turbinates: [___]

PHOTOGRAPHS: [Standard views obtained: frontal, lateral x2, oblique x2, base]

ASSESSMENT: [___]

PLAN:
1. Discussed [functional septoplasty / turbinate reduction / rhinoplasty
   technique] and expected outcomes, risks, and alternatives.
2. [Photography, imaging as indicated]
3. Follow up [interval] to finalize surgical plan / obtain consent`
  }
];
