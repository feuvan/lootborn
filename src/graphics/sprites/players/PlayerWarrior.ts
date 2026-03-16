// src/graphics/sprites/players/PlayerWarrior.ts
import type { EntityDrawer, PlayerAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const ARMOR_BASE   = 0x3a4a5c;
const ARMOR_LIGHT  = 0x566a80;
const ARMOR_DARK   = 0x252f3c;
const SKIN         = 0xb08960;
const SKIN_DARK    = 0x8a6a40;
const BLADE_COLOR  = 0x8a8a9a;
const GUARD_COLOR  = 0x5a4a3a;
const SHIELD_BASE  = 0x566a80;
const SHIELD_DARK  = 0x3a4a5c;
const SHIELD_TRIM  = 0xb8860b;

export const PlayerWarriorDrawer: EntityDrawer = {
  key: 'player_warrior',
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
    let swordSwing = 0;
    let shieldRaise = 0;
    let lunge = 0;
    let castGlow = 0;

    switch (act) {
      case 'idle':
        // Gentle breathing bob
        bodyOffsetY = Math.sin(phase) * 1.2 * s;
        break;
      case 'walk':
        // Heavy armored march with slight bob
        bodyOffsetY = -Math.abs(Math.sin(phase)) * 2 * s;
        lunge = Math.sin(phase) * 0.5;
        break;
      case 'attack':
        // Overhead slash arc: sword behind head -> forward
        swordSwing = t;
        lunge = t * 0.4;
        bodyOffsetY = -t * 3 * s;
        break;
      case 'hurt':
        // Recoil + shield raise
        bodyOffsetY = t * 4 * s;
        shieldRaise = t;
        alpha = 0.75 + t * 0.25;
        break;
      case 'death':
        globalRotation = t * Math.PI * 0.5;
        bodyOffsetY = t * h * 0.4;
        alpha = 1 - t * 0.8;
        break;
      case 'cast':
        // Shield up, blade glows
        shieldRaise = 0.6 + Math.sin(phase) * 0.2;
        castGlow = 0.5 + Math.sin(phase) * 0.5;
        bodyOffsetY = Math.sin(phase) * 1.5 * s;
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
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    utils.fillEllipse(ctx, cx, baseY + 1 * s, 16 * s, 3.5 * s);

    // ── Legs / Greaves ─────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const hipX = cx + side * 7 * s;
      const hipY = baseY - 26 * s + bodyOffsetY;
      const kneeX = hipX + side * 1 * s + Math.sin(legPhase) * 2.5 * s;
      const kneeY = hipY + 12 * s;
      const footX = hipX + side * 2 * s + Math.sin(legPhase) * 1.5 * s;
      const footY = baseY - 2 * s;

      utils.drawLimb(ctx, [
        { x: hipX, y: hipY },
        { x: kneeX, y: kneeY },
        { x: footX, y: footY },
      ], 5 * s, ARMOR_DARK);

      // Greave plate
      utils.drawMetalSurface(ctx, footX - 4 * s, footY - 10 * s, 8 * s, 10 * s, ARMOR_LIGHT);
      // Boot
      utils.drawMetalSurface(ctx, footX - 5 * s, footY - 2 * s, 10 * s, 4 * s, ARMOR_BASE);
      // Boot toe cap highlight
      ctx.fillStyle = utils.rgb(ARMOR_LIGHT, 0.5);
      ctx.fillRect(footX + 2 * s, footY - 2 * s, 3 * s, 2 * s);
    }

    // ── Torso ──────────────────────────────────────────────────────────────
    const torsoX = cx + lunge * 6 * s;
    const torsoY = baseY - 52 * s + bodyOffsetY;

    // Body armor (plate chest)
    utils.drawMetalSurface(ctx, torsoX - 10 * s, torsoY - 12 * s, 20 * s, 26 * s, ARMOR_BASE);
    // Chest highlight plate
    utils.drawMetalSurface(ctx, torsoX - 7 * s, torsoY - 10 * s, 14 * s, 14 * s, ARMOR_LIGHT);
    // Chest center crease
    ctx.strokeStyle = utils.rgb(ARMOR_DARK, 0.6);
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(torsoX, torsoY - 10 * s);
    ctx.lineTo(torsoX, torsoY + 4 * s);
    ctx.stroke();
    // Pauldron left (chain mail gap then shoulder plate)
    utils.drawMetalSurface(ctx, torsoX - 17 * s, torsoY - 14 * s, 10 * s, 8 * s, ARMOR_LIGHT);
    // Pauldron right
    utils.drawMetalSurface(ctx, torsoX + 7 * s, torsoY - 14 * s, 10 * s, 8 * s, ARMOR_LIGHT);
    // Chain mail cross-hatch at shoulder joints
    ctx.strokeStyle = utils.rgb(ARMOR_DARK, 0.35);
    ctx.lineWidth = 0.5 * s;
    for (const sx of [torsoX - 13 * s, torsoX + 11 * s]) {
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(sx + i * 1.5 * s, torsoY - 12 * s);
        ctx.lineTo(sx + i * 1.5 * s, torsoY - 7 * s);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx, torsoY - 12 * s + i * 1.5 * s);
        ctx.lineTo(sx + 5 * s, torsoY - 12 * s + i * 1.5 * s);
        ctx.stroke();
      }
    }
    // Belt / waist armor
    utils.drawMetalSurface(ctx, torsoX - 9 * s, torsoY + 12 * s, 18 * s, 5 * s, ARMOR_DARK);
    ctx.fillStyle = utils.rgb(GUARD_COLOR);
    ctx.fillRect(torsoX - 2 * s, torsoY + 12 * s, 4 * s, 5 * s);

    // ── Arms ────────────────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const isRight = side === 1;
      const armPhase = act === 'walk' ? phase + (isRight ? Math.PI : 0) : 0;
      const shoulderX = torsoX + side * 12 * s;
      const shoulderY = torsoY - 10 * s;

      let elbowX: number, elbowY: number, handX: number, handY: number;

      if (isRight && act === 'attack') {
        // Overhead arc: frame 0 = sword up behind head, frame 3 = sword forward-down
        const swing = swordSwing * Math.PI * 0.75; // 0 -> ~135 deg arc
        const armLen1 = 10 * s;
        const armLen2 = 8 * s;
        const baseAngle = -Math.PI * 0.6 + swing; // starts pointing up-back
        elbowX = shoulderX + Math.cos(baseAngle) * armLen1;
        elbowY = shoulderY + Math.sin(baseAngle) * armLen1;
        const foreAngle = baseAngle + Math.PI * 0.3;
        handX = elbowX + Math.cos(foreAngle) * armLen2;
        handY = elbowY + Math.sin(foreAngle) * armLen2;
      } else if (!isRight && (act === 'hurt' || act === 'cast')) {
        // Shield raised defensively
        const raiseAmt = shieldRaise * 8 * s;
        elbowX = shoulderX - 5 * s;
        elbowY = shoulderY + 5 * s - raiseAmt;
        handX = elbowX + 2 * s;
        handY = elbowY + 5 * s - raiseAmt * 0.5;
      } else {
        elbowX = shoulderX + side * 3 * s + Math.sin(armPhase) * 2 * s;
        elbowY = shoulderY + 9 * s;
        handX = elbowX + side * 2 * s + Math.sin(armPhase) * 1.5 * s;
        handY = elbowY + 8 * s + Math.sin(armPhase) * 2 * s;
      }

      // Upper arm plate
      utils.drawLimb(ctx, [
        { x: shoulderX, y: shoulderY },
        { x: elbowX, y: elbowY },
        { x: handX, y: handY },
      ], 5 * s, ARMOR_BASE);
      // Elbow chain gap
      ctx.fillStyle = utils.rgb(ARMOR_DARK, 0.6);
      utils.fillCircle(ctx, elbowX, elbowY, 3 * s);

      // Gauntlet
      utils.drawMetalSurface(ctx, handX - 3 * s, handY - 3 * s, 6 * s, 6 * s, ARMOR_LIGHT);

      // ── Kite Shield (left arm) ─────────────────────────────────────────
      if (!isRight) {
        const shX = handX - 1 * s;
        const shY = handY - 8 * s;
        // Pentagon shape
        ctx.fillStyle = utils.rgb(SHIELD_BASE);
        ctx.beginPath();
        ctx.moveTo(shX, shY - 10 * s);                        // top
        ctx.lineTo(shX + 8 * s, shY - 10 * s);                // top-right
        ctx.lineTo(shX + 10 * s, shY - 2 * s);               // right
        ctx.lineTo(shX + 5 * s, shY + 6 * s);                // bottom-right point
        ctx.lineTo(shX - 2 * s, shY + 6 * s);                // bottom-left point
        ctx.lineTo(shX - 4 * s, shY - 2 * s);                // left
        ctx.closePath();
        ctx.fill();
        // Shield dark bevel
        ctx.strokeStyle = utils.rgb(SHIELD_DARK, 0.8);
        ctx.lineWidth = 1.2 * s;
        ctx.stroke();
        // Trim
        ctx.fillStyle = utils.rgb(SHIELD_TRIM, 0.6);
        ctx.beginPath();
        ctx.moveTo(shX + 1 * s, shY - 8 * s);
        ctx.lineTo(shX + 7 * s, shY - 8 * s);
        ctx.lineTo(shX + 9 * s, shY - 2 * s);
        ctx.lineTo(shX + 4.5 * s, shY + 4 * s);
        ctx.lineTo(shX - 1 * s, shY + 4 * s);
        ctx.lineTo(shX - 3 * s, shY - 2 * s);
        ctx.closePath();
        ctx.lineWidth = 0.5 * s;
        ctx.strokeStyle = utils.rgb(SHIELD_TRIM, 0.5);
        ctx.stroke();
        // Emblem: cross
        const crossX = shX + 3 * s;
        const crossY = shY - 3 * s;
        ctx.fillStyle = utils.rgb(SHIELD_DARK, 0.7);
        ctx.fillRect(crossX - 0.5 * s, crossY - 4 * s, 2 * s, 8 * s);
        ctx.fillRect(crossX - 3 * s, crossY - 0.5 * s, 7 * s, 2 * s);
        // Shield highlight
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        utils.fillEllipse(ctx, shX + 2 * s, shY - 5 * s, 3 * s, 3 * s);
      }

      // ── Longsword (right hand) ─────────────────────────────────────────
      if (isRight) {
        const swX = handX + side * 2 * s;
        const swY = handY;
        // Blade extends in the swing direction
        const bladeAngle = act === 'attack'
          ? -Math.PI * 0.6 + swordSwing * Math.PI * 0.75 - Math.PI * 0.5
          : -Math.PI * 0.5;
        const bladeLen = 22 * s;
        const tipX = swX + Math.cos(bladeAngle) * bladeLen;
        const tipY = swY + Math.sin(bladeAngle) * bladeLen;

        // Blade glow for cast
        if (castGlow > 0) {
          ctx.save();
          ctx.globalAlpha = castGlow * 0.5;
          ctx.strokeStyle = '#8a5ac0';
          ctx.lineWidth = 6 * s;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(swX, swY);
          ctx.lineTo(tipX, tipY);
          ctx.stroke();
          ctx.globalAlpha = alpha;
          ctx.restore();
        }

        // Blade
        ctx.strokeStyle = utils.rgb(BLADE_COLOR);
        ctx.lineWidth = 2.5 * s;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(swX, swY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        // Blade edge highlight
        ctx.strokeStyle = 'rgba(220,220,240,0.5)';
        ctx.lineWidth = 0.8 * s;
        ctx.beginPath();
        ctx.moveTo(swX - 0.5 * s, swY);
        ctx.lineTo(tipX - 0.5 * s, tipY);
        ctx.stroke();

        // Crossguard (rect perpendicular to blade)
        const perpAngle = bladeAngle + Math.PI * 0.5;
        const gLen = 6 * s;
        ctx.strokeStyle = utils.rgb(GUARD_COLOR);
        ctx.lineWidth = 3.5 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(swX + Math.cos(perpAngle) * gLen, swY + Math.sin(perpAngle) * gLen);
        ctx.lineTo(swX - Math.cos(perpAngle) * gLen, swY - Math.sin(perpAngle) * gLen);
        ctx.stroke();

        // Pommel
        ctx.fillStyle = utils.rgb(ARMOR_LIGHT);
        utils.fillCircle(ctx, swX - Math.cos(bladeAngle) * 3 * s, swY - Math.sin(bladeAngle) * 3 * s, 2.5 * s);
      }
    }

    // ── Head ───────────────────────────────────────────────────────────────
    const headX = torsoX + lunge * 2 * s;
    const headY = torsoY - 20 * s;

    // Neck
    ctx.fillStyle = utils.rgb(SKIN_DARK);
    ctx.fillRect(headX - 3 * s, torsoY - 14 * s, 6 * s, 5 * s);

    // Helm dome
    const helmGrad = ctx.createRadialGradient(headX - 3 * s, headY - 4 * s, 0, headX, headY, 11 * s);
    helmGrad.addColorStop(0, utils.rgb(utils.lighten(ARMOR_LIGHT, 30)));
    helmGrad.addColorStop(0.5, utils.rgb(ARMOR_LIGHT));
    helmGrad.addColorStop(1, utils.rgb(ARMOR_DARK));
    ctx.fillStyle = helmGrad;
    utils.fillEllipse(ctx, headX, headY - 2 * s, 10 * s, 10 * s);

    // Visor / face opening — skin visible
    const faceGrad = ctx.createLinearGradient(headX - 5 * s, headY + 1 * s, headX + 5 * s, headY + 6 * s);
    faceGrad.addColorStop(0, utils.rgb(SKIN_DARK));
    faceGrad.addColorStop(0.5, utils.rgb(SKIN));
    faceGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = faceGrad;
    ctx.fillRect(headX - 5 * s, headY + 1 * s, 10 * s, 5 * s);

    // Nose guard (vertical rect down center of face opening)
    utils.drawMetalSurface(ctx, headX - 1.2 * s, headY - 2 * s, 2.4 * s, 8 * s, ARMOR_LIGHT);

    // Helm cheek guards
    utils.drawMetalSurface(ctx, headX - 10 * s, headY + 1 * s, 6 * s, 5 * s, ARMOR_BASE);
    utils.drawMetalSurface(ctx, headX + 4 * s, headY + 1 * s, 6 * s, 5 * s, ARMOR_BASE);

    // Helm crest ridge
    ctx.fillStyle = utils.rgb(ARMOR_LIGHT, 0.7);
    ctx.beginPath();
    ctx.moveTo(headX - 2 * s, headY - 10 * s);
    ctx.lineTo(headX + 2 * s, headY - 10 * s);
    ctx.lineTo(headX + 1.5 * s, headY - 2 * s);
    ctx.lineTo(headX - 1.5 * s, headY - 2 * s);
    ctx.closePath();
    ctx.fill();

    // Eyes (glinting through visor)
    for (const side of [-1, 1]) {
      const ex = headX + side * 2.5 * s;
      const ey = headY + 3 * s;
      ctx.fillStyle = utils.rgb(SKIN_DARK);
      utils.fillEllipse(ctx, ex, ey, 1.5 * s, 1.2 * s);
      ctx.fillStyle = 'rgba(180,160,120,0.6)';
      utils.fillCircle(ctx, ex, ey, 0.7 * s);
    }

    ctx.restore();
  },
};
