// src/graphics/sprites/npcs/QuestWarden.ts
import type { EntityDrawer, NPCAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN        = 0x765c4f;
const SKIN_DARK   = 0x5c4234;
const SKIN_LIGHT  = 0x8a695c;
const HAIR        = 0x1a1a1a;
const CLOAK       = 0x1a0a1a;    // very dark cloak
const CLOAK_INNER = 0x2a1a2a;
const ARMOR       = 0x222230;
const ARMOR_LIGHT = 0x30303d;
const BELT        = 0x1a1a1a;
const BOOT        = 0x0a0a0a;
const BLADE       = 0x8a8a9a;
const SCABBARD    = 0x2a1a2a;
const BUTTON      = 0x4a2742;

export const QuestWardenDrawer: EntityDrawer = {
  key: 'npc_quest_warden',
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
    let walkCycle = 0;
    let mouthOpen = false;
    let eyebrowRaise = 0;
    let armsCrossed = false;
    let handOnSword = false;

    switch (act) {
      case 'working': {
        // Patrolling walk cycle
        walkCycle = phase;
        bob = -Math.abs(Math.sin(phase)) * 1.5 * s;
        bodyLean = Math.sin(phase) * 0.5 * s;
        leftArmY = Math.sin(phase) * 3 * s;
        rightArmY = Math.sin(phase + Math.PI) * 3 * s;
        headTilt = Math.sin(phase * 0.5) * 0.02;
        break;
      }
      case 'alert': {
        // Hand on sword
        handOnSword = true;
        bob = -t * 2 * s;
        bodyLean = t * -1 * s;
        headTilt = -t * 0.04;
        eyebrowRaise = 1.5 + t * 2;
        rightArmY = t * -5 * s;
        leftArmY = t * -2 * s;
        break;
      }
      case 'idle': {
        // Arms crossed, watchful
        armsCrossed = true;
        bob = Math.sin(phase) * 0.8 * s;
        bodyLean = Math.sin(phase * 0.5) * 0.5 * s;
        headTilt = Math.sin(phase + 1) * 0.01;
        break;
      }
      case 'talking': {
        // Crossed arms, stern look
        armsCrossed = true;
        bob = Math.sin(phase) * 0.5 * s;
        bodyLean = -0.5 * s + Math.sin(phase) * 0.5 * s;
        headTilt = Math.sin(phase * 1.5) * 0.02;
        mouthOpen = Math.sin(phase * 3) > 0.4;
        eyebrowRaise = Math.sin(phase * 2) > 0 ? 0.5 : 0;
        break;
      }
    }

    ctx.save();
    const by = ground + bob;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    utils.fillEllipse(ctx, cx, ground + 3 * s, 19 * s, 4 * s);

    // ── Boots (tall, sleek) ──
    for (const side of [-1, 1]) {
      utils.drawMetalSurface(ctx, cx + side * 6.5 * s - 5 * s, by - 10 * s, 10 * s, 11 * s, BOOT);
    }

    // ── Legs (walk cycle) ──
    const legColor = utils.darken(ARMOR, 10);
    const legLSwing = act === 'working' ? Math.sin(walkCycle) * 5 * s : 0;
    const legRSwing = act === 'working' ? -Math.sin(walkCycle) * 5 * s : 0;
    utils.drawPart(ctx, cx - 11 * s, by - 26 * s + legLSwing, 8 * s, 20 * s, legColor, 3 * s);
    utils.drawPart(ctx, cx + 3 * s, by - 26 * s + legRSwing, 8 * s, 20 * s, legColor, 3 * s);

    // ── Dark cloak (behind) ──
    ctx.fillStyle = utils.rgb(CLOAK);
    ctx.beginPath();
    ctx.moveTo(cx - 14 * s + bodyLean, by - 50 * s);
    ctx.lineTo(cx - 16 * s + bodyLean, by - 2 * s);
    ctx.lineTo(cx + 16 * s + bodyLean, by - 2 * s);
    ctx.lineTo(cx + 14 * s + bodyLean, by - 50 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = utils.rgb(CLOAK_INNER, 0.4);
    ctx.fillRect(cx - 2 * s + bodyLean, by - 48 * s, 4 * s, 44 * s);

    // ── Dark armor chest ──
    utils.drawPart(ctx, cx - 12 * s + bodyLean, by - 50 * s, 24 * s, 30 * s, ARMOR, 4 * s);
    // Armor highlight seam
    ctx.strokeStyle = utils.rgb(ARMOR_LIGHT, 0.4);
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(cx + bodyLean, by - 50 * s); ctx.lineTo(cx + bodyLean, by - 22 * s);
    ctx.stroke();
    // Pauldrons
    utils.drawMetalSurface(ctx, cx - 18 * s + bodyLean, by - 48 * s, 8 * s, 6 * s, ARMOR_LIGHT);
    utils.drawMetalSurface(ctx, cx + 10 * s + bodyLean, by - 48 * s, 8 * s, 6 * s, ARMOR_LIGHT);

    // ── Belt ──
    utils.drawPart(ctx, cx - 12 * s + bodyLean, by - 22 * s, 24 * s, 4 * s, BELT, 1 * s);
    ctx.fillStyle = utils.rgb(BUTTON);
    utils.roundRect(ctx, cx - 2 * s + bodyLean, by - 21.5 * s, 4 * s, 3 * s, 1 * s);
    ctx.fill();

    // ── Scabbard on hip ──
    const scabX = cx + 10 * s + bodyLean;
    ctx.fillStyle = utils.rgb(SCABBARD);
    ctx.fillRect(scabX, by - 22 * s, 3 * s, 15 * s);
    ctx.strokeStyle = utils.rgb(utils.darken(SCABBARD, 15));
    ctx.lineWidth = 0.5 * s;
    ctx.strokeRect(scabX, by - 22 * s, 3 * s, 15 * s);
    // Hilt visible
    ctx.fillStyle = utils.rgb(utils.darken(BLADE, 20));
    ctx.fillRect(scabX - 2 * s, by - 24 * s, 7 * s, 2.5 * s);

    // ── Arms ──
    if (armsCrossed) {
      // Crossed arms over chest
      utils.drawPart(ctx, cx - 13 * s + bodyLean, by - 44 * s, 14 * s, 7 * s, CLOAK, 3 * s);
      utils.drawPart(ctx, cx - 6 * s + bodyLean, by - 40 * s, 14 * s, 7 * s, CLOAK, 3 * s);
      // Hands peeking out
      ctx.fillStyle = utils.rgb(SKIN);
      utils.fillCircle(ctx, cx + 8 * s + bodyLean, by - 40 * s, 3.5 * s);
      utils.fillCircle(ctx, cx - 11 * s + bodyLean, by - 37 * s, 3.5 * s);
    } else {
      const laX = cx - 16 * s + bodyLean;
      const raX = cx + 12 * s + bodyLean;
      const armBaseY = by - 46 * s;

      // Left arm
      utils.drawLimb(ctx, [
        { x: laX + 3 * s, y: armBaseY },
        { x: laX + 2 * s, y: armBaseY + 10 * s },
        { x: laX + 2 * s, y: armBaseY + 17 * s + leftArmY },
      ], 4 * s, CLOAK);
      ctx.fillStyle = utils.rgb(SKIN);
      utils.fillCircle(ctx, laX + 2 * s, armBaseY + 17 * s + leftArmY, 3.5 * s);

      // Right arm
      utils.drawLimb(ctx, [
        { x: raX + 1 * s, y: armBaseY },
        { x: raX + 2 * s, y: armBaseY + 10 * s },
        { x: raX + 2 * s, y: armBaseY + 17 * s + rightArmY },
      ], 4 * s, CLOAK);
      ctx.fillStyle = utils.rgb(SKIN);
      utils.fillCircle(ctx, raX + 2 * s, armBaseY + 17 * s + rightArmY, 3.5 * s);

      // Hand-on-sword indicator (alert)
      if (handOnSword) {
        ctx.fillStyle = utils.rgb(SKIN, 0.8);
        utils.fillCircle(ctx, scabX + 1 * s, by - 24 * s, 4 * s);
      }
    }

    // ── Neck ──
    ctx.fillStyle = utils.rgb(SKIN_DARK);
    utils.roundRect(ctx, cx - 4 * s + bodyLean * 0.3, by - 55 * s, 8 * s, 8 * s, 2 * s);
    ctx.fill();

    // ── Head (gaunt, stern) ──
    const headX = cx + bodyLean * 0.3;
    const headY = by - 63 * s;

    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(headTilt);

    // Dark hair
    ctx.fillStyle = utils.rgb(HAIR);
    utils.roundRect(ctx, -10 * s, -12 * s, 20 * s, 10 * s, 3 * s);
    ctx.fill();
    ctx.fillRect(-10 * s, -4 * s, 3 * s, 5 * s);
    ctx.fillRect(7 * s, -4 * s, 3 * s, 5 * s);

    // Gaunt, narrow face
    const headGrad = ctx.createRadialGradient(-2 * s, -4 * s, 0, 0, 0, 11 * s);
    headGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    headGrad.addColorStop(0.5, utils.rgb(SKIN));
    headGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = headGrad;
    // Slightly narrower face for gaunt look
    utils.roundRect(ctx, -9 * s, -9 * s, 18 * s, 18 * s, 4 * s);
    ctx.fill();

    // Dark hood accent at top
    ctx.fillStyle = utils.rgb(CLOAK, 0.5);
    utils.roundRect(ctx, -11 * s, -13 * s, 22 * s, 7 * s, 3 * s);
    ctx.fill();

    // Stern eyebrows (heavy, angled inward)
    const browY = -5 * s - eyebrowRaise * s;
    ctx.strokeStyle = utils.rgb(HAIR);
    ctx.lineWidth = 2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-7.5 * s, browY + 1 * s); ctx.lineTo(-2.5 * s, browY - 0.5 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(7.5 * s, browY + 1 * s); ctx.lineTo(2.5 * s, browY - 0.5 * s);
    ctx.stroke();

    // Dark, intense eyes
    ctx.fillStyle = '#d0cac0';
    utils.fillEllipse(ctx, -4 * s, -1.5 * s, 2.5 * s, 2 * s);
    utils.fillEllipse(ctx, 4 * s, -1.5 * s, 2.5 * s, 2 * s);
    ctx.fillStyle = '#1a1010';
    utils.fillEllipse(ctx, -4 * s, -1.5 * s, 1.6 * s, 1.7 * s);
    utils.fillEllipse(ctx, 4 * s, -1.5 * s, 1.6 * s, 1.7 * s);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    utils.fillCircle(ctx, -3 * s, -2.3 * s, 0.6 * s);
    utils.fillCircle(ctx, 5 * s, -2.3 * s, 0.6 * s);

    // Sharp cheekbones (gaunt look — shadow)
    ctx.fillStyle = utils.rgb(SKIN_DARK, 0.25);
    utils.fillEllipse(ctx, -6 * s, 3 * s, 3 * s, 1.5 * s);
    utils.fillEllipse(ctx, 6 * s, 3 * s, 3 * s, 1.5 * s);

    // Narrow nose
    ctx.fillStyle = utils.rgb(SKIN_DARK, 0.4);
    ctx.beginPath();
    ctx.moveTo(0, 1.5 * s);
    ctx.lineTo(-1.5 * s, 4 * s);
    ctx.lineTo(1.5 * s, 4 * s);
    ctx.closePath();
    ctx.fill();

    // Stern, thin mouth
    if (mouthOpen) {
      ctx.fillStyle = '#2a1008';
      utils.fillEllipse(ctx, 0, 6.5 * s, 2 * s, 1.3 * s);
    } else {
      // Thin, flat, stern line
      ctx.strokeStyle = utils.rgb(SKIN_DARK, 0.7);
      ctx.lineWidth = 1.2 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-3.5 * s, 6 * s); ctx.lineTo(3.5 * s, 6 * s);
      ctx.stroke();
    }

    ctx.restore(); // head
    ctx.restore(); // frame
  },
};
