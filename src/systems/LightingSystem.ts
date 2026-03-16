import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export interface LightSource {
  /** World position x */
  x: number;
  /** World position y */
  y: number;
  /** Light radius in pixels */
  radius: number;
  /** Light color as 0xRRGGBB */
  color: number;
  /** Intensity 0-1 */
  intensity: number;
  /** Whether this light flickers */
  flicker?: boolean;
  /** Unique ID for removal */
  id?: string;
}

interface ZoneAmbient {
  color: number;
  alpha: number;
}

const ZONE_AMBIENTS: Record<string, ZoneAmbient> = {
  emerald_plains:    { color: 0x040610, alpha: 0.10 },
  twilight_forest:   { color: 0x020408, alpha: 0.20 },
  anvil_mountains:   { color: 0x080608, alpha: 0.15 },
  scorching_desert:  { color: 0x0c0804, alpha: 0.08 },
  abyss_rift:        { color: 0x040004, alpha: 0.28 },
};

export class LightingSystem {
  private scene: Phaser.Scene;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private overlay: Phaser.GameObjects.Image;
  private lights: LightSource[] = [];
  private ambientColor: number = 0x040610;
  private ambientAlpha: number = 0.35;
  private time: number = 0;

  // Render at half resolution for soft look + performance
  private readonly renderW: number;
  private readonly renderH: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.renderW = Math.ceil(GAME_WIDTH / 2);
    this.renderH = Math.ceil(GAME_HEIGHT / 2);

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.renderW;
    this.canvas.height = this.renderH;
    this.ctx = this.canvas.getContext('2d')!;

    // Create overlay texture and image
    const texKey = 'lighting_overlay';
    if (scene.textures.exists(texKey)) scene.textures.remove(texKey);
    scene.textures.addCanvas(texKey, this.canvas);
    this.overlay = scene.add.image(0, 0, texKey);
    this.overlay.setOrigin(0, 0);
    this.overlay.setScrollFactor(0);
    this.overlay.setScale(2);
    this.overlay.setDepth(999);
    this.overlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  setZone(zoneId: string): void {
    const ambient = ZONE_AMBIENTS[zoneId];
    if (ambient) {
      this.ambientColor = ambient.color;
      this.ambientAlpha = ambient.alpha;
    }
  }

  addLight(light: LightSource): void {
    this.lights.push(light);
  }

  removeLight(id: string): void {
    this.lights = this.lights.filter(l => l.id !== id);
  }

  clearLights(): void {
    this.lights = [];
  }

  update(delta: number): void {
    this.time += delta;
    const ctx = this.ctx;
    const w = this.renderW;
    const h = this.renderH;
    const cam = this.scene.cameras.main;

    // Fill with ambient darkness
    const ar = (this.ambientColor >> 16) & 0xff;
    const ag = (this.ambientColor >> 8) & 0xff;
    const ab = this.ambientColor & 0xff;

    // We use MULTIPLY blend mode, so:
    // - RGB(255,255,255) = no darkening (fully lit)
    // - RGB(0,0,0) = full darkness
    // Base ambient: lerp from white toward ambient color based on alpha
    const baseR = Math.round(255 - (255 - ar) * this.ambientAlpha);
    const baseG = Math.round(255 - (255 - ag) * this.ambientAlpha);
    const baseB = Math.round(255 - (255 - ab) * this.ambientAlpha);

    ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
    ctx.fillRect(0, 0, w, h);

    // Punch light holes using 'lighter' composite (additive)
    ctx.globalCompositeOperation = 'lighter';

    for (const light of this.lights) {
      // Convert world position to screen position at half resolution
      const screenX = (light.x - cam.scrollX) * cam.zoom / 2;
      const screenY = (light.y - cam.scrollY) * cam.zoom / 2;
      const radius = light.radius * cam.zoom / 2;

      // Skip if off-screen
      if (screenX + radius < 0 || screenX - radius > w ||
          screenY + radius < 0 || screenY - radius > h) continue;

      // Flicker effect
      let intensity = light.intensity;
      if (light.flicker) {
        const flickerA = Math.sin(this.time * 0.008 + (light.x * 0.1)) * 0.06;
        const flickerB = Math.sin(this.time * 0.013 + (light.y * 0.1)) * 0.04;
        intensity = Math.max(0, Math.min(1, intensity + flickerA + flickerB));
      }

      const lr = (light.color >> 16) & 0xff;
      const lg = (light.color >> 8) & 0xff;
      const lb = light.color & 0xff;

      // The additive amount needed to bring ambient back toward full brightness
      // scaled by light intensity
      const addR = Math.round((255 - baseR) * intensity * lr / 255);
      const addG = Math.round((255 - baseG) * intensity * lg / 255);
      const addB = Math.round((255 - baseB) * intensity * lb / 255);

      const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius);
      grad.addColorStop(0, `rgb(${addR},${addG},${addB})`);
      grad.addColorStop(0.4, `rgb(${addR * 0.7 | 0},${addG * 0.7 | 0},${addB * 0.7 | 0})`);
      grad.addColorStop(1, 'rgb(0,0,0)');

      ctx.fillStyle = grad;
      ctx.fillRect(screenX - radius, screenY - radius, radius * 2, radius * 2);
    }

    ctx.globalCompositeOperation = 'source-over';

    // Update the texture — force Phaser to re-read the canvas
    const tex = this.scene.textures.get('lighting_overlay');
    if (tex) {
      const src = tex.source[0];
      if (src) src.update();
    }
  }

  destroy(): void {
    this.overlay?.destroy();
    this.lights = [];
  }
}
