import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialGrid, type SpatialEntity } from '../systems/SpatialGrid';
import { FogOfWarCore } from '../systems/FogOfWarCore';

// Local distanceSq mirror — avoids importing Phaser-dependent IsometricUtils.
function distanceSq(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}

// ---------------------------------------------------------------------------
// Performance Integration Tests
//
// Verifies that the three perf-milestone optimisations work correctly when
// combined:
//   1. SpatialGrid + distanceSq — radius queries
//   2. FogOfWarCore dirty-tile tracking + numeric explored storage
//   3. Buff in-place splice — stacking behaviour
//
// Covers VAL-PERF-007, VAL-PERF-008, VAL-PERF-009, VAL-PERF-012, VAL-PERF-013
// ---------------------------------------------------------------------------

// ─── 1. SpatialGrid + distanceSq integration ────────────────────────────

describe('SpatialGrid + distanceSq integration', () => {
  function makeEntity(id: string, col: number, row: number): SpatialEntity {
    return { id, tileCol: col, tileRow: row };
  }

  let grid: SpatialGrid;
  let entities: SpatialEntity[];

  beforeEach(() => {
    grid = new SpatialGrid(120, 120, 16);
    entities = [];
  });

  it('queryRadius uses distanceSq internally and matches manual distanceSq check', () => {
    const center = { col: 60, row: 60 };
    const radius = 10;
    const radiusSq = radius * radius;

    // Scatter entities around the center
    const positions = [
      [60, 60], // dist 0 — inside
      [63, 64], // dist 5 — inside
      [70, 60], // dist 10 — on boundary
      [71, 60], // dist 11 — outside
      [55, 55], // dist ~7.07 — inside
      [50, 50], // dist ~14.14 — outside
      [67, 67], // dist ~9.9 — inside
      [68, 68], // dist ~11.31 — outside
    ];

    for (let i = 0; i < positions.length; i++) {
      const e = makeEntity(`m${i}`, positions[i][0], positions[i][1]);
      entities.push(e);
      grid.insert(e);
    }

    const gridResults = new Set(
      grid.queryRadius(center.col, center.row, radius).map(e => e.id),
    );

    // Manually verify each entity with distanceSq
    const manualResults = new Set<string>();
    for (const e of entities) {
      if (distanceSq(e.tileCol, e.tileRow, center.col, center.row) <= radiusSq) {
        manualResults.add(e.id);
      }
    }

    expect(gridResults).toEqual(manualResults);
  });

  it('findNearest agrees with distanceSq-based nearest search', () => {
    const monsters = [
      makeEntity('a', 65, 60),
      makeEntity('b', 62, 61),
      makeEntity('c', 58, 59),
      makeEntity('d', 90, 90),
    ];
    for (const m of monsters) grid.insert(m);

    const playerCol = 60;
    const playerRow = 60;

    const spatialNearest = grid.findNearest(playerCol, playerRow, 200);

    // Manual distanceSq search
    let bestDsq = Infinity;
    let bestEntity: SpatialEntity | null = null;
    for (const m of monsters) {
      const d = distanceSq(m.tileCol, m.tileRow, playerCol, playerRow);
      if (d < bestDsq) {
        bestDsq = d;
        bestEntity = m;
      }
    }

    expect(spatialNearest).toBe(bestEntity);
  });

  it('safe-zone check: monsters within camp radius found via grid + distanceSq', () => {
    const campCol = 60;
    const campRow = 60;
    const safeRadius = 9;
    const safeRadiusSq = safeRadius * safeRadius;

    const monsterInside = makeEntity('inside', 63, 63); // dist ~4.24
    const monsterEdge = makeEntity('edge', 60, 69);     // dist 9 — on boundary
    const monsterOut = makeEntity('out', 60, 70);        // dist 10 — outside

    grid.insert(monsterInside);
    grid.insert(monsterEdge);
    grid.insert(monsterOut);

    const nearCamp = grid.queryRadius(campCol, campRow, safeRadius);
    const nearCampIds = new Set(nearCamp.map(e => e.id));

    // Verify with distanceSq
    expect(distanceSq(63, 63, campCol, campRow) <= safeRadiusSq).toBe(true);
    expect(nearCampIds.has('inside')).toBe(true);

    expect(distanceSq(60, 69, campCol, campRow) <= safeRadiusSq).toBe(true);
    expect(nearCampIds.has('edge')).toBe(true);

    expect(distanceSq(60, 70, campCol, campRow) <= safeRadiusSq).toBe(false);
    expect(nearCampIds.has('out')).toBe(false);
  });

  it('AoE targeting: grid query + distanceSq filter produces correct targets', () => {
    // Simulate AoE skill at player position with additional alive filter
    type Monster = SpatialEntity & { alive: boolean };

    const monsters: Monster[] = [
      { id: 'm0', tileCol: 61, tileRow: 60, alive: true },
      { id: 'm1', tileCol: 62, tileRow: 60, alive: false },  // dead
      { id: 'm2', tileCol: 63, tileRow: 64, alive: true },    // dist 5
      { id: 'm3', tileCol: 70, tileRow: 70, alive: true },    // dist ~14 — outside
    ];
    for (const m of monsters) grid.insert(m);

    const aoeCol = 60;
    const aoeRow = 60;
    const aoeRadius = 6;

    const candidates = grid.queryRadius(aoeCol, aoeRow, aoeRadius);
    const targets = candidates.filter(e => (e as Monster).alive);

    const targetIds = new Set(targets.map(e => e.id));
    expect(targetIds.has('m0')).toBe(true);   // alive, in range
    expect(targetIds.has('m1')).toBe(false);   // dead (filtered)
    expect(targetIds.has('m2')).toBe(true);   // alive, in range
    expect(targetIds.has('m3')).toBe(false);   // out of range
  });

  it('monster movement updates spatial index and distanceSq re-evaluates correctly', () => {
    const monster = makeEntity('mover', 60, 60);
    grid.insert(monster);

    // Before move: within range of (60,60,5)
    expect(grid.queryRadius(60, 60, 5).map(e => e.id)).toContain('mover');

    // Move monster far away
    monster.tileCol = 100;
    monster.tileRow = 100;
    grid.update(monster);

    // After move: NOT within range of (60,60,5)
    expect(grid.queryRadius(60, 60, 5).map(e => e.id)).not.toContain('mover');

    // But within range of (100,100,5)
    expect(grid.queryRadius(100, 100, 5).map(e => e.id)).toContain('mover');

    // distanceSq confirms
    expect(distanceSq(100, 100, 60, 60)).toBeGreaterThan(5 * 5);
    expect(distanceSq(100, 100, 100, 100)).toBe(0);
  });
});

