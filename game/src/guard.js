// Whisper Vault — the lantern-warden. One file, one job: one guard's brain.
// A warden patrols its waypoints, grows suspicious when it glimpses the
// thief, gives chase when the alarm fills, and calms down again when the
// thief stays out of sight — so a near miss is a scare, not a sentence.
import {
  TILE, GUARD_RADIUS, GUARD_PATROL_SPEED, GUARD_INVESTIGATE_SPEED,
  GUARD_CHASE_SPEED, GUARD_PAUSE_SECONDS, SIGHT_RANGE, SIGHT_RANGE_SNEAK,
  DETECTION_GAIN, DETECTION_DECAY, SUSPICIOUS_AT, ALERTED_AT, CALM_BELOW,
  LOSE_SIGHT_SECONDS, CATCH_DISTANCE,
} from './config.js';
import { pointInVisionCone, angleDifference } from './vision.js';
import { isBushTile } from './levels.js';

export const GUARD_CALM = 'calm';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_ALERTED = 'alerted';

// Build a warden from a patrol route of [column, row] waypoints.
export function createGuard(waypoints) {
  const start = waypoints[0];
  return {
    x: (start[0] + 0.5) * TILE,
    y: (start[1] + 0.5) * TILE,
    heading: 0,
    waypoints: waypoints.map(([c, r]) => ({ x: (c + 0.5) * TILE, y: (r + 0.5) * TILE })),
    waypointIndex: 1 % waypoints.length,
    pauseLeft: 0,
    state: GUARD_CALM,
    detection: 0,
    lastSeenX: 0,
    lastSeenY: 0,
    blindSeconds: 0,
    everAlerted: false,
    stepPhase: Math.random() * Math.PI * 2,
  };
}

function turnToward(guard, targetAngle, rate, dt) {
  const diff = angleDifference(targetAngle, guard.heading);
  const step = Math.max(-rate * dt, Math.min(rate * dt, diff));
  guard.heading += step;
}

// Walk toward (tx, ty) at `speed`, sliding along walls: try the full move,
// then each axis alone, so a warden never gets stuck on a corner.
function walkToward(guard, level, tx, ty, speed, dt, isSolid) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const move = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * move;
  const ny = guard.y + (dy / dist) * move;
  guard.heading = Math.atan2(dy, dx);
  if (!circleHitsSolid(level, nx, ny, isSolid)) {
    guard.x = nx;
    guard.y = ny;
  } else if (!circleHitsSolid(level, nx, guard.y, isSolid)) {
    guard.x = nx;
  } else if (!circleHitsSolid(level, guard.x, ny, isSolid)) {
    guard.y = ny;
  } else {
    return false;
  }
  return dist - move < 4;
}

export function circleHitsSolid(level, x, y, isSolid) {
  const r = GUARD_RADIUS - 2;
  const corners = [[-r, -r], [r, -r], [-r, r], [r, r], [0, -r], [0, r], [-r, 0], [r, 0]];
  return corners.some(([ox, oy]) => isSolid(Math.floor((x + ox) / TILE), Math.floor((y + oy) / TILE)));
}

// One tick of the warden's brain. `player` carries x, y, sneaking and
// hidden (standing in a bush). Returns 'caught' when it grabs the thief.
export function updateGuard(guard, level, player, isSolid, dt) {
  const sneaking = player.sneaking;
  const range = sneaking ? SIGHT_RANGE_SNEAK : SIGHT_RANGE;
  const hidden = isBushTile(level, Math.floor(player.x / TILE), Math.floor(player.y / TILE));
  // Fresh from a catch, the thief is briefly unseen and untouchable.
  const seen = !hidden && !player.invulnerable && pointInVisionCone(level, guard.x, guard.y, guard.heading, player.x, player.y, range);

  if (seen) {
    const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
    const closeness = 1 - dist / range;
    guard.detection += DETECTION_GAIN * (0.35 + 0.65 * closeness) * (sneaking ? 0.55 : 1) * dt;
    guard.lastSeenX = player.x;
    guard.lastSeenY = player.y;
    guard.blindSeconds = 0;
  } else {
    guard.detection -= DETECTION_DECAY * dt;
    guard.blindSeconds += dt;
  }
  guard.detection = Math.max(0, Math.min(ALERTED_AT, guard.detection));

  if (guard.detection >= ALERTED_AT) {
    if (guard.state !== GUARD_ALERTED) guard.everAlerted = true;
    guard.state = GUARD_ALERTED;
  } else if (guard.detection >= SUSPICIOUS_AT) {
    guard.state = GUARD_SUSPICIOUS;
  } else if (guard.detection <= CALM_BELOW && guard.state !== GUARD_ALERTED) {
    guard.state = GUARD_CALM;
  }

  if (guard.state === GUARD_ALERTED) {
    if (guard.blindSeconds > LOSE_SIGHT_SECONDS) {
      // Lost the trail: the alarm drains and the warden goes back to
      // wondering, then to its patrol.
      guard.detection = SUSPICIOUS_AT - 1;
      guard.state = GUARD_SUSPICIOUS;
    } else {
      walkToward(guard, level, player.x, player.y, GUARD_CHASE_SPEED, dt, isSolid);
      if (!player.invulnerable && Math.hypot(player.x - guard.x, player.y - guard.y) < CATCH_DISTANCE) return 'caught';
    }
  } else if (guard.state === GUARD_SUSPICIOUS) {
    if (seen) {
      turnToward(guard, Math.atan2(player.y - guard.y, player.x - guard.x), 5, dt);
    } else {
      // Walk to where the thief was last glimpsed and look around.
      const arrived = walkToward(guard, level, guard.lastSeenX, guard.lastSeenY, GUARD_INVESTIGATE_SPEED, dt, isSolid);
      if (arrived) turnToward(guard, guard.heading + 1.6 * dt, 1.6, dt);
    }
  } else {
    // Calm: walk the patrol, pausing at each waypoint to look around.
    if (guard.pauseLeft > 0) {
      guard.pauseLeft -= dt;
      turnToward(guard, guard.heading + 0.9 * dt, 0.9, dt);
    } else {
      const target = guard.waypoints[guard.waypointIndex];
      const arrived = walkToward(guard, level, target.x, target.y, GUARD_PATROL_SPEED, dt, isSolid);
      if (arrived) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
        guard.pauseLeft = GUARD_PAUSE_SECONDS;
      }
    }
  }
  guard.stepPhase += dt * (guard.state === GUARD_ALERTED ? 11 : 6);
  return null;
}
