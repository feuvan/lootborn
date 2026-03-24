import type { MapData } from '../types';

// Tile/collision arrays are generated at runtime by MapGenerator
// Size: 120x120 (expanded from 80x80 for deeper exploration)
// Tile types: 0=grass, 1=dirt_path, 2=stone, 3=water, 4=wall, 5=camp_ground

export const EmeraldPlainsMap: MapData = {
  id: 'emerald_plains',
  name: '翡翠平原',
  cols: 120,
  rows: 120,
  tiles: [],
  collisions: [],
  theme: 'plains',
  seed: 12345,
  spawns: [
    // Q1 — top-left quadrant
    { col: 25, row: 20, monsterId: 'slime_green', count: 8 },
    { col: 35, row: 40, monsterId: 'goblin', count: 6 },
    { col: 20, row: 45, monsterId: 'slime_green', count: 5 },
    // Q2 — top-right quadrant
    { col: 85, row: 18, monsterId: 'slime_green', count: 6 },
    { col: 95, row: 35, monsterId: 'goblin', count: 6 },
    { col: 75, row: 50, monsterId: 'goblin_chief', count: 2 },
    // Q3 — bottom-left quadrant
    { col: 30, row: 80, monsterId: 'goblin', count: 8 },
    { col: 15, row: 95, monsterId: 'goblin_chief', count: 1 },
    // Q4 — bottom-right quadrant
    { col: 80, row: 75, monsterId: 'goblin', count: 5 },
    { col: 95, row: 90, monsterId: 'goblin', count: 6 },
  ],
  camps: [
    { col: 15, row: 15, npcs: ['blacksmith', 'merchant', 'quest_elder'] },
    { col: 95, row: 100, npcs: ['merchant'] },
  ],
  playerStart: { col: 15, row: 22 },
  exits: [
    { col: 119, row: 60, targetMap: 'twilight_forest', targetCol: 2, targetRow: 58 },
  ],
  levelRange: [1, 7] as [number, number],
};
