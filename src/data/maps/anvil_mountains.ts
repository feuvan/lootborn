import type { MapData } from '../types';

// Tile/collision arrays are generated at runtime by MapGenerator
// Original size: 25x25 → New size: 80x80 (scale factor ~3.2x)
// Tile types: 0=grass, 1=dirt_path, 2=stone, 3=water, 4=wall, 5=camp_ground

export const AnvilMountainsMap: MapData = {
  id: 'anvil_mountains',
  name: '铁砧山脉',
  cols: 80,
  rows: 80,
  tiles: [],
  collisions: [],
  theme: 'mountain',
  seed: 37035,
  bgColor: '#1a1a1a',
  spawns: [
    { col: 26, row: 10, monsterId: 'gargoyle', count: 8 },
    { col: 58, row: 16, monsterId: 'gargoyle', count: 6 },
    { col: 16, row: 45, monsterId: 'stone_golem', count: 6 },
    { col: 48, row: 38, monsterId: 'stone_golem', count: 6 },
    { col: 64, row: 29, monsterId: 'gargoyle', count: 6 },
    { col: 26, row: 64, monsterId: 'stone_golem', count: 6 },
    { col: 45, row: 61, monsterId: 'mountain_troll', count: 2 },
    { col: 35, row: 22, monsterId: 'gargoyle', count: 5 },
    { col: 55, row: 52, monsterId: 'stone_golem', count: 4 },
    { col: 12, row: 58, monsterId: 'mountain_troll', count: 1 },
  ],
  camps: [
    { col: 10, row: 32, npcs: ['blacksmith_advanced', 'merchant', 'stash', 'quest_dwarf'] },
    { col: 58, row: 67, npcs: ['merchant'] },
  ],
  playerStart: { col: 3, row: 38 },
  exits: [
    { col: 1, row: 38, targetMap: 'twilight_forest', targetCol: 77, targetRow: 70 },
    { col: 78, row: 74, targetMap: 'scorching_desert', targetCol: 1, targetRow: 38 },
  ],
  levelRange: [20, 30] as [number, number],
};
