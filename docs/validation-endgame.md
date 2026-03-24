# Endgame Milestone — Validation Contract

---

## Random Dungeon Entry, Floor Generation & Floor Transitions

### VAL-END-001: Random dungeon portal appears in final zone
The Abyss Rift zone (`abyss_rift`) contains a visible, interactable portal or entrance to the random dungeon. The portal must be accessible after the player reaches the zone and must display a Chinese-language tooltip or label (e.g., "无尽深渊" or equivalent). Clicking/walking into the portal transitions the player to a procedurally generated dungeon floor.

**Pass condition:** Portal is visible on the Abyss Rift map, has a hover/interaction indicator, and initiates dungeon entry on interaction.
**Evidence:** Screenshot of portal on Abyss Rift map; screenshot of transition into dungeon floor 1.

---

### VAL-END-002: Dungeon generates 5–10 procedural floors per run
Each dungeon run generates between 5 and 10 floors (inclusive). The floor count must vary between runs (seeded randomness). Floor layout uses the `MapGenerator` procedural system — tiles, walls, and walkable areas differ each run.

**Pass condition:** Enter the dungeon 3 separate times; verify floor count varies and is within [5, 10]; verify tile layouts differ visually between runs.
**Evidence:** Console log or UI display showing floor count per run across 3 runs; screenshots of floor 1 layout from two different runs showing different geometry.

---

### VAL-END-003: Each dungeon floor has a functional exit/stairway
Every dungeon floor (except the final boss floor) has a visible exit that transitions the player to the next floor. The exit must display the target floor number in Chinese (e.g., "下一层: 第3层"). Walking onto the exit triggers the floor transition after a brief load.

**Pass condition:** Navigate through all floors of a dungeon run; each non-final floor has an exit that loads the next floor.
**Evidence:** Screenshot of the exit tile/portal on floor N; screenshot showing floor N+1 loaded after transition.

---

### VAL-END-004: Dungeon floor difficulty scales with depth
Monsters on deeper floors have increased stats (HP, damage, defense) compared to floor 1. Scaling must be perceptible: floor 5 monsters should be noticeably harder than floor 1 monsters (minimum 50% stat increase by floor 5 relative to floor 1).

**Pass condition:** Record monster HP on floor 1 and floor 5 of the same run; floor 5 monster HP is at least 1.5× floor 1 monster HP.
**Evidence:** Combat log or tooltip showing monster stats on floor 1 vs floor 5 within the same dungeon run.

---

### VAL-END-005: Dungeon floors spawn random monsters appropriate to the zone
Each floor spawns monsters randomly selected from a dungeon-specific pool. Monster types vary between floors. Monsters use existing entity/combat systems (AI, aggro, pathfinding, drops).

**Pass condition:** Observe at least 2 different monster types across a full dungeon run; monsters engage in combat normally.
**Evidence:** Screenshots from 2 different floors showing different monster types; combat log showing damage exchange.

---

### VAL-END-006: Player can leave the dungeon and re-enter for a fresh run
Exiting the dungeon (via menu, portal, or death) returns the player to the Abyss Rift zone. Re-entering the dungeon starts a completely new run with a fresh seed and new floor layouts.

**Pass condition:** Complete or abandon a dungeon run, return to Abyss Rift, re-enter dungeon; verify floor layout is different from previous run.
**Evidence:** Screenshot of floor 1 from run A and floor 1 from run B showing different layouts.

---

### VAL-END-007: Dungeon progress is not persisted on save/load
If the player saves while inside a dungeon and reloads, they should be placed back at the dungeon entrance (Abyss Rift zone), not inside the dungeon. Dungeon runs are ephemeral.

**Pass condition:** Enter dungeon, reach floor 3+, save game, reload; player spawns in Abyss Rift, not inside dungeon.
**Evidence:** Save/load cycle with console or UI verification of current map ID after reload.

---

## Random Dungeon Bosses and Loot

### VAL-END-008: Final dungeon floor features a boss encounter
The last floor of each dungeon run spawns a boss monster with elevated stats, a visible name plate in Chinese, and at least one special boss skill (e.g., from `bossSkills`). The boss is significantly stronger than regular floor monsters.

**Pass condition:** Reach the final floor; a boss monster is present with a name plate, has HP > 2× regular floor monsters, and uses at least one special ability during combat.
**Evidence:** Screenshot of boss with name plate; combat log showing boss ability usage; HP comparison with regular monsters.

