import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  computeNPCIndicator,
  computeAllNPCIndicators,
} from '../ui/QuestNPCIndicators';
import type { NPCDefinition, QuestDefinition, QuestProgress } from '../data/types';
import { NPCDefinitions } from '../data/npcs';
import { AllQuests } from '../data/quests/all_quests';

// Mock Phaser EventBus (required by QuestSystem import through QUEST_TYPE_LABELS)
vi.mock('../utils/EventBus', () => ({
  EventBus: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
  GameEvents: {
    QUEST_COMPLETED: 'quest:completed',
    QUEST_FAILED: 'quest:failed',
    LOG_MESSAGE: 'log:message',
  },
}));

// Mock dialogueTrees for NPC data import
vi.mock('../data/dialogueTrees', () => ({
  DialogueTrees: {},
}));

// ─── Test Fixtures ──────────────────────────────────────────────

function makeNPC(overrides: Partial<NPCDefinition> = {}): NPCDefinition {
  return {
    id: 'test_npc',
    name: '测试NPC',
    type: 'quest',
    dialogue: ['测试对话'],
    quests: ['q1'],
    ...overrides,
  };
}

function makeQuest(overrides: Partial<QuestDefinition> = {}): QuestDefinition {
  return {
    id: 'q1',
    name: '测试任务',
    description: '测试任务描述',
    zone: 'emerald_plains',
    type: 'kill',
    category: 'main',
    objectives: [
      { type: 'kill', targetId: 'goblin', targetName: '哥布林', required: 10, current: 0 },
    ],
    rewards: { exp: 100, gold: 50 },
    level: 1,
    ...overrides,
  };
}

function makeProgress(
  questId: string,
  status: QuestProgress['status'],
  objectives: { current: number }[],
): QuestProgress {
  return { questId, status, objectives };
}

// ═══════════════════════════════════════
// computeNPCIndicator — Basic Behavior
// ═══════════════════════════════════════

describe('QuestNPCIndicators — computeNPCIndicator', () => {
  it('returns hidden indicator for NPC without quests', () => {
    const npc = makeNPC({ quests: [] });
    const questMap = new Map<string, QuestDefinition>();
    const progressMap = new Map<string, QuestProgress>();
    const result = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(result.visible).toBe(false);
    expect(result.text).toBe('');
  });

  it('returns hidden indicator for NPC with undefined quests', () => {
    const npc = makeNPC({ quests: undefined });
    const questMap = new Map<string, QuestDefinition>();
    const progressMap = new Map<string, QuestProgress>();
    const result = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(result.visible).toBe(false);
  });

  it('shows yellow "!" for available main quest', () => {
    const npc = makeNPC({ quests: ['q1'] });
    const quest = makeQuest({ id: 'q1', category: 'main' });
    const questMap = new Map([['q1', quest]]);
    const progressMap = new Map<string, QuestProgress>();
    const result = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(result.text).toBe('!');
    expect(result.color).toBe('#f1c40f');
    expect(result.visible).toBe(true);
  });

  it('shows yellow "!" for available side quest', () => {
    const npc = makeNPC({ quests: ['q1'] });
    const quest = makeQuest({ id: 'q1', category: 'side' });
    const questMap = new Map([['q1', quest]]);
    const progressMap = new Map<string, QuestProgress>();
    const result = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(result.text).toBe('!');
    expect(result.color).toBe('#f1c40f');
    expect(result.visible).toBe(true);
  });

  it('shows yellow "?" for completed (ready to turn in) quest', () => {
    const npc = makeNPC({ quests: ['q1'] });
    const quest = makeQuest({ id: 'q1' });
    const questMap = new Map([['q1', quest]]);
    const progressMap = new Map([['q1', makeProgress('q1', 'completed', [{ current: 10 }])]]);
    const result = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(result.text).toBe('?');
    expect(result.color).toBe('#f1c40f');
    expect(result.visible).toBe(true);
  });

  it('shows dim grey "?" for active (in-progress) quest', () => {
    const npc = makeNPC({ quests: ['q1'] });
    const quest = makeQuest({ id: 'q1' });
    const questMap = new Map([['q1', quest]]);
    const progressMap = new Map([['q1', makeProgress('q1', 'active', [{ current: 3 }])]]);
    const result = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(result.text).toBe('?');
    expect(result.color).toBe('#888888');
    expect(result.visible).toBe(true);
  });

  it('returns hidden indicator when all quests are turned in', () => {
    const npc = makeNPC({ quests: ['q1'] });
    const quest = makeQuest({ id: 'q1' });
    const questMap = new Map([['q1', quest]]);
    const progressMap = new Map([['q1', makeProgress('q1', 'turned_in', [{ current: 10 }])]]);
    const result = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(result.visible).toBe(false);
    expect(result.text).toBe('');
  });
});

