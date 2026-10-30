import { describe, it, expect } from 'vitest';
import { evaluateIC, getDefaultICPins } from './icLogic';
import { IC_GATE_TYPES } from './engine';
import { GateType, SignalValue } from '../types/circuit';

// Each combinational IC is checked against an independent reference model for every input combination.
// Inputs are given in pin order (in-0, in-1, ...); reference models return output values in pin order.

type Bits = number[];

/** Number from bits, least significant first. */
const num = (bits: Bits) => bits.reduce((acc, b, i) => acc | (b << i), 0);
/** `width` bits of n, least significant first. */
const bitsOf = (n: number, width: number): Bits => Array.from({ length: width }, (_, i) => (n >> i) & 1);

// Segments a–g for 0–F on a common-cathode display
const SEGMENTS = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg', 'abcefg', 'cdefg', 'adef', 'bcdeg', 'adefg', 'aefg'];

const COMBINATIONAL: Partial<Record<GateType, (i: Bits) => Bits>> = {
  HALF_ADDER: ([a, b]) => [a ^ b, a & b],
  FULL_ADDER: ([a, b, c]) => bitsOf(a + b + c, 2),
  ADDER_4BIT: (i) => bitsOf(num(i.slice(0, 4)) + num(i.slice(4, 8)) + i[8], 5),
  HALF_SUBTRACTOR: ([a, b]) => [a ^ b, a < b ? 1 : 0],
  FULL_SUBTRACTOR: ([a, b, bin]) => [(a - b - bin) & 1, a - b - bin < 0 ? 1 : 0],
  MUX_4TO1: ([i0, i1, i2, i3, s1, s0, en]) => [en ? [i0, i1, i2, i3][s1 * 2 + s0] : 0],
  DEMUX_1TO4: ([x, s1, s0, en]) => bitsOf(en && x ? 1 << (s1 * 2 + s0) : 0, 4),
  PRIORITY_ENCODER: (i) => {
    const top = i.lastIndexOf(1);
    return top < 0 ? [0, 0, 0] : [(top >> 1) & 1, top & 1, 1];
  },
  COMPARATOR_4BIT: (i) => {
    const a = num(i.slice(0, 4));
    const b = num(i.slice(4, 8));
    return [a > b ? 1 : 0, a === b ? 1 : 0, a < b ? 1 : 0];
  },
  DECODER_BCD_TO_7SEG: (i) => 'abcdefg'.split('').map((s) => (SEGMENTS[num(i)].includes(s) ? 1 : 0)),
  MUX_8TO1: (i) => [i[11] ? i[i[8] * 4 + i[9] * 2 + i[10]] : 0],
  DEMUX_1TO8: ([x, s2, s1, s0, en]) => bitsOf(en && x ? 1 << (s2 * 4 + s1 * 2 + s0) : 0, 8),
  DECODER_3TO8: ([a0, a1, a2, en]) => bitsOf(en ? 1 << (a2 * 4 + a1 * 2 + a0) : 0, 8),
  ENCODER_8TO3: (i) => {
    const top = i.lastIndexOf(1);
    return top < 0 ? [0, 0, 0, 0] : [(top >> 2) & 1, (top >> 1) & 1, top & 1, 1];
  },
  PARITY_GENERATOR: (i) => {
    const odd = i.reduce((a, b) => a ^ b, 0);
    return [odd ? 0 : 1, odd];
  },
  PARITY_CHECKER: (i) => [i.reduce((a, b) => a ^ b, 0)],
  INCREMENTER_4BIT: (i) => bitsOf(num(i) + 1, 5),
  DECREMENTER_4BIT: (i) => [...bitsOf((num(i) + 15) % 16, 4), num(i) === 0 ? 1 : 0],
  // Subtract mode reports a borrow on the Cout pin (1 when A < B)
  ADDER_SUBTRACTOR_4BIT: (i) => {
    const a = num(i.slice(0, 4));
    const b = num(i.slice(4, 8));
    return i[8]
      ? [...bitsOf((a - b + 16) % 16, 4), a < b ? 1 : 0]
      : bitsOf(a + b, 5);
  },
  DELAY_ELEMENT: ([x]) => [x],
};

const SEQUENTIAL: GateType[] = ['D_LATCH', 'JK_FLIPFLOP', 'T_FLIPFLOP', 'REGISTER_4BIT'];

const outputsInPinOrder = (gateType: GateType, outputs: Record<string, SignalValue>) =>
  getDefaultICPins(gateType).outputs.map((p) => outputs[p.id]);

