# Cross-Area Validation Contracts

Assertions that span multiple milestones and verify integration between systems.

---

### VAL-CROSS-001: Save/Load Round-Trip Preserves All New Systems
Save a game with: active status effects on the player, a socketed gem in equipment, a companion (mercenary or pet) with XP progress, a partially-completed achievement, Nightmare difficulty unlocked, random dungeon floor 3 reached, homestead buildings at various levels, and fog-of-war exploration data for 3+ zones. Reload from that save. Every field in `SaveData` must restore to its pre-save value: `player.skillLevels`, `inventory` (including `ItemInstance.sockets` with `GemInstance` entries), `equipment`, `homestead.buildings`, `homestead.pets` (with `level` and `exp`), `homestead.activePet`, `achievements` (partial progress keys and unlocked IDs), `exploration` (boolean grids per zone), `difficulty`, `completedDifficulties`, and `quests` (with objective `current` counts). **Pass**: JSON deep-equal comparison of `SaveData` before save and after load (excluding `timestamp`). **Fail**: any field is missing, zeroed, or structurally different after load.
Evidence: Serialize `SaveData` before `SaveSystem.save()`, call `SaveSystem.load()`, diff the two objects.

---

### VAL-CROSS-002: Zone Transition Preserves Transient Player State
Player has active buffs (e.g. `ice_armor` buff with 8 s remaining), is at 60% HP / 40% MP, has `autoCombat = true`, `autoLootMode = 'rare'`, and 3 free skill points. Walk into a zone exit (e.g. Emerald Plains → Twilight Forest). After `changeZone()` restarts the scene, verify: `player.buffs` array still contains the buff with correct `stat`, `value`, and remaining `duration`; HP/MP values are unchanged; `autoCombat`, `autoLootMode`, `freeSkillPoints`, and `freeStatPoints` are preserved; inventory and equipment are identical. **Pass**: all listed fields match pre-transition snapshot. **Fail**: any value is reset to default or lost.
Evidence: Compare `playerStats` object passed to `scene.restart()` against player state captured one frame before exit.

---

### VAL-CROSS-003: Companion Follows Through Zone Transitions
A mercenary and an active pet are accompanying the player. Trigger a zone transition via exit tile. After the new zone loads: (a) the mercenary entity is spawned at or near the player's start position, (b) the pet entity is spawned and visually attached to the player, (c) both retain their pre-transition HP, level, equipment (mercenary), and XP (pet), (d) the mercenary resumes its AI state (`follow` or `idle`, not `dead`). **Pass**: companions present and functional in the new zone. **Fail**: companion missing, reset to defaults, or stuck at old zone coordinates.
Evidence: After `ZoneScene.create()` completes, query active companion entities and compare stats to pre-transition snapshot; visually confirm sprites render within 3 tiles of the player.

---

### VAL-CROSS-004: New Skills Interact Correctly With Status Effects and Elite Affixes
A Mage uses a fire skill on a monster that has an "Ice Shield" elite affix (grants ice resistance). Separately, a Rogue uses a poison skill on a monster already afflicted with "Burning" status effect. Verify: (a) the fire skill's damage is reduced by the elite's ice resistance via `getResistance()` in `CombatSystem.calculateDamage()`, (b) the poison DoT is applied independently of the existing burn DoT — both tick simultaneously without overwriting each other, (c) if a skill applies a stun (`stunDuration > 0`), it interacts correctly with an elite's "Stun Immune" affix (stun is blocked). **Pass**: damage numbers match formula expectations; multiple DoTs coexist; stun immunity is respected. **Fail**: wrong resistance applied, DoT overwrites, or stun lands on an immune target.
Evidence: Log `DamageResult` values and active debuff arrays per combat tick; compare against manual formula calculations.

---

### VAL-CROSS-005: Gem-Socketed Equipment Flows Through Full Combat Pipeline
Create a Rare sword with 2 sockets. Insert a Fire Ruby (+15 `fireDamage`) and a Sapphire (+10 `iceResist`). Equip it. Verify: (a) `LootSystem.computeStats()` aggregates gem stats into `ItemInstance.stats`, (b) `InventorySystem.getEquipmentStats()` includes the gem bonus in the raw stats, (c) `InventorySystem.getTypedEquipStats()` maps `fireDamage: 15` and `iceResist: 10` into the `EquipStats` struct, (d) `CombatSystem.calculateDamage()` adds 15 to `elementalFlat` when attacking, (e) when the player is attacked by an ice-damage enemy, `getResistance()` returns at least 10 for `'ice'`. **Pass**: damage dealt includes +15 fire flat, damage received reflects +10 ice resist reduction. **Fail**: gem stats missing at any pipeline stage.
Evidence: Breakpoint or log at each pipeline stage: `item.stats`, `getEquipmentStats()`, `getTypedEquipStats()`, `calculateDamage()` inputs/outputs.

---

