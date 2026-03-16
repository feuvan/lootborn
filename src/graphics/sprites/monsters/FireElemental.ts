// src/graphics/sprites/monsters/FireElemental.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

export const FireElementalDrawer: EntityDrawer = {
  key: 'monster_fire_elemental',
  frameW: 48,
  frameH: 60,
  totalFrames: 20,

  drawFrame(ctx, frame, action, w, h, utils) {
    const act = action as MonsterAction;
    const s = w / 48;

    const frameCounts: Record<MonsterAction, number> = { idle: 4, walk: 6, attack: 4, hurt: 2, death: 4 };
    const count = frameCounts[act] || 4;
    const localFrame = frame % count;
    const t = count > 1 ? localFrame / (count - 1) : 0;
    const phase = (localFrame / count) * Math.PI * 2;

    // Global flicker value fed into drawFlameLayer
    const flicker = frame * 0.9 + phase;

    let alpha = 1;
    let scaleH = 1, scaleW = 1;
    let offsetY = 0;
    let lean = 0;

    switch (act) {
      case 'idle':
        scaleH = 1 + Math.sin(phase) * 0.05;
        scaleW = 1 - Math.sin(phase) * 0.03;
        break;
      case 'walk':
        lean = Math.sin(phase) * 0.15;
        offsetY = Math.abs(Math.sin(phase)) * -2 * s;
        break;
      case 'attack':
        scaleH = 1 + t * 0.25;
        scaleW = 1 + t * 0.15;
        offsetY = -t * 5 * s;
        break;
      case 'hurt':
        scaleH = 1 - t * 0.25;
        scaleW = 1 - t * 0.1;
        alpha = 0.6 + t * 0.4;
        break;
      case 'death':
        scaleH = 1 - t * 0.85;
        scaleW = 1 - t * 0.4;
        alpha = 1 - t * 0.9;
        offsetY = t * h * 0.3;
        break;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = w / 2;
    const baseY = h * 0.92 + offsetY;

    // Apply lean
    ctx.translate(cx, baseY);
    ctx.rotate(lean);
    ctx.translate(-cx, -baseY);

    const flameH = 36 * s * scaleH;
    const flameW = 18 * s * scaleW;

    // ── Shadow ──────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(40,10,0,0.4)';
    utils.fillEllipse(ctx, cx, baseY + 1 * s, flameW * 0.9, 3.5 * s);

    // ── Three layered flame silhouettes ─────────────────────────────────────
    // Outer: dark orange
    utils.drawFlameLayer(ctx, cx, baseY, flameW * 1.0, flameH * 1.0, '#6a2200', flicker);
    // Mid: bright orange
    utils.drawFlameLayer(ctx, cx, baseY, flameW * 0.78, flameH * 0.85, '#aa4400', flicker + 0.5);
    // Inner: yellow-orange
    utils.drawFlameLayer(ctx, cx, baseY, flameW * 0.55, flameH * 0.68, '#cc6600', flicker + 1.1);

    // ── White-hot core ───────────────────────────────────────────────────────
    const coreY = baseY - flameH * 0.3;
    const coreGrad = ctx.createRadialGradient(cx, coreY, 0, cx, coreY, flameW * 0.35);
    coreGrad.addColorStop(0, 'rgba(255,255,220,0.95)');
    coreGrad.addColorStop(0.4, 'rgba(255,200,50,0.6)');
    coreGrad.addColorStop(1, 'rgba(200,80,0,0)');
    ctx.fillStyle = coreGrad;
    utils.fillEllipse(ctx, cx, coreY, flameW * 0.35, flameH * 0.25);

    // ── Face: glowing eyes ───────────────────────────────────────────────────
    const eyeY = baseY - flameH * 0.42;
    const eyeSpread = 5 * s;
    for (const side of [-1, 1]) {
      const ex = cx + side * eyeSpread;
      // Eye glow halo
      const eyeGrad = ctx.createRadialGradient(ex, eyeY, 0, ex, eyeY, 3.5 * s);
      eyeGrad.addColorStop(0, 'rgba(255,238,0,0.95)');
      eyeGrad.addColorStop(0.5, 'rgba(255,180,0,0.5)');
      eyeGrad.addColorStop(1, 'rgba(200,100,0,0)');
      ctx.fillStyle = eyeGrad;
      utils.fillCircle(ctx, ex, eyeY, 3.5 * s);
      // Bright core
      ctx.fillStyle = '#ffee00';
      utils.fillCircle(ctx, ex, eyeY, 1.8 * s);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      utils.fillCircle(ctx, ex - 0.4 * s, eyeY - 0.5 * s, 0.6 * s);
    }

    // ── Face: mouth arc ───────────────────────────────────────────────────────
    const mouthY = eyeY + 4.5 * s;
    const mouthOpen = act === 'attack' ? t * 0.6 : 0.2;
    ctx.strokeStyle = '#ffee00';
    ctx.lineWidth = 1.2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, mouthY, 3.5 * s, mouthOpen * 0.5, Math.PI - mouthOpen * 0.5);
    ctx.stroke();

    // ── Floating ember particles ─────────────────────────────────────────────
    const emberCount = act === 'death' ? 3 : (act === 'attack' ? 8 : 5);
    for (let i = 0; i < emberCount; i++) {
      // Seed positions by frame number for animated drift
      const seedX = utils.hash2d(i * 7 + frame, i * 3 + 100);
      const seedY = utils.hash2d(i * 11 + frame, i * 5 + 200);
      const ex = cx + (seedX - 0.5) * flameW * 2.2;
      const ey = baseY - flameH * 0.1 - seedY * flameH * 0.9;
      const er = (0.5 + utils.hash2d(i, frame + 7) * 1.5) * s;
      const ea = 0.4 + utils.hash2d(i + 50, frame) * 0.6;
      ctx.fillStyle = `rgba(255,${150 + Math.floor(utils.hash2d(i, frame * 3) * 80)},0,${ea})`;
      utils.fillCircle(ctx, ex, ey, er);
    }

    ctx.restore();
  },
};
