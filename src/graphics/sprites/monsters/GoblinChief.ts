// src/graphics/sprites/monsters/GoblinChief.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN        = 0x3f6121;
const SKIN_DARK   = 0x29430b;
const SKIN_LIGHT  = 0x557738;
const LEATHER     = 0x3f2716;
const METAL_COLOR = 0x4a4a56;
const GOLD_COLOR  = 0x614e21;
const EYE_COLOR   = 0xcc4400;

export const GoblinChiefDrawer: EntityDrawer = {
  key: 'monster_goblin_chief',
  frameW: 60,
  frameH: 68,
  totalFrames: 20,

  drawFrame(ctx, frame, action, w, h, utils) {
    const act = action as MonsterAction;
    const s = w / 60; // ~25% bigger than goblin

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
        bodyOffsetY = Math.sin(phase) * 0.9 * s;
        break;
      case 'walk':
        bodyOffsetX = Math.sin(phase) * 1.8 * s;
        bodyOffsetY = -Math.abs(Math.sin(phase)) * 1.8 * s;
        break;
      case 'attack':
        attackLunge = t;
        bodyOffsetX = t * 6 * s;
        bodyOffsetY = -t * 3 * s;
        break;
      case 'hurt':
        bodyOffsetX = -t * 5 * s;
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
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    utils.fillEllipse(ctx, cx + bodyOffsetX * 0.4, baseY + 1 * s, 15 * s, 3.5 * s);

    // ── Legs with metal-capped boots ─────────────────────────────────────────
    for (const side of [-1, 1]) {
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const hipX = cx + side * 6 * s + bodyOffsetX * 0.4;
      const hipY = baseY - 20 * s + bodyOffsetY;
      const kneeX = hipX + side * 1.5 * s + Math.sin(legPhase) * 2.5 * s;
      const kneeY = hipY + 10 * s;
      const footX = hipX + side * 2.5 * s;
      const footY = baseY - 1 * s;

      utils.drawLimb(ctx, [
        { x: hipX, y: hipY },
        { x: kneeX, y: kneeY },
        { x: footX, y: footY },
      ], 4 * s, SKIN_DARK);

      // Metal-capped boot
      utils.drawMetalSurface(ctx, footX - 3.5 * s, footY - 2 * s, 7 * s, 4 * s, METAL_COLOR);
    }

    // ── Torso ─────────────────────────────────────────────────────────────────
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 34 * s + bodyOffsetY;

    // Leather base
    utils.drawLeatherTexture(ctx, torsoX - 8 * s, torsoY - 11 * s, 16 * s, 18 * s, LEATHER);

    // Skin fill
    const torsoGrad = ctx.createRadialGradient(torsoX - 2 * s, torsoY - 3 * s, 0, torsoX, torsoY, 10 * s);
    torsoGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    torsoGrad.addColorStop(0.6, utils.rgb(SKIN));
    torsoGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = torsoGrad;
    utils.fillEllipse(ctx, torsoX, torsoY, 9 * s, 11 * s);

    // ── Shoulder pauldrons ───────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const pX = torsoX + side * 9 * s;
      const pY = torsoY - 8 * s;
      utils.drawMetalSurface(ctx, pX - 3 * s, pY - 2 * s, 6 * s, 5 * s, METAL_COLOR);
      utils.fillEllipse(ctx, pX, pY, 4 * s, 3.5 * s);
    }

    // ── Arms ─────────────────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const isRight = side === 1;
      const armPhase = act === 'walk' ? phase + (isRight ? Math.PI : 0) : 0;
      const shoulderX = torsoX + side * 9 * s;
      const shoulderY = torsoY - 7 * s;

      let elbowX: number, elbowY: number, handX: number, handY: number;

      if (isRight && act === 'attack') {
        elbowX = shoulderX + side * 5 * s + attackLunge * 4 * s;
        elbowY = shoulderY + 6 * s - attackLunge * 4 * s;
        handX = elbowX + side * 5 * s + attackLunge * 3 * s;
        handY = elbowY + 6 * s - attackLunge * 3 * s;
      } else {
        elbowX = shoulderX + side * 3 * s + Math.sin(armPhase) * 2 * s;
        elbowY = shoulderY + 7 * s;
        handX = elbowX + side * 2 * s + Math.sin(armPhase) * 1.5 * s;
        handY = elbowY + 8 * s + Math.sin(armPhase) * 2 * s;
      }

      utils.drawLimb(ctx, [
        { x: shoulderX, y: shoulderY },
        { x: elbowX, y: elbowY },
        { x: handX, y: handY },
      ], 4.5 * s, SKIN);

      // War axe in right hand
      if (isRight) {
        const axeX = handX + side * 1.5 * s;
        const axeY = handY;
        // Handle
        ctx.fillStyle = utils.rgb(0x3f2716);
        ctx.fillRect(axeX - 1.2 * s, axeY - 16 * s, 2.4 * s, 18 * s);
        // Blade body
        utils.drawMetalSurface(ctx, axeX + 1 * s, axeY - 20 * s, 8 * s, 12 * s, METAL_COLOR);
        // Blade polygon — forward edge
        ctx.fillStyle = utils.rgb(utils.lighten(METAL_COLOR, 20));
        ctx.beginPath();
        ctx.moveTo(axeX + 9 * s, axeY - 20 * s);
        ctx.lineTo(axeX + 14 * s, axeY - 16 * s);
        ctx.lineTo(axeX + 9 * s, axeY - 8 * s);
        ctx.closePath();
        ctx.fill();
        // Back spike
        ctx.fillStyle = utils.rgb(METAL_COLOR);
        ctx.beginPath();
        ctx.moveTo(axeX + 1 * s, axeY - 16 * s);
        ctx.lineTo(axeX - 5 * s, axeY - 14 * s);
        ctx.lineTo(axeX + 1 * s, axeY - 12 * s);
        ctx.closePath();
        ctx.fill();
      }
    }

    // ── Head ─────────────────────────────────────────────────────────────────
    const headX = torsoX + bodyOffsetX * 0.05;
    const headY = torsoY - 22 * s + bodyOffsetY * 0.1;

    // Neck
    ctx.fillStyle = utils.rgb(SKIN_DARK);
    ctx.fillRect(headX - 4 * s, torsoY - 14 * s, 8 * s, 6 * s);

    // Skull base
    const headGrad = ctx.createRadialGradient(headX - 2 * s, headY - 2 * s, 0, headX, headY, 11 * s);
    headGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    headGrad.addColorStop(0.6, utils.rgb(SKIN));
    headGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = headGrad;
    utils.fillEllipse(ctx, headX, headY, 10.5 * s, 10 * s);

    // Heavy brow ridge
    ctx.strokeStyle = utils.rgb(SKIN_DARK);
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.arc(headX, headY - 2 * s, 8 * s, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // Battle scar across face — diagonal stroke + perpendicular tick marks
    ctx.strokeStyle = utils.rgb(utils.darken(SKIN, 25), 0.7);
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.moveTo(headX - 5 * s, headY - 4 * s);
    ctx.lineTo(headX + 4 * s, headY + 3 * s);
    ctx.stroke();
    // Tick marks (stitches)
    ctx.lineWidth = 0.7 * s;
    for (let i = 0; i < 4; i++) {
      const tx = headX - 4 * s + i * 2.5 * s;
      const ty = headY - 3 * s + i * 1.75 * s;
      ctx.beginPath();
      ctx.moveTo(tx - 1 * s, ty + 1.2 * s);
      ctx.lineTo(tx + 1 * s, ty - 1.2 * s);
      ctx.stroke();
    }

    // Bulbous warty nose
    ctx.fillStyle = utils.rgb(SKIN);
    utils.fillEllipse(ctx, headX + 1 * s, headY + 2 * s, 4 * s, 3 * s);
    ctx.fillStyle = utils.rgb(utils.darken(SKIN, 15));
    utils.fillCircle(ctx, headX + 3 * s, headY + 1 * s, 1.2 * s);

    // Redder eyes
    for (const side of [-1, 1]) {
      const ex = headX + side * 4 * s;
      const ey = headY - 1.5 * s;
      ctx.fillStyle = utils.rgb(SKIN_DARK, 0.6);
      utils.fillEllipse(ctx, ex, ey, 3 * s, 2.5 * s);
      ctx.fillStyle = utils.rgb(EYE_COLOR);
      utils.fillEllipse(ctx, ex, ey, 1.8 * s, 1.8 * s);
      ctx.fillStyle = '#200800';
      utils.fillCircle(ctx, ex, ey, 0.7 * s);
      ctx.fillStyle = 'rgba(255,150,80,0.4)';
      utils.fillCircle(ctx, ex - 0.5 * s, ey - 0.5 * s, 0.35 * s);
    }

    // Mouth with tusk
    ctx.strokeStyle = '#1a0a00';
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(headX - 3.5 * s, headY + 4 * s);
    ctx.lineTo(headX + 3.5 * s, headY + 5 * s);
    ctx.stroke();
    // Tusk
    ctx.fillStyle = '#e8d8b0';
    ctx.beginPath();
    ctx.moveTo(headX - 2 * s, headY + 5 * s);
    ctx.lineTo(headX - 4 * s, headY + 9 * s);
    ctx.lineTo(headX - 1 * s, headY + 5 * s);
    ctx.closePath();
    ctx.fill();

    // Large pointed ears
    for (const side of [-1, 1]) {
      const earBaseX = headX + side * 9 * s;
      const earBaseY = headY - 1 * s;
      const earTipX = earBaseX + side * 6 * s;
      const earTipY = earBaseY - 7 * s;
      ctx.fillStyle = utils.rgb(SKIN);
      ctx.beginPath();
      ctx.moveTo(earBaseX - side * 2 * s, earBaseY + 2 * s);
      ctx.lineTo(earTipX, earTipY);
      ctx.lineTo(earBaseX + side * 2 * s, earBaseY - 2 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = utils.rgb(utils.darken(SKIN, 20), 0.5);
      ctx.beginPath();
      ctx.moveTo(earBaseX - side * 0.5 * s, earBaseY + 1 * s);
      ctx.lineTo(earTipX, earTipY + 3 * s);
      ctx.lineTo(earBaseX + side * 0.5 * s, earBaseY - 1 * s);
      ctx.closePath();
      ctx.fill();
    }

    // Battered crown (jagged polygon)
    const crownY = headY - 11 * s;
    utils.drawMetalSurface(ctx, headX - 8 * s, crownY, 16 * s, 5 * s, GOLD_COLOR);
    // Jagged points
    ctx.fillStyle = utils.rgb(GOLD_COLOR);
    const points = [-6, -3, 0, 3, 6];
    for (const px of points) {
      ctx.beginPath();
      ctx.moveTo(headX + (px - 1.5) * s, crownY);
      ctx.lineTo(headX + px * s, crownY - 5 * s);
      ctx.lineTo(headX + (px + 1.5) * s, crownY);
      ctx.closePath();
      ctx.fill();
    }
    // Crown gem — keep bright (emissive)
    ctx.fillStyle = '#cc2222';
    utils.fillCircle(ctx, headX, crownY + 2.5 * s, 2 * s);
    ctx.fillStyle = 'rgba(255,100,100,0.5)';
    utils.fillCircle(ctx, headX - 0.5 * s, crownY + 2 * s, 0.8 * s);

    ctx.restore();
  },
};
