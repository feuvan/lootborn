// src/graphics/sprites/monsters/DungeonBoss.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN_MID    = 0x1a0830;
const SKIN_DARK   = 0x080312;
const SKIN_LIGHT  = 0x2e1450;
const WING_COLOR  = 0x120628;
const HORN_COLOR  = 0x0a0316;
const EYE_COLOR   = 0xff0044;
const RUNE_COLOR  = 0xcc00ff;
const ARMOR_MID   = 0x1a0a2a;
const ARMOR_LIGHT = 0x2a1440;

export const DungeonBossDrawer: EntityDrawer = {
  key: 'monster_dungeon_boss',
  frameW: 80,
  frameH: 96,
  totalFrames: 20,

  drawFrame(ctx, frame, action, w, h, utils) {
    const act = action as MonsterAction;
    const s = w / 80;

    const frameCounts: Record<MonsterAction, number> = { idle: 4, walk: 6, attack: 4, hurt: 2, death: 4 };
    const count = frameCounts[act] || 4;
    const localFrame = frame % count;
    const t = count > 1 ? localFrame / (count - 1) : 0;
    const phase = (localFrame / count) * Math.PI * 2;

    let alpha = 1;
    let bodyOffsetX = 0;
    let bodyOffsetY = 0;
    let wingSpread = 0.5;
    let attackLunge = 0;
    let globalRot = 0;
    let runeGlow = 0.5 + Math.sin(phase * 1.5) * 0.3;

    switch (act) {
      case 'idle':
        bodyOffsetY = Math.sin(phase) * 1.5 * s;
        wingSpread = 0.5 + Math.sin(phase) * 0.1;
        break;
      case 'walk':
        bodyOffsetX = Math.sin(phase) * 2.5 * s;
        bodyOffsetY = -Math.abs(Math.sin(phase)) * 2 * s;
        wingSpread = 0.55 + Math.abs(Math.sin(phase)) * 0.15;
        break;
      case 'attack':
        attackLunge = t;
        bodyOffsetX = t * 10 * s;
        bodyOffsetY = -t * 4 * s;
        wingSpread = 0.8 + t * 0.5;
        runeGlow = 0.8 + t * 0.2;
        break;
      case 'hurt':
        bodyOffsetX = -t * 6 * s;
        alpha = 0.7 + t * 0.3;
        runeGlow = 1;
        break;
      case 'death':
        globalRot = t * Math.PI * 0.3;
        bodyOffsetY = t * h * 0.35;
        alpha = 1 - t * 0.8;
        wingSpread = 0.3 - t * 0.3;
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
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    utils.fillEllipse(ctx, cx + bodyOffsetX, baseY + 1 * s, 20 * s, 5 * s);

    // Legs
    for (const side of [-1, 1]) {
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const hipX = cx + side * 7 * s + bodyOffsetX;
      const hipY = baseY - 22 * s + bodyOffsetY;
      const kneeX = hipX + side * 3 * s + Math.sin(legPhase) * 3 * s;
      const kneeY = hipY + 10 * s;
      const footX = kneeX + Math.sin(legPhase) * 2 * s;
      const footY = baseY - 1 * s;
      utils.drawLimb(ctx, [{ x: hipX, y: hipY }, { x: kneeX, y: kneeY }, { x: footX, y: footY }], 5 * s, SKIN_DARK);
      ctx.fillStyle = utils.rgb(HORN_COLOR);
      utils.fillEllipse(ctx, footX, footY, 4 * s, 2 * s);
    }

    // Wings (behind body)
    const wingBaseX = cx + bodyOffsetX;
    const wingBaseY = baseY - 50 * s + bodyOffsetY;
    for (const side of [-1, 1]) {
      const wSpan = (25 + wingSpread * 15) * s;
      const wH = (18 + wingSpread * 10) * s;
      ctx.fillStyle = utils.rgb(WING_COLOR, 0.7);
      ctx.beginPath();
      ctx.moveTo(wingBaseX, wingBaseY);
      ctx.quadraticCurveTo(wingBaseX + side * wSpan * 0.5, wingBaseY - wH * 1.3, wingBaseX + side * wSpan, wingBaseY - wH * 0.7);
      ctx.quadraticCurveTo(wingBaseX + side * wSpan * 0.9, wingBaseY - wH * 0.2, wingBaseX + side * wSpan * 0.5, wingBaseY + wH * 0.3);
      ctx.lineTo(wingBaseX + side * 4 * s, wingBaseY);
      ctx.closePath();
      ctx.fill();
      // Wing bone
      ctx.strokeStyle = utils.rgb(utils.darken(WING_COLOR, 20), 0.5);
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.moveTo(wingBaseX, wingBaseY);
      ctx.lineTo(wingBaseX + side * wSpan * 0.7, wingBaseY - wH * 0.9);
      ctx.stroke();
    }

    // Torso with armor plates
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 42 * s + bodyOffsetY;

    utils.zoneEntityOutline(ctx, w, h);

    const torsoGrad = ctx.createRadialGradient(torsoX - 3 * s, torsoY - 4 * s, 0, torsoX, torsoY, 18 * s);
    torsoGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    torsoGrad.addColorStop(0.5, utils.rgb(SKIN_MID));
    torsoGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = torsoGrad;
    utils.fillEllipse(ctx, torsoX, torsoY, 14 * s, 18 * s);

    // Armor shoulder plates
    for (const side of [-1, 1]) {
      const spX = torsoX + side * 12 * s;
      const spY = torsoY - 10 * s;
      const armorGrad = ctx.createRadialGradient(spX, spY - 2 * s, 0, spX, spY, 6 * s);
      armorGrad.addColorStop(0, utils.rgb(ARMOR_LIGHT));
      armorGrad.addColorStop(1, utils.rgb(ARMOR_MID));
      ctx.fillStyle = armorGrad;
      utils.fillEllipse(ctx, spX, spY, 6 * s, 5 * s);
      // Spike
      ctx.fillStyle = utils.rgb(HORN_COLOR);
      ctx.beginPath();
      ctx.moveTo(spX + side * 3 * s, spY - 3 * s);
      ctx.lineTo(spX + side * 7 * s, spY - 8 * s);
      ctx.lineTo(spX + side * 4 * s, spY);
      ctx.closePath();
      ctx.fill();
    }

    utils.softOutlineEnd(ctx);

    // Void runes on torso
    const runePositions = [
      { x: torsoX, y: torsoY - 8 * s },
      { x: torsoX - 4 * s, y: torsoY },
      { x: torsoX + 4 * s, y: torsoY },
      { x: torsoX, y: torsoY + 6 * s },
    ];
    for (const rp of runePositions) {
      const rg = ctx.createRadialGradient(rp.x, rp.y, 0, rp.x, rp.y, 3 * s);
      rg.addColorStop(0, utils.rgb(RUNE_COLOR, runeGlow));
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      utils.fillCircle(ctx, rp.x, rp.y, 3 * s);
    }

    // Arms
    for (const side of [-1, 1]) {
      const shoulderX = torsoX + side * 13 * s;
      const shoulderY = torsoY - 10 * s;
      let elbowX: number, elbowY: number, handX: number, handY: number;
      if (side === 1 && act === 'attack') {
        elbowX = shoulderX + 6 * s + attackLunge * 5 * s;
        elbowY = shoulderY + 4 * s - attackLunge * 8 * s;
        handX = elbowX + 5 * s;
        handY = elbowY - attackLunge * 5 * s;
      } else {
        const armPhase = act === 'walk' ? phase + (side === 1 ? Math.PI : 0) : 0;
        elbowX = shoulderX + side * 4 * s + Math.sin(armPhase) * 2 * s;
        elbowY = shoulderY + 8 * s;
        handX = elbowX + side * 4 * s;
        handY = elbowY + 8 * s + Math.sin(armPhase) * 2 * s;
      }
      utils.drawLimb(ctx, [{ x: shoulderX, y: shoulderY }, { x: elbowX, y: elbowY }, { x: handX, y: handY }], 4 * s, SKIN_DARK);
      // Claws
      ctx.strokeStyle = utils.rgb(HORN_COLOR);
      ctx.lineWidth = 1.2 * s;
      ctx.lineCap = 'round';
      for (let ci = -1; ci <= 1; ci++) {
        ctx.beginPath();
        ctx.moveTo(handX + ci * 2 * s, handY);
        ctx.lineTo(handX + ci * 3 * s + side * 1.5 * s, handY + 4 * s);
        ctx.stroke();
      }
    }

    // Head
    const headCX = torsoX;
    const headCY = torsoY - 22 * s;
    const headRX = 11 * s;
    const headRY = 10 * s;

    utils.zoneEntityRimLight(ctx, headCX, headCY, headRX, headRY);

    const headGrad = ctx.createRadialGradient(headCX - 3 * s, headCY - 3 * s, 0, headCX, headCY, headRX);
    headGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    headGrad.addColorStop(0.5, utils.rgb(SKIN_MID));
    headGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = headGrad;
    utils.fillEllipse(ctx, headCX, headCY, headRX, headRY);

    // Large curved horns
    for (const side of [-1, 1]) {
      ctx.strokeStyle = utils.rgb(HORN_COLOR);
      ctx.lineWidth = 3 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(headCX + side * 8 * s, headCY - 6 * s, 8 * s,
        side === -1 ? Math.PI * 0.1 : Math.PI * 0.9,
        side === -1 ? Math.PI * 0.8 : Math.PI * 1.1 + Math.PI * 0.7,
        side === 1);
      ctx.stroke();
    }

    // Eyes — burning crimson
    for (const side of [-1, 1]) {
      const ex = headCX + side * 4 * s;
      const ey = headCY - 1 * s;
      ctx.fillStyle = '#0a0204';
      utils.fillEllipse(ctx, ex, ey, 3.5 * s, 2.5 * s);
      const eyeGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 3 * s);
      eyeGrad.addColorStop(0, utils.rgb(utils.lighten(EYE_COLOR, 30)));
      eyeGrad.addColorStop(0.5, utils.rgb(EYE_COLOR));
      eyeGrad.addColorStop(1, utils.rgb(utils.darken(EYE_COLOR, 30)));
      ctx.fillStyle = eyeGrad;
      utils.fillEllipse(ctx, ex, ey, 3 * s, 2 * s);
      ctx.fillStyle = '#0a0204';
      utils.fillEllipse(ctx, ex, ey, 1.5 * s, 1.8 * s);
      ctx.fillStyle = 'rgba(255,100,100,0.6)';
      utils.fillCircle(ctx, ex - 0.5 * s, ey - 0.5 * s, 0.6 * s);
    }

    // Crown/crest between horns
    const crownGrad = ctx.createRadialGradient(headCX, headCY - headRY, 0, headCX, headCY - headRY, 5 * s);
    crownGrad.addColorStop(0, utils.rgb(RUNE_COLOR, runeGlow * 0.8));
    crownGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = crownGrad;
    utils.fillCircle(ctx, headCX, headCY - headRY, 5 * s);

    ctx.restore();
  },
};
