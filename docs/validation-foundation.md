# Foundation Milestone — Validation Contract

---

## 1. Test Infrastructure

### VAL-FOUND-001: Vitest installed and configured
Vitest is listed in `devDependencies` and a `vitest.config.ts` (or inline config in `vite.config.ts`) exists. Running `npx vitest --version` exits 0.
Evidence: `package.json` contains `"vitest"`, config file exists, version command succeeds.

### VAL-FOUND-002: Unit test suite runs successfully
`npm run test` (or `npx vitest run`) exits with code 0 and reports ≥1 passing test.
Evidence: CI-compatible test command output showing green pass status.

### VAL-FOUND-003: Coverage reporting functional
Running `npx vitest run --coverage` produces a coverage report. Coverage output includes at least `CombatSystem.ts`, `PathfindingSystem.ts`, `LootSystem.ts`, `InventorySystem.ts`, and `MapGenerator.ts`.
Evidence: Coverage summary table in terminal or `coverage/` directory created with reports.

### VAL-FOUND-004: Tests import game modules without Phaser errors
Unit tests that import non-Phaser pure logic modules (`CombatSystem`, `PathfindingSystem`, `MapGenerator`, `LootSystem`, `InventorySystem`) run without `ReferenceError: document is not defined` or Phaser canvas errors. Phaser dependencies are properly mocked or isolated.
Evidence: Tests pass in a headless Node environment (no browser required).

### VAL-FOUND-005: TypeScript strict-mode compilation succeeds
`npx tsc --noEmit` exits with code 0. No type errors across the entire `src/` directory.
Evidence: Zero-error tsc output.

### VAL-FOUND-006: Vite production build succeeds
`npm run build` exits with code 0 and produces a `dist/` directory with `index.html` and bundled JS assets.
Evidence: Build command output, `dist/` listing.

---

## 2. Bug Fixes

### VAL-FOUND-010: Stun is applied by War Stomp
When the Warrior uses War Stomp (`war_stomp`, `stunDuration: 2000`), monsters within the AoE radius are stunned for the skill's `stunDuration` value. A stunned monster must: (a) cease movement, (b) cease attacking, (c) remain stunned for the full duration (scaled by skill level), (d) resume normal AI behavior after stun expires.
Evidence: Vitest unit test creates a monster, applies stun via War Stomp, asserts monster state is `'stunned'` (or equivalent) and does not attack/move during stun window. In-browser: use War Stomp near monsters, observe they freeze in place for ~2 seconds.

### VAL-FOUND-011: Stun duration scales with skill level
War Stomp stun duration increases with skill level. At level 1 the base duration is 2000ms. Higher levels should increase duration according to the scaling formula.
Evidence: Unit test verifying stun duration at levels 1, 5, 10, 20 matches expected tiered scaling values.

### VAL-FOUND-012: Buff effects are applied in combat calculations
Buffs with stats `poisonDamage`, `stealthDamage`, `defenseBonus`, and `damageBonus` (from skills like Poison Blade, Vanish, Taunt Roar, Vengeful Wrath) modify combat outcomes. Previously only `damageReduction` was checked. After fix: (a) `poisonDamage` buff adds bonus poison damage to player attacks, (b) `stealthDamage` buff increases next attack damage by its value, (c) `defenseBonus` buff increases effective defense, (d) `damageBonus` buff increases total damage output.
Evidence: Unit test — create CombatEntity with active `damageBonus` buff at value 0.25, calculate damage, assert damage is ~25% higher than without buff. Repeat for each buff type.

### VAL-FOUND-013: Poison Blade buff adds poison damage to attacks
After activating Poison Blade (rogue skill), the player's auto-attacks and physical skills deal additional poison damage for the buff duration. The poison damage amount scales with skill level via `buffValuePerLevel`.
Evidence: Unit test verifying damage output increases by expected poison damage while Poison Blade buff is active.

