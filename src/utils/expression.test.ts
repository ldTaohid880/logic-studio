import { describe, it, expect } from 'vitest';
import { parseExpression, parseExpressions, variablesOf, mintermsOf, exprFromSOP, formatExpr } from './expression';
import { minimizeSOP } from './booleanMinimizer';

const table = (text: string, vars?: string[]) => {
  const e = parseExpression(text);
  return mintermsOf(e, vars ?? variablesOf([e]));
};

describe('parseExpression', () => {
  it('reads the usual notations for AND, OR, NOT and XOR', () => {
    const ab = table('A·B');
    ['AB', 'A*B', 'A&B', 'A ∧ B', 'A.B', '(A)(B)'].forEach((t) => expect(table(t)).toEqual(ab));
    const or = table('A + B');
    ['A|B', 'A ∨ B'].forEach((t) => expect(table(t)).toEqual(or));
    const notA = table("A'");
    ['!A', '~A', '¬A', 'A’'].forEach((t) => expect(table(t)).toEqual(notA));
    expect(table('A ⊕ B')).toEqual([1, 2]);
    expect(table('A ^ B')).toEqual([1, 2]);
  });

  it('applies precedence: NOT, then AND, then XOR, then OR', () => {
    // A + B·C' is 1 for A, or for B with C low
    expect(table("A + BC'")).toEqual([2, 4, 5, 6, 7]);
    expect(table("(A + B)C'")).toEqual([2, 4, 6]);
    expect(table("(AB)'")).toEqual([0, 1, 2]);
    expect(table('A + B ⊕ C', ['A', 'B', 'C'])).toEqual([1, 2, 4, 5, 6, 7]);
  });

  it('reads longer names, numbered names and bracketed names', () => {
    expect(variablesOf([parseExpression('Cin·A + X1·X10')])).toEqual(['A', 'Cin', 'X1', 'X10']);
    expect(variablesOf([parseExpression("[SW 1]·[Input B]'")])).toEqual(['Input B', 'SW 1']);
    expect(variablesOf([parseExpression('ab + c')])).toEqual(['a', 'b', 'c']);
  });

  it('explains mistakes', () => {
    expect(() => parseExpression('')).toThrow(/Write an expression/);
    expect(() => parseExpression('A +')).toThrow(/ends too early/);
    expect(() => parseExpression('(A + B')).toThrow(/Missing \)/);
    expect(() => parseExpression('A $ B')).toThrow(/Unexpected "\$" at position 3/);
  });
});

describe('parseExpressions', () => {
  it('reads one named output per line and names unnamed ones', () => {
    const lines = parseExpressions("S = A ⊕ B\n\nC = AB\nA'");
    expect(lines.map((l) => l.output)).toEqual(['S', 'C', 'Y']);
  });

  it('names the line with the mistake', () => {
    expect(() => parseExpressions('Y = A\nZ = (B')).toThrow(/^Line 2: Missing \)/);
    expect(() => parseExpressions('Y = A\nY = B')).toThrow(/defined twice/);
  });
});

describe('formatExpr', () => {
  it('writes text that parses back to the same function', () => {
    ["A + B·C'", "(A + B)'·C", 'A ⊕ (B + C)', "[SW 1]·Cin'", '((A))'].forEach((text) => {
      const e = parseExpression(text);
      const vars = variablesOf([e]);
      expect(mintermsOf(parseExpression(formatExpr(e)), vars)).toEqual(mintermsOf(e, vars));
    });
  });

  it('builds a sum of products from minimised terms', () => {
    const vars = ['A', 'B', 'C'];
    const minterms = [1, 3, 5, 6, 7];
    const e = exprFromSOP(minimizeSOP(minterms, 3), vars);
    expect(mintermsOf(e, vars)).toEqual(minterms);
    expect(exprFromSOP([], vars)).toEqual({ kind: 'const', value: 0 });
  });
});
