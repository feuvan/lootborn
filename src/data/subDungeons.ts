/**
 * Sub-dungeon definitions — separate map areas accessible via entrance tiles.
 * Each has own spawns, a mini-boss, and an exit back to the parent zone.
 * Sub-dungeon entrances are interactable objects on the parent zone map.
 */

import type { SubDungeonMapData, MonsterDefinition } from './types';

// ─── Sub-Dungeon 1: Abandoned Dwarf Mine (Anvil Mountains) ─────────────
export const subDungeonDwarfMine: SubDungeonMapData = {
  id: 'sub_dwarf_mine',
  name: '废弃矮人矿道',
  parentZone: 'anvil_mountains',
  cols: 40,
  rows: 40,
  theme: 'mountain',
  seed: 77701,
  spawns: [
    { col: 12, row: 10, monsterId: 'gargoyle', count: 4 },
    { col: 25, row: 15, monsterId: 'stone_golem', count: 3 },
    { col: 10, row: 25, monsterId: 'gargoyle', count: 4 },
    { col: 30, row: 28, monsterId: 'stone_golem', count: 3 },
  ],
  miniBoss: { col: 20, row: 32, monsterId: 'sub_mine_guardian' },
  playerStart: { col: 5, row: 5 },
  exit: { col: 5, row: 3, returnCol: 35, returnRow: 92 },
  levelRange: [20, 27],
  bgColor: '#161616',
};

// ─── Sub-Dungeon 2: Demon Altar Cavern (Abyss Rift) ───────────────────
export const subDungeonDemonAltar: SubDungeonMapData = {
  id: 'sub_demon_altar',
  name: '恶魔祭坛洞窟',
  parentZone: 'abyss_rift',
  cols: 40,
  rows: 40,
  theme: 'abyss',
  seed: 88802,
  spawns: [
    { col: 10, row: 12, monsterId: 'imp', count: 6 },
    { col: 28, row: 10, monsterId: 'lesser_demon', count: 4 },
    { col: 15, row: 25, monsterId: 'succubus', count: 3 },
    { col: 30, row: 30, monsterId: 'lesser_demon', count: 4 },
  ],
  miniBoss: { col: 20, row: 35, monsterId: 'sub_altar_keeper' },
  playerStart: { col: 5, row: 5 },
  exit: { col: 5, row: 3, returnCol: 90, returnRow: 40 },
  levelRange: [40, 48],
  bgColor: '#140810',
};

/** Sub-dungeon mini-boss definitions. */
export const SubDungeonMiniBosses: Record<string, MonsterDefinition> = {
  sub_mine_guardian: {
    id: 'sub_mine_guardian',
    name: '矿道铁卫',
    level: 26,
    hp: 1300,
    damage: 42,
    defense: 38,
    speed: 28,
    aggroRange: 8,
    attackRange: 2.0,
    attackSpeed: 1500,
    expReward: 280,
    goldReward: [45, 90],
    spriteKey: 'monster_sub_mine_guardian',
    elite: true,
    isMiniBoss: true,
    isSubDungeonMiniBoss: true,
    animCategory: 'large',
    lootTable: [
      { quality: 'magic', dropRate: 0.9 },
      { quality: 'rare', dropRate: 0.5 },
      { quality: 'legendary', dropRate: 0.05 },
    ],
  },
  sub_altar_keeper: {
    id: 'sub_altar_keeper',
    name: '祭坛守卫者',
    level: 46,
    hp: 3800,
    damage: 72,
    defense: 45,
    speed: 48,
    aggroRange: 9,
    attackRange: 3.0,
    attackSpeed: 950,
    expReward: 520,
    goldReward: [120, 240],
    spriteKey: 'monster_sub_altar_keeper',
    elite: true,
    isMiniBoss: true,
    isSubDungeonMiniBoss: true,
    animCategory: 'demonic',
    lootTable: [
      { quality: 'rare', dropRate: 0.8 },
      { quality: 'legendary', dropRate: 0.12 },
      { quality: 'set', dropRate: 0.05 },
    ],
  },
};

/** All sub-dungeon map data indexed by sub-dungeon ID. */
export const AllSubDungeons: Record<string, SubDungeonMapData> = {
  sub_dwarf_mine: subDungeonDwarfMine,
  sub_demon_altar: subDungeonDemonAltar,
};

/** Map from parent zone ID → sub-dungeon IDs available in that zone. */
export const SubDungeonsByZone: Record<string, string[]> = {
  anvil_mountains: ['sub_dwarf_mine'],
  abyss_rift: ['sub_demon_altar'],
};
