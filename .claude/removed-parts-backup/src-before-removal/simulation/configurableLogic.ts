import { SignalValue, PinData } from '../types/circuit';
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

export interface EvalConfigurableResult {
  outputs: Record<string, SignalValue>;
  newState?: Record<string, any>;
}

export function evaluateCfgEncoder(
  inputPins: PinData[],
  config: CfgEncoderConfig
): EvalConfigurableResult {
  const outputs: Record<string, SignalValue> = {};
  const activeVal: SignalValue = config.activeLow ? 0 : 1;
  const inactiveVal: SignalValue = config.activeLow ? 1 : 0;
  const outActiveVal: SignalValue = config.activeLow ? 0 : 1;
  const outInactiveVal: SignalValue = config.activeLow ? 1 : 0;

  let enabled = true;
  if (config.enableInput) {
    const enPin = inputPins.find((p) => p.id === 'in-en');
    enabled = enPin ? enPin.value === activeVal : true;
  }

  const outBits = Math.max(1, Math.ceil(Math.log2(config.inputCount)));

  if (!enabled) {
    for (let i = 0; i < outBits; i++) {
      outputs[`out-${i}`] = outInactiveVal;
    }
    outputs['out-gs'] = outInactiveVal;
    return { outputs };
  }

  let activeIndex = -1;
  if (config.priorityMode === 'high') {
    for (let i = config.inputCount - 1; i >= 0; i--) {
      const pin = inputPins.find((p) => p.id === `in-${i}`);
      if (pin && pin.value === activeVal) {
        activeIndex = i;
        break;
      }
    }
  } else {
    for (let i = 0; i < config.inputCount; i++) {
      const pin = inputPins.find((p) => p.id === `in-${i}`);
      if (pin && pin.value === activeVal) {
        activeIndex = i;
        break;
      }
    }
  }

  if (activeIndex >= 0) {
    for (let i = 0; i < outBits; i++) {
      const bitOn = ((activeIndex >> i) & 1) === 1;
      outputs[`out-${i}`] = bitOn ? outActiveVal : outInactiveVal;
    }
    outputs['out-gs'] = outActiveVal;
  } else {
    for (let i = 0; i < outBits; i++) {
      outputs[`out-${i}`] = outInactiveVal;
    }
    outputs['out-gs'] = outInactiveVal;
  }

  return { outputs };
}

export function evaluateCfgDecoder(
  inputPins: PinData[],
  config: CfgDecoderConfig
): EvalConfigurableResult {
  const outputs: Record<string, SignalValue> = {};
  const activeVal: SignalValue = config.activeLow ? 0 : 1;
  const outActiveVal: SignalValue = config.activeLow ? 0 : 1;
  const outInactiveVal: SignalValue = config.activeLow ? 1 : 0;

  let enabled = true;
  if (config.enableInput) {
    const enPin = inputPins.find((p) => p.id === 'in-en');
    enabled = enPin ? enPin.value === activeVal : true;
  }

  const outCount = Math.pow(2, config.bitWidth);

  if (!enabled) {
    for (let i = 0; i < outCount; i++) {
      outputs[`out-${i}`] = outInactiveVal;
    }
    return { outputs };
  }

  let address = 0;
  for (let i = 0; i < config.bitWidth; i++) {
    const pin = inputPins.find((p) => p.id === `in-${i}`);
    if (pin && pin.value === 1) {
      address |= 1 << i;
    }
  }

  for (let i = 0; i < outCount; i++) {
    outputs[`out-${i}`] = i === address ? outActiveVal : outInactiveVal;
  }

  return { outputs };
}

export function evaluateCfgMux(
  inputPins: PinData[],
  config: CfgMuxConfig
): EvalConfigurableResult {
  const outputs: Record<string, SignalValue> = {};
  let enabled = true;

  if (config.enableInput) {
    const enPin = inputPins.find((p) => p.id === 'in-en');
    enabled = enPin ? enPin.value === 1 : true;
  }

  const selectCount = Math.max(1, Math.ceil(Math.log2(config.inputCount)));
  let selIndex = 0;
  for (let s = 0; s < selectCount; s++) {
    const sPin = inputPins.find((p) => p.id === `in-sel-${s}`);
    if (sPin && sPin.value === 1) {
      selIndex |= 1 << s;
    }
  }

  if (!enabled || selIndex >= config.inputCount) {
    if (config.dataWidth === 1) {
      outputs['out-0'] = 0;
    } else {
      for (let w = 0; w < config.dataWidth; w++) {
        outputs[`out-${w}`] = 0;
      }
    }
    return { outputs };
  }

  if (config.dataWidth === 1) {
    const inPin = inputPins.find((p) => p.id === `in-data-${selIndex}`);
    outputs['out-0'] = inPin ? (inPin.value === 1 ? 1 : 0) : 0;
  } else {
    for (let w = 0; w < config.dataWidth; w++) {
      const inPin = inputPins.find((p) => p.id === `in-data-${selIndex}-${w}`);
      outputs[`out-${w}`] = inPin ? (inPin.value === 1 ? 1 : 0) : 0;
    }
  }

  return { outputs };
}

