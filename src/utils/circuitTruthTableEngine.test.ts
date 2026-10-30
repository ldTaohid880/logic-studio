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
