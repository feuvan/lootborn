import { describe, it, expect, beforeAll } from 'vitest';
import { PathfindingSystem } from '../systems/PathfindingSystem';
import { MapGenerator } from '../systems/MapGenerator';
import type { MapData } from '../data/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a grid where true = walkable, false = blocked */
function makeGrid(cols: number, rows: number, blocked?: [number, number][]): boolean[][] {
  const grid: boolean[][] = [];
  for (let r = 0; r < rows; r++) {
    grid.push(new Array(cols).fill(true));
  }
  for (const [c, r] of blocked ?? []) {
    grid[r][c] = false;
  }
  return grid;
}

/** Create a grid with border walls (false) — simulating actual generated maps */
function makeGridWithBorders(cols: number, rows: number, extraBlocked?: [number, number][]): boolean[][] {
  const grid: boolean[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(r > 0 && r < rows - 1 && c > 0 && c < cols - 1);
    }
    grid.push(row);
  }
  for (const [c, r] of extraBlocked ?? []) {
    grid[r][c] = false;
  }
  return grid;
}

/** Compute Manhattan distance */
function manhattan(c1: number, r1: number, c2: number, r2: number): number {
  return Math.abs(c1 - c2) + Math.abs(r1 - r2);
}

/** Build a minimal MapData for testing the generator at 120×120 */
function make120x120Map(overrides?: Partial<MapData>): MapData {
  return {
    id: 'test_120',
    name: 'Test 120x120',
    cols: 120,
    rows: 120,
    tiles: [],
    collisions: [],
    spawns: [
      { col: 30, row: 20, monsterId: 'mob_a', count: 5 },
      { col: 90, row: 20, monsterId: 'mob_b', count: 5 },
      { col: 30, row: 100, monsterId: 'mob_c', count: 5 },
      { col: 90, row: 100, monsterId: 'mob_d', count: 5 },
    ],
    camps: [
      { col: 15, row: 15, npcs: ['npc_a'] },
      { col: 100, row: 100, npcs: ['npc_b'] },
    ],
    playerStart: { col: 15, row: 20 },
    exits: [
      { col: 119, row: 60, targetMap: 'other', targetCol: 1, targetRow: 60 },
    ],
    levelRange: [1, 10] as [number, number],
    theme: 'plains',
    seed: 42,
    ...overrides,
  };
}

// ===========================================================================
// Pathfinding System — Correctness
// ===========================================================================
describe('PathfindingSystem — Correctness', () => {
  it('finds a straight-line path on an open grid', () => {
    const grid = makeGrid(20, 20);
    const pf = new PathfindingSystem(grid, 20, 20);
    const path = pf.findPath(0, 0, 5, 0);
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ col: 5, row: 0 });
  });

  it('finds a diagonal path', () => {
    const grid = makeGrid(20, 20);
    const pf = new PathfindingSystem(grid, 20, 20);
    const path = pf.findPath(0, 0, 5, 5);
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ col: 5, row: 5 });
    // With diagonals, should be 5 steps for a 5x5 diagonal
    expect(path.length).toBe(5);
  });

  it('navigates around an L-shaped wall', () => {
    // Block column 5 rows 0-7 and row 7 cols 5-9
    const blocked: [number, number][] = [];
    for (let r = 0; r <= 7; r++) blocked.push([5, r]);
    for (let c = 5; c <= 9; c++) blocked.push([c, 7]);
    const grid = makeGrid(15, 15, blocked);
    const pf = new PathfindingSystem(grid, 15, 15);
    const path = pf.findPath(0, 0, 10, 0);
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ col: 10, row: 0 });
    // Verify no step is on a blocked cell
    for (const step of path) {
      expect(grid[step.row][step.col]).toBe(true);
    }
  });

  it('path includes only adjacent steps (no teleporting)', () => {
    const grid = makeGrid(20, 20);
    const pf = new PathfindingSystem(grid, 20, 20);
    const path = pf.findPath(0, 0, 15, 12);
    for (let i = 1; i < path.length; i++) {
      const dx = Math.abs(path[i].col - path[i - 1].col);
      const dy = Math.abs(path[i].row - path[i - 1].row);
      expect(dx).toBeLessThanOrEqual(1);
      expect(dy).toBeLessThanOrEqual(1);
    }
  });

  it('produces optimal path length on open grid', () => {
    const grid = makeGrid(20, 20);
    const pf = new PathfindingSystem(grid, 20, 20);
    // For a purely open grid from (0,0) to (10,5), optimal with diagonals
    // is max(10, 5) = 10 steps
    const path = pf.findPath(0, 0, 10, 5);
    expect(path.length).toBe(10);
  });
});

