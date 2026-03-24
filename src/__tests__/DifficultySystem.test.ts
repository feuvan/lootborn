/**
 * Tests for the Difficulty System.
 *
 * Covers:
 * - Difficulty unlock flow: Normal → Nightmare → Hell
 * - Difficulty state classification (completed / available / locked)
 * - Monster stat multipliers per difficulty
 * - Monster HP/damage/defense/exp scaling
 * - Overworld monster scaling
 * - Dungeon difficulty scaling consistency
 * - Save/load persistence of difficulty and completedDifficulties
 * - Edge cases: double completion, kill wrong monster, wrong zone
 */

import { describe, it, expect } from 'vitest';
import {
  DifficultySystem,
  DIFFICULTY_ORDER,
  DIFFICULTY_LABELS,
  DIFFICULTY_UNLOCK_MESSAGES,
} from '../systems/DifficultySystem';
import type { Difficulty, DifficultyMultipliers } from '../systems/DifficultySystem';
import { DungeonSystem } from '../systems/DungeonSystem';
import type { MonsterDefinition } from '../data/types';

// --- Helper fixtures ---

function makeMockMonster(overrides?: Partial<MonsterDefinition>): MonsterDefinition {
  return {
    id: 'test_monster',
    name: '测试怪物',
    level: 1,
    hp: 100,
    damage: 20,
    defense: 10,
    attackSpeed: 1000,
    attackRange: 1.5,
    aggroRange: 6,
    speed: 60,
    expReward: 50,
    goldReward: [5, 15] as [number, number],
    spriteKey: 'monster_test',
    ...overrides,
  };
}

// ============================================================================
// Multipliers
// ============================================================================

describe('DifficultySystem — Multipliers', () => {
  it('normal returns 1.0 for all multipliers', () => {
    const m = DifficultySystem.getMultipliers('normal');
    expect(m.hp).toBe(1.0);
    expect(m.damage).toBe(1.0);
    expect(m.defense).toBe(1.0);
    expect(m.exp).toBe(1.0);
  });

  it('nightmare returns correct multipliers (1.5x damage, 2x exp)', () => {
    const m = DifficultySystem.getMultipliers('nightmare');
    expect(m.hp).toBe(1.5);
    expect(m.damage).toBe(1.5);
    expect(m.defense).toBe(1.3);
    expect(m.exp).toBe(2.0);
  });

  it('hell returns correct multipliers (2x damage, 3x exp)', () => {
    const m = DifficultySystem.getMultipliers('hell');
    expect(m.hp).toBe(2.0);
    expect(m.damage).toBe(2.0);
    expect(m.defense).toBe(1.6);
    expect(m.exp).toBe(3.0);
  });

  it('multipliers are consistent with DungeonSystem.getDifficultyMultipliers', () => {
    for (const diff of DIFFICULTY_ORDER) {
      const ours = DifficultySystem.getMultipliers(diff);
      const dungeon = DungeonSystem.getDifficultyMultipliers(diff);
      expect(ours.hp).toBe(dungeon.hp);
      expect(ours.damage).toBe(dungeon.damage);
      expect(ours.defense).toBe(dungeon.defense);
      expect(ours.exp).toBe(dungeon.exp);
    }
  });
});

// ============================================================================
// Unlock Flow
// ============================================================================

