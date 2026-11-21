// Whisper Vault — the three halls. One file, one job: level data only.
// Each map is 32 columns by 20 rows of characters:
//   '#' wall   '.' floor   'C' crate (solid, blocks sight)
//   'B' bush (hides the thief)   'P' thief start   'E' exit   '*' lumen shard
// Guard patrols are lists of [column, row] waypoints; every leg between two
// waypoints is a straight, clear lane, so a warden never gets stuck.

export const LEVELS = [
  {
    name: 'The Quiet Gallery',
    hint: 'Slip past the wardens. Bushes hide you; crates block their sight.',
    map: [
      '################################',
      '#P......#.........#............#',
      '#.......#....*....#.....B......#',
      '#..C....#.........#............#',
      '#.......#....C....#.....C......#',
      '#.......#......................#',
      '#..B....#....B....#.....B......#',
      '#.......#.........#............#',
      '#..*....#....C....#.....C......#',
      '#.......#.........#............#',
      '#.................#............#',
      '#..C....#....B....#.....B......#',
      '#.......#.........#............#',
      '#..B....#....C....#.....C......#',
      '#..*....#....B....#.....B......#',
      '#.......#.........#............#',
      '#..C....#....C....#.....C......#',
      '#.......#.........#............#',
      '#.......#....B....#..........E.#',
      '################################',
    ],
    guards: [
      { waypoints: [[10, 7], [16, 7]] },
      { waypoints: [[20, 12], [29, 12]] },
    ],
  },
  {
    name: 'The Lantern Court',
    hint: 'Three wardens walk the lanes. Cross between bands at the gaps.',
    map: [
      '################################',
      '#P....B......C......B......*...#',
      '#..............................#',
      '#..C....C......B......C....C...#',
      '#..............................#',
      '#..B....B.....*C......B....B...#',
      '#..............................#',
      '#####.#######....#########.#####',
      '#..............................#',
      '#..C.....B....C.....B......C...#',
      '#..............................#',
      '#..............................#',
      '#..B.....C....B.....C......B...#',
      '#####.#######....#########.#####',
      '#..............................#',
      '#..C....B......C*.....B....C...#',
      '#..............................#',
      '#..............................#',
      '#..B....C......B......C.....*E.#',
      '################################',
    ],
    guards: [
      { waypoints: [[2, 2], [29, 2]] },
      { waypoints: [[29, 11], [2, 11]] },
      { waypoints: [[2, 17], [29, 17]] },
    ],
  },
  {
    name: 'The Vault Heart',
    hint: 'Four wardens, five shards. The last warden circles the exit.',
    map: [
      '################################',
      '#P....B...#....*....#....B....*#',
      '#.........#.........#..........#',
      '#..C...C..#..C...C..#..C...C...#',
      '#.........#.........#..........#',
      '#..B...B..#..B...B....B...B....#',
      '#.........#.........#..........#',
      '#.........#.........#..........#',
      '#....*....#....B....#....C....*#',
      '#.........#.........#..........#',
      '#.........#.........#..........#',
      '####.####.......#####.##########',
      '#.........#.........#..........#',
      '#..C...C..#..C...C..#..C...C...#',
      '#.........#.........#..........#',
      '#..B...B..#..B...B....B...B....#',
      '#.........#.........#..........#',
      '#....*....#....B....#....C.....#',
      '#.........#.........#........E.#',
      '################################',
    ],
    guards: [
      { waypoints: [[2, 2], [8, 2]] },
      { waypoints: [[12, 7], [18, 7]] },
      { waypoints: [[22, 4], [29, 4], [29, 9], [22, 9]] },
      { waypoints: [[12, 16], [18, 16], [18, 18], [12, 18]] },
    ],
  },
];

// Turn one level's map strings into the structures the game plays with:
// a wall/crate grid, the thief's start, the exit, the shards and bushes.
export function parseLevel(def) {
  const walls = [];
  const crates = [];
  const bushes = [];
  const shards = [];
  let playerStart = null;
  let exit = null;
  for (let row = 0; row < def.map.length; row += 1) {
    for (let col = 0; col < def.map[row].length; col += 1) {
      const ch = def.map[row][col];
      if (ch === '#') walls.push([col, row]);
      else if (ch === 'C') crates.push([col, row]);
      else if (ch === 'B') bushes.push([col, row]);
      else if (ch === '*') shards.push({ col, row, taken: false });
      else if (ch === 'P') playerStart = { col, row };
      else if (ch === 'E') exit = { col, row };
    }
  }
  return { def, walls, crates, bushes, shards, playerStart, exit };
}

// Is this tile solid for walking (wall or crate)? Bushes never block.
export function isSolidTile(level, col, row) {
  if (col < 0 || row < 0 || col >= 32 || row >= 20) return true;
  const ch = level.def.map[row][col];
  return ch === '#' || ch === 'C';
}

// Does this tile block a warden's sight? Walls and crates do; bushes do not.
export function blocksSightTile(level, col, row) {
  if (col < 0 || row < 0 || col >= 32 || row >= 20) return true;
  const ch = level.def.map[row][col];
  return ch === '#' || ch === 'C';
}

export function isBushTile(level, col, row) {
  if (col < 0 || row < 0 || col >= 32 || row >= 20) return false;
  return level.def.map[row][col] === 'B';
}
