import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const { width, height } = this.cameras.main;
    const barW = 300, barH = 20;
    const barY = height / 2;
    this.add.rectangle(width / 2, barY, barW, barH, 0x333333).setStrokeStyle(1, 0x666666);
    const fill = this.add.rectangle((width - barW) / 2 + 2, barY, 0, barH - 4, 0x3498db).setOrigin(0, 0.5);
    const loadingText = this.add.text(width / 2, barY - 30, '锻造暗烬大陆...', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.load.on('progress', (v: number) => { fill.width = (barW - 4) * v; });
    this.load.on('complete', () => { loadingText.setText('准备就绪!'); });
  }

  create(): void {
    this.generateTiles();
    this.generatePlayerSprites();
    this.generateMonsterSprites();
    this.generateNPCSprites();
    this.generateEffects();
    this.scene.start('MenuScene');
  }

  // ── Isometric Tiles ──────────────────────────────────────
  private generateTiles(): void {
    this.makeIsoTile('tile_grass', (g, w, h) => {
      // Lush grass with variation
      this.fillDiamond(g, w, h, 0x4a8c3f);
      // Grass blades
      const cx = w / 2, cy = h / 2;
      for (let i = 0; i < 12; i++) {
        const ox = (Math.random() - 0.5) * w * 0.6;
        const oy = (Math.random() - 0.5) * h * 0.4;
        const shade = [0x5ca04e, 0x3d7a34, 0x68b85e, 0x2f6627][Math.floor(Math.random() * 4)];
        g.fillStyle(shade);
        g.fillRect(cx + ox, cy + oy, 2, 2);
      }
      // Small flowers
      if (Math.random() > 0.5) {
        g.fillStyle(0xf1c40f);
        g.fillRect(cx + 8, cy - 2, 2, 2);
      }
      this.strokeDiamond(g, w, h, 0x3d7a34, 0.4);
    });

    this.makeIsoTile('tile_dirt', (g, w, h) => {
      this.fillDiamond(g, w, h, 0x8b7355);
      const cx = w / 2, cy = h / 2;
      // Pebbles and cracks
      for (let i = 0; i < 8; i++) {
        const ox = (Math.random() - 0.5) * w * 0.5;
        const oy = (Math.random() - 0.5) * h * 0.3;
        g.fillStyle([0x7a6548, 0x9c8468, 0x6b5a42][Math.floor(Math.random() * 3)]);
        g.fillRect(cx + ox, cy + oy, 2, 1);
      }
      // Path worn lines
      g.lineStyle(1, 0x7a6548, 0.3);
      g.lineBetween(cx - 10, cy, cx + 10, cy);
      this.strokeDiamond(g, w, h, 0x6b5a42, 0.4);
    });

    this.makeIsoTile('tile_stone', (g, w, h) => {
      this.fillDiamond(g, w, h, 0x707070);
      const cx = w / 2, cy = h / 2;
      // Stone texture cracks
      g.lineStyle(1, 0x555555, 0.5);
      g.lineBetween(cx - 8, cy - 3, cx + 5, cy + 2);
      g.lineBetween(cx + 3, cy - 5, cx - 4, cy + 4);
      // Highlights
      for (let i = 0; i < 6; i++) {
        const ox = (Math.random() - 0.5) * w * 0.4;
        const oy = (Math.random() - 0.5) * h * 0.3;
        g.fillStyle(0x888888);
        g.fillRect(cx + ox, cy + oy, 2, 1);
      }
      this.strokeDiamond(g, w, h, 0x555555, 0.5);
    });

    this.makeIsoTile('tile_water', (g, w, h) => {
      this.fillDiamond(g, w, h, 0x2471a3);
      const cx = w / 2, cy = h / 2;
      // Ripples
      g.lineStyle(1, 0x5dade2, 0.6);
      g.beginPath();
      g.arc(cx - 6, cy - 1, 4, 0.2, 2.8, false);
      g.strokePath();
      g.beginPath();
      g.arc(cx + 8, cy + 2, 3, 0.5, 2.5, false);
      g.strokePath();
      // Shimmer
      g.fillStyle(0x85c1e9, 0.5);
      g.fillRect(cx + 2, cy - 3, 3, 1);
      g.fillRect(cx - 10, cy + 1, 2, 1);
      this.strokeDiamond(g, w, h, 0x1a5276, 0.6);
    });

    this.makeIsoTile('tile_wall', (g, w, h) => {
      // Wall with bricks and height
      this.fillDiamond(g, w, h, 0x4a4a4a);
      const cx = w / 2, cy = h / 2;
      // Top face (slightly lighter)
      g.fillStyle(0x5a5a5a);
      g.fillPoints([
        new Phaser.Geom.Point(cx, cy - h / 2 - 6),
        new Phaser.Geom.Point(cx + w / 2, cy - 6),
        new Phaser.Geom.Point(cx, cy + h / 2 - 6),
        new Phaser.Geom.Point(cx - w / 2, cy - 6),
      ], true);
      // Brick lines
      g.lineStyle(1, 0x3a3a3a, 0.6);
      g.lineBetween(cx - 12, cy - 4, cx + 12, cy - 4);
      g.lineBetween(cx - 8, cy - 8, cx + 8, cy - 8);
      g.lineBetween(cx - 4, cy, cx + 4, cy);
      // Vertical mortar
      g.lineBetween(cx, cy - 8, cx, cy - 4);
      g.lineBetween(cx - 6, cy - 4, cx - 6, cy);
      g.lineBetween(cx + 6, cy - 4, cx + 6, cy);
      this.strokeDiamond(g, w, h, 0x333333, 0.7);
    });

    this.makeIsoTile('tile_camp', (g, w, h) => {
      this.fillDiamond(g, w, h, 0xb8956b);
      const cx = w / 2, cy = h / 2;
      // Wooden floor planks
      g.lineStyle(1, 0x8b6f47, 0.4);
      for (let i = -3; i <= 3; i++) {
        g.lineBetween(cx - 15 + Math.abs(i) * 2, cy + i * 2, cx + 15 - Math.abs(i) * 2, cy + i * 2);
      }
      // Campfire glow center
      g.fillStyle(0xf39c12, 0.3);
      g.fillCircle(cx, cy, 4);
      g.fillStyle(0xe74c3c, 0.5);
      g.fillRect(cx - 1, cy - 2, 2, 3);
      g.fillStyle(0xf1c40f, 0.7);
      g.fillRect(cx, cy - 3, 1, 2);
      this.strokeDiamond(g, w, h, 0x8b6f47, 0.5);
    });
  }

  // ── Player Sprites ───────────────────────────────────────
  private generatePlayerSprites(): void {
    const classes: [string, number, number, string][] = [
      ['player_warrior', 0x3498db, 0x2980b9, 'sword'],
      ['player_mage',    0x9b59b6, 0x8e44ad, 'staff'],
      ['player_rogue',   0x2ecc71, 0x27ae60, 'dagger'],
    ];
    for (const [key, bodyColor, darkColor, weapon] of classes) {
      this.makeSprite(key, 32, 48, (g) => {
        // Shadow
        g.fillStyle(0x000000, 0.25);
        g.fillEllipse(16, 44, 18, 6);
        // Boots
        g.fillStyle(0x5d4037);
        g.fillRect(10, 38, 5, 4);
        g.fillRect(17, 38, 5, 4);
        // Legs
        g.fillStyle(0x4a4a4a);
        g.fillRect(11, 32, 4, 7);
        g.fillRect(17, 32, 4, 7);
        // Body armor
        g.fillStyle(bodyColor);
        g.fillRect(9, 20, 14, 13);
        g.fillStyle(darkColor);
        g.fillRect(9, 20, 14, 2);
        g.fillRect(9, 31, 14, 2);
        // Belt
        g.fillStyle(0x8d6e63);
        g.fillRect(9, 30, 14, 2);
        g.fillStyle(0xfdd835);
        g.fillRect(15, 30, 2, 2); // buckle
        // Arms
        g.fillStyle(bodyColor);
        g.fillRect(6, 22, 3, 8);  // left arm
        g.fillRect(23, 22, 3, 8); // right arm
        // Hands
        g.fillStyle(0xffcc80);
        g.fillRect(6, 29, 3, 2);
        g.fillRect(23, 29, 3, 2);
        // Head
        g.fillStyle(0xffcc80);
        g.fillRect(11, 10, 10, 10);
        // Eyes
        g.fillStyle(0x000000);
        g.fillRect(13, 14, 2, 2);
        g.fillRect(18, 14, 2, 2);
        // Hair/Helmet varies by class
        if (weapon === 'sword') {
          // Warrior helmet
          g.fillStyle(0x78909c);
          g.fillRect(10, 8, 12, 5);
          g.fillRect(12, 6, 8, 3);
          g.fillStyle(0x546e7a);
          g.fillRect(10, 12, 12, 1);
          // Nose guard
          g.fillStyle(0x78909c);
          g.fillRect(15, 13, 2, 3);
        } else if (weapon === 'staff') {
          // Mage hat
          g.fillStyle(0x7b1fa2);
          g.fillRect(9, 8, 14, 4);
          g.fillRect(11, 4, 10, 5);
          g.fillRect(13, 1, 6, 4);
          g.fillStyle(0xfdd835);
          g.fillRect(15, 1, 2, 2); // star on hat
        } else {
          // Rogue hood
          g.fillStyle(0x2e7d32);
          g.fillRect(10, 7, 12, 6);
          g.fillRect(9, 10, 14, 4);
          g.fillStyle(0x1b5e20);
          g.fillRect(10, 13, 12, 1);
        }
        // Weapon
        if (weapon === 'sword') {
          g.fillStyle(0xbdbdbd);
          g.fillRect(25, 15, 2, 16);
          g.fillStyle(0x8d6e63);
          g.fillRect(24, 28, 4, 3); // hilt
          g.fillStyle(0xfdd835);
          g.fillRect(24, 27, 4, 1); // crossguard
        } else if (weapon === 'staff') {
          g.fillStyle(0x795548);
          g.fillRect(26, 8, 2, 24);
          g.fillStyle(0x7e57c2);
          g.fillCircle(27, 7, 3); // orb
          g.fillStyle(0xce93d8, 0.6);
          g.fillRect(26, 5, 2, 2);
        } else {
          g.fillStyle(0xbdbdbd);
          g.fillRect(25, 24, 2, 8);
          g.fillStyle(0x8d6e63);
          g.fillRect(24, 31, 4, 2);
          // Second dagger
          g.fillStyle(0xbdbdbd);
          g.fillRect(4, 24, 2, 8);
          g.fillStyle(0x8d6e63);
          g.fillRect(3, 31, 4, 2);
        }
      });
    }
  }

  // ── Monster Sprites ──────────────────────────────────────
  private generateMonsterSprites(): void {
    // Slime
    this.makeSprite('monster_slime', 24, 20, (g) => {
      g.fillStyle(0x000000, 0.2);
      g.fillEllipse(12, 18, 16, 4);
      g.fillStyle(0x2ecc71);
      g.fillEllipse(12, 12, 18, 14);
      g.fillStyle(0x58d68d, 0.6);
      g.fillEllipse(10, 9, 6, 4);
      g.fillStyle(0xffffff);
      g.fillCircle(9, 10, 2);
      g.fillCircle(15, 10, 2);
      g.fillStyle(0x000000);
      g.fillCircle(10, 10, 1);
      g.fillCircle(15, 10, 1);
    });

    // Goblin
    this.makeSprite('monster_goblin', 24, 28, (g) => {
      g.fillStyle(0x000000, 0.2);
      g.fillEllipse(12, 26, 14, 4);
      g.fillStyle(0x558b2f);
      g.fillRect(8, 18, 3, 7);
      g.fillRect(13, 18, 3, 7);
      g.fillStyle(0x689f38);
      g.fillRect(7, 10, 10, 9);
      g.fillRect(5, 12, 3, 5);
      g.fillRect(17, 14, 3, 3);
      g.fillStyle(0x7cb342);
      g.fillRect(8, 4, 8, 7);
      g.fillStyle(0xffeb3b);
      g.fillCircle(10, 6, 2);
      g.fillCircle(14, 6, 2);
      g.fillStyle(0x000000);
      g.fillRect(10, 6, 1, 1);
      g.fillRect(14, 6, 1, 1);
      g.fillStyle(0x7cb342);
      g.fillRect(7, 3, 3, 4); // ears
      g.fillRect(14, 3, 3, 4);
      g.fillStyle(0xbdbdbd);
      g.fillRect(19, 12, 2, 6); // club
      g.fillStyle(0x795548);
      g.fillRect(18, 17, 4, 2);
    });

    // Goblin Chief (bigger, crown)
    this.makeSprite('monster_goblin_chief', 30, 34, (g) => {
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(15, 32, 18, 5);
      g.fillStyle(0x558b2f);
      g.fillRect(9, 22, 5, 9);
      g.fillRect(16, 22, 5, 9);
      g.fillStyle(0x689f38);
      g.fillRect(7, 12, 16, 11);
      g.fillRect(4, 14, 4, 6);
      g.fillRect(22, 14, 4, 6);
      g.fillStyle(0x7cb342);
      g.fillRect(9, 5, 12, 8);
      g.fillStyle(0xff0000);
      g.fillCircle(12, 8, 2);
      g.fillCircle(18, 8, 2);
      g.fillStyle(0x000000);
      g.fillRect(12, 8, 1, 1);
      g.fillRect(18, 8, 1, 1);
      // Crown
      g.fillStyle(0xfdd835);
      g.fillRect(9, 2, 12, 4);
      g.fillRect(10, 0, 2, 3);
      g.fillRect(14, 0, 2, 3);
      g.fillRect(18, 0, 2, 3);
      g.fillStyle(0xe53935);
      g.fillRect(14, 1, 2, 2);
      // Large axe
      g.fillStyle(0x795548);
      g.fillRect(25, 6, 2, 18);
      g.fillStyle(0x9e9e9e);
      g.fillRect(23, 5, 6, 4);
      g.fillRect(22, 6, 8, 2);
    });

    // Skeleton
    this.makeSprite('monster_skeleton', 22, 30, (g) => {
      g.fillStyle(0x000000, 0.2);
      g.fillEllipse(11, 28, 14, 4);
      g.fillStyle(0xe0e0e0);
      g.fillRect(8, 22, 2, 6);
      g.fillRect(12, 22, 2, 6);
      g.fillRect(7, 12, 8, 10);
      g.fillStyle(0xbdbdbd);
      g.fillRect(8, 14, 6, 2);
      g.fillRect(8, 18, 6, 2);
      g.fillStyle(0xe0e0e0);
      g.fillRect(4, 14, 3, 2);
      g.fillRect(15, 14, 3, 2);
      g.fillRect(8, 4, 6, 8);
      g.fillStyle(0x000000);
      g.fillRect(9, 6, 2, 2);
      g.fillRect(12, 6, 2, 2);
      g.fillRect(10, 9, 3, 1);
      // Rusty sword
      g.fillStyle(0x8d6e63);
      g.fillRect(17, 10, 2, 12);
      g.fillStyle(0x795548);
      g.fillRect(16, 20, 4, 2);
    });

    // Zombie
    this.makeSprite('monster_zombie', 22, 30, (g) => {
      g.fillStyle(0x000000, 0.2);
      g.fillEllipse(11, 28, 14, 4);
      g.fillStyle(0x5d4037);
      g.fillRect(7, 22, 3, 7);
      g.fillRect(12, 22, 3, 7);
      g.fillStyle(0x4e342e);
      g.fillRect(6, 12, 10, 11);
      g.fillStyle(0x6d8b74);
      g.fillRect(4, 14, 3, 6);
      g.fillRect(15, 16, 3, 4);
      g.fillStyle(0x8fad8b);
      g.fillRect(7, 4, 8, 8);
      g.fillStyle(0xc62828);
      g.fillRect(9, 6, 2, 2);
      g.fillRect(13, 7, 2, 2);
      g.fillStyle(0x000000);
      g.fillRect(10, 9, 3, 1);
    });

    // Werewolf
    this.makeSprite('monster_werewolf', 26, 32, (g) => {
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(13, 30, 18, 5);
      g.fillStyle(0x5d4037);
      g.fillRect(8, 22, 4, 8);
      g.fillRect(14, 22, 4, 8);
      g.fillStyle(0x6d4c41);
      g.fillRect(6, 12, 14, 11);
      g.fillStyle(0x795548);
      g.fillRect(4, 14, 3, 6);
      g.fillRect(19, 14, 3, 6);
      g.fillStyle(0x8d6e63);
      g.fillRect(8, 3, 10, 10);
      g.fillRect(6, 1, 4, 5);  // ears
      g.fillRect(16, 1, 4, 5);
      g.fillStyle(0xffeb3b);
      g.fillCircle(10, 7, 2);
      g.fillCircle(16, 7, 2);
      g.fillStyle(0x000000);
      g.fillRect(10, 7, 1, 1);
      g.fillRect(16, 7, 1, 1);
      // Snout
      g.fillStyle(0xa1887f);
      g.fillRect(11, 10, 4, 3);
      g.fillStyle(0x000000);
      g.fillRect(12, 10, 2, 1);
      // Claws
      g.fillStyle(0xe0e0e0);
      g.fillRect(3, 19, 2, 2);
      g.fillRect(21, 19, 2, 2);
    });

    // Generic monsters for later zones
    const genericMonsters: [string, number, number, number][] = [
      ['monster_werewolf_alpha', 0x4e342e, 30, 36],
      ['monster_gargoyle', 0x616161, 26, 30],
      ['monster_stone_golem', 0x757575, 30, 34],
      ['monster_mountain_troll', 0x558b2f, 32, 36],
      ['monster_fire_elemental', 0xe65100, 24, 30],
      ['monster_desert_scorpion', 0x8d6e63, 26, 22],
      ['monster_sandworm', 0xc9a96e, 28, 24],
      ['monster_phoenix', 0xff6f00, 28, 28],
      ['monster_imp', 0xb71c1c, 20, 24],
      ['monster_lesser_demon', 0x880e4f, 26, 32],
      ['monster_succubus', 0xad1457, 24, 32],
      ['monster_demon_lord', 0x4a148c, 36, 42],
    ];
    for (const [key, color, w, h] of genericMonsters) {
      this.makeSprite(key, w, h, (g) => {
        g.fillStyle(0x000000, 0.2);
        g.fillEllipse(w / 2, h - 2, w * 0.7, 4);
        // Body
        g.fillStyle(color);
        g.fillRect(w * 0.2, h * 0.35, w * 0.6, h * 0.45);
        // Head
        const headColor = Phaser.Display.Color.IntegerToColor(color).lighten(20).color;
        g.fillStyle(headColor);
        g.fillRect(w * 0.25, h * 0.1, w * 0.5, h * 0.3);
        // Eyes
        g.fillStyle(key.includes('fire') || key.includes('phoenix') ? 0xffeb3b : key.includes('demon') ? 0xff1744 : 0xffffff);
        g.fillRect(w * 0.32, h * 0.18, 2, 2);
        g.fillRect(w * 0.58, h * 0.18, 2, 2);
        g.fillStyle(0x000000);
        g.fillRect(w * 0.33, h * 0.19, 1, 1);
        g.fillRect(w * 0.59, h * 0.19, 1, 1);
        // Legs
        const legColor = Phaser.Display.Color.IntegerToColor(color).darken(15).color;
        g.fillStyle(legColor);
        g.fillRect(w * 0.25, h * 0.75, w * 0.15, h * 0.2);
        g.fillRect(w * 0.55, h * 0.75, w * 0.15, h * 0.2);
        // Elite / boss glow
        if (key.includes('alpha') || key.includes('lord') || key.includes('phoenix') || key.includes('troll')) {
          g.fillStyle(0xfdd835, 0.5);
          g.fillRect(w * 0.3, h * 0.02, w * 0.1, h * 0.06);
          g.fillRect(w * 0.45, h * 0.02, w * 0.1, h * 0.06);
          g.fillRect(w * 0.6, h * 0.02, w * 0.1, h * 0.06);
        }
        // Special effects per type
        if (key.includes('fire') || key.includes('phoenix')) {
          // Fire particles
          g.fillStyle(0xff6f00, 0.7);
          g.fillRect(w * 0.15, h * 0.2, 2, 3);
          g.fillRect(w * 0.75, h * 0.25, 2, 3);
          g.fillStyle(0xffab00, 0.5);
          g.fillRect(w * 0.1, h * 0.35, 2, 2);
          g.fillRect(w * 0.8, h * 0.3, 2, 2);
        }
        if (key.includes('demon') || key.includes('succubus')) {
          // Horns
          g.fillStyle(0x212121);
          g.fillRect(w * 0.2, h * 0.05, 3, h * 0.1);
          g.fillRect(w * 0.72, h * 0.05, 3, h * 0.1);
        }
        if (key === 'monster_demon_lord') {
          // Wings
          g.fillStyle(0x311b92, 0.7);
          g.fillRect(0, h * 0.15, w * 0.18, h * 0.35);
          g.fillRect(w * 0.82, h * 0.15, w * 0.18, h * 0.35);
          // Aura
          g.lineStyle(1, 0xea80fc, 0.4);
          g.strokeCircle(w / 2, h * 0.4, w * 0.4);
        }
      });
    }
  }

  // ── NPC Sprites ──────────────────────────────────────────
  private generateNPCSprites(): void {
    // These are used via NPC.ts's getMonsterColor() path — NPC uses rectangles now.
    // We generate named textures if we want to switch NPC to image-based later.
  }

  // ── Effects ──────────────────────────────────────────────
  private generateEffects(): void {
    // Loot bag
    this.makeSprite('loot_bag', 12, 12, (g) => {
      g.fillStyle(0x8d6e63);
      g.fillRect(3, 3, 6, 8);
      g.fillStyle(0xa1887f);
      g.fillRect(4, 2, 4, 2);
      g.fillStyle(0xfdd835);
      g.fillRect(5, 6, 2, 2);
    });
  }

  // ── Helpers ──────────────────────────────────────────────
  private makeIsoTile(key: string, draw: (g: Phaser.GameObjects.Graphics, w: number, h: number) => void): void {
    const w = 64, h = 32;
    const g = this.add.graphics();
    draw(g, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private fillDiamond(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number): void {
    const hw = w / 2, hh = h / 2;
    g.fillStyle(color);
    g.fillPoints([
      new Phaser.Geom.Point(hw, 0),
      new Phaser.Geom.Point(w, hh),
      new Phaser.Geom.Point(hw, h),
      new Phaser.Geom.Point(0, hh),
    ], true);
  }

  private strokeDiamond(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number, alpha: number): void {
    const hw = w / 2, hh = h / 2;
    g.lineStyle(1, color, alpha);
    g.beginPath();
    g.moveTo(hw, 0);
    g.lineTo(w, hh);
    g.lineTo(hw, h);
    g.lineTo(0, hh);
    g.closePath();
    g.strokePath();
  }

  private makeSprite(key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void): void {
    const g = this.add.graphics();
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
