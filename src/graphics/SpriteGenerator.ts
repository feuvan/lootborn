import Phaser from 'phaser';
import { TEXTURE_SCALE } from '../config';
import { CAMP_THEMES } from '../data/camp-themes';
import { DrawUtils } from './DrawUtils';
import type { EntityDrawer } from './sprites/types';
import { SlimeDrawer } from './sprites/monsters/Slime';
import { SkeletonDrawer } from './sprites/monsters/Skeleton';
import { WerewolfDrawer } from './sprites/monsters/Werewolf';
import { FireElementalDrawer } from './sprites/monsters/FireElemental';
import { DesertScorpionDrawer } from './sprites/monsters/DesertScorpion';
import { GoblinDrawer } from './sprites/monsters/Goblin';
import { GoblinChiefDrawer } from './sprites/monsters/GoblinChief';
import { ZombieDrawer } from './sprites/monsters/Zombie';
import { WerewolfAlphaDrawer } from './sprites/monsters/WerewolfAlpha';
import { GargoyleDrawer } from './sprites/monsters/Gargoyle';
import { StoneGolemDrawer } from './sprites/monsters/StoneGolem';
import { MountainTrollDrawer } from './sprites/monsters/MountainTroll';
import { SandwormDrawer } from './sprites/monsters/Sandworm';
import { PhoenixDrawer } from './sprites/monsters/Phoenix';
import { ImpDrawer } from './sprites/monsters/Imp';
import { LesserDemonDrawer } from './sprites/monsters/LesserDemon';
import { SuccubusDrawer } from './sprites/monsters/Succubus';
import { DemonLordDrawer } from './sprites/monsters/DemonLord';
import { PlayerWarriorDrawer } from './sprites/players/PlayerWarrior';
import { PlayerMageDrawer } from './sprites/players/PlayerMage';
import { PlayerRogueDrawer } from './sprites/players/PlayerRogue';
import { BlacksmithDrawer } from './sprites/npcs/Blacksmith';
import { BlacksmithAdvancedDrawer } from './sprites/npcs/BlacksmithAdvanced';
import { MerchantDrawer } from './sprites/npcs/Merchant';
import { MerchantDesertDrawer } from './sprites/npcs/MerchantDesert';
import { StashDrawer } from './sprites/npcs/Stash';
import { QuestElderDrawer } from './sprites/npcs/QuestElder';
import { QuestScoutDrawer } from './sprites/npcs/QuestScout';
import { ForestHermitDrawer } from './sprites/npcs/ForestHermit';
import { QuestDwarfDrawer } from './sprites/npcs/QuestDwarf';
import { QuestNomadDrawer } from './sprites/npcs/QuestNomad';
import { QuestWardenDrawer } from './sprites/npcs/QuestWarden';
import { TreeDrawer } from './sprites/decorations/Tree';
import { BushDrawer } from './sprites/decorations/Bush';
import { RockDrawer } from './sprites/decorations/Rock';
import { FlowerDrawer } from './sprites/decorations/Flower';
import { MushroomDrawer } from './sprites/decorations/Mushroom';
import { CactusDrawer } from './sprites/decorations/Cactus';
import { BoulderDrawer } from './sprites/decorations/Boulder';
import { CrystalDrawer } from './sprites/decorations/Crystal';
import { BonesDrawer } from './sprites/decorations/Bones';
import { LootBagDrawer } from './sprites/effects/LootBag';
import { ExitPortalDrawer } from './sprites/effects/ExitPortal';

// ── Frame Layout Constants ──────────────────────────────────────────────────
const IDLE_START = 0, IDLE_COUNT = 4;
const WALK_START = 4, WALK_COUNT = 6;
const ATK_START = 10, ATK_COUNT = 4;
const HURT_START = 14, HURT_COUNT = 2;
const DEATH_START = 16, DEATH_COUNT = 4;
const CAST_START = 20, CAST_COUNT = 4;
const MONSTER_FRAMES = 20;

// NPC frame layout (24 frames total per NPC)
const NPC_WORK_START = 0, NPC_WORK_COUNT = 8;
const NPC_ALERT_START = 8, NPC_ALERT_COUNT = 4;
const NPC_IDLE_START = 12, NPC_IDLE_COUNT = 6;
const NPC_TALK_START = 18, NPC_TALK_COUNT = 6;

// ═══════════════════════════════════════════════════════════════════════════
// ██ SpriteGenerator ██
// ═══════════════════════════════════════════════════════════════════════════

export class SpriteGenerator {
  private scene: Phaser.Scene;
  private utils: DrawUtils;

  // Terrain base colors for edge blending (indexed by tile type)
  static readonly TERRAIN_COLORS = [
    '#1f3d18', // 0 = grass
    '#35251a', // 1 = dirt
    '#2e3338', // 2 = stone
    '#0b1820', // 3 = water
    '#1a1a1e', // 4 = wall
    '#2c2010', // 5 = camp
    '#4a3520', // 6 = camp_wall
  ];

  private static readonly TILE_NAMES = ['grass', 'dirt', 'stone', 'water', 'wall', 'camp', 'camp_wall'];

