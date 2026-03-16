// src/graphics/sprites/monsters/Gargoyle.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const STONE_BASE  = 0x343f4a;
const STONE_DARK  = 0x1d2934;
const STONE_LIGHT = 0x4a5561;
const CRACK_GLOW  = 0xff6600;
const WING_COLOR  = 0x29343f;
const HORN_COLOR  = 0x292934;
const MOSS_COLOR  = 0x294a29;

export const GargoyleDrawer: EntityDrawer = {
  key: 'monster_gargoyle',
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
    let wingSpread = 0;
    let crouchDepth = 0;
    let globalRotation = 0;

    switch (act) {
      case 'idle':
        bodyOffsetY = Math.sin(phase) * 1.2 * s;
        wingSpread = 0.2 + Math.abs(Math.sin(phase)) * 0.2;
        crouchDepth = 0.3;
        break;
      case 'walk':
        // Gargoyle lumbers forward crouching
        bodyOffsetX = Math.sin(phase) * 2 * s;
        bodyOffsetY = -Math.abs(Math.sin(phase)) * 1.5 * s;
        wingSpread = 0.15 + Math.abs(Math.sin(phase)) * 0.25;
        crouchDepth = 0.4 + Math.abs(Math.sin(phase)) * 0.1;
        break;
      case 'attack':
        wingSpread = 0.4 + t * 0.6;
        bodyOffsetX = t * 5 * s;
        bodyOffsetY = -t * 3 * s;
        crouchDepth = 0.2;
        break;
      case 'hurt':
        bodyOffsetX = -t * 4 * s;
        crouchDepth = 0.5;
        alpha = 0.75 + t * 0.25;
        break;
      case 'death':
        globalRotation = t * Math.PI * 0.5;
        bodyOffsetY = t * h * 0.35;
        alpha = 1 - t * 0.75;
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
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    utils.fillEllipse(ctx, cx + bodyOffsetX * 0.4, baseY + 1 * s, 14 * s, 3 * s);

    // ── Bat-wing membranes (drawn behind body) ────────────────────────────────
    const wingBaseX = cx + bodyOffsetX;
    const wingBaseY = baseY - 30 * s + bodyOffsetY;

    for (const side of [-1, 1]) {
      const wSpan = (15 + wingSpread * 12) * s;
      const wHeight = (10 + wingSpread * 8) * s;
      const wTipX = wingBaseX + side * wSpan;
      const wTipY = wingBaseY - wHeight;
      const wMidX = wingBaseX + side * wSpan * 0.5;
      const wMidY = wingBaseY - wHeight * 1.4;

      // Membrane fill
      ctx.fillStyle = utils.rgb(WING_COLOR, 0.7);
      ctx.beginPath();
      ctx.moveTo(wingBaseX, wingBaseY);
      ctx.quadraticCurveTo(wMidX, wMidY, wTipX, wTipY);
      ctx.quadraticCurveTo(wTipX + side * 3 * s, wingBaseY - 5 * s, wingBaseX + side * 8 * s, wingBaseY - 2 * s);
      ctx.closePath();
      ctx.fill();

      // Vein lines on membrane
      ctx.strokeStyle = utils.rgb(utils.darken(WING_COLOR, 15), 0.5);
      ctx.lineWidth = 0.6 * s;
      for (let v = 0; v < 3; v++) {
        const vt = (v + 1) / 4;
        ctx.beginPath();
        ctx.moveTo(wingBaseX + side * 4 * s, wingBaseY - 2 * s);
        ctx.quadraticCurveTo(
          wingBaseX + side * wSpan * vt,
          wingBaseY - wHeight * (0.5 + vt * 0.5),
          wTipX - side * (3 - v) * 3 * s,
          wTipY + v * 3 * s
        );
        ctx.stroke();
      }

      // Wing membrane edge highlight
      ctx.strokeStyle = utils.rgb(STONE_LIGHT, 0.25);
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.moveTo(wingBaseX, wingBaseY);
      ctx.quadraticCurveTo(wMidX, wMidY, wTipX, wTipY);
      ctx.stroke();
    }

    // ── Short thick legs (crouching posture) ──────────────────────────────────
    for (const side of [-1, 1]) {
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const crouchOffset = crouchDepth * 5 * s;
      const hipX = cx + side * 6 * s + bodyOffsetX * 0.4;
      const hipY = baseY - 14 * s + bodyOffsetY + crouchOffset;
      const kneeX = hipX + side * 3 * s + Math.sin(legPhase) * 2 * s;
      const kneeY = hipY + 7 * s;
      const footX = hipX + side * 4 * s;
      const footY = baseY - 1 * s;

      utils.drawStoneTexture(ctx, hipX - 2 * s, hipY, 4 * s, 8 * s, STONE_BASE);
      utils.drawLimb(ctx, [
        { x: hipX, y: hipY },
        { x: kneeX, y: kneeY },
        { x: footX, y: footY },
      ], 4.5 * s, STONE_BASE);

      // Clawed foot
      ctx.strokeStyle = utils.rgb(STONE_DARK);
      ctx.lineWidth = 1.2 * s;
      ctx.lineCap = 'round';
      for (let c = -1; c <= 1; c++) {
        ctx.beginPath();
        ctx.moveTo(footX + c * 2 * s, footY);
        ctx.lineTo(footX + c * 3 * s + side * 1 * s, footY + 2.5 * s);
        ctx.stroke();
      }
    }

    // ── Compact torso (crouching) ─────────────────────────────────────────────
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 28 * s + bodyOffsetY + crouchDepth * 5 * s;

    utils.drawStoneTexture(ctx, torsoX - 8 * s, torsoY - 11 * s, 16 * s, 18 * s, STONE_BASE);

    const torsoGrad = ctx.createRadialGradient(torsoX - 2 * s, torsoY - 4 * s, 0, torsoX, torsoY, 10 * s);
    torsoGrad.addColorStop(0, utils.rgb(STONE_LIGHT));
    torsoGrad.addColorStop(0.5, utils.rgb(STONE_BASE));
    torsoGrad.addColorStop(1, utils.rgb(STONE_DARK));
    ctx.fillStyle = torsoGrad;
    utils.fillEllipse(ctx, torsoX, torsoY, 9 * s, 11 * s);

    // Glowing cracks on torso
    ctx.strokeStyle = utils.rgb(CRACK_GLOW, 0.5);
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(torsoX - 4 * s, torsoY - 6 * s);
    ctx.lineTo(torsoX - 1 * s, torsoY);
    ctx.lineTo(torsoX + 3 * s, torsoY + 4 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(torsoX + 3 * s, torsoY - 8 * s);
    ctx.lineTo(torsoX + 5 * s, torsoY - 3 * s);
    ctx.stroke();

    // Moss patches (small green ellipses low alpha)
    ctx.fillStyle = utils.rgb(MOSS_COLOR, 0.3);
    utils.fillEllipse(ctx, torsoX - 5 * s, torsoY + 3 * s, 3.5 * s, 2 * s);
    utils.fillEllipse(ctx, torsoX + 4 * s, torsoY - 1 * s, 2.5 * s, 1.5 * s);

    // ── Arms ─────────────────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const isRight = side === 1;
      const armPhase = act === 'walk' ? phase + (isRight ? Math.PI : 0) : 0;
      const shoulderX = torsoX + side * 9 * s;
      const shoulderY = torsoY - 7 * s;

      let elbowX: number, elbowY: number, handX: number, handY: number;

      if (act === 'attack' && isRight) {
        elbowX = shoulderX + side * 4 * s + t * 3 * s;
        elbowY = shoulderY + 5 * s - t * 5 * s;
        handX = elbowX + side * 4 * s + t * 2 * s;
        handY = elbowY + 4 * s - t * 3 * s;
      } else {
        elbowX = shoulderX + side * 3 * s + Math.sin(armPhase) * 2 * s;
        elbowY = shoulderY + 7 * s - Math.abs(Math.sin(armPhase)) * 2 * s;
        handX = elbowX + side * 2 * s;
        handY = elbowY + 8 * s + Math.sin(armPhase) * 2 * s;
      }

      utils.drawLimb(ctx, [
        { x: shoulderX, y: shoulderY },
        { x: elbowX, y: elbowY },
        { x: handX, y: handY },
      ], 4 * s, STONE_BASE);

      // Stone claws
      ctx.strokeStyle = utils.rgb(STONE_DARK);
      ctx.lineWidth = 1 * s;
      ctx.lineCap = 'round';
      for (let c = -2; c <= 2; c++) {
        const clawAngle = (isRight ? 0.3 : -0.3) + c * 0.2;
        ctx.beginPath();
        ctx.moveTo(handX + c * 1.2 * s, handY);
        ctx.lineTo(
          handX + c * 1.2 * s + Math.cos(clawAngle) * 3 * s,
          handY + Math.sin(clawAngle) * 2.5 * s + 1 * s
        );
        ctx.stroke();
      }
    }

    // ── Head (angular polygon path) ───────────────────────────────────────────
    const headX = torsoX + bodyOffsetX * 0.05;
    const headY = torsoY - 20 * s + bodyOffsetY * 0.1;

    // Neck
    ctx.fillStyle = utils.rgb(STONE_DARK);
    ctx.fillRect(headX - 4 * s, torsoY - 12 * s, 8 * s, 5 * s);

    // Angular head — polygon instead of ellipse
    const headGrad = ctx.createRadialGradient(headX - 2 * s, headY - 3 * s, 0, headX, headY, 10 * s);
    headGrad.addColorStop(0, utils.rgb(STONE_LIGHT));
    headGrad.addColorStop(0.5, utils.rgb(STONE_BASE));
    headGrad.addColorStop(1, utils.rgb(STONE_DARK));
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.moveTo(headX, headY - 9 * s);         // top center
    ctx.lineTo(headX + 9 * s, headY - 3 * s); // top right
    ctx.lineTo(headX + 8 * s, headY + 6 * s); // bottom right
    ctx.lineTo(headX - 8 * s, headY + 6 * s); // bottom left
    ctx.lineTo(headX - 9 * s, headY - 3 * s); // top left
    ctx.closePath();
    ctx.fill();

    // Stone texture overlay on head
    utils.drawStoneTexture(ctx, headX - 9 * s, headY - 9 * s, 18 * s, 16 * s, STONE_BASE);

    // Stone cracks with faint orange glow
    ctx.strokeStyle = utils.rgb(CRACK_GLOW, 0.45);
    ctx.lineWidth = 0.7 * s;
    ctx.beginPath();
    ctx.moveTo(headX - 2 * s, headY - 7 * s);
    ctx.lineTo(headX + 1 * s, headY - 2 * s);
    ctx.lineTo(headX + 4 * s, headY + 2 * s);
    ctx.stroke();

    // Stone eyes — glowing orange
    for (const side of [-1, 1]) {
      const ex = headX + side * 3.5 * s;
      const ey = headY - 1 * s;
      ctx.fillStyle = '#0a1015';
      utils.fillEllipse(ctx, ex, ey, 2.5 * s, 2 * s);
      const eyeGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 2 * s);
      eyeGrad.addColorStop(0, '#ffcc44');
      eyeGrad.addColorStop(0.5, '#ff8800');
      eyeGrad.addColorStop(1, '#662200');
      ctx.fillStyle = eyeGrad;
      utils.fillEllipse(ctx, ex, ey, 1.8 * s, 1.5 * s);
    }

    // Moss on head
    ctx.fillStyle = utils.rgb(MOSS_COLOR, 0.25);
    utils.fillEllipse(ctx, headX - 5 * s, headY - 7 * s, 3 * s, 1.5 * s);

    // Curved horns (thick stroked arcs)
    for (const side of [-1, 1]) {
      const hornBaseX = headX + side * 6 * s;
      const hornBaseY = headY - 8 * s;
      ctx.strokeStyle = utils.rgb(HORN_COLOR);
      ctx.lineWidth = 2.5 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(
        hornBaseX + side * 2 * s,
        hornBaseY - 4 * s,
        5 * s,
        side === -1 ? Math.PI * 0.1 : Math.PI * 0.9,
        side === -1 ? Math.PI * 0.7 : Math.PI * 1.3 + Math.PI,
        side === 1
      );
      ctx.stroke();
    }

    // ── Stone tail (curled) ───────────────────────────────────────────────────
    const tailBaseX = cx + bodyOffsetX - 6 * s;
    const tailBaseY = baseY - 10 * s + bodyOffsetY;

    ctx.strokeStyle = utils.rgb(STONE_BASE);
    ctx.lineWidth = 3 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tailBaseX, tailBaseY);
    ctx.quadraticCurveTo(tailBaseX - 8 * s, tailBaseY + 5 * s, tailBaseX - 10 * s, tailBaseY);
    ctx.quadraticCurveTo(tailBaseX - 12 * s, tailBaseY - 5 * s, tailBaseX - 8 * s, tailBaseY - 8 * s);
    ctx.stroke();

    ctx.restore();
  },
};
