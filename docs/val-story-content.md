# Validation Contract: Story Content Milestone

---

## NPC Dialogue Trees

### VAL-STORY-001: Dialogue choices appear for quest NPCs
When the player interacts with a quest NPC (村长, 侦察兵, 森林隐士, 矮人长老, 沙漠游牧民, 深渊守望者), a dialogue panel opens that displays at least two selectable response options (not just a linear sequence of `dialogue[]` strings). Each choice must be rendered as a distinct clickable button or text element with visible differentiation.
Evidence: Screenshot of dialogue panel showing ≥2 player-choice buttons for at least one quest NPC per zone (5 screenshots total, one per zone).

### VAL-STORY-002: Dialogue branches produce different outcomes
Selecting different dialogue choices for the same NPC leads to different subsequent dialogue text and/or different quest state changes. At minimum one branching NPC per zone must have a choice that (a) unlocks a side quest vs. (b) provides an item/gold reward instead.
Evidence: Two screenshot sequences showing each branch path for the same NPC, with different resulting dialogue text and quest log state (key J).

### VAL-STORY-003: Dialogue tree state persists across save/load
After making dialogue choices that affect story state (e.g., choosing to help vs. refuse an NPC), saving the game via IndexedDB, reloading, and re-interacting with the same NPC must reflect the previously chosen branch (no duplicate choices, correct follow-up dialogue).
Evidence: Save → reload → interact with branching NPC. Screenshot of dialogue showing correct post-choice state.

### VAL-STORY-004: Dialogue choices respect prerequisite quest completion
Dialogue options that are gated behind quest prerequisites (e.g., a lore branch only available after completing the zone main line) must not appear until the prerequisite quest has `status: 'turned_in'` in `QuestProgress`.
Evidence: Interact with the NPC before and after completing the prerequisite quest. Screenshots showing the gated choice absent then present.

### VAL-STORY-005: Dialogue panel supports scrollable/paginated long dialogues
For dialogues that exceed the panel's visible area (e.g., lore-heavy story arcs), the dialogue panel must support scrolling or pagination so all text is accessible. No text is clipped without a scroll/page mechanism.
Evidence: Screenshot of a long dialogue showing scroll bar or page navigation controls.

---

## Zone Mini-Bosses with Pre-Fight Dialogue

