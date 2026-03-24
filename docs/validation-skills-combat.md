# Validation Contract: Skills-Combat Milestone

## 1. New Skill Existence & Learnability

### VAL-SKILL-001: Warrior — Charge skill exists in skill tree
Warrior class definition (`src/data/classes/warrior.ts`) contains a skill with `id: 'charge'` and Chinese `name` field. Skill appears in the skill tree panel (K) under the appropriate tree column. Clicking the "+" button with available skill points increments the skill level from 0→1. The skill becomes assignable to skill bar slots 1-6.
Evidence: Open skill tree (K) as Warrior → locate "Charge" card → verify level can be incremented → verify skill appears on skill bar when assigned.

### VAL-SKILL-002: Warrior — Lethal Strike skill exists in skill tree
Warrior class definition contains a skill with `id: 'lethal_strike'` (or equivalent). Skill has `damageMultiplier > 0`, `manaCost > 0`, `cooldown > 0`, `damageType`, and is placed in a valid `tree` and `tier`. Appears in skill tree UI.
Evidence: Open skill tree (K) as Warrior → locate Lethal Strike (致命打击 or similar Chinese name) → verify tooltip shows damage, mana cost, cooldown, range.

### VAL-SKILL-003: Warrior — Iron Fortress skill exists in skill tree
Warrior class definition contains a skill with `id: 'iron_fortress'` (or equivalent). Skill should be a defensive buff (`buff` property defined with a defensive stat like `damageReduction` or `defenseBonus`). Appears in skill tree UI under the Guardian (守护者) tree.
Evidence: Open skill tree (K) as Warrior → locate Iron Fortress → verify tooltip shows buff stat, value, and duration.

### VAL-SKILL-004: Warrior — Frenzy skill exists in skill tree
Warrior class definition contains a skill with `id: 'frenzy'` (or equivalent). Skill should provide an offensive buff (attack speed or damage bonus). Has appropriate `manaCost`, `cooldown`, and `buff` properties.
Evidence: Open skill tree (K) as Warrior → locate Frenzy (狂暴 or similar) → verify tooltip shows buff effect, mana cost, cooldown.

### VAL-SKILL-005: Warrior — Bleed Strike skill exists in skill tree
Warrior class definition contains a skill with `id: 'bleed_strike'` (or equivalent). Skill should deal physical damage and apply a bleed/DoT status effect. Has `damageMultiplier > 0` and appropriate status effect configuration.
Evidence: Open skill tree (K) as Warrior → locate Bleed Strike (出血打击 or similar) → tooltip shows damage and bleed/DoT description.

### VAL-SKILL-006: Warrior — Dual Wield Mastery skill exists in skill tree
Warrior class definition contains a skill with `id: 'dual_wield_mastery'` (or equivalent). Skill is a passive or buff that enhances dual-wielding combat. Appears in skill tree.
Evidence: Open skill tree (K) as Warrior → locate Dual Wield Mastery → verify it can be leveled and tooltip describes its bonus.

### VAL-SKILL-007: Warrior — Unyielding skill exists in skill tree
Warrior class definition contains a skill with `id: 'unyielding'` (or equivalent). Skill provides a defensive/survival mechanic (e.g., damage reduction when low HP, or temporary invulnerability). Appears in skill tree.
Evidence: Open skill tree (K) as Warrior → locate Unyielding (不屈 or similar) → verify tooltip describes defensive/survival mechanic.

### VAL-SKILL-008: Warrior — Life Regen skill exists in skill tree
Warrior class definition contains a skill with `id: 'life_regen'` (or equivalent). Skill provides HP regeneration buff. Has `buff` property with `hpRegen` or similar stat.
Evidence: Open skill tree (K) as Warrior → locate Life Regen (生命恢复 or similar) → verify tooltip shows HP regen value and duration.

### VAL-SKILL-009: Mage — Fire Wall skill exists in skill tree
Mage class definition (`src/data/classes/mage.ts`) contains a skill with `id: 'fire_wall'` (or equivalent). Skill should be in the `fire` tree, deal fire damage, and have AoE properties. Has `damageMultiplier > 0`, `manaCost`, `cooldown`, `damageType: 'fire'`.
Evidence: Open skill tree (K) as Mage → locate Fire Wall (火墙 or similar) under 烈焰 tree → verify tooltip shows fire damage, AoE, mana cost, cooldown.

### VAL-SKILL-010: Mage — Combustion skill exists in skill tree
Mage class definition contains a skill with `id: 'combustion'` (or equivalent). Skill is in the `fire` tree with fire damage type. Should have meaningful `damageMultiplier` and potentially interact with burn status.
Evidence: Open skill tree (K) as Mage → locate Combustion (燃烧 or similar) under 烈焰 tree → verify tooltip.

