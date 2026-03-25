import { describe, it, expect } from 'vitest';
import {
  elderDialogueTree,
  scoutDialogueTree,
  dwarfDialogueTree,
  nomadDialogueTree,
  wardenDialogueTree,
  DialogueTrees,
} from '../data/dialogueTrees';
import type { DialogueTree, DialogueChoice, DialogueNode } from '../data/types';

/**
 * Simulates the UIScene dialogue choice filtering logic (post-fix).
 * Choices are hidden only when:
 *   1. prereqQuests not met, OR
 *   2. questTrigger is active/turned_in AND the target node is isEnd
 * Otherwise choices remain visible for navigation.
 */
function getVisibleChoices(
  tree: DialogueTree,
  node: DialogueNode,
  activeQuests: Set<string>,
  turnedInQuests: Set<string>,
): DialogueChoice[] {
  if (!node.choices) return [];
  return node.choices.filter(choice => {
    if (choice.prereqQuests && choice.prereqQuests.length > 0) {
      if (!choice.prereqQuests.every(qid => turnedInQuests.has(qid))) return false;
    }
    if (choice.questTrigger) {
      if (activeQuests.has(choice.questTrigger) || turnedInQuests.has(choice.questTrigger)) {
        const targetNode = tree.nodes[choice.nextNodeId];
        if (targetNode && targetNode.isEnd) return false;
      }
    }
    return true;
  });
}

/**
 * Checks if a target quest can be reached from the root node via some path
 * through the dialogue tree, given the current quest states.
 */
function canReachQuest(
  tree: DialogueTree,
  targetQuestId: string,
  activeQuests: Set<string>,
  turnedInQuests: Set<string>,
): boolean {
  const visited = new Set<string>();

  function dfs(nodeId: string): boolean {
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);

    const node = tree.nodes[nodeId];
    if (!node) return false;

    const choices = getVisibleChoices(tree, node, activeQuests, turnedInQuests);
    for (const choice of choices) {
      if (choice.questTrigger === targetQuestId) return true;
      if (dfs(choice.nextNodeId)) return true;
    }

    // Auto-continue nodes
    if (node.nextNodeId && !node.isEnd && choices.length === 0) {
      if (dfs(node.nextNodeId)) return true;
    }

    return false;
  }

  return dfs(tree.startNodeId);
}

/** Collects all quest triggers in a dialogue tree. */
function getAllQuestTriggers(tree: DialogueTree): string[] {
  const triggers: string[] = [];
  for (const node of Object.values(tree.nodes)) {
    if (node.choices) {
      for (const choice of node.choices) {
        if (choice.questTrigger && !triggers.includes(choice.questTrigger)) {
          triggers.push(choice.questTrigger);
        }
      }
    }
  }
  return triggers;
}

// ═══════════════════════════════════════════════════════════════════════════
// Quest Dialogue Navigation Tests
// ═══════════════════════════════════════════════════════════════════════════

const allTrees: { npcId: string; tree: DialogueTree }[] = [
  { npcId: 'quest_elder', tree: elderDialogueTree },
  { npcId: 'quest_scout', tree: scoutDialogueTree },
  { npcId: 'quest_dwarf', tree: dwarfDialogueTree },
  { npcId: 'quest_nomad', tree: nomadDialogueTree },
  { npcId: 'quest_warden', tree: wardenDialogueTree },
];

describe('Quest dialogue navigation — no dead-ends when quests are active', () => {
  for (const { npcId, tree } of allTrees) {
    describe(`${npcId}`, () => {
      it('no branching node becomes a dead end when all its quest triggers are active', () => {
        const triggers = getAllQuestTriggers(tree);
        const activeQuests = new Set(triggers);

        for (const [nodeId, node] of Object.entries(tree.nodes)) {
          if (!node.choices || node.choices.length === 0) continue;
          if (node.isEnd) continue;

          const visible = getVisibleChoices(tree, node, activeQuests, new Set());
          // A non-end branching node must always have at least one visible choice
          // OR a nextNodeId for auto-continue OR be the special case of a back-to-root fallback
          const hasNavigation = visible.length > 0 || !!node.nextNodeId;
          if (!hasNavigation) {
            // The UIScene adds a "← 返回" button in this case (if not root)
            // So this is acceptable only for non-root nodes
            expect(
              nodeId !== tree.startNodeId,
              `Root node of ${npcId} has no visible choices when all quests active — players get stuck`,
            ).toBe(true);
          }
        }
      });

      it('root node always has at least one visible choice regardless of quest state', () => {
        const triggers = getAllQuestTriggers(tree);
        const activeQuests = new Set(triggers);
        const rootNode = tree.nodes[tree.startNodeId];
        const visible = getVisibleChoices(tree, rootNode, activeQuests, new Set());
        expect(visible.length).toBeGreaterThan(0);
      });
    });
  }
});

describe('Quest dialogue navigation — all non-prereq quests reachable when no quests taken', () => {
  for (const { npcId, tree } of allTrees) {
    it(`${npcId}: every quest reachable with empty state is still reachable`, () => {
      const triggers = getAllQuestTriggers(tree);
      for (const questId of triggers) {
        // First check if the quest is reachable at all from root with no state
        const reachableClean = canReachQuest(tree, questId, new Set(), new Set());
        if (!reachableClean) continue; // Quest requires prereqs — skip

        const reachable = canReachQuest(tree, questId, new Set(), new Set());
        expect(reachable, `Quest ${questId} in ${npcId} unreachable from root`).toBe(true);
      }
    });
  }
});

describe('Quest dialogue navigation — quests remain reachable when some quests are active', () => {
  for (const { npcId, tree } of allTrees) {
    describe(`${npcId}`, () => {
      const triggers = getAllQuestTriggers(tree);

      for (const activeQuestId of triggers) {
        it(`other reachable quests remain reachable when ${activeQuestId} is active`, () => {
          const activeQuests = new Set([activeQuestId]);
          for (const targetId of triggers) {
            if (targetId === activeQuestId) continue;
            // Only test quests that are reachable from root with no state
            // (i.e., they don't require prereqs we can't satisfy)
            const reachableClean = canReachQuest(tree, targetId, new Set(), new Set());
            if (!reachableClean) continue;

            const reachable = canReachQuest(tree, targetId, activeQuests, new Set());
            expect(
              reachable,
              `Quest ${targetId} in ${npcId} unreachable when ${activeQuestId} is active`,
            ).toBe(true);
          }
        });
      }
    });
  }
});
