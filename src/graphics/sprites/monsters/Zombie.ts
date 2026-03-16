// src/graphics/sprites/monsters/Zombie.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN        = 0x6a8a5a;
const SKIN_DARK   = 0x4a6a3a;
const SKIN_LIGHT  = 0x8aaa70;
const SKULL_PATCH = 0xc0b898;
const CLOTH_COLOR = 0x4a3a2a;
const CLOTH_TORN  = 0x3a2a1a;

export const ZombieDrawer: EntityDrawer = {
  key: 'monster_zombie',
  frameW: 44,
  frameH: 60,
  totalFrames: 20,

  drawFrame(ctx, frame, action, w, h, utils) {
    const act = action as MonsterAction;
    const s = w / 44;

    const frameCounts: Record<MonsterAction, number> = { idle: 4, walk: 6, attack: 4, hurt: 2, death: 4 };
    const count = frameCounts[act] || 4;
    const localFrame = frame % count;
    const t = count > 1 ? localFrame / (count - 1) : 0;
    const phase = (localFrame / count) * Math.PI * 2;

    let alpha = 1;
    let bodyOffsetX = 0;
    let bodyOffsetY = 0;
    let globalRotation = 0;
    // Zombie leans forward slightly
    const baseForwardLean = 0.12;

    switch (act) {
      case 'idle':
        bodyOffsetY = Math.sin(phase) * 0.7 * s;
        break;
      case 'walk':
        // Stiff asymmetric gait — drag right leg
        bodyOffsetX = Math.sin(phase * 0.7) * 1.2 * s;
        bodyOffsetY = -Math.abs(Math.sin(phase * 0.7)) * 0.8 * s;
        break;
      case 'attack':
        bodyOffsetX = t * 5 * s;
        bodyOffsetY = -t * 1.5 * s;
        break;
      case 'hurt':
        bodyOffsetX = -t * 4 * s;
        alpha = 0.7 + t * 0.3;
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
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    utils.fillEllipse(ctx, cx + bodyOffsetX * 0.4, baseY + 1 * s, 11 * s, 2.5 * s);

    // ── Legs (stiff, asymmetric gait) ────────────────────────────────────────
    for (const side of [-1, 1]) {
      const isLeft = side === -1;
      // Left leg drags; right leg is stiffer
      const legSwing = act === 'walk'
        ? (isLeft ? Math.sin(phase) * 1.5 * s : Math.sin(phase * 0.6) * 0.8 * s)
        : 0;
      const hipX = cx + side * 4.5 * s + bodyOffsetX * 0.3;
      const hipY = baseY - 18 * s + bodyOffsetY;
      const kneeX = hipX + side * 0.5 * s + legSwing;
      const kneeY = hipY + 9 * s;
      const footX = hipX + side * 1 * s + legSwing * 0.5;
      const footY = baseY - 1 * s + (isLeft && act === 'walk' ? Math.abs(Math.sin(phase)) * 1 * s : 0);

      utils.drawLimb(ctx, [
        { x: hipX, y: hipY },
        { x: kneeX, y: kneeY },
        { x: footX, y: footY },
      ], 3 * s, SKIN_DARK);

      // Torn cloth over legs
      ctx.fillStyle = utils.rgb(CLOTH_COLOR, 0.7);
      ctx.fillRect(hipX - 2 * s, hipY, 4 * s, 8 * s);
      // Torn edge
      ctx.fillStyle = utils.rgb(CLOTH_TORN, 0.5);
      ctx.beginPath();
      ctx.moveTo(hipX - 2 * s, hipY + 8 * s);
      ctx.lineTo(hipX - 1 * s, hipY + 10 * s);
      ctx.lineTo(hipX + 0.5 * s, hipY + 8.5 * s);
      ctx.lineTo(hipX + 2 * s, hipY + 10 * s);
      ctx.lineTo(hipX + 2 * s, hipY + 8 * s);
      ctx.closePath();
      ctx.fill();
    }

    // ── Torso ────────────────────────────────────────────────────────────────
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 32 * s + bodyOffsetY;

    // Torn clothing (rects with irregular edges showing skin)
    ctx.fillStyle = utils.rgb(CLOTH_COLOR, 0.85);
    ctx.fillRect(torsoX - 7 * s, torsoY - 10 * s, 14 * s, 16 * s);
    // Gap showing skin
    ctx.fillStyle = utils.rgb(SKIN, 0.7);
    ctx.fillRect(torsoX - 1.5 * s, torsoY - 9 * s, 3 * s, 10 * s);
    // Irregular torn edges
    ctx.fillStyle = utils.rgb(CLOTH_TORN, 0.6);
    for (let i = -3; i <= 3; i++) {
      const tx = torsoX + i * 2 * s;
      const ty = torsoY + 5 * s + utils.hash2d(i * 7, 13) * 3 * s;
      ctx.fillRect(tx - 1 * s, ty, 2 * s, 2 * s);
    }

    // Skin body beneath
    const torsoGrad = ctx.createRadialGradient(torsoX - 2 * s, torsoY - 3 * s, 0, torsoX, torsoY, 8 * s);
    torsoGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    torsoGrad.addColorStop(0.6, utils.rgb(SKIN));
    torsoGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = torsoGrad;
    ctx.globalAlpha = alpha * 0.5;
    utils.fillEllipse(ctx, torsoX, torsoY, 7.5 * s, 10 * s);
    ctx.globalAlpha = alpha;

    // ── Arms ─────────────────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const isRight = side === 1;
      const armPhase = act === 'walk' ? phase + (isRight ? Math.PI : 0) : 0;
      const shoulderX = torsoX + side * 7 * s;
      const shoulderY = torsoY - 7 * s;

      let elbowX: number, elbowY: number, handX: number, handY: number;

      if (isRight && (act === 'attack' || act === 'idle' || act === 'walk')) {
        // Right arm outstretched forward
        const stretch = act === 'attack' ? t : 0.5 + Math.sin(phase) * 0.2;
        elbowX = shoulderX + side * 3 * s + stretch * 2 * s;
        elbowY = shoulderY + 4 * s - stretch * 3 * s;
        handX = elbowX + side * 4 * s + stretch * 3 * s;
        handY = elbowY + 3 * s - stretch * 2 * s;
      } else {
        elbowX = shoulderX + side * 2 * s + Math.sin(armPhase) * 1.5 * s;
        elbowY = shoulderY + 6 * s;
        handX = elbowX + side * 1.5 * s;
        handY = elbowY + 7 * s + Math.sin(armPhase) * 2 * s;
      }

      utils.drawLimb(ctx, [
        { x: shoulderX, y: shoulderY },
        { x: elbowX, y: elbowY },
        { x: handX, y: handY },
      ], 3 * s, SKIN);

      // Torn sleeve
      ctx.fillStyle = utils.rgb(CLOTH_COLOR, 0.6);
      ctx.fillRect(shoulderX - 2 * s, shoulderY, 4 * s, 6 * s);
    }

    // ── Head (lopsided) ───────────────────────────────────────────────────────
    const headX = torsoX + bodyOffsetX * 0.05 + 1 * s; // slight lean
    const headY = torsoY - 20 * s + bodyOffsetY * 0.1;

    // Neck
    ctx.fillStyle = utils.rgb(SKIN_DARK);
    ctx.fillRect(headX - 3 * s, torsoY - 13 * s, 6 * s, 5 * s);

    // Lopsided head — ellipse with slight rotation
    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(baseForwardLean + (act === 'walk' ? Math.sin(phase) * 0.05 : 0));

    const headGrad = ctx.createRadialGradient(-1 * s, -2 * s, 0, 0, 0, 9 * s);
    headGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    headGrad.addColorStop(0.6, utils.rgb(SKIN));
    headGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = headGrad;
    // Lopsided — wider on left side
    ctx.beginPath();
    ctx.ellipse(0, 0, 8.5 * s, 8 * s, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Exposed skull patch (lighter arc near top-right)
    ctx.fillStyle = utils.rgb(SKULL_PATCH, 0.6);
    ctx.beginPath();
    ctx.arc(3 * s, -4 * s, 4 * s, Math.PI * 1.2, Math.PI * 1.9);
    ctx.fill();

    // Sunken glowing green eyes of uneven sizes
    const eyeData = [
      { ox: -3.5 * s, oy: 0, rx: 1.8 * s, ry: 2 * s },   // left eye — slightly larger
      { ox: 3 * s,    oy: 0.5 * s, rx: 1.3 * s, ry: 1.4 * s }, // right eye — smaller
    ];
    for (const e of eyeData) {
      ctx.fillStyle = '#0a1a00';
      utils.fillEllipse(ctx, e.ox, e.oy, e.rx + 0.5 * s, e.ry + 0.5 * s);
      // Glowing green
      const eyeGrad = ctx.createRadialGradient(e.ox, e.oy, 0, e.ox, e.oy, e.rx);
      eyeGrad.addColorStop(0, '#aaffaa');
      eyeGrad.addColorStop(0.5, '#44cc44');
      eyeGrad.addColorStop(1, '#007700');
      ctx.fillStyle = eyeGrad;
      utils.fillEllipse(ctx, e.ox, e.oy, e.rx, e.ry);
    }

    // Mouth — slack open jaw
    ctx.strokeStyle = '#1a0a00';
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(-3.5 * s, 4 * s);
    ctx.quadraticCurveTo(0, 6 * s, 3.5 * s, 4.5 * s);
    ctx.stroke();
    ctx.fillStyle = '#0a0800';
    ctx.beginPath();
    ctx.ellipse(0, 5 * s, 2.5 * s, 1.5 * s, 0, 0, Math.PI);
    ctx.fill();

    ctx.restore(); // head rotation

    ctx.restore(); // global
  },
};