// ─── 2. FogOfWar dirty-tile + numeric explored tile integration ─────────

describe('FogOfWar dirty-tile + numeric explored tile integration', () => {
  const cols = 40;
  const rows = 40;
  const viewRadius = 8;

  let core: FogOfWarCore;

  beforeEach(() => {
    core = new FogOfWarCore(cols, rows, viewRadius);
  });

  it('dirty tiles correctly reflect changes when player moves to new tile', () => {
    // First update — many tiles become visible
    core.update(20, 20);
    const firstDirtyCount = core.dirty.size;
    expect(firstDirtyCount).toBeGreaterThan(0);

    // Same position — no dirty tiles produced (skipped)
    core.update(20, 20);
    // dirty set is stale from first call (update returned false)
    // Next real move clears and repopulates
    core.update(22, 22);
    expect(core.dirty.size).toBeGreaterThan(0);
    // Moving 2 tiles produces fewer dirty tiles than initial reveal
    expect(core.dirty.size).toBeLessThan(firstDirtyCount);
  });

  it('numeric Uint8Array explored state and getExploredData() are consistent', () => {
    core.update(10, 10);
    core.update(30, 30);

    const data = core.getExploredData();

    // Tiles within viewRadius of both positions should be explored
    expect(data[10][10]).toBe(true);
    expect(data[30][30]).toBe(true);

    // Far unexplored tile
    expect(data[0][39]).toBe(false);

    // isExplored() agrees with getExploredData()
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        expect(core.isExplored(c, r)).toBe(data[r][c]);
      }
    }
  });

  it('loadExploredData round-trip preserves state and dirty tracking resets', () => {
    core.update(15, 15);
    const exported = core.getExploredData();

    const core2 = new FogOfWarCore(cols, rows, viewRadius);
    core2.loadExploredData(exported);

    // Explored state matches
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        expect(core2.isExplored(c, r)).toBe(core.isExplored(c, r));
      }
    }

    // After load, next update should produce dirty tiles (fresh render needed)
    const changed = core2.update(15, 15);
    expect(changed).toBe(true);
    expect(core2.dirty.size).toBeGreaterThan(0);
  });

  it('dirty tiles include both revealed and de-revealed tiles on player move', () => {
    core.update(10, 10);
    const revealedAtFirst = new Set<number>();
    for (const idx of core.dirty) revealedAtFirst.add(idx);

    // Move far enough that some first-revealed tiles go out of view
    core.update(30, 30);

    // Some dirty tiles should correspond to tiles near (10,10) that lost visibility
    let foundOldRegionDirty = false;
    for (const idx of core.dirty) {
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      const distToOld = Math.sqrt((c - 10) ** 2 + (r - 10) ** 2);
      if (distToOld <= viewRadius + 3) {
        foundOldRegionDirty = true;
        break;
      }
    }
    expect(foundOldRegionDirty).toBe(true);

    // Some dirty tiles should be near (30,30) — newly revealed
    let foundNewRegionDirty = false;
    for (const idx of core.dirty) {
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      const distToNew = Math.sqrt((c - 30) ** 2 + (r - 30) ** 2);
      if (distToNew <= viewRadius) {
        foundNewRegionDirty = true;
        break;
      }
    }
    expect(foundNewRegionDirty).toBe(true);
  });

  it('explored tiles persist after zone transition simulation (save+load)', () => {
    // Simulate exploring zone
    core.update(10, 10);
    core.update(20, 20);

    // Simulate zone transition: export state
    const saved = core.getExploredData();

    // Create fresh core (new zone instance)
    const newCore = new FogOfWarCore(cols, rows, viewRadius);
    newCore.loadExploredData(saved);

    // Player returns to previously explored area
    newCore.update(10, 10);

    // Old explored tiles should still be explored
    expect(newCore.isExplored(10, 10)).toBe(true);
    expect(newCore.isExplored(20, 20)).toBe(true);

    // Dirty set should reflect current visibility state
    expect(newCore.dirty.size).toBeGreaterThan(0);
  });

  it('getAlpha returns correct values for explored vs unexplored tiles', () => {
    core.update(20, 20);

    // Center tile — fully visible, alpha = 0
    expect(core.getAlpha(20, 20)).toBeCloseTo(0, 1);

    // Far unexplored tile — alpha = 0.85
    expect(core.getAlpha(0, 0)).toBeCloseTo(0.85, 1);

    // Explored tile outside view radius — intermediate alpha
    core.update(10, 10); // explore around (10,10)
    core.update(20, 20); // move back — (10,10) is now out of view but explored
    const alpha = core.getAlpha(10, 10);
    expect(alpha).toBeGreaterThan(0);
    expect(alpha).toBeLessThan(0.85);
  });
});

