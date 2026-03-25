// src/graphics/sprites/monsters/DungeonShade.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const BODY_MID   = 0x1a0833;
const BODY_DARK  = 0x0a0318;
const BODY_LIGHT = 0x2e1252;
const WISP_COLOR = 0x3322aa;
const EYE_COLOR  = 0x44aaff;

export const DungeonShadeDrawer: EntityDrawer = {
  key: 'monster_dungeon_shade',
  frameW: 48,
  frameH: 60,
  totalFrames: 20,

  drawFrame(ctx, frame, action, w, h, utils) {
    const act = action as MonsterAction;
    const s = w / 48;

    const frameCounts: Record<MonsterAction, number> = { idle: 4, walk: 6, attack: 4, hurt: 2, death: 4 };
    const count = frameCounts[act] || 4;
    const localFrame = frame % count;
    const t = count > 1 ? localFrame / (count - 1) : 0;
    const phase = (localFrame / count) * Math.PI * 2;

    let alpha = 1;
    let bodyOffsetX = 0;
    let bodyOffsetY = 0;
    let globalRot = 0;
    let wispSpread = 0.5;

    switch (act) {
      case 'idle':
        bodyOffsetY = Math.sin(phase) * 3 * s;
        wispSpread = 0.5 + Math.sin(phase) * 0.15;
        break;
      case 'walk':
        bodyOffsetX = Math.sin(phase) * 2 * s;
        bodyOffsetY = Math.sin(phase * 0.7) * 3 * s;
        wispSpread = 0.6 + Math.sin(phase) * 0.2;
        break;
      case 'attack':
        bodyOffsetX = t * 8 * s;
        bodyOffsetY = -t * 4 * s;
        wispSpread = 0.8 + t * 0.4;
        break;
      case 'hurt':
        bodyOffsetX = -t * 5 * s;
        alpha = 0.5 + t * 0.5;
        break;
      case 'death':
        globalRot = t * 0.3;
        bodyOffsetY = t * h * 0.3;
        alpha = 1 - t * 0.9;
        wispSpread = 0.5 + t * 1.5;
        break;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = w / 2;
    const baseY = h * 0.88;

    ctx.translate(cx, baseY);
    ctx.rotate(globalRot);
    ctx.translate(-cx, -baseY);

    // Shadow (faint, ethereal)
    ctx.fillStyle = 'rgba(30,10,60,0.25)';
    utils.fillEllipse(ctx, cx + bodyOffsetX, baseY + 2 * s, 12 * s, 3 * s);

    // Wispy tendrils trailing below
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI - Math.PI / 2 + Math.sin(phase + i) * 0.3;
      const len = (12 + Math.sin(phase + i * 1.5) * 5) * s * wispSpread;
      const tx = cx + bodyOffsetX + Math.cos(angle) * 5 * s;
      const ty = baseY - 10 * s + bodyOffsetY;
      ctx.strokeStyle = utils.rgb(WISP_COLOR, 0.3 + Math.sin(phase + i) * 0.15);
      ctx.lineWidth = (2 + Math.sin(phase + i) * 0.8) * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(
        tx + Math.cos(angle + 0.5) * len * 0.5,
        ty + Math.sin(angle + 0.5) * len * 0.5 + 5 * s,
        tx + Math.cos(angle) * len,
        ty + len * 0.7
      );
      ctx.stroke();
    }

    // Main body — ghostly oval
    const bodyCX = cx + bodyOffsetX;
    const bodyCY = baseY - 24 * s + bodyOffsetY;

    utils.zoneEntityOutline(ctx, w, h);

    const bodyGrad = ctx.createRadialGradient(bodyCX, bodyCY - 2 * s, 0, bodyCX, bodyCY, 14 * s);
    bodyGrad.addColorStop(0, utils.rgb(BODY_LIGHT, 0.8));
    bodyGrad.addColorStop(0.5, utils.rgb(BODY_MID, 0.6));
    bodyGrad.addColorStop(1, utils.rgb(BODY_DARK, 0.2));
    ctx.fillStyle = bodyGrad;
    utils.fillEllipse(ctx, bodyCX, bodyCY, 12 * s, 16 * s);

    utils.softOutlineEnd(ctx);

    // Head region
    const headCX = bodyCX;
    const headCY = bodyCY - 14 * s;
    const headRX = 10 * s;
    const headRY = 9 * s;

    utils.zoneEntityRimLight(ctx, headCX, headCY, headRX, headRY);

    const headGrad = ctx.createRadialGradient(headCX, headCY - 2 * s, 0, headCX, headCY, headRX);
    headGrad.addColorStop(0, utils.rgb(BODY_LIGHT, 0.7));
    headGrad.addColorStop(0.6, utils.rgb(BODY_MID, 0.5));
    headGrad.addColorStop(1, utils.rgb(BODY_DARK, 0.15));
    ctx.fillStyle = headGrad;
    utils.fillEllipse(ctx, headCX, headCY, headRX, headRY);

    // Glowing eyes
    for (const side of [-1, 1]) {
      const ex = headCX + side * 4 * s;
      const ey = headCY;
      ctx.fillStyle = utils.rgb(EYE_COLOR, 0.9);
      utils.fillEllipse(ctx, ex, ey, 2.5 * s, 2 * s);
      // Eye glow
      const eyeGlow = ctx.createRadialGradient(ex, ey, 0, ex, ey, 4 * s);
      eyeGlow.addColorStop(0, utils.rgb(EYE_COLOR, 0.4));
      eyeGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = eyeGlow;
      utils.fillCircle(ctx, ex, ey, 4 * s);
    }

    ctx.restore();
  },
};
