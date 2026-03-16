// src/graphics/sprites/monsters/DemonLord.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN_MID    = 0x1d0729;
const SKIN_DARK   = 0x070310;
const SKIN_LIGHT  = 0x34123f;
const WING_COLOR  = 0x1d0729;
const HORN_COLOR  = 0x12071a;
const EYE_COLOR   = 0xff0044;
const RUNE_COLOR  = 0xff0044;
const SPIKE_COLOR = 0x12051c;
const HOOF_COLOR  = 0x07020b;

export const DemonLordDrawer: EntityDrawer = {
  key: 'monster_demon_lord',
  frameW: 72,
  frameH: 84,
  totalFrames: 20,

  drawFrame(ctx, frame, action, w, h, utils) {
    const act = action as MonsterAction;
    const s = w / 72;

    const frameCounts: Record<MonsterAction, number> = { idle: 4, walk: 6, attack: 4, hurt: 2, death: 4 };
    const count = frameCounts[act] || 4;
    const localFrame = frame % count;
    const t = count > 1 ? localFrame / (count - 1) : 0;
    const phase = (localFrame / count) * Math.PI * 2;

    let alpha = 1;
    let bodyOffsetX = 0;
    let bodyOffsetY = 0;
    let wingSpread = 0.4;
    let attackLunge = 0;
    let globalRot = 0;
    let runeGlow = 0;

    switch (act) {
      case 'idle':
        bodyOffsetY = Math.sin(phase) * 1.5 * s;
        wingSpread = 0.35 + Math.abs(Math.sin(phase)) * 0.2;
        runeGlow = 0.2 + Math.abs(Math.sin(phase * 0.7)) * 0.2;
        break;
      case 'walk':
        bodyOffsetX = Math.sin(phase) * 2 * s;
        bodyOffsetY = -Math.abs(Math.sin(phase)) * 2.5 * s;
        wingSpread = 0.4 + Math.abs(Math.sin(phase)) * 0.3;
        runeGlow = 0.15;
        break;
      case 'attack':
        attackLunge = t;
        bodyOffsetX = t * 10 * s;
        bodyOffsetY = -t * 4 * s;
        wingSpread = 0.5 + t * 0.5;
        runeGlow = t * 0.6;
        break;
      case 'hurt':
        bodyOffsetX = -t * 7 * s;
        alpha = 0.7 + t * 0.3;
        runeGlow = t * 0.4;
        break;
      case 'death':
        globalRot = t * Math.PI * 0.4;
        bodyOffsetY = t * h * 0.4;
        alpha = 1 - t * 0.8;
        wingSpread = 0.1;
        runeGlow = (1 - t) * 0.3;
        break;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = w / 2;
    const baseY = h * 0.97;

    ctx.translate(cx, baseY);
    ctx.rotate(globalRot);
    ctx.translate(-cx, -baseY);

    // ── Dark aura (large low-alpha radial gradient behind body) ───────────────
    const auraGrad = ctx.createRadialGradient(cx + bodyOffsetX, baseY - 42 * s + bodyOffsetY, 0, cx + bodyOffsetX, baseY - 42 * s + bodyOffsetY, 42 * s);
    auraGrad.addColorStop(0, 'rgba(60,0,80,0.18)');
    auraGrad.addColorStop(0.5, 'rgba(40,0,60,0.08)');
    auraGrad.addColorStop(1, 'rgba(20,0,40,0)');
    ctx.fillStyle = auraGrad;
    ctx.fillRect(cx + bodyOffsetX - 42 * s, baseY - 84 * s + bodyOffsetY, 84 * s, 84 * s);

    // ── Shadow ────────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    utils.fillEllipse(ctx, cx + bodyOffsetX, baseY + 1 * s, 22 * s, 4.5 * s);

    // ── Enormous tattered bat wings (drawn behind body) ───────────────────────
    const wingBaseX = cx + bodyOffsetX;
    const wingBaseY = baseY - 50 * s + bodyOffsetY;

    for (const side of [-1, 1]) {
      const wSpan = (26 + wingSpread * 20) * s;
      const wH = (20 + wingSpread * 16) * s;

      // Main membrane fill
      ctx.fillStyle = utils.rgb(WING_COLOR, 0.78);
      ctx.beginPath();
      ctx.moveTo(wingBaseX, wingBaseY);
      // Main upper curve
      ctx.quadraticCurveTo(
        wingBaseX + side * wSpan * 0.5,
        wingBaseY - wH * 1.3,
        wingBaseX + side * wSpan,
        wingBaseY - wH
      );
      // Jagged lower edge (multiple segments)
      const jagCount = 5;
      for (let jag = jagCount; jag >= 0; jag--) {
        const jFrac = jag / jagCount;
        const jX = wingBaseX + side * wSpan * jFrac;
        const jY = wingBaseY - wH * jFrac + (jag % 2 === 0 ? 0 : 5 * s);
        ctx.lineTo(jX, jY);
      }
      ctx.closePath();
      ctx.fill();

      // Wing bone / vein structure
      ctx.strokeStyle = utils.rgb(utils.darken(WING_COLOR, 20), 0.55);
      ctx.lineWidth = 1 * s;
      ctx.lineCap = 'round';
      // Primary vein
      ctx.beginPath();
      ctx.moveTo(wingBaseX, wingBaseY);
      ctx.quadraticCurveTo(
        wingBaseX + side * wSpan * 0.45,
        wingBaseY - wH * 0.9,
        wingBaseX + side * wSpan * 0.85,
        wingBaseY - wH * 0.75
      );
      ctx.stroke();
      // Secondary veins
      for (let vn = 1; vn <= 3; vn++) {
        const vFrac = vn / 4;
        ctx.beginPath();
        ctx.moveTo(wingBaseX + side * wSpan * 0.15 * vn, wingBaseY - 4 * s);
        ctx.quadraticCurveTo(
          wingBaseX + side * wSpan * (0.3 + vFrac * 0.3),
          wingBaseY - wH * (0.4 + vFrac * 0.3),
          wingBaseX + side * wSpan * (0.5 + vFrac * 0.35),
          wingBaseY - wH * (0.2 + vFrac * 0.6)
        );
        ctx.stroke();
      }

      // Wing membrane edge highlight
      ctx.strokeStyle = utils.rgb(SKIN_MID, 0.3);
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.moveTo(wingBaseX, wingBaseY);
      ctx.quadraticCurveTo(
        wingBaseX + side * wSpan * 0.5,
        wingBaseY - wH * 1.3,
        wingBaseX + side * wSpan,
        wingBaseY - wH
      );
      ctx.stroke();
    }

    // ── Digitigrade hooved legs ───────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const hipX = cx + side * 9 * s + bodyOffsetX;
      const hipY = baseY - 22 * s + bodyOffsetY;
      const kneeX = hipX + side * 4 * s + Math.sin(legPhase) * 3 * s;
      const kneeY = hipY + 10 * s - Math.abs(Math.sin(legPhase)) * 3 * s;
      const ankleX = kneeX - side * 2 * s;
      const ankleY = kneeY + 8 * s;
      const hoofX = ankleX + side * 3 * s + Math.sin(legPhase) * s;
      const hoofY = baseY - 2 * s;

      utils.drawLimb(ctx, [
        { x: hipX, y: hipY },
        { x: kneeX, y: kneeY },
        { x: ankleX, y: ankleY },
        { x: hoofX, y: hoofY },
      ], 5.5 * s, SKIN_MID);

      // Hoof (solid dark wedge)
      ctx.fillStyle = utils.rgb(HOOF_COLOR);
      ctx.beginPath();
      ctx.moveTo(hoofX - 4 * s, hoofY);
      ctx.lineTo(hoofX + 4 * s, hoofY);
      ctx.lineTo(hoofX + 5 * s, hoofY + 4 * s);
      ctx.lineTo(hoofX - 5 * s, hoofY + 4 * s);
      ctx.closePath();
      ctx.fill();
    }

    // ── Massive torso ─────────────────────────────────────────────────────────
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 44 * s + bodyOffsetY;

    const torsoGrad = ctx.createLinearGradient(torsoX - 18 * s, torsoY - 18 * s, torsoX + 18 * s, torsoY + 20 * s);
    torsoGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    torsoGrad.addColorStop(0.35, utils.rgb(SKIN_MID));
    torsoGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = torsoGrad;
    utils.fillEllipse(ctx, torsoX, torsoY, 18 * s, 22 * s);

    // Chest arcane rune (diamond + inner glow)
    const runeX = torsoX;
    const runeY = torsoY - 6 * s;
    const runeSize = 6 * s;

    // Rune glow background
    const runeGradBg = ctx.createRadialGradient(runeX, runeY, 0, runeX, runeY, runeSize * 1.8);
    runeGradBg.addColorStop(0, `rgba(255,0,68,${runeGlow})`);
    runeGradBg.addColorStop(1, 'rgba(255,0,68,0)');
    ctx.fillStyle = runeGradBg;
    ctx.fillRect(runeX - runeSize * 2, runeY - runeSize * 2, runeSize * 4, runeSize * 4);

    // Diamond outline
    ctx.strokeStyle = utils.rgb(RUNE_COLOR, 0.7 + runeGlow);
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.moveTo(runeX, runeY - runeSize);
    ctx.lineTo(runeX + runeSize * 0.7, runeY);
    ctx.lineTo(runeX, runeY + runeSize);
    ctx.lineTo(runeX - runeSize * 0.7, runeY);
    ctx.closePath();
    ctx.stroke();

    // Inner diamond fill (glow)
    ctx.fillStyle = `rgba(255,0,68,${0.15 + runeGlow * 0.4})`;
    ctx.beginPath();
    ctx.moveTo(runeX, runeY - runeSize);
    ctx.lineTo(runeX + runeSize * 0.7, runeY);
    ctx.lineTo(runeX, runeY + runeSize);
    ctx.lineTo(runeX - runeSize * 0.7, runeY);
    ctx.closePath();
    ctx.fill();

    // Cross inside diamond
    ctx.strokeStyle = utils.rgb(RUNE_COLOR, 0.5 + runeGlow);
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(runeX, runeY - runeSize * 0.9);
    ctx.lineTo(runeX, runeY + runeSize * 0.9);
    ctx.moveTo(runeX - runeSize * 0.6, runeY);
    ctx.lineTo(runeX + runeSize * 0.6, runeY);
    ctx.stroke();

    // ── Spiked shoulder pauldrons ─────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const pX = torsoX + side * 18 * s;
      const pY = torsoY - 14 * s;

      // Pauldron base
      const pGrad = ctx.createRadialGradient(pX - side * 2 * s, pY - 2 * s, 0, pX, pY, 8 * s);
      pGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
      pGrad.addColorStop(0.5, utils.rgb(SKIN_MID));
      pGrad.addColorStop(1, utils.rgb(SKIN_DARK));
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.ellipse(pX, pY, 8 * s, 7 * s, side === -1 ? -0.2 : 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Spikes on pauldron
      ctx.fillStyle = utils.rgb(SPIKE_COLOR);
      const spikeAngles = [-0.7, -0.2, 0.3, 0.8].map(a => a + (side === -1 ? 0 : Math.PI));
      for (const sa of spikeAngles) {
        const sBaseX = pX + Math.cos(sa) * 6 * s;
        const sBaseY = pY + Math.sin(sa) * 6 * s;
        const sTipX = sBaseX + Math.cos(sa) * 5 * s;
        const sTipY = sBaseY + Math.sin(sa) * 5 * s;
        const perpX = -Math.sin(sa) * 1.5 * s;
        const perpY = Math.cos(sa) * 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(sBaseX + perpX, sBaseY + perpY);
        ctx.lineTo(sTipX, sTipY);
        ctx.lineTo(sBaseX - perpX, sBaseY - perpY);
        ctx.closePath();
        ctx.fill();
      }
    }

    // ── Arms ──────────────────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const isRight = side === 1;
      const armPhase = act === 'walk' ? phase + (isRight ? Math.PI : 0) : 0;
      const shoulderX = torsoX + side * 17 * s;
      const shoulderY = torsoY - 18 * s;

      let elbowX: number, elbowY: number, handX: number, handY: number;

      if (act === 'attack' && isRight) {
        elbowX = shoulderX + side * 7 * s + attackLunge * 4 * s;
        elbowY = shoulderY + 8 * s - attackLunge * 8 * s;
        handX = elbowX + side * 7 * s + attackLunge * 3 * s;
        handY = elbowY + 5 * s - attackLunge * 8 * s;
      } else {
        elbowX = shoulderX + side * 6 * s + Math.sin(armPhase) * 2.5 * s;
        elbowY = shoulderY + 12 * s - Math.abs(Math.sin(armPhase)) * 3 * s;
        handX = elbowX + side * 5 * s;
        handY = elbowY + 11 * s + Math.sin(armPhase) * 2.5 * s;
      }

      utils.drawLimb(ctx, [
        { x: shoulderX, y: shoulderY },
        { x: elbowX, y: elbowY },
        { x: handX, y: handY },
      ], 7 * s, SKIN_MID);

      // Clawed fingers (5 elongated)
      ctx.strokeStyle = utils.rgb(SKIN_DARK);
      ctx.lineWidth = 1 * s;
      ctx.lineCap = 'round';
      for (let fi = -2; fi <= 2; fi++) {
        const fAngle = (isRight ? 0.2 : -0.2) + fi * 0.2;
        const fLen = (5 + Math.abs(fi) * 0.8) * s;
        ctx.beginPath();
        ctx.moveTo(handX + fi * 1.5 * s, handY);
        ctx.lineTo(
          handX + fi * 1.5 * s + Math.cos(fAngle + Math.PI / 2) * fLen * (isRight ? 1 : -1),
          handY + Math.sin(fAngle + Math.PI / 2) * fLen + 1.5 * s
        );
        ctx.stroke();
      }
    }

    // ── Neck ──────────────────────────────────────────────────────────────────
    ctx.fillStyle = utils.rgb(SKIN_MID);
    utils.fillEllipse(ctx, torsoX, torsoY - 28 * s, 7 * s, 7 * s);

    // ── Head ──────────────────────────────────────────────────────────────────
    const headCX = torsoX;
    const headCY = torsoY - 40 * s;

    const headGrad = ctx.createRadialGradient(headCX - 4 * s, headCY - 5 * s, 0, headCX, headCY, 14 * s);
    headGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    headGrad.addColorStop(0.4, utils.rgb(SKIN_MID));
    headGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = headGrad;
    utils.fillEllipse(ctx, headCX, headCY, 13 * s, 14 * s);

    // ── Ram-like spiraling horns with ridges ──────────────────────────────────
    for (const side of [-1, 1]) {
      const hornBaseX = headCX + side * 9 * s;
      const hornBaseY = headCY - 10 * s;

      // Main thick horn arc (spiraling)
      ctx.strokeStyle = utils.rgb(HORN_COLOR);
      ctx.lineWidth = 5 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      // Outer spiral arc
      ctx.arc(
        hornBaseX + side * 5 * s,
        hornBaseY,
        9 * s,
        side === -1 ? Math.PI * 0.9 : Math.PI * 0.1,
        side === -1 ? Math.PI * 2.1 : Math.PI * -0.1 + Math.PI,
        side === 1
      );
      ctx.stroke();

      // Second smaller spiral
      ctx.lineWidth = 3 * s;
      ctx.beginPath();
      ctx.arc(
        hornBaseX + side * 6 * s,
        hornBaseY - 2 * s,
        5 * s,
        side === -1 ? Math.PI * 1.1 : Math.PI * -0.1,
        side === -1 ? Math.PI * 1.9 : Math.PI * 1.1,
        side === -1
      );
      ctx.stroke();

      // Ridge ticks on horn
      ctx.strokeStyle = utils.rgb(utils.lighten(HORN_COLOR, 20), 0.5);
      ctx.lineWidth = 0.8 * s;
      for (let ri = 0; ri < 6; ri++) {
        const rAngle = (side === -1 ? Math.PI * 0.9 : Math.PI * 0.1) + ri * (Math.PI * 0.2) * side;
        const rBaseX = hornBaseX + side * 5 * s + Math.cos(rAngle) * 9 * s;
        const rBaseY = hornBaseY + Math.sin(rAngle) * 9 * s;
        const rPerpAngle = rAngle + Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(rBaseX + Math.cos(rPerpAngle) * 2 * s, rBaseY + Math.sin(rPerpAngle) * 2 * s);
        ctx.lineTo(rBaseX - Math.cos(rPerpAngle) * 2 * s, rBaseY - Math.sin(rPerpAngle) * 2 * s);
        ctx.stroke();
      }
    }

    // ── Burning red eyes with vertical slit pupils ────────────────────────────
    for (const side of [-1, 1]) {
      const ex = headCX + side * 5 * s;
      const ey = headCY - 2 * s;

      // Outer glow
      const eyeGlow = ctx.createRadialGradient(ex, ey, 0, ex, ey, 5 * s);
      eyeGlow.addColorStop(0, `rgba(255,0,68,${0.7 + runeGlow * 0.3})`);
      eyeGlow.addColorStop(0.5, `rgba(255,0,68,${0.3 + runeGlow * 0.15})`);
      eyeGlow.addColorStop(1, 'rgba(255,0,68,0)');
      ctx.fillStyle = eyeGlow;
      utils.fillCircle(ctx, ex, ey, 5 * s);

      // Eye socket
      ctx.fillStyle = '#050208';
      utils.fillEllipse(ctx, ex, ey, 3.5 * s, 3 * s);

      // Iris — red radial gradient
      const irisGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 3 * s);
      irisGrad.addColorStop(0, '#ff4466');
      irisGrad.addColorStop(0.4, utils.rgb(EYE_COLOR));
      irisGrad.addColorStop(1, '#660010');
      ctx.fillStyle = irisGrad;
      utils.fillEllipse(ctx, ex, ey, 3 * s, 2.6 * s);

      // Vertical slit pupil
      ctx.fillStyle = '#050208';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 0.9 * s, 2 * s, 0, 0, Math.PI * 2);
      ctx.fill();

      // White highlight
      ctx.fillStyle = 'rgba(255,200,200,0.7)';
      utils.fillCircle(ctx, ex - 0.7 * s, ey - 0.8 * s, 0.8 * s);
    }

    // ── Fanged mouth ──────────────────────────────────────────────────────────
    const mouthY = headCY + 6 * s;
    const mouthOpen = act === 'attack' ? t * 0.5 : (act === 'idle' ? Math.abs(Math.sin(phase)) * 0.15 : 0.1);

    ctx.strokeStyle = utils.rgb(SKIN_DARK);
    ctx.lineWidth = 1.5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(headCX - 7 * s, mouthY);
    ctx.quadraticCurveTo(headCX, mouthY + 3 * s + mouthOpen * 4 * s, headCX + 7 * s, mouthY);
    ctx.stroke();

    // Large fangs
    ctx.fillStyle = '#e8d8d0';
    const fangPositions = [-4.5, -1.5, 1.5, 4.5];
    for (let fi = 0; fi < fangPositions.length; fi++) {
      const fx = headCX + fangPositions[fi] * s;
      const fh = (fi === 0 || fi === 3) ? (4 + mouthOpen * 3) * s : (3 + mouthOpen * 2) * s;
      ctx.beginPath();
      ctx.moveTo(fx - 1.5 * s, mouthY);
      ctx.lineTo(fx, mouthY + fh);
      ctx.lineTo(fx + 1.5 * s, mouthY);
      ctx.closePath();
      ctx.fill();
    }

    // ── Heavy barbed tail ─────────────────────────────────────────────────────
    const tailBaseX = torsoX - 7 * s;
    const tailBaseY = baseY - 20 * s + bodyOffsetY;
    const tailWag = Math.sin(phase) * 5 * s;

    ctx.strokeStyle = utils.rgb(SKIN_MID);
    ctx.lineWidth = 6 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tailBaseX, tailBaseY);
    ctx.quadraticCurveTo(
      tailBaseX - 16 * s + tailWag,
      tailBaseY + 12 * s,
      tailBaseX - 18 * s + tailWag,
      tailBaseY + 4 * s
    );
    ctx.stroke();

    // Triangle barbs
    ctx.fillStyle = utils.rgb(SPIKE_COLOR);
    for (let bi = 0; bi < 5; bi++) {
      const bFrac = (bi + 1) / 6;
      const bx = tailBaseX - 2 * s + (-16 * s + tailWag) * bFrac;
      const by = tailBaseY + 12 * s * bFrac * (1 - bFrac) * 2.5 + 4 * s * bFrac;
      const barbSize = (2.5 - bi * 0.3) * s;
      ctx.beginPath();
      ctx.moveTo(bx, by - barbSize * 0.5);
      ctx.lineTo(bx - barbSize * 1.5, by - barbSize * 2);
      ctx.lineTo(bx + barbSize, by - barbSize * 0.5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  },
};
