// Whisper Vault — the entry program (Node 22, standard library only).
// It hands the game in: copies this repository's game/ and screenshots/
// beside this file into /output and writes /output/dossier.json, the
// summary the judge reads, with the vendored make.fun library.
//
// The game itself is plain static files a desktop browser loads offline:
// game/index.html and its ES modules, no library and no network request.
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps: refuse here what the gate would refuse there,
// so a bad bundle fails loudly on my machine instead of silently at grading.
const DOSSIER_TEXT_MAX_BYTES = 163840;
const SCREENSHOTS_MAX = 4;
const SCREENSHOT_MAX_BYTES = 262144;
const GAME_MAX_FILES = 993;
const GAME_MAX_BYTES = 50331648;
const GAME_PATH_MAX_BYTES = 1000;

function countGameEntries(dir) {
  let files = 0;
  let bytes = 0;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, name.name);
    if (name.isDirectory()) {
      const sub = countGameEntries(path);
      files += sub.files + 1;
      bytes += sub.bytes;
    } else if (name.isFile()) {
      files += 1;
      bytes += statSync(path).size;
      if (Buffer.byteLength(path, 'utf8') > GAME_PATH_MAX_BYTES) {
        throw new Error(`game path too long: ${path}`);
      }
    } else {
      throw new Error(`game/ must hold plain files and directories only: ${path}`);
    }
  }
  return { files, bytes };
}

function checkScreenshots(dir) {
  if (!existsSync(dir)) return;
  const shots = readdirSync(dir).filter((name) => !name.startsWith('.'));
  if (shots.length > SCREENSHOTS_MAX) throw new Error(`too many screenshots: ${shots.length}`);
  for (const name of shots) {
    const size = statSync(join(dir, name)).size;
    if (size > SCREENSHOT_MAX_BYTES) throw new Error(`screenshot over 256 KiB: ${name}`);
  }
}

const gameStats = countGameEntries(join(here, 'game'));
if (gameStats.files > GAME_MAX_FILES) throw new Error(`too many game files: ${gameStats.files}`);
if (gameStats.bytes > GAME_MAX_BYTES) throw new Error(`game/ too large: ${gameStats.bytes} bytes`);
checkScreenshots(join(here, 'screenshots'));

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: DOSSIER_TEXT_MAX_BYTES,
    screenshots: { max: SCREENSHOTS_MAX, max_bytes: SCREENSHOT_MAX_BYTES },
    game_max_files: GAME_MAX_FILES,
    game_max_bytes: GAME_MAX_BYTES,
    game_path_max_bytes: GAME_PATH_MAX_BYTES,
  }),
);

// A one-line receipt on stdout, so a run's result is visible without
// opening the dossier: game size and the screenshots that went in.
const shotNames = existsSync(join(here, 'screenshots'))
  ? readdirSync(join(here, 'screenshots')).filter((name) => !name.startsWith('.')).sort()
  : [];
console.log(
  `whisper-vault: game ${gameStats.files} files, ${gameStats.bytes} bytes; `
  + `screenshots ${shotNames.join(', ') || 'none'}; dossier written to ${join(out, 'dossier.json')}`,
);
