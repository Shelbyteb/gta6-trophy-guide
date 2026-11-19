// filters.js — which trophies the checklist shows, and what the spoiler
// setting hides. The spoiler rule: a hidden story trophy stays masked
// (name and description replaced) until it is earned.

/**
 * Apply the current filters to the trophy list.
 * filters: { kind, grade, query, hideEarned, spoilerSafe }
 * progress: { earned, notes } — needed for hide-earned and the spoiler rule.
 * Returns the trophies in list order, each with a `masked` flag when the
 * spoiler setting hides it.
 */
export function applyFilters(trophies, filters, progress) {
  const q = (filters.query || '').trim().toLowerCase();
  const out = [];
  for (const t of trophies) {
    const earned = progress.earned[t.id] === true;
    if (filters.hideEarned && earned) continue;
    if (filters.grade !== 'all' && t.grade !== filters.grade) continue;
    if (filters.kind !== 'all' && !t.kind.includes(filters.kind)) continue;
    if (q) {
      const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (!hay.includes(q)) continue;
    }
    const masked = Boolean(filters.spoilerSafe && t.hidden && !earned);
    out.push({ ...t, masked, earned });
  }
  return out;
}

/** Display name under the spoiler rule: masked trophies show as hidden. */
export function displayName(trophy) {
  return trophy.masked ? 'Hidden trophy — earn it to reveal' : trophy.name;
}

/** Display description under the spoiler rule. */
export function displayDescription(trophy) {
  return trophy.masked
    ? 'A hidden story trophy. Its name and description stay hidden until you earn it.'
    : trophy.description;
}

/** Count earned trophies per roadmap stage. Returns { stage: { earned, total } }. */
export function stageProgress(trophies, progress) {
  const stages = {};
  for (const t of trophies) {
    const s = stages[t.stage] || (stages[t.stage] = { earned: 0, total: 0 });
    s.total += 1;
    if (progress.earned[t.id]) s.earned += 1;
  }
  return stages;
}

/** The next unearned trophies in roadmap order (stage, then list order).
 * Missables sort first inside a stage: they are the ones with a deadline. */
export function nextUp(trophies, progress, limit) {
  const rest = trophies
    .filter((t) => !progress.earned[t.id])
    .sort((a, b) => a.stage - b.stage || (b.missable - a.missable) || a.id - b.id);
  return rest.slice(0, limit || 8);
}
