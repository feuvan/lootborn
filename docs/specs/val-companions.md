# Validation Contract — Companions Milestone

## Mercenary System

### VAL-COMP-001: Mercenary NPC Hire Dialog
When the player interacts with a mercenary NPC (e.g. in camp), a hire panel opens listing available mercenary types (坦克/近战/远程/治疗/法师) with name, type, stats preview, and gold cost. Each type has distinct base stats appropriate to its role. The panel uses Chinese UI text throughout.
Evidence: Screenshot of hire panel showing all 5 mercenary types with stats and cost; snapshot confirms Chinese labels.

### VAL-COMP-002: Hiring a Mercenary Deducts Gold
Clicking the hire button for a mercenary deducts the correct gold amount from `player.gold`. If the player lacks sufficient gold, the hire button is disabled or shows a "金币不足" message and no gold is deducted.
Evidence: Console log or EventBus `LOG_MESSAGE` confirming hire; gold amount before and after; attempt with insufficient gold shows rejection.

### VAL-COMP-003: Only One Active Mercenary at a Time
The player can have at most one active mercenary. Attempting to hire a second mercenary while one is active prompts dismissal of the current one first or blocks the action with a clear message.
Evidence: Hire mercenary A, then attempt to hire mercenary B — verify rejection or swap prompt appears; only one mercenary entity exists in the scene at any time.

### VAL-COMP-004: Dismissing a Mercenary
The player can dismiss the active mercenary via the companion UI panel. Upon dismissal, the mercenary entity is removed from the game world, combat references are cleared, and the player can hire a new mercenary.
Evidence: Open companion panel, click dismiss; mercenary sprite removed from scene; hiring a new mercenary succeeds afterward.

### VAL-COMP-005: Mercenary Follows Player Movement
The active mercenary follows the player across the map, maintaining a 1–2 tile offset. When the player moves via WASD or click-to-pathfind, the mercenary pathfinds to stay near the player. The mercenary stops when the player stops.
Evidence: Move player across multiple tiles; mercenary sprite tracks behind within 2 tiles; mercenary stops when player is stationary.

### VAL-COMP-006: Mercenary Engages in Combat (Tank)
A tank-type mercenary automatically engages nearby hostile monsters, prioritizing aggro and positioning itself between the player and enemies. The tank has higher HP/defense stats and uses melee attacks.
Evidence: Lure monsters near player with tank mercenary; tank moves to intercept and attacks; tank takes hits preferentially; damage numbers appear on both tank and monster.

### VAL-COMP-007: Mercenary Engages in Combat (Melee DPS)
A melee DPS mercenary attacks the player's current target or the nearest enemy with high damage, lower defense. Attacks use melee range and appropriate attack speed.
Evidence: Engage combat with melee DPS mercenary; mercenary deals damage to monsters at melee range; damage output is visibly higher than tank type.

### VAL-COMP-008: Mercenary Engages in Combat (Ranged)
A ranged mercenary attacks enemies from distance (3+ tile range), stays behind the player, and repositions if enemies close in. Projectile or ranged attack visual is shown.
Evidence: Engage combat; ranged mercenary attacks from distance; if enemy approaches, mercenary retreats; ranged attack VFX visible.

### VAL-COMP-009: Mercenary Engages in Combat (Healer)
A healer mercenary periodically heals the player and/or itself when HP drops below a threshold (e.g. 60%). Healing is shown via combat log and visual feedback. The healer prioritizes healing over attacking.
Evidence: Player takes damage in combat with healer mercenary; healer casts heal when player HP < 60%; LOG_MESSAGE shows heal amount; player HP increases.

### VAL-COMP-010: Mercenary Engages in Combat (Mage)
A mage mercenary uses AoE or elemental attacks against groups of enemies, dealing magical damage. Mana consumption and cooldowns apply to mercenary skills.
Evidence: Engage group of monsters with mage mercenary; mage uses AoE spell; multiple enemies take damage; mage mana decreases.

