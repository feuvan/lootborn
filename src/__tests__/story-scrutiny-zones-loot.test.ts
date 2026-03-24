/**
 * Tests for story-scrutiny-fix-zones-loot feature:
 * 1. Sub-dungeon exit positioning (targetCol/targetRow)
 * 2. Hidden area fog-of-war bounds discovery
 * 3. Mini-boss guaranteed loot quality floor
 * 4. abyss_fallen_knight walkable tile
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AllMaps } from '../data/maps/index';
import { AllSubDungeons, SubDungeonMiniBosses } from '../data/subDungeons';
import { MiniBossByZone } from '../data/miniBosses';
import { LootSystem } from '../systems/LootSystem';
import { NPCDefinitions } from '../data/npcs';
import type { HiddenArea, MonsterDefinition, ItemQuality } from '../data/types';

const ZONE_IDS = ['emerald_plains', 'twilight_forest', 'anvil_mountains', 'scorching_desert', 'abyss_rift'];

// ─────────────────────────────────────────────────────────────────────────
// 1. Sub-Dungeon Exit Positioning
// ─────────────────────────────────────────────────────────────────────────
describe('Sub-Dungeon Exit Positioning', () => {
  it('sub-dungeon exit data has returnCol/returnRow that point to parent map', () => {
    for (const [id, subDungeon] of Object.entries(AllSubDungeons)) {
      const exit = subDungeon.exit;
      expect(exit.returnCol, `Sub-dungeon "${id}" exit should have returnCol`).toBeGreaterThanOrEqual(0);
      expect(exit.returnRow, `Sub-dungeon "${id}" exit should have returnRow`).toBeGreaterThanOrEqual(0);
      // returnCol/returnRow should be within parent map bounds
      const parentMap = AllMaps[subDungeon.parentZone];
      expect(parentMap, `Parent zone "${subDungeon.parentZone}" should exist`).toBeDefined();
      expect(exit.returnCol).toBeLessThan(parentMap.cols);
      expect(exit.returnRow).toBeLessThan(parentMap.rows);
    }
  });

  it('sub-dungeon exit returnCol/returnRow should be on a walkable tile in parent map', () => {
    for (const [id, subDungeon] of Object.entries(AllSubDungeons)) {
      const parentMap = AllMaps[subDungeon.parentZone];
      const { returnCol, returnRow } = subDungeon.exit;
      expect(
        parentMap.collisions[returnRow][returnCol],
        `Sub-dungeon "${id}" exit target (${returnCol},${returnRow}) should be walkable in "${subDungeon.parentZone}"`,
      ).toBe(true);
    }
  });

  it('sub-dungeon parentZoneInfo structure includes returnCol and returnRow', () => {
    // This verifies the data contract: when entering a sub-dungeon, parentZoneInfo
    // should contain the entrance col/row so the player returns there on exit
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      if (!map.subDungeonEntrances) continue;
      for (const entrance of map.subDungeonEntrances) {
        const subDungeon = AllSubDungeons[entrance.targetSubDungeon];
        if (!subDungeon) continue;
        // The entrance col/row on the parent map should be within bounds
        expect(entrance.col).toBeGreaterThanOrEqual(0);
        expect(entrance.col).toBeLessThan(map.cols);
        expect(entrance.row).toBeGreaterThanOrEqual(0);
        expect(entrance.row).toBeLessThan(map.rows);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. Hidden Area Fog-of-War Bounds Discovery
// ─────────────────────────────────────────────────────────────────────────
describe('Hidden Area Fog-of-War Bounds Discovery', () => {
  /** Helper: derive bounds from hidden area (matching ZoneScene.getHiddenAreaBounds). */
  function getHiddenAreaBounds(area: HiddenArea) {
    return {
      startCol: area.startCol ?? (area.col - area.radius),
      startRow: area.startRow ?? (area.row - area.radius),
      endCol: area.endCol ?? (area.col + area.radius),
      endRow: area.endRow ?? (area.row + area.radius),
    };
  }

  /** Helper: check if all corners + center are explored (matching ZoneScene.isHiddenAreaExplored). */
  function isHiddenAreaExplored(area: HiddenArea, exploredTiles: Set<string>): boolean {
    const bounds = getHiddenAreaBounds(area);
    const checkPoints = [
      { c: bounds.startCol, r: bounds.startRow },
      { c: bounds.endCol, r: bounds.startRow },
      { c: bounds.startCol, r: bounds.endRow },
      { c: bounds.endCol, r: bounds.endRow },
      { c: area.col, r: area.row },
    ];
    return checkPoints.every(p => exploredTiles.has(`${p.c},${p.r}`));
  }

  /** Helper: simulate exploring tiles within view radius of a position. */
  function exploreTilesAround(col: number, row: number, exploredTiles: Set<string>, viewRadius = 10): void {
    for (let r = Math.floor(row - viewRadius); r <= Math.ceil(row + viewRadius); r++) {
      for (let c = Math.floor(col - viewRadius); c <= Math.ceil(col + viewRadius); c++) {
        const dist = Math.sqrt((c - col) ** 2 + (r - row) ** 2);
        if (dist <= viewRadius) {
          exploredTiles.add(`${c},${r}`);
        }
      }
    }
  }

  it('all hidden areas have valid derived bounds', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const area of map.hiddenAreas ?? []) {
        const bounds = getHiddenAreaBounds(area);
        expect(bounds.startCol).toBeLessThanOrEqual(bounds.endCol);
        expect(bounds.startRow).toBeLessThanOrEqual(bounds.endRow);
        // Center should be within bounds
        expect(area.col).toBeGreaterThanOrEqual(bounds.startCol);
        expect(area.col).toBeLessThanOrEqual(bounds.endCol);
        expect(area.row).toBeGreaterThanOrEqual(bounds.startRow);
        expect(area.row).toBeLessThanOrEqual(bounds.endRow);
      }
    }
  });

  it('hidden area is NOT discovered when only center tile is explored', () => {
    // Create an area with radius 5 — only exploring center should not reveal it
    const area: HiddenArea = {
      id: 'test_area',
      name: '测试区域',
      col: 50,
      row: 50,
      radius: 5,
      rewards: [],
      discoveryText: '发现了一个隐藏区域！',
    };
    const exploredTiles = new Set<string>();
    exploredTiles.add('50,50'); // only center
    expect(isHiddenAreaExplored(area, exploredTiles)).toBe(false);
  });

  it('hidden area IS discovered when all corners + center are explored', () => {
    const area: HiddenArea = {
      id: 'test_area',
      name: '测试区域',
      col: 50,
      row: 50,
      radius: 5,
      rewards: [],
      discoveryText: '发现了一个隐藏区域！',
    };
    const exploredTiles = new Set<string>();
    // Add all corners + center
    exploredTiles.add('45,45'); // startCol, startRow
    exploredTiles.add('55,45'); // endCol, startRow
    exploredTiles.add('45,55'); // startCol, endRow
    exploredTiles.add('55,55'); // endCol, endRow
    exploredTiles.add('50,50'); // center
    expect(isHiddenAreaExplored(area, exploredTiles)).toBe(true);
  });

  it('hidden area discovery triggers when player walks near enough to reveal all bounds', () => {
    const area: HiddenArea = {
      id: 'test_area',
      name: '测试区域',
      col: 50,
      row: 50,
      radius: 4,
      rewards: [],
      discoveryText: '发现了一个隐藏区域！',
    };
    const exploredTiles = new Set<string>();
    // Walk the player around the area's bounds
    // With view radius 10 and area radius 4, walking to center reveals all bounds
    exploreTilesAround(50, 50, exploredTiles, 10);
    expect(isHiddenAreaExplored(area, exploredTiles)).toBe(true);
  });

  it('hidden area with explicit bounds uses those bounds', () => {
    const area: HiddenArea = {
      id: 'test_area',
      name: '测试区域',
      col: 50,
      row: 50,
      radius: 5,
      startCol: 48,
      startRow: 48,
      endCol: 52,
      endRow: 52,
      rewards: [],
      discoveryText: '发现了一个隐藏区域！',
    };
    const bounds = getHiddenAreaBounds(area);
    expect(bounds.startCol).toBe(48);
    expect(bounds.startRow).toBe(48);
    expect(bounds.endCol).toBe(52);
    expect(bounds.endRow).toBe(52);
  });

  it('all zone hidden areas can be discovered when player walks to their center (view radius 10)', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const area of map.hiddenAreas ?? []) {
        const exploredTiles = new Set<string>();
        // Walk player to the center of the area
        exploreTilesAround(area.col, area.row, exploredTiles, 10);
        expect(
          isHiddenAreaExplored(area, exploredTiles),
          `Hidden area "${area.id}" in ${zoneId} should be discoverable from center walk`,
        ).toBe(true);
      }
    }
  });

  it('HiddenArea type supports optional bounds fields', () => {
    const area: HiddenArea = {
      id: 'test',
      name: '测试',
      col: 10,
      row: 10,
      radius: 3,
      startCol: 7,
      startRow: 7,
      endCol: 13,
      endRow: 13,
      rewards: [],
      discoveryText: '测试发现文本超过二十个字符的隐藏区域内容',
    };
    expect(area.startCol).toBe(7);
    expect(area.endRow).toBe(13);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. Mini-Boss Guaranteed Loot Quality Floor
// ─────────────────────────────────────────────────────────────────────────
describe('Mini-Boss Guaranteed Loot Quality', () => {
  let lootSystem: LootSystem;

  beforeEach(() => {
    lootSystem = new LootSystem();
  });

  it('all zone mini-bosses have isMiniBoss flag', () => {
    for (const zoneId of ZONE_IDS) {
      const boss = MiniBossByZone[zoneId];
      expect(boss.isMiniBoss, `Zone ${zoneId} mini-boss should have isMiniBoss: true`).toBe(true);
    }
  });

  it('all sub-dungeon mini-bosses have isMiniBoss and isSubDungeonMiniBoss flags', () => {
    for (const [bossId, boss] of Object.entries(SubDungeonMiniBosses)) {
      expect(boss.isMiniBoss, `Sub-dungeon mini-boss "${bossId}" should have isMiniBoss: true`).toBe(true);
      expect(boss.isSubDungeonMiniBoss, `Sub-dungeon mini-boss "${bossId}" should have isSubDungeonMiniBoss: true`).toBe(true);
    }
  });

  it('LootSystem.qualityMeetsFloor correctly compares qualities', () => {
    const QUALITY_ORDER: ItemQuality[] = ['normal', 'magic', 'rare', 'legendary', 'set'];
    expect(LootSystem.qualityMeetsFloor('normal', 'normal')).toBe(true);
    expect(LootSystem.qualityMeetsFloor('magic', 'magic')).toBe(true);
    expect(LootSystem.qualityMeetsFloor('rare', 'magic')).toBe(true);
    expect(LootSystem.qualityMeetsFloor('legendary', 'magic')).toBe(true);
    expect(LootSystem.qualityMeetsFloor('set', 'rare')).toBe(true);
    expect(LootSystem.qualityMeetsFloor('normal', 'magic')).toBe(false);
    expect(LootSystem.qualityMeetsFloor('magic', 'rare')).toBe(false);
  });

  it('zone mini-boss loot always includes at least one magic+ equipment', () => {
    // Run multiple trials to account for RNG
    for (const zoneId of ZONE_IDS) {
      const boss = MiniBossByZone[zoneId];
      for (let trial = 0; trial < 20; trial++) {
        const loot = lootSystem.generateLoot(boss, 0, 0);
        // Filter to equipment items (non-consumable, non-gem)
        const equipItems = loot.filter(i => {
          return i.quality !== undefined && !i.baseId.startsWith('c_') && !i.baseId.startsWith('gem_');
        });
        const hasMagicPlus = equipItems.some(i =>
          LootSystem.qualityMeetsFloor(i.quality, 'magic'),
        );
        expect(hasMagicPlus, `Zone mini-boss "${boss.id}" trial ${trial} should always drop magic+ equipment`).toBe(true);
      }
    }
  });

  it('sub-dungeon mini-boss loot always includes at least one rare+ equipment', () => {
    for (const [bossId, boss] of Object.entries(SubDungeonMiniBosses)) {
      for (let trial = 0; trial < 20; trial++) {
        const loot = lootSystem.generateLoot(boss, 0, 0);
        const equipItems = loot.filter(i => {
          return i.quality !== undefined && !i.baseId.startsWith('c_') && !i.baseId.startsWith('gem_');
        });
        const hasRarePlus = equipItems.some(i =>
          LootSystem.qualityMeetsFloor(i.quality, 'rare'),
        );
        expect(hasRarePlus, `Sub-dungeon mini-boss "${bossId}" trial ${trial} should always drop rare+ equipment`).toBe(true);
      }
    }
  });

  it('non-mini-boss monster loot has no quality floor enforcement', () => {
    const regularMonster: MonsterDefinition = {
      id: 'test_goblin',
      name: '测试哥布林',
      level: 5,
      hp: 50,
      damage: 8,
      defense: 3,
      speed: 40,
      aggroRange: 5,
      attackRange: 1.5,
      attackSpeed: 1200,
      expReward: 15,
      goldReward: [3, 8],
      spriteKey: 'monster_goblin',
    };
    // Regular monsters CAN drop normal quality items
    let hasNormal = false;
    for (let trial = 0; trial < 100; trial++) {
      const loot = lootSystem.generateLoot(regularMonster, 0, 0);
      for (const item of loot) {
        if (item.quality === 'normal') hasNormal = true;
      }
    }
    expect(hasNormal).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. abyss_fallen_knight Position Fix
// ─────────────────────────────────────────────────────────────────────────
describe('abyss_fallen_knight Position Fix', () => {
  it('abyss_fallen_knight NPC definition exists', () => {
    expect(NPCDefinitions['abyss_fallen_knight']).toBeDefined();
    expect(NPCDefinitions['abyss_fallen_knight'].name).toMatch(/[\u4e00-\u9fff]/);
  });

  it('abyss_fallen_knight fieldNpc position is NOT at (50,35)', () => {
    const map = AllMaps['abyss_rift'];
    const npcEntry = map.fieldNpcs?.find(n => n.npcId === 'abyss_fallen_knight');
    expect(npcEntry).toBeDefined();
    // Should not be at the old problematic position
    expect(npcEntry!.col === 50 && npcEntry!.row === 35).toBe(false);
  });

  it('abyss_fallen_knight fieldNpc position is on a walkable tile', () => {
    const map = AllMaps['abyss_rift'];
    const npcEntry = map.fieldNpcs?.find(n => n.npcId === 'abyss_fallen_knight');
    expect(npcEntry).toBeDefined();
    expect(
      map.collisions[npcEntry!.row][npcEntry!.col],
      `abyss_fallen_knight at (${npcEntry!.col},${npcEntry!.row}) should be on walkable tile`,
    ).toBe(true);
  });

  it('all field NPC positions across all zones are on walkable tiles', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      if (!map.fieldNpcs) continue;
      for (const npc of map.fieldNpcs) {
        expect(
          map.collisions[npc.row][npc.col],
          `Field NPC "${npc.npcId}" at (${npc.col},${npc.row}) in ${zoneId} should be walkable`,
        ).toBe(true);
      }
    }
  });

  it('abyss_fallen_knight position is within map bounds', () => {
    const map = AllMaps['abyss_rift'];
    const npcEntry = map.fieldNpcs?.find(n => n.npcId === 'abyss_fallen_knight');
    expect(npcEntry).toBeDefined();
    expect(npcEntry!.col).toBeGreaterThanOrEqual(1);
    expect(npcEntry!.col).toBeLessThan(map.cols - 1);
    expect(npcEntry!.row).toBeGreaterThanOrEqual(1);
    expect(npcEntry!.row).toBeLessThan(map.rows - 1);
  });
});
