// src/graphics/sprites/decorations/RitualCircle.ts
import type { EntityDrawer } from '../types';

export const RitualCircleDrawer: EntityDrawer = {
  key: 'decor_ritual_circle',
  frameW: 30,
  frameH: 18,
  totalFrames: 1,

  drawFrame(ctx, _frame, _action, w, h, utils) {
    const s = w / 30;
    const cx = w / 2;
    const cy = h * 0.55;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    utils.fillEllipse(ctx, cx, h - s, 13 * s, 2.5 * s);

    // Dark stained ground
    ctx.fillStyle = 'rgba(40,10,15,0.25)';
    utils.fillEllipse(ctx, cx, cy, 12 * s, 6 * s);

    // Outer circle
    ctx.strokeStyle = utils.rgb(0x8a2233, 0.7);
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 11 * s, 5.5 * s, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner circle
    ctx.strokeStyle = utils.rgb(0x661122, 0.6);
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 7 * s, 3.5 * s, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Rune symbols at cardinal points
    const runeColor = utils.rgb(0xaa3344, 0.6);
    ctx.fillStyle = runeColor;
    const runePoints: [number, number][] = [
      [cx, cy - 4.5 * s],
      [cx + 9 * s, cy],
      [cx, cy + 4.5 * s],
      [cx - 9 * s, cy],
    ];
    for (const [rx, ry] of runePoints) {
      // Small diamond rune
      ctx.beginPath();
      ctx.moveTo(rx, ry - 1.2 * s);
      ctx.lineTo(rx + 0.8 * s, ry);
      ctx.lineTo(rx, ry + 1.2 * s);
      ctx.lineTo(rx - 0.8 * s, ry);
      ctx.closePath();
      ctx.fill();
    }

    // Connecting lines (pentagram-like)
    ctx.strokeStyle = utils.rgb(0x661122, 0.35);
    ctx.lineWidth = 0.5 * s;
    ctx.beginPath();
    ctx.moveTo(runePoints[0][0], runePoints[0][1]);
    ctx.lineTo(runePoints[2][0], runePoints[2][1]);
    ctx.moveTo(runePoints[1][0], runePoints[1][1]);
    ctx.lineTo(runePoints[3][0], runePoints[3][1]);
    ctx.stroke();

    // Faint residual glow at center
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 4 * s);
    glow.addColorStop(0, 'rgba(150,30,50,0.2)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    utils.fillCircle(ctx, cx, cy, 4 * s);
  },
};