### VAL-COMP-011: Mercenary Has Own Stats and Level
Each mercenary has independent `level`, `exp`, `hp`, `maxHp`, `mana`, `maxMana`, `stats` (STR/DEX/VIT/INT/SPI/LCK), `baseDamage`, `defense`, and `attackSpeed`. These scale with the mercenary's level, not the player's.
Evidence: Inspect mercenary data structure; mercenary levels up independently; stat values differ from player; companion panel shows mercenary stats.

### VAL-COMP-012: Mercenary Gains Experience
The mercenary gains a share of combat experience when the player kills monsters (while the mercenary is alive and in the same zone). Upon accumulating enough exp, the mercenary levels up with stat increases.
Evidence: Kill monsters with mercenary present; mercenary exp increases; mercenary levels up; LOG_MESSAGE shows "佣兵升级" or equivalent; stats increase after level-up.

### VAL-COMP-013: Mercenary Equipment — Weapon Slot
The mercenary has a weapon equipment slot. The player can equip a weapon on the mercenary through the companion panel, which modifies the mercenary's `baseDamage` and relevant combat stats. Only weapons appropriate to the mercenary type can be equipped.
Evidence: Open companion panel; equip weapon on mercenary; mercenary damage stat increases; inappropriate weapon type is rejected.

### VAL-COMP-014: Mercenary Equipment — Armor Slot
The mercenary has an armor equipment slot. Equipping armor modifies the mercenary's `defense` and/or `maxHp`. Only armor items can be placed in this slot.
Evidence: Open companion panel; equip armor on mercenary; mercenary defense/HP stat increases; non-armor items are rejected for this slot.

### VAL-COMP-015: Mercenary Equipment Persists Across Zone Transitions
When the player moves to a different zone via an exit tile, the mercenary's equipped weapon and armor persist and remain applied to its combat stats.
Evidence: Equip items on mercenary; transition zones via exit tile; verify mercenary equipment slots still show items; combat stats remain correct.

### VAL-COMP-016: Mercenary Death in Combat
When the mercenary's HP reaches 0, it dies with a visual death indication (fade, collapse, or death animation). The mercenary stops attacking, is removed from combat targeting, and a LOG_MESSAGE announces "佣兵阵亡" or similar.
Evidence: Let mercenary take lethal damage; death animation plays; mercenary stops acting; combat log shows death message; monsters no longer target the dead mercenary.

### VAL-COMP-017: Mercenary Revival
A dead mercenary can be revived. Revival is available via NPC interaction (e.g. healer NPC in camp) or a revival item, costing gold. After revival, the mercenary respawns near the player with partial HP (e.g. 50%).
Evidence: Mercenary dies; return to camp or use revival method; pay gold; mercenary reappears near player with ~50% HP; mercenary resumes following and combat behavior.

### VAL-COMP-018: Mercenary Persists Across Zone Transitions (Alive)
When transitioning zones, the alive mercenary appears in the new zone near the player start position, retaining current HP/mana and combat state.
Evidence: Travel to new zone with mercenary alive; mercenary spawns near player in new zone; HP/mana values are preserved from previous zone.

---

## Pet System

### VAL-COMP-019: Pet Visual Display in Game World
The active pet renders as a visual sprite near the player in `ZoneScene`. The pet follows the player with a slight offset (2–3 tiles behind/beside), has an idle animation, and does not block pathfinding.
Evidence: Screenshot showing pet sprite following the player; pet has distinct visual appearance; pet does not occupy a collision tile.

### VAL-COMP-020: Active Pet Selection
The player can set the active pet from the homestead panel (key H) or a companion panel. Only one pet is active at a time. Changing the active pet updates the visual sprite in the game world immediately.
Evidence: Open homestead panel (H); select a different pet as active; previous pet visual disappears; new pet visual appears following the player.

### VAL-COMP-021: Pet Acquisition — Boss Drops
Defeating a boss monster has a chance to drop a pet item. The loot table for bosses includes pet drop entries with appropriate `dropRate`. Picking up the pet item triggers `homesteadSystem.addPet()` and shows a LOG_MESSAGE "获得宠物: [name]!".
Evidence: Kill boss; pet item drops with configured probability; pick up item; pet added to homestead pets list; log confirms acquisition.

