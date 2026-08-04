import { GateType, SignalValue } from '../types/circuit';

export function evaluateGate(
  gateType: GateType,
  inputs: SignalValue[],
  currentOutput: SignalValue = -1,
  extraData?: { value?: SignalValue }
): SignalValue {
  switch (gateType) {
    case 'INPUT':
      return extraData?.value ?? 0;

    case 'OUTPUT':
      return inputs[0] ?? -1;

    case 'CLOCK':
      return extraData?.value ?? 0;

    case 'NOT': {
      const in0 = inputs[0] ?? -1;
      if (in0 === 1) return 0;
      if (in0 === 0) return 1;
      return -1;
    }

    case 'AND': {
      if (inputs.length === 0) return -1;
      if (inputs.some((val) => val === 0)) return 0;
      if (inputs.every((val) => val === 1)) return 1;
      return -1;
    }

    case 'OR': {
      if (inputs.length === 0) return -1;
      if (inputs.some((val) => val === 1)) return 1;
      if (inputs.every((val) => val === 0)) return 0;
      return -1;
    }

    case 'NAND': {
      const andVal = evaluateGate('AND', inputs);
      if (andVal === 1) return 0;
      if (andVal === 0) return 1;
      return -1;
    }

    case 'NOR': {
      const orVal = evaluateGate('OR', inputs);
      if (orVal === 1) return 0;
      if (orVal === 0) return 1;
      return -1;
    }

    case 'XOR': {
      if (inputs.length === 0) return -1;
      if (inputs.some((val) => val === -1)) return -1;
      const ones = inputs.filter((val) => val === 1).length;
      return ones % 2 === 1 ? 1 : 0;
    }

    case 'XNOR': {
      const xorVal = evaluateGate('XOR', inputs);
      if (xorVal === 1) return 0;
      if (xorVal === 0) return 1;
      return -1;
    }

    default:
      return -1;
  }
}

// 7-segment display decoder helper
// Inputs A, B, C, D (where D is MSB, A is LSB)
// Segments: [a, b, c, d, e, f, g]
export function decodeSevenSegment(inputs: SignalValue[]): boolean[] {
  // If any input is unknown, return all off
  if (inputs.some(val => val === -1)) {
    return [false, false, false, false, false, false, false];
  }

  const d = inputs[3] ?? 0;
  const c = inputs[2] ?? 0;
  const b = inputs[1] ?? 0;
  const a = inputs[0] ?? 0;

  const num = (d << 3) | (c << 2) | (b << 1) | a;

  // Segment mapping for digits 0-F
  const segmentMap: Record<number, boolean[]> = {
    0:  [true, true, true, true, true, true, false],
    1:  [false, true, true, false, false, false, false],
    2:  [true, true, false, true, true, false, true],
    3:  [true, true, true, true, false, false, true],
    4:  [false, true, true, false, false, true, true],
    5:  [true, false, true, true, false, true, true],
    6:  [true, false, true, true, true, true, true],
    7:  [true, true, true, false, false, false, false],
    8:  [true, true, true, true, true, true, true],
    9:  [true, true, true, true, false, true, true],
    10: [true, true, true, false, true, true, true],  // A
    11: [false, false, true, true, true, true, true], // b
    12: [true, false, false, true, true, true, false], // C
    13: [false, true, true, true, true, false, true], // d
    14: [true, false, false, true, true, true, true], // E
    15: [true, false, false, false, true, true, true], // F
  };

  return segmentMap[num] || [false, false, false, false, false, false, false];
}
