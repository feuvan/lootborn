// src/graphics/sprites/monsters/Succubus.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN_MID   = 0x611032;
const SKIN_DARK  = 0x3f0721;
const SKIN_LIGHT = 0x821c49;
const HAIR_COLOR = 0x1d0712;
const WING_COLOR = 0x3f0b21;
const HORN_COLOR = 0x290610;
const EYE_COLOR  = 0xff44aa;
const CLOTH_COLOR = 0x1d0610;
const LIP_COLOR  = 0x771638;

export const SuccubusDrawer: EntityDrawer = {
  key: 'monster_succubus',
  frameW: 48,
  frameH: 64,
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
    let wingSpread = 0.35;
    let attackLunge = 0;
    let globalRot = 0;

    switch (act) {
      case 'idle':
        bodyOffsetY = Math.sin(phase) * 1.5 * s;
        wingSpread = 0.3 + Math.abs(Math.sin(phase)) * 0.25;
        break;
      case 'walk':
        bodyOffsetX = Math.sin(phase) * 1.5 * s;
        bodyOffsetY = -Math.abs(Math.sin(phase)) * 2 * s;
        wingSpread = 0.35 + Math.abs(Math.sin(phase)) * 0.3;
        break;
      case 'attack':
        attackLunge = t;
        bodyOffsetX = t * 6 * s;
        bodyOffsetY = -t * 3 * s;
        wingSpread = 0.5 + t * 0.5;
        break;
      case 'hurt':
        bodyOffsetX = -t * 4 * s;
        alpha = 0.7 + t * 0.3;
        wingSpread = 0.2;
        break;
      case 'death':
        globalRot = t * Math.PI * 0.45;
        bodyOffsetY = t * h * 0.4;
        alpha = 1 - t * 0.8;
        break;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = w / 2;
    const baseY = h * 0.96;

    ctx.translate(cx, baseY);
    ctx.rotate(globalRot);
    ctx.translate(-cx, -baseY);

    // ── Shadow ────────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    utils.fillEllipse(ctx, cx + bodyOffsetX, baseY + 1 * s, 11 * s, 2.5 * s);

    // ── Elegant bat wings (behind body) ──────────────────────────────────────
    const wingBaseX = cx + bodyOffsetX;
    const wingBaseY = baseY - 36 * s + bodyOffsetY;

    for (const side of [-1, 1]) {
      const wSpan = (14 + wingSpread * 12) * s;
      const wH = (10 + wingSpread * 9) * s;

      // Main membrane — smooth curves
      ctx.fillStyle = utils.rgb(WING_COLOR, 0.72);
      ctx.beginPath();
      ctx.moveTo(wingBaseX, wingBaseY);
      ctx.quadraticCurveTo(
        wingBaseX + side * wSpan * 0.55,
        wingBaseY - wH * 1.3,
        wingBaseX + side * wSpan,
        wingBaseY - wH
      );
      ctx.quadraticCurveTo(
        wingBaseX + side * wSpan * 0.75,
        wingBaseY - wH * 0.1,
        wingBaseX + side * 5 * s,
        wingBaseY + 2 * s
      );
      ctx.closePath();
      ctx.fill();

      // Lower membrane lobe
      ctx.fillStyle = utils.rgb(utils.darken(WING_COLOR, 15), 0.6);
      ctx.beginPath();
      ctx.moveTo(wingBaseX + side * 4 * s, wingBaseY + 2 * s);
      ctx.quadraticCurveTo(
        wingBaseX + side * wSpan * 0.7,
        wingBaseY + 6 * s,
        wingBaseX + side * wSpan * 0.85,
        wingBaseY - wH * 0.3
      );
      ctx.quadraticCurveTo(
        wingBaseX + side * wSpan * 0.6,
        wingBaseY + 4 * s,
        wingBaseX + side * 6 * s,
        wingBaseY + 4 * s
      );
      ctx.closePath();
      ctx.fill();

      // Subtle vein
      ctx.strokeStyle = utils.rgb(utils.darken(WING_COLOR, 25), 0.45);
      ctx.lineWidth = 0.6 * s;
      ctx.beginPath();
      ctx.moveTo(wingBaseX, wingBaseY);
      ctx.quadraticCurveTo(
        wingBaseX + side * wSpan * 0.4,
        wingBaseY - wH * 0.8,
        wingBaseX + side * wSpan * 0.8,
        wingBaseY - wH * 0.7
      );
      ctx.stroke();

      // Wing edge highlight
      ctx.strokeStyle = utils.rgb(SKIN_MID, 0.2);
      ctx.lineWidth = 0.8 * s;
      ctx.beginPath();
      ctx.moveTo(wingBaseX, wingBaseY);
      ctx.quadraticCurveTo(
        wingBaseX + side * wSpan * 0.55,
        wingBaseY - wH * 1.3,
        wingBaseX + side * wSpan,
        wingBaseY - wH
      );
      ctx.stroke();
    }

    // ── Slender legs ──────────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const hipX = cx + side * 4 * s + bodyOffsetX;
      const hipY = baseY - 16 * s + bodyOffsetY;
      const kneeX = hipX + side * 2 * s + Math.sin(legPhase) * 2 * s;
      const kneeY = hipY + 8 * s;
      const footX = kneeX - side * 0.5 * s + Math.sin(legPhase) * s;
      const footY = baseY - 1 * s;

      utils.drawLimb(ctx, [
        { x: hipX, y: hipY },
        { x: kneeX, y: kneeY },
        { x: footX, y: footY },
      ], 2.5 * s, SKIN_MID);

      // Pointed toe
      ctx.fillStyle = utils.rgb(CLOTH_COLOR);
      ctx.beginPath();
      ctx.moveTo(footX - 1.5 * s, footY);
      ctx.lineTo(footX + 1.5 * s, footY);
      ctx.lineTo(footX + side * 3 * s, footY + 2 * s);
      ctx.closePath();
      ctx.fill();
    }

    // ── Body with narrow waist ────────────────────────────────────────────────
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 32 * s + bodyOffsetY;

    // Soft outline glow (red/orange — demonic)
    utils.softOutline(ctx, 'rgba(200,50,30,0.25)', 5);

    // Hips
    const hipGrad = ctx.createRadialGradient(torsoX - 2 * s, torsoY + 4 * s, 0, torsoX, torsoY + 6 * s, 9 * s);
    hipGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    hipGrad.addColorStop(0.5, utils.rgb(SKIN_MID));
    hipGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = hipGrad;
    utils.fillEllipse(ctx, torsoX, torsoY + 6 * s, 8 * s, 9 * s);

    // Dark clothing overlay on lower body
    ctx.fillStyle = utils.rgb(CLOTH_COLOR, 0.65);
    utils.fillEllipse(ctx, torsoX, torsoY + 7 * s, 7.5 * s, 8.5 * s);

    // Waist (narrow inward)
    const waistGrad = ctx.createRadialGradient(torsoX, torsoY, 0, torsoX, torsoY, 5 * s);
    waistGrad.addColorStop(0, utils.rgb(SKIN_LIGHT, 0.9));
    waistGrad.addColorStop(1, utils.rgb(SKIN_MID, 0.9));
    ctx.fillStyle = waistGrad;
    utils.fillEllipse(ctx, torsoX, torsoY, 5 * s, 4 * s);

    // Upper torso / chest
    const chestGrad = ctx.createRadialGradient(torsoX - 2 * s, torsoY - 7 * s, 0, torsoX, torsoY - 7 * s, 8 * s);
    chestGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    chestGrad.addColorStop(0.5, utils.rgb(SKIN_MID));
    chestGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = chestGrad;
    utils.fillEllipse(ctx, torsoX, torsoY - 8 * s, 7.5 * s, 9 * s);

    // Dark clothing overlay on upper body
    ctx.fillStyle = utils.rgb(CLOTH_COLOR, 0.6);
    utils.fillEllipse(ctx, torsoX, torsoY - 9 * s, 7 * s, 8.5 * s);

    // End soft outline
    utils.softOutlineEnd(ctx);

    // Rim light on chest
    utils.rimLight(ctx, torsoX, torsoY - 8 * s, 7.5 * s, 9 * s, 'rgba(180,40,20,0.12)');

    // ── Slender arms ──────────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const isRight = side === 1;
      const armPhase = act === 'walk' ? phase + (isRight ? Math.PI : 0) : 0;
      const shoulderX = torsoX + side * 7 * s;
      const shoulderY = torsoY - 15 * s;

      let elbowX: number, elbowY: number, handX: number, handY: number;

      if (act === 'attack' && isRight) {
        elbowX = shoulderX + side * 4 * s + attackLunge * 2 * s;
        elbowY = shoulderY + 4 * s - attackLunge * 5 * s;
        handX = elbowX + side * 4 * s + attackLunge * 2 * s;
        handY = elbowY + 3 * s - attackLunge * 5 * s;
      } else {
        elbowX = shoulderX + side * 3 * s + Math.sin(armPhase) * 1.5 * s;
        elbowY = shoulderY + 7 * s - Math.abs(Math.sin(armPhase)) * 2 * s;
        handX = elbowX + side * 2 * s;
        handY = elbowY + 7 * s + Math.sin(armPhase) * 2 * s;
      }

      utils.drawLimb(ctx, [
        { x: shoulderX, y: shoulderY },
        { x: elbowX, y: elbowY },
        { x: handX, y: handY },
      ], 2 * s, SKIN_MID);

      // Clawed fingertips
      ctx.strokeStyle = utils.rgb(SKIN_DARK);
      ctx.lineWidth = 0.7 * s;
      ctx.lineCap = 'round';
      for (let fi = -1; fi <= 1; fi++) {
        ctx.beginPath();
        ctx.moveTo(handX + fi * 1 * s, handY);
        ctx.lineTo(handX + fi * 1.5 * s + side * 0.5 * s, handY + 2.5 * s);
        ctx.stroke();
      }
    }

    // ── Dark flowing hair (layered curve paths) ───────────────────────────────
    const headCX = torsoX;
    const headCY = torsoY - 26 * s;

    // Back hair layers
    for (let hl = 0; hl < 4; hl++) {
      const hAlpha = 0.8 - hl * 0.12;
      const hOffset = hl * 1.5 * s;
      ctx.strokeStyle = utils.rgb(HAIR_COLOR, hAlpha);
      ctx.lineWidth = (3 - hl * 0.5) * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(headCX - 5 * s + hOffset * 0.5, headCY - 5 * s);
      ctx.quadraticCurveTo(
        headCX - 8 * s - hOffset,
        headCY + 4 * s,
        headCX - 6 * s - hOffset,
        headCY + 16 * s
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(headCX + 5 * s - hOffset * 0.5, headCY - 5 * s);
      ctx.quadraticCurveTo(
        headCX + 8 * s + hOffset,
        headCY + 4 * s,
        headCX + 6 * s + hOffset,
        headCY + 16 * s
      );
      ctx.stroke();
    }

    // ── Head ──────────────────────────────────────────────────────────────────
    const headGrad = ctx.createRadialGradient(headCX - 2 * s, headCY - 3 * s, 0, headCX, headCY, 7 * s);
    headGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    headGrad.addColorStop(0.5, utils.rgb(SKIN_MID));
    headGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = headGrad;
    utils.fillEllipse(ctx, headCX, headCY, 6.5 * s, 7.5 * s);

    // ── Swept-back graceful horns ─────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const hornBaseX = headCX + side * 4 * s;
      const hornBaseY = headCY - 6.5 * s;
      ctx.strokeStyle = utils.rgb(HORN_COLOR);
      ctx.lineWidth = 2 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hornBaseX, hornBaseY);
      ctx.quadraticCurveTo(
        hornBaseX + side * 5 * s,
        hornBaseY - 5 * s,
        hornBaseX + side * 7 * s,
        hornBaseY - 2 * s
      );
      ctx.stroke();
    }

    // Front hair over forehead
    ctx.fillStyle = utils.rgb(HAIR_COLOR, 0.9);
    ctx.beginPath();
    ctx.ellipse(headCX, headCY - 6 * s, 5.5 * s, 3.5 * s, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // ── Glowing pink eyes ──────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const ex = headCX + side * 2.5 * s;
      const ey = headCY - 1.5 * s;

      // Glow
      const eyeGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 3.5 * s);
      eyeGrad.addColorStop(0, utils.rgb(EYE_COLOR, 0.85));
      eyeGrad.addColorStop(0.5, utils.rgb(EYE_COLOR, 0.4));
      eyeGrad.addColorStop(1, 'rgba(255,68,170,0)');
      ctx.fillStyle = eyeGrad;
      utils.fillCircle(ctx, ex, ey, 3.5 * s);

      ctx.fillStyle = '#1a0410';
      utils.fillEllipse(ctx, ex, ey, 2.8 * s, 2.2 * s);

      ctx.fillStyle = utils.rgb(EYE_COLOR);
      utils.fillEllipse(ctx, ex, ey, 2 * s, 1.6 * s);

      // White highlight
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      utils.fillCircle(ctx, ex - 0.5 * s, ey - 0.5 * s, 0.65 * s);
    }

    // ── Dark lips ─────────────────────────────────────────────────────────────
    const lipY = headCY + 3.5 * s;
    ctx.fillStyle = utils.rgb(LIP_COLOR);
    ctx.beginPath();
    ctx.moveTo(headCX - 2.8 * s, lipY);
    ctx.quadraticCurveTo(headCX - 1 * s, lipY - 1.2 * s, headCX, lipY - 0.5 * s);
    ctx.quadraticCurveTo(headCX + 1 * s, lipY - 1.2 * s, headCX + 2.8 * s, lipY);
    ctx.quadraticCurveTo(headCX, lipY + 1.5 * s, headCX - 2.8 * s, lipY);
    ctx.fill();

    // ── Spade-tipped tail ─────────────────────────────────────────────────────
    const tailBaseX = torsoX - 3 * s;
    const tailBaseY = baseY - 16 * s + bodyOffsetY;
    const tailWag = Math.sin(phase + 0.5) * 4 * s;

    ctx.strokeStyle = utils.rgb(SKIN_MID);
    ctx.lineWidth = 2.5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tailBaseX, tailBaseY);
    ctx.quadraticCurveTo(
      tailBaseX - 9 * s + tailWag,
      tailBaseY + 6 * s,
      tailBaseX - 11 * s + tailWag,
      tailBaseY
    );
    ctx.stroke();

    // Spade tip
    const spadeX = tailBaseX - 11 * s + tailWag;
    const spadeY = tailBaseY;
    ctx.fillStyle = utils.rgb(SKIN_DARK);
    ctx.beginPath();
    ctx.moveTo(spadeX, spadeY - 3 * s);
    ctx.quadraticCurveTo(spadeX + 2.5 * s, spadeY - 1 * s, spadeX + 1.5 * s, spadeY + 1 * s);
    ctx.lineTo(spadeX, spadeY - 0.5 * s);
    ctx.lineTo(spadeX - 1.5 * s, spadeY + 1 * s);
    ctx.quadraticCurveTo(spadeX - 2.5 * s, spadeY - 1 * s, spadeX, spadeY - 3 * s);
    ctx.fill();

    ctx.restore();
  },
};
