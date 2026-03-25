import type { MapData } from '../types';

// Tile/collision arrays are generated at runtime by MapGenerator
// Size: 120x120 (expanded from 80x80 for deeper exploration)
// Tile types: 0=grass, 1=dirt_path, 2=stone, 3=water, 4=wall, 5=camp_ground

export const AnvilMountainsMap: MapData = {
  id: 'anvil_mountains',
  name: '铁砧山脉',
  cols: 120,
  rows: 120,
  tiles: [],
  collisions: [],
  theme: 'mountain',
  seed: 37035,
  bgColor: '#222228',
  spawns: [
    // Q1 — top-left quadrant
    { col: 35, row: 15, monsterId: 'gargoyle', count: 8 },
    { col: 28, row: 38, monsterId: 'stone_golem', count: 6 },
    { col: 50, row: 30, monsterId: 'gargoyle', count: 5 },
    // Q2 — top-right quadrant
    { col: 85, row: 20, monsterId: 'gargoyle', count: 6 },
    { col: 95, row: 42, monsterId: 'gargoyle', count: 6 },
    // Q3 — bottom-left quadrant
    { col: 35, row: 95, monsterId: 'stone_golem', count: 6 },
    { col: 15, row: 85, monsterId: 'mountain_troll', count: 1 },
    // Q4 — bottom-right quadrant
    { col: 70, row: 60, monsterId: 'stone_golem', count: 6 },
    { col: 65, row: 90, monsterId: 'mountain_troll', count: 2 },
    { col: 85, row: 78, monsterId: 'stone_golem', count: 4 },
  ],
  camps: [
    { col: 15, row: 48, npcs: ['blacksmith_advanced', 'merchant', 'stash', 'quest_dwarf'] },
    { col: 88, row: 100, npcs: ['merchant'] },
  ],
  playerStart: { col: 3, row: 58 },
  exits: [
    { col: 0, row: 58, targetMap: 'twilight_forest', targetCol: 118, targetRow: 118 },
    { col: 119, row: 119, targetMap: 'scorching_desert', targetCol: 2, targetRow: 58 },
  ],
  levelRange: [18, 27] as [number, number],

  // ─── New Content: Field NPCs ──────────────────────────────────────────
  fieldNpcs: [
    { col: 55, row: 50, npcId: 'mountain_miner' },
    { col: 78, row: 35, npcId: 'mountain_rune_scholar' },
  ],

  // ─── New Content: Hidden Area ─────────────────────────────────────────
  hiddenAreas: [
    {
      id: 'hidden_am_dwarf_vault',
      name: '矮人秘密金库',
      col: 105,
      row: 18,
      radius: 5,
      discoveryText: '你在岩壁上发现了一扇隐蔽的矮人石门！推开后，一间尘封已久的金库出现在眼前。',
      rewards: [
        { type: 'chest', value: 'rare', col: 105, row: 18 },
        { type: 'gold_pile', value: '500', col: 107, row: 17 },
      ],
    },
  ],

  // ─── New Content: Sub-Dungeon Entrance ────────────────────────────────
  subDungeonEntrances: [
    {
      id: 'entrance_dwarf_mine',
      name: '废弃矿道入口',
      col: 35,
      row: 92,
      targetSubDungeon: 'sub_dwarf_mine',
    },
  ],

  // ─── New Content: Environmental Storytelling Decorations ──────────────
  storyDecorations: [
    {
      id: 'story_am_collapsed_bridge',
      name: '坍塌的矮人桥',
      description: '一座曾横跨峡谷的石桥已经坍塌大半。桥墩上的矮人浮雕依然精美绝伦，描绘着矮人工匠锻造传奇武器的场景。桥下的深渊中传来阵阵寒风。',
      col: 60, row: 25,
      spriteType: 'collapsed_pillar',
    },
    {
      id: 'story_am_dwarf_statue',
      name: '矮人王石像',
      description: '一座高达三米的矮人战王石像，手持战锤，身披铠甲。石像基座上刻着铭文："铁砧之王布鲁恩——他的锤声永远回荡在山脉深处。"石像虽残缺，仍散发着庄严的气势。',
      col: 40, row: 65,
      spriteType: 'ancient_statue',
    },
    {
      id: 'story_am_abandoned_forge',
      name: '废弃的锻造炉',
      description: '一座巨大的矮人锻造炉，炉火早已熄灭。炉膛中残留着未完成的金属制品——一把只锻造了一半的战斧。旁边散落着矮人工匠的工具，仿佛他们是在匆忙中抛下一切逃离的。',
      col: 92, row: 55,
      spriteType: 'ruins',
    },
  ],
};
