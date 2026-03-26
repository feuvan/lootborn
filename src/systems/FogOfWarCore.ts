// ── Fog visibility states stored in Uint8Array ────────────────────────
/** 0 = unexplored, 1 = explored (out of view), 2 = visible (in view) */
const FOG_UNEXPLORED = 0;
const FOG_EXPLORED = 1;
const FOG_VISIBLE = 2;

/**
 * Pure-logic fog of war engine.  Tracks explored / visible state in a flat
 * `Uint8Array` and exposes a dirty-tile set so the renderer only redraws
 * tiles whose visibility actually changed.
 *
 * No Phaser dependency — safe to import in unit tests.
 */
export class FogOfWarCore {
  readonly cols: number;
  readonly rows: number;
  readonly viewRadius: number;

  /** Flat explored state – 0 = unexplored, 1 = explored */
  private explored: Uint8Array;

  /**
   * Current per-tile fog alpha (quantised 0-255 → 0.0-1.0).
   * Used for dirty-diffing between frames.
   */
  private prevAlpha: Uint8Array;

  /** Tiles whose fog alpha changed since the last render. */
  dirty: Set<number> = new Set();

  /** Last player tile position passed to `update()`. -1 means "never updated". */
  private lastCol = -1;
  private lastRow = -1;

  /** Gradient edge band width (tiles). */
  private readonly edgeBand = 3;

  constructor(cols: number, rows: number, viewRadius = 10) {
    this.cols = cols;
    this.rows = rows;
    this.viewRadius = viewRadius;
    this.explored = new Uint8Array(rows * cols); // initialised to 0
    this.prevAlpha = new Uint8Array(rows * cols); // 0 = no fog drawn yet
  }

  // ── Public API ────────────────────────────────────────────────────────

  /**
   * Returns `true` if the player moved to a new tile and the visibility
   * map was recalculated.  Returns `false` if skipped (same tile).
   */
  update(playerCol: number, playerRow: number): boolean {
    if (playerCol === this.lastCol && playerRow === this.lastRow) return false;
    this.lastCol = playerCol;
    this.lastRow = playerRow;

    // 1. Mark tiles in view radius as explored
    const vr = this.viewRadius;
    const vrSq = vr * vr;
    const minC = Math.max(0, Math.floor(playerCol - vr));
    const maxC = Math.min(this.cols - 1, Math.ceil(playerCol + vr));
    const minR = Math.max(0, Math.floor(playerRow - vr));
    const maxR = Math.min(this.rows - 1, Math.ceil(playerRow + vr));

    for (let r = minR; r <= maxR; r++) {
      const rowOff = r * this.cols;
      const dr = r - playerRow;
      for (let c = minC; c <= maxC; c++) {
        const dc = c - playerCol;
        if (dc * dc + dr * dr <= vrSq) {
          this.explored[rowOff + c] = FOG_VISIBLE; // temporary mark
        }
      }
    }

    // 2. Compute per-tile fog alpha and detect dirty tiles
    this.dirty.clear();
    const innerEdge = vr - this.edgeBand;

    for (let r = 0; r < this.rows; r++) {
      const rowOff = r * this.cols;
      const dr = r - playerRow;
      for (let c = 0; c < this.cols; c++) {
        const idx = rowOff + c;
        const dc = c - playerCol;
        const distSq = dc * dc + dr * dr;
        const dist = Math.sqrt(distSq);

        let alpha: number; // 0.0-1.0

        if (dist <= innerEdge) {
          // Fully visible — no fog
          alpha = 0;
          if (this.explored[idx] === FOG_UNEXPLORED) this.explored[idx] = FOG_EXPLORED;
        } else if (dist <= vr) {
          // Gradient edge band
          const t = (dist - innerEdge) / this.edgeBand;
          alpha = t * 0.15;
          if (alpha < 0.01) alpha = 0;
          if (this.explored[idx] === FOG_UNEXPLORED) this.explored[idx] = FOG_EXPLORED;
        } else {
          // Outside view radius
          if (this.explored[idx] >= FOG_EXPLORED) {
            // Explored but out of view
            const edgeFade = dist < vr + this.edgeBand
              ? 0.18 + (dist - vr) / this.edgeBand * 0.15
              : 0.35;
            alpha = edgeFade;
          } else {
            // Unexplored
            alpha = 0.85;
          }
        }

        // Quantise to Uint8 for cheap diffing (0-255)
        const q = Math.round(alpha * 255);
        if (q !== this.prevAlpha[idx]) {
          this.dirty.add(idx);
          this.prevAlpha[idx] = q;
        }
      }
    }

    // Reset the temporary FOG_VISIBLE marks back to FOG_EXPLORED
    for (let r = minR; r <= maxR; r++) {
      const rowOff = r * this.cols;
      const dr = r - playerRow;
      for (let c = minC; c <= maxC; c++) {
        const dc = c - playerCol;
        if (dc * dc + dr * dr <= vrSq) {
          if (this.explored[rowOff + c] === FOG_VISIBLE) {
            this.explored[rowOff + c] = FOG_EXPLORED;
          }
        }
      }
    }

    return true;
  }

