/**
 * Tests for the Random Dungeon System (Zone 6).
 *
 * Covers:
 * - Floor generation (5-10 floors, varying between runs)
 * - Difficulty scaling with depth (≥1.5x HP by floor 5)
 * - Boss and mid-boss placement
 * - Loot guarantees (rare+ for final boss, magic+ for mid-boss)
 * - Ephemeral run state
 * - Difficulty settings (Nightmare/Hell) apply
 * - Dungeon-exclusive legendaries
 * - Monster type variety between floors
 * - Floor map generation via MapGenerator
 */

import { describe, it, expect } from 'vitest';
import { DungeonSystem } from '../systems/DungeonSystem';
import type { DungeonFloorConfig, DungeonRunState } from '../systems/DungeonSystem';
import {
  DungeonMonsterPool,
  DungeonBossDef,
  DungeonMidBossDef,
  DungeonExclusiveMonsters,
  AllDungeonMonsters,
  DUNGEON_EXCLUSIVE_LEGENDARIES,
} from '../data/dungeonData';
import { getMonsterDef } from '../data/monsters/index';

describe('DungeonSystem — Run Creation', () => {
  it('creates a run with 5-10 floors', () => {
    // Test many seeds to verify range
    const floorCounts = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const run = DungeonSystem.createRun('normal', i * 7919 + 13);
      expect(run.totalFloors).toBeGreaterThanOrEqual(5);
      expect(run.totalFloors).toBeLessThanOrEqual(10);
      expect(run.currentFloor).toBe(1);
      expect(run.active).toBe(true);
      expect(run.difficulty).toBe('normal');
      floorCounts.add(run.totalFloors);
    }
    // With 500 varied seeds, we should see at least some variety
    expect(floorCounts.size).toBeGreaterThan(1);
  });

  it('different seeds produce different floor counts', () => {
    const results = new Map<number, number>();
    for (let i = 0; i < 200; i++) {
      const run = DungeonSystem.createRun('normal', i * 12345);
      results.set(i, run.totalFloors);
    }
    const uniqueCounts = new Set(results.values());
    expect(uniqueCounts.size).toBeGreaterThan(1);
  });

  it('run state starts on floor 1 with active=true', () => {
    const run = DungeonSystem.createRun('nightmare', 42);
    expect(run.currentFloor).toBe(1);
    expect(run.active).toBe(true);
    expect(run.difficulty).toBe('nightmare');
    expect(run.seed).toBe(42);
  });

  it('creates runs with all difficulty levels', () => {
    const normal = DungeonSystem.createRun('normal');
    const nightmare = DungeonSystem.createRun('nightmare');
    const hell = DungeonSystem.createRun('hell');
    expect(normal.difficulty).toBe('normal');
    expect(nightmare.difficulty).toBe('nightmare');
    expect(hell.difficulty).toBe('hell');
  });

  it('auto-generates seed when not provided', () => {
    const run1 = DungeonSystem.createRun('normal');
    const run2 = DungeonSystem.createRun('normal');
    // Seeds should differ (extremely unlikely to match)
    expect(run1.seed).not.toBe(run2.seed);
  });
});

