import { describe, it, expect } from 'vitest';
import { Node, Edge } from '@xyflow/react';
import { createPart } from '../store/partFactory';
import { GateType } from '../types/circuit';
import { CustomComponentDefinition } from '../types/customComponent';
import { parseExpressions } from './expression';
import { buildNetlist, layoutNetlist } from './circuitBuilder';
import { circuitToVerilog, verilogName } from './verilog';

const part = (t: GateType, label?: string) => {
  const n = createPart(t, { x: 0, y: 0 }, []);
  return label ? { ...n, data: { ...n.data, label } } : n;
};
const wire = (a: Node, b: Node, sh = 'out-0', th = 'in-0'): Edge => ({ id: `${a.id}-${sh}-${b.id}-${th}`, source: a.id, target: b.id, sourceHandle: sh, targetHandle: th });

/** Light checks that the text is well formed: balanced modules and no leaked JavaScript values. */
function wellFormed(v: string) {
  expect(v.match(/^module /gm)?.length).toBe(v.match(/^endmodule/gm)?.length);
  expect(v).not.toMatch(/undefined|NaN|\[object/);
}

describe('verilogName', () => {
  it('makes legal identifiers from labels', () => {
    expect(verilogName('Carry in (Cin)')).toBe('Carry_in_Cin');
    expect(verilogName('Q̄')).toBe('Qn');
    expect(verilogName('1st')).toBe('n1st');
    expect(verilogName('input')).toBe('input_');
  });
});

describe('circuitToVerilog', () => {
  it('writes gates as primitives between named ports', () => {
    const { nodes, edges } = layoutNetlist(buildNetlist(parseExpressions('S = A ⊕ B\nC = AB'), 'basic'));
    const v = circuitToVerilog(nodes, edges, {}, 'half adder');
    wellFormed(v);
    expect(v).toContain('module half_adder (');
    expect(v).toMatch(/input A,\n  input B,\n  output S,\n  output C/);
    expect(v).toMatch(/xor g\d+ \(XOR, A, B\);/);
    expect(v).toMatch(/and g\d+ \(AND, A, B\);/);
    expect(v).toContain('assign S = XOR;');
  });

  it('shares one net between tri-state drivers and a pull-up', () => {
    const [d1, e1, d2, e2] = ['D1', 'E1', 'D2', 'E2'].map((l) => part('INPUT', l));
    const [t1, t2] = [part('TRI_STATE_BUFFER'), part('TRI_STATE_BUFFER')];
    const r = part('PULL_UP');
    const y = part('OUTPUT', 'Y');
    const edges = [wire(d1, t1), wire(e1, t1, 'out-0', 'in-1'), wire(d2, t2), wire(e2, t2, 'out-0', 'in-1'), wire(t1, y), wire(t2, y), wire(r, y)];
    const v = circuitToVerilog([d1, e1, d2, e2, t1, t2, r, y], edges);
    wellFormed(v);
    const bus = v.match(/bufif1 g\d+ \((\w+), D1, E1\);/)![1];
    expect(v).toMatch(new RegExp(`bufif1 g\\d+ \\(${bus}, D2, E2\\);`));
    expect(v).toContain(`pullup (${bus});`);
    expect(v).toContain(`assign Y = ${bus};`);
  });

  it('gives common chips their behaviour and others a black box with the right ports', () => {
    const [d, clk] = [part('INPUT', 'D'), part('CLOCK', 'CLK')];
    const ff = part('D_FLIPFLOP');
    const alu = part('ALU_4BIT_8FN');
    const q = part('OUTPUT', 'Q');
    const v = circuitToVerilog([d, clk, ff, alu, q], [wire(d, ff), wire(clk, ff, 'out-0', 'in-1'), wire(ff, q)]);
    wellFormed(v);
    expect(v).toMatch(/ls_d_flipflop g\d+ \(D, CLK, 1'bz, 1'bz, \w+, \w+\);/);
    expect(v).toContain('always @(posedge CLK or posedge PRE or posedge CLR)');
    expect(v).toContain('module ls_alu_4bit_8fn (');
    expect(v).toContain("isn't exported: describe it here");
  });

  it('exports a custom component as its own module', () => {
    const [a, b, g, y] = [part('INPUT', 'A'), part('INPUT', 'B'), part('AND'), part('OUTPUT', 'Y')];
    const def = {
      id: 'cc1', name: 'My and', category: 'Custom', createdAt: 0, updatedAt: 0,
      nodes: [a, b, g, y], edges: [wire(a, g), wire(b, g, 'out-0', 'in-1'), wire(g, y)],
      inputs: [{ id: 'in-0', name: 'A', direction: 'input', internalNodeId: a.id }, { id: 'in-1', name: 'B', direction: 'input', internalNodeId: b.id }],
      outputs: [{ id: 'out-0', name: 'Y', direction: 'output', internalNodeId: y.id }],
    } as CustomComponentDefinition;
    const inst = { ...part('INPUT'), type: 'customNode', data: { label: 'U1', gateType: 'CUSTOM', customComponentId: 'cc1', inputs: [{ id: 'in-0', name: 'A', value: 0 }, { id: 'in-1', name: 'B', value: 0 }], outputs: [{ id: 'out-0', name: 'Y', value: 0 }] } } as Node;
    const [x1, x2, led] = [part('INPUT', 'X1'), part('INPUT', 'X2'), part('OUTPUT', 'Z')];
    const v = circuitToVerilog([x1, x2, inst, led], [wire(x1, inst), wire(x2, inst, 'out-0', 'in-1'), wire(inst, led)], { cc1: def });
    wellFormed(v);
    expect(v).toMatch(/module cc_My_and \(\n  input A,\n  input B,\n  output Y\n\);/);
    expect(v).toMatch(/cc_My_and g\d+ \(X1, X2, U1\);/);
    expect(v).toContain('assign Z = U1;');
  });
});