---

### VAL-END-009: Floor bosses appear every N floors (mid-bosses)
If the dungeon has more than 5 floors, intermediate boss encounters should appear (e.g., every 3rd or 5th floor). These mid-bosses are stronger than regular floor monsters but weaker than the final boss.

**Pass condition:** In a dungeon run with 7+ floors, at least one mid-boss appears before the final floor.
**Evidence:** Combat log or screenshot showing a boss-flagged enemy on a non-final floor.

---

### VAL-END-010: Dungeon bosses drop guaranteed loot
Defeating a dungeon boss (final or mid-boss) drops at least 1 item of magic quality or higher. The final boss guarantees at least 1 rare-or-better item. Drops use the existing `LootSystem` with appropriate level scaling.

**Pass condition:** Kill the final boss; at least 1 rare+ (yellow/orange/green) item drops; kill a mid-boss; at least 1 magic+ (blue+) item drops.
**Evidence:** Screenshot of loot drops after boss kill; item tooltip showing quality tier.

---

### VAL-END-011: Dungeon-exclusive unique loot exists
There are at least 2 legendary or set items that can only drop inside the random dungeon (not in overworld zones). These items reference the dungeon thematically in their names/descriptions.

**Pass condition:** Inspect item data for dungeon-exclusive drops; verify they cannot drop from overworld `LootSystem` calls.
**Evidence:** Code inspection of drop tables showing dungeon-only items; or item tooltip showing a dungeon-themed legendary.

---

## Difficulty Unlock UI

### VAL-END-012: Difficulty selection appears in menu after clearing Normal
After defeating the final boss of Abyss Rift (zone 5) on Normal difficulty, the MenuScene or a post-victory screen shows an option to start Nightmare difficulty. The UI text is in Chinese (e.g., "噩梦难度已解锁").

**Pass condition:** Clear the game on Normal; return to menu or see victory screen; Nightmare difficulty option is visible and selectable.
**Evidence:** Screenshot of menu/UI showing Nightmare unlock after Normal clear.

---

### VAL-END-013: Nightmare clear unlocks Hell difficulty
After clearing the game on Nightmare difficulty, Hell difficulty becomes selectable. The three difficulty tiers are: Normal → Nightmare → Hell.

**Pass condition:** Clear game on Nightmare; Hell difficulty option appears in the difficulty selector.
**Evidence:** Screenshot of difficulty selector showing all three tiers with Hell now available.

---

### VAL-END-014: Difficulty selector shows per-difficulty completion state
The difficulty selection UI displays whether each difficulty has been completed (e.g., checkmark, "已通关" label). The `completedDifficulties` array from `SaveData` drives this display.

**Pass condition:** After clearing Normal, the UI shows Normal as completed; Nightmare as available but not completed; Hell as locked.
**Evidence:** Screenshot of difficulty selector showing distinct states for completed, available, and locked difficulties.

---

### VAL-END-015: Difficulty persists across save/load
Selecting Nightmare or Hell difficulty is saved in `SaveData.difficulty`. Loading a Nightmare save restores the difficulty correctly — monster multipliers and UI indicators reflect the saved difficulty.

**Pass condition:** Start a Nightmare game, save, quit, reload; `difficulty` field is 'nightmare'; in-game difficulty indicators match.
**Evidence:** Save data inspection showing `difficulty: 'nightmare'`; screenshot of in-game difficulty label after reload.

---

## Nightmare/Hell Monster Scaling

### VAL-END-016: Nightmare monsters deal 1.5× damage
On Nightmare difficulty, monster damage to the player is multiplied by 1.5× (as per existing `diffMult` in `ZoneScene.ts:1101`). This is verified by comparing damage taken from the same monster type on Normal vs Nightmare.

**Pass condition:** Same monster type hits player on Normal and Nightmare; Nightmare damage is exactly 1.5× Normal damage (accounting for floor rounding).
**Evidence:** Combat log comparison showing damage values on both difficulties from the same monster type.

---

### VAL-END-017: Hell monsters deal 2× damage
On Hell difficulty, monster damage multiplier is 2× (per `ZoneScene.ts:1101`). Same verification method as VAL-END-016.

**Pass condition:** Same monster type hits player on Normal and Hell; Hell damage is exactly 2× Normal damage.
**Evidence:** Combat log showing damage values on both difficulties.

