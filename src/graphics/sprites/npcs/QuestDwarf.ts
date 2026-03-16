// src/graphics/sprites/npcs/QuestDwarf.ts
import type { EntityDrawer, NPCAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN        = 0x9d8369;
const SKIN_DARK   = 0x83694f;
const SKIN_LIGHT  = 0xb1977d;
const HAIR        = 0x713d15;   // red-orange
const HAIR_LIGHT  = 0x8b5730;
const TUNIC       = 0x4a3d30;
const TUNIC_DARK  = 0x302215;
const BELT        = 0x2a1a0a;
const BOOT        = 0x2a1a0a;
const PICK_WOOD   = 0x3d2714;
const PICK_METAL  = 0x7a8a9a;
const PICK_LIGHT  = 0xaabac8;

export const QuestDwarfDrawer: EntityDrawer = {
  key: 'npc_quest_dwarf',
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

    // Dwarven proportions: squat and wide
    const bodyW = 1.25;   // wider torso
    const legH = 0.75;    // shorter legs

    let bob = 0;
    let bodyLean = 0;
    let headTilt = 0;
    let leftArmY = 0;
    let pickRot = 0;
    let pickY = 0;
    let mouthOpen = false;
    let eyebrowRaise = 0;
    let armsCrossed = false;

    switch (act) {
      case 'working': {
        // Swinging pickaxe
        const swing = Math.sin(phase);
        bob = swing > 0 ? -swing * 3 * s : 0;
        pickRot = swing > 0 ? -swing * 0.8 : swing * 0.3;
        pickY = swing > 0 ? -swing * 16 * s : swing * 5 * s;
        bodyLean = swing * 3 * s;
        leftArmY = Math.sin(phase + 0.5) * 3 * s;
        headTilt = swing * 0.06;
        break;
      }
      case 'alert': {
        // Grips pickaxe handle
        bob = -t * 1.5 * s;
        bodyLean = 0;
        headTilt = -t * 0.04;
        eyebrowRaise = 2 + t * 2;
        pickY = -5 * s * t;
        break;
      }
      case 'idle': {
        // Pickaxe resting on shoulder
        armsCrossed = false;
        bob = Math.sin(phase) * 1 * s;
        bodyLean = Math.sin(phase * 0.5) * 1.5 * s;
        leftArmY = Math.sin(phase) * 1.5 * s;
        pickY = -12 * s;
        pickRot = 0.3;
        headTilt = Math.sin(phase + 1) * 0.015;
        break;
      }
      case 'talking': {
        // Emphatic gestures with free hand
        bob = Math.sin(phase) * 1 * s;
        bodyLean = -1 * s + Math.sin(phase) * 1.5 * s;
        leftArmY = Math.sin(phase * 2) * 8 * s;
        pickY = -12 * s + Math.sin(phase) * 2 * s;
        pickRot = 0.2 + Math.sin(phase * 0.5) * 0.1;
        headTilt = Math.sin(phase * 1.5) * 0.03;
        mouthOpen = Math.sin(phase * 3) > 0.15;
        eyebrowRaise = Math.sin(phase * 2) > 0 ? 2 : 0;
        break;
      }
    }

    ctx.save();
    const by = ground + bob;

    // Shadow (wide for a stocky dwarf)
    ctx.fillStyle = 'rgba(0,0,0,0.31)';
    utils.fillEllipse(ctx, cx, ground + 3 * s, 25 * s, 5 * s);

    // ── Boots (shorter, wider) ──
    for (const side of [-1, 1]) {
      utils.drawPart(ctx, cx + side * 8 * s - 5 * s, by - 5 * s, 10 * s, 6 * s, BOOT, 2 * s);
    }

    // ── Legs (shorter, stocky) ──
    const legColor = utils.darken(TUNIC, 15);
    const legBase = by - 22 * s * legH;
    utils.drawPart(ctx, cx - 13 * s, legBase - 15 * s, 10 * s, 17 * s, legColor, 3 * s);
    utils.drawPart(ctx, cx + 3 * s, legBase - 15 * s, 10 * s, 17 * s, legColor, 3 * s);

    // ── Wide torso ──
    const torsoW = 26 * bodyW;
    utils.drawPart(ctx, cx - torsoW * 0.5 * s + bodyLean, by - 48 * s, torsoW * s, 30 * s, TUNIC, 4 * s);
    // Chest detail — horizontal rivets
    ctx.strokeStyle = utils.rgb(utils.darken(TUNIC, 30), 0.5);
    ctx.lineWidth = 0.8 * s;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - torsoW * 0.5 * s + bodyLean + 2 * s, by - 44 * s + i * 8 * s);
      ctx.lineTo(cx + torsoW * 0.5 * s + bodyLean - 2 * s, by - 44 * s + i * 8 * s);
      ctx.stroke();
    }

    // ── Belt ──
    utils.drawPart(ctx, cx - torsoW * 0.5 * s + bodyLean, by - 22 * s, torsoW * s, 5 * s, BELT, 1 * s);
    ctx.fillStyle = utils.rgb(0x7e6934);
    utils.roundRect(ctx, cx - 2.5 * s + bodyLean, by - 21.5 * s, 5 * s, 4 * s, 1 * s);
    ctx.fill();

    // ── Left arm (short, beefy) ──
    const laX = cx - (torsoW * 0.5 + 4) * s + bodyLean;
    const laBaseY = by - 46 * s;
    utils.drawLimb(ctx, [
      { x: laX + 4 * s, y: laBaseY },
      { x: laX + 3 * s, y: laBaseY + 9 * s },
      { x: laX + 3 * s, y: laBaseY + 15 * s + leftArmY },
    ], 6 * s, TUNIC_DARK);
    ctx.fillStyle = utils.rgb(SKIN);
    utils.fillCircle(ctx, laX + 3 * s, laBaseY + 15 * s + leftArmY, 4.5 * s);

    // ── Right arm + pickaxe ──
    const raX = cx + (torsoW * 0.5 - 2) * s + bodyLean;
    const raBaseY = by - 46 * s;
    const armEndX = raX + Math.sin(pickRot) * 13 * s;
    const armEndY = raBaseY + pickY + 15 * s * Math.cos(pickRot * 0.4);
    utils.drawLimb(ctx, [
      { x: raX, y: raBaseY },
      { x: raX + Math.sin(pickRot * 0.5) * 6 * s, y: raBaseY + 9 * s + pickY * 0.3 },
      { x: armEndX, y: armEndY },
    ], 6 * s, TUNIC_DARK);
    ctx.fillStyle = utils.rgb(SKIN);
    utils.fillCircle(ctx, armEndX, armEndY, 4.5 * s);

    // ── Pickaxe ──
    ctx.save();
    ctx.translate(armEndX, armEndY);
    ctx.rotate(pickRot - 0.2);
    // Handle
    ctx.fillStyle = utils.rgb(PICK_WOOD);
    ctx.fillRect(-2 * s, -18 * s, 4 * s, 24 * s);
    // Metal head
    utils.drawMetalSurface(ctx, -8 * s, -26 * s, 16 * s, 8 * s, PICK_METAL);
    // Pickaxe curve — pointed end
    ctx.fillStyle = utils.rgb(PICK_METAL);
    ctx.beginPath();
    ctx.moveTo(8 * s, -24 * s);
    ctx.lineTo(14 * s, -30 * s);
    ctx.lineTo(10 * s, -20 * s);
    ctx.closePath();
    ctx.fill();
    // Flat end (poll)
    ctx.fillStyle = utils.rgb(PICK_LIGHT);
    ctx.fillRect(-10 * s, -27 * s, 4 * s, 6 * s);
    // Metal highlight
    ctx.strokeStyle = utils.rgb(PICK_LIGHT, 0.5);
    ctx.lineWidth = 0.7 * s;
    ctx.beginPath();
    ctx.moveTo(-7 * s, -25 * s); ctx.lineTo(6 * s, -25 * s);
    ctx.stroke();
    ctx.restore();

    // ── Neck ──
    ctx.fillStyle = utils.rgb(SKIN_DARK);
    utils.roundRect(ctx, cx - 5 * s + bodyLean * 0.3, by - 54 * s, 10 * s, 8 * s, 2 * s);
    ctx.fill();

    // ── Head (wide, broad) ──
    const headX = cx + bodyLean * 0.3;
    const headY = by - 62 * s;

    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(headTilt);

    // Red hair (short but thick)
    ctx.fillStyle = utils.rgb(HAIR);
    utils.roundRect(ctx, -12 * s, -12 * s, 24 * s, 11 * s, 4 * s);
    ctx.fill();
    ctx.fillRect(-12 * s, -2 * s, 4 * s, 5 * s);
    ctx.fillRect(8 * s, -2 * s, 4 * s, 5 * s);
    ctx.fillStyle = utils.rgb(HAIR_LIGHT, 0.3);
    ctx.fillRect(-7 * s, -11 * s, 5 * s, 3 * s);

    // Broad face (wider proportions)
    const headGrad = ctx.createRadialGradient(-3 * s, -4 * s, 0, 0, 0, 14 * s);
    headGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    headGrad.addColorStop(0.5, utils.rgb(SKIN));
    headGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = headGrad;
    utils.roundRect(ctx, -12 * s, -9 * s, 24 * s, 18 * s, 4 * s);
    ctx.fill();

    // Hat (sturdy mining cap look)
    utils.drawPart(ctx, -13 * s, -14 * s, 26 * s, 8 * s, utils.darken(TUNIC, 5), 3 * s);
    ctx.fillStyle = utils.rgb(utils.darken(TUNIC, 20));
    utils.roundRect(ctx, -14 * s, -8 * s, 28 * s, 2.5 * s, 1 * s);
    ctx.fill();

    // Thick red eyebrows
    const browY = -5 * s - eyebrowRaise * s;
    ctx.strokeStyle = utils.rgb(HAIR);
    ctx.lineWidth = 2.5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-9 * s, browY); ctx.lineTo(-3 * s, browY + 0.5 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(9 * s, browY); ctx.lineTo(3 * s, browY + 0.5 * s);
    ctx.stroke();

    // Eyes (small, determined)
    ctx.fillStyle = '#ddd8d0';
    utils.fillEllipse(ctx, -5 * s, -1.5 * s, 2.8 * s, 2.3 * s);
    utils.fillEllipse(ctx, 5 * s, -1.5 * s, 2.8 * s, 2.3 * s);
    ctx.fillStyle = '#2a1808';
    utils.fillEllipse(ctx, -5 * s, -1.5 * s, 1.7 * s, 1.8 * s);
    utils.fillEllipse(ctx, 5 * s, -1.5 * s, 1.7 * s, 1.8 * s);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    utils.fillCircle(ctx, -4 * s, -2.5 * s, 0.65 * s);
    utils.fillCircle(ctx, 6 * s, -2.5 * s, 0.65 * s);

    // Broad nose
    ctx.fillStyle = utils.rgb(SKIN_DARK, 0.45);
    utils.fillEllipse(ctx, 0, 2 * s, 3 * s, 2.2 * s);

    // Mouth
    if (mouthOpen) {
      ctx.fillStyle = '#3a1a08';
      utils.fillEllipse(ctx, 0, 6.5 * s, 3.5 * s, 2 * s);
      ctx.fillStyle = '#ece8e0';
      utils.fillEllipse(ctx, 0, 6 * s, 2 * s, 0.8 * s);
    } else {
      ctx.strokeStyle = utils.rgb(SKIN_DARK, 0.7);
      ctx.lineWidth = 1.5 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-4.5 * s, 6 * s);
      ctx.quadraticCurveTo(0, 7.5 * s, 4.5 * s, 6 * s);
      ctx.stroke();
    }

    // Prominent red beard
    ctx.fillStyle = utils.rgb(HAIR);
    ctx.beginPath();
    ctx.moveTo(-10 * s, 6 * s);
    ctx.lineTo(10 * s, 6 * s);
    ctx.lineTo(8 * s, 17 * s);
    ctx.lineTo(0, 21 * s);
    ctx.lineTo(-8 * s, 17 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = utils.rgb(HAIR_LIGHT, 0.3);
    ctx.beginPath();
    ctx.moveTo(-4 * s, 7 * s); ctx.lineTo(4 * s, 7 * s);
    ctx.lineTo(2 * s, 14 * s); ctx.lineTo(-2 * s, 14 * s);
    ctx.closePath();
    ctx.fill();

    ctx.restore(); // head
    ctx.restore(); // frame
  },
};
