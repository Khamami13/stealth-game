// Whisper Vault — the game itself. One file, one job: own the state, the
// loop and the rules that tie the modules together (levels, thief, wardens,
// screens, score). Everything visible or audible is delegated elsewhere.
import {
  TILE, VIEW_W, VIEW_H, PLAYER_LIVES, SCORE_SHARD, SCORE_LEVEL,
  SCORE_GHOST_BONUS,
} from './config.js';
import { LEVELS, parseLevel } from './levels.js';
import { createGuard, updateGuard, GUARD_SUSPICIOUS, GUARD_ALERTED } from './guard.js';
import { createPlayer, movePlayer, collectShards, shardsLeft, onExitTile, playerHidden } from './player.js';
import { createInput, readMoveDirection, readSneaking, readConfirm, consumeClick, consumeConfirm } from './input.js';
import {
  createAudio, ensureAudio, playPlayerStep, playGuardSteps, playPickup,
  playSuspicious, playAlarm, playCaught, playLevelClear, playWin,
} from './audio.js';
import {
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_LEVEL_CLEAR, SCREEN_GAME_OVER, SCREEN_WIN,
  drawWorld, drawHud, drawTitle, drawLevelClear, drawGameOver, drawWin,
} from './render.js';
import { stageShotScene, SHOT_STEPS } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext('2d');

// Load one hall fresh: thief at the door, wardens on their patrols.
export function loadLevel(state, index) {
  state.levelIndex = index;
  state.level = parseLevel(LEVELS[index]);
  state.levelHint = LEVELS[index].hint;
  state.player = createPlayer(state.level.playerStart.col, state.level.playerStart.row);
  state.guards = LEVELS[index].guards.map((g) => createGuard(g.waypoints));
  state.maxDetection = 0;
  state.player.invulnerable = 0;
}

export function createGameState(input, audio) {
  const state = {
    screen: SCREEN_TITLE,
    levelIndex: 0,
    level: null,
    levelHint: '',
    player: null,
    guards: [],
    lives: PLAYER_LIVES,
    score: 0,
    time: 0,
    maxDetection: 0,
    ghostBonus: false,
    playerHidden: false,
    input,
    audio,
    flash: 0,
  };
  loadLevel(state, 0);
  return state;
}

function resetGame(state) {
  state.lives = PLAYER_LIVES;
  state.score = 0;
  state.time = 0;
  loadLevel(state, 0);
}

function isSolidAt(level, col, row) {
  if (col < 0 || row < 0 || col >= 32 || row >= 20) return true;
  const ch = level.def.map[row][col];
  return ch === '#' || ch === 'C';
}

function caughtNow(state) {
  state.lives -= 1;
  playCaught(state.audio);
  state.flash = 0.35;
  if (state.lives <= 0) {
    state.screen = SCREEN_GAME_OVER;
    return;
  }
  // The thief slips back to the hall's door, unseen for a breath.
  loadLevel(state, state.levelIndex);
  state.player.invulnerable = 2;
}

function updatePlay(state, dt) {
  const { player, level, input, audio } = state;
  state.time += dt;
  if (player.invulnerable > 0) player.invulnerable -= dt;

  const dir = readMoveDirection(input, player);
  movePlayer(player, level, dir.dx, dir.dy, readSneaking(input), dt);
  if (player.moving) playPlayerStep(audio, player.sneaking);

  const taken = collectShards(player, level);
  if (taken > 0) {
    state.score += SCORE_SHARD * taken;
    playPickup(audio);
  }
  state.playerHidden = playerHidden(player, level);

  let worst = 0;
  for (const guard of state.guards) {
    const before = guard.state;
    const result = updateGuard(guard, level, player, (c, r) => isSolidAt(level, c, r), dt);
    if (guard.state === GUARD_SUSPICIOUS && before !== GUARD_SUSPICIOUS) playSuspicious(audio);
    if (guard.state === GUARD_ALERTED && before !== GUARD_ALERTED) playAlarm(audio);
    worst = Math.max(worst, guard.detection);
    if (result === 'caught') {
      caughtNow(state);
      return;
    }
  }
  state.maxDetection = worst;
  playGuardSteps(audio, state.guards, player);

  if (shardsLeft(level) === 0 && onExitTile(player, level)) {
    const ghost = !state.guards.some((g) => g.everAlerted);
    state.ghostBonus = ghost;
    state.score += SCORE_LEVEL + (ghost ? SCORE_GHOST_BONUS : 0);
    if (state.levelIndex + 1 >= LEVELS.length) {
      state.screen = SCREEN_WIN;
      playWin(audio);
    } else {
      state.screen = SCREEN_LEVEL_CLEAR;
      playLevelClear(audio);
    }
  }
}

function update(state, dt) {
  if (state.screen === SCREEN_TITLE) {
    if (readConfirm(state.input)) {
      ensureAudio(state.audio);
      resetGame(state);
      state.screen = SCREEN_PLAY;
      consumeConfirm(state.input);
    }
  } else if (state.screen === SCREEN_PLAY) {
    updatePlay(state, dt);
  } else if (state.screen === SCREEN_LEVEL_CLEAR) {
    if (readConfirm(state.input)) {
      loadLevel(state, state.levelIndex + 1);
      state.screen = SCREEN_PLAY;
      consumeConfirm(state.input);
    }
  } else if (state.screen === SCREEN_GAME_OVER || state.screen === SCREEN_WIN) {
    if (readConfirm(state.input)) {
      resetGame(state);
      state.screen = SCREEN_TITLE;
      consumeConfirm(state.input);
    }
  }
  consumeClick(state.input);
}

function render(state) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (state.screen === SCREEN_TITLE) {
    drawTitle(ctx, state);
  } else if (state.screen === SCREEN_LEVEL_CLEAR) {
    drawLevelClear(ctx, state);
    drawHud(ctx, state);
  } else if (state.screen === SCREEN_GAME_OVER) {
    drawGameOver(ctx, state);
    drawHud(ctx, state);
  } else if (state.screen === SCREEN_WIN) {
    drawWin(ctx, state);
    drawHud(ctx, state);
  } else {
    drawWorld(ctx, state);
    drawHud(ctx, state);
  }
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 40, 40, ${Math.min(0.35, state.flash)})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    state.flash -= 1 / 60;
  }
}

// --- boot ---
const input = createInput(canvas);
const audio = createAudio();
const state = createGameState(input, audio);
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

// A handle for play-testing and screenshots: the shot driver and any
// debugger can drive the real game through this, never a fake frame.
window.__stealth = {
  state,
  loadLevel: (i) => loadLevel(state, i),
  update: (dt) => update(state, dt),
  render: () => render(state),
  teleportPlayer: (col, row) => {
    state.player.x = (col + 0.5) * TILE;
    state.player.y = (row + 0.5) * TILE;
  },
};

if (shot) {
  // Screenshot mode: stage the scene, step the real simulation forward a
  // fixed amount, render once. No loop, so the frame is deterministic.
  stageShotScene(state, shot, { loadLevel });
  const seconds = SHOT_STEPS[shot] ?? 0;
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i += 1) update(state, 1 / 60);
  render(state);
  window.__gameReady = true;
} else {
  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min(1 / 30, Math.max(0, (now - last) / 1000));
    last = now;
    update(state, dt);
    render(state);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  // The live game is ready once its first frame is drawn.
  requestAnimationFrame(() => {
    window.__gameReady = true;
  });
}
