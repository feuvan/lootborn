// src/graphics/sprites/monsters/IronGuardian.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const METAL_MID   = 0x4a4a50;
const METAL_DARK  = 0x2a2a30;
const METAL_LIGHT = 0x6a6a75;
const CORE_COLOR  = 0x2288ff;
const JOINT_COLOR = 0x333340;
const RUST_COLOR  = 0x5a4030;

export const IronGuardianDrawer: EntityDrawer = {
  key: 'monster_iron_guardian',
  frameW: 60,
  frameH: 72,
  totalFrames: 20,

  drawFrame(ctx, frame, action, w, h, utils) {
    const act = action as MonsterAction;
    const s = w / 60;

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
    const coreGlow = 0.5 + Math.sin(phase * 1.5) * 0.2;

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
        bodyOffsetX = t * 8 * s;
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

    // Legs (thick metal pillars)
    for (const side of [-1, 1]) {
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const hipX = cx + side * 6 * s + bodyOffsetX;
      const hipY = baseY - 16 * s + bodyOffsetY;
      const kneeX = hipX + Math.sin(legPhase) * 2 * s;
      const kneeY = hipY + 8 * s;
      const footX = kneeX + Math.sin(legPhase) * s;
      const footY = baseY - 1 * s;

      // Upper leg
      ctx.fillStyle = utils.rgb(METAL_MID);
      ctx.beginPath();
      ctx.moveTo(hipX - 4 * s, hipY);
      ctx.lineTo(hipX + 4 * s, hipY);
      ctx.lineTo(kneeX + 3 * s, kneeY);
      ctx.lineTo(kneeX - 3 * s, kneeY);
      ctx.closePath();
      ctx.fill();

      // Joint
      ctx.fillStyle = utils.rgb(JOINT_COLOR);
      utils.fillCircle(ctx, kneeX, kneeY, 3 * s);
      const jg = ctx.createRadialGradient(kneeX, kneeY, 0, kneeX, kneeY, 2 * s);
      jg.addColorStop(0, utils.rgb(CORE_COLOR, coreGlow * 0.5));
      jg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = jg;
      utils.fillCircle(ctx, kneeX, kneeY, 2 * s);

      // Lower leg
      ctx.fillStyle = utils.rgb(METAL_DARK);
      ctx.beginPath();
      ctx.moveTo(kneeX - 3 * s, kneeY);
      ctx.lineTo(kneeX + 3 * s, kneeY);
      ctx.lineTo(footX + 4 * s, footY);
      ctx.lineTo(footX - 4 * s, footY);
      ctx.closePath();
      ctx.fill();

      // Foot plate
      ctx.fillStyle = utils.rgb(METAL_DARK);
      utils.fillEllipse(ctx, footX, footY, 5 * s, 2 * s);
    }

    // Torso (angular metal block)
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 32 * s + bodyOffsetY;

    utils.zoneEntityOutline(ctx, w, h);

    const torsoGrad = ctx.createLinearGradient(torsoX - 12 * s, torsoY - 14 * s, torsoX + 12 * s, torsoY + 14 * s);
    torsoGrad.addColorStop(0, utils.rgb(METAL_LIGHT));
    torsoGrad.addColorStop(0.5, utils.rgb(METAL_MID));
    torsoGrad.addColorStop(1, utils.rgb(METAL_DARK));
    ctx.fillStyle = torsoGrad;
    // Angular torso
    ctx.beginPath();
    ctx.moveTo(torsoX - 10 * s, torsoY - 10 * s);
    ctx.lineTo(torsoX + 10 * s, torsoY - 10 * s);
    ctx.lineTo(torsoX + 12 * s, torsoY + 6 * s);
    ctx.lineTo(torsoX + 8 * s, torsoY + 14 * s);
    ctx.lineTo(torsoX - 8 * s, torsoY + 14 * s);
    ctx.lineTo(torsoX - 12 * s, torsoY + 6 * s);
    ctx.closePath();
    ctx.fill();

    utils.softOutlineEnd(ctx);

    // Glowing core in chest
    const cg = ctx.createRadialGradient(torsoX, torsoY, 0, torsoX, torsoY, 6 * s);
    cg.addColorStop(0, utils.rgb(CORE_COLOR, coreGlow));
    cg.addColorStop(0.5, utils.rgb(CORE_COLOR, coreGlow * 0.4));
    cg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cg;
    utils.fillCircle(ctx, torsoX, torsoY, 6 * s);
    ctx.fillStyle = utils.rgb(CORE_COLOR, 0.8);
    utils.fillCircle(ctx, torsoX, torsoY, 2.5 * s);

    // Rust patches
    ctx.fillStyle = utils.rgb(RUST_COLOR, 0.3);
    utils.fillEllipse(ctx, torsoX + 6 * s, torsoY + 5 * s, 3 * s, 2 * s);
    utils.fillEllipse(ctx, torsoX - 5 * s, torsoY + 8 * s, 2 * s, 1.5 * s);

    // Arms (heavy metal)
    for (const side of [-1, 1]) {
      const isAttack = side === 1 && act === 'attack';
      const shoulderX = torsoX + side * 12 * s;
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
        handY = elbowY + 7 * s + Math.sin(armPhase) * 1.5 * s;
      }

      // Upper arm plate
      ctx.fillStyle = utils.rgb(METAL_MID);
      ctx.beginPath();
      ctx.moveTo(shoulderX - 4 * s, shoulderY);
      ctx.lineTo(shoulderX + 4 * s, shoulderY);
      ctx.lineTo(elbowX + 3 * s, elbowY);
      ctx.lineTo(elbowX - 3 * s, elbowY);
      ctx.closePath();
      ctx.fill();

      // Joint
      ctx.fillStyle = utils.rgb(JOINT_COLOR);
      utils.fillCircle(ctx, elbowX, elbowY, 2.5 * s);

      // Lower arm
      ctx.fillStyle = utils.rgb(METAL_DARK);
      ctx.beginPath();
      ctx.moveTo(elbowX - 3 * s, elbowY);
      ctx.lineTo(elbowX + 3 * s, elbowY);
      ctx.lineTo(handX + 4 * s, handY);
      ctx.lineTo(handX - 4 * s, handY);
      ctx.closePath();
      ctx.fill();

      // Fist
      ctx.fillStyle = utils.rgb(METAL_LIGHT);
      utils.fillEllipse(ctx, handX, handY, 4 * s, 3.5 * s);
    }

    // Head (angular visor)
    const headCX = torsoX;
    const headCY = torsoY - 16 * s;
    const headRX = 8 * s;
    const headRY = 7 * s;

    utils.zoneEntityRimLight(ctx, headCX, headCY, headRX, headRY);

    ctx.fillStyle = utils.rgb(METAL_MID);
    // Angular head
    ctx.beginPath();
    ctx.moveTo(headCX - headRX, headCY + 2 * s);
    ctx.lineTo(headCX - headRX * 0.8, headCY - headRY);
    ctx.lineTo(headCX + headRX * 0.8, headCY - headRY);
    ctx.lineTo(headCX + headRX, headCY + 2 * s);
    ctx.lineTo(headCX + headRX * 0.7, headCY + headRY * 0.7);
    ctx.lineTo(headCX - headRX * 0.7, headCY + headRY * 0.7);
    ctx.closePath();
    ctx.fill();

    // Visor slit with glow
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(headCX - 6 * s, headCY - 1 * s, 12 * s, 3 * s);
    // Blue glow behind visor
    for (const side of [-1, 1]) {
      const ex = headCX + side * 3 * s;
      const ey = headCY;
      ctx.fillStyle = utils.rgb(CORE_COLOR, 0.8);
      utils.fillCircle(ctx, ex, ey, 1.5 * s);
      const eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 3 * s);
      eg.addColorStop(0, utils.rgb(CORE_COLOR, 0.3));
      eg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = eg;
      utils.fillCircle(ctx, ex, ey, 3 * s);
    }

    ctx.restore();
  },
};