### VAL-SKILL-011: Mage — Ice Arrow skill exists in skill tree
Mage class definition contains a skill with `id: 'ice_arrow'` (or equivalent). Skill is in the `frost` tree, `damageType: 'ice'`, with a single-target or narrow AoE range ≥3 (ranged projectile). Has `manaCost`, `cooldown`.
Evidence: Open skill tree (K) as Mage → locate Ice Arrow (冰箭 or similar) under 寒冰 tree → verify tooltip shows ice damage, range.

### VAL-SKILL-012: Mage — Freeze skill exists in skill tree
Mage class definition contains a skill with `id: 'freeze'` (or equivalent). Skill is in the `frost` tree, `damageType: 'ice'`. Should apply a freeze/immobilize status effect (via `stunDuration` or a custom freeze field on `SkillDefinition`).
Evidence: Open skill tree (K) as Mage → locate Freeze (冰冻 or similar) → tooltip mentions freeze/immobilize effect.

### VAL-SKILL-013: Mage — Teleport skill exists in skill tree
Mage class definition contains a skill with `id: 'teleport'` (or equivalent). Skill should be a mobility skill in the `arcane` tree. `damageMultiplier` may be 0 (utility skill). Has `manaCost` and `cooldown`.
Evidence: Open skill tree (K) as Mage → locate Teleport (传送 or similar) under 奥术 tree → tooltip describes instant movement.

### VAL-SKILL-014: Mage — Arcane Torrent skill exists in skill tree
Mage class definition contains a skill with `id: 'arcane_torrent'` (or equivalent). Skill is in the `arcane` tree, `damageType: 'arcane'`, with AoE or channeled damage. Has meaningful `damageMultiplier > 0`.
Evidence: Open skill tree (K) as Mage → locate Arcane Torrent (奥术洪流 or similar) → tooltip shows arcane damage, AoE.

### VAL-SKILL-015: Rogue — Death Mark skill exists in skill tree
Rogue class definition (`src/data/classes/rogue.ts`) contains a skill with `id: 'death_mark'` (or equivalent). Skill is in the `assassination` tree. Should apply a debuff or mark that amplifies subsequent damage. Has `manaCost`, `cooldown`.
Evidence: Open skill tree (K) as Rogue → locate Death Mark (死亡标记 or similar) under 暗杀 tree → tooltip describes marking/debuff mechanic.

### VAL-SKILL-016: Rogue — Poison Cloud skill exists in skill tree
Rogue class definition contains a skill with `id: 'poison_cloud'` (or equivalent). Skill deals poison damage (`damageType: 'poison'`), is AoE (`aoe: true`), and has `aoeRadius > 0`. May be in `assassination` or `traps` tree.
Evidence: Open skill tree (K) as Rogue → locate Poison Cloud (毒云 or similar) → tooltip shows poison AoE damage, radius.

### VAL-SKILL-017: Rogue — Slow Trap skill exists in skill tree
Rogue class definition contains a skill with `id: 'slow_trap'` (or equivalent). Skill is in the `traps` tree. Should apply a slow debuff or status effect. Has `manaCost`, `cooldown`, placement `range`.
Evidence: Open skill tree (K) as Rogue → locate Slow Trap (减速陷阱 or similar) under 陷阱 tree → tooltip describes slow effect.

### VAL-SKILL-018: Rogue — Chain Trap skill exists in skill tree
Rogue class definition contains a skill with `id: 'chain_trap'` (or equivalent). Skill is in the `traps` tree. Has AoE or multi-target capabilities. `manaCost`, `cooldown`, `damageMultiplier` defined.
Evidence: Open skill tree (K) as Rogue → locate Chain Trap (连锁陷阱 or similar) under 陷阱 tree → tooltip shows damage/effect.

### VAL-SKILL-019: Rogue — Piercing Arrow skill exists in skill tree
Rogue class definition contains a skill with `id: 'piercing_arrow'` (or equivalent). Skill is in the `archery` tree, `damageType: 'physical'`, with `range ≥ 4` (ranged). Should have a pierce/penetrate mechanic.
Evidence: Open skill tree (K) as Rogue → locate Piercing Arrow (穿透射击 or similar) under 射术 tree → tooltip shows range and pierce description.

### VAL-SKILL-020: Rogue — Poison Arrow skill exists in skill tree
Rogue class definition contains a skill with `id: 'poison_arrow'` (or equivalent). Skill is in the `archery` tree, `damageType: 'poison'`, with `range ≥ 4` (ranged). Should apply poison DoT.
Evidence: Open skill tree (K) as Rogue → locate Poison Arrow (毒箭 or similar) under 射术 tree → tooltip shows poison damage, DoT description.

---

## 2. Skill Combat Functionality

### VAL-SKILL-021: Warrior Charge functions in combat
With Charge assigned to skill bar and learned to level ≥1, pressing the corresponding key (1-6) near an enemy causes the player to rush toward the target and deal damage. The CombatSystem `calculateDamage` is invoked with the Charge skill definition, producing damage > 0. The monster's HP decreases.
Evidence: Assign Charge to slot → approach enemy within range → press key → observe movement toward enemy + damage number floating above monster → monster HP bar decreases.

