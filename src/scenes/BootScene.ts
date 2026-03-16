import Phaser from 'phaser';
import { SpriteGenerator } from '../graphics/SpriteGenerator';
import { SkillEffectSystem } from '../systems/SkillEffectSystem';
import { audioManager } from '../systems/audio/AudioManager';
import { buildFrameSizeRegistry } from '../graphics/sprites/types';
import { TEXTURE_SCALE } from '../config';

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

    // ── External assets (optional spritesheet overrides) ─────────────────
    const registry = buildFrameSizeRegistry();
    const s = TEXTURE_SCALE;

    // Load entity spritesheets (frame dimensions scaled by TEXTURE_SCALE)
    for (const [key, { frameWidth, frameHeight }] of Object.entries(registry)) {
      const path = this.getAssetPath(key);
      this.load.spritesheet(key, path, {
        frameWidth: frameWidth * s,
        frameHeight: frameHeight * s,
      });
    }

    // Decorations (single-frame images — no spritesheet needed)
    const decors = ['tree', 'bush', 'rock', 'flower', 'mushroom', 'cactus', 'boulder', 'crystal', 'bones'];
    for (const d of decors) {
      this.load.image(`decor_${d}`, `assets/sprites/decorations/decor_${d}.png`);
    }

    // Effects (single-frame images)
    this.load.image('loot_bag', 'assets/sprites/effects/loot_bag.png');
    this.load.image('exit_portal', 'assets/sprites/effects/exit_portal.png');

    // Tiles (keep as-is)
    const tiles = ['grass', 'dirt', 'stone', 'water', 'wall', 'camp'];
    for (const t of tiles) {
      this.load.image(`tile_${t}`, `assets/tiles/tile_${t}.png`);
    }

    // ── Audio assets (optional overrides) ─────────────────────
    const zones = ['emerald_plains', 'twilight_forest', 'anvil_mountains', 'scorching_desert', 'abyss_rift'];
    const musicStates = ['explore', 'combat', 'victory'];
    for (const z of zones) {
      for (const s of musicStates) {
        this.load.audio(`bgm_${z}_${s}`, `assets/audio/bgm/${z}_${s}.mp3`);
      }
    }
    // SFX external overrides — only load if files are actually shipped.
    // Currently no SFX mp3 files exist; SFXEngine uses procedural synthesis.
    // Uncomment when real SFX assets are added to public/assets/audio/sfx/.
    // const sfxTypes = [
    //   'hit', 'hit_heavy', 'crit', 'miss', 'block', 'player_hurt', 'monster_death', 'player_death',
    //   'skill_melee', 'skill_fire', 'skill_ice', 'skill_lightning', 'skill_heal', 'skill_buff',
    //   'loot_common', 'loot_magic', 'loot_rare', 'loot_legendary', 'equip', 'potion',
    //   'click', 'panel_open', 'panel_close', 'error',
    //   'zone_transition', 'quest_complete', 'levelup', 'npc_interact',
    // ];
    // for (const t of sfxTypes) {
    //   this.load.audio(`sfx_${t}`, `assets/audio/sfx/${t}.mp3`);
    // }
  }

  create(): void {
    // Generate all procedural textures + sprite sheets + animations
    const generator = new SpriteGenerator(this);
    generator.generateAll();

    // Skill effect particle textures
    SkillEffectSystem.generateTextures(this);

    // Pass any successfully loaded audio files to the AudioLoader.
    // Phaser's WebAudioSoundManager decodes audio during loading, so the cache
    // contains AudioBuffer objects (not raw ArrayBuffers).
    const loader = audioManager.getLoader();
    const audioKeys = this.cache.audio.getKeys();
    for (const key of audioKeys) {
      const audioData = this.cache.audio.get(key);
      if (audioData instanceof AudioBuffer) {
        loader.storeBuffer(key, audioData);
      } else if (audioData instanceof ArrayBuffer) {
        const ctx = new AudioContext();
        loader.decodeAudio(ctx, key, audioData).catch(() => {
          console.debug(`[BootScene] Failed to decode audio: ${key}`);
        });
      }
    }

    this.scene.start('MenuScene');
  }

  private getAssetPath(key: string): string {
    if (key.startsWith('player_')) return `assets/sprites/players/${key}.png`;
    if (key.startsWith('monster_')) return `assets/sprites/monsters/${key}.png`;
    if (key.startsWith('npc_')) return `assets/sprites/npcs/${key}.png`;
    return `assets/sprites/${key}.png`;
  }
}
