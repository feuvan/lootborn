// src/graphics/sprites/npcs/Stash.ts
import type { EntityDrawer, NPCAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN        = 0x90765c;
const SKIN_DARK   = 0x765c42;
const SKIN_LIGHT  = 0xa48a69;
const HAIR        = 0x4a3d30;
const ROBE        = 0x30153d;
const ROBE_LIGHT  = 0x4a3057;
const ROBE_TRIM   = 0x8a5ac0;   // purple arcane
const SHIRT       = 0x2a1a3a;
const BELT        = 0x2a1a3a;
const BOOT        = 0x1a1a2a;
const BOOK_COVER  = 0x8a5ac0;
const BOOK_PAGE   = 0xe8e0d0;
const GLASS_COLOR = 0x88ccee;

export const StashDrawer: EntityDrawer = {
  key: 'npc_stash',
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
    let writingPhase = 0;

    switch (act) {
      case 'working': {
        // Reading/writing in book
        bob = Math.sin(phase) * 0.8 * s;
        rightArmY = Math.sin(phase * 2) * 2.5 * s;
        leftArmY = 2 * s;   // left holds book steady
        bodyLean = Math.sin(phase) * 0.5 * s;
        headTilt = 0.08;    // looking down at book
        writingPhase = phase;
        break;
      }
      case 'alert': {
        bob = t * -2 * s;
        headTilt = t * -0.06;
        eyebrowRaise = 2 + t * 1.5;
        rightArmY = -2 * s;
        leftArmY = -2 * s;
        break;
      }
      case 'idle': {
        bob = Math.sin(phase) * 1 * s;
        bodyLean = Math.sin(phase * 0.5) * 0.8 * s;
        leftArmY = Math.sin(phase) * 1.5 * s;
        rightArmY = Math.sin(phase + Math.PI) * 1.5 * s;
        headTilt = Math.sin(phase + 1) * 0.015;
        break;
      }
      case 'talking': {
        // Points at arcane symbols
        bob = Math.sin(phase) * 0.8 * s;
        bodyLean = -1 * s + Math.sin(phase) * 1 * s;
        leftArmY = Math.sin(phase * 2) * 8 * s;   // pointing hand
        rightArmY = Math.sin(phase + 1) * 2 * s;
        headTilt = Math.sin(phase * 1.5) * 0.025;
        mouthOpen = Math.sin(phase * 3) > 0.25;
        eyebrowRaise = Math.sin(phase * 2) > 0 ? 1 : 0;
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
      const bx = cx + side * 5.5 * s;
      utils.drawPart(ctx, bx - 4 * s, by - 5 * s, 8 * s, 6 * s, BOOT, 2 * s);
    }

    // ── Legs ──
    utils.drawPart(ctx, cx - 10 * s, by - 23 * s, 8 * s, 19 * s, ROBE, 3 * s);
    utils.drawPart(ctx, cx + 2 * s, by - 23 * s, 8 * s, 19 * s, ROBE, 3 * s);

    // Soft outline glow (warm — NPC)
    utils.softOutline(ctx, 'rgba(180,150,100,0.15)', 5);

    // ── Robe body ──
    utils.drawPart(ctx, cx - 12 * s + bodyLean, by - 50 * s, 24 * s, 30 * s, ROBE, 5 * s);
    // Robe highlights
    ctx.fillStyle = utils.rgb(ROBE_LIGHT, 0.3);
    ctx.fillRect(cx - 11 * s + bodyLean, by - 48 * s, 4 * s, 26 * s);
    // Arcane trim
    ctx.strokeStyle = utils.rgb(ROBE_TRIM, 0.6);
    ctx.lineWidth = 1 * s;
    utils.roundRect(ctx, cx - 12 * s + bodyLean, by - 50 * s, 24 * s, 30 * s, 5 * s);
    ctx.stroke();
    // Collar arcane symbol hint
    ctx.fillStyle = utils.rgb(ROBE_TRIM, 0.5);
    utils.fillCircle(ctx, cx + bodyLean, by - 46 * s, 3 * s);

    // ── Belt ──
    utils.drawPart(ctx, cx - 11 * s + bodyLean, by - 22 * s, 22 * s, 4 * s, BELT, 1 * s);

    // End soft outline
    utils.softOutlineEnd(ctx);

    // ── Left arm + hand ──
    const laX = cx - 16 * s + bodyLean;
    const laBaseY = by - 45 * s;
    utils.drawLimb(ctx, [
      { x: laX + 3 * s, y: laBaseY },
      { x: laX + 2 * s, y: laBaseY + 9 * s },
      { x: laX + 2 * s, y: laBaseY + 16 * s + leftArmY },
    ], 4 * s, ROBE);
    const lhX = laX + 2 * s;
    const lhY = laBaseY + 16 * s + leftArmY;
    ctx.fillStyle = utils.rgb(SKIN);
    utils.fillCircle(ctx, lhX, lhY, 3.5 * s);

    // ── Right arm + hand ──
    const raX = cx + 12 * s + bodyLean;
    const raBaseY = by - 45 * s;
    utils.drawLimb(ctx, [
      { x: raX + 1 * s, y: raBaseY },
      { x: raX + 2 * s, y: raBaseY + 9 * s },
      { x: raX + 2 * s, y: raBaseY + 16 * s + rightArmY },
    ], 4 * s, ROBE);
    const rhX = raX + 2 * s;
    const rhY = raBaseY + 16 * s + rightArmY;
    ctx.fillStyle = utils.rgb(SKIN);
    utils.fillCircle(ctx, rhX, rhY, 3.5 * s);

    // ── Book held / displayed ──
    if (act === 'working' || act === 'idle') {
      // Book in right hand (with left supporting)
      const bookX = (lhX + rhX) * 0.5 - 4 * s;
      const bookY = Math.min(lhY, rhY) - 3 * s;
      // Book cover
      ctx.fillStyle = utils.rgb(BOOK_COVER);
      utils.roundRect(ctx, bookX, bookY, 10 * s, 12 * s, 1.5 * s);
      ctx.fill();
      // Spine
      ctx.fillStyle = utils.rgb(utils.darken(BOOK_COVER, 20));
      ctx.fillRect(bookX, bookY, 2.5 * s, 12 * s);
      // Pages
      ctx.fillStyle = utils.rgb(BOOK_PAGE);
      ctx.fillRect(bookX + 2.5 * s, bookY + 1 * s, 7 * s, 10 * s);
      // Page lines (writing animation)
      ctx.strokeStyle = utils.rgb(0x6a5a8a, 0.5);
      ctx.lineWidth = 0.5 * s;
      for (let i = 0; i < 5; i++) {
        const ly = bookY + 2.5 * s + i * 1.8 * s;
        // Writing animation: lines appear progressively
        const lineW = act === 'working'
          ? (i < Math.floor((writingPhase / (Math.PI * 2)) * 6) ? 6 * s : 2 * s + Math.sin(writingPhase * 2) * 2 * s)
          : 6 * s;
        ctx.beginPath();
        ctx.moveTo(bookX + 3 * s, ly); ctx.lineTo(bookX + 3 * s + lineW, ly);
        ctx.stroke();
      }
      // Arcane symbol on page
      ctx.fillStyle = utils.rgb(ROBE_TRIM, 0.4);
      utils.fillCircle(ctx, bookX + 5 * s, bookY + 6 * s, 2 * s);
    } else if (act === 'talking') {
      // Pointing finger extended — arcane symbol glows near pointed hand
      const pointX = lhX - 5 * s;
      const pointY = lhY - 6 * s;
      // Glowing arcane circle
      const glowGrad = ctx.createRadialGradient(pointX, pointY, 0, pointX, pointY, 8 * s);
      glowGrad.addColorStop(0, utils.rgb(ROBE_TRIM, 0.5));
      glowGrad.addColorStop(0.5, utils.rgb(ROBE_TRIM, 0.2));
      glowGrad.addColorStop(1, utils.rgb(ROBE_TRIM, 0));
      ctx.fillStyle = glowGrad;
      utils.fillCircle(ctx, pointX, pointY, 8 * s);
      ctx.strokeStyle = utils.rgb(ROBE_TRIM, 0.7);
      ctx.lineWidth = 1 * s;
      utils.fillCircle(ctx, pointX, pointY, 3 * s);
      // Runic lines radiating
      for (let i = 0; i < 4; i++) {
        const angle = i * (Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(pointX + Math.cos(angle) * 4 * s, pointY + Math.sin(angle) * 4 * s);
        ctx.lineTo(pointX + Math.cos(angle) * 7 * s, pointY + Math.sin(angle) * 7 * s);
        ctx.stroke();
      }
    }

    // ── Neck ──
    ctx.fillStyle = utils.rgb(SKIN_DARK);
    utils.roundRect(ctx, cx - 4 * s + bodyLean * 0.3, by - 55 * s, 8 * s, 8 * s, 2 * s);
    ctx.fill();

    // ── Head ──
    const headX = cx + bodyLean * 0.3;
    const headY = by - 63 * s;

    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(headTilt);

    // Medium brown hair
    ctx.fillStyle = utils.rgb(HAIR);
    utils.roundRect(ctx, -10 * s, -12 * s, 20 * s, 11 * s, 3 * s);
    ctx.fill();
    ctx.fillRect(-10 * s, -3 * s, 3 * s, 5 * s);
    ctx.fillRect(7 * s, -3 * s, 3 * s, 5 * s);
    // Hair highlight
    ctx.fillStyle = utils.rgb(utils.lighten(HAIR, 20), 0.2);
    ctx.fillRect(-6 * s, -11 * s, 6 * s, 3 * s);

    // Face
    const headGrad = ctx.createRadialGradient(-2 * s, -3 * s, 0, 0, 0, 12 * s);
    headGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    headGrad.addColorStop(0.5, utils.rgb(SKIN));
    headGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = headGrad;
    utils.roundRect(ctx, -10 * s, -9 * s, 20 * s, 18 * s, 5 * s);
    ctx.fill();

    // Scholarly hat (low-brimmed dark cap)
    utils.drawPart(ctx, -11 * s, -14 * s, 22 * s, 8 * s, utils.darken(ROBE, 10), 3 * s);
    ctx.fillStyle = utils.rgb(utils.darken(ROBE, 20));
    utils.roundRect(ctx, -12 * s, -7 * s, 24 * s, 2.5 * s, 1 * s);
    ctx.fill();
    // Arcane trim on hat
    ctx.strokeStyle = utils.rgb(ROBE_TRIM, 0.5);
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(-10 * s, -7 * s); ctx.lineTo(10 * s, -7 * s);
    ctx.stroke();

    // Glasses (two small circles connected)
    ctx.strokeStyle = utils.rgb(GLASS_COLOR, 0.7);
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.arc(-4 * s, -1 * s, 3 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(4 * s, -1 * s, 3 * s, 0, Math.PI * 2);
    ctx.stroke();
    // Bridge
    ctx.beginPath();
    ctx.moveTo(-1 * s, -1 * s); ctx.lineTo(1 * s, -1 * s);
    ctx.stroke();
    // Glass tint
    ctx.fillStyle = utils.rgb(GLASS_COLOR, 0.12);
    utils.fillCircle(ctx, -4 * s, -1 * s, 3 * s);
    utils.fillCircle(ctx, 4 * s, -1 * s, 3 * s);

    // Eyes (behind glasses)
    ctx.fillStyle = '#2a2820';
    utils.fillEllipse(ctx, -4 * s, -1 * s, 1.5 * s, 1.8 * s);
    utils.fillEllipse(ctx, 4 * s, -1 * s, 1.5 * s, 1.8 * s);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    utils.fillCircle(ctx, -3.3 * s, -1.8 * s, 0.6 * s);
    utils.fillCircle(ctx, 4.7 * s, -1.8 * s, 0.6 * s);

    // Eyebrows
    const browY = -5 * s - eyebrowRaise * s;
    ctx.strokeStyle = utils.rgb(HAIR, 0.8);
    ctx.lineWidth = 1.5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-7 * s, browY); ctx.lineTo(-2 * s, browY - 0.5 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2 * s, browY - 0.5 * s); ctx.lineTo(7 * s, browY);
    ctx.stroke();

    // Nose (scholarly, slightly pointy)
    ctx.fillStyle = utils.rgb(SKIN_DARK, 0.45);
    ctx.beginPath();
    ctx.moveTo(0, 1.5 * s);
    ctx.lineTo(-1.5 * s, 3.5 * s);
    ctx.lineTo(1.5 * s, 3.5 * s);
    ctx.closePath();
    ctx.fill();

    // Mouth
    if (mouthOpen) {
      ctx.fillStyle = '#3a1a0a';
      utils.fillEllipse(ctx, 0, 6 * s, 2.5 * s, 1.5 * s);
    } else {
      ctx.strokeStyle = utils.rgb(SKIN_DARK, 0.6);
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.moveTo(-3 * s, 5.5 * s);
      ctx.quadraticCurveTo(0, 7 * s, 3 * s, 5.5 * s);
      ctx.stroke();
    }

    ctx.restore(); // head
    ctx.restore(); // frame
  },
};
