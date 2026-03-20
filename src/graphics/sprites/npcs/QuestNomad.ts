// src/graphics/sprites/npcs/QuestNomad.ts
import type { EntityDrawer, NPCAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN        = 0x906942;
const SKIN_DARK   = 0x714f27;
const SKIN_LIGHT  = 0xa47d4f;
const HAIR        = 0x1a1a0a;
const CLOAK       = 0x715722;   // sandy cloak
const CLOAK_DARK  = 0x573d15;
const CLOAK_TRIM  = 0xc0960a;
const ROBE        = 0x644a22;
const BELT        = 0x3d270d;
const BOOT        = 0x301a0d;
const LAN_FRAME   = 0x4a4a50;
const LAN_GLOW    = 0xffaa30;
const LAN_OUTER   = 0xff8800;

export const QuestNomadDrawer: EntityDrawer = {
  key: 'npc_quest_nomad',
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
    let rightArmY = 0;
    let lanternSwing = 0;  // swing angle of lantern
    let lanternRaise = 0;  // Y raise for alert
    let mouthOpen = false;
    let eyebrowRaise = 0;
    let pointExtend = false;

    switch (act) {
      case 'working': {
        // Lantern swings as nomad moves
        lanternSwing = Math.sin(phase) * 0.4;
        rightArmY = Math.sin(phase) * 5 * s;
        leftArmY = Math.sin(phase + 1.5) * 2 * s;
        bob = Math.sin(phase) * 1 * s;
        bodyLean = Math.sin(phase * 0.5) * 1 * s;
        headTilt = Math.sin(phase * 0.7) * 0.02;
        break;
      }
      case 'alert': {
        // Raises lantern to see better
        lanternRaise = t * 14 * s;
        lanternSwing = 0;
        rightArmY = -t * 10 * s;
        bob = -t * 1.5 * s;
        headTilt = -t * 0.04;
        eyebrowRaise = 1.5 + t * 2;
        break;
      }
      case 'idle': {
        bob = Math.sin(phase) * 1 * s;
        bodyLean = Math.sin(phase * 0.5) * 1 * s;
        leftArmY = Math.sin(phase) * 1.5 * s;
        rightArmY = Math.sin(phase + Math.PI) * 1.5 * s;
        lanternSwing = Math.sin(phase) * 0.08;
        headTilt = Math.sin(phase + 1) * 0.012;
        break;
      }
      case 'talking': {
        // Points with free hand, lantern stays somewhat steady
        bob = Math.sin(phase) * 0.8 * s;
        bodyLean = -1.5 * s + Math.sin(phase) * 1 * s;
        leftArmY = Math.sin(phase * 2) * 9 * s;
        rightArmY = -2 * s + Math.sin(phase) * 1.5 * s;
        lanternSwing = Math.sin(phase * 0.5) * 0.1;
        pointExtend = true;
        headTilt = Math.sin(phase * 1.5) * 0.025;
        mouthOpen = Math.sin(phase * 3) > 0.25;
        eyebrowRaise = Math.sin(phase * 2) > 0 ? 1.5 : 0;
        break;
      }
    }

    ctx.save();
    const by = ground + bob;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.26)';
    utils.fillEllipse(ctx, cx, ground + 3 * s, 20 * s, 4.5 * s);

    // ── Boots ──
    for (const side of [-1, 1]) {
      utils.drawPart(ctx, cx + side * 6 * s - 4 * s, by - 6 * s, 8 * s, 7 * s, BOOT, 2 * s);
    }

    // Soft outline glow (sandy — desert NPC)
    utils.softOutline(ctx, 'rgba(160,120,60,0.15)', 5);

    // ── Sandy cloak (full body) ──
    ctx.fillStyle = utils.rgb(CLOAK);
    ctx.beginPath();
    ctx.moveTo(cx - 13 * s + bodyLean, by - 48 * s);
    ctx.lineTo(cx - 15 * s + bodyLean, by);
    ctx.lineTo(cx + 15 * s + bodyLean, by);
    ctx.lineTo(cx + 13 * s + bodyLean, by - 48 * s);
    ctx.closePath();
    ctx.fill();
    utils.drawPart(ctx, cx - 13 * s + bodyLean, by - 48 * s, 26 * s, 46 * s, CLOAK, 4 * s);
    // Cloak trim
    ctx.fillStyle = utils.rgb(CLOAK_TRIM, 0.5);
    ctx.fillRect(cx - 13 * s + bodyLean, by - 2 * s, 26 * s, 2 * s);
    ctx.fillRect(cx - 13 * s + bodyLean, by - 48 * s, 2 * s, 46 * s);
    ctx.fillRect(cx + 11 * s + bodyLean, by - 48 * s, 2 * s, 46 * s);
    // Inner robe
    ctx.fillStyle = utils.rgb(ROBE, 0.5);
    ctx.fillRect(cx - 2 * s + bodyLean, by - 46 * s, 4 * s, 42 * s);

    // ── Belt ──
    utils.drawPart(ctx, cx - 12 * s + bodyLean, by - 26 * s, 24 * s, 4 * s, BELT, 1 * s);
    ctx.fillStyle = utils.rgb(CLOAK_TRIM);
    utils.roundRect(ctx, cx - 2 * s + bodyLean, by - 25.5 * s, 4 * s, 3 * s, 1 * s);
    ctx.fill();

    // End soft outline
    utils.softOutlineEnd(ctx);

    // ── Left arm (pointing if talking) ──
    const laX = cx - 17 * s + bodyLean;
    const laBaseY = by - 44 * s;
    if (pointExtend) {
      utils.drawLimb(ctx, [
        { x: laX + 3 * s, y: laBaseY },
        { x: laX + 1 * s, y: laBaseY + 8 * s },
        { x: laX - 5 * s, y: laBaseY + 14 * s + leftArmY },
      ], 4 * s, CLOAK);
      ctx.fillStyle = utils.rgb(SKIN);
      utils.fillCircle(ctx, laX - 5 * s, laBaseY + 14 * s + leftArmY, 3.5 * s);
      // Extended pointing finger hint
      ctx.strokeStyle = utils.rgb(SKIN_DARK);
      ctx.lineWidth = 1.5 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(laX - 5 * s, laBaseY + 14 * s + leftArmY);
      ctx.lineTo(laX - 12 * s, laBaseY + 12 * s + leftArmY);
      ctx.stroke();
    } else {
      utils.drawLimb(ctx, [
        { x: laX + 3 * s, y: laBaseY },
        { x: laX + 2 * s, y: laBaseY + 9 * s },
        { x: laX + 2 * s, y: laBaseY + 16 * s + leftArmY },
      ], 4 * s, CLOAK);
      ctx.fillStyle = utils.rgb(SKIN);
      utils.fillCircle(ctx, laX + 2 * s, laBaseY + 16 * s + leftArmY, 3.5 * s);
    }

    // ── Right arm with lantern ──
    const raX = cx + 14 * s + bodyLean;
    const raBaseY = by - 44 * s;
    const lanternHolderX = raX;
    const lanternHolderY = raBaseY + 16 * s + rightArmY;
    utils.drawLimb(ctx, [
      { x: raX, y: raBaseY },
      { x: raX + 1 * s, y: raBaseY + 9 * s },
      { x: lanternHolderX, y: lanternHolderY },
    ], 4 * s, CLOAK);
    ctx.fillStyle = utils.rgb(SKIN);
    utils.fillCircle(ctx, lanternHolderX, lanternHolderY, 3.5 * s);

    // ── Lantern ──
    ctx.save();
    ctx.translate(lanternHolderX, lanternHolderY - 3 * s - lanternRaise);
    ctx.rotate(lanternSwing);
    // Chain
    ctx.strokeStyle = utils.rgb(LAN_FRAME);
    ctx.lineWidth = 1 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, 4 * s);
    ctx.stroke();
    // Hook
    ctx.strokeStyle = utils.rgb(LAN_FRAME);
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.arc(-1 * s, 1 * s, 1.5 * s, Math.PI, 0);
    ctx.stroke();
    // Lantern body (glowing)
    const lanBodyY = 4 * s;
    ctx.fillStyle = utils.rgb(LAN_GLOW, 0.9);
    utils.roundRect(ctx, -4 * s, lanBodyY, 8 * s, 9 * s, 1.5 * s);
    ctx.fill();
    // Frame bars
    ctx.strokeStyle = utils.rgb(LAN_FRAME);
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(0, lanBodyY); ctx.lineTo(0, lanBodyY + 9 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4 * s, lanBodyY + 3 * s); ctx.lineTo(4 * s, lanBodyY + 3 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4 * s, lanBodyY + 6 * s); ctx.lineTo(4 * s, lanBodyY + 6 * s);
    ctx.stroke();
    // Top and bottom caps
    ctx.fillStyle = utils.rgb(LAN_FRAME);
    ctx.fillRect(-4 * s, lanBodyY, 8 * s, 1.5 * s);
    ctx.fillRect(-4 * s, lanBodyY + 7.5 * s, 8 * s, 1.5 * s);
    // Radial glow
    const glowGrad = ctx.createRadialGradient(0, lanBodyY + 4 * s, 0, 0, lanBodyY + 4 * s, 12 * s);
    glowGrad.addColorStop(0, utils.rgb(LAN_OUTER, 0.35));
    glowGrad.addColorStop(0.5, utils.rgb(LAN_OUTER, 0.12));
    glowGrad.addColorStop(1, utils.rgb(LAN_OUTER, 0));
    ctx.fillStyle = glowGrad;
    utils.fillCircle(ctx, 0, lanBodyY + 4 * s, 12 * s);
    ctx.restore();

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

    // Hooded cloak (pointed hood)
    ctx.fillStyle = utils.rgb(CLOAK);
    ctx.beginPath();
    ctx.moveTo(0, -18 * s);
    ctx.lineTo(-14 * s, 6 * s);
    ctx.lineTo(14 * s, 6 * s);
    ctx.closePath();
    ctx.fill();
    // Hood dark inner shadow
    ctx.fillStyle = utils.rgb(CLOAK_DARK, 0.7);
    ctx.beginPath();
    ctx.arc(0, 3 * s, 12 * s, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    // Hood trim
    ctx.strokeStyle = utils.rgb(CLOAK_TRIM, 0.5);
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(-13 * s, 6 * s); ctx.lineTo(0, -17 * s); ctx.lineTo(13 * s, 6 * s);
    ctx.stroke();

    // Face (partially shadowed by hood)
    const faceGrad = ctx.createLinearGradient(0, -5 * s, 0, 10 * s);
    faceGrad.addColorStop(0, utils.rgb(SKIN_DARK));
    faceGrad.addColorStop(0.4, utils.rgb(SKIN));
    faceGrad.addColorStop(1, utils.rgb(SKIN));
    ctx.fillStyle = faceGrad;
    utils.roundRect(ctx, -8 * s, -5 * s, 16 * s, 14 * s, 4 * s);
    ctx.fill();

    // Sharp features (nomad)
    // Eyebrow raise
    const browY = -3 * s - eyebrowRaise * s;
    ctx.strokeStyle = utils.rgb(HAIR, 0.9);
    ctx.lineWidth = 1.5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6.5 * s, browY); ctx.lineTo(-1.5 * s, browY - 1 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(6.5 * s, browY); ctx.lineTo(1.5 * s, browY - 1 * s);
    ctx.stroke();

    // Alert eyes
    ctx.fillStyle = '#ddd8c8';
    utils.fillEllipse(ctx, -3.5 * s, -0.5 * s, 2.8 * s, 2.2 * s);
    utils.fillEllipse(ctx, 3.5 * s, -0.5 * s, 2.8 * s, 2.2 * s);
    ctx.fillStyle = '#1a1008';
    utils.fillEllipse(ctx, -3.5 * s, -0.5 * s, 1.7 * s, 1.8 * s);
    utils.fillEllipse(ctx, 3.5 * s, -0.5 * s, 1.7 * s, 1.8 * s);
    ctx.fillStyle = 'rgba(255,240,200,0.5)';
    utils.fillCircle(ctx, -2.5 * s, -1.3 * s, 0.6 * s);
    utils.fillCircle(ctx, 4.5 * s, -1.3 * s, 0.6 * s);

    // Sharp nose
    ctx.fillStyle = utils.rgb(SKIN_DARK, 0.4);
    ctx.beginPath();
    ctx.moveTo(0, 1.5 * s);
    ctx.lineTo(-2 * s, 4 * s);
    ctx.lineTo(2 * s, 4 * s);
    ctx.closePath();
    ctx.fill();

    // Mouth
    if (mouthOpen) {
      ctx.fillStyle = '#2a1008';
      utils.fillEllipse(ctx, 0, 7 * s, 2.5 * s, 1.5 * s);
    } else {
      ctx.strokeStyle = utils.rgb(SKIN_DARK, 0.6);
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.moveTo(-3 * s, 6.5 * s);
      ctx.quadraticCurveTo(0, 8 * s, 3 * s, 6.5 * s);
      ctx.stroke();
    }

    ctx.restore(); // head
    ctx.restore(); // frame
  },
};
