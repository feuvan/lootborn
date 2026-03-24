import { EventBus, GameEvents } from '../utils/EventBus';
import type { QuestDefinition, QuestProgress, QuestReward } from '../data/types';

/** Chinese labels for quest types. */
export const QUEST_TYPE_LABELS: Record<string, string> = {
  kill: '猎杀',
  collect: '收集',
  explore: '探索',
  talk: '对话',
  escort: '护送',
  defend: '防守',
  investigate: '调查',
  craft: '制作交付',
};

export class QuestSystem {
  quests: Map<string, QuestDefinition> = new Map();
  progress: Map<string, QuestProgress> = new Map();

  registerQuest(quest: QuestDefinition): void {
    this.quests.set(quest.id, quest);
  }

  registerQuests(quests: QuestDefinition[]): void {
    for (const q of quests) this.registerQuest(q);
  }

  acceptQuest(questId: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest) return false;

    const existing = this.progress.get(questId);
    // Allow re-accepting failed quests that are reacceptable
    if (existing) {
      if (existing.status === 'failed' && quest.reacceptable) {
        // Reset progress for re-acceptance
        this.progress.set(questId, {
          questId,
          status: 'active',
          objectives: quest.objectives.map(() => ({ current: 0 })),
        });
        EventBus.emit(GameEvents.LOG_MESSAGE, {
          text: `重新接受任务: ${quest.name}`,
          type: 'system',
        });
        return true;
      }
      return false;
    }

    // Check prereqs
    if (quest.prereqQuests) {
      for (const pre of quest.prereqQuests) {
        const p = this.progress.get(pre);
        if (!p || p.status !== 'turned_in') return false;
      }
    }

    this.progress.set(questId, {
      questId,
      status: 'active',
      objectives: quest.objectives.map(() => ({ current: 0 })),
    });

