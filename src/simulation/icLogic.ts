import { GateType, SignalValue, PinData } from '../types/circuit';
import { decodeSevenSegment } from '../utils/gateLogic';
import { initialLcd, lcdNibble, LcdState } from './hd44780';

export interface ICPins {
  inputs: PinData[];
  outputs: PinData[];
}

/** Pins `${name}0`..`${name}${count - 1}` with ids starting at `${prefix}-${first}`. */
const bitPins = (prefix: 'in' | 'out', first: number, name: string, count: number): PinData[] =>
  Array.from({ length: count }, (_, i) => ({ id: `${prefix}-${first + i}`, name: `${name}${i}`, value: 0 as SignalValue }));

/** Parts whose outputs depend on what happened before (state in data.icState), not just on their inputs now. */
export const MEMORY_GATE_TYPES = new Set<string>([
  'D_LATCH', 'SR_LATCH', 'D_FLIPFLOP', 'JK_FLIPFLOP', 'T_FLIPFLOP', 'REGISTER_4BIT', 'REGISTER_8BIT', 'LATCH_8BIT',
  'COUNTER_4BIT', 'COUNTER_LOAD_4BIT', 'DECADE_COUNTER', 'SHIFT_REG_4BIT', 'SHIFT_REG_UNIVERSAL', 'RAM_16X4', 'LCD_16X2', 'DELAY_ELEMENT',
]);

/** ALU operations, indexed by S2 S1 S0. */
export const ALU_OPERATIONS = ['A + B', 'A − B', 'A AND B', 'A OR B', 'A XOR B', 'NOT A', 'A + 1', 'A − 1'] as const;

/** ROM contents for a new ROM: each address holds its own number. */
export const DEFAULT_ROM_CONTENTS = Array.from({ length: 16 }, (_, i) => i);

