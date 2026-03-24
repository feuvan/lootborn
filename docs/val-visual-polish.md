# Visual Polish — Validation Contract

> Milestone: `visual-polish`
> Scope: Unified procedural palette, sprite detail, UI panel styling, tooltip readability, skill tree design, homestead visuals, regression safety.

---

## 1. Zone Palette Consistency

### VAL-VIS-001: Zone color temperature coherence — tile terrain
All procedurally generated ground tiles within a single zone (grass, dirt, stone, water, camp, camp_wall variants) must share a coherent color temperature. Plains tiles skew warm-green, Forest tiles skew cool-violet-green, Mountain tiles skew neutral-grey, Desert tiles skew warm-amber, Abyss tiles skew cold-crimson/deep purple. No tile type within a zone may introduce a hue more than 30° away from the zone's dominant hue on the HSL wheel.
Evidence: Side-by-side screenshot of all tile variants per zone; HSL histogram or manual hue-check of dominant pixel clusters per tile.

### VAL-VIS-002: Zone color temperature coherence — entity sprites
Monster sprites assigned to a zone must have accent colors (soft outline glow, rim light tint) that harmonize with the zone's color temperature. Emerald Plains monsters lean warm-green/earth, Twilight Forest lean purple/teal, Anvil Mountains lean grey-blue/slate, Scorching Desert lean orange/amber, Abyss Rift lean deep-red/black. The `softOutline` glow color and `rimLight` tint on every monster drawer must reference colors compatible with its assigned zone theme.
Evidence: Visual inspection of each monster sprite rendered on its home zone background; confirm glow/rim colors don't clash.

### VAL-VIS-003: Zone color temperature coherence — camp decorations
Camp wall, camp ground, banner, torch flame, and tent colors (defined in `CAMP_THEMES`) must form a visually coherent set per zone. No individual camp element should appear to belong to a different zone when rendered together. The `torchFlame` hex must be within the warm/cool spectrum of its zone theme.
Evidence: Screenshot of each zone's camp area with all themed decorations visible; visual consistency check.

### VAL-VIS-004: Zone color temperature coherence — decoration sprites
Decoration sprites (Tree, Bush, Rock, Flower, Mushroom, Cactus, Boulder, Crystal, Bones) that appear in a zone must not introduce colors that violate the zone's color temperature. Zone-specific decorations (e.g., Cactus in Desert, Crystal in Mountain) must use palette-appropriate hues.
Evidence: Screenshot of each zone with decorations rendered; no decoration hue more than 30° off-theme.

### VAL-VIS-005: ColorGradePipeline global coherence
The `ColorGradePipeline` post-processing shader (warm midtone boost, brown shadow tint, mild contrast) must apply uniformly to all zones without washing out zone-specific color identity. The pipeline must not flatten the visual distinction between zones.
Evidence: Side-by-side comparison of two different zones with pipeline enabled; zones remain visually distinct.

---

## 2. Sprite Outline Consistency

### VAL-VIS-006: Outline weight consistency — player sprites
All three player class sprites (Warrior, Mage, Rogue) must use the same outline approach and weight. If `softOutline` is used, the `blur` parameter must be identical (±0.5px tolerance) across all player drawers. If stroke-based outlines are used, `lineWidth` must be within ±0.3 scaled pixels of each other.
Evidence: Render all three player idle frames at the same scale; measure outline thickness visually or via pixel sampling.

### VAL-VIS-007: Outline weight consistency — monster sprites
All 18 monster drawers must use a consistent outline technique. Either all use `softOutline` with a uniform blur value (scaled by sprite size), or all use stroke-based outlines with a uniform `lineWidth` relative to their `frameW`. Outline weight, expressed as a ratio to `frameW`, must not vary by more than ±15% across monsters.
Evidence: Render all monster idle frames; compare outline weights relative to body size.

