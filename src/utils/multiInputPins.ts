import { PinData, SignalValue } from '../types/circuit';
import { MultiInputConfig, generateInputLabels } from '../types/multiInput';

/**
 * Creates or updates the array of output pins for a MultiInput node.
 * Preserves existing values if available.
 */
export function createMultiInputPins(
  config: MultiInputConfig,
  currentOutputs: PinData[] = []
): PinData[] {
  const pinMap = new Map<string, SignalValue>();
  currentOutputs.forEach((p) => pinMap.set(p.id, p.value));

  const labels = config.labels.length === config.inputCount
    ? config.labels
    : generateInputLabels(config.inputCount);

  const outputs: PinData[] = [];

  for (let i = 0; i < config.inputCount; i++) {
    const pinId = `out-${i}`;
    const val = config.values[i] ?? pinMap.get(pinId) ?? 0;
    outputs.push({
      id: pinId,
      name: labels[i] || `Bit ${i}`,
      value: val,
    });
  }

  // Optional combined Bus pin
  const busVal = config.values.some((v) => v === 1) ? 1 : 0;
  outputs.push({
    id: 'out-bus',
    name: `BUS (${config.inputCount}-bit)`,
    value: busVal,
  });

  return outputs;
}