  /**
   * Generate a blended tile that smoothly transitions to neighboring terrain types.
   * Called lazily by ZoneScene when a tile borders a different terrain type.
   * Results are cached as Phaser textures.
   *
   * neighbors order: [TR, TL, BR, BL] — the 4 edge-sharing neighbors in iso space.
   */
  static generateBlendedTile(
    scene: Phaser.Scene,
    baseTileType: number,
    neighbors: [number, number, number, number],
  ): string {
    const key = `tile_b_${baseTileType}_${neighbors.join('')}`;
    if (scene.textures.exists(key)) return key;

    const s = TEXTURE_SCALE;
    const w = 64 * s, h = 32 * s;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    // Draw the base tile onto our canvas
    const baseTexKey = `tile_${SpriteGenerator.TILE_NAMES[baseTileType]}`;
    if (scene.textures.exists(baseTexKey)) {
      ctx.drawImage(scene.textures.get(baseTexKey).getSourceImage() as CanvasImageSource, 0, 0);
    }

    // Diamond clip so blends stay within tile boundary
    const cx = w / 2, cy = h / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(w, cy); ctx.lineTo(cx, h); ctx.lineTo(0, cy);
    ctx.closePath();
    ctx.clip();

    // Edge midpoints (gradient origins) for each diamond edge
    const edgeMids: [number, number][] = [
      [w * 0.75, h * 0.25], // TR edge midpoint
      [w * 0.25, h * 0.25], // TL edge midpoint
      [w * 0.75, h * 0.75], // BR edge midpoint
      [w * 0.25, h * 0.75], // BL edge midpoint
    ];

    for (let i = 0; i < 4; i++) {
      const nType = neighbors[i];
      if (nType === baseTileType) continue;
      if (nType < 0 || nType > 5) continue;
      // Skip blending into/from walls (they have 3D height)
      if (nType === 4 || baseTileType === 4) continue;

      const nColor = SpriteGenerator.TERRAIN_COLORS[nType];
      const [mx, my] = edgeMids[i];

      // Gradient from edge midpoint toward center — fades neighbor color in
      const grad = ctx.createLinearGradient(mx, my, cx, cy);
      grad.addColorStop(0, nColor + 'aa');   // ~67% alpha at edge
      grad.addColorStop(0.35, nColor + '55'); // ~33% at 35%
      grad.addColorStop(0.6, nColor + '00');  // transparent at 60%
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
    scene.textures.addCanvas(key, canvas);
    return key;
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.utils = new DrawUtils();
  }

  /** Returns true if the texture was loaded from an external image file (HTMLImageElement),
   *  meaning procedural generation should be skipped in favour of the loaded asset. */
  private shouldSkipGeneration(key: string): boolean {
    if (!this.scene.textures.exists(key)) return false;
    const tex = this.scene.textures.get(key);
    return tex.source[0]?.source instanceof HTMLImageElement;
  }

  generateAll(): void {
    this.generateTiles();
    this.generatePlayerSheets();
    this.generateMonsterSheets();
    this.generateNPCSprites();
    this.generateDecorations();
    this.generateCampDecorations();
    this.generateEffects();
    this.registerAnimations();
  }

  // ── Drawing Utilities (delegates to DrawUtils) ───────────────────────────

  private hash2d(x: number, y: number): number { return this.utils.hash2d(x, y); }
  private createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] { return this.utils.createCanvas(w, h); }
  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void { return this.utils.roundRect(ctx, x, y, w, h, r); }
  private fillEllipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number): void { return this.utils.fillEllipse(ctx, cx, cy, rx, ry); }
  private fillCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void { return this.utils.fillCircle(ctx, cx, cy, r); }
  private applyNoiseToRegion(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, intensity: number): void { return this.utils.applyNoiseToRegion(ctx, x, y, w, h, intensity); }

  private clipDiamond(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w, h / 2);
    ctx.lineTo(w / 2, h);
    ctx.lineTo(0, h / 2);
    ctx.closePath();
    ctx.clip();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ██ TILE GENERATION ██
  // ═══════════════════════════════════════════════════════════════════════

  private generateTiles(): void {
    this.makeTile('tile_grass', this.drawGrass.bind(this));
    this.makeTile('tile_dirt', this.drawDirt.bind(this));
    this.makeTile('tile_stone', this.drawStone.bind(this));
    this.makeTile('tile_water', this.drawWater.bind(this));
    this.makeTile('tile_wall', this.drawWall.bind(this));
    this.makeTile('tile_camp', this.drawCamp.bind(this));

    // Default camp wall (plains theme)
    const plainsTheme = CAMP_THEMES['plains'];
    this.makeTile('tile_camp_wall', (ctx, w, h) =>
      this.drawCampWall(ctx, w, h, plainsTheme.wallColor, plainsTheme.wallDark, plainsTheme.wallLight, plainsTheme.wallTop),
    );

    // Themed variants for each camp theme
    for (const [themeName, theme] of Object.entries(CAMP_THEMES)) {
      const tWall = theme.wallColor;
      const tWallDark = theme.wallDark;
      const tWallLight = theme.wallLight;
      const tWallTop = theme.wallTop;
      const tGround = theme.groundColor;

      this.makeTile(`tile_camp_wall_${themeName}`, (ctx, w, h) =>
        this.drawCampWall(ctx, w, h, tWall, tWallDark, tWallLight, tWallTop),
      );
      this.makeTile(`tile_camp_ground_${themeName}`, (ctx, w, h) =>
        this.drawCampGroundThemed(ctx, w, h, tGround),
      );
    }
  }

  private makeTile(key: string, drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): void {
    const s = TEXTURE_SCALE;
    const w = 64 * s, h = 32 * s;
    const [canvas, ctx] = this.createCanvas(w, h);
    ctx.save();
    this.clipDiamond(ctx, w, h);
    drawFn(ctx, w, h);
    ctx.restore();

    if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
    this.scene.textures.addCanvas(key, canvas);
  }

  private drawGrass(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Uniform dark forest green base
    ctx.fillStyle = '#1f3d18';
    ctx.fillRect(0, 0, w, h);

    // Very subtle color variation
    this.applyNoiseToRegion(ctx, 0, 0, w, h, 6);

    // Faint grass blade hints
    for (let i = 0; i < 20; i++) {
      const gx = this.hash2d(i * 7, 31) * w;
      const gy = this.hash2d(i * 13, 47) * h;
      const green = 55 + this.hash2d(i, 91) * 40;
      ctx.strokeStyle = `rgba(25,${green | 0},18,0.1)`;
      ctx.lineWidth = 0.6;
      const lean = (this.hash2d(i, 53) - 0.5) * 2;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + lean, gy - 2 - this.hash2d(i, 71) * 3);
      ctx.stroke();
    }
  }

  private drawDirt(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Uniform dark earth base
    ctx.fillStyle = '#35251a';
    ctx.fillRect(0, 0, w, h);

    this.applyNoiseToRegion(ctx, 0, 0, w, h, 7);

    // Faint pebble hints
    for (let i = 0; i < 5; i++) {
      const px = this.hash2d(i * 11, 23) * w;
      const py = this.hash2d(i * 17, 29) * h;
      const r = this.hash2d(i, 59);
      ctx.fillStyle = `rgba(${70 + r * 25 | 0},${60 + r * 20 | 0},${45 + r * 15 | 0},0.15)`;
      this.fillEllipse(ctx, px, py, 1.5 + r * 2, 1 + r * 1.5);
    }

    // Very faint cracks
    ctx.strokeStyle = 'rgba(25,18,10,0.12)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 2; i++) {
      const x1 = this.hash2d(i * 37, 41) * w;
      const y1 = this.hash2d(i * 43, 53) * h;
      const x2 = this.hash2d(i * 61, 67) * w;
      const y2 = this.hash2d(i * 71, 79) * h;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
  }

  private drawStone(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Uniform dark grey base
    ctx.fillStyle = '#2e3338';
    ctx.fillRect(0, 0, w, h);

    this.applyNoiseToRegion(ctx, 0, 0, w, h, 5);

    // Very faint mortar hints
    ctx.strokeStyle = 'rgba(18,20,22,0.15)';
    ctx.lineWidth = 0.5;
    const cx = w / 2, cy = h / 2;
    ctx.beginPath(); ctx.moveTo(cx - w * 0.35, cy); ctx.lineTo(cx + w * 0.35, cy); ctx.stroke();

    // Faint moss patches
    for (let i = 0; i < 2; i++) {
      const mx = this.hash2d(i * 19, 83) * w;
      const my = this.hash2d(i * 23, 89) * h;
      ctx.fillStyle = `rgba(28,45,22,0.08)`;
      const rx = 3 + this.hash2d(i, 103) * 4;
      const ry = 2 + this.hash2d(i, 107) * 2;
      this.fillEllipse(ctx, mx, my, rx, ry);
    }
  }

  private drawWater(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Uniform dark water base
    ctx.fillStyle = '#0b1820';
    ctx.fillRect(0, 0, w, h);

    this.applyNoiseToRegion(ctx, 0, 0, w, h, 4);

    // Faint ripple highlights
    ctx.strokeStyle = 'rgba(45,90,130,0.1)';
    ctx.lineWidth = 0.6;
    const cx = w / 2, cy = h / 2;
    ctx.beginPath(); ctx.arc(cx - w * 0.1, cy - h * 0.06, w * 0.1, 0.3, 2.6, false); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + w * 0.08, cy + h * 0.06, w * 0.07, 0.5, 2.5, false); ctx.stroke();

    // Very faint shimmer
    ctx.fillStyle = 'rgba(70,130,170,0.06)';
    this.fillEllipse(ctx, cx + w * 0.04, cy - h * 0.1, w * 0.05, h * 0.04);
  }

  private drawWall(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // The wall is NOT diamond-clipped — it has 3D height.
    // We re-draw over the clipped area with wall faces.
    ctx.fillStyle = '#1a1a1e';
    ctx.fillRect(0, 0, w, h);

    const wallH = h * 0.45;
    // Front face (dark)
    const fGrad = ctx.createLinearGradient(0, h / 2, 0, h);
    fGrad.addColorStop(0, '#2a2a30'); fGrad.addColorStop(1, '#181820');
    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.moveTo(0, h / 2); ctx.lineTo(w / 2, h);
    ctx.lineTo(w / 2, h - wallH); ctx.lineTo(0, h / 2 - wallH);
    ctx.closePath(); ctx.fill();

    // Right face (lighter)
    const rGrad = ctx.createLinearGradient(w / 2, h / 2, w, h / 2);
    rGrad.addColorStop(0, '#323238'); rGrad.addColorStop(1, '#28282e');
    ctx.fillStyle = rGrad;
    ctx.beginPath();
    ctx.moveTo(w / 2, h); ctx.lineTo(w, h / 2);
    ctx.lineTo(w, h / 2 - wallH); ctx.lineTo(w / 2, h - wallH);
    ctx.closePath(); ctx.fill();

    // Top face
    ctx.fillStyle = '#3a3a42';
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2 - wallH); ctx.lineTo(w, h / 2 - wallH);
    ctx.lineTo(w / 2, h - wallH); ctx.lineTo(0, h / 2 - wallH);
    ctx.closePath(); ctx.fill();

    // Brick lines
    ctx.strokeStyle = 'rgba(10,10,12,0.5)';
    ctx.lineWidth = 0.8;
    for (let i = 1; i < 3; i++) {
      const ly = h / 2 + (h / 2 - wallH) * 0 + i * (wallH / 3);
      ctx.beginPath();
      ctx.moveTo(0 + i * 2, h / 2 - wallH + ly * 0.3);
      ctx.lineTo(w / 2 - i * 2, h - wallH + ly * 0.3);
      ctx.stroke();
    }

    // Edge highlight
    ctx.strokeStyle = 'rgba(80,80,90,0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, h / 2 - wallH); ctx.lineTo(w / 2, h / 2 - wallH);
    ctx.lineTo(w, h / 2 - wallH);
    ctx.stroke();

    this.applyNoiseToRegion(ctx, 0, 0, w, h, 5);
  }

  private drawCamp(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Uniform warm wood base
    ctx.fillStyle = '#2c2010';
    ctx.fillRect(0, 0, w, h);

    this.applyNoiseToRegion(ctx, 0, 0, w, h, 6);

    // Plank lines
    const cx = w / 2, cy = h / 2;
    ctx.strokeStyle = 'rgba(35,22,10,0.3)';
    ctx.lineWidth = 0.6;
    for (let i = -4; i <= 4; i++) {
      const ly = cy + i * h * 0.1;
      const inset = Math.abs(i) * w * 0.06;
      ctx.beginPath(); ctx.moveTo(cx - w * 0.4 + inset, ly); ctx.lineTo(cx + w * 0.4 - inset, ly); ctx.stroke();
    }

    // Subtle warm glow (very faint, no hard edges)
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.4);
    glow.addColorStop(0, 'rgba(160,90,20,0.1)');
    glow.addColorStop(0.6, 'rgba(100,45,10,0.05)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  private drawCampWall(
    ctx: CanvasRenderingContext2D, w: number, h: number,
    wallColor: string, wallDark: string, wallLight: string, wallTop: string,
  ): void {
    ctx.fillStyle = wallDark;
    ctx.fillRect(0, 0, w, h);

    const wallH = h * 0.45;

    // Front face (left-side isometric face) with gradient
    const fGrad = ctx.createLinearGradient(0, h / 2, w / 2, h);
    fGrad.addColorStop(0, wallLight);
    fGrad.addColorStop(1, wallDark);
    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.moveTo(0, h / 2); ctx.lineTo(w / 2, h);
    ctx.lineTo(w / 2, h - wallH); ctx.lineTo(0, h / 2 - wallH);
    ctx.closePath(); ctx.fill();

    // Right face with gradient
    const rGrad = ctx.createLinearGradient(w / 2, h / 2, w, h / 2);
    rGrad.addColorStop(0, wallLight);
    rGrad.addColorStop(1, wallColor);
    ctx.fillStyle = rGrad;
    ctx.beginPath();
    ctx.moveTo(w / 2, h); ctx.lineTo(w, h / 2);
    ctx.lineTo(w, h / 2 - wallH); ctx.lineTo(w / 2, h - wallH);
    ctx.closePath(); ctx.fill();

    // Top face
    ctx.fillStyle = wallTop;
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2 - wallH); ctx.lineTo(w, h / 2 - wallH);
    ctx.lineTo(w / 2, h - wallH); ctx.lineTo(0, h / 2 - wallH);
    ctx.closePath(); ctx.fill();

    // Vertical plank/line details
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 0.7;
    for (let i = 1; i < 3; i++) {
      const ly = h / 2 + i * (wallH / 3);
      ctx.beginPath();
      ctx.moveTo(0 + i * 2, h / 2 - wallH + ly * 0.3);
      ctx.lineTo(w / 2 - i * 2, h - wallH + ly * 0.3);
      ctx.stroke();
    }

    // Edge highlight along top ridge
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, h / 2 - wallH); ctx.lineTo(w / 2, h / 2 - wallH);
    ctx.lineTo(w, h / 2 - wallH);
    ctx.stroke();

    this.applyNoiseToRegion(ctx, 0, 0, w, h, 5);
  }

  private drawCampGroundThemed(
    ctx: CanvasRenderingContext2D, w: number, h: number,
    groundColor: string,
  ): void {
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, 0, w, h);

    this.applyNoiseToRegion(ctx, 0, 0, w, h, 6);

    // Plank lines
    const cx = w / 2, cy = h / 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 0.6;
    for (let i = -4; i <= 4; i++) {
      const ly = cy + i * h * 0.1;
      const inset = Math.abs(i) * w * 0.06;
      ctx.beginPath(); ctx.moveTo(cx - w * 0.4 + inset, ly); ctx.lineTo(cx + w * 0.4 - inset, ly); ctx.stroke();
    }

    // Subtle warm glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.4);
    glow.addColorStop(0, 'rgba(160,90,20,0.08)');
    glow.addColorStop(0.6, 'rgba(100,45,10,0.04)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ██ CHARACTER SPRITE SHEETS ██
  // ═══════════════════════════════════════════════════════════════════════

  private generatePlayerSheets(): void {
    this.generateFromDrawer(PlayerWarriorDrawer);
    this.generateFromDrawer(PlayerMageDrawer);
    this.generateFromDrawer(PlayerRogueDrawer);
  }

  private generateFromDrawer(drawer: EntityDrawer): void {
    if (this.shouldSkipGeneration(drawer.key)) return;

    const s = TEXTURE_SCALE;
    const fw = drawer.frameW * s, fh = drawer.frameH * s;
    const [canvas, ctx] = this.utils.createCanvas(fw * drawer.totalFrames, fh);

    const actions: [string, number, number][] = [
      ['idle', IDLE_START, IDLE_COUNT],
      ['walk', WALK_START, WALK_COUNT],
      ['attack', ATK_START, ATK_COUNT],
      ['hurt', HURT_START, HURT_COUNT],
      ['death', DEATH_START, DEATH_COUNT],
    ];
    if (drawer.totalFrames > MONSTER_FRAMES) {
      actions.push(['cast', CAST_START, CAST_COUNT]);
    }

    for (const [action, start, count] of actions) {
      for (let f = 0; f < count; f++) {
        const ox = (start + f) * fw;
        ctx.save();
        ctx.translate(ox, 0);
        drawer.drawFrame(ctx, f, action as any, fw, fh, this.utils);
        ctx.restore();
      }
    }

    this.utils.applyNoiseToRegion(ctx, 0, 0, canvas.width, canvas.height, 4);

    const key = drawer.key;
    if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
    const canvasTex = this.scene.textures.addCanvas(key, canvas)!;
    for (let i = 0; i < drawer.totalFrames; i++) {
      canvasTex.add(i, 0, i * fw, 0, fw, fh);
    }
  }

  private generateMonsterSheets(): void {
    // All monsters use custom drawers
    this.generateFromDrawer(SlimeDrawer);
    this.generateFromDrawer(SkeletonDrawer);
    this.generateFromDrawer(WerewolfDrawer);
    this.generateFromDrawer(FireElementalDrawer);
    this.generateFromDrawer(DesertScorpionDrawer);
    this.generateFromDrawer(GoblinDrawer);
    this.generateFromDrawer(GoblinChiefDrawer);
    this.generateFromDrawer(ZombieDrawer);
    this.generateFromDrawer(WerewolfAlphaDrawer);
    this.generateFromDrawer(GargoyleDrawer);
    this.generateFromDrawer(StoneGolemDrawer);
    this.generateFromDrawer(MountainTrollDrawer);
    this.generateFromDrawer(SandwormDrawer);
    this.generateFromDrawer(PhoenixDrawer);
    this.generateFromDrawer(ImpDrawer);
    this.generateFromDrawer(LesserDemonDrawer);
    this.generateFromDrawer(SuccubusDrawer);
    this.generateFromDrawer(DemonLordDrawer);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ██ NPC SPRITES ██
  // ═══════════════════════════════════════════════════════════════════════

  private generateFromNPCDrawer(drawer: EntityDrawer): void {
    if (this.shouldSkipGeneration(drawer.key)) return;

    const s = TEXTURE_SCALE;
    const fw = drawer.frameW * s, fh = drawer.frameH * s;
    const [canvas, ctx] = this.utils.createCanvas(fw * drawer.totalFrames, fh);

    const actions: [string, number, number][] = [
      ['working', NPC_WORK_START, NPC_WORK_COUNT],
      ['alert', NPC_ALERT_START, NPC_ALERT_COUNT],
      ['idle', NPC_IDLE_START, NPC_IDLE_COUNT],
      ['talking', NPC_TALK_START, NPC_TALK_COUNT],
    ];

    for (const [action, start, count] of actions) {
      for (let f = 0; f < count; f++) {
        const ox = (start + f) * fw;
        ctx.save();
        ctx.translate(ox, 0);
        drawer.drawFrame(ctx, f, action as any, fw, fh, this.utils);
        ctx.restore();
      }
    }

    this.utils.applyNoiseToRegion(ctx, 0, 0, canvas.width, canvas.height, 3);

    const key = drawer.key;
    if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
    const canvasTex = this.scene.textures.addCanvas(key, canvas)!;
    for (let i = 0; i < drawer.totalFrames; i++) {
      canvasTex.add(i, 0, i * fw, 0, fw, fh);
    }
  }

  private generateNPCSprites(): void {
    // All NPCs use custom drawers
    this.generateFromNPCDrawer(BlacksmithDrawer);
    this.generateFromNPCDrawer(BlacksmithAdvancedDrawer);
    this.generateFromNPCDrawer(MerchantDrawer);
    this.generateFromNPCDrawer(MerchantDesertDrawer);
    this.generateFromNPCDrawer(StashDrawer);
    this.generateFromNPCDrawer(QuestElderDrawer);
    this.generateFromNPCDrawer(QuestScoutDrawer);
    this.generateFromNPCDrawer(ForestHermitDrawer);
    this.generateFromNPCDrawer(QuestDwarfDrawer);
    this.generateFromNPCDrawer(QuestNomadDrawer);
    this.generateFromNPCDrawer(QuestWardenDrawer);
  }

  /** Generate a single-frame static texture from an EntityDrawer (decorations, effects). */
  private generateFromStaticDrawer(drawer: EntityDrawer): void {
    if (this.shouldSkipGeneration(drawer.key)) return;

    const s = TEXTURE_SCALE;
    const w = drawer.frameW * s, h = drawer.frameH * s;
    const [canvas, ctx] = this.utils.createCanvas(w, h);

    drawer.drawFrame(ctx, 0, 'idle', w, h, this.utils);

    if (this.scene.textures.exists(drawer.key)) this.scene.textures.remove(drawer.key);
    this.scene.textures.addCanvas(drawer.key, canvas);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ██ DECORATIONS & EFFECTS ██
  // ═══════════════════════════════════════════════════════════════════════

  private generateDecorations(): void {
    // Custom drawers — richer art, replace old template implementations
    const decorDrawers = [
      TreeDrawer, BushDrawer, RockDrawer, FlowerDrawer, MushroomDrawer,
      CactusDrawer, BoulderDrawer, CrystalDrawer, BonesDrawer,
    ];
    for (const drawer of decorDrawers) {
      this.generateFromStaticDrawer(drawer);
    }
  }

  // ── Sprite Helper ────────────────────────────────────────────────────

  private makeSprite(
    key: string, w: number, h: number,
    drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  ): void {
    if (this.scene.textures.exists(key)) return;
    const [canvas, ctx] = this.createCanvas(w, h);
    drawFn(ctx, w, h);
    this.scene.textures.addCanvas(key, canvas);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ██ CAMP DECORATION SPRITES ██
  // ═══════════════════════════════════════════════════════════════════════

  private generateCampDecorations(): void {
    const s = TEXTURE_SCALE;

    // camp_campfire — 48x40: stone ring base + crossed logs (fire rendered as particles in ZoneScene)
    this.makeSprite('camp_campfire', 48 * s, 40 * s, (ctx, w, h) => {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      this.fillEllipse(ctx, w / 2, h - 2 * s, 16 * s, 5 * s);
      // Stone ring base
      ctx.fillStyle = '#555560';
      this.fillEllipse(ctx, w / 2, h * 0.72, 16 * s, 6 * s);
      ctx.fillStyle = '#404045';
      this.fillEllipse(ctx, w / 2, h * 0.72, 11 * s, 4 * s);
      // Crossed logs
      ctx.strokeStyle = '#3a2010';
      ctx.lineWidth = 3 * s;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(w * 0.25, h * 0.78); ctx.lineTo(w * 0.75, h * 0.55); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * 0.75, h * 0.78); ctx.lineTo(w * 0.25, h * 0.55); ctx.stroke();
      // Embers glow (static hint — particles do the real fire)
      ctx.fillStyle = 'rgba(220,100,20,0.3)';
      this.fillEllipse(ctx, w / 2, h * 0.58, 6 * s, 3 * s);
    });

    // camp_torch — 24x40: vertical pole + bracket (flame rendered as particles in ZoneScene)
    this.makeSprite('camp_torch', 24 * s, 40 * s, (ctx, w, h) => {
      // Pole
      ctx.fillStyle = '#3a2010';
      ctx.fillRect(w / 2 - 2 * s, h * 0.35, 4 * s, h * 0.62);
      // Bracket at top
      ctx.fillStyle = '#555560';
      ctx.fillRect(w / 2 - 3.5 * s, h * 0.32, 7 * s, 2.5 * s);
      // Ember glow hint (static — particles do the real flame)
      ctx.fillStyle = 'rgba(220,100,20,0.25)';
      this.fillEllipse(ctx, w / 2, h * 0.28, 4 * s, 3 * s);
    });

    // camp_tent — 64x56: triangular pitched tent shape (roughly 1 tile footprint)
    this.makeSprite('camp_tent', 64 * s, 56 * s, (ctx, w, h) => {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      this.fillEllipse(ctx, w / 2, h - 2 * s, 26 * s, 5 * s);
      // Tent body (dark base)
      ctx.fillStyle = '#3a2a1a';
      ctx.beginPath();
      ctx.moveTo(w / 2, h * 0.08);
      ctx.lineTo(w * 0.95, h * 0.85);
      ctx.lineTo(w * 0.05, h * 0.85);
      ctx.closePath(); ctx.fill();
      // Tent facing panel (lighter)
      ctx.fillStyle = '#5a4028';
      ctx.beginPath();
      ctx.moveTo(w / 2, h * 0.15);
      ctx.lineTo(w * 0.78, h * 0.85);
      ctx.lineTo(w * 0.22, h * 0.85);
      ctx.closePath(); ctx.fill();
      // Inner flap / door shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.moveTo(w / 2, h * 0.45);
      ctx.lineTo(w * 0.60, h * 0.85);
      ctx.lineTo(w * 0.40, h * 0.85);
      ctx.closePath(); ctx.fill();
      // Ridge seam highlight
      ctx.strokeStyle = 'rgba(200,170,120,0.3)';
      ctx.lineWidth = s;
      ctx.beginPath();
      ctx.moveTo(w / 2, h * 0.08); ctx.lineTo(w / 2, h * 0.45);
      ctx.stroke();
      // Pole tip
      ctx.fillStyle = '#808080';
      this.fillCircle(ctx, w / 2, h * 0.05, 1.5 * s);
    });

    // camp_barrel — 24x32: rectangular body, horizontal band lines, elliptical top
    this.makeSprite('camp_barrel', 24 * s, 32 * s, (ctx, w, h) => {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      this.fillEllipse(ctx, w / 2, h - s, 9 * s, 2.5 * s);
      // Body
      const bGrad = ctx.createLinearGradient(w * 0.15, 0, w * 0.85, 0);
      bGrad.addColorStop(0, '#3a2a18');
      bGrad.addColorStop(0.4, '#5a4028');
      bGrad.addColorStop(1, '#2a1a0a');
      ctx.fillStyle = bGrad;
      this.roundRect(ctx, w * 0.15, h * 0.12, w * 0.7, h * 0.78, 2 * s);
      ctx.fill();
      // Metal band lines
      ctx.strokeStyle = '#707880';
      ctx.lineWidth = 1.2 * s;
      for (const band of [0.25, 0.5, 0.75]) {
        ctx.beginPath();
        ctx.moveTo(w * 0.15, h * band);
        ctx.lineTo(w * 0.85, h * band);
        ctx.stroke();
      }
      // Elliptical top
      ctx.fillStyle = '#4a3820';
      this.fillEllipse(ctx, w / 2, h * 0.14, w * 0.35, h * 0.07);
      ctx.strokeStyle = '#707880';
      ctx.lineWidth = 0.8 * s;
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.14, w * 0.35, h * 0.07, 0, 0, Math.PI * 2);
      ctx.stroke();
    });

    // camp_crate — 28x24: box with cross-plank detail, flat top
    this.makeSprite('camp_crate', 28 * s, 24 * s, (ctx, w, h) => {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      this.fillEllipse(ctx, w / 2, h - s, 11 * s, 2.5 * s);
      // Box body
      const cGrad = ctx.createLinearGradient(0, h * 0.1, 0, h * 0.9);
      cGrad.addColorStop(0, '#7a6040');
      cGrad.addColorStop(1, '#4a3820');
      ctx.fillStyle = cGrad;
      this.roundRect(ctx, w * 0.05, h * 0.1, w * 0.9, h * 0.82, s);
      ctx.fill();
      // Cross-plank detail
      ctx.strokeStyle = 'rgba(30,18,8,0.5)';
      ctx.lineWidth = s;
      // Horizontal center line
      ctx.beginPath(); ctx.moveTo(w * 0.05, h * 0.5); ctx.lineTo(w * 0.95, h * 0.5); ctx.stroke();
      // Vertical center line
      ctx.beginPath(); ctx.moveTo(w / 2, h * 0.1); ctx.lineTo(w / 2, h * 0.92); ctx.stroke();
      // Flat top face
      ctx.fillStyle = '#8a7050';
      this.roundRect(ctx, w * 0.05, h * 0.06, w * 0.9, h * 0.1, s);
      ctx.fill();
    });

    // camp_banner — 18x48: vertical pole, triangular flag hanging from top
    this.makeSprite('camp_banner', 18 * s, 48 * s, (ctx, w, h) => {
      // Pole
      ctx.fillStyle = '#3a2a10';
      ctx.fillRect(w / 2 - s, 0, 2 * s, h);
      // Metal tip
      ctx.fillStyle = '#909090';
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2 - 1.5 * s, 3 * s);
      ctx.lineTo(w / 2 + 1.5 * s, 3 * s);
      ctx.closePath(); ctx.fill();
      // Flag / banner (triangular, hangs from top)
      ctx.fillStyle = '#2a6a1a';
      ctx.beginPath();
      ctx.moveTo(w / 2 + s, h * 0.06);
      ctx.lineTo(w * 0.92, h * 0.38);
      ctx.lineTo(w / 2 + s, h * 0.38);
      ctx.closePath(); ctx.fill();
      // Banner highlight
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.moveTo(w / 2 + s, h * 0.06);
      ctx.lineTo(w * 0.75, h * 0.22);
      ctx.lineTo(w / 2 + s, h * 0.22);
      ctx.closePath(); ctx.fill();
    });

    // camp_well — 44x36: stone ring base, dark inner hole, two posts, crossbar
    this.makeSprite('camp_well', 44 * s, 36 * s, (ctx, w, h) => {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      this.fillEllipse(ctx, w / 2, h - 1.5 * s, 16 * s, 4 * s);
      // Stone ring base
      ctx.fillStyle = '#585860';
      this.fillEllipse(ctx, w / 2, h * 0.62, 11 * s, 5 * s);
      // Inner dark hole
      ctx.fillStyle = '#0a0a12';
      this.fillEllipse(ctx, w / 2, h * 0.60, 7 * s, 3 * s);
      // Subtle water sheen inside
      ctx.fillStyle = 'rgba(30,70,120,0.25)';
      this.fillEllipse(ctx, w / 2, h * 0.60, 5 * s, 2 * s);
      // Left post
      ctx.fillStyle = '#3a2a10';
      ctx.fillRect(w * 0.18, h * 0.15, 2.5 * s, h * 0.5);
      // Right post
      ctx.fillRect(w * 0.72, h * 0.15, 2.5 * s, h * 0.5);
      // Crossbar
      ctx.fillStyle = '#4a3a18';
      ctx.fillRect(w * 0.14, h * 0.12, w * 0.72, 2 * s);
      // Rope
      ctx.strokeStyle = '#8a7040';
      ctx.lineWidth = s;
      ctx.beginPath();
      ctx.moveTo(w / 2, h * 0.14); ctx.lineTo(w / 2, h * 0.58);
      ctx.stroke();
      // Bucket
      ctx.fillStyle = '#4a3820';
      this.roundRect(ctx, w / 2 - 2 * s, h * 0.5, 4 * s, 4 * s, s);
      ctx.fill();
    });
  }

  private generateEffects(): void {
    // Custom drawers — richer art, replace old template implementations
    this.generateFromStaticDrawer(LootBagDrawer);
    this.generateFromStaticDrawer(ExitPortalDrawer);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ██ ANIMATION REGISTRATION ██
  // ═══════════════════════════════════════════════════════════════════════

  private registerAnimations(): void {
    const anims = this.scene.anims;

    const registerEntitySet = (key: string, isPlayer: boolean) => {
      const defs: [string, number, number, number, number][] = [
        ['idle', IDLE_START, IDLE_COUNT, 6, -1],
        ['walk', WALK_START, WALK_COUNT, 10, -1],
        ['attack', ATK_START, ATK_COUNT, 12, 0],
        ['hurt', HURT_START, HURT_COUNT, 10, 0],
        ['death', DEATH_START, DEATH_COUNT, 6, 0],
      ];
      if (isPlayer) {
        defs.push(['cast', CAST_START, CAST_COUNT, 8, 0]);
      }
      for (const [action, start, count, rate, repeat] of defs) {
        const animKey = `${key}_${action}`;
        if (anims.exists(animKey)) anims.remove(animKey);
        anims.create({
          key: animKey,
          frames: anims.generateFrameNumbers(key, { start, end: start + count - 1 }),
          frameRate: rate,
          repeat,
        });
      }
    };

    const registerNPCSet = (key: string, workRate: number) => {
      const workKey = `${key}_working`;
      if (anims.exists(workKey)) anims.remove(workKey);
      anims.create({ key: workKey, frames: anims.generateFrameNumbers(key, { start: NPC_WORK_START, end: NPC_WORK_START + NPC_WORK_COUNT - 1 }), frameRate: workRate, repeat: -1 });

      const alertKey = `${key}_alert`;
      if (anims.exists(alertKey)) anims.remove(alertKey);
      anims.create({ key: alertKey, frames: anims.generateFrameNumbers(key, { start: NPC_ALERT_START, end: NPC_ALERT_START + NPC_ALERT_COUNT - 1 }), frameRate: 6, repeat: 0 });

      const idleKey = `${key}_idle`;
      if (anims.exists(idleKey)) anims.remove(idleKey);
      anims.create({ key: idleKey, frames: anims.generateFrameNumbers(key, { start: NPC_IDLE_START, end: NPC_IDLE_START + NPC_IDLE_COUNT - 1 }), frameRate: 4, repeat: -1 });

      const talkKey = `${key}_talking`;
      if (anims.exists(talkKey)) anims.remove(talkKey);
      anims.create({ key: talkKey, frames: anims.generateFrameNumbers(key, { start: NPC_TALK_START, end: NPC_TALK_START + NPC_TALK_COUNT - 1 }), frameRate: 5, repeat: -1 });
    };

    // Players (with cast animation)
    registerEntitySet(PlayerWarriorDrawer.key, true);
    registerEntitySet(PlayerMageDrawer.key, true);
    registerEntitySet(PlayerRogueDrawer.key, true);

    // Monsters
    registerEntitySet(SlimeDrawer.key, false);
    registerEntitySet(SkeletonDrawer.key, false);
    registerEntitySet(WerewolfDrawer.key, false);
    registerEntitySet(FireElementalDrawer.key, false);
    registerEntitySet(DesertScorpionDrawer.key, false);
    registerEntitySet(GoblinDrawer.key, false);
    registerEntitySet(GoblinChiefDrawer.key, false);
    registerEntitySet(ZombieDrawer.key, false);
    registerEntitySet(WerewolfAlphaDrawer.key, false);
    registerEntitySet(GargoyleDrawer.key, false);
    registerEntitySet(StoneGolemDrawer.key, false);
    registerEntitySet(MountainTrollDrawer.key, false);
    registerEntitySet(SandwormDrawer.key, false);
    registerEntitySet(PhoenixDrawer.key, false);
    registerEntitySet(ImpDrawer.key, false);
    registerEntitySet(LesserDemonDrawer.key, false);
    registerEntitySet(SuccubusDrawer.key, false);
    registerEntitySet(DemonLordDrawer.key, false);

    // NPCs — work rate reflects their accessory animation speed
    registerNPCSet(BlacksmithDrawer.key, 6);          // hammer
    registerNPCSet(BlacksmithAdvancedDrawer.key, 6);  // hammer
    registerNPCSet(MerchantDrawer.key, 5);            // coinbag
    registerNPCSet(MerchantDesertDrawer.key, 5);      // coinbag
    registerNPCSet(StashDrawer.key, 3);               // book
    registerNPCSet(QuestElderDrawer.key, 3);          // staff
    registerNPCSet(QuestScoutDrawer.key, 5);          // sword
    registerNPCSet(ForestHermitDrawer.key, 3);        // staff
    registerNPCSet(QuestDwarfDrawer.key, 6);          // pickaxe
    registerNPCSet(QuestNomadDrawer.key, 4);          // lantern
    registerNPCSet(QuestWardenDrawer.key, 5);         // sword
  }
}