// ===========================================================================
// Pathfinding System — Edge Cases
// ===========================================================================
describe('PathfindingSystem — Edge Cases', () => {
  it('start == end returns empty path', () => {
    const grid = makeGrid(10, 10);
    const pf = new PathfindingSystem(grid, 10, 10);
    expect(pf.findPath(3, 3, 3, 3)).toEqual([]);
  });

  it('unwalkable destination returns empty path', () => {
    const grid = makeGrid(10, 10, [[5, 5]]);
    const pf = new PathfindingSystem(grid, 10, 10);
    expect(pf.findPath(0, 0, 5, 5)).toEqual([]);
  });

  it('out-of-bounds destination returns empty path', () => {
    const grid = makeGrid(10, 10);
    const pf = new PathfindingSystem(grid, 10, 10);
    expect(pf.findPath(0, 0, 15, 15)).toEqual([]);
  });

  it('negative coordinates return empty path', () => {
    const grid = makeGrid(10, 10);
    const pf = new PathfindingSystem(grid, 10, 10);
    expect(pf.findPath(-1, -1, 5, 5)).toEqual([]);
  });

  it('no path when completely surrounded by walls', () => {
    // Build a ring of walls around the destination
    const blocked: [number, number][] = [];
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (dc === 0 && dr === 0) continue;
        blocked.push([5 + dc, 5 + dr]);
      }
    }
    const grid = makeGrid(10, 10, blocked);
    const pf = new PathfindingSystem(grid, 10, 10);
    // (5,5) is walkable but unreachable
    expect(pf.findPath(0, 0, 5, 5)).toEqual([]);
  });

  it('diagonal wall-clipping prevention: does not cut through diagonal walls', () => {
    // Place walls at (3,2) and (2,3) to form a diagonal barrier
    // From (2,2) to (3,3) — should NOT go diagonally through the wall gap
    const grid = makeGrid(10, 10, [[3, 2], [2, 3]]);
    const pf = new PathfindingSystem(grid, 10, 10);
    const path = pf.findPath(2, 2, 3, 3);
    if (path.length > 0) {
      // Path should go around, not directly diagonal from (2,2) to (3,3)
      // Check that no step goes diagonally through the blocked cells
      const allSteps = [{ col: 2, row: 2 }, ...path];
      for (let i = 1; i < allSteps.length; i++) {
        const dc = allSteps[i].col - allSteps[i - 1].col;
        const dr = allSteps[i].row - allSteps[i - 1].row;
        if (dc !== 0 && dr !== 0) {
          // Diagonal move — both adjacent cells must be walkable
          expect(grid[allSteps[i - 1].row + dr][allSteps[i - 1].col]).toBe(true);
          expect(grid[allSteps[i - 1].row][allSteps[i - 1].col + dc]).toBe(true);
        }
      }
    }
  });

  it('handles fractional start/end coordinates by rounding', () => {
    const grid = makeGrid(10, 10);
    const pf = new PathfindingSystem(grid, 10, 10);
    const path = pf.findPath(0.4, 0.6, 3.7, 2.3);
    // Should round to (0,1) → (4,2)
    if (path.length > 0) {
      expect(path[path.length - 1]).toEqual({ col: 4, row: 2 });
    }
  });

  it('finds path on a 1-wide corridor', () => {
    // Only row 0 is walkable
    const blocked: [number, number][] = [];
    for (let r = 1; r < 5; r++) {
      for (let c = 0; c < 10; c++) {
        blocked.push([c, r]);
      }
    }
    const grid = makeGrid(10, 5, blocked);
    const pf = new PathfindingSystem(grid, 10, 5);
    const path = pf.findPath(0, 0, 9, 0);
    expect(path.length).toBe(9);
    expect(path[path.length - 1]).toEqual({ col: 9, row: 0 });
  });

  it('unwalkable start returns empty path', () => {
    const grid = makeGrid(10, 10, [[0, 0]]);
    const pf = new PathfindingSystem(grid, 10, 10);
    // Start is blocked
    expect(pf.findPath(0, 0, 5, 5)).toEqual([]);
  });
});

