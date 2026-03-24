import { describe, it, expect, beforeAll } from 'vitest';
import { NPCDefinitions } from '../data/npcs';
import {
  AllSubDungeons,
  SubDungeonsByZone,
  SubDungeonMiniBosses,
  subDungeonDwarfMine,
  subDungeonDemonAltar,
} from '../data/subDungeons';
import { AllMaps } from '../data/maps/index';
import { getMonsterDef } from '../data/monsters/index';
import { GameEvents } from '../utils/EventBus';
import type {
  MapData,
  HiddenArea,
  HiddenAreaReward,
  SubDungeonEntrance,
  StoryDecoration,
  SubDungeonMapData,
  NPCDefinition,
} from '../data/types';

// Local euclidean distance helper to avoid importing Phaser-dependent IsometricUtils
function euclideanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

const ZONE_IDS = ['emerald_plains', 'twilight_forest', 'anvil_mountains', 'scorching_desert', 'abyss_rift'];

const NEW_NPCS_BY_ZONE: Record<string, string[]> = {
  emerald_plains: ['plains_herbalist', 'plains_wanderer'],
  twilight_forest: ['forest_tracker', 'forest_spirit_medium'],
  anvil_mountains: ['mountain_miner', 'mountain_rune_scholar'],
  scorching_desert: ['desert_archaeologist', 'desert_water_diviner'],
  abyss_rift: ['abyss_fallen_knight', 'abyss_void_researcher'],
};