### VAL-SKILL-022: Warrior Lethal Strike functions in combat
With Lethal Strike learned and assigned, pressing the key near an enemy deals high single-target physical damage. Damage output is visibly higher than a basic attack due to high `damageMultiplier`.
Evidence: Use Lethal Strike on enemy → damage number appears → compare to basic attack damage → Lethal Strike deals significantly more.

### VAL-SKILL-023: Warrior Iron Fortress functions in combat
With Iron Fortress learned and assigned, pressing the key activates a defensive buff. The player's received damage visibly decreases for the buff duration. The buff appears in `player.buffs` array and is cleaned up after expiry.
Evidence: Activate Iron Fortress → take hits from monster → damage received is lower than without buff → buff expires after duration → damage returns to normal.

### VAL-SKILL-024: Warrior Frenzy functions in combat
With Frenzy learned and assigned, activating it increases attack speed and/or damage for the buff duration. Auto-attack interval visibly decreases during the buff.
Evidence: Activate Frenzy → observe faster attack animations / higher DPS output → buff expires → attack speed returns to normal.

### VAL-SKILL-025: Warrior Bleed Strike applies status effect
With Bleed Strike learned and assigned, using it on an enemy applies a bleed DoT. The enemy takes additional damage ticks over time after the initial hit.
Evidence: Use Bleed Strike → initial damage number → subsequent damage tick numbers appear on enemy over the DoT duration → total damage exceeds initial hit.

### VAL-SKILL-026: Mage Fire Wall deals fire AoE damage
With Fire Wall learned and assigned, using it creates a fire zone that damages enemies passing through. Multiple enemies in the AoE take fire damage.
Evidence: Cast Fire Wall near enemy cluster → enemies in zone take fire damage → damage numbers appear repeatedly for duration.

### VAL-SKILL-027: Mage Combustion deals fire damage
With Combustion learned and assigned, using it deals fire damage to the target. If burn status exists, it should interact (e.g., increased damage on burning targets).
Evidence: Cast Combustion on enemy → fire damage number appears → monster HP decreases → verify damage type is fire in combat calculations.

### VAL-SKILL-028: Mage Ice Arrow hits at range
With Ice Arrow learned and assigned, using it launches a ranged ice projectile at the target. Damage is dealt at the point of impact with ice damage type.
Evidence: Cast Ice Arrow from ≥3 tiles away → projectile travels to target → ice damage number appears on impact.

### VAL-SKILL-029: Mage Freeze applies immobilize status
With Freeze learned and assigned, using it on an enemy applies a freeze/immobilize effect. The frozen enemy stops moving for the duration.
Evidence: Cast Freeze on a chasing enemy → enemy stops moving → after freeze duration expires → enemy resumes movement.

### VAL-SKILL-030: Mage Teleport repositions the player
With Teleport learned and assigned, using it instantly moves the player to the target location (within range). Player tile position updates immediately. Mana is consumed.
Evidence: Cast Teleport targeting a walkable tile → player sprite jumps to new position → mana decreases by skill cost → no damage dealt (utility skill).

### VAL-SKILL-031: Mage Arcane Torrent deals arcane AoE damage
With Arcane Torrent learned and assigned, using it deals arcane damage to enemies in the target area. Multiple damage ticks or a burst of arcane damage occurs.
Evidence: Cast Arcane Torrent near enemies → arcane damage numbers appear → multiple enemies in AoE take damage.

### VAL-SKILL-032: Rogue Death Mark amplifies subsequent damage
With Death Mark learned and assigned, using it on an enemy applies a mark. Subsequent attacks on the marked enemy deal increased damage compared to unmarked targets.
Evidence: Note baseline damage on enemy → apply Death Mark → attack again → damage number is higher than baseline → mark expires → damage returns to normal.

### VAL-SKILL-033: Rogue Poison Cloud deals poison AoE
With Poison Cloud learned and assigned, using it creates a poison area. Enemies within the cloud take poison damage over time.
Evidence: Cast Poison Cloud near enemy cluster → poison damage numbers appear on enemies in the AoE → damage repeats over duration.

### VAL-SKILL-034: Rogue Slow Trap slows enemies
With Slow Trap learned and assigned, placing it and having an enemy trigger it causes the enemy to move slower for the debuff duration.
Evidence: Place Slow Trap → lure enemy into it → enemy movement speed visibly decreases → after debuff expires → speed returns to normal.

### VAL-SKILL-035: Rogue Chain Trap triggers multi-target
With Chain Trap learned and assigned, placing it and triggering it affects multiple enemies or chains between targets.
Evidence: Place Chain Trap near enemy group → trigger → multiple enemies take damage or are affected → AoE/chain effect visible.

### VAL-SKILL-036: Rogue Piercing Arrow hits through enemies
With Piercing Arrow learned and assigned, firing it at an enemy causes the projectile to pierce through and potentially hit enemies behind the first target.
Evidence: Line up multiple enemies → fire Piercing Arrow → damage numbers appear on first enemy AND enemies behind it.