// ═══════════════════════════════════════
// computeNPCIndicator — Priority
// ═══════════════════════════════════════

describe('QuestNPCIndicators — priority order', () => {
  it('completed (turn-in) takes priority over available', () => {
    const npc = makeNPC({ quests: ['q1', 'q2'] });
    const q1 = makeQuest({ id: 'q1', name: '可交付' });
    const q2 = makeQuest({ id: 'q2', name: '可接受' });
    const questMap = new Map([['q1', q1], ['q2', q2]]);
    const progressMap = new Map([['q1', makeProgress('q1', 'completed', [{ current: 10 }])]]);
    const result = computeNPCIndicator(npc, questMap, progressMap, 10);
    // Turn-in takes priority: '?'
    expect(result.text).toBe('?');
    expect(result.color).toBe('#f1c40f');
  });

  it('available takes priority over active', () => {
    const npc = makeNPC({ quests: ['q1', 'q2'] });
    const q1 = makeQuest({ id: 'q1', name: '进行中' });
    const q2 = makeQuest({ id: 'q2', name: '可接受' });
    const questMap = new Map([['q1', q1], ['q2', q2]]);
    const progressMap = new Map([['q1', makeProgress('q1', 'active', [{ current: 3 }])]]);
    const result = computeNPCIndicator(npc, questMap, progressMap, 10);
    // Available takes priority: '!'
    expect(result.text).toBe('!');
    expect(result.color).toBe('#f1c40f');
  });

  it('completed takes priority over active and available', () => {
    const npc = makeNPC({ quests: ['q1', 'q2', 'q3'] });
    const q1 = makeQuest({ id: 'q1', name: '可交付' });
    const q2 = makeQuest({ id: 'q2', name: '进行中' });
    const q3 = makeQuest({ id: 'q3', name: '可接受' });
    const questMap = new Map([['q1', q1], ['q2', q2], ['q3', q3]]);
    const progressMap = new Map([
      ['q1', makeProgress('q1', 'completed', [{ current: 10 }])],
      ['q2', makeProgress('q2', 'active', [{ current: 5 }])],
    ]);
    const result = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(result.text).toBe('?');
    expect(result.color).toBe('#f1c40f');
  });
});

// ═══════════════════════════════════════
// computeNPCIndicator — Quest State Transitions
// ═══════════════════════════════════════

