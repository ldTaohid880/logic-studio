import { SignalValue } from '../types/circuit';
import { SevenSegmentConfig, SevenSegmentEvaluation } from '../types/sevenSegment';

// Standard 7-Segment Map for hexadecimal digits 0-15 (0-F)
// Array segment order: [a, b, c, d, e, f, g]
export const DIGIT_SEGMENT_MAP: Record<number, boolean[]> = {
  0:  [true,  true,  true,  true,  true,  true,  false], // 0
  1:  [false, true,  true,  false, false, false, false], // 1
  2:  [true,  true,  false, true,  true,  false, true],  // 2
  3:  [true,  true,  true,  true,  false, false, true],  // 3
  4:  [false, true,  true,  false, false, true,  true],  // 4
  5:  [true,  false, true,  true,  false, true,  true],  // 5
  6:  [true,  false, true,  true,  true,  true,  true],  // 6
  7:  [true,  true,  true,  false, false, false, false], // 7
  8:  [true,  true,  true,  true,  true,  true,  true],  // 8
  9:  [true,  true,  true,  true,  false, true,  true],  // 9
  10: [true,  true,  true,  false, true,  true,  true],  // A
  11: [false, false, true,  true,  true,  true,  true],  // b
  12: [true,  false, false, true,  true,  true,  false], // C
  13: [false, true,  true,  true,  true,  false, true],  // d
  14: [true,  false, false, true,  true,  true,  true],  // E
  15: [true,  false, false, false, true,  true,  true],  // F
};

export const HEX_CHARS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'b', 'C', 'd', 'E', 'F'];

/**
 * Evaluates the 7-segment display state, illuminated segments, and educational decoded metadata.
 */
export function evaluateSevenSegment(
  inputPins: { id: string; value: SignalValue }[],
  config: SevenSegmentConfig
): SevenSegmentEvaluation {
  const isCommonAnode = config.displayType === 'common_anode';

  // Helper to test if an input pin signal is active
  // Active High (Common Cathode): 1 = active
  // Active Low (Common Anode): 0 = active
  const isPinActive = (val: SignalValue | undefined): boolean => {
    if (val === undefined || val === -1) return false;
    return isCommonAnode ? val === 0 : val === 1;
  };

  // Helper to extract 0 or 1 binary bit value for decoder modes
  const getBitVal = (val: SignalValue | undefined): number => {
    if (val === undefined || val === -1) return 0;
    return val === 1 ? 1 : 0;
  };

  const segments = {
    a: false,
    b: false,
    c: false,
    d: false,
    e: false,
    f: false,
    g: false,
    dp: false,
  };

  let decodedChar = ' ';
  let decimalValue: number | null = null;
  let binaryString = '';
  let isValidBcd = true;

  if (config.mode === 'direct') {
    // Mode 2: Direct Segment Control
    const pinMap = new Map(inputPins.map((p) => [p.id, p.value]));

    segments.a = isPinActive(pinMap.get('in-a'));
    segments.b = isPinActive(pinMap.get('in-b'));
    segments.c = isPinActive(pinMap.get('in-c'));
    segments.d = isPinActive(pinMap.get('in-d'));
    segments.e = isPinActive(pinMap.get('in-e'));
    segments.f = isPinActive(pinMap.get('in-f'));
    segments.g = isPinActive(pinMap.get('in-g'));
    if (config.showDecimalPoint) {
      segments.dp = isPinActive(pinMap.get('in-dp'));
    }

    // Try to match segment pattern to a known digit/character
    const pattern = [segments.a, segments.b, segments.c, segments.d, segments.e, segments.f, segments.g];
    let matchedDigit = -1;
    for (let i = 0; i < 16; i++) {
      const target = DIGIT_SEGMENT_MAP[i];
      if (pattern.every((v, idx) => v === target[idx])) {
        matchedDigit = i;
        break;
      }
    }

    if (matchedDigit !== -1) {
      decimalValue = matchedDigit;
      decodedChar = HEX_CHARS[matchedDigit];
      binaryString = matchedDigit.toString(2).padStart(4, '0');
    } else {
      decodedChar = 'Custom';
      binaryString = 'DIRECT';
    }

  } else {
    // Decoder Modes: Mode 1 (Binary), Mode 3 (BCD), Mode 4 (Hex)
    // Pins: in-0 (A - LSB), in-1 (B), in-2 (C), in-3 (D - MSB), optional in-dp (DP)
    const pinMap = new Map(inputPins.map((p) => [p.id, p.value]));

    const bitA = getBitVal(pinMap.get('in-0'));
    const bitB = getBitVal(pinMap.get('in-1'));
    const bitC = getBitVal(pinMap.get('in-2'));
    const bitD = getBitVal(pinMap.get('in-3'));

    const num = (bitD << 3) | (bitC << 2) | (bitB << 1) | bitA;
    binaryString = `${bitD}${bitC}${bitB}${bitA}`;
    decimalValue = num;

    if (config.showDecimalPoint) {
      segments.dp = isPinActive(pinMap.get('in-dp'));
    }

    if (config.mode === 'bcd') {
      // Mode 3: BCD Decoder (0-9)
      if (num <= 9) {
        const pattern = DIGIT_SEGMENT_MAP[num];
        segments.a = pattern[0];
        segments.b = pattern[1];
        segments.c = pattern[2];
        segments.d = pattern[3];
        segments.e = pattern[4];
        segments.f = pattern[5];
        segments.g = pattern[6];
        decodedChar = String(num);
        isValidBcd = true;
      } else {
        isValidBcd = false;
        if (config.bcdInvalidBehavior === 'error') {
          // Display 'E'
          const pattern = DIGIT_SEGMENT_MAP[14]; // E
          segments.a = pattern[0];
          segments.b = pattern[1];
          segments.c = pattern[2];
          segments.d = pattern[3];
          segments.e = pattern[4];
          segments.f = pattern[5];
          segments.g = pattern[6];
          decodedChar = 'E';
        } else if (config.bcdInvalidBehavior === 'dash') {
          // Display '-'
          segments.g = true;
          decodedChar = '-';
        } else {
          // Blank (all OFF)
          decodedChar = ' ';
        }
      }
    } else {
      // Mode 1 & 4: Binary / Hexadecimal Decoder (0-F)
      const pattern = DIGIT_SEGMENT_MAP[num] || DIGIT_SEGMENT_MAP[0];
      segments.a = pattern[0];
      segments.b = pattern[1];
      segments.c = pattern[2];
      segments.d = pattern[3];
      segments.e = pattern[4];
      segments.f = pattern[5];
      segments.g = pattern[6];
      decodedChar = HEX_CHARS[num];
    }
  }

  return {
    segments,
    decodedChar,
    decimalValue,
    binaryString,
    isValidBcd,
  };
}