### VAL-COMP-022: Pet Acquisition — Quest Rewards
Completing a designated quest rewards a pet. The quest reward includes a pet ID; upon turn-in, the pet is added to the player's pet collection via `homesteadSystem.addPet()`.
Evidence: Complete quest with pet reward; turn in to NPC; pet appears in homestead pet list; LOG_MESSAGE confirms "获得宠物: [name]!".

### VAL-COMP-023: Pet Acquisition — Rare Spawns
Rare pet spawns appear in specific zones with low probability. Defeating or interacting with the rare spawn grants the pet. Rare pets have `rarity: 'epic'` and visually distinct spawns.
Evidence: Rare spawn appears in zone (verify spawn data); defeating/interacting grants pet; pet has epic rarity; LOG_MESSAGE confirms acquisition.

### VAL-COMP-024: Pet Acquisition Blocked When Pet House Full
If the player's pet collection equals the max capacity (`1 + pet_house_level`), acquiring a new pet fails with a "宠物小屋已满!" LOG_MESSAGE and the pet is not added.
Evidence: Fill pet slots to capacity; attempt to acquire another pet; rejection message appears; pet list size unchanged.

### VAL-COMP-025: Duplicate Pet Prevention
Attempting to add a pet that the player already owns returns `false` from `addPet()` and does not create a duplicate entry.
Evidence: Own pet_sprite; attempt to add pet_sprite again; method returns false; pets array length unchanged.

### VAL-COMP-026: Pet Feeding Increases Experience
Feeding a pet with its designated `feedItem` (consuming it from inventory) adds experience to the pet. The correct consumable item is removed from inventory upon feeding.
Evidence: Have pet and its feedItem in inventory; feed pet via UI; pet exp increases by 10; feedItem quantity decreases by 1 in inventory.

### VAL-COMP-027: Pet Level Up on Sufficient Experience
When pet exp reaches the threshold (`level * 20`), the pet levels up: `pet.level` increments, excess exp carries over, and a LOG_MESSAGE "小火龙 升级到 Lv.X!" appears. Pet bonus stat increases by `bonusPerLevel`.
Evidence: Feed pet until exp >= level threshold; pet level increments; LOG_MESSAGE confirms level-up; `getTotalBonuses()` returns increased stat value.

### VAL-COMP-028: Pet Max Level Cap
A pet at `maxLevel` (20) cannot gain further levels. Feeding at max level is rejected (`feedPet` returns `false`) or exp is not added.
Evidence: Set pet to level 20; attempt to feed; method returns false; pet level remains 20.

### VAL-COMP-029: Pet Evolution
Pets that reach specific level thresholds (e.g. level 10, level 20) evolve, changing their visual appearance and upgrading their bonus values. Evolution is announced via LOG_MESSAGE.
Evidence: Level pet to evolution threshold; visual sprite changes; bonus values increase; LOG_MESSAGE announces evolution (e.g. "小火龙 进化了!").

### VAL-COMP-030: Pet Passive Buff Applied to Player
The active pet's `bonusStat` and computed bonus value (`bonusValue + bonusPerLevel * level`) are included in `homesteadSystem.getTotalBonuses()` and applied to the player's combat/stat calculations.
Evidence: Activate pet_dragon (damage bonus); call `getTotalBonuses()`; result includes `damage` key with correct value; player's effective damage in CombatSystem reflects the bonus.

### VAL-COMP-031: Pet Passive Buff Removed When Deactivated
Setting `activePet` to `null` or switching to another pet removes the previous pet's bonus from `getTotalBonuses()`.
Evidence: Deactivate pet; `getTotalBonuses()` no longer includes previous pet's bonus stat; player combat stats revert.

### VAL-COMP-032: Pet Minor Combat Participation
The active pet contributes minor combat damage (e.g. 5–10% of player damage) to the player's target at reduced frequency. Pet attacks are shown in the combat log.
Evidence: Engage combat with active pet; pet deals small damage ticks to the target; LOG_MESSAGE shows pet attack; damage is proportional to pet level.

### VAL-COMP-033: Existing 5 Pets Retained
The existing 5 pets (小精灵, 小火龙, 猫头鹰, 暗影猫, 凤凰雏) remain functional with their original stats, rarities, feed items, and bonus types unchanged.
Evidence: Verify PETS array contains all 5 original entries with unchanged `id`, `bonusStat`, `bonusValue`, `bonusPerLevel`, `rarity`, `feedItem`, `maxLevel`.

