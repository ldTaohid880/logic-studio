import { describe, it, expect } from 'vitest';
import { checkCircuit } from './circuitCheck';
import { CellValue } from './circuitTruthTableEngine';

const inputs = [
  { name: 'A', label: 'Input A' },
  { name: 'B', label: 'Input B' },
  { name: 'Cin', label: 'Carry in (Cin)' },
];
const outputs = [
  { name: 'S', label: 'Sum (S)' },
  { name: 'Co', label: 'Carry out (Co)' },
];
// A correct full adder's table
const fullAdder: { index: number; outputs: CellValue[] }[] = Array.from({ length: 8 }, (_, index) => {
  const ones = [4, 2, 1].filter((bit) => index & bit).length;
  return { index, outputs: [ones % 2, ones >= 2 ? 1 : 0] as CellValue[] };
});

describe('checkCircuit', () => {
  it('passes a circuit that matches, by short name or full label', () => {
    const result = checkCircuit('S = A ⊕ B ⊕ Cin\n[Carry out (Co)] = AB + Cin(A ⊕ B)', inputs, outputs, fullAdder);
    expect(result.error).toBeUndefined();
    expect(result).toMatchObject({ checked: [0, 1], mismatches: [], rows: 8 });
  });

  it('lists the rows that differ and what was expected', () => {
    // A wrong "adder" whose carry is A·B only
    const wrong = fullAdder.map((r) => ({ ...r, outputs: [r.outputs[0], ((r.index >> 2) & (r.index >> 1) & 1) as CellValue] }));
    const result = checkCircuit('co = AB + Cin(A ⊕ B)', inputs, outputs, wrong);
    expect(result.mismatches.map((m) => m.index)).toEqual([3, 5]);
    expect(result.mismatches[0].expected).toEqual([{ output: 1, value: 1 }]);
  });

  it('counts an unknown output as wrong', () => {
    const floating = fullAdder.map((r) => (r.index === 0 ? { ...r, outputs: ['?', 0] as CellValue[] } : r));
    expect(checkCircuit('S = A ⊕ B ⊕ Cin', inputs, outputs, floating).mismatches.map((m) => m.index)).toEqual([0]);
  });

  it('explains names the circuit does not have, and typing mistakes', () => {
    expect(checkCircuit('Y = A', inputs, outputs, fullAdder).error).toMatch(/no output called Y\. Outputs: S, Co/);
    expect(checkCircuit('S = A ⊕ D', inputs, outputs, fullAdder).error).toMatch(/no input called D/);
    expect(checkCircuit('S = (A', inputs, outputs, fullAdder).error).toMatch(/Missing \)/);
  });
});
