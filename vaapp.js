(function () {
  "use strict";

  /* ------------------------------------------------------------
     Constants
     ------------------------------------------------------------ */
  var STORAGE_KEYS = {
    personal: "ent_dotphrases_personal_v1",
    favorites: "ent_dotphrases_favorites_v1",
    prefs: "ent_dotphrases_prefs_v1"
  };

  var NOTE_TYPE_COLORS = {
    "Op Note": "var(--teal)",
    "Procedure Note": "var(--rust)",
    "Clinic Note": "var(--mustard)",
    "Consult": "var(--plum)",
    "Discharge": "var(--sage)",
    "New Patient": "var(--slate)"
  };
  var NOTE_TYPE_ORDER = ["Clinic Note", "New Patient", "Op Note", "Procedure Note", "Consult", "Discharge"];
  var SUBSPECIALTY_ORDER = ["General", "Otology", "Rhinology", "Laryngology", "Head & Neck",
    "Facial Plastics", "Peds ENT", "Sleep"];

  var BLANK_PATTERN = /\[[^\]\n]*\]/g;
  var OPERATIVE_DATE_PATTERN = /((?:Date of (?:Surgery|Procedure))|(?:DATE OF SURGERY)):\s*\[___\]/gi;
  var LATERALITY_PATTERN = /\bL\/R\b/g;
  var MOBILE_BREAKPOINT = 860;

  /* ------------------------------------------------------------
     Storage helpers (never let storage failures break the app)
     ------------------------------------------------------------ */
  var storageAvailable = true;

  function testStorage() {
    try {
      var k = "__ent_dotphrases_test__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadJSON(key, fallback) {
    if (!storageAvailable) return fallback;
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed;
    } catch (e) {
      console.warn("Failed to load", key, e);
      return fallback;
    }
  }

  function saveJSON(key, value) {
    if (!storageAvailable) return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn("Failed to save", key, e);
      showStorageBanner();
      return false;
    }
  }

  function showStorageBanner() {
    var banner = document.getElementById("storage-banner");
    if (banner) banner.hidden = false;
  }

  function loadPrefs() {
    var prefs = loadJSON(STORAGE_KEYS.prefs, {});
    if (prefs && typeof prefs.tabJumpEnabled === "boolean") {
      state.tabJumpEnabled = prefs.tabJumpEnabled;
    } else {
      state.tabJumpEnabled = true;
    }
    state.helpBannerDismissed = !!(prefs && prefs.helpBannerDismissed);
  }

  function savePrefs() {
    saveJSON(STORAGE_KEYS.prefs, {
      tabJumpEnabled: state.tabJumpEnabled,
      helpBannerDismissed: state.helpBannerDismissed
    });
  }

  function isMobileLayout() {
    return window.matchMedia("(max-width: " + MOBILE_BREAKPOINT + "px)").matches ||
      (window.matchMedia("(pointer: coarse)").matches && window.innerWidth <= 1024);
  }

  function formatTodayDate() {
    var now = new Date();
    var month = String(now.getMonth() + 1);
    var day = String(now.getDate());
    var year = now.getFullYear();
    return month + "/" + day + "/" + year;
  }

  function injectOperativeDates(body) {
    var today = formatTodayDate();
    return (body || "").replace(OPERATIVE_DATE_PATTERN, function (match, label) {
      return label + ": " + today;
    });
  }

  // Display-time normalization: "L/R" -> "Left/Right" (also catches "L/R/bilateral").
  // Applied at render time rather than rewriting the template data, so it's
  // consistent across built-in AND personal templates with zero risk of a
  // manual find/replace mistake in the data file.
  function normalizeLaterality(body) {
    return (body || "").replace(LATERALITY_PATTERN, "Left/Right");
  }

  function prepareTemplateBody(body) {
    return normalizeLaterality(injectOperativeDates(body || ""));
  }

  function parseBlankContent(inner) {
    var trimmed = (inner || "").trim();
    if (!trimmed) return { type: "fill", options: [] };

    if (trimmed.indexOf("//") !== -1) {
      return {
        type: "multi",
        options: trimmed.split(/\s*\/\/\s*/).map(function (s) { return s.trim(); }).filter(Boolean)
      };
    }

    if (trimmed.indexOf("/") !== -1 && trimmed.indexOf("___") === -1 && !/^[_\s.]+$/.test(trimmed)) {
      if (/^\+\/-/.test(trimmed)) return { type: "fill", options: [] };
      var parts = trimmed.split(/\s*\/\s*/).map(function (s) { return s.trim(); }).filter(Boolean);
      if (parts.length >= 2 && parts.every(function (p) { return p.length > 0 && p.length < 72; })) {
        return { type: "single", options: parts };
      }
    }

    return { type: "fill", options: [] };
  }

  // A "fill" blank counts as just a placeholder marker (e.g. "___" or "...")
  // if it has no real words in it. Blanks with real words (e.g. "Age") get
  // the Enter-to-strip-brackets treatment; pure placeholders don't.
  function isPlaceholderOnly(inner) {
    return /^[_.\s]*$/.test(inner || "");
  }

  function findBlankAt(text, index) {
    BLANK_PATTERN.lastIndex = 0;
    var match;
    while ((match = BLANK_PATTERN.exec(text)) !== null) {
      var start = match.index;
      var end = start + match[0].length;
      if (index >= start && index <= end) {
        return {
          start: start,
          end: end,
          text: match[0],
          inner: match[0].slice(1, -1),
          parsed: parseBlankContent(match[0].slice(1, -1))
        };
      }
    }
    return null;
  }

  function getOptionRanges(fullMatch, options, delimiter) {
    var ranges = [];
    var searchFrom = 1;
    var delim = delimiter === "//" ? "//" : "/";
    for (var i = 0; i < options.length; i++) {
      var idx = fullMatch.indexOf(options[i], searchFrom);
      if (idx === -1) continue;
      ranges.push({ start: idx, end: idx + options[i].length, text: options[i] });
      searchFrom = idx + options[i].length;
      if (i < options.length - 1) {
        var delimIdx = fullMatch.indexOf(delim, searchFrom);
        if (delimIdx !== -1) searchFrom = delimIdx + delim.length;
      }
    }
    return ranges;
  }

  function optionIndexAtPosition(blank, absolutePos) {
    var delimiter = blank.parsed.type === "multi" ? "//" : "/";
    var ranges = getOptionRanges(blank.text, blank.parsed.options, delimiter);
    for (var i = 0; i < ranges.length; i++) {
      var absStart = blank.start + ranges[i].start;
      var absEnd = blank.start + ranges[i].end;
      if (absolutePos >= absStart && absolutePos <= absEnd) return i;
    }
    return 0;
  }

  function clearActiveBlank() {
    state.activeBlank = null;
    updateChoiceBar(null);
  }

  function setActiveBlank(blank, optionIndex, selectedMap) {
    if (!blank || blank.parsed.type === "fill") {
      clearActiveBlank();
      return;
    }
    // NOTE: multi-choice blanks start with NOTHING checked. The user picks
    // explicitly; we never guess for them.
    var selected = selectedMap || {};
    state.activeBlank = {
      start: blank.start,
      end: blank.end,
      text: blank.text,
      parsed: blank.parsed,
      optionIndex: typeof optionIndex === "number" ? optionIndex : 0,
      selected: selected
    };
    updateChoiceBar(state.activeBlank);
  }

  function detectActiveBlankAtCursor(editor) {
    var cursor = editor.selectionStart || 0;
    var blank = findBlankAt(editor.value, cursor);

    if (blank && blank.parsed.type !== "fill") {
      if (state.activeBlank && state.activeBlank.start === blank.start && state.activeBlank.end === blank.end) {
        // Same blank that's already active — this call is almost certainly
        // our own highlightActiveOption() moving the selection, which fires
        // a native 'select' event. Don't re-detect, or every Tab/chip click
        // gets immediately reset back to the first option.
        return;
      }
      setActiveBlank(blank, optionIndexAtPosition(blank, cursor));
      highlightActiveOption(editor);
      return;
    }

    if (blank && blank.parsed.type === "fill") {
      // Clicking into ANY fill blank (worded or empty) selects its whole
      // contents so you can just start typing over it — no more double- or
      // triple-clicking to grab it.
      clearActiveBlank();
      var innerStart = blank.start + 1;
      var innerEnd = blank.end - 1;
      if (innerEnd > innerStart &&
          !(editor.selectionStart === innerStart && editor.selectionEnd === innerEnd)) {
        editor.setSelectionRange(innerStart, innerEnd);
        scrollBlankIntoView(editor, { start: innerStart, end: innerEnd });
      }
      return;
    }

    clearActiveBlank();
  }

  function highlightActiveOption(editor) {
    var active = state.activeBlank;
    if (!active || active.parsed.type === "fill") return;

    var blank = findBlankAt(editor.value, active.start + 1);
    if (!blank) {
      clearActiveBlank();
      return;
    }

    var delimiter = active.parsed.type === "multi" ? "//" : "/";
    var ranges = getOptionRanges(blank.text, active.parsed.options, delimiter);
    var idx = active.optionIndex;
    if (!ranges[idx]) idx = 0;

    var selStart = blank.start + ranges[idx].start;
    var selEnd = blank.start + ranges[idx].end;

    editor.focus({ preventScroll: true });
    editor.setSelectionRange(selStart, selEnd);
    scrollBlankIntoView(editor, { start: selStart, end: selEnd });
    updateChoiceBar(active);
  }

  function cycleActiveOption(editor, direction) {
    var active = state.activeBlank;
    if (!active || active.parsed.type === "fill") return false;

    var count = active.parsed.options.length;
    if (!count) return false;

    active.optionIndex = (active.optionIndex + direction + count) % count;
    highlightActiveOption(editor);
    return true;
  }

  function toggleActiveMultiOption(editor) {
    var active = state.activeBlank;
    if (!active || active.parsed.type !== "multi") return false;

    var key = String(active.optionIndex);
    if (active.selected[key]) delete active.selected[key];
    else active.selected[key] = true;

    highlightActiveOption(editor);
    return true;
  }

  // Replaces editor.value in [start, end) with `replacement` using the
  // browser's native editing command when available, which keeps Ctrl+Z
  // working. Directly assigning editor.value wipes the undo stack in most
  // browsers, so we avoid that except as a last-resort fallback.
  function replaceEditorRange(editor, start, end, replacement) {
    editor.focus({ preventScroll: true });
    editor.setSelectionRange(start, end);

    var handledNatively = false;
    try {
      if (document.execCommand) {
        handledNatively = document.execCommand("insertText", false, replacement);
      }
    } catch (e) {
      handledNatively = false;
    }

    if (!handledNatively) {
      var before = editor.value.slice(0, start);
      var after = editor.value.slice(end);
      editor.value = before + replacement + after;
      var evt;
      try {
        evt = new Event("input", { bubbles: true });
      } catch (e2) {
        evt = document.createEvent("Event");
        evt.initEvent("input", true, true);
      }
      editor.dispatchEvent(evt);
      editor.setSelectionRange(start + replacement.length, start + replacement.length);
    }

    return start + replacement.length;
  }

  function confirmActiveBlank(editor) {
    var active = state.activeBlank;
    if (!active || active.parsed.type === "fill") return false;

    var blank = findBlankAt(editor.value, active.start + 1);
    if (!blank) {
      clearActiveBlank();
      return false;
    }

    var replacement = "";
    if (active.parsed.type === "single") {
      replacement = active.parsed.options[active.optionIndex] || active.parsed.options[0] || "";
    } else {
      var selected = [];
      active.parsed.options.forEach(function (opt, i) {
        if (active.selected[String(i)]) selected.push(opt);
      });
      if (!selected.length) {
        // Nothing checked — don't guess. Ask instead of silently inserting
        // whatever option happens to be highlighted.
        setStatus("Tap at least one option, or press Esc to skip this blank.", true);
        return false;
      }
      replacement = selected.join(", ");
    }

    var cursor = replaceEditorRange(editor, blank.start, blank.end, replacement);
    editor.setSelectionRange(cursor, cursor);
    clearActiveBlank();
    setStatus("Selection confirmed.", false);
    return true;
  }

  // Enter on a worded fill blank (e.g. "[Age]") keeps the text and drops
  // the brackets, then advances like a normal confirm.
  function resolveWordedFillBlank(editor, blank) {
    var replacement = (blank.inner || "").trim();
    var cursor = replaceEditorRange(editor, blank.start, blank.end, replacement);
    editor.setSelectionRange(cursor, cursor);
    clearActiveBlank();
    setStatus("Kept the text, removed the brackets.", false);
    if (state.tabJumpEnabled) jumpToNextBlank(editor);
  }

  function updateChoiceBar(active) {
    var bar = document.getElementById("choice-bar");
    if (!bar) return;

    if (!active || active.parsed.type === "fill") {
      bar.classList.remove("is-visible");
      return;
    }

    var isMulti = active.parsed.type === "multi";
    var hint = isMulti
      ? "Tap options to toggle · Confirm when done"
      : "Tap an option · Confirm when done";

    var chips = active.parsed.options.map(function (opt, i) {
      var selected = isMulti ? !!active.selected[String(i)] : i === active.optionIndex;
      var classes = "choice-chip" + (selected ? " is-selected" : "");
      return '<button type="button" class="' + classes + '" data-choice-index="' + i + '">' +
        escapeHtml(opt) + "</button>";
    }).join("");

    bar.innerHTML =
      '<div class="choice-bar-label">' + escapeHtml(hint) + "</div>" +
      '<div class="choice-chip-row">' + chips + "</div>" +
      '<button type="button" class="btn btn-small btn-primary" id="choice-confirm-btn">Confirm selection</button>';
    bar.classList.add("is-visible");

    bar.querySelectorAll("[data-choice-index]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var editor = document.getElementById("body-editor");
        if (!editor || !state.activeBlank) return;
        var index = parseInt(btn.getAttribute("data-choice-index"), 10);
        if (state.activeBlank.parsed.type === "multi") {
          state.activeBlank.optionIndex = index;
          toggleActiveMultiOption(editor);
        } else {
          state.activeBlank.optionIndex = index;
          highlightActiveOption(editor);
          if (isMobileLayout()) {
            confirmActiveBlank(editor);
            if (state.tabJumpEnabled) jumpToNextBlank(editor);
          }
        }
      });
    });

    var confirmBtn = document.getElementById("choice-confirm-btn");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        var editor = document.getElementById("body-editor");
        if (!editor) return;
        confirmActiveBlank(editor);
        if (state.tabJumpEnabled) jumpToNextBlank(editor);
      });
    }
  }

  function updateEditorHelp() {
    var wrap = document.getElementById("editor-help-wrap");
    var help = document.getElementById("editor-help");
    var showBtn = document.getElementById("editor-help-show");
    if (!help) return;

    if (state.helpBannerDismissed) {
      if (wrap) wrap.hidden = true;
      if (showBtn) showBtn.hidden = false;
      return;
    }

    if (wrap) wrap.hidden = false;
    if (showBtn) showBtn.hidden = true;

    if (isMobileLayout()) {
      help.innerHTML =
        '<strong>Mobile tips:</strong> Tap a blank to select it. Use <span class="kbd">Next blank</span> / <span class="kbd">Previous blank</span> ' +
        'at the top of the note to jump between blanks. When a choice blank is active, tap options then <span class="kbd">Confirm</span>.';
    } else {
      help.innerHTML =
        '<strong>Desktop shortcuts:</strong> Click a blank to select it · <span class="kbd">Tab</span> / <span class="kbd">Shift+Tab</span> move between blanks' +
        (state.tabJumpEnabled ? "" : " (enable the checkbox below)") +
        ' · In choice blanks, <span class="kbd">Tab</span> or <span class="kbd">←</span>/<span class="kbd">→</span> cycles options · ' +
        '<span class="kbd">Enter</span> confirms (or keeps the text on a worded blank) · <span class="kbd">Esc</span> skips a blank · ' +
        'Multi-choice blanks use <span class="kbd">Space</span> to toggle options';
    }
  }

  function wireEditorHelpBanner() {
    var dismissBtn = document.getElementById("editor-help-dismiss");
    var showBtn = document.getElementById("editor-help-show");

    if (dismissBtn) {
      dismissBtn.addEventListener("click", function () {
        state.helpBannerDismissed = true;
        savePrefs();
        updateEditorHelp();
      });
    }

    if (showBtn) {
      showBtn.addEventListener("click", function () {
        state.helpBannerDismissed = false;
        savePrefs();
        updateEditorHelp();
      });
    }
  }

  function countRemainingBlanks(text) {
    BLANK_PATTERN.lastIndex = 0;
    var count = 0;
    while (BLANK_PATTERN.exec(text)) count++;
    return count;
  }

  /* ------------------------------------------------------------
     State
     ------------------------------------------------------------ */
  var state = {
    personalTemplates: [],
    favorites: [],
    all: [],
    fuse: null,
    query: "",
    noteTypeFilter: "All",
    subspecialtyFilter: "",
    favoritesOnly: false,
    selectedId: null,
    tabJumpEnabled: true,
    helpBannerDismissed: false,
    activeBlank: null,
    pageScrolledForSelection: false
  };

  function uid() {
    return "custom-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function slugTag(shorthand) {
    return (shorthand || "").replace(/^\./, "").trim();
  }

  /* ------------------------------------------------------------
     Data assembly
     ------------------------------------------------------------ */
  function parseTemplatesText(text) {
    var trimmed = (text || "").trim();
    if (!trimmed) return [];
    if (trimmed.charAt(0) === "[") {
      var parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    }
    var eq = trimmed.indexOf("=");
    if (eq !== -1) {
      var rhs = trimmed.slice(eq + 1).trim().replace(/;\s*$/, "");
      var parsedRhs = JSON.parse(rhs);
      return Array.isArray(parsedRhs) ? parsedRhs : [];
    }
    return [];
  }

  function ensureBuiltInTemplates(done) {
    var existing = window.BUILT_IN_TEMPLATES;
    if (Array.isArray(existing) && existing.length > 0) {
      done();
      return;
    }
    if (typeof fetch !== "function") {
      window.BUILT_IN_TEMPLATES = [];
      done();
      return;
    }
    fetch("vatemplates.js?v=3", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("fetch failed");
        return res.text();
      })
      .then(function (text) {
        window.BUILT_IN_TEMPLATES = parseTemplatesText(text);
        done();
      })
      .catch(function (err) {
        console.warn("Could not load built-in templates", err);
        window.BUILT_IN_TEMPLATES = [];
        done();
      });
  }

  function rebuildAll() {
    var builtIn = (window.BUILT_IN_TEMPLATES || []).map(function (t) {
      return Object.assign({}, t, { builtIn: true });
    });
    var personal = state.personalTemplates.map(function (t) {
      return Object.assign({}, t, { builtIn: false });
    });
    state.all = builtIn.concat(personal);
    buildFuseIndex();
    populateSubspecialtyOptions();
  }

  function buildFuseIndex() {
    if (typeof Fuse === "undefined") {
      state.fuse = null;
      return;
    }
    state.fuse = new Fuse(state.all, {
      includeScore: false,
      threshold: 0.34,
      ignoreLocation: true,
      keys: [
        { name: "shorthand", weight: 0.4 },
        { name: "title", weight: 0.3 },
        { name: "tags", weight: 0.2 },
        { name: "body", weight: 0.1 }
      ]
    });
  }

  function findTemplate(id) {
    for (var i = 0; i < state.all.length; i++) {
      if (state.all[i].id === id) return state.all[i];
    }
    return null;
  }

  /* ------------------------------------------------------------
     Filtering + search
     ------------------------------------------------------------ */
  function getFilteredResults() {
    var pool;
    var q = state.query.trim();

    if (q && state.fuse) {
      pool = state.fuse.search(q).map(function (r) { return r.item; });
    } else if (q && !state.fuse) {
      var lower = q.toLowerCase();
      pool = state.all.filter(function (t) {
        return (t.shorthand + " " + t.title + " " + (t.tags || []).join(" ") + " " + t.body)
          .toLowerCase().indexOf(lower) !== -1;
      });
    } else {
      pool = state.all.slice();
    }

    pool = pool.filter(function (t) {
      if (state.noteTypeFilter !== "All" && t.noteType !== state.noteTypeFilter) return false;
      if (state.subspecialtyFilter && t.subspecialty !== state.subspecialtyFilter) return false;
      if (state.favoritesOnly && state.favorites.indexOf(t.id) === -1) return false;
      return true;
    });

    if (!q) {
      pool.sort(function (a, b) {
        var af = state.favorites.indexOf(a.id) !== -1;
        var bf = state.favorites.indexOf(b.id) !== -1;
        if (af !== bf) return af ? -1 : 1;
        return a.shorthand.localeCompare(b.shorthand);
      });
    }

    return pool;
  }

  /* ------------------------------------------------------------
     Rendering: filter controls
     ------------------------------------------------------------ */
  function renderNoteTypeTabs() {
    var container = document.getElementById("note-type-tabs");
    var typesPresent = {};
    state.all.forEach(function (t) { typesPresent[t.noteType] = true; });
    var ordered = NOTE_TYPE_ORDER.filter(function (t) { return typesPresent[t]; });
    Object.keys(typesPresent).forEach(function (t) {
      if (ordered.indexOf(t) === -1) ordered.push(t);
    });

    var html = ["All"].concat(ordered).map(function (type) {
      var color = NOTE_TYPE_COLORS[type] || "var(--teal)";
      var pressed = state.noteTypeFilter === type;
      return '<button type="button" class="chart-tab" style="--tab-color:' + color + '" ' +
        'data-note-type="' + escapeHtml(type) + '" aria-pressed="' + pressed + '">' +
        escapeHtml(type) + "</button>";
    }).join("");
    container.innerHTML = html;

    container.querySelectorAll(".chart-tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.noteTypeFilter = btn.getAttribute("data-note-type");
        renderNoteTypeTabs();
        renderList();
      });
    });
  }

  function populateSubspecialtyOptions() {
    var select = document.getElementById("subspecialty-select");
    var current = state.subspecialtyFilter;
    var present = {};
    state.all.forEach(function (t) { present[t.subspecialty] = true; });
    var ordered = SUBSPECIALTY_ORDER.filter(function (s) { return present[s]; });
    Object.keys(present).forEach(function (s) {
      if (ordered.indexOf(s) === -1) ordered.push(s);
    });

    var html = '<option value="">All</option>' + ordered.map(function (s) {
      return '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + "</option>";
    }).join("");
    select.innerHTML = html;
    select.value = current;
  }

  /* ------------------------------------------------------------
     Rendering: list
     ------------------------------------------------------------ */
  function renderList() {
    var results = getFilteredResults();
    var panel = document.getElementById("list-panel");
    var countEl = document.getElementById("result-count");
    countEl.textContent = results.length + (results.length === 1 ? " result" : " results");

    if (results.length === 0) {
      panel.innerHTML = '<div class="empty-state">No templates match. Try a different search or ' +
        '<button type="button" class="btn btn-small" id="empty-clear">clear filters</button>.</div>';
      var clearBtn = document.getElementById("empty-clear");
      if (clearBtn) clearBtn.addEventListener("click", clearFilters);
      return;
    }

    panel.innerHTML = results.map(function (t) {
      var color = NOTE_TYPE_COLORS[t.noteType] || "var(--teal)";
      var isFav = state.favorites.indexOf(t.id) !== -1;
      var isSelected = t.id === state.selectedId;
      return (
        '<button type="button" class="template-item" data-id="' + t.id + '" ' +
        'aria-current="' + isSelected + '">' +
        '<span class="tab-flag" style="--flag-color:' + color + '"></span>' +
        '<span class="template-item-body">' +
        '<span class="shorthand">' + escapeHtml(t.shorthand) +
        (t.builtIn ? "" : ' <span class="badge-outline badge" style="font-size:9px;padding:1px 5px;">custom</span>') +
        "</span>" +
        '<span class="title-line">' + escapeHtml(t.title) + "</span>" +
        "</span>" +
        '<span class="star-btn" role="button" tabindex="0" aria-pressed="' + isFav + '" ' +
        'aria-label="Toggle favorite for ' + escapeHtml(t.shorthand) + '" data-star-id="' + t.id + '">' +
        (isFav ? "★" : "☆") +
        "</span>" +
        "</button>"
      );
    }).join("");

    panel.querySelectorAll(".template-item").forEach(function (item) {
      item.addEventListener("click", function (e) {
        if (e.target.closest("[data-star-id]")) return;
        selectTemplate(item.getAttribute("data-id"));
      });
    });

    panel.querySelectorAll("[data-star-id]").forEach(function (star) {
      star.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleFavorite(star.getAttribute("data-star-id"));
      });
      star.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleFavorite(star.getAttribute("data-star-id"));
        }
      });
    });
  }

  function clearFilters() {
    state.query = "";
    state.noteTypeFilter = "All";
    state.subspecialtyFilter = "";
    state.favoritesOnly = false;
    document.getElementById("search-input").value = "";
    document.getElementById("subspecialty-select").value = "";
    document.getElementById("favorites-only").checked = false;
    renderNoteTypeTabs();
    renderList();
  }

  /* ------------------------------------------------------------
     Rendering: detail panel
     ------------------------------------------------------------ */
  function isElementReasonablyVisible(el) {
    if (!el) return true;
    var rect = el.getBoundingClientRect();
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.top >= 0 && rect.top < viewportHeight * 0.6;
  }

  function scrollDetailIntoView() {
    var target = document.getElementById("editor-help-wrap") || document.getElementById("detail-panel");
    if (target && typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function selectTemplate(id) {
    state.selectedId = id;
    state.pageScrolledForSelection = false;
    renderList();
    renderDetail();
    scrollDetailIntoView();
    state.pageScrolledForSelection = true;
  }

  function toggleFavorite(id) {
    var idx = state.favorites.indexOf(id);
    if (idx === -1) state.favorites.push(id);
    else state.favorites.splice(idx, 1);
    saveJSON(STORAGE_KEYS.favorites, state.favorites);
    renderList();
    if (state.selectedId === id) renderDetail();
  }

  function renderDetail() {
    var panel = document.getElementById("detail-panel");
    var t = state.selectedId ? findTemplate(state.selectedId) : null;

    if (!t) {
      panel.innerHTML = '<div class="detail-empty">Select a template on the left, or search above — try "sept" or "discharge".</div>';
      return;
    }

    var color = NOTE_TYPE_COLORS[t.noteType] || "var(--teal)";
    var isFav = state.favorites.indexOf(t.id) !== -1;

    panel.innerHTML =
      '<div class="detail-header">' +
        '<div>' +
          "<h2>" + escapeHtml(t.shorthand) + "</h2>" +
          "<div>" + escapeHtml(t.title) + "</div>" +
          '<div class="detail-meta">' +
            '<span class="badge" style="--badge-color:' + color + '">' + escapeHtml(t.noteType) + "</span>" +
            '<span class="badge badge-outline">' + escapeHtml(t.subspecialty) + "</span>" +
            (t.builtIn ? '<span class="badge-outline badge">built-in</span>' : '<span class="badge-outline badge">custom</span>') +
          "</div>" +
        "</div>" +
        '<div class="detail-actions">' +
          '<button type="button" class="btn btn-small" id="btn-fav" aria-pressed="' + isFav + '">' +
            (isFav ? "★ Favorited" : "☆ Favorite") +
          "</button>" +
          '<button type="button" class="btn btn-small" id="btn-edit">' + (t.builtIn ? "Duplicate & edit" : "Edit") + "</button>" +
          (t.builtIn ? "" : '<button type="button" class="btn btn-small btn-danger" id="btn-delete">Delete</button>') +
        "</div>" +
      "</div>" +
      '<hr class="rule">' +
      '<div class="editor-help-wrap" id="editor-help-wrap">' +
        '<p class="editor-help" id="editor-help" aria-live="polite"></p>' +
        '<button type="button" class="editor-help-dismiss" id="editor-help-dismiss" aria-label="Dismiss keyboard tips">×</button>' +
      '</div>' +
      '<button type="button" class="btn btn-small btn-ghost editor-help-show" id="editor-help-show" hidden>Show keyboard tips</button>' +
      '<div class="mobile-editor-bar" id="mobile-editor-bar" hidden>' +
        '<div class="mobile-editor-actions">' +
          '<button type="button" class="btn" id="btn-mobile-prev">← Previous</button>' +
          '<button type="button" class="btn btn-primary" id="btn-mobile-next">Next blank →</button>' +
        '</div>' +
      "</div>" +
      '<div class="editor-wrap" id="editor-wrap">' +
        '<textarea class="body-editor" id="body-editor" spellcheck="false" aria-label="Template text, editable before copying">' +
          escapeHtml(prepareTemplateBody(t.body)) +
        "</textarea>" +
        '<div class="choice-bar" id="choice-bar" aria-live="polite"></div>' +
      "</div>" +
      '<div class="editor-toolbar">' +
        '<div class="editor-toolbar-left">' +
          '<button type="button" class="btn btn-primary" id="btn-copy">Copy to clipboard</button>' +
          '<button type="button" class="btn editor-toolbar-blank-nav" id="btn-prev-blank">Previous blank</button>' +
          '<button type="button" class="btn editor-toolbar-blank-nav" id="btn-next-blank">Next blank</button>' +
          '<button type="button" class="btn btn-ghost" id="btn-reset">Reset text</button>' +
          '<label class="checkbox-field editor-tab-toggle">' +
            '<input type="checkbox" id="tab-jump-toggle" ' + (state.tabJumpEnabled ? "checked" : "") + '>' +
            "Tab moves to next blank" +
          "</label>" +
        "</div>" +
        '<span class="status-msg" id="status-msg" aria-live="polite"></span>' +
      "</div>";

    var editor = document.getElementById("body-editor");

    document.getElementById("btn-copy").addEventListener("click", function () {
      copyToClipboard(editor.value, true);
    });
    document.getElementById("btn-next-blank").addEventListener("click", function () {
      jumpToNextBlank(editor);
    });
    document.getElementById("btn-prev-blank").addEventListener("click", function () {
      jumpToPreviousBlank(editor);
    });
    document.getElementById("btn-reset").addEventListener("click", function () {
      replaceEditorRange(editor, 0, editor.value.length, prepareTemplateBody(t.body));
      clearActiveBlank();
      setStatus("Text reset to saved version.", false);
      editor.focus();
    });
    document.getElementById("btn-fav").addEventListener("click", function () {
      toggleFavorite(t.id);
    });
    document.getElementById("btn-edit").addEventListener("click", function () {
      openEditModal(t);
    });
    var deleteBtn = document.getElementById("btn-delete");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", function () {
        deleteTemplate(t.id);
      });
    }

    var tabToggle = document.getElementById("tab-jump-toggle");
    tabToggle.addEventListener("change", function () {
      state.tabJumpEnabled = tabToggle.checked;
      savePrefs();
      updateEditorHelp();
    });

    updateEditorHelp();
    updateMobileEditorBar();
    wireEditorHelpBanner();

    editor.addEventListener("keydown", function (e) {
      handleEditorKeydown(editor, e);
    });

    editor.addEventListener("click", function () {
      detectActiveBlankAtCursor(editor);
      if (!isElementReasonablyVisible(document.getElementById("editor-help-wrap"))) {
        scrollDetailIntoView();
      }
    });

    editor.addEventListener("select", function () {
      detectActiveBlankAtCursor(editor);
    });

    var mobileNext = document.getElementById("btn-mobile-next");
    if (mobileNext) {
      mobileNext.addEventListener("click", function () {
        jumpToNextBlank(editor);
      });
    }

    var mobilePrev = document.getElementById("btn-mobile-prev");
    if (mobilePrev) {
      mobilePrev.addEventListener("click", function () {
        jumpToPreviousBlank(editor);
      });
    }
  }

  function updateMobileEditorBar() {
    var bar = document.getElementById("mobile-editor-bar");
    if (!bar) return;
    bar.hidden = !isMobileLayout();
    updateEditorHelp();
  }

  function handleEditorKeydown(editor, e) {
    var cursor = editor.selectionStart || 0;
    var blank = findBlankAt(editor.value, cursor);

    // Enter on a worded fill blank ("[Age]") keeps the words, drops the
    // brackets, and advances. Pure placeholder blanks ("[___]") are left
    // alone so Enter still behaves normally there.
    if (e.key === "Enter" && blank && blank.parsed.type === "fill" && !isPlaceholderOnly(blank.inner)) {
      e.preventDefault();
      resolveWordedFillBlank(editor, blank);
      return;
    }

    if (blank && blank.parsed.type !== "fill") {
      if (!state.activeBlank || state.activeBlank.start !== blank.start) {
        setActiveBlank(blank, 0);
      }
    }

    // Escape skips the current blank without choosing anything.
    if (e.key === "Escape" && state.activeBlank) {
      e.preventDefault();
      clearActiveBlank();
      setStatus("Skipped.", false);
      if (state.tabJumpEnabled) jumpToNextBlank(editor);
      return;
    }

    if (e.key === "Enter" && state.activeBlank && state.activeBlank.parsed.type !== "fill") {
      e.preventDefault();
      confirmActiveBlank(editor);
      if (state.tabJumpEnabled) jumpToNextBlank(editor);
      return;
    }

    if (e.key === " " && state.activeBlank && state.activeBlank.parsed.type === "multi") {
      e.preventDefault();
      toggleActiveMultiOption(editor);
      return;
    }

    if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && state.activeBlank &&
        state.activeBlank.parsed.type !== "fill") {
      e.preventDefault();
      cycleActiveOption(editor, e.key === "ArrowRight" ? 1 : -1);
      return;
    }

    if (e.key === "Tab") {
      if (state.activeBlank && state.activeBlank.parsed.type !== "fill") {
        e.preventDefault();
        cycleActiveOption(editor, e.shiftKey ? -1 : 1);
        return;
      }

      if (state.tabJumpEnabled) {
        e.preventDefault();
        if (e.shiftKey) jumpToPreviousBlank(editor);
        else jumpToNextBlank(editor);
        return;
      }
    }
  }

  function setStatus(msg, isWarn) {
    var el = document.getElementById("status-msg");
    if (!el) return;
    el.textContent = msg;
    el.setAttribute("data-tone", isWarn ? "warn" : "ok");
    window.clearTimeout(setStatus._t);
    setStatus._t = window.setTimeout(function () {
      if (el) el.textContent = "";
    }, 3200);
  }

  /* ------------------------------------------------------------
     Blank navigation
     ------------------------------------------------------------ */
  function collectBlanks(text) {
    BLANK_PATTERN.lastIndex = 0;
    var blanks = [];
    var match;
    while ((match = BLANK_PATTERN.exec(text)) !== null) {
      blanks.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        inner: match[0].slice(1, -1),
        parsed: parseBlankContent(match[0].slice(1, -1))
      });
    }
    return blanks;
  }

  function focusBlank(textarea, blank) {
    textarea.focus({ preventScroll: true });
    if (blank.parsed.type === "fill") {
      clearActiveBlank();
      textarea.setSelectionRange(blank.start, blank.end);
      scrollBlankIntoView(textarea, { start: blank.start, end: blank.end });
    } else {
      setActiveBlank(blank, 0);
      highlightActiveOption(textarea);
    }
  }

  function jumpToBlank(textarea, direction) {
    var text = textarea.value;
    var cursor = textarea.selectionStart || 0;
    var blanks = collectBlanks(text);

    if (!blanks.length) {
      clearActiveBlank();
      setStatus("No [blanks] left in this template.", true);
      return;
    }

    var target = null;
    var wrapped = false;

    if (direction > 0) {
      for (var i = 0; i < blanks.length; i++) {
        if (blanks[i].start > cursor ||
            (blanks[i].start === cursor && cursor === textarea.selectionEnd)) {
          target = blanks[i];
          break;
        }
      }
      if (!target) {
        target = blanks[0];
        wrapped = true;
      }
    } else {
      for (var j = blanks.length - 1; j >= 0; j--) {
        if (blanks[j].start < cursor) {
          target = blanks[j];
          break;
        }
      }
      if (!target) {
        target = blanks[blanks.length - 1];
        wrapped = true;
      }
    }

    focusBlank(textarea, target);
    if (wrapped) {
      setStatus(direction > 0 ? "Back to the first blank." : "Back to the last blank.", false);
    }
  }

  function jumpToNextBlank(textarea) {
    jumpToBlank(textarea, 1);
  }

  function jumpToPreviousBlank(textarea) {
    jumpToBlank(textarea, -1);
  }

  /* ------------------------------------------------------------
     Smooth, centered scrolling to keep the active blank visible
     ------------------------------------------------------------ */
  var mirrorEl = null;
  var MIRROR_PROPS = [
    "boxSizing", "width", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
    "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
    "fontFamily", "fontSize", "fontWeight", "fontStyle", "letterSpacing",
    "lineHeight", "textTransform", "wordSpacing", "tabSize"
  ];

  function getMirror(editor) {
    if (!mirrorEl) {
      mirrorEl = document.createElement("div");
      mirrorEl.style.position = "absolute";
      mirrorEl.style.visibility = "hidden";
      mirrorEl.style.top = "0";
      mirrorEl.style.left = "-9999px";
      mirrorEl.style.height = "auto";
      mirrorEl.style.overflow = "hidden";
      mirrorEl.style.whiteSpace = "pre-wrap";
      mirrorEl.style.wordWrap = "break-word";
      mirrorEl.setAttribute("aria-hidden", "true");
      document.body.appendChild(mirrorEl);
    }
    var computed = window.getComputedStyle(editor);
    MIRROR_PROPS.forEach(function (prop) {
      mirrorEl.style[prop] = computed[prop];
    });
    mirrorEl.style.width = computed.width;
    return mirrorEl;
  }

  function caretTopFor(editor, index) {
    var mirror = getMirror(editor);
    var value = editor.value;
    mirror.textContent = "";
    mirror.appendChild(document.createTextNode(value.slice(0, index)));
    var marker = document.createElement("span");
    marker.textContent = value.slice(index, index + 1) || ".";
    mirror.appendChild(marker);
    mirror.appendChild(document.createTextNode(value.slice(index + 1)));
    return marker.offsetTop;
  }

  function smoothScrollTo(el, target, duration) {
    var start = el.scrollTop;
    var change = target - start;
    if (Math.abs(change) < 1) return;
    if (el.__scrollAnim) window.cancelAnimationFrame(el.__scrollAnim);
    var startTime = null;

    function easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function step(ts) {
      if (startTime === null) startTime = ts;
      var elapsed = ts - startTime;
      var progress = Math.min(elapsed / duration, 1);
      el.scrollTop = start + change * easeInOutQuad(progress);
      if (progress < 1) {
        el.__scrollAnim = window.requestAnimationFrame(step);
      } else {
        el.__scrollAnim = null;
      }
    }
    el.__scrollAnim = window.requestAnimationFrame(step);
  }

  // Centers the given character range vertically within the textarea's
  // visible viewport, animated smoothly. Fails silently if measurement
  // isn't possible for any reason — the native selection is still visible
  // either way, this just makes sure it isn't scrolled off-screen.
  function scrollBlankIntoView(editor, range) {
    if (!editor || !range) return;
    try {
      var computed = window.getComputedStyle(editor);
      var lineHeight = parseFloat(computed.lineHeight);
      if (!lineHeight || isNaN(lineHeight)) {
        lineHeight = parseFloat(computed.fontSize) * 1.4;
      }
      var startTop = caretTopFor(editor, range.start);
      var endTop = caretTopFor(editor, Math.max(range.start, range.end - 1));
      var midTop = (startTop + endTop) / 2 + lineHeight / 2;
      var target = midTop - editor.clientHeight / 2;
      var max = editor.scrollHeight - editor.clientHeight;
      if (max < 0) max = 0;
      target = Math.max(0, Math.min(target, max));
      smoothScrollTo(editor, target, 260);
    } catch (e) {
      // Measurement failed — no big deal, selection is still visible.
    }
  }

  /* ------------------------------------------------------------
     Copy to clipboard
     ------------------------------------------------------------ */
  function copyToClipboard(text, fromUserAction) {
    var remaining = countRemainingBlanks(text);
    if (fromUserAction && remaining > 0) {
      var noun = remaining === 1 ? "blank" : "blanks";
      var proceed = window.confirm(
        remaining + " unfilled " + noun + " remain in this note (text inside [brackets]).\n\n" +
        "Copy anyway and paste into CPRS?"
      );
      if (!proceed) {
        setStatus("Copy cancelled — fill remaining blanks first.", true);
        return;
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setStatus("Copied — paste into CPRS.", false);
      }, function () {
        legacyCopy(text);
      });
    } else {
      legacyCopy(text);
    }
  }

  function legacyCopy(text) {
    var tmp = document.createElement("textarea");
    tmp.value = text;
    tmp.setAttribute("readonly", "");
    tmp.style.position = "absolute";
    tmp.style.left = "-9999px";
    document.body.appendChild(tmp);
    tmp.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(tmp);
    setStatus(ok ? "Copied — paste into CPRS." : "Couldn't copy automatically — select the text and copy manually.", !ok);
  }

  /* ------------------------------------------------------------
     Edit / New / Delete
     ------------------------------------------------------------ */
  var editingContext = { mode: null, originalId: null };

  function populateModalSelects() {
    var noteTypeSelect = document.getElementById("field-notetype");
    var subspecialtySelect = document.getElementById("field-subspecialty");

    var noteTypes = NOTE_TYPE_ORDER.slice();
    var subspecialties = SUBSPECIALTY_ORDER.slice();

    noteTypeSelect.innerHTML = noteTypes.map(function (n) {
      return '<option value="' + escapeHtml(n) + '">' + escapeHtml(n) + "</option>";
    }).join("");
    subspecialtySelect.innerHTML = subspecialties.map(function (s) {
      return '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + "</option>";
    }).join("");
  }

  function openEditModal(template) {
    populateModalSelects();
    var isDuplicateOfBuiltIn = !!(template && template.builtIn);

    document.getElementById("modal-title").textContent = template
      ? (isDuplicateOfBuiltIn ? "Duplicate & edit template" : "Edit template")
      : "New template";

    document.getElementById("field-shorthand").value = template ? template.shorthand : "";
    document.getElementById("field-title").value = template ? template.title : "";
    document.getElementById("field-notetype").value = template ? template.noteType : NOTE_TYPE_ORDER[0];
    document.getElementById("field-subspecialty").value = template ? template.subspecialty : SUBSPECIALTY_ORDER[0];
    document.getElementById("field-tags").value = template && template.tags ? template.tags.join(", ") : "";
    document.getElementById("field-body").value = template ? template.body : "";

    editingContext.mode = !template ? "new" : (isDuplicateOfBuiltIn ? "duplicate" : "edit");
    editingContext.originalId = template ? template.id : null;

    document.getElementById("modal-backdrop").hidden = false;
    document.getElementById("field-shorthand").focus();
  }

  function closeEditModal() {
    document.getElementById("modal-backdrop").hidden = true;
    editingContext.mode = null;
    editingContext.originalId = null;
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    var shorthand = document.getElementById("field-shorthand").value.trim();
    var title = document.getElementById("field-title").value.trim();
    var noteType = document.getElementById("field-notetype").value;
    var subspecialty = document.getElementById("field-subspecialty").value;
    var tagsRaw = document.getElementById("field-tags").value;
    var body = document.getElementById("field-body").value;

    if (!shorthand || !title || !body.trim()) {
      setStatus("Shorthand, title, and template text are required.", true);
      return;
    }
    if (shorthand[0] !== ".") shorthand = "." + shorthand;

    var tags = tagsRaw.split(",").map(function (s) { return s.trim(); }).filter(Boolean);

    var record;
    if (editingContext.mode === "edit") {
      var idx = state.personalTemplates.findIndex(function (t) { return t.id === editingContext.originalId; });
      if (idx === -1) {
        setStatus("Couldn't find that template to update.", true);
        return;
      }
      record = state.personalTemplates[idx];
      record.shorthand = shorthand;
      record.title = title;
      record.noteType = noteType;
      record.subspecialty = subspecialty;
      record.tags = tags;
      record.body = body;
    } else {
      record = {
        id: uid(),
        shorthand: shorthand,
        title: title,
        noteType: noteType,
        subspecialty: subspecialty,
        tags: tags,
        body: body
      };
      state.personalTemplates.push(record);
    }

    saveJSON(STORAGE_KEYS.personal, state.personalTemplates);
    rebuildAll();
    renderNoteTypeTabs();
    state.selectedId = record.id;
    renderList();
    renderDetail();
    closeEditModal();
    setStatus("Saved to your personal library.", false);
  }

  function deleteTemplate(id) {
    var t = findTemplate(id);
    if (!t || t.builtIn) return;
    var confirmed = window.confirm('Delete "' + t.shorthand + '"? This can\'t be undone (export a backup first if unsure).');
    if (!confirmed) return;

    state.personalTemplates = state.personalTemplates.filter(function (x) { return x.id !== id; });
    saveJSON(STORAGE_KEYS.personal, state.personalTemplates);

    var favIdx = state.favorites.indexOf(id);
    if (favIdx !== -1) {
      state.favorites.splice(favIdx, 1);
      saveJSON(STORAGE_KEYS.favorites, state.favorites);
    }

    if (state.selectedId === id) state.selectedId = null;
    rebuildAll();
    renderNoteTypeTabs();
    renderList();
    renderDetail();
    setStatus("Template deleted.", false);
  }

  /* ------------------------------------------------------------
     Export / Import
     ------------------------------------------------------------ */
  function exportBackup() {
    var payload = {
      exportedAt: new Date().toISOString(),
      personalTemplates: state.personalTemplates,
      favorites: state.favorites
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "ent-dotphrases-backup.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importBackup(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var incomingTemplates = Array.isArray(data.personalTemplates) ? data.personalTemplates : [];
        var incomingFavorites = Array.isArray(data.favorites) ? data.favorites : [];

        var existingIds = {};
        state.personalTemplates.forEach(function (t) { existingIds[t.id] = true; });

        var added = 0;
        incomingTemplates.forEach(function (t) {
          if (!t || !t.shorthand || !t.body) return;
          if (existingIds[t.id]) {
            t = Object.assign({}, t, { id: uid() });
          }
          if (!t.id) t.id = uid();
          state.personalTemplates.push(t);
          existingIds[t.id] = true;
          added++;
        });

        incomingFavorites.forEach(function (id) {
          if (state.favorites.indexOf(id) === -1) state.favorites.push(id);
        });

        saveJSON(STORAGE_KEYS.personal, state.personalTemplates);
        saveJSON(STORAGE_KEYS.favorites, state.favorites);
        rebuildAll();
        renderNoteTypeTabs();
        renderList();
        setStatus(added + " template(s) imported.", false);
      } catch (err) {
        console.warn(err);
        window.alert("That file doesn't look like a valid backup (couldn't parse JSON).");
      }
    };
    reader.readAsText(file);
  }

  /* ------------------------------------------------------------
     Utilities
     ------------------------------------------------------------ */
  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      window.clearTimeout(t);
      t = window.setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  /* ------------------------------------------------------------
     Wire up static controls
     ------------------------------------------------------------ */
  function wireControls() {
    var totalEl = document.getElementById("template-total");
    if (totalEl) {
      totalEl.textContent = state.all.length + " templates in your library";
    }

    document.getElementById("search-input").addEventListener("input", debounce(function (e) {
      state.query = e.target.value;
      renderList();
      var totalEl2 = document.getElementById("template-total");
      if (totalEl2) totalEl2.textContent = state.all.length + " templates in your library";
    }, 120));

    document.getElementById("subspecialty-select").addEventListener("change", function (e) {
      state.subspecialtyFilter = e.target.value;
      renderList();
    });

    document.getElementById("favorites-only").addEventListener("change", function (e) {
      state.favoritesOnly = e.target.checked;
      renderList();
    });

    document.getElementById("btn-new").addEventListener("click", function () {
      openEditModal(null);
    });

    document.getElementById("btn-export").addEventListener("click", exportBackup);

    document.getElementById("btn-import").addEventListener("click", function () {
      document.getElementById("import-file-input").click();
    });
    document.getElementById("import-file-input").addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
      if (file) importBackup(file);
      e.target.value = "";
    });

    document.getElementById("template-form").addEventListener("submit", handleFormSubmit);
    document.getElementById("btn-modal-cancel").addEventListener("click", closeEditModal);
    document.getElementById("modal-backdrop").addEventListener("click", function (e) {
      if (e.target.id === "modal-backdrop") closeEditModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !document.getElementById("modal-backdrop").hidden) {
        closeEditModal();
      }
    });

    window.addEventListener("resize", debounce(updateMobileEditorBar, 150));
  }

  function init() {
    storageAvailable = testStorage();
    if (!storageAvailable) showStorageBanner();

    loadPrefs();
    state.personalTemplates = loadJSON(STORAGE_KEYS.personal, []);
    state.favorites = loadJSON(STORAGE_KEYS.favorites, []);
    if (!Array.isArray(state.personalTemplates)) state.personalTemplates = [];
    if (!Array.isArray(state.favorites)) state.favorites = [];

    ensureBuiltInTemplates(function () {
      rebuildAll();
      renderNoteTypeTabs();
      renderList();
      renderDetail();
      wireControls();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
