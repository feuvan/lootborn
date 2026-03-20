// src/graphics/sprites/monsters/Werewolf.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const FUR_DARK  = 0x1d1006;
const FUR_MID   = 0x4a3321;
const FUR_LIGHT = 0x61482c;
const CLAW_COLOR = 0xf0ece0;

export const WerewolfDrawer: EntityDrawer = {
  key: 'monster_werewolf',
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
    let globalRotation = 0;

    ctx.save();

    const cx = w / 2;
    const baseY = h * 0.96;

    // Per-action modifiers
    let squishY = 1, squishX = 1;
    let bodyOffsetX = 0, bodyOffsetY = 0;
    let lungeFwd = 0;
    let recoil = 0;
    let earTwitch = 0;

    switch (act) {
      case 'idle':
        squishY = 1 + Math.sin(phase) * 0.03;
        squishX = 1 - Math.sin(phase) * 0.015;
        earTwitch = Math.sin(phase * 2) * 0.15;
        break;
      case 'walk':
        squishY = 1 + Math.sin(phase) * 0.04;
        bodyOffsetY = Math.abs(Math.sin(phase)) * -1.5 * s;
        bodyOffsetX = Math.sin(phase) * 1.5 * s;
        break;
      case 'attack':
        lungeFwd = t;
        bodyOffsetX = t * 6 * s;
        bodyOffsetY = -t * 3 * s;
        break;
      case 'hurt':
        recoil = t;
        bodyOffsetX = -t * 5 * s;
        alpha = 0.75 + t * 0.25;
        break;
      case 'death':
        globalRotation = t * Math.PI * 0.5;
        bodyOffsetY = t * h * 0.3;
        alpha = 1 - t * 0.7;
        break;
    }

    ctx.globalAlpha = alpha;
    ctx.translate(cx, baseY);
    ctx.rotate(globalRotation);
    ctx.translate(-cx, -baseY);

    // ── Shadow ──────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    utils.fillEllipse(ctx, cx + bodyOffsetX * 0.5, baseY + 1 * s, 16 * s, 3.5 * s);

    // ── Digitigrade legs ─────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const hipX = cx + side * 7 * s + bodyOffsetX * 0.3;
      const hipY = baseY - 26 * s + bodyOffsetY;
      // Digitigrade: hip -> backward knee -> ankle -> paw
      const kneeX = hipX + side * 1 * s - Math.sin(legPhase) * 3 * s;
      const kneeY = hipY + 12 * s + Math.abs(Math.sin(legPhase)) * 2 * s;
      // backward knee — angles backward
      const ankleX = kneeX + side * 3 * s + Math.sin(legPhase) * 2 * s;
      const ankleY = kneeY + 8 * s - Math.abs(Math.sin(legPhase)) * 3 * s;
      const pawX = ankleX + side * 2 * s;
      const pawY = baseY - 2 * s;

      utils.drawLimb(ctx, [
        { x: hipX, y: hipY },
        { x: kneeX, y: kneeY },
        { x: ankleX, y: ankleY },
        { x: pawX, y: pawY },
      ], 4 * s, FUR_MID);

      // Claws on paw
      ctx.strokeStyle = utils.rgb(CLAW_COLOR);
      ctx.lineWidth = 0.8 * s;
      ctx.lineCap = 'round';
      for (let c = -1; c <= 1; c++) {
        ctx.beginPath();
        ctx.moveTo(pawX + c * 1.5 * s, pawY);
        ctx.lineTo(pawX + c * 2.2 * s + side * 1 * s, pawY + 2.5 * s);
        ctx.stroke();
      }
    }

    // ── Torso ────────────────────────────────────────────────────────────────
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 40 * s + bodyOffsetY;
    const torsoW = 14 * s * squishX;
    const torsoH = 16 * s * squishY;

    // Soft outline glow (brown — beast)
    utils.softOutline(ctx, 'rgba(120,80,40,0.2)', 5);

    const torsoGrad = ctx.createRadialGradient(
      torsoX - 3 * s, torsoY - 4 * s, 0,
      torsoX, torsoY, torsoW * 1.1
    );
    torsoGrad.addColorStop(0, utils.rgb(FUR_LIGHT));
    torsoGrad.addColorStop(0.5, utils.rgb(FUR_MID));
    torsoGrad.addColorStop(1, utils.rgb(FUR_DARK));
    ctx.fillStyle = torsoGrad;
    utils.fillEllipse(ctx, torsoX, torsoY, torsoW, torsoH);

    // Lighter belly
    ctx.fillStyle = utils.rgb(utils.lighten(FUR_MID, 20), 0.5);
    utils.fillEllipse(ctx, torsoX, torsoY + 4 * s, torsoW * 0.45, torsoH * 0.55);

    // Fur texture overlay
    utils.drawFurTexture(ctx,
      torsoX - torsoW, torsoY - torsoH,
      torsoW * 2, torsoH * 2,
      FUR_MID,
      Math.PI * 0.15
    );

    // End soft outline
    utils.softOutlineEnd(ctx);

    // Rim light on torso
    utils.rimLight(ctx, torsoX, torsoY, torsoW, torsoH, 'rgba(100,70,30,0.1)');

    // ── Arms ────────────────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const isRight = side === 1;
      const armPhase = act === 'walk' ? phase + (isRight ? Math.PI : 0) : 0;
      const shoulderX = torsoX + side * 11 * s;
      const shoulderY = torsoY - 6 * s;

      let elbowX: number, elbowY: number, handX: number, handY: number;

      if (isRight && act === 'attack') {
        // Lunge: claw extended forward
        const swingT = lungeFwd;
        elbowX = shoulderX + side * 5 * s + swingT * 4 * s;
        elbowY = shoulderY + 5 * s - swingT * 4 * s;
        handX = elbowX + side * 5 * s + swingT * 3 * s;
        handY = elbowY + 4 * s - swingT * 3 * s;
      } else {
        elbowX = shoulderX + side * 3 * s + Math.sin(armPhase) * 2 * s;
        elbowY = shoulderY + 9 * s - Math.abs(Math.sin(armPhase)) * 2 * s;
        handX = elbowX + side * 2 * s - Math.sin(armPhase) * 1.5 * s;
        handY = elbowY + 8 * s + Math.sin(armPhase) * 1.5 * s;
      }

      utils.drawLimb(ctx, [
        { x: shoulderX, y: shoulderY },
        { x: elbowX, y: elbowY },
        { x: handX, y: handY },
      ], 5 * s, FUR_MID);

      // Claws
      ctx.strokeStyle = utils.rgb(CLAW_COLOR);
      ctx.lineWidth = 1 * s;
      ctx.lineCap = 'round';
      for (let c = -2; c <= 2; c++) {
        const baseAngle = isRight ? 0.4 : -0.4;
        const clawAngle = baseAngle + c * 0.25 + (isRight && act === 'attack' ? -0.5 : 0);
        ctx.beginPath();
        ctx.moveTo(handX + c * 1.2 * s, handY);
        ctx.lineTo(
          handX + c * 1.2 * s + Math.cos(clawAngle) * 3 * s,
          handY + Math.sin(clawAngle) * 2.5 * s + 1 * s
        );
        ctx.stroke();
      }
    }

    // ── Head ────────────────────────────────────────────────────────────────
    const headX = torsoX + bodyOffsetX * 0.1;
    const headY = torsoY - 18 * s + bodyOffsetY * 0.2;

    // Neck
    ctx.fillStyle = utils.rgb(FUR_MID);
    ctx.beginPath();
    ctx.moveTo(torsoX - 5 * s, torsoY - 8 * s);
    ctx.lineTo(torsoX + 5 * s, torsoY - 8 * s);
    ctx.lineTo(headX + 4 * s, headY + 4 * s);
    ctx.lineTo(headX - 4 * s, headY + 4 * s);
    ctx.closePath();
    ctx.fill();

    // Skull base
    const headGrad = ctx.createRadialGradient(headX - 2 * s, headY - 3 * s, 0, headX, headY, 9 * s);
    headGrad.addColorStop(0, utils.rgb(FUR_LIGHT));
    headGrad.addColorStop(1, utils.rgb(FUR_DARK));
    ctx.fillStyle = headGrad;
    utils.fillEllipse(ctx, headX, headY, 9 * s, 8 * s);

    // Muzzle — two overlapping ellipses for protruding snout
    ctx.fillStyle = utils.rgb(FUR_MID);
    utils.fillEllipse(ctx, headX + 5 * s, headY + 2 * s, 5.5 * s, 3.5 * s);
    ctx.fillStyle = utils.rgb(utils.darken(FUR_MID, 10));
    utils.fillEllipse(ctx, headX + 6 * s, headY + 3.5 * s, 3.5 * s, 2.5 * s);

    // Nose
    ctx.fillStyle = '#1a0a00';
    utils.fillEllipse(ctx, headX + 8 * s, headY + 1.5 * s, 2 * s, 1.4 * s);

    // Snarl / fangs
    ctx.fillStyle = '#f8f0e0';
    ctx.beginPath();
    ctx.moveTo(headX + 5 * s, headY + 3.5 * s);
    ctx.lineTo(headX + 4 * s, headY + 6.5 * s);
    ctx.lineTo(headX + 6 * s, headY + 5.5 * s);
    ctx.lineTo(headX + 7.5 * s, headY + 6.5 * s);
    ctx.lineTo(headX + 8.5 * s, headY + 4 * s);
    ctx.fill();

    // Predatory amber eyes — diamond shape
    for (const side of [-1, 1]) {
      const ex = headX + side * 3 * s - 1 * s;
      const ey = headY - 1 * s;
      // Amber eye
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.moveTo(ex, ey - 2 * s);
      ctx.lineTo(ex + 1.5 * s, ey);
      ctx.lineTo(ex, ey + 2 * s);
      ctx.lineTo(ex - 1.5 * s, ey);
      ctx.closePath();
      ctx.fill();
      // Slit pupil
      ctx.fillStyle = '#150800';
      utils.fillEllipse(ctx, ex, ey, 0.4 * s, 1.5 * s);
      // Reflection
      ctx.fillStyle = 'rgba(255,220,100,0.5)';
      utils.fillCircle(ctx, ex - 0.5 * s, ey - 0.8 * s, 0.4 * s);
    }

    // Ears — pointed with pink inner
    for (const side of [-1, 1]) {
      const earBaseX = headX + side * 6 * s;
      const earBaseY = headY - 5 * s;
      const earTipX = earBaseX + side * 3 * s;
      const earTipY = earBaseY - 9 * s + earTwitch * side * 3 * s;
      ctx.fillStyle = utils.rgb(FUR_MID);
      ctx.beginPath();
      ctx.moveTo(earBaseX - side * 2 * s, earBaseY);
      ctx.lineTo(earTipX, earTipY);
      ctx.lineTo(earBaseX + side * 2 * s, earBaseY - 2 * s);
      ctx.closePath();
      ctx.fill();
      // Pink inner
      ctx.fillStyle = 'rgba(220,120,130,0.6)';
      ctx.beginPath();
      ctx.moveTo(earBaseX - side * 0.5 * s, earBaseY - 1 * s);
      ctx.lineTo(earTipX, earTipY + 2 * s);
      ctx.lineTo(earBaseX + side * 0.5 * s, earBaseY - 2 * s);
      ctx.closePath();
      ctx.fill();
    }

    // Fur texture on head
    utils.drawFurTexture(ctx, headX - 10 * s, headY - 12 * s, 20 * s, 20 * s, FUR_MID, Math.PI * 0.5);

    ctx.restore();
  },
};
