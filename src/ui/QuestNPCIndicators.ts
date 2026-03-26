/**
 * QuestNPCIndicators — Pure utility functions for NPC quest indicator logic.
 *
 * Determines what indicator ('!' for available, '?' for turn-in) an NPC
 * should display based on quest state.  Free of Phaser dependencies so
 * they can be unit-tested with Vitest directly.
 */

import type { NPCDefinition, QuestDefinition, QuestProgress } from '../data/types';

// ─── Display Types ──────────────────────────────────────────────

export interface NPCIndicatorState {
  /** The character to display ('!' | '?' | '') */
  text: string;
  /** The color hex string for the indicator ('#f1c40f' yellow, '#95a5a6' grey, '#888888' grey-dim) */
  color: string;
  /** Whether the indicator should be visible */
  visible: boolean;
}

// ─── Core Logic ─────────────────────────────────────────────────

/**
 * Compute what quest indicator an NPC should display.
 *
 * Priority:
 * 1. Completed quest ready for turn-in  → yellow '?'
 * 2. Available quest (main or side)     → yellow '!'
 * 3. Active quest (in-progress)         → dim grey '?'
 * 4. No relevant quests                 → hidden
 */
export function computeNPCIndicator(
  npcDef: NPCDefinition,
  questMap: Map<string, QuestDefinition>,
  progressMap: Map<string, QuestProgress>,
  playerLevel: number,
): NPCIndicatorState {
  if (!npcDef.quests || npcDef.quests.length === 0) {
    return { text: '', color: '', visible: false };
  }

  let hasCompletedQuest = false;
  let hasActiveQuest = false;
  let hasAvailableQuest = false;

  for (const qid of npcDef.quests) {
    const prog = progressMap.get(qid);
    if (prog) {
      if (prog.status === 'completed') hasCompletedQuest = true;
      else if (prog.status === 'active') hasActiveQuest = true;
    }
  }

  if (!hasCompletedQuest) {
    for (const qid of npcDef.quests) {
      const quest = questMap.get(qid);
      if (!quest) continue;
      if (quest.level > playerLevel + 5) continue;

      const prog = progressMap.get(qid);

      // Check prereqs for new quests
      if (!prog) {
        if (quest.prereqQuests) {
          const meetsPrereqs = quest.prereqQuests.every(pre => {
            const p = progressMap.get(pre);
            return p && p.status === 'turned_in';
          });
          if (!meetsPrereqs) continue;
        }
        hasAvailableQuest = true;
        break;
      }

      // Failed + reacceptable
      if (prog.status === 'failed' && quest.reacceptable) {
        hasAvailableQuest = true;
        break;
      }
    }
  }

  if (hasCompletedQuest) {
    return { text: '?', color: '#f1c40f', visible: true };
  }
  if (hasAvailableQuest) {
    return { text: '!', color: '#f1c40f', visible: true };
  }
  if (hasActiveQuest) {
    return { text: '?', color: '#888888', visible: true };
  }
  return { text: '', color: '', visible: false };
}

/**
 * Compute indicators for all NPCs with quest data.
 *
 * Returns a map of NPC id → indicator state.
 */
export function computeAllNPCIndicators(
  npcDefs: NPCDefinition[],
  questMap: Map<string, QuestDefinition>,
  progressMap: Map<string, QuestProgress>,
  playerLevel: number,
): Map<string, NPCIndicatorState> {
  const result = new Map<string, NPCIndicatorState>();
  for (const def of npcDefs) {
    if (!def.quests || def.quests.length === 0) continue;
    result.set(def.id, computeNPCIndicator(def, questMap, progressMap, playerLevel));
  }
  return result;
}
