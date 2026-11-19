// store.js — progress, notes and settings live only in this browser.
// localStorage key gta6-trophy-progress-v1. Export writes a JSON file,
// import reads one back. Nothing is sent anywhere: the guide is offline.

export const STORAGE_KEY = 'gta6-trophy-progress-v1';
export const SETTINGS_KEY = 'gta6-trophy-settings-v1';

// The demo seed: 13 trophies a player would plausibly have early on,
// used by the Settings "Load demo progress" button and by ?demo=1.
export const DEMO_EARNED = [2, 3, 8, 16, 18, 20, 21, 33, 35, 44, 46, 53, 55];
export const DEMO_NOTES = {
  17: 'Gold the pistol challenges first — they look like the easiest set. Save the long-range ones for later.',
  15: 'Fold stunts into every drive: jumps and near-misses between objectives.',
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/** { earned: {id: true}, notes: {id: text} } */
export function loadProgress() {
  const data = readJson(STORAGE_KEY, {});
  return {
    earned: data.earned && typeof data.earned === 'object' ? data.earned : {},
    notes: data.notes && typeof data.notes === 'object' ? data.notes : {},
  };
}

export function saveProgress(progress) {
  writeJson(STORAGE_KEY, progress);
}

export function loadSettings() {
  const s = readJson(SETTINGS_KEY, {});
  return {
    theme: s.theme === 'night' ? 'night' : 'paper',
    spoilerSafe: s.spoilerSafe !== false,
    hideEarned: s.hideEarned === true,
    grade: typeof s.grade === 'string' ? s.grade : 'all',
    kind: typeof s.kind === 'string' ? s.kind : 'all',
  };
}

export function saveSettings(settings) {
  writeJson(SETTINGS_KEY, settings);
}

export function earnedCount(progress) {
  return Object.keys(progress.earned).filter((id) => progress.earned[id]).length;
}

export function isEarned(progress, id) {
  return progress.earned[id] === true;
}

export function toggleEarned(progress, id) {
  const next = { earned: { ...progress.earned }, notes: progress.notes };
  if (next.earned[id]) delete next.earned[id];
  else next.earned[id] = true;
  saveProgress(next);
  return next;
}

export function setNote(progress, id, text) {
  const next = { earned: progress.earned, notes: { ...progress.notes } };
  if (text.trim()) next.notes[id] = text.trim();
  else delete next.notes[id];
  saveProgress(next);
  return next;
}

/** Seed the demo progress (13 earned + 2 notes). Returns the new progress. */
export function seedDemo() {
  const progress = { earned: {}, notes: { ...DEMO_NOTES } };
  for (const id of DEMO_EARNED) progress.earned[id] = true;
  saveProgress(progress);
  return progress;
}

export function clearProgress() {
  const progress = { earned: {}, notes: {} };
  saveProgress(progress);
  return progress;
}

/** Serialise progress for export: { app, exportedAt, earned: [ids], notes }. */
export function exportData(progress) {
  return JSON.stringify(
    {
      app: 'platinum-road-gta6',
      exportedAt: new Date().toISOString(),
      earned: Object.keys(progress.earned).filter((id) => progress.earned[id]).map(Number),
      notes: progress.notes,
    },
    null,
    2,
  );
}

/** Parse an exported file back into progress. Throws on bad input. */
export function importData(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object') throw new Error('Not a progress file.');
  if (data.app && data.app !== 'platinum-road-gta6') throw new Error('This file is from another guide.');
  const earned = {};
  const ids = Array.isArray(data.earned) ? data.earned : [];
  for (const id of ids) {
    const n = Number(id);
    if (Number.isInteger(n) && n >= 1 && n <= 55) earned[n] = true;
  }
  const notes = {};
  if (data.notes && typeof data.notes === 'object') {
    for (const [id, text2] of Object.entries(data.notes)) {
      const n = Number(id);
      if (Number.isInteger(n) && typeof text2 === 'string' && text2.trim()) notes[n] = text2.trim();
    }
  }
  const progress = { earned, notes };
  saveProgress(progress);
  return progress;
}