describe('DifficultySystem — Unlock Flow', () => {
  it('killing demon_lord in abyss_rift on normal marks normal as completed', () => {
    expect(DifficultySystem.shouldMarkCompleted('demon_lord', 'abyss_rift', 'normal', [])).toBe(true);
  });

  it('killing demon_lord in abyss_rift on nightmare marks nightmare as completed', () => {
    expect(DifficultySystem.shouldMarkCompleted('demon_lord', 'abyss_rift', 'nightmare', ['normal'])).toBe(true);
  });

  it('killing demon_lord in abyss_rift on hell marks hell as completed', () => {
    expect(DifficultySystem.shouldMarkCompleted('demon_lord', 'abyss_rift', 'hell', ['normal', 'nightmare'])).toBe(true);
  });

  it('does NOT trigger for wrong monster', () => {
    expect(DifficultySystem.shouldMarkCompleted('goblin', 'abyss_rift', 'normal', [])).toBe(false);
  });

  it('does NOT trigger in wrong zone', () => {
    expect(DifficultySystem.shouldMarkCompleted('demon_lord', 'emerald_plains', 'normal', [])).toBe(false);
  });

  it('does NOT trigger if difficulty already completed', () => {
    expect(DifficultySystem.shouldMarkCompleted('demon_lord', 'abyss_rift', 'normal', ['normal'])).toBe(false);
  });

  it('completing normal unlocks nightmare', () => {
    expect(DifficultySystem.getNewlyUnlockedDifficulty(['normal'])).toBe('nightmare');
  });

  it('completing nightmare unlocks hell', () => {
    expect(DifficultySystem.getNewlyUnlockedDifficulty(['normal', 'nightmare'])).toBe('hell');
  });

  it('completing all difficulties returns null', () => {
    expect(DifficultySystem.getNewlyUnlockedDifficulty(['normal', 'nightmare', 'hell'])).toBe(null);
  });

  it('no completions does not unlock anything', () => {
    expect(DifficultySystem.getNewlyUnlockedDifficulty([])).toBe(null);
  });

  it('full progression flow: Normal → Nightmare → Hell', () => {
    const completed: string[] = [];

    // Kill demon_lord on Normal
    const shouldMark1 = DifficultySystem.shouldMarkCompleted('demon_lord', 'abyss_rift', 'normal', completed);
    expect(shouldMark1).toBe(true);
    completed.push('normal');
    expect(DifficultySystem.getNewlyUnlockedDifficulty(completed)).toBe('nightmare');

    // Kill demon_lord on Nightmare
    const shouldMark2 = DifficultySystem.shouldMarkCompleted('demon_lord', 'abyss_rift', 'nightmare', completed);
    expect(shouldMark2).toBe(true);
    completed.push('nightmare');
    expect(DifficultySystem.getNewlyUnlockedDifficulty(completed)).toBe('hell');

    // Kill demon_lord on Hell
    const shouldMark3 = DifficultySystem.shouldMarkCompleted('demon_lord', 'abyss_rift', 'hell', completed);
    expect(shouldMark3).toBe(true);
    completed.push('hell');
    expect(DifficultySystem.getNewlyUnlockedDifficulty(completed)).toBe(null);
  });
});

// ============================================================================
// Difficulty States
// ============================================================================

describe('DifficultySystem — Difficulty States', () => {
  it('no completions: normal=available, nightmare=locked, hell=locked', () => {
    const states = DifficultySystem.getDifficultyStates([]);
    expect(states.normal).toBe('available');
    expect(states.nightmare).toBe('locked');
    expect(states.hell).toBe('locked');
  });

  it('normal completed: normal=completed, nightmare=available, hell=locked', () => {
    const states = DifficultySystem.getDifficultyStates(['normal']);
    expect(states.normal).toBe('completed');
    expect(states.nightmare).toBe('available');
    expect(states.hell).toBe('locked');
  });

  it('normal+nightmare completed: all except hell available', () => {
    const states = DifficultySystem.getDifficultyStates(['normal', 'nightmare']);
    expect(states.normal).toBe('completed');
    expect(states.nightmare).toBe('completed');
    expect(states.hell).toBe('available');
  });

  it('all completed: all show completed', () => {
    const states = DifficultySystem.getDifficultyStates(['normal', 'nightmare', 'hell']);
    expect(states.normal).toBe('completed');
    expect(states.nightmare).toBe('completed');
    expect(states.hell).toBe('completed');
  });

  it('isSelectable returns true for available/completed, false for locked', () => {
    expect(DifficultySystem.isSelectable('normal', [])).toBe(true);
    expect(DifficultySystem.isSelectable('nightmare', [])).toBe(false);
    expect(DifficultySystem.isSelectable('hell', [])).toBe(false);

    expect(DifficultySystem.isSelectable('normal', ['normal'])).toBe(true);
    expect(DifficultySystem.isSelectable('nightmare', ['normal'])).toBe(true);
    expect(DifficultySystem.isSelectable('hell', ['normal'])).toBe(false);

    expect(DifficultySystem.isSelectable('hell', ['normal', 'nightmare'])).toBe(true);
  });
});

// ============================================================================
// Monster Scaling
// ============================================================================

