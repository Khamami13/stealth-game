// Whisper Vault — the thief. One file, one job: how Wisp moves, hides and
// steals. Movement is axis-separated against the solid tiles, so sliding
// along a wall feels smooth instead of sticky.
import {
  TILE, PLAYER_RADIUS, PLAYER_WALK_SPEED, PLAYER_SNEAK_SPEED,
} from './config.js';
import { isBushTile } from './levels.js';

export function createPlayer(startCol, startRow) {
  return {
    x: (startCol + 0.5) * TILE,
    y: (startRow + 0.5) * TILE,
    vx: 0,
    vy: 0,
    facing: 0,
    sneaking: false,
    moving: false,
    stepPhase: 0,
  };
}

function circleHitsSolid(level, x, y) {
  const r = PLAYER_RADIUS - 2;
  const probes = [[-r, -r], [r, -r], [-r, r], [r, r], [0, -r], [0, r], [-r, 0], [r, 0]];
  for (const [ox, oy] of probes) {
    const col = Math.floor((x + ox) / TILE);
    const row = Math.floor((y + oy) / TILE);
    if (col < 0 || row < 0 || col >= 32 || row >= 20) return true;
    const ch = level.def.map[row][col];
    if (ch === '#' || ch === 'C') return true;
  }
  return false;
}

// Move by a normalised (dx, dy) direction for dt seconds. Returns whether
// the thief actually moved (for footsteps and the idle pose).
export function movePlayer(player, level, dx, dy, sneaking, dt) {
  player.sneaking = sneaking;
  const speed = sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
  const len = Math.hypot(dx, dy);
  if (len < 0.01) {
    player.moving = false;
    player.vx = 0;
    player.vy = 0;
    return false;
  }
  const nx = player.x + (dx / len) * speed * dt;
  const ny = player.y + (dy / len) * speed * dt;
  let moved = false;
  if (!circleHitsSolid(level, nx, player.y)) {
    player.x = nx;
    moved = true;
  }
  if (!circleHitsSolid(level, player.x, ny)) {
    player.y = ny;
    moved = true;
  }
  if (moved) {
    player.facing = Math.atan2(dy, dx);
    player.vx = dx / len;
    player.vy = dy / len;
    player.moving = true;
    player.stepPhase += dt * (sneaking ? 7 : 11);
  } else {
    player.moving = false;
  }
  return moved;
}

// Is the thief standing in a bush right now (hidden from every cone)?
export function playerHidden(player, level) {
  return isBushTile(level, Math.floor(player.x / TILE), Math.floor(player.y / TILE));
}

// Pick up any shard the thief touches. Returns how many were taken.
export function collectShards(player, level) {
  let taken = 0;
  for (const shard of level.shards) {
    if (shard.taken) continue;
    const sx = (shard.col + 0.5) * TILE;
    const sy = (shard.row + 0.5) * TILE;
    if (Math.hypot(player.x - sx, player.y - sy) < TILE * 0.75) {
      shard.taken = true;
      taken += 1;
    }
  }
  return taken;
}

export function shardsLeft(level) {
  return level.shards.filter((s) => !s.taken).length;
}

// Is the thief on the exit tile? The door only opens once every shard is taken.
export function onExitTile(player, level) {
  const col = Math.floor(player.x / TILE);
  const row = Math.floor(player.y / TILE);
  return level.exit && col === level.exit.col && row === level.exit.row;
}
