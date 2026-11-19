// main.js — boots the guide: loads the trophy list, wires the toolbar,
// tabs, keyboard shortcuts and theme, and honours the demo links
// (?demo=1 seeds 13 earned trophies; ?view=roadmap|missables|planner|settings;
// ?theme=night; ?trophy=<id> opens one trophy's guide).

import { loadTrophies } from './data.js';
import { loadProgress, loadSettings, saveSettings, toggleEarned, setNote, seedDemo } from './store.js';
import { renderProgress, renderChecklist, renderDetail, renderRoadmap, renderMissables, renderPlanner, renderSettings } from './views.js';

const VIEWS = ['tracker', 'roadmap', 'missables', 'planner', 'settings'];

let trophies = [];
let progress = loadProgress();
let settings = loadSettings();
let filters = { kind: 'all', grade: 'all', query: '', hideEarned: false, spoilerSafe: true };
let selectedId = 17; // The Shootist: a guide with a count, open by default.

function applyTheme() {
  document.documentElement.dataset.theme = settings.theme;
  document.getElementById('theme-toggle').textContent =
    settings.theme === 'night' ? 'Paper theme' : 'Night theme';
}

function showView(name) {
  for (const v of VIEWS) {
    document.getElementById('view-' + v).classList.toggle('active', v === name);
    const tab = document.querySelector('.tab[data-view="' + v + '"]');
    tab.classList.toggle('active', v === name);
    if (v === name) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
  if (name === 'roadmap') renderRoadmap(trophies, progress, actions, filters.spoilerSafe);
  if (name === 'missables') renderMissables(trophies, progress, actions);
  if (name === 'planner') renderPlanner(trophies, progress, actions, filters.spoilerSafe);
  if (name === 'settings') renderSettings(settings, progress, settingsActions);
}

function renderAll() {
  renderProgress(trophies, progress);
  renderChecklist(trophies, filters, progress, selectedId, actions);
  const selected = trophies.find((t) => t.id === selectedId);
  renderDetail(selected, progress, actions, filters.spoilerSafe);
}

const actions = {
  open(id) {
    selectedId = id;
    showView('tracker');
    renderAll();
    document.getElementById('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },
  toggle(id) {
    progress = toggleEarned(progress, id);
    renderAll();
    const view = document.querySelector('.view.active').id.replace('view-', '');
    showView(view);
  },
  note(id, text) {
    progress = setNote(progress, id, text);
    renderAll();
  },
  gotoTracker(stage) {
    filters = { ...filters, kind: 'all', grade: 'all', query: '' };
    document.getElementById('search').value = '';
    showView('tracker');
    renderAll();
    const first = trophies.find((t) => t.stage === stage && !progress.earned[t.id]);
    if (first) actions.open(first.id);
  },
};

const settingsActions = {
  theme() {
    settings = { ...settings, theme: settings.theme === 'night' ? 'paper' : 'night' };
    saveSettings(settings);
    applyTheme();
    renderSettings(settings, progress, settingsActions);
  },
  demo(next) {
    progress = next;
    renderAll();
    renderSettings(settings, progress, settingsActions);
  },
  imported(next) {
    progress = next;
    renderAll();
    renderSettings(settings, progress, settingsActions);
  },
  reset(next) {
    progress = next;
    renderAll();
    renderSettings(settings, progress, settingsActions);
  },
};

function readDemoParams() {
  const params = new URLSearchParams(location.search);
  if (params.get('demo') === '1' && Object.keys(progress.earned).length === 0) {
    progress = seedDemo();
  }
  if (params.get('theme') === 'night' || params.get('theme') === 'paper') {
    settings = { ...settings, theme: params.get('theme') };
    saveSettings(settings);
  }
  const trophy = Number(params.get('trophy'));
  if (Number.isInteger(trophy) && trophy >= 1 && trophy <= 55) selectedId = trophy;
  const view = params.get('view');
  if (VIEWS.includes(view)) showView(view);
  if (params.get('spoiler') === 'off') {
    filters.spoilerSafe = false;
    settings = { ...settings, spoilerSafe: false };
    saveSettings(settings);
  }
}

async function boot() {
  try {
    const data = await loadTrophies();
    trophies = data.trophies;
  } catch (e) {
    document.getElementById('checklist').innerHTML =
      '<li class="empty">Could not load the trophy list: ' + e.message + '</li>';
    return;
  }

  // Restore saved toolbar state (kind, grade, hide-earned, spoiler-safe).
  filters = {
    kind: settings.kind || 'all',
    grade: settings.grade || 'all',
    query: '',
    hideEarned: settings.hideEarned === true,
    spoilerSafe: settings.spoilerSafe !== false,
  };
  document.getElementById('grade-filter').value = filters.grade;
  document.getElementById('hide-earned').checked = filters.hideEarned;
  document.getElementById('spoiler-toggle').checked = filters.spoilerSafe;
  const kindChip = document.querySelector('.chip[data-kind="' + filters.kind + '"]');
  if (kindChip) {
    document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    kindChip.classList.add('active');
  }

  readDemoParams();
  applyTheme();
  renderAll();
  showView(document.querySelector('.tab.active').dataset.view);

  // Tabs.
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => showView(tab.dataset.view));
  });

  // Toolbar: search, kind chips, grade, hide-earned, spoiler toggle.
  document.getElementById('search').addEventListener('input', (ev) => {
    filters.query = ev.target.value;
    renderChecklist(trophies, filters, progress, selectedId, actions);
  });
  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      filters.kind = chip.dataset.kind;
      settings = { ...settings, kind: filters.kind };
      saveSettings(settings);
      renderChecklist(trophies, filters, progress, selectedId, actions);
    });
  });
  document.getElementById('grade-filter').addEventListener('change', (ev) => {
    filters.grade = ev.target.value;
    settings = { ...settings, grade: filters.grade };
    saveSettings(settings);
    renderChecklist(trophies, filters, progress, selectedId, actions);
  });
  document.getElementById('hide-earned').addEventListener('change', (ev) => {
    filters.hideEarned = ev.target.checked;
    settings = { ...settings, hideEarned: filters.hideEarned };
    saveSettings(settings);
    renderChecklist(trophies, filters, progress, selectedId, actions);
  });
  document.getElementById('spoiler-toggle').addEventListener('change', (ev) => {
    filters.spoilerSafe = ev.target.checked;
    settings = { ...settings, spoilerSafe: filters.spoilerSafe };
    saveSettings(settings);
    renderAll();
  });

  // Theme toggle in the header.
  document.getElementById('theme-toggle').addEventListener('click', () => settingsActions.theme());

  // Keyboard: / search, 1–5 views, t theme, s spoiler-safe.
  document.addEventListener('keydown', (ev) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (ev.key === '/' && !typing) {
      ev.preventDefault();
      document.getElementById('search').focus();
    } else if (!typing && ['1', '2', '3', '4', '5'].includes(ev.key)) {
      showView(VIEWS[Number(ev.key) - 1]);
    } else if (!typing && ev.key === 't') {
      settingsActions.theme();
    } else if (!typing && ev.key === 's') {
      const toggle = document.getElementById('spoiler-toggle');
      toggle.checked = !toggle.checked;
      toggle.dispatchEvent(new Event('change'));
    }
  });
}

boot();
