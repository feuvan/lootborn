// src/graphics/sprites/monsters/DungeonMidBoss.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN_MID   = 0x2a1040;
const SKIN_DARK  = 0x140620;
const SKIN_LIGHT = 0x3e1a5a;
const ARMOR_MID  = 0x201038;
const ARMOR_LIGHT = 0x341a50;
const EYE_COLOR  = 0xff6600;
const WEAPON_COLOR = 0x443366;
const GLOW_COLOR = 0xaa44ff;

export const DungeonMidBossDrawer: EntityDrawer = {
  key: 'monster_dungeon_mid_boss',
  frameW: 64,
  frameH: 76,
  totalFrames: 20,

  drawFrame(ctx, frame, action, w, h, utils) {
    const act = action as MonsterAction;
    const s = w / 64;

    const frameCounts: Record<MonsterAction, number> = { idle: 4, walk: 6, attack: 4, hurt: 2, death: 4 };
    const count = frameCounts[act] || 4;
    const localFrame = frame % count;
    const t = count > 1 ? localFrame / (count - 1) : 0;
    const phase = (localFrame / count) * Math.PI * 2;

    let alpha = 1;
    let bodyOffsetX = 0;
    let bodyOffsetY = 0;
    let attackLunge = 0;
    let globalRot = 0;

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
        bodyOffsetX = t * 9 * s;
        bodyOffsetY = -t * 3 * s;
        break;
      case 'hurt':
        bodyOffsetX = -t * 5 * s;
        alpha = 0.7 + t * 0.3;
        break;
      case 'death':
        globalRot = t * Math.PI * 0.35;
        bodyOffsetY = t * h * 0.35;
        alpha = 1 - t * 0.8;
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
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    utils.fillEllipse(ctx, cx + bodyOffsetX, baseY + 1 * s, 16 * s, 4 * s);

    // Legs
    for (const side of [-1, 1]) {
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const hipX = cx + side * 6 * s + bodyOffsetX;
      const hipY = baseY - 18 * s + bodyOffsetY;
      const kneeX = hipX + side * 2 * s + Math.sin(legPhase) * 2.5 * s;
      const kneeY = hipY + 9 * s;
      const footX = kneeX + Math.sin(legPhase) * 1.5 * s;
      const footY = baseY - 1 * s;
      utils.drawLimb(ctx, [{ x: hipX, y: hipY }, { x: kneeX, y: kneeY }, { x: footX, y: footY }], 4 * s, SKIN_DARK);
      ctx.fillStyle = utils.rgb(SKIN_DARK);
      utils.fillEllipse(ctx, footX, footY, 3.5 * s, 1.5 * s);
    }

    // Torso (armored)
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 35 * s + bodyOffsetY;

    utils.zoneEntityOutline(ctx, w, h);

    // Skin base
    const skinGrad = ctx.createRadialGradient(torsoX, torsoY - 2 * s, 0, torsoX, torsoY, 14 * s);
    skinGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    skinGrad.addColorStop(0.5, utils.rgb(SKIN_MID));
    skinGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = skinGrad;
    utils.fillEllipse(ctx, torsoX, torsoY, 12 * s, 16 * s);

    // Armor chestplate overlay
    const armorGrad = ctx.createRadialGradient(torsoX, torsoY - 4 * s, 0, torsoX, torsoY, 10 * s);
    armorGrad.addColorStop(0, utils.rgb(ARMOR_LIGHT, 0.8));
    armorGrad.addColorStop(1, utils.rgb(ARMOR_MID, 0.6));
    ctx.fillStyle = armorGrad;
    utils.fillEllipse(ctx, torsoX, torsoY - 2 * s, 10 * s, 12 * s);

    // Shoulder plates
    for (const side of [-1, 1]) {
      const spX = torsoX + side * 11 * s;
      const spY = torsoY - 9 * s;
      ctx.fillStyle = utils.rgb(ARMOR_LIGHT);
      utils.fillEllipse(ctx, spX, spY, 5 * s, 4 * s);
      ctx.fillStyle = utils.rgb(ARMOR_MID);
      ctx.beginPath();
      ctx.moveTo(spX, spY - 4 * s);
      ctx.lineTo(spX + side * 6 * s, spY - 6 * s);
      ctx.lineTo(spX + side * 3 * s, spY);
      ctx.closePath();
      ctx.fill();
    }

    utils.softOutlineEnd(ctx);

    // Glowing weapon (right hand — a halberd/axe)
    const weaponBaseX = torsoX + 14 * s + (act === 'attack' ? attackLunge * 6 * s : 0);
    const weaponBaseY = torsoY - 5 * s + (act === 'attack' ? -attackLunge * 8 * s : 0);
    ctx.strokeStyle = utils.rgb(WEAPON_COLOR);
    ctx.lineWidth = 2.5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(weaponBaseX, weaponBaseY + 15 * s);
    ctx.lineTo(weaponBaseX, weaponBaseY - 10 * s);
    ctx.stroke();
    // Axe head
    ctx.fillStyle = utils.rgb(ARMOR_LIGHT);
    ctx.beginPath();
    ctx.moveTo(weaponBaseX, weaponBaseY - 8 * s);
    ctx.lineTo(weaponBaseX + 6 * s, weaponBaseY - 12 * s);
    ctx.lineTo(weaponBaseX + 7 * s, weaponBaseY - 6 * s);
    ctx.lineTo(weaponBaseX, weaponBaseY - 4 * s);
    ctx.closePath();
    ctx.fill();
    // Weapon glow
    const wGlow = ctx.createRadialGradient(weaponBaseX + 3 * s, weaponBaseY - 8 * s, 0, weaponBaseX + 3 * s, weaponBaseY - 8 * s, 5 * s);
    wGlow.addColorStop(0, utils.rgb(GLOW_COLOR, 0.5));
    wGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = wGlow;
    utils.fillCircle(ctx, weaponBaseX + 3 * s, weaponBaseY - 8 * s, 5 * s);

    // Arms
    for (const side of [-1, 1]) {
      const shoulderX = torsoX + side * 11 * s;
      const shoulderY = torsoY - 9 * s;
      let elbowX: number, elbowY: number, handX: number, handY: number;
      if (side === 1) {
        handX = weaponBaseX;
        handY = weaponBaseY + 5 * s;
        elbowX = (shoulderX + handX) / 2 + 3 * s;
        elbowY = (shoulderY + handY) / 2;
      } else {
        const armPhase = act === 'walk' ? phase : 0;
        elbowX = shoulderX + side * 4 * s + Math.sin(armPhase) * 2 * s;
        elbowY = shoulderY + 6 * s;
        handX = elbowX + side * 3 * s;
        handY = elbowY + 7 * s;
      }
      utils.drawLimb(ctx, [{ x: shoulderX, y: shoulderY }, { x: elbowX, y: elbowY }, { x: handX, y: handY }], 3.5 * s, SKIN_DARK);
    }

    // Head
    const headCX = torsoX;
    const headCY = torsoY - 20 * s;
    const headRX = 9 * s;
    const headRY = 8 * s;

    utils.zoneEntityRimLight(ctx, headCX, headCY, headRX, headRY);

    const headGrad = ctx.createRadialGradient(headCX - 2 * s, headCY - 2 * s, 0, headCX, headCY, headRX);
    headGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    headGrad.addColorStop(0.5, utils.rgb(SKIN_MID));
    headGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = headGrad;
    utils.fillEllipse(ctx, headCX, headCY, headRX, headRY);

    // Helmet crest
    ctx.fillStyle = utils.rgb(ARMOR_LIGHT);
    ctx.beginPath();
    ctx.moveTo(headCX - 3 * s, headCY - headRY);
    ctx.lineTo(headCX, headCY - headRY - 6 * s);
    ctx.lineTo(headCX + 3 * s, headCY - headRY);
    ctx.closePath();
    ctx.fill();

    // Eyes
    for (const side of [-1, 1]) {
      const ex = headCX + side * 3.5 * s;
      const ey = headCY;
      ctx.fillStyle = utils.rgb(EYE_COLOR);
      utils.fillEllipse(ctx, ex, ey, 2 * s, 1.5 * s);
      const eyeGlow = ctx.createRadialGradient(ex, ey, 0, ex, ey, 3 * s);
      eyeGlow.addColorStop(0, utils.rgb(EYE_COLOR, 0.35));
      eyeGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = eyeGlow;
      utils.fillCircle(ctx, ex, ey, 3 * s);
    }

    ctx.restore();
  },
};
