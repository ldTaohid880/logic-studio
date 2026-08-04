import { GateType, SignalValue, PinData } from '../types/circuit';
import { decodeSevenSegment } from '../utils/gateLogic';

export interface ICPins {
  inputs: PinData[];
  outputs: PinData[];
}

export function getDefaultICPins(gateType: GateType): ICPins {
  switch (gateType) {
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

    case 'SHIFT_REGISTER_4BIT':
      return {
        inputs: [
          { id: 'in-0', name: 'SI', value: 0 },
          { id: 'in-1', name: 'CLK', value: 0 },
          { id: 'in-2', name: 'SHIFT/LOAD', value: 1 },
          { id: 'in-3', name: 'CLR', value: 0 },
          { id: 'in-4', name: 'D0', value: 0 },
          { id: 'in-5', name: 'D1', value: 0 },
          { id: 'in-6', name: 'D2', value: 0 },
          { id: 'in-7', name: 'D3', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: 'Q0', value: 0 },
          { id: 'out-1', name: 'Q1', value: 0 },
          { id: 'out-2', name: 'Q2', value: 0 },
          { id: 'out-3', name: 'Q3', value: 0 },
          { id: 'out-4', name: 'SO', value: 0 },
        ],
      };

    case 'UP_COUNTER_4BIT':
    case 'DOWN_COUNTER_4BIT':
      return {
        inputs: [
          { id: 'in-0', name: 'CLK', value: 0 },
          { id: 'in-1', name: 'CLR', value: 0 },
          { id: 'in-2', name: 'EN', value: 1 },
        ],
        outputs: [
          { id: 'out-0', name: 'Q0 (LSB)', value: 0 },
          { id: 'out-1', name: 'Q1', value: 0 },
          { id: 'out-2', name: 'Q2', value: 0 },
          { id: 'out-3', name: 'Q3 (MSB)', value: 0 },
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

    case 'DECODER_4TO16':
      return {
        inputs: [
          { id: 'in-0', name: 'A0', value: 0 }, { id: 'in-1', name: 'A1', value: 0 },
          { id: 'in-2', name: 'A2', value: 0 }, { id: 'in-3', name: 'A3', value: 0 },
          { id: 'in-4', name: 'EN', value: 1 },
        ],
        outputs: Array.from({ length: 16 }, (_, i) => ({ id: `out-${i}`, name: `Y${i}`, value: 0 })),
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

    case 'CONVERTER_BIN_TO_GRAY':
    case 'CONVERTER_GRAY_TO_BIN':
      return {
        inputs: [
          { id: 'in-0', name: 'In 0', value: 0 }, { id: 'in-1', name: 'In 1', value: 0 },
          { id: 'in-2', name: 'In 2', value: 0 }, { id: 'in-3', name: 'In 3', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: 'Out 0', value: 0 }, { id: 'out-1', name: 'Out 1', value: 0 },
          { id: 'out-2', name: 'Out 2', value: 0 }, { id: 'out-3', name: 'Out 3', value: 0 },
        ],
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

    case 'RING_COUNTER':
    case 'RIPPLE_COUNTER':
    case 'SYNCHRONOUS_COUNTER':
      return {
        inputs: [
          { id: 'in-0', name: 'CLK', value: 0 }, { id: 'in-1', name: 'CLR', value: 0 },
          { id: 'in-2', name: 'EN', value: 1 },
        ],
        outputs: [
          { id: 'out-0', name: 'Q0', value: 0 }, { id: 'out-1', name: 'Q1', value: 0 },
          { id: 'out-2', name: 'Q2', value: 0 }, { id: 'out-3', name: 'Q3', value: 0 },
        ],
      };

    case 'UP_DOWN_COUNTER':
      return {
        inputs: [
          { id: 'in-0', name: 'CLK', value: 0 }, { id: 'in-1', name: 'UP/DOWN', value: 1 },
          { id: 'in-2', name: 'CLR', value: 0 }, { id: 'in-3', name: 'EN', value: 1 },
        ],
        outputs: [
          { id: 'out-0', name: 'Q0', value: 0 }, { id: 'out-1', name: 'Q1', value: 0 },
          { id: 'out-2', name: 'Q2', value: 0 }, { id: 'out-3', name: 'Q3', value: 0 },
        ],
      };

    case 'FREQUENCY_DIVIDER':
      return {
        inputs: [
          { id: 'in-0', name: 'CLK', value: 0 }, { id: 'in-1', name: 'CLR', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: '/2', value: 0 }, { id: 'out-1', name: '/4', value: 0 },
          { id: 'out-2', name: '/8', value: 0 }, { id: 'out-3', name: '/16', value: 0 },
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

    case 'ALU_4BIT':
      return {
        inputs: [
          { id: 'in-0', name: 'A0', value: 0 }, { id: 'in-1', name: 'A1', value: 0 },
          { id: 'in-2', name: 'A2', value: 0 }, { id: 'in-3', name: 'A3', value: 0 },
          { id: 'in-4', name: 'B0', value: 0 }, { id: 'in-5', name: 'B1', value: 0 },
          { id: 'in-6', name: 'B2', value: 0 }, { id: 'in-7', name: 'B3', value: 0 },
          { id: 'in-8', name: 'OP0', value: 0 }, { id: 'in-9', name: 'OP1', value: 0 }, { id: 'in-10', name: 'OP2', value: 0 },
        ],
        outputs: [
          { id: 'out-0', name: 'Y0', value: 0 }, { id: 'out-1', name: 'Y1', value: 0 },
          { id: 'out-2', name: 'Y2', value: 0 }, { id: 'out-3', name: 'Y3', value: 0 },
          { id: 'out-4', name: 'Zero (Z)', value: 1 }, { id: 'out-5', name: 'Carry (C)', value: 0 },
        ],
      };

    case 'BUS_SPLITTER':
      return {
        inputs: [{ id: 'in-0', name: 'Bus In', value: 0 }],
        outputs: Array.from({ length: 4 }, (_, i) => ({ id: `out-${i}`, name: `B${i}`, value: 0 })),
      };

    case 'BUS_JOINER':
      return {
        inputs: Array.from({ length: 4 }, (_, i) => ({ id: `in-${i}`, name: `B${i}`, value: 0 })),
        outputs: [{ id: 'out-0', name: 'Bus Out', value: 0 }],
      };

    case 'BUS_TAP':
    case 'BIT_EXTRACTOR':
      return {
        inputs: [{ id: 'in-0', name: 'In', value: 0 }],
        outputs: [{ id: 'out-0', name: 'Bit Out', value: 0 }],
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

export function evaluateIC(
  gateType: GateType,
  inputs: SignalValue[],
  currentState: Record<string, any> = {}
): { outputs: Record<string, SignalValue>; newState: Record<string, any> } {
  const outputs: Record<string, SignalValue> = {};
  const newState = { ...currentState };

  switch (gateType) {
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
      const en = inputs[6] ?? 1;

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
      const en = inputs[3] ?? 1;

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
      const en = inputs[5] ?? 1;
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

    case 'SHIFT_REGISTER_4BIT': {
      const si = inputs[0] === 1 ? 1 : 0;
      const clk = inputs[1] === 1 ? 1 : 0;
      const shiftLoad = inputs[2] ?? 1;
      const clr = inputs[3] === 1 ? 1 : 0;
      const d0 = inputs[4] === 1 ? 1 : 0;
      const d1 = inputs[5] === 1 ? 1 : 0;
      const d2 = inputs[6] === 1 ? 1 : 0;
      const d3 = inputs[7] === 1 ? 1 : 0;

      const prevClk = currentState.prevClk ?? 0;
      let qVal = currentState.qVal ?? 0;

      if (clr === 1) {
        qVal = 0;
      } else if (prevClk === 0 && clk === 1) {
        if (shiftLoad === 0) {
          // Parallel Load
          qVal = (d3 << 3) | (d2 << 2) | (d1 << 1) | d0;
        } else {
          // Shift Right (SI enters at LSB)
          qVal = ((qVal << 1) & 0x0F) | si;
        }
      }

      newState.prevClk = clk;
      newState.qVal = qVal;
      outputs['out-0'] = ((qVal >> 0) & 1) as SignalValue;
      outputs['out-1'] = ((qVal >> 1) & 1) as SignalValue;
      outputs['out-2'] = ((qVal >> 2) & 1) as SignalValue;
      outputs['out-3'] = ((qVal >> 3) & 1) as SignalValue;
      outputs['out-4'] = ((qVal >> 3) & 1) as SignalValue;
      break;
    }

    case 'UP_COUNTER_4BIT':
    case 'DOWN_COUNTER_4BIT': {
      const clk = inputs[0] === 1 ? 1 : 0;
      const clr = inputs[1] === 1 ? 1 : 0;
      const en = inputs[2] ?? 1;

      const prevClk = currentState.prevClk ?? 0;
      let count = currentState.count ?? 0;

      if (clr === 1) {
        count = 0;
      } else if (prevClk === 0 && clk === 1 && en === 1) {
        if (gateType === 'UP_COUNTER_4BIT') {
          count = (count + 1) % 16;
        } else {
          count = (count - 1 + 16) % 16;
        }
      }

      newState.prevClk = clk;
      newState.count = count;

      outputs['out-0'] = ((count >> 0) & 1) as SignalValue;
      outputs['out-1'] = ((count >> 1) & 1) as SignalValue;
      outputs['out-2'] = ((count >> 2) & 1) as SignalValue;
      outputs['out-3'] = ((count >> 3) & 1) as SignalValue;
      break;
    }

    case 'MUX_8TO1': {
      const s2 = inputs[8] === 1 ? 1 : 0;
      const s1 = inputs[9] === 1 ? 1 : 0;
      const s0 = inputs[10] === 1 ? 1 : 0;
      const en = inputs[11] ?? 1;
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
      const en = inputs[4] ?? 1;
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
      const en = inputs[3] ?? 1;
      for (let i = 0; i < 8; i++) outputs[`out-${i}`] = 0;
      if (en !== 0) {
        const sel = (a2 << 2) | (a1 << 1) | a0;
        outputs[`out-${sel}`] = 1;
      }
      break;
    }

    case 'DECODER_4TO16': {
      const a0 = inputs[0] === 1 ? 1 : 0;
      const a1 = inputs[1] === 1 ? 1 : 0;
      const a2 = inputs[2] === 1 ? 1 : 0;
      const a3 = inputs[3] === 1 ? 1 : 0;
      const en = inputs[4] ?? 1;
      for (let i = 0; i < 16; i++) outputs[`out-${i}`] = 0;
      if (en !== 0) {
        const sel = (a3 << 3) | (a2 << 2) | (a1 << 1) | a0;
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

    case 'CONVERTER_BIN_TO_GRAY': {
      const b3 = inputs[3] === 1 ? 1 : 0;
      const b2 = inputs[2] === 1 ? 1 : 0;
      const b1 = inputs[1] === 1 ? 1 : 0;
      const b0 = inputs[0] === 1 ? 1 : 0;
      const g3 = b3;
      const g2 = b3 ^ b2;
      const g1 = b2 ^ b1;
      const g0 = b1 ^ b0;
      outputs['out-0'] = g0 as SignalValue; outputs['out-1'] = g1 as SignalValue;
      outputs['out-2'] = g2 as SignalValue; outputs['out-3'] = g3 as SignalValue;
      break;
    }

    case 'CONVERTER_GRAY_TO_BIN': {
      const g3 = inputs[3] === 1 ? 1 : 0;
      const g2 = inputs[2] === 1 ? 1 : 0;
      const g1 = inputs[1] === 1 ? 1 : 0;
      const g0 = inputs[0] === 1 ? 1 : 0;
      const b3 = g3;
      const b2 = b3 ^ g2;
      const b1 = b2 ^ g1;
      const b0 = b1 ^ g0;
      outputs['out-0'] = b0 as SignalValue; outputs['out-1'] = b1 as SignalValue;
      outputs['out-2'] = b2 as SignalValue; outputs['out-3'] = b3 as SignalValue;
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

    case 'RING_COUNTER': {
      const clk = inputs[0] === 1 ? 1 : 0;
      const clr = inputs[1] === 1 ? 1 : 0;
      const en = inputs[2] ?? 1;

      const prevClk = currentState.prevClk ?? 0;
      let ringVal = currentState.ringVal ?? 1; // Initial 0001 (bit 0 = 1)

      if (clr === 1) {
        ringVal = 1;
      } else if (prevClk === 0 && clk === 1 && en === 1) {
        // Shift left with wrap (1 -> 2 -> 4 -> 8 -> 1)
        ringVal = (ringVal << 1) > 8 ? 1 : (ringVal << 1);
      }

      newState.prevClk = clk;
      newState.ringVal = ringVal;
      outputs['out-0'] = ((ringVal >> 0) & 1) as SignalValue;
      outputs['out-1'] = ((ringVal >> 1) & 1) as SignalValue;
      outputs['out-2'] = ((ringVal >> 2) & 1) as SignalValue;
      outputs['out-3'] = ((ringVal >> 3) & 1) as SignalValue;
      break;
    }

    case 'RIPPLE_COUNTER':
    case 'SYNCHRONOUS_COUNTER': {
      const clk = inputs[0] === 1 ? 1 : 0;
      const clr = inputs[1] === 1 ? 1 : 0;
      const en = inputs[2] ?? 1;

      const prevClk = currentState.prevClk ?? 0;
      let count = currentState.count ?? 0;

      if (clr === 1) {
        count = 0;
      } else if (prevClk === 0 && clk === 1 && en === 1) {
        count = (count + 1) % 16;
      }

      newState.prevClk = clk;
      newState.count = count;
      outputs['out-0'] = ((count >> 0) & 1) as SignalValue;
      outputs['out-1'] = ((count >> 1) & 1) as SignalValue;
      outputs['out-2'] = ((count >> 2) & 1) as SignalValue;
      outputs['out-3'] = ((count >> 3) & 1) as SignalValue;
      break;
    }

    case 'UP_DOWN_COUNTER': {
      const clk = inputs[0] === 1 ? 1 : 0;
      const upDown = inputs[1] ?? 1;
      const clr = inputs[2] === 1 ? 1 : 0;
      const en = inputs[3] ?? 1;

      const prevClk = currentState.prevClk ?? 0;
      let count = currentState.count ?? 0;

      if (clr === 1) {
        count = 0;
      } else if (prevClk === 0 && clk === 1 && en === 1) {
        if (upDown === 1) {
          count = (count + 1) % 16;
        } else {
          count = (count - 1 + 16) % 16;
        }
      }

      newState.prevClk = clk;
      newState.count = count;
      outputs['out-0'] = ((count >> 0) & 1) as SignalValue;
      outputs['out-1'] = ((count >> 1) & 1) as SignalValue;
      outputs['out-2'] = ((count >> 2) & 1) as SignalValue;
      outputs['out-3'] = ((count >> 3) & 1) as SignalValue;
      break;
    }

    case 'FREQUENCY_DIVIDER': {
      const clk = inputs[0] === 1 ? 1 : 0;
      const clr = inputs[1] === 1 ? 1 : 0;

      const prevClk = currentState.prevClk ?? 0;
      let count = currentState.count ?? 0;

      if (clr === 1) {
        count = 0;
      } else if (prevClk === 0 && clk === 1) {
        count = (count + 1) % 16;
      }

      newState.prevClk = clk;
      newState.count = count;
      outputs['out-0'] = ((count >> 0) & 1) as SignalValue;
      outputs['out-1'] = ((count >> 1) & 1) as SignalValue;
      outputs['out-2'] = ((count >> 2) & 1) as SignalValue;
      outputs['out-3'] = ((count >> 3) & 1) as SignalValue;
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

    case 'ALU_4BIT': {
      const a = (inputs[0] === 1 ? 1 : 0) | ((inputs[1] === 1 ? 1 : 0) << 1) | ((inputs[2] === 1 ? 1 : 0) << 2) | ((inputs[3] === 1 ? 1 : 0) << 3);
      const b = (inputs[4] === 1 ? 1 : 0) | ((inputs[5] === 1 ? 1 : 0) << 1) | ((inputs[6] === 1 ? 1 : 0) << 2) | ((inputs[7] === 1 ? 1 : 0) << 3);
      const op = (inputs[8] === 1 ? 1 : 0) | ((inputs[9] === 1 ? 1 : 0) << 1) | ((inputs[10] === 1 ? 1 : 0) << 2);

      let res = 0;
      let carry = 0;

      switch (op) {
        case 0: res = a + b; carry = res > 15 ? 1 : 0; break; // ADD
        case 1: res = a - b; carry = a < b ? 1 : 0; break; // SUB
        case 2: res = a & b; break; // AND
        case 3: res = a | b; break; // OR
        case 4: res = a ^ b; break; // XOR
        case 5: res = (~a) & 0xF; break; // NOT A
        case 6: res = a + 1; carry = res > 15 ? 1 : 0; break; // INC
        case 7: res = a - 1; carry = a === 0 ? 1 : 0; break; // DEC
        default: res = a + b; break;
      }

      const masked = (res + 16) % 16;
      outputs['out-0'] = ((masked >> 0) & 1) as SignalValue;
      outputs['out-1'] = ((masked >> 1) & 1) as SignalValue;
      outputs['out-2'] = ((masked >> 2) & 1) as SignalValue;
      outputs['out-3'] = ((masked >> 3) & 1) as SignalValue;
      outputs['out-4'] = masked === 0 ? 1 : 0; // Zero flag Z
      outputs['out-5'] = carry as SignalValue; // Carry flag C
      break;
    }

    case 'BUS_SPLITTER': {
      const busVal = inputs[0] ?? 0;
      outputs['out-0'] = busVal;
      outputs['out-1'] = busVal;
      outputs['out-2'] = busVal;
      outputs['out-3'] = busVal;
      break;
    }

    case 'BUS_JOINER': {
      const b0 = inputs[0] === 1 ? 1 : 0;
      outputs['out-0'] = b0;
      break;
    }

    case 'BUS_TAP':
    case 'BIT_EXTRACTOR':
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
