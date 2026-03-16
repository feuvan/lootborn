// src/graphics/sprites/npcs/QuestScout.ts
import type { EntityDrawer, NPCAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN        = 0xb09060;
const SKIN_DARK   = 0x906a40;
const SKIN_LIGHT  = 0xc8a878;
const HAIR        = 0x3a2a0a;   // short, alert
const CLOAK       = 0x2a3a1a;
const CLOAK_INNER = 0x1a2a10;
const TUNIC       = 0x3a5a2a;
const LEATHER     = 0x4a3820;
const BELT        = 0x2a1a08;
const BOOT        = 0x1a1008;
const BLADE       = 0x8a8a9a;
const SCABBARD    = 0x4a3020;

export const QuestScoutDrawer: EntityDrawer = {
  key: 'npc_quest_scout',
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
    let mouthOpen = false;
    let eyebrowRaise = 0;
    let armsCrossed = false;
    let swordGrip = false;
    let pointDir = 0;   // arm angle for pointing

    switch (act) {
      case 'working': {
        // Scanning horizon — hand to brow
        bob = Math.sin(phase) * 0.8 * s;
        rightArmY = -8 * s + Math.sin(phase * 2) * 2 * s;  // raised to brow
        leftArmY = Math.sin(phase) * 2 * s;
        bodyLean = Math.sin(phase * 0.5) * 1 * s;
        headTilt = Math.sin(phase * 0.5) * 0.03;
        break;
      }
      case 'alert': {
        // Grabs sword hilt
        swordGrip = true;
        bob = -t * 2 * s;
        bodyLean = t * -1.5 * s;
        headTilt = -t * 0.04;
        eyebrowRaise = 1.5 + t * 2;
        rightArmY = t * -5 * s;   // hand moves to sword hilt
        break;
      }
      case 'idle': {
        // Arms crossed
        armsCrossed = true;
        bob = Math.sin(phase) * 1 * s;
        bodyLean = Math.sin(phase * 0.5) * 0.8 * s;
        headTilt = Math.sin(phase + 1) * 0.012;
        break;
      }
      case 'talking': {
        // Pointing direction
        bob = Math.sin(phase) * 0.8 * s;
        bodyLean = -1 * s + Math.sin(phase) * 1 * s;
        rightArmY = -10 * s + Math.sin(phase) * 2 * s;  // arm extended pointing
        pointDir = -0.3 + Math.sin(phase) * 0.1;
        leftArmY = Math.sin(phase) * 2 * s;
        headTilt = Math.sin(phase * 1.5) * 0.025;
        mouthOpen = Math.sin(phase * 3) > 0.3;
        eyebrowRaise = Math.sin(phase * 2) > 0 ? 1 : 0;
        break;
      }
    }

    ctx.save();
    const by = ground + bob;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    utils.fillEllipse(ctx, cx, ground + 3 * s, 19 * s, 4 * s);

    // ── Boots ──
    for (const side of [-1, 1]) {
      utils.drawPart(ctx, cx + side * 6 * s - 4.5 * s, by - 7 * s, 9 * s, 8 * s, BOOT, 2 * s);
    }

    // ── Legs ──
    const legColor = utils.darken(TUNIC, 15);
    utils.drawPart(ctx, cx - 11 * s, by - 26 * s, 8 * s, 21 * s, legColor, 3 * s);
    utils.drawPart(ctx, cx + 3 * s, by - 26 * s, 8 * s, 21 * s, legColor, 3 * s);

    // ── Cloak (behind body) ──
    ctx.fillStyle = utils.rgb(CLOAK);
    ctx.beginPath();
    ctx.moveTo(cx - 13 * s + bodyLean, by - 50 * s);
    ctx.lineTo(cx - 15 * s + bodyLean, by - 2 * s);
    ctx.lineTo(cx + 15 * s + bodyLean, by - 2 * s);
    ctx.lineTo(cx + 13 * s + bodyLean, by - 50 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = utils.rgb(CLOAK_INNER, 0.5);
    ctx.fillRect(cx - 2 * s + bodyLean, by - 48 * s, 4 * s, 44 * s);

    // ── Tunic ──
    utils.drawPart(ctx, cx - 11 * s + bodyLean, by - 48 * s, 22 * s, 28 * s, TUNIC, 4 * s);

    // ── Leather chest piece ──
    utils.drawLeatherTexture(ctx, cx - 9 * s + bodyLean, by - 46 * s, 18 * s, 20 * s, LEATHER);

    // ── Belt ──
    utils.drawPart(ctx, cx - 11 * s + bodyLean, by - 22 * s, 22 * s, 4 * s, BELT, 1 * s);

    // ── Scabbard on hip ──
    const scabbardX = cx + 9 * s + bodyLean;
    const scabbardY = by - 22 * s;
    ctx.fillStyle = utils.rgb(SCABBARD);
    ctx.fillRect(scabbardX, scabbardY, 3 * s, 14 * s);
    ctx.strokeStyle = utils.rgb(utils.darken(SCABBARD, 20));
    ctx.lineWidth = 0.5 * s;
    ctx.strokeRect(scabbardX, scabbardY, 3 * s, 14 * s);
    // Sword hilt poking out
    ctx.fillStyle = utils.rgb(utils.darken(BLADE, 20));
    ctx.fillRect(scabbardX - 2 * s, scabbardY - 3 * s, 7 * s, 2 * s);

    // ── Arms ──
    const laX = cx - 16 * s + bodyLean;
    const raX = cx + 12 * s + bodyLean;
    const armBaseY = by - 45 * s;

    if (armsCrossed) {
      // Crossed arms pose
      utils.drawPart(ctx, cx - 14 * s + bodyLean, armBaseY, 12 * s, 6 * s, TUNIC, 3 * s);
      utils.drawPart(ctx, cx - 8 * s + bodyLean, armBaseY + 4 * s, 12 * s, 6 * s, TUNIC, 3 * s);
    } else {
      // Left arm
      utils.drawLimb(ctx, [
        { x: laX + 3 * s, y: armBaseY },
        { x: laX + 2 * s, y: armBaseY + 10 * s },
        { x: laX + 2 * s, y: armBaseY + 17 * s + leftArmY },
      ], 4 * s, TUNIC);
      ctx.fillStyle = utils.rgb(SKIN);
      utils.fillCircle(ctx, laX + 2 * s, armBaseY + 17 * s + leftArmY, 3.5 * s);

      // Right arm
      if (act === 'working') {
        // Raised to brow shade eyes
        utils.drawLimb(ctx, [
          { x: raX + 1 * s, y: armBaseY },
          { x: raX + 3 * s, y: armBaseY + 6 * s },
          { x: cx + 3 * s + bodyLean, y: armBaseY + 10 * s + rightArmY },
        ], 4 * s, TUNIC);
        ctx.fillStyle = utils.rgb(SKIN);
        utils.fillCircle(ctx, cx + 3 * s + bodyLean, armBaseY + 10 * s + rightArmY, 3.5 * s);
      } else if (act === 'talking') {
        // Pointing extended
        const ptEndX = raX + 15 * s;
        const ptEndY = armBaseY + rightArmY;
        utils.drawLimb(ctx, [
          { x: raX + 1 * s, y: armBaseY },
          { x: raX + 6 * s, y: armBaseY + 5 * s + rightArmY * 0.5 },
          { x: ptEndX, y: ptEndY },
        ], 4 * s, TUNIC);
        ctx.fillStyle = utils.rgb(SKIN);
        utils.fillCircle(ctx, ptEndX, ptEndY, 3.5 * s);
      } else {
        utils.drawLimb(ctx, [
          { x: raX + 1 * s, y: armBaseY },
          { x: raX + 2 * s, y: armBaseY + 10 * s },
          { x: raX + 2 * s, y: armBaseY + 17 * s + rightArmY },
        ], 4 * s, TUNIC);
        ctx.fillStyle = utils.rgb(SKIN);
        utils.fillCircle(ctx, raX + 2 * s, armBaseY + 17 * s + rightArmY, 3.5 * s);
      }
    }

    // ── Neck ──
    ctx.fillStyle = utils.rgb(SKIN_DARK);
    utils.roundRect(ctx, cx - 4 * s + bodyLean * 0.3, by - 54 * s, 8 * s, 7 * s, 2 * s);
    ctx.fill();

    // ── Head ──
    const headX = cx + bodyLean * 0.3;
    const headY = by - 61 * s;

    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(headTilt);

    // Short hair
    ctx.fillStyle = utils.rgb(HAIR);
    utils.roundRect(ctx, -10 * s, -11 * s, 20 * s, 10 * s, 3 * s);
    ctx.fill();
    ctx.fillRect(-10 * s, -3 * s, 3 * s, 4 * s);
    ctx.fillRect(7 * s, -3 * s, 3 * s, 4 * s);

    // Youthful face
    const headGrad = ctx.createRadialGradient(-2 * s, -3 * s, 0, 0, 0, 11 * s);
    headGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    headGrad.addColorStop(0.5, utils.rgb(SKIN));
    headGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = headGrad;
    utils.roundRect(ctx, -9 * s, -8 * s, 18 * s, 17 * s, 5 * s);
    ctx.fill();

    // Hood (over hair, pushed back)
    ctx.fillStyle = utils.rgb(CLOAK, 0.8);
    utils.roundRect(ctx, -11 * s, -12 * s, 22 * s, 8 * s, 4 * s);
    ctx.fill();
    ctx.fillStyle = utils.rgb(CLOAK_INNER, 0.4);
    utils.roundRect(ctx, -10 * s, -11 * s, 20 * s, 5 * s, 3 * s);
    ctx.fill();

    // Alert eyes
    const browY = -5 * s - eyebrowRaise * s;
    ctx.strokeStyle = utils.rgb(HAIR, 0.9);
    ctx.lineWidth = 1.8 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-7 * s, browY); ctx.lineTo(-2.5 * s, browY - 0.5 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2.5 * s, browY - 0.5 * s); ctx.lineTo(7 * s, browY);
    ctx.stroke();

    ctx.fillStyle = '#ddd8d0';
    utils.fillEllipse(ctx, -4 * s, -1.5 * s, 2.8 * s, 2.5 * s);
    utils.fillEllipse(ctx, 4 * s, -1.5 * s, 2.8 * s, 2.5 * s);
    ctx.fillStyle = '#2a1a08';
    utils.fillEllipse(ctx, -4 * s, -1.5 * s, 1.7 * s, 2 * s);
    utils.fillEllipse(ctx, 4 * s, -1.5 * s, 1.7 * s, 2 * s);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    utils.fillCircle(ctx, -3 * s, -2.5 * s, 0.65 * s);
    utils.fillCircle(ctx, 5 * s, -2.5 * s, 0.65 * s);

    // Nose
    ctx.fillStyle = utils.rgb(SKIN_DARK, 0.4);
    utils.fillEllipse(ctx, 0, 2 * s, 1.8 * s, 1.5 * s);

    // Mouth
    if (mouthOpen) {
      ctx.fillStyle = '#2a1008';
      utils.fillEllipse(ctx, 0, 5.5 * s, 2.5 * s, 1.5 * s);
    } else {
      ctx.strokeStyle = utils.rgb(SKIN_DARK, 0.6);
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.moveTo(-3 * s, 5 * s);
      ctx.quadraticCurveTo(0, 6.5 * s, 3 * s, 5 * s);
      ctx.stroke();
    }

    ctx.restore(); // head
    ctx.restore(); // frame
  },
};
