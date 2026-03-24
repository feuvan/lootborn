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
  bgColor: '#0d1117',
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
  levelRange: [8, 17] as [number, number],
};