### VAL-SKILL-037: Rogue Poison Arrow applies poison DoT at range
With Poison Arrow learned and assigned, firing it at an enemy at range deals initial poison damage and applies a poison DoT.
Evidence: Fire Poison Arrow from ≥4 tiles → initial poison damage number → subsequent poison ticks over DoT duration.

---

## 3. Skill VFX

### VAL-SKILL-038: Charge VFX plays on activation
When Charge is used, `SkillEffectSystem.play('charge', ...)` is invoked and produces a visible particle/tween effect (e.g., rush trail, impact flash). The effect uses additive blend particles and/or graphics overlays consistent with other warrior skill effects.
Evidence: Use Charge in combat → visual rush/trail effect appears between caster and target → impact effect at destination → effect cleans up (no lingering particles).

### VAL-SKILL-039: Lethal Strike VFX plays on activation
When Lethal Strike is used, `SkillEffectSystem.play('lethal_strike', ...)` produces a visible effect (e.g., blade slash, critical flash). Distinct from the basic `slash` effect.
Evidence: Use Lethal Strike → unique slash/strike visual effect → effect fades within ~500ms.

### VAL-SKILL-040: Iron Fortress VFX plays on activation
When Iron Fortress is used, a defensive aura/shield VFX appears around the player (e.g., metallic glow, armor plates, golden barrier). Effect is visually distinct from Shield Wall.
Evidence: Activate Iron Fortress → visible defensive aura appears around player → persists or fades appropriately.

### VAL-SKILL-041: Frenzy VFX plays on activation
When Frenzy is used, an aggressive buff VFX appears (e.g., red energy, speed lines, rage particles). Visually distinct from Vengeful Wrath.
Evidence: Activate Frenzy → buff visual effect appears → consistent with offensive buff theme.

### VAL-SKILL-042: Bleed Strike VFX plays on activation
When Bleed Strike is used, a blood/slash VFX appears at the target (e.g., red slash arcs, blood particles). Distinct from basic slash.
Evidence: Use Bleed Strike → red/crimson slash effect at target → blood-themed particles.

### VAL-SKILL-043: Dual Wield Mastery VFX plays on activation
When Dual Wield Mastery is activated (if buff-type), an appropriate visual indicates the buff is active. If passive, verify icon renders in skill tree.
Evidence: Activate or verify in skill tree → visual feedback present.

### VAL-SKILL-044: Unyielding VFX plays on activation
When Unyielding is activated, a defensive/survival VFX appears (e.g., golden glow, unbreakable aura).
Evidence: Activate Unyielding → visible effect appears around player.

### VAL-SKILL-045: Life Regen VFX plays on activation
When Life Regen is activated, a healing-themed VFX appears (e.g., green particles, healing glow).
Evidence: Activate Life Regen → green/healing visual effect around player.

### VAL-SKILL-046: Fire Wall VFX plays on activation
When Fire Wall is cast, a fire wall/barrier VFX appears at the target location. Uses `particle_flame` textures, fire-colored tints (0xff4400, 0xff6600, 0xffaa00). Persists for skill duration.
Evidence: Cast Fire Wall → wall of fire particles appears at target location → flames persist for duration → clean up after.

### VAL-SKILL-047: Combustion VFX plays on activation
When Combustion is cast, an explosion/ignition VFX appears at the target. Uses fire particles and flash effects.
Evidence: Cast Combustion → fiery explosion effect at target → flash + particles.

### VAL-SKILL-048: Ice Arrow VFX plays on activation
When Ice Arrow is cast, an ice projectile VFX travels from caster to target. Uses `particle_ice` texture, ice-colored tints (0x88ccff, 0xaaddff).
Evidence: Cast Ice Arrow → ice projectile travels to target → impact burst of ice particles.

### VAL-SKILL-049: Freeze VFX plays on activation
When Freeze is cast, an ice/freeze VFX appears at the target (e.g., ice crystals forming, frozen aura). Enemy sprite may receive a freeze tint via `VFXManager.applyStatusTint`.
Evidence: Cast Freeze → ice crystal effect at target → target visually tinted/frozen.

### VAL-SKILL-050: Teleport VFX plays on activation
When Teleport is used, VFX appears at both departure and arrival locations (e.g., arcane flash at origin, materialization effect at destination). Uses arcane-themed colors (purple/blue).
Evidence: Cast Teleport → flash effect at origin → flash effect at destination → player appears at new location.

### VAL-SKILL-051: Arcane Torrent VFX plays on activation
When Arcane Torrent is cast, arcane beam/stream VFX appears between caster and target area. Uses arcane colors (0x8e44ad, 0xbb77ff).
Evidence: Cast Arcane Torrent → arcane energy stream/burst at target area → particles clean up.

