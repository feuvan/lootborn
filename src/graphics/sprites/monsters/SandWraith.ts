// src/graphics/sprites/monsters/SandWraith.ts
import type { EntityDrawer, MonsterAction } from '../types';
import type { DrawUtils } from '../../DrawUtils';

const CLOTH_MID  = 0x8a7a5a;
const CLOTH_DARK = 0x5a5030;
const CLOTH_LIGHT = 0xaa9a70;
const VOID_COLOR = 0x1a0828;
const EYE_COLOR  = 0xffaa22;
const SAND_COLOR = 0xc8b080;

export const SandWraithDrawer: EntityDrawer = {
  key: 'monster_sand_wraith',
  frameW: 52,
  frameH: 64,
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
    let bodyOffsetX = 0;
    let bodyOffsetY = 0;
    let globalRot = 0;
    let wrapFlutter = 0;

    switch (act) {
      case 'idle':
        bodyOffsetY = Math.sin(phase) * 2.5 * s;
        wrapFlutter = Math.sin(phase) * 0.3;
        break;
      case 'walk':
        bodyOffsetX = Math.sin(phase) * 2 * s;
        bodyOffsetY = Math.sin(phase * 0.8) * 2.5 * s;
        wrapFlutter = Math.sin(phase) * 0.5;
        break;
      case 'attack':
        bodyOffsetX = t * 7 * s;
        bodyOffsetY = -t * 3 * s;
        break;
      case 'hurt':
        bodyOffsetX = -t * 5 * s;
        alpha = 0.5 + t * 0.5;
        break;
      case 'death':
        globalRot = t * 0.3;
        bodyOffsetY = t * h * 0.3;
        alpha = 1 - t * 0.9;
        break;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = w / 2;
    const baseY = h * 0.88;

    ctx.translate(cx, baseY);
    ctx.rotate(globalRot);
    ctx.translate(-cx, -baseY);

    // Faint shadow
    ctx.fillStyle = 'rgba(100,80,40,0.2)';
    utils.fillEllipse(ctx, cx + bodyOffsetX, baseY + 2 * s, 10 * s, 2.5 * s);

    // Trailing sand wisps
    for (let i = 0; i < 3; i++) {
      const wAngle = Math.PI * 0.3 + i * 0.4 + wrapFlutter;
      const wLen = (8 + i * 3) * s;
      ctx.strokeStyle = utils.rgb(SAND_COLOR, 0.15 + Math.sin(phase + i) * 0.08);
      ctx.lineWidth = 1.5 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + bodyOffsetX, baseY - 8 * s + bodyOffsetY);
      ctx.quadraticCurveTo(
        cx + bodyOffsetX - Math.cos(wAngle) * wLen * 0.6,
        baseY + 2 * s,
        cx + bodyOffsetX - Math.cos(wAngle) * wLen,
        baseY + 3 * s
      );
      ctx.stroke();
    }

    // Dark void body core
    const bodyCX = cx + bodyOffsetX;
    const bodyCY = baseY - 22 * s + bodyOffsetY;

    utils.zoneEntityOutline(ctx, w, h);

    const voidGrad = ctx.createRadialGradient(bodyCX, bodyCY, 0, bodyCX, bodyCY, 12 * s);
    voidGrad.addColorStop(0, utils.rgb(VOID_COLOR, 0.9));
    voidGrad.addColorStop(0.6, utils.rgb(VOID_COLOR, 0.6));
    voidGrad.addColorStop(1, utils.rgb(VOID_COLOR, 0.1));
    ctx.fillStyle = voidGrad;
    utils.fillEllipse(ctx, bodyCX, bodyCY, 9 * s, 14 * s);

    utils.softOutlineEnd(ctx);

    // Cloth wrappings over void body
    const wrapCount = 5;
    for (let i = 0; i < wrapCount; i++) {
      const wy = bodyCY - 8 * s + i * 5 * s;
      const wobble = Math.sin(phase + i * 1.5) * wrapFlutter * 3 * s;
      ctx.strokeStyle = utils.rgb(i % 2 === 0 ? CLOTH_MID : CLOTH_DARK, 0.7);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(bodyCX - 8 * s + wobble, wy);
      ctx.quadraticCurveTo(bodyCX, wy + 1.5 * s, bodyCX + 8 * s - wobble, wy);
      ctx.stroke();
    }

    // Tattered cloth hanging ends
    for (const side of [-1, 1]) {
      const hangX = bodyCX + side * 7 * s;
      const hangY = bodyCY + 8 * s;
      ctx.strokeStyle = utils.rgb(CLOTH_DARK, 0.5);
      ctx.lineWidth = 2 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hangX, hangY);
      ctx.quadraticCurveTo(
        hangX + side * 3 * s + wrapFlutter * 4 * s,
        hangY + 5 * s,
        hangX + side * 2 * s + wrapFlutter * 6 * s,
        baseY - 2 * s
      );
      ctx.stroke();
    }

    // Head region
    const headCX = bodyCX;
    const headCY = bodyCY - 14 * s;
    const headRX = 8 * s;
    const headRY = 7 * s;

    utils.zoneEntityRimLight(ctx, headCX, headCY, headRX, headRY);

    // Wrapped head
    const headGrad = ctx.createRadialGradient(headCX, headCY - 2 * s, 0, headCX, headCY, headRX);
    headGrad.addColorStop(0, utils.rgb(CLOTH_LIGHT, 0.8));
    headGrad.addColorStop(0.5, utils.rgb(CLOTH_MID, 0.7));
    headGrad.addColorStop(1, utils.rgb(CLOTH_DARK, 0.4));
    ctx.fillStyle = headGrad;
    utils.fillEllipse(ctx, headCX, headCY, headRX, headRY);

    // Dark void peeking through wrappings
    ctx.fillStyle = utils.rgb(VOID_COLOR, 0.6);
    utils.fillEllipse(ctx, headCX, headCY + 1 * s, 5 * s, 3 * s);

    // Glowing amber eyes
    for (const side of [-1, 1]) {
      const ex = headCX + side * 2.5 * s;
      const ey = headCY;
      ctx.fillStyle = utils.rgb(EYE_COLOR, 0.9);
      utils.fillCircle(ctx, ex, ey, 1.8 * s);
      const eyeGlow = ctx.createRadialGradient(ex, ey, 0, ex, ey, 3.5 * s);
      eyeGlow.addColorStop(0, utils.rgb(EYE_COLOR, 0.4));
      eyeGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = eyeGlow;
      utils.fillCircle(ctx, ex, ey, 3.5 * s);
    }

    ctx.restore();
  },
};
