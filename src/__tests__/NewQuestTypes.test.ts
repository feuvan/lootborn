import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuestSystem, QUEST_TYPE_LABELS } from '../systems/QuestSystem';
import { AllQuests } from '../data/quests/all_quests';
import { NPCDefinitions } from '../data/npcs';
import type { QuestDefinition, QuestProgress } from '../data/types';

// Mock Phaser EventBus
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

describe('New Quest Types', () => {
  let qs: QuestSystem;

  beforeEach(() => {
    qs = new QuestSystem();
    qs.registerQuests(AllQuests);
  });

  // ═══════════════════════════════════════
  // Type Labels
  // ═══════════════════════════════════════
  describe('QUEST_TYPE_LABELS', () => {
    it('has Chinese labels for all 8 quest types', () => {
      expect(QUEST_TYPE_LABELS['kill']).toBe('猎杀');
      expect(QUEST_TYPE_LABELS['collect']).toBe('收集');
      expect(QUEST_TYPE_LABELS['explore']).toBe('探索');
      expect(QUEST_TYPE_LABELS['talk']).toBe('对话');
      expect(QUEST_TYPE_LABELS['escort']).toBe('护送');
      expect(QUEST_TYPE_LABELS['defend']).toBe('防守');
      expect(QUEST_TYPE_LABELS['investigate']).toBe('调查');
      expect(QUEST_TYPE_LABELS['craft']).toBe('制作交付');
    });
  });

  // ═══════════════════════════════════════
  // Quest Data Validation
  // ═══════════════════════════════════════
  describe('Quest data validation', () => {
    const escortQuests = AllQuests.filter(q => q.type === 'escort');
    const defendQuests = AllQuests.filter(q => q.type === 'defend');
    const investigateQuests = AllQuests.filter(q => q.type === 'investigate');
    const craftQuests = AllQuests.filter(q => q.type === 'craft');

    it('has at least 2 escort quests', () => {
      expect(escortQuests.length).toBeGreaterThanOrEqual(2);
    });

    it('has at least 2 defend quests', () => {
      expect(defendQuests.length).toBeGreaterThanOrEqual(2);
    });

    it('has at least 2 investigate quests', () => {
      expect(investigateQuests.length).toBeGreaterThanOrEqual(2);
    });

    it('has at least 2 craft quests', () => {
      expect(craftQuests.length).toBeGreaterThanOrEqual(2);
    });

    it('escort quests have escortNpc config', () => {
      for (const q of escortQuests) {
        expect(q.escortNpc).toBeDefined();
        expect(q.escortNpc!.name).toBeTruthy();
        expect(q.escortNpc!.spriteKey).toBeTruthy();
        expect(q.escortNpc!.destCol).toBeGreaterThanOrEqual(0);
        expect(q.escortNpc!.destRow).toBeGreaterThanOrEqual(0);
        expect(q.escortNpc!.startCol).toBeGreaterThanOrEqual(0);
        expect(q.escortNpc!.startRow).toBeGreaterThanOrEqual(0);
      }
    });

    it('escort quests are reacceptable', () => {
      for (const q of escortQuests) {
        expect(q.reacceptable).toBe(true);
      }
    });

    it('escort quests have escort objectives with locations', () => {
      for (const q of escortQuests) {
        const escortObjs = q.objectives.filter(o => o.type === 'escort');
        expect(escortObjs.length).toBeGreaterThanOrEqual(1);
        for (const obj of escortObjs) {
          expect(obj.location).toBeDefined();
          expect(obj.location!.col).toBeGreaterThanOrEqual(0);
          expect(obj.location!.row).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('defend quests have defendTarget config', () => {
      for (const q of defendQuests) {
        expect(q.defendTarget).toBeDefined();
        expect(q.defendTarget!.name).toBeTruthy();
        expect(q.defendTarget!.totalWaves).toBeGreaterThanOrEqual(1);
        expect(q.defendTarget!.col).toBeGreaterThanOrEqual(0);
        expect(q.defendTarget!.row).toBeGreaterThanOrEqual(0);
      }
    });

    it('defend quests are reacceptable', () => {
      for (const q of defendQuests) {
        expect(q.reacceptable).toBe(true);
      }
    });

    it('defend quests have defend_wave objectives matching totalWaves', () => {
      for (const q of defendQuests) {
        const waveObjs = q.objectives.filter(o => o.type === 'defend_wave');
        expect(waveObjs.length).toBeGreaterThanOrEqual(1);
        for (const obj of waveObjs) {
          expect(obj.required).toBe(q.defendTarget!.totalWaves);
        }
      }
    });

    it('investigate quests have clues config', () => {
      for (const q of investigateQuests) {
        expect(q.clues).toBeDefined();
        expect(q.clues!.length).toBeGreaterThanOrEqual(2);
        for (const clue of q.clues!) {
          expect(clue.id).toBeTruthy();
          expect(clue.name).toBeTruthy();
          expect(clue.col).toBeGreaterThanOrEqual(0);
          expect(clue.row).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('investigate quests have investigate_clue objectives matching clues', () => {
      for (const q of investigateQuests) {
        const clueObjs = q.objectives.filter(o => o.type === 'investigate_clue');
        expect(clueObjs.length).toBe(q.clues!.length);
        for (const obj of clueObjs) {
          expect(obj.location).toBeDefined();
        }
      }
    });

    it('craft quests have craftPhases config', () => {
      for (const q of craftQuests) {
        expect(q.craftPhases).toBeDefined();
        expect(q.craftPhases!.materials.length).toBeGreaterThanOrEqual(1);
        expect(q.craftPhases!.craftNpc).toBeTruthy();
        expect(q.craftPhases!.deliverNpc).toBeTruthy();
      }
    });

    it('craft quests have 3 phase objective types in order', () => {
      for (const q of craftQuests) {
        const collectObjs = q.objectives.filter(o => o.type === 'craft_collect');
        const craftObjs = q.objectives.filter(o => o.type === 'craft_craft');
        const deliverObjs = q.objectives.filter(o => o.type === 'craft_deliver');
        expect(collectObjs.length).toBeGreaterThanOrEqual(1);
        expect(craftObjs.length).toBeGreaterThanOrEqual(1);
        expect(deliverObjs.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('all new quests have Chinese names and descriptions', () => {
      const newQuests = [...escortQuests, ...defendQuests, ...investigateQuests, ...craftQuests];
      for (const q of newQuests) {
        expect(q.name).toBeTruthy();
        expect(q.description).toBeTruthy();
        // Check for Chinese characters
        expect(/[\u4e00-\u9fff]/.test(q.name)).toBe(true);
        expect(/[\u4e00-\u9fff]/.test(q.description)).toBe(true);
      }
    });

    it('all new quests have valid zones', () => {
      const validZones = ['emerald_plains', 'twilight_forest', 'anvil_mountains', 'scorching_desert', 'abyss_rift'];
      const newQuests = [...escortQuests, ...defendQuests, ...investigateQuests, ...craftQuests];
      for (const q of newQuests) {
        expect(validZones).toContain(q.zone);
      }
    });

    it('new quests are distributed across at least 3 zones', () => {
      const newQuests = [...escortQuests, ...defendQuests, ...investigateQuests, ...craftQuests];
      const zones = new Set(newQuests.map(q => q.zone));
      expect(zones.size).toBeGreaterThanOrEqual(3);
    });

    it('all new quests have valid prereqQuests references', () => {
      const allIds = new Set(AllQuests.map(q => q.id));
      const newQuests = [...escortQuests, ...defendQuests, ...investigateQuests, ...craftQuests];
      for (const q of newQuests) {
        if (q.prereqQuests) {
          for (const pid of q.prereqQuests) {
            expect(allIds.has(pid)).toBe(true);
          }
        }
      }
    });

    it('all new quests have valid rewards', () => {
      const newQuests = [...escortQuests, ...defendQuests, ...investigateQuests, ...craftQuests];
      for (const q of newQuests) {
        expect(q.rewards.exp).toBeGreaterThan(0);
        expect(q.rewards.gold).toBeGreaterThan(0);
      }
    });

    it('all new quests have unique IDs', () => {
      const newQuests = [...escortQuests, ...defendQuests, ...investigateQuests, ...craftQuests];
      const ids = newQuests.map(q => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('no duplicate quest IDs in AllQuests', () => {
      const ids = AllQuests.map(q => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  // ═══════════════════════════════════════
  // QuestSystem — updateProgress for new types
  // ═══════════════════════════════════════
  describe('QuestSystem.updateProgress()', () => {
    it('updates escort objectives', () => {
      // Satisfy prereqs first
      const q = AllQuests.find(q => q.id === 'q_escort_merchant_plains')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_escort_merchant_plains');
      expect(qs.progress.get('q_escort_merchant_plains')!.status).toBe('active');

      qs.updateProgress('escort', 'escort_merchant');
      const prog = qs.progress.get('q_escort_merchant_plains')!;
      expect(prog.objectives[0].current).toBe(1);
      expect(prog.status).toBe('completed');
    });

    it('updates defend_wave objectives', () => {
      const q = AllQuests.find(q => q.id === 'q_defend_camp_forest')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_defend_camp_forest');
      expect(qs.progress.get('q_defend_camp_forest')!.status).toBe('active');

      qs.updateProgress('defend_wave', 'defend_forest_camp');
      expect(qs.progress.get('q_defend_camp_forest')!.objectives[0].current).toBe(1);

      qs.updateProgress('defend_wave', 'defend_forest_camp');
      qs.updateProgress('defend_wave', 'defend_forest_camp');
      const prog = qs.progress.get('q_defend_camp_forest')!;
      expect(prog.objectives[0].current).toBe(3);
      expect(prog.status).toBe('completed');
    });

    it('updates investigate_clue objectives', () => {
      const q = AllQuests.find(q => q.id === 'q_investigate_corruption_forest')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_investigate_corruption_forest');
      expect(qs.progress.get('q_investigate_corruption_forest')!.status).toBe('active');

      qs.updateProgress('investigate_clue', 'clue_corrupt_1');
      qs.updateProgress('investigate_clue', 'clue_corrupt_2');
      expect(qs.progress.get('q_investigate_corruption_forest')!.objectives[0].current).toBe(1);
      expect(qs.progress.get('q_investigate_corruption_forest')!.objectives[1].current).toBe(1);
      expect(qs.progress.get('q_investigate_corruption_forest')!.status).toBe('active');

      qs.updateProgress('investigate_clue', 'clue_corrupt_3');
      expect(qs.progress.get('q_investigate_corruption_forest')!.status).toBe('completed');
    });

    it('updates craft quest objectives — collect phase', () => {
      const q = AllQuests.find(q => q.id === 'q_craft_dwarf_weapon')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_craft_dwarf_weapon');

      // Collect materials
      for (let i = 0; i < 3; i++) qs.updateProgress('craft_collect', 'mat_dwarf_ingot');
      for (let i = 0; i < 5; i++) qs.updateProgress('craft_collect', 'mat_rune_fragment');

      const prog = qs.progress.get('q_craft_dwarf_weapon')!;
      expect(prog.objectives[0].current).toBe(3); // ingots
      expect(prog.objectives[1].current).toBe(5); // fragments
      expect(prog.status).toBe('active'); // Not yet complete
    });

    it('updates craft quest objectives — craft and deliver phases', () => {
      const q = AllQuests.find(q => q.id === 'q_craft_dwarf_weapon')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_craft_dwarf_weapon');

      // Complete collect phase
      for (let i = 0; i < 3; i++) qs.updateProgress('craft_collect', 'mat_dwarf_ingot');
      for (let i = 0; i < 5; i++) qs.updateProgress('craft_collect', 'mat_rune_fragment');

      // Craft phase
      qs.updateProgress('craft_craft', 'craft_dwarf_hammer');
      const prog1 = qs.progress.get('q_craft_dwarf_weapon')!;
      expect(prog1.objectives[2].current).toBe(1); // craft done

      // Deliver phase
      qs.updateProgress('craft_deliver', 'deliver_dwarf_hammer');
      const prog2 = qs.progress.get('q_craft_dwarf_weapon')!;
      expect(prog2.objectives[3].current).toBe(1); // deliver done
      expect(prog2.status).toBe('completed');
    });

    it('craft phase order enforcement — cannot deliver before crafting', () => {
      const q = AllQuests.find(q => q.id === 'q_craft_dwarf_weapon')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_craft_dwarf_weapon');

      // Try to deliver before collecting/crafting
      qs.updateProgress('craft_deliver', 'deliver_dwarf_hammer');
      const prog = qs.progress.get('q_craft_dwarf_weapon')!;
      expect(prog.objectives[3].current).toBe(0); // Reset by phase enforcement
    });

    it('craft phase order enforcement — cannot craft before collecting', () => {
      const q = AllQuests.find(q => q.id === 'q_craft_dwarf_weapon')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_craft_dwarf_weapon');

      // Try to craft before collecting
      qs.updateProgress('craft_craft', 'craft_dwarf_hammer');
      const prog = qs.progress.get('q_craft_dwarf_weapon')!;
      expect(prog.objectives[2].current).toBe(0); // Reset by phase enforcement
    });
  });

  // ═══════════════════════════════════════
  // QuestSystem — failQuest
  // ═══════════════════════════════════════
  describe('QuestSystem.failQuest()', () => {
    it('sets quest status to failed', () => {
      const q = AllQuests.find(q => q.id === 'q_escort_merchant_plains')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_escort_merchant_plains');
      expect(qs.progress.get('q_escort_merchant_plains')!.status).toBe('active');

      qs.failQuest('q_escort_merchant_plains');
      expect(qs.progress.get('q_escort_merchant_plains')!.status).toBe('failed');
    });

    it('does not fail non-active quests', () => {
      qs.failQuest('q_escort_merchant_plains'); // not accepted
      expect(qs.progress.has('q_escort_merchant_plains')).toBe(false);
    });

    it('does not fail completed quests', () => {
      const q = AllQuests.find(q => q.id === 'q_escort_merchant_plains')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_escort_merchant_plains');
      qs.updateProgress('escort', 'escort_merchant');
      expect(qs.progress.get('q_escort_merchant_plains')!.status).toBe('completed');

      qs.failQuest('q_escort_merchant_plains');
      expect(qs.progress.get('q_escort_merchant_plains')!.status).toBe('completed');
    });
  });

  // ═══════════════════════════════════════
  // QuestSystem — re-acceptance of failed quests
  // ═══════════════════════════════════════
  describe('Re-acceptance of failed quests', () => {
    it('allows re-accepting failed reacceptable escort quest', () => {
      const q = AllQuests.find(q => q.id === 'q_escort_merchant_plains')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_escort_merchant_plains');
      qs.failQuest('q_escort_merchant_plains');
      expect(qs.progress.get('q_escort_merchant_plains')!.status).toBe('failed');

      const result = qs.acceptQuest('q_escort_merchant_plains');
      expect(result).toBe(true);
      expect(qs.progress.get('q_escort_merchant_plains')!.status).toBe('active');
      expect(qs.progress.get('q_escort_merchant_plains')!.objectives[0].current).toBe(0);
    });

    it('allows re-accepting failed reacceptable defend quest', () => {
      const q = AllQuests.find(q => q.id === 'q_defend_camp_forest')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_defend_camp_forest');
      qs.failQuest('q_defend_camp_forest');

      const result = qs.acceptQuest('q_defend_camp_forest');
      expect(result).toBe(true);
      expect(qs.progress.get('q_defend_camp_forest')!.status).toBe('active');
    });

    it('does not allow re-accepting non-reacceptable quests', () => {
      // q_kill_slimes is not reacceptable
      qs.acceptQuest('q_kill_slimes');
      // Manually set to failed to test
      qs.progress.get('q_kill_slimes')!.status = 'failed';

      const result = qs.acceptQuest('q_kill_slimes');
      expect(result).toBe(false); // Not reacceptable
    });

    it('resets progress on re-acceptance', () => {
      const q = AllQuests.find(q => q.id === 'q_defend_camp_forest')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_defend_camp_forest');
      qs.updateProgress('defend_wave', 'defend_forest_camp');
      qs.updateProgress('defend_wave', 'defend_forest_camp');
      expect(qs.progress.get('q_defend_camp_forest')!.objectives[0].current).toBe(2);

      qs.failQuest('q_defend_camp_forest');
      qs.acceptQuest('q_defend_camp_forest');
      expect(qs.progress.get('q_defend_camp_forest')!.objectives[0].current).toBe(0);
    });
  });

  // ═══════════════════════════════════════
  // QuestSystem — getAvailableQuests includes failed reacceptable
  // ═══════════════════════════════════════
  describe('getAvailableQuests with failed quests', () => {
    it('includes failed reacceptable quests in available list', () => {
      const q = AllQuests.find(q => q.id === 'q_escort_merchant_plains')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_escort_merchant_plains');
      qs.failQuest('q_escort_merchant_plains');

      const available = qs.getAvailableQuests(['q_escort_merchant_plains'], 50);
      expect(available.some(a => a.id === 'q_escort_merchant_plains')).toBe(true);
    });

    it('does not include failed non-reacceptable quests', () => {
      qs.acceptQuest('q_kill_slimes');
      qs.progress.get('q_kill_slimes')!.status = 'failed';

      const available = qs.getAvailableQuests(['q_kill_slimes'], 50);
      expect(available.some(a => a.id === 'q_kill_slimes')).toBe(false);
    });
  });

  // ═══════════════════════════════════════
  // QuestSystem — getCraftPhaseLabel
  // ═══════════════════════════════════════
  describe('getCraftPhaseLabel', () => {
    it('returns 采集材料 when collect phase incomplete', () => {
      const q = AllQuests.find(q => q.id === 'q_craft_dwarf_weapon')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_craft_dwarf_weapon');
      const prog = qs.progress.get('q_craft_dwarf_weapon')!;
      expect(qs.getCraftPhaseLabel(q, prog)).toBe('采集材料');
    });

    it('returns 制作物品 when collect done but craft incomplete', () => {
      const q = AllQuests.find(q => q.id === 'q_craft_dwarf_weapon')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_craft_dwarf_weapon');
      for (let i = 0; i < 3; i++) qs.updateProgress('craft_collect', 'mat_dwarf_ingot');
      for (let i = 0; i < 5; i++) qs.updateProgress('craft_collect', 'mat_rune_fragment');
      const prog = qs.progress.get('q_craft_dwarf_weapon')!;
      expect(qs.getCraftPhaseLabel(q, prog)).toBe('制作物品');
    });

    it('returns 交付成品 when craft done but deliver incomplete', () => {
      const q = AllQuests.find(q => q.id === 'q_craft_dwarf_weapon')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_craft_dwarf_weapon');
      for (let i = 0; i < 3; i++) qs.updateProgress('craft_collect', 'mat_dwarf_ingot');
      for (let i = 0; i < 5; i++) qs.updateProgress('craft_collect', 'mat_rune_fragment');
      qs.updateProgress('craft_craft', 'craft_dwarf_hammer');
      const prog = qs.progress.get('q_craft_dwarf_weapon')!;
      expect(qs.getCraftPhaseLabel(q, prog)).toBe('交付成品');
    });

    it('returns empty string for non-craft quests', () => {
      const q = AllQuests.find(q => q.type === 'kill')!;
      expect(qs.getCraftPhaseLabel(q, { questId: q.id, status: 'active', objectives: [{ current: 0 }] })).toBe('');
    });
  });

  // ═══════════════════════════════════════
  // QuestSystem — save/load preserves new quest progress
  // ═══════════════════════════════════════
  describe('Save/load preserves progress', () => {
    it('preserves escort quest progress through save/load', () => {
      const q = AllQuests.find(q => q.id === 'q_escort_merchant_plains')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_escort_merchant_plains');

      // Serialize
      const data = qs.getProgressData();
      
      // Load into new system
      const qs2 = new QuestSystem();
      qs2.registerQuests(AllQuests);
      qs2.loadProgress(data);

      expect(qs2.progress.get('q_escort_merchant_plains')!.status).toBe('active');
      expect(qs2.progress.get('q_escort_merchant_plains')!.objectives[0].current).toBe(0);
    });

    it('preserves defend quest progress through save/load', () => {
      const q = AllQuests.find(q => q.id === 'q_defend_camp_forest')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_defend_camp_forest');
      qs.updateProgress('defend_wave', 'defend_forest_camp');
      qs.updateProgress('defend_wave', 'defend_forest_camp');

      const data = qs.getProgressData();
      const qs2 = new QuestSystem();
      qs2.registerQuests(AllQuests);
      qs2.loadProgress(data);

      expect(qs2.progress.get('q_defend_camp_forest')!.objectives[0].current).toBe(2);
    });

    it('preserves investigate quest progress through save/load', () => {
      const q = AllQuests.find(q => q.id === 'q_investigate_corruption_forest')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_investigate_corruption_forest');
      qs.updateProgress('investigate_clue', 'clue_corrupt_1');
      qs.updateProgress('investigate_clue', 'clue_corrupt_2');

      const data = qs.getProgressData();
      const qs2 = new QuestSystem();
      qs2.registerQuests(AllQuests);
      qs2.loadProgress(data);

      expect(qs2.progress.get('q_investigate_corruption_forest')!.objectives[0].current).toBe(1);
      expect(qs2.progress.get('q_investigate_corruption_forest')!.objectives[1].current).toBe(1);
      expect(qs2.progress.get('q_investigate_corruption_forest')!.objectives[2].current).toBe(0);
    });

    it('preserves craft quest progress through save/load', () => {
      const q = AllQuests.find(q => q.id === 'q_craft_dwarf_weapon')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_craft_dwarf_weapon');
      for (let i = 0; i < 3; i++) qs.updateProgress('craft_collect', 'mat_dwarf_ingot');
      for (let i = 0; i < 5; i++) qs.updateProgress('craft_collect', 'mat_rune_fragment');

      const data = qs.getProgressData();
      const qs2 = new QuestSystem();
      qs2.registerQuests(AllQuests);
      qs2.loadProgress(data);

      expect(qs2.progress.get('q_craft_dwarf_weapon')!.objectives[0].current).toBe(3);
      expect(qs2.progress.get('q_craft_dwarf_weapon')!.objectives[1].current).toBe(5);
    });

    it('preserves failed quest status through save/load', () => {
      const q = AllQuests.find(q => q.id === 'q_escort_merchant_plains')!;
      for (const pre of (q.prereqQuests ?? [])) {
        qs.progress.set(pre, { questId: pre, status: 'turned_in', objectives: [{ current: 1 }] });
      }
      qs.acceptQuest('q_escort_merchant_plains');
      qs.failQuest('q_escort_merchant_plains');

      const data = qs.getProgressData();
      const qs2 = new QuestSystem();
      qs2.registerQuests(AllQuests);
      qs2.loadProgress(data);

      expect(qs2.progress.get('q_escort_merchant_plains')!.status).toBe('failed');
    });
  });

  // ═══════════════════════════════════════
  // QuestDefinition type validation
  // ═══════════════════════════════════════
  describe('QuestDefinition type extended', () => {
    it('supports all 8 quest types', () => {
      const types = new Set(AllQuests.map(q => q.type));
      expect(types.has('kill')).toBe(true);
      expect(types.has('collect')).toBe(true);
      expect(types.has('explore')).toBe(true);
      expect(types.has('talk')).toBe(true);
      expect(types.has('escort')).toBe(true);
      expect(types.has('defend')).toBe(true);
      expect(types.has('investigate')).toBe(true);
      expect(types.has('craft')).toBe(true);
    });

    it('all new quests have questArea defined', () => {
      const newQuests = AllQuests.filter(q => ['escort', 'defend', 'investigate', 'craft'].includes(q.type));
      for (const q of newQuests) {
        expect(q.questArea).toBeDefined();
      }
    });
  });

  // ═══════════════════════════════════════
  // Prereqs chain support
  // ═══════════════════════════════════════
  describe('Prereqs chains work with new types', () => {
    it('escort quest with prereqs cannot be accepted until prereqs are met', () => {
      const result = qs.acceptQuest('q_escort_merchant_plains');
      expect(result).toBe(false); // prereq q_kill_goblins not done
    });

    it('escort quest accepted after prereqs met', () => {
      // Satisfy prereq chain
      qs.progress.set('q_kill_slimes', { questId: 'q_kill_slimes', status: 'turned_in', objectives: [{ current: 10 }] });
      qs.progress.set('q_kill_goblins', { questId: 'q_kill_goblins', status: 'turned_in', objectives: [{ current: 15 }] });

      const result = qs.acceptQuest('q_escort_merchant_plains');
      expect(result).toBe(true);
    });

    it('investigate quest with prereqs works', () => {
      const result = qs.acceptQuest('q_investigate_ruins_mountains');
      expect(result).toBe(false); // prereq q_explore_dwarf_ruins not done

      qs.progress.set('q_explore_dwarf_ruins', { questId: 'q_explore_dwarf_ruins', status: 'turned_in', objectives: [{ current: 1 }] });
      const result2 = qs.acceptQuest('q_investigate_ruins_mountains');
      expect(result2).toBe(true);
    });
  });

  // ═══════════════════════════════════════
  // NPC quest assignments
  // ═══════════════════════════════════════
  describe('NPC quest assignments', () => {
    it('new quests are assigned to NPCs', () => {
      const allNpcQuests: string[] = [];
      for (const npc of Object.values(NPCDefinitions)) {
        if (npc.quests) allNpcQuests.push(...npc.quests);
      }

      const newQuestIds = [
        'q_escort_merchant_plains', 'q_escort_survivor_desert',
        'q_defend_camp_forest', 'q_defend_seal_abyss',
        'q_investigate_ruins_mountains', 'q_investigate_corruption_forest',
        'q_craft_dwarf_weapon', 'q_craft_fire_ward',
      ];

      for (const qid of newQuestIds) {
        expect(allNpcQuests).toContain(qid);
      }
    });
  });
});
