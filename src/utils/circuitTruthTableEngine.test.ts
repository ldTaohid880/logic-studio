import { describe, it, expect } from 'vitest';
import { CIRCUIT_PRESETS } from './presets';
import {
  describeCircuitForTable,
  evaluateTableRow,
  generateCircuitTruthTable,
  currentRowIndex,
  rowInputLevels,
  shortSignalNames,
} from './circuitTruthTableEngine';

const preset = (name: string) => {
  const p = CIRCUIT_PRESETS.find((c) => c.name === name);
  if (!p) throw new Error(`No example called ${name}`);
  return p;
};

describe('circuit truth table', () => {
  it('builds the half adder table from its switches and LEDs', async () => {
    const { nodes, edges } = preset('Half Adder');
    const model = describeCircuitForTable(nodes, edges);
    expect(model.inputs).toHaveLength(2);
    expect(model.outputs).toHaveLength(2);
    expect(model.isSequential).toBe(false);

    const rows = (await generateCircuitTruthTable(nodes, edges, model))!;
    expect(rows).toHaveLength(4);
    // Each output is either the sum (XOR) or the carry (AND) of the two inputs
    const columns = model.outputs.map((_, oi) => rows.map((r) => r.outputs[oi]).join(''));
    expect(columns.sort()).toEqual(['0001', '0110']);
    expect(rows.every((r) => !r.unstable)).toBe(true);
  });

  it('marks latches as sequential and reports the hold row as unknown after a reset', () => {
    const { nodes, edges } = preset('SR Latch');
    const model = describeCircuitForTable(nodes, edges);
    expect(model.isSequential).toBe(true);
    // Row 0 is S = R = 0: hold, so the stored value is unknown when every row starts from reset
    const hold = evaluateTableRow(nodes, edges, model, 0, { memoryStart: 'reset' });
    expect(hold.outputs.some((v) => v === -1)).toBe(true);
  });

  it('every example settles for every row it can build', async () => {
    for (const p of CIRCUIT_PRESETS) {
      const model = describeCircuitForTable(p.nodes, p.edges);
      if (model.inputs.length === 0 || model.outputs.length === 0 || model.inputs.length > 8) continue;
      const rows = (await generateCircuitTruthTable(p.nodes, p.edges, model, { memoryStart: 'canvas' }))!;
      expect(rows.filter((r) => r.unstable).map((r) => `${p.name} m${r.index}`)).toEqual([]);
    }
  });

  it('round-trips a row through the canvas input levels', () => {
    const { nodes, edges } = preset('Full Adder');
    const model = describeCircuitForTable(nodes, edges);
    const levels = rowInputLevels(model, 5);
    const applied = nodes.map((n) => {
      const level = levels.find((l) => l.nodeId === n.id);
      return level ? { ...n, data: { ...n.data, value: level.value } } : n;
    });
    expect(currentRowIndex(applied, model)).toBe(5);
  });
});

describe('shortSignalNames', () => {
  it('prefers bracketed names, then short labels, then the last word', () => {
    expect(shortSignalNames(['Input A', 'Input B', 'Carry In (Cin)'])).toEqual(['A', 'B', 'Cin']);
    expect(shortSignalNames(['S', 'R'])).toEqual(['S', 'R']);
  });

  it('falls back to letters when names clash or are long', () => {
    expect(shortSignalNames(['Switch one', 'Switch two'])).toEqual(['A', 'B']);
    expect(shortSignalNames(['In A', 'Other A'])).toEqual(['A', 'B']);
  });
});

describe('truth table with custom components', () => {
  it('evaluates through a custom component instance', async () => {
    const { BUILTIN_FULL_ADDER } = await import('./builtinAdders');
    const { BUILTIN_HALF_ADDER } = await import('./builtinAdders');
    const components = { [BUILTIN_HALF_ADDER.id]: BUILTIN_HALF_ADDER, [BUILTIN_FULL_ADDER.id]: BUILTIN_FULL_ADDER };
    const sw = (id: string, y: number) => ({
      id,
      position: { x: 0, y },
      data: { label: id, gateType: 'INPUT', value: 0, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 0 }] },
    });
    const led = (id: string, y: number) => ({
      id,
      position: { x: 400, y },
      data: { label: id, gateType: 'OUTPUT', value: -1, inputs: [{ id: 'in-0', name: 'In', value: -1 }], outputs: [] },
    });
    const nodes = [
      sw('A', 0),
      sw('B', 30),
      sw('C', 60),
      {
        id: 'fa',
        position: { x: 200, y: 0 },
        data: {
          label: 'FA',
          gateType: 'CUSTOM',
          customComponentId: BUILTIN_FULL_ADDER.id,
          inputs: BUILTIN_FULL_ADDER.inputs.map((p) => ({ id: p.id, name: p.name, value: -1 })),
          outputs: BUILTIN_FULL_ADDER.outputs.map((p) => ({ id: p.id, name: p.name, value: -1 })),
        },
      },
      led('S', 0),
      led('Co', 30),
    ];
    const [inA, inB, inC] = BUILTIN_FULL_ADDER.inputs.map((p) => p.id);
    const [sum, carry] = BUILTIN_FULL_ADDER.outputs.map((p) => p.id);
    const edges = [
      { id: 'e1', source: 'A', sourceHandle: 'out-0', target: 'fa', targetHandle: inA },
      { id: 'e2', source: 'B', sourceHandle: 'out-0', target: 'fa', targetHandle: inB },
      { id: 'e3', source: 'C', sourceHandle: 'out-0', target: 'fa', targetHandle: inC },
      { id: 'e4', source: 'fa', sourceHandle: sum, target: 'S', targetHandle: 'in-0' },
      { id: 'e5', source: 'fa', sourceHandle: carry, target: 'Co', targetHandle: 'in-0' },
    ];

    const model = describeCircuitForTable(nodes, edges);
    expect(model.outputs.map((c) => c.label)).toEqual(['S', 'Co']);
    const rows = (await generateCircuitTruthTable(nodes, edges, model, { customComponents: components }))!;
    rows.forEach((r) => {
      const total = r.inputs.reduce<number>((a, b) => a + b, 0);
      expect(r.outputs).toEqual([total & 1, total >> 1]);
    });
  });
});