### VAL-SKILL-052: Death Mark VFX plays on activation
When Death Mark is used, a marking VFX appears on the target (e.g., skull icon, dark aura, red mark). Should persist for the debuff duration.
Evidence: Cast Death Mark on enemy → visible mark/aura appears on enemy → persists for duration.

### VAL-SKILL-053: Poison Cloud VFX plays on activation
When Poison Cloud is cast, a green poison cloud VFX appears at the target area. Uses `particle_poison` texture, green tints (0x33cc33, 0x44dd44, 0x66ff66). Persists for duration.
Evidence: Cast Poison Cloud → green cloud of poison particles at target → persists for duration → fades.

### VAL-SKILL-054: Slow Trap VFX plays on activation
When Slow Trap is placed, a trap VFX appears at the target location (e.g., mechanical trap graphic, blue/ice slow indicator on trigger).
Evidence: Place Slow Trap → trap visual appears on ground → trigger effect visible when enemy enters.

### VAL-SKILL-055: Chain Trap VFX plays on activation
When Chain Trap is placed and triggered, a chain/linking VFX connects affected enemies. Uses spark or lightning-style chaining visual.
Evidence: Place Chain Trap → trigger → chain visual connects to multiple enemies.

### VAL-SKILL-056: Piercing Arrow VFX plays on activation
When Piercing Arrow is fired, an arrow projectile VFX travels from caster through multiple enemies. Uses `particle_arrow` texture. Arrow does not stop at first target.
Evidence: Fire Piercing Arrow → arrow projectile visible → passes through first enemy → continues flight path.

### VAL-SKILL-057: Poison Arrow VFX plays on activation
When Poison Arrow is fired, a green-tinted arrow projectile VFX travels to the target. Uses `particle_arrow` with poison tint and `particle_poison` for impact.
Evidence: Fire Poison Arrow → green arrow projectile travels to target → green poison impact effect.

### VAL-SKILL-058: All new skills have `play()` switch cases
The `SkillEffectSystem.play()` method's switch statement includes a `case` for every new skill id: `'charge'`, `'lethal_strike'`, `'iron_fortress'`, `'frenzy'`, `'bleed_strike'`, `'dual_wield_mastery'`, `'unyielding'`, `'life_regen'`, `'fire_wall'`, `'combustion'`, `'ice_arrow'`, `'freeze'`, `'teleport'`, `'arcane_torrent'`, `'death_mark'`, `'poison_cloud'`, `'slow_trap'`, `'chain_trap'`, `'piercing_arrow'`, `'poison_arrow'`. None fall through to the generic fallback `effectGeneric`.
Evidence: Inspect `SkillEffectSystem.play()` switch → every new skill id has a dedicated case → no new skill triggers `default`.

### VAL-SKILL-059: All new skills have procedural icons generated
`SkillEffectSystem.generateSkillIcons()` generates a `skill_icon_{id}` texture for each new skill. The icons render in the skill tree panel as colored 64×64 graphics (not blank/missing).
Evidence: Open skill tree (K) → every new skill shows a colored icon (not a blank square or fallback) → icons are visually distinct per skill.

---

## 4. Skill Synergies

### VAL-SKILL-060: Warrior new skills define synergies
Each new Warrior skill has a `synergies` array referencing at least one other Warrior skill. The synergy `skillId` values correspond to valid skill ids in the Warrior class.
Evidence: Inspect warrior.ts → each new skill's `synergies` array → every `skillId` exists in the Warrior skill list.

### VAL-SKILL-061: Mage new skills define synergies
Each new Mage skill has a `synergies` array referencing at least one other Mage skill. The synergy `skillId` values correspond to valid skill ids in the Mage class.
Evidence: Inspect mage.ts → each new skill's `synergies` array → every `skillId` exists in the Mage skill list.

### VAL-SKILL-062: Rogue new skills define synergies
Each new Rogue skill has a `synergies` array referencing at least one other Rogue skill. The synergy `skillId` values correspond to valid skill ids in the Rogue class.
Evidence: Inspect rogue.ts → each new skill's `synergies` array → every `skillId` exists in the Rogue skill list.

### VAL-SKILL-063: Synergy bonus increases damage in combat
Invest 5 points in skill A that is a synergy source for skill B. Use skill B. Damage output with 5 points in skill A is higher than with 0 points in skill A (all else equal). The `getSynergyBonus()` function returns > 1.0 when synergy levels > 0.
Evidence: Level skill A to 5 → use skill B → note damage → reset/compare to baseline with skill A at 0 → damage is measurably higher with synergy.

### VAL-SKILL-064: Synergy info displayed in skill tooltip
Skill tree tooltip for a skill with synergies shows the "─ 协同增益 ─" section listing each synergy source skill name, per-level bonus percentage, and current bonus based on invested levels.
Evidence: Open skill tree (K) → hover over skill with synergies → tooltip shows 协同增益 section → lists synergy skills with correct per-level % and current bonus.

---

## 5. Elite Monster Affix System