  // ── Query helpers ─────────────────────────────────────────────────────

  isExplored(col: number, row: number): boolean {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
    return this.explored[row * this.cols + col] >= FOG_EXPLORED;
  }

  /** Alpha value for a tile at the current state (0 = clear, 0.85 = unexplored). */
  getAlpha(col: number, row: number): number {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return 0.85;
    return this.prevAlpha[row * this.cols + col] / 255;
  }

  /**
   * Returns gradient edge band info for the current player position.
   * Useful for testing that gradient tiles are correctly calculated.
   */
  getGradientInfo(playerCol: number, playerRow: number): { col: number; row: number; alpha: number }[] {
    const result: { col: number; row: number; alpha: number }[] = [];
    const innerEdge = this.viewRadius - this.edgeBand;

    const vr = this.viewRadius;
    const minC = Math.max(0, Math.floor(playerCol - vr));
    const maxC = Math.min(this.cols - 1, Math.ceil(playerCol + vr));
    const minR = Math.max(0, Math.floor(playerRow - vr));
    const maxR = Math.min(this.rows - 1, Math.ceil(playerRow + vr));

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const dist = Math.sqrt((c - playerCol) ** 2 + (r - playerRow) ** 2);
        if (dist > innerEdge && dist <= vr) {
          const t = (dist - innerEdge) / this.edgeBand;
          const alpha = t * 0.15;
          if (alpha >= 0.01) {
            result.push({ col: c, row: r, alpha });
          }
        }
      }
    }
    return result;
  }

  // ── Save / Load compatibility (boolean[][]) ───────────────────────────

  getExploredData(): boolean[][] {
    const result: boolean[][] = [];
    for (let r = 0; r < this.rows; r++) {
      const row: boolean[] = [];
      const off = r * this.cols;
      for (let c = 0; c < this.cols; c++) {
        row.push(this.explored[off + c] >= FOG_EXPLORED);
      }
      result.push(row);
    }
    return result;
  }

  loadExploredData(data: boolean[][]): void {
    if (data.length !== this.rows || !data[0] || data[0].length !== this.cols) return;
    for (let r = 0; r < this.rows; r++) {
      const off = r * this.cols;
      for (let c = 0; c < this.cols; c++) {
        this.explored[off + c] = data[r][c] ? FOG_EXPLORED : FOG_UNEXPLORED;
      }
    }
    // Reset previous alpha so next render redraws everything
    this.prevAlpha.fill(0);
    this.lastCol = -1;
    this.lastRow = -1;
  }

  /** Force full redraw on next update (useful after load). */
  invalidate(): void {
    this.prevAlpha.fill(0);
    this.lastCol = -1;
    this.lastRow = -1;
    this.dirty.clear();
  }
}