    EventBus.emit(GameEvents.LOG_MESSAGE, {
      text: `接受任务: ${quest.name}`,
      type: 'system',
    });
    return true;
  }

  /**
   * Update progress for standard quest objective types.
   * Also checks new objective types: escort, defend_wave, investigate_clue, craft_collect, craft_craft, craft_deliver.
   */
  updateProgress(
    type: 'kill' | 'collect' | 'explore' | 'talk' | 'escort' | 'defend_wave' | 'investigate_clue' | 'craft_collect' | 'craft_craft' | 'craft_deliver',
    targetId: string,
    amount = 1,
  ): void {
    for (const [questId, prog] of this.progress.entries()) {
      if (prog.status !== 'active') continue;
      const quest = this.quests.get(questId);
      if (!quest) continue;

      for (let i = 0; i < quest.objectives.length; i++) {
        const obj = quest.objectives[i];
        if (obj.type === type && obj.targetId === targetId) {
          prog.objectives[i].current = Math.min(
            prog.objectives[i].current + amount,
            obj.required,
          );
        }
      }

      // For craft quests: enforce phase ordering (collect → craft → deliver)
      if (quest.type === 'craft') {
        this.enforceCraftPhaseOrder(quest, prog);
      }

      // Check completion
      const allDone = quest.objectives.every(
        (obj, i) => prog.objectives[i].current >= obj.required,
      );
      if (allDone && prog.status === 'active') {
        prog.status = 'completed';
        EventBus.emit(GameEvents.QUEST_COMPLETED, { questId: quest.id, questName: quest.name });
        EventBus.emit(GameEvents.LOG_MESSAGE, {
          text: `任务完成: ${quest.name}! 返回NPC交付。`,
          type: 'system',
        });
      }
    }
  }

  /**
   * Fail a quest (e.g., escort NPC died, defend target destroyed).
   */
  failQuest(questId: string): void {
    const prog = this.progress.get(questId);
    if (!prog || prog.status !== 'active') return;
    const quest = this.quests.get(questId);
    if (!quest) return;

    prog.status = 'failed';
    EventBus.emit(GameEvents.QUEST_FAILED, { questId: quest.id, questName: quest.name });
    EventBus.emit(GameEvents.LOG_MESSAGE, {
      text: `任务失败: ${quest.name}`,
      type: 'system',
    });
  }

  turnInQuest(questId: string): QuestReward | null {
    const prog = this.progress.get(questId);
    if (!prog || prog.status !== 'completed') return null;
    const quest = this.quests.get(questId);
    if (!quest) return null;

    prog.status = 'turned_in';
    EventBus.emit(GameEvents.LOG_MESSAGE, {
      text: `交付任务: ${quest.name} +${quest.rewards.exp}经验 +${quest.rewards.gold}金币`,
      type: 'system',
    });
    return quest.rewards;
  }

  getAvailableQuests(npcQuests: string[], playerLevel: number): QuestDefinition[] {
    return npcQuests
      .map(id => this.quests.get(id))
      .filter((q): q is QuestDefinition => {
        if (!q) return false;
        if (q.level > playerLevel + 5) return false;
        const prog = this.progress.get(q.id);
        if (prog) {
          if (prog.status === 'turned_in') return false;
          // Show failed reacceptable quests as available
          if (prog.status === 'failed' && q.reacceptable) {
            // Fall through to prereq check
          } else {
            // active, completed, or failed-non-reacceptable — not available
            return false;
          }
        }
        if (q.prereqQuests) {
          return q.prereqQuests.every(pre => {
            const p = this.progress.get(pre);
            return p && p.status === 'turned_in';
          });
        }
        return true;
      });
  }

  getActiveQuests(): { quest: QuestDefinition; progress: QuestProgress }[] {
    const result: { quest: QuestDefinition; progress: QuestProgress }[] = [];
    for (const [id, prog] of this.progress.entries()) {
      if (prog.status === 'active' || prog.status === 'completed') {
        const quest = this.quests.get(id);
        if (quest) result.push({ quest, progress: prog });
      }
    }
    return result;
  }

  getProgressData(): QuestProgress[] {
    return Array.from(this.progress.values());
  }

  loadProgress(data: QuestProgress[]): void {
    this.progress.clear();
    for (const p of data) {
      this.progress.set(p.questId, p);
    }
  }

  /**
   * For craft quests, enforce phase ordering:
   * craft_collect objectives must all be complete before craft_craft can progress,
   * and craft_craft must be complete before craft_deliver can progress.
   */
  private enforceCraftPhaseOrder(quest: QuestDefinition, prog: QuestProgress): void {
    const collectDone = quest.objectives
      .filter(o => o.type === 'craft_collect')
      .every((o, _idx) => {
        const idx = quest.objectives.indexOf(o);
        return prog.objectives[idx].current >= o.required;
      });
    const craftDone = quest.objectives
      .filter(o => o.type === 'craft_craft')
      .every((o) => {
        const idx = quest.objectives.indexOf(o);
        return prog.objectives[idx].current >= o.required;
      });

    // If collect phase not done, reset any craft or deliver progress
    if (!collectDone) {
      quest.objectives.forEach((o, i) => {
        if (o.type === 'craft_craft' || o.type === 'craft_deliver') {
          prog.objectives[i].current = 0;
        }
      });
    }
    // If craft phase not done, reset deliver progress
    if (!craftDone) {
      quest.objectives.forEach((o, i) => {
        if (o.type === 'craft_deliver') {
          prog.objectives[i].current = 0;
        }
      });
    }
  }

  /**
   * Get the current phase label for a craft quest.
   */
  getCraftPhaseLabel(quest: QuestDefinition, prog: QuestProgress): string {
    if (quest.type !== 'craft') return '';

    const collectDone = quest.objectives
      .filter(o => o.type === 'craft_collect')
      .every((o) => {
        const idx = quest.objectives.indexOf(o);
        return prog.objectives[idx].current >= o.required;
      });
    if (!collectDone) return '采集材料';

    const craftDone = quest.objectives
      .filter(o => o.type === 'craft_craft')
      .every((o) => {
        const idx = quest.objectives.indexOf(o);
        return prog.objectives[idx].current >= o.required;
      });
    if (!craftDone) return '制作物品';

    return '交付成品';
  }
}
