/**
 * DungeonSystem — Manages Zone 6 procedural random dungeon runs.
 *
 * Each run generates 5-10 floors with:
 * - Procedural layouts via MapGenerator with random seeds
 * - Monster difficulty scaling with depth
 * - Final floor boss + mid-bosses every N floors
 * - Ephemeral state: exits return to Abyss Rift, re-entry starts fresh
 * - Difficulty settings (Nightmare/Hell) apply
 */

import { MapGenerator } from './MapGenerator';
import type { MapData, MapTheme, MonsterDefinition } from '../data/types';
import { DungeonMonsterPool, DungeonBossDef, DungeonMidBossDef, DUNGEON_EXCLUSIVE_LEGENDARIES } from '../data/dungeonData';

/** Seeded RNG matching MapGenerator's SeededRandom */
class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed % 2147483647;
    if (this.state <= 0) this.state += 2147483646;
  }

  next(): number {
    this.state = (this.state * 16807) % 2147483647;
    return (this.state - 1) / 2147483646;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }
}

export interface DungeonFloorConfig {
  floorNumber: number;
  totalFloors: number;
  seed: number;
  /** Monster HP multiplier based on depth (1.0 at floor 1, scaling up). */
  hpMultiplier: number;
  /** Monster damage multiplier based on depth. */
  damageMultiplier: number;
  /** Monster defense multiplier based on depth. */
  defenseMultiplier: number;
  /** Whether this is the final floor (boss floor). */
  isBossFloor: boolean;
  /** Whether this floor has a mid-boss. */
  hasMidBoss: boolean;
  /** Monster IDs to spawn on this floor. */
  monsterIds: string[];
  /** Spawn count per group. */
  spawnCountRange: [number, number];
  /** Loot quality bonus scaling with floor depth (additive bonus to quality rolls). */
  lootQualityBonus: number;
  /** Magic find bonus percentage for this floor. */
  magicFindBonus: number;
}

export interface DungeonRunState {
  /** Random seed for this run (determines floor count, layouts, monsters). */
  seed: number;
  /** Total number of floors in this run. */
  totalFloors: number;
  /** Current floor number (1-based). */
  currentFloor: number;
  /** Difficulty setting. */
  difficulty: 'normal' | 'nightmare' | 'hell';
  /** Whether the run is active. */
  active: boolean;
}

/** Static utility class for dungeon generation logic. No Phaser dependencies. */
export class DungeonSystem {
  /** Generate a new dungeon run with random seed. */
  static createRun(difficulty: 'normal' | 'nightmare' | 'hell' = 'normal', customSeed?: number): DungeonRunState {
    const seed = customSeed ?? (Date.now() ^ (Math.random() * 0xFFFFFF >>> 0));
    const rng = new SeededRandom(seed);
    const totalFloors = rng.nextInt(5, 10);

    return {
      seed,
      totalFloors,
      currentFloor: 1,
      difficulty,
      active: true,
    };
  }