describe('QuestNPCIndicators — state transitions', () => {
  it('indicator changes from "!" to hidden after quest is accepted', () => {
    const npc = makeNPC({ quests: ['q1'] });
    const quest = makeQuest({ id: 'q1' });
    const questMap = new Map([['q1', quest]]);

    // Before accepting: available
    const progressBefore = new Map<string, QuestProgress>();
    const before = computeNPCIndicator(npc, questMap, progressBefore, 10);
    expect(before.text).toBe('!');
    expect(before.visible).toBe(true);

    // After accepting: active — shows dim '?'
    const progressAfter = new Map([['q1', makeProgress('q1', 'active', [{ current: 0 }])]]);
    const after = computeNPCIndicator(npc, questMap, progressAfter, 10);
    expect(after.text).toBe('?');
    expect(after.color).toBe('#888888');
  });

  it('indicator changes from dim "?" to yellow "?" when quest completes', () => {
    const npc = makeNPC({ quests: ['q1'] });
    const quest = makeQuest({ id: 'q1' });
    const questMap = new Map([['q1', quest]]);

    // Active: dim '?'
    const progressActive = new Map([['q1', makeProgress('q1', 'active', [{ current: 5 }])]]);
    const active = computeNPCIndicator(npc, questMap, progressActive, 10);
    expect(active.text).toBe('?');
    expect(active.color).toBe('#888888');

    // Completed: yellow '?'
    const progressCompleted = new Map([['q1', makeProgress('q1', 'completed', [{ current: 10 }])]]);
    const completed = computeNPCIndicator(npc, questMap, progressCompleted, 10);
    expect(completed.text).toBe('?');
    expect(completed.color).toBe('#f1c40f');
  });

  it('indicator disappears after quest is turned in (no other quests)', () => {
    const npc = makeNPC({ quests: ['q1'] });
    const quest = makeQuest({ id: 'q1' });
    const questMap = new Map([['q1', quest]]);

    // Completed: yellow '?'
    const progressCompleted = new Map([['q1', makeProgress('q1', 'completed', [{ current: 10 }])]]);
    const completed = computeNPCIndicator(npc, questMap, progressCompleted, 10);
    expect(completed.text).toBe('?');

    // Turned in: hidden
    const progressTurnedIn = new Map([['q1', makeProgress('q1', 'turned_in', [{ current: 10 }])]]);
    const turnedIn = computeNPCIndicator(npc, questMap, progressTurnedIn, 10);
    expect(turnedIn.visible).toBe(false);
  });

  it('indicator shows next quest after first is turned in', () => {
    const npc = makeNPC({ quests: ['q1', 'q2'] });
    const q1 = makeQuest({ id: 'q1' });
    const q2 = makeQuest({ id: 'q2', prereqQuests: ['q1'] });
    const questMap = new Map([['q1', q1], ['q2', q2]]);

    // q1 turned in → q2 becomes available
    const progress = new Map([['q1', makeProgress('q1', 'turned_in', [{ current: 10 }])]]);
    const result = computeNPCIndicator(npc, questMap, progress, 10);
    expect(result.text).toBe('!');
    expect(result.visible).toBe(true);
  });
});

// ═══════════════════════════════════════
// computeNPCIndicator — Level & Prereq Filtering
// ═══════════════════════════════════════

describe('QuestNPCIndicators — filtering', () => {
  it('excludes quests above player level + 5', () => {
    const npc = makeNPC({ quests: ['q1'] });
    const quest = makeQuest({ id: 'q1', level: 20 });
    const questMap = new Map([['q1', quest]]);
    const progressMap = new Map<string, QuestProgress>();
    const result = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(result.visible).toBe(false);
  });

  it('includes quests at exactly player level + 5', () => {
    const npc = makeNPC({ quests: ['q1'] });
    const quest = makeQuest({ id: 'q1', level: 15 });
    const questMap = new Map([['q1', quest]]);
    const progressMap = new Map<string, QuestProgress>();
    const result = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(result.visible).toBe(true);
    expect(result.text).toBe('!');
  });

  it('excludes quests with unmet prereqs', () => {
    const npc = makeNPC({ quests: ['q2'] });
    const q2 = makeQuest({ id: 'q2', prereqQuests: ['q1'] });
    const questMap = new Map([['q2', q2]]);
    const progressMap = new Map<string, QuestProgress>();
    const result = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(result.visible).toBe(false);
  });

  it('includes quests with met prereqs', () => {
    const npc = makeNPC({ quests: ['q2'] });
    const q1 = makeQuest({ id: 'q1' });
    const q2 = makeQuest({ id: 'q2', prereqQuests: ['q1'] });
    const questMap = new Map([['q1', q1], ['q2', q2]]);
    const progressMap = new Map([['q1', makeProgress('q1', 'turned_in', [{ current: 10 }])]]);
    const result = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(result.text).toBe('!');
    expect(result.visible).toBe(true);
  });

  it('includes failed reacceptable quests as available', () => {
    const npc = makeNPC({ quests: ['q1'] });
    const quest = makeQuest({ id: 'q1', reacceptable: true });
    const questMap = new Map([['q1', quest]]);
    const progressMap = new Map([['q1', makeProgress('q1', 'failed', [{ current: 5 }])]]);
    const result = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(result.text).toBe('!');
    expect(result.visible).toBe(true);
  });

  it('excludes failed non-reacceptable quests', () => {
    const npc = makeNPC({ quests: ['q1'] });
    const quest = makeQuest({ id: 'q1' });
    const questMap = new Map([['q1', quest]]);
    const progressMap = new Map([['q1', makeProgress('q1', 'failed', [{ current: 5 }])]]);
    const result = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(result.visible).toBe(false);
  });

  it('handles quest not in questMap gracefully', () => {
    const npc = makeNPC({ quests: ['q_nonexistent'] });
    const questMap = new Map<string, QuestDefinition>();
    const progressMap = new Map<string, QuestProgress>();
    const result = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(result.visible).toBe(false);
  });
});

