// src/graphics/sprites/monsters/SubMineGuardian.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const STONE_MID   = 0x5a4830;
const STONE_DARK  = 0x3a2a18;
const STONE_LIGHT = 0x7a6848;
const CRYSTAL_COLOR = 0x44aaff;
const AMBER_COLOR = 0xffaa22;

export const SubMineGuardianDrawer: EntityDrawer = {
  key: 'monster_sub_mine_guardian',
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
    let attackLunge = 0;
    let globalRot = 0;
    const crystalGlow = 0.5 + Math.sin(phase * 1.3) * 0.2;

    switch (act) {
      case 'idle':
        bodyOffsetY = Math.sin(phase) * 0.8 * s;
        break;
      case 'walk':
        bodyOffsetX = Math.sin(phase) * 2 * s;
        bodyOffsetY = -Math.abs(Math.sin(phase)) * 2 * s;
        break;
      case 'attack':
        attackLunge = t;
        bodyOffsetX = t * 7 * s;
        bodyOffsetY = -t * 2 * s;
        break;
      case 'hurt':
        bodyOffsetX = -t * 4 * s;
        alpha = 0.75 + t * 0.25;
        break;
      case 'death':
        globalRot = t * Math.PI * 0.3;
        bodyOffsetY = t * h * 0.35;
        alpha = 1 - t * 0.7;
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
    utils.fillEllipse(ctx, cx + bodyOffsetX, baseY + 1 * s, 14 * s, 4 * s);

    // Legs (thick stone pillars)
    for (const side of [-1, 1]) {
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const hipX = cx + side * 6 * s + bodyOffsetX;
      const hipY = baseY - 16 * s + bodyOffsetY;
      const kneeX = hipX + Math.sin(legPhase) * 2 * s;
      const kneeY = hipY + 8 * s;
      const footX = kneeX + Math.sin(legPhase) * s;
      const footY = baseY - 1 * s;
      utils.drawLimb(ctx, [{ x: hipX, y: hipY }, { x: kneeX, y: kneeY }, { x: footX, y: footY }], 4.5 * s, STONE_DARK);
      ctx.fillStyle = utils.rgb(STONE_DARK);
      utils.fillEllipse(ctx, footX, footY, 4 * s, 2 * s);
    }

    // Torso (rocky mass)
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 30 * s + bodyOffsetY;

    utils.zoneEntityOutline(ctx, w, h);

    const tGrad = ctx.createRadialGradient(torsoX - 2 * s, torsoY - 3 * s, 0, torsoX, torsoY, 14 * s);
    tGrad.addColorStop(0, utils.rgb(STONE_LIGHT));
    tGrad.addColorStop(0.5, utils.rgb(STONE_MID));
    tGrad.addColorStop(1, utils.rgb(STONE_DARK));
    ctx.fillStyle = tGrad;
    // Rough rocky shape
    ctx.beginPath();
    ctx.moveTo(torsoX - 10 * s, torsoY - 8 * s);
    ctx.lineTo(torsoX - 3 * s, torsoY - 14 * s);
    ctx.lineTo(torsoX + 5 * s, torsoY - 12 * s);
    ctx.lineTo(torsoX + 11 * s, torsoY - 6 * s);
    ctx.lineTo(torsoX + 12 * s, torsoY + 8 * s);
    ctx.lineTo(torsoX + 6 * s, torsoY + 14 * s);
    ctx.lineTo(torsoX - 6 * s, torsoY + 14 * s);
    ctx.lineTo(torsoX - 12 * s, torsoY + 8 * s);
    ctx.closePath();
    ctx.fill();

    utils.softOutlineEnd(ctx);

    // Embedded crystals
    const crystals = [
      { x: torsoX + 4 * s, y: torsoY - 6 * s, r: 3, color: CRYSTAL_COLOR },
      { x: torsoX - 5 * s, y: torsoY - 2 * s, r: 2.5, color: CRYSTAL_COLOR },
      { x: torsoX + 2 * s, y: torsoY + 4 * s, r: 2, color: AMBER_COLOR },
      { x: torsoX - 3 * s, y: torsoY + 7 * s, r: 1.5, color: AMBER_COLOR },
    ];
    for (const cr of crystals) {
      // Crystal shape (diamond)
      ctx.fillStyle = utils.rgb(cr.color, 0.8);
      ctx.beginPath();
      ctx.moveTo(cr.x, cr.y - cr.r * s * 1.5);
      ctx.lineTo(cr.x + cr.r * s, cr.y);
      ctx.lineTo(cr.x, cr.y + cr.r * s * 0.8);
      ctx.lineTo(cr.x - cr.r * s, cr.y);
      ctx.closePath();
      ctx.fill();
      // Glow
      const cg = ctx.createRadialGradient(cr.x, cr.y, 0, cr.x, cr.y, cr.r * s * 2);
      cg.addColorStop(0, utils.rgb(cr.color, crystalGlow * 0.4));
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg;
      utils.fillCircle(ctx, cr.x, cr.y, cr.r * s * 2);
    }

    // Stone fist arms
    for (const side of [-1, 1]) {
      const isAttack = side === 1 && act === 'attack';
      const shoulderX = torsoX + side * 11 * s;
      const shoulderY = torsoY - 6 * s;
      let elbowX: number, elbowY: number, handX: number, handY: number;
      if (isAttack) {
        elbowX = shoulderX + 5 * s + attackLunge * 4 * s;
        elbowY = shoulderY + 3 * s - attackLunge * 5 * s;
        handX = elbowX + 4 * s;
        handY = elbowY - attackLunge * 4 * s;
      } else {
        const armPhase = act === 'walk' ? phase + (side === 1 ? Math.PI : 0) : 0;
        elbowX = shoulderX + side * 3 * s + Math.sin(armPhase) * 2 * s;
        elbowY = shoulderY + 7 * s;
        handX = elbowX + side * 3 * s;
        handY = elbowY + 6 * s;
      }
      utils.drawLimb(ctx, [{ x: shoulderX, y: shoulderY }, { x: elbowX, y: elbowY }, { x: handX, y: handY }], 4 * s, STONE_DARK);
      // Stone fist
      ctx.fillStyle = utils.rgb(STONE_MID);
      utils.fillEllipse(ctx, handX, handY, 4.5 * s, 4 * s);
    }

    // Head (rough boulder)
    const headCX = torsoX;
    const headCY = torsoY - 16 * s;
    const headRX = 9 * s;
    const headRY = 8 * s;

    utils.zoneEntityRimLight(ctx, headCX, headCY, headRX, headRY);

    const headGrad = ctx.createRadialGradient(headCX - 2 * s, headCY - 2 * s, 0, headCX, headCY, headRX);
    headGrad.addColorStop(0, utils.rgb(STONE_LIGHT));
    headGrad.addColorStop(0.5, utils.rgb(STONE_MID));
    headGrad.addColorStop(1, utils.rgb(STONE_DARK));
    ctx.fillStyle = headGrad;
    utils.fillEllipse(ctx, headCX, headCY, headRX, headRY);

    // Crystal cluster on head
    ctx.fillStyle = utils.rgb(CRYSTAL_COLOR, 0.8);
    ctx.beginPath();
    ctx.moveTo(headCX - 1 * s, headCY - headRY);
    ctx.lineTo(headCX + 2 * s, headCY - headRY - 5 * s);
    ctx.lineTo(headCX + 3 * s, headCY - headRY + 1 * s);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(headCX + 1 * s, headCY - headRY);
    ctx.lineTo(headCX - 1 * s, headCY - headRY - 4 * s);
    ctx.lineTo(headCX - 2 * s, headCY - headRY + 1 * s);
    ctx.closePath();
    ctx.fill();

    // Eyes (glowing amber)
    for (const side of [-1, 1]) {
      const ex = headCX + side * 3.5 * s;
      const ey = headCY;
      ctx.fillStyle = utils.rgb(AMBER_COLOR, 0.9);
      utils.fillCircle(ctx, ex, ey, 2 * s);
      const eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 3 * s);
      eg.addColorStop(0, utils.rgb(AMBER_COLOR, 0.3));
      eg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = eg;
      utils.fillCircle(ctx, ex, ey, 3 * s);
    }

    ctx.restore();
  },
};
