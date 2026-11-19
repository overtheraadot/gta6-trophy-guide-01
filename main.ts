// Leonida Platinum Atlas — the hand-in program for make.fun gta6-trophy-guide-01.
// Node 22, standard library only. The guide itself is app/: plain static files
// (app/index.html plus its atlas.css / atlas.js modules and app/data/trophies.json),
// opened offline in a browser with no build step and no network. This program
// gathers it for the judge: it copies app/ and screenshots/ from beside this file
// into the output directory and writes output/dossier.json with the kit's vendored
// library, so the judge can read the guide's source and its screenshots.
// vendor/makefun-frontend.ts stays exactly as shipped: the scorer requires the
// dossier to be byte for byte what its own copy of that library writes.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The folder this file lives in, and the folder the dossier goes to.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });

// The whole guide, exactly as it sits in the repository.
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

// The screenshots, when the folder exists (it always does in this repo).
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier, under the scorer's caps from the kit's gate: the text is capped at
// 160 KiB, at most 4 screenshots of 256 KiB each, and app/ stays inside 993
// files / 48 MiB with no path over 1000 bytes, so the whole output fits the
// platform's own 1000-entry / 64 MiB limit with room to spare.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
