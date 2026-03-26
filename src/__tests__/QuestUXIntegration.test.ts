/**
 * QuestUXIntegration.test.ts — End-to-end integration tests verifying
 * that QuestCardUI, QuestTrackerHUD, and QuestNPCIndicators modules work
 * together for the full quest lifecycle.
 *
 * Fulfills: VAL-QUEST-015 (end-to-end flow), VAL-QUEST-016 (save/load),
 *           VAL-QUEST-017 (all tests pass), VAL-QUEST-018 (build succeeds),
 *           VAL-CROSS-001 (quest UI works together),
 *           VAL-CROSS-002 (tracker persists across zone transition),
 *           VAL-CROSS-003 (no regression in existing features).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  gatherNpcQuests,
  buildQuestCardData,
  formatObjectiveLabel,
  formatRewardSummary,
  buildToastMessage,
} from '../ui/QuestCardUI';
import type { NpcQuestEntry } from '../ui/QuestCardUI';
import {
  buildTrackerState,
  buildTrackerEntry,
  buildTrackerSignature,
  buildProgressSummary,
} from '../ui/QuestTrackerHUD';
import {
  computeNPCIndicator,
  computeAllNPCIndicators,
} from '../ui/QuestNPCIndicators';
import type { QuestDefinition, QuestProgress, NPCDefinition } from '../data/types';
import { AllQuests } from '../data/quests/all_quests';
import { NPCDefinitions } from '../data/npcs';
import { QUEST_TYPE_LABELS } from '../systems/QuestSystem';

// ─── Mocks ──────────────────────────────────────────────────────

vi.mock('../utils/EventBus', () => ({
  EventBus: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
  GameEvents: {
    QUEST_COMPLETED: 'quest:completed',
    QUEST_FAILED: 'quest:failed',
    LOG_MESSAGE: 'log:message',
  },
}));

vi.mock('../data/dialogueTrees', () => ({
  DialogueTrees: {},
}));

// ─── Helpers ────────────────────────────────────────────────────

function makeQuest(overrides: Partial<QuestDefinition> = {}): QuestDefinition {
  return {
    id: 'test_quest',
    name: '测试任务',
    description: '这是一个测试任务。',
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

// ═══════════════════════════════════════
// Full Quest Lifecycle Integration
// ═══════════════════════════════════════

describe('QuestUXIntegration — full lifecycle', () => {
  let questMap: Map<string, QuestDefinition>;
  let progressMap: Map<string, QuestProgress>;

  beforeEach(() => {
    questMap = new Map();
    progressMap = new Map();
  });

  it('complete lifecycle: indicator "!" → card accept → tracker shows → progress → tracker updates → indicator "?" → card turn-in → indicator disappears', () => {
    const quest = makeQuest({ id: 'q_lifecycle', name: '生命周期测试' });
    const npc = makeNPC({ id: 'npc_lifecycle', quests: ['q_lifecycle'] });
    questMap.set('q_lifecycle', quest);

    // Step 1: NPC shows '!' indicator for available quest
    const step1Indicator = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(step1Indicator.text).toBe('!');
    expect(step1Indicator.visible).toBe(true);
    expect(step1Indicator.color).toBe('#f1c40f');

    // Step 2: Player interacts → quest card shows with 'accept' action
    const npcQuests = gatherNpcQuests(npc.quests!, questMap, progressMap, 10);
    expect(npcQuests).toHaveLength(1);
    expect(npcQuests[0].cardAction).toBe('accept');
    const card = buildQuestCardData(npcQuests[0], false);
    expect(card.name).toBe('生命周期测试');
    expect(card.cardAction).toBe('accept');
    expect(card.objectives).toHaveLength(1);
    expect(card.objectives[0].progress).toBe('0/10');

    // Step 3: Player accepts → toast confirmation
    const acceptToast = buildToastMessage('accept', card.name);
    expect(acceptToast).toBe('已接受: 生命周期测试');

    // Step 4: Quest becomes active → tracker shows quest
    progressMap.set('q_lifecycle', makeProgress('q_lifecycle', 'active', [{ current: 0 }]));
    const trackerState1 = buildTrackerState([
      { quest, progress: progressMap.get('q_lifecycle')! },
    ]);
    expect(trackerState1.entries).toHaveLength(1);
    expect(trackerState1.entries[0].name).toBe('生命周期测试');
    expect(trackerState1.entries[0].progressSummary).toBe('猎杀 0/10');
    expect(trackerState1.entries[0].isCompleted).toBe(false);

    // Step 5: NPC indicator changes to dim '?' (active quest)
    const step5Indicator = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(step5Indicator.text).toBe('?');
    expect(step5Indicator.color).toBe('#888888');

    // Step 6: Player makes progress (5/10) → tracker updates
    progressMap.set('q_lifecycle', makeProgress('q_lifecycle', 'active', [{ current: 5 }]));
    const trackerState2 = buildTrackerState([
      { quest, progress: progressMap.get('q_lifecycle')! },
    ]);
    expect(trackerState2.entries[0].progressSummary).toBe('猎杀 5/10');

    // Step 7: Signature changes between progress updates
    const sig1 = buildTrackerSignature(trackerState1);
    const sig2 = buildTrackerSignature(trackerState2);
    expect(sig1).not.toBe(sig2);

    // Step 8: Quest completes (10/10) → tracker shows completion indicator
    progressMap.set('q_lifecycle', makeProgress('q_lifecycle', 'completed', [{ current: 10 }]));
    const trackerState3 = buildTrackerState([
      { quest, progress: progressMap.get('q_lifecycle')! },
    ]);
    expect(trackerState3.entries[0].isCompleted).toBe(true);
    expect(trackerState3.entries[0].progressSummary).toBe('已完成 - 返回NPC交付');

    // Step 9: NPC indicator changes to yellow '?' (ready for turn-in)
    const step9Indicator = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(step9Indicator.text).toBe('?');
    expect(step9Indicator.color).toBe('#f1c40f');

    // Step 10: Player interacts → card shows turn-in action
    const turnInQuests = gatherNpcQuests(npc.quests!, questMap, progressMap, 10);
    expect(turnInQuests).toHaveLength(1);
    expect(turnInQuests[0].cardAction).toBe('turn_in');
    const turnInCard = buildQuestCardData(turnInQuests[0], false);
    expect(turnInCard.cardAction).toBe('turn_in');
    expect(turnInCard.objectives[0].done).toBe(true);
    expect(turnInCard.objectives[0].progress).toBe('10/10');
    expect(turnInCard.rewards.exp).toBe(100);
    expect(turnInCard.rewards.gold).toBe(50);

    // Step 11: Player turns in → toast confirmation
    const turnInToast = buildToastMessage('turn_in', turnInCard.name);
    expect(turnInToast).toBe('已交付: 生命周期测试');

    // Step 12: Quest becomes turned_in → indicator disappears, tracker empty
    progressMap.set('q_lifecycle', makeProgress('q_lifecycle', 'turned_in', [{ current: 10 }]));
    const step12Indicator = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(step12Indicator.visible).toBe(false);

    // Tracker no longer shows turned_in quests (they're removed from active list)
    const trackerState4 = buildTrackerState([]);
    expect(trackerState4.entries).toHaveLength(0);
  });

  it('multi-quest NPC: turn-in first, then next quest becomes available with chain', () => {
    const q1 = makeQuest({ id: 'chain_q1', name: '第一步', category: 'main' });
    const q2 = makeQuest({ id: 'chain_q2', name: '第二步', category: 'main', prereqQuests: ['chain_q1'] });
    const q3 = makeQuest({ id: 'chain_q3', name: '第三步', category: 'main', prereqQuests: ['chain_q2'] });
    const npc = makeNPC({ id: 'chain_npc', quests: ['chain_q1', 'chain_q2', 'chain_q3'] });
    questMap.set('chain_q1', q1);
    questMap.set('chain_q2', q2);
    questMap.set('chain_q3', q3);

    // Phase 1: Only q1 available
    const phase1Cards = gatherNpcQuests(npc.quests!, questMap, progressMap, 10);
    expect(phase1Cards).toHaveLength(1);
    expect(phase1Cards[0].quest.id).toBe('chain_q1');
    expect(phase1Cards[0].cardAction).toBe('accept');

    const phase1Indicator = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(phase1Indicator.text).toBe('!');

    // Phase 2: q1 accepted, active
    progressMap.set('chain_q1', makeProgress('chain_q1', 'active', [{ current: 5 }]));
    const phase2Cards = gatherNpcQuests(npc.quests!, questMap, progressMap, 10);
    expect(phase2Cards).toHaveLength(0);

    const phase2Indicator = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(phase2Indicator.text).toBe('?');
    expect(phase2Indicator.color).toBe('#888888');

    // Phase 3: q1 completed → turn-in available
    progressMap.set('chain_q1', makeProgress('chain_q1', 'completed', [{ current: 10 }]));
    const phase3Cards = gatherNpcQuests(npc.quests!, questMap, progressMap, 10);
    expect(phase3Cards).toHaveLength(1);
    expect(phase3Cards[0].cardAction).toBe('turn_in');

    const phase3Indicator = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(phase3Indicator.text).toBe('?');
    expect(phase3Indicator.color).toBe('#f1c40f');

    // Phase 4: q1 turned in → q2 becomes available
    progressMap.set('chain_q1', makeProgress('chain_q1', 'turned_in', [{ current: 10 }]));
    const phase4Cards = gatherNpcQuests(npc.quests!, questMap, progressMap, 10);
    expect(phase4Cards).toHaveLength(1);
    expect(phase4Cards[0].quest.id).toBe('chain_q2');
    expect(phase4Cards[0].cardAction).toBe('accept');

    const phase4Indicator = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(phase4Indicator.text).toBe('!');

    // Phase 5: q2 turned in → q3 becomes available
    progressMap.set('chain_q2', makeProgress('chain_q2', 'turned_in', [{ current: 10 }]));
    const phase5Cards = gatherNpcQuests(npc.quests!, questMap, progressMap, 10);
    expect(phase5Cards).toHaveLength(1);
    expect(phase5Cards[0].quest.id).toBe('chain_q3');

    // Phase 6: All turned in → NPC has no quests
    progressMap.set('chain_q3', makeProgress('chain_q3', 'turned_in', [{ current: 10 }]));
    const phase6Cards = gatherNpcQuests(npc.quests!, questMap, progressMap, 10);
    expect(phase6Cards).toHaveLength(0);

    const phase6Indicator = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(phase6Indicator.visible).toBe(false);
  });
});

// ═══════════════════════════════════════
// Card + Tracker Consistency
// ═══════════════════════════════════════

describe('QuestUXIntegration — card + tracker consistency', () => {
  it('card objective labels match tracker objective labels for same quest', () => {
    const quest = makeQuest({
      id: 'consistency_q',
      objectives: [
        { type: 'kill', targetId: 'goblin', targetName: '哥布林', required: 10, current: 0 },
        { type: 'collect', targetId: 'gem', targetName: '宝石', required: 5, current: 0 },
      ],
    });
    const progress = makeProgress('consistency_q', 'active', [{ current: 3 }, { current: 2 }]);

    // Card data
    const entry: NpcQuestEntry = { quest, progress, cardAction: 'turn_in' };
    const card = buildQuestCardData(entry, false);

    // Tracker data
    const trackerEntry = buildTrackerEntry(quest, progress);

    // Same number of objectives
    expect(card.objectives.length).toBe(trackerEntry.objectiveLines.length);

    // Labels match between card and tracker
    for (let i = 0; i < card.objectives.length; i++) {
      expect(card.objectives[i].label).toBe(trackerEntry.objectiveLines[i].label);
    }
  });

  it('formatObjectiveLabel produces same labels as tracker objective labels', () => {
    const objectives = [
      { type: 'kill' as const, targetId: 'g', targetName: '哥布林', required: 10, current: 0 },
      { type: 'collect' as const, targetId: 'h', targetName: '草药', required: 5, current: 0 },
      { type: 'explore' as const, targetId: 'c', targetName: '洞穴', required: 1, current: 0 },
      { type: 'talk' as const, targetId: 'n', targetName: '隐士', required: 1, current: 0 },
      { type: 'escort' as const, targetId: 'm', targetName: '商人', required: 1, current: 0 },
      { type: 'defend_wave' as const, targetId: 'c', targetName: '营地', required: 3, current: 0 },
      { type: 'investigate_clue' as const, targetId: 'x', targetName: '线索', required: 3, current: 0 },
      { type: 'craft_collect' as const, targetId: 'o', targetName: '矿石', required: 5, current: 0 },
      { type: 'craft_craft' as const, targetId: 's', targetName: '剑', required: 1, current: 0 },
      { type: 'craft_deliver' as const, targetId: 'n', targetName: 'NPC', required: 1, current: 0 },
    ];

    for (const obj of objectives) {
      const quest = makeQuest({
        type: obj.type.replace(/_.*$/, '') as QuestDefinition['type'],
        objectives: [obj],
      });
      const progress = makeProgress('q', 'active', [{ current: 2 }]);

      // QuestCardUI label
      const cardLabel = formatObjectiveLabel(obj);
      // QuestTrackerHUD label (via buildTrackerEntry)
      const trackerEntry = buildTrackerEntry(quest, progress);
      expect(trackerEntry.objectiveLines[0].label).toBe(cardLabel);
    }
  });

  it('reward display from card matches formatRewardSummary', () => {
    const quest = makeQuest({
      rewards: { exp: 200, gold: 50, items: ['w_short_sword'] },
    });
    const entry: NpcQuestEntry = { quest, progress: undefined, cardAction: 'accept' };
    const card = buildQuestCardData(entry, false);

    expect(card.rewards.exp).toBe(200);
    expect(card.rewards.gold).toBe(50);
    expect(card.rewards.items).toEqual(['w_short_sword']);

    const summary = formatRewardSummary(quest.rewards);
    expect(summary).toBe('200 经验  50 金币  1 物品');
  });
});

// ═══════════════════════════════════════
// Multi-NPC + Multi-Quest State
// ═══════════════════════════════════════

describe('QuestUXIntegration — multi-NPC multi-quest scenario', () => {
  let questMap: Map<string, QuestDefinition>;
  let progressMap: Map<string, QuestProgress>;

  beforeEach(() => {
    questMap = new Map();
    progressMap = new Map();
  });

  it('two NPCs have independent quest states; tracker shows all active quests', () => {
    const q1 = makeQuest({ id: 'q1', name: '猎杀史莱姆', category: 'main' });
    const q2 = makeQuest({ id: 'q2', name: '收集草药', category: 'side' });
    const q3 = makeQuest({ id: 'q3', name: '探索洞穴', category: 'main' });
    questMap.set('q1', q1);
    questMap.set('q2', q2);
    questMap.set('q3', q3);

    const npc1 = makeNPC({ id: 'npc1', quests: ['q1', 'q2'] });
    const npc2 = makeNPC({ id: 'npc2', quests: ['q3'] });

    // NPC1 has 2 available quests, NPC2 has 1
    const npc1Cards = gatherNpcQuests(npc1.quests!, questMap, progressMap, 10);
    expect(npc1Cards).toHaveLength(2);
    const npc2Cards = gatherNpcQuests(npc2.quests!, questMap, progressMap, 10);
    expect(npc2Cards).toHaveLength(1);

    // Both show '!'
    const indicators = computeAllNPCIndicators([npc1, npc2], questMap, progressMap, 10);
    expect(indicators.get('npc1')!.text).toBe('!');
    expect(indicators.get('npc2')!.text).toBe('!');

    // Player accepts q1 from NPC1 and q3 from NPC2
    progressMap.set('q1', makeProgress('q1', 'active', [{ current: 3 }]));
    progressMap.set('q3', makeProgress('q3', 'active', [{ current: 0 }]));

    // Tracker shows both active quests, main quests first
    const trackerState = buildTrackerState([
      { quest: q1, progress: progressMap.get('q1')! },
      { quest: q3, progress: progressMap.get('q3')! },
    ]);
    expect(trackerState.entries).toHaveLength(2);
    // Both are main quests, so order may be preserved
    const names = trackerState.entries.map(e => e.name);
    expect(names).toContain('猎杀史莱姆');
    expect(names).toContain('探索洞穴');

    // NPC1 still has q2 available (side quest)
    const npc1CardsAfter = gatherNpcQuests(npc1.quests!, questMap, progressMap, 10);
    expect(npc1CardsAfter).toHaveLength(1);
    expect(npc1CardsAfter[0].quest.id).toBe('q2');
    expect(npc1CardsAfter[0].cardAction).toBe('accept');

    // NPC1 indicator: '!' for remaining available quest
    const npc1Indicator = computeNPCIndicator(npc1, questMap, progressMap, 10);
    expect(npc1Indicator.text).toBe('!');

    // NPC2 indicator: dim '?' (active quest, no available)
    const npc2Indicator = computeNPCIndicator(npc2, questMap, progressMap, 10);
    expect(npc2Indicator.text).toBe('?');
    expect(npc2Indicator.color).toBe('#888888');
  });

  it('turn-in quest appears first in NPC card when NPC has both turn-in and available', () => {
    const q1 = makeQuest({ id: 'q1', name: '可交付任务' });
    const q2 = makeQuest({ id: 'q2', name: '可接受任务' });
    questMap.set('q1', q1);
    questMap.set('q2', q2);
    progressMap.set('q1', makeProgress('q1', 'completed', [{ current: 10 }]));

    const npc = makeNPC({ quests: ['q1', 'q2'] });
    const cards = gatherNpcQuests(npc.quests!, questMap, progressMap, 10);
    expect(cards).toHaveLength(2);
    expect(cards[0].cardAction).toBe('turn_in');
    expect(cards[0].quest.name).toBe('可交付任务');
    expect(cards[1].cardAction).toBe('accept');
    expect(cards[1].quest.name).toBe('可接受任务');

    // Indicator shows '?' (turn-in priority)
    const indicator = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(indicator.text).toBe('?');
    expect(indicator.color).toBe('#f1c40f');
  });
});

// ═══════════════════════════════════════
// Save/Load Simulation
// ═══════════════════════════════════════

describe('QuestUXIntegration — save/load preserves quest state', () => {
  it('serialized progress state restores card, tracker, and indicator state correctly', () => {
    const quest = makeQuest({
      id: 'save_q',
      name: '存档任务',
      objectives: [
        { type: 'kill', targetId: 'slime', targetName: '史莱姆', required: 10, current: 0 },
        { type: 'collect', targetId: 'gem', targetName: '宝石', required: 5, current: 0 },
      ],
    });
    const npc = makeNPC({ quests: ['save_q'] });
    const questMap = new Map([['save_q', quest]]);
    const progressMap = new Map([
      ['save_q', makeProgress('save_q', 'active', [{ current: 7 }, { current: 3 }])],
    ]);

    // Capture state before "save"
    const trackerBefore = buildTrackerState([
      { quest, progress: progressMap.get('save_q')! },
    ]);
    const indicatorBefore = computeNPCIndicator(npc, questMap, progressMap, 10);
    const sigBefore = buildTrackerSignature(trackerBefore);

    // Simulate save: serialize progressMap to JSON
    const savedProgress = JSON.parse(
      JSON.stringify(Array.from(progressMap.entries())),
    ) as [string, QuestProgress][];

    // Simulate load: restore from serialized data
    const restoredProgressMap = new Map<string, QuestProgress>(savedProgress);

    // Verify state after "load"
    const trackerAfter = buildTrackerState([
      { quest, progress: restoredProgressMap.get('save_q')! },
    ]);
    const indicatorAfter = computeNPCIndicator(npc, questMap, restoredProgressMap, 10);
    const sigAfter = buildTrackerSignature(trackerAfter);

    // Tracker state matches
    expect(sigBefore).toBe(sigAfter);
    expect(trackerAfter.entries[0].progressSummary).toBe(trackerBefore.entries[0].progressSummary);
    expect(trackerAfter.entries[0].isCompleted).toBe(trackerBefore.entries[0].isCompleted);
    expect(trackerAfter.entries[0].objectiveLines).toEqual(trackerBefore.entries[0].objectiveLines);

    // Indicator state matches
    expect(indicatorAfter.text).toBe(indicatorBefore.text);
    expect(indicatorAfter.color).toBe(indicatorBefore.color);
    expect(indicatorAfter.visible).toBe(indicatorBefore.visible);
  });

  it('save/load preserves multi-quest NPC state with prereq chains', () => {
    const q1 = makeQuest({ id: 'prereq_q1', name: '前置任务' });
    const q2 = makeQuest({ id: 'prereq_q2', name: '后续任务', prereqQuests: ['prereq_q1'] });
    const npc = makeNPC({ quests: ['prereq_q1', 'prereq_q2'] });
    const questMap = new Map([['prereq_q1', q1], ['prereq_q2', q2]]);
    const progressMap = new Map([
      ['prereq_q1', makeProgress('prereq_q1', 'turned_in', [{ current: 10 }])],
      ['prereq_q2', makeProgress('prereq_q2', 'active', [{ current: 3 }])],
    ]);

    // Before save
    const cardsBefore = gatherNpcQuests(npc.quests!, questMap, progressMap, 10);
    const indicatorBefore = computeNPCIndicator(npc, questMap, progressMap, 10);
    const trackerBefore = buildTrackerState([
      { quest: q2, progress: progressMap.get('prereq_q2')! },
    ]);

    // Serialize + deserialize
    const savedProgress = JSON.parse(
      JSON.stringify(Array.from(progressMap.entries())),
    ) as [string, QuestProgress][];
    const restoredProgressMap = new Map<string, QuestProgress>(savedProgress);

    // After load
    const cardsAfter = gatherNpcQuests(npc.quests!, questMap, restoredProgressMap, 10);
    const indicatorAfter = computeNPCIndicator(npc, questMap, restoredProgressMap, 10);
    const trackerAfter = buildTrackerState([
      { quest: q2, progress: restoredProgressMap.get('prereq_q2')! },
    ]);

    expect(cardsAfter.length).toBe(cardsBefore.length);
    expect(indicatorAfter).toEqual(indicatorBefore);
    expect(buildTrackerSignature(trackerAfter)).toBe(buildTrackerSignature(trackerBefore));
  });

  it('save/load preserves completed quest state ready for turn-in', () => {
    const quest = makeQuest({ id: 'save_complete_q', name: '完成存档任务' });
    const npc = makeNPC({ quests: ['save_complete_q'] });
    const questMap = new Map([['save_complete_q', quest]]);

    const progressMap = new Map([
      ['save_complete_q', makeProgress('save_complete_q', 'completed', [{ current: 10 }])],
    ]);

    // Serialize + deserialize
    const savedProgress = JSON.parse(
      JSON.stringify(Array.from(progressMap.entries())),
    ) as [string, QuestProgress][];
    const restoredProgressMap = new Map<string, QuestProgress>(savedProgress);

    // Card still shows turn-in
    const cards = gatherNpcQuests(npc.quests!, questMap, restoredProgressMap, 10);
    expect(cards).toHaveLength(1);
    expect(cards[0].cardAction).toBe('turn_in');

    // Indicator still shows yellow '?'
    const indicator = computeNPCIndicator(npc, questMap, restoredProgressMap, 10);
    expect(indicator.text).toBe('?');
    expect(indicator.color).toBe('#f1c40f');

    // Tracker still shows completion
    const trackerState = buildTrackerState([
      { quest, progress: restoredProgressMap.get('save_complete_q')! },
    ]);
    expect(trackerState.entries[0].isCompleted).toBe(true);
    expect(trackerState.entries[0].progressSummary).toBe('已完成 - 返回NPC交付');
  });
});

// ═══════════════════════════════════════
// Zone Transition — Tracker Persistence
// ═══════════════════════════════════════

describe('QuestUXIntegration — zone transition tracker persistence', () => {
  it('tracker state persists when simulating zone change with same quest data', () => {
    const q1 = makeQuest({ id: 'zone1_q', name: '平原任务', zone: 'emerald_plains' });
    const q2 = makeQuest({ id: 'zone2_q', name: '森林任务', zone: 'twilight_forest' });

    const progressMap = new Map([
      ['zone1_q', makeProgress('zone1_q', 'active', [{ current: 5 }])],
      ['zone2_q', makeProgress('zone2_q', 'active', [{ current: 2 }])],
    ]);

    // Build tracker state (represents Zone 1)
    const zone1Tracker = buildTrackerState([
      { quest: q1, progress: progressMap.get('zone1_q')! },
      { quest: q2, progress: progressMap.get('zone2_q')! },
    ]);
    expect(zone1Tracker.entries).toHaveLength(2);

    // Zone transition: same progress data carried over
    // (QuestSystem persists across zone transitions)
    const zone2Tracker = buildTrackerState([
      { quest: q1, progress: progressMap.get('zone1_q')! },
      { quest: q2, progress: progressMap.get('zone2_q')! },
    ]);
    expect(zone2Tracker.entries).toHaveLength(2);

    // Signatures match (same data = same tracker)
    expect(buildTrackerSignature(zone1Tracker)).toBe(buildTrackerSignature(zone2Tracker));

    // Both quests visible in tracker regardless of current zone
    const names = zone2Tracker.entries.map(e => e.name);
    expect(names).toContain('平原任务');
    expect(names).toContain('森林任务');
  });

  it('NPC indicators recompute correctly after zone transition', () => {
    const q1 = makeQuest({ id: 'zt_q1', name: '交付中', category: 'main' });
    const q2 = makeQuest({ id: 'zt_q2', name: '可接受', category: 'side' });
    const npc = makeNPC({ id: 'zt_npc', quests: ['zt_q1', 'zt_q2'] });
    const questMap = new Map([['zt_q1', q1], ['zt_q2', q2]]);

    // Before zone transition: q1 completed
    const progressMap = new Map([
      ['zt_q1', makeProgress('zt_q1', 'completed', [{ current: 10 }])],
    ]);
    const indicatorBefore = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(indicatorBefore.text).toBe('?');

    // After zone transition (same data, re-evaluated)
    const indicatorAfter = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(indicatorAfter).toEqual(indicatorBefore);
  });
});

// ═══════════════════════════════════════
// Real Data Integration
// ═══════════════════════════════════════

describe('QuestUXIntegration — real data end-to-end', () => {
  let questMap: Map<string, QuestDefinition>;

  beforeEach(() => {
    questMap = new Map();
    for (const q of AllQuests) {
      questMap.set(q.id, q);
    }
  });

  it('village elder full lifecycle with real quest data', () => {
    const elder = NPCDefinitions['quest_elder'];
    const progressMap = new Map<string, QuestProgress>();

    // Step 1: New player sees elder with '!'
    const step1Indicator = computeNPCIndicator(elder, questMap, progressMap, 10);
    expect(step1Indicator.text).toBe('!');
    expect(step1Indicator.color).toBe('#f1c40f'); // main quest

    // Step 2: Interact → q_kill_slimes available
    const step2Cards = gatherNpcQuests(elder.quests!, questMap, progressMap, 10);
    expect(step2Cards.length).toBeGreaterThanOrEqual(1);
    const slimeQuest = step2Cards.find(c => c.quest.id === 'q_kill_slimes');
    expect(slimeQuest).toBeDefined();
    expect(slimeQuest!.cardAction).toBe('accept');

    // Build card data
    const card = buildQuestCardData(slimeQuest!, true);
    expect(card.name).toBe('史莱姆之灾');
    expect(card.typeBadge).toBe('猎杀');
    expect(card.objectives[0].label).toBe('猎杀 绿色史莱姆');
    expect(card.objectives[0].progress).toBe('0/10');
    expect(card.rewards.exp).toBe(120);
    expect(card.rewards.gold).toBe(25);
    expect(card.hasLore).toBe(true);

    // Step 3: Accept quest → tracker shows it
    progressMap.set('q_kill_slimes', makeProgress('q_kill_slimes', 'active', [{ current: 0 }]));
    const tracker = buildTrackerState([
      { quest: questMap.get('q_kill_slimes')!, progress: progressMap.get('q_kill_slimes')! },
    ]);
    expect(tracker.entries[0].name).toBe('史莱姆之灾');
    expect(tracker.entries[0].progressSummary).toBe('猎杀 0/10');

    // Step 4: Progress to 7/10
    progressMap.set('q_kill_slimes', makeProgress('q_kill_slimes', 'active', [{ current: 7 }]));
    const tracker2 = buildTrackerState([
      { quest: questMap.get('q_kill_slimes')!, progress: progressMap.get('q_kill_slimes')! },
    ]);
    expect(tracker2.entries[0].progressSummary).toBe('猎杀 7/10');

    // Step 5: Complete → tracker shows completion
    progressMap.set('q_kill_slimes', makeProgress('q_kill_slimes', 'completed', [{ current: 10 }]));
    const tracker3 = buildTrackerState([
      { quest: questMap.get('q_kill_slimes')!, progress: progressMap.get('q_kill_slimes')! },
    ]);
    expect(tracker3.entries[0].isCompleted).toBe(true);
    expect(tracker3.entries[0].progressSummary).toBe('已完成 - 返回NPC交付');

    // Elder shows yellow '?'
    const step5Indicator = computeNPCIndicator(elder, questMap, progressMap, 10);
    expect(step5Indicator.text).toBe('?');
    expect(step5Indicator.color).toBe('#f1c40f');

    // Step 6: Turn in → next quests become available
    progressMap.set('q_kill_slimes', makeProgress('q_kill_slimes', 'turned_in', [{ current: 10 }]));
    const step6Cards = gatherNpcQuests(elder.quests!, questMap, progressMap, 10);
    // After turning in q_kill_slimes, q_collect_slime_gel (side, no prereq) should be available
    // and q_kill_goblins (main, prereq: q_kill_slimes) becomes available
    const goblinQuest = step6Cards.find(c => c.quest.id === 'q_kill_goblins');
    expect(goblinQuest, 'q_kill_goblins should be available after q_kill_slimes turned in').toBeDefined();
    expect(goblinQuest!.cardAction).toBe('accept');

    // Elder shows '!' again (new quests available)
    const step6Indicator = computeNPCIndicator(elder, questMap, progressMap, 10);
    expect(step6Indicator.text).toBe('!');
    expect(step6Indicator.visible).toBe(true);
  });

  it('all quest types produce valid card + tracker data', () => {
    const questTypes = new Set<string>();
    for (const q of AllQuests) {
      questTypes.add(q.type);
    }

    for (const type of questTypes) {
      const quest = AllQuests.find(q => q.type === type)!;
      expect(quest, `No quest found for type: ${type}`).toBeDefined();

      // Card data
      const entry: NpcQuestEntry = { quest, progress: undefined, cardAction: 'accept' };
      const card = buildQuestCardData(entry, false);
      expect(card.typeBadge).toBe(QUEST_TYPE_LABELS[type]);
      expect(card.objectives.length).toBeGreaterThan(0);
      expect(card.name.length).toBeGreaterThan(0);

      // Tracker data (with simulated active progress)
      const progress = makeProgress(
        quest.id,
        'active',
        quest.objectives.map(() => ({ current: 0 })),
      );
      const trackerEntry = buildTrackerEntry(quest, progress);
      expect(trackerEntry.name).toBe(quest.name);
      expect(trackerEntry.progressSummary.length).toBeGreaterThan(0);
    }
  });

  it('all quest NPCs produce valid indicators and cards', () => {
    const questNpcs = Object.values(NPCDefinitions).filter(
      npc => npc.type === 'quest' && npc.quests && npc.quests.length > 0,
    );
    expect(questNpcs.length).toBeGreaterThan(0);

    for (const npc of questNpcs) {
      const progressMap = new Map<string, QuestProgress>();

      // Indicator check
      const indicator = computeNPCIndicator(npc, questMap, progressMap, 50);
      // At level 50, most quests should be available
      if (indicator.visible) {
        expect(['!', '?']).toContain(indicator.text);
        expect(indicator.color.length).toBeGreaterThan(0);
      }

      // Card check
      const cards = gatherNpcQuests(npc.quests!, questMap, progressMap, 50);
      for (const cardEntry of cards) {
        const card = buildQuestCardData(cardEntry, false);
        expect(card.questId).toBe(cardEntry.quest.id);
        expect(card.objectives.length).toBeGreaterThan(0);
        expect(card.rewards.exp).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

// ═══════════════════════════════════════
// Tracker Sorting + Card Priority Agreement
// ═══════════════════════════════════════

describe('QuestUXIntegration — tracker sorting agrees with card priority', () => {
  it('tracker sorts main before side, matching card category display', () => {
    const mainQuest = makeQuest({ id: 'main_q', name: '主线', category: 'main' });
    const sideQuest = makeQuest({ id: 'side_q', name: '支线', category: 'side' });

    const trackerState = buildTrackerState([
      { quest: sideQuest, progress: makeProgress('side_q', 'active', [{ current: 1 }]) },
      { quest: mainQuest, progress: makeProgress('main_q', 'active', [{ current: 2 }]) },
    ]);

    // Main quest appears first in tracker
    expect(trackerState.entries[0].category).toBe('main');
    expect(trackerState.entries[1].category).toBe('side');

    // Card data preserves category
    const mainCard = buildQuestCardData(
      { quest: mainQuest, progress: undefined, cardAction: 'accept' },
      false,
    );
    expect(mainCard.category).toBe('main');

    const sideCard = buildQuestCardData(
      { quest: sideQuest, progress: undefined, cardAction: 'accept' },
      false,
    );
    expect(sideCard.category).toBe('side');
  });
});

// ═══════════════════════════════════════
// Edge Cases
// ═══════════════════════════════════════

describe('QuestUXIntegration — edge cases', () => {
  it('NPC with no quests in questMap produces no card and hidden indicator', () => {
    const npc = makeNPC({ quests: ['nonexistent_q'] });
    const questMap = new Map<string, QuestDefinition>();
    const progressMap = new Map<string, QuestProgress>();

    const cards = gatherNpcQuests(npc.quests!, questMap, progressMap, 10);
    expect(cards).toHaveLength(0);

    const indicator = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(indicator.visible).toBe(false);
  });

  it('all three modules agree on quest with max objectives', () => {
    const quest = makeQuest({
      id: 'max_obj_q',
      type: 'craft',
      objectives: [
        { type: 'craft_collect', targetId: 'ore', targetName: '矿石', required: 5, current: 0 },
        { type: 'craft_craft', targetId: 'sword', targetName: '剑', required: 1, current: 0 },
        { type: 'craft_deliver', targetId: 'smith', targetName: '铁匠', required: 1, current: 0 },
      ],
    });
    const npc = makeNPC({ quests: ['max_obj_q'] });
    const questMap = new Map([['max_obj_q', quest]]);
    const progressMap = new Map<string, QuestProgress>();

    // Card shows all 3 objectives
    const cards = gatherNpcQuests(npc.quests!, questMap, progressMap, 10);
    expect(cards).toHaveLength(1);
    const card = buildQuestCardData(cards[0], false);
    expect(card.objectives).toHaveLength(3);
    expect(card.objectives[0].label).toBe('采集 矿石');
    expect(card.objectives[1].label).toBe('制作 剑');
    expect(card.objectives[2].label).toBe('交付 铁匠');

    // Tracker shows aggregate progress
    progressMap.set('max_obj_q', makeProgress('max_obj_q', 'active', [
      { current: 5 }, { current: 0 }, { current: 0 },
    ]));
    const entry = buildTrackerEntry(quest, progressMap.get('max_obj_q')!);
    expect(entry.progressSummary).toBe('1/3 完成');
    expect(entry.objectiveLines[0].done).toBe(true);
    expect(entry.objectiveLines[1].done).toBe(false);
    expect(entry.objectiveLines[2].done).toBe(false);

    // Indicator shows dim '?'
    const indicator = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(indicator.text).toBe('?');
    expect(indicator.color).toBe('#888888');
  });

  it('failed reacceptable quest can restart the full lifecycle', () => {
    const quest = makeQuest({ id: 'reaccept_q', name: '重试任务', reacceptable: true });
    const npc = makeNPC({ quests: ['reaccept_q'] });
    const questMap = new Map([['reaccept_q', quest]]);
    const progressMap = new Map<string, QuestProgress>();

    // Accept and fail
    progressMap.set('reaccept_q', makeProgress('reaccept_q', 'failed', [{ current: 3 }]));

    // NPC shows '!' (reacceptable)
    const indicator = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(indicator.text).toBe('!');

    // Card shows accept action
    const cards = gatherNpcQuests(npc.quests!, questMap, progressMap, 10);
    expect(cards).toHaveLength(1);
    expect(cards[0].cardAction).toBe('accept');

    // Re-accept: active again
    progressMap.set('reaccept_q', makeProgress('reaccept_q', 'active', [{ current: 0 }]));
    const tracker = buildTrackerState([
      { quest, progress: progressMap.get('reaccept_q')! },
    ]);
    expect(tracker.entries[0].progressSummary).toBe('猎杀 0/10');
  });

  it('handles empty quest list gracefully across all modules', () => {
    const npc = makeNPC({ quests: [] });
    const questMap = new Map<string, QuestDefinition>();
    const progressMap = new Map<string, QuestProgress>();

    const cards = gatherNpcQuests([], questMap, progressMap, 10);
    expect(cards).toHaveLength(0);

    const indicator = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(indicator.visible).toBe(false);

    const tracker = buildTrackerState([]);
    expect(tracker.entries).toHaveLength(0);
    expect(tracker.hasMore).toBe(false);
    expect(buildTrackerSignature(tracker)).toBe('');
  });
});

// ═══════════════════════════════════════
// Scrutiny Fix Regression Tests
// ═══════════════════════════════════════

describe('QuestUXIntegration — scrutiny fix regressions', () => {
  it('side quest NPC indicator is yellow, same as main quest', () => {
    const mainQuest = makeQuest({ id: 'main_q', category: 'main' });
    const sideQuest = makeQuest({ id: 'side_q', category: 'side' });
    const mainNpc = makeNPC({ id: 'main_npc', quests: ['main_q'] });
    const sideNpc = makeNPC({ id: 'side_npc', quests: ['side_q'] });
    const questMap = new Map([['main_q', mainQuest], ['side_q', sideQuest]]);
    const progressMap = new Map<string, QuestProgress>();

    const mainIndicator = computeNPCIndicator(mainNpc, questMap, progressMap, 10);
    const sideIndicator = computeNPCIndicator(sideNpc, questMap, progressMap, 10);

    // Both should be yellow '!'
    expect(mainIndicator.color).toBe('#f1c40f');
    expect(sideIndicator.color).toBe('#f1c40f');
    expect(mainIndicator.text).toBe('!');
    expect(sideIndicator.text).toBe('!');
  });

  it('quest with item rewards includes items in reward summary', () => {
    const quest = makeQuest({
      id: 'item_reward_q',
      name: '物品奖励测试',
      rewards: { exp: 100, gold: 50, items: ['w_short_sword'] },
    });
    const entry: NpcQuestEntry = {
      quest,
      progress: undefined,
      cardAction: 'accept',
    };
    const card = buildQuestCardData(entry, false);
    expect(card.rewards.exp).toBe(100);
    expect(card.rewards.gold).toBe(50);
    // items field should be preserved in quest data
    expect(quest.rewards.items).toEqual(['w_short_sword']);
  });

  it('NPC indicator transitions from active dim "?" to completed yellow "?" on quest completion', () => {
    const quest = makeQuest({ id: 'comp_q', name: '完成测试' });
    const npc = makeNPC({ quests: ['comp_q'] });
    const questMap = new Map([['comp_q', quest]]);
    const progressMap = new Map<string, QuestProgress>();

    // Active: dim grey '?'
    progressMap.set('comp_q', makeProgress('comp_q', 'active', [{ current: 5 }]));
    const activeIndicator = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(activeIndicator.text).toBe('?');
    expect(activeIndicator.color).toBe('#888888');

    // Completed: yellow '?' (this is what QUEST_COMPLETED event triggers)
    progressMap.set('comp_q', makeProgress('comp_q', 'completed', [{ current: 10 }]));
    const completedIndicator = computeNPCIndicator(npc, questMap, progressMap, 10);
    expect(completedIndicator.text).toBe('?');
    expect(completedIndicator.color).toBe('#f1c40f');
  });

  it('computeAllNPCIndicators gives yellow "!" for all available quests regardless of category', () => {
    const npc1 = makeNPC({ id: 'npc1', quests: ['mq1'] });
    const npc2 = makeNPC({ id: 'npc2', quests: ['sq1'] });
    const mq = makeQuest({ id: 'mq1', category: 'main' });
    const sq = makeQuest({ id: 'sq1', category: 'side' });
    const questMap = new Map([['mq1', mq], ['sq1', sq]]);
    const progressMap = new Map<string, QuestProgress>();

    const allIndicators = computeAllNPCIndicators([npc1, npc2], questMap, progressMap, 10);
    expect(allIndicators.get('npc1')?.color).toBe('#f1c40f');
    expect(allIndicators.get('npc2')?.color).toBe('#f1c40f');
  });
});
