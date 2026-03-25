// src/graphics/sprites/decorations/BrokenAltar.ts
import type { EntityDrawer } from '../types';

export const BrokenAltarDrawer: EntityDrawer = {
  key: 'decor_broken_altar',
  frameW: 26,
  frameH: 20,
  totalFrames: 1,

  drawFrame(ctx, _frame, _action, w, h, utils) {
    const s = w / 26;

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    utils.fillEllipse(ctx, w / 2, h - s, 11 * s, 2.5 * s);

    // Altar base slab
    ctx.fillStyle = utils.rgb(0x5a5050);
    ctx.beginPath();
    ctx.moveTo(w * 0.05, h * 0.85);
    ctx.lineTo(w * 0.15, h * 0.55);
    ctx.lineTo(w * 0.85, h * 0.55);
    ctx.lineTo(w * 0.95, h * 0.85);
    ctx.closePath();
    ctx.fill();

    // Altar top (cracked)
    ctx.fillStyle = utils.rgb(0x6a6060);
    ctx.fillRect(w * 0.1, h * 0.48, w * 0.8, h * 0.1);

    // Broken piece fallen
    ctx.fillStyle = utils.rgb(0x504848);
    ctx.save();
    ctx.translate(w * 0.78, h * 0.72);
    ctx.rotate(0.4);
    ctx.fillRect(-3 * s, -2 * s, 6 * s, 4 * s);
    ctx.restore();

    // Crack through middle
    ctx.strokeStyle = utils.rgb(0x2a2425, 0.7);
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.45, h * 0.5);
    ctx.lineTo(w * 0.5, h * 0.65);
    ctx.lineTo(w * 0.44, h * 0.8);
    ctx.stroke();

    // Faded offering stain
    ctx.fillStyle = 'rgba(80,20,20,0.2)';
    utils.fillEllipse(ctx, w * 0.4, h * 0.52, 4 * s, 1.5 * s);

    // Candle stubs
    for (const xf of [0.25, 0.7]) {
      ctx.fillStyle = utils.rgb(0xd8d0b0);
      ctx.fillRect(w * xf - s, h * 0.38, 2 * s, h * 0.12);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      utils.fillCircle(ctx, w * xf, h * 0.38, 0.8 * s);
    }
  },
};
