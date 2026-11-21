// Whisper Vault — sight math. One file, one job: answer "can this warden
// see that point?" with a cone test and a wall-aware line of sight.
import { TILE, SIGHT_HALF_ANGLE, SIGHT_RANGE } from './config.js';
import { blocksSightTile } from './levels.js';

// Shortest signed angle between two headings, in (-PI, PI].
export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

// Is the straight segment from (x0,y0) to (x1,y1) free of sight-blocking
// tiles? Sampled every 7 px, which is finer than a tile, so no wall is
// ever skipped between samples.
export function hasLineOfSight(level, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 7));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const col = Math.floor((x0 + dx * t) / TILE);
    const row = Math.floor((y0 + dy * t) / TILE);
    if (blocksSightTile(level, col, row)) return false;
  }
  return true;
}

// Full visibility test for a warden at (gx, gy) facing `heading` against a
// point (px, py): inside range, inside the cone, and a clear line of sight.
export function pointInVisionCone(level, gx, gy, heading, px, py, range = SIGHT_RANGE) {
  const dx = px - gx;
  const dy = py - gy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 1) return true;
  const angleTo = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(angleTo, heading)) > SIGHT_HALF_ANGLE) return false;
  return hasLineOfSight(level, gx, gy, px, py);
}

// The cone's outline as a polygon (for drawing, and for the "is the thief
// standing in light" glow): centre plus an arc of ray endpoints, each ray
// shortened at the first wall it meets.
export function visionConePolygon(level, gx, gy, heading, range = SIGHT_RANGE) {
  const points = [{ x: gx, y: gy }];
  const rays = 26;
  for (let i = 0; i <= rays; i += 1) {
    const a = heading - SIGHT_HALF_ANGLE + (2 * SIGHT_HALF_ANGLE * i) / rays;
    points.push(castSightRay(level, gx, gy, a, range));
  }
  return points;
}

export function castSightRay(level, gx, gy, angle, range) {
  const step = 6;
  let x = gx;
  let y = gy;
  for (let d = step; d <= range; d += step) {
    const nx = gx + Math.cos(angle) * d;
    const ny = gy + Math.sin(angle) * d;
    const col = Math.floor(nx / TILE);
    const row = Math.floor(ny / TILE);
    if (blocksSightTile(level, col, row)) break;
    x = nx;
    y = ny;
  }
  return { x, y };
}
