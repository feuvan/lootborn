// src/graphics/sprites/decorations/Ruins.ts
import type { EntityDrawer } from '../types';

export const RuinsDrawer: EntityDrawer = {
  key: 'decor_ruins',
  frameW: 28,
  frameH: 22,
  totalFrames: 1,

  drawFrame(ctx, _frame, _action, w, h, utils) {
    const s = w / 28;

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    utils.fillEllipse(ctx, w / 2, h - s, 12 * s, 2.5 * s);

    // Broken stone wall segment
    ctx.fillStyle = utils.rgb(0x6a6a60);
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.9);
    ctx.lineTo(w * 0.08, h * 0.35);
    ctx.lineTo(w * 0.15, h * 0.2);
    ctx.lineTo(w * 0.3, h * 0.15);
    ctx.lineTo(w * 0.35, h * 0.3);
    ctx.lineTo(w * 0.3, h * 0.9);
    ctx.closePath();
    ctx.fill();

    // Second crumbled pillar stub
    ctx.fillStyle = utils.rgb(0x585850);
    ctx.fillRect(w * 0.55, h * 0.5, 8 * s, h * 0.4);

    // Fallen block
    ctx.fillStyle = utils.rgb(0x505048);
    ctx.fillRect(w * 0.4, h * 0.7, 6 * s, 4 * s);

    // Cracks
    ctx.strokeStyle = utils.rgb(0x3a3a35, 0.6);
    ctx.lineWidth = 0.5 * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.4);
    ctx.lineTo(w * 0.22, h * 0.55);
    ctx.lineTo(w * 0.18, h * 0.7);
    ctx.stroke();

    // Moss/vine
    ctx.fillStyle = 'rgba(60,80,40,0.35)';
    utils.fillEllipse(ctx, w * 0.2, h * 0.6, 3 * s, 2 * s);
    utils.fillEllipse(ctx, w * 0.6, h * 0.55, 2 * s, 1.5 * s);
  },
};
