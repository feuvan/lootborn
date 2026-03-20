// src/graphics/sprites/decorations/Cactus.ts
import type { EntityDrawer } from '../types';

export const CactusDrawer: EntityDrawer = {
  key: 'decor_cactus',
  frameW: 12,
  frameH: 20,
  totalFrames: 1,

  drawFrame(ctx, _frame, _action, w, h, utils) {
    const s = w / 12;
    const cx = w / 2;

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    utils.fillEllipse(ctx, cx, h - s, 5 * s, 1.5 * s);

    // Soft outline glow (green/desert — cactus)
    utils.softOutline(ctx, 'rgba(80,120,40,0.15)', 4);

    // Left arm (greens darkened 30%: 0x1e5a1a → 0x153f12)
    utils.drawPart(ctx, cx - 5 * s, h * 0.35, 3.5 * s, h * 0.14, 0x153f12, 2 * s);
    utils.drawPart(ctx, cx - 5 * s, h * 0.22, 3.5 * s, h * 0.15, 0x153f12, 2 * s);

    // Right arm (darkened)
    utils.drawPart(ctx, cx + 1.5 * s, h * 0.28, 3.5 * s, h * 0.14, 0x153f12, 2 * s);
    utils.drawPart(ctx, cx + 3.5 * s, h * 0.16, 3.5 * s, h * 0.14, 0x153f12, 2 * s);

    // Main trunk with ribbed surface (darkened)
    utils.drawPart(ctx, cx - 2.5 * s, h * 0.08, 5 * s, h * 0.84, 0x153f12, 2.5 * s);

    // Rib arcs (vertical stroked arcs = ribbed surface)
    ctx.strokeStyle = 'rgba(10,60,10,0.35)';
    ctx.lineWidth = 0.6 * s;
    const ribPositions = [cx - 1.5 * s, cx, cx + 1.5 * s];
    for (const rx of ribPositions) {
      ctx.beginPath();
      ctx.moveTo(rx, h * 0.10);
      ctx.lineTo(rx + (rx < cx ? -0.4 * s : rx > cx ? 0.4 * s : 0), h * 0.88);
      ctx.stroke();
    }

    // End soft outline
    utils.softOutlineEnd(ctx);

    // Needle clusters (tiny cross-hatch marks along edges)
    const needleRows = [0.15, 0.28, 0.42, 0.58, 0.72, 0.84];
    ctx.strokeStyle = 'rgba(180,200,140,0.7)';
    ctx.lineWidth = 0.5 * s;
    ctx.lineCap = 'round';
    for (const ny of needleRows) {
      // Left side needles
      for (let n = 0; n < 2; n++) {
        const nx = cx - 2.5 * s;
        const ny2 = h * ny + n * 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(nx, ny2);
        ctx.lineTo(nx - 2 * s, ny2 - s);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(nx, ny2);
        ctx.lineTo(nx - 1.5 * s, ny2 + 0.5 * s);
        ctx.stroke();
      }
      // Right side needles
      for (let n = 0; n < 2; n++) {
        const nx = cx + 2.5 * s;
        const ny2 = h * ny + n * 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(nx, ny2);
        ctx.lineTo(nx + 2 * s, ny2 - s);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(nx, ny2);
        ctx.lineTo(nx + 1.5 * s, ny2 + 0.5 * s);
        ctx.stroke();
      }
    }

    // Optional small flower at top (petals darkened ~15%)
    ctx.fillStyle = '#b31b75';
    utils.fillCircle(ctx, cx, h * 0.07, 1.8 * s);
    ctx.fillStyle = '#ccb01b';
    utils.fillCircle(ctx, cx, h * 0.07, 0.7 * s);
  },
};