---

### VAL-END-018: Nightmare/Hell monsters grant increased experience
Monster experience rewards scale with difficulty (2× on Nightmare, 3× on Hell per `ZoneScene.ts:1375`). This incentivizes higher-difficulty play.

**Pass condition:** Kill the same monster type on Normal and Nightmare; Nightmare grants 2× exp. Kill on Hell; grants 3× exp.
**Evidence:** Exp gain values in combat log across difficulties for the same monster.

---

### VAL-END-019: Monster HP and defense scale with difficulty
Nightmare and Hell monsters have increased HP and defense beyond their base values. Either through a multiplier applied at spawn time or through damage-received reduction.

**Pass condition:** Compare monster HP tooltips or combat log entries across difficulties for the same monster type; Nightmare/Hell values are higher.
**Evidence:** Monster stat comparison across difficulties.

---

### VAL-END-020: Difficulty scaling applies inside random dungeons
The random dungeon respects the current difficulty setting. Dungeon monsters on Nightmare/Hell receive the same difficulty multipliers as overworld monsters.

**Pass condition:** Enter the random dungeon on Hell difficulty; verify monster damage multiplier is 2× compared to the same dungeon floor on Normal.
**Evidence:** Combat log comparison of dungeon monster damage on Normal vs Hell.

---

## Gem Socketing UI

### VAL-END-021: Socket UI accessible from inventory panel
When the inventory panel is open (key `I`), equipment items with sockets display visible socket slots. Clicking an equipped item with sockets opens or reveals a socketing interface showing empty socket slots and available gems from inventory.

**Pass condition:** Open inventory; equip an item with `sockets > 0` (e.g., `w_arcane_staff` with 2 sockets); socket slots are visually displayed on the item tooltip or a dedicated socket panel.
**Evidence:** Screenshot of inventory showing socket slots on an equipped item.

---

### VAL-END-022: Gem insertion into socket slot
Dragging or clicking a gem from inventory onto an empty socket slot in the socket UI inserts the gem. The gem disappears from inventory and appears in the socket slot. The item's `sockets` array (`GemInstance[]`) is updated with the gem data.

**Pass condition:** Have a gem (e.g., `g_ruby_1` — 碎裂红宝石) in inventory and an item with an empty socket equipped; insert the gem; gem moves from inventory to socket; item's sockets array contains the gem entry.
**Evidence:** Before/after screenshots of inventory and socket UI; item tooltip showing the socketed gem.

---

### VAL-END-023: Gem removal from socket
The socket UI provides a way to remove a gem from a filled socket (e.g., right-click, "移除宝石" button). Removing a gem returns it to the player's inventory and empties the socket slot.

**Pass condition:** Have an item with a socketed gem; remove the gem; gem returns to inventory; socket slot becomes empty.
**Evidence:** Before/after screenshots showing gem removal; inventory showing the returned gem.

---

### VAL-END-024: Socketed gem stat bonuses apply to player
When a gem is socketed into an equipped item, the gem's stat bonus (defined in `GemInstance.stat` and `GemInstance.value`) is added to the player's effective stats. The existing `LootSystem.getItemStats()` already sums gem stats (line 185-186). The stat change must be reflected in the character panel.

**Pass condition:** Check player STR before socketing `g_ruby_1` (+5 力量); socket the gem; player STR increases by 5.
**Evidence:** Character stat panel screenshots before and after socketing, showing the stat delta.

---

### VAL-END-025: All 4 gem types function correctly
The four gem types — Ruby (力量/STR), Sapphire (智力/INT), Emerald (敏捷/DEX), Topaz (掉宝率/MF) — each apply their correct stat when socketed. Diamond (全属性/all stats) also works if present.

**Pass condition:** Socket each gem type one at a time; verify the correct stat changes in the character panel for each.
**Evidence:** Character stat panel screenshots for each gem type showing the correct stat increase.

---

### VAL-END-026: Gem tiers provide scaling bonuses
Tier 1 gems (碎裂/Chipped) provide lower bonuses than Tier 2 gems (e.g., `g_ruby_1` gives +5 STR, `g_ruby_2` gives +12 STR). Higher-tier gems require higher player levels to use.

**Pass condition:** Compare stat bonuses of tier 1 and tier 2 gems of the same type; tier 2 provides a larger bonus; attempting to socket a tier 2 gem below its `levelReq` fails or is blocked.
**Evidence:** Tooltip comparison of tier 1 vs tier 2 gem stats; level restriction enforcement screenshot.

