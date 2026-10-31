import { describe, it, expect } from 'vitest';
import { kmapLayout, groupRects } from './karnaugh';
import { minimizeSOP } from './booleanMinimizer';

describe('kmapLayout', () => {
  it('puts minterms in Gray-code order', () => {
    expect(kmapLayout(2).cells).toEqual([[0, 1], [2, 3]]);
    expect(kmapLayout(3).cells).toEqual([[0, 1, 3, 2], [4, 5, 7, 6]]);
    expect(kmapLayout(4).cells).toEqual([[0, 1, 3, 2], [4, 5, 7, 6], [12, 13, 15, 14], [8, 9, 11, 10]]);
  });
});

describe('groupRects', () => {
  const layout = kmapLayout(4);
  const cellsOf = (rects: ReturnType<typeof groupRects>) =>
    rects.flatMap((r) =>
      Array.from({ length: r.rows }, (_, i) => Array.from({ length: r.cols }, (_, j) => layout.cells[r.row + i][r.col + j])).flat()
    ).sort((a, b) => a - b);

  it('outlines exactly the minterms each implicant covers', () => {
    // f = Σm(0, 2, 8, 10) is the four corners: one group of 4 wrapping both edges
    const [corners] = minimizeSOP([0, 2, 8, 10], 4);
    const rects = groupRects(corners, layout);
    expect(rects).toHaveLength(4);
    expect(cellsOf(rects)).toEqual([0, 2, 8, 10]);
  });

  it('draws a plain group as one rectangle', () => {
    // A·B = row 11, all columns
    expect(groupRects([1, 1, null, null], layout)).toEqual([{ row: 2, col: 0, rows: 1, cols: 4 }]);
  });

  it('covers the whole map for a constant 1', () => {
    expect(groupRects([null, null, null, null], layout)).toEqual([{ row: 0, col: 0, rows: 4, cols: 4 }]);
  });

  it('every group of a minimised function covers only its minterms', () => {
    const minterms = [1, 3, 5, 7, 8, 9, 12, 13];
    minimizeSOP(minterms, 4).forEach((term) => {
      expect(cellsOf(groupRects(term, layout)).every((m) => minterms.includes(m))).toBe(true);
    });
  });
});
