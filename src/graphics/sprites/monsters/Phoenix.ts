// src/graphics/sprites/monsters/Phoenix.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const BODY_COLOR  = 0x8f2f00;
const HIDE_DARK   = 0x291000;
const WING_OUTER  = 0xcc5500;
const WING_MID    = 0xff8800;
const WING_INNER  = 0xffcc00;
const BEAK_COLOR  = 0xff8800;
const EYE_COLOR   = 0xffee00;
const TAIL_BASE   = 0xff6600;

export const PhoenixDrawer: EntityDrawer = {
  key: 'monster_phoenix',
  frameW: 56,
  frameH: 56,
  totalFrames: 20,

  drawFrame(ctx, frame, action, w, h, utils) {
    const act = action as MonsterAction;
    const s = w / 56;

    const frameCounts: Record<MonsterAction, number> = { idle: 4, walk: 6, attack: 4, hurt: 2, death: 4 };
    const count = frameCounts[act] || 4;
    const localFrame = frame % count;
    const t = count > 1 ? localFrame / (count - 1) : 0;
    const phase = (localFrame / count) * Math.PI * 2;

    const flicker = frame * 0.7 + phase;

    let alpha = 1;
    let wingSpread = 0.5;
    let bodyOffsetY = 0;
    let bodyRot = 0;
    let flapAmt = 0;

    switch (act) {
      case 'idle':
        wingSpread = 0.4 + Math.abs(Math.sin(phase)) * 0.3;
        bodyOffsetY = Math.sin(phase) * 1.5 * s;
        flapAmt = Math.abs(Math.sin(phase));
        break;
      case 'walk':
        wingSpread = 0.5 + Math.abs(Math.sin(phase)) * 0.4;
        bodyOffsetY = -Math.abs(Math.sin(phase)) * 3 * s;
        flapAmt = Math.abs(Math.sin(phase));
        break;
      case 'attack':
        wingSpread = 0.6 + t * 0.4;
        bodyOffsetY = -t * 8 * s;
        bodyRot = t * 0.25;
        flapAmt = 1;
        break;
      case 'hurt':
        bodyRot = -t * 0.3;
        alpha = 0.65 + t * 0.35;
        wingSpread = 0.3;
        break;
      case 'death':
        bodyOffsetY = t * h * 0.4;
        bodyRot = t * Math.PI * 0.4;
        alpha = 1 - t * 0.85;
        wingSpread = 0.2;
        break;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = w / 2;
    const baseY = h * 0.88 + bodyOffsetY;

    // Apply body rotation
    ctx.translate(cx, baseY);
    ctx.rotate(bodyRot);
    ctx.translate(-cx, -baseY);

    // ── Warm aura (large radial gradient behind body) ─────────────────────────
    const auraGrad = ctx.createRadialGradient(cx, baseY - 20 * s, 0, cx, baseY - 20 * s, 28 * s);
    auraGrad.addColorStop(0, 'rgba(255,140,0,0.12)');
    auraGrad.addColorStop(0.5, 'rgba(255,80,0,0.06)');
    auraGrad.addColorStop(1, 'rgba(255,40,0,0)');
    ctx.fillStyle = auraGrad;
    ctx.fillRect(cx - 28 * s, baseY - 48 * s, 56 * s, 56 * s);

    // ── Shadow ────────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(40,10,0,0.35)';
    utils.fillEllipse(ctx, cx, baseY + 1 * s, 14 * s * (1 - bodyOffsetY / h * 0.5), 3 * s);

    // ── Trailing tail feathers (behind body) ─────────────────────────────────
    const tailFeathers = 5;
    for (let tf = 0; tf < tailFeathers; tf++) {
      const tFrac = tf / (tailFeathers - 1);
      const tAngle = (Math.PI * 0.8 + tFrac * Math.PI * 0.4) + Math.sin(flicker + tf) * 0.08;
      const tLen = (12 + tFrac * 8) * s;
      const tAlpha = (0.7 - tFrac * 0.5) * (act === 'death' ? (1 - t) : 1);
      const tColor = tFrac < 0.5 ? TAIL_BASE : WING_MID;
      ctx.strokeStyle = utils.rgb(tColor, tAlpha);
      ctx.lineWidth = (2 - tFrac * 1.2) * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, baseY - 8 * s);
      ctx.quadraticCurveTo(
        cx + Math.cos(tAngle) * tLen * 0.5 + Math.sin(flicker * 0.7 + tf) * 3 * s,
        baseY - 8 * s + Math.sin(tAngle) * tLen * 0.5,
        cx + Math.cos(tAngle) * tLen,
        baseY - 8 * s + Math.sin(tAngle) * tLen
      );
      ctx.stroke();
    }

    // ── Wings (layered flame-feather shapes) ──────────────────────────────────
    const wingBaseY = baseY - 22 * s;
    for (const side of [-1, 1]) {
      const wSpan = (16 + wingSpread * 14) * s;
      const wH = (10 + flapAmt * 8 + wingSpread * 6) * s;
      const wCtrlY = wingBaseY - wH * (1.0 + flapAmt * 0.5);

      // Outer wing layer (dark orange)
      utils.drawFlameLayer(
        ctx,
        cx + side * wSpan * 0.5,
        wingBaseY,
        wSpan * 0.7,
        wH * 1.1,
        utils.rgb(WING_OUTER, 0.85),
        flicker + side
      );

      // Mid wing layer
      utils.drawFlameLayer(
        ctx,
        cx + side * wSpan * 0.4,
        wingBaseY,
        wSpan * 0.55,
        wH * 0.85,
        utils.rgb(WING_MID, 0.8),
        flicker + side + 0.6
      );

      // Inner bright layer
      utils.drawFlameLayer(
        ctx,
        cx + side * wSpan * 0.28,
        wingBaseY,
        wSpan * 0.38,
        wH * 0.65,
        utils.rgb(WING_INNER, 0.65),
        flicker + side + 1.2
      );

      // Wing tip flame wisps
      for (let wf = 0; wf < 3; wf++) {
        const wfX = cx + side * (wSpan * 0.6 + wf * 3 * s);
        const wfY = wingBaseY - wH * 0.4;
        utils.drawFlameLayer(ctx, wfX, wfY, 3 * s, 6 * s, utils.rgb(WING_MID, 0.5 - wf * 0.12), flicker + wf);
      }
    }

    // Soft outline glow (orange — fire)
    utils.softOutline(ctx, 'rgba(255,140,0,0.3)', 6);

    // ── Body (ellipse torso) ──────────────────────────────────────────────────
    const bodyGrad = ctx.createRadialGradient(cx - 3 * s, baseY - 22 * s, 0, cx, baseY - 18 * s, 12 * s);
    bodyGrad.addColorStop(0, utils.rgb(utils.lighten(BODY_COLOR, 30)));
    bodyGrad.addColorStop(0.5, utils.rgb(BODY_COLOR));
    bodyGrad.addColorStop(1, utils.rgb(HIDE_DARK));
    ctx.fillStyle = bodyGrad;
    utils.fillEllipse(ctx, cx, baseY - 18 * s, 9 * s, 13 * s);

    // End soft outline
    utils.softOutlineEnd(ctx);

    // Rim light on body
    utils.rimLight(ctx, cx, baseY - 18 * s, 9 * s, 13 * s, 'rgba(255,120,0,0.15)');

    // Feather texture lines on body
    ctx.strokeStyle = utils.rgb(WING_MID, 0.35);
    ctx.lineWidth = 0.7 * s;
    for (let fl = 0; fl < 5; fl++) {
      const flY = baseY - 26 * s + fl * 3 * s;
      ctx.beginPath();
      ctx.moveTo(cx - 6 * s, flY);
      ctx.quadraticCurveTo(cx, flY + 1.5 * s, cx + 6 * s, flY);
      ctx.stroke();
    }

    // ── Neck ──────────────────────────────────────────────────────────────────
    ctx.fillStyle = utils.rgb(BODY_COLOR);
    utils.fillEllipse(ctx, cx, baseY - 31 * s, 4.5 * s, 5 * s);

    // ── Head ──────────────────────────────────────────────────────────────────
    const headGrad = ctx.createRadialGradient(cx - 2 * s, baseY - 38 * s, 0, cx, baseY - 37 * s, 7 * s);
    headGrad.addColorStop(0, utils.rgb(utils.lighten(BODY_COLOR, 25)));
    headGrad.addColorStop(1, utils.rgb(utils.darken(BODY_COLOR, 15)));
    ctx.fillStyle = headGrad;
    utils.fillEllipse(ctx, cx, baseY - 37 * s, 6.5 * s, 6 * s);

    // ── Head crest (upward flame wisps) ──────────────────────────────────────
    const crestCount = 4;
    for (let ci = 0; ci < crestCount; ci++) {
      const cFrac = ci / (crestCount - 1);
      const cX = cx - 5 * s + cFrac * 10 * s;
      const cH = (6 + Math.sin(cFrac * Math.PI) * 4) * s;
      const cAlpha = 0.7 + Math.sin(flicker + ci) * 0.15;
      utils.drawFlameLayer(ctx, cX, baseY - 41 * s, 4 * s, cH, utils.rgb(WING_MID, cAlpha), flicker + ci * 0.5);
    }

    // ── Beak ──────────────────────────────────────────────────────────────────
    ctx.fillStyle = utils.rgb(BEAK_COLOR);
    ctx.beginPath();
    ctx.moveTo(cx + 5 * s, baseY - 37 * s);
    ctx.quadraticCurveTo(cx + 11 * s, baseY - 38 * s, cx + 10 * s, baseY - 35 * s);
    ctx.quadraticCurveTo(cx + 8 * s, baseY - 34 * s, cx + 5 * s, baseY - 35 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = utils.rgb(utils.darken(BEAK_COLOR, 25));
    ctx.beginPath();
    ctx.moveTo(cx + 5.5 * s, baseY - 36.5 * s);
    ctx.quadraticCurveTo(cx + 9 * s, baseY - 37 * s, cx + 9 * s, baseY - 35.8 * s);
    ctx.lineTo(cx + 5.5 * s, baseY - 36 * s);
    ctx.closePath();
    ctx.fill();

    // ── Eyes ──────────────────────────────────────────────────────────────────
    const eyeX = cx + 1.5 * s;
    const eyeY = baseY - 38 * s;
    // Glow halo
    const eyeGrad = ctx.createRadialGradient(eyeX, eyeY, 0, eyeX, eyeY, 4 * s);
    eyeGrad.addColorStop(0, utils.rgb(EYE_COLOR, 0.9));
    eyeGrad.addColorStop(0.5, utils.rgb(WING_MID, 0.5));
    eyeGrad.addColorStop(1, 'rgba(255,100,0,0)');
    ctx.fillStyle = eyeGrad;
    utils.fillCircle(ctx, eyeX, eyeY, 4 * s);
    // Iris
    ctx.fillStyle = utils.rgb(EYE_COLOR);
    utils.fillCircle(ctx, eyeX, eyeY, 2.2 * s);
    // White center
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    utils.fillCircle(ctx, eyeX - 0.4 * s, eyeY - 0.5 * s, 0.8 * s);

    // ── Ember particles ───────────────────────────────────────────────────────
    const emberCount = act === 'attack' ? 10 : (act === 'death' ? 4 : 6);
    for (let ei = 0; ei < emberCount; ei++) {
      const eSeedX = utils.hash2d(ei * 7 + frame, ei * 3 + 50);
      const eSeedY = utils.hash2d(ei * 11 + frame, ei * 5 + 100);
      const eX = cx + (eSeedX - 0.5) * 36 * s;
      const eY = baseY - 15 * s - eSeedY * 30 * s;
      const eR = (0.4 + utils.hash2d(ei, frame + 3) * 1.2) * s;
      const eA = 0.3 + utils.hash2d(ei + 30, frame) * 0.6;
      const eG = 100 + Math.floor(utils.hash2d(ei, frame * 2) * 120);
      ctx.fillStyle = `rgba(255,${eG},0,${eA})`;
      utils.fillCircle(ctx, eX, eY, eR);
    }

    ctx.restore();
  },
};