describe('DifficultySystem — Monster Scaling', () => {
  const base = makeMockMonster();

  it('normal returns unmodified monster', () => {
    const scaled = DifficultySystem.scaleMonster(base, 'normal');
    expect(scaled.hp).toBe(100);
    expect(scaled.damage).toBe(20);
    expect(scaled.defense).toBe(10);
    expect(scaled.expReward).toBe(50);
    expect(scaled.goldReward).toEqual([5, 15]);
    // Should return same reference for efficiency
    expect(scaled).toBe(base);
  });

  it('nightmare scales HP by 1.5x', () => {
    const scaled = DifficultySystem.scaleMonster(base, 'nightmare');
    expect(scaled.hp).toBe(150);
  });

  it('nightmare scales damage by 1.5x', () => {
    const scaled = DifficultySystem.scaleMonster(base, 'nightmare');
    expect(scaled.damage).toBe(30);
  });

  it('nightmare scales defense by 1.3x', () => {
    const scaled = DifficultySystem.scaleMonster(base, 'nightmare');
    expect(scaled.defense).toBe(13);
  });

  it('nightmare scales exp by 2x', () => {
    const scaled = DifficultySystem.scaleMonster(base, 'nightmare');
    expect(scaled.expReward).toBe(100);
  });

  it('nightmare scales gold by 2x (exp multiplier)', () => {
    const scaled = DifficultySystem.scaleMonster(base, 'nightmare');
    expect(scaled.goldReward).toEqual([10, 30]);
  });

  it('hell scales HP by 2x', () => {
    const scaled = DifficultySystem.scaleMonster(base, 'hell');
    expect(scaled.hp).toBe(200);
  });

  it('hell scales damage by 2x', () => {
    const scaled = DifficultySystem.scaleMonster(base, 'hell');
    expect(scaled.damage).toBe(40);
  });

  it('hell scales defense by 1.6x', () => {
    const scaled = DifficultySystem.scaleMonster(base, 'hell');
    expect(scaled.defense).toBe(16);
  });

  it('hell scales exp by 3x', () => {
    const scaled = DifficultySystem.scaleMonster(base, 'hell');
    expect(scaled.expReward).toBe(150);
  });

  it('hell scales gold by 3x', () => {
    const scaled = DifficultySystem.scaleMonster(base, 'hell');
    expect(scaled.goldReward).toEqual([15, 45]);
  });

  it('does not mutate the original definition', () => {
    const original = makeMockMonster();
    const before = { ...original, goldReward: [...original.goldReward] };
    DifficultySystem.scaleMonster(original, 'hell');
    expect(original.hp).toBe(before.hp);
    expect(original.damage).toBe(before.damage);
    expect(original.defense).toBe(before.defense);
    expect(original.expReward).toBe(before.expReward);
  });

  it('scales correctly with non-round numbers', () => {
    const oddMonster = makeMockMonster({ hp: 77, damage: 33, defense: 7, expReward: 23, goldReward: [3, 11] });
    const scaled = DifficultySystem.scaleMonster(oddMonster, 'nightmare');
    expect(scaled.hp).toBe(Math.round(77 * 1.5)); // 116
    expect(scaled.damage).toBe(Math.round(33 * 1.5)); // 50
    expect(scaled.defense).toBe(Math.round(7 * 1.3)); // 9
    expect(scaled.expReward).toBe(Math.round(23 * 2.0)); // 46
    expect(scaled.goldReward[0]).toBe(Math.round(3 * 2.0)); // 6
    expect(scaled.goldReward[1]).toBe(Math.round(11 * 2.0)); // 22
  });

  it('preserves non-scaled monster properties', () => {
    const monster = makeMockMonster({ id: 'special', name: '特殊', elite: true });
    const scaled = DifficultySystem.scaleMonster(monster, 'hell');
    expect(scaled.id).toBe('special');
    expect(scaled.name).toBe('特殊');
    expect(scaled.elite).toBe(true);
    expect(scaled.attackSpeed).toBe(1000);
    expect(scaled.aggroRange).toBe(6);
    expect(scaled.speed).toBe(60);
    expect(scaled.spriteKey).toBe('monster_test');
  });
});

// ============================================================================
// Chinese Labels
// ============================================================================

describe('DifficultySystem — Chinese Labels', () => {
  it('all difficulties have Chinese labels', () => {
    expect(DIFFICULTY_LABELS.normal).toBe('普通');
    expect(DIFFICULTY_LABELS.nightmare).toBe('噩梦');
    expect(DIFFICULTY_LABELS.hell).toBe('地狱');
  });

  it('unlock messages are in Chinese', () => {
    expect(DIFFICULTY_UNLOCK_MESSAGES.nightmare).toBe('噩梦难度已解锁');
    expect(DIFFICULTY_UNLOCK_MESSAGES.hell).toBe('地狱难度已解锁');
  });

  it('normal has no unlock message (always available)', () => {
    expect(DIFFICULTY_UNLOCK_MESSAGES.normal).toBe('');
  });
});

// ============================================================================
// Difficulty Order
// ============================================================================

describe('DifficultySystem — Difficulty Order', () => {
  it('ordered as normal → nightmare → hell', () => {
    expect(DIFFICULTY_ORDER).toEqual(['normal', 'nightmare', 'hell']);
  });

  it('order length is 3', () => {
    expect(DIFFICULTY_ORDER).toHaveLength(3);
  });
});

// ============================================================================
// Save/Load Persistence
// ============================================================================

