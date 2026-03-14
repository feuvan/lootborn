import type { MapData } from '../types';

// Tile/collision arrays are generated at runtime by MapGenerator
// Original size: 25x25 → New size: 80x80 (scale factor ~3.2x)
// Tile types: 0=grass, 1=dirt_path, 2=stone, 3=water, 4=wall, 5=camp_ground

export const AbyssRiftMap: MapData = {
  id: 'abyss_rift',
  name: '深渊裂谷',
  cols: 80,
  rows: 80,
  tiles: [],
  collisions: [],
  theme: 'abyss',
  seed: 61725,
  bgColor: '#0a0005',
  spawns: [
    { col: 26, row: 10, monsterId: 'imp', count: 10 },
    { col: 58, row: 16, monsterId: 'imp', count: 8 },
    { col: 16, row: 32, monsterId: 'lesser_demon', count: 6 },
    { col: 48, row: 26, monsterId: 'lesser_demon', count: 6 },
    { col: 64, row: 38, monsterId: 'succubus', count: 6 },
    { col: 26, row: 58, monsterId: 'succubus', count: 6 },
    { col: 38, row: 70, monsterId: 'demon_lord', count: 2 },
    { col: 40, row: 45, monsterId: 'imp', count: 6 },
    { col: 55, row: 55, monsterId: 'lesser_demon', count: 4 },
    { col: 15, row: 65, monsterId: 'succubus', count: 3 },
  ],
  camps: [
    { col: 6, row: 16, npcs: ['blacksmith_advanced', 'merchant_desert', 'stash', 'quest_warden'] },
    { col: 58, row: 67, npcs: ['merchant_desert'] },
  ],
  playerStart: { col: 3, row: 38 },
  exits: [
    { col: 1, row: 38, targetMap: 'scorching_desert', targetCol: 77, targetRow: 70 },
  ],
  levelRange: [40, 50] as [number, number],
};
