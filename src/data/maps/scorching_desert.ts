import type { MapData } from '../types';

// Tile/collision arrays are generated at runtime by MapGenerator
// Original size: 25x25 → New size: 80x80 (scale factor ~3.2x)
// Tile types: 0=grass, 1=dirt_path, 2=stone, 3=water, 4=wall, 5=camp_ground

export const ScorchingDesertMap: MapData = {
  id: 'scorching_desert',
  name: '灼热荒漠',
  cols: 80,
  rows: 80,
  tiles: [],
  collisions: [],
  theme: 'desert',
  seed: 49380,
  bgColor: '#2c1810',
  spawns: [
    { col: 26, row: 16, monsterId: 'fire_elemental', count: 8 },
    { col: 58, row: 10, monsterId: 'fire_elemental', count: 6 },
    { col: 16, row: 38, monsterId: 'desert_scorpion', count: 8 },
    { col: 51, row: 32, monsterId: 'sandworm', count: 6 },
    { col: 38, row: 58, monsterId: 'sandworm', count: 6 },
    { col: 64, row: 48, monsterId: 'desert_scorpion', count: 6 },
    { col: 32, row: 70, monsterId: 'phoenix', count: 2 },
    { col: 45, row: 22, monsterId: 'fire_elemental', count: 5 },
    { col: 20, row: 55, monsterId: 'desert_scorpion', count: 4 },
    { col: 60, row: 65, monsterId: 'sandworm', count: 3 },
  ],
  camps: [
    { col: 10, row: 10, npcs: ['blacksmith_advanced', 'merchant_desert', 'stash', 'quest_nomad'] },
    { col: 64, row: 64, npcs: ['merchant_desert'] },
  ],
  playerStart: { col: 3, row: 38 },
  exits: [
    { col: 1, row: 38, targetMap: 'anvil_mountains', targetCol: 77, targetRow: 70 },
    { col: 78, row: 74, targetMap: 'abyss_rift', targetCol: 1, targetRow: 38 },
  ],
  levelRange: [28, 37] as [number, number],
};
