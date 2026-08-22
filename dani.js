// ============================================
// DANI'S 26th — MAMMA MIA BIRTHDAY INVITE
// ============================================

// ---- CONFIG: edit these when your forms/links are ready ----
const CONFIG = {
  youtubeVideoId: "unfzfe8f9NI", // from the song link Dani provided
  eventDate: "2026-09-19T15:00:00-06:00", // Villahermosa, Tabasco is UTC-6
  rsvpFormUrl: "", // paste your Tally/Google Form link here later
  songFormUrl: "" // paste your song-suggestion form link here later
};

// ---- Smooth reveal on scroll ----
const revealEls = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach((el) => revealObserver.observe(el));

// ---- Countdown ----
function updateCountdown() {
  const target = new Date(CONFIG.eventDate).getTime();
  const now = Date.now();
  const diff = target - now;

  const daysEl = document.getElementById("cd-days");
  const hoursEl = document.getElementById("cd-hours");
  const minsEl = document.getElementById("cd-mins");
  const secsEl = document.getElementById("cd-secs");
  if (!daysEl) return;

  if (diff <= 0) {
    daysEl.textContent = "0";
    hoursEl.textContent = "0";
    minsEl.textContent = "0";
    secsEl.textContent = "0";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  daysEl.textContent = days;
  hoursEl.textContent = hours;
  minsEl.textContent = mins;
  secsEl.textContent = secs;
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ---- Modals ----
document.querySelectorAll("[data-modal]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const modal = document.getElementById(btn.dataset.modal);
    if (modal) modal.classList.add("open");
  });
});
document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.closest(".modal-overlay").classList.remove("open");
  });
});
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("open");
  });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.open").forEach((m) => m.classList.remove("open"));
  }
});

// ---- RSVP / Song form buttons: open external form link if provided ----
document.getElementById("rsvpSubmit")?.addEventListener("click", () => {
  if (CONFIG.rsvpFormUrl) {
    window.open(CONFIG.rsvpFormUrl, "_blank");
  } else {
    alert("Aquí se abrirá el formulario de confirmación de asistencia una vez que Dani agregue el link (ver CONFIG en script.js).");
  }
});

// ---- Scroll nav dots ----
const navSections = ["cover", "hero", "intro", "party", "rsvp", "timeline", "extras", "gallery", "gifts", "closing"];
const scrollNav = document.getElementById("scrollNav");
navSections.forEach((id) => {
  const dot = document.createElement("button");
  dot.dataset.target = id;
  dot.setAttribute("aria-label", "Ir a " + id);
  dot.addEventListener("click", () => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  });
  scrollNav.appendChild(dot);
});
const dotEls = scrollNav.querySelectorAll("button");
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      dotEls.forEach((d) => d.classList.remove("active"));
      const activeDot = scrollNav.querySelector(`[data-target="${entry.target.id}"]`);
      activeDot?.classList.add("active");
    }
  });
}, { threshold: 0.5 });
navSections.forEach((id) => {
  const el = document.getElementById(id);
  if (el) navObserver.observe(el);
});

// ---- Background music via YouTube IFrame API ----
let ytPlayer = null;
let ytReady = false;
let musicStarted = false;
let musicMuted = false;

const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player("ytPlayer", {
    height: "0",
    width: "0",
    videoId: CONFIG.youtubeVideoId,
    playerVars: {
      autoplay: 0,
      controls: 0,
      loop: 1,
      playlist: CONFIG.youtubeVideoId,
      playsinline: 1
    },
    events: {
      onReady: () => { ytReady = true; }
    }
  });
};

const soundToggle = document.getElementById("soundToggle");

function startMusic() {
  if (!ytReady || musicStarted) return;
  try {
    ytPlayer.playVideo();
    musicStarted = true;
    soundToggle.classList.add("visible");
    soundToggle.textContent = "🔊";
  } catch (e) {
    console.warn("No se pudo iniciar la música automáticamente:", e);
  }
}

document.getElementById("openBtn").addEventListener("click", () => {
  document.getElementById("hero").scrollIntoView({ behavior: "smooth" });
  // Give the API a moment if it just loaded
  if (ytReady) {
    startMusic();
  } else {
    const waitForReady = setInterval(() => {
      if (ytReady) {
        startMusic();
        clearInterval(waitForReady);
      }
    }, 200);
    setTimeout(() => clearInterval(waitForReady), 5000);
  }
});

soundToggle.addEventListener("click", () => {
  if (!ytPlayer) return;
  if (musicMuted) {
    ytPlayer.unMute();
    soundToggle.textContent = "🔊";
    musicMuted = false;
  } else {
    ytPlayer.mute();
    soundToggle.textContent = "🔇";
    musicMuted = true;
  }
});

// ---- Gallery: pause auto-scroll on hover/touch ----
const galleryTrack = document.getElementById("galleryTrack");
if (galleryTrack) {
  galleryTrack.addEventListener("mouseenter", () => galleryTrack.style.animationPlayState = "paused");
  galleryTrack.addEventListener("mouseleave", () => galleryTrack.style.animationPlayState = "running");
}
