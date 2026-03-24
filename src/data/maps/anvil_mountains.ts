import type { MapData } from '../types';

// Tile/collision arrays are generated at runtime by MapGenerator
// Size: 120x120 (expanded from 80x80 for deeper exploration)
// Tile types: 0=grass, 1=dirt_path, 2=stone, 3=water, 4=wall, 5=camp_ground

export const AnvilMountainsMap: MapData = {
  id: 'anvil_mountains',
  name: '铁砧山脉',
  cols: 120,
  rows: 120,
  tiles: [],
  collisions: [],
  theme: 'mountain',
  seed: 37035,
  bgColor: '#1a1a1a',
  spawns: [
    // Q1 — top-left quadrant
    { col: 35, row: 15, monsterId: 'gargoyle', count: 8 },
    { col: 28, row: 38, monsterId: 'stone_golem', count: 6 },
    { col: 50, row: 30, monsterId: 'gargoyle', count: 5 },
    // Q2 — top-right quadrant
    { col: 85, row: 20, monsterId: 'gargoyle', count: 6 },
    { col: 95, row: 42, monsterId: 'gargoyle', count: 6 },
    // Q3 — bottom-left quadrant
    { col: 35, row: 95, monsterId: 'stone_golem', count: 6 },
    { col: 15, row: 85, monsterId: 'mountain_troll', count: 1 },
    // Q4 — bottom-right quadrant
    { col: 70, row: 60, monsterId: 'stone_golem', count: 6 },
    { col: 65, row: 90, monsterId: 'mountain_troll', count: 2 },
    { col: 85, row: 78, monsterId: 'stone_golem', count: 4 },
  ],
  camps: [
    { col: 15, row: 48, npcs: ['blacksmith_advanced', 'merchant', 'stash', 'quest_dwarf'] },
    { col: 88, row: 100, npcs: ['merchant'] },
  ],
  playerStart: { col: 3, row: 58 },
  exits: [
    { col: 0, row: 58, targetMap: 'twilight_forest', targetCol: 118, targetRow: 119 },
    { col: 119, row: 119, targetMap: 'scorching_desert', targetCol: 2, targetRow: 58 },
  ],
  levelRange: [18, 27] as [number, number],
};
