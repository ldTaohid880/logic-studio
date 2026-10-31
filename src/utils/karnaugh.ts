import { Implicant } from './booleanMinimizer';

/**
 * Karnaugh map layout for 2–4 variables. Rows take the first (most significant) variables and columns
 * the rest, both in Gray-code order, so neighbouring cells differ in one variable (also across the edges).
 */
export const KMAP_MIN_VARS = 2;
export const KMAP_MAX_VARS = 4;

const GRAY = [[0], [0, 1], [0, 1, 3, 2]];

export interface KMapLayout {
  rowVars: number;
  colVars: number;
  /** Bits of each row / column, in display order. */
  rowCodes: number[];
  colCodes: number[];
  /** Minterm shown in each cell, [row][col]. */
  cells: number[][];
}

export function kmapLayout(numVars: number): KMapLayout {
  const rowVars = Math.floor(numVars / 2);
  const colVars = numVars - rowVars;
  const rowCodes = GRAY[rowVars];
  const colCodes = GRAY[colVars];
  return {
    rowVars,
    colVars,
    rowCodes,
    colCodes,
    cells: rowCodes.map((r) => colCodes.map((c) => (r << colVars) | c)),
  };
}

/** Rectangle in cell units: first row/column and how many it spans. */
export interface KMapRect {
  row: number;
  col: number;
  rows: number;
  cols: number;
}

// Positions whose code matches the implicant on these variables
function covered(codes: number[], implicant: Implicant, first: number, count: number): number[] {
  return codes
    .map((code, pos) => ({ code, pos }))
    .filter(({ code }) =>
      Array.from({ length: count }, (_, v) => {
        const want = implicant[first + v];
        return want === null || ((code >> (count - 1 - v)) & 1) === want;
      }).every(Boolean)
    )
    .map(({ pos }) => pos);
}

// Consecutive runs of positions, e.g. [0, 3] → [[0], [3]] (a group wrapping the edge is drawn as two pieces)
function runs(positions: number[]): [number, number][] {
  const out: [number, number][] = [];
  positions.forEach((p) => {
    const last = out[out.length - 1];
    if (last && p === last[0] + last[1]) last[1]++;
    else out.push([p, 1]);
  });
  return out;
}

/** The rectangles that outline one implicant's group of cells. */
export function groupRects(implicant: Implicant, layout: KMapLayout): KMapRect[] {
  const rowRuns = runs(covered(layout.rowCodes, implicant, 0, layout.rowVars));
  const colRuns = runs(covered(layout.colCodes, implicant, layout.rowVars, layout.colVars));
  return rowRuns.flatMap(([row, rows]) => colRuns.map(([col, cols]) => ({ row, col, rows, cols })));
}
