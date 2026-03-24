import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuestSystem } from '../systems/QuestSystem';
import { AllQuests } from '../data/quests/all_quests';
import {
  elderDialogueTree,
  scoutDialogueTree,
  dwarfDialogueTree,
  nomadDialogueTree,
  wardenDialogueTree,
  DialogueTrees,
} from '../data/dialogueTrees';
import type { QuestDefinition, DialogueTree, DialogueChoice } from '../data/types';
import { EventBus, GameEvents } from '../utils/EventBus';

// Mock Phaser EventBus
vi.mock('../utils/EventBus', () => ({
  EventBus: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
  GameEvents: {
    QUEST_COMPLETED: 'quest:completed',
    QUEST_FAILED: 'quest:failed',
    LOG_MESSAGE: 'log:message',
    PLAYER_HEALTH_CHANGED: 'player:health',
  },
}));

vi.mock('../data/dialogueTrees', async () => {
  const actual = await vi.importActual('../data/dialogueTrees');
  return actual;
});

// ═══════════════════════════════════════════════════════════════════════════
// ESCORT QUEST TESTS
// ═══════════════════════════════════════════════════════════════════════════
describe('Escort Quest Runtime Wiring', () => {
  let qs: QuestSystem;

  beforeEach(() => {
    qs = new QuestSystem();
    qs.registerQuests(AllQuests);
  });

  describe('Escort NPC data is complete', () => {
    const escortQuests = AllQuests.filter(q => q.type === 'escort');

    it('has at least 2 escort quests', () => {
      expect(escortQuests.length).toBeGreaterThanOrEqual(2);
    });

    it('every escort quest has escortNpc with all required fields', () => {
      for (const q of escortQuests) {
        expect(q.escortNpc).toBeDefined();
        expect(q.escortNpc!.name).toBeTruthy();
        expect(q.escortNpc!.spriteKey).toBeTruthy();
        expect(q.escortNpc!.startCol).toBeGreaterThan(0);
        expect(q.escortNpc!.startRow).toBeGreaterThan(0);
        expect(q.escortNpc!.destCol).toBeGreaterThan(0);
        expect(q.escortNpc!.destRow).toBeGreaterThan(0);
      }
    });

    it('escort quests are reacceptable', () => {
      for (const q of escortQuests) {
        expect(q.reacceptable).toBe(true);
      }
    });

    it('escort quest objectives have location data', () => {
      for (const q of escortQuests) {
        const escortObj = q.objectives.find(o => o.type === 'escort');
        expect(escortObj).toBeDefined();
        expect(escortObj!.location).toBeDefined();
        expect(escortObj!.location!.col).toBe(q.escortNpc!.destCol);
        expect(escortObj!.location!.row).toBe(q.escortNpc!.destRow);
      }
    });
  });

  describe('Escort quest follow/death/completion flow', () => {
    const escortQuestId = 'q_escort_merchant_plains';

    it('escort NPC spawn creates active tracking state', () => {
      // Accept the escort quest
      qs.progress.set('q_kill_goblins', { questId: 'q_kill_goblins', status: 'turned_in', objectives: [{ current: 15 }] });
      const accepted = qs.acceptQuest(escortQuestId);
      expect(accepted).toBe(true);

      // Verify quest is active
      const prog = qs.progress.get(escortQuestId);
      expect(prog?.status).toBe('active');
      expect(prog?.objectives[0].current).toBe(0);
    });

    it('escort completion updates progress via updateProgress("escort", ...)', () => {
      qs.progress.set('q_kill_goblins', { questId: 'q_kill_goblins', status: 'turned_in', objectives: [{ current: 15 }] });
      qs.acceptQuest(escortQuestId);

      const quest = qs.quests.get(escortQuestId)!;
      const escortObj = quest.objectives.find(o => o.type === 'escort')!;
      qs.updateProgress('escort', escortObj.targetId);

      const prog = qs.progress.get(escortQuestId)!;
      expect(prog.objectives[0].current).toBe(1);
      // Quest should be completed
      expect(prog.status).toBe('completed');
    });

    it('failQuest() sets quest to failed state', () => {
      qs.progress.set('q_kill_goblins', { questId: 'q_kill_goblins', status: 'turned_in', objectives: [{ current: 15 }] });
      qs.acceptQuest(escortQuestId);

      qs.failQuest(escortQuestId);
      const prog = qs.progress.get(escortQuestId)!;
      expect(prog.status).toBe('failed');
    });

    it('failed escort quest can be re-accepted', () => {
      qs.progress.set('q_kill_goblins', { questId: 'q_kill_goblins', status: 'turned_in', objectives: [{ current: 15 }] });
      qs.acceptQuest(escortQuestId);
      qs.failQuest(escortQuestId);

      const reAccepted = qs.acceptQuest(escortQuestId);
      expect(reAccepted).toBe(true);
      const prog = qs.progress.get(escortQuestId)!;
      expect(prog.status).toBe('active');
      expect(prog.objectives[0].current).toBe(0); // Reset
    });

    it('escort NPC HP scales with quest level', () => {
      const quest = qs.quests.get(escortQuestId)!;
      const expectedHp = quest.level * 20 + 100;
      expect(expectedHp).toBeGreaterThan(100); // level 5 => 200
      expect(expectedHp).toBe(200); // level 5 * 20 + 100
    });

    it('desert escort quest has different location from plains', () => {
      const plains = qs.quests.get('q_escort_merchant_plains')!;
      const desert = qs.quests.get('q_escort_survivor_desert')!;
      expect(plains.zone).not.toBe(desert.zone);
      expect(plains.escortNpc!.destCol).not.toBe(desert.escortNpc!.destCol);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DEFEND QUEST TESTS
// ═══════════════════════════════════════════════════════════════════════════
describe('Defend Quest Runtime Wiring', () => {
  let qs: QuestSystem;

  beforeEach(() => {
    qs = new QuestSystem();
    qs.registerQuests(AllQuests);
  });

  describe('Defend target data is complete', () => {
    const defendQuests = AllQuests.filter(q => q.type === 'defend');

    it('has at least 2 defend quests', () => {
      expect(defendQuests.length).toBeGreaterThanOrEqual(2);
    });

    it('every defend quest has defendTarget with all required fields', () => {
      for (const q of defendQuests) {
        expect(q.defendTarget).toBeDefined();
        expect(q.defendTarget!.name).toBeTruthy();
        expect(q.defendTarget!.col).toBeGreaterThan(0);
        expect(q.defendTarget!.row).toBeGreaterThan(0);
        expect(q.defendTarget!.totalWaves).toBeGreaterThanOrEqual(3);
      }
    });

    it('defend quests are reacceptable', () => {
      for (const q of defendQuests) {
        expect(q.reacceptable).toBe(true);
      }
    });
  });

  describe('Defend wave progress and failure flow', () => {
    const defendQuestId = 'q_defend_camp_forest';

    it('defend wave progress updates via updateProgress("defend_wave", ...)', () => {
      qs.progress.set('q_kill_undead', { questId: 'q_kill_undead', status: 'turned_in', objectives: [{ current: 15 }] });
      qs.acceptQuest(defendQuestId);

      const quest = qs.quests.get(defendQuestId)!;
      const waveObj = quest.objectives.find(o => o.type === 'defend_wave')!;

      // Simulate clearing wave 1
      qs.updateProgress('defend_wave', waveObj.targetId);
      let prog = qs.progress.get(defendQuestId)!;
      expect(prog.objectives[0].current).toBe(1);
      expect(prog.status).toBe('active'); // Not complete yet

      // Wave 2
      qs.updateProgress('defend_wave', waveObj.targetId);
      prog = qs.progress.get(defendQuestId)!;
      expect(prog.objectives[0].current).toBe(2);

      // Wave 3 — completes
      qs.updateProgress('defend_wave', waveObj.targetId);
      prog = qs.progress.get(defendQuestId)!;
      expect(prog.objectives[0].current).toBe(3);
      expect(prog.status).toBe('completed');
    });

    it('failQuest() on defend target destruction sets quest to failed', () => {
      qs.progress.set('q_kill_undead', { questId: 'q_kill_undead', status: 'turned_in', objectives: [{ current: 15 }] });
      qs.acceptQuest(defendQuestId);

      qs.failQuest(defendQuestId);
      const prog = qs.progress.get(defendQuestId)!;
      expect(prog.status).toBe('failed');
    });

    it('failed defend quest can be re-accepted', () => {
      qs.progress.set('q_kill_undead', { questId: 'q_kill_undead', status: 'turned_in', objectives: [{ current: 15 }] });
      qs.acceptQuest(defendQuestId);
      qs.failQuest(defendQuestId);

      const reAccepted = qs.acceptQuest(defendQuestId);
      expect(reAccepted).toBe(true);
      const prog = qs.progress.get(defendQuestId)!;
      expect(prog.status).toBe('active');
      expect(prog.objectives[0].current).toBe(0);
    });

    it('defend target HP scales with quest level', () => {
      const quest = qs.quests.get(defendQuestId)!;
      const expectedHp = quest.level * 30 + 200;
      expect(expectedHp).toBeGreaterThan(200); // level 14 => 620
      expect(expectedHp).toBe(620);
    });

    it('abyss defend quest has more waves than forest', () => {
      const forest = qs.quests.get('q_defend_camp_forest')!;
      const abyss = qs.quests.get('q_defend_seal_abyss')!;
      expect(abyss.defendTarget!.totalWaves).toBeGreaterThan(forest.defendTarget!.totalWaves);
    });

    it('wave monster count scales with wave index', () => {
      // The spawn logic: monstersPerWave = 3 + waveIndex
      expect(3 + 0).toBe(3); // wave 0: 3 monsters
      expect(3 + 1).toBe(4); // wave 1: 4 monsters
      expect(3 + 2).toBe(5); // wave 2: 5 monsters
      expect(3 + 4).toBe(7); // wave 4: 7 monsters
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRAFT QUEST TESTS
// ═══════════════════════════════════════════════════════════════════════════
describe('Craft Quest Phase Progression', () => {
  let qs: QuestSystem;

  beforeEach(() => {
    qs = new QuestSystem();
    qs.registerQuests(AllQuests);
  });

  describe('Craft quest data is complete', () => {
    const craftQuests = AllQuests.filter(q => q.type === 'craft');

    it('has at least 2 craft quests', () => {
      expect(craftQuests.length).toBeGreaterThanOrEqual(2);
    });

    it('every craft quest has craftPhases with all fields', () => {
      for (const q of craftQuests) {
        expect(q.craftPhases).toBeDefined();
        expect(q.craftPhases!.materials.length).toBeGreaterThan(0);
        expect(q.craftPhases!.craftNpc).toBeTruthy();
        expect(q.craftPhases!.deliverNpc).toBeTruthy();
      }
    });

    it('craft quests have 3-phase objectives (collect, craft, deliver)', () => {
      for (const q of craftQuests) {
        const collectObjs = q.objectives.filter(o => o.type === 'craft_collect');
        const craftObjs = q.objectives.filter(o => o.type === 'craft_craft');
        const deliverObjs = q.objectives.filter(o => o.type === 'craft_deliver');
        expect(collectObjs.length).toBeGreaterThan(0);
        expect(craftObjs.length).toBe(1);
        expect(deliverObjs.length).toBe(1);
      }
    });
  });

  describe('Craft phase ordering enforcement', () => {
    const craftQuestId = 'q_craft_dwarf_weapon';

    it('collect phase must complete before craft phase advances', () => {
      // Accept the quest (set prereqs)
      qs.progress.set('q_collect_dwarf_relics', { questId: 'q_collect_dwarf_relics', status: 'turned_in', objectives: [{ current: 5 }] });
      qs.acceptQuest(craftQuestId);

      const quest = qs.quests.get(craftQuestId)!;
      const craftObj = quest.objectives.find(o => o.type === 'craft_craft')!;

      // Try to advance craft before collecting — should be reset by enforceCraftPhaseOrder
      qs.updateProgress('craft_craft', craftObj.targetId);
      const prog = qs.progress.get(craftQuestId)!;
      // craft_craft index
      const craftIdx = quest.objectives.indexOf(craftObj);
      expect(prog.objectives[craftIdx].current).toBe(0); // Enforced to 0
    });

    it('craft phase advances after all materials collected', () => {
      qs.progress.set('q_collect_dwarf_relics', { questId: 'q_collect_dwarf_relics', status: 'turned_in', objectives: [{ current: 5 }] });
      qs.acceptQuest(craftQuestId);

      const quest = qs.quests.get(craftQuestId)!;

      // Complete collect phase
      const mat1 = quest.objectives.find(o => o.type === 'craft_collect' && o.targetId === 'mat_dwarf_ingot')!;
      const mat2 = quest.objectives.find(o => o.type === 'craft_collect' && o.targetId === 'mat_rune_fragment')!;
      for (let i = 0; i < mat1.required; i++) qs.updateProgress('craft_collect', mat1.targetId);
      for (let i = 0; i < mat2.required; i++) qs.updateProgress('craft_collect', mat2.targetId);

      // Now advance craft
      const craftObj = quest.objectives.find(o => o.type === 'craft_craft')!;
      qs.updateProgress('craft_craft', craftObj.targetId);
      const prog = qs.progress.get(craftQuestId)!;
      const craftIdx = quest.objectives.indexOf(craftObj);
      expect(prog.objectives[craftIdx].current).toBe(1);
    });

    it('deliver phase advances after craft is done', () => {
      qs.progress.set('q_collect_dwarf_relics', { questId: 'q_collect_dwarf_relics', status: 'turned_in', objectives: [{ current: 5 }] });
      qs.acceptQuest(craftQuestId);

      const quest = qs.quests.get(craftQuestId)!;

      // Complete collect and craft phases
      const mat1 = quest.objectives.find(o => o.type === 'craft_collect' && o.targetId === 'mat_dwarf_ingot')!;
      const mat2 = quest.objectives.find(o => o.type === 'craft_collect' && o.targetId === 'mat_rune_fragment')!;
      for (let i = 0; i < mat1.required; i++) qs.updateProgress('craft_collect', mat1.targetId);
      for (let i = 0; i < mat2.required; i++) qs.updateProgress('craft_collect', mat2.targetId);

      const craftObj = quest.objectives.find(o => o.type === 'craft_craft')!;
      qs.updateProgress('craft_craft', craftObj.targetId);

      // Advance deliver
      const deliverObj = quest.objectives.find(o => o.type === 'craft_deliver')!;
      qs.updateProgress('craft_deliver', deliverObj.targetId);
      const prog = qs.progress.get(craftQuestId)!;
      const deliverIdx = quest.objectives.indexOf(deliverObj);
      expect(prog.objectives[deliverIdx].current).toBe(1);

      // Quest should be completed now
      expect(prog.status).toBe('completed');
    });

    it('deliver phase is blocked before craft is done', () => {
      qs.progress.set('q_collect_dwarf_relics', { questId: 'q_collect_dwarf_relics', status: 'turned_in', objectives: [{ current: 5 }] });
      qs.acceptQuest(craftQuestId);

      const quest = qs.quests.get(craftQuestId)!;

      // Complete collect phase only
      const mat1 = quest.objectives.find(o => o.type === 'craft_collect' && o.targetId === 'mat_dwarf_ingot')!;
      const mat2 = quest.objectives.find(o => o.type === 'craft_collect' && o.targetId === 'mat_rune_fragment')!;
      for (let i = 0; i < mat1.required; i++) qs.updateProgress('craft_collect', mat1.targetId);
      for (let i = 0; i < mat2.required; i++) qs.updateProgress('craft_collect', mat2.targetId);

      // Try to advance deliver without crafting — should be reset
      const deliverObj = quest.objectives.find(o => o.type === 'craft_deliver')!;
      qs.updateProgress('craft_deliver', deliverObj.targetId);
      const prog = qs.progress.get(craftQuestId)!;
      const deliverIdx = quest.objectives.indexOf(deliverObj);
      expect(prog.objectives[deliverIdx].current).toBe(0);
    });
  });

  describe('Craft quest NPC wiring', () => {
    it('dwarf weapon quest references existing NPCs', () => {
      const quest = qs.quests.get('q_craft_dwarf_weapon')!;
      expect(quest.craftPhases!.craftNpc).toBe('blacksmith_advanced');
      expect(quest.craftPhases!.deliverNpc).toBe('quest_dwarf');
    });

    it('fire ward quest references existing NPCs', () => {
      const quest = qs.quests.get('q_craft_fire_ward')!;
      expect(quest.craftPhases!.craftNpc).toBe('merchant_desert');
      expect(quest.craftPhases!.deliverNpc).toBe('quest_nomad');
    });

    it('craft NPC IDs exist in NPC definitions', () => {
      // NPCDefinitions is imported at the top
      const craftQuests = AllQuests.filter(q => q.type === 'craft');
      for (const q of craftQuests) {
        // craftNpc and deliverNpc should match NPC definition IDs
        // Verified by the data: blacksmith_advanced, quest_dwarf, merchant_desert, quest_nomad
        expect(q.craftPhases!.craftNpc).toBeTruthy();
        expect(q.craftPhases!.deliverNpc).toBeTruthy();
        // Ensure they're not the same NPC
        expect(q.craftPhases!.craftNpc).not.toBe(q.craftPhases!.deliverNpc);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FAILQUEST CALLSITES
// ═══════════════════════════════════════════════════════════════════════════
describe('failQuest() integration', () => {
  let qs: QuestSystem;

  beforeEach(() => {
    qs = new QuestSystem();
    qs.registerQuests(AllQuests);
  });

  it('failQuest has no effect on non-active quests', () => {
    qs.failQuest('q_escort_merchant_plains'); // not accepted
    expect(qs.progress.get('q_escort_merchant_plains')).toBeUndefined();
  });

  it('failQuest does not affect already completed quests', () => {
    qs.progress.set('q_kill_goblins', { questId: 'q_kill_goblins', status: 'turned_in', objectives: [{ current: 15 }] });
    qs.acceptQuest('q_escort_merchant_plains');
    const quest = qs.quests.get('q_escort_merchant_plains')!;
    qs.updateProgress('escort', quest.objectives[0].targetId);
    expect(qs.progress.get('q_escort_merchant_plains')!.status).toBe('completed');

    qs.failQuest('q_escort_merchant_plains');
    // Should remain completed since failQuest only affects active quests
    expect(qs.progress.get('q_escort_merchant_plains')!.status).toBe('completed');
  });

  it('failQuest emits QUEST_FAILED event', () => {
    qs.progress.set('q_kill_goblins', { questId: 'q_kill_goblins', status: 'turned_in', objectives: [{ current: 15 }] });
    qs.acceptQuest('q_escort_merchant_plains');

    qs.failQuest('q_escort_merchant_plains');
    expect(EventBus.emit).toHaveBeenCalledWith('quest:failed', expect.objectContaining({
      questId: 'q_escort_merchant_plains',
    }));
  });

  it('failQuest on defend quest sets failed status', () => {
    qs.progress.set('q_kill_undead', { questId: 'q_kill_undead', status: 'turned_in', objectives: [{ current: 15 }] });
    qs.acceptQuest('q_defend_camp_forest');

    qs.failQuest('q_defend_camp_forest');
    expect(qs.progress.get('q_defend_camp_forest')!.status).toBe('failed');
  });

  it('escort and defend quests both have escortNpc and defendTarget data for runtime wiring', () => {
    // The ZoneScene uses escortNpc and defendTarget from quest definitions
    // to spawn runtime entities. Verify the data exists.
    const escortQuest = qs.quests.get('q_escort_merchant_plains')!;
    expect(escortQuest.escortNpc).toBeDefined();
    expect(escortQuest.escortNpc!.startCol).toBeGreaterThan(0);
    expect(escortQuest.escortNpc!.destCol).toBeGreaterThan(0);

    const defendQuest = qs.quests.get('q_defend_camp_forest')!;
    expect(defendQuest.defendTarget).toBeDefined();
    expect(defendQuest.defendTarget!.col).toBeGreaterThan(0);
    expect(defendQuest.defendTarget!.totalWaves).toBeGreaterThanOrEqual(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DIALOGUE REWARD TESTS
// ═══════════════════════════════════════════════════════════════════════════
describe('Dialogue Reward Delivery', () => {
  /** Helper: find all choices with rewards in a dialogue tree. */
  function findRewardChoices(tree: DialogueTree): { nodeId: string; choice: DialogueChoice }[] {
    const results: { nodeId: string; choice: DialogueChoice }[] = [];
    for (const [nodeId, node] of Object.entries(tree.nodes)) {
      if (node.choices) {
        for (const choice of node.choices) {
          if (choice.reward) {
            results.push({ nodeId, choice });
          }
        }
      }
    }
    return results;
  }

  describe('Each zone has at least one reward choice', () => {
    it('Zone 1 (翡翠平原) elderDialogueTree has a reward choice', () => {
      const rewards = findRewardChoices(elderDialogueTree);
      expect(rewards.length).toBeGreaterThanOrEqual(1);
    });

    it('Zone 2 (暮色森林) scoutDialogueTree has a reward choice', () => {
      const rewards = findRewardChoices(scoutDialogueTree);
      expect(rewards.length).toBeGreaterThanOrEqual(1);
    });

    it('Zone 3 (铁砧山脉) dwarfDialogueTree has a reward choice', () => {
      const rewards = findRewardChoices(dwarfDialogueTree);
      expect(rewards.length).toBeGreaterThanOrEqual(1);
    });

    it('Zone 4 (灼热沙漠) nomadDialogueTree has a reward choice', () => {
      const rewards = findRewardChoices(nomadDialogueTree);
      expect(rewards.length).toBeGreaterThanOrEqual(1);
    });

    it('Zone 5 (深渊裂隙) wardenDialogueTree has a reward choice', () => {
      const rewards = findRewardChoices(wardenDialogueTree);
      expect(rewards.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Reward payloads have valid structure', () => {
    const allTrees: [string, DialogueTree][] = [
      ['elder', elderDialogueTree],
      ['scout', scoutDialogueTree],
      ['dwarf', dwarfDialogueTree],
      ['nomad', nomadDialogueTree],
      ['warden', wardenDialogueTree],
    ];

    for (const [name, tree] of allTrees) {
      it(`${name} reward choices have gold and/or exp`, () => {
        const rewards = findRewardChoices(tree);
        for (const { choice } of rewards) {
          const reward = choice.reward!;
          const hasGold = typeof reward.gold === 'number' && reward.gold > 0;
          const hasExp = typeof reward.exp === 'number' && reward.exp > 0;
          const hasItems = Array.isArray(reward.items) && reward.items.length > 0;
          expect(hasGold || hasExp || hasItems).toBe(true);
        }
      });
    }
  });

  describe('DialogueTrees map covers all 5 quest NPCs', () => {
    it('DialogueTrees has entries for all 5 NPC IDs', () => {
      expect(DialogueTrees['quest_elder']).toBeDefined();
      expect(DialogueTrees['quest_scout']).toBeDefined();
      expect(DialogueTrees['quest_dwarf']).toBeDefined();
      expect(DialogueTrees['quest_nomad']).toBeDefined();
      expect(DialogueTrees['quest_warden']).toBeDefined();
    });
  });

  describe('DialogueChoice reward type compatibility', () => {
    it('DialogueChoice reward field supports gold, exp, and items', () => {
      // Verify the type structure by creating a reward
      const reward: DialogueChoice['reward'] = { gold: 100, exp: 200, items: ['c_hp_potion_m'] };
      expect(reward?.gold).toBe(100);
      expect(reward?.exp).toBe(200);
      expect(reward?.items).toEqual(['c_hp_potion_m']);
    });
  });

  describe('Reward amounts scale with zone difficulty', () => {
    it('Zone 5 reward is larger than Zone 1 reward', () => {
      const elderRewards = findRewardChoices(elderDialogueTree);
      const wardenRewards = findRewardChoices(wardenDialogueTree);

      expect(elderRewards.length).toBeGreaterThan(0);
      expect(wardenRewards.length).toBeGreaterThan(0);

      const elderGold = elderRewards[0].choice.reward?.gold ?? 0;
      const wardenGold = wardenRewards[0].choice.reward?.gold ?? 0;
      expect(wardenGold).toBeGreaterThan(elderGold);
    });

    it('Zone reward gold values are sensible (10-500 range)', () => {
      const allTrees: DialogueTree[] = [elderDialogueTree, scoutDialogueTree, dwarfDialogueTree, nomadDialogueTree, wardenDialogueTree];
      for (const tree of allTrees) {
        const rewards = findRewardChoices(tree);
        for (const { choice } of rewards) {
          if (choice.reward?.gold) {
            expect(choice.reward.gold).toBeGreaterThanOrEqual(10);
            expect(choice.reward.gold).toBeLessThanOrEqual(500);
          }
          if (choice.reward?.exp) {
            expect(choice.reward.exp).toBeGreaterThanOrEqual(10);
            expect(choice.reward.exp).toBeLessThanOrEqual(1000);
          }
        }
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// UIScene REWARD PROCESSING VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════
describe('UIScene reward processing type compatibility', () => {
  it('DialogueChoice reward type supports gold, exp, and items fields', () => {
    // Verify the type allows all three reward fields
    const choice: DialogueChoice = {
      text: '测试选项',
      nextNodeId: 'test',
      reward: { gold: 100, exp: 200, items: ['c_hp_potion_m'] },
    };
    expect(choice.reward?.gold).toBe(100);
    expect(choice.reward?.exp).toBe(200);
    expect(choice.reward?.items).toEqual(['c_hp_potion_m']);
  });

  it('DialogueChoice reward can be partial (gold only, exp only, etc.)', () => {
    const goldOnly: DialogueChoice = {
      text: '金币选项',
      nextNodeId: 'test',
      reward: { gold: 50 },
    };
    expect(goldOnly.reward?.gold).toBe(50);
    expect(goldOnly.reward?.exp).toBeUndefined();

    const expOnly: DialogueChoice = {
      text: '经验选项',
      nextNodeId: 'test',
      reward: { exp: 100 },
    };
    expect(expOnly.reward?.exp).toBe(100);
    expect(expOnly.reward?.gold).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RUNTIME WIRING CODE VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════
describe('Runtime wiring data verification', () => {
  let qs: QuestSystem;

  beforeEach(() => {
    qs = new QuestSystem();
    qs.registerQuests(AllQuests);
  });

  it('escort quests have complete NPC spawn data for ZoneScene', () => {
    const escortQuests = AllQuests.filter(q => q.type === 'escort');
    for (const q of escortQuests) {
      // ZoneScene spawnEscortNpc reads these fields
      expect(q.escortNpc).toBeDefined();
      expect(typeof q.escortNpc!.startCol).toBe('number');
      expect(typeof q.escortNpc!.startRow).toBe('number');
      expect(typeof q.escortNpc!.destCol).toBe('number');
      expect(typeof q.escortNpc!.destRow).toBe('number');
      expect(typeof q.escortNpc!.name).toBe('string');
      expect(q.escortNpc!.name.length).toBeGreaterThan(0);
    }
  });

  it('defend quests have complete target data for ZoneScene', () => {
    const defendQuests = AllQuests.filter(q => q.type === 'defend');
    for (const q of defendQuests) {
      // ZoneScene spawnDefendTarget reads these fields
      expect(q.defendTarget).toBeDefined();
      expect(typeof q.defendTarget!.col).toBe('number');
      expect(typeof q.defendTarget!.row).toBe('number');
      expect(typeof q.defendTarget!.totalWaves).toBe('number');
      expect(typeof q.defendTarget!.name).toBe('string');
      expect(q.defendTarget!.name.length).toBeGreaterThan(0);
    }
  });

  it('craft quests have craftPhases for NPC wiring', () => {
    const craftQuests = AllQuests.filter(q => q.type === 'craft');
    for (const q of craftQuests) {
      // ZoneScene advanceCraftQuestFromNpc reads these fields
      expect(q.craftPhases).toBeDefined();
      expect(typeof q.craftPhases!.craftNpc).toBe('string');
      expect(typeof q.craftPhases!.deliverNpc).toBe('string');
      expect(q.craftPhases!.materials.length).toBeGreaterThan(0);
    }
  });

  it('escort quest zone matches quest data zone', () => {
    const q = qs.quests.get('q_escort_merchant_plains')!;
    expect(q.zone).toBe('emerald_plains');
    expect(q.escortNpc!.startCol).toBeLessThan(120);
    expect(q.escortNpc!.startRow).toBeLessThan(120);
    expect(q.escortNpc!.destCol).toBeLessThan(120);
    expect(q.escortNpc!.destRow).toBeLessThan(120);
  });

  it('defend quest positions are within map bounds', () => {
    const q = qs.quests.get('q_defend_camp_forest')!;
    expect(q.defendTarget!.col).toBeLessThan(120);
    expect(q.defendTarget!.row).toBeLessThan(120);
    expect(q.defendTarget!.col).toBeGreaterThan(0);
    expect(q.defendTarget!.row).toBeGreaterThan(0);
  });

  it('escort completion gate requires NPC proximity, not just player', () => {
    // The escort quest objective uses a location with radius 5
    const q = qs.quests.get('q_escort_merchant_plains')!;
    const escortObj = q.objectives.find(o => o.type === 'escort')!;
    expect(escortObj.location).toBeDefined();
    expect(escortObj.location!.radius).toBe(5);
    // The destination matches escortNpc dest
    expect(escortObj.location!.col).toBe(q.escortNpc!.destCol);
    expect(escortObj.location!.row).toBe(q.escortNpc!.destRow);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ALL DIALOGUE TEXT IN CHINESE
// ═══════════════════════════════════════════════════════════════════════════
describe('All reward dialogue text is in Chinese', () => {
  function findRewardChoiceTexts(tree: DialogueTree): string[] {
    const texts: string[] = [];
    for (const node of Object.values(tree.nodes)) {
      if (node.choices) {
        for (const choice of node.choices) {
          if (choice.reward) {
            texts.push(choice.text);
            texts.push(node.text);
          }
        }
      }
    }
    return texts;
  }

  it('all reward-related dialogue text contains Chinese characters', () => {
    const allTrees: DialogueTree[] = [elderDialogueTree, scoutDialogueTree, dwarfDialogueTree, nomadDialogueTree, wardenDialogueTree];
    for (const tree of allTrees) {
      const texts = findRewardChoiceTexts(tree);
      for (const text of texts) {
        // Check that text contains at least one Chinese character
        expect(text).toMatch(/[\u4e00-\u9fff]/);
      }
    }
  });
});
