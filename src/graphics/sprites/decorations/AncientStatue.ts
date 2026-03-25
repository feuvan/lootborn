// src/graphics/sprites/decorations/AncientStatue.ts
import type { EntityDrawer } from '../types';

export const AncientStatueDrawer: EntityDrawer = {
  key: 'decor_ancient_statue',
  frameW: 20,
  frameH: 32,
  totalFrames: 1,

  drawFrame(ctx, _frame, _action, w, h, utils) {
    const s = w / 20;

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    utils.fillEllipse(ctx, w / 2, h - s, 8 * s, 2 * s);

    // Stone pedestal
    ctx.fillStyle = utils.rgb(0x555560);
    ctx.fillRect(w * 0.2, h * 0.82, w * 0.6, h * 0.12);
    ctx.fillStyle = utils.rgb(0x4a4a55);
    ctx.fillRect(w * 0.15, h * 0.78, w * 0.7, h * 0.06);

    // Body (robed figure)
    const bodyGrad = ctx.createLinearGradient(w * 0.3, h * 0.25, w * 0.7, h * 0.8);
    bodyGrad.addColorStop(0, utils.rgb(0x7a7a88));
    bodyGrad.addColorStop(0.5, utils.rgb(0x606068));
    bodyGrad.addColorStop(1, utils.rgb(0x484850));
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(w * 0.35, h * 0.28);
    ctx.lineTo(w * 0.65, h * 0.28);
    ctx.lineTo(w * 0.72, h * 0.78);
    ctx.lineTo(w * 0.28, h * 0.78);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = utils.rgb(0x6a6a75);
    utils.fillEllipse(ctx, w / 2, h * 0.2, 4 * s, 4.5 * s);

    // Broken arm stub
    ctx.fillStyle = utils.rgb(0x5a5a65);
    ctx.beginPath();
    ctx.moveTo(w * 0.65, h * 0.35);
    ctx.lineTo(w * 0.78, h * 0.45);
    ctx.lineTo(w * 0.75, h * 0.48);
    ctx.lineTo(w * 0.63, h * 0.4);
    ctx.closePath();
    ctx.fill();

    // Weathering cracks
    ctx.strokeStyle = utils.rgb(0x3a3a40, 0.5);
    ctx.lineWidth = 0.5 * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.45, h * 0.35);
    ctx.lineTo(w * 0.5, h * 0.5);
    ctx.lineTo(w * 0.42, h * 0.65);
    ctx.stroke();

    // Moss at base
    ctx.fillStyle = 'rgba(50,70,35,0.3)';
    utils.fillEllipse(ctx, w * 0.35, h * 0.8, 3 * s, 1.5 * s);
    utils.fillEllipse(ctx, w * 0.65, h * 0.82, 2.5 * s, 1 * s);
  },
};
