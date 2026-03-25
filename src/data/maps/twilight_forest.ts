import type { MapData } from '../types';

// Tile/collision arrays are generated at runtime by MapGenerator
// Size: 120x120 (expanded from 80x80 for deeper exploration)
// Tile types: 0=grass, 1=dirt_path, 2=stone, 3=water, 4=wall, 5=camp_ground

export const TwilightForestMap: MapData = {
  id: 'twilight_forest',
  name: '暮色森林',
  cols: 120,
  rows: 120,
  tiles: [],
  collisions: [],
  theme: 'forest',
  seed: 24690,
  bgColor: '#141a22',
  spawns: [
    // Q1 — top-left quadrant
    { col: 25, row: 15, monsterId: 'skeleton', count: 8 },
    { col: 40, row: 40, monsterId: 'zombie', count: 6 },
    { col: 15, row: 45, monsterId: 'zombie', count: 8 },
    // Q2 — top-right quadrant
    { col: 80, row: 18, monsterId: 'skeleton', count: 6 },
    { col: 95, row: 40, monsterId: 'skeleton', count: 5 },
    // Q3 — bottom-left quadrant
    { col: 30, row: 70, monsterId: 'werewolf', count: 6 },
    { col: 20, row: 95, monsterId: 'werewolf', count: 6 },
    // Q4 — bottom-right quadrant
    { col: 85, row: 80, monsterId: 'werewolf', count: 6 },
    { col: 90, row: 90, monsterId: 'werewolf_alpha', count: 2 },
    { col: 100, row: 65, monsterId: 'zombie', count: 4 },
  ],
  camps: [
    { col: 18, row: 52, npcs: ['blacksmith', 'merchant', 'quest_scout'] },
    { col: 105, row: 100, npcs: ['merchant'] },
    { col: 100, row: 62, npcs: ['forest_hermit'] },
  ],
  playerStart: { col: 3, row: 58 },
  exits: [
    { col: 0, row: 58, targetMap: 'emerald_plains', targetCol: 118, targetRow: 60 },
    { col: 119, row: 119, targetMap: 'anvil_mountains', targetCol: 2, targetRow: 58 },
  ],
  petSpawns: [
    { col: 70, row: 35, petId: 'pet_void_butterfly', chance: 0.08 },
    { col: 45, row: 100, petId: 'pet_void_butterfly', chance: 0.08 },
  ],
  levelRange: [8, 17] as [number, number],

  // ─── New Content: Field NPCs ──────────────────────────────────────────
  fieldNpcs: [
    { col: 60, row: 50, npcId: 'forest_tracker' },
    { col: 35, row: 85, npcId: 'forest_spirit_medium' },
  ],

  // ─── New Content: Hidden Area ─────────────────────────────────────────
  hiddenAreas: [
    {
      id: 'hidden_tf_moonlight_shrine',
      name: '月光祭坛',
      col: 110,
      row: 15,
      radius: 5,
      discoveryText: '在茂密的树冠缝隙中，一道银白色的月光照射在一座古老的祭坛上。这就是传说中能净化亡灵的月光祭坛！',
      rewards: [
        { type: 'chest', value: 'rare', col: 110, row: 15 },
        { type: 'lore', col: 112, row: 14 },
      ],
    },
  ],

  // ─── New Content: Environmental Storytelling Decorations ──────────────
  storyDecorations: [
    {
      id: 'story_tf_skeletal_patrol',
      name: '巡逻亡灵遗骸',
      description: '数具身着铠甲的骷髅散落在林间小道旁。从他们的阵型来看，这曾是一支巡逻队。铠甲上的徽章表明他们是森林守卫骑士团的成员——在暮色降临时，他们是第一批牺牲的人。',
      col: 48, row: 28,
      spriteType: 'skeletal_remains',
    },
    {
      id: 'story_tf_corrupted_shrine',
      name: '被腐蚀的神龛',
      description: '一座本应供奉森林之神的小型神龛，如今被黑暗能量彻底腐蚀。神像面目模糊，周围的石板上渗出淡淡的紫色雾气。有人在神龛前留下了枯萎的花束。',
      col: 72, row: 60,
      spriteType: 'broken_altar',
    },
    {
      id: 'story_tf_ancient_tree_stump',
      name: '千年古树残桩',
      description: '一棵巨大的古树被拦腰折断，树桩的直径超过十人合抱。年轮中心处散发着微弱的绿光——这是森林生命之树的一部分。即使被摧毁，它仍在顽强地释放着生命能量。',
      col: 15, row: 75,
      spriteType: 'charred_tree',
    },
  ],
};
