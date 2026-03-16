// src/graphics/sprites/monsters/MountainTroll.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const SKIN_MID    = 0x344a29;
const SKIN_DARK   = 0x1d3412;
const SKIN_LIGHT  = 0x4a613f;
const BELLY_COLOR = 0x293f1d;
const BELLY_LIGHT = 0x344a29;
const BARK_COLOR  = 0x3f2912;
const TUSK_COLOR  = 0xa29670;
const EYE_COLOR   = 0xffaa00;

export const MountainTrollDrawer: EntityDrawer = {
  key: 'monster_mountain_troll',
  frameW: 64,
  frameH: 72,
  totalFrames: 20,

  drawFrame(ctx, frame, action, w, h, utils) {
    const act = action as MonsterAction;
    const s = w / 64;

    const frameCounts: Record<MonsterAction, number> = { idle: 4, walk: 6, attack: 4, hurt: 2, death: 4 };
    const count = frameCounts[act] || 4;
    const localFrame = frame % count;
    const t = count > 1 ? localFrame / (count - 1) : 0;
    const phase = (localFrame / count) * Math.PI * 2;

    let alpha = 1;
    let bodyOffsetX = 0;
    let bodyOffsetY = 0;
    let attackLunge = 0;
    let globalRotation = 0;

    switch (act) {
      case 'idle':
        bodyOffsetY = Math.sin(phase) * 1 * s;
        break;
      case 'walk':
        bodyOffsetX = Math.sin(phase) * 2.5 * s;
        bodyOffsetY = -Math.abs(Math.sin(phase)) * 2.5 * s;
        break;
      case 'attack':
        attackLunge = t;
        bodyOffsetX = t * 8 * s;
        bodyOffsetY = -t * 3 * s;
        break;
      case 'hurt':
        bodyOffsetX = -t * 6 * s;
        alpha = 0.75 + t * 0.25;
        break;
      case 'death':
        globalRotation = t * Math.PI * 0.45;
        bodyOffsetY = t * h * 0.3;
        alpha = 1 - t * 0.7;
        break;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = w / 2;
    const baseY = h * 0.96;

    ctx.translate(cx, baseY);
    ctx.rotate(globalRotation);
    ctx.translate(-cx, -baseY);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    utils.fillEllipse(ctx, cx + bodyOffsetX * 0.4, baseY + 1 * s, 22 * s, 5 * s);

    // ── Short thick legs ───────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const hipX = cx + side * 10 * s + bodyOffsetX * 0.35;
      const hipY = baseY - 22 * s + bodyOffsetY;
      const kneeX = hipX + side * 2 * s + Math.sin(legPhase) * 3 * s;
      const kneeY = hipY + 11 * s;
      const footX = hipX + side * 3 * s;
      const footY = baseY - 1 * s;

      utils.drawLimb(ctx, [
        { x: hipX, y: hipY },
        { x: kneeX, y: kneeY },
        { x: footX, y: footY },
      ], 7 * s, SKIN_MID);

      // Apply noise to leg area (mottled skin)
      utils.applyNoiseToRegion(ctx, hipX - 8 * s, hipY, 16 * s, footY - hipY, 15);

      // Toenails
      ctx.fillStyle = utils.rgb(utils.darken(SKIN_DARK, 20));
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(footX + i * 2.5 * s, footY + 1 * s);
        ctx.lineTo(footX + i * 3.5 * s + side * 1 * s, footY + 3.5 * s);
        ctx.lineTo(footX + i * 1.5 * s + side * 0.5 * s, footY + 1 * s);
        ctx.closePath();
        ctx.fill();
      }
    }

    // ── Massive belly ─────────────────────────────────────────────────────────
    const bellyX = cx + bodyOffsetX;
    const bellyY = baseY - 30 * s + bodyOffsetY;

    const bellyGrad = ctx.createRadialGradient(bellyX - 3 * s, bellyY - 3 * s, 0, bellyX, bellyY, 18 * s);
    bellyGrad.addColorStop(0, utils.rgb(BELLY_LIGHT));
    bellyGrad.addColorStop(0.5, utils.rgb(BELLY_COLOR));
    bellyGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = bellyGrad;
    utils.fillEllipse(ctx, bellyX, bellyY, 17 * s, 16 * s);

    // Belly button
    ctx.fillStyle = utils.rgb(SKIN_DARK, 0.4);
    utils.fillCircle(ctx, bellyX, bellyY + 2 * s, 1.5 * s);

    // Apply noise to belly for mottled grey-green skin
    utils.applyNoiseToRegion(ctx, bellyX - 18 * s, bellyY - 17 * s, 36 * s, 34 * s, 20);

    // ── Upper torso / shoulders ────────────────────────────────────────────────
    const torsoX = cx + bodyOffsetX;
    const torsoY = baseY - 46 * s + bodyOffsetY;

    const torsoGrad = ctx.createRadialGradient(torsoX - 3 * s, torsoY - 2 * s, 0, torsoX, torsoY, 14 * s);
    torsoGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    torsoGrad.addColorStop(0.6, utils.rgb(SKIN_MID));
    torsoGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = torsoGrad;
    utils.fillEllipse(ctx, torsoX, torsoY, 13 * s, 11 * s);

    // ── Enormous arms reaching past knees ─────────────────────────────────────
    for (const side of [-1, 1]) {
      const isRight = side === 1;
      const armPhase = act === 'walk' ? phase + (isRight ? Math.PI : 0) : 0;
      const shoulderX = torsoX + side * 13 * s;
      const shoulderY = torsoY - 4 * s;

      // Arms reach very low — past the knees
      let elbowX: number, elbowY: number, handX: number, handY: number;

      if (isRight && act === 'attack') {
        elbowX = shoulderX + side * 7 * s + attackLunge * 5 * s;
        elbowY = shoulderY + 12 * s - attackLunge * 5 * s;
        handX = elbowX + side * 6 * s + attackLunge * 4 * s;
        handY = elbowY + 10 * s - attackLunge * 3 * s;
      } else {
        // Default: arms hang very low
        elbowX = shoulderX + side * 5 * s + Math.sin(armPhase) * 3 * s;
        elbowY = shoulderY + 14 * s - Math.abs(Math.sin(armPhase)) * 3 * s;
        handX = elbowX + side * 3 * s - Math.sin(armPhase) * 2 * s;
        handY = elbowY + 14 * s + Math.sin(armPhase) * 3 * s;
      }

      // Thick base for enormous arms
      utils.drawLimb(ctx, [
        { x: shoulderX, y: shoulderY },
        { x: elbowX, y: elbowY },
        { x: handX, y: handY },
      ], 8 * s, SKIN_MID);

      utils.applyNoiseToRegion(ctx, shoulderX - 10 * s, shoulderY, 20 * s, handY - shoulderY, 15);

      // Fist
      const fistGrad = ctx.createRadialGradient(handX - 2 * s, handY - 2 * s, 0, handX, handY, 6 * s);
      fistGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
      fistGrad.addColorStop(1, utils.rgb(SKIN_DARK));
      ctx.fillStyle = fistGrad;
      utils.fillEllipse(ctx, handX, handY, 6 * s, 5 * s);

      // Tree-trunk club in right hand
      if (isRight) {
        const clubX = handX + 3 * s;
        const clubY = handY - 3 * s;
        // Thick rect trunk
        ctx.fillStyle = utils.rgb(BARK_COLOR);
        ctx.fillRect(clubX - 3 * s, clubY - 20 * s, 6 * s, 22 * s);
        // Bark strokes
        ctx.strokeStyle = utils.rgb(utils.darken(BARK_COLOR, 15), 0.5);
        ctx.lineWidth = 0.7 * s;
        for (let i = 0; i < 6; i++) {
          const bx = clubX - 3 * s + utils.hash2d(i * 7, 13) * 6 * s;
          const by = clubY - 20 * s + i * 3.5 * s;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + (utils.hash2d(i, 31) - 0.5) * 3 * s, by + 2 * s);
          ctx.stroke();
        }
        // Knot
        ctx.fillStyle = utils.rgb(utils.darken(BARK_COLOR, 25), 0.4);
        utils.fillEllipse(ctx, clubX, clubY - 12 * s, 2 * s, 1.5 * s);
        // Club head bulge
        ctx.fillStyle = utils.rgb(BARK_COLOR);
        utils.fillEllipse(ctx, clubX, clubY - 20 * s, 5 * s, 4 * s);
      }
    }

    // ── Disproportionately small head (~15% of body height) ───────────────────
    const headX = torsoX + bodyOffsetX * 0.05;
    const headY = torsoY - 14 * s + bodyOffsetY * 0.1;

    // Neck — thick but short
    ctx.fillStyle = utils.rgb(SKIN_MID);
    ctx.fillRect(headX - 5 * s, torsoY - 9 * s, 10 * s, 5 * s);

    // Small round head
    const headGrad = ctx.createRadialGradient(headX - 1.5 * s, headY - 1.5 * s, 0, headX, headY, 9 * s);
    headGrad.addColorStop(0, utils.rgb(SKIN_LIGHT));
    headGrad.addColorStop(0.6, utils.rgb(SKIN_MID));
    headGrad.addColorStop(1, utils.rgb(SKIN_DARK));
    ctx.fillStyle = headGrad;
    utils.fillEllipse(ctx, headX, headY, 8.5 * s, 8 * s);

    utils.applyNoiseToRegion(ctx, headX - 9 * s, headY - 9 * s, 18 * s, 18 * s, 18);

    // Prominent brow ridge
    ctx.fillStyle = utils.rgb(SKIN_DARK, 0.5);
    utils.fillEllipse(ctx, headX, headY - 4 * s, 8 * s, 2.5 * s);

    // Tiny beady eyes
    for (const side of [-1, 1]) {
      const ex = headX + side * 3.2 * s;
      const ey = headY - 1.5 * s;
      ctx.fillStyle = '#0a0800';
      utils.fillEllipse(ctx, ex, ey, 2 * s, 1.8 * s);
      ctx.fillStyle = utils.rgb(EYE_COLOR);
      utils.fillEllipse(ctx, ex, ey, 1.2 * s, 1.2 * s);
      ctx.fillStyle = '#150a00';
      utils.fillCircle(ctx, ex, ey, 0.5 * s);
      ctx.fillStyle = 'rgba(255,220,100,0.3)';
      utils.fillCircle(ctx, ex - 0.3 * s, ey - 0.3 * s, 0.3 * s);
    }

    // Nose — flat wide
    ctx.fillStyle = utils.rgb(utils.darken(SKIN_MID, 10));
    utils.fillEllipse(ctx, headX, headY + 2 * s, 3.5 * s, 2 * s);
    // Nostrils
    ctx.fillStyle = '#0a0800';
    utils.fillCircle(ctx, headX - 1.5 * s, headY + 2.5 * s, 0.8 * s);
    utils.fillCircle(ctx, headX + 1.5 * s, headY + 2.5 * s, 0.8 * s);

    // Underbite jaw
    ctx.fillStyle = utils.rgb(SKIN_MID);
    utils.fillEllipse(ctx, headX, headY + 6 * s, 6.5 * s, 3.5 * s);

    // Prominent underbite tusks (upward triangles)
    ctx.fillStyle = utils.rgb(TUSK_COLOR);
    for (const side of [-1, 1]) {
      const tx = headX + side * 2.5 * s;
      const ty = headY + 5 * s;
      ctx.beginPath();
      ctx.moveTo(tx - 1.5 * s, ty + 1 * s);
      ctx.lineTo(tx, ty - 5 * s);
      ctx.lineTo(tx + 1.5 * s, ty + 1 * s);
      ctx.closePath();
      ctx.fill();
      // Tusk shading
      ctx.fillStyle = utils.rgb(utils.darken(TUSK_COLOR, 20), 0.4);
      ctx.beginPath();
      ctx.moveTo(tx, ty + 1 * s);
      ctx.lineTo(tx + 0.5 * s, ty - 4 * s);
      ctx.lineTo(tx + 1.5 * s, ty + 1 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = utils.rgb(TUSK_COLOR); // reset for next tusk
    }

    // Mouth line
    ctx.strokeStyle = '#0a0800';
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(headX - 4 * s, headY + 4.5 * s);
    ctx.lineTo(headX + 4 * s, headY + 4.5 * s);
    ctx.stroke();

    ctx.restore();
  },
};