### VAL-SKILL-065: Elite monsters can spawn with affixes
Elite monsters (those with `elite: true` in their `MonsterDefinition`) are assigned one or more random affixes from the elite affix pool at spawn time. The affix system generates affixes like "Fire Enhanced", "Swift", "Teleporting", "Extra Strong", "Curse Aura", etc.
Evidence: Enter a zone with elite monsters → locate an elite → verify it has at least one affix assigned (visible in name label, aura, or behavior).

### VAL-SKILL-066: Fire Enhanced affix — visible and functional
An elite monster with the "Fire Enhanced" (火焰强化 or similar) affix deals additional fire damage on attacks and/or has a visible fire aura. Player takes more damage from this elite than a non-enhanced version.
Evidence: Find Fire Enhanced elite → observe fire visual on monster → take a hit → damage is higher than from same monster type without the affix.

### VAL-SKILL-067: Swift affix — visible and functional
An elite monster with the "Swift" (迅捷 or similar) affix has increased movement speed. The monster chases the player noticeably faster than non-Swift versions of the same monster type.
Evidence: Find Swift elite → kite it → observe it moves faster than normal monsters of same type.

### VAL-SKILL-068: Teleporting affix — visible and functional
An elite monster with the "Teleporting" (传送 or similar) affix can teleport near the player. The monster blinks to a new position with a VFX (flash, particles). Occurs periodically during combat.
Evidence: Engage Teleporting elite → monster periodically vanishes and reappears near player → teleport VFX visible.

### VAL-SKILL-069: Extra Strong affix — visible and functional
An elite monster with the "Extra Strong" (超强 or similar) affix deals significantly more physical damage than a normal version. Damage increase is ≥30% over base.
Evidence: Compare damage from Extra Strong elite vs. same monster type without affix → Extra Strong deals ≥30% more damage.

### VAL-SKILL-070: Curse Aura affix — visible and functional
An elite monster with the "Curse Aura" (诅咒光环 or similar) affix applies a debuff to the player when in proximity (e.g., reduced defense, reduced attack speed, or reduced damage). A visible aura emanates from the monster.
Evidence: Approach Curse Aura elite → observe aura VFX → player receives debuff (visible in stat reduction or buff list) → moving away removes the debuff.

### VAL-SKILL-071: Elite affix label is visible
Elite monsters with affixes display their affix name(s) in their name label (above HP bar) or in a subtitle. The text is in Chinese. Elite name color remains `#e74c3c` (red).
Evidence: Find elite with affix → name label above HP bar shows affix name(s) → text is Chinese → name is red colored.

### VAL-SKILL-072: Multiple affixes can stack on one elite
In higher-level zones (e.g., zone 4-5), elite monsters can roll 2+ affixes simultaneously. Both affix effects are active and visually indicated.
Evidence: In a high-level zone → find elite with 2+ affixes → verify both visual effects are present → both behavioral modifications are active.

### VAL-SKILL-073: Elite affixes increase loot quality
Elite monsters with affixes have improved loot drop rates and/or quality compared to non-affix elites. The `LootSystem` accounts for affix count or presence when rolling drops.
Evidence: Kill multiple affix elites → loot quality/quantity is higher on average than from basic elites → inspect LootSystem code for affix-based modifiers.

---

## 6. Status Effects from Skills

### VAL-SKILL-074: War Stomp stun effect applies to enemies
Using War Stomp on enemies within AoE radius stuns them for `stunDuration` ms. Stunned enemies stop attacking and moving for the duration. The existing `stunDuration` field on the skill definition is consumed by ZoneScene/CombatSystem.
Evidence: Use War Stomp near enemies → enemies stop moving/attacking → after stun duration → enemies resume behavior.

### VAL-SKILL-075: Bleed Strike DoT ticks damage over time
Using Bleed Strike applies a bleed debuff that deals damage per tick for a set duration. Damage numbers appear periodically above the target during bleed. Total bleed damage is proportional to skill level.
Evidence: Use Bleed Strike → periodic damage numbers appear on target → count total ticks → total damage scales with skill level.

### VAL-SKILL-076: Freeze immobilizes target
Using Freeze on an enemy prevents movement and possibly attack for the freeze duration. The enemy's `state` is set to a frozen/stunned state.
Evidence: Cast Freeze → enemy stops completely → duration expires → enemy resumes AI behavior.

### VAL-SKILL-077: Poison Cloud applies poison DoT
Enemies standing in Poison Cloud take poison damage ticks. Leaving the cloud stops new ticks (existing DoT may persist). Damage type is poison, subject to poison resistance.
Evidence: Cast Poison Cloud → enemy stands in cloud → poison damage numbers appear at intervals → enemy moves out → ticks stop (or persist for remaining DoT duration).

### VAL-SKILL-078: Slow Trap reduces enemy movement speed
An enemy that triggers a Slow Trap has its movement speed reduced. The slow debuff has a finite duration. After expiry, speed returns to normal.
Evidence: Enemy triggers Slow Trap → movement speed decreases → after duration → speed returns.

