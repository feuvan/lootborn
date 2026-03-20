// src/graphics/sprites/monsters/Sandworm.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const HIDE_MID   = 0x614e2c;
const HIDE_DARK  = 0x342110;
const HIDE_LIGHT = 0x7b6543;
const SAND_COLOR = 0x867043;
const TOOTH_COLOR = 0x977b5f;

export const SandwormDrawer: EntityDrawer = {
  key: 'monster_sandworm',
  frameW: 56,
  frameH: 48,
  totalFrames: 20,

  drawFrame(ctx, frame, action, w, h, utils) {
    const act = action as MonsterAction;
    const s = w / 56;

    const frameCounts: Record<MonsterAction, number> = { idle: 4, walk: 6, attack: 4, hurt: 2, death: 4 };
    const count = frameCounts[act] || 4;
    const localFrame = frame % count;
    const t = count > 1 ? localFrame / (count - 1) : 0;
    const phase = (localFrame / count) * Math.PI * 2;

    let alpha = 1;
    let headOffsetX = 0;
    let headOffsetY = 0;
    let mouthOpen = 0;
    let bodyRise = 0;

    switch (act) {
      case 'idle':
        headOffsetX = Math.sin(phase) * 2 * s;
        headOffsetY = Math.sin(phase * 0.7) * 1.5 * s;
        mouthOpen = 0.05 + Math.abs(Math.sin(phase * 0.5)) * 0.05;
        bodyRise = Math.sin(phase) * 1 * s;
        break;
      case 'walk':
        headOffsetX = Math.sin(phase) * 4 * s;
        headOffsetY = -Math.abs(Math.sin(phase)) * 2 * s;
        mouthOpen = 0.05;
        bodyRise = -Math.abs(Math.sin(phase)) * 2 * s;
        break;
      case 'attack':
        headOffsetX = t * 6 * s;
        headOffsetY = -t * 8 * s;
        mouthOpen = t * 0.9;
        bodyRise = -t * 4 * s;
        break;
      case 'hurt':
        headOffsetX = -t * 5 * s;
        alpha = 0.7 + t * 0.3;
        break;
      case 'death':
        headOffsetY = t * 15 * s;
        alpha = 1 - t * 0.8;
        break;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = w / 2;
    const groundY = h * 0.82;

    // ── Sand particles (behind everything) ──────────────────────────────────
    ctx.fillStyle = utils.rgb(SAND_COLOR, 0.18);
    for (let i = 0; i < 12; i++) {
      const px = cx - 20 * s + utils.hash2d(i * 7, frame + i) * 40 * s;
      const py = groundY - 2 * s + utils.hash2d(i * 11, frame * 2 + i) * 8 * s;
      const pr = (0.5 + utils.hash2d(i * 3, i * 17) * 1.2) * s;
      utils.fillCircle(ctx, px, py, pr);
    }

    // ── Coils behind head ────────────────────────────────────────────────────
    const coilCX = cx - 8 * s + headOffsetX * 0.3;
    const coilCY = groundY - 8 * s + bodyRise;
    for (let ci = 0; ci < 3; ci++) {
      const cr = (9 - ci * 2.5) * s;
      const coilAlpha = 0.55 - ci * 0.12;
      const coilGrad = ctx.createRadialGradient(
        coilCX - cr * 0.3, coilCY - cr * 0.2, 0,
        coilCX, coilCY, cr
      );
      coilGrad.addColorStop(0, utils.rgb(HIDE_LIGHT, coilAlpha + 0.1));
      coilGrad.addColorStop(0.6, utils.rgb(HIDE_MID, coilAlpha));
      coilGrad.addColorStop(1, utils.rgb(HIDE_DARK, coilAlpha));
      ctx.fillStyle = coilGrad;
      ctx.beginPath();
      ctx.arc(coilCX + ci * 2 * s, coilCY + ci * 1 * s, cr, 0, Math.PI * 2);
      ctx.fill();
      // Segment stripe
      ctx.strokeStyle = utils.rgb(HIDE_DARK, 0.35);
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.arc(coilCX + ci * 2 * s, coilCY + ci * 1 * s, cr * 0.85, Math.PI * 0.9, Math.PI * 2.1);
      ctx.stroke();
    }

    // ── Body segments (arc stripes between coils and head) ───────────────────
    const segCount = 4;
    const headCX = cx + headOffsetX;
    const headBaseY = groundY - 14 * s + headOffsetY;
    for (let si = 0; si < segCount; si++) {
      const frac = (si + 1) / (segCount + 1);
      const segX = coilCX + (headCX - coilCX) * frac;
      const segY = coilCY + (headBaseY - coilCY) * frac;
      const segR = (7 - si * 0.8) * s;
      ctx.strokeStyle = utils.rgb(HIDE_MID, 0.45);
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.arc(segX, segY, segR * 0.8, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
    }

    // ── Ground cutoff line (sand surface) ────────────────────────────────────
    const sandGrad = ctx.createLinearGradient(0, groundY - 2 * s, 0, groundY + 6 * s);
    sandGrad.addColorStop(0, utils.rgb(SAND_COLOR, 0.55));
    sandGrad.addColorStop(1, utils.rgb(HIDE_DARK, 0));
    ctx.fillStyle = sandGrad;
    ctx.fillRect(cx - 22 * s, groundY - 2 * s, 44 * s, 8 * s);

    // ── Shadow ───────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    utils.fillEllipse(ctx, cx, groundY + 2 * s, 18 * s, 3 * s);

    // ── Neck / lower body emerging ───────────────────────────────────────────
    const neckGrad = ctx.createLinearGradient(headCX - 9 * s, headBaseY + 8 * s, headCX + 9 * s, headBaseY + 8 * s);
    neckGrad.addColorStop(0, utils.rgb(HIDE_DARK));
    neckGrad.addColorStop(0.4, utils.rgb(HIDE_MID));
    neckGrad.addColorStop(1, utils.rgb(HIDE_DARK));
    ctx.fillStyle = neckGrad;
    ctx.beginPath();
    ctx.ellipse(headCX, headBaseY + 6 * s, 9 * s, 10 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Head ─────────────────────────────────────────────────────────────────
    const headR = 11 * s;
    const headY = headBaseY - headR * 0.5;

    // Soft outline glow (sandy — desert)
    utils.softOutline(ctx, 'rgba(160,120,60,0.2)', 5);

    const headGrad = ctx.createRadialGradient(
      headCX - headR * 0.25, headY - headR * 0.2, 0,
      headCX, headY, headR
    );
    headGrad.addColorStop(0, utils.rgb(HIDE_LIGHT));
    headGrad.addColorStop(0.5, utils.rgb(HIDE_MID));
    headGrad.addColorStop(1, utils.rgb(HIDE_DARK));
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(headCX, headY, headR, headR * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();

    // End soft outline
    utils.softOutlineEnd(ctx);

    // Rim light on head
    utils.rimLight(ctx, headCX, headY, headR, headR * 0.92, 'rgba(140,100,40,0.1)');

    // ── Sensory pits (eyeless indentations) ──────────────────────────────────
    for (const side of [-1, 1]) {
      const px = headCX + side * 4.5 * s;
      const py = headY - 2 * s;
      ctx.fillStyle = utils.rgb(HIDE_DARK, 0.7);
      utils.fillEllipse(ctx, px, py, 2.5 * s, 2 * s);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      utils.fillEllipse(ctx, px, py, 1.5 * s, 1.2 * s);
    }

    // ── Mouth ring (concentric teeth arcs) ───────────────────────────────────
    const mouthY = headY + headR * 0.4;
    const outerR = 8 * s + mouthOpen * 3 * s;
    const innerR = 4.5 * s + mouthOpen * 2 * s;

    // Outer gum ring
    ctx.fillStyle = utils.rgb(0x4a2110);
    ctx.beginPath();
    ctx.arc(headCX, mouthY, outerR, 0, Math.PI * 2);
    ctx.fill();

    // Mid ring
    ctx.fillStyle = utils.rgb(0x611c0b);
    ctx.beginPath();
    ctx.arc(headCX, mouthY, outerR * 0.75, 0, Math.PI * 2);
    ctx.fill();

    // Inner dark maw
    ctx.fillStyle = '#0a0505';
    ctx.beginPath();
    ctx.arc(headCX, mouthY, innerR, 0, Math.PI * 2);
    ctx.fill();

    // Concentric ring grooves
    for (let ring = 0; ring < 3; ring++) {
      const rr = outerR * (0.88 - ring * 0.12);
      ctx.strokeStyle = utils.rgb(HIDE_DARK, 0.5);
      ctx.lineWidth = 0.8 * s;
      ctx.beginPath();
      ctx.arc(headCX, mouthY, rr, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Teeth — triangle spikes around outer ring
    const toothCount = 10;
    ctx.fillStyle = utils.rgb(TOOTH_COLOR);
    for (let ti = 0; ti < toothCount; ti++) {
      const angle = (ti / toothCount) * Math.PI * 2;
      const tx = headCX + Math.cos(angle) * (outerR - 1 * s);
      const ty = mouthY + Math.sin(angle) * (outerR - 1 * s);
      const inx = headCX + Math.cos(angle) * (innerR + 0.5 * s);
      const iny = mouthY + Math.sin(angle) * (innerR + 0.5 * s);
      const perpAngle = angle + Math.PI / 2;
      const tw = 1.2 * s;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(inx + Math.cos(perpAngle) * tw, iny + Math.sin(perpAngle) * tw);
      ctx.lineTo(inx - Math.cos(perpAngle) * tw, iny - Math.sin(perpAngle) * tw);
      ctx.closePath();
      ctx.fill();
    }

    // Inner row of smaller teeth
    const innerToothCount = 8;
    ctx.fillStyle = utils.rgb(utils.darken(TOOTH_COLOR, 20));
    for (let ti = 0; ti < innerToothCount; ti++) {
      const angle = (ti / innerToothCount) * Math.PI * 2 + Math.PI / innerToothCount;
      const tx = headCX + Math.cos(angle) * (innerR - 0.5 * s);
      const ty = mouthY + Math.sin(angle) * (innerR - 0.5 * s);
      const cx2 = headCX + Math.cos(angle) * (innerR * 0.5);
      const cy2 = mouthY + Math.sin(angle) * (innerR * 0.5);
      const perpAngle = angle + Math.PI / 2;
      const tw = 0.8 * s;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(cx2 + Math.cos(perpAngle) * tw, cy2 + Math.sin(perpAngle) * tw);
      ctx.lineTo(cx2 - Math.cos(perpAngle) * tw, cy2 - Math.sin(perpAngle) * tw);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  },
};