### VAL-VIS-008: Outline weight consistency — NPC sprites
All 11 NPC drawers must use the same outline technique and weight as other entity types (players, monsters). NPC sprites at their rendered size (80×120 base) must have visually equivalent outline presence to player sprites (64×96 base) when viewed side-by-side in-game.
Evidence: Place an NPC and player on screen simultaneously; outlines appear visually balanced.

### VAL-VIS-009: Outline color consistency within entity class
Within each entity class (players, zone-specific monsters, NPCs), outline/glow colors must follow a systematic pattern — either all use the same neutral outline color, or each uses a color derived from its dominant body hue via a consistent formula (e.g., `darken(primaryColor, N)` with the same `N`).
Evidence: List the outline color for every entity drawer; verify the derivation rule is consistent within each class.

### VAL-VIS-010: No outline on decoration sprites
Static decoration sprites (Tree, Bush, Rock, etc.) must NOT have entity-style outlines or soft glows, as they are environmental objects, not interactive entities. If any glow is present, it must be environmental (e.g., Crystal shimmer) rather than entity-outline style.
Evidence: Render each decoration sprite and confirm no `softOutline`-style glow wraps the silhouette.

---

## 3. UI Panel Uniform Styling

### VAL-VIS-011: Panel background consistency
All major panels (Inventory, Shop, Map, Skill Tree, Character Stats, Homestead, Quest Log, Audio Settings, Dialogue) must use the same base background color and alpha. Current standard: `0x0f0f1e` at `0.95` alpha (or `0x0d0d1a` at `0.97` for skill panel). All panels must converge to a single background color+alpha pair.
Evidence: Enumerate the `fillStyle`/`fillRoundedRect` or `Rectangle` color+alpha for every panel; all must match within ±0x020202 and ±0.02 alpha.

### VAL-VIS-012: Panel border consistency
All panels must use the same border style: `strokeRoundedRect` or `setStrokeStyle` with a uniform border color, width, and corner radius. Current values vary (Inventory uses `0xc0934a` gold border width 2, Skill uses `0x8e44ad` purple border width 2 with double-border). All panels must share one primary border color, one border width, and one corner radius.
Evidence: List border color, width, and radius for every panel; all must match a single spec.

### VAL-VIS-013: Panel corner radius consistency
All panels using `fillRoundedRect`/`strokeRoundedRect` must use the same corner radius value. If the standard is `px(8)`, no panel may use `px(4)` or `px(0)`.
Evidence: Grep all `fillRoundedRect`/`strokeRoundedRect` calls in UIScene; verify uniform radius parameter.

### VAL-VIS-014: Panel header styling consistency
All panels must have a header area with: (a) the same height, (b) the same title font (`TITLE_FONT`), (c) the same title font size, (d) the same title color, and (e) the same close button style (position, font, color, hover behavior). Current variations: Homestead uses `fs(18)` title, Inventory uses `fs(16)`, Skill uses `fs(20)`.
Evidence: Tabulate header height, title font, size, color, and close-button style for every panel; all must match.

### VAL-VIS-015: Panel open animation consistency
All panels must use `animatePanelOpen()` with the same easing and duration. No panel may skip the animation or use a different animation curve.
Evidence: Confirm every panel creation path calls `animatePanelOpen()`; verify the function uses a single tween config.

### VAL-VIS-016: Panel depth layering consistency
All panels must render at the same depth (`4000`). All tooltips must render above panels (`5000`). No panel may use a different depth that causes z-fighting or incorrect stacking.
Evidence: List `.setDepth()` values for all panels and tooltips in UIScene.

---

## 4. Tooltip Readability and Layout

### VAL-VIS-017: Item tooltip background and border
Item tooltips (shown on inventory/shop/equipment hover) must have the same background color, alpha, border color, border width, and corner radius as skill tooltips. Both must use `fillRoundedRect` with a dark background (`0x0a0a18` or equivalent), high alpha (≥0.95), and a thin border.
Evidence: Compare item tooltip and skill tooltip rendering; visually identical framing.