### VAL-STORY-010: Each zone has at least one designated mini-boss encounter
Each of the 5 zones contains at least one mini-boss monster (distinct from the zone's final boss in the main quest line). The mini-boss must have `elite: true` in its `MonsterDefinition` and a unique `id` not shared with existing bosses (goblin_chief, werewolf_alpha, mountain_troll, phoenix, demon_lord).
Evidence: `MonsterDefinition` entries for each new mini-boss (5 entries minimum, one per zone). Console log or data dump showing `elite: true`.

### VAL-STORY-011: Pre-fight dialogue triggers before mini-boss combat
When the player enters the mini-boss aggro range or a designated trigger area, a cinematic dialogue panel appears with the mini-boss's taunt/lore text before combat begins. Combat must NOT start until the dialogue is dismissed by the player.
Evidence: Screenshot of pre-fight dialogue panel with mini-boss name and dialogue text, with player and mini-boss visible but no damage numbers on screen.

### VAL-STORY-012: Mini-boss dialogue includes zone lore context
Each mini-boss's pre-fight dialogue references the zone's story arc (e.g., Emerald Plains mini-boss references goblin invasion, Twilight Forest references undead rising). Dialogue must be in Chinese (Simplified) and contain at least 3 lines of contextual narrative.
Evidence: Full text transcript of each mini-boss's pre-fight dialogue (5 transcripts).

### VAL-STORY-013: Mini-boss drops unique or enhanced loot
Each mini-boss has a `lootTable` entry that includes at least one guaranteed drop (dropRate ≥ 0.8) of magic quality or higher that is thematically tied to the zone.
Evidence: `lootTable` data for each mini-boss. Loot drop screenshot after killing the mini-boss.

### VAL-STORY-014: Mini-boss respawn does not re-trigger pre-fight dialogue
If the mini-boss respawns (or the player re-enters the zone), the pre-fight dialogue must not repeat if it has already been seen in the current playthrough. A flag in save data tracks whether each mini-boss dialogue has been viewed.
Evidence: Kill mini-boss → leave zone → re-enter → approach mini-boss spawn. No dialogue panel appears on second encounter.

---

## Lore Collectibles

### VAL-STORY-020: Lore collectible items exist as interactable objects in each zone
Each zone contains at least 3 lore collectible objects placed in the game world (not NPC dialogue). These objects must be visually distinguishable (unique sprite or particle effect) and interactable by clicking or proximity.
Evidence: Screenshot of a lore collectible in each zone showing its distinct visual indicator (5 screenshots, one per zone, each showing ≥1 collectible).

### VAL-STORY-021: Lore collectibles display readable content
Interacting with a lore collectible opens a panel or overlay showing lore text in Chinese (Simplified). Each lore entry must be at least 50 characters and relate to the zone's story/history.
Evidence: Screenshot of the lore reading panel with visible Chinese text for at least one collectible per zone.

### VAL-STORY-022: Collected lore is tracked and viewable from a lore log
A lore log (accessible from UI — via a panel hotkey or sub-tab in the quest log at key J) lists all discovered lore entries. Uncollected entries must not appear (no spoilers). Collected entries must persist across save/load.
Evidence: Screenshot of the lore log panel showing multiple collected entries. Save → reload → open lore log and confirm entries persist.

### VAL-STORY-023: Lore collectible collection count visible per zone
The lore log or a zone summary must display a fraction (e.g., "3/5 收集") showing how many lore items in each zone have been found vs. total available.
Evidence: Screenshot showing per-zone lore collection progress.

### VAL-STORY-024: Lore collectibles placed in exploration-rewarding locations
At least half of the lore collectibles per zone must be located in non-obvious areas (hidden areas, behind environmental obstacles, off the main path) to reward thorough exploration. They should be outside the main quest `questArea` radii.
Evidence: Minimap screenshots showing lore collectible positions relative to main quest markers, confirming placement in non-quest areas.

---

## Random Events

### VAL-STORY-030: Random events trigger during exploration movement
While the player moves through explored or unexplored tiles, random events must trigger with a configurable probability. At least one random event must trigger within 120 seconds of continuous exploration movement in any zone.
Evidence: Screen recording or sequential screenshots showing a random event triggering during exploration. Event bus log showing the event emission.

### VAL-STORY-031: Ambush events spawn hostile enemies
An ambush random event spawns a group of monsters (appropriate to zone level range) around the player with a warning message (e.g., "伏兵出现！"). The ambush monsters must be killable and reward normal exp/gold.
Evidence: Screenshot of ambush warning text + spawned monsters. Combat log showing exp/gold from killing ambush monsters.

### VAL-STORY-032: Treasure cache events provide loot
A treasure cache random event spawns an interactable treasure object. Clicking it opens a loot panel with randomized items (quality scaled to zone level). The treasure must despawn after being looted or after a timeout.
Evidence: Screenshot of treasure cache object in world → screenshot of loot panel after interaction.

### VAL-STORY-033: Wandering merchant events offer limited-time shop
A wandering merchant random event spawns a temporary NPC merchant with a unique inventory (different from fixed camp merchants). The merchant must despawn after a duration or zone change. Shop UI must function identically to fixed merchant shops.
Evidence: Screenshot of wandering merchant NPC in the field → screenshot of their shop panel with unique items.

### VAL-STORY-034: Rescue events create escort-like encounters
A rescue random event spawns a stranded NPC and surrounding hostile monsters. The player must defeat the monsters to "rescue" the NPC. Completing the rescue provides a reward (exp, gold, or item) via a dialogue panel.
Evidence: Screenshot of rescue event (NPC + surrounding monsters) → screenshot of reward dialogue after clearing monsters.

### VAL-STORY-035: Environmental puzzle events require interaction
An environmental puzzle random event presents a tile-based or interaction-based puzzle (e.g., activate objects in sequence, find a hidden switch). Solving it grants a reward; failing or ignoring it has no penalty.
Evidence: Screenshot of puzzle event with interactable elements. Screenshot of reward after solving.

### VAL-STORY-036: Random events do not trigger in camps or safe zones
Random events must not trigger when the player is within a camp's `safeZoneRadius` or on camp tiles (type 5/6). Only exploration tiles (grass, dirt, stone, desert, abyss) are valid trigger locations.
Evidence: Spend 5 minutes idling in a camp — no random event triggers. Step outside camp — event triggers within expected timeframe.

### VAL-STORY-037: Random event frequency is configurable and not excessive
The random event system must have a configurable cooldown (minimum 30 seconds between events). Events must not trigger during active combat (player or nearby monsters in aggro state).
Evidence: Configuration constant or parameter visible in code. Two sequential events logged with ≥30s gap. No event triggers during an active fight.

### VAL-STORY-038: Random events are zone-appropriate
Each random event type must scale its content to the current zone's level range. Ambush monsters must match the zone's `levelRange`. Treasure cache items must use the zone's difficulty tier for affix generation.
Evidence: Trigger ambush in Zone 1 (lv1-10) and Zone 5 (lv40-50). Confirm monster levels match respective zone ranges.

---

## New Quest Types

### VAL-STORY-040: Escort quest type functions end-to-end
An escort quest (`type: 'escort'`) must: (a) spawn or designate an NPC to escort, (b) the NPC follows the player or moves along a path, (c) if the NPC takes lethal damage the quest fails, (d) reaching the destination completes the objective. The quest log (key J) shows escort progress.
Evidence: Accept escort quest → screenshot of NPC following player → screenshot of quest log showing escort objective → complete escort → quest completion message in combat log.

### VAL-STORY-041: Defend quest type functions end-to-end
A defend quest (`type: 'defend'`) must: (a) designate a location or object to defend, (b) spawn waves of enemies that attack the defended target, (c) if the target is destroyed the quest fails, (d) surviving all waves completes the objective. Wave count and progress must be visible in the quest log.
Evidence: Accept defend quest → screenshot of defend target with HP bar → screenshot of wave spawn → wave counter in quest log → completion after final wave.

### VAL-STORY-042: Investigate quest type functions end-to-end
An investigate quest (`type: 'investigate'`) must: (a) mark a search area on the minimap, (b) contain multiple interactable clue objects within the area, (c) collecting all clues completes the investigation. Clue objects must have a visual indicator (glow, icon, particle).
Evidence: Accept investigate quest → minimap shows search area → screenshot of clue object with visual indicator → quest log showing clue progress (e.g., "线索 2/4") → completion.

### VAL-STORY-043: Craft-and-deliver quest type functions end-to-end
A craft-and-deliver quest (`type: 'craft'`) must: (a) require the player to collect specific materials, (b) craft a specific item (via blacksmith NPC or crafting UI), (c) deliver the crafted item to a target NPC. The quest log tracks material collection, crafting completion, and delivery steps separately.
Evidence: Accept craft quest → quest log shows 3-phase objectives (collect/craft/deliver) → collect materials → craft at NPC → deliver to target → quest completed.

### VAL-STORY-044: New quest types appear in the quest log with correct icons/labels
The quest log panel (key J) must display new quest types (escort/defend/investigate/craft) with type-appropriate labels in Chinese (e.g., "护送", "防守", "调查", "制作交付") and distinct visual tags (different color or icon from existing kill/collect/explore/talk types).
Evidence: Screenshot of quest log showing at least one quest of each new type with correct Chinese label and visual distinction.

### VAL-STORY-045: New quest types have prerequisite chain support
New quest types must support `prereqQuests` just like existing types. A craft-and-deliver quest gated behind a kill quest must not be available until the prerequisite is turned in.
Evidence: Show quest unavailable in NPC dialogue before prereq completion → complete prereq → show quest now available.

### VAL-STORY-046: Quest failure handling for escort and defend quests
If an escort NPC dies or a defend target is destroyed, the quest transitions to a `failed` state. The quest log shows the failure. The player can re-accept the quest from the original NPC (quest resets to `available`).
Evidence: Intentionally fail an escort quest → screenshot of quest log showing failed state → re-interact with NPC → quest available again.

---

## Expanded Zone Content

### VAL-STORY-050: Each zone has additional NPCs beyond existing camp NPCs
Each zone contains at least 2 new NPCs (beyond those currently defined in camps) placed either in new camps or as field NPCs. New NPCs must have at minimum `name`, `type`, `dialogue[]`, and appear in the game world with name labels.
Evidence: Screenshot of each zone showing new NPCs with name labels. NPC count per zone ≥ previous count + 2.

### VAL-STORY-051: Hidden areas exist in each zone
Each zone contains at least 1 hidden area that is not visible on the minimap until the player physically discovers it (fog of war reveals it). Hidden areas must contain rewards (loot, lore, or NPC) and be accessible via a non-obvious path (e.g., behind destructible walls, through narrow passages, or requiring backtracking).
Evidence: Minimap screenshot showing undiscovered area → player walks into hidden area → minimap reveals it → screenshot of hidden area content (chest, NPC, or lore object).

### VAL-STORY-052: Sub-dungeons exist in at least 2 zones
At least 2 zones contain a sub-dungeon — a separate enclosed map area accessible via an entrance tile. The sub-dungeon must have: (a) its own monster spawns, (b) a mini-boss or unique encounter, (c) an exit back to the parent zone. Sub-dungeon entry must be a map exit (`exits[]`) in the parent zone's `MapData`.
Evidence: Sub-dungeon entrance visible in parent zone → transition to sub-dungeon map → screenshot of sub-dungeon with monsters → exit back to parent zone.

### VAL-STORY-053: Zone maps expanded to 120×120 tiles
Each zone's `MapData` must have `cols: 120` and `rows: 120` (or larger). The expanded area must contain meaningful content (spawns, NPCs, decorations, lore) — not just empty filler tiles.
Evidence: Check `cols` and `rows` values in each zone's map data file. Walk to the expanded area boundaries and confirm game objects exist there.

### VAL-STORY-054: Environmental storytelling elements present
Each zone contains at least 3 environmental storytelling decorations (e.g., ruins, abandoned campsites, skeletal remains, ancient statues, scarred terrain) placed via the `decorations[]` array in `MapData`. These decorations must be visually rendered and thematically appropriate to the zone.
Evidence: Screenshot of environmental storytelling decorations in each zone with visible themed graphics.

### VAL-STORY-055: New NPCs provide zone-contextual dialogue
All new NPCs added to expanded zones must have dialogue that references the zone's story arc, geography, or lore (not generic placeholder text). Dialogue must be in Chinese (Simplified) and contain at least 2 unique lines.
Evidence: Interact with each new NPC → screenshot of dialogue panel showing zone-specific Chinese text.

---

## Quest Tracking and Completion for New Quest Types

### VAL-STORY-060: QuestSystem.updateProgress handles new objective types
`QuestSystem.updateProgress()` must accept the new objective types (`'escort'`, `'defend'`, `'investigate'`, `'craft'`) in addition to existing types (`'kill'`, `'collect'`, `'explore'`, `'talk'`). Calling `updateProgress('escort', targetId)` must correctly increment the corresponding objective's `current` count.
Evidence: Code inspection of `QuestSystem.updateProgress` signature showing new types. Console log of progress update for each new type.

### VAL-STORY-061: Quest completion events fire for new quest types
When all objectives of a new quest type are met, `GameEvents.QUEST_COMPLETED` must emit with the correct `questId` and `questName`. The combat log must display "任务完成: {name}! 返回NPC交付。" in Chinese.
Evidence: Complete a quest of each new type → screenshot of combat log showing the Chinese completion message.

### VAL-STORY-062: Turn-in rewards apply correctly for new quest types
Turning in a completed new-type quest via NPC interaction must award `exp`, `gold`, and optional `items` as defined in `QuestReward`. The player's stats/inventory must reflect the reward.
Evidence: Player exp/gold before turn-in → turn-in dialogue → player exp/gold after. Delta matches quest reward definition.

### VAL-STORY-063: Active quest tracking on minimap for new quest types
Active quests of new types must display objective markers on the minimap (same as existing explore quest markers). Escort quests must show the destination. Defend quests must show the defend location. Investigate quests must show the search area.
Evidence: Screenshot of minimap with active quest markers for each new quest type.

### VAL-STORY-064: Quest save/load preserves new quest type progress
Saving and loading a game with active new-type quests must preserve their `QuestProgress` (status, objective current counts). An in-progress escort quest at "2/3 waypoints" must load as "2/3 waypoints".
Evidence: Progress a new-type quest partially → save → reload → open quest log (J) → confirm progress values match pre-save state.

### VAL-STORY-065: NPC quest markers update for new quest types
Quest NPCs offering new-type quests must display the "!" (available) or "?" (ready to turn in) marker above their heads, consistent with existing quest marker behavior. Markers must update dynamically as quest state changes.
Evidence: Screenshot of NPC with "!" marker for available new-type quest → accept quest → "!" disappears → complete quest → NPC shows "?" marker.

### VAL-STORY-066: Quest log pagination handles increased quest count
With expanded quest content (42+ existing quests plus new quests), the quest log panel (key J) must correctly paginate all quests without UI overflow or missing entries. Page navigation (prev/next) must function correctly.
Evidence: Have 10+ active quests (mix of old and new types) → open quest log → navigate through all pages → all quests visible and selectable.

---

## Integration and Edge Cases

### VAL-STORY-070: Zone transitions preserve active story state
Transitioning between zones (via exit tiles) while in the middle of a dialogue tree, random event, or new-type quest must not corrupt state. Active quests persist. Any open dialogue closes cleanly on zone transition.
Evidence: Start dialogue in Zone 1 → walk to zone exit → transition to Zone 2 → dialogue panel is closed → quest log shows quests intact.

### VAL-STORY-071: New content does not regress existing 42 quests
All 42 existing quests (kill/collect/explore/talk types) must continue to function correctly after story-content changes. Accept → progress → complete → turn-in flow is unchanged.
Evidence: Run through at least 1 main-line and 1 side quest from each zone. Quest flow completes successfully.

### VAL-STORY-072: Build succeeds with no TypeScript errors
`npm run build` completes with exit code 0. No new TypeScript errors introduced by story-content additions. All new types, interfaces, and data structures pass strict mode type checking.
Evidence: Terminal output of `npm run build` showing success.

### VAL-STORY-073: Dev server runs without console errors
`npm run dev` starts successfully. Loading the game and entering each zone produces no JavaScript console errors related to story-content features (dialogue, random events, new quest types, lore).
Evidence: Browser console screenshot after visiting each zone showing no errors.

### VAL-STORY-074: Performance within acceptable range on expanded maps
With 120×120 tile maps, the game maintains ≥30 FPS during normal exploration. No significant frame drops when random events trigger or when multiple new NPCs are on-screen. Phaser's built-in FPS counter or a performance trace confirms this.
Evidence: FPS counter screenshot during exploration on expanded map. Performance trace showing no major frame drops.

### VAL-STORY-075: New content strings are all in Chinese (Simplified)
All player-facing strings added by the story-content milestone (dialogue text, quest names, quest descriptions, objective names, lore text, random event messages, NPC names, UI labels) must be in Chinese (Simplified). No English placeholder text in the final build.
Evidence: Grep for English-only strings in new data files. All quest names, descriptions, and dialogue pass Chinese character check.