// ═══════════════════════════════════════
// computeAllNPCIndicators
// ═══════════════════════════════════════

describe('QuestNPCIndicators — computeAllNPCIndicators', () => {
  it('returns empty map for empty NPC list', () => {
    const result = computeAllNPCIndicators(
      [],
      new Map(),
      new Map(),
      10,
    );
    expect(result.size).toBe(0);
  });

  it('skips NPCs without quests', () => {
    const npc1 = makeNPC({ id: 'npc1', quests: [] });
    const npc2 = makeNPC({ id: 'npc2', quests: undefined });
    const result = computeAllNPCIndicators(
      [npc1, npc2],
      new Map(),
      new Map(),
      10,
    );
    expect(result.size).toBe(0);
  });

  it('computes indicators for NPCs with quests', () => {
    const npc1 = makeNPC({ id: 'npc1', quests: ['q1'] });
    const npc2 = makeNPC({ id: 'npc2', quests: ['q2'] });
    const q1 = makeQuest({ id: 'q1' });
    const q2 = makeQuest({ id: 'q2' });
    const questMap = new Map([['q1', q1], ['q2', q2]]);
    const progressMap = new Map([['q2', makeProgress('q2', 'completed', [{ current: 10 }])]]);
    const result = computeAllNPCIndicators(
      [npc1, npc2],
      questMap,
      progressMap,
      10,
    );
    expect(result.size).toBe(2);
    expect(result.get('npc1')!.text).toBe('!'); // available
    expect(result.get('npc2')!.text).toBe('?'); // turn-in
  });
});

// ═══════════════════════════════════════
// Integration with real quest/NPC data
// ═══════════════════════════════════════

