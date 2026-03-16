// src/graphics/sprites/monsters/WerewolfAlpha.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

// Darker fur than base Werewolf (0x2a1808 instead of 0x2a1808/0x6a4a30)
const FUR_DARK   = 0x120903;
const FUR_MID    = 0x1d100b;
const FUR_LIGHT  = 0x342116;
const CLAW_COLOR = 0xf0ece0;
const SCAR_COLOR = 0x4a1d12;

export const WerewolfAlphaDrawer: EntityDrawer = {
  key: 'monster_werewolf_alpha',
  frameW: 56,
  frameH: 68,
  totalFrames: 20,

  drawFrame(ctx, frame, action, w, h, utils) {
    const act = action as MonsterAction;
    const s = w / 56; // ~20% larger than base Werewolf (52 -> 56)

    const frameCounts: Record<MonsterAction, number> = { idle: 4, walk: 6, attack: 4, hurt: 2, death: 4 };
    const count = frameCounts[act] || 4;
    const localFrame = frame % count;
    const t = count > 1 ? localFrame / (count - 1) : 0;
    const phase = (localFrame / count) * Math.PI * 2;

    let alpha = 1;
    let globalRotation = 0;
    let squishY = 1, squishX = 1;
    let bodyOffsetX = 0, bodyOffsetY = 0;
    let lungeFwd = 0;
    let earTwitch = 0;

    switch (act) {
      case 'idle':
        squishY = 1 + Math.sin(phase) * 0.025;
        squishX = 1 - Math.sin(phase) * 0.01;
        earTwitch = Math.sin(phase * 2) * 0.12;
        break;
      case 'walk':
        squishY = 1 + Math.sin(phase) * 0.03;
        bodyOffsetY = Math.abs(Math.sin(phase)) * -1.8 * s;
        bodyOffsetX = Math.sin(phase) * 1.8 * s;
        break;
      case 'attack':
        lungeFwd = t;
        bodyOffsetX = t * 8 * s;
        bodyOffsetY = -t * 4 * s;
        break;
      case 'hurt':
        bodyOffsetX = -t * 6 * s;
        alpha = 0.75 + t * 0.25;
        break;
      case 'death':
        globalRotation = t * Math.PI * 0.5;
        bodyOffsetY = t * h * 0.3;
        alpha = 1 - t * 0.7;
        break;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = w / 2;
    const baseY = h * 0.96;

    ctx.translate(cx, baseY);
    ctx.rotate(globalRotation);
    ctx.translate(-cx, -baseY);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    utils.fillEllipse(ctx, cx + bodyOffsetX * 0.5, baseY + 1 * s, 18 * s, 4 * s);

    // ── Digitigrade legs (heavier than base) ──────────────────────────────────
    for (const side of [-1, 1]) {
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const hipX = cx + side * 8 * s + bodyOffsetX * 0.3;
      const hipY = baseY - 28 * s + bodyOffsetY;
      const kneeX = hipX + side * 1.5 * s - Math.sin(legPhase) * 3.5 * s;
      const kneeY = hipY + 13 * s + Math.abs(Math.sin(legPhase)) * 2 * s;
      const ankleX = kneeX + side * 3.5 * s + Math.sin(legPhase) * 2.5 * s;
      const ankleY = kneeY + 9 * s - Math.abs(Math.sin(legPhase)) * 3 * s;
      const pawX = ankleX + side * 2.5 * s;
      const pawY = baseY - 2 * s;

      utils.drawLimb(ctx, [
        { x: hipX, y: hipY },
        { x: kneeX, y: kneeY },
        { x: ankleX, y: ankleY },
        { x: pawX, y: pawY },
      ], 5 * s, FUR_MID);

      // Claws on paw
      ctx.strokeStyle = utils.rgb(CLAW_COLOR);
      ctx.lineWidth = 0.9 * s;
      ctx.lineCap = 'round';
      for (let c = -1; c <= 1; c++) {
        ctx.beginPath();
        ctx.moveTo(pawX + c * 1.8 * s, pawY);
        ctx.lineTo(pawX + c * 2.6 * s + side * 1.2 * s, pawY + 3 * s);
        ctx.stroke();
      }
    }

    // ── Torso (wider — heavier musculature) ──────────────────────────────────
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 44 * s + bodyOffsetY;
    const torsoW = 17 * s * squishX;
    const torsoH = 19 * s * squishY;

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
    ctx.fillStyle = utils.rgb(utils.lighten(FUR_MID, 15), 0.4);
    utils.fillEllipse(ctx, torsoX, torsoY + 5 * s, torsoW * 0.42, torsoH * 0.5);

    // Fur texture
    utils.drawFurTexture(ctx, torsoX - torsoW, torsoY - torsoH, torsoW * 2, torsoH * 2, FUR_MID, Math.PI * 0.15);

    // Battle scars on torso
    ctx.strokeStyle = utils.rgb(SCAR_COLOR, 0.7);
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.moveTo(torsoX - 5 * s, torsoY - 8 * s);
    ctx.lineTo(torsoX + 3 * s, torsoY + 2 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(torsoX + 2 * s, torsoY - 12 * s);
    ctx.lineTo(torsoX + 7 * s, torsoY - 5 * s);
    ctx.stroke();
    // Darken scar regions
    ctx.strokeStyle = utils.rgb(utils.darken(FUR_MID, 30), 0.5);
    ctx.lineWidth = 0.6 * s;
    ctx.beginPath();
    ctx.moveTo(torsoX - 5 * s, torsoY - 8 * s);
    ctx.lineTo(torsoX + 3 * s, torsoY + 2 * s);
    ctx.stroke();

    // ── Arms (thick, powerful) ───────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const isRight = side === 1;
      const armPhase = act === 'walk' ? phase + (isRight ? Math.PI : 0) : 0;
      const shoulderX = torsoX + side * 13 * s;
      const shoulderY = torsoY - 7 * s;

      let elbowX: number, elbowY: number, handX: number, handY: number;

      if (isRight && act === 'attack') {
        const swingT = lungeFwd;
        elbowX = shoulderX + side * 6 * s + swingT * 5 * s;
        elbowY = shoulderY + 6 * s - swingT * 5 * s;
        handX = elbowX + side * 6 * s + swingT * 4 * s;
        handY = elbowY + 5 * s - swingT * 4 * s;
      } else {
        elbowX = shoulderX + side * 4 * s + Math.sin(armPhase) * 2.5 * s;
        elbowY = shoulderY + 10 * s - Math.abs(Math.sin(armPhase)) * 2.5 * s;
        handX = elbowX + side * 2.5 * s - Math.sin(armPhase) * 2 * s;
        handY = elbowY + 9 * s + Math.sin(armPhase) * 2 * s;
      }

      utils.drawLimb(ctx, [
        { x: shoulderX, y: shoulderY },
        { x: elbowX, y: elbowY },
        { x: handX, y: handY },
      ], 6 * s, FUR_MID);

      // Claws
      ctx.strokeStyle = utils.rgb(CLAW_COLOR);
      ctx.lineWidth = 1.2 * s;
      ctx.lineCap = 'round';
      for (let c = -2; c <= 2; c++) {
        const baseAngle = isRight ? 0.4 : -0.4;
        const clawAngle = baseAngle + c * 0.25 + (isRight && act === 'attack' ? -0.5 : 0);
        ctx.beginPath();
        ctx.moveTo(handX + c * 1.4 * s, handY);
        ctx.lineTo(
          handX + c * 1.4 * s + Math.cos(clawAngle) * 3.5 * s,
          handY + Math.sin(clawAngle) * 3 * s + 1.2 * s
        );
        ctx.stroke();
      }
    }

    // ── Head (more upright posture than base) ────────────────────────────────
    const headX = torsoX + bodyOffsetX * 0.08;
    const headY = torsoY - 21 * s + bodyOffsetY * 0.15;

    // Neck
    ctx.fillStyle = utils.rgb(FUR_MID);
    ctx.beginPath();
    ctx.moveTo(torsoX - 6 * s, torsoY - 9 * s);
    ctx.lineTo(torsoX + 6 * s, torsoY - 9 * s);
    ctx.lineTo(headX + 5 * s, headY + 5 * s);
    ctx.lineTo(headX - 5 * s, headY + 5 * s);
    ctx.closePath();
    ctx.fill();

    // Skull base
    const headGrad = ctx.createRadialGradient(headX - 2 * s, headY - 3 * s, 0, headX, headY, 11 * s);
    headGrad.addColorStop(0, utils.rgb(FUR_LIGHT));
    headGrad.addColorStop(1, utils.rgb(FUR_DARK));
    ctx.fillStyle = headGrad;
    utils.fillEllipse(ctx, headX, headY, 10 * s, 9 * s);

    // Muzzle
    ctx.fillStyle = utils.rgb(FUR_MID);
    utils.fillEllipse(ctx, headX + 6 * s, headY + 2 * s, 6 * s, 4 * s);
    ctx.fillStyle = utils.rgb(utils.darken(FUR_MID, 10));
    utils.fillEllipse(ctx, headX + 7 * s, headY + 3.5 * s, 4 * s, 2.8 * s);

    // Nose
    ctx.fillStyle = '#100600';
    utils.fillEllipse(ctx, headX + 9 * s, headY + 1.5 * s, 2.2 * s, 1.5 * s);

    // Fangs
    ctx.fillStyle = '#f0e8d0';
    ctx.beginPath();
    ctx.moveTo(headX + 5 * s, headY + 4 * s);
    ctx.lineTo(headX + 4 * s, headY + 7.5 * s);
    ctx.lineTo(headX + 6.5 * s, headY + 6.5 * s);
    ctx.lineTo(headX + 8 * s, headY + 7.5 * s);
    ctx.lineTo(headX + 9.5 * s, headY + 4.5 * s);
    ctx.fill();

    // Glowing red eyes
    for (const side of [-1, 1]) {
      const ex = headX + side * 3.5 * s - 1.5 * s;
      const ey = headY - 1 * s;
      ctx.fillStyle = '#ff4400';
      ctx.beginPath();
      ctx.moveTo(ex, ey - 2.5 * s);
      ctx.lineTo(ex + 1.8 * s, ey);
      ctx.lineTo(ex, ey + 2.5 * s);
      ctx.lineTo(ex - 1.8 * s, ey);
      ctx.closePath();
      ctx.fill();
      // Glow halo
      const glowGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 4 * s);
      glowGrad.addColorStop(0, 'rgba(255,68,0,0.4)');
      glowGrad.addColorStop(1, 'rgba(255,68,0,0)');
      ctx.fillStyle = glowGrad;
      utils.fillCircle(ctx, ex, ey, 4 * s);
      // Slit pupil
      ctx.fillStyle = '#150000';
      utils.fillEllipse(ctx, ex, ey, 0.5 * s, 1.8 * s);
    }

    // Ears — larger, more jagged tips
    for (const side of [-1, 1]) {
      const earBaseX = headX + side * 7 * s;
      const earBaseY = headY - 6 * s;
      const earTipX = earBaseX + side * 4 * s;
      const earTipY = earBaseY - 11 * s + earTwitch * side * 3.5 * s;
      ctx.fillStyle = utils.rgb(FUR_MID);
      ctx.beginPath();
      ctx.moveTo(earBaseX - side * 2.5 * s, earBaseY);
      ctx.lineTo(earTipX, earTipY);
      ctx.lineTo(earBaseX + side * 2.5 * s, earBaseY - 2.5 * s);
      ctx.closePath();
      ctx.fill();
      // Pink inner
      ctx.fillStyle = 'rgba(200,100,110,0.5)';
      ctx.beginPath();
      ctx.moveTo(earBaseX - side * 0.8 * s, earBaseY - 1 * s);
      ctx.lineTo(earTipX, earTipY + 3 * s);
      ctx.lineTo(earBaseX + side * 0.8 * s, earBaseY - 2.5 * s);
      ctx.closePath();
      ctx.fill();
    }

    // Head scars
    ctx.strokeStyle = utils.rgb(SCAR_COLOR, 0.6);
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(headX - 3 * s, headY - 5 * s);
    ctx.lineTo(headX + 2 * s, headY - 1 * s);
    ctx.stroke();

    // Fur texture on head
    utils.drawFurTexture(ctx, headX - 12 * s, headY - 14 * s, 24 * s, 24 * s, FUR_MID, Math.PI * 0.5);

    ctx.restore();
  },
};
