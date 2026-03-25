// src/graphics/sprites/monsters/ShadowWeaver.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const ROBE_MID   = 0x0a0a14;
const ROBE_DARK  = 0x04040a;
const ROBE_LIGHT = 0x161626;
const EYE_COLOR  = 0xaa44ff;
const TENDRIL    = 0x3322aa;
const CRYSTAL    = 0x8844ff;

export const ShadowWeaverDrawer: EntityDrawer = {
  key: 'monster_shadow_weaver',
  frameW: 52,
  frameH: 64,
  totalFrames: 20,

  drawFrame(ctx, frame, action, w, h, utils) {
    const act = action as MonsterAction;
    const s = w / 52;

    const frameCounts: Record<MonsterAction, number> = { idle: 4, walk: 6, attack: 4, hurt: 2, death: 4 };
    const count = frameCounts[act] || 4;
    const localFrame = frame % count;
    const t = count > 1 ? localFrame / (count - 1) : 0;
    const phase = (localFrame / count) * Math.PI * 2;

    let alpha = 1;
    let bodyOffsetX = 0;
    let bodyOffsetY = 0;
    let castGlow = 0.4;
    let globalRot = 0;

    switch (act) {
      case 'idle':
        bodyOffsetY = Math.sin(phase) * 1.5 * s;
        castGlow = 0.4 + Math.sin(phase) * 0.15;
        break;
      case 'walk':
        bodyOffsetX = Math.sin(phase) * 1.5 * s;
        bodyOffsetY = Math.sin(phase * 0.7) * 2 * s;
        break;
      case 'attack':
        bodyOffsetY = -t * 4 * s;
        castGlow = 0.7 + t * 0.3;
        break;
      case 'hurt':
        bodyOffsetX = -t * 4 * s;
        alpha = 0.6 + t * 0.4;
        break;
      case 'death':
        globalRot = t * 0.3;
        bodyOffsetY = t * h * 0.3;
        alpha = 1 - t * 0.85;
        break;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = w / 2;
    const baseY = h * 0.92;

    ctx.translate(cx, baseY);
    ctx.rotate(globalRot);
    ctx.translate(-cx, -baseY);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    utils.fillEllipse(ctx, cx + bodyOffsetX, baseY + 1 * s, 12 * s, 3 * s);

    // Shadow tendrils trailing from base
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + phase * 0.3;
      const len = (8 + Math.sin(phase + i * 2) * 3) * s;
      ctx.strokeStyle = utils.rgb(TENDRIL, 0.2 + Math.sin(phase + i) * 0.1);
      ctx.lineWidth = 1.5 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + bodyOffsetX, baseY - 5 * s + bodyOffsetY);
      ctx.quadraticCurveTo(
        cx + bodyOffsetX + Math.cos(angle) * len * 0.5,
        baseY + Math.sin(angle) * 3 * s,
        cx + bodyOffsetX + Math.cos(angle) * len,
        baseY + 2 * s
      );
      ctx.stroke();
    }

    // Robe body (long flowing)
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 22 * s + bodyOffsetY;

    utils.zoneEntityOutline(ctx, w, h);

    const robeGrad = ctx.createRadialGradient(torsoX, torsoY - 4 * s, 0, torsoX, torsoY + 10 * s, 16 * s);
    robeGrad.addColorStop(0, utils.rgb(ROBE_LIGHT));
    robeGrad.addColorStop(0.5, utils.rgb(ROBE_MID));
    robeGrad.addColorStop(1, utils.rgb(ROBE_DARK));
    ctx.fillStyle = robeGrad;
    // Tapered robe shape
    ctx.beginPath();
    ctx.moveTo(torsoX - 7 * s, torsoY - 10 * s);
    ctx.quadraticCurveTo(torsoX - 10 * s, torsoY + 5 * s, torsoX - 8 * s, baseY - 2 * s);
    ctx.lineTo(torsoX + 8 * s, baseY - 2 * s);
    ctx.quadraticCurveTo(torsoX + 10 * s, torsoY + 5 * s, torsoX + 7 * s, torsoY - 10 * s);
    ctx.closePath();
    ctx.fill();

    utils.softOutlineEnd(ctx);

    // Staff (held in left hand)
    const staffX = torsoX - 10 * s;
    const staffTopY = torsoY - 20 * s;
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(staffX, baseY - 3 * s);
    ctx.lineTo(staffX, staffTopY);
    ctx.stroke();
    // Crystal on staff
    ctx.fillStyle = utils.rgb(CRYSTAL, 0.9);
    ctx.beginPath();
    ctx.moveTo(staffX, staffTopY - 4 * s);
    ctx.lineTo(staffX + 2.5 * s, staffTopY);
    ctx.lineTo(staffX, staffTopY + 2 * s);
    ctx.lineTo(staffX - 2.5 * s, staffTopY);
    ctx.closePath();
    ctx.fill();
    const cGlow = ctx.createRadialGradient(staffX, staffTopY, 0, staffX, staffTopY, 5 * s);
    cGlow.addColorStop(0, utils.rgb(CRYSTAL, castGlow * 0.6));
    cGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cGlow;
    utils.fillCircle(ctx, staffX, staffTopY, 5 * s);

    // Arms (hint of hands emerging from robe)
    for (const side of [-1, 1]) {
      const handX = torsoX + side * 10 * s;
      const handY = torsoY + 2 * s;
      ctx.fillStyle = utils.rgb(ROBE_LIGHT, 0.7);
      utils.fillEllipse(ctx, handX, handY, 2.5 * s, 2 * s);
    }

    // Hooded head
    const headCX = torsoX;
    const headCY = torsoY - 14 * s;
    const headRX = 8 * s;
    const headRY = 9 * s;

    utils.zoneEntityRimLight(ctx, headCX, headCY, headRX, headRY);

    // Hood
    const hoodGrad = ctx.createRadialGradient(headCX, headCY - 2 * s, 0, headCX, headCY, headRX + 2 * s);
    hoodGrad.addColorStop(0, utils.rgb(ROBE_LIGHT));
    hoodGrad.addColorStop(0.5, utils.rgb(ROBE_MID));
    hoodGrad.addColorStop(1, utils.rgb(ROBE_DARK));
    ctx.fillStyle = hoodGrad;
    utils.fillEllipse(ctx, headCX, headCY, headRX + 2 * s, headRY + 1 * s);

    // Dark void inside hood
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    utils.fillEllipse(ctx, headCX, headCY + 1 * s, 6 * s, 5 * s);

    // Glowing eyes inside hood
    for (const side of [-1, 1]) {
      const ex = headCX + side * 2.5 * s;
      const ey = headCY + 1 * s;
      ctx.fillStyle = utils.rgb(EYE_COLOR, 0.9);
      utils.fillCircle(ctx, ex, ey, 1.5 * s);
      const eyeGlow = ctx.createRadialGradient(ex, ey, 0, ex, ey, 3 * s);
      eyeGlow.addColorStop(0, utils.rgb(EYE_COLOR, 0.4));
      eyeGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = eyeGlow;
      utils.fillCircle(ctx, ex, ey, 3 * s);
    }

    ctx.restore();
  },
};
