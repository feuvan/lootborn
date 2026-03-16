// src/graphics/sprites/types.ts
import type { DrawUtils } from '../DrawUtils';

export type MonsterAction = 'idle' | 'walk' | 'attack' | 'hurt' | 'death';
export type PlayerAction = MonsterAction | 'cast';
export type NPCAction = 'working' | 'alert' | 'idle' | 'talking';
export type EntityAction = MonsterAction | PlayerAction | NPCAction;

export interface EntityDrawer {
  readonly key: string;
  readonly frameW: number;       // before TEXTURE_SCALE
  readonly frameH: number;       // before TEXTURE_SCALE
  readonly totalFrames: number;

  drawFrame(
    ctx: CanvasRenderingContext2D,
    frame: number,               // 0-based index within the current action
    action: EntityAction,
    w: number,                   // scaled frame width
    h: number,                   // scaled frame height
    utils: DrawUtils,
  ): void;
}

/** Map of texture key → {frameWidth, frameHeight} for BootScene spritesheet loading */
export type FrameSizeRegistry = Record<string, { frameWidth: number; frameHeight: number }>;