### VAL-SKILL-079: Death Mark increases damage taken by target
An enemy with Death Mark takes increased damage from all sources for the mark duration. The damage amplification is consistent with the skill's definition.
Evidence: Apply Death Mark → attack target → damage is higher than without mark → mark expires → damage returns to baseline.

### VAL-SKILL-080: Poison Arrow applies poison DoT
Using Poison Arrow applies a poison DoT to the hit target. Damage ticks appear over time. Poison resistance reduces the DoT damage.
Evidence: Fire Poison Arrow → initial damage → poison tick damage numbers appear on target over time.

### VAL-SKILL-081: Buff/debuff timer cleanup works correctly
All new skill buffs and debuffs are properly cleaned up after their duration expires. `CombatSystem.updateBuffs()` removes expired entries. No buff persists indefinitely or leaks memory.
Evidence: Apply multiple buffs/debuffs → wait for all durations to expire → verify `entity.buffs` array is empty → no visual artifacts remain.

---

## 7. Mana Costs and Cooldowns

### VAL-SKILL-082: All new skills have manaCost > 0
Every new skill definition has `manaCost > 0`. No skill is free to cast (except potential passives which have `damageMultiplier: 0` and act as auras).
Evidence: Inspect all new skill definitions → verify `manaCost > 0` for each active skill.

### VAL-SKILL-083: All new skills have cooldown > 0
Every new active skill definition has `cooldown > 0` (in milliseconds). Cooldowns range between 1000ms and 30000ms. No active skill can be spammed without cooldown.
Evidence: Inspect all new skill definitions → verify `cooldown > 0` → values are in reasonable range.

### VAL-SKILL-084: Mana is consumed on skill use
When a new skill is used, `CombatSystem.useSkillMana()` deducts the scaled mana cost from the player's mana pool. Player mana decreases by `getSkillManaCost(skill, level)` amount. The mana bar in UIScene reflects the decrease.
Evidence: Note player mana → use skill → mana decreases by skill cost → mana bar visually updates.

### VAL-SKILL-085: Skill cannot be used without sufficient mana
When player mana is below the scaled mana cost of a skill, `CombatSystem.canUseSkill()` returns `false`. Pressing the skill key does nothing (no damage, no mana deduction, no VFX).
Evidence: Deplete mana below skill cost → press skill key → no effect → skill icon may appear grayed/dimmed.

### VAL-SKILL-086: Cooldown prevents re-use
After using a skill, attempting to use it again before the cooldown expires has no effect. The skill bar slot shows a cooldown indicator (timer overlay or grayed state). After cooldown expires, skill becomes usable again.
Evidence: Use skill → immediately press key again → no effect → wait for cooldown → press key → skill fires successfully.

### VAL-SKILL-087: Mana cost scales with level via tieredScale
For a skill at level 10, `getSkillManaCost(skill, 10)` is higher than `getSkillManaCost(skill, 1)`. The scaling follows the D2-style tiered bracket system (full growth at levels 1-8, 75% at 9-16, 50% at 17-20).
Evidence: Compute `getSkillManaCost(skill, 1)` and `getSkillManaCost(skill, 10)` for a new skill → level 10 cost > level 1 cost → scaling matches tiered formula.

### VAL-SKILL-088: Cooldown decreases with level for skills with cooldownReductionPerLevel
For skills that define `scaling.cooldownReductionPerLevel > 0`, `getSkillCooldown(skill, 10)` is less than `getSkillCooldown(skill, 1)`. Minimum cooldown is 500ms.
Evidence: Compute cooldown at level 1 and 10 for a skill with CDR scaling → level 10 CD < level 1 CD → never below 500ms.

---

## 8. Skill Tree UI

### VAL-SKILL-089: Warrior skill tree shows all 15 skills
Opening the skill tree (K) as Warrior displays all skills across the class's trees. The total count of skill cards visible is ≥15 (original 7 + 8 new). Each skill has an icon, name, level indicator, and "+" button.
Evidence: Open skill tree as Warrior → count total skill cards → count ≥ 15 → all cards have icon, name, level display.

### VAL-SKILL-090: Mage skill tree shows all 12+ skills
Opening the skill tree (K) as Mage displays all skills (original 6 + 6 new = 12+). Each skill has an icon, name, level indicator, and "+" button.
Evidence: Open skill tree as Mage → count total skill cards → count ≥ 12 → all cards present.

### VAL-SKILL-091: Rogue skill tree shows all 13+ skills
Opening the skill tree (K) as Rogue displays all skills (original 7 + 6 new = 13+). Each skill has an icon, name, level indicator, and "+" button.
Evidence: Open skill tree as Rogue → count total skill cards → count ≥ 13 → all cards present.

### VAL-SKILL-092: Skill tree columns auto-size for more skills
The skill tree panel dynamically sizes columns and allows scrolling or expanded height to accommodate the increased number of skills per tree. No skill card is clipped or overlapping.
Evidence: Open skill tree → all skill cards are fully visible → no overlap → cards for higher-tier skills are reachable (scroll or expanded panel).