### VAL-CROSS-006: Mercenary/Pet Uses New Skills and Benefits From Status Effects
A mercenary has a skill that applies a "Slow" debuff. The mercenary uses this skill on a monster. Separately, the player's active pet has a passive that grants +3% `expBonus`. Verify: (a) the mercenary's skill goes through the same `CombatSystem.calculateDamage()` path as the player, (b) the "Slow" debuff appears in the monster's `buffs` array with correct `stat` and `duration`, (c) the pet's `expBonus` is aggregated into the total bonus applied when the player gains XP (via `HomesteadSystem.getTotalBonuses()` or equivalent), (d) if the player has a buff that grants an AoE aura, the mercenary within range also receives it. **Pass**: mercenary combat uses standard formulas; debuffs apply; pet bonus affects XP gain. **Fail**: mercenary uses a different damage path, debuff missing, or pet bonus not applied.
Evidence: Instrument `CombatSystem.calculateDamage()` to log caller identity; check monster `buffs` array; compare XP gained with and without pet active.

---

### VAL-CROSS-007: Achievement Triggers From All New Content Sources
Trigger each of these events and verify the `AchievementSystem.update()` call fires with the correct `type` and `targetId`: (a) kill an elite monster → `update('kill', eliteId)`, (b) clear random dungeon floor 5 → new `update('dungeon_clear', ...)` or equivalent, (c) evolve a pet to max level → `update('pet_evolve', petId)` or equivalent, (d) socket a gem into equipment → `update('socket_gem')` or equivalent, (e) complete a Nightmare difficulty zone → `update('difficulty_clear', 'nightmare')`, (f) complete 10 quests → existing `update('quest')` aggregates to 10. For each, verify the achievement progress counter increments and, if the threshold is met, `ACHIEVEMENT_UNLOCKED` event fires and the reward (stat bonus or title) is applied. **Pass**: all 6 trigger paths produce correct achievement progress. **Fail**: any path does not call `update()` or fires with wrong parameters.
Evidence: Spy on `AchievementSystem.update()` and `EventBus.emit(ACHIEVEMENT_UNLOCKED, ...)` for each trigger.

---

### VAL-CROSS-008: UI Panel Consistency Across All New Systems
Open each UI panel in sequence: Inventory (I), Skills (K), Map (M), Homestead (H), Character (C), Quest (J), Achievement (O), Companion panel (new), Gem Socketing panel (new). Verify: (a) all panels use the same font family, base font size via `fs()` helper, and color scheme (gold headers, dark backgrounds consistent with existing panels), (b) panels do not overlap or z-fight (correct `depth` ordering), (c) opening one panel closes any other open panel (mutual exclusion via `UI_TOGGLE_PANEL` event), (d) all player-facing strings are in Simplified Chinese, (e) keyboard shortcuts work for all panels (existing: I/K/M/H/C/J/O; new panels need assigned keys). **Pass**: visual consistency, no overlap, toggle works, all Chinese text. **Fail**: any panel uses different styling, overlaps, or has English-only text.
Evidence: Screenshots of each panel at 1280×720; automated check for `fs()` usage and Chinese characters in all panel text strings.

---

### VAL-CROSS-009: Full Progression Path — New Character to Endgame
Create a new Warrior on Normal difficulty. Verify the following linear progression is achievable: (a) Zone 1 (Emerald Plains): kill monsters, level to ~10, complete starter quests, acquire first equipment → zone exit to Zone 2 unlocked, (b) Zone 2-4: progressive leveling, quests, gear upgrades with affixes, pet acquisition from homestead, gem drops begin in Zone 3+, (c) Zone 5 (Abyss Rift): defeat final boss (`demon_lord`), achievement `ach_kill_demon_lord` unlocks, Normal difficulty marked complete → Nightmare difficulty available, (d) Nightmare: re-enter Zone 1 with `diffMult = 1.5` applied to monster HP/damage, loot quality improved, (e) Zone 6 (random dungeon): enter procedurally generated dungeon, floor counter persists across deaths/saves, reach floor 5+. **Pass**: each gate is reachable without softlocks; difficulty multiplier applies; dungeon floor progress saves. **Fail**: any gate is unreachable, multiplier not applied, or dungeon progress lost.
Evidence: Playthrough log with level, zone, and milestone timestamps; verify `difficulty` field transitions in `SaveData`.

---

### VAL-CROSS-010: Homestead Building Effects Propagate to All Dependent Systems
Upgrade each homestead building and verify its bonus reaches the correct system: (a) `herb_garden` Lv.3 → `potionDiscount: 15` applied when buying potions from NPC shop (price = base × (1 − 0.15)), (b) `training_ground` Lv.2 → `expBonus: 2` added to total EXP multiplier in `Player.addExp()`, (c) `gem_workshop` Lv.3 → `gemBonus: 6` affects gem combining success rate or output tier, (d) `pet_house` Lv.2 → `petSlots: 2` allows a second pet to be owned (not just one), (e) `warehouse` Lv.3 → `stashSlots: 30` increases `MAX_STASH` from 80 to 110, (f) `altar` Lv.1 → `altarBonus: 3` grants a temporary stat buff. Bonuses must also be included in `autoSave()` data and restored on load. **Pass**: each building's bonus is measurably reflected in its target system. **Fail**: bonus computed by `HomesteadSystem.getTotalBonuses()` but not consumed by the downstream system.
Evidence: Unit-test style checks: upgrade building, read downstream value, assert expected change.