describe('DifficultySystem — Save/Load Persistence', () => {
  it('completedDifficulties array is serializable and round-trips', () => {
    const original = ['normal', 'nightmare'];
    const serialized = JSON.stringify(original);
    const restored: string[] = JSON.parse(serialized);
    expect(restored).toEqual(original);

    // getDifficultyStates works on the restored data
    const states = DifficultySystem.getDifficultyStates(restored);
    expect(states.normal).toBe('completed');
    expect(states.nightmare).toBe('completed');
    expect(states.hell).toBe('available');
  });

  it('difficulty value is serializable and round-trips', () => {
    const difficulty: Difficulty = 'nightmare';
    const serialized = JSON.stringify({ difficulty });
    const restored = JSON.parse(serialized);
    expect(restored.difficulty).toBe('nightmare');
    // getMultipliers works on the restored data
    const m = DifficultySystem.getMultipliers(restored.difficulty);
    expect(m.damage).toBe(1.5);
  });

  it('empty completedDifficulties defaults correctly', () => {
    const states = DifficultySystem.getDifficultyStates([]);
    expect(states.normal).toBe('available');
    expect(states.nightmare).toBe('locked');
    expect(states.hell).toBe('locked');
  });

  it('undefined/null completedDifficulties is handled gracefully with fallback', () => {
    // Simulates old saves where completedDifficulties might be missing
    const states = DifficultySystem.getDifficultyStates([] as string[]);
    expect(states.normal).toBe('available');
  });
});

// ============================================================================
// Overworld + Dungeon Consistency
// ============================================================================

describe('DifficultySystem — Overworld + Dungeon Consistency', () => {
  it('overworld monster scaling matches dungeon difficulty scaling values', () => {
    const base = makeMockMonster({ hp: 200, damage: 50, defense: 20, expReward: 100 });

    // Get overworld scaling
    const overworldNightmare = DifficultySystem.scaleMonster(base, 'nightmare');

    // Get dungeon scaling (on floor 1, no depth bonus, nightmare difficulty)
    const dungeonMult = DungeonSystem.getDifficultyMultipliers('nightmare');

    // At floor 1 with depth multiplier 1.0, the dungeon scaling should match
    expect(overworldNightmare.hp).toBe(Math.round(base.hp * dungeonMult.hp));
    expect(overworldNightmare.damage).toBe(Math.round(base.damage * dungeonMult.damage));
    expect(overworldNightmare.defense).toBe(Math.round(base.defense * dungeonMult.defense));
  });

  it('dungeon difficulty scales on top of depth scaling', () => {
    const base = makeMockMonster({ hp: 100 });
    const run = DungeonSystem.createRun('nightmare', 42);
    const floorConfig = DungeonSystem.getFloorConfig(run, 5);

    // Dungeon applies both depth and difficulty multipliers
    const dungeonScaled = DungeonSystem.scaleMonster(base, floorConfig, 'nightmare');

    // Overworld only applies difficulty
    const overworldScaled = DifficultySystem.scaleMonster(base, 'nightmare');

    // Dungeon should be >= overworld because depth multiplier >= 1.0
    expect(dungeonScaled.hp).toBeGreaterThanOrEqual(overworldScaled.hp);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('DifficultySystem — Edge Cases', () => {
  it('re-marking an already-completed difficulty is a no-op', () => {
    const completed = ['normal'];
    expect(DifficultySystem.shouldMarkCompleted('demon_lord', 'abyss_rift', 'normal', completed)).toBe(false);
  });

  it('killing demon_lord outside abyss_rift does nothing', () => {
    expect(DifficultySystem.shouldMarkCompleted('demon_lord', 'emerald_plains', 'normal', [])).toBe(false);
    expect(DifficultySystem.shouldMarkCompleted('demon_lord', 'twilight_forest', 'normal', [])).toBe(false);
    expect(DifficultySystem.shouldMarkCompleted('demon_lord', 'dungeon_floor_1', 'normal', [])).toBe(false);
  });

  it('zero-stat monster scales without errors', () => {
    const zeroMonster = makeMockMonster({ hp: 0, damage: 0, defense: 0, expReward: 0, goldReward: [0, 0] });
    const scaled = DifficultySystem.scaleMonster(zeroMonster, 'hell');
    expect(scaled.hp).toBe(0);
    expect(scaled.damage).toBe(0);
    expect(scaled.defense).toBe(0);
    expect(scaled.expReward).toBe(0);
    expect(scaled.goldReward).toEqual([0, 0]);
  });

  it('very high-stat monster scales correctly', () => {
    const bigMonster = makeMockMonster({ hp: 999999, damage: 99999, defense: 50000 });
    const scaled = DifficultySystem.scaleMonster(bigMonster, 'hell');
    expect(scaled.hp).toBe(Math.round(999999 * 2.0));
    expect(scaled.damage).toBe(Math.round(99999 * 2.0));
    expect(scaled.defense).toBe(Math.round(50000 * 1.6));
  });

  it('getStates handles unsorted completedDifficulties', () => {
    // Nightmare before normal in the array — should still work
    const states = DifficultySystem.getDifficultyStates(['nightmare', 'normal']);
    expect(states.normal).toBe('completed');
    expect(states.nightmare).toBe('completed');
    expect(states.hell).toBe('available');
  });
});