### VAL-COMP-034: Three New Rare Pets Added
Three new pets with `rarity: 'epic'` or `'rare'` are defined in the PETS data. Each has a unique `id`, `name`, `bonusStat`, and acquisition method (boss drop, quest reward, or rare spawn).
Evidence: PETS array or equivalent data contains 8 total pets; 3 new entries have rare/epic rarity; each has distinct bonusStat; acquisition sources are configured.

---

## Homestead Integration

### VAL-COMP-035: Pet House Affects Pet Capacity
Pet House building level determines max pet slots: `1 + pet_house_level`. At level 0, the player can hold 1 pet. Upgrading Pet House to level 1 allows 2 pets, level 2 allows 3, level 3 allows 4.
Evidence: At pet_house level 0, add 1 pet (succeeds), add 2nd (fails with "宠物小屋已满!"); upgrade pet_house to level 1; add 2nd pet (succeeds).

### VAL-COMP-036: Pet House Affects Pet Leveling Speed
Upgrading the Pet House increases the exp gained per feeding action or reduces the exp threshold for pet level-ups. Higher Pet House levels make pets level faster.
Evidence: Feed pet at Pet House level 0 (gains X exp); upgrade Pet House; feed again (gains X + bonus exp or threshold lowered); pet levels up faster.

### VAL-COMP-037: Training Ground Affects Mercenary Experience
The Training Ground building provides an exp bonus that applies to mercenary experience gain. Each Training Ground level increases the percentage of combat exp the mercenary receives.
Evidence: Kill monster with Training Ground level 0 — mercenary gains X exp; upgrade Training Ground; kill equivalent monster — mercenary gains X × (1 + bonus%) exp.

### VAL-COMP-038: Homestead Panel Shows Companion Buildings
The Homestead panel (key H) displays Pet House and Training Ground buildings with current level, upgrade cost, and effect description referencing companions. UI text is in Chinese.
Evidence: Open Homestead panel (H); Pet House (宠物小屋) and Training Ground (训练场) are visible with level, cost, and description; all text is Chinese.

### VAL-COMP-039: Building Upgrade Affects Companions Immediately
After upgrading Pet House or Training Ground, the companion-related bonuses take effect immediately without requiring a zone transition, save/reload, or restart.
Evidence: Upgrade Training Ground; kill monster in same session — mercenary exp reflects new bonus immediately; upgrade Pet House — pet capacity increases without reload.

---

## Save / Load Integration

### VAL-COMP-040: Mercenary State Saved
The `SaveData` structure includes mercenary state: type, level, exp, hp, mana, stats, equipment (weapon + armor UIDs), alive/dead status. Calling `saveSystem.save()` persists all mercenary fields to IndexedDB.
Evidence: Hire mercenary, equip items, gain exp; trigger save; inspect IndexedDB `saves` table — mercenary object present with correct type, level, equipment, alive status.

### VAL-COMP-041: Mercenary State Loaded
Loading a save restores the mercenary: correct type, level, stats, equipment, HP/mana, and alive/dead status. The mercenary entity is recreated in ZoneScene at the player's position with the loaded state.
Evidence: Save with mercenary; reload page; load save; mercenary appears in game with correct type, level, stats, HP, equipment, and behavior.

### VAL-COMP-042: Pet State Saved
The existing `SaveData.homestead.pets` array and `activePet` field persist pet data (petId, level, exp) and active selection. New pets and evolved states are included.
Evidence: Acquire pets, level them, set active pet; save; inspect IndexedDB — `homestead.pets` contains all owned pets with correct levels and exp; `activePet` matches selection.

### VAL-COMP-043: Pet State Loaded
Loading a save restores all owned pets with correct levels/exp, the active pet selection, and the pet visual sprite in the game world. Pet bonuses from `getTotalBonuses()` are recalculated.
Evidence: Save with leveled pets and active pet; reload; load save; pets list matches saved data; active pet visual appears; passive buffs are applied.

