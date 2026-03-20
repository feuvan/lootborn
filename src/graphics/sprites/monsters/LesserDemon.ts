// src/graphics/sprites/monsters/LesserDemon.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN_MID   = 0x3f0729;
const SKIN_DARK  = 0x290316;
const SKIN_LIGHT = 0x61123f;
const HORN_COLOR = 0x29071d;
const EYE_COLOR  = 0xff3030;
const HOOF_COLOR = 0x12030b;

export const LesserDemonDrawer: EntityDrawer = {
  key: 'monster_lesser_demon',
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
    let attackLunge = 0;
    let globalRot = 0;

    switch (act) {
      case 'idle':
        bodyOffsetY = Math.sin(phase) * 1 * s;
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
        bodyOffsetX = -t * 5 * s;
        alpha = 0.7 + t * 0.3;
        break;
      case 'death':
        globalRot = t * Math.PI * 0.45;
        bodyOffsetY = t * h * 0.35;
        alpha = 1 - t * 0.75;
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
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    utils.fillEllipse(ctx, cx + bodyOffsetX, baseY + 1 * s, 14 * s, 3 * s);

    // ── Hooved digitigrade legs ───────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const hipX = cx + side * 6 * s + bodyOffsetX;
      const hipY = baseY - 18 * s + bodyOffsetY;
      const kneeX = hipX + side * 3 * s + Math.sin(legPhase) * 3 * s;
      const kneeY = hipY + 8 * s - Math.abs(Math.sin(legPhase)) * 2 * s;
      // Digitigrade: ankle raised
      const ankleX = kneeX - side * 1 * s;
      const ankleY = kneeY + 7 * s;
      const hoofX = ankleX + side * 2 * s + Math.sin(legPhase) * 1 * s;
      const hoofY = baseY - 2 * s;

      utils.drawLimb(ctx, [
        { x: hipX, y: hipY },
        { x: kneeX, y: kneeY },
        { x: ankleX, y: ankleY },
        { x: hoofX, y: hoofY },
      ], 3.5 * s, SKIN_MID);

      // Hoof (dark wedge)
      ctx.fillStyle = utils.rgb(HOOF_COLOR);
      ctx.beginPath();
      ctx.moveTo(hoofX - 2.5 * s, hoofY);
      ctx.lineTo(hoofX + 2.5 * s, hoofY);
      ctx.lineTo(hoofX + 3 * s, hoofY + 3 * s);
      ctx.lineTo(hoofX - 3 * s, hoofY + 3 * s);
      ctx.closePath();
      ctx.fill();
    }

    // ── Torso (muscular) ──────────────────────────────────────────────────────
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 34 * s + bodyOffsetY;

    // Soft outline glow (red/orange — demonic)
    utils.softOutline(ctx, 'rgba(200,50,30,0.25)', 5);

    const torsoGrad = ctx.createLinearGradient(torsoX - 12 * s, torsoY - 14 * s, torsoX + 12 * s, torsoY + 12 * s);
    torsoGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    torsoGrad.addColorStop(0.4, utils.rgb(SKIN_MID));
    torsoGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = torsoGrad;
    utils.fillEllipse(ctx, torsoX, torsoY, 12 * s, 15 * s);

    // End soft outline
    utils.softOutlineEnd(ctx);

    // Rim light on torso
    utils.rimLight(ctx, torsoX, torsoY, 12 * s, 15 * s, 'rgba(180,40,20,0.12)');

    // Pectoral line
    ctx.strokeStyle = utils.rgb(SKIN_DARK, 0.55);
    ctx.lineWidth = 1.2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(torsoX - 8 * s, torsoY - 8 * s);
    ctx.quadraticCurveTo(torsoX, torsoY - 5 * s, torsoX + 8 * s, torsoY - 8 * s);
    ctx.stroke();

    // Abdominal arcs
    for (let ab = 0; ab < 3; ab++) {
      const abY = torsoY - 2 * s + ab * 4.5 * s;
      ctx.strokeStyle = utils.rgb(SKIN_DARK, 0.4);
      ctx.lineWidth = 0.8 * s;
      ctx.beginPath();
      ctx.arc(torsoX, abY, 6 * s, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }

    // ── Arms ──────────────────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const isRight = side === 1;
      const armPhase = act === 'walk' ? phase + (isRight ? Math.PI : 0) : 0;
      const shoulderX = torsoX + side * 11 * s;
      const shoulderY = torsoY - 12 * s;

      let elbowX: number, elbowY: number, handX: number, handY: number;

      if (act === 'attack' && isRight) {
        elbowX = shoulderX + side * 5 * s + attackLunge * 2 * s;
        elbowY = shoulderY + 5 * s - attackLunge * 6 * s;
        handX = elbowX + side * 5 * s + attackLunge * 2 * s;
        handY = elbowY + 4 * s - attackLunge * 6 * s;
      } else {
        elbowX = shoulderX + side * 4 * s + Math.sin(armPhase) * 2 * s;
        elbowY = shoulderY + 9 * s - Math.abs(Math.sin(armPhase)) * 2 * s;
        handX = elbowX + side * 3 * s;
        handY = elbowY + 8 * s + Math.sin(armPhase) * 2 * s;
      }

      utils.drawLimb(ctx, [
        { x: shoulderX, y: shoulderY },
        { x: elbowX, y: elbowY },
        { x: handX, y: handY },
      ], 4.5 * s, SKIN_MID);

      // Clawed elongated fingers (5 thin lines + points)
      ctx.strokeStyle = utils.rgb(SKIN_DARK);
      ctx.lineWidth = 0.8 * s;
      ctx.lineCap = 'round';
      for (let fi = -2; fi <= 2; fi++) {
        const fAngle = (isRight ? 0.2 : -0.2) + fi * 0.18;
        const fLen = (3.5 + Math.abs(fi) * 0.5) * s;
        ctx.beginPath();
        ctx.moveTo(handX + fi * 1.2 * s, handY);
        ctx.lineTo(
          handX + fi * 1.2 * s + Math.cos(fAngle + Math.PI / 2) * fLen * (isRight ? 1 : -1),
          handY + Math.sin(fAngle + Math.PI / 2) * fLen + 1 * s
        );
        ctx.stroke();
      }
    }

    // ── Neck ──────────────────────────────────────────────────────────────────
    const neckX = torsoX;
    const neckY = torsoY - 22 * s;
    ctx.fillStyle = utils.rgb(SKIN_MID);
    utils.fillEllipse(ctx, neckX, neckY, 5.5 * s, 5 * s);

    // ── Head ──────────────────────────────────────────────────────────────────
    const headCX = torsoX;
    const headCY = torsoY - 32 * s;

    const headGrad = ctx.createRadialGradient(headCX - 3 * s, headCY - 4 * s, 0, headCX, headCY, 10 * s);
    headGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    headGrad.addColorStop(0.5, utils.rgb(SKIN_MID));
    headGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = headGrad;
    utils.fillEllipse(ctx, headCX, headCY, 9 * s, 10 * s);

    // ── Goat-like curved horns ────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const hornBaseX = headCX + side * 6 * s;
      const hornBaseY = headCY - 8 * s;
      ctx.strokeStyle = utils.rgb(HORN_COLOR);
      ctx.lineWidth = 3.5 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(
        hornBaseX + side * 4 * s,
        hornBaseY - 2 * s,
        7 * s,
        side === -1 ? Math.PI * 0.3 : Math.PI * 0.7,
        side === -1 ? Math.PI * 1.1 : Math.PI * 1.9 - Math.PI,
        side === 1
      );
      ctx.stroke();
    }

    // ── Eyes ──────────────────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const ex = headCX + side * 3.5 * s;
      const ey = headCY - 2 * s;
      ctx.fillStyle = '#0a0408';
      utils.fillEllipse(ctx, ex, ey, 3 * s, 2.5 * s);
      const eyeGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 2.5 * s);
      eyeGrad.addColorStop(0, '#ff6060');
      eyeGrad.addColorStop(0.4, utils.rgb(EYE_COLOR));
      eyeGrad.addColorStop(1, '#440000');
      ctx.fillStyle = eyeGrad;
      utils.fillEllipse(ctx, ex, ey, 2.2 * s, 1.8 * s);
      ctx.fillStyle = 'rgba(255,180,180,0.5)';
      utils.fillCircle(ctx, ex - 0.5 * s, ey - 0.5 * s, 0.6 * s);
    }

    // ── Fanged mouth ──────────────────────────────────────────────────────────
    const mouthY = headCY + 4.5 * s;
    ctx.strokeStyle = utils.rgb(SKIN_DARK);
    ctx.lineWidth = 0.9 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(headCX - 5 * s, mouthY);
    ctx.quadraticCurveTo(headCX, mouthY + 2 * s, headCX + 5 * s, mouthY);
    ctx.stroke();

    // Downward fangs
    ctx.fillStyle = '#e8dcc8';
    for (const side of [-1, 0, 1]) {
      const tx = headCX + side * 2.5 * s;
      const fh = (side === 0 ? 2.8 : 2) * s;
      ctx.beginPath();
      ctx.moveTo(tx - 1 * s, mouthY);
      ctx.lineTo(tx, mouthY + fh);
      ctx.lineTo(tx + 1 * s, mouthY);
      ctx.closePath();
      ctx.fill();
    }

    // ── Barbed tail ───────────────────────────────────────────────────────────
    const tailBaseX = torsoX - 5 * s;
    const tailBaseY = baseY - 16 * s + bodyOffsetY;
    const tailWag = Math.sin(phase) * 4 * s;

    ctx.strokeStyle = utils.rgb(SKIN_MID);
    ctx.lineWidth = 3.5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tailBaseX, tailBaseY);
    ctx.quadraticCurveTo(
      tailBaseX - 10 * s + tailWag,
      tailBaseY + 8 * s,
      tailBaseX - 12 * s + tailWag,
      tailBaseY + 2 * s
    );
    ctx.stroke();

    // Barbs on tail
    ctx.fillStyle = utils.rgb(SKIN_DARK);
    for (let bi = 0; bi < 4; bi++) {
      const bFrac = (bi + 1) / 5;
      const bx = tailBaseX - 2 * s + (-10 * s + tailWag) * bFrac;
      const by = tailBaseY + (8 * s) * bFrac * (1 - bFrac) * 2 + 2 * s * bFrac;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx - 2 * s, by - 3 * s);
      ctx.lineTo(bx + 1 * s, by - 1.5 * s);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  },
};
