interface Node {
  col: number;
  row: number;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
  /** Index in the heap — maintained by MinHeap for O(log n) decrease-key */
  heapIndex: number;
}

/**
 * Binary min-heap keyed on `f` value.
 * Supports O(log n) insert, extractMin, and decreaseKey.
 */
class MinHeap {
  private data: Node[] = [];

  get size(): number {
    return this.data.length;
  }

  push(node: Node): void {
    node.heapIndex = this.data.length;
    this.data.push(node);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): Node | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      last.heapIndex = 0;
      this.data[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  /** Re-heap after a node's f value decreased */
  decreaseKey(node: Node): void {
    this.bubbleUp(node.heapIndex);
  }

  private bubbleUp(idx: number): void {
    const node = this.data[idx];
    while (idx > 0) {
      const parentIdx = (idx - 1) >> 1;
      const parent = this.data[parentIdx];
      if (node.f >= parent.f) break;
      // Swap
      this.data[idx] = parent;
      parent.heapIndex = idx;
      idx = parentIdx;
    }
    this.data[idx] = node;
    node.heapIndex = idx;
  }

  private sinkDown(idx: number): void {
    const length = this.data.length;
    const node = this.data[idx];

    while (true) {
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      let smallest = idx;

      if (left < length && this.data[left].f < this.data[smallest].f) {
        smallest = left;
      }
      if (right < length && this.data[right].f < this.data[smallest].f) {
        smallest = right;
      }
      if (smallest === idx) break;

      // Swap
      const swap = this.data[smallest];
      this.data[smallest] = node;
      node.heapIndex = smallest;
      this.data[idx] = swap;
      swap.heapIndex = idx;
      idx = smallest;
    }
  }
}

export class PathfindingSystem {
  private collisions: boolean[][];
  private cols: number;
  private rows: number;

  constructor(collisions: boolean[][], cols: number, rows: number) {
    this.collisions = collisions;
    this.cols = cols;
    this.rows = rows;
  }

  findPath(
    startCol: number,
    startRow: number,
    endCol: number,
    endRow: number,
  ): { col: number; row: number }[] {
    const sc = Math.round(startCol);
    const sr = Math.round(startRow);
    const ec = Math.round(endCol);
    const er = Math.round(endRow);

    if (!this.isWalkable(ec, er)) return [];
    if (!this.isWalkable(sc, sr)) return [];
    if (sc === ec && sr === er) return [];

    const open = new MinHeap();
    // Use a flat array indexed by (row * cols + col) for O(1) lookup
    const gCost = new Float64Array(this.cols * this.rows);
    gCost.fill(Infinity);
    const closedBits = new Uint8Array(this.cols * this.rows);
    // Map from flat index to the node in the open list (for decrease-key)
    const nodeMap = new Array<Node | null>(this.cols * this.rows).fill(null);

    const flatIdx = (c: number, r: number) => r * this.cols + c;

    const startNode: Node = {
      col: sc, row: sr,
      g: 0,
      h: this.heuristic(sc, sr, ec, er),
      f: 0,
      parent: null,
      heapIndex: 0,
    };
    startNode.f = startNode.g + startNode.h;
    gCost[flatIdx(sc, sr)] = 0;
    nodeMap[flatIdx(sc, sr)] = startNode;
    open.push(startNode);

    const dirs = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1],
    ];

    while (open.size > 0) {
      const current = open.pop()!;
      const curIdx = flatIdx(current.col, current.row);

      if (current.col === ec && current.row === er) {
        return this.buildPath(current);
      }

      closedBits[curIdx] = 1;

      for (const [dc, dr] of dirs) {
        const nc = current.col + dc;
        const nr = current.row + dr;

        if (!this.isWalkable(nc, nr)) continue;

        const nIdx = flatIdx(nc, nr);
        if (closedBits[nIdx]) continue;

        // Prevent diagonal movement through walls (wall-clipping)
        if (dc !== 0 && dr !== 0) {
          if (!this.isWalkable(current.col + dc, current.row) ||
              !this.isWalkable(current.col, current.row + dr)) {
            continue;
          }
        }

        const moveCost = dc !== 0 && dr !== 0 ? 1.414 : 1;
        const g = current.g + moveCost;

        if (g < gCost[nIdx]) {
          gCost[nIdx] = g;
          const existing = nodeMap[nIdx];
          if (existing && closedBits[nIdx] === 0) {
            // Update existing open node
            existing.g = g;
            existing.f = g + existing.h;
            existing.parent = current;
            open.decreaseKey(existing);
          } else {
            // Create new node
            const h = this.heuristic(nc, nr, ec, er);
            const newNode: Node = {
              col: nc, row: nr,
              g, h, f: g + h,
              parent: current,
              heapIndex: 0,
            };
            nodeMap[nIdx] = newNode;
            open.push(newNode);
          }
        }
      }
    }

    return [];
  }

  private isWalkable(col: number, row: number): boolean {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
    return this.collisions[row][col];
  }

  private heuristic(c1: number, r1: number, c2: number, r2: number): number {
    // Octile distance for consistency with diagonal moves
    const dx = Math.abs(c1 - c2);
    const dy = Math.abs(r1 - r2);
    return Math.max(dx, dy) + 0.414 * Math.min(dx, dy);
  }

  private buildPath(node: Node): { col: number; row: number }[] {
    const path: { col: number; row: number }[] = [];
    let current: Node | null = node;
    while (current) {
      path.unshift({ col: current.col, row: current.row });
      current = current.parent;
    }
    path.shift(); // Remove start position
    return path;
  }
}
