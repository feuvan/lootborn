import Phaser from 'phaser';
import { TILE_WIDTH, TILE_HEIGHT } from '../config';
import { cartToIso } from '../utils/IsometricUtils';
import { FogOfWarCore } from './FogOfWarCore';

// Re-export FogOfWarCore for consumers that need the pure-logic class
export { FogOfWarCore } from './FogOfWarCore';

/**
 * Phaser-integrated fog of war renderer.
 *
 * Uses `FogOfWarCore` for the logic and a `Phaser.GameObjects.Graphics`
 * layer for rendering.  Only triggers render when the player moves to a
 * new tile (throttled via dirty-tile approach in the core).  Preserves
 * the gradient edge band (3 tiles) and camera viewport culling.
 */
export class FogOfWarSystem {
  private scene: Phaser.Scene;
  private fogLayer: Phaser.GameObjects.Graphics;
  readonly core: FogOfWarCore;
  /** Tracks whether a full render pass has been done yet. */
  private hasRendered = false;

  constructor(scene: Phaser.Scene, cols: number, rows: number, viewRadius = 10) {
    this.scene = scene;
    this.core = new FogOfWarCore(cols, rows, viewRadius);
    this.fogLayer = scene.add.graphics();
    this.fogLayer.setDepth(1000);
  }

  /** Convenience getters delegating to core */
  get cols(): number { return this.core.cols; }
  get rows(): number { return this.core.rows; }
  get viewRadius(): number { return this.core.viewRadius; }

  update(playerCol: number, playerRow: number): void {
    const changed = this.core.update(playerCol, playerRow);
    if (!changed) return;

    if (!this.hasRendered) {
      this.renderFull(playerCol, playerRow);
      this.hasRendered = true;
    } else {
      this.renderDirty(playerCol, playerRow);
    }
  }

  /**
   * Full render pass — clears the entire fog layer and redraws all
   * viewport-visible tiles.  Used only on the very first render.
   */
  private renderFull(playerCol: number, playerRow: number): void {
    this.fogLayer.clear();

    const cam = this.scene.cameras.main;
    const camCX = cam.scrollX + cam.width / 2 / cam.zoom;
    const camCY = cam.scrollY + cam.height / 2 / cam.zoom;
    const viewW = cam.width / cam.zoom / 2;
    const viewH = cam.height / cam.zoom / 2;
    const margin = 4;

    const cols = this.core.cols;
    const rows = this.core.rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pos = cartToIso(c, r);
        const dx = Math.abs(pos.x - camCX);
        const dy = Math.abs(pos.y - camCY);

        // Viewport culling
        if (dx > viewW + TILE_WIDTH * margin || dy > viewH + TILE_HEIGHT * margin) continue;

        this.drawTileFog(c, r, playerCol, playerRow, pos);
      }
    }
  }

  /**
   * Incremental render — only erases and redraws tiles whose visibility
   * state changed (dirty tiles from FogOfWarCore).  No fogLayer.clear().
   */
  private renderDirty(playerCol: number, playerRow: number): void {
    const dirty = this.core.dirty;
    if (dirty.size === 0) return;

    const cam = this.scene.cameras.main;
    const camCX = cam.scrollX + cam.width / 2 / cam.zoom;
    const camCY = cam.scrollY + cam.height / 2 / cam.zoom;
    const viewW = cam.width / cam.zoom / 2;
    const viewH = cam.height / cam.zoom / 2;
    const margin = 4;

    const cols = this.core.cols;

    for (const idx of dirty) {
      const c = idx % cols;
      const r = (idx - c) / cols;
      const pos = cartToIso(c, r);
      const dx = Math.abs(pos.x - camCX);
      const dy = Math.abs(pos.y - camCY);

      // Viewport culling — skip tiles outside camera bounds
      if (dx > viewW + TILE_WIDTH * margin || dy > viewH + TILE_HEIGHT * margin) continue;

      // Erase the old tile by drawing fully transparent over it
      this.fogLayer.fillStyle(0x000000, 0);
      this.drawIsoTile(pos.x, pos.y);

      // Redraw with new fog alpha
      this.drawTileFog(c, r, playerCol, playerRow, pos);
    }
  }

  /**
   * Draw fog for a single tile at the given position.
   * Shared by both full and incremental render paths.
   */
  private drawTileFog(c: number, r: number, playerCol: number, playerRow: number, pos: { x: number; y: number }): void {
    const edgeBand = 3;
    const innerEdge = this.core.viewRadius - edgeBand;
    const dist = Math.sqrt((c - playerCol) ** 2 + (r - playerRow) ** 2);

    if (dist > this.core.viewRadius) {
      if (!this.core.isExplored(c, r)) {
        this.fogLayer.fillStyle(0x000000, 0.85);
        this.drawIsoTile(pos.x, pos.y);
      } else {
        const edgeFade = dist < this.core.viewRadius + edgeBand
          ? 0.18 + (dist - this.core.viewRadius) / edgeBand * 0.15
          : 0.35;
        this.fogLayer.fillStyle(0x000000, edgeFade);
        this.drawIsoTile(pos.x, pos.y);
      }
    } else if (dist > innerEdge) {
      const t = (dist - innerEdge) / edgeBand;
      const alpha = t * 0.15;
      if (alpha > 0.01) {
        this.fogLayer.fillStyle(0x000000, alpha);
        this.drawIsoTile(pos.x, pos.y);
      }
    }
  }

  private drawIsoTile(x: number, y: number): void {
    const hw = TILE_WIDTH / 2;
    const hh = TILE_HEIGHT / 2;
    this.fogLayer.fillPoints([
      new Phaser.Geom.Point(x, y - hh),
      new Phaser.Geom.Point(x + hw, y),
      new Phaser.Geom.Point(x, y + hh),
      new Phaser.Geom.Point(x - hw, y),
    ], true);
  }

  isExplored(col: number, row: number): boolean {
    return this.core.isExplored(col, row);
  }

  getExploredData(): boolean[][] {
    return this.core.getExploredData();
  }

  loadExploredData(data: boolean[][]): void {
    this.core.loadExploredData(data);
    this.hasRendered = false;
  }

  /** Expose gradient info for testing */
  getGradientInfo(playerCol: number, playerRow: number): { col: number; row: number; alpha: number }[] {
    return this.core.getGradientInfo(playerCol, playerRow);
  }
}
