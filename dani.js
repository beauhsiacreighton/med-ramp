// ============================================
// DANI'S 26th — MAMMA MIA BIRTHDAY INVITE
// ============================================

// ---- CONFIG ----
const CONFIG = {
  eventDate: "2026-09-19T15:00:00-06:00", // Villahermosa, Tabasco is UTC-6
  songFormUrl: "" // paste your song-suggestion form link here later, if you make a separate one
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

// ---- Background music via local mia.mp3 ----
const bgMusic = document.getElementById("bgMusic");
const soundToggle = document.getElementById("soundToggle");
let musicStarted = false;

function startMusic() {
  if (musicStarted) return;
  bgMusic.play()
    .then(() => {
      musicStarted = true;
      soundToggle.classList.add("visible");
      soundToggle.textContent = "🔊";
    })
    .catch((e) => {
      console.warn("No se pudo iniciar la música automáticamente:", e);
    });
}

document.getElementById("openBtn").addEventListener("click", () => {
  document.getElementById("hero").scrollIntoView({ behavior: "smooth" });
  startMusic();
});

soundToggle.addEventListener("click", () => {
  if (bgMusic.muted) {
    bgMusic.muted = false;
    soundToggle.textContent = "🔊";
  } else {
    bgMusic.muted = true;
    soundToggle.textContent = "🔇";
  }
});

// ---- Gallery: pause auto-scroll on hover/touch ----
const galleryTrack = document.getElementById("galleryTrack");
if (galleryTrack) {
  galleryTrack.addEventListener("mouseenter", () => galleryTrack.style.animationPlayState = "paused");
  galleryTrack.addEventListener("mouseleave", () => galleryTrack.style.animationPlayState = "running");
}
