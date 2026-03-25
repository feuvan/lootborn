// src/graphics/sprites/monsters/GoblinShaman.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN        = 0x3f6121;
const SKIN_DARK   = 0x29430b;
const SKIN_LIGHT  = 0x557738;
const ROBE_COLOR  = 0x4a2716;
const STAFF_COLOR = 0x5a4020;
const FEATHER     = 0xcc3333;
const RUNE_COLOR  = 0x44ff88;
const EYE_COLOR   = 0xffaa00;

export const GoblinShamanDrawer: EntityDrawer = {
  key: 'monster_goblin_shaman',
  frameW: 52,
  frameH: 60,
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
    let castGlow = 0;
    let globalRot = 0;

    switch (act) {
      case 'idle':
        bodyOffsetY = Math.sin(phase) * 0.8 * s;
        castGlow = 0.3 + Math.sin(phase) * 0.15;
        break;
      case 'walk':
        bodyOffsetX = Math.sin(phase) * 1.5 * s;
        bodyOffsetY = -Math.abs(Math.sin(phase)) * 1.5 * s;
        break;
      case 'attack':
        bodyOffsetY = -t * 3 * s;
        castGlow = 0.5 + t * 0.5;
        break;
      case 'hurt':
        bodyOffsetX = -t * 4 * s;
        alpha = 0.7 + t * 0.3;
        break;
      case 'death':
        globalRot = t * Math.PI * 0.4;
        bodyOffsetY = t * h * 0.3;
        alpha = 1 - t * 0.8;
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
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    utils.fillEllipse(ctx, cx + bodyOffsetX, baseY + 1 * s, 11 * s, 3 * s);

    // Staff (behind body)
    const staffX = cx + bodyOffsetX + 10 * s;
    const staffTopY = baseY - 48 * s + bodyOffsetY;
    const staffBotY = baseY - 2 * s;
    ctx.strokeStyle = utils.rgb(STAFF_COLOR);
    ctx.lineWidth = 2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(staffX, staffBotY);
    ctx.lineTo(staffX, staffTopY);
    ctx.stroke();
    // Crystal on staff
    const crystalGlow = ctx.createRadialGradient(staffX, staffTopY, 0, staffX, staffTopY, 4 * s);
    crystalGlow.addColorStop(0, utils.rgb(RUNE_COLOR, 0.5 + castGlow * 0.5));
    crystalGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = crystalGlow;
    utils.fillCircle(ctx, staffX, staffTopY, 4 * s);
    ctx.fillStyle = utils.rgb(RUNE_COLOR, 0.8);
    utils.fillCircle(ctx, staffX, staffTopY, 2 * s);

    // Legs
    for (const side of [-1, 1]) {
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const hipX = cx + side * 3 * s + bodyOffsetX;
      const hipY = baseY - 10 * s + bodyOffsetY;
      const kneeX = hipX + Math.sin(legPhase) * 2 * s;
      const kneeY = hipY + 5 * s;
      const footX = kneeX + Math.sin(legPhase) * s;
      const footY = baseY - 1 * s;
      utils.drawLimb(ctx, [{ x: hipX, y: hipY }, { x: kneeX, y: kneeY }, { x: footX, y: footY }], 2.5 * s, SKIN_DARK);
    }

    // Robe/body
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 20 * s + bodyOffsetY;

    utils.zoneEntityOutline(ctx, w, h);

    ctx.fillStyle = utils.rgb(ROBE_COLOR);
    utils.fillEllipse(ctx, torsoX, torsoY, 8 * s, 10 * s);

    // Skin torso
    const tGrad = ctx.createRadialGradient(torsoX, torsoY - 4 * s, 0, torsoX, torsoY, 7 * s);
    tGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    tGrad.addColorStop(0.5, utils.rgb(SKIN));
    tGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = tGrad;
    utils.fillEllipse(ctx, torsoX, torsoY - 2 * s, 6 * s, 7 * s);

    utils.softOutlineEnd(ctx);

    // Rune markings on body
    for (let i = 0; i < 3; i++) {
      const ry = torsoY - 3 * s + i * 4 * s;
      const rGlow = ctx.createRadialGradient(torsoX, ry, 0, torsoX, ry, 2 * s);
      rGlow.addColorStop(0, utils.rgb(RUNE_COLOR, castGlow));
      rGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rGlow;
      utils.fillCircle(ctx, torsoX, ry, 2 * s);
    }

    // Arms
    for (const side of [-1, 1]) {
      const armPhase = act === 'walk' ? phase + (side === 1 ? Math.PI : 0) : 0;
      const shoulderX = torsoX + side * 6 * s;
      const shoulderY = torsoY - 5 * s;
      const elbowX = shoulderX + side * 3 * s + Math.sin(armPhase) * 1.5 * s;
      const elbowY = shoulderY + 4 * s;
      const handX = side === 1 ? staffX : elbowX + side * 2 * s;
      const handY = side === 1 ? baseY - 15 * s + bodyOffsetY : elbowY + 5 * s;
      utils.drawLimb(ctx, [{ x: shoulderX, y: shoulderY }, { x: elbowX, y: elbowY }, { x: handX, y: handY }], 2 * s, SKIN_DARK);
    }

    // Head (oversized goblin head)
    const headCX = torsoX;
    const headCY = torsoY - 14 * s;
    const headRX = 10 * s;
    const headRY = 9 * s;

    utils.zoneEntityRimLight(ctx, headCX, headCY, headRX, headRY);

    const headGrad = ctx.createRadialGradient(headCX - 2 * s, headCY - 2 * s, 0, headCX, headCY, headRX);
    headGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    headGrad.addColorStop(0.5, utils.rgb(SKIN));
    headGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = headGrad;
    utils.fillEllipse(ctx, headCX, headCY, headRX, headRY);

    // Feathered headdress
    for (let i = 0; i < 3; i++) {
      const angle = -Math.PI / 2 + (i - 1) * 0.35;
      const featherLen = (8 + i * 2) * s;
      ctx.strokeStyle = utils.rgb(i === 1 ? FEATHER : utils.darken(FEATHER, 20));
      ctx.lineWidth = 1.5 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(headCX + Math.cos(angle) * headRX * 0.5, headCY - headRY * 0.7);
      ctx.lineTo(headCX + Math.cos(angle) * featherLen, headCY - headRY - featherLen * 0.6);
      ctx.stroke();
    }

    // Pointed ears
    for (const side of [-1, 1]) {
      ctx.fillStyle = utils.rgb(SKIN);
      ctx.beginPath();
      ctx.moveTo(headCX + side * headRX * 0.8, headCY);
      ctx.lineTo(headCX + side * (headRX + 5 * s), headCY - 3 * s);
      ctx.lineTo(headCX + side * headRX * 0.7, headCY + 2 * s);
      ctx.closePath();
      ctx.fill();
    }

    // Eyes
    for (const side of [-1, 1]) {
      const ex = headCX + side * 4 * s;
      const ey = headCY;
      ctx.fillStyle = '#1a0a04';
      utils.fillEllipse(ctx, ex, ey, 3 * s, 2.5 * s);
      ctx.fillStyle = utils.rgb(EYE_COLOR);
      utils.fillEllipse(ctx, ex, ey, 2 * s, 2 * s);
      ctx.fillStyle = '#0a0604';
      utils.fillCircle(ctx, ex, ey, 1 * s);
      ctx.fillStyle = 'rgba(255,200,80,0.5)';
      utils.fillCircle(ctx, ex - 0.5 * s, ey - 0.5 * s, 0.5 * s);
    }

    ctx.restore();
  },
};
