import type { MapData } from '../types';

// Tile/collision arrays are generated at runtime by MapGenerator
// Original size: 20x20 → New size: 80x80 (scale factor ~4x)
// Tile types: 0=grass, 1=dirt_path, 2=stone, 3=water, 4=wall, 5=camp_ground

export const EmeraldPlainsMap: MapData = {
  id: 'emerald_plains',
  name: '翡翠平原',
  cols: 80,
  rows: 80,
  tiles: [],
  collisions: [],
  theme: 'plains',
  seed: 12345,
  spawns: [
    { col: 32, row: 12, monsterId: 'slime_green', count: 8 },
    { col: 60, row: 20, monsterId: 'slime_green', count: 6 },
    { col: 12, row: 40, monsterId: 'goblin', count: 6 },
    { col: 56, row: 40, monsterId: 'goblin', count: 8 },
    { col: 32, row: 60, monsterId: 'goblin', count: 6 },
    { col: 40, row: 52, monsterId: 'goblin_chief', count: 2 },
    { col: 20, row: 25, monsterId: 'slime_green', count: 5 },
    { col: 50, row: 55, monsterId: 'goblin', count: 5 },
    { col: 65, row: 30, monsterId: 'slime_green', count: 4 },
    { col: 25, row: 65, monsterId: 'goblin_chief', count: 1 },
  ],
  camps: [
    { col: 12, row: 12, npcs: ['blacksmith', 'merchant', 'quest_elder'] },
    { col: 64, row: 68, npcs: ['merchant'] },
  ],
  playerStart: { col: 12, row: 16 },
  exits: [
    { col: 78, row: 40, targetMap: 'twilight_forest', targetCol: 1, targetRow: 38 },
  ],
  levelRange: [1, 10] as [number, number],
};
