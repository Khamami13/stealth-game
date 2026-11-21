// Whisper Vault — staged screenshot scenes. One file, one job: put a fresh
// game into a photogenic, fully real state for ?shot=start|play|alarm|win.
// Nothing here is faked: each scene is the real simulation, teleported to
// a chosen moment and then stepped forward, so the frame is one a player
// could actually reach.
import { TILE } from './config.js';
import { SCREEN_PLAY, SCREEN_WIN } from './render.js';
import { GUARD_SUSPICIOUS, GUARD_ALERTED } from './guard.js';

// How long each scene's simulation runs after staging, in seconds, so
// wardens settle mid-patrol and cones point somewhere natural.
export const SHOT_STEPS = { start: 3.5, play: 1.4, alarm: 0.5, win: 0 };

function placeOnTile(entity, col, row) {
  entity.x = (col + 0.5) * TILE;
  entity.y = (row + 0.5) * TILE;
}

// Stage one named scene on a fresh state. `helpers` carries the level
// loader from main.js so this module never owns the game loop.
export function stageShotScene(state, name, helpers) {
  if (name === 'start') {
    // Hall one, thief at the door, wardens mid-patrol, exit in view. The
    // first warden starts at the far end of its lane so its cone sweeps
    // the open chamber toward the thief.
    state.screen = SCREEN_PLAY;
    const warden = state.guards[0];
    placeOnTile(warden, 16, 7);
    warden.waypointIndex = 0;
    warden.heading = Math.PI;
    return;
  }
  if (name === 'play') {
    // The thief crouched in a bush while a warden paces past below,
    // one shard already stolen and the warden half-suspicious.
    state.screen = SCREEN_PLAY;
    placeOnTile(state.player, 13, 6);
    state.player.sneaking = true;
    state.level.shards[0].taken = true;
    state.score = 100;
    const warden = state.guards[0];
    warden.detection = 46;
    warden.state = GUARD_SUSPICIOUS;
    warden.lastSeenX = state.player.x;
    warden.lastSeenY = state.player.y;
    placeOnTile(warden, 12, 7);
    return;
  }
  if (name === 'alarm') {
    // Caught in the open: the alarm is full, the warden gives chase down
    // its own lane, the cone burns red and a life is already gone. The
    // second warden is used because its lane has a clear line of sight
    // to the thief — no crate between them.
    state.screen = SCREEN_PLAY;
    placeOnTile(state.player, 26, 12);
    state.lives = 2;
    state.score = 300;
    state.level.shards[0].taken = true;
    const warden = state.guards[1];
    warden.detection = 100;
    warden.state = GUARD_ALERTED;
    warden.blindSeconds = 0;
    warden.lastSeenX = state.player.x;
    warden.lastSeenY = state.player.y;
    placeOnTile(warden, 22, 12);
    warden.heading = 0;
    return;
  }
  if (name === 'win') {
    // Every hall crossed: the final screen over the last hall, its shards
    // all stolen so the HUD agrees with the victory.
    helpers.loadLevel(state, 2);
    for (const shard of state.level.shards) shard.taken = true;
    state.score = 2450;
    state.time = 187;
    state.screen = SCREEN_WIN;
    return;
  }
  state.screen = SCREEN_PLAY;
}