### VAL-VIS-018: Item tooltip text hierarchy
Item tooltips must display information in a clear hierarchy: (1) Item name in quality color, bold, (2) Item type/slot in subdued color, (3) Base stats, (4) Affix stats in blue/yellow, (5) Set bonuses in green, (6) Sell price. Each section must be separated by consistent spacing or a visual divider.
Evidence: Screenshot of a Rare item tooltip and a Set item tooltip; verify all sections present and properly spaced.

### VAL-VIS-019: Tooltip positioning — no screen overflow
All tooltips (item and skill) must be fully visible on screen. If a tooltip would overflow the right edge, it must flip to the left of the trigger element. If it would overflow the bottom, it must shift upward. No tooltip text may be clipped by screen boundaries.
Evidence: Trigger tooltips near all four screen edges; confirm full visibility in each case.

### VAL-VIS-020: Tooltip text size and readability
Tooltip body text must be at least `fs(11)` (11 logical pixels) with `lineSpacing` of at least `px(2)`. Font must be the standard `FONT` (Noto Sans SC). Text color must have sufficient contrast against the tooltip background (WCAG AA: contrast ratio ≥ 4.5:1 for body text).
Evidence: Measure font size and line spacing in tooltip creation code; compute contrast ratio of text color vs. background color.

### VAL-VIS-021: Tooltip dismiss behavior
Item tooltips must disappear immediately on `pointerout`. Skill tooltips must disappear on `pointerout` from the skill card. No tooltip may persist after the triggering element loses hover. No tooltip may flicker during normal pointer movement over a grid of items.
Evidence: Hover rapidly over inventory grid; no ghost tooltips remain; smooth show/hide transitions.

---

## 5. Skill Tree Panel Visual Quality

### VAL-VIS-022: Skill tree tab styling
Each skill tree tab (3 per class, e.g., 进攻大师/守护者 for Warrior) must have clearly differentiated active vs. inactive states. Active tab must have a highlighted background and brighter text. Inactive tabs must be visually recessed. Tab click areas must cover the full tab width with no dead zones.
Evidence: Screenshot of skill tree with each tab active; clear visual distinction between active and inactive tabs.

### VAL-VIS-023: Skill card layout and alignment
Skill cards within the tree must be uniformly sized (`cardW × cardH`), evenly spaced, and left-aligned within the scroll area. The skill icon (procedural `skill_icon_{id}` texture) must be vertically centered within the card. Skill name, level, and hotkey indicator must not overlap.
Evidence: Screenshot of a full skill tree with 6+ skills visible; all cards aligned on a grid with no overlap.

### VAL-VIS-024: Skill card state differentiation
Skill cards must have four visually distinct states: (a) Not learned (dark, desaturated), (b) Learned but not max level (standard color with level indicator), (c) Max level (gold or bright accent border), (d) Learnable (has available skill points AND meets prerequisites — pulsing or highlighted border). Each state must be distinguishable at a glance.
Evidence: Screenshot showing at least 3 different skill states in one tree; each visually distinct.

### VAL-VIS-025: Skill icon quality
Procedural skill icons (`skill_icon_{id}`) must be rendered at sufficient resolution (at least `px(38) × px(38)`). Icons must use the skill's damage type color as the dominant hue (fire=red/orange, frost=blue/cyan, physical=grey/silver, lightning=yellow/purple, poison=green, arcane=violet). Icons must not appear as flat colored rectangles — they must have at least gradient shading or a recognizable glyph.
Evidence: Render all skill icons at standard UI size; each icon has gradient/detail, correct color mapping.

### VAL-VIS-026: Skill tree scroll behavior
If a skill tree has more skills than fit in the visible area, a scroll mechanism (buttons or scroll region) must be present and functional. Scroll must not leave partial cards visible at the top/bottom edge without clipping.
Evidence: Open a class with many skills (Mage has 3 trees × 6 skills = 18 total); scroll through all; no rendering artifacts.