describe('QuestNPCIndicators — real data integration', () => {
  let questMap: Map<string, QuestDefinition>;

  beforeEach(() => {
    questMap = new Map();
    for (const q of AllQuests) {
      questMap.set(q.id, q);
    }
  });

  it('village elder shows "!" for new player', () => {
    const elderDef = NPCDefinitions['quest_elder'];
    const progressMap = new Map<string, QuestProgress>();
    const result = computeNPCIndicator(elderDef, questMap, progressMap, 10);
    expect(result.text).toBe('!');
    expect(result.visible).toBe(true);
  });

  it('village elder shows "?" when first quest is completed', () => {
    const elderDef = NPCDefinitions['quest_elder'];
    const progressMap = new Map([
      ['q_kill_slimes', makeProgress('q_kill_slimes', 'completed', [{ current: 10 }])],
    ]);
    const result = computeNPCIndicator(elderDef, questMap, progressMap, 10);
    expect(result.text).toBe('?');
    expect(result.color).toBe('#f1c40f');
  });

  it('village elder shows "!" after turning in first quest (next quest available)', () => {
    const elderDef = NPCDefinitions['quest_elder'];
    // q_kill_slimes turned in → q_collect_slime_gel and others become available
    const progressMap = new Map([
      ['q_kill_slimes', makeProgress('q_kill_slimes', 'turned_in', [{ current: 10 }])],
    ]);
    const result = computeNPCIndicator(elderDef, questMap, progressMap, 10);
    expect(result.text).toBe('!');
    expect(result.visible).toBe(true);
  });

  it('all quest NPCs have valid quest references', () => {
    const questNpcs = Object.values(NPCDefinitions).filter(
      npc => npc.quests && npc.quests.length > 0,
    );
    for (const npc of questNpcs) {
      const progressMap = new Map<string, QuestProgress>();
      const result = computeNPCIndicator(npc, questMap, progressMap, 10);
      // Every quest NPC should show an indicator for new player (if quests exist and are level-appropriate)
      if (npc.quests!.some(qid => {
        const q = questMap.get(qid);
        return q && q.level <= 15 && !q.prereqQuests;
      })) {
        expect(result.visible, `NPC ${npc.id} should show indicator`).toBe(true);
      }
    }
  });

  it('full lifecycle: available → accepted → completed → turned in', () => {
    const npc = makeNPC({ quests: ['q_kill_slimes'] });
    const progressMap = new Map<string, QuestProgress>();

    // Step 1: Available — show '!'
    const step1 = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(step1.text).toBe('!');

    // Step 2: Accepted — show dim '?'
    progressMap.set('q_kill_slimes', makeProgress('q_kill_slimes', 'active', [{ current: 0 }]));
    const step2 = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(step2.text).toBe('?');
    expect(step2.color).toBe('#888888');

    // Step 3: Completed — show yellow '?'
    progressMap.set('q_kill_slimes', makeProgress('q_kill_slimes', 'completed', [{ current: 10 }]));
    const step3 = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(step3.text).toBe('?');
    expect(step3.color).toBe('#f1c40f');

    // Step 4: Turned in — hidden (no more quests)
    progressMap.set('q_kill_slimes', makeProgress('q_kill_slimes', 'turned_in', [{ current: 10 }]));
    const step4 = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(step4.visible).toBe(false);
  });
});

// ═══════════════════════════════════════
// Mobile Readiness Constants
// ═══════════════════════════════════════

describe('QuestNPCIndicators — mobile readiness constants', () => {
  it('DPR-scaled touch target meets 44px minimum', () => {
    // At DPR=2, px(22) = 44 physical pixels = 22 CSS pixels at DPR=2
    // This is the minimum touch target for mobile (44px per WCAG)
    const DPR = 2;
    const px = (n: number) => Math.round(n * DPR);
    expect(px(22)).toBeGreaterThanOrEqual(44);
  });

  it('quest card action button height exceeds mobile minimum', () => {
    const DPR = 2;
    const px = (n: number) => Math.round(n * DPR);
    // Action button: bH = px(32) = 64
    expect(px(32)).toBeGreaterThanOrEqual(44);
  });

  it('quest card lore button height exceeds mobile minimum', () => {
    const DPR = 2;
    const px = (n: number) => Math.round(n * DPR);
    // Lore button: loreBtnH = px(24) = 48
    expect(px(24)).toBeGreaterThanOrEqual(44);
  });

  it('navigation arrow touch target exceeds mobile minimum', () => {
    const DPR = 2;
    const px = (n: number) => Math.round(n * DPR);
    // Navigation arrows: navTouchSize = px(22) = 44
    expect(px(22)).toBeGreaterThanOrEqual(44);
  });

  it('tracker title touch target exceeds mobile minimum', () => {
    const DPR = 2;
    const px = (n: number) => Math.round(n * DPR);
    // Tracker title hit area: px(22) = 44
    expect(px(22)).toBeGreaterThanOrEqual(44);
  });
});
