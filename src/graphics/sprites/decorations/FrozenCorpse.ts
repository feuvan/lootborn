// src/graphics/sprites/decorations/FrozenCorpse.ts
import type { EntityDrawer } from '../types';

export const FrozenCorpseDrawer: EntityDrawer = {
  key: 'decor_frozen_corpse',
  frameW: 22,
  frameH: 14,
  totalFrames: 1,

  drawFrame(ctx, _frame, _action, w, h, utils) {
    const s = w / 22;

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    utils.fillEllipse(ctx, w / 2, h - 0.5 * s, 9 * s, 1.5 * s);

    // Ice coating on ground
    ctx.fillStyle = 'rgba(140,180,220,0.2)';
    utils.fillEllipse(ctx, w / 2, h * 0.65, 8 * s, 4 * s);

    // Frozen body (curled up shape)
    const bodyGrad = ctx.createRadialGradient(w * 0.45, h * 0.5, 0, w * 0.45, h * 0.5, 7 * s);
    bodyGrad.addColorStop(0, utils.rgb(0x5a6880));
    bodyGrad.addColorStop(0.5, utils.rgb(0x4a5870));
    bodyGrad.addColorStop(1, utils.rgb(0x384860));
    ctx.fillStyle = bodyGrad;
    // Curled torso
    utils.fillEllipse(ctx, w * 0.45, h * 0.5, 6 * s, 4 * s);

    // Head
    ctx.fillStyle = utils.rgb(0x6878a0);
    utils.fillEllipse(ctx, w * 0.72, h * 0.4, 3 * s, 2.5 * s);

    // Arm reaching out
    ctx.strokeStyle = utils.rgb(0x5a6880);
    ctx.lineWidth = 1.8 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(w * 0.55, h * 0.45);
    ctx.quadraticCurveTo(w * 0.3, h * 0.35, w * 0.15, h * 0.3);
    ctx.stroke();
    // Hand
    ctx.fillStyle = utils.rgb(0x7888a0);
    utils.fillCircle(ctx, w * 0.15, h * 0.3, 1.5 * s);

    // Ice crystals
    ctx.fillStyle = 'rgba(180,210,240,0.5)';
    const crystalPos: [number, number, number][] = [[0.3, 0.35, 1.2], [0.55, 0.3, 1.0], [0.7, 0.55, 0.8], [0.2, 0.6, 0.9]];
    for (const [cx, cy, cr] of crystalPos) {
      ctx.beginPath();
      ctx.moveTo(w * cx, h * cy - cr * s * 1.5);
      ctx.lineTo(w * cx + cr * s * 0.6, h * cy);
      ctx.lineTo(w * cx, h * cy + cr * s * 0.5);
      ctx.lineTo(w * cx - cr * s * 0.6, h * cy);
      ctx.closePath();
      ctx.fill();
    }

    // Frost shimmer
    ctx.fillStyle = 'rgba(200,220,255,0.12)';
    utils.fillEllipse(ctx, w / 2, h * 0.5, 9 * s, 5 * s);
  },
};