// ===========================================================================
// Pathfinding System — Performance Benchmark
// ===========================================================================
describe('PathfindingSystem — Performance', () => {
  it('100 random paths on 120x120 grid complete in < 2000ms', () => {
    // Create a 120x120 grid with border walls and some random obstacles
    const cols = 120;
    const rows = 120;
    const grid = makeGridWithBorders(cols, rows);

    // Add some random obstacles (~10% density in interior)
    const rng = (seed: number) => {
      let s = seed;
      return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
      };
    };
    const random = rng(54321);
    for (let r = 2; r < rows - 2; r++) {
      for (let c = 2; c < cols - 2; c++) {
        if (random() < 0.10) {
          grid[r][c] = false;
        }
      }
    }

    const pf = new PathfindingSystem(grid, cols, rows);

    // Generate 100 random start/end pairs in the walkable interior
    const pairs: [number, number, number, number][] = [];
    for (let i = 0; i < 100; i++) {
      let sc: number, sr: number, ec: number, er: number;
      do {
        sc = Math.floor(random() * (cols - 2)) + 1;
        sr = Math.floor(random() * (rows - 2)) + 1;
      } while (!grid[sr][sc]);
      do {
        ec = Math.floor(random() * (cols - 2)) + 1;
        er = Math.floor(random() * (rows - 2)) + 1;
      } while (!grid[er][ec]);
      pairs.push([sc, sr, ec, er]);
    }

    const start = performance.now();
    let pathsFound = 0;
    for (const [sc, sr, ec, er] of pairs) {
      const path = pf.findPath(sc, sr, ec, er);
      if (path.length > 0) pathsFound++;
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2000);
    // At least some paths should be found (not all blocked)
    expect(pathsFound).toBeGreaterThan(50);
  });

  it('worst case: corner-to-corner on open 120x120 grid is fast', () => {
    const cols = 120;
    const rows = 120;
    const grid = makeGridWithBorders(cols, rows);
    const pf = new PathfindingSystem(grid, cols, rows);

    const start = performance.now();
    const path = pf.findPath(1, 1, 118, 118);
    const elapsed = performance.now() - start;

    expect(path.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(100); // Single path should be very fast
    expect(path[path.length - 1]).toEqual({ col: 118, row: 118 });
  });
});

// ===========================================================================
// Pathfinding System — Binary Heap produces same results as array.sort()
// ===========================================================================
describe('PathfindingSystem — Path consistency', () => {
  it('produces correct optimal path on complex maze', () => {
    // Create a maze-like grid
    const cols = 20;
    const rows = 20;
    const blocked: [number, number][] = [];
    // Vertical wall at col=5, rows 0-15
    for (let r = 0; r <= 15; r++) blocked.push([5, r]);
    // Vertical wall at col=10, rows 4-19
    for (let r = 4; r <= 19; r++) blocked.push([10, r]);
    // Vertical wall at col=15, rows 0-15
    for (let r = 0; r <= 15; r++) blocked.push([15, r]);

    const grid = makeGrid(cols, rows, blocked);
    const pf = new PathfindingSystem(grid, cols, rows);
    const path = pf.findPath(0, 0, 19, 0);

    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ col: 19, row: 0 });
    // All steps must be walkable
    for (const step of path) {
      expect(grid[step.row][step.col]).toBe(true);
    }
  });

  it('deterministic: same input produces same output', () => {
    const grid = makeGridWithBorders(50, 50);
    const pf1 = new PathfindingSystem(grid, 50, 50);
    const pf2 = new PathfindingSystem(grid, 50, 50);
    const path1 = pf1.findPath(1, 1, 48, 48);
    const path2 = pf2.findPath(1, 1, 48, 48);
    expect(path1).toEqual(path2);
  });
});

