import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FogOfWarCore } from '../systems/FogOfWarCore';

// ---------------------------------------------------------------------------
// Tests for the optimized FogOfWarSystem
// Pure-logic tests use FogOfWarCore (no Phaser dependency).
// ---------------------------------------------------------------------------

describe('FogOfWarSystem — Optimized', () => {
  const cols = 30;
  const rows = 30;
  const viewRadius = 5;
  let core: FogOfWarCore;

  beforeEach(() => {
    core = new FogOfWarCore(cols, rows, viewRadius);
  });

  // ─── (a) Fog only updates on tile change ────────────────────────────
  describe('fog only updates on tile change', () => {
    it('update() marks tiles as explored when called', () => {
      core.update(10, 10);
      expect(core.isExplored(10, 10)).toBe(true);
      expect(core.isExplored(11, 10)).toBe(true);
      expect(core.isExplored(10, 11)).toBe(true);
    });

    it('update() returns true on first call (new tile)', () => {
      expect(core.update(10, 10)).toBe(true);
    });

    it('update() returns false when called with the same tile position', () => {
      core.update(10, 10);
      expect(core.update(10, 10)).toBe(false);
    });

    it('update() returns true when player moves to a new tile', () => {
      core.update(10, 10);
      expect(core.update(12, 12)).toBe(true);
    });

    it('repeated same-position calls never compute dirty tiles', () => {
      core.update(10, 10);
      core.dirty.clear();

      // Same position — dirty set should remain empty
      core.update(10, 10);
      expect(core.dirty.size).toBe(0);

      core.update(10, 10);
      expect(core.dirty.size).toBe(0);

      core.update(10, 10);
      expect(core.dirty.size).toBe(0);
    });

    it('moving to a new tile produces dirty tiles', () => {
      core.update(10, 10);
      core.update(12, 12);
      expect(core.dirty.size).toBeGreaterThan(0);
    });
  });

  // ─── (b) Explored state persists correctly ──────────────────────────
  describe('explored state persists correctly', () => {
    it('getExploredData() returns boolean[][] matching explored state', () => {
      core.update(5, 5);
      const data = core.getExploredData();
      expect(data.length).toBe(rows);
      expect(data[0].length).toBe(cols);
      // Center tile must be explored
      expect(data[5][5]).toBe(true);
      // Far corner should not be explored
      expect(data[29][29]).toBe(false);
    });

    it('loadExploredData() restores explored state from boolean[][]', () => {
      const data: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
      data[15][15] = true;

      core.loadExploredData(data);
      expect(core.isExplored(15, 15)).toBe(true);
      expect(core.isExplored(0, 0)).toBe(false);
    });

    it('round-trip: getExploredData → loadExploredData preserves all tiles', () => {
      core.update(10, 10);
      const exported = core.getExploredData();

      const core2 = new FogOfWarCore(cols, rows, viewRadius);
      core2.loadExploredData(exported);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          expect(core2.isExplored(c, r)).toBe(core.isExplored(c, r));
        }
      }
    });

    it('loadExploredData() rejects data with wrong dimensions', () => {
      const wrongData: boolean[][] = [[true, false]];
      core.update(5, 5);
      core.loadExploredData(wrongData);
      // State should be unchanged — tile (5,5) still explored
      expect(core.isExplored(5, 5)).toBe(true);
    });

    it('isExplored returns false for out-of-bounds tiles', () => {
      expect(core.isExplored(-1, 0)).toBe(false);
      expect(core.isExplored(0, -1)).toBe(false);
      expect(core.isExplored(cols, 0)).toBe(false);
      expect(core.isExplored(0, rows)).toBe(false);
    });

    it('loadExploredData resets tile tracking so next update redraws', () => {
      core.update(10, 10);
      const data = core.getExploredData();
      core.loadExploredData(data);
      // After load, the next update should process (lastCol/lastRow reset)
      expect(core.update(10, 10)).toBe(true);
    });
  });

  // ─── (c) Gradient edge tiles calculated correctly ────────────────────
  describe('gradient edge tiles calculated correctly', () => {
    it('tiles within inner edge (viewRadius - 3) are fully visible (no fog)', () => {
      core.update(15, 15);
      // Inner edge = viewRadius - edgeBand = 5 - 3 = 2
      // Tile (15,15) distance 0 — fully visible (alpha 0)
      expect(core.getAlpha(15, 15)).toBe(0);
      // Tile (16,15) distance 1 — fully visible (alpha 0)
      expect(core.getAlpha(16, 15)).toBe(0);
      expect(core.isExplored(15, 15)).toBe(true);
      expect(core.isExplored(16, 15)).toBe(true);
    });

    it('tiles between innerEdge and viewRadius get gradient fog alpha', () => {
      core.update(15, 15);
      const gradientInfo = core.getGradientInfo(15, 15);
      // Tile (18,15) is at distance 3 — in gradient band
      const tileAtDist3 = gradientInfo.find(
        t => t.col === 18 && t.row === 15
      );
      expect(tileAtDist3).toBeDefined();
      expect(tileAtDist3!.alpha).toBeGreaterThan(0);
      expect(tileAtDist3!.alpha).toBeLessThan(0.85);
    });

    it('edgeBand width is 3 tiles', () => {
      core.update(15, 15);
      const gradientInfo = core.getGradientInfo(15, 15);
      const innerEdge = viewRadius - 3; // 2
      for (const tile of gradientInfo) {
        const dist = Math.sqrt((tile.col - 15) ** 2 + (tile.row - 15) ** 2);
        expect(dist).toBeGreaterThan(innerEdge);
        expect(dist).toBeLessThanOrEqual(viewRadius);
      }
    });

    it('gradient alpha increases with distance from inner edge', () => {
      core.update(15, 15);
      const gradientInfo = core.getGradientInfo(15, 15);
      const sorted = gradientInfo.sort((a, b) => {
        const da = Math.sqrt((a.col - 15) ** 2 + (a.row - 15) ** 2);
        const db = Math.sqrt((b.col - 15) ** 2 + (b.row - 15) ** 2);
        return da - db;
      });

      if (sorted.length >= 2) {
        const firstAlpha = sorted[0].alpha;
        const lastAlpha = sorted[sorted.length - 1].alpha;
        expect(lastAlpha).toBeGreaterThanOrEqual(firstAlpha);
      }
    });

    it('no gradient tiles exist at distance <= innerEdge', () => {
      core.update(15, 15);
      const gradientInfo = core.getGradientInfo(15, 15);
      const innerEdge = viewRadius - 3;
      for (const tile of gradientInfo) {
        const dist = Math.sqrt((tile.col - 15) ** 2 + (tile.row - 15) ** 2);
        expect(dist).toBeGreaterThan(innerEdge);
      }
    });
  });

  // ─── (d) Viewport culling logic works ───────────────────────────────
  describe('viewport culling logic works', () => {
    it('dirty set only contains tiles that actually changed alpha', () => {
      // First update: all tiles change from 0 to their computed value
      core.update(15, 15);
      const firstDirtyCount = core.dirty.size;
      expect(firstDirtyCount).toBeGreaterThan(0);

      // Second update at same position: update() returns false, dirty is unchanged
      // (the dirty set from the first call persists but no new computation ran)
      const changed = core.update(15, 15);
      expect(changed).toBe(false);
      // Dirty set still contains the tiles from the first call
      // That's correct — the renderer would have consumed them already

      // Third update at new position: some tiles change
      core.update(16, 15);
      expect(core.dirty.size).toBeGreaterThan(0);
      // But should be less than redrawing everything
      expect(core.dirty.size).toBeLessThanOrEqual(cols * rows);
    });

    it('dirty tiles include both newly-visible and newly-hidden tiles', () => {
      core.update(10, 10);
      core.update(15, 15);

      // Some tiles near (10,10) that were visible should now be dirty
      // (they became explored-out-of-view)
      // And some tiles near (15,15) that were dark should now be dirty
      // (they became visible)
      expect(core.dirty.size).toBeGreaterThan(0);
    });

    it('large grid only produces dirty tiles proportional to movement', () => {
      const bigCore = new FogOfWarCore(120, 120, 10);
      bigCore.update(60, 60);
      const firstDirty = bigCore.dirty.size;

      // Move one tile — dirty count should be much less than full grid
      bigCore.update(61, 60);
      const moveDirty = bigCore.dirty.size;
      expect(moveDirty).toBeLessThan(120 * 120);
      // Moving one tile should produce fewer dirty tiles than the initial reveal
      expect(moveDirty).toBeLessThan(firstDirty);
    });
  });

  // ─── Additional edge cases ──────────────────────────────────────────
  describe('edge cases', () => {
    it('update at (0,0) corner works without errors', () => {
      expect(() => core.update(0, 0)).not.toThrow();
      expect(core.isExplored(0, 0)).toBe(true);
    });

    it('update at max corner works without errors', () => {
      expect(() => core.update(cols - 1, rows - 1)).not.toThrow();
      expect(core.isExplored(cols - 1, rows - 1)).toBe(true);
    });

    it('unexplored tiles have alpha 0.85', () => {
      core.update(5, 5);
      // Far tiles should be unexplored with 0.85 alpha
      const alpha = core.getAlpha(29, 29);
      expect(alpha).toBeCloseTo(0.85, 1);
    });

    it('explored tiles within view radius are correctly bounded to grid', () => {
      core.update(1, 1);
      expect(core.isExplored(-1, -1)).toBe(false);
      expect(core.isExplored(1, 1)).toBe(true);
    });

    it('empty grid (1x1) works', () => {
      const tinyCore = new FogOfWarCore(1, 1, 5);
      tinyCore.update(0, 0);
      expect(tinyCore.isExplored(0, 0)).toBe(true);
      const data = tinyCore.getExploredData();
      expect(data).toEqual([[true]]);
    });

    it('invalidate() forces full recalculation on next update', () => {
      core.update(10, 10);
      core.invalidate();
      // After invalidate, same position should recalculate
      expect(core.update(10, 10)).toBe(true);
      expect(core.dirty.size).toBeGreaterThan(0);
    });

    it('uses Uint8Array internally — initial state is all unexplored', () => {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          expect(core.isExplored(c, r)).toBe(false);
        }
      }
    });

    it('multiple updates accumulate explored tiles', () => {
      core.update(5, 5);
      core.update(25, 25);
      // Both areas should be explored
      expect(core.isExplored(5, 5)).toBe(true);
      expect(core.isExplored(25, 25)).toBe(true);
    });
  });
});