// ─── 3. Buff in-place splice + stacking behaviour ──────────────────────

describe('Buff in-place splice stacking integration', () => {
  interface Buff {
    stat: string;
    value: number;
    duration: number;
    startTime: number;
    source: string;
  }

  /**
   * Reverse-iteration splice — the optimised buff expiry from
   * perf-update-loop-optimization.
   */
  function expireBuffsInPlace(buffs: Buff[], time: number): void {
    for (let i = buffs.length - 1; i >= 0; i--) {
      if (time - buffs[i].startTime >= buffs[i].duration) {
        buffs.splice(i, 1);
      }
    }
  }

  /** Compute total bonus for a stat from active buffs. */
  function totalBuff(buffs: Buff[], stat: string): number {
    let total = 0;
    for (const b of buffs) {
      if (b.stat === stat) total += b.value;
    }
    return total;
  }

  it('multiple buffs of the same stat stack additively', () => {
    const buffs: Buff[] = [
      { stat: 'attack', value: 10, duration: 5000, startTime: 0, source: 'potion' },
      { stat: 'attack', value: 5, duration: 8000, startTime: 1000, source: 'aura' },
      { stat: 'attack', value: 3, duration: 3000, startTime: 2000, source: 'shrine' },
    ];

    expect(totalBuff(buffs, 'attack')).toBe(18);

    // At time 5000: shrine (3s from t=2000) AND potion (5s from t=0) both expire
    expireBuffsInPlace(buffs, 5000);
    expect(totalBuff(buffs, 'attack')).toBe(5); // only aura remains

    // At time 9000: aura (8s from t=1000) expires
    expireBuffsInPlace(buffs, 9000);
    expect(totalBuff(buffs, 'attack')).toBe(0);
    expect(buffs).toHaveLength(0);
  });

  it('different stats stack independently', () => {
    const buffs: Buff[] = [
      { stat: 'attack', value: 10, duration: 5000, startTime: 0, source: 'a' },
      { stat: 'defense', value: 20, duration: 5000, startTime: 0, source: 'b' },
      { stat: 'speed', value: 5, duration: 3000, startTime: 0, source: 'c' },
    ];

    expect(totalBuff(buffs, 'attack')).toBe(10);
    expect(totalBuff(buffs, 'defense')).toBe(20);
    expect(totalBuff(buffs, 'speed')).toBe(5);

    // Speed expires
    expireBuffsInPlace(buffs, 3000);
    expect(totalBuff(buffs, 'attack')).toBe(10);
    expect(totalBuff(buffs, 'defense')).toBe(20);
    expect(totalBuff(buffs, 'speed')).toBe(0);
  });

  it('re-applying a buff (same stat + source) stacks correctly', () => {
    const buffs: Buff[] = [
      { stat: 'attack', value: 10, duration: 5000, startTime: 0, source: 'potion' },
    ];

    // Re-apply at t=2000 — both instances coexist
    buffs.push({ stat: 'attack', value: 10, duration: 5000, startTime: 2000, source: 'potion' });
    expect(totalBuff(buffs, 'attack')).toBe(20);

    // At t=5000: first potion expires (5s from t=0)
    expireBuffsInPlace(buffs, 5000);
    expect(totalBuff(buffs, 'attack')).toBe(10);
    expect(buffs).toHaveLength(1);

    // At t=7000: second potion expires (5s from t=2000)
    expireBuffsInPlace(buffs, 7000);
    expect(totalBuff(buffs, 'attack')).toBe(0);
    expect(buffs).toHaveLength(0);
  });

  it('splice preserves array reference (no allocation per frame)', () => {
    const buffs: Buff[] = [
      { stat: 'attack', value: 10, duration: 1000, startTime: 0, source: 'a' },
      { stat: 'defense', value: 5, duration: 2000, startTime: 0, source: 'b' },
    ];
    const ref = buffs;
    expireBuffsInPlace(buffs, 1500);
    expect(buffs).toBe(ref); // same array reference
    expect(buffs).toHaveLength(1);
    expect(buffs[0].stat).toBe('defense');
  });

  it('rapid add/expire cycle does not corrupt buff list', () => {
    const buffs: Buff[] = [];

    // Simulate 100 combat ticks with buffs being added and expiring
    for (let tick = 0; tick < 100; tick++) {
      const time = tick * 100;

      // Add a new buff every 10 ticks
      if (tick % 10 === 0) {
        buffs.push({
          stat: 'attack',
          value: 5,
          duration: 500,
          startTime: time,
          source: `tick${tick}`,
        });
      }

      expireBuffsInPlace(buffs, time);
    }

    // After 10s, all buffs with 500ms duration should be expired
    expireBuffsInPlace(buffs, 10000);
    expect(buffs).toHaveLength(0);
  });

  it('mixed duration buffs expire in correct temporal order', () => {
    const buffs: Buff[] = [
      { stat: 'a', value: 1, duration: 1000, startTime: 0, source: 's1' },
      { stat: 'b', value: 2, duration: 3000, startTime: 0, source: 's2' },
      { stat: 'c', value: 3, duration: 2000, startTime: 500, source: 's3' },
      { stat: 'd', value: 4, duration: 500, startTime: 200, source: 's4' },
    ];

    // t=700: d expires (500ms from t=200)
    expireBuffsInPlace(buffs, 700);
    expect(buffs.map(b => b.stat)).toEqual(['a', 'b', 'c']);

    // t=1000: a expires (1000ms from t=0)
    expireBuffsInPlace(buffs, 1000);
    expect(buffs.map(b => b.stat)).toEqual(['b', 'c']);

    // t=2500: c expires (2000ms from t=500)
    expireBuffsInPlace(buffs, 2500);
    expect(buffs.map(b => b.stat)).toEqual(['b']);

    // t=3000: b expires (3000ms from t=0)
    expireBuffsInPlace(buffs, 3000);
    expect(buffs).toHaveLength(0);
  });

  it('negative buff values (debuffs) stack correctly with positive buffs', () => {
    const buffs: Buff[] = [
      { stat: 'attack', value: 10, duration: 5000, startTime: 0, source: 'buff' },
      { stat: 'attack', value: -3, duration: 3000, startTime: 0, source: 'debuff' },
    ];

    expect(totalBuff(buffs, 'attack')).toBe(7);

    // Debuff expires first
    expireBuffsInPlace(buffs, 3000);
    expect(totalBuff(buffs, 'attack')).toBe(10);
  });
});

