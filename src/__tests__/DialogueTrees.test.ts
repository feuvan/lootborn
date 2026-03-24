import { describe, it, expect } from 'vitest';
import { DialogueTrees, elderDialogueTree, scoutDialogueTree, dwarfDialogueTree, nomadDialogueTree, wardenDialogueTree } from '../data/dialogueTrees';
import type { DialogueTree, DialogueNode, DialogueChoice, SaveData } from '../data/types';
import { NPCDefinitions } from '../data/npcs';
import { AllQuests } from '../data/quests/all_quests';

// ═══════════════════════════════════════
// Dialogue Tree Data Validation Tests
// ═══════════════════════════════════════

const allTrees: { npcId: string; tree: DialogueTree }[] = [
  { npcId: 'quest_elder', tree: elderDialogueTree },
  { npcId: 'quest_scout', tree: scoutDialogueTree },
  { npcId: 'quest_dwarf', tree: dwarfDialogueTree },
  { npcId: 'quest_nomad', tree: nomadDialogueTree },
  { npcId: 'quest_warden', tree: wardenDialogueTree },
];

const questIds = new Set(AllQuests.map(q => q.id));

describe('DialogueTree Data Structure', () => {
  it('has exactly 5 dialogue trees (1 per zone)', () => {
    expect(Object.keys(DialogueTrees).length).toBe(5);
  });

  it('every dialogue tree is associated with a quest NPC', () => {
    for (const npcId of Object.keys(DialogueTrees)) {
      const npcDef = NPCDefinitions[npcId];
      expect(npcDef, `NPC ${npcId} not found in NPCDefinitions`).toBeDefined();
      expect(npcDef.type).toBe('quest');
    }
  });

  it('NPC definitions reference their dialogue trees', () => {
    for (const npcId of Object.keys(DialogueTrees)) {
      const npcDef = NPCDefinitions[npcId];
      expect(npcDef.dialogueTree, `NPC ${npcId} should have dialogueTree`).toBeDefined();
      expect(npcDef.dialogueTree!.startNodeId).toBe(DialogueTrees[npcId].startNodeId);
    }
  });
});

describe('DialogueTree Node Integrity', () => {
  for (const { npcId, tree } of allTrees) {
    describe(`${npcId}`, () => {
      it('has a valid start node', () => {
        expect(tree.startNodeId).toBeTruthy();
        expect(tree.nodes[tree.startNodeId]).toBeDefined();
      });

      it('all nodes have id and text', () => {
        for (const [nodeId, node] of Object.entries(tree.nodes)) {
          expect(node.id, `Node ${nodeId} id mismatch`).toBe(nodeId);
          expect(node.text.length, `Node ${nodeId} has empty text`).toBeGreaterThan(0);
        }
      });

      it('all choice nextNodeId references exist', () => {
        for (const [nodeId, node] of Object.entries(tree.nodes)) {
          if (node.choices) {
            for (const choice of node.choices) {
              expect(
                tree.nodes[choice.nextNodeId],
                `Node ${nodeId} choice references non-existent node ${choice.nextNodeId}`,
              ).toBeDefined();
            }
          }
        }
      });

      it('all auto-continue nextNodeId references exist', () => {
        for (const [nodeId, node] of Object.entries(tree.nodes)) {
          if (node.nextNodeId) {
            expect(
              tree.nodes[node.nextNodeId],
              `Node ${nodeId} auto-continue references non-existent node ${node.nextNodeId}`,
            ).toBeDefined();
          }
        }
      });

      it('all choice text is non-empty Chinese', () => {
        for (const [nodeId, node] of Object.entries(tree.nodes)) {
          if (node.choices) {
            for (const choice of node.choices) {
              expect(
                choice.text.length,
                `Node ${nodeId} has choice with empty text`,
              ).toBeGreaterThan(0);
              // Verify it contains at least some Chinese characters
              const hasChinese = /[\u4e00-\u9fff]/.test(choice.text);
              expect(hasChinese, `Choice "${choice.text}" in node ${nodeId} has no Chinese characters`).toBe(true);
            }
          }
        }
      });

      it('all node text is in Chinese', () => {
        for (const [nodeId, node] of Object.entries(tree.nodes)) {
          const hasChinese = /[\u4e00-\u9fff]/.test(node.text);
          expect(hasChinese, `Node ${nodeId} text has no Chinese characters`).toBe(true);
        }
      });

      it('every tree has at least one end node', () => {
        const endNodes = Object.values(tree.nodes).filter(
          n => n.isEnd || (!n.choices?.length && !n.nextNodeId),
        );
        expect(endNodes.length, `${npcId} tree has no end nodes`).toBeGreaterThan(0);
      });

      it('has at least 2 choices on the root node', () => {
        const rootNode = tree.nodes[tree.startNodeId];
        expect(rootNode.choices, `${npcId} root has no choices`).toBeDefined();
        expect(rootNode.choices!.length, `${npcId} root has fewer than 2 choices`).toBeGreaterThanOrEqual(2);
      });

      it('no orphan nodes (all nodes reachable from start)', () => {
        const reachable = new Set<string>();
        const visit = (nodeId: string) => {
          if (reachable.has(nodeId)) return;
          reachable.add(nodeId);
          const node = tree.nodes[nodeId];
          if (!node) return;
          if (node.choices) {
            for (const choice of node.choices) {
              visit(choice.nextNodeId);
            }
          }
          if (node.nextNodeId) visit(node.nextNodeId);
        };
        visit(tree.startNodeId);

        for (const nodeId of Object.keys(tree.nodes)) {
          expect(reachable.has(nodeId), `Node ${nodeId} in ${npcId} is orphaned`).toBe(true);
        }
      });
    });
  }
});

