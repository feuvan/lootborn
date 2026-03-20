// src/graphics/sprites/players/PlayerRogue.ts
import type { EntityDrawer, PlayerAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const LEATHER_BASE = 0x1e2a1e;
const LEATHER_DARK = 0x131e13;
const LEATHER_LIGHT= 0x2a412a;
const CLOAK_COLOR  = 0x1e2a13;
const SKIN         = 0x735c45;
const SKIN_DARK    = 0x58412e;
const BLADE_COLOR  = 0x8a8a9a;
const BUCKLE_COLOR = 0xb8a030;
const BANDOLIER    = 0x352317;
const WRAP_COLOR   = 0x2a2a1e;

export const PlayerRogueDrawer: EntityDrawer = {
  key: 'player_rogue',
  frameW: 64,
  frameH: 96,
  totalFrames: 24,

  drawFrame(ctx, frame, action, w, h, utils) {
    const act = action as PlayerAction;
    const s = w / 64;

    const frameCounts: Record<PlayerAction, number> = {
      idle: 4, walk: 6, attack: 4, hurt: 2, death: 4, cast: 4,
    };
    const count = frameCounts[act] || 4;
    const localFrame = frame % count;
    const t = count > 1 ? localFrame / (count - 1) : 0;
    const phase = (localFrame / count) * Math.PI * 2;

    let alpha = 1;
    let bodyOffsetY = 0;
    let globalRotation = 0;
    let lunge = 0;
    let rightDaggerAngle = -Math.PI * 0.3;
    let leftDaggerAngle  = -Math.PI * 0.7;
    let castGlow = 0;

    switch (act) {
      case 'idle':
        // Agile weight-shift
        bodyOffsetY = Math.sin(phase) * 1.2 * s;
        break;
      case 'walk':
        bodyOffsetY = -Math.abs(Math.sin(phase)) * 1.5 * s;
        lunge = Math.sin(phase) * 0.3;
        break;
      case 'attack':
        // Quick dual stab: both daggers thrust forward
        lunge = t * 0.6;
        rightDaggerAngle = -Math.PI * 0.3 + t * Math.PI * 0.4;
        leftDaggerAngle  = -Math.PI * 0.7 - t * Math.PI * 0.2;
        bodyOffsetY = -t * 2 * s;
        break;
      case 'hurt':
        bodyOffsetY = t * 4 * s;
        alpha = 0.7 + t * 0.3;
        break;
      case 'death':
        globalRotation = -t * Math.PI * 0.45; // fall back
        bodyOffsetY = t * h * 0.38;
        alpha = 1 - t * 0.8;
        break;
      case 'cast':
        // Shadow-step power charge — daggers glow, crouch
        castGlow = 0.5 + Math.sin(phase) * 0.5;
        bodyOffsetY = 3 * s + Math.sin(phase) * 1.5 * s;
        rightDaggerAngle = -Math.PI * 0.3 - Math.sin(phase) * 0.2;
        leftDaggerAngle  = -Math.PI * 0.7 + Math.sin(phase) * 0.2;
        break;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = w / 2;
    const baseY = h * 0.95;

    ctx.translate(cx, baseY + bodyOffsetY);
    ctx.rotate(globalRotation);
    ctx.translate(-cx, -(baseY + bodyOffsetY));

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.24)';
    utils.fillEllipse(ctx, cx, baseY + 1 * s, 13 * s, 2.8 * s);

    // ── Legs / Wrapped Boots ───────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const hipX = cx + side * 6 * s + lunge * side * 2 * s;
      const hipY = baseY - 26 * s + bodyOffsetY;
      const kneeX = hipX + side * 1 * s + Math.sin(legPhase) * 3 * s;
      const kneeY = hipY + 13 * s;
      const footX = hipX + side * 2 * s + Math.sin(legPhase) * 2 * s;
      const footY = baseY - 2 * s;

      utils.drawLimb(ctx, [
        { x: hipX, y: hipY },
        { x: kneeX, y: kneeY },
        { x: footX, y: footY },
      ], 4 * s, LEATHER_DARK);

      // Wrapped boot — leather texture
      utils.drawLeatherTexture(ctx, footX - 4.5 * s, footY - 10 * s, 9 * s, 12 * s, LEATHER_BASE);
      // Cross-hatch wrapping on boot
      ctx.strokeStyle = utils.rgb(LEATHER_DARK, 0.6);
      ctx.lineWidth = 0.5 * s;
      for (let i = 0; i < 4; i++) {
        // Horizontal straps
        ctx.beginPath();
        ctx.moveTo(footX - 4 * s, footY - 3 * s - i * 2.5 * s);
        ctx.lineTo(footX + 4 * s, footY - 3 * s - i * 2.5 * s);
        ctx.stroke();
        // Diagonal cross
        ctx.beginPath();
        ctx.moveTo(footX - 3 * s + i * 2 * s, footY - 2 * s);
        ctx.lineTo(footX - 1 * s + i * 2 * s, footY - 10 * s);
        ctx.stroke();
      }
      // Boot toe (soft, rounded)
      ctx.fillStyle = utils.rgb(LEATHER_BASE);
      utils.fillEllipse(ctx, footX + 2 * s, footY - 1 * s, 4.5 * s, 2.5 * s);
    }

    // ── Torso / Leather Armor ──────────────────────────────────────────────
    const torsoX = cx + lunge * 5 * s;
    const torsoY = baseY - 50 * s + bodyOffsetY;

    // Soft outline glow
    utils.softOutline(ctx, 'rgba(200, 200, 220, 0.2)', 5);

    // Leather chest piece
    utils.drawLeatherTexture(ctx, torsoX - 9 * s, torsoY - 12 * s, 18 * s, 26 * s, LEATHER_BASE);
    // Chest center panel — slightly lighter
    ctx.fillStyle = utils.rgb(LEATHER_LIGHT, 0.5);
    ctx.fillRect(torsoX - 4 * s, torsoY - 10 * s, 8 * s, 16 * s);
    // Buckle details on chest
    ctx.fillStyle = utils.rgb(BUCKLE_COLOR);
    ctx.fillRect(torsoX - 1.5 * s, torsoY - 5 * s, 3 * s, 2.5 * s);
    ctx.fillRect(torsoX - 1.5 * s, torsoY + 1 * s, 3 * s, 2.5 * s);
    ctx.fillStyle = utils.rgb(LEATHER_DARK);
    utils.fillCircle(ctx, torsoX, torsoY - 3.7 * s, 1 * s);
    utils.fillCircle(ctx, torsoX, torsoY + 2.2 * s, 1 * s);

    // Bandolier — diagonal strap from right shoulder down-left
    ctx.strokeStyle = utils.rgb(BANDOLIER, 0.9);
    ctx.lineWidth = 2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(torsoX + 9 * s, torsoY - 12 * s);
    ctx.lineTo(torsoX - 7 * s, torsoY + 10 * s);
    ctx.stroke();
    // Pouches on bandolier
    for (let i = 0; i < 3; i++) {
      const bt = 0.2 + i * 0.3;
      const bx = torsoX + 9 * s + (torsoX - 7 * s - torsoX - 9 * s) * bt;
      const by = torsoY - 12 * s + (torsoY + 10 * s - torsoY + 12 * s) * bt;
      ctx.fillStyle = utils.rgb(utils.darken(BANDOLIER, 10));
      ctx.fillRect(bx - 2.5 * s, by - 2 * s, 5 * s, 4 * s);
      ctx.fillStyle = utils.rgb(BUCKLE_COLOR, 0.6);
      ctx.fillRect(bx - 1 * s, by - 1 * s, 2 * s, 2 * s);
    }

    // Waist belt
    ctx.fillStyle = utils.rgb(LEATHER_DARK);
    ctx.fillRect(torsoX - 9 * s, torsoY + 12 * s, 18 * s, 4 * s);
    ctx.fillStyle = utils.rgb(BUCKLE_COLOR);
    ctx.fillRect(torsoX - 2 * s, torsoY + 12 * s, 4 * s, 4 * s);

    // End soft outline
    utils.softOutlineEnd(ctx);

    // Rim light on head
    utils.rimLight(ctx, cx + lunge * 2 * s, baseY - 50 * s + bodyOffsetY - 20 * s, 8 * s, 8.5 * s, 'rgba(180,190,200,0.1)');

    // ── Asymmetric Cloak (draped over left shoulder) ───────────────────────
    const cloakOffsetY = act === 'walk' ? Math.sin(phase) * 2 * s : 0;
    ctx.fillStyle = utils.rgb(CLOAK_COLOR, 0.85);
    ctx.beginPath();
    ctx.moveTo(torsoX - 9 * s, torsoY - 12 * s);              // left shoulder
    ctx.lineTo(torsoX + 2 * s, torsoY - 14 * s);              // across top
    ctx.lineTo(torsoX - 4 * s, torsoY + 18 * s + cloakOffsetY); // lower right edge
    ctx.lineTo(torsoX - 16 * s, torsoY + 10 * s + cloakOffsetY); // lower left
    ctx.closePath();
    ctx.fill();
    // Cloak edge highlight
    ctx.strokeStyle = utils.rgb(LEATHER_LIGHT, 0.3);
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(torsoX + 2 * s, torsoY - 14 * s);
    ctx.lineTo(torsoX - 4 * s, torsoY + 18 * s + cloakOffsetY);
    ctx.stroke();

    // ── Arms ──────────────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const isRight = side === 1;
      const armPhase = act === 'walk' ? phase + (isRight ? Math.PI : 0) : 0;
      const shoulderX = torsoX + side * 10 * s;
      const shoulderY = torsoY - 10 * s;

      let elbowX: number, elbowY: number, handX: number, handY: number;

      if (act === 'attack') {
        // Quick thrust: both arms forward
        const thrustOff = t * 8 * s;
        elbowX = shoulderX + side * 3 * s + thrustOff;
        elbowY = shoulderY + 5 * s - t * 3 * s;
        handX = elbowX + side * 4 * s + thrustOff * 0.5;
        handY = elbowY + 5 * s - t * 2 * s;
      } else {
        elbowX = shoulderX + side * 2 * s + Math.sin(armPhase) * 2 * s;
        elbowY = shoulderY + 8 * s;
        handX = elbowX + side * 2 * s + Math.sin(armPhase) * 1.5 * s;
        handY = elbowY + 7 * s + Math.sin(armPhase) * 2 * s;
      }

      // Arm — leather sleeve
      utils.drawLimb(ctx, [
        { x: shoulderX, y: shoulderY },
        { x: elbowX, y: elbowY },
        { x: handX, y: handY },
      ], 3.5 * s, LEATHER_BASE);
      // Wrapped forearm
      ctx.strokeStyle = utils.rgb(WRAP_COLOR, 0.7);
      ctx.lineWidth = 0.6 * s;
      for (let i = 0; i < 4; i++) {
        const wt = 0.3 + i * 0.18;
        const wx = elbowX + (handX - elbowX) * wt;
        const wy = elbowY + (handY - elbowY) * wt;
        ctx.beginPath();
        ctx.moveTo(wx - 2.5 * s, wy - 1 * s);
        ctx.lineTo(wx + 2.5 * s, wy + 1 * s);
        ctx.stroke();
      }
      // Skin hand
      ctx.fillStyle = utils.rgb(SKIN);
      utils.fillEllipse(ctx, handX, handY, 2.5 * s, 2 * s);

      // ── Curved Daggers ──────────────────────────────────────────────────
      const dagAngle = isRight ? rightDaggerAngle : leftDaggerAngle;
      const dagLen = 14 * s;
      const tipX = handX + Math.cos(dagAngle) * dagLen;
      const tipY = handY + Math.sin(dagAngle) * dagLen;
      // Midpoint for curve
      const midX = (handX + tipX) / 2 + Math.sin(dagAngle) * 3 * s * (isRight ? -1 : 1);
      const midY = (handY + tipY) / 2 - Math.cos(dagAngle) * 3 * s * (isRight ? -1 : 1);

      // Dagger glow for cast
      if (castGlow > 0) {
        ctx.save();
        ctx.globalAlpha = castGlow * 0.45;
        ctx.strokeStyle = '#2aff2a';
        ctx.lineWidth = 5 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(handX, handY);
        ctx.quadraticCurveTo(midX, midY, tipX, tipY);
        ctx.stroke();
        ctx.globalAlpha = alpha;
        ctx.restore();
      }

      // Blade (curved path)
      ctx.strokeStyle = utils.rgb(BLADE_COLOR);
      ctx.lineWidth = 2 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(handX, handY);
      ctx.quadraticCurveTo(midX, midY, tipX, tipY);
      ctx.stroke();
      // Edge highlight
      ctx.strokeStyle = 'rgba(220,220,240,0.5)';
      ctx.lineWidth = 0.7 * s;
      ctx.beginPath();
      ctx.moveTo(handX + 0.5 * s, handY);
      ctx.quadraticCurveTo(midX + 0.5 * s, midY, tipX + 0.5 * s, tipY);
      ctx.stroke();

      // Guard (small rect near hand)
      ctx.fillStyle = utils.rgb(LEATHER_DARK);
      const perpA = dagAngle + Math.PI * 0.5;
      const gLen = 3 * s;
      ctx.beginPath();
      ctx.moveTo(handX + Math.cos(perpA) * gLen, handY + Math.sin(perpA) * gLen);
      ctx.lineTo(handX - Math.cos(perpA) * gLen, handY - Math.sin(perpA) * gLen);
      ctx.lineWidth = 2 * s;
      ctx.strokeStyle = utils.rgb(BUCKLE_COLOR, 0.8);
      ctx.stroke();
    }

    // ── Head ──────────────────────────────────────────────────────────────
    const headX = torsoX + lunge * 2 * s;
    const headY = torsoY - 20 * s;

    // Neck
    ctx.fillStyle = utils.rgb(SKIN_DARK);
    ctx.fillRect(headX - 3 * s, torsoY - 14 * s, 6 * s, 6 * s);

    // Face — lean forward, slightly angled
    const faceGrad = ctx.createRadialGradient(headX - 2 * s, headY - 2 * s, 0, headX, headY, 8 * s);
    faceGrad.addColorStop(0, utils.rgb(utils.lighten(SKIN, 15)));
    faceGrad.addColorStop(0.6, utils.rgb(SKIN));
    faceGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = faceGrad;
    utils.fillEllipse(ctx, headX, headY, 8 * s, 8.5 * s);

    // Eyes — sharp, focused
    for (const side of [-1, 1]) {
      const ex = headX + side * 2.8 * s;
      const ey = headY - 0.5 * s;
      ctx.fillStyle = '#1a1a1a';
      utils.fillEllipse(ctx, ex, ey, 2 * s, 1.8 * s);
      ctx.fillStyle = '#3a5a30';
      utils.fillCircle(ctx, ex, ey, 1 * s);
      ctx.fillStyle = 'rgba(200,220,180,0.4)';
      utils.fillCircle(ctx, ex - 0.4 * s, ey - 0.4 * s, 0.4 * s);
    }

    // Mouth — thin set expression
    ctx.strokeStyle = utils.rgb(SKIN_DARK, 0.7);
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(headX - 2.5 * s, headY + 4 * s);
    ctx.lineTo(headX + 2.5 * s, headY + 4 * s);
    ctx.stroke();

    // ── Hood (asymmetric — draped loosely back-right) ──────────────────────
    // Main hood shape covering top and back of head
    ctx.fillStyle = utils.rgb(CLOAK_COLOR, 0.9);
    ctx.beginPath();
    ctx.moveTo(headX - 9 * s, headY - 4 * s);                 // left of face
    ctx.lineTo(headX + 10 * s, headY - 8 * s);                // across forehead
    ctx.lineTo(headX + 12 * s, headY + 2 * s);                // right side
    ctx.lineTo(headX + 8 * s, headY + 8 * s);                 // down right
    ctx.lineTo(headX - 2 * s, headY + 10 * s);                // behind chin
    ctx.lineTo(headX - 10 * s, headY + 4 * s);                // left side
    ctx.closePath();
    ctx.fill();
    // Hood opening edge — slightly lighter trim
    ctx.strokeStyle = utils.rgb(LEATHER_LIGHT, 0.3);
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(headX - 9 * s, headY - 4 * s);
    ctx.quadraticCurveTo(headX, headY - 10 * s, headX + 10 * s, headY - 8 * s);
    ctx.stroke();
    // Shadow inside hood opening
    ctx.fillStyle = utils.rgb(LEATHER_DARK, 0.35);
    ctx.beginPath();
    ctx.moveTo(headX - 7 * s, headY - 3 * s);
    ctx.lineTo(headX + 8 * s, headY - 6 * s);
    ctx.lineTo(headX + 4 * s, headY + 1 * s);
    ctx.lineTo(headX - 6 * s, headY + 2 * s);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  },
};
