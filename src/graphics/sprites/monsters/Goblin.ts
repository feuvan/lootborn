// src/graphics/sprites/monsters/Goblin.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN        = 0x3f6121;
const SKIN_DARK   = 0x29430b;
const SKIN_LIGHT  = 0x557738;
const LEATHER     = 0x3f2716;
const WOOD_COLOR  = 0x4a3216;
const EYE_COLOR   = 0xcc6600;
const NAIL_COLOR  = 0x616161;

export const GoblinDrawer: EntityDrawer = {
  key: 'monster_goblin',
  frameW: 48,
  frameH: 56,
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
    let attackLunge = 0;
    let globalRotation = 0;

    switch (act) {
      case 'idle':
        bodyOffsetY = Math.sin(phase) * 0.8 * s;
        break;
      case 'walk':
        bodyOffsetX = Math.sin(phase) * 1.5 * s;
        bodyOffsetY = -Math.abs(Math.sin(phase)) * 1.5 * s;
        break;
      case 'attack':
        attackLunge = t;
        bodyOffsetX = t * 5 * s;
        bodyOffsetY = -t * 2 * s;
        break;
      case 'hurt':
        bodyOffsetX = -t * 4 * s;
        alpha = 0.75 + t * 0.25;
        break;
      case 'death':
        globalRotation = t * Math.PI * 0.55;
        bodyOffsetY = t * h * 0.35;
        alpha = 1 - t * 0.8;
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
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    utils.fillEllipse(ctx, cx + bodyOffsetX * 0.4, baseY + 1 * s, 12 * s, 3 * s);

    // ── Legs ────────────────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const hipX = cx + side * 5 * s + bodyOffsetX * 0.4;
      const hipY = baseY - 16 * s + bodyOffsetY;
      const kneeX = hipX + side * 1 * s + Math.sin(legPhase) * 2 * s;
      const kneeY = hipY + 8 * s;
      const footX = hipX + side * 2 * s;
      const footY = baseY - 1 * s;

      utils.drawLimb(ctx, [
        { x: hipX, y: hipY },
        { x: kneeX, y: kneeY },
        { x: footX, y: footY },
      ], 3 * s, SKIN_DARK);

      // Wrapped foot — small ellipse
      ctx.fillStyle = utils.rgb(LEATHER);
      utils.fillEllipse(ctx, footX, footY + 1 * s, 3.5 * s, 2 * s);
      // Cross-hatch wrapping strokes
      ctx.strokeStyle = utils.rgb(utils.darken(LEATHER, 20), 0.5);
      ctx.lineWidth = 0.4 * s;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(footX + i * 1.5 * s, footY);
        ctx.lineTo(footX + i * 1 * s, footY + 2 * s);
        ctx.stroke();
      }
    }

    // ── Torso with leather vest ──────────────────────────────────────────────
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 28 * s + bodyOffsetY;

    utils.drawLeatherTexture(ctx, torsoX - 6 * s, torsoY - 9 * s, 12 * s, 14 * s, LEATHER);

    // Skin showing on sides
    const torsoGrad = ctx.createRadialGradient(torsoX - 2 * s, torsoY - 3 * s, 0, torsoX, torsoY, 8 * s);
    torsoGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    torsoGrad.addColorStop(0.6, utils.rgb(SKIN));
    torsoGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = torsoGrad;
    utils.fillEllipse(ctx, torsoX, torsoY, 7 * s, 9 * s);

    // Re-draw leather vest on top as overlay
    ctx.fillStyle = utils.rgb(LEATHER, 0.7);
    ctx.fillRect(torsoX - 5 * s, torsoY - 8 * s, 10 * s, 12 * s);
    // Vest gap in middle
    ctx.fillStyle = utils.rgb(SKIN, 0.6);
    ctx.fillRect(torsoX - 1.5 * s, torsoY - 8 * s, 3 * s, 12 * s);

    // ── Arms ─────────────────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const isRight = side === 1;
      const armPhase = act === 'walk' ? phase + (isRight ? Math.PI : 0) : 0;
      const shoulderX = torsoX + side * 7 * s;
      const shoulderY = torsoY - 6 * s;

      let elbowX: number, elbowY: number, handX: number, handY: number;

      if (isRight && act === 'attack') {
        elbowX = shoulderX + side * 4 * s + attackLunge * 3 * s;
        elbowY = shoulderY + 5 * s - attackLunge * 3 * s;
        handX = elbowX + side * 4 * s + attackLunge * 2 * s;
        handY = elbowY + 5 * s - attackLunge * 2 * s;
      } else {
        elbowX = shoulderX + side * 2 * s + Math.sin(armPhase) * 1.5 * s;
        elbowY = shoulderY + 6 * s;
        handX = elbowX + side * 1.5 * s + Math.sin(armPhase) * 1 * s;
        handY = elbowY + 6 * s + Math.sin(armPhase) * 1.5 * s;
      }

      utils.drawLimb(ctx, [
        { x: shoulderX, y: shoulderY },
        { x: elbowX, y: elbowY },
        { x: handX, y: handY },
      ], 3.5 * s, SKIN);

    // Club in right hand
      if (isRight) {
        const clubX = handX + side * 2 * s;
        const clubY = handY - 2 * s;
        // Handle
        ctx.fillStyle = utils.rgb(WOOD_COLOR);
        ctx.fillRect(clubX - 1 * s, clubY - 10 * s, 2 * s, 12 * s);
        // Head
        ctx.fillStyle = utils.rgb(utils.darken(WOOD_COLOR, 10));
        ctx.fillRect(clubX - 2.5 * s, clubY - 16 * s, 5 * s, 7 * s);
        // Nails
        ctx.fillStyle = utils.rgb(NAIL_COLOR);
        const nailPositions = [
          { nx: clubX - 1.5 * s, ny: clubY - 15 * s },
          { nx: clubX + 0.5 * s, ny: clubY - 12 * s },
          { nx: clubX - 0.5 * s, ny: clubY - 10.5 * s },
        ];
        for (const np of nailPositions) {
          utils.fillCircle(ctx, np.nx, np.ny, 0.7 * s);
        }
      }
    }

    // ── Head ─────────────────────────────────────────────────────────────────
    const headX = torsoX + bodyOffsetX * 0.05;
    const headY = torsoY - 18 * s + bodyOffsetY * 0.1;

    // Neck
    ctx.fillStyle = utils.rgb(SKIN_DARK);
    ctx.fillRect(headX - 3 * s, torsoY - 12 * s, 6 * s, 5 * s);

    // Skull base
    const headGrad = ctx.createRadialGradient(headX - 2 * s, headY - 2 * s, 0, headX, headY, 9 * s);
    headGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    headGrad.addColorStop(0.6, utils.rgb(SKIN));
    headGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = headGrad;
    utils.fillEllipse(ctx, headX, headY, 9 * s, 8.5 * s);

    // Heavy brow ridge — dark arc over eyes
    ctx.fillStyle = utils.rgb(SKIN_DARK, 0.8);
    ctx.beginPath();
    ctx.arc(headX, headY - 2 * s, 7 * s, Math.PI * 1.1, Math.PI * 1.9);
    ctx.lineWidth = 2.5 * s;
    ctx.strokeStyle = utils.rgb(SKIN_DARK);
    ctx.stroke();

    // Bulbous warty nose — main ellipse
    ctx.fillStyle = utils.rgb(SKIN);
    utils.fillEllipse(ctx, headX + 1 * s, headY + 2 * s, 3.5 * s, 2.5 * s);
    // Wart — small circle on nose
    ctx.fillStyle = utils.rgb(utils.darken(SKIN, 15));
    utils.fillCircle(ctx, headX + 2.5 * s, headY + 1 * s, 1 * s);

    // Deep-set beady eyes
    for (const side of [-1, 1]) {
      const ex = headX + side * 3.5 * s;
      const ey = headY - 1 * s;
      // Eye socket shadow
      ctx.fillStyle = utils.rgb(SKIN_DARK, 0.6);
      utils.fillEllipse(ctx, ex, ey, 2.5 * s, 2 * s);
      // Eye
      ctx.fillStyle = utils.rgb(EYE_COLOR);
      utils.fillEllipse(ctx, ex, ey, 1.5 * s, 1.5 * s);
      // Pupil
      ctx.fillStyle = '#1a0800';
      utils.fillCircle(ctx, ex, ey, 0.6 * s);
      // Highlight
      ctx.fillStyle = 'rgba(255,200,100,0.4)';
      utils.fillCircle(ctx, ex - 0.4 * s, ey - 0.4 * s, 0.3 * s);
    }

    // Mouth — jagged smirk
    ctx.strokeStyle = '#1a0a00';
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(headX - 3 * s, headY + 4 * s);
    ctx.lineTo(headX - 1 * s, headY + 5 * s);
    ctx.lineTo(headX + 1 * s, headY + 4.5 * s);
    ctx.lineTo(headX + 3 * s, headY + 5 * s);
    ctx.stroke();

    // Large pointed ears — triangle paths
    for (const side of [-1, 1]) {
      const earBaseX = headX + side * 8 * s;
      const earBaseY = headY - 1 * s;
      const earTipX = earBaseX + side * 5 * s;
      const earTipY = earBaseY - 6 * s;
      ctx.fillStyle = utils.rgb(SKIN);
      ctx.beginPath();
      ctx.moveTo(earBaseX - side * 1.5 * s, earBaseY + 2 * s);
      ctx.lineTo(earTipX, earTipY);
      ctx.lineTo(earBaseX + side * 1.5 * s, earBaseY - 2 * s);
      ctx.closePath();
      ctx.fill();
      // Inner ear
      ctx.fillStyle = utils.rgb(utils.darken(SKIN, 20), 0.5);
      ctx.beginPath();
      ctx.moveTo(earBaseX - side * 0.5 * s, earBaseY + 1 * s);
      ctx.lineTo(earTipX, earTipY + 3 * s);
      ctx.lineTo(earBaseX + side * 0.5 * s, earBaseY - 1 * s);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  },
};
