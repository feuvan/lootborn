// src/graphics/sprites/monsters/VoidHerald.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const BODY_MID   = 0x140828;
const BODY_DARK  = 0x080312;
const BODY_LIGHT = 0x221240;
const ARMOR_MID  = 0x1a0a30;
const ARMOR_LIGHT = 0x2a1448;
const VOID_COLOR = 0x8800ff;
const EYE_COLOR  = 0xcc44ff;
const ENERGY     = 0x6622cc;

export const VoidHeraldDrawer: EntityDrawer = {
  key: 'monster_void_herald',
  frameW: 56,
  frameH: 68,
  totalFrames: 20,

  drawFrame(ctx, frame, action, w, h, utils) {
    const act = action as MonsterAction;
    const s = w / 56;

    const frameCounts: Record<MonsterAction, number> = { idle: 4, walk: 6, attack: 4, hurt: 2, death: 4 };
    const count = frameCounts[act] || 4;
    const localFrame = frame % count;
    const t = count > 1 ? localFrame / (count - 1) : 0;
    const phase = (localFrame / count) * Math.PI * 2;

    let alpha = 1;
    let bodyOffsetX = 0;
    let bodyOffsetY = 0;
    let globalRot = 0;
    let voidPulse = 0.5 + Math.sin(phase * 1.5) * 0.3;

    switch (act) {
      case 'idle':
        bodyOffsetY = Math.sin(phase) * 2.5 * s;
        break;
      case 'walk':
        bodyOffsetX = Math.sin(phase) * 2 * s;
        bodyOffsetY = Math.sin(phase * 0.7) * 3 * s;
        break;
      case 'attack':
        bodyOffsetX = t * 7 * s;
        bodyOffsetY = -t * 3 * s;
        voidPulse = 0.8 + t * 0.2;
        break;
      case 'hurt':
        bodyOffsetX = -t * 5 * s;
        alpha = 0.6 + t * 0.4;
        voidPulse = 1;
        break;
      case 'death':
        globalRot = t * 0.4;
        bodyOffsetY = t * h * 0.3;
        alpha = 1 - t * 0.9;
        voidPulse = 1 - t * 0.8;
        break;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = w / 2;
    const baseY = h * 0.88;

    ctx.translate(cx, baseY);
    ctx.rotate(globalRot);
    ctx.translate(-cx, -baseY);

    // Shadow (with void tint)
    ctx.fillStyle = 'rgba(30,0,60,0.25)';
    utils.fillEllipse(ctx, cx + bodyOffsetX, baseY + 2 * s, 13 * s, 3.5 * s);

    // Void energy crackling below
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + phase * 0.5;
      const sparkX = cx + bodyOffsetX + Math.cos(angle) * 8 * s;
      const sparkY = baseY - 5 * s + bodyOffsetY + Math.sin(angle) * 3 * s;
      const sg = ctx.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, 2.5 * s);
      sg.addColorStop(0, utils.rgb(ENERGY, voidPulse * 0.4));
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg;
      utils.fillCircle(ctx, sparkX, sparkY, 2.5 * s);
    }

    // Main body — dark ethereal form
    const bodyCX = cx + bodyOffsetX;
    const bodyCY = baseY - 24 * s + bodyOffsetY;

    utils.zoneEntityOutline(ctx, w, h);

    const bodyGrad = ctx.createRadialGradient(bodyCX, bodyCY - 3 * s, 0, bodyCX, bodyCY, 14 * s);
    bodyGrad.addColorStop(0, utils.rgb(BODY_LIGHT));
    bodyGrad.addColorStop(0.5, utils.rgb(BODY_MID));
    bodyGrad.addColorStop(1, utils.rgb(BODY_DARK));
    ctx.fillStyle = bodyGrad;
    utils.fillEllipse(ctx, bodyCX, bodyCY, 11 * s, 16 * s);

    // Armored shoulder plates (floating)
    for (const side of [-1, 1]) {
      const spX = bodyCX + side * 12 * s;
      const spY = bodyCY - 8 * s + Math.sin(phase + side) * s;
      const spGrad = ctx.createRadialGradient(spX, spY - s, 0, spX, spY, 5 * s);
      spGrad.addColorStop(0, utils.rgb(ARMOR_LIGHT));
      spGrad.addColorStop(1, utils.rgb(ARMOR_MID));
      ctx.fillStyle = spGrad;
      utils.fillEllipse(ctx, spX, spY, 5 * s, 4 * s);
      // Spike
      ctx.fillStyle = utils.rgb(ARMOR_MID);
      ctx.beginPath();
      ctx.moveTo(spX + side * 2 * s, spY - 3 * s);
      ctx.lineTo(spX + side * 6 * s, spY - 7 * s);
      ctx.lineTo(spX + side * 3 * s, spY);
      ctx.closePath();
      ctx.fill();
    }

    utils.softOutlineEnd(ctx);

    // Void portal/eye in chest
    const portalR = 5 * s;
    const pg = ctx.createRadialGradient(bodyCX, bodyCY, 0, bodyCX, bodyCY, portalR);
    pg.addColorStop(0, utils.rgb(VOID_COLOR, voidPulse));
    pg.addColorStop(0.5, utils.rgb(ENERGY, voidPulse * 0.5));
    pg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = pg;
    utils.fillCircle(ctx, bodyCX, bodyCY, portalR);
    // Inner void eye
    ctx.fillStyle = utils.rgb(VOID_COLOR, 0.9);
    utils.fillCircle(ctx, bodyCX, bodyCY, 2 * s);
    ctx.fillStyle = '#000';
    utils.fillCircle(ctx, bodyCX, bodyCY, 1 * s);

    // Arms (shadowy, with claw-like hands)
    for (const side of [-1, 1]) {
      const shoulderX = bodyCX + side * 11 * s;
      const shoulderY = bodyCY - 8 * s;
      const armPhase = act === 'walk' ? phase + (side === 1 ? Math.PI : 0) : 0;
      const elbowX = shoulderX + side * 4 * s + Math.sin(armPhase) * 2 * s;
      const elbowY = shoulderY + 6 * s;
      let handX = elbowX + side * 3 * s;
      let handY = elbowY + 6 * s;
      if (act === 'attack' && side === 1) {
        handX += t * 5 * s;
        handY -= t * 5 * s;
      }

      ctx.strokeStyle = utils.rgb(BODY_LIGHT, 0.7);
      ctx.lineWidth = 2.5 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY);
      ctx.quadraticCurveTo(elbowX, elbowY, handX, handY);
      ctx.stroke();

      // Claw fingers
      for (let fi = -1; fi <= 1; fi++) {
        ctx.strokeStyle = utils.rgb(BODY_DARK);
        ctx.lineWidth = 0.8 * s;
        ctx.beginPath();
        ctx.moveTo(handX + fi * 1.5 * s, handY);
        ctx.lineTo(handX + fi * 2 * s + side * s, handY + 2.5 * s);
        ctx.stroke();
      }
    }

    // Head
    const headCX = bodyCX;
    const headCY = bodyCY - 16 * s;
    const headRX = 8 * s;
    const headRY = 7 * s;

    utils.zoneEntityRimLight(ctx, headCX, headCY, headRX, headRY);

    const headGrad = ctx.createRadialGradient(headCX, headCY - 2 * s, 0, headCX, headCY, headRX);
    headGrad.addColorStop(0, utils.rgb(BODY_LIGHT));
    headGrad.addColorStop(0.5, utils.rgb(BODY_MID));
    headGrad.addColorStop(1, utils.rgb(BODY_DARK));
    ctx.fillStyle = headGrad;
    utils.fillEllipse(ctx, headCX, headCY, headRX, headRY);

    // Crown of void energy
    for (let i = 0; i < 3; i++) {
      const angle = -Math.PI / 2 + (i - 1) * 0.4;
      const spikeLen = (5 + i) * s;
      const spX = headCX + Math.cos(angle) * headRX * 0.6;
      const spY = headCY - headRY * 0.8;
      const sg = ctx.createRadialGradient(spX, spY - spikeLen / 2, 0, spX, spY - spikeLen / 2, 2 * s);
      sg.addColorStop(0, utils.rgb(VOID_COLOR, voidPulse * 0.6));
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg;
      utils.fillCircle(ctx, spX, spY - spikeLen / 2, 2 * s);
    }

    // Eyes
    for (const side of [-1, 1]) {
      const ex = headCX + side * 3 * s;
      const ey = headCY;
      ctx.fillStyle = utils.rgb(EYE_COLOR, 0.9);
      utils.fillCircle(ctx, ex, ey, 1.8 * s);
      const eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 3.5 * s);
      eg.addColorStop(0, utils.rgb(EYE_COLOR, 0.4));
      eg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = eg;
      utils.fillCircle(ctx, ex, ey, 3.5 * s);
    }

    ctx.restore();
  },
};