  /** Get floor configuration for a given floor number. */
  static getFloorConfig(run: DungeonRunState, floorNumber: number): DungeonFloorConfig {
    const rng = new SeededRandom(run.seed + floorNumber * 7919);
    const totalFloors = run.totalFloors;
    const isBossFloor = floorNumber === totalFloors;

    // Mid-boss every 3 floors (floor 3, 6, 9) in longer runs, but not on boss floor
    const hasMidBoss = !isBossFloor && floorNumber > 1 && floorNumber % 3 === 0;

    // Depth ratio: 0.0 (floor 1) to 1.0 (final floor)
    const depthRatio = totalFloors > 1 ? (floorNumber - 1) / (totalFloors - 1) : 0;

    // HP scales: 1.0x at floor 1, ≥1.5x by floor 5 (midpoint or later)
    // Using exponential scaling: mult = 1.0 + depthRatio * 1.2
    // At floor 5 of 10: depthRatio = 4/9 = 0.44, mult = 1.53 ✓
    // At floor 5 of 5: depthRatio = 1.0, mult = 2.2
    const hpMultiplier = 1.0 + depthRatio * 1.2;
    const damageMultiplier = 1.0 + depthRatio * 0.8;
    const defenseMultiplier = 1.0 + depthRatio * 0.6;

    // Pick monster types for this floor (varies between floors)
    const monsterIds = DungeonSystem.pickMonsters(rng, floorNumber, totalFloors);

    // Spawn count scales with depth
    const baseMin = 4 + Math.floor(depthRatio * 3);
    const baseMax = 7 + Math.floor(depthRatio * 4);

    // Floor seed for map generation
    const floorSeed = run.seed * 31 + floorNumber * 997;

    // Loot bonuses scale with floor depth
    // Floor 1: +5 quality, +10% MF. Floor 5/10: +15 quality, +30% MF. Boss floor: extra boost.
    const baseLootBonus = 5 + Math.floor(depthRatio * 15);
    const lootQualityBonus = isBossFloor ? baseLootBonus + 10 : baseLootBonus;
    const magicFindBonus = 10 + Math.floor(depthRatio * 30) + (isBossFloor ? 20 : 0);

    return {
      floorNumber,
      totalFloors,
      seed: floorSeed,
      hpMultiplier,
      damageMultiplier,
      defenseMultiplier,
      isBossFloor,
      hasMidBoss,
      monsterIds,
      spawnCountRange: [baseMin, baseMax],
      lootQualityBonus,
      magicFindBonus,
    };
  }

  /** Pick 2-3 monster types for a floor, varying by depth. */
  private static pickMonsters(rng: SeededRandom, floor: number, totalFloors: number): string[] {
    const pool = DungeonMonsterPool;
    const depthRatio = totalFloors > 1 ? (floor - 1) / (totalFloors - 1) : 0;

    // Early floors: weaker monsters. Later floors: stronger monsters + mix.
    const availableCount = Math.min(pool.length, 2 + Math.floor(depthRatio * (pool.length - 2)));
    const startIdx = Math.min(Math.floor(depthRatio * (pool.length - 2)), pool.length - availableCount);

    const selected: string[] = [];
    const indices = new Set<number>();

    // Pick 2-3 different monsters
    const pickCount = rng.nextInt(2, Math.min(3, availableCount));
    while (selected.length < pickCount && indices.size < availableCount) {
      const idx = startIdx + rng.nextInt(0, availableCount - 1);
      const clampedIdx = Math.min(idx, pool.length - 1);
      if (!indices.has(clampedIdx)) {
        indices.add(clampedIdx);
        selected.push(pool[clampedIdx]);
      }
    }

    return selected.length > 0 ? selected : [pool[0]];
  }

  /** Generate a MapData for a dungeon floor. */
  static generateFloorMap(config: DungeonFloorConfig): MapData {
    const rng = new SeededRandom(config.seed);
    const cols = 60;
    const rows = 60;

    // Build spawn list from floor config
    const spawns: MapData['spawns'] = [];
    const spawnPositions = DungeonSystem.generateSpawnPositions(rng, cols, rows, config.monsterIds.length * 2);

    for (let i = 0; i < spawnPositions.length; i++) {
      const monsterId = config.monsterIds[i % config.monsterIds.length];
      const count = rng.nextInt(config.spawnCountRange[0], config.spawnCountRange[1]);
      spawns.push({
        col: spawnPositions[i].col,
        row: spawnPositions[i].row,
        monsterId,
        count,
      });
    }

    // Boss/mid-boss spawn
    if (config.isBossFloor) {
      spawns.push({
        col: Math.floor(cols / 2),
        row: Math.floor(rows * 0.75),
        monsterId: DungeonBossDef.id,
        count: 1,
      });
    }
    if (config.hasMidBoss) {
      spawns.push({
        col: Math.floor(cols / 2),
        row: Math.floor(rows * 0.7),
        monsterId: DungeonMidBossDef.id,
        count: 1,
      });
    }

    // Exit to next floor (not on boss floor — boss floor has an exit back to Abyss Rift)
    const exits: MapData['exits'] = [];
    if (!config.isBossFloor) {
      exits.push({
        col: Math.floor(cols / 2),
        row: rows - 2,
        targetMap: `dungeon_floor_${config.floorNumber + 1}`,
        targetCol: Math.floor(cols / 2),
        targetRow: 3,
      });
    } else {
      // Boss floor exit goes back to abyss_rift
      exits.push({
        col: Math.floor(cols / 2),
        row: rows - 2,
        targetMap: 'abyss_rift',
        targetCol: 60,
        targetRow: 60,
      });
    }

    // Create minimal MapData for MapGenerator
    const mapData: MapData = {
      id: `dungeon_floor_${config.floorNumber}`,
      name: `深渊迷宫 - 第${config.floorNumber}层`,
      cols,
      rows,
      tiles: [],
      collisions: [],
      spawns,
      camps: [], // No camps in dungeons
      playerStart: { col: Math.floor(cols / 2), row: 3 },
      exits,
      levelRange: [40 + config.floorNumber * 2, 48 + config.floorNumber * 2],
      theme: 'abyss' as MapTheme,
      seed: config.seed,
      bgColor: '#12081a',
    };

    // Use MapGenerator to procedurally generate tiles/collisions/decorations
    return MapGenerator.generate(mapData);
  }

