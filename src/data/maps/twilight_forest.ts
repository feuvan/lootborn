import type { MapData } from '../types';

// Tile/collision arrays are generated at runtime by MapGenerator
// Original size: 25x25 → New size: 80x80 (scale factor ~3.2x)
// Tile types: 0=grass, 1=dirt_path, 2=stone, 3=water, 4=wall, 5=camp_ground

export const TwilightForestMap: MapData = {
  id: 'twilight_forest',
  name: '暮色森林',
  cols: 80,
  rows: 80,
  tiles: [],
  collisions: [],
  theme: 'forest',
  seed: 24690,
  bgColor: '#0d1117',
  spawns: [
    { col: 26, row: 10, monsterId: 'skeleton', count: 8 },
    { col: 51, row: 16, monsterId: 'skeleton', count: 6 },
    { col: 10, row: 29, monsterId: 'zombie', count: 8 },
    { col: 58, row: 26, monsterId: 'zombie', count: 6 },
    { col: 32, row: 48, monsterId: 'werewolf', count: 6 },
    { col: 19, row: 64, monsterId: 'werewolf', count: 6 },
    { col: 58, row: 58, monsterId: 'werewolf_alpha', count: 2 },
    { col: 40, row: 35, monsterId: 'skeleton', count: 5 },
    { col: 15, row: 50, monsterId: 'zombie', count: 4 },
    { col: 65, row: 42, monsterId: 'werewolf', count: 3 },
  ],
  camps: [
    { col: 13, row: 35, npcs: ['blacksmith', 'merchant', 'quest_scout'] },
    { col: 70, row: 67, npcs: ['merchant'] },
    { col: 66, row: 42, npcs: ['forest_hermit'] },
  ],
  playerStart: { col: 3, row: 38 },
  exits: [
    { col: 1, row: 38, targetMap: 'emerald_plains', targetCol: 77, targetRow: 40 },
    { col: 78, row: 74, targetMap: 'anvil_mountains', targetCol: 1, targetRow: 38 },
  ],
  levelRange: [10, 20] as [number, number],
};
