import type { MapData } from '../types';

// Tile/collision arrays are generated at runtime by MapGenerator
// Size: 120x120 (expanded from 80x80 for deeper exploration)
// Tile types: 0=grass, 1=dirt_path, 2=stone, 3=water, 4=wall, 5=camp_ground

export const AbyssRiftMap: MapData = {
  id: 'abyss_rift',
  name: '深渊裂谷',
  cols: 120,
  rows: 120,
  tiles: [],
  collisions: [],
  theme: 'abyss',
  seed: 61725,
  bgColor: '#0a0005',
  spawns: [
    // Q1 — top-left quadrant
    { col: 35, row: 15, monsterId: 'imp', count: 10 },
    { col: 20, row: 48, monsterId: 'lesser_demon', count: 6 },
    // Q2 — top-right quadrant
    { col: 85, row: 22, monsterId: 'imp', count: 8 },
    { col: 70, row: 38, monsterId: 'lesser_demon', count: 6 },
    { col: 95, row: 55, monsterId: 'succubus', count: 6 },
    // Q3 — bottom-left quadrant
    { col: 35, row: 85, monsterId: 'succubus', count: 6 },
    { col: 20, row: 95, monsterId: 'succubus', count: 3 },
    { col: 55, row: 105, monsterId: 'demon_lord', count: 2 },
    // Q4 — bottom-right quadrant
    { col: 60, row: 65, monsterId: 'imp', count: 6 },
    { col: 80, row: 80, monsterId: 'lesser_demon', count: 4 },
  ],
  camps: [
    { col: 15, row: 22, npcs: ['blacksmith_advanced', 'merchant_desert', 'stash', 'quest_warden'] },
    { col: 88, row: 100, npcs: ['merchant_desert'] },
  ],
  playerStart: { col: 3, row: 58 },
  exits: [
    { col: 0, row: 58, targetMap: 'scorching_desert', targetCol: 118, targetRow: 119 },
  ],
  levelRange: [38, 48] as [number, number],
};
