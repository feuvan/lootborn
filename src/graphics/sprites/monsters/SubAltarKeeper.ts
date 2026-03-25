// src/graphics/sprites/monsters/SubAltarKeeper.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const ROBE_MID   = 0x2a0a1a;
const ROBE_DARK  = 0x140510;
const ROBE_LIGHT = 0x3e1428;
const SIGIL_COLOR = 0xff2244;
const EYE_COLOR  = 0xff4466;
const CANDLE     = 0xffaa44;

export const SubAltarKeeperDrawer: EntityDrawer = {
  key: 'monster_sub_altar_keeper',
  frameW: 56,
  frameH: 68,
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
    let bodyOffsetX = 0;
    let bodyOffsetY = 0;
    let castGlow = 0.4;
    let globalRot = 0;

    switch (act) {
      case 'idle':
        bodyOffsetY = Math.sin(phase) * 1.5 * s;
        castGlow = 0.4 + Math.sin(phase) * 0.15;
        break;
      case 'walk':
        bodyOffsetX = Math.sin(phase) * 1.5 * s;
        bodyOffsetY = Math.sin(phase * 0.7) * 2 * s;
        break;
      case 'attack':
        bodyOffsetY = -t * 3 * s;
        castGlow = 0.7 + t * 0.3;
        break;
      case 'hurt':
        bodyOffsetX = -t * 4 * s;
        alpha = 0.6 + t * 0.4;
        break;
      case 'death':
        globalRot = t * 0.35;
        bodyOffsetY = t * h * 0.3;
        alpha = 1 - t * 0.85;
        break;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = w / 2;
    const baseY = h * 0.92;

    ctx.translate(cx, baseY);
    ctx.rotate(globalRot);
    ctx.translate(-cx, -baseY);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    utils.fillEllipse(ctx, cx + bodyOffsetX, baseY + 1 * s, 12 * s, 3 * s);

    // Floating candles around body
    for (let i = 0; i < 3; i++) {
      const cAngle = (i / 3) * Math.PI * 2 + phase * 0.4;
      const cDist = 14 * s;
      const cX = cx + bodyOffsetX + Math.cos(cAngle) * cDist;
      const cY = baseY - 28 * s + bodyOffsetY + Math.sin(cAngle) * 4 * s + Math.sin(phase + i) * 2 * s;

      // Candle stick
      ctx.fillStyle = '#e8d8b0';
      ctx.fillRect(cX - 0.8 * s, cY, 1.6 * s, 5 * s);

      // Flame
      const fGlow = ctx.createRadialGradient(cX, cY - 1 * s, 0, cX, cY - 1 * s, 3 * s);
      fGlow.addColorStop(0, utils.rgb(CANDLE, 0.7));
      fGlow.addColorStop(0.5, utils.rgb(CANDLE, 0.3));
      fGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fGlow;
      utils.fillCircle(ctx, cX, cY - 1 * s, 3 * s);
      ctx.fillStyle = utils.rgb(CANDLE, 0.9);
      utils.fillEllipse(ctx, cX, cY - 1 * s, 1 * s, 2 * s);
    }

    // Robe body
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 22 * s + bodyOffsetY;

    utils.zoneEntityOutline(ctx, w, h);

    const robeGrad = ctx.createRadialGradient(torsoX, torsoY - 4 * s, 0, torsoX, torsoY + 10 * s, 16 * s);
    robeGrad.addColorStop(0, utils.rgb(ROBE_LIGHT));
    robeGrad.addColorStop(0.5, utils.rgb(ROBE_MID));
    robeGrad.addColorStop(1, utils.rgb(ROBE_DARK));
    ctx.fillStyle = robeGrad;
    ctx.beginPath();
    ctx.moveTo(torsoX - 8 * s, torsoY - 12 * s);
    ctx.quadraticCurveTo(torsoX - 11 * s, torsoY + 5 * s, torsoX - 9 * s, baseY - 2 * s);
    ctx.lineTo(torsoX + 9 * s, baseY - 2 * s);
    ctx.quadraticCurveTo(torsoX + 11 * s, torsoY + 5 * s, torsoX + 8 * s, torsoY - 12 * s);
    ctx.closePath();
    ctx.fill();

    utils.softOutlineEnd(ctx);

    // Demonic sigils on robe
    const sigilPositions = [
      { x: torsoX, y: torsoY - 4 * s },
      { x: torsoX - 3 * s, y: torsoY + 4 * s },
      { x: torsoX + 3 * s, y: torsoY + 4 * s },
    ];
    for (const sp of sigilPositions) {
      const sg = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, 2.5 * s);
      sg.addColorStop(0, utils.rgb(SIGIL_COLOR, castGlow * 0.7));
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg;
      utils.fillCircle(ctx, sp.x, sp.y, 2.5 * s);
      // Small sigil mark
      ctx.strokeStyle = utils.rgb(SIGIL_COLOR, castGlow);
      ctx.lineWidth = 0.8 * s;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 1.5 * s, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Arms (hands emerging from robe, ritual gesture)
    for (const side of [-1, 1]) {
      const handX = torsoX + side * 10 * s;
      const handY = torsoY + (act === 'attack' ? -2 * s - t * 5 * s : 2 * s);
      ctx.fillStyle = utils.rgb(0x604040, 0.7);
      utils.fillEllipse(ctx, handX, handY, 2.5 * s, 2 * s);
      // Cast glow on hands during attack
      if (act === 'attack') {
        const hg = ctx.createRadialGradient(handX, handY, 0, handX, handY, 4 * s);
        hg.addColorStop(0, utils.rgb(SIGIL_COLOR, castGlow * 0.5));
        hg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hg;
        utils.fillCircle(ctx, handX, handY, 4 * s);
      }
    }

    // Hooded head
    const headCX = torsoX;
    const headCY = torsoY - 16 * s;
    const headRX = 9 * s;
    const headRY = 9 * s;

    utils.zoneEntityRimLight(ctx, headCX, headCY, headRX, headRY);

    // Hood
    const hoodGrad = ctx.createRadialGradient(headCX, headCY - 2 * s, 0, headCX, headCY, headRX + 2 * s);
    hoodGrad.addColorStop(0, utils.rgb(ROBE_LIGHT));
    hoodGrad.addColorStop(0.5, utils.rgb(ROBE_MID));
    hoodGrad.addColorStop(1, utils.rgb(ROBE_DARK));
    ctx.fillStyle = hoodGrad;
    utils.fillEllipse(ctx, headCX, headCY, headRX + 2 * s, headRY + 1 * s);

    // Dark face under hood
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    utils.fillEllipse(ctx, headCX, headCY + 1 * s, 6 * s, 5 * s);

    // Horns (small, corrupted)
    for (const side of [-1, 1]) {
      ctx.strokeStyle = utils.rgb(0x2a0a10);
      ctx.lineWidth = 2 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(headCX + side * 6 * s, headCY - 4 * s);
      ctx.lineTo(headCX + side * 8 * s, headCY - 10 * s);
      ctx.stroke();
    }

    // Glowing eyes
    for (const side of [-1, 1]) {
      const ex = headCX + side * 2.5 * s;
      const ey = headCY + 1 * s;
      ctx.fillStyle = utils.rgb(EYE_COLOR, 0.9);
      utils.fillCircle(ctx, ex, ey, 1.5 * s);
      const eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 3 * s);
      eg.addColorStop(0, utils.rgb(EYE_COLOR, 0.4));
      eg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = eg;
      utils.fillCircle(ctx, ex, ey, 3 * s);
    }

    ctx.restore();
  },
};
