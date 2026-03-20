// src/graphics/sprites/decorations/Bush.ts
import type { EntityDrawer } from '../types';

export const BushDrawer: EntityDrawer = {
  key: 'decor_bush',
  frameW: 16,
  frameH: 12,
  totalFrames: 1,

  drawFrame(ctx, _frame, _action, w, h, utils) {
    const s = w / 16;

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    utils.fillEllipse(ctx, w / 2, h - s, 7 * s, 1.5 * s);

    // Soft outline glow (green — vegetation)
    utils.softOutline(ctx, 'rgba(60,100,40,0.15)', 4);

    // Leafy clusters — multiple overlapping small ellipses with green variation (darkened 30%)
    const clusters: [number, number, number, number, number][] = [
      // cx, cy, rx, ry, color
      [0.30, 0.60, 0.22, 0.32, 0x123412],
      [0.55, 0.55, 0.24, 0.30, 0x173f12],
      [0.75, 0.65, 0.20, 0.28, 0x123412],
      [0.50, 0.42, 0.26, 0.30, 0x1d4316],
      [0.20, 0.68, 0.18, 0.22, 0x0f2b0e],
      [0.80, 0.70, 0.16, 0.22, 0x0f2b0e],
    ];
    for (const [cxF, cyF, rxF, ryF, col] of clusters) {
      const grad = ctx.createRadialGradient(
        w * cxF - w * 0.03, h * cyF - h * 0.05, 0,
        w * cxF, h * cyF, w * rxF
      );
      grad.addColorStop(0, utils.rgb(utils.lighten(col, 10)));
      grad.addColorStop(1, utils.rgb(utils.darken(col, 8)));
      ctx.fillStyle = grad;
      utils.fillEllipse(ctx, w * cxF, h * cyF, w * rxF, h * ryF);
    }

    // End soft outline
    utils.softOutlineEnd(ctx);

    // Berry accents — tiny red circles scattered (darkened)
    const berryPositions: [number, number][] = [
      [0.32, 0.50], [0.62, 0.46], [0.74, 0.58], [0.45, 0.38], [0.20, 0.60],
    ];
    for (const [bxF, byF] of berryPositions) {
      ctx.fillStyle = '#61120b';
      utils.fillCircle(ctx, w * bxF, h * byF, 0.9 * s);
      // Tiny highlight on berry (reduced)
      ctx.fillStyle = 'rgba(200,80,60,0.35)';
      utils.fillCircle(ctx, w * bxF - 0.3 * s, h * byF - 0.3 * s, 0.3 * s);
    }
  },
};