  /** Generate random spawn positions spread across the map interior. */
  private static generateSpawnPositions(
    rng: SeededRandom,
    cols: number,
    rows: number,
    count: number,
  ): { col: number; row: number }[] {
    const positions: { col: number; row: number }[] = [];
    const margin = 8;
    for (let i = 0; i < count; i++) {
      positions.push({
        col: rng.nextInt(margin, cols - margin),
        row: rng.nextInt(margin + 5, rows - margin - 5), // avoid spawn near entry/exit
      });
    }
    return positions;
  }

  /** Apply depth-based stat scaling to a monster definition. Returns a new def (no mutation). */
  static scaleMonster(baseDef: MonsterDefinition, config: DungeonFloorConfig, difficulty: 'normal' | 'nightmare' | 'hell'): MonsterDefinition {
    const difficultyMult = DungeonSystem.getDifficultyMultipliers(difficulty);
    return {
      ...baseDef,
      hp: Math.round(baseDef.hp * config.hpMultiplier * difficultyMult.hp),
      damage: Math.round(baseDef.damage * config.damageMultiplier * difficultyMult.damage),
      defense: Math.round(baseDef.defense * config.defenseMultiplier * difficultyMult.defense),
      expReward: Math.round(baseDef.expReward * (1 + (config.floorNumber - 1) * 0.15) * difficultyMult.exp),
      goldReward: [
        Math.round(baseDef.goldReward[0] * (1 + (config.floorNumber - 1) * 0.1)),
        Math.round(baseDef.goldReward[1] * (1 + (config.floorNumber - 1) * 0.1)),
      ],
    };
  }

  /** Get difficulty multipliers for Nightmare/Hell. */
  static getDifficultyMultipliers(difficulty: 'normal' | 'nightmare' | 'hell'): { hp: number; damage: number; defense: number; exp: number } {
    switch (difficulty) {
      case 'nightmare':
        return { hp: 1.5, damage: 1.5, defense: 1.3, exp: 2.0 };
      case 'hell':
        return { hp: 2.0, damage: 2.0, defense: 1.6, exp: 3.0 };
      default:
        return { hp: 1.0, damage: 1.0, defense: 1.0, exp: 1.0 };
    }
  }

  /** Get the exit label for a non-final floor. */
  static getFloorExitLabel(nextFloor: number): string {
    return `下一层: 第${nextFloor}层`;
  }

  /** Get the dungeon portal label. */
  static getDungeonPortalLabel(): string {
    return '深渊迷宫入口';
  }

  /** Get the dungeon exclusive legendary IDs. */
  static getDungeonExclusiveLegendaryIds(): string[] {
    return DUNGEON_EXCLUSIVE_LEGENDARIES.map(l => l.id);
  }

  /** Check if the final boss guarantees rare+ loot. */
  static getBossLootFloor(): 'rare' {
    return 'rare';
  }

  /** Check if mid-boss guarantees magic+ loot. */
  static getMidBossLootFloor(): 'magic' {
    return 'magic';
  }
}