### VAL-VIS-027: Skill tree prerequisite lines
If skills have prerequisites (`requiredLevel`, `requiredSkills`), visual connections (lines or arrows) between prerequisite and dependent skills should indicate the dependency. Lines must use a color consistent with the tree's accent color and must not overlap skill cards.
Evidence: Open Warrior skill tree; verify visual links between prerequisite chains.

---

## 6. Homestead Panel Visual Upgrade

### VAL-VIS-028: Building visual representation
Each building in the Homestead panel must have a visual icon or illustration (procedural sprite or styled graphic) rather than being text-only. The icon must be recognizable (e.g., herb garden shows plants, training ground shows a dummy, gem workshop shows gems/tools).
Evidence: Open Homestead panel; each building row has a distinct visual icon to the left of the name.

### VAL-VIS-029: Building upgrade level progression — visual indicator
Building level must be shown with a visual progress indicator (e.g., filled pips, progress bar, or star rating) in addition to the `Lv.X/Y` text. The indicator must clearly show current level vs. maximum level at a glance.
Evidence: Open Homestead with buildings at different levels; progress indicators reflect correct levels.

### VAL-VIS-030: Building upgrade level progression — icon evolution
Building icons should show visual progression as level increases. At minimum, buildings at level 0, mid-level, and max level must look visually different (e.g., size increase, color enrichment, added detail, or glow). This communicates investment.
Evidence: Compare building icon at Lv.0 vs. Lv.3 vs. Lv.5 (or max); visible differences.

### VAL-VIS-031: Pet display in Homestead
Pets must be displayed with a small procedural sprite or icon showing the pet type (sprite, dragon, owl, cat, phoenix). Active pet must have a highlight (glow, border, or "ACTIVE" badge). Pet level and experience must be shown with a mini progress bar.
Evidence: Open Homestead with at least one pet; pet has visual icon, active indicator, and exp bar.

### VAL-VIS-032: Homestead panel layout spacing
Building rows must have consistent vertical spacing with clear separation. The building section and pet section must be visually separated by a labeled divider. No text overlap or cramped layout at any building count.
Evidence: Open Homestead with all 6 buildings and 2+ pets; all rows visible without overlap; divider present.

### VAL-VIS-033: Homestead upgrade button styling
Upgrade buttons must match the global UI button style (consistent with Inventory/Shop action buttons). Affordable upgrades must have a clearly interactive appearance (bright color, hand cursor). Unaffordable upgrades must be visually disabled (greyed out). Max-level buildings must show a distinct "maxed" badge.
Evidence: View upgrade buttons in various states (affordable, unaffordable, maxed); each state visually distinct and consistent with other panel buttons.

---

## 7. No Visual Regressions

### VAL-VIS-034: Player sprite rendering integrity
All three player classes (Warrior, Mage, Rogue) must render correctly in all 6 actions (idle, walk, attack, hurt, death, cast) with no missing frames, no black rectangles, no misaligned body parts, and no transparent gaps in the sprite silhouette.
Evidence: Play each class through combat; observe all animation states; no visual glitches.

### VAL-VIS-035: Monster sprite rendering integrity
All 18 monster types must render correctly in all 5 actions (idle, walk, attack, hurt, death) with no visual defects. Death animation must end with reduced alpha or flat sprite (not an abrupt disappearance).
Evidence: Encounter every monster type; observe idle→attack→hurt→death cycle; no rendering artifacts.

### VAL-VIS-036: NPC sprite rendering integrity
All 11 NPC types must render all 4 actions (working, alert, idle, talking) correctly. NPCs must animate at their configured work rate. Interaction state change (idle→alert→talking) must be smooth.
Evidence: Approach each NPC type; observe animation transitions; no visual defects.

### VAL-VIS-037: Tile rendering integrity
All tile types (grass, dirt, stone, water, wall, camp, camp_wall) including all 3 per-tile variants and all themed camp variants (plains, forest, mountain, desert, abyss) must render correctly as isometric diamonds with no gaps, no bleed-through, and no misaligned edges.
Evidence: Visit all 5 zones; inspect tile rendering at various positions; no gaps between tiles.

