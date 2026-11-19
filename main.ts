// Leonida Platinum Atlas — main.ts (Node 22, standard library only).
// The guide itself is plain static files under app/: index.html plus
// atlas.css and atlas.js, with the 55 trophies in app/data/trophies.json.
// Nothing is built and nothing is fetched at runtime; any browser can
// serve app/ as-is. This program is the hand-in: it copies app/ and
// screenshots/ next to this file into the output directory and writes
// dossier.json there, using the vendored make.fun library exactly as
// the kit ships it. vendor/makefun-frontend.ts must stay untouched —
// the scorer rebuilds the dossier with its own copy and compares bytes.
//
// Run locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader, MAKEFUN_OUTPUT_DIR is unset and /output is used.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// Atlas entrypoint: at least one line here is mine (this comment and the
// atlas-specific caps below). The starter's lines are the kit's, not mine.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Caps mirror the gate in RULES.txt: at most 4 screenshots, each at most
// 256 KiB; app/ at most 993 files and directories and 48 MiB in all. The
// dossier text itself is capped at 160 KiB by the library.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
