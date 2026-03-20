// src/graphics/sprites/npcs/QuestElder.ts
import type { EntityDrawer, NPCAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN        = 0x9d7d5c;
const SKIN_DARK   = 0x7e6242;
const SKIN_LIGHT  = 0xb1976f;
const HAIR        = 0x7e7676;   // grey
const HAIR_DARK   = 0x625c5c;
const ROBE        = 0x4a4a22;   // sage robe
const ROBE_LIGHT  = 0x646430;
const ROBE_TRIM   = 0xb8860b;   // gold
const BELT        = 0x303015;
const BOOT        = 0x2a1a0a;
const STAFF_WOOD  = 0x3d2714;
const STAFF_ORB   = 0xd4a020;   // golden orb

export const QuestElderDrawer: EntityDrawer = {
  key: 'npc_quest_elder',
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
    let mouthOpen = false;
    let eyebrowRaise = 0;
    let staffRaised = false;
    let eyesClosed = false;

    switch (act) {
      case 'working': {
        // Meditating — very gentle sway, staff upright
        bob = Math.sin(phase) * 0.5 * s;
        bodyLean = Math.sin(phase) * 0.5 * s;
        leftArmY = Math.sin(phase) * 1 * s;
        staffSway = Math.sin(phase) * 0.02;  // subtle staff sway
        eyesClosed = true;
        headTilt = Math.sin(phase * 0.5) * 0.01;
        break;
      }
      case 'alert': {
        // Eyes open, grips staff
        bob = 0;
        bodyLean = 0;
        headTilt = -t * 0.04;
        eyebrowRaise = 2 + t * 1.5;
        staffSway = 0;
        eyesClosed = false;
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
        // Raises staff, gestures with free hand
        bob = Math.sin(phase) * 0.8 * s;
        bodyLean = -1.5 * s + Math.sin(phase) * 1 * s;
        leftArmY = Math.sin(phase * 2) * 7 * s;
        staffSway = -0.15 + Math.sin(phase) * 0.1;  // staff raised and gesturing
        staffRaised = true;
        headTilt = Math.sin(phase * 1.5) * 0.03;
        mouthOpen = Math.sin(phase * 3) > 0.2;
        eyebrowRaise = Math.sin(phase * 2) > 0 ? 1.5 : 0;
        break;
      }
    }

    ctx.save();
    const by = ground + bob;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    utils.fillEllipse(ctx, cx, ground + 3 * s, 19 * s, 4 * s);

    // ── Boots ──
    for (const side of [-1, 1]) {
      utils.drawPart(ctx, cx + side * 6 * s - 4 * s, by - 5 * s, 8 * s, 6 * s, BOOT, 2 * s);
    }

    // Soft outline glow (warm — NPC)
    utils.softOutline(ctx, 'rgba(180,150,100,0.15)', 5);

    // ── Robe (full length) ──
    ctx.fillStyle = utils.rgb(ROBE);
    ctx.beginPath();
    ctx.moveTo(cx - 12 * s + bodyLean, by - 48 * s);
    ctx.lineTo(cx - 14 * s + bodyLean, by);
    ctx.lineTo(cx + 14 * s + bodyLean, by);
    ctx.lineTo(cx + 12 * s + bodyLean, by - 48 * s);
    ctx.closePath();
    ctx.fill();
    utils.drawPart(ctx, cx - 12 * s + bodyLean, by - 48 * s, 24 * s, 46 * s, ROBE, 4 * s);
    // Robe light strip
    ctx.fillStyle = utils.rgb(ROBE_LIGHT, 0.25);
    ctx.fillRect(cx - 1.5 * s + bodyLean, by - 46 * s, 3 * s, 42 * s);
    // Gold trim
    ctx.fillStyle = utils.rgb(ROBE_TRIM, 0.6);
    ctx.fillRect(cx - 13 * s + bodyLean, by - 2 * s, 26 * s, 2 * s);
    ctx.fillRect(cx - 12 * s + bodyLean, by - 48 * s, 2 * s, 46 * s);
    ctx.fillRect(cx + 10 * s + bodyLean, by - 48 * s, 2 * s, 46 * s);

    // ── Belt sash ──
    utils.drawPart(ctx, cx - 12 * s + bodyLean, by - 28 * s, 24 * s, 4 * s, BELT, 1 * s);

    // End soft outline
    utils.softOutlineEnd(ctx);

    // ── Left arm ──
    const laX = cx - 16 * s + bodyLean;
    const laBaseY = by - 45 * s;
    utils.drawLimb(ctx, [
      { x: laX + 3 * s, y: laBaseY },
      { x: laX + 2 * s, y: laBaseY + 10 * s },
      { x: laX + 2 * s, y: laBaseY + 17 * s + leftArmY },
    ], 4 * s, ROBE);
    ctx.fillStyle = utils.rgb(SKIN);
    utils.fillCircle(ctx, laX + 2 * s, laBaseY + 17 * s + leftArmY, 3.5 * s);

    // ── Staff in right hand ──
    const raX = cx + 14 * s + bodyLean;
    const raBaseY = by - 45 * s;
    const staffAnchorX = raX + 1 * s;
    const staffAnchorY = raBaseY + 17 * s;
    const staffTopX = staffAnchorX + Math.sin(staffSway) * 8 * s;
    const staffTopY = staffAnchorY - (staffRaised ? 52 * s : 44 * s);
    const staffBotX = staffAnchorX - Math.sin(staffSway) * 4 * s;
    const staffBotY = staffAnchorY + 8 * s;

    // Staff shaft
    ctx.strokeStyle = utils.rgb(STAFF_WOOD);
    ctx.lineWidth = 3 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(staffBotX, staffBotY);
    ctx.lineTo(staffAnchorX, staffAnchorY);
    ctx.lineTo(staffTopX, staffTopY);
    ctx.stroke();

    // Golden orb atop staff
    const orbGrad = ctx.createRadialGradient(
      staffTopX - 1.5 * s, staffTopY - 1.5 * s, 0,
      staffTopX, staffTopY, 5.5 * s,
    );
    orbGrad.addColorStop(0, utils.rgb(utils.lighten(STAFF_ORB, 50)));
    orbGrad.addColorStop(0.5, utils.rgb(STAFF_ORB));
    orbGrad.addColorStop(1, utils.rgb(utils.darken(STAFF_ORB, 20)));
    ctx.fillStyle = orbGrad;
    utils.fillCircle(ctx, staffTopX, staffTopY, 5.5 * s);
    // Orb glow
    ctx.fillStyle = utils.rgb(STAFF_ORB, 0.2);
    utils.fillCircle(ctx, staffTopX, staffTopY, 9 * s);

    // Right hand holding staff
    utils.drawLimb(ctx, [
      { x: raX, y: raBaseY },
      { x: staffAnchorX - 1 * s, y: raBaseY + 10 * s },
      { x: staffAnchorX, y: staffAnchorY },
    ], 4 * s, ROBE);
    ctx.fillStyle = utils.rgb(SKIN);
    utils.fillCircle(ctx, staffAnchorX, staffAnchorY, 3.5 * s);

    // ── Neck ──
    ctx.fillStyle = utils.rgb(SKIN_DARK);
    utils.roundRect(ctx, cx - 4 * s + bodyLean * 0.3, by - 54 * s, 8 * s, 8 * s, 2 * s);
    ctx.fill();

    // ── Head ──
    const headX = cx + bodyLean * 0.3;
    const headY = by - 62 * s;

    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(headTilt);

    // Long grey hair
    ctx.fillStyle = utils.rgb(HAIR);
    // Top / sides
    utils.roundRect(ctx, -11 * s, -12 * s, 22 * s, 12 * s, 4 * s);
    ctx.fill();
    // Long side falls
    ctx.fillRect(-12 * s, -4 * s, 4 * s, 22 * s);
    ctx.fillRect(8 * s, -4 * s, 4 * s, 22 * s);
    // Hair highlight
    ctx.fillStyle = utils.rgb(utils.lighten(HAIR, 20), 0.25);
    ctx.fillRect(-7 * s, -11 * s, 5 * s, 4 * s);

    // Weathered face
    const headGrad = ctx.createRadialGradient(-2 * s, -4 * s, 0, 0, 0, 13 * s);
    headGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    headGrad.addColorStop(0.5, utils.rgb(SKIN));
    headGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = headGrad;
    utils.roundRect(ctx, -10 * s, -9 * s, 20 * s, 18 * s, 5 * s);
    ctx.fill();

    // Wrinkles (horizontal line strokes)
    ctx.strokeStyle = utils.rgb(SKIN_DARK, 0.35);
    ctx.lineWidth = 0.7 * s;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const wy = -3 * s + i * 3.5 * s;
      ctx.beginPath();
      ctx.moveTo(-7 * s, wy); ctx.lineTo(-3 * s, wy - 0.5 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(7 * s, wy); ctx.lineTo(3 * s, wy - 0.5 * s);
      ctx.stroke();
    }
    // Forehead lines
    ctx.beginPath();
    ctx.moveTo(-6 * s, -6 * s); ctx.lineTo(6 * s, -6 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-5 * s, -4.5 * s); ctx.lineTo(5 * s, -4.5 * s);
    ctx.stroke();

    // Hat
    utils.drawPart(ctx, -11 * s, -15 * s, 22 * s, 8 * s, utils.darken(ROBE, 5), 3 * s);
    ctx.fillStyle = utils.rgb(ROBE_TRIM, 0.6);
    utils.roundRect(ctx, -12 * s, -8 * s, 24 * s, 2 * s, 1 * s);
    ctx.fill();

    // Eyes
    if (eyesClosed) {
      ctx.strokeStyle = utils.rgb(SKIN_DARK, 0.6);
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.moveTo(-7 * s, -1 * s); ctx.lineTo(-2 * s, -1 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2 * s, -1 * s); ctx.lineTo(7 * s, -1 * s);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#e0d8cc';
      utils.fillEllipse(ctx, -4.5 * s, -1 * s, 3 * s, 2.3 * s);
      utils.fillEllipse(ctx, 4.5 * s, -1 * s, 3 * s, 2.3 * s);
      ctx.fillStyle = '#2a2018';
      utils.fillEllipse(ctx, -4.5 * s, -1 * s, 1.8 * s, 1.8 * s);
      utils.fillEllipse(ctx, 4.5 * s, -1 * s, 1.8 * s, 1.8 * s);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      utils.fillCircle(ctx, -3.5 * s, -1.8 * s, 0.7 * s);
      utils.fillCircle(ctx, 5.5 * s, -1.8 * s, 0.7 * s);
    }

    // Eyebrows (bushy grey)
    const browY = -4.5 * s - eyebrowRaise * s;
    ctx.strokeStyle = utils.rgb(HAIR_DARK);
    ctx.lineWidth = 2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-7.5 * s, browY); ctx.lineTo(-2 * s, browY + 0.5 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(7.5 * s, browY); ctx.lineTo(2 * s, browY + 0.5 * s);
    ctx.stroke();

    // Nose (prominent)
    ctx.fillStyle = utils.rgb(SKIN_DARK, 0.45);
    utils.fillEllipse(ctx, 0, 2 * s, 2.5 * s, 2.2 * s);

    // Mouth
    if (mouthOpen) {
      ctx.fillStyle = '#3a1a0a';
      utils.fillEllipse(ctx, 0, 6 * s, 3 * s, 1.8 * s);
    } else {
      ctx.strokeStyle = utils.rgb(SKIN_DARK, 0.6);
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.moveTo(-3.5 * s, 6 * s);
      ctx.quadraticCurveTo(0, 7.5 * s, 3.5 * s, 6 * s);
      ctx.stroke();
    }

    // Full grey beard
    ctx.fillStyle = utils.rgb(HAIR);
    ctx.beginPath();
    ctx.moveTo(-8 * s, 7 * s);
    ctx.lineTo(8 * s, 7 * s);
    ctx.lineTo(6 * s, 18 * s);
    ctx.lineTo(0, 22 * s);
    ctx.lineTo(-6 * s, 18 * s);
    ctx.closePath();
    ctx.fill();
    // Beard sheen
    ctx.fillStyle = utils.rgb(utils.lighten(HAIR, 25), 0.25);
    ctx.beginPath();
    ctx.moveTo(-3 * s, 8 * s); ctx.lineTo(3 * s, 8 * s);
    ctx.lineTo(1 * s, 14 * s); ctx.lineTo(-1 * s, 14 * s);
    ctx.closePath();
    ctx.fill();

    ctx.restore(); // head
    ctx.restore(); // frame
  },
};