describe('DungeonSystem — Floor Configuration', () => {
  it('final floor is marked as boss floor', () => {
    const run = DungeonSystem.createRun('normal', 42);
    const finalConfig = DungeonSystem.getFloorConfig(run, run.totalFloors);
    expect(finalConfig.isBossFloor).toBe(true);
    expect(finalConfig.hasMidBoss).toBe(false); // boss floor has no mid-boss
  });

  it('non-final floors are not boss floors', () => {
    const run = DungeonSystem.createRun('normal', 42);
    for (let f = 1; f < run.totalFloors; f++) {
      const config = DungeonSystem.getFloorConfig(run, f);
      expect(config.isBossFloor).toBe(false);
    }
  });

  it('mid-boss appears every 3 floors but not on floor 1 or boss floor', () => {
    // Use a seed that gives us many floors (10)
    let run: DungeonRunState | null = null;
    for (let s = 0; s < 1000; s++) {
      const candidate = DungeonSystem.createRun('normal', s);
      if (candidate.totalFloors >= 7) {
        run = candidate;
        break;
      }
    }
    expect(run).not.toBeNull();
    if (!run) return;

    const midBossFloors: number[] = [];
    for (let f = 1; f <= run.totalFloors; f++) {
      const config = DungeonSystem.getFloorConfig(run, f);
      if (config.hasMidBoss) {
        midBossFloors.push(f);
      }
    }

    // Mid-bosses on floors divisible by 3 (excluding floor 1 and boss floor)
    for (const mbf of midBossFloors) {
      expect(mbf % 3).toBe(0);
      expect(mbf).toBeGreaterThan(1);
      expect(mbf).not.toBe(run.totalFloors);
    }
  });

  it('HP multiplier is ≥1.5x by floor 5 vs floor 1', () => {
    const run = DungeonSystem.createRun('normal', 42);
    const floor1 = DungeonSystem.getFloorConfig(run, 1);
    const floor5config = DungeonSystem.getFloorConfig(run, Math.min(5, run.totalFloors));

    // Floor 1 should have 1.0x multiplier
    expect(floor1.hpMultiplier).toBeCloseTo(1.0, 1);

    // Floor 5 should have ≥1.5x multiplier
    expect(floor5config.hpMultiplier).toBeGreaterThanOrEqual(1.5);
  });

  it('damage and defense multipliers increase with depth', () => {
    const run = DungeonSystem.createRun('normal', 42);
    const floor1 = DungeonSystem.getFloorConfig(run, 1);
    const finalFloor = DungeonSystem.getFloorConfig(run, run.totalFloors);

    expect(finalFloor.damageMultiplier).toBeGreaterThan(floor1.damageMultiplier);
    expect(finalFloor.defenseMultiplier).toBeGreaterThan(floor1.defenseMultiplier);
  });

  it('each floor has 2-3 monster types', () => {
    const run = DungeonSystem.createRun('normal', 42);
    for (let f = 1; f <= run.totalFloors; f++) {
      const config = DungeonSystem.getFloorConfig(run, f);
      expect(config.monsterIds.length).toBeGreaterThanOrEqual(2);
      expect(config.monsterIds.length).toBeLessThanOrEqual(3);
      // All monster IDs should be in the pool or be boss/mid-boss
      for (const mId of config.monsterIds) {
        expect(DungeonMonsterPool).toContain(mId);
      }
    }
  });

  it('monster types vary between floors', () => {
    // Find a run with enough floors to show variation
    let run: DungeonRunState | null = null;
    for (let s = 0; s < 1000; s++) {
      const candidate = DungeonSystem.createRun('normal', s);
      if (candidate.totalFloors >= 6) {
        run = candidate;
        break;
      }
    }
    expect(run).not.toBeNull();
    if (!run) return;

    const allSets: string[] = [];
    for (let f = 1; f <= run.totalFloors; f++) {
      const config = DungeonSystem.getFloorConfig(run, f);
      allSets.push(config.monsterIds.sort().join(','));
    }
    // At least some floors should have different monster compositions
    const unique = new Set(allSets);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('spawn count range increases with depth', () => {
    const run = DungeonSystem.createRun('normal', 42);
    const floor1 = DungeonSystem.getFloorConfig(run, 1);
    const finalFloor = DungeonSystem.getFloorConfig(run, run.totalFloors);

    expect(finalFloor.spawnCountRange[0]).toBeGreaterThanOrEqual(floor1.spawnCountRange[0]);
    expect(finalFloor.spawnCountRange[1]).toBeGreaterThanOrEqual(floor1.spawnCountRange[1]);
  });
});

describe('DungeonSystem — Monster Scaling', () => {
  const baseDef = DungeonExclusiveMonsters['dungeon_shade'];

  it('scales HP correctly with depth', () => {
    const run = DungeonSystem.createRun('normal', 42);
    const config1 = DungeonSystem.getFloorConfig(run, 1);
    const config5 = DungeonSystem.getFloorConfig(run, Math.min(5, run.totalFloors));

    const scaled1 = DungeonSystem.scaleMonster(baseDef, config1, 'normal');
    const scaled5 = DungeonSystem.scaleMonster(baseDef, config5, 'normal');

    expect(scaled1.hp).toBe(baseDef.hp); // Floor 1 = 1.0x
    expect(scaled5.hp).toBeGreaterThanOrEqual(Math.round(baseDef.hp * 1.5));
  });

  it('Nightmare difficulty adds 1.5x HP multiplier', () => {
    const run = DungeonSystem.createRun('nightmare', 42);
    const config1 = DungeonSystem.getFloorConfig(run, 1);

    const scaled = DungeonSystem.scaleMonster(baseDef, config1, 'nightmare');
    expect(scaled.hp).toBe(Math.round(baseDef.hp * 1.0 * 1.5));
    expect(scaled.damage).toBe(Math.round(baseDef.damage * 1.0 * 1.5));
  });

  it('Hell difficulty adds 2x HP multiplier', () => {
    const run = DungeonSystem.createRun('hell', 42);
    const config1 = DungeonSystem.getFloorConfig(run, 1);

    const scaled = DungeonSystem.scaleMonster(baseDef, config1, 'hell');
    expect(scaled.hp).toBe(Math.round(baseDef.hp * 1.0 * 2.0));
    expect(scaled.damage).toBe(Math.round(baseDef.damage * 1.0 * 2.0));
  });

  it('exp scales with depth and difficulty', () => {
    const run = DungeonSystem.createRun('hell', 42);
    const config1 = DungeonSystem.getFloorConfig(run, 1);
    const configLast = DungeonSystem.getFloorConfig(run, run.totalFloors);

    const scaled1 = DungeonSystem.scaleMonster(baseDef, config1, 'hell');
    const scaledLast = DungeonSystem.scaleMonster(baseDef, configLast, 'hell');

    // Hell gives 3x exp
    expect(scaled1.expReward).toBe(Math.round(baseDef.expReward * 1.0 * 3.0));
    // Last floor gives more exp due to depth
    expect(scaledLast.expReward).toBeGreaterThan(scaled1.expReward);
  });

  it('gold rewards scale with depth', () => {
    const run = DungeonSystem.createRun('normal', 42);
    const config1 = DungeonSystem.getFloorConfig(run, 1);
    const configLast = DungeonSystem.getFloorConfig(run, run.totalFloors);

    const scaled1 = DungeonSystem.scaleMonster(baseDef, config1, 'normal');
    const scaledLast = DungeonSystem.scaleMonster(baseDef, configLast, 'normal');

    expect(scaledLast.goldReward[0]).toBeGreaterThanOrEqual(scaled1.goldReward[0]);
    expect(scaledLast.goldReward[1]).toBeGreaterThanOrEqual(scaled1.goldReward[1]);
  });

  it('does not mutate the original monster definition', () => {
    const run = DungeonSystem.createRun('normal', 42);
    const config = DungeonSystem.getFloorConfig(run, 5);
    const originalHp = baseDef.hp;
    DungeonSystem.scaleMonster(baseDef, config, 'normal');
    expect(baseDef.hp).toBe(originalHp);
  });
});

describe('DungeonSystem — Difficulty Multipliers', () => {
  it('normal has 1.0x multipliers', () => {
    const mult = DungeonSystem.getDifficultyMultipliers('normal');
    expect(mult.hp).toBe(1.0);
    expect(mult.damage).toBe(1.0);
    expect(mult.defense).toBe(1.0);
    expect(mult.exp).toBe(1.0);
  });

  it('nightmare has correct multipliers', () => {
    const mult = DungeonSystem.getDifficultyMultipliers('nightmare');
    expect(mult.hp).toBe(1.5);
    expect(mult.damage).toBe(1.5);
    expect(mult.exp).toBe(2.0);
  });

  it('hell has correct multipliers', () => {
    const mult = DungeonSystem.getDifficultyMultipliers('hell');
    expect(mult.hp).toBe(2.0);
    expect(mult.damage).toBe(2.0);
    expect(mult.exp).toBe(3.0);
  });
});

describe('DungeonSystem — Floor Map Generation', () => {
  it('generates a valid MapData with tiles and collisions', () => {
    const run = DungeonSystem.createRun('normal', 42);
    const config = DungeonSystem.getFloorConfig(run, 1);
    const map = DungeonSystem.generateFloorMap(config);

    expect(map.tiles.length).toBe(60);
    expect(map.tiles[0].length).toBe(60);
    expect(map.collisions.length).toBe(60);
    expect(map.collisions[0].length).toBe(60);
    expect(map.cols).toBe(60);
    expect(map.rows).toBe(60);
  });

  it('floor layouts differ between runs (different seeds)', () => {
    const run1 = DungeonSystem.createRun('normal', 111);
    const run2 = DungeonSystem.createRun('normal', 222);

    const map1 = DungeonSystem.generateFloorMap(DungeonSystem.getFloorConfig(run1, 1));
    const map2 = DungeonSystem.generateFloorMap(DungeonSystem.getFloorConfig(run2, 1));

    // Compare tile grids — they should differ
    let diffCount = 0;
    for (let r = 0; r < 60; r++) {
      for (let c = 0; c < 60; c++) {
        if (map1.tiles[r][c] !== map2.tiles[r][c]) diffCount++;
      }
    }
    expect(diffCount).toBeGreaterThan(0);
  });

  it('floor layouts differ between floors in the same run', () => {
    const run = DungeonSystem.createRun('normal', 42);
    if (run.totalFloors < 2) return;

    const map1 = DungeonSystem.generateFloorMap(DungeonSystem.getFloorConfig(run, 1));
    const map2 = DungeonSystem.generateFloorMap(DungeonSystem.getFloorConfig(run, 2));

    let diffCount = 0;
    for (let r = 0; r < 60; r++) {
      for (let c = 0; c < 60; c++) {
        if (map1.tiles[r][c] !== map2.tiles[r][c]) diffCount++;
      }
    }
    expect(diffCount).toBeGreaterThan(0);
  });

  it('non-final floor has an exit to next floor', () => {
    const run = DungeonSystem.createRun('normal', 42);
    const config = DungeonSystem.getFloorConfig(run, 1);
    const map = DungeonSystem.generateFloorMap(config);

    expect(map.exits.length).toBeGreaterThanOrEqual(1);
    expect(map.exits[0].targetMap).toBe('dungeon_floor_2');
  });

  it('final floor exit goes to abyss_rift', () => {
    const run = DungeonSystem.createRun('normal', 42);
    const config = DungeonSystem.getFloorConfig(run, run.totalFloors);
    const map = DungeonSystem.generateFloorMap(config);

    expect(map.exits.length).toBeGreaterThanOrEqual(1);
    expect(map.exits[0].targetMap).toBe('abyss_rift');
  });

  it('boss floor has boss spawn', () => {
    const run = DungeonSystem.createRun('normal', 42);
    const config = DungeonSystem.getFloorConfig(run, run.totalFloors);
    const map = DungeonSystem.generateFloorMap(config);

    const bossSpawn = map.spawns.find(s => s.monsterId === DungeonBossDef.id);
    expect(bossSpawn).toBeDefined();
    expect(bossSpawn!.count).toBe(1);
  });

  it('mid-boss floor has mid-boss spawn', () => {
    // Find a run with a mid-boss floor (floor 3+, not final)
    let run: DungeonRunState | null = null;
    for (let s = 0; s < 1000; s++) {
      const candidate = DungeonSystem.createRun('normal', s);
      if (candidate.totalFloors >= 4) {
        run = candidate;
        break;
      }
    }
    expect(run).not.toBeNull();
    if (!run) return;

    // Floor 3 should have mid-boss
    const config = DungeonSystem.getFloorConfig(run, 3);
    expect(config.hasMidBoss).toBe(true);

    const map = DungeonSystem.generateFloorMap(config);
    const midBossSpawn = map.spawns.find(s => s.monsterId === DungeonMidBossDef.id);
    expect(midBossSpawn).toBeDefined();
  });

  it('generated map has no camps', () => {
    const run = DungeonSystem.createRun('normal', 42);
    const config = DungeonSystem.getFloorConfig(run, 1);
    const map = DungeonSystem.generateFloorMap(config);
    expect(map.camps).toEqual([]);
  });

  it('player start is in a walkable area', () => {
    const run = DungeonSystem.createRun('normal', 42);
    const config = DungeonSystem.getFloorConfig(run, 1);
    const map = DungeonSystem.generateFloorMap(config);

    const { col, row } = map.playerStart;
    expect(map.collisions[row][col]).toBe(true);
  });

  it('floor name is in Chinese', () => {
    const run = DungeonSystem.createRun('normal', 42);
    const config = DungeonSystem.getFloorConfig(run, 3);
    const map = DungeonSystem.generateFloorMap(config);
    expect(map.name).toContain('深渊迷宫');
    expect(map.name).toContain('第3层');
  });

  it('theme is abyss', () => {
    const run = DungeonSystem.createRun('normal', 42);
    const config = DungeonSystem.getFloorConfig(run, 1);
    const map = DungeonSystem.generateFloorMap(config);
    expect(map.theme).toBe('abyss');
  });
});

describe('DungeonSystem — Boss Definitions', () => {
  it('final boss has elevated stats and Chinese name plate', () => {
    expect(DungeonBossDef.name).toBe('深渊之主·卡萨诺尔');
    expect(DungeonBossDef.hp).toBeGreaterThan(5000);
    expect(DungeonBossDef.damage).toBeGreaterThan(80);
    expect(DungeonBossDef.elite).toBe(true);
    expect(DungeonBossDef.bossSkills).toBeDefined();
    expect(DungeonBossDef.bossSkills!.length).toBeGreaterThanOrEqual(3);
  });

  it('mid-boss has intermediate stats', () => {
    expect(DungeonMidBossDef.name).toBe('深渊守卫');
    expect(DungeonMidBossDef.hp).toBeGreaterThan(2000);
    expect(DungeonMidBossDef.hp).toBeLessThan(DungeonBossDef.hp);
    expect(DungeonMidBossDef.elite).toBe(true);
    expect(DungeonMidBossDef.isMiniBoss).toBe(true);
  });

  it('final boss has guaranteed rare+ loot in its loot table', () => {
    const rareEntries = DungeonBossDef.lootTable?.filter(
      e => e.quality === 'rare' || e.quality === 'legendary' || e.quality === 'set'
    );
    expect(rareEntries).toBeDefined();
    expect(rareEntries!.length).toBeGreaterThan(0);
    // At least one entry with 100% drop rate at rare or above
    const guaranteed = rareEntries!.find(e => e.dropRate >= 1.0);
    expect(guaranteed).toBeDefined();
  });

  it('mid-boss has guaranteed magic+ loot (isMiniBoss=true)', () => {
    expect(DungeonMidBossDef.isMiniBoss).toBe(true);
    // LootSystem handles quality floor for mini-bosses
    const magicEntries = DungeonMidBossDef.lootTable?.filter(
      e => e.quality === 'magic' || e.quality === 'rare' || e.quality === 'legendary'
    );
    expect(magicEntries).toBeDefined();
    expect(magicEntries!.length).toBeGreaterThan(0);
  });

  it('boss loot floor is rare', () => {
    expect(DungeonSystem.getBossLootFloor()).toBe('rare');
  });

  it('mid-boss loot floor is magic', () => {
    expect(DungeonSystem.getMidBossLootFloor()).toBe('magic');
  });
});

describe('DungeonSystem — Dungeon Exclusive Items', () => {
  it('has at least 2 dungeon-exclusive legendary items', () => {
    expect(DUNGEON_EXCLUSIVE_LEGENDARIES.length).toBeGreaterThanOrEqual(2);
  });

  it('dungeon exclusives have valid base IDs', () => {
    for (const leg of DUNGEON_EXCLUSIVE_LEGENDARIES) {
      expect(leg.baseId).toBeTruthy();
      expect(leg.name).toBeTruthy();
      expect(leg.fixedAffixes.length).toBeGreaterThan(0);
      expect(leg.specialEffectDescription).toBeTruthy();
    }
  });

  it('dungeon exclusive IDs are returned by getDungeonExclusiveLegendaryIds', () => {
    const ids = DungeonSystem.getDungeonExclusiveLegendaryIds();
    expect(ids).toContain('leg_abyss_crown');
    expect(ids).toContain('leg_void_edge');
    expect(ids.length).toBe(DUNGEON_EXCLUSIVE_LEGENDARIES.length);
  });

  it('boss loot table references dungeon exclusive items', () => {
    const bossLoot = DungeonBossDef.lootTable ?? [];
    const exclusiveIds = DungeonSystem.getDungeonExclusiveLegendaryIds();
    const hasExclusive = bossLoot.some(l => l.itemId && exclusiveIds.includes(l.itemId));
    expect(hasExclusive).toBe(true);
  });
});

describe('DungeonSystem — Dungeon Monster Pool', () => {
  it('dungeon-exclusive monsters are registered', () => {
    expect(AllDungeonMonsters['dungeon_shade']).toBeDefined();
    expect(AllDungeonMonsters['dungeon_fiend']).toBeDefined();
    expect(AllDungeonMonsters[DungeonBossDef.id]).toBeDefined();
    expect(AllDungeonMonsters[DungeonMidBossDef.id]).toBeDefined();
  });

  it('dungeon monsters are findable via getMonsterDef', () => {
    expect(getMonsterDef('dungeon_shade')).toBeDefined();
    expect(getMonsterDef('dungeon_fiend')).toBeDefined();
    expect(getMonsterDef(DungeonBossDef.id)).toBeDefined();
    expect(getMonsterDef(DungeonMidBossDef.id)).toBeDefined();
  });

  it('dungeon monster pool includes both shared and exclusive IDs', () => {
    expect(DungeonMonsterPool).toContain('imp');
    expect(DungeonMonsterPool).toContain('dungeon_shade');
    expect(DungeonMonsterPool).toContain('dungeon_fiend');
  });
});

describe('DungeonSystem — Labels and UI Text', () => {
  it('floor exit label is in Chinese with correct format', () => {
    expect(DungeonSystem.getFloorExitLabel(2)).toBe('下一层: 第2层');
    expect(DungeonSystem.getFloorExitLabel(10)).toBe('下一层: 第10层');
  });

  it('dungeon portal label is in Chinese', () => {
    const label = DungeonSystem.getDungeonPortalLabel();
    expect(label).toBe('深渊迷宫入口');
  });
});

describe('DungeonSystem — Ephemeral Run State', () => {
  it('each createRun with different seed produces different total floors', () => {
    const results = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const run = DungeonSystem.createRun('normal', i * 7919);
      results.add(run.totalFloors);
    }
    // Should see multiple different floor counts
    expect(results.size).toBeGreaterThan(1);
  });

  it('re-entry with new seed creates a fresh run', () => {
    const run1 = DungeonSystem.createRun('normal', 100);
    const run2 = DungeonSystem.createRun('normal', 200);

    // Floor configs should differ
    const config1 = DungeonSystem.getFloorConfig(run1, 1);
    const config2 = DungeonSystem.getFloorConfig(run2, 1);

    // Seeds differ, so floor seeds differ
    expect(config1.seed).not.toBe(config2.seed);
  });
});

describe('DungeonSystem — Combined Scaling (Depth + Difficulty)', () => {
  it('hell difficulty floor 5 has significantly higher stats than normal floor 1', () => {
    const baseDef = DungeonExclusiveMonsters['dungeon_fiend'];
    const run = DungeonSystem.createRun('hell', 42);
    const config1Normal = DungeonSystem.getFloorConfig(run, 1);
    const config5 = DungeonSystem.getFloorConfig(run, Math.min(5, run.totalFloors));

    const normalFloor1 = DungeonSystem.scaleMonster(baseDef, config1Normal, 'normal');
    const hellFloor5 = DungeonSystem.scaleMonster(baseDef, config5, 'hell');

    // Hell + depth should give a big multiplier
    expect(hellFloor5.hp).toBeGreaterThan(normalFloor1.hp * 2);
    expect(hellFloor5.damage).toBeGreaterThan(normalFloor1.damage * 1.5);
  });

  it('boss scaled in hell has very high stats', () => {
    const run = DungeonSystem.createRun('hell', 42);
    const bossConfig = DungeonSystem.getFloorConfig(run, run.totalFloors);
    const scaledBoss = DungeonSystem.scaleMonster(DungeonBossDef, bossConfig, 'hell');

    // Boss (8000 HP) * depth (up to ~2.2x) * hell (2.0x) = ~35200
    expect(scaledBoss.hp).toBeGreaterThan(15000);
    expect(scaledBoss.damage).toBeGreaterThan(150);
  });
});
