import { PinData, SignalValue } from '../types/circuit';
import { EncoderConfig } from '../types/encoder';

export function createEncoderPins(config: EncoderConfig, currentInputs?: PinData[], currentOutputs?: PinData[]): {
  inputs: PinData[];
  outputs: PinData[];
} {
  const numInputs = config.inputs;
  const numBinaryOutputs = Math.log2(numInputs);

  // Preserve previous pin signal values if possible
  const inputMap = new Map<string, SignalValue>();
  if (currentInputs) {
    currentInputs.forEach((pin) => inputMap.set(pin.id, pin.value));
  }

  const outputMap = new Map<string, SignalValue>();
  if (currentOutputs) {
    currentOutputs.forEach((pin) => outputMap.set(pin.id, pin.value));
  }

  // 1. Generate Input Pins (D0..D{N-1})
  const inputs: PinData[] = [];
  inputs.push({
    id: 'in-EI',
    name: 'EI',
    value: inputMap.get('in-EI') ?? -1,
  });
  for (let i = 0; i < numInputs; i++) {
    const pinId = `in-${i}`;
    inputs.push({
      id: pinId,
      name: `D${i}`,
      value: inputMap.get(pinId) ?? -1,
    });
  }

  // 2. Generate Binary Output Pins (A{M-1}..A0)
  const outputs: PinData[] = [];

  for (let i = numBinaryOutputs - 1; i >= 0; i--) {
    const pinId = `out-A${i}`;
    outputs.push({
      id: pinId,
      name: `A${i}`,
      value: outputMap.get(pinId) ?? -1,
    });
  }

  // 3. Additional optional output pins (V, EO, GS)
  if (config.showValid) {
    outputs.push({
      id: 'out-V',
      name: 'V',
      value: outputMap.get('out-V') ?? -1,
    });
  }

  if (config.showEnableOutput) {
    outputs.push({
      id: 'out-EO',
      name: 'EO',
      value: outputMap.get('out-EO') ?? -1,
    });
  }

  if (config.showGroupSignal) {
    outputs.push({
      id: 'out-GS',
      name: 'GS',
      value: outputMap.get('out-GS') ?? -1,
    });
  }

  return { inputs, outputs };
}
