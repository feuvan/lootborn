// src/graphics/sprites/decorations/SkeletalRemains.ts
import type { EntityDrawer } from '../types';

export const SkeletalRemainsDrawer: EntityDrawer = {
  key: 'decor_skeletal_remains',
  frameW: 22,
  frameH: 14,
  totalFrames: 1,

  drawFrame(ctx, _frame, _action, w, h, utils) {
    const s = w / 22;
    const BONE = 0xc8bca0;

    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    utils.fillEllipse(ctx, w / 2, h - 0.5 * s, 9 * s, 1.5 * s);

    // Dark stain
    ctx.fillStyle = 'rgba(60,10,5,0.18)';
    utils.fillEllipse(ctx, w * 0.45, h * 0.7, 6 * s, 2 * s);

    // Ribcage outline
    ctx.strokeStyle = utils.rgb(BONE, 0.8);
    ctx.lineWidth = 1.2 * s;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const ry = h * 0.35 + i * 2.5 * s;
      ctx.beginPath();
      ctx.arc(w * 0.4, ry, 4 * s, -0.8, 0.8);
      ctx.stroke();
    }

    // Skull
    const skX = w * 0.72, skY = h * 0.35;
    ctx.fillStyle = utils.rgb(BONE);
    utils.fillEllipse(ctx, skX, skY, 3.5 * s, 3 * s);
    // Eye sockets
    ctx.fillStyle = utils.rgb(0x2a2420, 0.7);
    utils.fillCircle(ctx, skX - 1.2 * s, skY - 0.5 * s, 0.8 * s);
    utils.fillCircle(ctx, skX + 1.2 * s, skY - 0.5 * s, 0.8 * s);

    // Scattered bones
    utils.drawBoneSegment(ctx, w * 0.1, h * 0.7, w * 0.35, h * 0.6, 1.5 * s, BONE);
    utils.drawBoneSegment(ctx, w * 0.5, h * 0.8, w * 0.75, h * 0.75, 1.2 * s, BONE);

    // Dirt overlay
    ctx.fillStyle = 'rgba(50,40,20,0.15)';
    ctx.fillRect(0, h * 0.82, w, h * 0.18);
  },
};
