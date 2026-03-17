import { EventBus, GameEvents } from '../utils/EventBus';
import type { QuestDefinition, QuestProgress, QuestReward } from '../data/types';

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
    if (this.progress.has(questId)) return false;

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

  updateProgress(type: 'kill' | 'collect' | 'explore' | 'talk', targetId: string, amount = 1): void {
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
        if (prog && prog.status === 'turned_in') return false;
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
}
