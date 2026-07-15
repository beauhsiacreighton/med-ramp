(function () {
  "use strict";

  /* ------------------------------------------------------------
     Constants
     ------------------------------------------------------------ */
  var STORAGE_KEYS = {
    personal: "ent_dotphrases_personal_v1",
    favorites: "ent_dotphrases_favorites_v1"
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
    tabJumpEnabled: false
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
    fetch("vatemplates.js", { cache: "no-cache" })
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
  function selectTemplate(id) {
    state.selectedId = id;
    renderList();
    renderDetail();
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
      '<textarea class="body-editor" id="body-editor" spellcheck="false" aria-label="Template text, editable before copying">' +
        escapeHtml(t.body) +
      "</textarea>" +
      '<div class="editor-toolbar">' +
        '<div class="editor-toolbar-left">' +
          '<button type="button" class="btn btn-primary" id="btn-copy">Copy to clipboard</button>' +
          '<button type="button" class="btn" id="btn-next-blank">Next blank</button>' +
          '<button type="button" class="btn btn-ghost" id="btn-reset">Reset text</button>' +
          '<label class="checkbox-field" style="margin-left:6px;">' +
            '<input type="checkbox" id="tab-jump-toggle" ' + (state.tabJumpEnabled ? "checked" : "") + '>' +
            "Tab key jumps to next blank" +
          "</label>" +
        "</div>" +
        '<span class="status-msg" id="status-msg" aria-live="polite"></span>' +
      "</div>";

    var editor = document.getElementById("body-editor");

    document.getElementById("btn-copy").addEventListener("click", function () {
      copyToClipboard(editor.value);
    });
    document.getElementById("btn-next-blank").addEventListener("click", function () {
      jumpToNextBlank(editor);
    });
    document.getElementById("btn-reset").addEventListener("click", function () {
      editor.value = t.body;
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
    });

    editor.addEventListener("keydown", function (e) {
      if (e.key === "Tab" && state.tabJumpEnabled) {
        e.preventDefault();
        jumpToNextBlank(editor);
      }
    });
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
  function jumpToNextBlank(textarea) {
    var text = textarea.value;
    var cursor = textarea.selectionEnd || 0;
    BLANK_PATTERN.lastIndex = 0;

    var match;
    var firstMatch = null;
    var nextMatch = null;

    while ((match = BLANK_PATTERN.exec(text)) !== null) {
      if (firstMatch === null) firstMatch = match;
      if (match.index >= cursor) {
        nextMatch = match;
        break;
      }
    }

    var target = nextMatch || firstMatch;

    if (!target) {
      setStatus("No [blanks] left in this template.", true);
      return;
    }

    textarea.focus();
    textarea.setSelectionRange(target.index, target.index + target[0].length);
    if (!nextMatch) setStatus("Back to the first blank.", false);
  }

  /* ------------------------------------------------------------
     Copy to clipboard
     ------------------------------------------------------------ */
  function copyToClipboard(text) {
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
  }

  function init() {
    storageAvailable = testStorage();
    if (!storageAvailable) showStorageBanner();

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
