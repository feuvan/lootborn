// src/graphics/sprites/monsters/DesertScorpion.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const CARAPACE_LIGHT = 0x614a29;
const CARAPACE_DARK  = 0x342110;
const STINGER_COLOR  = 0xcc2200;

export const DesertScorpionDrawer: EntityDrawer = {
  key: 'monster_desert_scorpion',
  frameW: 52,
  frameH: 44,
  totalFrames: 20,

  drawFrame(ctx, frame, action, w, h, utils) {
    const act = action as MonsterAction;
    const s = w / 52;

    const frameCounts: Record<MonsterAction, number> = { idle: 4, walk: 6, attack: 4, hurt: 2, death: 4 };
    const count = frameCounts[act] || 4;
    const localFrame = frame % count;
    const t = count > 1 ? localFrame / (count - 1) : 0;
    const phase = (localFrame / count) * Math.PI * 2;

    let alpha = 1;
    let bodyShiftX = 0;
    let contractScale = 1;

    // Tail arc: angle from base to stinger tip
    // 0 = curled up straight, positive = arched forward (attack)
    let tailArcT = 0;
    let pincerOpen = 0;

    switch (act) {
      case 'idle':
        tailArcT = 0.3 + Math.sin(phase) * 0.15;
        pincerOpen = Math.abs(Math.sin(phase)) * 0.3;
        break;
      case 'walk':
        bodyShiftX = Math.sin(phase) * 2.5 * s;
        tailArcT = 0.2 + Math.abs(Math.sin(phase)) * 0.1;
        break;
      case 'attack':
        // Tail strikes forward: arc increases then snaps back
        tailArcT = t < 0.5 ? 0.3 + t * 1.4 : 1.0 - (t - 0.5) * 0.8;
        pincerOpen = 0.6 + t * 0.4;
        break;
      case 'hurt':
        contractScale = 1 - t * 0.15;
        alpha = 0.7 + t * 0.3;
        break;
      case 'death':
        contractScale = 1 - t * 0.2;
        pincerOpen = -t * 0.5; // curl inward
        tailArcT = 0.1 - t * 0.1;
        alpha = 1 - t * 0.75;
        break;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = w / 2 + bodyShiftX;
    const baseY = h * 0.88;

    // ── Shadow ──────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    utils.fillEllipse(ctx, cx, baseY + 1.5 * s, 18 * s * contractScale, 3 * s);

    // ── Carapace (body) — segmented overlapping ellipses ────────────────────
    ctx.save();
    ctx.translate(cx, baseY - 6 * s);
    ctx.scale(contractScale, contractScale);

    const bodyGrad = ctx.createLinearGradient(-18 * s, -6 * s, 0, 6 * s);
    bodyGrad.addColorStop(0, utils.rgb(utils.lighten(CARAPACE_LIGHT, 15)));
    bodyGrad.addColorStop(0.5, utils.rgb(CARAPACE_LIGHT));
    bodyGrad.addColorStop(1, utils.rgb(CARAPACE_DARK));
    ctx.fillStyle = bodyGrad;

    // Three carapace plates
    const plates = [
      { ox: -8 * s, rx: 11 * s, ry: 7 * s },
      { ox: 1 * s,  rx: 9 * s,  ry: 6.5 * s },
      { ox: 9 * s,  rx: 7 * s,  ry: 5.5 * s },
    ];
    for (const p of plates) {
      ctx.fillStyle = bodyGrad;
      utils.fillEllipse(ctx, p.ox, 0, p.rx, p.ry);
      // Segment line highlight
      ctx.strokeStyle = utils.rgb(utils.lighten(CARAPACE_LIGHT, 20), 0.35);
      ctx.lineWidth = 0.5 * s;
      ctx.beginPath();
      ctx.ellipse(p.ox, 0, p.rx * 0.85, p.ry * 0.55, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
    }

    // Specular sheen
    ctx.fillStyle = 'rgba(255,230,160,0.07)';
    utils.fillEllipse(ctx, -5 * s, -4 * s, 8 * s, 3 * s);

    ctx.restore(); // carapace

    // ── Cephalothorax head ───────────────────────────────────────────────────
    const headX = cx - 16 * s;
    const headY = baseY - 7 * s;
    ctx.fillStyle = utils.rgb(CARAPACE_LIGHT);
    utils.fillEllipse(ctx, headX, headY, 6 * s, 5.5 * s);
    ctx.fillStyle = utils.rgb(utils.darken(CARAPACE_LIGHT, 15));
    utils.fillEllipse(ctx, headX, headY, 4 * s, 3.5 * s);

    // Cluster of beady eyes
    const eyePositions = [
      { dx: -1.5 * s, dy: -2 * s },
      { dx: 0,        dy: -2.5 * s },
      { dx: 1.5 * s,  dy: -2 * s },
      { dx: -0.8 * s, dy: -0.8 * s },
      { dx: 0.8 * s,  dy: -0.8 * s },
    ];
    for (const ep of eyePositions) {
      ctx.fillStyle = '#0a0800';
      utils.fillCircle(ctx, headX + ep.dx, headY + ep.dy, 0.7 * s);
      ctx.fillStyle = 'rgba(180,160,60,0.6)';
      utils.fillCircle(ctx, headX + ep.dx - 0.2 * s, headY + ep.dy - 0.2 * s, 0.25 * s);
    }

    // ── 4 pairs of jointed legs (8 total) ────────────────────────────────────
    for (const side of [-1, 1]) {
      for (let pair = 0; pair < 4; pair++) {
        const legPhase = act === 'walk'
          ? phase + pair * (Math.PI / 2) + (side === -1 ? 0 : Math.PI)
          : 0;
        const attachX = cx - 8 * s + pair * 5 * s;
        const attachY = baseY - 5 * s + (contractScale - 1) * 5 * s;

        // Three joints: body -> knee -> foot
        const kneeX = attachX + side * (6 + pair * 0.5) * s + Math.sin(legPhase) * 1.5 * s;
        const kneeY = attachY - 4 * s - Math.abs(Math.sin(legPhase)) * 2 * s;
        const footX = kneeX + side * 5 * s - Math.sin(legPhase) * 1 * s;
        const footY = baseY;

        utils.drawLimb(ctx, [
          { x: attachX, y: attachY },
          { x: kneeX, y: kneeY },
          { x: footX, y: footY },
        ], 1.8 * s, CARAPACE_DARK);

        // Small claw tip
        ctx.strokeStyle = utils.rgb(utils.lighten(CARAPACE_LIGHT, 10));
        ctx.lineWidth = 0.7 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(footX, footY);
        ctx.lineTo(footX + side * 2 * s, footY + 1 * s);
        ctx.stroke();
      }
    }

    // ── Pincers ──────────────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const pincerBaseX = headX - 5 * s;
      const pincerBaseY = headY;
      const pincerMidX = pincerBaseX - 5 * s;
      const pincerMidY = pincerBaseY + side * 2 * s;

      // Arm segment
      ctx.strokeStyle = utils.rgb(CARAPACE_LIGHT);
      ctx.lineWidth = 3 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pincerBaseX, pincerBaseY);
      ctx.lineTo(pincerMidX, pincerMidY);
      ctx.stroke();

      // Claw — curved path
      const clawOpenAngle = (0.25 + Math.abs(pincerOpen)) * side;
      const clawLen = 6 * s;
      // Upper claw
      ctx.strokeStyle = utils.rgb(CARAPACE_LIGHT);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(pincerMidX, pincerMidY);
      ctx.quadraticCurveTo(
        pincerMidX - clawLen * 0.6 + side * clawOpenAngle * 3 * s,
        pincerMidY - clawLen * 0.6,
        pincerMidX - clawLen,
        pincerMidY - clawLen * 0.3 + side * clawOpenAngle * 2 * s
      );
      ctx.stroke();
      // Lower claw (serrated look — slightly darker)
      ctx.strokeStyle = utils.rgb(utils.darken(CARAPACE_LIGHT, 20));
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.moveTo(pincerMidX, pincerMidY);
      ctx.quadraticCurveTo(
        pincerMidX - clawLen * 0.6 - side * clawOpenAngle * 2 * s,
        pincerMidY + clawLen * 0.4,
        pincerMidX - clawLen,
        pincerMidY + clawLen * 0.1 - side * clawOpenAngle * 2 * s
      );
      ctx.stroke();
    }

    // ── Tail — chain of decreasing circles curving upward ────────────────────
    const tailSegments = 6;
    const tailBaseX = cx + 16 * s;
    const tailBaseY = baseY - 6 * s;
    // Arc: from base curving upward and forward
    // tailArcT drives how far forward the stinger reaches
    const tailEndX = tailBaseX + (4 + tailArcT * 14) * s;
    const tailEndY = tailBaseY - (8 + tailArcT * 10) * s;
    const tailCtrlX = tailBaseX + (tailArcT * 8) * s;
    const tailCtrlY = tailBaseY - 18 * s;

    // Draw segment circles along a quadratic bezier
    for (let i = 0; i <= tailSegments; i++) {
      const tt = i / tailSegments;
      // Quadratic bezier interpolation
      const bx = (1 - tt) * (1 - tt) * tailBaseX + 2 * (1 - tt) * tt * tailCtrlX + tt * tt * tailEndX;
      const by = (1 - tt) * (1 - tt) * tailBaseY + 2 * (1 - tt) * tt * tailCtrlY + tt * tt * tailEndY;
      const r = (3.5 - i * 0.4) * s;
      const segGrad = ctx.createRadialGradient(bx - r * 0.3, by - r * 0.3, 0, bx, by, r);
      segGrad.addColorStop(0, utils.rgb(utils.lighten(CARAPACE_LIGHT, 15)));
      segGrad.addColorStop(1, utils.rgb(CARAPACE_DARK));
      ctx.fillStyle = segGrad;
      utils.fillCircle(ctx, bx, by, Math.max(0.5, r));
    }

    // Stinger
    ctx.fillStyle = utils.rgb(STINGER_COLOR);
    ctx.beginPath();
    ctx.moveTo(tailEndX, tailEndY);
    ctx.lineTo(tailEndX - 2 * s, tailEndY + 2 * s);
    ctx.lineTo(tailEndX + 5 * s, tailEndY + 3 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = utils.rgb(utils.darken(STINGER_COLOR, 30));
    ctx.beginPath();
    ctx.moveTo(tailEndX + 5 * s, tailEndY + 3 * s);
    ctx.lineTo(tailEndX + 8 * s, tailEndY + 2 * s);
    ctx.lineTo(tailEndX + 5 * s, tailEndY + 5 * s);
    ctx.closePath();
    ctx.fill();

    // Venom drip
    if (act === 'attack' && t > 0.4) {
      ctx.fillStyle = `rgba(80,200,20,${(t - 0.4) * 1.5})`;
      utils.fillCircle(ctx, tailEndX + 8 * s, tailEndY + 5 * s + (t - 0.4) * 5 * s, 1.2 * s);
    }

    ctx.restore();
  },
};
