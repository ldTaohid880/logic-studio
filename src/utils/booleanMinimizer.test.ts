import { describe, it, expect } from 'vitest';
import { minimizeSOP, formatSOP, Implicant } from './booleanMinimizer';

const evaluate = (terms: Implicant[], index: number, numVars: number) =>
  terms.some((bits) => bits.every((b, v) => b === null || b === ((index >> (numVars - 1 - v)) & 1)));

// Exhaustively check that the expression matches the function
function expectEquivalent(minterms: number[], numVars: number, dontCares: number[] = []) {
  const terms = minimizeSOP(minterms, numVars, dontCares);
  for (let i = 0; i < 1 << numVars; i++) {
    if (dontCares.includes(i)) continue;
    expect(evaluate(terms, i, numVars)).toBe(minterms.includes(i));
  }
  return terms;
}

describe('minimizeSOP', () => {
  it('handles constants', () => {
    expect(formatSOP(minimizeSOP([], 2), ['A', 'B'])).toBe('0');
    expect(formatSOP(minimizeSOP([0, 1, 2, 3], 2), ['A', 'B'])).toBe('1');
  });

  it('gives the textbook forms of the basic gates', () => {
    expect(formatSOP(minimizeSOP([3], 2), ['A', 'B'])).toBe('AB');
    expect(formatSOP(minimizeSOP([1, 2, 3], 2), ['A', 'B'])).toBe('A + B');
    expect(formatSOP(minimizeSOP([1, 2], 2), ['A', 'B'])).toBe("AB' + A'B");
  });

  it('simplifies the full adder carry to three terms', () => {
    const terms = expectEquivalent([3, 5, 6, 7], 3);
    expect(terms).toHaveLength(3);
    expect(terms.every((t) => t.filter((b) => b !== null).length === 2)).toBe(true);
  });

  it('uses don\'t-cares', () => {
    // BCD segment-style function with 10-15 as don't-cares collapses to one literal
    const terms = expectEquivalent([8, 9], 4, [10, 11, 12, 13, 14, 15]);
    expect(formatSOP(terms, ['A', 'B', 'C', 'D'])).toBe('A');
  });

  it('is correct for every 3-variable function', () => {
    for (let f = 0; f < 256; f++) {
      const minterms = Array.from({ length: 8 }, (_, i) => i).filter((i) => (f >> i) & 1);
      expectEquivalent(minterms, 3);
    }
  });

  it('separates multi-letter names', () => {
    expect(formatSOP(minimizeSOP([3], 2), ['Cin', 'B'])).toBe('Cin·B');
  });
});
