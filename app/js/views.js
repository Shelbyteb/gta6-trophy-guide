// views.js — renders every screen of the guide from the trophy data and
// the saved progress. No framework: plain DOM, one render function a view.

import { STAGES, gradeCounts } from './data.js';
import { applyFilters, displayName, displayDescription, stageProgress, nextUp } from './filters.js';
import { isEarned, toggleEarned, setNote, earnedCount, exportData, importData, seedDemo, clearProgress } from './store.js';

const KIND_LABELS = { story: 'Story', missable: 'Missable', collectible: 'Collectible', activity: 'Activity' };

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function gradeWord(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function sourceLinks(text) {
  // Turn the two named sources into links; the rest stays plain text.
  const frag = document.createDocumentFragment();
  const parts = text.split(/(Exophase|PSNProfiles)/g);
  for (const part of parts) {
    if (part === 'Exophase') {
      const a = el('a', null, 'Exophase');
      a.href = 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/';
      a.target = '_blank';
      a.rel = 'noopener';
      frag.appendChild(a);
    } else if (part === 'PSNProfiles') {
      const a = el('a', null, 'PSNProfiles');
      a.href = 'https://psnprofiles.com/trophies/43531-grand-theft-auto-vi';
      a.target = '_blank';
      a.rel = 'noopener';
      frag.appendChild(a);
    } else {
      frag.appendChild(document.createTextNode(part));
    }
  }
  return frag;
}

/** Header progress: big earned count, bar and grade breakdown. */
export function renderProgress(trophies, progress) {
  const earned = earnedCount(progress);
  const total = trophies.length;
  const pct = Math.round((earned / total) * 100);
  document.getElementById('earned-count').textContent = String(earned);
  const bar = document.getElementById('progress-bar');
  bar.setAttribute('aria-valuenow', String(earned));
  document.getElementById('progress-fill').style.width = pct + '%';
  const counts = gradeCounts(trophies);
  const earnedByGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (progress.earned[t.id]) earnedByGrade[t.grade] += 1;
  document.getElementById('progress-sub').textContent =
    pct + '% to the platinum — ' +
    'P ' + earnedByGrade.platinum + '/' + counts.platinum +
    ' · G ' + earnedByGrade.gold + '/' + counts.gold +
    ' · S ' + earnedByGrade.silver + '/' + counts.silver +
    ' · B ' + earnedByGrade.bronze + '/' + counts.bronze;
}

/** The checklist rows, left column of the tracker. */
export function renderChecklist(trophies, filters, progress, selectedId, onSelect) {
  const list = document.getElementById('checklist');
  list.innerHTML = '';
  const shown = applyFilters(trophies, filters, progress);
  document.getElementById('result-count').textContent =
    shown.length + ' of ' + trophies.length + ' trophies';
  if (!shown.length) {
    const empty = el('li', 'empty', 'No trophies match these filters. Clear the search or pick another kind.');
    list.appendChild(empty);
    return;
  }
  for (const t of shown) {
    const row = el('li', 'trophy-row' + (t.earned ? ' earned' : '') + (t.id === selectedId ? ' selected' : ''));
    row.dataset.id = String(t.id);
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'trophy-check';
    check.checked = t.earned;
    check.setAttribute('aria-label', 'Mark ' + (t.masked ? 'hidden trophy' : t.name) + ' earned');
    check.addEventListener('click', (ev) => ev.stopPropagation());
    check.addEventListener('change', () => onSelect.toggle(t.id));
    row.appendChild(check);
    row.appendChild(el('span', 'medal ' + t.grade, ''));
    const main = el('div', 'trophy-main');
    main.appendChild(el('div', 'trophy-name', displayName(t)));
    main.appendChild(el('div', 'trophy-desc', displayDescription(t)));
    const tags = el('div', 'trophy-tags');
    for (const k of t.kind) tags.appendChild(el('span', 'tag', KIND_LABELS[k] || k));
    if (t.missable) tags.appendChild(el('span', 'tag missable', '⚠ Missable'));
    if (t.hidden && !t.earned) tags.appendChild(el('span', 'tag hidden-t', 'Hidden'));
    if (progress.notes[t.id]) tags.appendChild(el('span', 'tag note-tag', '✎ Note'));
    main.appendChild(tags);
    row.appendChild(main);
    row.appendChild(el('span', 'trophy-grade', gradeWord(t.grade)));
    row.addEventListener('click', () => onSelect.open(t.id));
    list.appendChild(row);
  }
}

/** The detail pane: official name/description/grade, the guide, its sources, a note box.
 * When spoiler-safe mode is on, a hidden trophy stays masked until earned. */
export function renderDetail(trophy, progress, onChange, spoilerSafe) {
  const pane = document.getElementById('detail');
  pane.innerHTML = '';
  if (!trophy) {
    pane.appendChild(el('p', 'spoiler-mask', 'Pick a trophy from the checklist to read its guide.'));
    return;
  }
  const earned = isEarned(progress, trophy.id);
  const masked = spoilerSafe && trophy.hidden && !earned;
  const medal = el('span', 'medal ' + trophy.grade, '');
  medal.style.cssText = 'display:inline-block;width:16px;height:16px;vertical-align:-2px;margin-right:8px;';
  const h = el('h2');
  h.appendChild(medal);
  h.appendChild(document.createTextNode(masked ? 'Hidden trophy' : trophy.name));
  pane.appendChild(h);
  pane.appendChild(el('p', 'official', masked ? 'A hidden story trophy — its name and description stay hidden until you earn it.' : '“' + trophy.description + '”'));
  pane.appendChild(el('p', 'grade-line', gradeWord(trophy.grade) + ' trophy · ' + (trophy.hidden ? 'Hidden on PlayStation' : 'Shown on PlayStation') + (trophy.missable ? ' · ⚠ Missable' : '')));
  const guideHead = el('h3', null, 'Guide — in our own words');
  pane.appendChild(guideHead);
  if (masked) {
    pane.appendChild(el('p', 'spoiler-mask', 'Spoiler-safe mode is on: the guide stays hidden with the trophy until you earn it. Mark it earned (or switch spoiler-safe off in the toolbar) to read the guide.'));
  } else {
    pane.appendChild(el('p', 'guide-text', trophy.guide));
  }
  pane.appendChild(el('h3', null, 'Sources — where each fact comes from'));
  const src = el('p', 'sources-text');
  src.appendChild(sourceLinks(trophy.sources));
  pane.appendChild(src);
  pane.appendChild(el('h3', null, 'Your note'));
  const note = document.createElement('textarea');
  note.className = 'note-box';
  note.placeholder = 'Plan your route — e.g. “do this after Chapter 3”. Saves in this browser.';
  note.value = progress.notes[trophy.id] || '';
  note.setAttribute('aria-label', 'Note for ' + trophy.name);
  note.addEventListener('change', () => onChange.note(trophy.id, note.value));
  pane.appendChild(note);
  const actions = el('div', 'detail-actions');
  const mark = el('button', 'btn primary', earned ? '✓ Earned — unmark' : 'Mark earned');
  mark.type = 'button';
  mark.addEventListener('click', () => onChange.toggle(trophy.id));
  actions.appendChild(mark);
  if (trophy.missable) {
    const warn = el('span', 'tag missable', '⚠ Missable — see the Missables page');
    warn.style.alignSelf = 'center';
    actions.appendChild(warn);
  }
  pane.appendChild(actions);
}

/** Roadmap: six stages with progress bars and the trophies in each stage.
 * Hidden story trophies stay masked while spoiler-safe mode is on. */
export function renderRoadmap(trophies, progress, onSelect, spoilerSafe) {
  const host = document.getElementById('roadmap-stages');
  host.innerHTML = '';
  const sp = stageProgress(trophies, progress);
  for (const stage of STAGES) {
    const inStage = trophies.filter((t) => t.stage === stage.n);
    const got = sp[stage.n] || { earned: 0, total: inStage.length };
    const pct = got.total ? Math.round((got.earned / got.total) * 100) : 0;
    const card = el('div', 'stage-card');
    const head = el('div', 'stage-head');
    head.appendChild(el('h3', null, stage.title));
    head.appendChild(el('span', 'stage-count', got.earned + ' / ' + got.total + ' earned · ' + pct + '%'));
    card.appendChild(head);
    const bar = el('div', 'stage-bar');
    bar.appendChild(el('span'));
    bar.firstChild.style.width = pct + '%';
    card.appendChild(bar);
    card.appendChild(el('p', null, stage.advice));
    const names = el('p', 'stage-trophies');
    names.textContent = stage.what + ' — ' + inStage.map((t) => {
      if (spoilerSafe && t.hidden && !progress.earned[t.id]) return 'Hidden trophy';
      return (progress.earned[t.id] ? '✓ ' : '') + t.name;
    }).join(' · ');
    card.appendChild(names);
    card.addEventListener('click', () => onSelect.gotoTracker(stage.n));
    card.style.cursor = 'pointer';
    host.appendChild(card);
  }
}

/** Missables page: the 12 flagged trophies with their warnings. */
export function renderMissables(trophies, progress, onSelect) {
  const host = document.getElementById('missable-list');
  host.innerHTML = '';
  const miss = trophies.filter((t) => t.missable);
  for (const t of miss) {
    const card = el('div', 'missable-card');
    card.appendChild(el('div', 'warn', '⚠ Missable · ' + gradeWord(t.grade) + ' trophy'));
    const h = el('h3', null, (progress.earned[t.id] ? '✓ ' : '') + t.name);
    h.style.marginTop = '6px';
    card.appendChild(h);
    card.appendChild(el('p', null, '“' + t.description + '”'));
    card.appendChild(el('p', null, t.guide));
    const src = el('p', 'sources-text');
    src.appendChild(sourceLinks(t.sources));
    card.appendChild(src);
    card.addEventListener('click', () => onSelect.open(t.id));
    card.style.cursor = 'pointer';
    host.appendChild(card);
  }
  const note = el('p', 'sources-note', 'Why these 12? Each one is a one-shot moment in its description: a choice to make, a single attempt, or a scene at one place at one time. The flags are our reading of the official descriptions, not a playthrough — the game launched the day this guide was written, so check each flag in the game before you trust it with a save.');
  host.appendChild(note);
}

/** Next-up planner: the next unearned trophies in roadmap order, with a reason each.
 * Hidden story trophies stay masked while spoiler-safe mode is on. */
export function renderPlanner(trophies, progress, onSelect, spoilerSafe) {
  const host = document.getElementById('planner-list');
  host.innerHTML = '';
  const next = nextUp(trophies, progress, 8);
  if (!next.length) {
    host.appendChild(el('p', 'empty', 'Every trophy is earned. The platinum is yours — congratulations, Leonida Legend.'));
    return;
  }
  const reasons = {
    1: 'The platinum — it pops when everything else is done.',
    14: '100% completion — the last big goal before the platinum.',
  };
  next.forEach((t, i) => {
    const row = el('div', 'plan-row');
    row.appendChild(el('div', 'plan-num', String(i + 1)));
    const body = el('div');
    const masked = spoilerSafe && t.hidden && !progress.earned[t.id];
    const h = el('h3', null, masked ? 'Hidden trophy' : t.name);
    body.appendChild(h);
    const stage = STAGES.find((s) => s.n === t.stage);
    const why = reasons[t.id] || (stage ? stage.title + (t.missable ? ' · ⚠ Missable — do it before it passes' : '') : '');
    body.appendChild(el('p', 'plan-why', why));
    body.appendChild(el('p', null, masked ? 'A hidden story trophy — its name and description stay hidden until you earn it.' : '“' + t.description + '” — ' + gradeWord(t.grade) + ' trophy' + (t.missable ? ' · ⚠ Missable' : '')));
    if (progress.notes[t.id]) body.appendChild(el('p', 'plan-why', '✎ Your note: ' + progress.notes[t.id]));
    row.appendChild(body);
    row.addEventListener('click', () => onSelect.open(t.id));
    row.style.cursor = 'pointer';
    host.appendChild(row);
  });
}

/** Settings: theme, spoiler, demo data, export/import, reset. */
export function renderSettings(settings, progress, onSettings) {
  const host = document.getElementById('settings-grid');
  host.innerHTML = '';

  const themeCard = el('div', 'setting-card');
  themeCard.appendChild(el('h3', null, 'Theme'));
  themeCard.appendChild(el('p', null, 'Paper (light) or Night (dark). The guide keeps your pick in this browser.'));
  const themeBtn = el('button', 'btn', settings.theme === 'night' ? 'Switch to Paper theme' : 'Switch to Night theme');
  themeBtn.type = 'button';
  themeBtn.addEventListener('click', () => onSettings.theme());
  themeCard.appendChild(themeBtn);
  host.appendChild(themeCard);

  const dataCard = el('div', 'setting-card');
  dataCard.appendChild(el('h3', null, 'Your progress'));
  dataCard.appendChild(el('p', null, earnedCount(progress) + ' of 55 trophies earned. Export saves a JSON file; import reads one back.'));
  const exportBtn = el('button', 'btn', 'Export progress (.json)');
  exportBtn.type = 'button';
  exportBtn.addEventListener('click', () => {
    const blob = new Blob([exportData(progress)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gta6-trophy-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  dataCard.appendChild(exportBtn);
  const importBtn = el('button', 'btn', 'Import progress…');
  importBtn.type = 'button';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json,application/json';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      onSettings.imported(importData(text));
    } catch (e) {
      alert('That file could not be imported: ' + e.message);
    }
    fileInput.value = '';
  });
  importBtn.addEventListener('click', () => fileInput.click());
  dataCard.appendChild(importBtn);
  dataCard.appendChild(fileInput);
  const demoBtn = el('button', 'btn', 'Load demo progress (13 earned)');
  demoBtn.type = 'button';
  demoBtn.addEventListener('click', () => onSettings.demo(seedDemo()));
  dataCard.appendChild(demoBtn);
  const resetBtn = el('button', 'btn danger', 'Reset all progress');
  resetBtn.type = 'button';
  resetBtn.addEventListener('click', () => {
    if (confirm('Clear all earned trophies and notes?')) onSettings.reset(clearProgress());
  });
  dataCard.appendChild(resetBtn);
  host.appendChild(dataCard);

  const keysCard = el('div', 'setting-card');
  keysCard.appendChild(el('h3', null, 'Keyboard'));
  keysCard.appendChild(el('p', null, '“/” focuses search · “1–5” switches Tracker, Roadmap, Missables, Next up, Settings · “t” toggles the theme · “s” toggles spoiler-safe mode.'));
  host.appendChild(keysCard);
}