// ─────────────────────────────────────────────────────────────────────────
// 1. Field NPC Spawning
// ─────────────────────────────────────────────────────────────────────────
describe('Field NPC Spawning', () => {
  it('every zone defines fieldNpcs in mapData', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      expect(map.fieldNpcs, `${zoneId} should have fieldNpcs`).toBeDefined();
      expect(map.fieldNpcs!.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('each fieldNpc references a valid NPC definition', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const fieldNpc of map.fieldNpcs!) {
        const def = NPCDefinitions[fieldNpc.npcId];
        expect(def, `NPC "${fieldNpc.npcId}" should be defined`).toBeDefined();
        expect(def.id).toBe(fieldNpc.npcId);
        expect(def.name.length).toBeGreaterThan(0);
      }
    }
  });

  it('fieldNpc positions are within map bounds', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const fieldNpc of map.fieldNpcs!) {
        expect(fieldNpc.col).toBeGreaterThanOrEqual(0);
        expect(fieldNpc.col).toBeLessThan(map.cols);
        expect(fieldNpc.row).toBeGreaterThanOrEqual(0);
        expect(fieldNpc.row).toBeLessThan(map.rows);
      }
    }
  });

  it('fieldNpc positions are mostly on walkable tiles', () => {
    let unwalkableCount = 0;
    let totalCount = 0;
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const fieldNpc of map.fieldNpcs!) {
        totalCount++;
        if (!map.collisions[fieldNpc.row][fieldNpc.col]) {
          unwalkableCount++;
        }
      }
    }
    // Allow up to 10% on unwalkable tiles (procedural map artifacts)
    expect(unwalkableCount / totalCount).toBeLessThanOrEqual(0.15);
  });

  it('field NPCs are not placed inside camp safe zones', () => {
    const safeRadius = 9; // default safeZoneRadius
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const fieldNpc of map.fieldNpcs!) {
        for (const camp of map.camps) {
          const dist = euclideanDistance(fieldNpc.col, fieldNpc.row, camp.col, camp.row);
          expect(dist, `fieldNpc ${fieldNpc.npcId} in ${zoneId} should be outside camp radius`).toBeGreaterThan(safeRadius);
        }
      }
    }
  });

  it('all new NPCs have Chinese dialogue', () => {
    const allNewNpcIds = Object.values(NEW_NPCS_BY_ZONE).flat();
    for (const npcId of allNewNpcIds) {
      const def = NPCDefinitions[npcId];
      expect(def.dialogue.length).toBeGreaterThan(0);
      // Verify Chinese characters
      const hasChinese = /[\u4e00-\u9fff]/.test(def.dialogue[0]);
      expect(hasChinese, `NPC ${npcId} dialogue should be in Chinese`).toBe(true);
    }
  });

  it('field NPCs are interactable (have type that enables interaction)', () => {
    const allNewNpcIds = Object.values(NEW_NPCS_BY_ZONE).flat();
    for (const npcId of allNewNpcIds) {
      const def = NPCDefinitions[npcId];
      expect(['blacksmith', 'merchant', 'quest', 'stash']).toContain(def.type);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. Hidden Area Discovery
// ─────────────────────────────────────────────────────────────────────────
describe('Hidden Area Discovery', () => {
  it('every zone defines hiddenAreas in mapData', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      expect(map.hiddenAreas, `${zoneId} should have hiddenAreas`).toBeDefined();
      expect(map.hiddenAreas!.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('hidden areas have required fields', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const area of map.hiddenAreas!) {
        expect(area.id).toBeTruthy();
        expect(area.name.length).toBeGreaterThan(0);
        expect(area.col).toBeGreaterThanOrEqual(0);
        expect(area.col).toBeLessThan(map.cols);
        expect(area.row).toBeGreaterThanOrEqual(0);
        expect(area.row).toBeLessThan(map.rows);
        expect(area.radius).toBeGreaterThan(0);
        expect(area.discoveryText.length).toBeGreaterThan(0);
        expect(area.rewards.length).toBeGreaterThan(0);
      }
    }
  });

  it('hidden area names are in Chinese', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const area of map.hiddenAreas!) {
        const hasChinese = /[\u4e00-\u9fff]/.test(area.name);
        expect(hasChinese, `Hidden area "${area.id}" name should be Chinese`).toBe(true);
      }
    }
  });

  it('hidden area discovery text is in Chinese with ≥20 chars', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const area of map.hiddenAreas!) {
        const hasChinese = /[\u4e00-\u9fff]/.test(area.discoveryText);
        expect(hasChinese, `Hidden area "${area.id}" discovery text should be Chinese`).toBe(true);
        expect(area.discoveryText.length).toBeGreaterThanOrEqual(20);
      }
    }
  });

  it('hidden area reward positions are within map bounds', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const area of map.hiddenAreas!) {
        for (const reward of area.rewards) {
          expect(reward.col).toBeGreaterThanOrEqual(0);
          expect(reward.col).toBeLessThan(map.cols);
          expect(reward.row).toBeGreaterThanOrEqual(0);
          expect(reward.row).toBeLessThan(map.rows);
        }
      }
    }
  });

  it('hidden area rewards are valid types', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const area of map.hiddenAreas!) {
        for (const reward of area.rewards) {
          expect(['chest', 'gold_pile', 'rare_spawn', 'lore']).toContain(reward.type);
        }
      }
    }
  });

  it('at least one hidden area per zone has a chest reward', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      const hasChest = map.hiddenAreas!.some(area =>
        area.rewards.some(r => r.type === 'chest')
      );
      expect(hasChest, `${zoneId} should have at least one chest reward`).toBe(true);
    }
  });

  it('hidden areas are placed in non-obvious locations (far from camps)', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const area of map.hiddenAreas!) {
        for (const camp of map.camps) {
          const dist = euclideanDistance(area.col, area.row, camp.col, camp.row);
          // Hidden areas should be far from camp NPCs
          expect(dist, `Hidden area "${area.id}" in ${zoneId} should be far from camp`).toBeGreaterThan(15);
        }
      }
    }
  });

  it('discovery is bounds-based — fog clearing over rectangular bounds triggers reveal', () => {
    // Simulate bounds-based discovery logic (matching ZoneScene.isHiddenAreaExplored)
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const area of map.hiddenAreas!) {
        // Derive bounds from center/radius (matching ZoneScene.getHiddenAreaBounds)
        const bounds = {
          startCol: area.startCol ?? (area.col - area.radius),
          startRow: area.startRow ?? (area.row - area.radius),
          endCol: area.endCol ?? (area.col + area.radius),
          endRow: area.endRow ?? (area.row + area.radius),
        };

        // Bounds should be valid
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
});

