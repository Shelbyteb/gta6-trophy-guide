// Platinum Road — a gta6-trophy-guide-01 entry (Node 22, standard library only).
//
// The guide is this repository's app/ folder: plain static files that a
// browser opens at app/index.html, with no build step and no network at run
// time. app/data/trophies.json holds the 55 official PlayStation 5 trophies
// with their names, descriptions and grades, plus a guide to each in our own
// words that cites its sources. This program hands the guide in: it copies
// app/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json with the vendored make.fun library — the summary the
// judge reads (the screenshots, the first load's files and bytes, and the
// source). Leave vendor/makefun-frontend.ts as it is: the scorer requires
// dossier.json to be byte for byte what its own copy of that library writes.
//
// Serve the guide locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps (the kit's reference/gate.json): only text_max_bytes
// shapes the dossier's bytes; the other caps refuse an entry the scorer
// would refuse — more than 4 screenshots or one over 256 KiB, more than 993
// files and directories in app/ or 48 MiB of app files. app/ counts beside
// /output's own 1000-entry cap, its screenshots/ and dossier.json, so the
// guide is kept small on purpose: a handful of files, no vendored libraries.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function handIn() {
  // Start clean so a stale file from an earlier build can never leak in.
  // The scorer runs this program twice and both runs must write the same bytes.
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  if (existsSync(join(here, 'screenshots'))) {
    cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
  }
  const dossier = buildDossier(out, DOSSIER_CAPS);
  writeFileSync(join(out, 'dossier.json'), dossier);
  return dossier;
}

const dossier = handIn();
console.log(`Platinum Road handed in: ${dossier.length} bytes of dossier in ${out}`);