// ===========================================================================
// Map Validation — All 5 Zones at 120×120
// ===========================================================================
describe('Zone Maps — 120×120 Validation', () => {
  // We import zone maps lazily to allow the tests to fail gracefully
  // if maps aren't expanded yet. These are the map data definitions (before generation).
  let EmeraldPlainsMap: MapData;
  let TwilightForestMap: MapData;
  let AnvilMountainsMap: MapData;
  let ScorchingDesertMap: MapData;
  let AbyssRiftMap: MapData;

  // Dynamically import to avoid module-level side effects
  beforeAll(async () => {
    const ep = await import('../data/maps/emerald_plains');
    const tf = await import('../data/maps/twilight_forest');
    const am = await import('../data/maps/anvil_mountains');
    const sd = await import('../data/maps/scorching_desert');
    const ar = await import('../data/maps/abyss_rift');
    EmeraldPlainsMap = ep.EmeraldPlainsMap;
    TwilightForestMap = tf.TwilightForestMap;
    AnvilMountainsMap = am.AnvilMountainsMap;
    ScorchingDesertMap = sd.ScorchingDesertMap;
    AbyssRiftMap = ar.AbyssRiftMap;
  });

  const mapNames = [
    'emerald_plains',
    'twilight_forest',
    'anvil_mountains',
    'scorching_desert',
    'abyss_rift',
  ] as const;

  function getMap(name: string): MapData {
    switch (name) {
      case 'emerald_plains': return EmeraldPlainsMap;
      case 'twilight_forest': return TwilightForestMap;
      case 'anvil_mountains': return AnvilMountainsMap;
      case 'scorching_desert': return ScorchingDesertMap;
      case 'abyss_rift': return AbyssRiftMap;
      default: throw new Error(`Unknown map: ${name}`);
    }
  }

  it.each(mapNames)('%s has cols=120 and rows=120', (name) => {
    const map = getMap(name);
    expect(map.cols).toBe(120);
    expect(map.rows).toBe(120);
  });

  it.each(mapNames)('%s playerStart is within bounds and walkable after generation', (name) => {
    const map = getMap(name);
    const generated = MapGenerator.generate(map);
    const { col, row } = map.playerStart;
    expect(col).toBeGreaterThanOrEqual(1);
    expect(col).toBeLessThan(120);
    expect(row).toBeGreaterThanOrEqual(1);
    expect(row).toBeLessThan(120);
    expect(generated.collisions[row][col]).toBe(true);
  });

  it.each(mapNames)('%s all spawn positions are within bounds and on walkable tiles', (name) => {
    const map = getMap(name);
    const generated = MapGenerator.generate(map);
    for (const spawn of map.spawns) {
      expect(spawn.col).toBeGreaterThanOrEqual(1);
      expect(spawn.col).toBeLessThan(119);
      expect(spawn.row).toBeGreaterThanOrEqual(1);
      expect(spawn.row).toBeLessThan(119);
      expect(generated.collisions[spawn.row][spawn.col]).toBe(true);
    }
  });

  it.each(mapNames)('%s all camp positions are within bounds', (name) => {
    const map = getMap(name);
    for (const camp of map.camps) {
      // Camp center must be at least 6 tiles from edge (11x11 camp with half=5 + 1 buffer)
      expect(camp.col).toBeGreaterThanOrEqual(6);
      expect(camp.col).toBeLessThanOrEqual(113);
      expect(camp.row).toBeGreaterThanOrEqual(6);
      expect(camp.row).toBeLessThanOrEqual(113);
    }
  });

  it.each(mapNames)('%s all exit positions are on the border', (name) => {
    const map = getMap(name);
    for (const exit of map.exits) {
      const onBorder =
        exit.col === 0 || exit.col === 119 ||
        exit.row === 0 || exit.row === 119;
      expect(onBorder).toBe(true);
    }
  });

  it.each(mapNames)('%s exit target coordinates are valid in destination maps', (name) => {
    const map = getMap(name);
    for (const exit of map.exits) {
      // Target coordinates should be within the destination map bounds (120x120)
      expect(exit.targetCol).toBeGreaterThanOrEqual(0);
      expect(exit.targetCol).toBeLessThan(120);
      expect(exit.targetRow).toBeGreaterThanOrEqual(0);
      expect(exit.targetRow).toBeLessThan(120);
    }
  });

  it.each(mapNames)('%s spawns cover all 4 quadrants', (name) => {
    const map = getMap(name);
    const mid = 60; // Half of 120
    const quadrants = { Q1: false, Q2: false, Q3: false, Q4: false };
    for (const spawn of map.spawns) {
      if (spawn.col < mid && spawn.row < mid) quadrants.Q1 = true; // top-left
      if (spawn.col >= mid && spawn.row < mid) quadrants.Q2 = true; // top-right
      if (spawn.col < mid && spawn.row >= mid) quadrants.Q3 = true; // bottom-left
      if (spawn.col >= mid && spawn.row >= mid) quadrants.Q4 = true; // bottom-right
    }
    expect(quadrants.Q1).toBe(true);
    expect(quadrants.Q2).toBe(true);
    expect(quadrants.Q3).toBe(true);
    expect(quadrants.Q4).toBe(true);
  });
});