export function evaluateCfgDemux(
  inputPins: PinData[],
  config: CfgDemuxConfig
): EvalConfigurableResult {
  const outputs: Record<string, SignalValue> = {};
  let enabled = true;

  if (config.enableInput) {
    const enPin = inputPins.find((p) => p.id === 'in-en');
    enabled = enPin ? enPin.value === 1 : true;
  }

  const selectCount = Math.max(1, Math.ceil(Math.log2(config.outputCount)));
  let selIndex = 0;
  for (let s = 0; s < selectCount; s++) {
    const sPin = inputPins.find((p) => p.id === `in-sel-${s}`);
    if (sPin && sPin.value === 1) {
      selIndex |= 1 << s;
    }
  }

  if (config.dataWidth === 1) {
    const inPin = inputPins.find((p) => p.id === 'in-data-0');
    const inVal: SignalValue = enabled && inPin && inPin.value === 1 ? 1 : 0;

    for (let c = 0; c < config.outputCount; c++) {
      outputs[`out-data-${c}`] = c === selIndex ? inVal : 0;
    }
  } else {
    for (let c = 0; c < config.outputCount; c++) {
      for (let w = 0; w < config.dataWidth; w++) {
        const inPin = inputPins.find((p) => p.id === `in-data-${w}`);
        const inVal: SignalValue = enabled && c === selIndex && inPin && inPin.value === 1 ? 1 : 0;
        outputs[`out-data-${c}-${w}`] = inVal;
      }
    }
  }

  return { outputs };
}

export function evaluateCfgComparator(
  inputPins: PinData[],
  config: CfgComparatorConfig
): EvalConfigurableResult {
  let valA = 0;
  let valB = 0;

  for (let i = 0; i < config.bitWidth; i++) {
    const aPin = inputPins.find((p) => p.id === `in-a-${i}`);
    if (aPin && aPin.value === 1) valA |= 1 << i;

    const bPin = inputPins.find((p) => p.id === `in-b-${i}`);
    if (bPin && bPin.value === 1) valB |= 1 << i;
  }

  return {
    outputs: {
      'out-gt': valA > valB ? 1 : 0,
      'out-eq': valA === valB ? 1 : 0,
      'out-lt': valA < valB ? 1 : 0,
    },
  };
}

export function evaluateCfgRegister(
  inputPins: PinData[],
  config: CfgRegisterConfig,
  state: Record<string, any>
): EvalConfigurableResult {
  const clkPin = inputPins.find((p) => p.id === 'in-clk');
  const clkVal = clkPin ? (clkPin.value === 1 ? 1 : 0) : 0;
  const prevClk = state.prevClk ?? 0;

  let qValues: number[] = state.qValues
    ? [...state.qValues]
    : Array.from({ length: config.bitWidth }, (_, i) => ((config.initialValue >> i) & 1));

  // Truncate or expand state to match bitWidth
  if (qValues.length !== config.bitWidth) {
    qValues = Array.from({ length: config.bitWidth }, (_, i) => (qValues[i] ?? 0));
  }

  const clkEdge = config.clockEdge === 'rising' ? prevClk === 0 && clkVal === 1 : prevClk === 1 && clkVal === 0;

  const clrPin = inputPins.find((p) => p.id === 'in-clr');
  const isClr = config.reset && clrPin && clrPin.value === 1;

  const enPin = inputPins.find((p) => p.id === 'in-en');
  const isEnabled = !config.enable || (enPin && enPin.value === 1);

  if (isClr) {
    qValues = Array.from({ length: config.bitWidth }, (_, i) => ((config.initialValue >> i) & 1));
  } else if (clkEdge && isEnabled) {
    for (let i = 0; i < config.bitWidth; i++) {
      const dPin = inputPins.find((p) => p.id === `in-d-${i}`);
      qValues[i] = dPin && dPin.value === 1 ? 1 : 0;
    }
  }

  const outputs: Record<string, SignalValue> = {};
  for (let i = 0; i < config.bitWidth; i++) {
    outputs[`out-q-${i}`] = (qValues[i] ?? 0) === 1 ? 1 : 0;
  }

  return {
    outputs,
    newState: { prevClk: clkVal, qValues },
  };
}