---

### VAL-END-027: Cannot socket more gems than available slots
An item with N socket slots cannot have more than N gems socketed. Attempting to add a gem when all slots are full shows an error message in Chinese (e.g., "没有空余插槽").

**Pass condition:** Fill all sockets on an item; attempt to add another gem; operation is rejected with a visible error message.
**Evidence:** Screenshot showing full sockets and error message on additional socket attempt.

---

### VAL-END-028: Socketed gems persist through save/load
Gems socketed into equipment are saved as part of the item's `sockets: GemInstance[]` field in `SaveData`. After save/load, the gems remain in their sockets and stat bonuses are still applied.

**Pass condition:** Socket a gem, save, reload; gem is still in socket; stat bonus still applied.
**Evidence:** Save data inspection showing `sockets` array populated; in-game stat panel after reload.

---

## Achievement Panel Accessibility

### VAL-END-029: Achievement panel accessible via dedicated UI button or hotkey
A dedicated achievement panel is accessible from the HUD (e.g., a button or hotkey). The panel is separate from the combat log. All 12 achievements defined in `AchievementSystem.ts` are listed in the panel with Chinese names and descriptions.

**Pass condition:** Open the achievement panel via UI button or hotkey; all 12 achievements are visible with name (e.g., "初出茅庐"), description, and status.
**Evidence:** Screenshot of achievement panel showing all 12 entries.

---

### VAL-END-030: Achievement panel shows locked and unlocked states
Each achievement in the panel displays one of two states: locked (grayed out or with a lock icon) or unlocked (highlighted, with checkmark or color). Unlocked achievements show a different visual treatment than locked ones.

**Pass condition:** Have at least 1 unlocked and 1 locked achievement; panel visually distinguishes them.
**Evidence:** Screenshot of achievement panel with both locked and unlocked achievements visible.

---

### VAL-END-031: Achievement panel displays progress bars
Achievements with numeric thresholds (e.g., "击杀100个怪物" — ach_kill_100) show a progress bar or fraction (e.g., "45/100") indicating current progress from `AchievementSystem.progress`. The bar fills proportionally.

**Pass condition:** Have partial progress on a kill-count achievement; panel shows current/required with visual progress bar.
**Evidence:** Screenshot of achievement panel showing a progress bar at partial fill (e.g., 45/100).

---

### VAL-END-032: Achievement panel shows reward information
Achievements with rewards (stat bonuses or titles, defined via `reward` and `title` fields) display the reward in the panel. Examples: "奖励: +2 伤害" for `ach_kill_100`, "称号: 新手冒险者" for `ach_first_kill`.

**Pass condition:** Panel entries for reward-bearing achievements display the reward text; title-bearing achievements display the title.
**Evidence:** Screenshot of achievement panel with reward text visible on at least 2 achievements.

---

## Achievement Progress Tracking and Reward Claiming

### VAL-END-033: Kill achievements track correctly in real-time
Killing monsters increments the relevant kill achievement counters. Both generic kill count (ach_kill_100, ach_kill_500) and targeted kill counts (ach_kill_slime for `slime_green`) update live. The achievement panel reflects updated counts without needing to reopen.

**Pass condition:** Kill 3 monsters; check achievement panel; generic kill count increased by 3; if killed slime_green, that specific counter also incremented.
**Evidence:** Achievement panel before and after kills showing incremented progress.

---

### VAL-END-034: Level achievements unlock at threshold
Reaching level 10 unlocks `ach_level_10` ("成长之路"). Reaching level 25 unlocks `ach_level_25` ("勇者"). The `checkLevel()` method triggers on level-up events.

**Pass condition:** Level up to exactly 10; `ach_level_10` shows as unlocked in the achievement panel; a notification or combat log entry appears.
**Evidence:** Achievement panel showing `ach_level_10` unlocked; combat log entry "成就解锁: 成长之路!".

---

### VAL-END-035: Exploration achievement tracks zone visits
Visiting each of the 5 zones increments the explore counter. After visiting all 5 zones, `ach_explore_all` ("探索者") unlocks.

**Pass condition:** Visit all 5 zones; `ach_explore_all` shows as unlocked; reward (+5 LCK) is applied to player stats.
**Evidence:** Achievement panel showing ach_explore_all unlocked; player stat panel showing LCK bonus.