### VAL-VIS-038: Transition tile blending integrity
Transition tiles generated by `generateTransitionTile()` must show smooth, noise-displaced boundaries between terrain types. No hard pixel-perfect straight lines at terrain boundaries. No visible seams between a base tile and its transition variant.
Evidence: Navigate to terrain boundaries in each zone; transitions show organic, non-linear edges.

### VAL-VIS-039: HUD element integrity
HP/MP globes, EXP bar, skill bar, combat log panel, quest tracker, minimap, gold display, zone label, auto-combat toggle, and auto-loot toggle must render correctly at the standard resolution (1280×720 × DPR). No element may overlap another. All interactive elements must respond to clicks.
Evidence: Start a game; verify all HUD elements are visible, non-overlapping, and functional.

### VAL-VIS-040: Loot bag and exit portal rendering
The `loot_bag` and `exit_portal` effect sprites must render correctly when dropped/placed in the game world. Loot bags must be visible against all terrain types. Exit portals must have their animation (if any) running smoothly.
Evidence: Kill a monster that drops loot; observe loot bag on multiple terrain types. Navigate to a zone exit; observe portal rendering.

### VAL-VIS-041: Minimap correctness
The minimap must correctly represent the current zone's tile layout with appropriate colors per tile type. Player position dot must track movement accurately. Monster/NPC dots (if shown) must correspond to actual positions.
Evidence: Move across a zone while watching the minimap; dot position matches actual position; tile colors match zone layout.

### VAL-VIS-042: Fog of war visual integrity
Fog of war must render with a clear distinction between: (a) unexplored (fully dark/black), (b) explored but not currently visible (dimmed), and (c) currently visible (full brightness). Transitions between states must not produce flickering or hard rectangles.
Evidence: Explore a new area; observe fog reveal animation; revisit explored area and confirm dimming.

### VAL-VIS-043: Text rendering — no truncation or overflow
All player-facing text (Chinese Simplified) must render fully within its container. No text string in any panel, tooltip, HUD element, or combat log may be truncated, clipped, or overflow its designated area. Word wrap must be enabled where text length is variable.
Evidence: Open each panel; trigger long item names, quest descriptions, and skill tooltips; all text fully visible.

### VAL-VIS-044: DPR scaling correctness
All UI elements, sprites, and text must render correctly at both DPR=1 and DPR=2 (Retina). The `px()` and `fs()` helper functions must be applied consistently. No element may use hardcoded pixel values that ignore DPR.
Evidence: Run the game at DPR=1 and DPR=2; compare screenshots; all elements proportionally correct at both scales.

### VAL-VIS-045: Menu scene visual integrity
The MenuScene (title screen, class selection, save slot UI) must render correctly with no visual defects. Class selection icons must visually represent each class. Save slot display must show character name, class, level, and zone.
Evidence: Launch the game; observe MenuScene rendering; select each class; load/view save slots.

### VAL-VIS-046: Procedural texture fallback completeness
Every texture key referenced anywhere in the codebase must have a corresponding procedural generation path in `SpriteGenerator` or its drawer registry. No texture key may result in Phaser's missing-texture placeholder (green rectangle with a line through it) during normal gameplay.
Evidence: Play through all 5 zones with all 3 classes; no missing-texture placeholders visible at any point.

### VAL-VIS-047: Skill VFX visual integrity
Skill visual effects (particles, tweens, screen shake from `SkillEffectSystem`) must render correctly when skills are used. Effects must not persist after the skill animation completes. Screen shake must not permanently offset the camera.
Evidence: Use each skill type (melee, ranged, AoE, buff) in combat; observe VFX; camera returns to normal after each effect.

---

*End of validation contract — 47 assertions covering zone palette consistency (5), sprite outline consistency (5), UI panel styling (6), tooltip readability (5), skill tree quality (6), homestead visuals (6), and regression safety (14).*
