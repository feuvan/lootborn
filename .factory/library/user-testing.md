# User Testing

Testing surface, required tools, resource cost classification per surface.

**What belongs here:** How to validate the game through its user surface, testing tools, resource constraints.

---

## Validation Surface

- **Primary surface**: Browser at http://localhost:5173
- **Tool**: agent-browser (Chrome DevTools MCP)
- **Interaction methods**:
  - Keyboard shortcuts: WASD (movement), 1-6 (skills), TAB (auto-combat), I/K/M/H/C/J/O/P (panels), ESC (menu)
  - Coordinate-based mouse clicks on Phaser canvas (canvas is opaque to a11y tree)
  - `evaluate_script` for querying game state via `window.game` (if exposed)
- **Limitations**:
  - Canvas is opaque — a11y snapshot only shows root element
  - All verification requires screenshot analysis + keyboard-driven interaction
  - Button positions must be estimated from screenshots (fragile on layout changes)

## Validation Concurrency

- **Max concurrent validators**: 2
- **Rationale**: Phaser game loop uses ~105% CPU per instance on 8-core machine. 16GB RAM with ~6GB baseline. Each browser instance ~500MB. 2 instances = ~1GB additional = safe within 70% of 10GB headroom.
- **Dev server**: Single Vite server at port 5173, shared across validator instances

## Testing Infrastructure

- **Unit tests**: Vitest for pure logic modules (CombatSystem, PathfindingSystem, LootSystem, etc.)
- **Build verification**: `npm run build` (tsc + vite build) as quality gate
- **No e2e framework**: Visual validation via agent-browser screenshots only
- **Phaser mocking**: Tests must mock Phaser dependencies to run in Node environment

## Dev Server Management

- Start: `npx vite --port 5173`
- Healthcheck: `curl -sf http://localhost:5173`
- The dev server may already be running from user's terminal

## Flow Validator Guidance: Browser

**Surface**: Browser at http://localhost:5173

**Testing tool**: agent-browser skill (Chrome DevTools MCP)

**Isolation rules**:
- Each validator gets its own browser session via `--session` flag
- Session naming: `<workerSessionPrefix>__<group>` (e.g., `86077514a2eb__visual`)
- All validators share the single Vite dev server on port 5173
- Game state is per-browser-tab (IndexedDB is per-origin, so validators using same origin share storage)
- To avoid storage conflicts: each validator should start a new game rather than relying on saves
- Close browser sessions after testing

**Interaction approach**:
1. Navigate to http://localhost:5173
2. Wait for game load (look for menu/title screen)
3. Start new game by clicking appropriate menu buttons (coordinate-based clicks on canvas)
4. Use keyboard shortcuts for interaction: WASD (move), 1-6 (skills), I/K/M/H/C/J/O (panels), TAB (auto-combat)
5. Take screenshots for visual evidence
6. Use `evaluate_script` to query internal game state when possible

**Key constraints**:
- Canvas is opaque to accessibility tree — you must use screenshots + coordinate clicks
- Phaser game runs at 1280×720 resolution
- Class selection is on the menu screen before gameplay starts
- Game auto-generates procedural sprites so all visuals will be present without external assets

**Common patterns**:
- To verify map rendering: start a game, move around with WASD, take screenshots at different positions
- To verify combat: engage monsters (walk near them), observe auto-combat or use skill keys
- To verify UI panels: press keyboard shortcut (I, K, M, etc.), screenshot the panel
- To check positions/coordinates: use evaluate_script to read player position from game state
