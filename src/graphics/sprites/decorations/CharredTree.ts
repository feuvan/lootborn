// src/graphics/sprites/decorations/CharredTree.ts
import type { EntityDrawer } from '../types';

export const CharredTreeDrawer: EntityDrawer = {
  key: 'decor_charred_tree',
  frameW: 22,
  frameH: 34,
  totalFrames: 1,

  drawFrame(ctx, _frame, _action, w, h, utils) {
    const s = w / 22;

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    utils.fillEllipse(ctx, w / 2, h - s, 8 * s, 2 * s);

    // Charred trunk
    const trunkGrad = ctx.createLinearGradient(w * 0.35, h * 0.2, w * 0.65, h * 0.85);
    trunkGrad.addColorStop(0, utils.rgb(0x1a1410));
    trunkGrad.addColorStop(0.5, utils.rgb(0x2a2018));
    trunkGrad.addColorStop(1, utils.rgb(0x1a1410));
    ctx.fillStyle = trunkGrad;
    ctx.beginPath();
    ctx.moveTo(w * 0.38, h * 0.88);
    ctx.lineTo(w * 0.35, h * 0.2);
    ctx.lineTo(w * 0.45, h * 0.12);
    ctx.lineTo(w * 0.55, h * 0.12);
    ctx.lineTo(w * 0.65, h * 0.2);
    ctx.lineTo(w * 0.62, h * 0.88);
    ctx.closePath();
    ctx.fill();

    // Broken branch stubs
    ctx.strokeStyle = utils.rgb(0x201810);
    ctx.lineWidth = 2 * s;
    ctx.lineCap = 'round';
    // Left branch
    ctx.beginPath();
    ctx.moveTo(w * 0.38, h * 0.35);
    ctx.lineTo(w * 0.18, h * 0.22);
    ctx.stroke();
    // Right branch
    ctx.beginPath();
    ctx.moveTo(w * 0.62, h * 0.45);
    ctx.lineTo(w * 0.82, h * 0.35);
    ctx.stroke();
    // Top broken
    ctx.beginPath();
    ctx.moveTo(w * 0.48, h * 0.12);
    ctx.lineTo(w * 0.42, h * 0.04);
    ctx.stroke();

    // Charring detail (darker patches)
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    utils.fillEllipse(ctx, w * 0.45, h * 0.4, 2.5 * s, 4 * s);
    utils.fillEllipse(ctx, w * 0.55, h * 0.6, 2 * s, 3 * s);

    // Ember glow at base
    ctx.fillStyle = 'rgba(180,60,10,0.15)';
    utils.fillEllipse(ctx, w * 0.5, h * 0.85, 5 * s, 1.5 * s);

    // Ash on ground
    ctx.fillStyle = 'rgba(40,38,35,0.25)';
    utils.fillEllipse(ctx, w * 0.3, h * 0.9, 4 * s, 1 * s);
    utils.fillEllipse(ctx, w * 0.7, h * 0.88, 3 * s, 0.8 * s);
  },
};
