// Whisper Vault — shared tuning constants for the whole game.
// One file, one job: every number the other modules agree on lives here,
// so balancing the stealth (speeds, sight, detection) never means hunting
// through the renderer or the guard brain.

export const TILE = 40;
export const COLS = 32;
export const ROWS = 20;
export const VIEW_W = COLS * TILE; // 1280
export const VIEW_H = ROWS * TILE; // 800

// Player: a quick, light-footed infiltrator. Sneaking is slower but much
// harder to spot and silent.
export const PLAYER_RADIUS = 13;
export const PLAYER_WALK_SPEED = 168; // px per second
export const PLAYER_SNEAK_SPEED = 92;
export const PLAYER_LIVES = 3;

// Guards (lantern-wardens): patrol slower than the player walks, chase
// faster than the player sneaks, so breaking line of sight matters.
export const GUARD_RADIUS = 14;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_INVESTIGATE_SPEED = 96;
export const GUARD_CHASE_SPEED = 178;
export const GUARD_PAUSE_SECONDS = 1.1;

// Sight: how far a warden sees, how wide the cone is, and how fast being
// seen fills the alarm. Close range fills it in about a second; the edge
// of the cone takes several patient seconds, so a near miss is survivable.
export const SIGHT_RANGE = 215;
export const SIGHT_RANGE_SNEAK = 150;
export const SIGHT_HALF_ANGLE = 0.66; // radians, ~38 degrees each side
export const DETECTION_GAIN = 62; // per second at point blank
export const DETECTION_DECAY = 20; // per second while unseen
export const SUSPICIOUS_AT = 32;
export const ALERTED_AT = 100;
export const CALM_BELOW = 14;
export const LOSE_SIGHT_SECONDS = 4; // alerted guard gives up after this long blind
export const CATCH_DISTANCE = 26;

// Colours: a night hall lit by lanterns. Floor is dark slate, safe shadow
// is deep blue-green, cones glow amber, danger glows red.
export const COLORS = {
  floor: '#232a33',
  floorAlt: '#20262e',
  wall: '#4a4238',
  wallTop: '#6b5f4e',
  crate: '#7a5c33',
  crateTop: '#9c7a45',
  bush: '#2e5d43',
  bushDeep: '#234735',
  exit: '#39d0a5',
  exitLocked: '#5a6b62',
  shard: '#ffd76a',
  player: '#e8f4ff',
  playerCloak: '#3f7fd0',
  guard: '#e8b23a',
  guardRobe: '#8a5a2b',
  coneCalm: 'rgba(255, 196, 66, 0.20)',
  coneSuspicious: 'rgba(255, 140, 40, 0.30)',
  coneAlerted: 'rgba(255, 60, 50, 0.34)',
  hud: '#dfe9f2',
  hudDim: '#8fa3b5',
};

// Scoring.
export const SCORE_SHARD = 100;
export const SCORE_LEVEL = 500;
export const SCORE_GHOST_BONUS = 250; // finishing a level never alerted
