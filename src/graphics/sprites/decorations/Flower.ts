// src/graphics/sprites/decorations/Flower.ts
import type { EntityDrawer } from '../types';

export const FlowerDrawer: EntityDrawer = {
  key: 'decor_flower',
  frameW: 8,
  frameH: 10,
  totalFrames: 1,

  drawFrame(ctx, _frame, _action, w, h, utils) {
    const s = w / 8;
    const cx = w / 2;

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    utils.fillEllipse(ctx, cx, h - 0.5 * s, 3 * s, 0.8 * s);

    // Soft outline glow (green — vegetation)
    utils.softOutline(ctx, 'rgba(60,100,40,0.15)', 3);

    // Stem (darkened 30%)
    ctx.strokeStyle = '#153310';
    ctx.lineWidth = 0.9 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, h * 0.92);
    ctx.quadraticCurveTo(cx + 0.8 * s, h * 0.70, cx, h * 0.55);
    ctx.stroke();

    // Small leaves on stem (darkened 30%)
    ctx.fillStyle = '#122c0e';
    // Left leaf
    ctx.beginPath();
    ctx.ellipse(cx - 1.5 * s, h * 0.72, 1.5 * s, 0.7 * s, -0.5, 0, Math.PI * 2);
    ctx.fill();
    // Right leaf
    ctx.beginPath();
    ctx.ellipse(cx + 1.4 * s, h * 0.64, 1.3 * s, 0.6 * s, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // 5 petals arranged radially around center (darkened 15-20%)
    const petalColor = 0x641f72; // purple-ish default, darkened ~18%
    const petalCount = 5;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(angle) * 2.2 * s;
      const py = h * 0.30 + Math.sin(angle) * 2.0 * s;
      const pGrad = ctx.createRadialGradient(px - 0.2 * s, py - 0.2 * s, 0, px, py, 1.6 * s);
      pGrad.addColorStop(0, utils.rgb(utils.lighten(petalColor, 25)));
      pGrad.addColorStop(1, utils.rgb(utils.darken(petalColor, 10)));
      ctx.fillStyle = pGrad;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);
      utils.fillEllipse(ctx, 0, 0, 1.5 * s, 1.1 * s);
      ctx.restore();
    }

    // End soft outline
    utils.softOutlineEnd(ctx);

    // Center dot (stem/leaf color family, darkened 30%)
    ctx.fillStyle = '#947e16';
    utils.fillCircle(ctx, cx, h * 0.30, 1.2 * s);
    ctx.fillStyle = 'rgba(200,175,50,0.5)';
    utils.fillCircle(ctx, cx - 0.3 * s, h * 0.28, 0.45 * s);
  },
};
