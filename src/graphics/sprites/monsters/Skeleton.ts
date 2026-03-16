// src/graphics/sprites/monsters/Skeleton.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const BONE_COLOR = 0x91897b;

export const SkeletonDrawer: EntityDrawer = {
  key: 'monster_skeleton',
  frameW: 44,
  frameH: 64,
  totalFrames: 20,

  drawFrame(ctx, frame, action, w, h, utils) {
    const act = action as MonsterAction;
    const s = w / 44;

    const frameCounts: Record<MonsterAction, number> = { idle: 4, walk: 6, attack: 4, hurt: 2, death: 4 };
    const count = frameCounts[act] || 4;
    const localFrame = frame % count;
    const t = count > 1 ? localFrame / (count - 1) : 0;
    const phase = (localFrame / count) * Math.PI * 2;

    let alpha = 1;
    let globalRotation = 0;
    let collapseY = 0;

    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = w / 2;
    const baseY = h * 0.95;

    // ── Per-action tuning ──────────────────────────────────────────────────
    // bone rattle: small per-bone offsets seeded by frame + boneId
    const rattle = act === 'walk' ? 0.8 * s : 0;

    let bodyLean = 0;
    let swordSwing = 0;
    let scatterAmt = 0;

    switch (act) {
      case 'idle':
        // gentle jaw wobble via phase, soul-fire flicker handled per eye
        break;
      case 'walk':
        bodyLean = Math.sin(phase) * 0.08;
        break;
      case 'attack':
        bodyLean = -0.2 * t;
        swordSwing = t;
        break;
      case 'hurt':
        scatterAmt = t * 3 * s;
        alpha = 0.75 + t * 0.25;
        ctx.globalAlpha = alpha;
        break;
      case 'death':
        globalRotation = t * Math.PI * 0.45;
        collapseY = t * h * 0.35;
        alpha = 1 - t * 0.7;
        ctx.globalAlpha = alpha;
        break;
    }

    // Apply global collapse transform for death
    ctx.translate(cx, baseY + collapseY);
    ctx.rotate(globalRotation);
    ctx.translate(-cx, -baseY);

    // Helper: rattle offset
    const ro = (boneId: number, axis: 'x' | 'y') => {
      if (rattle === 0) return 0;
      return (utils.hash2d(localFrame * 17 + boneId, boneId * 31 + (axis === 'y' ? 1000 : 0)) - 0.5) * rattle * 2;
    };
    // Helper: scatter offset
    const sc = (boneId: number) => {
      if (scatterAmt === 0) return { x: 0, y: 0 };
      const angle = utils.hash2d(boneId, boneId * 13) * Math.PI * 2;
      const dist = utils.hash2d(boneId * 7, boneId * 3 + 1) * scatterAmt;
      return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
    };

    // Body lean pivot at pelvis
    ctx.save();
    ctx.translate(cx, baseY - 28 * s);
    ctx.rotate(bodyLean);
    ctx.translate(-cx, -(baseY - 28 * s));

    // ── Shadow ──────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    utils.fillEllipse(ctx, cx, baseY + 1 * s, 14 * s, 3 * s);

    // ── Legs: femur + tibia ──────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const boneId = side === -1 ? 10 : 11;
      const sc1 = sc(boneId);
      const legPhase = act === 'walk' ? phase + (side === -1 ? 0 : Math.PI) : 0;
      const hipX = cx + side * 5 * s + ro(boneId, 'x') + sc1.x;
      const hipY = baseY - 22 * s + ro(boneId, 'y') + sc1.y;
      const kneeX = hipX + side * 2 * s + Math.sin(legPhase) * 3 * s;
      const kneeY = hipY + 10 * s - Math.abs(Math.sin(legPhase)) * 2 * s;
      const ankleX = kneeX - side * 1 * s + ro(boneId + 10, 'x');
      const ankleY = baseY - 3 * s + ro(boneId + 10, 'y');
      // femur
      utils.drawBoneSegment(ctx, hipX, hipY, kneeX, kneeY, 2.5 * s, BONE_COLOR);
      // tibia
      utils.drawBoneSegment(ctx, kneeX, kneeY, ankleX, ankleY, 2 * s, BONE_COLOR);
      // foot stub
      utils.drawBoneSegment(ctx, ankleX, ankleY, ankleX + side * 3 * s, ankleY, 1.5 * s, BONE_COLOR);
    }

    // ── Pelvis ──────────────────────────────────────────────────────────────
    const pelvisY = baseY - 24 * s + sc(5).y;
    ctx.fillStyle = utils.rgb(BONE_COLOR);
    utils.fillEllipse(ctx, cx + sc(5).x, pelvisY, 9 * s, 5 * s);
    ctx.fillStyle = utils.rgb(utils.darken(BONE_COLOR, 20), 0.5);
    utils.fillEllipse(ctx, cx + sc(5).x, pelvisY, 5 * s, 3 * s);

    // ── Spine ──────────────────────────────────────────────────────────────
    const spineTopY = baseY - 46 * s;
    const spineBotY = baseY - 26 * s;
    const segments = 5;
    for (let i = 0; i < segments; i++) {
      const frac = i / (segments - 1);
      const sy = spineBotY + (spineTopY - spineBotY) * frac;
      const sx2 = cx + ro(20 + i, 'x') + sc(20 + i).x;
      const sy2 = sy + ro(20 + i, 'y') + sc(20 + i).y;
      const nextFrac = (i + 1) / (segments - 1);
      const ny = spineBotY + (spineTopY - spineBotY) * nextFrac;
      const nx = cx + ro(20 + i + 1, 'x') + sc(20 + i + 1).x;
      const nny = ny + ro(20 + i + 1, 'y') + sc(20 + i + 1).y;
      if (i < segments - 1) {
        utils.drawBoneSegment(ctx, sx2, sy2, nx, nny, 2 * s, BONE_COLOR);
      }
    }

    // ── Ribcage ─────────────────────────────────────────────────────────────
    for (const side of [-1, 1]) {
      for (let rib = 0; rib < 4; rib++) {
        const boneId = 30 + rib * 2 + (side === -1 ? 0 : 1);
        const ribY = baseY - 46 * s + rib * 5 * s + ro(boneId, 'y') + sc(boneId).y;
        const ribStartX = cx + ro(boneId, 'x') + sc(boneId).x;
        const ribEndX = cx + side * 10 * s + ro(boneId, 'x') * 2;
        const ribMidX = cx + side * 7 * s;
        const ribMidY = ribY + 3 * s;
        ctx.strokeStyle = utils.rgb(BONE_COLOR);
        ctx.lineWidth = 1.2 * s;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ribStartX, ribY);
        ctx.arc(ribMidX, ribMidY, Math.abs(ribEndX - ribStartX) * 0.55, side === -1 ? -1.2 : -Math.PI + 0.4, side === -1 ? 0.4 : Math.PI * 1.2, side === 1);
        ctx.stroke();
      }
    }

    // ── Arm bones (radius/ulna) ───────────────────────────────────────────────
    for (const side of [-1, 1]) {
      const isRight = side === 1;
      const boneId = isRight ? 40 : 41;
      const sc1 = sc(boneId);
      const armPhase = act === 'walk' ? phase + (isRight ? Math.PI : 0) : 0;
      const shoulderX = cx + side * 9 * s + ro(boneId, 'x') + sc1.x;
      const shoulderY = baseY - 48 * s + ro(boneId, 'y') + sc1.y;
      let elbowX = shoulderX + side * 4 * s + Math.sin(armPhase) * 2 * s;
      let elbowY = shoulderY + 9 * s - Math.abs(Math.sin(armPhase)) * 2 * s;
      let handX = elbowX + side * 3 * s + ro(boneId + 5, 'x') + sc(boneId + 5).x;
      let handY = elbowY + 7 * s + ro(boneId + 5, 'y') + sc(boneId + 5).y;

      // Right arm: sword swing
      if (isRight && act === 'attack') {
        const swingAngle = -0.6 + swordSwing * 1.4;
        const upperLen = 9 * s;
        const lowerLen = 10 * s;
        elbowX = shoulderX + Math.sin(swingAngle) * upperLen;
        elbowY = shoulderY + Math.cos(swingAngle) * upperLen;
        handX = elbowX + Math.sin(swingAngle + 0.3) * lowerLen;
        handY = elbowY + Math.cos(swingAngle + 0.3) * lowerLen;
      }

      // Upper arm (humerus)
      utils.drawBoneSegment(ctx, shoulderX, shoulderY, elbowX, elbowY, 2.2 * s, BONE_COLOR);
      // Forearm: draw as two parallel thin lines (radius + ulna)
      const perpX = -(elbowY - handY);
      const perpY = elbowX - handX;
      const len = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
      const nx = (perpX / len) * 0.8 * s;
      const ny = (perpY / len) * 0.8 * s;
      ctx.strokeStyle = utils.rgb(BONE_COLOR);
      ctx.lineWidth = 1 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(elbowX + nx, elbowY + ny);
      ctx.lineTo(handX + nx, handY + ny);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(elbowX - nx, elbowY - ny);
      ctx.lineTo(handX - nx, handY - ny);
      ctx.stroke();
      // Knob at elbow and hand
      ctx.fillStyle = utils.rgb(utils.lighten(BONE_COLOR, 15));
      utils.fillCircle(ctx, elbowX, elbowY, 1.8 * s);
      utils.fillCircle(ctx, handX, handY, 1.4 * s);

      // Right hand: rusted sword
      if (isRight && act !== 'death') {
        const swordAngle = act === 'attack' ? -0.3 + swordSwing * 1.6 : 0.2;
        ctx.save();
        ctx.translate(handX, handY);
        ctx.rotate(swordAngle);
        // Blade — pitted surface
        const bladeColor = '#554a38';
        ctx.fillStyle = bladeColor;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-1.5 * s, 12 * s);
        ctx.lineTo(1.5 * s, 12 * s);
        ctx.closePath();
        ctx.fill();
        // Pits/rust spots
        ctx.fillStyle = 'rgba(60,40,20,0.45)';
        utils.fillCircle(ctx, -0.3 * s, 4 * s, 0.6 * s);
        utils.fillCircle(ctx, 0.5 * s, 7.5 * s, 0.5 * s);
        utils.fillCircle(ctx, -0.6 * s, 9.5 * s, 0.4 * s);
        // Guard
        ctx.fillStyle = '#706448';
        ctx.fillRect(-3 * s, -1 * s, 6 * s, 1.5 * s);
        // Handle
        ctx.fillStyle = '#382716';
        ctx.fillRect(-0.8 * s, -5 * s, 1.6 * s, 5 * s);
        ctx.restore();
      }
    }

    // ── Skull ────────────────────────────────────────────────────────────────
    const skullBaseY = baseY - 53 * s + sc(1).y;
    const skullCX = cx + ro(1, 'x') + sc(1).x;

    // Cranium
    const craniumGrad = ctx.createRadialGradient(skullCX - 3 * s, skullBaseY - 5 * s, 0, skullCX, skullBaseY, 9 * s);
    craniumGrad.addColorStop(0, utils.rgb(utils.lighten(BONE_COLOR, 20)));
    craniumGrad.addColorStop(1, utils.rgb(utils.darken(BONE_COLOR, 15)));
    ctx.fillStyle = craniumGrad;
    ctx.beginPath();
    ctx.ellipse(skullCX, skullBaseY, 8 * s, 9 * s, 0, Math.PI, 0, false);
    ctx.fill();
    // Lower skull / cheekbones
    ctx.fillStyle = utils.rgb(BONE_COLOR);
    ctx.beginPath();
    ctx.ellipse(skullCX, skullBaseY, 6.5 * s, 5 * s, 0, 0, Math.PI);
    ctx.fill();

    // Deep eye sockets
    for (const side of [-1, 1]) {
      const ex = skullCX + side * 3.5 * s;
      const ey = skullBaseY - 2 * s;
      // Dark socket
      ctx.fillStyle = '#1a1208';
      utils.fillEllipse(ctx, ex, ey, 2.8 * s, 2.5 * s);
      // Soul fire: alpha flickers with phase
      const fireAlpha = act === 'idle' ? 0.15 + Math.sin(phase + side) * 0.1 : 0.2;
      ctx.fillStyle = `rgba(68,136,170,${fireAlpha})`;
      utils.fillCircle(ctx, ex, ey, 1.5 * s);
      // Bright soul-fire spark
      const sparkAlpha = act === 'idle' ? 0.4 + Math.sin(phase * 2 + side) * 0.2 : 0.5;
      ctx.fillStyle = `rgba(120,200,240,${sparkAlpha})`;
      utils.fillCircle(ctx, ex, ey, 0.6 * s);
    }

    // Nasal cavity
    ctx.fillStyle = '#2a2010';
    utils.fillEllipse(ctx, skullCX, skullBaseY + 1 * s, 1.5 * s, 2 * s);

    // Jaw — wobbles in idle
    const jawOpenAmt = act === 'idle' ? Math.abs(Math.sin(phase)) * 1.5 * s : (act === 'attack' ? 2 * s * t : 0);
    const jawY = skullBaseY + 4 * s + jawOpenAmt;
    ctx.fillStyle = utils.rgb(utils.darken(BONE_COLOR, 10));
    ctx.beginPath();
    ctx.ellipse(skullCX, jawY, 5 * s, 2.5 * s, 0, 0, Math.PI);
    ctx.fill();
    // Teeth
    ctx.fillStyle = utils.rgb(utils.lighten(BONE_COLOR, 10));
    for (let tooth = -2; tooth <= 2; tooth++) {
      const tx = skullCX + tooth * 1.6 * s;
      ctx.fillRect(tx - 0.5 * s, skullBaseY + 3 * s, 1 * s, 2 * s + jawOpenAmt * 0.5);
    }

    ctx.restore(); // lean

    ctx.restore(); // global
  },
};
