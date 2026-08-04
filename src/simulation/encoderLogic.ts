import { SignalValue } from '../types/circuit';
import { EncoderConfig, EncoderState } from '../types/encoder';

export interface EvaluatedEncoderResult {
  state: EncoderState;
  outputPinValues: Record<string, SignalValue>;
}

export function evaluateEncoder(
  inputs: SignalValue[],
  config: EncoderConfig
): EvaluatedEncoderResult {
  const numInputs = config.inputs;
  const numBinaryOutputs = Math.log2(numInputs);
  const isInputActiveHigh = (config.inputActiveMode ?? config.activeMode ?? 'high') === 'high';
  const isOutputActiveHigh = (config.outputActiveMode ?? config.activeMode ?? 'high') === 'high';

  // 1. Determine active inputs using Input Logic
  const activeIndices: number[] = [];
  inputs.forEach((val, idx) => {
    if (idx >= numInputs) return;
    if (isInputActiveHigh) {
      if (val === 1) activeIndices.push(idx);
    } else {
      // Active Low: active when signal is 0
      if (val === 0) activeIndices.push(idx);
    }
  });

  let activeIndex: number | null = null;
  let error: string | undefined = undefined;
  let warning: string | undefined = undefined;
  let valid = false;
  let eo = true; // Enable Output is HIGH when no active input is present
  let gs = false; // Group Signal is HIGH when an active input is present

  if (config.priority) {
    // 2. Resolve priority (if enabled)
    if (activeIndices.length > 0) {
      if (config.priorityDirection === 'highest') {
        activeIndex = Math.max(...activeIndices);
      } else {
        activeIndex = Math.min(...activeIndices);
      }
      valid = true;
      eo = false;
      gs = true;
    } else {
      activeIndex = null;
      valid = false;
      eo = true;
      gs = false;
      warning = 'No active input detected.';
    }
  } else {
    // Non-Priority Mode (Standard Encoder)
    if (activeIndices.length === 0) {
      activeIndex = null;
      valid = false;
      eo = true;
      gs = false;
      warning = 'No active input detected.';
    } else if (activeIndices.length === 1) {
      activeIndex = activeIndices[0];
      valid = true;
      eo = false;
      gs = true;
    } else {
      // Error: multiple inputs active in non-priority mode
      error = 'Standard Encoder expects exactly one active input.';
      activeIndex = null;
      valid = false;
      eo = false;
      gs = false;
    }
  }

  // 3. Calculate binary index & 4. Apply Output Logic (invert outputs if Active Low)
  const outputPinValues: Record<string, SignalValue> = {};
  let rawBinaryVal = '';
  let binaryVal = '';
  let decimalVal = 0;

  if (activeIndex !== null && !error) {
    decimalVal = activeIndex;
    rawBinaryVal = activeIndex.toString(2).padStart(numBinaryOutputs, '0');

    // Compute pins A0..A{M-1}
    for (let i = 0; i < numBinaryOutputs; i++) {
      const bitIndexFromRight = i;
      const rawBit = (activeIndex >> bitIndexFromRight) & 1;
      const outBit = isOutputActiveHigh ? rawBit : (1 - rawBit);
      const pinId = `out-A${i}`;
      outputPinValues[pinId] = outBit as SignalValue;
    }

    // Binary string from MSB down to LSB
    const bits: string[] = [];
    for (let i = numBinaryOutputs - 1; i >= 0; i--) {
      const pinId = `out-A${i}`;
      bits.push(String(outputPinValues[pinId]));
    }
    binaryVal = bits.join('');
  } else {
    rawBinaryVal = '0'.repeat(numBinaryOutputs);
    decimalVal = 0;
    const defaultIdleBit = isOutputActiveHigh ? 0 : 1;
    const bits: string[] = [];
    for (let i = 0; i < numBinaryOutputs; i++) {
      const pinId = `out-A${i}`;
      const val = error ? -1 : defaultIdleBit;
      outputPinValues[pinId] = val as SignalValue;
    }
    for (let i = numBinaryOutputs - 1; i >= 0; i--) {
      const pinId = `out-A${i}`;
      const pVal = outputPinValues[pinId];
      bits.push(pVal === -1 ? 'X' : String(pVal));
    }
    binaryVal = error ? 'INVALID' : bits.join('');
  }

  // 5. Update optional output pins
  if (config.showValid) {
    outputPinValues['out-V'] = valid ? 1 : 0;
  }
  if (config.showEnableOutput) {
    outputPinValues['out-EO'] = eo ? 1 : 0;
  }
  if (config.showGroupSignal) {
    outputPinValues['out-GS'] = gs ? 1 : 0;
  }

  const state: EncoderState = {
    activeIndex,
    activeInputsIndices: activeIndices,
    binaryVal,
    rawBinaryVal,
    decimalVal,
    valid,
    eo,
    gs,
    error,
    warning,
  };

  return { state, outputPinValues };
}
