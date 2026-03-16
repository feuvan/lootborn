// src/graphics/sprites/npcs/Merchant.ts
import type { EntityDrawer, NPCAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN        = 0xc09870;
const SKIN_DARK   = 0x9a7848;
const SKIN_LIGHT  = 0xd8b888;
const HAIR        = 0x3a2a1a;
const VEST_OUTER  = 0x1a3a5a;   // blue merchant vest
const VEST_INNER  = 0x2a5a7a;
const SHIRT       = 0xe8d8b0;   // cream shirt
const BELT        = 0x5a3a1a;
const BOOT        = 0x2a1a0a;
const COIN_COLOR  = 0xd4aa30;
const BAG_COLOR   = 0xb8860b;
const HAT_COLOR   = 0x1a5a4a;

export const MerchantDrawer: EntityDrawer = {
  key: 'npc_merchant',
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
    // For coin-counting animation
    let coinFlipPhase = 0;

    switch (act) {
      case 'working': {
        // Counting coins — right hand raises/lowers rapidly
        bob = Math.sin(phase) * 1.5 * s;
        rightArmY = Math.sin(phase * 2) * 6 * s;
        leftArmY = Math.sin(phase + 1) * 2 * s;
        bodyLean = Math.sin(phase) * 1.5 * s;
        headTilt = 0.05; // looking down at coins
        coinFlipPhase = phase;
        break;
      }
      case 'alert': {
        bob = t * -2 * s;
        rightArmY = -1 * s;
        leftArmY = -1 * s;
        headTilt = t * -0.04;
        eyebrowRaise = 2 + t * 2;
        break;
      }
      case 'idle': {
        bob = Math.sin(phase) * 1.2 * s;
        bodyLean = Math.sin(phase * 0.5) * 1 * s;
        leftArmY = Math.sin(phase) * 2 * s;
        rightArmY = Math.sin(phase + Math.PI) * 2 * s;
        headTilt = Math.sin(phase + 1) * 0.015;
        break;
      }
      case 'talking': {
        // Weighing gesture — both hands move as if holding scales
        bob = Math.sin(phase) * 1 * s;
        bodyLean = -1 * s + Math.sin(phase) * 1.5 * s;
        leftArmY = Math.sin(phase * 2) * 5 * s;
        rightArmY = Math.sin(phase * 2 + Math.PI) * 5 * s;
        headTilt = Math.sin(phase * 1.5) * 0.025;
        mouthOpen = Math.sin(phase * 3) > 0.3;
        eyebrowRaise = Math.sin(phase * 2) > 0 ? 1.5 : 0;
        break;
      }
    }

    ctx.save();
    const by = ground + bob;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    utils.fillEllipse(ctx, cx, ground + 3 * s, 20 * s, 4.5 * s);

    // ── Boots ──
    for (const side of [-1, 1]) {
      const bx = cx + side * 6 * s;
      utils.drawPart(ctx, bx - 4.5 * s, by - 6 * s, 9 * s, 7 * s, BOOT, 2 * s);
    }

    // ── Legs (trousers) ──
    const legColor = utils.darken(VEST_OUTER, 10);
    utils.drawPart(ctx, cx - 11 * s, by - 24 * s, 8 * s, 20 * s, legColor, 3 * s);
    utils.drawPart(ctx, cx + 3 * s, by - 24 * s, 8 * s, 20 * s, legColor, 3 * s);

    // ── Shirt (back layer) ──
    utils.drawPart(ctx, cx - 13 * s + bodyLean, by - 50 * s, 26 * s, 30 * s, SHIRT, 5 * s);

    // ── Colorful vest (front) ──
    // Left panel
    utils.drawPart(ctx, cx - 13 * s + bodyLean, by - 50 * s, 11 * s, 28 * s, VEST_OUTER, 4 * s);
    // Right panel
    utils.drawPart(ctx, cx + 2 * s + bodyLean, by - 50 * s, 11 * s, 28 * s, VEST_OUTER, 4 * s);
    // Decorative buttons
    ctx.fillStyle = utils.rgb(COIN_COLOR);
    for (let i = 0; i < 4; i++) {
      utils.fillCircle(ctx, cx - 1 * s + bodyLean, by - 47 * s + i * 7 * s, 1.5 * s);
    }
    // Vest trim
    ctx.strokeStyle = utils.rgb(utils.lighten(VEST_INNER, 20), 0.5);
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(cx - 13 * s + bodyLean, by - 50 * s);
    ctx.lineTo(cx - 13 * s + bodyLean, by - 22 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 13 * s + bodyLean, by - 50 * s);
    ctx.lineTo(cx + 13 * s + bodyLean, by - 22 * s);
    ctx.stroke();

    // ── Belt ──
    utils.drawPart(ctx, cx - 12 * s + bodyLean, by - 23 * s, 24 * s, 4 * s, BELT, 1 * s);
    ctx.fillStyle = utils.rgb(COIN_COLOR);
    utils.roundRect(ctx, cx - 2 * s + bodyLean, by - 22.5 * s, 4 * s, 3 * s, 1 * s);
    ctx.fill();

    // ── Left arm ──
    const laX = cx - 17 * s + bodyLean;
    const laBaseY = by - 46 * s;
    utils.drawLimb(ctx, [
      { x: laX + 3 * s, y: laBaseY },
      { x: laX + 2 * s, y: laBaseY + 10 * s },
      { x: laX + 2 * s, y: laBaseY + 17 * s + leftArmY },
    ], 4.5 * s, SHIRT);
    ctx.fillStyle = utils.rgb(SKIN);
    utils.fillCircle(ctx, laX + 2 * s, laBaseY + 17 * s + leftArmY, 3.5 * s);

    // ── Right arm ──
    const raX = cx + 13 * s + bodyLean;
    const raBaseY = by - 46 * s;
    utils.drawLimb(ctx, [
      { x: raX + 1 * s, y: raBaseY },
      { x: raX + 2 * s, y: raBaseY + 10 * s },
      { x: raX + 2 * s, y: raBaseY + 17 * s + rightArmY },
    ], 4.5 * s, SHIRT);
    const rhX = raX + 2 * s;
    const rhY = raBaseY + 17 * s + rightArmY;
    ctx.fillStyle = utils.rgb(SKIN);
    utils.fillCircle(ctx, rhX, rhY, 3.5 * s);

    // ── Coin bag accessory ──
    if (act === 'working' || act === 'idle') {
      // Coin bag in right hand
      const bagGrad = ctx.createRadialGradient(rhX, rhY - 5 * s, 0, rhX, rhY - 5 * s, 6 * s);
      bagGrad.addColorStop(0, utils.rgb(utils.lighten(BAG_COLOR, 20)));
      bagGrad.addColorStop(1, utils.rgb(BAG_COLOR));
      ctx.fillStyle = bagGrad;
      utils.fillCircle(ctx, rhX, rhY - 5 * s, 5.5 * s);
      // Drawstring
      ctx.strokeStyle = utils.rgb(utils.darken(BAG_COLOR, 15));
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.moveTo(rhX - 3 * s, rhY - 9 * s);
      ctx.quadraticCurveTo(rhX, rhY - 11 * s, rhX + 3 * s, rhY - 9 * s);
      ctx.stroke();
      // Coin gleam
      ctx.fillStyle = utils.rgb(COIN_COLOR, 0.8);
      utils.fillCircle(ctx, rhX, rhY - 5 * s, 2.5 * s);

      // Coin flip (working only)
      if (act === 'working') {
        const coinVisible = Math.sin(coinFlipPhase * 2) > -0.3;
        if (coinVisible) {
          const coinX = rhX + 8 * s;
          const coinY = rhY - 10 * s + Math.sin(coinFlipPhase * 2) * 4 * s;
          const coinScaleX = Math.abs(Math.cos(coinFlipPhase * 3));
          ctx.fillStyle = utils.rgb(COIN_COLOR);
          utils.fillEllipse(ctx, coinX, coinY, 2.5 * s * coinScaleX + 0.5 * s, 2.5 * s);
          ctx.strokeStyle = utils.rgb(utils.darken(COIN_COLOR, 20));
          ctx.lineWidth = 0.5 * s;
          ctx.beginPath();
          ctx.ellipse(coinX, coinY, Math.max(0.3, 2.5 * s * coinScaleX), 2.5 * s, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    } else if (act === 'talking') {
      // Scale-weighing gesture props — visual hint of scale on each hand
      const laHandX = laX + 2 * s;
      const laHandY = laBaseY + 17 * s + leftArmY;
      ctx.fillStyle = utils.rgb(COIN_COLOR, 0.6);
      utils.fillCircle(ctx, laHandX, laHandY - 3 * s, 2.5 * s);
      ctx.fillStyle = utils.rgb(COIN_COLOR, 0.6);
      utils.fillCircle(ctx, rhX, rhY - 3 * s, 2.5 * s);
    }

    // ── Neck ──
    ctx.fillStyle = utils.rgb(SKIN);
    utils.roundRect(ctx, cx - 4 * s + bodyLean * 0.3, by - 55 * s, 8 * s, 7 * s, 2 * s);
    ctx.fill();

    // ── Head ──
    const headX = cx + bodyLean * 0.3;
    const headY = by - 62 * s;

    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(headTilt);

    // Short brown hair
    ctx.fillStyle = utils.rgb(HAIR);
    utils.roundRect(ctx, -10 * s, -11 * s, 20 * s, 10 * s, 3 * s);
    ctx.fill();
    ctx.fillRect(-10 * s, -3 * s, 3 * s, 4 * s);
    ctx.fillRect(7 * s, -3 * s, 3 * s, 4 * s);

    // Round friendly face
    const headGrad = ctx.createRadialGradient(-3 * s, -3 * s, 0, 0, 0, 12 * s);
    headGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    headGrad.addColorStop(0.5, utils.rgb(SKIN));
    headGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = headGrad;
    utils.roundRect(ctx, -10 * s, -9 * s, 20 * s, 18 * s, 5 * s);
    ctx.fill();

    // Hat
    utils.drawPart(ctx, -11 * s, -13 * s, 22 * s, 7 * s, HAT_COLOR, 3 * s);
    ctx.fillStyle = utils.rgb(utils.darken(HAT_COLOR, 15));
    utils.roundRect(ctx, -12 * s, -7 * s, 24 * s, 2 * s, 1 * s);
    ctx.fill();
    // Hat detail
    ctx.fillStyle = utils.rgb(COIN_COLOR, 0.7);
    utils.fillCircle(ctx, -6 * s, -10 * s, 1.5 * s);

    // Eyebrows (friendly, raised)
    const browY = -5 * s - eyebrowRaise * s;
    ctx.strokeStyle = utils.rgb(HAIR);
    ctx.lineWidth = 1.8 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-7 * s, browY); ctx.lineTo(-3 * s, browY - 0.5 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(3 * s, browY - 0.5 * s); ctx.lineTo(7 * s, browY);
    ctx.stroke();

    // Friendly eyes (slightly larger, rounder)
    ctx.fillStyle = '#e8e4e0';
    utils.fillEllipse(ctx, -4 * s, -1 * s, 3 * s, 2.8 * s);
    utils.fillEllipse(ctx, 4 * s, -1 * s, 3 * s, 2.8 * s);
    ctx.fillStyle = '#3a2818';
    utils.fillEllipse(ctx, -4 * s, -1 * s, 1.8 * s, 2 * s);
    utils.fillEllipse(ctx, 4 * s, -1 * s, 1.8 * s, 2 * s);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    utils.fillCircle(ctx, -3 * s, -2 * s, 0.7 * s);
    utils.fillCircle(ctx, 5 * s, -2 * s, 0.7 * s);

    // Nose
    ctx.fillStyle = utils.rgb(SKIN_DARK, 0.4);
    utils.fillEllipse(ctx, 0, 2 * s, 2 * s, 1.8 * s);

    // Mouth (friendly smile)
    if (mouthOpen) {
      ctx.fillStyle = '#3a1a0a';
      utils.fillEllipse(ctx, 0, 5.5 * s, 3 * s, 2 * s);
      // Teeth
      ctx.fillStyle = '#ece8e0';
      utils.fillEllipse(ctx, 0, 5 * s, 2 * s, 0.8 * s);
    } else {
      ctx.strokeStyle = utils.rgb(SKIN_DARK, 0.7);
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.moveTo(-4 * s, 5 * s);
      ctx.quadraticCurveTo(0, 7 * s, 4 * s, 5 * s);
      ctx.stroke();
    }

    ctx.restore(); // head
    ctx.restore(); // frame
  },
};
