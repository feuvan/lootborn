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
    { col: 0, row: 58, targetMap: 'anvil_mountains', targetCol: 118, targetRow: 119 },
    { col: 119, row: 119, targetMap: 'abyss_rift', targetCol: 2, targetRow: 58 },
  ],
  levelRange: [28, 37] as [number, number],
};