---

### VAL-END-036: Quest completion achievement tracks correctly
Completing quests increments the quest achievement counter. After completing 10 quests, `ach_quest_10` ("任务达人") unlocks with its reward (+3 LCK).

**Pass condition:** Complete 10 quests; `ach_quest_10` shows as unlocked; LCK stat increases by 3.
**Evidence:** Achievement panel and stat panel verification.

---

### VAL-END-037: Achievement stat rewards are applied to player
Stat rewards from unlocked achievements (e.g., +2 damage from `ach_kill_100`, +5 STR from `ach_level_50`) are included in the player's effective stats via `AchievementSystem.getBonuses()`. These bonuses stack with equipment and other sources.

**Pass condition:** Unlock `ach_kill_100`; player's damage stat increases by 2; this bonus persists through save/load.
**Evidence:** Player stat panel before and after achievement unlock; save/load cycle verification.

---

### VAL-END-038: Achievement titles are awarded and selectable
Achievements with a `title` field (e.g., "新手冒险者", "屠戮者", "深渊征服者") award the title to the player. Titles are visible somewhere in the UI (character panel, name plate, or dedicated title selector).

**Pass condition:** Unlock a title-bearing achievement; the title appears in the player's available titles or is displayed on their character.
**Evidence:** Screenshot showing awarded title in UI.

---

### VAL-END-039: Achievement unlock notification appears
When an achievement is unlocked, a visible notification appears on screen (toast, popup, or banner) with the achievement name in Chinese and any associated reward. This is separate from the combat log entry.

**Pass condition:** Trigger an achievement unlock; a visual notification is displayed prominently on screen (not just in combat log).
**Evidence:** Screenshot of achievement unlock notification overlay.

---

### VAL-END-040: Achievement progress persists across save/load
Achievement progress (partial and completed) is saved via `AchievementSystem.getUnlockedData()` into `SaveData.achievements`. Loading restores all progress and unlocked states. No progress is lost.

**Pass condition:** Have partial progress (e.g., 45/100 kills) and 2 unlocked achievements; save and reload; progress values and unlocked states are identical.
**Evidence:** Achievement panel before save and after reload showing identical state.

---

### VAL-END-041: Claiming achievement rewards is idempotent
Achievement rewards (stat bonuses) are applied exactly once per achievement. Saving and loading does not re-apply or duplicate achievement bonuses. The `getBonuses()` method only considers currently-unlocked achievements.

**Pass condition:** Unlock an achievement with a stat reward; save; reload; stat bonus is applied once (not doubled).
**Evidence:** Player stat panel after reload matches pre-save values exactly.

---

## Cross-Cutting Endgame Assertions

### VAL-END-042: Dungeon entry requires minimum zone progression
The random dungeon portal should only be accessible to characters who have reached the Abyss Rift zone (zone 5). Characters in earlier zones cannot access the dungeon.

**Pass condition:** A character in zone 1 cannot reach or enter the random dungeon; a character in zone 5 can.
**Evidence:** Verification that dungeon entrance is physically located in Abyss Rift and requires zone progression to reach.

---

### VAL-END-043: All endgame UI text is in Chinese
Every UI element added for the endgame milestone — dungeon floor labels, difficulty selectors, socket UI buttons, achievement panel text, notification toasts — uses Simplified Chinese text. No English-only strings appear in player-facing UI.

**Pass condition:** Inspect all new UI screens and elements; all visible text is in Simplified Chinese.
**Evidence:** Screenshots of dungeon UI, difficulty selector, socket UI, and achievement panel showing Chinese text exclusively.

---

### VAL-END-044: No console errors during endgame flows
Running through the full endgame flow (enter dungeon, complete floors, fight boss, collect loot, socket gems, check achievements, change difficulty) produces no JavaScript errors or unhandled exceptions in the browser console.

**Pass condition:** Complete the full endgame flow with browser console open; zero error-level messages related to game code.
**Evidence:** Browser console screenshot after full endgame flow showing no errors.

---

### VAL-END-045: Build succeeds with all endgame features
Running `npm run build` (Vite production build) completes without TypeScript errors or build failures after all endgame features are implemented.

**Pass condition:** `npm run build` exits with code 0; `dist/` contains the built output.
**Evidence:** Terminal output of successful build command.