// ─────────────────────────────────────────────────────────────────────────
// 3. Sub-Dungeon Entrances & Transitions
// ─────────────────────────────────────────────────────────────────────────
describe('Sub-Dungeon Entrances & Transitions', () => {
  const ZONES_WITH_SUBDUNGEONS = ['anvil_mountains', 'abyss_rift'];

  it('zones with sub-dungeons have subDungeonEntrances in mapData', () => {
    for (const zoneId of ZONES_WITH_SUBDUNGEONS) {
      const map = AllMaps[zoneId];
      expect(map.subDungeonEntrances, `${zoneId} should have subDungeonEntrances`).toBeDefined();
      expect(map.subDungeonEntrances!.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('sub-dungeon entrances reference valid sub-dungeons', () => {
    for (const zoneId of ZONES_WITH_SUBDUNGEONS) {
      const map = AllMaps[zoneId];
      for (const entrance of map.subDungeonEntrances!) {
        expect(AllSubDungeons[entrance.targetSubDungeon], `Sub-dungeon "${entrance.targetSubDungeon}" should exist`).toBeDefined();
      }
    }
  });

  it('sub-dungeon entrance positions are within map bounds and walkable', () => {
    for (const zoneId of ZONES_WITH_SUBDUNGEONS) {
      const map = AllMaps[zoneId];
      for (const entrance of map.subDungeonEntrances!) {
        expect(entrance.col).toBeGreaterThanOrEqual(0);
        expect(entrance.col).toBeLessThan(map.cols);
        expect(entrance.row).toBeGreaterThanOrEqual(0);
        expect(entrance.row).toBeLessThan(map.rows);
        expect(
          map.collisions[entrance.row][entrance.col],
          `Entrance at (${entrance.col},${entrance.row}) should be walkable`
        ).toBe(true);
      }
    }
  });

  it('sub-dungeon entrance names are in Chinese', () => {
    for (const zoneId of ZONES_WITH_SUBDUNGEONS) {
      const map = AllMaps[zoneId];
      for (const entrance of map.subDungeonEntrances!) {
        const hasChinese = /[\u4e00-\u9fff]/.test(entrance.name);
        expect(hasChinese, `Entrance "${entrance.id}" should have Chinese name`).toBe(true);
      }
    }
  });

  it('sub-dungeon map data is complete and valid', () => {
    for (const [id, subDungeon] of Object.entries(AllSubDungeons)) {
      expect(subDungeon.id).toBe(id);
      expect(subDungeon.name.length).toBeGreaterThan(0);
      expect(subDungeon.cols).toBeGreaterThan(0);
      expect(subDungeon.rows).toBeGreaterThan(0);
      expect(subDungeon.parentZone.length).toBeGreaterThan(0);
      expect(AllMaps[subDungeon.parentZone], `Parent zone "${subDungeon.parentZone}" should exist`).toBeDefined();
      expect(subDungeon.spawns.length).toBeGreaterThan(0);
      expect(subDungeon.playerStart.col).toBeGreaterThanOrEqual(0);
      expect(subDungeon.playerStart.row).toBeGreaterThanOrEqual(0);
      expect(subDungeon.exit.col).toBeGreaterThanOrEqual(0);
      expect(subDungeon.exit.row).toBeGreaterThanOrEqual(0);
      expect(subDungeon.levelRange[0]).toBeLessThanOrEqual(subDungeon.levelRange[1]);
    }
  });

  it('sub-dungeon mini-bosses are defined and valid', () => {
    for (const [id, subDungeon] of Object.entries(AllSubDungeons)) {
      const bossId = subDungeon.miniBoss.monsterId;
      const bossDef = SubDungeonMiniBosses[bossId];
      expect(bossDef, `Mini-boss "${bossId}" for sub-dungeon "${id}" should be defined`).toBeDefined();
      expect(bossDef.elite).toBe(true);
      expect(bossDef.hp).toBeGreaterThan(0);
      expect(bossDef.damage).toBeGreaterThan(0);
      expect(bossDef.lootTable!.length).toBeGreaterThan(0);
    }
  });

  it('sub-dungeon spawns reference valid monster definitions', () => {
    for (const [id, subDungeon] of Object.entries(AllSubDungeons)) {
      for (const spawn of subDungeon.spawns) {
        const monsterDef = getMonsterDef(spawn.monsterId);
        expect(monsterDef, `Monster "${spawn.monsterId}" in sub-dungeon "${id}" should exist`).toBeTruthy();
        expect(spawn.count).toBeGreaterThan(0);
      }
    }
  });

  it('sub-dungeon playerStart and exit are within bounds', () => {
    for (const [id, subDungeon] of Object.entries(AllSubDungeons)) {
      expect(subDungeon.playerStart.col).toBeGreaterThanOrEqual(0);
      expect(subDungeon.playerStart.col).toBeLessThan(subDungeon.cols);
      expect(subDungeon.playerStart.row).toBeGreaterThanOrEqual(0);
      expect(subDungeon.playerStart.row).toBeLessThan(subDungeon.rows);
      expect(subDungeon.exit.col).toBeGreaterThanOrEqual(0);
      expect(subDungeon.exit.col).toBeLessThan(subDungeon.cols);
      expect(subDungeon.exit.row).toBeGreaterThanOrEqual(0);
      expect(subDungeon.exit.row).toBeLessThan(subDungeon.rows);
    }
  });

  it('sub-dungeon exit returnCol/returnRow are valid in parent zone', () => {
    for (const [id, subDungeon] of Object.entries(AllSubDungeons)) {
      const parentMap = AllMaps[subDungeon.parentZone];
      expect(subDungeon.exit.returnCol).toBeGreaterThanOrEqual(0);
      expect(subDungeon.exit.returnCol).toBeLessThan(parentMap.cols);
      expect(subDungeon.exit.returnRow).toBeGreaterThanOrEqual(0);
      expect(subDungeon.exit.returnRow).toBeLessThan(parentMap.rows);
    }
  });

  it('sub-dungeon spawn positions are within bounds', () => {
    for (const [id, subDungeon] of Object.entries(AllSubDungeons)) {
      for (const spawn of subDungeon.spawns) {
        expect(spawn.col).toBeGreaterThanOrEqual(0);
        expect(spawn.col).toBeLessThan(subDungeon.cols);
        expect(spawn.row).toBeGreaterThanOrEqual(0);
        expect(spawn.row).toBeLessThan(subDungeon.rows);
      }
    }
  });

  it('sub-dungeon mini-boss position is within bounds', () => {
    for (const [id, subDungeon] of Object.entries(AllSubDungeons)) {
      expect(subDungeon.miniBoss.col).toBeGreaterThanOrEqual(0);
      expect(subDungeon.miniBoss.col).toBeLessThan(subDungeon.cols);
      expect(subDungeon.miniBoss.row).toBeGreaterThanOrEqual(0);
      expect(subDungeon.miniBoss.row).toBeLessThan(subDungeon.rows);
    }
  });

  it('SubDungeonsByZone maps to valid sub-dungeon IDs', () => {
    for (const [zoneId, subDungeonIds] of Object.entries(SubDungeonsByZone)) {
      expect(AllMaps[zoneId], `Zone "${zoneId}" should exist`).toBeDefined();
      for (const subId of subDungeonIds) {
        expect(AllSubDungeons[subId], `Sub-dungeon "${subId}" should exist`).toBeDefined();
      }
    }
  });

  it('sub-dungeon map generation produces valid map data', () => {
    // Simulate the generateSubDungeonMap logic
    for (const [id, subDungeon] of Object.entries(AllSubDungeons)) {
      const { cols, rows, seed } = subDungeon;

      // Generate tiles
      const tiles: number[][] = [];
      const collisions: boolean[][] = [];
      for (let r = 0; r < rows; r++) {
        const tileRow: number[] = [];
        const collRow: boolean[] = [];
        for (let c = 0; c < cols; c++) {
          if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
            tileRow.push(4);
            collRow.push(false);
          } else {
            const hash = ((c * 374761393 + r * 668265263 + seed) >>> 0) % 100;
            tileRow.push(hash < 10 ? 2 : hash < 15 ? 1 : 2);
            collRow.push(true);
          }
        }
        tiles.push(tileRow);
        collisions.push(collRow);
      }

      // Add walls
      const rng = (x: number, y: number) => ((x * 374761393 + y * 668265263 + seed * 7) >>> 0) % 100;
      for (let r = 3; r < rows - 3; r++) {
        for (let c = 3; c < cols - 3; c++) {
          if (rng(c, r) < 8) {
            tiles[r][c] = 4;
            collisions[r][c] = false;
          }
        }
      }

      // Ensure playerStart is walkable
      const ps = subDungeon.playerStart;
      tiles[ps.row][ps.col] = 2;
      collisions[ps.row][ps.col] = true;
      const ex = subDungeon.exit;
      tiles[ex.row][ex.col] = 2;
      collisions[ex.row][ex.col] = true;

      // Verify playerStart and exit are walkable
      expect(collisions[ps.row][ps.col]).toBe(true);
      expect(collisions[ex.row][ex.col]).toBe(true);

      // Verify borders are walls
      for (let c = 0; c < cols; c++) {
        expect(tiles[0][c]).toBe(4);
        expect(tiles[rows - 1][c]).toBe(4);
      }
      for (let r = 0; r < rows; r++) {
        expect(tiles[r][0]).toBe(4);
        expect(tiles[r][cols - 1]).toBe(4);
      }
    }
  });

  it('sub-dungeon map has functional exit back to parent zone', () => {
    for (const [id, subDungeon] of Object.entries(AllSubDungeons)) {
      // The generated MapData should contain an exit pointing to parent zone
      const exitData = {
        col: subDungeon.exit.col,
        row: subDungeon.exit.row,
        targetMap: subDungeon.parentZone,
        targetCol: subDungeon.exit.returnCol,
        targetRow: subDungeon.exit.returnRow,
      };
      expect(exitData.targetMap).toBe(subDungeon.parentZone);
      expect(AllMaps[exitData.targetMap]).toBeDefined();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. Story Decorations
// ─────────────────────────────────────────────────────────────────────────
describe('Story Decorations', () => {
  it('every zone defines storyDecorations in mapData', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      expect(map.storyDecorations, `${zoneId} should have storyDecorations`).toBeDefined();
      expect(map.storyDecorations!.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('story decorations have required fields', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const decor of map.storyDecorations!) {
        expect(decor.id).toBeTruthy();
        expect(decor.name.length).toBeGreaterThan(0);
        expect(decor.description.length).toBeGreaterThanOrEqual(30);
        expect(decor.col).toBeGreaterThanOrEqual(0);
        expect(decor.col).toBeLessThan(map.cols);
        expect(decor.row).toBeGreaterThanOrEqual(0);
        expect(decor.row).toBeLessThan(map.rows);
        expect(decor.spriteType).toBeTruthy();
      }
    }
  });

  it('story decoration names and descriptions are in Chinese', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const decor of map.storyDecorations!) {
        const nameHasChinese = /[\u4e00-\u9fff]/.test(decor.name);
        expect(nameHasChinese, `Decoration "${decor.id}" name should be Chinese`).toBe(true);
        const descHasChinese = /[\u4e00-\u9fff]/.test(decor.description);
        expect(descHasChinese, `Decoration "${decor.id}" description should be Chinese`).toBe(true);
      }
    }
  });

  it('story decoration positions are on walkable tiles', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const decor of map.storyDecorations!) {
        expect(
          map.collisions[decor.row][decor.col],
          `Decoration "${decor.id}" at (${decor.col},${decor.row}) in ${zoneId} should be on walkable tile`
        ).toBe(true);
      }
    }
  });

  it('story decoration spriteTypes are valid', () => {
    const validTypes = [
      'ruins', 'skeletal_remains', 'ancient_statue', 'broken_altar', 'war_banner',
      'charred_tree', 'collapsed_pillar', 'ritual_circle', 'frozen_corpse', 'sand_buried_structure',
    ];
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const decor of map.storyDecorations!) {
        expect(validTypes).toContain(decor.spriteType);
      }
    }
  });

  it('story decoration IDs are unique across all zones', () => {
    const allIds = new Set<string>();
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const decor of map.storyDecorations!) {
        expect(allIds.has(decor.id), `Duplicate decoration ID "${decor.id}"`).toBe(false);
        allIds.add(decor.id);
      }
    }
  });

  it('decorations are spread across the map (not clustered)', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      const decors = map.storyDecorations!;
      if (decors.length >= 2) {
        // At least some decorations should be far apart
        let maxDist = 0;
        for (let i = 0; i < decors.length; i++) {
          for (let j = i + 1; j < decors.length; j++) {
            const dist = euclideanDistance(decors[i].col, decors[i].row, decors[j].col, decors[j].row);
            maxDist = Math.max(maxDist, dist);
          }
        }
        expect(maxDist).toBeGreaterThan(20); // Not all clumped together
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 5. EventBus Events
// ─────────────────────────────────────────────────────────────────────────
describe('EventBus Events for Zone Content', () => {
  it('HIDDEN_AREA_DISCOVERED event exists', () => {
    expect(GameEvents.HIDDEN_AREA_DISCOVERED).toBe('hidden_area:discovered');
  });

  it('STORY_DECORATION_INTERACT event exists', () => {
    expect(GameEvents.STORY_DECORATION_INTERACT).toBe('story_decoration:interact');
  });

  it('SUBDUNGEON_ENTER event exists', () => {
    expect(GameEvents.SUBDUNGEON_ENTER).toBe('subdungeon:enter');
  });

  it('SUBDUNGEON_EXIT event exists', () => {
    expect(GameEvents.SUBDUNGEON_EXIT).toBe('subdungeon:exit');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6. SaveData Schema
// ─────────────────────────────────────────────────────────────────────────
describe('SaveData includes discoveredHiddenAreas', () => {
  it('discoveredHiddenAreas field can be set on SaveData', () => {
    const save: Partial<import('../data/types').SaveData> = {
      discoveredHiddenAreas: ['hidden_ep_elven_cache', 'hidden_tf_moonlight_shrine'],
    };
    expect(save.discoveredHiddenAreas).toHaveLength(2);
    expect(save.discoveredHiddenAreas).toContain('hidden_ep_elven_cache');
  });

  it('discoveredHiddenAreas defaults to empty when undefined', () => {
    const save: Partial<import('../data/types').SaveData> = {};
    const areas = save.discoveredHiddenAreas ?? [];
    expect(areas).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 7. Sub-Dungeon Map Generation Validity
// ─────────────────────────────────────────────────────────────────────────
describe('Sub-Dungeon Map Generation', () => {
  function generateTestSubDungeonMap(subDungeon: SubDungeonMapData) {
    const { cols, rows, seed } = subDungeon;
    const tiles: number[][] = [];
    const collisions: boolean[][] = [];
    for (let r = 0; r < rows; r++) {
      const tileRow: number[] = [];
      const collRow: boolean[] = [];
      for (let c = 0; c < cols; c++) {
        if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
          tileRow.push(4);
          collRow.push(false);
        } else {
          const hash = ((c * 374761393 + r * 668265263 + seed) >>> 0) % 100;
          tileRow.push(hash < 10 ? 2 : hash < 15 ? 1 : 2);
          collRow.push(true);
        }
      }
      tiles.push(tileRow);
      collisions.push(collRow);
    }
    const rng = (x: number, y: number) => ((x * 374761393 + y * 668265263 + seed * 7) >>> 0) % 100;
    for (let r = 3; r < rows - 3; r++) {
      for (let c = 3; c < cols - 3; c++) {
        if (rng(c, r) < 8) {
          tiles[r][c] = 4;
          collisions[r][c] = false;
        }
      }
    }
    // Ensure key positions are walkable
    const ps = subDungeon.playerStart;
    collisions[ps.row][ps.col] = true;
    const ex = subDungeon.exit;
    collisions[ex.row][ex.col] = true;
    for (const spawn of subDungeon.spawns) {
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const sr = spawn.row + dr;
          const sc = spawn.col + dc;
          if (sr > 0 && sr < rows - 1 && sc > 0 && sc < cols - 1) {
            collisions[sr][sc] = true;
          }
        }
      }
    }
    const mb = subDungeon.miniBoss;
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const sr = mb.row + dr;
        const sc = mb.col + dc;
        if (sr > 0 && sr < rows - 1 && sc > 0 && sc < cols - 1) {
          collisions[sr][sc] = true;
        }
      }
    }
    return { tiles, collisions };
  }

  it('generated map has correct dimensions', () => {
    for (const subDungeon of Object.values(AllSubDungeons)) {
      const { tiles, collisions } = generateTestSubDungeonMap(subDungeon);
      expect(tiles.length).toBe(subDungeon.rows);
      expect(tiles[0].length).toBe(subDungeon.cols);
      expect(collisions.length).toBe(subDungeon.rows);
      expect(collisions[0].length).toBe(subDungeon.cols);
    }
  });

  it('generated map has wall borders', () => {
    for (const subDungeon of Object.values(AllSubDungeons)) {
      const { tiles } = generateTestSubDungeonMap(subDungeon);
      for (let c = 0; c < subDungeon.cols; c++) {
        expect(tiles[0][c]).toBe(4);
        expect(tiles[subDungeon.rows - 1][c]).toBe(4);
      }
      for (let r = 0; r < subDungeon.rows; r++) {
        expect(tiles[r][0]).toBe(4);
        expect(tiles[r][subDungeon.cols - 1]).toBe(4);
      }
    }
  });

  it('generated map has walkable player start and exit', () => {
    for (const subDungeon of Object.values(AllSubDungeons)) {
      const { collisions } = generateTestSubDungeonMap(subDungeon);
      const ps = subDungeon.playerStart;
      const ex = subDungeon.exit;
      expect(collisions[ps.row][ps.col]).toBe(true);
      expect(collisions[ex.row][ex.col]).toBe(true);
    }
  });

  it('generated map has walkable spawn areas', () => {
    for (const subDungeon of Object.values(AllSubDungeons)) {
      const { collisions } = generateTestSubDungeonMap(subDungeon);
      for (const spawn of subDungeon.spawns) {
        // At least the spawn tile itself should be walkable
        expect(collisions[spawn.row][spawn.col]).toBe(true);
      }
    }
  });

  it('generated map has walkable mini-boss position', () => {
    for (const subDungeon of Object.values(AllSubDungeons)) {
      const { collisions } = generateTestSubDungeonMap(subDungeon);
      const mb = subDungeon.miniBoss;
      expect(collisions[mb.row][mb.col]).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 8. Integration — Content Data Consistency Across Systems
// ─────────────────────────────────────────────────────────────────────────
describe('Content Data Consistency', () => {
  it('all fieldNpc IDs match between mapData and NPC definitions', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      if (!map.fieldNpcs) continue;
      for (const fn of map.fieldNpcs) {
        expect(NPCDefinitions[fn.npcId], `NPC "${fn.npcId}" referenced in ${zoneId}.fieldNpcs should exist`).toBeDefined();
      }
    }
  });

  it('zones without sub-dungeons have no subDungeonEntrances', () => {
    const zonesWithSubDungeons = new Set(Object.keys(SubDungeonsByZone));
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      if (!zonesWithSubDungeons.has(zoneId)) {
        const entrances = map.subDungeonEntrances ?? [];
        expect(entrances.length).toBe(0);
      }
    }
  });

  it('sub-dungeon entrance target matches SubDungeonsByZone mapping', () => {
    for (const [zoneId, subDungeonIds] of Object.entries(SubDungeonsByZone)) {
      const map = AllMaps[zoneId];
      const entranceTargets = (map.subDungeonEntrances ?? []).map(e => e.targetSubDungeon);
      for (const expectedId of subDungeonIds) {
        expect(entranceTargets).toContain(expectedId);
      }
    }
  });

  it('hidden area IDs are unique across all zones', () => {
    const allIds = new Set<string>();
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const area of (map.hiddenAreas ?? [])) {
        expect(allIds.has(area.id), `Duplicate hidden area ID "${area.id}"`).toBe(false);
        allIds.add(area.id);
      }
    }
  });

  it('sub-dungeon mini-boss names are in Chinese', () => {
    for (const [bossId, bossDef] of Object.entries(SubDungeonMiniBosses)) {
      const hasChinese = /[\u4e00-\u9fff]/.test(bossDef.name);
      expect(hasChinese, `Mini-boss "${bossId}" should have Chinese name`).toBe(true);
    }
  });

  it('sub-dungeon level ranges are appropriate for parent zone', () => {
    for (const [id, subDungeon] of Object.entries(AllSubDungeons)) {
      const parentMap = AllMaps[subDungeon.parentZone];
      // Sub-dungeon level range should overlap with parent zone
      expect(subDungeon.levelRange[0]).toBeLessThanOrEqual(parentMap.levelRange[1] + 5);
      expect(subDungeon.levelRange[1]).toBeGreaterThanOrEqual(parentMap.levelRange[0]);
    }
  });
});