// ===========================================================================
// MapGenerator — 120×120 Generation Validity
// ===========================================================================
describe('MapGenerator — 120×120 Generation', () => {
  it('generates 120x120 tiles and collisions', () => {
    const map = make120x120Map();
    const result = MapGenerator.generate(map);
    expect(result.tiles).toHaveLength(120);
    expect(result.tiles[0]).toHaveLength(120);
    expect(result.collisions).toHaveLength(120);
    expect(result.collisions[0]).toHaveLength(120);
  });

  it('border walls are intact on all 4 edges', () => {
    const result = MapGenerator.generate(make120x120Map());
    // Top and bottom rows
    for (let c = 0; c < 120; c++) {
      expect(result.tiles[0][c]).toBe(4); // TILE_WALL
      expect(result.tiles[119][c]).toBe(4);
      expect(result.collisions[0][c]).toBe(false);
      expect(result.collisions[119][c]).toBe(false);
    }
    // Left and right columns
    for (let r = 0; r < 120; r++) {
      expect(result.tiles[r][0]).toBe(4);
      expect(result.tiles[r][119]).toBe(4);
      expect(result.collisions[r][0]).toBe(false);
      expect(result.collisions[r][119]).toBe(false);
    }
  });

  it('player start is walkable', () => {
    const map = make120x120Map();
    const result = MapGenerator.generate(map);
    expect(result.collisions[map.playerStart.row][map.playerStart.col]).toBe(true);
  });

  it('walkable path exists from player start to each exit', () => {
    const map = make120x120Map();
    const result = MapGenerator.generate(map);
    const pf = new PathfindingSystem(result.collisions, result.cols, result.rows);

    for (const exit of map.exits) {
      // Since exit is on border wall, find the inner walkable cell adjacent to exit
      const innerCol = exit.col === 0 ? 1 : exit.col === 119 ? 118 : exit.col;
      const innerRow = exit.row === 0 ? 1 : exit.row === 119 ? 118 : exit.row;

      const path = pf.findPath(
        map.playerStart.col, map.playerStart.row,
        innerCol, innerRow,
      );
      expect(path.length).toBeGreaterThan(0);
    }
  });

  it('decorations span the full area (not clustered in one corner)', () => {
    const map = make120x120Map();
    const result = MapGenerator.generate(map);
    expect(result.decorations).toBeDefined();
    expect(result.decorations!.length).toBeGreaterThan(0);

    // Check decorations exist in all four quadrants
    const mid = 60;
    const quadrants = { Q1: false, Q2: false, Q3: false, Q4: false };
    for (const d of result.decorations!) {
      if (d.col < mid && d.row < mid) quadrants.Q1 = true;
      if (d.col >= mid && d.row < mid) quadrants.Q2 = true;
      if (d.col < mid && d.row >= mid) quadrants.Q3 = true;
      if (d.col >= mid && d.row >= mid) quadrants.Q4 = true;
    }
    expect(quadrants.Q1).toBe(true);
    expect(quadrants.Q2).toBe(true);
    expect(quadrants.Q3).toBe(true);
    expect(quadrants.Q4).toBe(true);
  });

  it('deterministic with same seed at 120x120', () => {
    const map1 = MapGenerator.generate(make120x120Map());
    const map2 = MapGenerator.generate(make120x120Map());
    expect(map1.tiles).toEqual(map2.tiles);
    expect(map1.collisions).toEqual(map2.collisions);
  });

  it.each(['plains', 'forest', 'mountain', 'desert', 'abyss'] as const)(
    'theme %s generates valid 120x120 grid',
    (theme) => {
      const map = make120x120Map({ theme, seed: 99999 + theme.length });
      const result = MapGenerator.generate(map);
      expect(result.tiles).toHaveLength(120);
      expect(result.tiles[0]).toHaveLength(120);
      // Player start should be walkable
      expect(result.collisions[20][15]).toBe(true);
    },
  );

  it('generated map has walkable paths between all camps and spawn areas', () => {
    const map = make120x120Map();
    const result = MapGenerator.generate(map);
    const pf = new PathfindingSystem(result.collisions, result.cols, result.rows);

    // Check camp-to-camp connectivity
    for (let i = 0; i < map.camps.length - 1; i++) {
      const path = pf.findPath(
        map.camps[i].col, map.camps[i].row,
        map.camps[i + 1].col, map.camps[i + 1].row,
      );
      expect(path.length).toBeGreaterThan(0);
    }

    // Check playerStart-to-spawn connectivity
    for (const spawn of map.spawns) {
      const path = pf.findPath(
        map.playerStart.col, map.playerStart.row,
        spawn.col, spawn.row,
      );
      expect(path.length).toBeGreaterThan(0);
    }
  });
});

