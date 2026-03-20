// src/graphics/sprites/npcs/ForestHermit.ts
import type { EntityDrawer, NPCAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN        = 0x83714f;
const SKIN_DARK   = 0x695734;
const SKIN_LIGHT  = 0x977e5c;
const HAIR        = 0x646457;   // grey/white wild hair
const HAIR_LIGHT  = 0x7e7e71;
const CLOAK       = 0x303d22;
const CLOAK_DARK  = 0x223015;
const CLOAK_MOSS  = 0x3d5730;
const STAFF_WOOD  = 0x3d3015;
const CRYSTAL     = 0x50a050;   // green crystal
const CRYSTAL_GLO = 0x80d080;
const BOOT        = 0x2a1a0a;

export const ForestHermitDrawer: EntityDrawer = {
  key: 'npc_forest_hermit',
  frameW: 80,
  frameH: 120,
  totalFrames: 24,

  drawFrame(ctx, frame, action, w, h, utils) {
    const act = action as NPCAction;
    const s = w / 80;

    const frameCounts: Record<NPCAction, number> = {
      working: 8, alert: 4, idle: 6, talking: 6,
    };
    const count = frameCounts[act] || 6;
    const t = count > 1 ? frame / (count - 1) : 0;
    const phase = (frame / count) * Math.PI * 2;

    const cx = w / 2;
    const ground = h * 0.96;

    let bob = 0;
    let bodyLean = 0;
    let headTilt = 0;
    let leftArmY = 0;
    let staffSway = 0;
    let staffLow = false;
    let mouthOpen = false;
    let eyebrowRaise = 0;

    switch (act) {
      case 'working': {
        // Tending herbs — bending down and up
        bob = Math.sin(phase) * 4 * s;
        bodyLean = Math.sin(phase) * 4 * s;
        leftArmY = 8 * s + Math.sin(phase) * 4 * s;
        staffLow = true;
        staffSway = Math.sin(phase) * 0.05;
        headTilt = 0.1 + Math.sin(phase) * 0.05;
        break;
      }
      case 'alert': {
        // Straightens up, looks around
        bob = -t * 3 * s;
        bodyLean = 0;
        headTilt = -t * 0.05;
        eyebrowRaise = 1 + t * 2;
        staffLow = false;
        break;
      }
      case 'idle': {
        bob = Math.sin(phase) * 1 * s;
        bodyLean = Math.sin(phase * 0.5) * 1 * s;
        leftArmY = Math.sin(phase) * 1.5 * s;
        staffSway = Math.sin(phase) * 0.03;
        headTilt = Math.sin(phase + 1) * 0.012;
        break;
      }
      case 'talking': {
        // Gestures with crystal staff
        bob = Math.sin(phase) * 1 * s;
        bodyLean = -1 * s + Math.sin(phase) * 1.5 * s;
        leftArmY = Math.sin(phase * 2) * 7 * s;
        staffSway = -0.2 + Math.sin(phase * 2) * 0.15;
        headTilt = Math.sin(phase * 1.5) * 0.025;
        mouthOpen = Math.sin(phase * 3) > 0.25;
        eyebrowRaise = Math.sin(phase * 2) > 0 ? 1 : 0;
        break;
      }
    }

    ctx.save();
    const by = ground + bob;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.26)';
    utils.fillEllipse(ctx, cx, ground + 3 * s, 19 * s, 4 * s);

    // ── Boots ──
    for (const side of [-1, 1]) {
      utils.drawPart(ctx, cx + side * 6 * s - 4 * s, by - 5 * s, 8 * s, 6 * s, BOOT, 2 * s);
    }

    // Soft outline glow (green — forest NPC)
    utils.softOutline(ctx, 'rgba(80,140,60,0.15)', 5);

    // ── Mossy patched cloak (full body) ──
    ctx.fillStyle = utils.rgb(CLOAK);
    ctx.beginPath();
    ctx.moveTo(cx - 13 * s + bodyLean, by - 48 * s);
    ctx.lineTo(cx - 16 * s + bodyLean, by);
    ctx.lineTo(cx + 16 * s + bodyLean, by);
    ctx.lineTo(cx + 13 * s + bodyLean, by - 48 * s);
    ctx.closePath();
    ctx.fill();
    utils.drawPart(ctx, cx - 13 * s + bodyLean, by - 48 * s, 26 * s, 46 * s, CLOAK, 4 * s);
    // Patchy moss texture
    utils.drawLeatherTexture(ctx, cx - 12 * s + bodyLean, by - 46 * s, 24 * s, 44 * s, CLOAK_MOSS);
    // Random moss patches
    for (let i = 0; i < 5; i++) {
      const mx = cx + (utils.hash2d(i * 7, 3) - 0.5) * 18 * s + bodyLean;
      const my = by - 40 * s + utils.hash2d(i * 11, 7) * 32 * s;
      ctx.fillStyle = utils.rgb(CLOAK_MOSS, 0.4);
      utils.fillEllipse(ctx, mx, my, 3 * s, 2 * s);
    }

    // End soft outline
    utils.softOutlineEnd(ctx);

    // ── Left arm ──
    const laX = cx - 17 * s + bodyLean;
    const laBaseY = by - 44 * s;
    utils.drawLimb(ctx, [
      { x: laX + 4 * s, y: laBaseY },
      { x: laX + 3 * s, y: laBaseY + 9 * s },
      { x: laX + 3 * s, y: laBaseY + 16 * s + leftArmY },
    ], 4 * s, CLOAK);
    ctx.fillStyle = utils.rgb(SKIN);
    utils.fillCircle(ctx, laX + 3 * s, laBaseY + 16 * s + leftArmY, 3.5 * s);

    // ── Crystal staff in right hand ──
    const raX = cx + 14 * s + bodyLean;
    const raBaseY = by - 44 * s;
    const staffAnchorX = raX;
    const staffAnchorY = raBaseY + 17 * s;
    const staffTopOffset = staffLow ? 30 * s : 44 * s;
    const staffTopX = staffAnchorX + Math.sin(staffSway) * 10 * s;
    const staffTopY = staffAnchorY - staffTopOffset;
    const staffBotX = staffAnchorX - Math.sin(staffSway) * 4 * s;
    const staffBotY = staffAnchorY + 6 * s;

    // Staff shaft (knobbly old wood)
    ctx.strokeStyle = utils.rgb(STAFF_WOOD);
    ctx.lineWidth = 3.5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(staffBotX, staffBotY);
    ctx.lineTo(staffAnchorX, staffAnchorY);
    ctx.lineTo(staffTopX, staffTopY);
    ctx.stroke();
    // Knot on shaft
    ctx.fillStyle = utils.rgb(utils.lighten(STAFF_WOOD, 15), 0.6);
    utils.fillEllipse(ctx, staffAnchorX, staffAnchorY - 10 * s, 3 * s, 2 * s);

    // Green crystal cluster atop
    const crystalY = staffTopY;
    const crystalX = staffTopX;
    // Crystal glow aura
    const glowGrad = ctx.createRadialGradient(crystalX, crystalY, 0, crystalX, crystalY, 9 * s);
    glowGrad.addColorStop(0, utils.rgb(CRYSTAL_GLO, 0.4));
    glowGrad.addColorStop(0.5, utils.rgb(CRYSTAL_GLO, 0.15));
    glowGrad.addColorStop(1, utils.rgb(CRYSTAL_GLO, 0));
    ctx.fillStyle = glowGrad;
    utils.fillCircle(ctx, crystalX, crystalY, 9 * s);
    // Crystal facets
    for (let i = 0; i < 4; i++) {
      const ang = i * (Math.PI * 0.5) - Math.PI * 0.25;
      const cx2 = crystalX + Math.cos(ang) * 2.5 * s;
      const cy2 = crystalY + Math.sin(ang) * 2.5 * s;
      ctx.fillStyle = utils.rgb(i % 2 === 0 ? CRYSTAL : CRYSTAL_GLO);
      ctx.beginPath();
      ctx.moveTo(cx2, cy2 - 4 * s);
      ctx.lineTo(cx2 + 2 * s, cy2 + 2 * s);
      ctx.lineTo(cx2 - 2 * s, cy2 + 2 * s);
      ctx.closePath();
      ctx.fill();
    }
    // Center crystal
    ctx.fillStyle = utils.rgb(CRYSTAL_GLO);
    utils.fillCircle(ctx, crystalX, crystalY, 2.5 * s);

    // Right hand
    utils.drawLimb(ctx, [
      { x: raX, y: raBaseY },
      { x: staffAnchorX, y: raBaseY + 10 * s },
      { x: staffAnchorX, y: staffAnchorY },
    ], 4 * s, CLOAK);
    ctx.fillStyle = utils.rgb(SKIN);
    utils.fillCircle(ctx, staffAnchorX, staffAnchorY, 3.5 * s);

    // ── Neck ──
    ctx.fillStyle = utils.rgb(SKIN_DARK);
    utils.roundRect(ctx, cx - 4 * s + bodyLean * 0.3, by - 53 * s, 8 * s, 7 * s, 2 * s);
    ctx.fill();

    // ── Head ──
    const headX = cx + bodyLean * 0.3;
    const headY = by - 60 * s;

    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(headTilt);

    // Wild long grey hair
    ctx.fillStyle = utils.rgb(HAIR);
    // Wide, flowing top
    utils.roundRect(ctx, -12 * s, -13 * s, 24 * s, 13 * s, 4 * s);
    ctx.fill();
    // Long wild side falls
    ctx.fillStyle = utils.rgb(HAIR);
    // Left side — irregular
    ctx.beginPath();
    ctx.moveTo(-12 * s, -5 * s);
    ctx.lineTo(-16 * s, 10 * s);
    ctx.lineTo(-14 * s, 20 * s);
    ctx.lineTo(-8 * s, 5 * s);
    ctx.closePath();
    ctx.fill();
    // Right side — irregular
    ctx.beginPath();
    ctx.moveTo(12 * s, -5 * s);
    ctx.lineTo(16 * s, 10 * s);
    ctx.lineTo(14 * s, 20 * s);
    ctx.lineTo(8 * s, 5 * s);
    ctx.closePath();
    ctx.fill();
    // Hair highlight
    ctx.fillStyle = utils.rgb(HAIR_LIGHT, 0.3);
    ctx.fillRect(-6 * s, -12 * s, 5 * s, 4 * s);

    // Aged face
    const headGrad = ctx.createRadialGradient(-2 * s, -4 * s, 0, 0, 0, 13 * s);
    headGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    headGrad.addColorStop(0.5, utils.rgb(SKIN));
    headGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = headGrad;
    utils.roundRect(ctx, -10 * s, -9 * s, 20 * s, 18 * s, 5 * s);
    ctx.fill();

    // Wrinkles
    ctx.strokeStyle = utils.rgb(SKIN_DARK, 0.3);
    ctx.lineWidth = 0.6 * s;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const wy = -3 * s + i * 3 * s;
      ctx.beginPath();
      ctx.moveTo(-7 * s, wy); ctx.lineTo(-3 * s, wy - 0.4 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(7 * s, wy); ctx.lineTo(3 * s, wy - 0.4 * s);
      ctx.stroke();
    }

    // Hood tip of cloak on head
    ctx.fillStyle = utils.rgb(CLOAK, 0.5);
    utils.roundRect(ctx, -12 * s, -14 * s, 24 * s, 7 * s, 3 * s);
    ctx.fill();

    // Eyebrows (wild, bushy grey)
    const browY = -4.5 * s - eyebrowRaise * s;
    ctx.strokeStyle = utils.rgb(HAIR, 0.9);
    ctx.lineWidth = 2.2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8 * s, browY - 0.5 * s); ctx.lineTo(-2 * s, browY + 1 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8 * s, browY - 0.5 * s); ctx.lineTo(2 * s, browY + 1 * s);
    ctx.stroke();

    // Eyes (kind, wise)
    ctx.fillStyle = '#ddd8cc';
    utils.fillEllipse(ctx, -4.5 * s, -1 * s, 2.8 * s, 2.2 * s);
    utils.fillEllipse(ctx, 4.5 * s, -1 * s, 2.8 * s, 2.2 * s);
    ctx.fillStyle = '#2a2010';
    utils.fillEllipse(ctx, -4.5 * s, -1 * s, 1.7 * s, 1.8 * s);
    utils.fillEllipse(ctx, 4.5 * s, -1 * s, 1.7 * s, 1.8 * s);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    utils.fillCircle(ctx, -3.5 * s, -1.8 * s, 0.65 * s);
    utils.fillCircle(ctx, 5.5 * s, -1.8 * s, 0.65 * s);

    // Nose (prominent age)
    ctx.fillStyle = utils.rgb(SKIN_DARK, 0.45);
    utils.fillEllipse(ctx, 0, 2.5 * s, 2.5 * s, 2 * s);

    // Mouth
    if (mouthOpen) {
      ctx.fillStyle = '#3a1a0a';
      utils.fillEllipse(ctx, 0, 6.5 * s, 2.5 * s, 1.5 * s);
    } else {
      ctx.strokeStyle = utils.rgb(SKIN_DARK, 0.55);
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.moveTo(-3 * s, 6 * s);
      ctx.quadraticCurveTo(0, 7.5 * s, 3 * s, 6 * s);
      ctx.stroke();
    }

    // Wild untamed beard
    ctx.fillStyle = utils.rgb(HAIR);
    ctx.beginPath();
    ctx.moveTo(-9 * s, 7 * s);
    ctx.lineTo(9 * s, 7 * s);
    ctx.lineTo(8 * s, 16 * s);
    ctx.lineTo(3 * s, 22 * s);
    ctx.lineTo(-3 * s, 22 * s);
    ctx.lineTo(-8 * s, 16 * s);
    ctx.closePath();
    ctx.fill();
    // Wild beard wisps
    ctx.strokeStyle = utils.rgb(HAIR_LIGHT, 0.5);
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(-5 * s, 9 * s); ctx.lineTo(-7 * s, 19 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5 * s, 9 * s); ctx.lineTo(7 * s, 19 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 10 * s); ctx.lineTo(2 * s, 20 * s);
    ctx.stroke();

    ctx.restore(); // head
    ctx.restore(); // frame
  },
};