### VAL-FOUND-014: Vanish buff grants bonus damage on next attack
After activating Vanish, the player's next attack deals +100% damage (at level 1, scaling with level). The buff should be consumed after one attack or expire after its duration.
Evidence: Unit test — activate Vanish, perform attack, verify damage is doubled. Second attack should not receive bonus.

### VAL-FOUND-015: Taunt Roar forces monster aggro onto player
After using Taunt Roar, all monsters within the AoE radius must switch their aggro target to the player and enter `chase` or `attack` state for the buff duration. Monsters should not de-aggro back to `idle` while taunted, even if they exceed their normal aggro range.
Evidence: Unit test — place monster in `idle` state beyond its normal aggro range, activate Taunt Roar within AoE radius, assert monster state changes to `chase`/`attack` targeting the player. In-browser: use Taunt Roar, observe all nearby monsters converge on the player.

### VAL-FOUND-016: Taunt Roar defense bonus applied
Taunt Roar grants a `defenseBonus` buff (30% at level 1). This defense bonus must reduce incoming damage by increasing the player's effective defense in `CombatSystem.calculateDamage()`.
Evidence: Unit test — player with defenseBonus buff takes less damage than without. Numeric assert on damage values.

### VAL-FOUND-017: Vengeful Wrath damage and attack speed bonuses applied
Vengeful Wrath grants +25% damage and +40% attack speed for its duration. (a) Damage output increases by ~25% while active, (b) attack speed interval decreases by ~40%.
Evidence: Unit test verifying both damage increase and attack speed decrease match expected values while buff is active.

### VAL-FOUND-018: Set bonus effects are implemented and functional
Set bonuses with special effects that appear in `EquipStats` must trigger gameplay effects in combat:
- `critDoubleStrike` (Shadow Assassin 4pc): On crit, X% chance to immediately deal an extra attack.
- `doubleShot` (Wilds Hunter 4pc / Windforce): X% chance to fire double projectile on auto-attack.
- `freeCast` (Archmage 4pc): X% chance to not consume mana when casting a skill.
- `dodgeCounter` (Shadowstep legendary): After dodging, next attack is guaranteed crit.
- `deathSave` (Iron Guardian 4pc): Already partially implemented — verify it works.
- `killHealPercent`: Already implemented — verify heal occurs on kill.
- `thornsHeal`: Already implemented — verify heal occurs on hit taken.

Evidence: Unit tests for each effect. For `critDoubleStrike`: mock RNG, verify extra attack triggers. For `freeCast`: mock RNG, verify mana not consumed. For `dodgeCounter`: dodge an attack, verify next attack isCrit=true.

### VAL-FOUND-019: Mana Shield redirects damage to mana pool
Mana Shield (`mana_shield`) should convert a percentage of incoming damage into mana consumption instead of HP loss. Currently it is implemented as generic `damageReduction`, but the skill description says "将30%伤害转为法力消耗". After fix: (a) 30% of incoming damage (scaled by level) is subtracted from mana instead of HP, (b) if mana runs out, remaining damage falls through to HP, (c) visual feedback shows mana drain when shield absorbs damage.
Evidence: Unit test — activate Mana Shield, take 100 damage, verify HP loss is ~70 and mana loss is ~30. If mana < 30, verify HP absorbs the overflow.

### VAL-FOUND-020: Shield Wall damage reduction applies correctly
Shield Wall grants 50% damage reduction (scaling with level). Incoming damage should be halved. Verify the `damageReduction` buff value from this skill is consumed by `CombatSystem.calculateDamage()`.
Evidence: Unit test — player with Shield Wall active takes 50% less damage from an identical attack. Numeric comparison.

### VAL-FOUND-021: Ice Armor damage reduction applies correctly
Ice Armor grants 20% damage reduction. Similar to Shield Wall, verify the buff reduces incoming damage by the expected percentage.
Evidence: Unit test showing ~20% damage reduction while Ice Armor buff is active.

### VAL-FOUND-022: Buff stacking rules are correct
Multiple buffs of the same stat type should stack additively. Example: Shield Wall (50%) + Ice Armor (20%) = 70% total damage reduction (capped at some reasonable max). Verify no double-application or infinite reduction.
Evidence: Unit test with multiple active damageReduction buffs, verify final damage matches expected formula with additive stacking.

