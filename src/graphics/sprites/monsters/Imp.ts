// src/graphics/sprites/monsters/Imp.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN_MID   = 0x560b0b;
const SKIN_DARK  = 0x340606;
const SKIN_LIGHT = 0x771c1c;
const WING_COLOR = 0x3f0b0b;
const HORN_COLOR = 0x340606;
const EYE_COLOR  = 0xffaa00;

export const ImpDrawer: EntityDrawer = {
  key: 'monster_imp',
  frameW: 40,
  frameH: 48,
  totalFrames: 20,

  drawFrame(ctx, frame, action, w, h, utils) {
    const act = action as MonsterAction;
    const s = w / 40;

    const frameCounts: Record<MonsterAction, number> = { idle: 4, walk: 6, attack: 4, hurt: 2, death: 4 };
    const count = frameCounts[act] || 4;
    const localFrame = frame % count;
    const t = count > 1 ? localFrame / (count - 1) : 0;
    const phase = (localFrame / count) * Math.PI * 2;

    let alpha = 1;
    let bodyOffsetX = 0;
    let bodyOffsetY = 0;
    let wingFlap = 0;
    let globalRot = 0;
    let attackLunge = 0;

    switch (act) {
      case 'idle':
        bodyOffsetY = Math.sin(phase) * 1.5 * s;
        wingFlap = Math.abs(Math.sin(phase)) * 0.4;
        break;
      case 'walk':
        bodyOffsetX = Math.sin(phase) * 1.5 * s;
        bodyOffsetY = -Math.abs(Math.sin(phase)) * 2 * s;
        wingFlap = Math.abs(Math.sin(phase)) * 0.5;
        break;
      case 'attack':
        attackLunge = t;
        bodyOffsetX = t * 5 * s;
        bodyOffsetY = -t * 3 * s;
        wingFlap = 0.6 + t * 0.4;
        break;
      case 'hurt':
        bodyOffsetX = -t * 4 * s;
        alpha = 0.7 + t * 0.3;
        wingFlap = 0.2;
        break;
      case 'death':
        globalRot = t * Math.PI * 0.5;
        bodyOffsetY = t * h * 0.4;
        alpha = 1 - t * 0.8;
        break;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = w / 2;
    const baseY = h * 0.94;

    ctx.translate(cx, baseY);
    ctx.rotate(globalRot);
    ctx.translate(-cx, -baseY);

    // ── Shadow ────────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    utils.fillEllipse(ctx, cx + bodyOffsetX, baseY + 1 * s, 11 * s, 2.5 * s);

    // ── Bat wings (too small to fly — behind body) ────────────────────────────
    const wingBaseX = cx + bodyOffsetX;
    const wingBaseY = baseY - 28 * s + bodyOffsetY;

    for (const side of [-1, 1]) {
      const wSpan = (8 + wingFlap * 5) * s;
      const wH = (5 + wingFlap * 4) * s;

      ctx.fillStyle = utils.rgb(WING_COLOR, 0.75);
      ctx.beginPath();
      ctx.moveTo(wingBaseX, wingBaseY);
      ctx.quadraticCurveTo(
        wingBaseX + side * wSpan * 0.6,
        wingBaseY - wH * 1.2,
        wingBaseX + side * wSpan,
        wingBaseY - wH
      );
      ctx.quadraticCurveTo(
        wingBaseX + side * wSpan * 0.8,
        wingBaseY - wH * 0.3,
        wingBaseX + side * 3 * s,
        wingBaseY
      );
      ctx.closePath();
      ctx.fill();

      // Vein
      ctx.strokeStyle = utils.rgb(utils.darken(WING_COLOR, 20), 0.5);
      ctx.lineWidth = 0.6 * s;
      ctx.beginPath();
      ctx.moveTo(wingBaseX, wingBaseY);
      ctx.lineTo(wingBaseX + side * wSpan * 0.7, wingBaseY - wH * 0.8);
      ctx.stroke();
    }

    // ── Skinny legs ───────────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const hipX = cx + side * 3 * s + bodyOffsetX;
      const hipY = baseY - 10 * s + bodyOffsetY;
      const kneeX = hipX + side * 2 * s + Math.sin(legPhase) * 2 * s;
      const kneeY = hipY + 5 * s;
      const footX = kneeX + Math.sin(legPhase) * s;
      const footY = baseY - 1 * s;

      utils.drawLimb(ctx, [
        { x: hipX, y: hipY },
        { x: kneeX, y: kneeY },
        { x: footX, y: footY },
      ], 2 * s, SKIN_DARK);

      // Tiny clawed foot
      ctx.strokeStyle = utils.rgb(SKIN_DARK);
      ctx.lineWidth = 0.8 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(footX, footY);
      ctx.lineTo(footX + side * 2.5 * s, footY + 1.5 * s);
      ctx.stroke();
    }

    // ── Torso ─────────────────────────────────────────────────────────────────
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 22 * s + bodyOffsetY;

    // Soft outline glow (red/orange — demonic)
    utils.softOutline(ctx, 'rgba(200,50,30,0.25)', 5);

    const torsoGrad = ctx.createRadialGradient(torsoX - 2 * s, torsoY - 2 * s, 0, torsoX, torsoY, 7 * s);
    torsoGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    torsoGrad.addColorStop(0.5, utils.rgb(SKIN_MID));
    torsoGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = torsoGrad;
    utils.fillEllipse(ctx, torsoX, torsoY, 6 * s, 8 * s);

    // End soft outline
    utils.softOutlineEnd(ctx);

    // Rim light on head (oversized)
    utils.rimLight(ctx, torsoX, torsoY - 16 * s, 10 * s, 9.5 * s, 'rgba(180,40,20,0.12)');

    // ── Skinny arms ───────────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const isRight = side === 1;
      const armPhase = act === 'walk' ? phase + (isRight ? Math.PI : 0) : 0;
      const shoulderX = torsoX + side * 5.5 * s;
      const shoulderY = torsoY - 5 * s;

      let elbowX: number, elbowY: number, handX: number, handY: number;

      if (act === 'attack' && isRight) {
        elbowX = shoulderX + side * 3 * s + attackLunge * 2 * s;
        elbowY = shoulderY + 3 * s - attackLunge * 3 * s;
        handX = elbowX + side * 4 * s;
        handY = elbowY + 2 * s - attackLunge * 4 * s;
      } else {
        elbowX = shoulderX + side * 2 * s + Math.sin(armPhase) * 1.5 * s;
        elbowY = shoulderY + 4 * s;
        handX = elbowX + side * 2 * s;
        handY = elbowY + 5 * s + Math.sin(armPhase) * 1.5 * s;
      }

      utils.drawLimb(ctx, [
        { x: shoulderX, y: shoulderY },
        { x: elbowX, y: elbowY },
        { x: handX, y: handY },
      ], 1.8 * s, SKIN_DARK);

      // Claw fingertips (3 small spikes)
      ctx.strokeStyle = utils.rgb(SKIN_DARK);
      ctx.lineWidth = 0.7 * s;
      ctx.lineCap = 'round';
      for (let fi = -1; fi <= 1; fi++) {
        ctx.beginPath();
        ctx.moveTo(handX + fi * 1 * s, handY);
        ctx.lineTo(handX + fi * 1.5 * s + side * 0.5 * s, handY + 2 * s);
        ctx.stroke();
      }
    }

    // ── Oversized head (40% of total height) ─────────────────────────────────
    const headCX = torsoX;
    const headCY = torsoY - 16 * s;
    const headRX = 10 * s;
    const headRY = 9.5 * s;

    const headGrad = ctx.createRadialGradient(headCX - 3 * s, headCY - 3 * s, 0, headCX, headCY, headRX);
    headGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    headGrad.addColorStop(0.55, utils.rgb(SKIN_MID));
    headGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = headGrad;
    utils.fillEllipse(ctx, headCX, headCY, headRX, headRY);

    // ── Small curved horns ────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const hornBaseX = headCX + side * 6 * s;
      const hornBaseY = headCY - headRY * 0.7;
      ctx.strokeStyle = utils.rgb(HORN_COLOR);
      ctx.lineWidth = 2 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(
        hornBaseX + side * 2 * s,
        hornBaseY - 3 * s,
        4 * s,
        side === -1 ? Math.PI * 0.15 : Math.PI * 0.85,
        side === -1 ? Math.PI * 0.75 : Math.PI * 1.25 + Math.PI * 0.5,
        side === 1
      );
      ctx.stroke();
    }

    // ── Large amber eyes ──────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const ex = headCX + side * 4 * s;
      const ey = headCY - 1 * s;

      // Eye white/sclera (dark)
      ctx.fillStyle = '#1a0404';
      utils.fillEllipse(ctx, ex, ey, 3.5 * s, 3 * s);

      // Iris
      const eyeGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 2.8 * s);
      eyeGrad.addColorStop(0, utils.rgb(utils.lighten(EYE_COLOR, 30)));
      eyeGrad.addColorStop(0.5, utils.rgb(EYE_COLOR));
      eyeGrad.addColorStop(1, utils.rgb(utils.darken(EYE_COLOR, 30)));
      ctx.fillStyle = eyeGrad;
      utils.fillEllipse(ctx, ex, ey, 2.8 * s, 2.5 * s);

      // Large pupil
      ctx.fillStyle = '#0a0404';
      utils.fillEllipse(ctx, ex, ey, 1.8 * s, 2 * s);

      // Highlight
      ctx.fillStyle = 'rgba(255,220,120,0.6)';
      utils.fillCircle(ctx, ex - 0.6 * s, ey - 0.8 * s, 0.7 * s);
    }

    // ── Wide toothy grin ──────────────────────────────────────────────────────
    const mouthY = headCY + headRY * 0.45;
    const mouthW = 6 * s;
    ctx.strokeStyle = utils.rgb(SKIN_DARK);
    ctx.lineWidth = 1 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(headCX, mouthY - 1.5 * s, mouthW, 0.15, Math.PI - 0.15);
    ctx.stroke();

    // Triangle teeth
    ctx.fillStyle = '#e8d8c8';
    const toothCount = 6;
    for (let ti = 0; ti < toothCount; ti++) {
      const tFrac = (ti + 0.5) / toothCount;
      const tx = headCX - mouthW * 0.85 + tFrac * mouthW * 1.7;
      const toothHeight = (1.5 + Math.sin(tFrac * Math.PI) * 0.8) * s;
      ctx.beginPath();
      ctx.moveTo(tx - 1 * s, mouthY - 1.5 * s);
      ctx.lineTo(tx, mouthY - 1.5 * s + toothHeight);
      ctx.lineTo(tx + 1 * s, mouthY - 1.5 * s);
      ctx.closePath();
      ctx.fill();
    }

    // ── Spade-tipped tail ─────────────────────────────────────────────────────
    const tailBaseX = torsoX - 3 * s;
    const tailBaseY = baseY - 8 * s + bodyOffsetY;
    const tailWag = Math.sin(phase + 1) * 3 * s;

    ctx.strokeStyle = utils.rgb(SKIN_MID);
    ctx.lineWidth = 2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tailBaseX, tailBaseY);
    ctx.quadraticCurveTo(
      tailBaseX - 8 * s + tailWag,
      tailBaseY + 5 * s,
      tailBaseX - 10 * s + tailWag,
      tailBaseY
    );
    ctx.stroke();

    // Spade tip
    const spadeX = tailBaseX - 10 * s + tailWag;
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
