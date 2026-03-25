// src/graphics/sprites/monsters/DungeonFiend.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN_MID   = 0x5a1010;
const SKIN_DARK  = 0x330606;
const SKIN_LIGHT = 0x7a2020;
const CLAW_COLOR = 0x1a0505;
const EYE_COLOR  = 0xff3300;
const MARK_COLOR = 0xff4400;

export const DungeonFiendDrawer: EntityDrawer = {
  key: 'monster_dungeon_fiend',
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

    switch (act) {
      case 'idle':
        bodyOffsetY = Math.sin(phase) * 1 * s;
        break;
      case 'walk':
        bodyOffsetX = Math.sin(phase) * 2 * s;
        bodyOffsetY = -Math.abs(Math.sin(phase)) * 2.5 * s;
        break;
      case 'attack':
        attackLunge = t;
        bodyOffsetX = t * 8 * s;
        bodyOffsetY = -t * 3 * s;
        break;
      case 'hurt':
        bodyOffsetX = -t * 5 * s;
        alpha = 0.7 + t * 0.3;
        break;
      case 'death':
        globalRot = t * Math.PI * 0.4;
        bodyOffsetY = t * h * 0.35;
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
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    utils.fillEllipse(ctx, cx + bodyOffsetX, baseY + 1 * s, 14 * s, 4 * s);

    // Legs
    for (const side of [-1, 1]) {
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const hipX = cx + side * 5 * s + bodyOffsetX;
      const hipY = baseY - 16 * s + bodyOffsetY;
      const kneeX = hipX + side * 2 * s + Math.sin(legPhase) * 2.5 * s;
      const kneeY = hipY + 8 * s;
      const footX = kneeX + Math.sin(legPhase) * 1.5 * s;
      const footY = baseY - 1 * s;
      utils.drawLimb(ctx, [{ x: hipX, y: hipY }, { x: kneeX, y: kneeY }, { x: footX, y: footY }], 3.5 * s, SKIN_DARK);
      // Hooves
      ctx.fillStyle = utils.rgb(CLAW_COLOR);
      utils.fillEllipse(ctx, footX, footY, 3 * s, 1.5 * s);
    }

    // Torso
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 30 * s + bodyOffsetY;

    utils.zoneEntityOutline(ctx, w, h);

    const torsoGrad = ctx.createRadialGradient(torsoX - 2 * s, torsoY - 3 * s, 0, torsoX, torsoY, 12 * s);
    torsoGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    torsoGrad.addColorStop(0.5, utils.rgb(SKIN_MID));
    torsoGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = torsoGrad;
    utils.fillEllipse(ctx, torsoX, torsoY, 10 * s, 14 * s);

    utils.softOutlineEnd(ctx);

    // Glowing marks on torso
    for (let i = 0; i < 3; i++) {
      const markY = torsoY - 6 * s + i * 5 * s;
      const markGlow = ctx.createRadialGradient(torsoX, markY, 0, torsoX, markY, 3 * s);
      markGlow.addColorStop(0, utils.rgb(MARK_COLOR, 0.6));
      markGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = markGlow;
      utils.fillEllipse(ctx, torsoX, markY, 2.5 * s, 1.5 * s);
    }

    // Arms with claws
    for (const side of [-1, 1]) {
      const isAttackSide = side === 1 && act === 'attack';
      const shoulderX = torsoX + side * 9 * s;
      const shoulderY = torsoY - 8 * s;
      let elbowX: number, elbowY: number, handX: number, handY: number;

      if (isAttackSide) {
        elbowX = shoulderX + side * 5 * s + attackLunge * 4 * s;
        elbowY = shoulderY + 2 * s - attackLunge * 6 * s;
        handX = elbowX + side * 4 * s;
        handY = elbowY - attackLunge * 4 * s;
      } else {
        const armPhase = act === 'walk' ? phase + (side === 1 ? Math.PI : 0) : 0;
        elbowX = shoulderX + side * 3 * s + Math.sin(armPhase) * 2 * s;
        elbowY = shoulderY + 5 * s;
        handX = elbowX + side * 3 * s;
        handY = elbowY + 6 * s + Math.sin(armPhase) * 2 * s;
      }

      utils.drawLimb(ctx, [{ x: shoulderX, y: shoulderY }, { x: elbowX, y: elbowY }, { x: handX, y: handY }], 3 * s, SKIN_DARK);

      // Claws
      ctx.strokeStyle = utils.rgb(CLAW_COLOR);
      ctx.lineWidth = 1 * s;
      ctx.lineCap = 'round';
      for (let ci = -1; ci <= 1; ci++) {
        ctx.beginPath();
        ctx.moveTo(handX + ci * 1.5 * s, handY);
        ctx.lineTo(handX + ci * 2.5 * s + side * 1 * s, handY + 3 * s);
        ctx.stroke();
      }
    }

    // Head
    const headCX = torsoX;
    const headCY = torsoY - 16 * s;
    const headRX = 8 * s;
    const headRY = 7 * s;

    utils.zoneEntityRimLight(ctx, headCX, headCY, headRX, headRY);

    const headGrad = ctx.createRadialGradient(headCX - 2 * s, headCY - 2 * s, 0, headCX, headCY, headRX);
    headGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    headGrad.addColorStop(0.5, utils.rgb(SKIN_MID));
    headGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = headGrad;
    utils.fillEllipse(ctx, headCX, headCY, headRX, headRY);

    // Short horns
    for (const side of [-1, 1]) {
      ctx.strokeStyle = utils.rgb(CLAW_COLOR);
      ctx.lineWidth = 2.5 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(headCX + side * 5 * s, headCY - 4 * s);
      ctx.lineTo(headCX + side * 7 * s, headCY - 9 * s);
      ctx.stroke();
    }

    // Glowing eyes
    for (const side of [-1, 1]) {
      const ex = headCX + side * 3 * s;
      const ey = headCY;
      ctx.fillStyle = utils.rgb(EYE_COLOR);
      utils.fillEllipse(ctx, ex, ey, 2 * s, 1.5 * s);
      const eyeGlow = ctx.createRadialGradient(ex, ey, 0, ex, ey, 3.5 * s);
      eyeGlow.addColorStop(0, utils.rgb(EYE_COLOR, 0.4));
      eyeGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = eyeGlow;
      utils.fillCircle(ctx, ex, ey, 3.5 * s);
    }

    // Mouth snarl
    ctx.strokeStyle = utils.rgb(SKIN_DARK);
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.arc(headCX, headCY + 3 * s, 4 * s, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.restore();
  },
};