### VAL-COMP-044: Dead Mercenary State Preserved
If the mercenary is dead at save time, loading the save restores the mercenary as dead (not alive). The player must revive the mercenary through the normal revival mechanic.
Evidence: Mercenary dies; save; reload; load save; mercenary is in dead state; no mercenary sprite in world; revival mechanic is required.

### VAL-COMP-045: Save/Load Roundtrip Preserves All Companion Data
A full save/load cycle (save → close → reopen → load) preserves: mercenary type, level, exp, equipment, alive status, all pet instances with levels/exp, active pet, pet house level, training ground level. No data is lost or reset.
Evidence: Set up full companion state (mercenary + equipment + pets + buildings); save; completely reload application; load save; verify every field matches pre-save state via inspection or gameplay confirmation.

### VAL-COMP-046: Autosave Includes Companion State
The autosave mechanism (`saveSystem.autoSave()`) captures companion state identically to manual saves. Loading an autosave restores full companion state.
Evidence: Trigger autosave (zone transition or timed); reload; load autosave; all companion data (mercenary, pets, buildings) is intact.

---

## Edge Cases & Integration

### VAL-COMP-047: Mercenary Follows Through Zone Transitions
When the player uses an exit tile to transition to a new zone, the mercenary transfers to the new zone, appears near the player, and retains its full state (HP, mana, equipment, buffs).
Evidence: Enter zone exit with mercenary; new zone loads; mercenary appears near player start; HP/mana unchanged; equipment intact.

### VAL-COMP-048: Pet Visual Updates on Zone Transition
The active pet visual sprite is recreated in the new zone after a zone transition, following the player correctly.
Evidence: Transition zones with active pet; pet sprite visible in new zone; pet follows player movement.

### VAL-COMP-049: Companions Do Not Block NPC Interaction
The mercenary and pet entities do not obstruct the player's ability to click on or interact with NPCs. Their sprites and hit zones do not overlap NPC interaction areas or, if they do, the NPC interaction takes priority.
Evidence: Position player near NPC with mercenary and pet nearby; click NPC; NPC interaction dialog opens normally; mercenary/pet do not intercept the click.

### VAL-COMP-050: Companion Panel Keyboard Shortcut
A keyboard shortcut opens/closes the companion management panel (mercenary stats/equipment + pet selection). The shortcut is documented in the UI or discoverable via the existing key binding pattern (I/K/M/H/C).
Evidence: Press the companion panel shortcut key; panel opens showing mercenary info and pet list; press again to close.

### VAL-COMP-051: Mercenary Does Not Gain Exp When Dead
A dead mercenary receives no experience from player kills. Exp share only applies while the mercenary is alive.
Evidence: Kill monsters with dead mercenary; mercenary exp remains unchanged; revive mercenary; kill monsters; mercenary exp increases.

### VAL-COMP-052: Pet House Level 0 — Default Pet Slot
With Pet House not built (level 0), the player still has 1 pet slot. This default slot functions correctly for all pet operations (add, feed, activate).
Evidence: Without building Pet House; add 1 pet (succeeds); feed pet (succeeds); activate pet (succeeds); add 2nd pet (fails with capacity message).

### VAL-COMP-053: Mercenary AI Does Not Attack in Safe Zones
In camp/safe zones (tile type 5, `safeZoneRadius`), the mercenary's combat AI is disabled. The mercenary follows the player but does not attack NPCs or any entities.
Evidence: Enter camp with mercenary; mercenary follows player; no attack actions are initiated; mercenary stands idle near player.

### VAL-COMP-054: Multiple Pets Owned But Only One Active
The player can own multiple pets (up to pet capacity) but only one is active at a time. Inactive pets provide no passive buffs and have no visual in the game world.
Evidence: Own 3 pets; activate pet A; verify only pet A's bonus in `getTotalBonuses()`; verify only pet A's sprite visible; pet B and C provide no buffs and no visual.

### VAL-COMP-055: Companion State Cleared on New Game
Starting a new game (new character from MenuScene) initializes companion state to empty: no mercenary, no pets, homestead buildings at level 0.
Evidence: Start new game; verify no mercenary entity exists; homestead pets array is empty; activePet is null; pet_house and training_ground at level 0.
