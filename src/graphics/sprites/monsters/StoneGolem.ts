// src/graphics/sprites/monsters/StoneGolem.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const STONE_BASE  = 0x4a4a4a;
const STONE_DARK  = 0x2a2a2a;
const STONE_LIGHT = 0x6a6a6a;
const EMBER_COLOR = 0xff8800;

export const StoneGolemDrawer: EntityDrawer = {
  key: 'monster_stone_golem',
  frameW: 60,
  frameH: 68,
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
    let globalRotation = 0;
    // Segments float (appear to hover with orange-glow gap)
    const segGap = 1.5 * s + Math.sin(phase) * 0.5 * s;

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
        alpha = 0.75 + t * 0.25;
        break;
      case 'death':
        globalRotation = t * Math.PI * 0.45;
        bodyOffsetY = t * h * 0.35;
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
    utils.fillEllipse(ctx, cx + bodyOffsetX * 0.4, baseY + 1 * s, 18 * s, 4 * s);

    // ── Pillar legs (rectangles with stone texture) ───────────────────────────
    for (const side of [-1, 1]) {
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const stepLift = act === 'walk' ? Math.max(0, Math.sin(legPhase)) * 4 * s : 0;
      const legX = cx + side * 8 * s + bodyOffsetX * 0.4;
      const legTopY = baseY - 20 * s + bodyOffsetY;
      const legBotY = baseY - 1 * s - stepLift;
      const legW = 7 * s;

      utils.drawStoneTexture(ctx, legX - legW / 2, legTopY, legW, legBotY - legTopY, STONE_BASE);

      // Orange glow in gap between leg and body (floating effect)
      ctx.fillStyle = utils.rgb(EMBER_COLOR, 0.3);
      ctx.fillRect(legX - legW / 2 - 0.5, legTopY - segGap, legW + 1, segGap * 1.5);

      // Foot boulder
      ctx.fillStyle = utils.rgb(STONE_DARK);
      utils.fillEllipse(ctx, legX, legBotY + 1 * s, legW * 0.7, 3 * s);
      utils.drawStoneTexture(ctx, legX - legW * 0.6, legBotY - 2 * s, legW * 1.2, 4 * s, STONE_BASE);
    }

    // ── Lower torso boulder segment ───────────────────────────────────────────
    const lowerTorsoX = cx + bodyOffsetX;
    const lowerTorsoY = baseY - 28 * s + bodyOffsetY;

    utils.drawStoneTexture(ctx, lowerTorsoX - 10 * s, lowerTorsoY - 9 * s, 20 * s, 15 * s, STONE_BASE);
    ctx.beginPath();
    ctx.moveTo(lowerTorsoX - 11 * s, lowerTorsoY - 6 * s);
    ctx.lineTo(lowerTorsoX + 11 * s, lowerTorsoY - 6 * s);
    ctx.lineTo(lowerTorsoX + 10 * s, lowerTorsoY + 6 * s);
    ctx.lineTo(lowerTorsoX - 10 * s, lowerTorsoY + 6 * s);
    ctx.closePath();
    const lowerGrad = ctx.createLinearGradient(lowerTorsoX, lowerTorsoY - 6 * s, lowerTorsoX, lowerTorsoY + 6 * s);
    lowerGrad.addColorStop(0, utils.rgb(STONE_LIGHT));
    lowerGrad.addColorStop(1, utils.rgb(STONE_DARK));
    ctx.fillStyle = lowerGrad;
    ctx.fill();

    // ── Upper torso boulder segment (floating gap) ────────────────────────────
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 44 * s + bodyOffsetY;

    // Floating gap glow between segments
    ctx.fillStyle = utils.rgb(EMBER_COLOR, 0.4);
    ctx.fillRect(torsoX - 9 * s, lowerTorsoY - 9 * s, 18 * s, segGap * 2);

    // Upper torso polygon
    ctx.beginPath();
    ctx.moveTo(torsoX - 10 * s, torsoY - 4 * s);
    ctx.lineTo(torsoX, torsoY - 9 * s);
    ctx.lineTo(torsoX + 10 * s, torsoY - 4 * s);
    ctx.lineTo(torsoX + 12 * s, torsoY + 6 * s);
    ctx.lineTo(torsoX - 12 * s, torsoY + 6 * s);
    ctx.closePath();
    const torsoGrad = ctx.createLinearGradient(torsoX, torsoY - 9 * s, torsoX, torsoY + 6 * s);
    torsoGrad.addColorStop(0, utils.rgb(STONE_LIGHT));
    torsoGrad.addColorStop(0.5, utils.rgb(STONE_BASE));
    torsoGrad.addColorStop(1, utils.rgb(STONE_DARK));
    ctx.fillStyle = torsoGrad;
    ctx.fill();
    utils.drawStoneTexture(ctx, torsoX - 12 * s, torsoY - 9 * s, 24 * s, 16 * s, STONE_BASE);

    // Glowing orange cracks between segments
    ctx.strokeStyle = utils.rgb(EMBER_COLOR, 0.5);
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(torsoX - 7 * s, torsoY - 2 * s);
    ctx.lineTo(torsoX - 3 * s, torsoY + 3 * s);
    ctx.lineTo(torsoX + 4 * s, torsoY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(torsoX + 5 * s, torsoY - 5 * s);
    ctx.lineTo(torsoX + 8 * s, torsoY);
    ctx.stroke();

    // ── Massive asymmetric fists ──────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const isRight = side === 1;
      const armPhase = act === 'walk' ? phase + (isRight ? Math.PI : 0) : 0;
      const shoulderX = torsoX + side * 12 * s;
      const shoulderY = torsoY - 2 * s;

      let elbowX: number, elbowY: number, handX: number, handY: number;

      if (isRight && act === 'attack') {
        elbowX = shoulderX + side * 6 * s + attackLunge * 5 * s;
        elbowY = shoulderY + 8 * s - attackLunge * 5 * s;
        handX = elbowX + side * 5 * s + attackLunge * 4 * s;
        handY = elbowY + 5 * s - attackLunge * 3 * s;
      } else {
        elbowX = shoulderX + side * 4 * s + Math.sin(armPhase) * 3 * s;
        elbowY = shoulderY + 10 * s;
        handX = elbowX + side * 2 * s;
        handY = elbowY + 8 * s + Math.sin(armPhase) * 3 * s;
      }

      utils.drawLimb(ctx, [
        { x: shoulderX, y: shoulderY },
        { x: elbowX, y: elbowY },
        { x: handX, y: handY },
      ], 6.5 * s, STONE_BASE);

      // Fist boulder (right fist is larger — asymmetric)
      const fistSize = isRight ? 7 * s : 6 * s;
      utils.drawStoneTexture(ctx, handX - fistSize, handY - fistSize * 0.7, fistSize * 2, fistSize * 1.4, STONE_BASE);
      const fistGrad = ctx.createRadialGradient(handX - fistSize * 0.3, handY - fistSize * 0.3, 0, handX, handY, fistSize);
      fistGrad.addColorStop(0, utils.rgb(STONE_LIGHT));
      fistGrad.addColorStop(1, utils.rgb(STONE_DARK));
      ctx.fillStyle = fistGrad;
      ctx.beginPath();
      ctx.ellipse(handX, handY, fistSize, fistSize * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      // Floating gap glow at shoulder
      ctx.fillStyle = utils.rgb(EMBER_COLOR, 0.3);
      ctx.fillRect(shoulderX - 4 * s, shoulderY - segGap * 1.5, 8 * s, segGap * 2);
    }

    // ── Small boulder head ────────────────────────────────────────────────────
    const headX = torsoX + bodyOffsetX * 0.05;
    const headY = torsoY - 18 * s + bodyOffsetY * 0.1;

    // Floating gap glow between head and torso
    ctx.fillStyle = utils.rgb(EMBER_COLOR, 0.4);
    ctx.fillRect(headX - 6 * s, torsoY - 11 * s, 12 * s, segGap * 2.5);

    // Head polygon
    ctx.beginPath();
    ctx.moveTo(headX, headY - 7 * s);
    ctx.lineTo(headX + 7 * s, headY - 2 * s);
    ctx.lineTo(headX + 6 * s, headY + 5 * s);
    ctx.lineTo(headX - 6 * s, headY + 5 * s);
    ctx.lineTo(headX - 7 * s, headY - 2 * s);
    ctx.closePath();
    const headGrad = ctx.createRadialGradient(headX - 2 * s, headY - 2 * s, 0, headX, headY, 8 * s);
    headGrad.addColorStop(0, utils.rgb(STONE_LIGHT));
    headGrad.addColorStop(0.6, utils.rgb(STONE_BASE));
    headGrad.addColorStop(1, utils.rgb(STONE_DARK));
    ctx.fillStyle = headGrad;
    ctx.fill();
    utils.drawStoneTexture(ctx, headX - 7 * s, headY - 7 * s, 14 * s, 13 * s, STONE_BASE);

    // Ember eyes (radial gradient)
    for (const side of [-1, 1]) {
      const ex = headX + side * 2.8 * s;
      const ey = headY;
      ctx.fillStyle = '#0a0800';
      utils.fillEllipse(ctx, ex, ey, 2.5 * s, 2.2 * s);
      const emberGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 2.2 * s);
      emberGrad.addColorStop(0, '#ffffff');
      emberGrad.addColorStop(0.3, '#ffcc44');
      emberGrad.addColorStop(0.7, utils.rgb(EMBER_COLOR));
      emberGrad.addColorStop(1, '#662200');
      ctx.fillStyle = emberGrad;
      utils.fillEllipse(ctx, ex, ey, 2 * s, 1.8 * s);
      // Eye glow
      ctx.fillStyle = utils.rgb(EMBER_COLOR, 0.2);
      utils.fillCircle(ctx, ex, ey, 4 * s);
    }

    // Head crack with glow
    ctx.strokeStyle = utils.rgb(EMBER_COLOR, 0.4);
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(headX + 3 * s, headY - 5 * s);
    ctx.lineTo(headX + 5 * s, headY + 2 * s);
    ctx.stroke();

    ctx.restore();
  },
};
