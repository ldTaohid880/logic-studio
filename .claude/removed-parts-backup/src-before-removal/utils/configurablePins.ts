import { PinData, SignalValue } from '../types/circuit';
import {
  CfgEncoderConfig,
  CfgDecoderConfig,
  CfgMuxConfig,
  CfgDemuxConfig,
  CfgComparatorConfig,
  CfgRegisterConfig,
  CfgShiftRegisterConfig,
  CfgCounterConfig,
  CfgConstantConfig,
  CfgBusSplitterConfig,
  CfgBusJoinerConfig,
} from '../types/configurable';

function preservePinValues(newPins: PinData[], existingPins?: PinData[]): PinData[] {
  if (!existingPins || existingPins.length === 0) return newPins;
  const pinMap = new Map<string, SignalValue>();
  existingPins.forEach((p) => pinMap.set(p.id, p.value));

  return newPins.map((pin) => ({
    ...pin,
    value: pinMap.has(pin.id) ? (pinMap.get(pin.id) as SignalValue) : pin.value,
  }));
}

export function createCfgEncoderPins(
  config: CfgEncoderConfig,
  existingInputs?: PinData[],
  existingOutputs?: PinData[]
): { inputs: PinData[]; outputs: PinData[] } {
  const inputs: PinData[] = [];
  for (let i = 0; i < config.inputCount; i++) {
    inputs.push({ id: `in-${i}`, name: `D${i}`, value: 0 });
  }
  if (config.enableInput) {
    inputs.push({ id: 'in-en', name: config.activeLow ? 'EN̄' : 'EN', value: config.activeLow ? 0 : 1 });
  }

  const outBits = Math.max(1, Math.ceil(Math.log2(config.inputCount)));
  const outputs: PinData[] = [];
  for (let i = 0; i < outBits; i++) {
    outputs.push({ id: `out-${i}`, name: `Y${i}`, value: 0 });
  }
  outputs.push({ id: 'out-gs', name: 'GS', value: 0 });

  return {
    inputs: preservePinValues(inputs, existingInputs),
    outputs: preservePinValues(outputs, existingOutputs),
  };
}

export function createCfgDecoderPins(
  config: CfgDecoderConfig,
  existingInputs?: PinData[],
  existingOutputs?: PinData[]
): { inputs: PinData[]; outputs: PinData[] } {
  const inputs: PinData[] = [];
  for (let i = 0; i < config.bitWidth; i++) {
    inputs.push({ id: `in-${i}`, name: `A${i}`, value: 0 });
  }
  if (config.enableInput) {
    inputs.push({ id: 'in-en', name: config.activeLow ? 'EN̄' : 'EN', value: config.activeLow ? 0 : 1 });
  }

  const outCount = Math.pow(2, config.bitWidth);
  const outputs: PinData[] = [];
  for (let i = 0; i < outCount; i++) {
    outputs.push({ id: `out-${i}`, name: `Y${i}`, value: 0 });
  }

  return {
    inputs: preservePinValues(inputs, existingInputs),
    outputs: preservePinValues(outputs, existingOutputs),
  };
}

export function createCfgMuxPins(
  config: CfgMuxConfig,
  existingInputs?: PinData[],
  existingOutputs?: PinData[]
): { inputs: PinData[]; outputs: PinData[] } {
  const inputs: PinData[] = [];
  const selectCount = Math.max(1, Math.ceil(Math.log2(config.inputCount)));

  if (config.dataWidth === 1) {
    for (let i = 0; i < config.inputCount; i++) {
      inputs.push({ id: `in-data-${i}`, name: `I${i}`, value: 0 });
    }
  } else {
    for (let c = 0; c < config.inputCount; c++) {
      for (let w = 0; w < config.dataWidth; w++) {
        inputs.push({ id: `in-data-${c}-${w}`, name: `I${c}_${w}`, value: 0 });
      }
    }
  }

  for (let s = 0; s < selectCount; s++) {
    inputs.push({ id: `in-sel-${s}`, name: `S${s}`, value: 0 });
  }

  if (config.enableInput) {
    inputs.push({ id: 'in-en', name: 'EN', value: 1 });
  }

  const outputs: PinData[] = [];
  if (config.dataWidth === 1) {
    outputs.push({ id: 'out-0', name: 'Y', value: 0 });
  } else {
    for (let w = 0; w < config.dataWidth; w++) {
      outputs.push({ id: `out-${w}`, name: `Y${w}`, value: 0 });
    }
  }

  return {
    inputs: preservePinValues(inputs, existingInputs),
    outputs: preservePinValues(outputs, existingOutputs),
  };
}