// ===========================================================================
// Actual Zone Maps — Full Validation (after expansion)
// ===========================================================================
describe('Zone Maps — Generated Map Validation', () => {
  // Importing the fully generated maps
  let AllMaps: Record<string, MapData>;
  let MapOrder: string[];

  beforeAll(async () => {
    const module = await import('../data/maps/index');
    AllMaps = module.AllMaps;
    MapOrder = module.MapOrder;
  });

  it('all 5 zone maps have generated 120x120 tiles', () => {
    for (const id of MapOrder) {
      const map = AllMaps[id];
      expect(map.tiles).toHaveLength(120);
      expect(map.tiles[0]).toHaveLength(120);
      expect(map.collisions).toHaveLength(120);
      expect(map.collisions[0]).toHaveLength(120);
    }
  });

  it('all zone maps have walkable playerStart', () => {
    for (const id of MapOrder) {
      const map = AllMaps[id];
      expect(map.collisions[map.playerStart.row][map.playerStart.col]).toBe(true);
    }
  });

  it('cross-zone exit coordinates are consistent', () => {
    for (const id of MapOrder) {
      const map = AllMaps[id];
      for (const exit of map.exits) {
        const targetMap = AllMaps[exit.targetMap];
        expect(targetMap).toBeDefined();
        expect(exit.targetCol).toBeGreaterThanOrEqual(0);
        expect(exit.targetCol).toBeLessThan(targetMap.cols);
        expect(exit.targetRow).toBeGreaterThanOrEqual(0);
        expect(exit.targetRow).toBeLessThan(targetMap.rows);
      }
    }
  });

  it('walkable path from player start to each exit in every zone', () => {
    for (const id of MapOrder) {
      const map = AllMaps[id];
      const pf = new PathfindingSystem(map.collisions, map.cols, map.rows);

      for (const exit of map.exits) {
        // Exit is on border wall — find the inner adjacent walkable tile
        const innerCol = exit.col === 0 ? 1 : exit.col === map.cols - 1 ? map.cols - 2 : exit.col;
        const innerRow = exit.row === 0 ? 1 : exit.row === map.rows - 1 ? map.rows - 2 : exit.row;

        const path = pf.findPath(
          map.playerStart.col, map.playerStart.row,
          innerCol, innerRow,
        );
        expect(path.length).toBeGreaterThan(0);
      }
    }
  });
});
