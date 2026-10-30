/**
 * Lets components outside the React Flow provider (toolbox, menus) ask the canvas
 * where the visible center is, in flow coordinates.
 */
type CenterGetter = () => { x: number; y: number };

let getCenter: CenterGetter | null = null;
let placementCount = 0;

export function registerCanvasCenter(fn: CenterGetter | null) {
  getCenter = fn;
}

const COLS = 3;
const ROWS = 3;
const COL_GAP = 165;
const ROW_GAP = 120;

/**
 * Visible canvas center; consecutive adds fill a 3×3 grid of slots around it
 * so parts don't land on top of each other. Snapped to the 15px canvas grid.
 */
export function nextPlacementPosition(): { x: number; y: number } {
  const base = getCenter?.() ?? { x: 320, y: 180 };
  const slot = placementCount++ % (COLS * ROWS);
  const col = (slot % COLS) - 1;
  const row = Math.floor(slot / COLS) - 1;
  const snap = (v: number) => Math.round(v / 15) * 15;
  return { x: snap(base.x - 50 + col * COL_GAP), y: snap(base.y - 30 + row * ROW_GAP) };
}
