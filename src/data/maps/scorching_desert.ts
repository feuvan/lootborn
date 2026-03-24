import type { MapData } from '../types';

// Tile/collision arrays are generated at runtime by MapGenerator
// Size: 120x120 (expanded from 80x80 for deeper exploration)
// Tile types: 0=grass, 1=dirt_path, 2=stone, 3=water, 4=wall, 5=camp_ground

export const ScorchingDesertMap: MapData = {
  id: 'scorching_desert',
  name: '灼热荒漠',
  cols: 120,
  rows: 120,
  tiles: [],
  collisions: [],
  theme: 'desert',
  seed: 49380,
  bgColor: '#2c1810',
  spawns: [
    // Q1 — top-left quadrant
    { col: 35, row: 22, monsterId: 'fire_elemental', count: 8 },
    { col: 20, row: 55, monsterId: 'desert_scorpion', count: 8 },
    // Q2 — top-right quadrant
    { col: 85, row: 15, monsterId: 'fire_elemental', count: 6 },
    { col: 75, row: 48, monsterId: 'sandworm', count: 6 },
    { col: 65, row: 30, monsterId: 'fire_elemental', count: 5 },
    // Q3 — bottom-left quadrant
    { col: 45, row: 85, monsterId: 'sandworm', count: 6 },
    { col: 30, row: 80, monsterId: 'desert_scorpion', count: 4 },
    { col: 45, row: 105, monsterId: 'phoenix', count: 2 },
    // Q4 — bottom-right quadrant
    { col: 95, row: 70, monsterId: 'desert_scorpion', count: 6 },
    { col: 80, row: 108, monsterId: 'sandworm', count: 3 },
  ],
  camps: [
    { col: 15, row: 15, npcs: ['blacksmith_advanced', 'merchant_desert', 'stash', 'quest_nomad'] },
    { col: 95, row: 95, npcs: ['merchant_desert'] },
  ],
  playerStart: { col: 3, row: 58 },
  exits: [
    { col: 0, row: 58, targetMap: 'anvil_mountains', targetCol: 118, targetRow: 118 },
    { col: 119, row: 119, targetMap: 'abyss_rift', targetCol: 2, targetRow: 58 },
  ],
  petSpawns: [
    { col: 55, row: 50, petId: 'pet_void_butterfly', chance: 0.08 },
    { col: 100, row: 30, petId: 'pet_void_butterfly', chance: 0.08 },
  ],
  levelRange: [28, 37] as [number, number],

  // ─── New Content: Field NPCs ──────────────────────────────────────────
  fieldNpcs: [
    { col: 60, row: 40, npcId: 'desert_archaeologist' },
    { col: 40, row: 65, npcId: 'desert_water_diviner' },
  ],

  // ─── New Content: Hidden Area ─────────────────────────────────────────
  hiddenAreas: [
    {
      id: 'hidden_sd_buried_oasis',
      name: '古代绿洲遗址',
      col: 15,
      row: 110,
      radius: 6,
      discoveryText: '你在沙丘之间发现了一片被掩埋的古代绿洲遗址！干涸的泉眼周围仍残留着昔日花园的痕迹。',
      rewards: [
        { type: 'chest', value: 'rare', col: 15, row: 110 },
        { type: 'gold_pile', value: '400', col: 17, row: 109 },
      ],
    },
  ],

  // ─── New Content: Environmental Storytelling Decorations ──────────────
  storyDecorations: [
    {
      id: 'story_sd_half_buried_palace',
      name: '半埋的宫殿残垣',
      description: '一面精美的宫殿墙壁从沙丘中露出。墙上的壁画描绘着沙漠王国鼎盛时期的繁华景象——喷泉、花园、身着华服的人们在阳光下欢笑。如今一切都被黄沙掩埋。',
      col: 70, row: 20,
      spriteType: 'sand_buried_structure',
    },
    {
      id: 'story_sd_fire_scarred_ground',
      name: '焦灼大地裂痕',
      description: '地面上有一道深深的裂痕，边缘呈现出被高温灼烧的痕迹。从裂缝深处偶尔会涌出热气，带着硫磺的气味。这就是当年火焰裂隙撕裂大地时留下的伤痕。',
      col: 55, row: 75,
      spriteType: 'ritual_circle',
    },
    {
      id: 'story_sd_scorpion_nest_remains',
      name: '巨型蝎壳残骸',
      description: '一具巨大的沙漠蝎子外壳散落在沙地上，光是蝎钳就有一人多高。这似乎是一只远古巨蝎的遗骸——当年沙漠王国的勇士们曾与这些庞然大物战斗过。',
      col: 88, row: 50,
      spriteType: 'skeletal_remains',
    },
  ],
};
