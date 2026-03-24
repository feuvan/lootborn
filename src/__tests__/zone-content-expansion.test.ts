import { describe, it, expect } from 'vitest';
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
import type {
  MapData,
  HiddenArea,
  SubDungeonEntrance,
  StoryDecoration,
  SubDungeonMapData,
  NPCDefinition,
} from '../data/types';

const ZONE_IDS = ['emerald_plains', 'twilight_forest', 'anvil_mountains', 'scorching_desert', 'abyss_rift'];

// ─── New NPC definitions per zone ───────────────────────────────────────
const NEW_NPCS_BY_ZONE: Record<string, string[]> = {
  emerald_plains: ['plains_herbalist', 'plains_wanderer'],
  twilight_forest: ['forest_tracker', 'forest_spirit_medium'],
  anvil_mountains: ['mountain_miner', 'mountain_rune_scholar'],
  scorching_desert: ['desert_archaeologist', 'desert_water_diviner'],
  abyss_rift: ['abyss_fallen_knight', 'abyss_void_researcher'],
};

// ---------------------------------------------------------------------------
// New NPC Definitions
// ---------------------------------------------------------------------------
describe('New NPC Definitions', () => {
  it('defines ≥2 new NPCs per zone', () => {
    for (const zoneId of ZONE_IDS) {
      const npcIds = NEW_NPCS_BY_ZONE[zoneId];
      expect(npcIds.length).toBeGreaterThanOrEqual(2);
      for (const npcId of npcIds) {
        expect(NPCDefinitions[npcId]).toBeDefined();
      }
    }
  });

  it('all new NPCs have required fields', () => {
    const allNewNpcIds = Object.values(NEW_NPCS_BY_ZONE).flat();
    for (const npcId of allNewNpcIds) {
      const npc = NPCDefinitions[npcId];
      expect(npc).toBeDefined();
      expect(npc.id).toBe(npcId);
      expect(npc.name.length).toBeGreaterThan(0);
      expect(['blacksmith', 'merchant', 'quest', 'stash']).toContain(npc.type);
      expect(npc.dialogue.length).toBeGreaterThan(0);
    }
  });

  it('all new NPCs have Chinese names', () => {
    const allNewNpcIds = Object.values(NEW_NPCS_BY_ZONE).flat();
    for (const npcId of allNewNpcIds) {
      const npc = NPCDefinitions[npcId];
      expect(npc.name).toMatch(/[\u4e00-\u9fff]/);
    }
  });

  it('all new NPCs have Chinese dialogue', () => {
    const allNewNpcIds = Object.values(NEW_NPCS_BY_ZONE).flat();
    for (const npcId of allNewNpcIds) {
      const npc = NPCDefinitions[npcId];
      for (const line of npc.dialogue) {
        expect(line).toMatch(/[\u4e00-\u9fff]/);
        expect(line.length).toBeGreaterThan(5);
      }
    }
  });

  it('all new NPCs have contextual dialogue (≥2 lines)', () => {
    const allNewNpcIds = Object.values(NEW_NPCS_BY_ZONE).flat();
    for (const npcId of allNewNpcIds) {
      const npc = NPCDefinitions[npcId];
      expect(npc.dialogue.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('merchant NPCs have shopItems defined', () => {
    const allNewNpcIds = Object.values(NEW_NPCS_BY_ZONE).flat();
    for (const npcId of allNewNpcIds) {
      const npc = NPCDefinitions[npcId];
      if (npc.type === 'merchant') {
        expect(npc.shopItems).toBeDefined();
        expect(npc.shopItems!.length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Field NPC Placement in Maps
// ---------------------------------------------------------------------------
describe('Field NPC Placement', () => {
  it.each(ZONE_IDS)('zone %s has ≥2 field NPCs placed in the map', (zoneId) => {
    const map = AllMaps[zoneId];
    expect(map.fieldNpcs).toBeDefined();
    expect(map.fieldNpcs!.length).toBeGreaterThanOrEqual(2);
  });

  it.each(ZONE_IDS)('zone %s field NPCs are within map bounds', (zoneId) => {
    const map = AllMaps[zoneId];
    for (const fnpc of map.fieldNpcs!) {
      expect(fnpc.col).toBeGreaterThanOrEqual(1);
      expect(fnpc.col).toBeLessThan(map.cols - 1);
      expect(fnpc.row).toBeGreaterThanOrEqual(1);
      expect(fnpc.row).toBeLessThan(map.rows - 1);
    }
  });

  it.each(ZONE_IDS)('zone %s field NPC IDs reference valid NPC definitions', (zoneId) => {
    const map = AllMaps[zoneId];
    for (const fnpc of map.fieldNpcs!) {
      expect(NPCDefinitions[fnpc.npcId]).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Hidden Areas
// ---------------------------------------------------------------------------
describe('Hidden Areas', () => {
  it.each(ZONE_IDS)('zone %s has ≥1 hidden area', (zoneId) => {
    const map = AllMaps[zoneId];
    expect(map.hiddenAreas).toBeDefined();
    expect(map.hiddenAreas!.length).toBeGreaterThanOrEqual(1);
  });

  it.each(ZONE_IDS)('zone %s hidden areas have valid structure', (zoneId) => {
    const map = AllMaps[zoneId];
    for (const area of map.hiddenAreas!) {
      expect(area.id.length).toBeGreaterThan(0);
      expect(area.name).toMatch(/[\u4e00-\u9fff]/);
      expect(area.discoveryText).toMatch(/[\u4e00-\u9fff]/);
      expect(area.discoveryText.length).toBeGreaterThanOrEqual(20);
      expect(area.radius).toBeGreaterThan(0);
      expect(area.rewards.length).toBeGreaterThan(0);
    }
  });

  it.each(ZONE_IDS)('zone %s hidden areas are within map bounds', (zoneId) => {
    const map = AllMaps[zoneId];
    for (const area of map.hiddenAreas!) {
      expect(area.col).toBeGreaterThanOrEqual(1);
      expect(area.col).toBeLessThan(map.cols - 1);
      expect(area.row).toBeGreaterThanOrEqual(1);
      expect(area.row).toBeLessThan(map.rows - 1);
      // Rewards must also be in bounds
      for (const reward of area.rewards) {
        expect(reward.col).toBeGreaterThanOrEqual(1);
        expect(reward.col).toBeLessThan(map.cols - 1);
        expect(reward.row).toBeGreaterThanOrEqual(1);
        expect(reward.row).toBeLessThan(map.rows - 1);
      }
    }
  });

  it('hidden area IDs are unique across all zones', () => {
    const allIds: string[] = [];
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const area of map.hiddenAreas ?? []) {
        allIds.push(area.id);
      }
    }
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });
});

// ---------------------------------------------------------------------------
// Sub-Dungeons
// ---------------------------------------------------------------------------
describe('Sub-Dungeon Definitions', () => {
  it('defines at least 2 sub-dungeons', () => {
    expect(Object.keys(AllSubDungeons).length).toBeGreaterThanOrEqual(2);
  });

  it('sub-dungeons are in at least 2 different zones', () => {
    const zonesWithSubDungeons = Object.keys(SubDungeonsByZone);
    expect(zonesWithSubDungeons.length).toBeGreaterThanOrEqual(2);
  });

  it.each(Object.keys(AllSubDungeons))('sub-dungeon %s has valid map data', (subId) => {
    const sub = AllSubDungeons[subId];
    expect(sub.id).toBe(subId);
    expect(sub.name).toMatch(/[\u4e00-\u9fff]/);
    expect(sub.cols).toBeGreaterThan(0);
    expect(sub.rows).toBeGreaterThan(0);
    expect(sub.theme).toBeDefined();
    expect(sub.seed).toBeGreaterThan(0);
    expect(sub.levelRange[0]).toBeLessThanOrEqual(sub.levelRange[1]);
  });

  it.each(Object.keys(AllSubDungeons))('sub-dungeon %s has spawns', (subId) => {
    const sub = AllSubDungeons[subId];
    expect(sub.spawns.length).toBeGreaterThan(0);
    for (const spawn of sub.spawns) {
      expect(spawn.col).toBeGreaterThanOrEqual(1);
      expect(spawn.col).toBeLessThan(sub.cols - 1);
      expect(spawn.row).toBeGreaterThanOrEqual(1);
      expect(spawn.row).toBeLessThan(sub.rows - 1);
      expect(spawn.count).toBeGreaterThan(0);
    }
  });

  it.each(Object.keys(AllSubDungeons))('sub-dungeon %s has a mini-boss', (subId) => {
    const sub = AllSubDungeons[subId];
    expect(sub.miniBoss).toBeDefined();
    expect(sub.miniBoss.col).toBeGreaterThanOrEqual(1);
    expect(sub.miniBoss.col).toBeLessThan(sub.cols - 1);
    expect(sub.miniBoss.row).toBeGreaterThanOrEqual(1);
    expect(sub.miniBoss.row).toBeLessThan(sub.rows - 1);
    expect(sub.miniBoss.monsterId.length).toBeGreaterThan(0);
    // Mini-boss definition must exist
    expect(SubDungeonMiniBosses[sub.miniBoss.monsterId]).toBeDefined();
  });

  it.each(Object.keys(AllSubDungeons))('sub-dungeon %s has player start and exit', (subId) => {
    const sub = AllSubDungeons[subId];
    // Player start within bounds
    expect(sub.playerStart.col).toBeGreaterThanOrEqual(1);
    expect(sub.playerStart.col).toBeLessThan(sub.cols - 1);
    expect(sub.playerStart.row).toBeGreaterThanOrEqual(1);
    expect(sub.playerStart.row).toBeLessThan(sub.rows - 1);
    // Exit within bounds
    expect(sub.exit.col).toBeGreaterThanOrEqual(1);
    expect(sub.exit.col).toBeLessThan(sub.cols - 1);
    expect(sub.exit.row).toBeGreaterThanOrEqual(1);
    expect(sub.exit.row).toBeLessThan(sub.rows - 1);
  });

  it.each(Object.keys(AllSubDungeons))('sub-dungeon %s exit returns to valid parent zone position', (subId) => {
    const sub = AllSubDungeons[subId];
    const parentMap = AllMaps[sub.parentZone];
    expect(parentMap).toBeDefined();
    expect(sub.exit.returnCol).toBeGreaterThanOrEqual(1);
    expect(sub.exit.returnCol).toBeLessThan(parentMap.cols - 1);
    expect(sub.exit.returnRow).toBeGreaterThanOrEqual(1);
    expect(sub.exit.returnRow).toBeLessThan(parentMap.rows - 1);
  });

  it.each(Object.keys(AllSubDungeons))('sub-dungeon %s references a valid parent zone', (subId) => {
    const sub = AllSubDungeons[subId];
    expect(AllMaps[sub.parentZone]).toBeDefined();
  });

  it.each(Object.keys(AllSubDungeons))('sub-dungeon %s spawns reference known monster IDs', (subId) => {
    const sub = AllSubDungeons[subId];
    for (const spawn of sub.spawns) {
      const monsterDef = getMonsterDef(spawn.monsterId);
      expect(monsterDef).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Sub-Dungeon Mini-Bosses
// ---------------------------------------------------------------------------
describe('Sub-Dungeon Mini-Bosses', () => {
  it.each(Object.keys(SubDungeonMiniBosses))('mini-boss %s has valid stats', (bossId) => {
    const boss = SubDungeonMiniBosses[bossId];
    expect(boss.id).toBe(bossId);
    expect(boss.elite).toBe(true);
    expect(boss.name).toMatch(/[\u4e00-\u9fff]/);
    expect(boss.hp).toBeGreaterThan(0);
    expect(boss.damage).toBeGreaterThan(0);
    expect(boss.defense).toBeGreaterThanOrEqual(0);
    expect(boss.speed).toBeGreaterThan(0);
    expect(boss.expReward).toBeGreaterThan(0);
    expect(boss.goldReward[0]).toBeGreaterThan(0);
    expect(boss.goldReward[1]).toBeGreaterThanOrEqual(boss.goldReward[0]);
  });

  it.each(Object.keys(SubDungeonMiniBosses))('mini-boss %s has enhanced loot table', (bossId) => {
    const boss = SubDungeonMiniBosses[bossId];
    expect(boss.lootTable).toBeDefined();
    expect(boss.lootTable!.length).toBeGreaterThan(0);
    const hasGoodDrop = boss.lootTable!.some(
      (lt) => lt.quality && lt.quality !== 'normal' && lt.dropRate > 0
    );
    expect(hasGoodDrop).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Sub-Dungeon Entrances in Parent Zones
// ---------------------------------------------------------------------------
describe('Sub-Dungeon Entrances in Maps', () => {
  it('anvil_mountains has sub-dungeon entrance', () => {
    const map = AllMaps['anvil_mountains'];
    expect(map.subDungeonEntrances).toBeDefined();
    expect(map.subDungeonEntrances!.length).toBeGreaterThanOrEqual(1);
  });

  it('abyss_rift has sub-dungeon entrance', () => {
    const map = AllMaps['abyss_rift'];
    expect(map.subDungeonEntrances).toBeDefined();
    expect(map.subDungeonEntrances!.length).toBeGreaterThanOrEqual(1);
  });

  const zonesWithSubDungeons = ['anvil_mountains', 'abyss_rift'];
  it.each(zonesWithSubDungeons)('zone %s sub-dungeon entrances are within map bounds', (zoneId) => {
    const map = AllMaps[zoneId];
    for (const entrance of map.subDungeonEntrances!) {
      expect(entrance.col).toBeGreaterThanOrEqual(1);
      expect(entrance.col).toBeLessThan(map.cols - 1);
      expect(entrance.row).toBeGreaterThanOrEqual(1);
      expect(entrance.row).toBeLessThan(map.rows - 1);
    }
  });

  it.each(zonesWithSubDungeons)('zone %s sub-dungeon entrance targets reference valid sub-dungeons', (zoneId) => {
    const map = AllMaps[zoneId];
    for (const entrance of map.subDungeonEntrances!) {
      expect(entrance.name).toMatch(/[\u4e00-\u9fff]/);
      expect(AllSubDungeons[entrance.targetSubDungeon]).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Environmental Storytelling Decorations
// ---------------------------------------------------------------------------
describe('Environmental Storytelling Decorations', () => {
  it.each(ZONE_IDS)('zone %s has ≥3 story decorations', (zoneId) => {
    const map = AllMaps[zoneId];
    expect(map.storyDecorations).toBeDefined();
    expect(map.storyDecorations!.length).toBeGreaterThanOrEqual(3);
  });

  it.each(ZONE_IDS)('zone %s story decorations have valid structure', (zoneId) => {
    const map = AllMaps[zoneId];
    for (const deco of map.storyDecorations!) {
      expect(deco.id.length).toBeGreaterThan(0);
      expect(deco.name).toMatch(/[\u4e00-\u9fff]/);
      expect(deco.description).toMatch(/[\u4e00-\u9fff]/);
      expect(deco.description.length).toBeGreaterThanOrEqual(30);
      expect(deco.spriteType.length).toBeGreaterThan(0);
    }
  });

  it.each(ZONE_IDS)('zone %s story decorations are within map bounds', (zoneId) => {
    const map = AllMaps[zoneId];
    for (const deco of map.storyDecorations!) {
      expect(deco.col).toBeGreaterThanOrEqual(1);
      expect(deco.col).toBeLessThan(map.cols - 1);
      expect(deco.row).toBeGreaterThanOrEqual(1);
      expect(deco.row).toBeLessThan(map.rows - 1);
    }
  });

  it('story decoration IDs are unique across all zones', () => {
    const allIds: string[] = [];
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const deco of map.storyDecorations ?? []) {
        allIds.push(deco.id);
      }
    }
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  it('story decoration sprite types are valid', () => {
    const validTypes = ['ruins', 'skeletal_remains', 'ancient_statue', 'broken_altar', 'war_banner', 'charred_tree', 'collapsed_pillar', 'ritual_circle', 'frozen_corpse', 'sand_buried_structure'];
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const deco of map.storyDecorations ?? []) {
        expect(validTypes).toContain(deco.spriteType);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// All Content Strings in Chinese
// ---------------------------------------------------------------------------
describe('All new content strings are in Chinese', () => {
  it('all new NPC names are Chinese', () => {
    const allNewNpcIds = Object.values(NEW_NPCS_BY_ZONE).flat();
    for (const npcId of allNewNpcIds) {
      const npc = NPCDefinitions[npcId];
      expect(npc.name).toMatch(/[\u4e00-\u9fff]/);
    }
  });

  it('all hidden area names and discovery texts are Chinese', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const area of map.hiddenAreas ?? []) {
        expect(area.name).toMatch(/[\u4e00-\u9fff]/);
        expect(area.discoveryText).toMatch(/[\u4e00-\u9fff]/);
      }
    }
  });

  it('all sub-dungeon names are Chinese', () => {
    for (const sub of Object.values(AllSubDungeons)) {
      expect(sub.name).toMatch(/[\u4e00-\u9fff]/);
    }
  });

  it('all sub-dungeon entrance names are Chinese', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const entrance of map.subDungeonEntrances ?? []) {
        expect(entrance.name).toMatch(/[\u4e00-\u9fff]/);
      }
    }
  });

  it('all sub-dungeon mini-boss names are Chinese', () => {
    for (const boss of Object.values(SubDungeonMiniBosses)) {
      expect(boss.name).toMatch(/[\u4e00-\u9fff]/);
    }
  });

  it('all story decoration names and descriptions are Chinese', () => {
    for (const zoneId of ZONE_IDS) {
      const map = AllMaps[zoneId];
      for (const deco of map.storyDecorations ?? []) {
        expect(deco.name).toMatch(/[\u4e00-\u9fff]/);
        expect(deco.description).toMatch(/[\u4e00-\u9fff]/);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Integration: No overlaps between new content positions
// ---------------------------------------------------------------------------
describe('Content placement avoids collisions', () => {
  it.each(ZONE_IDS)('zone %s field NPCs are not on camp positions', (zoneId) => {
    const map = AllMaps[zoneId];
    const campPositions = new Set(
      map.camps.map((c) => `${c.col},${c.row}`)
    );
    for (const fnpc of map.fieldNpcs ?? []) {
      expect(campPositions.has(`${fnpc.col},${fnpc.row}`)).toBe(false);
    }
  });

  it.each(ZONE_IDS)('zone %s field NPCs are not on spawn positions', (zoneId) => {
    const map = AllMaps[zoneId];
    const spawnPositions = new Set(
      map.spawns.map((s) => `${s.col},${s.row}`)
    );
    for (const fnpc of map.fieldNpcs ?? []) {
      expect(spawnPositions.has(`${fnpc.col},${fnpc.row}`)).toBe(false);
    }
  });

  it.each(ZONE_IDS)('zone %s field NPCs are not on exit positions', (zoneId) => {
    const map = AllMaps[zoneId];
    const exitPositions = new Set(
      map.exits.map((e) => `${e.col},${e.row}`)
    );
    for (const fnpc of map.fieldNpcs ?? []) {
      expect(exitPositions.has(`${fnpc.col},${fnpc.row}`)).toBe(false);
    }
  });
});
