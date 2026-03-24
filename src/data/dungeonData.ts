/**
 * Dungeon data — monster pool, boss definitions, and dungeon-exclusive items
 * for the Zone 6 random dungeon system.
 */

import type { MonsterDefinition, LegendaryDefinition } from './types';

/**
 * Monster IDs available in dungeon floors, ordered roughly by difficulty.
 * DungeonSystem picks 2-3 per floor based on depth.
 */
export const DungeonMonsterPool: string[] = [
  'imp',           // Weakest — early floors
  'lesser_demon',  // Mid-tier
  'succubus',      // Mid-tier ranged
  'dungeon_shade', // Dungeon-exclusive shadow type
  'dungeon_fiend', // Dungeon-exclusive heavy melee
];

/**
 * Dungeon-exclusive monster definitions.
 * These do NOT exist in overworld zones; they only spawn in the random dungeon.
 */
export const DungeonExclusiveMonsters: Record<string, MonsterDefinition> = {
  dungeon_shade: {
    id: 'dungeon_shade',
    name: '深渊暗影',
    level: 44,
    hp: 750,
    damage: 55,
    defense: 22,
    speed: 80,
    aggroRange: 8,
    attackRange: 2.5,
    attackSpeed: 800,
    expReward: 360,
    goldReward: [55, 110],
    spriteKey: 'monster_dungeon_shade',
    lootTable: [
      { quality: 'magic', dropRate: 0.25 },
      { quality: 'rare', dropRate: 0.1 },
    ],
    animCategory: 'flying',
  },
  dungeon_fiend: {
    id: 'dungeon_fiend',
    name: '深渊恶鬼',
    level: 47,
    hp: 1200,
    damage: 65,
    defense: 40,
    speed: 45,
    aggroRange: 7,
    attackRange: 2.0,
    attackSpeed: 1100,
    expReward: 420,
    goldReward: [65, 130],
    spriteKey: 'monster_dungeon_fiend',
    lootTable: [
      { quality: 'magic', dropRate: 0.28 },
      { quality: 'rare', dropRate: 0.12 },
      { quality: 'legendary', dropRate: 0.03 },
    ],
    animCategory: 'demonic',
  },
};

/**
 * Final floor boss — greatly elevated stats, special abilities, Chinese name plate.
 */
export const DungeonBossDef: MonsterDefinition = {
  id: 'dungeon_abyss_lord',
  name: '深渊之主·卡萨诺尔',
  level: 52,
  hp: 8000,
  damage: 95,
  defense: 55,
  speed: 40,
  aggroRange: 12,
  attackRange: 3.5,
  attackSpeed: 900,
  expReward: 1200,
  goldReward: [200, 400],
  spriteKey: 'monster_dungeon_boss',
  elite: true,
  isMiniBoss: false,
  bossSkills: ['void_nova', 'shadow_barrage', 'summon_shades', 'dark_enrage'],
  lootTable: [
    { quality: 'rare', dropRate: 1.0 },
    { quality: 'legendary', dropRate: 0.3 },
    { quality: 'set', dropRate: 0.15 },
    // Dungeon-exclusive legendaries have boosted drop rate from boss
    { itemId: 'leg_abyss_crown', quality: 'legendary', dropRate: 0.08 },
    { itemId: 'leg_void_edge', quality: 'legendary', dropRate: 0.08 },
  ],
  animCategory: 'large',
};

/**
 * Mid-boss — spawns every 3 floors in longer runs.
 */
export const DungeonMidBossDef: MonsterDefinition = {
  id: 'dungeon_mid_boss',
  name: '深渊守卫',
  level: 48,
  hp: 4000,
  damage: 70,
  defense: 42,
  speed: 50,
  aggroRange: 10,
  attackRange: 2.5,
  attackSpeed: 1000,
  expReward: 600,
  goldReward: [120, 250],
  spriteKey: 'monster_dungeon_mid_boss',
  elite: true,
  isMiniBoss: true,
  bossSkills: ['dark_slash', 'summon_imps'],
  lootTable: [
    { quality: 'magic', dropRate: 1.0 },
    { quality: 'rare', dropRate: 0.4 },
    { quality: 'legendary', dropRate: 0.08 },
  ],
  animCategory: 'demonic',
};

/**
 * Dungeon-exclusive legendary items.
 * These ONLY drop from dungeon bosses and cannot be found in the overworld.
 */
export const DUNGEON_EXCLUSIVE_LEGENDARIES: LegendaryDefinition[] = [
  {
    id: 'leg_abyss_crown',
    baseId: 'a_dragon_helm',
    name: '深渊之冠',
    nameEn: 'Crown of the Abyss',
    fixedAffixes: [
      { affixId: 'leg_ac1', name: '虚空之力', stat: 'damagePercent', value: 25 },
      { affixId: 'leg_ac2', name: '深渊护佑', stat: 'allResist', value: 18 },
      { affixId: 'leg_ac3', name: '暗能灌注', stat: 'maxHp', value: 120 },
      { affixId: 'leg_ac4', name: '迷宫统御', stat: 'defense', value: 30 },
    ],
    specialEffect: 'dungeonDamageBonus',
    specialEffectValue: 15,
    specialEffectDescription: '在深渊迷宫中所有伤害额外增加15%',
  },
  {
    id: 'leg_void_edge',
    baseId: 'w_demon_blade',
    name: '虚空之刃',
    nameEn: 'Voidedge',
    fixedAffixes: [
      { affixId: 'leg_ve1', name: '虚空切割', stat: 'damage', value: 55 },
      { affixId: 'leg_ve2', name: '深渊吞噬', stat: 'lifeSteal', value: 10 },
      { affixId: 'leg_ve3', name: '暗影灌注', stat: 'critDamage', value: 30 },
      { affixId: 'leg_ve4', name: '毁灭之力', stat: 'str', value: 15 },
    ],
    specialEffect: 'voidStrike',
    specialEffectValue: 20,
    specialEffectDescription: '每次攻击20%概率触发虚空打击，造成额外50%暗影伤害',
  },
];

/**
 * All dungeon monster definitions merged for runtime lookup.
 * This includes both dungeon-exclusive monsters and the boss/mid-boss.
 */
export const AllDungeonMonsters: Record<string, MonsterDefinition> = {
  ...DungeonExclusiveMonsters,
  [DungeonBossDef.id]: DungeonBossDef,
  [DungeonMidBossDef.id]: DungeonMidBossDef,
};