describe('fixed ICs', () => {
  it('has a test for every IC the engine evaluates', () => {
    const covered = new Set<string>([...Object.keys(COMBINATIONAL), ...SEQUENTIAL]);
    expect([...IC_GATE_TYPES].filter((t) => !covered.has(t))).toEqual([]);
  });

  for (const [type, reference] of Object.entries(COMBINATIONAL) as [GateType, (i: Bits) => Bits][]) {
    it(`${type} matches its reference for every input combination`, () => {
      const width = getDefaultICPins(type).inputs.length;
      const mismatches: string[] = [];
      for (let n = 0; n < 1 << width; n++) {
        const inputs = bitsOf(n, width);
        const actual = outputsInPinOrder(type, evaluateIC(type, inputs as SignalValue[]).outputs);
        const expected = reference(inputs);
        if (actual.join('') !== expected.join('')) mismatches.push(`in ${inputs.join('')}: got ${actual.join('')}, expected ${expected.join('')}`);
      }
      expect(mismatches.slice(0, 5)).toEqual([]);
    });
  }

  it('treats a floating enable as enabled', () => {
    expect(evaluateIC('MUX_4TO1', [0, 1, 0, 0, 0, 1, -1]).outputs['out-0']).toBe(1);
    expect(evaluateIC('DECODER_3TO8', [1, 0, 0, -1]).outputs['out-1']).toBe(1);
    expect(evaluateIC('DEMUX_1TO8', [1, 0, 0, 0, -1]).outputs['out-0']).toBe(1);
  });

  it('blanks the 7-segment decoder while any input floats', () => {
    const { outputs } = evaluateIC('DECODER_BCD_TO_7SEG', [1, 0, -1, 0]);
    expect(Object.values(outputs).every((v) => v === 0)).toBe(true);
  });
});

/** Runs input steps through a memory IC, carrying its state, and returns Q (out-0) after each step. */
function run(type: GateType, steps: SignalValue[][]): SignalValue[] {
  let state: Record<string, unknown> = {};
  return steps.map((inputs) => {
    const res = evaluateIC(type, inputs, state);
    state = res.newState;
    return res.outputs['out-0'];
  });
}

describe('memory ICs', () => {
  it('D latch follows D while enabled and holds otherwise', () => {
    // [D, EN, CLR]
    expect(run('D_LATCH', [[1, 1, 0], [0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 0], [1, 1, 1]])).toEqual([1, 1, 0, 0, 1, 0]);
  });

  it('D latch always gives complementary outputs', () => {
    const { outputs } = evaluateIC('D_LATCH', [1, 1, 0]);
    expect([outputs['out-0'], outputs['out-1']]).toEqual([1, 0]);
  });

  it('JK flip-flop holds, sets, resets and toggles on rising edges only', () => {
    // [J, CLK, K, CLR]
    const q = run('JK_FLIPFLOP', [
      [1, 0, 0, 0], [1, 1, 0, 0], // set on the rising edge
      [0, 0, 0, 0], [0, 1, 0, 0], // hold
      [1, 0, 1, 0], [1, 1, 1, 0], // toggle → 0
      [1, 0, 1, 0], [1, 1, 1, 0], // toggle → 1
      [0, 1, 1, 0],               // CLK stays high: no edge, no change
      [0, 0, 1, 0], [0, 1, 1, 0], // reset
      [1, 0, 0, 0], [1, 1, 0, 1], // CLR wins over a set
    ]);
    expect(q).toEqual([0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0]);
  });

  it('T flip-flop toggles on a rising edge only when T is 1', () => {
    // [T, CLK, CLR]
    const q = run('T_FLIPFLOP', [[1, 0, 0], [1, 1, 0], [1, 0, 0], [1, 1, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 1]]);
    expect(q).toEqual([0, 1, 1, 0, 0, 0, 0, 0]);
  });

  it('4-bit register loads on a rising edge when enabled', () => {
    // [D0..D3, CLK, EN, CLR]; read the stored value from all four outputs
    let state: Record<string, unknown> = {};
    const step = (inputs: SignalValue[]) => {
      const res = evaluateIC('REGISTER_4BIT', inputs, state);
      state = res.newState;
      return num(getDefaultICPins('REGISTER_4BIT').outputs.map((p) => res.outputs[p.id] as number));
    };
    expect(step([1, 0, 1, 0, 0, 1, 0])).toBe(0); // no edge yet
    expect(step([1, 0, 1, 0, 1, 1, 0])).toBe(5); // rising edge loads 0101
    expect(step([1, 1, 1, 1, 1, 1, 0])).toBe(5); // CLK held high: keeps 5
    expect(step([1, 1, 1, 1, 0, 0, 0])).toBe(5);
    expect(step([1, 1, 1, 1, 1, 0, 0])).toBe(5); // disabled: ignores the edge
    expect(step([0, 1, 0, 0, 0, -1, 0])).toBe(5);
    expect(step([0, 1, 0, 0, 1, -1, 0])).toBe(2); // floating EN counts as enabled
    expect(step([0, 1, 0, 0, 1, 1, 1])).toBe(0); // CLR
  });
});
