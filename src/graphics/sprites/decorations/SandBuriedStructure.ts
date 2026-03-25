// src/graphics/sprites/decorations/SandBuriedStructure.ts
import type { EntityDrawer } from '../types';

export const SandBuriedStructureDrawer: EntityDrawer = {
  key: 'decor_sand_buried_structure',
  frameW: 28,
  frameH: 18,
  totalFrames: 1,

  drawFrame(ctx, _frame, _action, w, h, utils) {
    const s = w / 28;

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    utils.fillEllipse(ctx, w / 2, h - s, 12 * s, 2 * s);

    // Sand dune covering
    ctx.fillStyle = utils.rgb(0xc8b480);
    utils.fillEllipse(ctx, w / 2, h * 0.7, 12 * s, 4 * s);

    // Exposed stone wall top
    const stoneGrad = ctx.createLinearGradient(w * 0.15, h * 0.15, w * 0.85, h * 0.5);
    stoneGrad.addColorStop(0, utils.rgb(0x8a7a60));
    stoneGrad.addColorStop(0.5, utils.rgb(0x7a6a50));
    stoneGrad.addColorStop(1, utils.rgb(0x6a5a40));
    ctx.fillStyle = stoneGrad;
    // Exposed blocks poking through sand
    ctx.fillRect(w * 0.15, h * 0.25, 8 * s, h * 0.35);
    ctx.fillRect(w * 0.55, h * 0.35, 6 * s, h * 0.25);

    // Block lines (mortar)
    ctx.strokeStyle = utils.rgb(0x5a4a35, 0.5);
    ctx.lineWidth = 0.4 * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.4);
    ctx.lineTo(w * 0.15 + 8 * s, h * 0.4);
    ctx.moveTo(w * 0.15, h * 0.5);
    ctx.lineTo(w * 0.15 + 8 * s, h * 0.5);
    ctx.moveTo(w * 0.55, h * 0.48);
    ctx.lineTo(w * 0.55 + 6 * s, h * 0.48);
    ctx.stroke();

    // Arch doorway hint
    ctx.fillStyle = utils.rgb(0x3a3020, 0.7);
    ctx.beginPath();
    ctx.arc(w * 0.3, h * 0.55, 2.5 * s, Math.PI, Math.PI * 2);
    ctx.fillRect(w * 0.3 - 2.5 * s, h * 0.55, 5 * s, 2 * s);
    ctx.fill();

    // Sand overlay (partially burying)
    ctx.fillStyle = utils.rgb(0xc8b480, 0.6);
    ctx.beginPath();
    ctx.moveTo(0, h * 0.6);
    ctx.quadraticCurveTo(w * 0.3, h * 0.5, w * 0.5, h * 0.58);
    ctx.quadraticCurveTo(w * 0.7, h * 0.52, w, h * 0.55);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Wind-blown sand streaks
    ctx.strokeStyle = utils.rgb(0xb8a470, 0.3);
    ctx.lineWidth = 0.5 * s;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.65);
    ctx.lineTo(w * 0.4, h * 0.62);
    ctx.moveTo(w * 0.5, h * 0.7);
    ctx.lineTo(w * 0.85, h * 0.66);
    ctx.stroke();
  },
};