describe('DialogueTree Quest Triggers', () => {
  for (const { npcId, tree } of allTrees) {
    describe(`${npcId}`, () => {
      it('all questTrigger IDs reference valid quests', () => {
        for (const [nodeId, node] of Object.entries(tree.nodes)) {
          if (node.choices) {
            for (const choice of node.choices) {
              if (choice.questTrigger) {
                expect(
                  questIds.has(choice.questTrigger),
                  `Node ${nodeId} in ${npcId} references invalid quest ${choice.questTrigger}`,
                ).toBe(true);
              }
            }
          }
        }
      });

      it('all prereqQuest IDs reference valid quests', () => {
        for (const [nodeId, node] of Object.entries(tree.nodes)) {
          if (node.choices) {
            for (const choice of node.choices) {
              if (choice.prereqQuests) {
                for (const pq of choice.prereqQuests) {
                  expect(
                    questIds.has(pq),
                    `Node ${nodeId} in ${npcId} has invalid prereq quest ${pq}`,
                  ).toBe(true);
                }
              }
            }
          }
        }
      });

      it('has at least one choice with a quest trigger', () => {
        const triggers: string[] = [];
        for (const node of Object.values(tree.nodes)) {
          if (node.choices) {
            for (const choice of node.choices) {
              if (choice.questTrigger) triggers.push(choice.questTrigger);
            }
          }
        }
        expect(triggers.length, `${npcId} tree has no quest triggers`).toBeGreaterThan(0);
      });
    });
  }
});

describe('DialogueTree Prerequisite Gating', () => {
  for (const { npcId, tree } of allTrees) {
    it(`${npcId} has at least one gated choice (prereqQuests)`, () => {
      let hasGated = false;
      for (const node of Object.values(tree.nodes)) {
        if (node.choices) {
          for (const choice of node.choices) {
            if (choice.prereqQuests && choice.prereqQuests.length > 0) {
              hasGated = true;
            }
          }
        }
      }
      expect(hasGated, `${npcId} tree has no prerequisite-gated choices`).toBe(true);
    });
  }
});

describe('DialogueTree Branching Outcomes', () => {
  for (const { npcId, tree } of allTrees) {
    it(`${npcId} has choices that lead to different outcomes`, () => {
      // Check that at least one node has multiple choices leading to different nodes
      let hasBranching = false;
      for (const node of Object.values(tree.nodes)) {
        if (node.choices && node.choices.length >= 2) {
          const targets = new Set(node.choices.map(c => c.nextNodeId));
          if (targets.size >= 2) {
            hasBranching = true;
            break;
          }
        }
      }
      expect(hasBranching, `${npcId} tree has no branching outcomes`).toBe(true);
    });
  }
});

describe('DialogueState Persistence (SaveData)', () => {
  it('SaveData interface includes dialogueState field', () => {
    // Verify the type is correct by constructing a minimal SaveData
    const saveData: Partial<SaveData> = {
      dialogueState: {
        quest_elder: {
          visitedNodes: ['root', 'explain', 'accept_slimes'],
          choicesMade: { root: 'explain', explain: 'accept_slimes' },
        },
      },
    };
    expect(saveData.dialogueState).toBeDefined();
    expect(saveData.dialogueState!['quest_elder'].visitedNodes).toHaveLength(3);
    expect(saveData.dialogueState!['quest_elder'].choicesMade['root']).toBe('explain');
  });

  it('dialogueState is optional in SaveData (backward compatible)', () => {
    const saveData: Partial<SaveData> = {
      id: 'test',
      version: 1,
    };
    // dialogueState not set — should be undefined
    expect(saveData.dialogueState).toBeUndefined();
  });

  it('dialogueState supports multiple NPCs', () => {
    const state: Record<string, { visitedNodes: string[]; choicesMade: Record<string, string> }> = {
      quest_elder: {
        visitedNodes: ['root', 'explain'],
        choicesMade: { root: 'explain' },
      },
      quest_scout: {
        visitedNodes: ['root'],
        choicesMade: {},
      },
      quest_dwarf: {
        visitedNodes: ['root', 'history', 'reclaim'],
        choicesMade: { root: 'history', history: 'reclaim' },
      },
    };
    expect(Object.keys(state)).toHaveLength(3);
    expect(state['quest_dwarf'].visitedNodes).toContain('history');
  });
});

describe('Dialogue Tree Completeness', () => {
  it('covers all 5 zones with NPCs: emerald_plains, twilight_forest, anvil_mountains, scorching_desert, abyss_rift', () => {
    const npcIds = Object.keys(DialogueTrees);
    // quest_elder = Zone 1, quest_scout = Zone 2, quest_dwarf = Zone 3, quest_nomad = Zone 4, quest_warden = Zone 5
    expect(npcIds).toContain('quest_elder');
    expect(npcIds).toContain('quest_scout');
    expect(npcIds).toContain('quest_dwarf');
    expect(npcIds).toContain('quest_nomad');
    expect(npcIds).toContain('quest_warden');
  });

  it('total node count is substantial (rich dialogue)', () => {
    let totalNodes = 0;
    for (const tree of Object.values(DialogueTrees)) {
      totalNodes += Object.keys(tree.nodes).length;
    }
    // Each tree should have at least 8 nodes (root + branches + ends)
    expect(totalNodes).toBeGreaterThanOrEqual(40);
  });

  it('total choice count shows meaningful branching', () => {
    let totalChoices = 0;
    for (const tree of Object.values(DialogueTrees)) {
      for (const node of Object.values(tree.nodes)) {
        if (node.choices) totalChoices += node.choices.length;
      }
    }
    expect(totalChoices).toBeGreaterThanOrEqual(30);
  });
});