export function createCfgDemuxPins(
  config: CfgDemuxConfig,
  existingInputs?: PinData[],
  existingOutputs?: PinData[]
): { inputs: PinData[]; outputs: PinData[] } {
  const inputs: PinData[] = [];
  const selectCount = Math.max(1, Math.ceil(Math.log2(config.outputCount)));

  if (config.dataWidth === 1) {
    inputs.push({ id: 'in-data-0', name: 'IN', value: 0 });
  } else {
    for (let w = 0; w < config.dataWidth; w++) {
      inputs.push({ id: `in-data-${w}`, name: `IN${w}`, value: 0 });
    }
  }

  for (let s = 0; s < selectCount; s++) {
    inputs.push({ id: `in-sel-${s}`, name: `S${s}`, value: 0 });
  }

  if (config.enableInput) {
    inputs.push({ id: 'in-en', name: 'EN', value: 1 });
  }

  const outputs: PinData[] = [];
  if (config.dataWidth === 1) {
    for (let c = 0; c < config.outputCount; c++) {
      outputs.push({ id: `out-data-${c}`, name: `Y${c}`, value: 0 });
    }
  } else {
    for (let c = 0; c < config.outputCount; c++) {
      for (let w = 0; w < config.dataWidth; w++) {
        outputs.push({ id: `out-data-${c}-${w}`, name: `Y${c}_${w}`, value: 0 });
      }
    }
  }

  return {
    inputs: preservePinValues(inputs, existingInputs),
    outputs: preservePinValues(outputs, existingOutputs),
  };
}

export function createCfgComparatorPins(
  config: CfgComparatorConfig,
  existingInputs?: PinData[],
  existingOutputs?: PinData[]
): { inputs: PinData[]; outputs: PinData[] } {
  const inputs: PinData[] = [];
  for (let i = 0; i < config.bitWidth; i++) {
    inputs.push({ id: `in-a-${i}`, name: `A${i}`, value: 0 });
  }
  for (let i = 0; i < config.bitWidth; i++) {
    inputs.push({ id: `in-b-${i}`, name: `B${i}`, value: 0 });
  }

  const outputs: PinData[] = [
    { id: 'out-gt', name: 'A > B', value: 0 },
    { id: 'out-eq', name: 'A = B', value: 1 },
    { id: 'out-lt', name: 'A < B', value: 0 },
  ];

  return {
    inputs: preservePinValues(inputs, existingInputs),
    outputs: preservePinValues(outputs, existingOutputs),
  };
}

export function createCfgRegisterPins(
  config: CfgRegisterConfig,
  existingInputs?: PinData[],
  existingOutputs?: PinData[]
): { inputs: PinData[]; outputs: PinData[] } {
  const inputs: PinData[] = [];
  for (let i = 0; i < config.bitWidth; i++) {
    inputs.push({ id: `in-d-${i}`, name: `D${i}`, value: 0 });
  }
  inputs.push({ id: 'in-clk', name: 'CLK', value: 0 });
  if (config.enable) {
    inputs.push({ id: 'in-en', name: 'EN', value: 1 });
  }
  if (config.reset) {
    inputs.push({ id: 'in-clr', name: 'CLR', value: 0 });
  }

  const outputs: PinData[] = [];
  for (let i = 0; i < config.bitWidth; i++) {
    outputs.push({ id: `out-q-${i}`, name: `Q${i}`, value: 0 });
  }

  return {
    inputs: preservePinValues(inputs, existingInputs),
    outputs: preservePinValues(outputs, existingOutputs),
  };
}