### VAL-FOUND-023: Buff expiration removes effects cleanly
When a buff expires (current time - startTime ≥ duration), the buff is removed from the entity's `buffs` array and no longer affects combat calculations on the very next frame.
Evidence: Unit test — add buff, advance time past duration, call `updateBuffs()`, verify buff is gone and combat damage returns to normal.

---

## 3. Status Effects

### VAL-FOUND-030: Burn status effect — application
When a fire-type attack applies Burn, the target gains a Burn status effect with: (a) a defined duration, (b) a tick rate for damage-over-time, (c) a visual indicator (flames/particles or color tint on the entity).
Evidence: Unit test — apply Burn to entity, verify status effect is present in the entity's status effects list. In-browser: fire attack applies visible flame indicator.

### VAL-FOUND-031: Burn status effect — damage ticks
Burn deals fire damage over time at regular intervals (e.g., every 1 second). Each tick deals a fixed amount or percentage of the initial hit's damage. Total burn damage over full duration matches expected formula.
Evidence: Unit test — apply Burn with known damage, simulate ticks, sum total DoT damage, compare to expected.

### VAL-FOUND-032: Burn status effect — duration and expiry
Burn lasts for its defined duration and then stops. No damage ticks occur after expiry. The visual indicator is removed when Burn expires.
Evidence: Unit test — apply Burn, advance past duration, verify no further damage ticks. In-browser: flame effect disappears after timer.

### VAL-FOUND-033: Freeze status effect — application and immobilization
When an ice-type attack applies Freeze, the target is immobilized: (a) cannot move, (b) cannot attack, (c) a visual frost/ice indicator appears on the entity (e.g., blue tint or ice particles).
Evidence: Unit test — apply Freeze to monster, verify monster cannot move or attack during Freeze duration. In-browser: frozen monster visibly stops and shows ice effect.

### VAL-FOUND-034: Freeze status effect — duration and thaw
Freeze lasts for its defined duration and then the target resumes normal behavior. Movement and attack capabilities are fully restored.
Evidence: Unit test — apply Freeze, advance past duration, verify monster resumes AI (chase/attack). In-browser: monster starts moving again after freeze ends.

### VAL-FOUND-035: Freeze status effect — resistance/diminishing returns
Repeated Freeze applications on the same target should have diminishing returns or a cooldown before reapplication to prevent perma-freeze.
Evidence: Unit test — apply Freeze twice in rapid succession, verify second application has reduced duration or is rejected. Or verify a "freeze immunity" window exists after thaw.

### VAL-FOUND-036: Poison status effect — application
Poison is applied by poison-type attacks. The target gains a Poison status effect with: (a) a defined duration, (b) a tick rate, (c) a visual indicator (green tint or dripping particles).
Evidence: Unit test — apply Poison, verify present in entity's status effect list. In-browser: green visual on poisoned entity.

### VAL-FOUND-037: Poison status effect — damage ticks
Poison deals poison damage over time at regular intervals. Damage per tick and total damage over duration match expected values.
Evidence: Unit test — apply Poison with known damage, simulate ticks, sum and compare.

### VAL-FOUND-038: Poison status effect — stacking behavior
Multiple Poison applications should either: (a) refresh duration while keeping the stronger damage value, or (b) stack up to N times with each stack adding its own tick. Whichever policy is chosen, it must be consistent and documented.
Evidence: Unit test — apply Poison twice, verify behavior matches chosen stacking policy. Damage output is correct for stacked vs refreshed case.

### VAL-FOUND-039: Bleed status effect — application
Bleed is applied by physical attacks (with a chance or always for specific skills). Target gains Bleed with: (a) defined duration, (b) tick rate, (c) visual indicator (red splatter or dripping blood particles).
Evidence: Unit test — apply Bleed, verify in status effects. In-browser: red visual indicator.