export function evaluateCfgShiftRegister(
  inputPins: PinData[],
  config: CfgShiftRegisterConfig,
  state: Record<string, any>
): EvalConfigurableResult {
  const clkPin = inputPins.find((p) => p.id === 'in-clk');
  const clkVal = clkPin ? (clkPin.value === 1 ? 1 : 0) : 0;
  const prevClk = state.prevClk ?? 0;

  let qValues: number[] = state.qValues
    ? [...state.qValues]
    : Array(config.bitWidth).fill(0);

  if (qValues.length !== config.bitWidth) {
    qValues = Array.from({ length: config.bitWidth }, (_, i) => (qValues[i] ?? 0));
  }

  const isRisingEdge = prevClk === 0 && clkVal === 1;

  const clrPin = inputPins.find((p) => p.id === 'in-clr');
  const isClr = clrPin && clrPin.value === 1;

  const loadPin = inputPins.find((p) => p.id === 'in-load');
  const isLoad = config.parallelLoad && loadPin && loadPin.value === 1;

  const siPin = inputPins.find((p) => p.id === 'in-si');
  const siVal = config.serialInput && siPin && siPin.value === 1 ? 1 : 0;

  let serialOut: SignalValue = 0;

  if (isClr) {
    qValues = Array(config.bitWidth).fill(0);
    serialOut = 0;
  } else if (isRisingEdge) {
    if (isLoad) {
      for (let i = 0; i < config.bitWidth; i++) {
        const dPin = inputPins.find((p) => p.id === `in-d-${i}`);
        qValues[i] = dPin && dPin.value === 1 ? 1 : 0;
      }
      serialOut = config.shiftDirection === 'right' ? (qValues[0] as SignalValue) : (qValues[config.bitWidth - 1] as SignalValue);
    } else {
      if (config.shiftDirection === 'right') {
        serialOut = qValues[0] as SignalValue;
        for (let i = 0; i < config.bitWidth - 1; i++) {
          qValues[i] = qValues[i + 1];
        }
        qValues[config.bitWidth - 1] = siVal;
      } else {
        serialOut = qValues[config.bitWidth - 1] as SignalValue;
        for (let i = config.bitWidth - 1; i > 0; i--) {
          qValues[i] = qValues[i - 1];
        }
        qValues[0] = siVal;
      }
    }
  } else {
    serialOut = config.shiftDirection === 'right' ? (qValues[0] as SignalValue) : (qValues[config.bitWidth - 1] as SignalValue);
  }

  const outputs: Record<string, SignalValue> = {};
  for (let i = 0; i < config.bitWidth; i++) {
    outputs[`out-q-${i}`] = (qValues[i] ?? 0) === 1 ? 1 : 0;
  }
  outputs['out-so'] = serialOut;

  return {
    outputs,
    newState: { prevClk: clkVal, qValues },
  };
}

export function evaluateCfgCounter(
  inputPins: PinData[],
  config: CfgCounterConfig,
  state: Record<string, any>
): EvalConfigurableResult {
  const clkPin = inputPins.find((p) => p.id === 'in-clk');
  const clkVal = clkPin ? (clkPin.value === 1 ? 1 : 0) : 0;
  const prevClk = state.prevClk ?? 0;
  const isRisingEdge = prevClk === 0 && clkVal === 1;

  const maxVal = Math.pow(2, config.bitWidth);
  const limit = config.modulo > 0 ? Math.min(config.modulo, maxVal) : maxVal;

  let count = state.count ?? 0;

  const clrPin = inputPins.find((p) => p.id === 'in-clr');
  const isClr = config.reset && clrPin && clrPin.value === 1;

  const enPin = inputPins.find((p) => p.id === 'in-en');
  const isEnabled = !config.enable || (enPin && enPin.value === 1);

  const upDownPin = inputPins.find((p) => p.id === 'in-updown');
  const isUp = config.mode === 'up' || (config.mode === 'up_down' && (!upDownPin || upDownPin.value === 1));

  if (isClr) {
    count = 0;
  } else if (isRisingEdge && isEnabled) {
    if (isUp) {
      count = (count + 1) % limit;
    } else {
      count = (count - 1 + limit) % limit;
    }
  }

  const outputs: Record<string, SignalValue> = {};
  for (let i = 0; i < config.bitWidth; i++) {
    const bitVal = ((count >> i) & 1) === 1 ? 1 : 0;
    outputs[`out-q-${i}`] = bitVal;
  }

  const isTerminalCount = isUp ? count === limit - 1 : count === 0;
  outputs['out-tc'] = isTerminalCount && isEnabled ? 1 : 0;

  return {
    outputs,
    newState: { prevClk: clkVal, count },
  };
}

export function evaluateCfgConstant(
  config: CfgConstantConfig
): EvalConfigurableResult {
  const outputs: Record<string, SignalValue> = {};
  for (let i = 0; i < config.bitWidth; i++) {
    const bitVal = ((config.value >> i) & 1) === 1 ? 1 : 0;
    outputs[`out-${i}`] = bitVal;
  }
  return { outputs };
}

export function evaluateCfgBusSplitter(
  inputPins: PinData[],
  config: CfgBusSplitterConfig
): EvalConfigurableResult {
  const outputs: Record<string, SignalValue> = {};
  for (let i = 0; i < config.inputWidth; i++) {
    const inPin = inputPins.find((p) => p.id === `in-${i}`);
    outputs[`out-${i}`] = inPin ? (inPin.value === 1 ? 1 : 0) : 0;
  }
  return { outputs };
}

export function evaluateCfgBusJoiner(
  inputPins: PinData[],
  config: CfgBusJoinerConfig
): EvalConfigurableResult {
  const outputs: Record<string, SignalValue> = {};
  for (let i = 0; i < config.inputCount; i++) {
    const inPin = inputPins.find((p) => p.id === `in-${i}`);
    outputs[`out-${i}`] = inPin ? (inPin.value === 1 ? 1 : 0) : 0;
  }
  return { outputs };
}
