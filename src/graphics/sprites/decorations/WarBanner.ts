// src/graphics/sprites/decorations/WarBanner.ts
import type { EntityDrawer } from '../types';

export const WarBannerDrawer: EntityDrawer = {
  key: 'decor_war_banner',
  frameW: 16,
  frameH: 30,
  totalFrames: 1,

  drawFrame(ctx, _frame, _action, w, h, utils) {
    const s = w / 16;

    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    utils.fillEllipse(ctx, w / 2, h - s, 5 * s, 1.5 * s);

    // Pole
    ctx.strokeStyle = utils.rgb(0x5a4a30);
    ctx.lineWidth = 1.5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.92);
    ctx.lineTo(w / 2, h * 0.06);
    ctx.stroke();

    // Pole top ornament
    ctx.fillStyle = utils.rgb(0x8a7a50);
    utils.fillCircle(ctx, w / 2, h * 0.06, 1.5 * s);

    // Banner cloth (tattered)
    const bannerGrad = ctx.createLinearGradient(w * 0.2, h * 0.12, w * 0.8, h * 0.5);
    bannerGrad.addColorStop(0, utils.rgb(0x8a2222));
    bannerGrad.addColorStop(0.5, utils.rgb(0x702020));
    bannerGrad.addColorStop(1, utils.rgb(0x551818));
    ctx.fillStyle = bannerGrad;
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.1);
    ctx.lineTo(w * 0.85, h * 0.15);
    ctx.lineTo(w * 0.82, h * 0.38);
    ctx.lineTo(w * 0.75, h * 0.5);
    ctx.lineTo(w * 0.65, h * 0.45);
    ctx.lineTo(w / 2, h * 0.48);
    ctx.closePath();
    ctx.fill();

    // Tattered edge
    ctx.strokeStyle = utils.rgb(0x441010, 0.5);
    ctx.lineWidth = 0.5 * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.82, h * 0.38);
    ctx.lineTo(w * 0.75, h * 0.5);
    ctx.lineTo(w * 0.65, h * 0.45);
    ctx.stroke();

    // Symbol on banner (simple cross/sigil)
    ctx.strokeStyle = utils.rgb(0xccaa44, 0.6);
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.62, h * 0.22);
    ctx.lineTo(w * 0.62, h * 0.36);
    ctx.moveTo(w * 0.55, h * 0.28);
    ctx.lineTo(w * 0.7, h * 0.28);
    ctx.stroke();
  },
};
