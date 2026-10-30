import { describe, it, expect } from 'vitest';
import { evaluateGate } from './gateLogic';
import { GateType, SignalValue } from '../types/circuit';

const REFERENCE: Partial<Record<GateType, (i: number[]) => number>> = {
  AND: (i) => (i.every((b) => b === 1) ? 1 : 0),
  OR: (i) => (i.some((b) => b === 1) ? 1 : 0),
  NAND: (i) => (i.every((b) => b === 1) ? 0 : 1),
  NOR: (i) => (i.some((b) => b === 1) ? 0 : 1),
  XOR: (i) => i.reduce((a, b) => a ^ b, 0),
  XNOR: (i) => 1 - i.reduce((a, b) => a ^ b, 0),
};

describe('basic gates', () => {
  for (const [type, reference] of Object.entries(REFERENCE) as [GateType, (i: number[]) => number][]) {
    it(`${type} matches its truth table for 2 to 4 inputs`, () => {
      for (let width = 2; width <= 4; width++) {
        for (let n = 0; n < 1 << width; n++) {
          const inputs = Array.from({ length: width }, (_, b) => (n >> b) & 1);
          expect(evaluateGate(type, inputs as SignalValue[])).toBe(reference(inputs));
        }
      }
    });
  }

  it('NOT and buffer', () => {
    expect([evaluateGate('NOT', [0]), evaluateGate('NOT', [1])]).toEqual([1, 0]);
    expect([evaluateGate('BUFFER', [0]), evaluateGate('BUFFER', [1])]).toEqual([0, 1]);
  });

  it('a floating input only decides the output when the other inputs cannot', () => {
    // A 0 on an AND (or 1 on an OR) settles the output whatever the floating input does
    expect(evaluateGate('AND', [0, -1])).toBe(0);
    expect(evaluateGate('NAND', [0, -1])).toBe(1);
    expect(evaluateGate('OR', [1, -1])).toBe(1);
    expect(evaluateGate('NOR', [1, -1])).toBe(0);
    // Otherwise it is unknown
    expect(evaluateGate('AND', [1, -1])).toBe(-1);
    expect(evaluateGate('OR', [0, -1])).toBe(-1);
    expect(evaluateGate('XOR', [1, -1])).toBe(-1);
    expect(evaluateGate('XNOR', [0, -1])).toBe(-1);
    expect(evaluateGate('NOT', [-1])).toBe(-1);
  });

  it('tri-state buffer passes data when enabled and floats when disabled', () => {
    expect(evaluateGate('TRI_STATE_BUFFER', [1, 1])).toBe(1);
    expect(evaluateGate('TRI_STATE_BUFFER', [0, 1])).toBe(0);
    expect(evaluateGate('TRI_STATE_BUFFER', [1, 0])).toBe(-1);
  });
});
