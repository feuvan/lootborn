// src/graphics/sprites/decorations/CollapsedPillar.ts
import type { EntityDrawer } from '../types';

export const CollapsedPillarDrawer: EntityDrawer = {
  key: 'decor_collapsed_pillar',
  frameW: 28,
  frameH: 16,
  totalFrames: 1,

  drawFrame(ctx, _frame, _action, w, h, utils) {
    const s = w / 28;

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    utils.fillEllipse(ctx, w / 2, h - s, 12 * s, 2 * s);

    // Pillar base (still standing stub)
    ctx.fillStyle = utils.rgb(0x6a6a70);
    ctx.fillRect(w * 0.05, h * 0.5, 7 * s, h * 0.4);
    ctx.fillStyle = utils.rgb(0x7a7a82);
    ctx.fillRect(w * 0.03, h * 0.45, 8 * s, h * 0.08);

    // Fallen pillar column (horizontal)
    const pillarGrad = ctx.createLinearGradient(w * 0.3, h * 0.3, w * 0.3, h * 0.7);
    pillarGrad.addColorStop(0, utils.rgb(0x7a7a82));
    pillarGrad.addColorStop(0.5, utils.rgb(0x606068));
    pillarGrad.addColorStop(1, utils.rgb(0x505058));
    ctx.fillStyle = pillarGrad;
    ctx.save();
    ctx.translate(w * 0.35, h * 0.55);
    ctx.rotate(-0.15);
    utils.fillEllipse(ctx, 8 * s, 0, 8 * s, 3.5 * s);
    ctx.restore();

    // Broken end (jagged)
    ctx.fillStyle = utils.rgb(0x585860);
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h * 0.4);
    ctx.lineTo(w * 0.35, h * 0.35);
    ctx.lineTo(w * 0.33, h * 0.55);
    ctx.lineTo(w * 0.28, h * 0.65);
    ctx.closePath();
    ctx.fill();

    // Scattered rubble
    for (const [rx, ry, rr] of [[0.6, 0.82, 1.5], [0.72, 0.78, 1.2], [0.82, 0.85, 1.0], [0.5, 0.88, 1.3]] as [number, number, number][]) {
      ctx.fillStyle = utils.rgb(0x5a5a62);
      utils.fillCircle(ctx, w * rx, h * ry, rr * s);
    }

    // Cracks on standing stub
    ctx.strokeStyle = utils.rgb(0x3a3a40, 0.5);
    ctx.lineWidth = 0.5 * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.52);
    ctx.lineTo(w * 0.08, h * 0.7);
    ctx.stroke();
  },
};