export function getDefaultICPins(gateType: GateType): ICPins {
  switch (gateType) {
    case 'HALF_ADDER':
      return {
        inputs: [
          { id: 'in-0', name: 'A', value: 0 },
          { id: 'in-1', name: 'B', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: 'Sum', value: 0 },
          { id: 'out-1', name: 'Cout', value: 0 },
        ],
      };

    case 'FULL_ADDER':
      return {
        inputs: [
          { id: 'in-0', name: 'A', value: 0 },
          { id: 'in-1', name: 'B', value: 0 },
          { id: 'in-2', name: 'Cin', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: 'Sum', value: 0 },
          { id: 'out-1', name: 'Cout', value: 0 },
        ],
      };

    case 'ADDER_4BIT':
      return {
        inputs: [
          { id: 'in-0', name: 'A0 (LSB)', value: 0 },
          { id: 'in-1', name: 'A1', value: 0 },
          { id: 'in-2', name: 'A2', value: 0 },
          { id: 'in-3', name: 'A3 (MSB)', value: 0 },
          { id: 'in-4', name: 'B0 (LSB)', value: 0 },
          { id: 'in-5', name: 'B1', value: 0 },
          { id: 'in-6', name: 'B2', value: 0 },
          { id: 'in-7', name: 'B3 (MSB)', value: 0 },
          { id: 'in-8', name: 'Cin', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: 'S0 (LSB)', value: 0 },
          { id: 'out-1', name: 'S1', value: 0 },
          { id: 'out-2', name: 'S2', value: 0 },
          { id: 'out-3', name: 'S3 (MSB)', value: 0 },
          { id: 'out-4', name: 'Cout', value: 0 },
        ],
      };

    case 'HALF_SUBTRACTOR':
      return {
        inputs: [
          { id: 'in-0', name: 'A', value: 0 },
          { id: 'in-1', name: 'B', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: 'Diff (D)', value: 0 },
          { id: 'out-1', name: 'Borrow (B)', value: 0 },
        ],
      };

    case 'FULL_SUBTRACTOR':
      return {
        inputs: [
          { id: 'in-0', name: 'A', value: 0 },
          { id: 'in-1', name: 'B', value: 0 },
          { id: 'in-2', name: 'Bin', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: 'Diff (D)', value: 0 },
          { id: 'out-1', name: 'Bout', value: 0 },
        ],
      };

    case 'MUX_4TO1':
      return {
        inputs: [
          { id: 'in-0', name: 'I0', value: 0 },
          { id: 'in-1', name: 'I1', value: 0 },
          { id: 'in-2', name: 'I2', value: 0 },
          { id: 'in-3', name: 'I3', value: 0 },
          { id: 'in-4', name: 'S1', value: 0 },
          { id: 'in-5', name: 'S0', value: 0 },
          { id: 'in-6', name: 'EN', value: 1 },
        ],
        outputs: [
          { id: 'out-0', name: 'Y', value: 0 },
        ],
      };

    case 'DEMUX_1TO4':
      return {
        inputs: [
          { id: 'in-0', name: 'IN', value: 0 },
          { id: 'in-1', name: 'S1', value: 0 },
          { id: 'in-2', name: 'S0', value: 0 },
          { id: 'in-3', name: 'EN', value: 1 },
        ],
        outputs: [
          { id: 'out-0', name: 'Y0', value: 0 },
          { id: 'out-1', name: 'Y1', value: 0 },
          { id: 'out-2', name: 'Y2', value: 0 },
          { id: 'out-3', name: 'Y3', value: 0 },
        ],
      };

    case 'PRIORITY_ENCODER':
      return {
        inputs: [
          { id: 'in-0', name: 'I0', value: 0 },
          { id: 'in-1', name: 'I1', value: 0 },
          { id: 'in-2', name: 'I2', value: 0 },
          { id: 'in-3', name: 'I3', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: 'Y1', value: 0 },
          { id: 'out-1', name: 'Y0', value: 0 },
          { id: 'out-2', name: 'V', value: 0 },
        ],
      };

    case 'COMPARATOR_4BIT':
      return {
        inputs: [
          { id: 'in-0', name: 'A0', value: 0 },
          { id: 'in-1', name: 'A1', value: 0 },
          { id: 'in-2', name: 'A2', value: 0 },
          { id: 'in-3', name: 'A3', value: 0 },
          { id: 'in-4', name: 'B0', value: 0 },
          { id: 'in-5', name: 'B1', value: 0 },
          { id: 'in-6', name: 'B2', value: 0 },
          { id: 'in-7', name: 'B3', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: 'A > B', value: 0 },
          { id: 'out-1', name: 'A = B', value: 1 },
          { id: 'out-2', name: 'A < B', value: 0 },
        ],
      };

    case 'DECODER_BCD_TO_7SEG':
      return {
        inputs: [
          { id: 'in-0', name: 'A (LSB)', value: 0 },
          { id: 'in-1', name: 'B', value: 0 },
          { id: 'in-2', name: 'C', value: 0 },
          { id: 'in-3', name: 'D (MSB)', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: 'a', value: 0 },
          { id: 'out-1', name: 'b', value: 0 },
          { id: 'out-2', name: 'c', value: 0 },
          { id: 'out-3', name: 'd', value: 0 },
          { id: 'out-4', name: 'e', value: 0 },
          { id: 'out-5', name: 'f', value: 0 },
          { id: 'out-6', name: 'g', value: 0 },
        ],
      };

    case 'D_LATCH':
      return {
        inputs: [
          { id: 'in-0', name: 'D', value: 0 },
          { id: 'in-1', name: 'EN', value: 0 },
          { id: 'in-2', name: 'CLR', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: 'Q', value: 0 },
          { id: 'out-1', name: 'Q̄', value: 1 },
        ],
      };

    case 'LCD_16X2':
      return {
        inputs: ['RS', 'E', 'D4', 'D5', 'D6', 'D7'].map((name, i) => ({ id: `in-${i}`, name, value: -1 as SignalValue })),
        outputs: [],
      };

    case 'OPEN_DRAIN_BUFFER':
      return {
        inputs: [{ id: 'in-0', name: 'A', value: 0 }],
        outputs: [{ id: 'out-0', name: 'Y', value: -1 }],
      };

    case 'D_FLIPFLOP':
      return {
        inputs: [
          { id: 'in-0', name: 'D', value: 0 },
          { id: 'in-1', name: 'CLK', value: 0 },
          { id: 'in-2', name: 'PRE', value: 0 },
          { id: 'in-3', name: 'CLR', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: 'Q', value: 0 },
          { id: 'out-1', name: 'Q̄', value: 1 },
        ],
      };

    case 'SR_LATCH':
      return {
        inputs: [
          { id: 'in-0', name: 'S', value: 0 },
          { id: 'in-1', name: 'R', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: 'Q', value: 0 },
          { id: 'out-1', name: 'Q̄', value: 1 },
        ],
      };

    case 'MUX_2TO1':
      return {
        inputs: [
          { id: 'in-0', name: 'I0', value: 0 },
          { id: 'in-1', name: 'I1', value: 0 },
          { id: 'in-2', name: 'S', value: 0 },
          { id: 'in-3', name: 'EN', value: 1 },
        ],
        outputs: [{ id: 'out-0', name: 'Y', value: 0 }],
      };

    case 'JK_FLIPFLOP':
      return {
        inputs: [
          { id: 'in-0', name: 'J', value: 0 },
          { id: 'in-1', name: 'CLK', value: 0 },
          { id: 'in-2', name: 'K', value: 0 },
          { id: 'in-3', name: 'CLR', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: 'Q', value: 0 },
          { id: 'out-1', name: 'Q̄', value: 1 },
        ],
      };

    case 'REGISTER_4BIT':
      return {
        inputs: [
          { id: 'in-0', name: 'D0', value: 0 },
          { id: 'in-1', name: 'D1', value: 0 },
          { id: 'in-2', name: 'D2', value: 0 },
          { id: 'in-3', name: 'D3', value: 0 },
          { id: 'in-4', name: 'CLK', value: 0 },
          { id: 'in-5', name: 'EN', value: 1 },
          { id: 'in-6', name: 'CLR', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: 'Q0', value: 0 },
          { id: 'out-1', name: 'Q1', value: 0 },
          { id: 'out-2', name: 'Q2', value: 0 },
          { id: 'out-3', name: 'Q3', value: 0 },
        ],
      };

    case 'MUX_8TO1':
      return {
        inputs: [
          { id: 'in-0', name: 'I0', value: 0 }, { id: 'in-1', name: 'I1', value: 0 },
          { id: 'in-2', name: 'I2', value: 0 }, { id: 'in-3', name: 'I3', value: 0 },
          { id: 'in-4', name: 'I4', value: 0 }, { id: 'in-5', name: 'I5', value: 0 },
          { id: 'in-6', name: 'I6', value: 0 }, { id: 'in-7', name: 'I7', value: 0 },
          { id: 'in-8', name: 'S2', value: 0 }, { id: 'in-9', name: 'S1', value: 0 }, { id: 'in-10', name: 'S0', value: 0 },
          { id: 'in-11', name: 'EN', value: 1 },
        ],
        outputs: [{ id: 'out-0', name: 'Y', value: 0 }],
      };

    case 'DEMUX_1TO8':
      return {
        inputs: [
          { id: 'in-0', name: 'IN', value: 0 },
          { id: 'in-1', name: 'S2', value: 0 }, { id: 'in-2', name: 'S1', value: 0 }, { id: 'in-3', name: 'S0', value: 0 },
          { id: 'in-4', name: 'EN', value: 1 },
        ],
        outputs: Array.from({ length: 8 }, (_, i) => ({ id: `out-${i}`, name: `Y${i}`, value: 0 })),
      };

    case 'DECODER_3TO8':
      return {
        inputs: [
          { id: 'in-0', name: 'A0', value: 0 }, { id: 'in-1', name: 'A1', value: 0 }, { id: 'in-2', name: 'A2', value: 0 },
          { id: 'in-3', name: 'EN', value: 1 },
        ],
        outputs: Array.from({ length: 8 }, (_, i) => ({ id: `out-${i}`, name: `Y${i}`, value: 0 })),
      };

    case 'ENCODER_8TO3':
      return {
        inputs: Array.from({ length: 8 }, (_, i) => ({ id: `in-${i}`, name: `I${i}`, value: 0 })),
        outputs: [
          { id: 'out-0', name: 'Y2', value: 0 }, { id: 'out-1', name: 'Y1', value: 0 },
          { id: 'out-2', name: 'Y0', value: 0 }, { id: 'out-3', name: 'V', value: 0 },
        ],
      };

    case 'PARITY_GENERATOR':
      return {
        inputs: [
          { id: 'in-0', name: 'I0', value: 0 }, { id: 'in-1', name: 'I1', value: 0 },
          { id: 'in-2', name: 'I2', value: 0 }, { id: 'in-3', name: 'I3', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: 'Pe (Even)', value: 0 }, { id: 'out-1', name: 'Po (Odd)', value: 1 },
        ],
      };

    case 'PARITY_CHECKER':
      return {
        inputs: [
          { id: 'in-0', name: 'I0', value: 0 }, { id: 'in-1', name: 'I1', value: 0 },
          { id: 'in-2', name: 'I2', value: 0 }, { id: 'in-3', name: 'I3', value: 0 },
          { id: 'in-4', name: 'Parity Bit', value: 0 },
        ],
        outputs: [{ id: 'out-0', name: 'ERR', value: 0 }],
      };

    case 'T_FLIPFLOP':
      return {
        inputs: [
          { id: 'in-0', name: 'T', value: 0 }, { id: 'in-1', name: 'CLK', value: 0 },
          { id: 'in-2', name: 'CLR', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: 'Q', value: 0 }, { id: 'out-1', name: 'Q̄', value: 1 },
        ],
      };

    case 'INCREMENTER_4BIT':
    case 'DECREMENTER_4BIT':
      return {
        inputs: [
          { id: 'in-0', name: 'A0', value: 0 }, { id: 'in-1', name: 'A1', value: 0 },
          { id: 'in-2', name: 'A2', value: 0 }, { id: 'in-3', name: 'A3', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: 'Y0', value: 0 }, { id: 'out-1', name: 'Y1', value: 0 },
          { id: 'out-2', name: 'Y2', value: 0 }, { id: 'out-3', name: 'Y3', value: 0 },
          { id: 'out-4', name: 'Cout', value: 0 },
        ],
      };

    case 'ADDER_SUBTRACTOR_4BIT':
      return {
        inputs: [
          { id: 'in-0', name: 'A0', value: 0 }, { id: 'in-1', name: 'A1', value: 0 },
          { id: 'in-2', name: 'A2', value: 0 }, { id: 'in-3', name: 'A3', value: 0 },
          { id: 'in-4', name: 'B0', value: 0 }, { id: 'in-5', name: 'B1', value: 0 },
          { id: 'in-6', name: 'B2', value: 0 }, { id: 'in-7', name: 'B3', value: 0 },
          { id: 'in-8', name: 'SUB', value: 0 }, // 0 = ADD, 1 = SUB
        ],
        outputs: [
          { id: 'out-0', name: 'S0', value: 0 }, { id: 'out-1', name: 'S1', value: 0 },
          { id: 'out-2', name: 'S2', value: 0 }, { id: 'out-3', name: 'S3', value: 0 },
          { id: 'out-4', name: 'Cout', value: 0 },
        ],
      };

    case 'COUNTER_4BIT':
      return {
        inputs: [
          { id: 'in-0', name: 'CLK', value: 0 },
          { id: 'in-1', name: 'EN', value: 1 },
          { id: 'in-2', name: 'UP', value: 1 },
          { id: 'in-3', name: 'CLR', value: 0 },
        ],
        outputs: [...bitPins('out', 0, 'Q', 4), { id: 'out-4', name: 'TC', value: 0 }],
      };

    case 'COUNTER_LOAD_4BIT':
      return {
        inputs: [
          { id: 'in-0', name: 'CLK', value: 0 },
          { id: 'in-1', name: 'EN', value: 1 },
          { id: 'in-2', name: 'LOAD', value: 0 },
          { id: 'in-3', name: 'CLR', value: 0 },
          ...bitPins('in', 4, 'D', 4),
        ],
        outputs: [...bitPins('out', 0, 'Q', 4), { id: 'out-4', name: 'RCO', value: 0 }],
      };

    case 'DECADE_COUNTER':
      return {
        inputs: [
          { id: 'in-0', name: 'CLK', value: 0 },
          { id: 'in-1', name: 'EN', value: 1 },
          { id: 'in-2', name: 'CLR', value: 0 },
        ],
        outputs: [...bitPins('out', 0, 'Q', 4), { id: 'out-4', name: 'TC', value: 0 }],
      };

    case 'SHIFT_REG_UNIVERSAL':
      return {
        inputs: [
          { id: 'in-0', name: 'CLK', value: 0 },
          { id: 'in-1', name: 'CLR', value: 0 },
          { id: 'in-2', name: 'S0', value: 0 },
          { id: 'in-3', name: 'S1', value: 0 },
          { id: 'in-4', name: 'SR', value: 0 },
          { id: 'in-5', name: 'SL', value: 0 },
          ...bitPins('in', 6, 'D', 4),
        ],
        outputs: bitPins('out', 0, 'Q', 4),
      };

    case 'DECODER_4TO16_HC':
      return {
        inputs: [...bitPins('in', 0, 'A', 4), { id: 'in-4', name: 'EN', value: 1 }],
        outputs: bitPins('out', 0, 'Y', 16),
      };

    case 'REGISTER_8BIT':
      return {
        inputs: [...bitPins('in', 0, 'D', 8), { id: 'in-8', name: 'CLK', value: 0 }, { id: 'in-9', name: 'EN', value: 1 }, { id: 'in-10', name: 'CLR', value: 0 }],
        outputs: bitPins('out', 0, 'Q', 8),
      };

    case 'LATCH_8BIT':
      return {
        inputs: [...bitPins('in', 0, 'D', 8), { id: 'in-8', name: 'LE', value: 0 }, { id: 'in-9', name: 'OE', value: 1 }],
        outputs: bitPins('out', 0, 'Q', 8),
      };

    case 'SHIFT_REG_4BIT':
      return {
        inputs: [
          { id: 'in-0', name: 'SER', value: 0 },
          { id: 'in-1', name: 'CLK', value: 0 },
          { id: 'in-2', name: 'CLR', value: 0 },
        ],
        outputs: bitPins('out', 0, 'Q', 4),
      };

    case 'ALU_4BIT_8FN':
      return {
        inputs: [
          ...bitPins('in', 0, 'A', 4),
          ...bitPins('in', 4, 'B', 4),
          { id: 'in-8', name: 'S0', value: 0 },
          { id: 'in-9', name: 'S1', value: 0 },
          { id: 'in-10', name: 'S2', value: 0 },
        ],
        outputs: [...bitPins('out', 0, 'F', 4), { id: 'out-4', name: 'C', value: 0 }, { id: 'out-5', name: 'Z', value: 1 }],
      };

    case 'RAM_16X4':
      return {
        inputs: [
          ...bitPins('in', 0, 'A', 4),
          ...bitPins('in', 4, 'D', 4),
          { id: 'in-8', name: 'WE', value: 0 },
          { id: 'in-9', name: 'CLK', value: 0 },
        ],
        outputs: bitPins('out', 0, 'Q', 4),
      };

    case 'ROM_16X4':
      return {
        inputs: bitPins('in', 0, 'A', 4),
        outputs: bitPins('out', 0, 'Q', 4),
      };

    case 'DELAY_ELEMENT':
      return {
        inputs: [{ id: 'in-0', name: 'In', value: 0 }],
        outputs: [{ id: 'out-0', name: 'Out (t+1)', value: 0 }],
      };

    case 'TUNNEL':
      return {
        inputs: [{ id: 'in-0', name: 'In', value: 0 }],
        outputs: [{ id: 'out-0', name: 'Out', value: 0 }],
      };

    default:
      return { inputs: [], outputs: [] };
  }
}