// ─── 4. Cross-system integration ────────────────────────────────────────

describe('Cross-system: all three optimizations work together', () => {
  it('spatial grid + fog + buff systems coexist without interference', () => {
    // Simulate a game tick where all three systems are active

    // 1. SpatialGrid — find nearby monsters
    const grid = new SpatialGrid(120, 120, 16);
    const monster = { id: 'm1', tileCol: 62, tileRow: 60 };
    grid.insert(monster);
    const nearby = grid.queryRadius(60, 60, 5);
    expect(nearby).toContain(monster);

    // 2. FogOfWar — update visibility
    const fog = new FogOfWarCore(120, 120, 10);
    fog.update(60, 60);
    expect(fog.isExplored(60, 60)).toBe(true);
    expect(fog.isExplored(62, 60)).toBe(true);
    expect(fog.dirty.size).toBeGreaterThan(0);

    // 3. Buff system — stack and expire buffs
    interface Buff {
      stat: string;
      value: number;
      duration: number;
      startTime: number;
    }
    const buffs: Buff[] = [
      { stat: 'attack', value: 10, duration: 5000, startTime: 0 },
      { stat: 'defense', value: 5, duration: 3000, startTime: 0 },
    ];

    // Expire at t=4000
    for (let i = buffs.length - 1; i >= 0; i--) {
      if (4000 - buffs[i].startTime >= buffs[i].duration) {
        buffs.splice(i, 1);
      }
    }
    expect(buffs).toHaveLength(1);
    expect(buffs[0].stat).toBe('attack');

    // Verify all systems still report correct state after
    expect(grid.queryRadius(60, 60, 5)).toContain(monster);
    expect(fog.isExplored(60, 60)).toBe(true);
  });

  it('zone transition scenario: fog save/load + spatial grid rebuild + buff preservation', () => {
    // --- Zone 1 ---
    const fog1 = new FogOfWarCore(120, 120, 10);
    fog1.update(60, 60);
    const fogData = fog1.getExploredData();

    const grid1 = new SpatialGrid(120, 120, 16);
    grid1.insert({ id: 'm1', tileCol: 65, tileRow: 60 });
    grid1.insert({ id: 'm2', tileCol: 70, tileRow: 70 });

    // Buffs persist across zone transitions (they're on the player)
    interface Buff {
      stat: string;
      value: number;
      duration: number;
      startTime: number;
    }
    const playerBuffs: Buff[] = [
      { stat: 'speed', value: 10, duration: 30000, startTime: 0 },
    ];

    // --- Simulate zone transition ---

    // Zone 2: new fog, loaded from save data for this zone
    const fog2 = new FogOfWarCore(80, 80, 10);
    // Fresh zone — no explored data to load (or could load from save)
    fog2.update(40, 40);
    expect(fog2.isExplored(40, 40)).toBe(true);

    // Zone 2: new spatial grid
    const grid2 = new SpatialGrid(80, 80, 16);
    grid2.insert({ id: 'z2m1', tileCol: 42, tileRow: 40 });
    const z2Nearby = grid2.queryRadius(40, 40, 5);
    expect(z2Nearby.length).toBe(1);
    expect(z2Nearby[0].id).toBe('z2m1');

    // Old grid is discarded — no stale references
    expect(grid1.size).toBe(2); // still valid but unused

    // Player buffs survive transition
    expect(playerBuffs).toHaveLength(1);
    expect(playerBuffs[0].stat).toBe('speed');

    // --- Return to Zone 1 ---
    const fog1Restored = new FogOfWarCore(120, 120, 10);
    fog1Restored.loadExploredData(fogData);
    fog1Restored.update(60, 60);

    // Previously explored tiles are still explored
    expect(fog1Restored.isExplored(60, 60)).toBe(true);
    expect(fog1Restored.isExplored(65, 60)).toBe(true);
  });
});