### VAL-FOUND-040: Bleed status effect — damage ticks
Bleed deals physical damage over time. Bleed damage ignores armor/defense (or has a specified interaction with defense). Each tick and total damage over duration match expected formula.
Evidence: Unit test verifying tick damage and total. Explicit test that defense does not reduce Bleed tick damage (if that's the intended design).

### VAL-FOUND-041: Bleed status effect — movement penalty
While Bleeding, the target may move at reduced speed (design-dependent). If bleed causes slow, verify the movement penalty.
Evidence: Unit test — if Bleed includes a slow component, verify moveSpeed reduction. If not, document that Bleed is pure DoT.

### VAL-FOUND-042: Slow status effect — movement speed reduction
Slow reduces the target's movement speed by a defined percentage for its duration. (a) Monster move speed visibly decreases, (b) the percentage reduction matches the expected value.
Evidence: Unit test — apply Slow to entity, verify `definition.speed` (effective) is reduced by X%. In-browser: slowed monster visibly moves slower.

### VAL-FOUND-043: Slow status effect — duration and expiry
Slow expires after its defined duration. Movement speed returns to normal immediately on expiry.
Evidence: Unit test — apply Slow, advance past duration, verify speed is restored. In-browser: monster speeds back up.

### VAL-FOUND-044: Slow status effect — stacking rules
Multiple Slow effects should not stack to reduce speed below a minimum threshold (e.g., 20% of base speed). Verify cap.
Evidence: Unit test — apply two Slow effects simultaneously, verify speed does not go below minimum.

### VAL-FOUND-045: Stun status effect — application and immobilization
Stun immobilizes the target: (a) cannot move, (b) cannot attack, (c) cannot use skills, (d) visual indicator (stars, dizzy spiral, or flash effect) is visible.
Evidence: Unit test — apply Stun, verify target state is stunned. In-browser: stunned entity shows visual indicator and is immobile.

### VAL-FOUND-046: Stun status effect — duration and recovery
Stun lasts for its defined duration. Upon recovery, the target immediately resumes AI behavior and can attack/move normally. No "stuck in stun" bug.
Evidence: Unit test — apply Stun for 2000ms, at 2001ms verify entity resumes normal state. Verify no leftover state prevents actions.

### VAL-FOUND-047: Stun status effect — diminishing returns
Repeated stuns on the same target should have diminishing returns or a stun immunity window to prevent perma-stun. E.g., second stun within 5 seconds has 50% duration, third is immune.
Evidence: Unit test verifying diminishing returns policy for rapid successive stuns.

### VAL-FOUND-048: Status effect visual indicators are visible
Each active status effect on a monster or player displays a small icon or visual particle near the entity. Multiple simultaneous effects display distinct indicators that don't overlap into unreadable mess.
Evidence: In-browser screenshot — entity with 2+ status effects shows distinguishable visual indicators for each. No indicators clip off-screen or cover the HP bar.

### VAL-FOUND-049: Status effects applied to player by monsters
Monsters can apply status effects to the player (e.g., poison from poison-type monsters, burn from fire monsters). Verify at least one monster type applies a status effect to the player during combat.
Evidence: In-browser — fight a fire monster, observe Burn applied to player. Unit test — monster with fire damageType attacks player, player gains Burn.

### VAL-FOUND-050: Status effect interaction with death
If an entity dies while under a status effect, all status effects are cleared and no further ticks/effects occur on the dead entity. No errors thrown from ticking a dead entity.
Evidence: Unit test — apply Burn to monster, kill monster, advance time, verify no further Burn ticks and no errors.

### VAL-FOUND-051: Status effects persist across pathfinding/movement
A Slowed or Burned entity that is actively moving along a pathfinding path continues to have the effect applied correctly while moving. The effect doesn't get dropped when the entity changes tiles.
Evidence: Unit test — apply Slow to moving monster, verify reduced speed persists across multiple path steps.

---

## 4. Numerical Balance

### VAL-FOUND-060: Level 5 checkpoint — Emerald Plains clearable
A Warrior, Mage, and Rogue at level 5 with starting equipment can engage and kill Emerald Plains monsters (slime_green lv1, goblin lv3) without dying in 3+ consecutive fights. The player should need ~10-15 seconds per goblin and ~5-8 seconds per slime.
Evidence: Unit test simulating combat at level 5 base stats vs goblin: player wins with >20% HP remaining. In-browser: manual play of first zone feels challenging but fair at level 5.

### VAL-FOUND-061: Level 5 checkpoint — experience progression
Killing goblins (~20 exp each) at level 5 should require roughly 15-25 kills to level up once (exp needed = `100 * 1.15^4 ≈ 175`). This provides ~10-15 minutes of gameplay per level.
Evidence: Calculate kills-to-level from monster expReward and `expToNextLevel()` formula. Verify ratio is reasonable.

### VAL-FOUND-062: Level 15 checkpoint — Twilight Forest clearable
At level 15 with magic-quality gear typical for that level, the player can clear Twilight Forest monsters. The player should not be one-shot by any normal monster in this zone.
Evidence: Unit test — player at level 15 with expected stats takes damage from Twilight Forest monsters; no single hit exceeds 50% of player maxHP for non-elite monsters.

### VAL-FOUND-063: Level 15 checkpoint — gold economy
By level 15, the player should have accumulated enough gold to buy upgrades from the merchant. Verify: (a) merchant prices for level-appropriate gear are affordable, (b) monster gold drops in zone 2 (Twilight Forest) are sufficient that ~30 minutes of farming yields enough to buy one piece of gear.
Evidence: Calculation: average gold/kill from zone 2 monsters, kills per minute estimate, merchant item prices for level 15 gear.

### VAL-FOUND-064: Level 25 checkpoint — Anvil Mountains clearable
At level 25 with rare-quality gear, the player survives multi-monster encounters in Anvil Mountains. Elite monsters are tough but killable in ~30-60 seconds.
Evidence: Unit test or manual play confirming player can kill Anvil Mountains monsters without dying in 3+ consecutive encounters. Elite kill time is 30-60s.

### VAL-FOUND-065: Level 25 checkpoint — skill power scaling
Skills at level 10+ should provide meaningful power increases but not trivialize content. Verify: a level 10 Fireball does roughly 2-3x the damage of a level 1 Fireball (due to tiered scaling: levels 1-8 full, 9-16 at 75%).
Evidence: Unit test — `getSkillDamageMultiplier(fireball, 1)` vs `getSkillDamageMultiplier(fireball, 10)`, verify ratio is ~1.8-2.5x.

### VAL-FOUND-066: Level 35 checkpoint — Scorching Desert clearable
At level 35 with a mix of rare and legendary gear, the player can progress through Scorching Desert. Monsters hit hard but are killable. HP potions are needed occasionally.
Evidence: Simulated combat or in-browser play at level 35 with expected gear.

### VAL-FOUND-067: Level 45 checkpoint — Abyss Rift endgame
At level 45 with legendary/set gear, the player can engage Abyss Rift monsters. Demon Lords (elite) are challenging multi-minute fights. Player should not die in <5 seconds against normal mobs.
Evidence: Simulated combat or in-browser play at level 45 with expected gear. Player survives initial engagement.

### VAL-FOUND-068: Monster HP curve is smooth
Monster HP should increase smoothly across zones: Emerald Plains (~30-150), Twilight Forest (~120-600), Anvil Mountains (~400-2000), Scorching Desert (~1000-5000), Abyss Rift (~3000-15000). No sudden 10x jumps between adjacent zones.
Evidence: Data audit of all `MonsterDefinition.hp` values across zones. Plot or table showing smooth progression.

### VAL-FOUND-069: Monster damage curve is smooth
Monster damage should increase proportionally to HP. No zone should have monsters that deal >40% of expected player maxHP in a single hit (for non-elite, non-boss monsters at appropriate level).
Evidence: Data audit of all `MonsterDefinition.damage` values. Compare to expected player HP at each level checkpoint.

### VAL-FOUND-070: Experience curve prevents over-leveling
The `expToNextLevel()` formula (`100 * 1.15^(level-1)`) should ensure players don't massively out-level zone content. At the start of zone N, the player should be within ±2 levels of the zone's `levelRange[0]`.
Evidence: Calculate cumulative exp from clearing each zone's monsters ~1.5x. Verify player level at zone entry matches zone level range.

### VAL-FOUND-071: Gold economy is balanced
Gold drops and merchant prices should form a reasonable economy: (a) at each level checkpoint, the player can afford 1-2 gear pieces from the merchant, (b) gold doesn't accumulate faster than things to spend it on, (c) gold drops scale with zone difficulty.
Evidence: Spreadsheet/calculation of cumulative gold earned vs merchant prices at levels 5, 15, 25, 35, 45.

### VAL-FOUND-072: Item level requirements match zone progression
Items dropped in a zone should have `levelReq` values within the zone's `levelRange`. A level 5 player in Emerald Plains should not receive items requiring level 30+.
Evidence: Code inspection or unit test — generate 100 items for Emerald Plains, verify all `levelReq` ≤ 12 (zone max + small buffer).

### VAL-FOUND-073: Affix tier scaling matches zone difficulty
Affix tiers 1-5 should map to zone difficulty. Zone 1 (Emerald Plains) should primarily drop tier 1-2 affixes, Zone 5 (Abyss Rift) should drop tier 4-5 affixes.
Evidence: Unit test — generate 100 items at zone 1 and zone 5, verify affix tier distribution is appropriate.

### VAL-FOUND-074: Stat growth per level is meaningful
Each level grants +5 free stat points and auto-growth from class `statGrowth`. Verify that stat investment creates meaningful power increases: (a) +1 STR ≈ +0.8 base damage, (b) +1 VIT ≈ +10 HP, (c) +1 INT ≈ +0.5 spell damage modifier.
Evidence: Unit test — recalculate derived stats at level 1 vs level 10, verify improvements match documented formulas.

### VAL-FOUND-075: No negative damage or infinite loops in combat
No combination of stats, buffs, resistances, and defense should result in: (a) negative damage dealt, (b) negative HP, (c) infinite damage amplification loops. Minimum damage is always 1.
Evidence: Unit test — max defense + max resistance entity takes minimum 1 damage. Entity with 0 stats deals minimum 1 damage.

---

## 5. Pathfinding (Binary Heap Upgrade)

### VAL-FOUND-080: Binary heap implementation is correct
The pathfinding open-list uses a binary heap (min-heap) instead of `open.sort()`. Heap operations maintain the min-heap invariant: (a) `insert()` places new node correctly, (b) `extractMin()` always returns the node with lowest `f` value, (c) `decreaseKey()` (if supported) updates node position.
Evidence: Unit test — insert 100 random-f nodes into heap, extract all, verify they come out in ascending f order.

### VAL-FOUND-081: Pathfinding produces identical paths (correctness preserved)
After binary heap upgrade, `PathfindingSystem.findPath()` returns the same optimal paths as before for a set of test cases. Regression test with known grid layouts and expected paths.
Evidence: Unit test — 5+ test maps with known shortest paths, verify output matches for both old and new implementations.

### VAL-FOUND-082: Pathfinding handles edge cases
(a) Start equals end → returns empty path. (b) End is unwalkable → returns empty path. (c) No path exists (walled-off area) → returns empty path (not infinite loop). (d) Diagonal movement blocked by adjacent walls → no wall clipping.
Evidence: Unit tests for each case on a test grid.

### VAL-FOUND-083: Pathfinding diagonal wall-clipping prevention
When moving diagonally, the pathfinder must not allow passage through diagonal gaps between walls. If both adjacent cardinal cells are blocked, diagonal movement is blocked.
Evidence: Unit test — grid with diagonal wall gap, verify path goes around instead of through.

### VAL-FOUND-084: Pathfinding performance on 120x120 map
On a 120x120 grid with realistic obstacle density (~10-15% walls), finding a path from corner (1,1) to corner (118,118) completes in <50ms. Finding 100 random paths completes in <2000ms total.
Evidence: Performance benchmark test — time 100 pathfinding calls on a 120x120 grid, assert total time <2000ms (mean <20ms per call).

### VAL-FOUND-085: Pathfinding performance — no visible lag in gameplay
When clicking to move on a 120x120 map in the browser, the path is computed and movement begins within 1 frame (16ms). No visible stutter or freeze.
Evidence: In-browser test — click a distant point on the largest map, observe immediate smooth movement start. DevTools Performance panel shows no >16ms frame from pathfinding.

### VAL-FOUND-086: Pathfinding works with dynamically blocked tiles
If a tile becomes unwalkable after map generation (e.g., barrel/crate placed in camp), pathfinding correctly routes around it.
Evidence: Unit test — walkable grid, block a tile, verify path avoids it. Matches current behavior where camp barrels/crates mark tiles as `collisions[dr][dc] = false`.

---

## 6. Map Expansion (80×80 → 120×120)

### VAL-FOUND-090: All zone maps are 120×120
Each of the 5 zone maps (`emerald_plains`, `twilight_forest`, `anvil_mountains`, `scorching_desert`, `abyss_rift`) has `cols: 120` and `rows: 120` in their MapData definition.
Evidence: Code inspection — all map files show `cols: 120, rows: 120`. Unit test — `AllMaps[zone].cols === 120 && AllMaps[zone].rows === 120` for all zones.

### VAL-FOUND-091: MapGenerator produces valid 120×120 grids
`MapGenerator.generate()` produces tiles and collisions arrays of exactly 120×120. `tiles.length === 120`, `tiles[0].length === 120`, same for collisions.
Evidence: Unit test — generate each map, verify array dimensions.

### VAL-FOUND-092: Border walls are intact on 120×120 maps
All border tiles (row 0, row 119, col 0, col 119) are `TILE_WALL` (value 4). All border collision values are `false` (unwalkable).
Evidence: Unit test — iterate borders, assert all tiles are wall type and collisions are false.

### VAL-FOUND-093: Player start position is within map bounds
For each zone, `playerStart.col` and `playerStart.row` are within `[1, 118]` (inside border walls). The tile at playerStart is walkable (`collisions[row][col] === true`).
Evidence: Unit test for each zone's playerStart position.

### VAL-FOUND-094: All spawn positions are within map bounds and walkable
For each zone, every spawn point `{ col, row }` is within `[1, 118]` and the surrounding 2-tile radius contains walkable tiles (cleared by MapGenerator).
Evidence: Unit test iterating all spawns in all zones.

### VAL-FOUND-095: All camp positions are within map bounds
For each zone, every camp `{ col, row }` is within map bounds with enough margin for the 11×11 encampment (i.e., `col ∈ [6, 113]`, `row ∈ [6, 113]`). The camp ground tiles are properly placed.
Evidence: Unit test — verify camp centers are within margin, verify 11×11 area around each camp contains TILE_CAMP tiles.

### VAL-FOUND-096: All exit positions are within map bounds and reachable
For each zone, every exit `{ col, row }` is within map bounds. A walkable path exists from playerStart to each exit (verify with PathfindingSystem).
Evidence: Unit test — for each zone, run `pathfinding.findPath(playerStart, exit)`, verify non-empty path returned.

### VAL-FOUND-097: Exit target coordinates are valid in destination maps
Each exit's `targetCol` and `targetRow` are within the bounds of the target map and the target tile is walkable. No exit leads to an out-of-bounds or unwalkable position.
Evidence: Unit test — for each exit in each zone, look up `AllMaps[exit.targetMap]`, verify targetCol/targetRow is within bounds and walkable.

### VAL-FOUND-098: Spawn positions are updated for 120×120 scale
Monster spawn coordinates are distributed across the full 120×120 area, not clustered in the old 80×80 region. Each zone should have spawns in at least 3 of the 4 quadrants of the map.
Evidence: Data audit — verify spawn coordinates utilize the full map area. Unit test — check that at least one spawn has col > 80 or row > 80 per zone (using the expanded space).

### VAL-FOUND-099: Camp positions are updated for 120×120 scale
Camp positions are redistributed for the larger map. At least one camp should be in the first third of the map (near playerStart) and at least one camp should be in the far region (row or col > 80).
Evidence: Data audit of camp coordinates across all zones.

### VAL-FOUND-100: Map renders correctly at 120×120 in browser
The game loads and renders a 120×120 zone without visual artifacts, missing tiles, or performance issues. The camera correctly follows the player across the full map extent.
Evidence: In-browser screenshot — navigate to all 4 corners of the map, verify tiles render. No black gaps or missing geometry.

### VAL-FOUND-101: Viewport culling works for 120×120 maps
The tile rendering viewport culling system correctly shows/hides tiles at 120×120 scale. Moving the camera to map edges does not cause rendering artifacts or missing tiles.
Evidence: In-browser — scroll to map edges, verify tiles appear smoothly. DevTools shows reasonable memory usage (not all 14,400 tiles rendered simultaneously).

### VAL-FOUND-102: Minimap scales to 120×120
The minimap (if present) correctly represents the full 120×120 map area. Player position dot and monster dots are accurately placed relative to the larger map.
Evidence: In-browser screenshot of minimap showing the full map extent with correct proportions.

### VAL-FOUND-103: Fog of war works at 120×120
The fog of war / exploration memory system tracks explored tiles correctly across the full 120×120 grid. No out-of-bounds errors when the player explores the map edges.
Evidence: In-browser — explore the map, verify fog reveals correctly. Save game, reload, verify explored areas are remembered.

### VAL-FOUND-104: Zone transition works between 120×120 maps
Walking to an exit portal and transitioning to another zone (also 120×120) works correctly. The player spawns at the correct target coordinates in the destination map. No crash or visual glitch during transition.
Evidence: In-browser — walk through exit portal in Emerald Plains to Twilight Forest, verify correct spawn location and map renders.

### VAL-FOUND-105: Save/load preserves position on 120×120 maps
Saving the game while at coordinates >80 in any axis and reloading correctly restores the player to that position. No clamping to old 80×80 bounds.
Evidence: In-browser — move to (100, 100), save, reload, verify player is at (100, 100).

### VAL-FOUND-106: Decorations and paths span full 120×120 area
MapGenerator produces decorations and drunk-walk paths that span the entire 120×120 area, not just the inner 80×80. Visual inspection shows the outer regions are not barren or unreachable.
Evidence: In-browser — explore the outer 40 tiles of the map, verify decorations and paths exist. Unit test — generated map has decorations with col > 80 or row > 80.

### VAL-FOUND-107: Water bodies/lakes placed within 120×120 bounds
Water bodies generated by cellular automata fit within the 120×120 grid. No out-of-bounds array access during generation.
Evidence: Unit test — generate all 5 maps at 120×120, verify no array index errors. Verify water tiles exist in the outer region.

### VAL-FOUND-108: NPC positions within camps are correct
NPCs spawn at camp positions. Since camps have been repositioned for 120×120, NPCs must be at the updated camp coordinates. All NPCs are interactable (within 3 tiles of their position).
Evidence: In-browser — walk to each camp in each zone, verify NPCs are visible and interactable.

### VAL-FOUND-109: No performance regression at 120×120
Frame rate in a 120×120 zone remains above 30fps on a mid-range device. The viewport culling system ensures only ~300-500 tiles are rendered at any time, not all 14,400.
Evidence: In-browser DevTools FPS counter. Count of active tile sprites in scene should be proportional to viewport, not map size.

### VAL-FOUND-110: Safe zone radius works at updated camp positions
The campfire recovery radius (5 tiles) and safe zone radius (9 tiles) work correctly at the new camp positions. Monsters within safe zone radius are repelled from aggro. Player near campfire receives HP/MP regen boost.
Evidence: In-browser — stand near campfire at updated position, verify regen message and monster non-aggression. Unit test — verify `euclideanDistance(player, camp) < safeRadius` returns correct results at new coordinates.