export function createCfgShiftRegisterPins(
  config: CfgShiftRegisterConfig,
  existingInputs?: PinData[],
  existingOutputs?: PinData[]
): { inputs: PinData[]; outputs: PinData[] } {
  const inputs: PinData[] = [];
  inputs.push({ id: 'in-clk', name: 'CLK', value: 0 });
  inputs.push({ id: 'in-clr', name: 'CLR', value: 0 });

  if (config.serialInput) {
    inputs.push({ id: 'in-si', name: 'SI', value: 0 });
  }
  if (config.parallelLoad) {
    inputs.push({ id: 'in-load', name: 'LOAD', value: 0 });
    for (let i = 0; i < config.bitWidth; i++) {
      inputs.push({ id: `in-d-${i}`, name: `D${i}`, value: 0 });
    }
  }

  const outputs: PinData[] = [];
  for (let i = 0; i < config.bitWidth; i++) {
    outputs.push({ id: `out-q-${i}`, name: `Q${i}`, value: 0 });
  }
  outputs.push({ id: 'out-so', name: 'SO', value: 0 });

  return {
    inputs: preservePinValues(inputs, existingInputs),
    outputs: preservePinValues(outputs, existingOutputs),
  };
}

export function createCfgCounterPins(
  config: CfgCounterConfig,
  existingInputs?: PinData[],
  existingOutputs?: PinData[]
): { inputs: PinData[]; outputs: PinData[] } {
  const inputs: PinData[] = [];
  inputs.push({ id: 'in-clk', name: 'CLK', value: 0 });
  if (config.reset) {
    inputs.push({ id: 'in-clr', name: 'CLR', value: 0 });
  }
  if (config.enable) {
    inputs.push({ id: 'in-en', name: 'EN', value: 1 });
  }
  if (config.mode === 'up_down') {
    inputs.push({ id: 'in-updown', name: 'U/D̄', value: 1 });
  }

  const outputs: PinData[] = [];
  for (let i = 0; i < config.bitWidth; i++) {
    outputs.push({ id: `out-q-${i}`, name: `Q${i}`, value: 0 });
  }
  outputs.push({ id: 'out-tc', name: 'TC', value: 0 });

  return {
    inputs: preservePinValues(inputs, existingInputs),
    outputs: preservePinValues(outputs, existingOutputs),
  };
}

export function createCfgConstantPins(
  config: CfgConstantConfig,
  existingInputs?: PinData[],
  existingOutputs?: PinData[]
): { inputs: PinData[]; outputs: PinData[] } {
  const outputs: PinData[] = [];
  for (let i = 0; i < config.bitWidth; i++) {
    const bitVal = ((config.value >> i) & 1) === 1 ? 1 : 0;
    outputs.push({ id: `out-${i}`, name: `Out${i}`, value: bitVal });
  }

  return {
    inputs: [],
    outputs: preservePinValues(outputs, existingOutputs),
  };
}

export function createCfgBusSplitterPins(
  config: CfgBusSplitterConfig,
  existingInputs?: PinData[],
  existingOutputs?: PinData[]
): { inputs: PinData[]; outputs: PinData[] } {
  const inputs: PinData[] = [];
  for (let i = 0; i < config.inputWidth; i++) {
    inputs.push({ id: `in-${i}`, name: `In${i}`, value: 0 });
  }

  const outputs: PinData[] = [];
  for (let i = 0; i < config.inputWidth; i++) {
    outputs.push({ id: `out-${i}`, name: `Out${i}`, value: 0 });
  }

  return {
    inputs: preservePinValues(inputs, existingInputs),
    outputs: preservePinValues(outputs, existingOutputs),
  };
}

export function createCfgBusJoinerPins(
  config: CfgBusJoinerConfig,
  existingInputs?: PinData[],
  existingOutputs?: PinData[]
): { inputs: PinData[]; outputs: PinData[] } {
  const inputs: PinData[] = [];
  for (let i = 0; i < config.inputCount; i++) {
    inputs.push({ id: `in-${i}`, name: `In${i}`, value: 0 });
  }

  const outputs: PinData[] = [];
  for (let i = 0; i < config.inputCount; i++) {
    outputs.push({ id: `out-${i}`, name: `Out${i}`, value: 0 });
  }

  return {
    inputs: preservePinValues(inputs, existingInputs),
    outputs: preservePinValues(outputs, existingOutputs),
  };
}