---

### VAL-CROSS-011: Difficulty Scaling Affects All Combat-Adjacent Systems
Switch to Nightmare difficulty (`diffMult = 1.5`). Verify: (a) monster HP and damage scale by 1.5× in `spawnMonsters()` / combat resolution, (b) loot quality roll thresholds improve (higher chance of rare+), (c) EXP rewards scale appropriately, (d) elite monster affix pools expand or strengthen, (e) quest reward scaling adjusts (if applicable), (f) gem drop rates improve. Switch to Hell (`diffMult = 2` for monster damage per `ZoneScene:1375`). Verify all above scale to the Hell tier. **Pass**: numerical verification at each checkpoint. **Fail**: any system ignores the difficulty multiplier.
Evidence: Log combat numbers, loot rolls, and EXP gains at each difficulty; compare ratios.

---

### VAL-CROSS-012: Death and Respawn Preserves All System State
Player dies with: active quest progress (kill 7/10 goblins), socketed equipment, companion active, achievement progress at 95/100 kills, homestead buildings upgraded, 500 gold. After death and respawn at campfire: (a) quest progress remains 7/10 (not reset), (b) equipment and gems intact, (c) companion respawns with player, (d) achievement progress still 95/100, (e) gold reduced by death penalty amount (if implemented) but never below 0, (f) `_deathSaveUsed` flag resets for next life if `deathSave` equip effect was consumed. **Pass**: all state preserved except intentional death penalties. **Fail**: any system state silently resets on death.
Evidence: Snapshot all system states before death, compare after respawn; verify `restoreFromSave` is NOT called (death is not a full reload).

---

### VAL-CROSS-013: Set Bonus + Gem + Buff Stack Correctly in Damage Formula
Equip 3 pieces of a set that grants `+20% critDamage` at 3-piece bonus. Socket a gem that gives `+5 critRate`. Activate a skill buff that gives `+10% damageReduction`. Attack a monster. Verify: (a) `InventorySystem.getSetBonusStats()` returns `critDamage: 20`, (b) `getTypedEquipStats()` includes both set bonus (`critDamage: 20`) and gem bonus (`critRate: 5`), (c) `CombatSystem.calculateDamage()` uses `critRate = base + 5` for crit roll and `critMultiplier = 1.5 + lck*0.01 + 20/100` on crit, (d) when the monster attacks back, `damageReduction` from the buff reduces incoming damage by 10%. **Pass**: final damage numbers match hand-calculated expected values for both offense and defense. **Fail**: any bonus source is double-counted, missing, or applied at the wrong stage.
Evidence: Capture `EquipStats`, buff array, and `DamageResult` for one attack cycle; verify against formula.

---

### VAL-CROSS-014: EventBus Event Ordering Across Systems During Monster Kill
Player kills an elite monster. Verify the following events fire in order and each listener processes correctly: (1) `COMBAT_DAMAGE` with `damage > 0` → floating damage text, (2) `MONSTER_DIED` → triggers loot drop, EXP gain, quest progress, achievement update, (3) `ITEM_PICKED` (if auto-loot) → inventory updated, achievement `collect` check, (4) `PLAYER_EXP_CHANGED` → UI XP bar updates, (5) `PLAYER_LEVEL_UP` (if threshold crossed) → achievement `checkLevel()`, free points granted, (6) `ACHIEVEMENT_UNLOCKED` (if threshold met) → UI notification, stat bonus applied, (7) `LOG_MESSAGE` for each significant event → combat log panel updated. No event should be swallowed, duplicated, or arrive out of causal order. **Pass**: event trace log shows correct sequence with no gaps or duplicates. **Fail**: any event missing, duplicated, or out of order.
Evidence: Instrument `EventBus.emit()` with a timestamped trace logger; replay the kill sequence and dump the trace.

---

### VAL-CROSS-015: Random Dungeon Progress Persists Across Save/Load and Zone Re-entry
Enter Zone 6 (random dungeon). Reach floor 3. Auto-save triggers. Return to menu. Load the save. Re-enter Zone 6. Verify: (a) dungeon floor counter is 3 (not reset to 1), (b) the procedural seed for floors 1-3 is deterministic (same layout if seed preserved) OR floors are re-generated but floor counter is correct, (c) monster scaling matches floor 3 difficulty, (d) any dungeon-specific loot or keys collected on floors 1-2 are in inventory, (e) dungeon leaderboard/progress tracker (if implemented) reflects floor 3. Separately, die on floor 4 and verify death penalty: floor counter resets to floor 1 OR penalty is applied per design (e.g. lose 1 floor). **Pass**: floor progress round-trips through save/load; death penalty matches design doc. **Fail**: floor counter lost or dungeon state inconsistent after load.
Evidence: Check `SaveData` for dungeon-related fields before and after save/load; verify floor counter in UI.