/**
 * Treat a missing or floating (-1) control input as its documented default level.
 */
export function floatingAs(value: SignalValue | undefined, fallback: 0 | 1): SignalValue {
  return value === undefined || value === -1 ? fallback : value;
}

/** Number from `count` inputs starting at `first`, least significant first; floating counts as 0. */
const readBits = (inputs: SignalValue[], first: number, count: number) =>
  Array.from({ length: count }, (_, i) => (inputs[first + i] === 1 ? 1 << i : 0)).reduce((a, b) => a | b, 0);

const writeBits = (outputs: Record<string, SignalValue>, first: number, value: number, count: number) => {
  for (let i = 0; i < count; i++) outputs[`out-${first + i}`] = ((value >> i) & 1) as SignalValue;
};

export function evaluateIC(
  gateType: GateType,
  inputs: SignalValue[],
  currentState: Record<string, any> = {},
  /** Part settings some chips read (ROM contents). */
  data: { romContents?: number[] } = {}
): { outputs: Record<string, SignalValue>; newState: Record<string, any> } {
  const outputs: Record<string, SignalValue> = {};
  const newState = { ...currentState };

  switch (gateType) {
    case 'HALF_ADDER': {
      const a = inputs[0] === 1 ? 1 : 0;
      const b = inputs[1] === 1 ? 1 : 0;
      const sum = a ^ b;
      const cout = a & b;
      outputs['out-0'] = sum as SignalValue; // Sum
      outputs['out-1'] = cout as SignalValue; // Cout
      break;
    }

    case 'FULL_ADDER': {
      const a = inputs[0] === 1 ? 1 : 0;
      const b = inputs[1] === 1 ? 1 : 0;
      const cin = inputs[2] === 1 ? 1 : 0;
      const sum = a ^ b ^ cin;
      const cout = (a & b) | (cin & (a ^ b));
      outputs['out-0'] = sum as SignalValue;
      outputs['out-1'] = cout as SignalValue;
      break;
    }

    case 'ADDER_4BIT': {
      const a = (inputs[0] === 1 ? 1 : 0) | ((inputs[1] === 1 ? 1 : 0) << 1) | ((inputs[2] === 1 ? 1 : 0) << 2) | ((inputs[3] === 1 ? 1 : 0) << 3);
      const b = (inputs[4] === 1 ? 1 : 0) | ((inputs[5] === 1 ? 1 : 0) << 1) | ((inputs[6] === 1 ? 1 : 0) << 2) | ((inputs[7] === 1 ? 1 : 0) << 3);
      const cin = inputs[8] === 1 ? 1 : 0;

      const res = a + b + cin;
      outputs['out-0'] = ((res >> 0) & 1) as SignalValue;
      outputs['out-1'] = ((res >> 1) & 1) as SignalValue;
      outputs['out-2'] = ((res >> 2) & 1) as SignalValue;
      outputs['out-3'] = ((res >> 3) & 1) as SignalValue;
      outputs['out-4'] = res > 15 ? 1 : 0;
      break;
    }

    case 'HALF_SUBTRACTOR': {
      const a = inputs[0] === 1 ? 1 : 0;
      const b = inputs[1] === 1 ? 1 : 0;
      outputs['out-0'] = (a ^ b) as SignalValue; // Diff
      outputs['out-1'] = ((~a & 1) & b) as SignalValue; // Borrow
      break;
    }

    case 'FULL_SUBTRACTOR': {
      const a = inputs[0] === 1 ? 1 : 0;
      const b = inputs[1] === 1 ? 1 : 0;
      const bin = inputs[2] === 1 ? 1 : 0;
      const diff = a ^ b ^ bin;
      const bout = ((~a & 1) & b) | (((~(a ^ b)) & 1) & bin);
      outputs['out-0'] = diff as SignalValue;
      outputs['out-1'] = bout as SignalValue;
      break;
    }

    case 'MUX_4TO1': {
      const i0 = inputs[0] ?? 0;
      const i1 = inputs[1] ?? 0;
      const i2 = inputs[2] ?? 0;
      const i3 = inputs[3] ?? 0;
      const s1 = inputs[4] === 1 ? 1 : 0;
      const s0 = inputs[5] === 1 ? 1 : 0;
      const en = floatingAs(inputs[6], 1);

      if (en === 0) {
        outputs['out-0'] = 0;
      } else {
        const sel = (s1 << 1) | s0;
        const arr = [i0, i1, i2, i3];
        outputs['out-0'] = arr[sel] ?? 0;
      }
      break;
    }

    case 'DEMUX_1TO4': {
      const inVal = inputs[0] ?? 0;
      const s1 = inputs[1] === 1 ? 1 : 0;
      const s0 = inputs[2] === 1 ? 1 : 0;
      const en = floatingAs(inputs[3], 1);

      outputs['out-0'] = 0;
      outputs['out-1'] = 0;
      outputs['out-2'] = 0;
      outputs['out-3'] = 0;

      if (en !== 0) {
        const sel = (s1 << 1) | s0;
        outputs[`out-${sel}`] = inVal;
      }
      break;
    }

    case 'PRIORITY_ENCODER': {
      const i0 = inputs[0] === 1;
      const i1 = inputs[1] === 1;
      const i2 = inputs[2] === 1;
      const i3 = inputs[3] === 1;

      if (i3) {
        outputs['out-0'] = 1; outputs['out-1'] = 1; outputs['out-2'] = 1;
      } else if (i2) {
        outputs['out-0'] = 1; outputs['out-1'] = 0; outputs['out-2'] = 1;
      } else if (i1) {
        outputs['out-0'] = 0; outputs['out-1'] = 1; outputs['out-2'] = 1;
      } else if (i0) {
        outputs['out-0'] = 0; outputs['out-1'] = 0; outputs['out-2'] = 1;
      } else {
        outputs['out-0'] = 0; outputs['out-1'] = 0; outputs['out-2'] = 0;
      }
      break;
    }

    case 'COMPARATOR_4BIT': {
      const a = ((inputs[3] === 1 ? 8 : 0) | (inputs[2] === 1 ? 4 : 0) | (inputs[1] === 1 ? 2 : 0) | (inputs[0] === 1 ? 1 : 0));
      const b = ((inputs[7] === 1 ? 8 : 0) | (inputs[6] === 1 ? 4 : 0) | (inputs[5] === 1 ? 2 : 0) | (inputs[4] === 1 ? 1 : 0));

      outputs['out-0'] = a > b ? 1 : 0;
      outputs['out-1'] = a === b ? 1 : 0;
      outputs['out-2'] = a < b ? 1 : 0;
      break;
    }

    case 'DECODER_BCD_TO_7SEG': {
      const segs = decodeSevenSegment(inputs);
      outputs['out-0'] = segs[0] ? 1 : 0;
      outputs['out-1'] = segs[1] ? 1 : 0;
      outputs['out-2'] = segs[2] ? 1 : 0;
      outputs['out-3'] = segs[3] ? 1 : 0;
      outputs['out-4'] = segs[4] ? 1 : 0;
      outputs['out-5'] = segs[5] ? 1 : 0;
      outputs['out-6'] = segs[6] ? 1 : 0;
      break;
    }

    case 'D_LATCH': {
      const d = inputs[0] ?? 0;
      const en = inputs[1] ?? 0;
      const clr = inputs[2] ?? 0;

      let q = currentState.q ?? 0;
      if (clr === 1) {
        q = 0;
      } else if (en === 1) {
        q = d === 1 ? 1 : 0;
      }
      newState.q = q;
      outputs['out-0'] = q;
      outputs['out-1'] = q === 1 ? 0 : 1;
      break;
    }

    case 'LCD_16X2': {
      // Takes RS and D4–D7 on the falling edge of E. A running board's microsecond E pulses are caught in the
      // emulator instead (simulation/timeline.ts), which marks the state as fed by the board.
      const e = inputs[1] === 1 ? 1 : 0;
      let lcd: LcdState = currentState.lcd ?? initialLcd();
      if ((currentState.prevE ?? 0) === 1 && e === 0 && !currentState.fromBoard) {
        lcd = lcdNibble(lcd, inputs[0] === 1, readBits(inputs, 2, 4));
      }
      newState.prevE = e;
      newState.lcd = lcd;
      break;
    }

    case 'OPEN_DRAIN_BUFFER':
      // Can only pull the line low; a 1 leaves it floating for a pull-up resistor to raise
      outputs['out-0'] = inputs[0] === 0 ? 0 : -1;
      break;

    case 'D_FLIPFLOP': {
      const clk = inputs[1] === 1 ? 1 : 0;
      const pre = inputs[2] === 1;
      const clr = inputs[3] === 1;
      let q: SignalValue = currentState.q ?? 0;
      // Preset and clear act at once, without the clock; both at once is not allowed and drives Q and Q̄ high
      if (pre && !clr) q = 1;
      else if (clr && !pre) q = 0;
      else if (!pre && !clr && (currentState.prevClk ?? 0) === 0 && clk === 1) q = inputs[0] === 1 ? 1 : 0;
      newState.prevClk = clk;
      newState.q = q;
      outputs['out-0'] = pre && clr ? 1 : q;
      outputs['out-1'] = pre && clr ? 1 : q === 1 ? 0 : 1;
      break;
    }

    case 'SR_LATCH': {
      const s = inputs[0] === 1;
      const r = inputs[1] === 1;
      let q: SignalValue = currentState.q ?? 0;
      if (s && !r) q = 1;
      else if (r && !s) q = 0;
      newState.q = q;
      // S = R = 1 is the forbidden input: like the NOR-gate latch, both outputs go to 0
      outputs['out-0'] = s && r ? 0 : q;
      outputs['out-1'] = s && r ? 0 : q === 1 ? 0 : 1;
      break;
    }

    case 'MUX_2TO1': {
      const en = floatingAs(inputs[3], 1);
      outputs['out-0'] = en === 1 && (inputs[2] === 1 ? inputs[1] : inputs[0]) === 1 ? 1 : 0;
      break;
    }

    case 'JK_FLIPFLOP': {
      const j = inputs[0] === 1 ? 1 : 0;
      const clk = inputs[1] === 1 ? 1 : 0;
      const k = inputs[2] === 1 ? 1 : 0;
      const clr = inputs[3] === 1 ? 1 : 0;

      const prevClk = currentState.prevClk ?? 0;
      let q = currentState.q ?? 0;

      if (clr === 1) {
        q = 0;
      } else if (prevClk === 0 && clk === 1) { // Active rising edge
        if (j === 1 && k === 1) {
          q = q === 1 ? 0 : 1;
        } else if (j === 1 && k === 0) {
          q = 1;
        } else if (j === 0 && k === 1) {
          q = 0;
        }
      }

      newState.prevClk = clk;
      newState.q = q;
      outputs['out-0'] = q;
      outputs['out-1'] = q === 1 ? 0 : 1;
      break;
    }

    case 'REGISTER_4BIT': {
      const d0 = inputs[0] === 1 ? 1 : 0;
      const d1 = inputs[1] === 1 ? 1 : 0;
      const d2 = inputs[2] === 1 ? 1 : 0;
      const d3 = inputs[3] === 1 ? 1 : 0;
      const clk = inputs[4] === 1 ? 1 : 0;
      const en = floatingAs(inputs[5], 1);
      const clr = inputs[6] === 1 ? 1 : 0;

      const prevClk = currentState.prevClk ?? 0;
      let qVal = currentState.qVal ?? 0;

      if (clr === 1) {
        qVal = 0;
      } else if (prevClk === 0 && clk === 1 && en === 1) {
        qVal = (d3 << 3) | (d2 << 2) | (d1 << 1) | d0;
      }

      newState.prevClk = clk;
      newState.qVal = qVal;
      outputs['out-0'] = ((qVal >> 0) & 1) as SignalValue;
      outputs['out-1'] = ((qVal >> 1) & 1) as SignalValue;
      outputs['out-2'] = ((qVal >> 2) & 1) as SignalValue;
      outputs['out-3'] = ((qVal >> 3) & 1) as SignalValue;
      break;
    }

    case 'MUX_8TO1': {
      const s2 = inputs[8] === 1 ? 1 : 0;
      const s1 = inputs[9] === 1 ? 1 : 0;
      const s0 = inputs[10] === 1 ? 1 : 0;
      const en = floatingAs(inputs[11], 1);
      if (en === 0) {
        outputs['out-0'] = 0;
      } else {
        const sel = (s2 << 2) | (s1 << 1) | s0;
        outputs['out-0'] = inputs[sel] ?? 0;
      }
      break;
    }

    case 'DEMUX_1TO8': {
      const inVal = inputs[0] ?? 0;
      const s2 = inputs[1] === 1 ? 1 : 0;
      const s1 = inputs[2] === 1 ? 1 : 0;
      const s0 = inputs[3] === 1 ? 1 : 0;
      const en = floatingAs(inputs[4], 1);
      for (let i = 0; i < 8; i++) outputs[`out-${i}`] = 0;
      if (en !== 0) {
        const sel = (s2 << 2) | (s1 << 1) | s0;
        outputs[`out-${sel}`] = inVal;
      }
      break;
    }

    case 'DECODER_3TO8': {
      const a0 = inputs[0] === 1 ? 1 : 0;
      const a1 = inputs[1] === 1 ? 1 : 0;
      const a2 = inputs[2] === 1 ? 1 : 0;
      const en = floatingAs(inputs[3], 1);
      for (let i = 0; i < 8; i++) outputs[`out-${i}`] = 0;
      if (en !== 0) {
        const sel = (a2 << 2) | (a1 << 1) | a0;
        outputs[`out-${sel}`] = 1;
      }
      break;
    }

    case 'ENCODER_8TO3': {
      let activeIdx = -1;
      for (let i = 7; i >= 0; i--) {
        if (inputs[i] === 1) {
          activeIdx = i;
          break;
        }
      }
      if (activeIdx >= 0) {
        outputs['out-0'] = ((activeIdx >> 2) & 1) as SignalValue;
        outputs['out-1'] = ((activeIdx >> 1) & 1) as SignalValue;
        outputs['out-2'] = ((activeIdx >> 0) & 1) as SignalValue;
        outputs['out-3'] = 1;
      } else {
        outputs['out-0'] = 0; outputs['out-1'] = 0; outputs['out-2'] = 0; outputs['out-3'] = 0;
      }
      break;
    }

    case 'PARITY_GENERATOR': {
      const ones = inputs.slice(0, 4).filter(v => v === 1).length;
      const isEven = ones % 2 === 0;
      outputs['out-0'] = isEven ? 1 : 0;
      outputs['out-1'] = isEven ? 0 : 1;
      break;
    }

    case 'PARITY_CHECKER': {
      const ones = inputs.slice(0, 4).filter(v => v === 1).length;
      const pBit = inputs[4] === 1 ? 1 : 0;
      outputs['out-0'] = ((ones + pBit) % 2 === 1) ? 1 : 0; // Error if odd total
      break;
    }

    case 'T_FLIPFLOP': {
      const t = inputs[0] === 1 ? 1 : 0;
      const clk = inputs[1] === 1 ? 1 : 0;
      const clr = inputs[2] === 1 ? 1 : 0;

      const prevClk = currentState.prevClk ?? 0;
      let q = currentState.q ?? 0;

      if (clr === 1) {
        q = 0;
      } else if (prevClk === 0 && clk === 1 && t === 1) {
        q = q === 1 ? 0 : 1;
      }

      newState.prevClk = clk;
      newState.q = q;
      outputs['out-0'] = q;
      outputs['out-1'] = q === 1 ? 0 : 1;
      break;
    }

    case 'INCREMENTER_4BIT': {
      const a = (inputs[0] === 1 ? 1 : 0) | ((inputs[1] === 1 ? 1 : 0) << 1) | ((inputs[2] === 1 ? 1 : 0) << 2) | ((inputs[3] === 1 ? 1 : 0) << 3);
      const res = a + 1;
      outputs['out-0'] = ((res >> 0) & 1) as SignalValue;
      outputs['out-1'] = ((res >> 1) & 1) as SignalValue;
      outputs['out-2'] = ((res >> 2) & 1) as SignalValue;
      outputs['out-3'] = ((res >> 3) & 1) as SignalValue;
      outputs['out-4'] = res > 15 ? 1 : 0;
      break;
    }

    case 'DECREMENTER_4BIT': {
      const a = (inputs[0] === 1 ? 1 : 0) | ((inputs[1] === 1 ? 1 : 0) << 1) | ((inputs[2] === 1 ? 1 : 0) << 2) | ((inputs[3] === 1 ? 1 : 0) << 3);
      const res = a - 1;
      const wrappedRes = (res + 16) % 16;
      outputs['out-0'] = ((wrappedRes >> 0) & 1) as SignalValue;
      outputs['out-1'] = ((wrappedRes >> 1) & 1) as SignalValue;
      outputs['out-2'] = ((wrappedRes >> 2) & 1) as SignalValue;
      outputs['out-3'] = ((wrappedRes >> 3) & 1) as SignalValue;
      outputs['out-4'] = a === 0 ? 1 : 0; // Borrow out
      break;
    }

    case 'ADDER_SUBTRACTOR_4BIT': {
      const a = (inputs[0] === 1 ? 1 : 0) | ((inputs[1] === 1 ? 1 : 0) << 1) | ((inputs[2] === 1 ? 1 : 0) << 2) | ((inputs[3] === 1 ? 1 : 0) << 3);
      const b = (inputs[4] === 1 ? 1 : 0) | ((inputs[5] === 1 ? 1 : 0) << 1) | ((inputs[6] === 1 ? 1 : 0) << 2) | ((inputs[7] === 1 ? 1 : 0) << 3);
      const isSub = inputs[8] === 1;

      const res = isSub ? a - b : a + b;
      const masked = (res + 16) % 16;

      outputs['out-0'] = ((masked >> 0) & 1) as SignalValue;
      outputs['out-1'] = ((masked >> 1) & 1) as SignalValue;
      outputs['out-2'] = ((masked >> 2) & 1) as SignalValue;
      outputs['out-3'] = ((masked >> 3) & 1) as SignalValue;
      outputs['out-4'] = isSub ? (a < b ? 1 : 0) : (res > 15 ? 1 : 0);
      break;
    }

    case 'COUNTER_4BIT': {
      const clk = inputs[0] === 1 ? 1 : 0;
      const en = floatingAs(inputs[1], 1);
      const up = floatingAs(inputs[2], 1);
      const clr = inputs[3] === 1;
      let count: number = currentState.count ?? 0;
      if (clr) count = 0;
      else if ((currentState.prevClk ?? 0) === 0 && clk === 1 && en === 1) count = (count + (up === 1 ? 1 : 15)) % 16;
      newState.prevClk = clk;
      newState.count = count;
      writeBits(outputs, 0, count, 4);
      outputs['out-4'] = en === 1 && count === (up === 1 ? 15 : 0) ? 1 : 0;
      break;
    }

    case 'COUNTER_LOAD_4BIT': {
      // 74HC161 style: synchronous load, asynchronous clear (active high here)
      const clk = inputs[0] === 1 ? 1 : 0;
      const en = floatingAs(inputs[1], 1);
      let count: number = currentState.count ?? 0;
      if (inputs[3] === 1) count = 0;
      else if ((currentState.prevClk ?? 0) === 0 && clk === 1) {
        if (inputs[2] === 1) count = readBits(inputs, 4, 4);
        else if (en === 1) count = (count + 1) % 16;
      }
      newState.prevClk = clk;
      newState.count = count;
      writeBits(outputs, 0, count, 4);
      outputs['out-4'] = en === 1 && count === 15 ? 1 : 0;
      break;
    }

    case 'DECADE_COUNTER': {
      const clk = inputs[0] === 1 ? 1 : 0;
      const en = floatingAs(inputs[1], 1);
      let count: number = currentState.count ?? 0;
      if (inputs[2] === 1) count = 0;
      else if ((currentState.prevClk ?? 0) === 0 && clk === 1 && en === 1) count = (count + 1) % 10;
      newState.prevClk = clk;
      newState.count = count;
      writeBits(outputs, 0, count, 4);
      outputs['out-4'] = en === 1 && count === 9 ? 1 : 0;
      break;
    }

    case 'SHIFT_REG_UNIVERSAL': {
      // 74HC194 style; S1 S0: 00 hold, 01 shift right (SR enters Q0), 10 shift left (SL enters Q3), 11 load D
      const clk = inputs[0] === 1 ? 1 : 0;
      let q: number = currentState.qVal ?? 0;
      if (inputs[1] === 1) q = 0;
      else if ((currentState.prevClk ?? 0) === 0 && clk === 1) {
        const mode = readBits(inputs, 2, 2);
        if (mode === 1) q = ((q << 1) | (inputs[4] === 1 ? 1 : 0)) & 15;
        else if (mode === 2) q = (q >> 1) | (inputs[5] === 1 ? 8 : 0);
        else if (mode === 3) q = readBits(inputs, 6, 4);
      }
      newState.prevClk = clk;
      newState.qVal = q;
      writeBits(outputs, 0, q, 4);
      break;
    }

    case 'DECODER_4TO16_HC': {
      const en = floatingAs(inputs[4], 1);
      writeBits(outputs, 0, en === 1 ? 1 << readBits(inputs, 0, 4) : 0, 16);
      break;
    }

    case 'REGISTER_8BIT': {
      const clk = inputs[8] === 1 ? 1 : 0;
      let q: number = currentState.qVal ?? 0;
      if (inputs[10] === 1) q = 0;
      else if ((currentState.prevClk ?? 0) === 0 && clk === 1 && floatingAs(inputs[9], 1) === 1) q = readBits(inputs, 0, 8);
      newState.prevClk = clk;
      newState.qVal = q;
      writeBits(outputs, 0, q, 8);
      break;
    }

    case 'LATCH_8BIT': {
      // 74HC373 style: transparent while LE is 1, holds otherwise; outputs float while OE is 0 (OE active high here)
      let q: number = currentState.qVal ?? 0;
      if (inputs[8] === 1) q = readBits(inputs, 0, 8);
      newState.qVal = q;
      if (floatingAs(inputs[9], 1) === 1) writeBits(outputs, 0, q, 8);
      else for (let i = 0; i < 8; i++) outputs[`out-${i}`] = -1;
      break;
    }

    case 'SHIFT_REG_4BIT': {
      const ser = inputs[0] === 1 ? 1 : 0;
      const clk = inputs[1] === 1 ? 1 : 0;
      let q: number = currentState.qVal ?? 0;
      if (inputs[2] === 1) q = 0;
      else if ((currentState.prevClk ?? 0) === 0 && clk === 1) q = ((q << 1) | ser) & 15;
      newState.prevClk = clk;
      newState.qVal = q;
      writeBits(outputs, 0, q, 4);
      break;
    }

    case 'ALU_4BIT_8FN': {
      const a = readBits(inputs, 0, 4);
      const b = readBits(inputs, 4, 4);
      const op = readBits(inputs, 8, 3);
      const results: [number, boolean][] = [
        [a + b, a + b > 15],
        [a - b, a < b],
        [a & b, false],
        [a | b, false],
        [a ^ b, false],
        [~a, false],
        [a + 1, a === 15],
        [a - 1, a === 0],
      ];
      const [raw, carry] = results[op];
      const f = raw & 15;
      writeBits(outputs, 0, f, 4);
      outputs['out-4'] = carry ? 1 : 0;
      outputs['out-5'] = f === 0 ? 1 : 0;
      break;
    }

    case 'RAM_16X4': {
      const addr = readBits(inputs, 0, 4);
      const clk = inputs[9] === 1 ? 1 : 0;
      let mem: number[] = currentState.mem ?? new Array(16).fill(0);
      if ((currentState.prevClk ?? 0) === 0 && clk === 1 && inputs[8] === 1) {
        mem = mem.slice();
        mem[addr] = readBits(inputs, 4, 4);
      }
      newState.prevClk = clk;
      newState.mem = mem;
      writeBits(outputs, 0, mem[addr] ?? 0, 4);
      break;
    }

    case 'ROM_16X4': {
      const contents = data.romContents ?? DEFAULT_ROM_CONTENTS;
      writeBits(outputs, 0, contents[readBits(inputs, 0, 4)] ?? 0, 4);
      break;
    }

    case 'DELAY_ELEMENT':
    case 'TUNNEL': {
      const inVal = inputs[0] ?? 0;
      outputs['out-0'] = inVal;
      break;
    }

    default:
      break;
  }

  return { outputs, newState };
}
