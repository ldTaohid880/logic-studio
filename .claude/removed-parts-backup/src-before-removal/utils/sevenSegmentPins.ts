import { PinData, SignalValue } from '../types/circuit';
import { SevenSegmentConfig } from '../types/sevenSegment';

/**
 * Dynamically creates/reconstructs input pins for 7-Segment display based on current configuration.
 * Preserves signal values for matching pin IDs where applicable.
 */
export function createSevenSegmentPins(
  config: SevenSegmentConfig,
  currentInputs: PinData[] = []
): PinData[] {
  const pinMap = new Map<string, SignalValue>();
  currentInputs.forEach((p) => pinMap.set(p.id, p.value));

  const newPins: PinData[] = [];

  if (config.mode === 'direct') {
    // Direct Segment Mode: individual segment input pins a, b, c, d, e, f, g
    const segmentNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    segmentNames.forEach((seg) => {
      const pinId = `in-${seg}`;
      newPins.push({
        id: pinId,
        name: `Seg ${seg.toUpperCase()}`,
        value: pinMap.get(pinId) ?? -1,
      });
    });

    if (config.showDecimalPoint) {
      const pinId = 'in-dp';
      newPins.push({
        id: pinId,
        name: 'Seg DP',
        value: pinMap.get(pinId) ?? -1,
      });
    }
  } else {
    // Binary / BCD / Hex Decoder Modes: 4-bit binary input pins A, B, C, D
    const bitLabels = ['A (LSB)', 'B', 'C', 'D (MSB)'];
    for (let i = 0; i < 4; i++) {
      const pinId = `in-${i}`;
      newPins.push({
        id: pinId,
        name: bitLabels[i],
        value: pinMap.get(pinId) ?? -1,
      });
    }

    if (config.showDecimalPoint) {
      const pinId = 'in-dp';
      newPins.push({
        id: pinId,
        name: 'DP',
        value: pinMap.get(pinId) ?? -1,
      });
    }
  }

  return newPins;
}
