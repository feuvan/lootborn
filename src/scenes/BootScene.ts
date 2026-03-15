import Phaser from 'phaser';
import { SpriteGenerator } from '../graphics/SpriteGenerator';
import { SkillEffectSystem } from '../systems/SkillEffectSystem';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const { width, height } = this.cameras.main;
    const barW = 400, barH = 12;
    const barY = height / 2;
    this.add.rectangle(width / 2, barY, barW, barH, 0x1a1a2e).setStrokeStyle(1, 0x333344);
    const fill = this.add.rectangle((width - barW) / 2 + 2, barY, 0, barH - 4, 0xc0934a).setOrigin(0, 0.5);
    const loadingText = this.add.text(width / 2, barY - 24, '锻造渊火...', {
      fontSize: '14px', color: '#c0934a', fontFamily: '"Cinzel", serif',
    }).setOrigin(0.5);
    this.load.on('progress', (v: number) => { fill.width = (barW - 4) * v; });
    this.load.on('complete', () => { loadingText.setText('准备就绪!'); });

    // Silently handle missing asset files — procedural fallbacks will fill gaps
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.debug(`[BootScene] Asset not found, will use fallback: ${file.key}`);
    });

    // ── External assets (optional overrides) ─────────────────────
    const tiles = ['grass', 'dirt', 'stone', 'water', 'wall', 'camp'];
    for (const t of tiles) {
      this.load.image(`tile_${t}`, `assets/tiles/tile_${t}.png`);
    }

    const classes = ['warrior', 'mage', 'rogue'];
    for (const c of classes) {
      this.load.image(`player_${c}`, `assets/sprites/players/player_${c}.png`);
    }

    const monsters = [
      'slime', 'goblin', 'goblin_chief', 'skeleton', 'zombie', 'werewolf',
      'werewolf_alpha', 'gargoyle', 'stone_golem', 'mountain_troll',
      'fire_elemental', 'desert_scorpion', 'sandworm', 'phoenix',
      'imp', 'lesser_demon', 'succubus', 'demon_lord',
    ];
    for (const m of monsters) {
      this.load.image(`monster_${m}`, `assets/sprites/monsters/monster_${m}.png`);
    }

    const npcTypes = ['blacksmith', 'merchant', 'quest', 'stash'];
    for (const n of npcTypes) {
      this.load.image(`npc_${n}`, `assets/sprites/npcs/npc_${n}.png`);
    }

    const decors = ['tree', 'bush', 'rock', 'flower', 'mushroom', 'cactus', 'boulder', 'crystal', 'bones'];
    for (const d of decors) {
      this.load.image(`decor_${d}`, `assets/sprites/decorations/decor_${d}.png`);
    }

    this.load.image('loot_bag', 'assets/sprites/effects/loot_bag.png');
    this.load.image('exit_portal', 'assets/sprites/effects/exit_portal.png');
  }

  create(): void {
    // Generate all procedural textures + sprite sheets + animations
    const generator = new SpriteGenerator(this);
    generator.generateAll();

    // Skill effect particle textures
    SkillEffectSystem.generateTextures(this);

    this.scene.start('MenuScene');
  }
}
