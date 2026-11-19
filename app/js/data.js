// data.js — loads the official trophy list and names the roadmap stages.
// The list itself lives in app/data/trophies.json: 55 trophies with their
// official name, description and grade, our own guide, and the flags this
// guide derives from the official descriptions (kind, missable, hidden,
// roadmap stage). No network beyond this one local fetch.

export const TROPHY_DATA_URL = 'data/trophies.json';

export const KINDS = [
  { key: 'all', label: 'All 55' },
  { key: 'story', label: 'Story' },
  { key: 'missable', label: 'Missable' },
  { key: 'collectible', label: 'Collectibles' },
  { key: 'activity', label: 'Activities' },
];

export const GRADES = ['platinum', 'gold', 'silver', 'bronze'];

export const STAGES = [
  { n: 1, title: 'Stage 1 — Play the story', what: 'Chapters 1–4, the final mission and the named story missions. 12 trophies.', advice: 'Just play. Chapter and mission trophies pop as the story ends each beat — no side content is needed for any of them.' },
  { n: 2, title: 'Stage 2 — Side strands & character finales', what: 'Andy, Kenton, Billy, Randy, Tyrone, and 8 Strangers & Freaks strands. 6 trophies.', advice: 'Finish every strand to its last mission. Strangers are spread across the whole state, so work them between story chapters.' },
  { n: 3, title: 'Stage 3 — Activities & skill', what: 'Shooting Range golds, 250 stunts, races, fishing, arcade, bowling, meditation, hunting, challenges. 12 trophies.', advice: 'The long grind lives here — above all The Shootist (42 range golds). Start the range early and play activities in short sessions.' },
  { n: 4, title: 'Stage 4 — Explore & collect', what: 'All of Leonida, card sets, 100 WAiNK spots, 100 vehicles, garages, Scooter Bros registrations. 6 trophies.', advice: 'Tour the map in stages and tick things off as you find them. Collectibles found early are collectibles you never have to hunt at the end.' },
  { n: 5, title: 'Stage 5 — Money, heat & one-shot moments', what: 'Robberies, laundering, spending, and the 12 missable trophies. 17 trophies.', advice: 'Do the missables now, before the story ends — the Missables page lists each one with its warning. Robberies and money goals are cumulative, so keep at them.' },
  { n: 6, title: 'Stage 6 — The platinum', what: '100% completion and the platinum itself. 2 trophies.', advice: 'A Long Road (100% completion) falls when everything else is done; the platinum pops the moment the 54th other trophy does.' },
];

/** Fetch and return the trophy list object { game, platform, sources, trophies }. */
export async function loadTrophies() {
  const res = await fetch(TROPHY_DATA_URL);
  if (!res.ok) throw new Error('Could not load ' + TROPHY_DATA_URL + ' (' + res.status + ')');
  const data = await res.json();
  if (!Array.isArray(data.trophies)) throw new Error('trophies.json has no trophies array');
  if (data.trophies.length !== 55) throw new Error('trophies.json holds ' + data.trophies.length + ' trophies, expected 55');
  return data;
}

/** Grade counts for the header: { platinum: 1, gold: 2, silver: 6, bronze: 46 }. */
export function gradeCounts(trophies) {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (t.grade in counts) counts[t.grade] += 1;
  return counts;
}
