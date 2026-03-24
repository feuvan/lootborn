import Phaser from 'phaser';

const EFFECT_DEPTH = 1500;

export class SkillEffectSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // ── Generate particle textures (call from BootScene) ─────
  static generateTextures(scene: Phaser.Scene): void {
    const g = scene.add.graphics();

    // particle_circle (16x16 soft circle)
    g.clear();
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(8, 8, 8);
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(8, 8, 6);
    g.fillStyle(0xffffff, 1.0);
    g.fillCircle(8, 8, 3);
    g.generateTexture('particle_circle', 16, 16);

    // particle_spark (12x12 diamond/star)
    g.clear();
    g.fillStyle(0xffffff, 0.9);
    g.fillPoints([
      new Phaser.Geom.Point(6, 0),
      new Phaser.Geom.Point(9, 6),
      new Phaser.Geom.Point(12, 6),
      new Phaser.Geom.Point(6, 12),
      new Phaser.Geom.Point(0, 6),
      new Phaser.Geom.Point(3, 6),
    ], true);
    g.generateTexture('particle_spark', 12, 12);

    // particle_flame (16x24 tear/flame shape)
    g.clear();
    g.fillStyle(0xff6600, 0.8);
    g.fillTriangle(8, 0, 0, 20, 16, 20);
    g.fillStyle(0xffaa00, 0.6);
    g.fillTriangle(8, 4, 3, 18, 13, 18);
    g.fillStyle(0xffdd44, 0.5);
    g.fillTriangle(8, 8, 5, 16, 11, 16);
    g.fillCircle(8, 20, 6);
    g.generateTexture('particle_flame', 16, 24);

    // particle_ice (16x16 crystal/diamond)
    g.clear();
    g.fillStyle(0x88ccff, 0.7);
    g.fillPoints([
      new Phaser.Geom.Point(8, 0),
      new Phaser.Geom.Point(16, 8),
      new Phaser.Geom.Point(8, 16),
      new Phaser.Geom.Point(0, 8),
    ], true);
    g.fillStyle(0xaaddff, 0.5);
    g.fillPoints([
      new Phaser.Geom.Point(8, 2),
      new Phaser.Geom.Point(12, 8),
      new Phaser.Geom.Point(8, 12),
      new Phaser.Geom.Point(4, 8),
    ], true);
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(6, 6, 2);
    g.generateTexture('particle_ice', 16, 16);

    // particle_arrow (8x24 thin arrow)
    g.clear();
    g.fillStyle(0xcccccc, 0.9);
    g.fillRect(2, 6, 4, 18);
    g.fillStyle(0xeeeeee, 0.9);
    g.fillTriangle(4, 0, 0, 6, 8, 6);
    g.fillStyle(0x886644, 0.7);
    g.fillRect(0, 20, 8, 4);
    g.generateTexture('particle_arrow', 8, 24);

    // particle_slash (32x8 thin arc/line)
    g.clear();
    g.fillStyle(0xffffff, 0.9);
    g.fillRoundedRect(0, 2, 32, 4, 2);
    g.fillStyle(0xffffff, 0.5);
    g.fillRoundedRect(2, 0, 28, 8, 4);
    g.generateTexture('particle_slash', 32, 8);

    // particle_lightning (4x32 jagged line)
    g.clear();
    g.lineStyle(4, 0xaaddff, 0.9);
    g.beginPath();
    g.moveTo(2, 0);
    g.lineTo(0, 8);
    g.lineTo(4, 12);
    g.lineTo(0, 20);
    g.lineTo(4, 24);
    g.lineTo(2, 32);
    g.strokePath();
    g.generateTexture('particle_lightning', 4, 32);

    // particle_smoke (24x24 soft fuzzy circle)
    g.clear();
    g.fillStyle(0x888888, 0.15);
    g.fillCircle(12, 12, 12);
    g.fillStyle(0x999999, 0.25);
    g.fillCircle(12, 12, 9);
    g.fillStyle(0xaaaaaa, 0.3);
    g.fillCircle(12, 12, 6);
    g.fillStyle(0xbbbbbb, 0.2);
    g.fillCircle(10, 10, 4);
    g.generateTexture('particle_smoke', 24, 24);

    // particle_poison (12x12 green droplet)
    g.clear();
    g.fillStyle(0x33cc33, 0.8);
    g.fillTriangle(6, 0, 0, 8, 12, 8);
    g.fillCircle(6, 8, 5);
    g.fillStyle(0x66ff66, 0.4);
    g.fillCircle(5, 7, 2);
    g.generateTexture('particle_poison', 12, 12);

    // particle_star (20x20 4-pointed star)
    g.clear();
    g.fillStyle(0xffffff, 0.9);
    g.fillPoints([
      new Phaser.Geom.Point(10, 0),
      new Phaser.Geom.Point(12.4, 7.6),
      new Phaser.Geom.Point(20, 10),
      new Phaser.Geom.Point(12.4, 12.4),
      new Phaser.Geom.Point(10, 20),
      new Phaser.Geom.Point(7.6, 12.4),
      new Phaser.Geom.Point(0, 10),
      new Phaser.Geom.Point(7.6, 7.6),
    ], true);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(10, 10, 4);
    g.generateTexture('particle_star', 20, 20);

    g.destroy();
  }

  // ── Generate 64×64 procedural skill icons ────────────────
  static generateSkillIcons(scene: Phaser.Scene): void {
    const S = 64; // icon size
    const C = S / 2; // center
    const g = scene.add.graphics();
    const P = Phaser.Geom.Point;

    const fillBg = (color: number, alpha = 0.35) => {
      g.clear();
      g.fillStyle(0x0c0c18, 1);
      g.fillRect(0, 0, S, S);
      g.fillStyle(color, alpha);
      g.fillRect(0, 0, S, S);
    };

    // ═══ WARRIOR ═══

    // slash — diagonal sword swing
    fillBg(0x663322);
    g.lineStyle(5, 0xcccccc, 0.9);
    g.beginPath(); g.moveTo(14, 8); g.lineTo(50, 56); g.strokePath();
    g.lineStyle(3, 0xffffff, 0.7);
    g.beginPath(); g.moveTo(14, 8); g.lineTo(50, 56); g.strokePath();
    g.fillStyle(0x8B4513, 1); g.fillRect(44, 48, 10, 6);
    g.fillStyle(0xddaa44, 0.8); g.fillRect(38, 46, 8, 3);
    // swing arc
    g.lineStyle(2, 0xffdd88, 0.5);
    g.beginPath();
    g.arc(32, 32, 24, Phaser.Math.DegToRad(-120), Phaser.Math.DegToRad(-30), false);
    g.strokePath();
    g.generateTexture('skill_icon_slash', S, S);

    // whirlwind — spinning blades circle
    fillBg(0x553311);
    for (let a = 0; a < 360; a += 60) {
      const rad = Phaser.Math.DegToRad(a);
      const x1 = C + Math.cos(rad) * 8, y1 = C + Math.sin(rad) * 8;
      const x2 = C + Math.cos(rad) * 26, y2 = C + Math.sin(rad) * 26;
      g.lineStyle(3, 0xccccdd, 0.8);
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokePath();
    }
    g.lineStyle(2, 0xaabbcc, 0.4);
    g.strokeCircle(C, C, 22);
    g.lineStyle(1, 0xffffff, 0.3);
    g.strokeCircle(C, C, 16);
    g.fillStyle(0xffffff, 0.15);
    g.fillCircle(C, C, 6);
    g.generateTexture('skill_icon_whirlwind', S, S);

    // war_stomp — ground impact shockwave
    fillBg(0x664422);
    g.fillStyle(0x886644, 0.8);
    g.fillTriangle(C, 12, C - 14, 44, C + 14, 44); // boot/foot
    g.fillStyle(0xaa8866, 0.6);
    g.fillTriangle(C, 16, C - 10, 40, C + 10, 40);
    // shockwave rings
    g.lineStyle(2, 0xffcc44, 0.7);
    g.strokeCircle(C, 48, 12);
    g.lineStyle(1.5, 0xffcc44, 0.4);
    g.strokeCircle(C, 48, 20);
    g.lineStyle(1, 0xffcc44, 0.2);
    g.strokeCircle(C, 48, 28);
    // cracks
    g.lineStyle(1.5, 0xddaa33, 0.6);
    g.beginPath(); g.moveTo(C, 48); g.lineTo(C - 18, 58); g.strokePath();
    g.beginPath(); g.moveTo(C, 48); g.lineTo(C + 16, 60); g.strokePath();
    g.beginPath(); g.moveTo(C, 48); g.lineTo(C - 8, 62); g.strokePath();
    g.generateTexture('skill_icon_war_stomp', S, S);

    // shield_wall — a sturdy shield
    fillBg(0x223366);
    // Shield shape
    g.fillStyle(0x556688, 0.9);
    g.fillPoints([
      new P(C, 8), new P(C + 20, 14), new P(C + 18, 42), new P(C, 56),
      new P(C - 18, 42), new P(C - 20, 14),
    ], true);
    g.fillStyle(0x6688aa, 0.7);
    g.fillPoints([
      new P(C, 12), new P(C + 16, 17), new P(C + 14, 39), new P(C, 51),
      new P(C - 14, 39), new P(C - 16, 17),
    ], true);
    // Cross emblem
    g.fillStyle(0xddcc88, 0.8);
    g.fillRect(C - 2, 18, 4, 28);
    g.fillRect(C - 10, 28, 20, 4);
    // Border
    g.lineStyle(2, 0xccbb77, 0.6);
    g.strokePoints([
      new P(C, 8), new P(C + 20, 14), new P(C + 18, 42), new P(C, 56),
      new P(C - 18, 42), new P(C - 20, 14), new P(C, 8),
    ], false);
    g.generateTexture('skill_icon_shield_wall', S, S);

    // taunt_roar — roaring shockwave mouth
    fillBg(0x662222);
    // Head silhouette
    g.fillStyle(0x996644, 0.7);
    g.fillCircle(C, 26, 14);
    g.fillStyle(0x886644, 0.6);
    g.fillRect(C - 10, 26, 20, 14);
    // Open mouth
    g.fillStyle(0xcc3333, 0.8);
    g.fillCircle(C, 36, 8);
    g.fillStyle(0x440000, 0.9);
    g.fillCircle(C, 36, 5);
    // Sound waves
    g.lineStyle(2, 0xff6644, 0.6);
    g.beginPath(); g.arc(C, 36, 14, Phaser.Math.DegToRad(-40), Phaser.Math.DegToRad(40), false); g.strokePath();
    g.lineStyle(1.5, 0xff6644, 0.4);
    g.beginPath(); g.arc(C, 36, 20, Phaser.Math.DegToRad(-35), Phaser.Math.DegToRad(35), false); g.strokePath();
    g.lineStyle(1, 0xff6644, 0.25);
    g.beginPath(); g.arc(C, 36, 26, Phaser.Math.DegToRad(-30), Phaser.Math.DegToRad(30), false); g.strokePath();
    g.generateTexture('skill_icon_taunt_roar', S, S);

    // vengeful_wrath — burning fist
    fillBg(0x662200);
    // Fist
    g.fillStyle(0xbb8855, 0.9);
    g.fillRoundedRect(C - 10, 22, 20, 22, 4);
    g.fillStyle(0xaa7744, 0.8);
    g.fillRect(C - 8, 20, 5, 8);
    g.fillRect(C - 2, 18, 5, 10);
    g.fillRect(C + 4, 20, 5, 8);
    g.fillStyle(0x997744, 0.7);
    g.fillRect(C - 12, 30, 6, 14);
    // Flames around fist
    g.fillStyle(0xff4400, 0.6);
    g.fillTriangle(C - 14, 24, C - 18, 8, C - 6, 20);
    g.fillTriangle(C, 18, C - 4, 4, C + 4, 16);
    g.fillTriangle(C + 14, 24, C + 18, 8, C + 6, 20);
    g.fillStyle(0xffaa00, 0.5);
    g.fillTriangle(C - 10, 22, C - 12, 12, C - 4, 20);
    g.fillTriangle(C + 10, 22, C + 12, 12, C + 4, 20);
    g.fillStyle(0xffdd44, 0.3);
    g.fillTriangle(C, 20, C - 2, 10, C + 2, 18);
    g.generateTexture('skill_icon_vengeful_wrath', S, S);

    // charge — rushing warrior with speed lines
    fillBg(0x553311);
    // Speed lines (horizontal)
    g.lineStyle(2, 0xffcc44, 0.5);
    g.beginPath(); g.moveTo(4, 18); g.lineTo(28, 18); g.strokePath();
    g.lineStyle(2, 0xffcc44, 0.4);
    g.beginPath(); g.moveTo(6, 30); g.lineTo(26, 30); g.strokePath();
    g.lineStyle(1.5, 0xffcc44, 0.3);
    g.beginPath(); g.moveTo(8, 42); g.lineTo(24, 42); g.strokePath();
    // Warrior silhouette charging forward
    g.fillStyle(0xccaa66, 0.8);
    g.fillCircle(C + 6, 20, 8); // head
    g.fillStyle(0xbb9955, 0.7);
    g.fillTriangle(C - 4, 52, C + 6, 26, C + 16, 52); // body lunging
    // Shoulder/weapon forward
    g.fillStyle(0xddbb77, 0.9);
    g.fillRect(C + 10, 22, 14, 4);
    // Dust trail behind
    g.fillStyle(0xccbb99, 0.3);
    g.fillCircle(12, 44, 6);
    g.fillCircle(8, 36, 5);
    g.fillCircle(14, 50, 4);
    g.generateTexture('skill_icon_charge', S, S);

    // lethal_strike — heavy blade with X mark
    fillBg(0x441111);
    // Large blade pointing down
    g.fillStyle(0xdddddd, 0.9);
    g.fillPoints([new P(C, 6), new P(C + 7, 38), new P(C, 44), new P(C - 7, 38)], true);
    g.fillStyle(0xeeeeee, 0.5);
    g.fillPoints([new P(C, 8), new P(C + 3, 36), new P(C, 42), new P(C - 3, 36)], true);
    // Guard and handle
    g.fillStyle(0xddaa44, 0.9);
    g.fillRect(C - 12, 42, 24, 4);
    g.fillStyle(0x664422, 0.9);
    g.fillRect(C - 3, 46, 6, 12);
    // X critical mark
    g.lineStyle(3, 0xff2222, 0.8);
    g.beginPath(); g.moveTo(C - 16, 12); g.lineTo(C + 16, 32); g.strokePath();
    g.beginPath(); g.moveTo(C + 16, 12); g.lineTo(C - 16, 32); g.strokePath();
    g.generateTexture('skill_icon_lethal_strike', S, S);

    // dual_wield_mastery — two crossed swords
    fillBg(0x443322);
    // Left sword
    g.fillStyle(0xcccccc, 0.9);
    g.fillPoints([new P(14, 8), new P(18, 10), new P(38, 42), new P(34, 44)], true);
    g.fillStyle(0xddaa44, 0.8);
    g.fillRect(32, 42, 10, 3);
    g.fillStyle(0x664422, 0.8);
    g.fillRect(35, 45, 4, 8);
    // Right sword
    g.fillStyle(0xcccccc, 0.9);
    g.fillPoints([new P(50, 8), new P(46, 10), new P(26, 42), new P(30, 44)], true);
    g.fillStyle(0xddaa44, 0.8);
    g.fillRect(22, 42, 10, 3);
    g.fillStyle(0x664422, 0.8);
    g.fillRect(25, 45, 4, 8);
    // Golden glow at cross point
    g.fillStyle(0xddcc88, 0.4);
    g.fillCircle(C, 28, 8);
    g.fillStyle(0xffdd99, 0.2);
    g.fillCircle(C, 28, 12);
    g.generateTexture('skill_icon_dual_wield_mastery', S, S);

    // iron_fortress — steel shield with rivets
    fillBg(0x223344);
    // Shield body (steel blue)
    g.fillStyle(0x667788, 0.9);
    g.fillPoints([
      new P(C, 6), new P(C + 22, 16), new P(C + 20, 44), new P(C, 58),
      new P(C - 20, 44), new P(C - 22, 16),
    ], true);
    g.fillStyle(0x778899, 0.7);
    g.fillPoints([
      new P(C, 10), new P(C + 18, 18), new P(C + 16, 41), new P(C, 53),
      new P(C - 16, 41), new P(C - 18, 18),
    ], true);
    // Central vertical bar
    g.fillStyle(0x88aacc, 0.6);
    g.fillRect(C - 2, 14, 4, 38);
    // Horizontal bar
    g.fillRect(C - 14, 28, 28, 4);
    // Rivets
    g.fillStyle(0xaabbcc, 0.8);
    g.fillCircle(C - 12, 20, 2);
    g.fillCircle(C + 12, 20, 2);
    g.fillCircle(C - 10, 42, 2);
    g.fillCircle(C + 10, 42, 2);
    // Border
    g.lineStyle(2, 0x88aacc, 0.6);
    g.strokePoints([
      new P(C, 6), new P(C + 22, 16), new P(C + 20, 44), new P(C, 58),
      new P(C - 20, 44), new P(C - 22, 16), new P(C, 6),
    ], false);
    g.generateTexture('skill_icon_iron_fortress', S, S);

    // unyielding — cracked but standing pillar
    fillBg(0x332211);
    // Stone pillar
    g.fillStyle(0xaa8866, 0.8);
    g.fillRect(C - 10, 10, 20, 46);
    g.fillStyle(0xccaa88, 0.6);
    g.fillRect(C - 8, 12, 16, 42);
    // Cracks in pillar
    g.lineStyle(2, 0x664422, 0.7);
    g.beginPath(); g.moveTo(C - 2, 14); g.lineTo(C + 4, 24); g.lineTo(C - 3, 32); g.strokePath();
    g.beginPath(); g.moveTo(C + 3, 34); g.lineTo(C - 4, 42); g.strokePath();
    // Base
    g.fillStyle(0x886644, 0.9);
    g.fillRect(C - 14, 52, 28, 6);
    g.fillRect(C - 12, 8, 24, 4);
    // Golden glow (resilience)
    g.fillStyle(0xddaa44, 0.3);
    g.fillCircle(C, C, 16);
    g.fillStyle(0xffcc66, 0.15);
    g.fillCircle(C, C, 22);
    g.generateTexture('skill_icon_unyielding', S, S);

    // life_regen — green heart with sparkles
    fillBg(0x112211);
    // Heart shape using two circles and a triangle
    g.fillStyle(0x33aa33, 0.8);
    g.fillCircle(C - 8, 22, 10);
    g.fillCircle(C + 8, 22, 10);
    g.fillTriangle(C - 18, 26, C, 50, C + 18, 26);
    g.fillStyle(0x44cc44, 0.6);
    g.fillCircle(C - 8, 22, 7);
    g.fillCircle(C + 8, 22, 7);
    g.fillTriangle(C - 14, 26, C, 46, C + 14, 26);
    // Inner glow
    g.fillStyle(0x66ff66, 0.3);
    g.fillCircle(C - 4, 24, 4);
    // Rising sparkles
    g.fillStyle(0x88ffaa, 0.7);
    g.fillCircle(C - 12, 12, 2);
    g.fillCircle(C + 14, 14, 1.5);
    g.fillCircle(C + 4, 8, 2);
    g.fillCircle(C - 6, 6, 1.5);
    // Plus sign (healing)
    g.fillStyle(0xffffff, 0.5);
    g.fillRect(C - 1.5, 18, 3, 14);
    g.fillRect(C - 6, 23, 12, 3);
    g.generateTexture('skill_icon_life_regen', S, S);

    // frenzy — red rage face/energy
    fillBg(0x331111);
    // Red energy swirl
    g.lineStyle(3, 0xcc2222, 0.7);
    g.beginPath();
    g.arc(C, C, 20, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(270), false);
    g.strokePath();
    g.lineStyle(2, 0xff4444, 0.5);
    g.beginPath();
    g.arc(C, C, 14, Phaser.Math.DegToRad(90), Phaser.Math.DegToRad(360), false);
    g.strokePath();
    // Angry eyes
    g.fillStyle(0xff4444, 0.9);
    g.fillPoints([new P(C - 12, C - 4), new P(C - 4, C - 8), new P(C - 4, C), new P(C - 12, C)], true);
    g.fillPoints([new P(C + 12, C - 4), new P(C + 4, C - 8), new P(C + 4, C), new P(C + 12, C)], true);
    // Clenched teeth
    g.fillStyle(0xcc2222, 0.8);
    g.fillRect(C - 8, C + 6, 16, 6);
    g.lineStyle(1.5, 0xffcccc, 0.7);
    g.beginPath(); g.moveTo(C - 4, C + 6); g.lineTo(C - 4, C + 12); g.strokePath();
    g.beginPath(); g.moveTo(C, C + 6); g.lineTo(C, C + 12); g.strokePath();
    g.beginPath(); g.moveTo(C + 4, C + 6); g.lineTo(C + 4, C + 12); g.strokePath();
    // Red aura glow
    g.fillStyle(0xff2222, 0.15);
    g.fillCircle(C, C, 26);
    g.generateTexture('skill_icon_frenzy', S, S);

    // bleed_strike — slashing blade with blood drops
    fillBg(0x331111);
    // Blade (angled slash)
    g.fillStyle(0xcccccc, 0.9);
    g.fillPoints([new P(14, 8), new P(20, 10), new P(48, 44), new P(42, 48)], true);
    g.fillStyle(0xeeeeee, 0.5);
    g.fillPoints([new P(16, 10), new P(19, 12), new P(46, 44), new P(44, 46)], true);
    // Guard + handle
    g.fillStyle(0x886644, 0.9);
    g.fillRect(42, 44, 12, 3);
    g.fillStyle(0x664422, 0.8);
    g.fillRoundedRect(48, 47, 6, 10, 2);
    // Blood drops falling from blade
    g.fillStyle(0xcc2222, 0.9);
    g.fillCircle(24, 26, 3);
    g.fillTriangle(24, 23, 22, 26, 26, 26);
    g.fillStyle(0xaa1111, 0.8);
    g.fillCircle(30, 36, 2.5);
    g.fillTriangle(30, 33, 28, 36, 32, 36);
    g.fillStyle(0x991111, 0.7);
    g.fillCircle(20, 40, 2);
    g.fillCircle(36, 48, 2);
    g.generateTexture('skill_icon_bleed_strike', S, S);

    // rampage — explosive berserker whirlwind with red energy
    fillBg(0x441111);
    // Central figure silhouette (berserker pose)
    g.fillStyle(0xaa6633, 0.7);
    g.fillCircle(C, 16, 7); // head
    g.fillStyle(0x995522, 0.6);
    g.fillTriangle(C - 12, 50, C, 20, C + 12, 50); // body
    // Spinning blade arcs around figure
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const ax = C + Math.cos(angle) * 20;
      const ay = C + Math.sin(angle) * 18;
      g.lineStyle(3, 0xff4444, 0.8);
      g.beginPath();
      g.arc(ax, ay, 8, angle - 0.8, angle + 0.8, false);
      g.strokePath();
    }
    // Red energy ring
    g.lineStyle(2, 0xcc2222, 0.7);
    g.strokeCircle(C, C, 24);
    g.lineStyle(1.5, 0xff4444, 0.4);
    g.strokeCircle(C, C, 20);
    // Impact sparks
    g.fillStyle(0xffaa00, 0.7);
    g.fillCircle(C - 18, 14, 2);
    g.fillCircle(C + 20, 22, 2.5);
    g.fillCircle(C - 14, 48, 2);
    g.fillCircle(C + 16, 46, 2);
    // Red aura glow
    g.fillStyle(0xff2222, 0.15);
    g.fillCircle(C, C, 26);
    g.generateTexture('skill_icon_rampage', S, S);

    // ═══ MAGE ═══

    // fireball — flaming orb
    fillBg(0x441100);
    g.fillStyle(0xff4400, 0.7);
    g.fillCircle(C, C + 4, 16);
    g.fillStyle(0xff6600, 0.8);
    g.fillCircle(C, C + 4, 12);
    g.fillStyle(0xffaa00, 0.9);
    g.fillCircle(C, C + 4, 8);
    g.fillStyle(0xffdd44, 0.8);
    g.fillCircle(C, C + 2, 4);
    // Flame trail
    g.fillStyle(0xff4400, 0.5);
    g.fillTriangle(C - 8, C - 4, C, C - 24, C + 8, C - 4);
    g.fillStyle(0xff6600, 0.4);
    g.fillTriangle(C - 4, C - 6, C + 3, C - 18, C + 6, C - 2);
    g.fillStyle(0xffaa00, 0.3);
    g.fillTriangle(C - 2, C - 8, C, C - 14, C + 2, C - 4);
    g.generateTexture('skill_icon_fireball', S, S);

    // meteor — falling rock with fire trail
    fillBg(0x331100);
    // Fire trail (upper left)
    g.fillStyle(0xff4400, 0.4);
    g.fillTriangle(8, 4, 22, 18, 12, 22);
    g.fillStyle(0xff6600, 0.3);
    g.fillTriangle(12, 8, 26, 22, 16, 26);
    g.fillStyle(0xffaa00, 0.2);
    g.fillTriangle(16, 12, 28, 26, 20, 28);
    // Rock
    g.fillStyle(0x664422, 0.9);
    g.fillCircle(C + 4, C + 6, 14);
    g.fillStyle(0x886644, 0.7);
    g.fillCircle(C + 4, C + 6, 10);
    g.fillStyle(0xaa8866, 0.4);
    g.fillCircle(C + 2, C + 3, 6);
    // Impact glow
    g.fillStyle(0xff6600, 0.3);
    g.fillCircle(C + 4, C + 6, 20);
    g.generateTexture('skill_icon_meteor', S, S);

    // blizzard — snowflakes and ice shards
    fillBg(0x112244);
    // Snowflakes (simple crosses at various positions)
    const snowPositions = [[18, 14], [42, 18], [26, 38], [46, 44], [14, 48]];
    for (const [sx, sy] of snowPositions) {
      g.lineStyle(1.5, 0xccddff, 0.7);
      g.beginPath(); g.moveTo(sx - 4, sy); g.lineTo(sx + 4, sy); g.strokePath();
      g.beginPath(); g.moveTo(sx, sy - 4); g.lineTo(sx, sy + 4); g.strokePath();
      g.beginPath(); g.moveTo(sx - 3, sy - 3); g.lineTo(sx + 3, sy + 3); g.strokePath();
      g.beginPath(); g.moveTo(sx + 3, sy - 3); g.lineTo(sx - 3, sy + 3); g.strokePath();
    }
    // Wind lines
    g.lineStyle(1, 0x88aadd, 0.3);
    g.beginPath(); g.moveTo(4, 20); g.lineTo(60, 16); g.strokePath();
    g.beginPath(); g.moveTo(8, 34); g.lineTo(56, 30); g.strokePath();
    g.beginPath(); g.moveTo(2, 48); g.lineTo(58, 46); g.strokePath();
    // Central ice shard
    g.fillStyle(0x88ccff, 0.6);
    g.fillPoints([new P(C, 10), new P(C + 6, C), new P(C, C + 10), new P(C - 6, C)], true);
    g.generateTexture('skill_icon_blizzard', S, S);

    // ice_armor — crystalline armor/shell
    fillBg(0x113355);
    // Body outline
    g.fillStyle(0x88ccff, 0.5);
    g.fillPoints([
      new P(C, 6), new P(C + 18, 18), new P(C + 16, 46),
      new P(C, 58), new P(C - 16, 46), new P(C - 18, 18),
    ], true);
    // Crystal facets
    g.fillStyle(0xaaddff, 0.6);
    g.fillPoints([new P(C, 10), new P(C + 12, 20), new P(C, 34), new P(C - 12, 20)], true);
    g.fillStyle(0xcceeFF, 0.4);
    g.fillPoints([new P(C, 14), new P(C + 8, 22), new P(C, 30), new P(C - 8, 22)], true);
    // Shine
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(C - 4, 18, 3);
    // Border
    g.lineStyle(1.5, 0x88ccff, 0.6);
    g.strokePoints([
      new P(C, 6), new P(C + 18, 18), new P(C + 16, 46),
      new P(C, 58), new P(C - 16, 46), new P(C - 18, 18), new P(C, 6),
    ], false);
    g.generateTexture('skill_icon_ice_armor', S, S);

    // chain_lightning — branching lightning bolts
    fillBg(0x112255);
    // Main bolt
    g.lineStyle(3, 0x88aaff, 0.9);
    g.beginPath();
    g.moveTo(12, 6); g.lineTo(20, 18); g.lineTo(14, 24);
    g.lineTo(28, 36); g.lineTo(22, 40); g.lineTo(34, 54);
    g.strokePath();
    g.lineStyle(1.5, 0xccddff, 0.6);
    g.beginPath();
    g.moveTo(12, 6); g.lineTo(20, 18); g.lineTo(14, 24);
    g.lineTo(28, 36); g.lineTo(22, 40); g.lineTo(34, 54);
    g.strokePath();
    // Branch 1
    g.lineStyle(2, 0x88aaff, 0.6);
    g.beginPath(); g.moveTo(20, 18); g.lineTo(36, 22); g.lineTo(48, 16); g.strokePath();
    // Branch 2
    g.beginPath(); g.moveTo(28, 36); g.lineTo(42, 40); g.lineTo(52, 48); g.strokePath();
    // Glow at origin
    g.fillStyle(0xaaccff, 0.3);
    g.fillCircle(12, 6, 6);
    g.generateTexture('skill_icon_chain_lightning', S, S);

    // mana_shield — arcane bubble shield
    fillBg(0x220044);
    // Outer shield circle
    g.lineStyle(3, 0x9966ff, 0.6);
    g.strokeCircle(C, C, 24);
    g.lineStyle(1.5, 0xbb88ff, 0.4);
    g.strokeCircle(C, C, 20);
    // Inner glow
    g.fillStyle(0x6633cc, 0.25);
    g.fillCircle(C, C, 22);
    g.fillStyle(0x8855ff, 0.15);
    g.fillCircle(C, C, 16);
    // Rune/symbol inside — simple star
    g.lineStyle(1.5, 0xcc99ff, 0.7);
    const runeR = 10;
    for (let i = 0; i < 5; i++) {
      const a1 = Phaser.Math.DegToRad(i * 72 - 90);
      const a2 = Phaser.Math.DegToRad(((i + 2) % 5) * 72 - 90);
      g.beginPath();
      g.moveTo(C + Math.cos(a1) * runeR, C + Math.sin(a1) * runeR);
      g.lineTo(C + Math.cos(a2) * runeR, C + Math.sin(a2) * runeR);
      g.strokePath();
    }
    // Sparkles
    g.fillStyle(0xddbbff, 0.6);
    g.fillCircle(C - 8, C - 12, 2);
    g.fillCircle(C + 10, C - 6, 1.5);
    g.fillCircle(C + 6, C + 14, 2);
    g.generateTexture('skill_icon_mana_shield', S, S);

    // ═══ ROGUE ═══

    // backstab — dagger pointing down
    fillBg(0x222233);
    // Blade
    g.fillStyle(0xccccdd, 0.9);
    g.fillPoints([new P(C, 8), new P(C + 5, 36), new P(C, 40), new P(C - 5, 36)], true);
    g.fillStyle(0xeeeeff, 0.5);
    g.fillPoints([new P(C, 10), new P(C + 2, 34), new P(C, 38), new P(C - 2, 34)], true);
    // Guard
    g.fillStyle(0xddaa44, 0.9);
    g.fillRect(C - 10, 38, 20, 4);
    // Handle
    g.fillStyle(0x664422, 0.9);
    g.fillRect(C - 3, 42, 6, 14);
    g.fillStyle(0x553311, 0.7);
    g.fillRect(C - 4, 44, 8, 3);
    g.fillRect(C - 4, 50, 8, 3);
    // Blood drops
    g.fillStyle(0xcc2222, 0.6);
    g.fillCircle(C + 8, 20, 2.5);
    g.fillCircle(C + 12, 26, 2);
    g.fillCircle(C + 6, 30, 1.5);
    g.generateTexture('skill_icon_backstab', S, S);

    // poison_blade — dripping green blade
    fillBg(0x113311);
    // Blade (angled)
    g.fillStyle(0x99aa88, 0.9);
    g.fillPoints([new P(18, 8), new P(24, 10), new P(46, 40), new P(42, 44)], true);
    g.fillStyle(0xbbcc99, 0.5);
    g.fillPoints([new P(20, 10), new P(23, 12), new P(44, 40), new P(42, 42)], true);
    // Guard + handle
    g.fillStyle(0x556633, 0.9);
    g.fillRect(40, 40, 14, 4);
    g.fillStyle(0x664422, 0.9);
    g.fillRoundedRect(46, 44, 6, 12, 2);
    // Poison drips
    g.fillStyle(0x33cc33, 0.8);
    g.fillCircle(28, 24, 3);
    g.fillTriangle(28, 21, 26, 24, 30, 24);
    g.fillStyle(0x44dd44, 0.7);
    g.fillCircle(34, 34, 2.5);
    g.fillTriangle(34, 31, 32, 34, 36, 34);
    g.fillStyle(0x22bb22, 0.6);
    g.fillCircle(24, 36, 2);
    g.fillCircle(30, 44, 2.5);
    g.generateTexture('skill_icon_poison_blade', S, S);

    // vanish — shadow cloak / smoke
    fillBg(0x111122);
    // Dark figure silhouette
    g.fillStyle(0x222244, 0.7);
    g.fillCircle(C, 18, 10); // head
    g.fillTriangle(C - 16, 56, C, 22, C + 16, 56); // cloak
    g.fillStyle(0x333355, 0.5);
    g.fillCircle(C, 18, 8);
    g.fillTriangle(C - 12, 52, C, 24, C + 12, 52);
    // Fade/dissolve particles
    g.fillStyle(0x555588, 0.4);
    g.fillCircle(C - 14, 32, 4);
    g.fillCircle(C + 16, 28, 3);
    g.fillCircle(C - 10, 46, 3.5);
    g.fillCircle(C + 12, 44, 4);
    g.fillStyle(0x444477, 0.25);
    g.fillCircle(C - 20, 38, 5);
    g.fillCircle(C + 20, 36, 4.5);
    g.fillCircle(C, 52, 3);
    // Glowing eyes
    g.fillStyle(0xccaaff, 0.8);
    g.fillCircle(C - 4, 17, 1.5);
    g.fillCircle(C + 4, 17, 1.5);
    g.generateTexture('skill_icon_vanish', S, S);

    // multishot — three arrows fanning out
    fillBg(0x222222);
    // Central arrow
    g.fillStyle(0xcccccc, 0.9);
    g.fillRect(C - 1.5, 14, 3, 30);
    g.fillStyle(0xeeeeee, 0.9);
    g.fillTriangle(C, 8, C - 4, 16, C + 4, 16);
    g.fillStyle(0x886644, 0.7);
    g.fillRect(C - 3, 42, 6, 4);
    // Left arrow
    g.fillStyle(0xbbbbbb, 0.7);
    const la = Phaser.Math.DegToRad(-15);
    g.save?.();
    g.fillRect(12, 18, 3, 26);
    g.fillTriangle(13, 12, 8, 20, 18, 20);
    g.fillStyle(0x886644, 0.5);
    g.fillRect(10, 42, 6, 4);
    // Right arrow
    g.fillStyle(0xbbbbbb, 0.7);
    g.fillRect(48, 18, 3, 26);
    g.fillTriangle(49, 12, 44, 20, 54, 20);
    g.fillStyle(0x886644, 0.5);
    g.fillRect(46, 42, 6, 4);
    g.generateTexture('skill_icon_multishot', S, S);

    // arrow_rain — arrows falling from sky
    fillBg(0x1a1a22);
    // Sky cloud/arc
    g.fillStyle(0x334455, 0.5);
    g.fillCircle(C - 8, 10, 10);
    g.fillCircle(C + 8, 10, 10);
    g.fillCircle(C, 6, 10);
    // Falling arrows
    const arrowXs = [14, 26, 38, 50];
    for (const ax of arrowXs) {
      const ay = 18 + (ax % 7) * 3;
      g.fillStyle(0xbbbbcc, 0.8);
      g.fillRect(ax - 1, ay, 2, 22);
      g.fillStyle(0xddddee, 0.9);
      g.fillTriangle(ax, ay + 22, ax - 3, ay + 16, ax + 3, ay + 16);
      g.fillStyle(0x886644, 0.5);
      g.fillRect(ax - 2, ay, 4, 3);
    }
    // Impact marks on ground
    g.lineStyle(1, 0xffcc44, 0.4);
    g.strokeCircle(20, 56, 4);
    g.strokeCircle(44, 54, 3);
    g.generateTexture('skill_icon_arrow_rain', S, S);

    // explosive_trap — bomb/mine
    fillBg(0x331111);
    // Mine body
    g.fillStyle(0x664444, 0.9);
    g.fillCircle(C, C + 4, 14);
    g.fillStyle(0x885555, 0.7);
    g.fillCircle(C, C + 4, 10);
    // Danger symbol (skull-like: two dots + line)
    g.fillStyle(0xff4444, 0.8);
    g.fillCircle(C - 5, C + 2, 2.5);
    g.fillCircle(C + 5, C + 2, 2.5);
    g.fillRect(C - 4, C + 7, 8, 2);
    // Fuse on top
    g.lineStyle(2, 0xaa8844, 0.8);
    g.beginPath(); g.moveTo(C, C - 10); g.lineTo(C + 6, C - 18); g.strokePath();
    // Spark at fuse tip
    g.fillStyle(0xffdd44, 0.9);
    g.fillCircle(C + 6, C - 18, 3);
    g.fillStyle(0xffaa00, 0.5);
    g.fillCircle(C + 6, C - 18, 5);
    // Explosion lines
    g.lineStyle(1.5, 0xff6633, 0.4);
    for (let a = 0; a < 360; a += 45) {
      const rad = Phaser.Math.DegToRad(a);
      g.beginPath();
      g.moveTo(C + Math.cos(rad) * 18, C + 4 + Math.sin(rad) * 18);
      g.lineTo(C + Math.cos(rad) * 26, C + 4 + Math.sin(rad) * 26);
      g.strokePath();
    }
    g.generateTexture('skill_icon_explosive_trap', S, S);

    g.destroy();
  }

  // ── Play a skill effect ──────────────────────────────────
  play(
    skillId: string,
    casterX: number,
    casterY: number,
    targetX?: number,
    targetY?: number,
    targets?: { x: number; y: number }[],
  ): void {
    switch (skillId) {
      // Warrior
      case 'slash': this.effectSlash(casterX, casterY); break;
      case 'whirlwind': this.effectWhirlwind(casterX, casterY); break;
      case 'shield_wall': this.effectShieldWall(casterX, casterY); break;
      case 'war_stomp': this.effectWarStomp(casterX, casterY); break;
      case 'taunt_roar': this.effectTauntRoar(casterX, casterY); break;
      case 'vengeful_wrath': this.effectVengefulWrath(casterX, casterY); break;
      case 'charge': this.effectCharge(casterX, casterY, targetX ?? casterX, targetY ?? casterY); break;
      case 'lethal_strike': this.effectLethalStrike(targetX ?? casterX, targetY ?? casterY); break;
      case 'iron_fortress': this.effectIronFortress(casterX, casterY); break;
      case 'frenzy': this.effectFrenzy(casterX, casterY); break;
      case 'bleed_strike': this.effectBleedStrike(targetX ?? casterX, targetY ?? casterY); break;
      case 'dual_wield_mastery': this.effectDualWieldMastery(casterX, casterY); break;
      case 'unyielding': this.effectUnyielding(casterX, casterY); break;
      case 'life_regen': this.effectLifeRegen(casterX, casterY); break;
      case 'rampage': this.effectRampage(casterX, casterY); break;
      // Mage
      case 'fireball': this.effectFireball(casterX, casterY, targetX ?? casterX, targetY ?? casterY); break;
      case 'blizzard': this.effectBlizzard(targetX ?? casterX, targetY ?? casterY); break;
      case 'mana_shield': this.effectManaShield(casterX, casterY); break;
      case 'meteor': this.effectMeteor(targetX ?? casterX, targetY ?? casterY); break;
      case 'ice_armor': this.effectIceArmor(casterX, casterY); break;
      case 'chain_lightning': this.effectChainLightning(casterX, casterY, targets ?? []); break;
      // Rogue
      case 'backstab': this.effectBackstab(targetX ?? casterX, targetY ?? casterY); break;
      case 'poison_blade': this.effectPoisonBlade(casterX, casterY); break;
      case 'multishot': this.effectMultishot(casterX, casterY); break;
      case 'vanish': this.effectVanish(casterX, casterY); break;
      case 'explosive_trap': this.effectExplosiveTrap(targetX ?? casterX, targetY ?? casterY); break;
      case 'arrow_rain': this.effectArrowRain(targetX ?? casterX, targetY ?? casterY); break;
      default:
        this.effectGeneric(targetX ?? casterX, targetY ?? casterY, 0xf39c12);
        break;
    }
  }

  // ── Helpers ────────────────────────────────────────────────

  private burst(x: number, y: number, tex: string, tint: number, count: number, cfg: {
    speed?: number; lifespan?: number; scale?: { start: number; end: number };
    alpha?: { start: number; end: number }; blend?: Phaser.BlendModes | string;
    gravityY?: number; angle?: { min: number; max: number };
  } = {}): Phaser.GameObjects.Particles.ParticleEmitter {
    const e = this.scene.add.particles(x, y, tex, {
      tint,
      speed: cfg.speed ?? 120,
      lifespan: cfg.lifespan ?? 500,
      scale: cfg.scale ?? { start: 0.8, end: 0 },
      alpha: cfg.alpha ?? { start: 1, end: 0 },
      blendMode: (cfg.blend as Phaser.BlendModes) ?? 'ADD',
      gravityY: cfg.gravityY ?? 0,
      angle: cfg.angle ?? { min: 0, max: 360 },
      emitting: false,
    }).setDepth(EFFECT_DEPTH);
    e.explode(count);
    this.scene.time.delayedCall((cfg.lifespan ?? 500) + 200, () => e.destroy());
    return e;
  }

  private flash(x: number, y: number, color: number, radius: number, dur = 200): void {
    const f = this.scene.add.circle(x, y, radius, color, 0.8).setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
    this.scene.tweens.add({ targets: f, scaleX: 3, scaleY: 3, alpha: 0, duration: dur, ease: 'Power3', onComplete: () => f.destroy() });
  }

  private ring(x: number, y: number, color: number, startR: number, endScale: number, dur: number, lineW = 3): void {
    const g = this.scene.add.graphics().setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
    g.lineStyle(lineW, color, 0.9);
    g.strokeCircle(x, y, startR);
    this.scene.tweens.add({ targets: g, scaleX: endScale, scaleY: endScale * 0.6, alpha: 0, duration: dur, ease: 'Power2', onComplete: () => g.destroy() });
  }

  // ── Play basic attack effect ─────────────────────────────
  playAttack(attackerX: number, attackerY: number, targetX: number, targetY: number, isPlayer: boolean): void {
    const x = targetX;
    const y = targetY - 16;
    const angle = Phaser.Math.RadToDeg(Math.atan2(targetY - attackerY, targetX - attackerX));
    const s = isPlayer ? 1 : 0.7;

    // White slash line
    const slash = this.scene.add.graphics().setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
    slash.lineStyle(4 * s, 0xffffff, 1);
    slash.beginPath();
    const len = 24 * s;
    const rad = Phaser.Math.DegToRad(angle);
    slash.moveTo(x - Math.cos(rad) * len, y - Math.sin(rad) * len);
    slash.lineTo(x + Math.cos(rad) * len, y + Math.sin(rad) * len);
    slash.strokePath();
    this.scene.tweens.add({ targets: slash, alpha: 0, duration: 250, ease: 'Power2', onComplete: () => slash.destroy() });

    this.burst(x, y, 'particle_spark', 0xffffaa, 8, { speed: 100 * s, lifespan: 300, scale: { start: 1 * s, end: 0 } });
  }

  // ── Play monster attack effect ───────────────────────────
  playMonsterAttack(x: number, y: number): void {
    const cy = y - 16;
    const claw = this.scene.add.graphics().setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
    for (let i = -1; i <= 1; i++) {
      claw.lineStyle(3, 0xff4444, 0.9);
      claw.beginPath();
      claw.moveTo(x + i * 8 - 6, cy - 14);
      claw.lineTo(x + i * 8 + 6, cy + 14);
      claw.strokePath();
    }
    this.scene.tweens.add({ targets: claw, alpha: 0, duration: 300, ease: 'Power2', onComplete: () => claw.destroy() });
    this.burst(x, cy, 'particle_circle', 0xff4444, 8, { speed: 80, lifespan: 350, scale: { start: 0.8, end: 0 } });
  }

  playMonsterRangedAttack(sx: number, sy: number, tx: number, ty: number, color: number = 0xff6600): void {
    const startX = sx, startY = sy - 16, endX = tx, endY = ty - 16;
    const dist = Phaser.Math.Distance.Between(startX, startY, endX, endY);
    const duration = Math.max(200, Math.min(500, dist * 2));

    const proj = this.scene.add.circle(startX, startY, 7, color, 1).setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
    const glow = this.scene.add.circle(startX, startY, 14, color, 0.4).setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);

    const trail = this.scene.add.particles(startX, startY, 'particle_circle', {
      follow: proj, tint: color, speed: { min: 10, max: 30 }, lifespan: 250,
      scale: { start: 0.7, end: 0 }, alpha: { start: 0.8, end: 0 }, blendMode: 'ADD',
      frequency: 20, quantity: 2,
    }).setDepth(EFFECT_DEPTH);

    this.scene.tweens.add({
      targets: [proj, glow], x: endX, y: endY, duration, ease: 'Power1',
      onComplete: () => {
        proj.destroy(); glow.destroy(); trail.stop(); this.scene.time.delayedCall(300, () => trail.destroy());
        this.burst(endX, endY, 'particle_spark', color, 10, { speed: 120, lifespan: 350 });
        this.flash(endX, endY, color, 8);
      },
    });
  }

  // ══════════════════════════════════════════════════════════
  // WARRIOR EFFECTS
  // ══════════════════════════════════════════════════════════

  private effectSlash(cx: number, cy: number): void {
    const y = cy - 16;

    // Bright wide arc sweep using graphics + additive blend
    for (let i = 0; i < 3; i++) {
      const arc = this.scene.add.graphics().setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
      const startAngle = Phaser.Math.DegToRad(-140 + i * 15);
      const endAngle = Phaser.Math.DegToRad(-20 + i * 15);
      const radius = 28 + i * 10;
      const colors = [0xffffff, 0xf1c40f, 0xff8800];
      arc.lineStyle(4 - i, colors[i], 1);
      arc.beginPath();
      const steps = 16;
      for (let s = 0; s <= steps; s++) {
        const a = startAngle + (endAngle - startAngle) * (s / steps);
        const px = cx + Math.cos(a) * radius;
        const py = y + Math.sin(a) * radius;
        if (s === 0) arc.moveTo(px, py); else arc.lineTo(px, py);
      }
      arc.strokePath();
      this.scene.tweens.add({ targets: arc, scaleX: 1.8, scaleY: 1.8, alpha: 0, duration: 350, delay: i * 30, ease: 'Power2', onComplete: () => arc.destroy() });
    }

    // Bright spark particle burst along the arc
    this.burst(cx, y, 'particle_spark', 0xf1c40f, 14, { speed: 160, lifespan: 400, scale: { start: 1.2, end: 0 } });
    this.flash(cx + 12, y - 6, 0xffffff, 10, 150);
  }

  private effectWhirlwind(cx: number, cy: number): void {
    const y = cy - 16;

    // Spinning ring particles using emit zone
    const circleZone = new Phaser.Geom.Circle(0, 0, 32);
    const spinner = this.scene.add.particles(cx, y, 'particle_slash', {
      emitZone: { type: 'edge' as const, source: circleZone as any, quantity: 24 },
      lifespan: 600, scale: { start: 1.0, end: 0.3 }, alpha: { start: 0.9, end: 0 },
      tint: [0xffffff, 0xccccdd, 0xaabbcc], blendMode: 'ADD',
      rotate: { min: 0, max: 360 }, speed: { min: 20, max: 60 },
      frequency: 40, stopAfter: 24,
    }).setDepth(EFFECT_DEPTH);
    spinner.on('complete', () => { this.scene.time.delayedCall(700, () => spinner.destroy()); });

    // Dust cloud
    const dust = this.scene.add.particles(cx, y, 'particle_smoke', {
      emitZone: { type: 'random' as const, source: new Phaser.Geom.Circle(0, 0, 28) as any },
      lifespan: 500, scale: { start: 0.8, end: 1.5 }, alpha: { start: 0.5, end: 0 },
      tint: 0xccbb99, speed: { min: 40, max: 100 }, angle: { min: 0, max: 360 },
      frequency: 30, stopAfter: 16,
    }).setDepth(EFFECT_DEPTH - 1);
    dust.on('complete', () => { this.scene.time.delayedCall(600, () => dust.destroy()); });

    // Central white flash
    this.flash(cx, y, 0xffffff, 12, 200);

    // Expanding blade rings
    for (let r = 0; r < 3; r++) {
      this.ring(cx, y, 0xccccff, 10 + r * 4, 4 + r, 500 + r * 100, 2);
    }
  }

  private effectShieldWall(cx: number, cy: number): void {
    const y = cy - 16;

    // Golden hexagonal shield segments
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const radius = 30;
      const hx = cx + Math.cos(angle) * radius;
      const hy = y + Math.sin(angle) * radius * 0.6;
      const hex = this.scene.add.graphics().setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
      hex.fillStyle(0xf1c40f, 0.4);
      hex.lineStyle(2.5, 0xf1c40f, 1);
      const hexPts: Phaser.Geom.Point[] = [];
      for (let h = 0; h < 6; h++) {
        const ha = (h / 6) * Math.PI * 2;
        hexPts.push(new Phaser.Geom.Point(hx + Math.cos(ha) * 12, hy + Math.sin(ha) * 12));
      }
      hex.fillPoints(hexPts, true);
      hex.strokePoints(hexPts, true);
      hex.setAlpha(0).setScale(0.3);
      this.scene.tweens.add({
        targets: hex, alpha: 1, scaleX: 1, scaleY: 1, duration: 250, delay: i * 40, ease: 'Back.easeOut',
        onComplete: () => { this.scene.tweens.add({ targets: hex, alpha: 0, duration: 2000, ease: 'Power1', onComplete: () => hex.destroy() }); },
      });
    }

    // Golden particle burst
    this.burst(cx, y, 'particle_star', 0xf1c40f, 16, { speed: 80, lifespan: 600, scale: { start: 0.8, end: 0 } });
    // Expanding golden ring
    for (let r = 0; r < 2; r++) {
      this.ring(cx, y, 0xf1c40f, 8 + r * 6, 4, 500 + r * 150, 3);
    }
    this.flash(cx, y, 0xf1c40f, 14, 250);
  }

  private effectWarStomp(cx: number, cy: number): void {
    const y = cy - 16;
    this.scene.cameras.main.shake(350, 0.015);

    // Multiple expanding shockwave rings
    for (let r = 0; r < 4; r++) {
      this.ring(cx, y, r < 2 ? 0xffcc44 : 0xd4a017, 6 + r * 3, 6 + r * 2, 500 + r * 80, 3);
    }

    // Ground crack lines
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const crack = this.scene.add.graphics().setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
      crack.lineStyle(3, 0xddaa33, 0.9);
      crack.beginPath(); crack.moveTo(cx, y);
      const len = 35 + Math.random() * 25;
      const mx = cx + Math.cos(angle) * len * 0.5 + (Math.random() - 0.5) * 10;
      const my = y + Math.sin(angle) * len * 0.3 + (Math.random() - 0.5) * 5;
      crack.lineTo(mx, my);
      crack.lineTo(cx + Math.cos(angle) * len, y + Math.sin(angle) * len * 0.4);
      crack.strokePath();
      crack.setAlpha(0);
      this.scene.tweens.add({ targets: crack, alpha: 1, duration: 80, delay: 30 + i * 15, onComplete: () => {
        this.scene.tweens.add({ targets: crack, alpha: 0, duration: 900, onComplete: () => crack.destroy() });
      }});
    }

    // Debris eruption
    this.burst(cx, y, 'particle_smoke', 0xaa8866, 20, { speed: 140, lifespan: 600, gravityY: 80, scale: { start: 1, end: 0.3 } });
    // Bright center flash
    this.flash(cx, y, 0xffffff, 16, 200);
    this.flash(cx, y, 0xffcc44, 20, 350);
  }

  private effectTauntRoar(cx: number, cy: number): void {
    const y = cy - 16;

    // Pulsing red shockwave rings
    for (let w = 0; w < 5; w++) {
      this.ring(cx, y, 0xe74c3c, 8, 5 + w * 1.5, 500 + w * 100, 3);
    }

    // Red energy particle burst outward
    this.burst(cx, y, 'particle_spark', 0xe74c3c, 18, { speed: 160, lifespan: 500, scale: { start: 1.2, end: 0 } });

    // Red flash
    this.flash(cx, y, 0xff2200, 16, 250);

    // "!" exclamation marks flying outward
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const dist = 40;
      const txt = this.scene.add.text(cx, y, '!', { fontSize: '18px', color: '#ff4444', fontStyle: 'bold' })
        .setOrigin(0.5).setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
      this.scene.tweens.add({
        targets: txt, x: cx + Math.cos(a) * dist, y: y + Math.sin(a) * dist * 0.6, alpha: 0, scale: 1.5,
        duration: 600, delay: i * 40, ease: 'Power2', onComplete: () => txt.destroy(),
      });
    }
  }

  private effectVengefulWrath(cx: number, cy: number): void {
    const y = cy - 16;

    // Flame pillar — continuous particles rising from caster
    const flames = this.scene.add.particles(cx, y + 10, 'particle_flame', {
      tint: [0xff4400, 0xff6600, 0xffaa00, 0xffdd44],
      speed: { min: 60, max: 140 }, angle: { min: 250, max: 290 },
      lifespan: 600, scale: { start: 1.2, end: 0.2 }, alpha: { start: 1, end: 0 },
      blendMode: 'ADD', frequency: 25, stopAfter: 24,
      emitZone: { type: 'random' as const, source: new Phaser.Geom.Rectangle(-14, -6, 28, 12) as any },
    }).setDepth(EFFECT_DEPTH);
    flames.on('complete', () => { this.scene.time.delayedCall(700, () => flames.destroy()); });

    // Rising sparks
    this.burst(cx, y, 'particle_spark', 0xffaa00, 16, {
      speed: 100, lifespan: 700, gravityY: -120,
      scale: { start: 1, end: 0 }, angle: { min: 230, max: 310 },
    });

    // Expanding fire ring
    this.ring(cx, y, 0xff4400, 10, 4, 400, 3);
    this.flash(cx, y, 0xff6600, 18, 300);
  }

  private effectCharge(cx: number, cy: number, tx: number, ty: number): void {
    const sy = cy - 16;
    const ey = ty - 16;
    const dist = Phaser.Math.Distance.Between(cx, sy, tx, ey);
    const dur = Math.max(200, Math.min(400, dist * 1.5));

    // Dust trail along charge path
    const trail = this.scene.add.particles(cx, sy, 'particle_smoke', {
      tint: 0xccbb99,
      speed: { min: 40, max: 100 }, angle: { min: 0, max: 360 },
      lifespan: 400, scale: { start: 0.8, end: 1.5 }, alpha: { start: 0.5, end: 0 },
      blendMode: 'NORMAL' as unknown as Phaser.BlendModes,
      frequency: 20, stopAfter: 16,
    }).setDepth(EFFECT_DEPTH);
    trail.on('complete', () => { this.scene.time.delayedCall(500, () => trail.destroy()); });

    // Speed lines along the charge direction
    const angle = Math.atan2(ey - sy, tx - cx);
    for (let i = 0; i < 6; i++) {
      const lineG = this.scene.add.graphics().setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
      const offset = (Math.random() - 0.5) * 30;
      const perpX = Math.cos(angle + Math.PI / 2) * offset;
      const perpY = Math.sin(angle + Math.PI / 2) * offset;
      const startX = cx + perpX;
      const startY = sy + perpY;
      lineG.lineStyle(3, 0xffcc44, 0.7);
      lineG.beginPath();
      lineG.moveTo(startX, startY);
      lineG.lineTo(startX + Math.cos(angle) * 40, startY + Math.sin(angle) * 40);
      lineG.strokePath();
      this.scene.tweens.add({
        targets: lineG, alpha: 0, duration: 300, delay: i * 30,
        onComplete: () => lineG.destroy(),
      });
    }

    // Impact burst at target
    this.scene.time.delayedCall(dur, () => {
      this.scene.cameras.main.shake(150, 0.008);
      this.burst(tx, ey, 'particle_spark', 0xffcc44, 16, { speed: 160, lifespan: 400, scale: { start: 1.2, end: 0 } });
      this.ring(tx, ey, 0xd4a017, 8, 4, 350, 3);
      this.flash(tx, ey, 0xffffff, 14, 200);
    });
  }

  private effectLethalStrike(tx: number, ty: number): void {
    const y = ty - 16;

    // Heavy downward slash — bright white arc
    for (let i = 0; i < 2; i++) {
      const arc = this.scene.add.graphics().setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
      const startAngle = Phaser.Math.DegToRad(-160 + i * 20);
      const endAngle = Phaser.Math.DegToRad(0 + i * 20);
      const radius = 30 + i * 12;
      const colors = [0xffffff, 0xff4444];
      arc.lineStyle(5 - i * 2, colors[i], 1);
      arc.beginPath();
      const steps = 16;
      for (let s = 0; s <= steps; s++) {
        const a = startAngle + (endAngle - startAngle) * (s / steps);
        const px = tx + Math.cos(a) * radius;
        const py = y + Math.sin(a) * radius;
        if (s === 0) arc.moveTo(px, py); else arc.lineTo(px, py);
      }
      arc.strokePath();
      this.scene.tweens.add({ targets: arc, scaleX: 1.6, scaleY: 1.6, alpha: 0, duration: 350, delay: i * 40, ease: 'Power2', onComplete: () => arc.destroy() });
    }

    // Critical hit cross mark
    const cross = this.scene.add.graphics().setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
    cross.lineStyle(4, 0xff2222, 0.9);
    cross.beginPath(); cross.moveTo(tx - 14, y - 14); cross.lineTo(tx + 14, y + 14); cross.strokePath();
    cross.beginPath(); cross.moveTo(tx + 14, y - 14); cross.lineTo(tx - 14, y + 14); cross.strokePath();
    this.scene.tweens.add({ targets: cross, alpha: 0, scaleX: 2, scaleY: 2, duration: 400, ease: 'Power2', onComplete: () => cross.destroy() });

    // Red blood sparks
    this.burst(tx, y, 'particle_spark', 0xff4444, 16, { speed: 180, lifespan: 400, scale: { start: 1.2, end: 0 } });
    this.flash(tx, y, 0xffffff, 16, 150);
    this.flash(tx, y, 0xff2222, 20, 300);
    this.scene.cameras.main.shake(120, 0.006);
  }

  private effectIronFortress(cx: number, cy: number): void {
    const y = cy - 16;

    // Steel-blue hexagonal shield plates appearing around caster
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const radius = 28;
      const hx = cx + Math.cos(angle) * radius;
      const hy = y + Math.sin(angle) * radius * 0.6;
      const plate = this.scene.add.graphics().setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
      plate.fillStyle(0x6688aa, 0.5);
      plate.lineStyle(2, 0x88aacc, 0.9);
      const pts: Phaser.Geom.Point[] = [];
      for (let h = 0; h < 6; h++) {
        const ha = (h / 6) * Math.PI * 2;
        pts.push(new Phaser.Geom.Point(hx + Math.cos(ha) * 10, hy + Math.sin(ha) * 10));
      }
      plate.fillPoints(pts, true);
      plate.strokePoints(pts, true);
      plate.setAlpha(0).setScale(0.2);
      this.scene.tweens.add({
        targets: plate, alpha: 1, scaleX: 1, scaleY: 1, duration: 200, delay: i * 35, ease: 'Back.easeOut',
        onComplete: () => { this.scene.tweens.add({ targets: plate, alpha: 0, duration: 2500, ease: 'Power1', onComplete: () => plate.destroy() }); },
      });
    }

    // Steel-blue particle burst
    this.burst(cx, y, 'particle_star', 0x88aacc, 14, { speed: 70, lifespan: 600, scale: { start: 0.7, end: 0 } });
    this.ring(cx, y, 0x6688aa, 8, 4, 500, 3);
    this.flash(cx, y, 0x88aacc, 14, 250);
  }

  private effectFrenzy(cx: number, cy: number): void {
    const y = cy - 16;

    // Red rage aura — pulsing fire-like particles rising
    const rage = this.scene.add.particles(cx, y + 10, 'particle_flame', {
      tint: [0xcc2222, 0xff4444, 0xff6644],
      speed: { min: 50, max: 120 }, angle: { min: 250, max: 290 },
      lifespan: 500, scale: { start: 1.0, end: 0.2 }, alpha: { start: 0.9, end: 0 },
      blendMode: 'ADD', frequency: 25, stopAfter: 20,
      emitZone: { type: 'random' as const, source: new Phaser.Geom.Rectangle(-12, -6, 24, 12) as any },
    }).setDepth(EFFECT_DEPTH);
    rage.on('complete', () => { this.scene.time.delayedCall(600, () => rage.destroy()); });

    // Red expanding rings
    this.ring(cx, y, 0xcc2222, 8, 4, 400, 3);
    this.ring(cx, y, 0xff4444, 6, 3, 350, 2);

    // Red sparks burst
    this.burst(cx, y, 'particle_spark', 0xff4444, 14, {
      speed: 100, lifespan: 500, scale: { start: 1, end: 0 }, gravityY: -60,
    });
    this.flash(cx, y, 0xff2222, 16, 250);
  }

  private effectBleedStrike(tx: number, ty: number): void {
    const y = ty - 16;

    // Deep red slash arc
    const arc = this.scene.add.graphics().setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
    const startAngle = Phaser.Math.DegToRad(-130);
    const endAngle = Phaser.Math.DegToRad(-10);
    arc.lineStyle(5, 0xcc2222, 1);
    arc.beginPath();
    const steps = 16;
    for (let s = 0; s <= steps; s++) {
      const a = startAngle + (endAngle - startAngle) * (s / steps);
      const px = tx + Math.cos(a) * 28;
      const py = y + Math.sin(a) * 28;
      if (s === 0) arc.moveTo(px, py); else arc.lineTo(px, py);
    }
    arc.strokePath();
    this.scene.tweens.add({ targets: arc, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 350, ease: 'Power2', onComplete: () => arc.destroy() });

    // Blood splatter — dark red droplets
    this.burst(tx, y, 'particle_circle', 0x991111, 14, {
      speed: 120, lifespan: 500, scale: { start: 0.8, end: 0.2 }, blend: 'NORMAL',
      gravityY: 60,
    });

    // Continuous bleed drip particles (delayed to suggest ongoing bleed)
    this.scene.time.delayedCall(200, () => {
      const drip = this.scene.add.particles(tx, y, 'particle_circle', {
        tint: [0xcc2222, 0x991111],
        speed: { min: 20, max: 50 }, angle: { min: 60, max: 120 },
        lifespan: 600, scale: { start: 0.5, end: 0 }, alpha: { start: 0.7, end: 0 },
        gravityY: 80, blendMode: 'NORMAL' as unknown as Phaser.BlendModes,
        frequency: 60, stopAfter: 8,
      }).setDepth(EFFECT_DEPTH);
      drip.on('complete', () => { this.scene.time.delayedCall(700, () => drip.destroy()); });
    });

    this.flash(tx, y, 0xcc2222, 12, 200);
  }

  private effectDualWieldMastery(cx: number, cy: number): void {
    const y = cy - 16;

    // Two crossed sword flashes — left and right diagonal
    const swords = this.scene.add.graphics().setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
    swords.lineStyle(4, 0xddcc88, 0.9);
    swords.beginPath(); swords.moveTo(cx - 20, y - 16); swords.lineTo(cx + 10, y + 20); swords.strokePath();
    swords.lineStyle(4, 0xccbb77, 0.9);
    swords.beginPath(); swords.moveTo(cx + 20, y - 16); swords.lineTo(cx - 10, y + 20); swords.strokePath();
    this.scene.tweens.add({ targets: swords, alpha: 0, scaleX: 1.3, scaleY: 1.3, duration: 400, ease: 'Power2', onComplete: () => swords.destroy() });

    // Golden sparkles
    this.burst(cx, y, 'particle_spark', 0xddcc88, 12, { speed: 80, lifespan: 400, scale: { start: 0.8, end: 0 } });
    this.flash(cx, y, 0xddcc88, 10, 200);
  }

  private effectUnyielding(cx: number, cy: number): void {
    const y = cy - 16;

    // Protective stone aura — grey/brown tones
    const shield = this.scene.add.circle(cx, y, 6, 0xaa8866, 0.3).setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
    this.scene.tweens.add({
      targets: shield, scaleX: 5, scaleY: 4, alpha: 0.5, duration: 300, ease: 'Back.easeOut',
      onComplete: () => { this.scene.tweens.add({ targets: shield, alpha: 0, duration: 2000, ease: 'Power1', onComplete: () => shield.destroy() }); },
    });

    // Stone/earth particles orbiting
    const stones = this.scene.add.particles(cx, y, 'particle_circle', {
      emitZone: { type: 'edge' as const, source: new Phaser.Geom.Circle(0, 0, 24) as any, quantity: 10 },
      tint: [0xaa8866, 0xccaa88, 0x886644],
      lifespan: 800, scale: { start: 0.8, end: 0.3 }, alpha: { start: 0.9, end: 0 },
      blendMode: 'ADD', speed: { min: 10, max: 30 },
      frequency: 80, stopAfter: 10,
    }).setDepth(EFFECT_DEPTH);
    stones.on('complete', () => { this.scene.time.delayedCall(900, () => stones.destroy()); });

    this.ring(cx, y, 0xaa8866, 6, 4, 400, 3);
    this.flash(cx, y, 0xccaa88, 12, 250);
  }

  private effectLifeRegen(cx: number, cy: number): void {
    const y = cy - 16;

    // Green healing sparkles rising upward
    const sparkles = this.scene.add.particles(cx, y, 'particle_star', {
      tint: [0x44cc44, 0x66ff66, 0x88ffaa],
      speed: { min: 30, max: 70 }, angle: { min: 250, max: 290 },
      lifespan: 600, scale: { start: 0.6, end: 0 }, alpha: { start: 0.8, end: 0 },
      blendMode: 'ADD', frequency: 50, stopAfter: 10,
      emitZone: { type: 'random' as const, source: new Phaser.Geom.Rectangle(-10, -8, 20, 16) as any },
    }).setDepth(EFFECT_DEPTH);
    sparkles.on('complete', () => { this.scene.time.delayedCall(700, () => sparkles.destroy()); });

    // Soft green glow
    this.flash(cx, y, 0x44cc44, 12, 400);
    // Green ring pulse
    this.ring(cx, y, 0x44cc44, 6, 3, 400, 2);
  }

  private effectRampage(cx: number, cy: number): void {
    const y = cy - 16;
    this.scene.cameras.main.shake(250, 0.012);

    // Multiple rapid expanding crimson shockwave rings
    for (let r = 0; r < 5; r++) {
      this.ring(cx, y, r < 3 ? 0xcc2222 : 0xff4444, 8 + r * 3, 5 + r * 1.5, 400 + r * 80, 3);
    }

    // Spinning slash arcs in multiple directions
    for (let i = 0; i < 4; i++) {
      const arc = this.scene.add.graphics().setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
      const baseAngle = (i / 4) * Math.PI * 2;
      const startAngle = baseAngle - 0.6;
      const endAngle = baseAngle + 0.6;
      arc.lineStyle(4, 0xff4444, 0.9);
      arc.beginPath();
      const steps = 12;
      for (let s = 0; s <= steps; s++) {
        const a = startAngle + (endAngle - startAngle) * (s / steps);
        const radius = 30;
        const px = cx + Math.cos(a) * radius;
        const py = y + Math.sin(a) * radius;
        if (s === 0) arc.moveTo(px, py); else arc.lineTo(px, py);
      }
      arc.strokePath();
      this.scene.tweens.add({
        targets: arc, scaleX: 1.8, scaleY: 1.8, alpha: 0, duration: 400, delay: i * 60,
        ease: 'Power2', onComplete: () => arc.destroy(),
      });
    }

    // Red-orange fire burst particles
    this.burst(cx, y, 'particle_flame', 0xff4400, 22, { speed: 180, lifespan: 500, scale: { start: 1.2, end: 0 } });
    this.burst(cx, y, 'particle_spark', 0xffaa00, 14, { speed: 200, lifespan: 400, scale: { start: 1, end: 0 } });

    // Ground dust cloud
    this.burst(cx, y, 'particle_smoke', 0x886655, 12, {
      speed: 60, lifespan: 600, scale: { start: 0.6, end: 1.5 }, alpha: { start: 0.5, end: 0 }, blend: 'NORMAL',
    });

    // Central bright flash
    this.flash(cx, y, 0xffffff, 16, 150);
    this.flash(cx, y, 0xff2222, 22, 350);
  }

  // ══════════════════════════════════════════════════════════
  // MAGE EFFECTS
  // ══════════════════════════════════════════════════════════

  private effectFireball(cx: number, cy: number, tx: number, ty: number): void {
    const sx = cx, sy = cy - 16, ex = tx, ey = ty - 16;
    const dist = Phaser.Math.Distance.Between(sx, sy, ex, ey);
    const dur = Math.max(300, Math.min(600, dist * 1.5));

    // Fireball core
    const core = this.scene.add.circle(sx, sy, 8, 0xffaa00, 1).setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
    const glow = this.scene.add.circle(sx, sy, 16, 0xff4400, 0.5).setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);

    // Flame trail particles following projectile
    const trail = this.scene.add.particles(sx, sy, 'particle_flame', {
      follow: core, tint: [0xff4400, 0xff6600, 0xffaa00],
      speed: { min: 20, max: 60 }, lifespan: 350,
      scale: { start: 1.0, end: 0 }, alpha: { start: 1, end: 0 },
      blendMode: 'ADD', frequency: 20, quantity: 3,
      rotate: { min: 0, max: 360 },
    }).setDepth(EFFECT_DEPTH);

    this.scene.tweens.add({
      targets: [core, glow], x: ex, y: ey, duration: dur, ease: 'Power1',
      onComplete: () => {
        core.destroy(); glow.destroy(); trail.stop();
        this.scene.time.delayedCall(400, () => trail.destroy());
        this.fireballExplosion(ex, ey);
      },
    });
  }

  private fireballExplosion(x: number, y: number): void {
    this.scene.cameras.main.shake(150, 0.006);
    // Multi-ring explosion
    this.ring(x, y, 0xff4400, 8, 5, 350, 4);
    this.ring(x, y, 0xffaa00, 6, 4, 300, 3);
    // Bright white+orange flash
    this.flash(x, y, 0xffffff, 14, 150);
    this.flash(x, y, 0xff6600, 20, 300);
    // Fire particle burst
    this.burst(x, y, 'particle_flame', 0xff4400, 20, { speed: 180, lifespan: 500, scale: { start: 1.2, end: 0 } });
    this.burst(x, y, 'particle_spark', 0xffaa00, 12, { speed: 200, lifespan: 400, scale: { start: 0.8, end: 0 } });
    // Smoke aftermath
    this.burst(x, y, 'particle_smoke', 0x444444, 8, {
      speed: 50, lifespan: 800, scale: { start: 0.6, end: 1.5 }, alpha: { start: 0.5, end: 0 }, blend: 'NORMAL',
    });
  }

  private effectBlizzard(cx: number, cy: number): void {
    const y = cy - 16;

    // Ground frost ring
    this.ring(cx, y, 0x88ccff, 10, 5, 900, 3);
    this.ring(cx, y, 0xaaddff, 8, 4, 700, 2);

    // Ice shards falling from above in a wide zone
    const ice = this.scene.add.particles(cx, y - 80, 'particle_ice', {
      emitZone: { type: 'random' as const, source: new Phaser.Geom.Rectangle(-50, 0, 100, 20) as any },
      tint: [0x88ccff, 0xaaddff, 0xcceeFF],
      speed: { min: 80, max: 160 }, angle: { min: 75, max: 105 },
      lifespan: 700, scale: { start: 1.0, end: 0.3 }, alpha: { start: 0.9, end: 0 },
      blendMode: 'ADD', frequency: 30, stopAfter: 28,
      rotate: { min: 0, max: 360 },
    }).setDepth(EFFECT_DEPTH);
    ice.on('complete', () => { this.scene.time.delayedCall(800, () => ice.destroy()); });

    // Snowflake sparkles at ground level
    this.burst(cx, y, 'particle_star', 0xccddff, 12, {
      speed: 60, lifespan: 600, scale: { start: 0.6, end: 0 },
    });

    // Frost ground flash
    this.flash(cx, y, 0x88ccff, 16, 400);
  }

  private effectManaShield(cx: number, cy: number): void {
    const y = cy - 16;

    // Blue arcane sphere
    const sphere = this.scene.add.circle(cx, y, 6, 0x3498db, 0.3).setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
    this.scene.tweens.add({
      targets: sphere, scaleX: 5, scaleY: 4, alpha: 0.4, duration: 350, ease: 'Back.easeOut',
      onComplete: () => { this.scene.tweens.add({ targets: sphere, alpha: 0, duration: 2500, ease: 'Power1', onComplete: () => sphere.destroy() }); },
    });

    // Blue ring pulse
    this.ring(cx, y, 0x5dade2, 6, 5, 400, 3);

    // Arcane rune particles orbiting
    const runes = this.scene.add.particles(cx, y, 'particle_star', {
      emitZone: { type: 'edge' as const, source: new Phaser.Geom.Circle(0, 0, 26) as any, quantity: 12 },
      tint: [0x5dade2, 0x88bbff, 0xbbddff], lifespan: 1000,
      scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 },
      blendMode: 'ADD', speed: { min: 10, max: 30 },
      frequency: 80, stopAfter: 12,
    }).setDepth(EFFECT_DEPTH);
    runes.on('complete', () => { this.scene.time.delayedCall(1100, () => runes.destroy()); });

    this.flash(cx, y, 0x3498db, 12, 300);
  }

  private effectMeteor(tx: number, ty: number): void {
    const y = ty - 16;

    // Warning circle on ground
    const warn = this.scene.add.graphics().setDepth(EFFECT_DEPTH);
    warn.lineStyle(2, 0xff4400, 0.6);
    warn.strokeCircle(tx, y, 30);
    warn.setScale(1, 0.5);
    this.scene.tweens.add({ targets: warn, alpha: 0, duration: 600, onComplete: () => warn.destroy() });

    // Meteor fireball dropping from above
    const startY = y - 220;
    const meteor = this.scene.add.circle(tx - 50, startY, 16, 0xff4400, 1).setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
    const meteorGlow = this.scene.add.circle(tx - 50, startY, 28, 0xff6600, 0.4).setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);

    // Fire trail particles following the meteor
    const trail = this.scene.add.particles(meteor.x, meteor.y, 'particle_flame', {
      follow: meteor, tint: [0xff4400, 0xff6600, 0xffaa00],
      speed: { min: 30, max: 80 }, lifespan: 400,
      scale: { start: 1.4, end: 0 }, alpha: { start: 1, end: 0 },
      blendMode: 'ADD', frequency: 18, quantity: 3,
      rotate: { min: 0, max: 360 },
    }).setDepth(EFFECT_DEPTH);

    this.scene.tweens.add({
      targets: [meteor, meteorGlow], x: tx, y: y, duration: 550, ease: 'Power2.easeIn',
      onComplete: () => {
        meteor.destroy(); meteorGlow.destroy(); trail.stop();
        this.scene.time.delayedCall(500, () => trail.destroy());
        this.meteorExplosion(tx, y);
      },
    });
  }

  private meteorExplosion(x: number, y: number): void {
    this.scene.cameras.main.shake(400, 0.02);

    // Massive multi-ring explosion
    for (let r = 0; r < 4; r++) {
      this.ring(x, y, r < 2 ? 0xffaa00 : 0xff4400, 8 + r * 4, 6 + r * 2, 500 + r * 80, 4);
    }

    // Bright white core flash
    this.flash(x, y, 0xffffff, 22, 200);
    this.flash(x, y, 0xff6600, 30, 400);

    // Fire + debris burst
    this.burst(x, y, 'particle_flame', 0xff4400, 28, { speed: 220, lifespan: 600, scale: { start: 1.5, end: 0 } });
    this.burst(x, y, 'particle_spark', 0xffaa00, 16, { speed: 250, lifespan: 500, scale: { start: 1, end: 0 }, gravityY: 100 });

    // Ground scorchmark
    const scorch = this.scene.add.circle(x, y, 28, 0x222200, 0.35).setDepth(EFFECT_DEPTH - 1).setScale(1, 0.5);
    this.scene.tweens.add({ targets: scorch, alpha: 0, duration: 3000, delay: 500, onComplete: () => scorch.destroy() });

    // Smoke plume
    this.burst(x, y, 'particle_smoke', 0x555555, 12, {
      speed: 40, lifespan: 1000, scale: { start: 0.8, end: 2 }, alpha: { start: 0.6, end: 0 }, blend: 'NORMAL', gravityY: -30,
    });
  }

  private effectIceArmor(cx: number, cy: number): void {
    const y = cy - 16;

    // Ice crystal orbit using edge-emitted particles
    const crystals = this.scene.add.particles(cx, y, 'particle_ice', {
      emitZone: { type: 'edge' as const, source: new Phaser.Geom.Circle(0, 0, 24) as any, quantity: 16 },
      tint: [0x88ccff, 0xaaddff], lifespan: 800,
      scale: { start: 1, end: 0.4 }, alpha: { start: 1, end: 0 },
      blendMode: 'ADD', speed: { min: 10, max: 40 },
      frequency: 50, stopAfter: 16, rotate: { min: 0, max: 360 },
    }).setDepth(EFFECT_DEPTH);
    crystals.on('complete', () => { this.scene.time.delayedCall(900, () => crystals.destroy()); });

    // Frost aura ring
    this.ring(cx, y, 0x88ccff, 8, 4, 500, 3);
    // Frost sparkle burst
    this.burst(cx, y, 'particle_star', 0xccddff, 10, { speed: 60, lifespan: 500, scale: { start: 0.7, end: 0 } });
    this.flash(cx, y, 0x88ccff, 14, 300);
  }

  private effectChainLightning(cx: number, cy: number, targets: { x: number; y: number }[]): void {
    const sy = cy - 16;

    if (targets.length === 0) {
      this.drawLightningBolt(cx, sy - 40, cx, sy, 0x5dade2);
      this.burst(cx, sy, 'particle_spark', 0x88bbff, 10, { speed: 100, lifespan: 300, scale: { start: 1, end: 0 } });
      this.flash(cx, sy, 0x5dade2, 12, 200);
      return;
    }

    let prevX = cx, prevY = sy;
    for (let idx = 0; idx < targets.length; idx++) {
      const t = targets[idx];
      const tty = t.y - 16;
      // Draw bolt with slight delay per chain
      this.scene.time.delayedCall(idx * 60, () => {
        this.drawLightningBolt(prevX, prevY, t.x, tty, 0x5dade2);
        this.burst(t.x, tty, 'particle_spark', 0x88bbff, 8, { speed: 100, lifespan: 300, scale: { start: 0.8, end: 0 } });
        this.flash(t.x, tty, 0x5dade2, 10, 200);
      });
      prevX = t.x; prevY = tty;
    }
  }

  private drawLightningBolt(x1: number, y1: number, x2: number, y2: number, color: number): void {
    const dx = x2 - x1, dy = y2 - y1;
    const segments = 10;

    // Draw 3 overlapping bolts for thickness and glow
    for (let pass = 0; pass < 3; pass++) {
      const bolt = this.scene.add.graphics().setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
      const w = pass === 0 ? 6 : pass === 1 ? 3 : 1.5;
      const a = pass === 0 ? 0.3 : pass === 1 ? 0.7 : 1;
      const c = pass === 2 ? 0xffffff : color;
      bolt.lineStyle(w, c, a);
      bolt.beginPath(); bolt.moveTo(x1, y1);
      for (let s = 1; s < segments; s++) {
        const t = s / segments;
        const jitter = pass === 0 ? 12 : 8;
        bolt.lineTo(x1 + dx * t + (Math.random() - 0.5) * jitter, y1 + dy * t + (Math.random() - 0.5) * jitter);
      }
      bolt.lineTo(x2, y2); bolt.strokePath();
      this.scene.tweens.add({ targets: bolt, alpha: 0, duration: 350, ease: 'Power2', onComplete: () => bolt.destroy() });
    }
  }

  // ══════════════════════════════════════════════════════════
  // ROGUE EFFECTS
  // ══════════════════════════════════════════════════════════

  private effectBackstab(tx: number, ty: number): void {
    const y = ty - 16;

    // Bright X-slash marks with additive blend
    const slashes = this.scene.add.graphics().setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
    slashes.lineStyle(4, 0xffffff, 1);
    slashes.beginPath(); slashes.moveTo(tx - 18, y - 18); slashes.lineTo(tx + 18, y + 18); slashes.strokePath();
    slashes.beginPath(); slashes.moveTo(tx + 18, y - 18); slashes.lineTo(tx - 18, y + 18); slashes.strokePath();
    this.scene.tweens.add({ targets: slashes, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 300, ease: 'Power2', onComplete: () => slashes.destroy() });

    // Red blood splatter
    this.burst(tx, y, 'particle_circle', 0xcc2222, 12, {
      speed: 130, lifespan: 400, scale: { start: 0.8, end: 0 }, blend: 'NORMAL',
    });
    // White spark burst
    this.burst(tx, y, 'particle_spark', 0xffffff, 10, { speed: 150, lifespan: 300, scale: { start: 1, end: 0 } });
    this.flash(tx, y, 0xffffff, 14, 120);
  }

  private effectPoisonBlade(cx: number, cy: number): void {
    const y = cy - 16;

    // Poison mist cloud rising
    const mist = this.scene.add.particles(cx, y, 'particle_poison', {
      emitZone: { type: 'random' as const, source: new Phaser.Geom.Rectangle(-16, -8, 32, 16) as any },
      tint: [0x33cc33, 0x44dd44, 0x66ff66],
      speed: { min: 30, max: 80 }, angle: { min: 240, max: 300 },
      lifespan: 600, scale: { start: 1, end: 0.4 }, alpha: { start: 0.9, end: 0 },
      blendMode: 'ADD', frequency: 30, stopAfter: 18,
      rotate: { min: 0, max: 360 },
    }).setDepth(EFFECT_DEPTH);
    mist.on('complete', () => { this.scene.time.delayedCall(700, () => mist.destroy()); });

    // Green glow
    this.flash(cx, y, 0x27ae60, 14, 350);
    this.ring(cx, y, 0x33cc33, 6, 3, 400, 2);
    // Green sparkles
    this.burst(cx, y, 'particle_circle', 0x66ff66, 10, { speed: 60, lifespan: 500, scale: { start: 0.6, end: 0 } });
  }

  private effectMultishot(cx: number, cy: number): void {
    const y = cy - 16;
    const arrowCount = 7;
    const spread = Math.PI / 2.5; // ~72°
    const start = -Math.PI / 2 - spread / 2;

    for (let i = 0; i < arrowCount; i++) {
      const a = start + (i / (arrowCount - 1)) * spread;
      const arrow = this.scene.add.image(cx, y, 'particle_arrow')
        .setDepth(EFFECT_DEPTH).setTint(0xeeeeee).setScale(1).setAlpha(1)
        .setAngle(Phaser.Math.RadToDeg(a) + 90)
        .setBlendMode('ADD' as unknown as Phaser.BlendModes);
      const dist = 80;
      this.scene.tweens.add({
        targets: arrow, x: cx + Math.cos(a) * dist, y: y + Math.sin(a) * dist,
        alpha: 0, duration: 400, ease: 'Power1',
        onComplete: () => arrow.destroy(),
      });
      // Trail per arrow
      this.scene.time.delayedCall(50 * i, () => {
        const trail = this.scene.add.particles(cx, y, 'particle_circle', {
          follow: arrow, tint: 0xcccccc, speed: { min: 5, max: 20 }, lifespan: 200,
          scale: { start: 0.5, end: 0 }, alpha: { start: 0.6, end: 0 }, blendMode: 'ADD',
          frequency: 30, quantity: 1,
        }).setDepth(EFFECT_DEPTH);
        this.scene.time.delayedCall(500, () => trail.destroy());
      });
    }

    this.flash(cx, y, 0xffffff, 10, 150);
  }

  private effectVanish(cx: number, cy: number): void {
    const y = cy - 16;

    // Dense smoke bomb burst
    const smoke = this.scene.add.particles(cx, y, 'particle_smoke', {
      tint: [0x666677, 0x555566, 0x444455],
      speed: { min: 60, max: 140 }, lifespan: 600,
      scale: { start: 0.8, end: 2 }, alpha: { start: 0.7, end: 0 },
      blendMode: 'NORMAL' as unknown as Phaser.BlendModes,
      angle: { min: 0, max: 360 },
      emitting: false,
    }).setDepth(EFFECT_DEPTH);
    smoke.explode(20);
    this.scene.time.delayedCall(800, () => smoke.destroy());

    // Purple-ish shadow sparks
    this.burst(cx, y, 'particle_spark', 0x9966cc, 12, { speed: 100, lifespan: 400, scale: { start: 0.8, end: 0 } });

    // Dark implosion ring (shrinks instead of expands)
    const imp = this.scene.add.graphics().setDepth(EFFECT_DEPTH);
    imp.lineStyle(3, 0x8855aa, 0.7);
    imp.strokeCircle(cx, y, 40);
    this.scene.tweens.add({ targets: imp, scaleX: 0, scaleY: 0, alpha: 0, duration: 300, ease: 'Power2', onComplete: () => imp.destroy() });

    this.flash(cx, y, 0x555555, 16, 200);
  }

  private effectExplosiveTrap(tx: number, ty: number): void {
    const y = ty - 16;

    // Warning pulse
    const warn = this.scene.add.circle(tx, y, 12, 0xff4400, 0.5).setDepth(EFFECT_DEPTH).setBlendMode('ADD' as unknown as Phaser.BlendModes);
    this.scene.tweens.add({
      targets: warn, alpha: 0.9, scaleX: 1.3, scaleY: 1.3, yoyo: true, duration: 100, repeat: 1,
      onComplete: () => { warn.destroy(); this.trapExplosion(tx, y); },
    });
  }

  private trapExplosion(x: number, y: number): void {
    this.scene.cameras.main.shake(200, 0.01);

    // Multi-ring explosion
    for (let r = 0; r < 3; r++) {
      this.ring(x, y, r === 0 ? 0xffaa00 : 0xff4400, 6 + r * 3, 5 + r, 400 + r * 80, 3);
    }

    // Fire burst
    this.burst(x, y, 'particle_flame', 0xff6600, 18, { speed: 160, lifespan: 500, scale: { start: 1.2, end: 0 } });
    this.burst(x, y, 'particle_spark', 0xffcc00, 10, { speed: 200, lifespan: 400, scale: { start: 0.8, end: 0 }, gravityY: 80 });
    // Smoke
    this.burst(x, y, 'particle_smoke', 0x444444, 8, {
      speed: 40, lifespan: 800, scale: { start: 0.6, end: 1.5 }, alpha: { start: 0.5, end: 0 }, blend: 'NORMAL',
    });
    this.flash(x, y, 0xffffff, 12, 150);
    this.flash(x, y, 0xff4400, 18, 300);
  }

  private effectArrowRain(tx: number, ty: number): void {
    const y = ty - 16;

    // Warning zone on ground
    this.ring(tx, y, 0xcccccc, 20, 2, 600, 2);

    // Arrows raining down from above
    const arrows = this.scene.add.particles(tx, y - 100, 'particle_arrow', {
      emitZone: { type: 'random' as const, source: new Phaser.Geom.Rectangle(-55, 0, 110, 10) as any },
      tint: 0xddddee,
      speed: { min: 120, max: 200 }, angle: { min: 80, max: 100 },
      lifespan: 500, scale: { start: 1, end: 0.6 }, alpha: { start: 0.9, end: 0.3 },
      blendMode: 'ADD', frequency: 35, stopAfter: 22,
      rotate: { min: 170, max: 190 },
    }).setDepth(EFFECT_DEPTH);
    arrows.on('complete', () => { this.scene.time.delayedCall(600, () => arrows.destroy()); });

    // Impact sparkles at ground level (delayed)
    this.scene.time.delayedCall(200, () => {
      this.burst(tx, y, 'particle_spark', 0xcccccc, 14, {
        speed: 60, lifespan: 400, scale: { start: 0.6, end: 0 },
      });
    });

    // Dust cloud at impact
    this.scene.time.delayedCall(300, () => {
      this.burst(tx, y, 'particle_smoke', 0x887766, 8, {
        speed: 30, lifespan: 500, scale: { start: 0.5, end: 1 }, alpha: { start: 0.4, end: 0 }, blend: 'NORMAL',
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  // GENERIC FALLBACK
  // ══════════════════════════════════════════════════════════

  private effectGeneric(x: number, y: number, color: number): void {
    const cy = y - 16;
    this.burst(x, cy, 'particle_circle', color, 14, { speed: 120, lifespan: 500, scale: { start: 1, end: 0 } });
    this.flash(x, cy, color, 12, 300);
  }
}