### VAL-SKILL-093: New skill tooltip shows all properties
Hovering/clicking a new skill card shows a tooltip with: skill name (Chinese + English), description, damage multiplier %, damage type with color, mana cost, cooldown, range, AoE radius (if applicable), status effect info, buff stats, synergy section, and next-level preview.
Evidence: Hover over any new skill → tooltip appears → verify all listed properties are present and correct.

### VAL-SKILL-094: Skill tree TREE_NAMES mapping includes all trees
The `TREE_NAMES` record in the skill tree rendering code maps every `tree` value used by new skills to a Chinese display name. No tree header shows a raw English key.
Evidence: Open skill tree → all tree column headers display Chinese names (e.g., 进攻大师, 守护者, 烈焰, etc.) → no raw `combat_master` or similar strings.

### VAL-SKILL-095: Skill tree TREE_COLORS mapping includes all trees
The `TREE_COLORS` record maps every `tree` value to a color. Column backgrounds and headers use the correct accent color.
Evidence: Open skill tree → each column has a distinct accent color for header and border → no default grey fallback.

### VAL-SKILL-096: Skill level can be incremented for all new skills
For each new skill, clicking the "+" button with ≥1 free skill point increases the skill level from 0→1 (and beyond up to `maxLevel: 20`). The level display updates. Free skill points decrease by 1.
Evidence: Open skill tree → click "+" on a new skill → level goes 0→1 → skill points decrease → repeat for all new skills.

### VAL-SKILL-097: New skills can be assigned to skill bar
After learning a new skill (level ≥1), it can be dragged or assigned to a skill bar slot (1-6). The skill bar in UIScene shows the skill icon and responds to the corresponding key press.
Evidence: Learn new skill → assign to slot 2 → skill icon appears in slot 2 on HUD → press key 2 → skill activates.

---

## 9. Combat Formula Adjustments

### VAL-SKILL-098: D2-style tiered scaling applies to new skills
For all new skills, the `tieredScale()` function is used for damage, mana cost, cooldown reduction, AoE radius, and buff value scaling. Levels 1-8 get full growth, 9-16 get 75%, 17-20 get 50%.
Evidence: Compute `getSkillDamageMultiplier(skill, 8)` vs `getSkillDamageMultiplier(skill, 16)` vs `getSkillDamageMultiplier(skill, 20)` → growth rate diminishes in later brackets.

### VAL-SKILL-099: Damage multipliers are balanced across classes
No single new skill has a damage multiplier at level 1 that exceeds 300% (which would be higher than Meteor at 250%). Damage multipliers are proportional to mana cost and cooldown (high damage = high cost/CD).
Evidence: Inspect all new skill `damageMultiplier` values → none exceed 3.0 at base → higher multipliers correlate with higher mana costs and cooldowns.

### VAL-SKILL-100: Elemental damage types route through resistance system
New skills with non-physical damage types (`fire`, `ice`, `lightning`, `poison`, `arcane`) have their damage reduced by the target's corresponding resistance via `getResistance()`. A target with 50% fire resist takes 50% less damage from Fire Wall.
Evidence: Equip fire resist gear on player → take fire damage from Fire Wall (friendly fire test or inspect formula) → damage is reduced proportionally.

### VAL-SKILL-101: New buff skills integrate with buff system
All new buff/debuff skills create `ActiveBuff` entries via `CombatSystem.addBuff()`. These buffs have correct `stat`, `value`, `duration`, and `startTime`. They are cleaned up by `updateBuffs()`.
Evidence: Activate a new buff skill → inspect entity's `buffs` array → ActiveBuff entry present with correct values → wait for duration → entry removed.

### VAL-SKILL-102: Game builds without TypeScript errors
Running `npm run build` completes successfully with no TypeScript compilation errors related to new skill definitions, VFX methods, or elite affix system. All type interfaces (`SkillDefinition`, `MonsterDefinition`, etc.) are satisfied.
Evidence: Run `npm run build` → exit code 0 → no type errors in output.

### VAL-SKILL-103: Dev server runs without runtime errors
Running `npm run dev` and navigating through character creation, skill tree, and combat produces no console errors related to missing skill VFX, undefined skill ids, or null references.
Evidence: Run `npm run dev` → create character → open skill tree → learn skills → enter combat → browser console shows no errors from skill/combat systems.

### VAL-SKILL-104: Existing skills remain functional
The 7 original Warrior skills (slash, whirlwind, war_stomp, shield_wall, taunt_roar, vengeful_wrath), 6 original Mage skills (fireball, meteor, blizzard, ice_armor, chain_lightning, mana_shield), and 7 original Rogue skills (backstab, poison_blade, vanish, multishot, arrow_rain, explosive_trap) continue to function identically — same damage, VFX, synergies, mana costs, and cooldowns.
Evidence: Test each original skill → damage/VFX/behavior unchanged → no regression.
