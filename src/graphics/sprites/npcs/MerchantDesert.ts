// src/graphics/sprites/npcs/MerchantDesert.ts
import type { EntityDrawer, NPCAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN        = 0x906942;
const SKIN_DARK   = 0x714f27;
const SKIN_LIGHT  = 0xa47d4f;
const KOHL        = 0x1a0a0a;   // dark eye liner
const ROBE_OUTER  = 0x715730;
const ROBE_INNER  = 0x573d15;
const ROBE_TRIM   = 0xd4a030;
const HOOD_COLOR  = 0x9d7634;
const BOOT        = 0x3d2714;
const SACK_COLOR  = 0x644a22;
const SACK_LIGHT  = 0x836934;

export const MerchantDesertDrawer: EntityDrawer = {
  key: 'npc_merchant_desert',
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
    let presentExtend = 0;

    switch (act) {
      case 'working': {
        // Presenting wares — both hands extend outward
        bob = Math.sin(phase) * 1 * s;
        presentExtend = Math.sin(phase * 2) * 4 * s;
        rightArmY = Math.sin(phase) * 3 * s;
        leftArmY = Math.sin(phase + Math.PI) * 3 * s;
        bodyLean = Math.sin(phase) * 1 * s;
        break;
      }
      case 'alert': {
        // Peering from under hood
        bob = -t * 1.5 * s;
        headTilt = t * 0.05;  // leans forward under hood
        eyebrowRaise = 1.5 + t * 1.5;
        rightArmY = -2 * s;
        leftArmY = -2 * s;
        break;
      }
      case 'idle': {
        bob = Math.sin(phase) * 1 * s;
        bodyLean = Math.sin(phase * 0.5) * 0.8 * s;
        leftArmY = Math.sin(phase) * 2 * s;
        rightArmY = Math.sin(phase + Math.PI) * 2 * s;
        headTilt = Math.sin(phase + 1) * 0.015;
        break;
      }
      case 'talking': {
        // Flourishing hand gesture
        bob = Math.sin(phase) * 0.8 * s;
        bodyLean = -1 * s + Math.sin(phase) * 1.5 * s;
        leftArmY = Math.sin(phase * 2) * 7 * s;
        rightArmY = Math.sin(phase * 2 + 1) * 4 * s;
        headTilt = Math.sin(phase * 1.5) * 0.03;
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
      const bx = cx + side * 6 * s;
      utils.drawPart(ctx, bx - 4 * s, by - 5 * s, 8 * s, 6 * s, BOOT, 2 * s);
    }

    // ── Desert robe (full body) ──
    // Robe bottom flares slightly
    ctx.fillStyle = utils.rgb(ROBE_OUTER);
    ctx.beginPath();
    ctx.moveTo(cx - 14 * s + bodyLean, by - 48 * s);
    ctx.lineTo(cx - 16 * s + bodyLean, by);
    ctx.lineTo(cx + 16 * s + bodyLean, by);
    ctx.lineTo(cx + 14 * s + bodyLean, by - 48 * s);
    ctx.closePath();
    ctx.fill();
    // Robe shading
    utils.drawPart(ctx, cx - 13 * s + bodyLean, by - 48 * s, 26 * s, 46 * s, ROBE_OUTER, 4 * s);
    // Inner robe fold
    ctx.fillStyle = utils.rgb(ROBE_INNER, 0.4);
    ctx.fillRect(cx - 3 * s + bodyLean, by - 46 * s, 6 * s, 44 * s);
    // Trim at hem and cuffs
    ctx.fillStyle = utils.rgb(ROBE_TRIM, 0.7);
    ctx.fillRect(cx - 15 * s + bodyLean, by - 2 * s, 30 * s, 2 * s);
    // Sash / belt
    ctx.fillStyle = utils.rgb(ROBE_TRIM);
    utils.roundRect(ctx, cx - 14 * s + bodyLean, by - 28 * s, 28 * s, 4 * s, 1 * s);
    ctx.fill();

    // ── Left arm (under robe sleeve) ──
    const laX = cx - 18 * s + bodyLean;
    const laBaseY = by - 45 * s;
    utils.drawLimb(ctx, [
      { x: laX + 4 * s, y: laBaseY },
      { x: laX + 3 * s, y: laBaseY + 10 * s },
      { x: laX + 2 * s + presentExtend, y: laBaseY + 17 * s + leftArmY },
    ], 4 * s, ROBE_OUTER);
    ctx.fillStyle = utils.rgb(SKIN);
    utils.fillCircle(ctx, laX + 2 * s + presentExtend, laBaseY + 17 * s + leftArmY, 3.5 * s);
    // Cuff trim
    ctx.fillStyle = utils.rgb(ROBE_TRIM, 0.6);
    utils.fillEllipse(ctx, laX + 2 * s + presentExtend, laBaseY + 14 * s + leftArmY, 4 * s, 2 * s);

    // ── Right arm ──
    const raX = cx + 14 * s + bodyLean;
    const raBaseY = by - 45 * s;
    utils.drawLimb(ctx, [
      { x: raX, y: raBaseY },
      { x: raX + 1 * s, y: raBaseY + 10 * s },
      { x: raX + 1 * s - presentExtend, y: raBaseY + 17 * s + rightArmY },
    ], 4 * s, ROBE_OUTER);
    const rhX = raX + 1 * s - presentExtend;
    const rhY = raBaseY + 17 * s + rightArmY;
    ctx.fillStyle = utils.rgb(SKIN);
    utils.fillCircle(ctx, rhX, rhY, 3.5 * s);
    ctx.fillStyle = utils.rgb(ROBE_TRIM, 0.6);
    utils.fillEllipse(ctx, rhX, rhY - 3 * s, 4 * s, 2 * s);

    // ── Cloth sack in right hand ──
    if (act !== 'talking') {
      const sackGrad = ctx.createRadialGradient(rhX, rhY - 4 * s, 0, rhX, rhY - 4 * s, 6 * s);
      sackGrad.addColorStop(0, utils.rgb(SACK_LIGHT));
      sackGrad.addColorStop(1, utils.rgb(SACK_COLOR));
      ctx.fillStyle = sackGrad;
      utils.fillEllipse(ctx, rhX, rhY - 4 * s, 5 * s, 6 * s);
      // Drawstring knot
      ctx.fillStyle = utils.rgb(utils.darken(SACK_COLOR, 20));
      utils.fillCircle(ctx, rhX, rhY - 8 * s, 1.5 * s);
      ctx.strokeStyle = utils.rgb(utils.darken(SACK_COLOR, 20));
      ctx.lineWidth = 0.8 * s;
      ctx.beginPath();
      ctx.moveTo(rhX - 3 * s, rhY - 7 * s);
      ctx.quadraticCurveTo(rhX, rhY - 9 * s, rhX + 3 * s, rhY - 7 * s);
      ctx.stroke();
      // Small texture stitches on sack
      ctx.strokeStyle = utils.rgb(utils.darken(SACK_COLOR, 25), 0.35);
      ctx.lineWidth = 0.5 * s;
      for (let i = 0; i < 3; i++) {
        const sy = rhY - 3 * s + i * 2 * s;
        ctx.beginPath();
        ctx.moveTo(rhX - 3 * s, sy); ctx.lineTo(rhX + 3 * s, sy);
        ctx.stroke();
      }
    } else {
      // Talking: flourishing hand — gem/trinket displayed
      ctx.fillStyle = utils.rgb(ROBE_TRIM);
      utils.fillCircle(ctx, rhX, rhY - 5 * s, 3 * s);
      ctx.fillStyle = 'rgba(255,220,80,0.4)';
      utils.fillCircle(ctx, rhX, rhY - 5 * s, 5 * s);
    }

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

    // Hood (large, pointed)
    ctx.fillStyle = utils.rgb(HOOD_COLOR);
    ctx.beginPath();
    ctx.moveTo(0, -18 * s);
    ctx.lineTo(-15 * s, 6 * s);
    ctx.lineTo(15 * s, 6 * s);
    ctx.closePath();
    ctx.fill();
    // Hood shadow rim
    ctx.fillStyle = utils.rgb(utils.darken(HOOD_COLOR, 20));
    ctx.beginPath();
    ctx.arc(0, 4 * s, 13 * s, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    // Hood texture
    utils.drawLeatherTexture(ctx, -12 * s, -16 * s, 24 * s, 22 * s, HOOD_COLOR);

    // Face (mostly shadowed, visible below hood rim)
    const faceGrad = ctx.createLinearGradient(0, -4 * s, 0, 10 * s);
    faceGrad.addColorStop(0, utils.rgb(SKIN_DARK));
    faceGrad.addColorStop(0.4, utils.rgb(SKIN));
    faceGrad.addColorStop(1, utils.rgb(SKIN));
    ctx.fillStyle = faceGrad;
    utils.roundRect(ctx, -9 * s, -4 * s, 18 * s, 14 * s, 4 * s);
    ctx.fill();

    // Kohl-outlined eyes (dark, sharp)
    const eyeY = -1 * s;
    // Kohl shadow (elongated)
    ctx.fillStyle = utils.rgb(KOHL, 0.7);
    utils.fillEllipse(ctx, -4 * s, eyeY, 4 * s, 2.5 * s);
    utils.fillEllipse(ctx, 4 * s, eyeY, 4 * s, 2.5 * s);
    // Eye whites
    ctx.fillStyle = '#e8e0d0';
    utils.fillEllipse(ctx, -4 * s, eyeY, 2.8 * s, 2 * s);
    utils.fillEllipse(ctx, 4 * s, eyeY, 2.8 * s, 2 * s);
    // Dark iris
    ctx.fillStyle = '#1a0a08';
    utils.fillEllipse(ctx, -4 * s, eyeY, 1.8 * s, 1.8 * s);
    utils.fillEllipse(ctx, 4 * s, eyeY, 1.8 * s, 1.8 * s);
    // Highlight
    ctx.fillStyle = 'rgba(255,240,200,0.5)';
    utils.fillCircle(ctx, -3 * s, eyeY - 0.5 * s, 0.6 * s);
    utils.fillCircle(ctx, 5 * s, eyeY - 0.5 * s, 0.6 * s);

    // Eyebrow raise
    const browY = -4 * s - eyebrowRaise * s;
    ctx.strokeStyle = utils.rgb(KOHL, 0.8);
    ctx.lineWidth = 1.5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-7 * s, browY); ctx.lineTo(-2 * s, browY - 1 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(7 * s, browY); ctx.lineTo(2 * s, browY - 1 * s);
    ctx.stroke();

    // Nose (sharper)
    ctx.fillStyle = utils.rgb(SKIN_DARK, 0.4);
    ctx.beginPath();
    ctx.moveTo(0, 1 * s);
    ctx.lineTo(-2 * s, 3.5 * s);
    ctx.lineTo(2 * s, 3.5 * s);
    ctx.closePath();
    ctx.fill();

    // Mouth
    if (mouthOpen) {
      ctx.fillStyle = '#2a1008';
      utils.fillEllipse(ctx, 0, 6.5 * s, 2.5 * s, 1.5 * s);
    } else {
      ctx.strokeStyle = utils.rgb(SKIN_DARK, 0.6);
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.moveTo(-3 * s, 6 * s);
      ctx.quadraticCurveTo(0, 7.5 * s, 3 * s, 6 * s);
      ctx.stroke();
    }

    ctx.restore(); // head
    ctx.restore(); // frame
  },
};
