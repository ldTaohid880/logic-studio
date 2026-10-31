import { describe, it, expect } from 'vitest';
import { Node } from '@xyflow/react';
import { propagateSignals } from '../simulation/engine';
import { NodeData } from '../types/circuit';
import { parseExpressions, mintermsOf } from './expression';
import { buildNetlist, layoutNetlist, netlistStats, GateStyle } from './circuitBuilder';

/** Simulates the generated circuit for every input row and returns each output's minterms. */
function simulate(nodes: Node[], edges: ReturnType<typeof layoutNetlist>['edges'], vars: string[], outputs: string[]) {
  const data = (n: Node) => n.data as unknown as NodeData;
  const result: Record<string, number[]> = Object.fromEntries(outputs.map((o) => [o, []]));
  for (let row = 0; row < 1 << vars.length; row++) {
    const set = nodes.map((n) => {
      const i = vars.indexOf(data(n).label);
      if (data(n).gateType !== 'INPUT' || i < 0) return n;
      const v = (row >> (vars.length - 1 - i)) & 1;
      return { ...n, data: { ...n.data, value: v } };
    });
    const { nodes: settled, unstableNodeIds } = propagateSignals(set, edges);
    expect(unstableNodeIds).toEqual([]);
    settled
      .filter((n) => data(n).gateType === 'OUTPUT')
      .forEach((n) => data(n).inputs[0].value === 1 && result[data(n).label].push(row));
  }
  return result;
}

const STYLES: GateStyle[] = ['basic', 'nand', 'nor'];
const CASES = [
  "Y = AB + A'C",
  'S = A ⊕ B ⊕ C\nCo = AB + C(A ⊕ B)',
  "Y = (A + B + C + D + E)'",
  'Y = ABCDEF',
  "Y = A''",
  'Y = 1\nZ = B',
];

describe('building circuits from expressions', () => {
  for (const text of CASES) {
    for (const style of STYLES) {
      it(`${text.replace('\n', '; ')} in ${style} style matches the expression`, () => {
        const lines = parseExpressions(text);
        const net = buildNetlist(lines, style);
        const { nodes, edges } = layoutNetlist(net);
        const got = simulate(nodes, edges, net.vars, lines.map((l) => l.output));
        lines.forEach((l) => expect(got[l.output]).toEqual(mintermsOf(l.expr, net.vars)));
        if (style !== 'basic') {
          const allowed = style === 'nand' ? ['NAND'] : ['NOR'];
          net.gates.forEach((g) => expect(allowed).toContain(g.type));
        }
        // No gate has more than 4 inputs, and every part sits on the grid
        nodes.forEach((n) => {
          expect((n.data as unknown as NodeData).inputs.length).toBeLessThanOrEqual(4);
          expect(n.position.x % 15).toBe(0);
          expect(n.position.y % 15).toBe(0);
        });
      });
    }
  }

  it('makes the classic two-level NAND circuit from a sum of products', () => {
    const net = buildNetlist(parseExpressions("Y = AB + CD"), 'nand');
    expect(netlistStats(net)).toMatchObject({ gates: 3, levels: 2 });
  });

  it('shares identical sub-expressions and cancels double inversion', () => {
    expect(netlistStats(buildNetlist(parseExpressions("Y = A'B + A'C"), 'basic')).byType.NOT).toBe(1);
    expect(buildNetlist(parseExpressions("Y = A''"), 'basic').gates).toHaveLength(0);
  });
});
