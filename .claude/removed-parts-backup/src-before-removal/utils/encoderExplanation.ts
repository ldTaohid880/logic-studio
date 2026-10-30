import { EncoderConfig, EncoderState } from '../types/encoder';

export interface EncoderExplanationData {
  componentName: string;
  inputModeText: string;
  outputModeText: string;
  priorityText: string;
  activeInputText: string;
  inputMeaningText: string;
  binaryIndexText: string;
  outputLogicText: string;
  finalOutputText: string;
  explanation: string;
  statusType: 'success' | 'warning' | 'error' | 'idle';
}

export function getEncoderExplanation(
  config: EncoderConfig,
  state?: EncoderState
): EncoderExplanationData {
  const isInputActiveHigh = (config.inputActiveMode ?? config.activeMode ?? 'high') === 'high';
  const isOutputActiveHigh = (config.outputActiveMode ?? config.activeMode ?? 'high') === 'high';

  const inputModeText = isInputActiveHigh ? 'Active High' : 'Active Low';
  const outputModeText = isOutputActiveHigh ? 'Active High' : 'Active Low';
  const priorityText = config.priority
    ? `Enabled (${config.priorityDirection === 'highest' ? 'Highest First' : 'Lowest First'})`
    : 'Disabled (Standard)';

  if (!state) {
    return {
      componentName: 'Encoder',
      inputModeText,
      outputModeText,
      priorityText,
      activeInputText: 'None',
      inputMeaningText: 'No inputs connected or toggled yet.',
      binaryIndexText: '000',
      outputLogicText: outputModeText,
      finalOutputText: isOutputActiveHigh ? '000' : '111',
      explanation: 'Connect signals or manually toggle input pins to see live encoding.',
      statusType: 'idle',
    };
  }

  const { activeIndex, activeInputsIndices, binaryVal, rawBinaryVal, decimalVal, error, warning } = state;

  if (error) {
    const activeList = activeInputsIndices.map((i) => `D${i}`).join(', ');
    return {
      componentName: 'Encoder',
      inputModeText,
      outputModeText,
      priorityText,
      activeInputText: `Multiple (${activeList})`,
      inputMeaningText: `Conflict: ${activeInputsIndices.length} inputs are active simultaneously in ${inputModeText} mode.`,
      binaryIndexText: 'N/A',
      outputLogicText: outputModeText,
      finalOutputText: 'INVALID',
      explanation: 'Standard Encoder expects exactly one active input. Multiple active inputs cause a signal conflict. Enable Priority Mode to automatically select according to priority direction.',
      statusType: 'error',
    };
  }

  if (activeIndex === null) {
    return {
      componentName: 'Encoder',
      inputModeText,
      outputModeText,
      priorityText,
      activeInputText: 'None',
      inputMeaningText: `No inputs meet the ${inputModeText} active condition (${isInputActiveHigh ? 'HIGH / 1' : 'LOW / 0'}).`,
      binaryIndexText: '000',
      outputLogicText: outputModeText,
      finalOutputText: binaryVal,
      explanation: `No active input detected. Output pins remain at their default idle state (${isOutputActiveHigh ? '000 in Active High' : '111 in Active Low'}).`,
      statusType: 'warning',
    };
  }

  const activePinLabel = `D${activeIndex}`;
  const inputMeaningText = `${activePinLabel} is active because its signal value is ${isInputActiveHigh ? 'HIGH (1)' : 'LOW (0)'}.`;
  const binaryIndexText = `${rawBinaryVal} (${decimalVal})`;
  const finalOutputText = binaryVal;

  let explanationText = '';
  if (!isOutputActiveHigh) {
    explanationText = `The binary value remains ${decimalVal} (${rawBinaryVal}) internally, while the output pins are inverted to ${binaryVal} because Output Logic is configured as Active Low.`;
  } else {
    explanationText = `The binary value ${decimalVal} (${rawBinaryVal}) is directly driven onto the output pins as ${binaryVal} because Output Logic is configured as Active High.`;
  }

  if (config.priority && activeInputsIndices.length > 1) {
    const dir = config.priorityDirection === 'highest' ? 'highest-priority' : 'lowest-priority';
    const activeList = activeInputsIndices.map((i) => `D${i}`).join(', ');
    explanationText = `Multiple inputs active (${activeList}). Priority Mode resolved ${activePinLabel} as the ${dir} active input. ${explanationText}`;
  }

  return {
    componentName: config.priority ? 'Priority Encoder' : 'Encoder',
    inputModeText,
    outputModeText,
    priorityText,
    activeInputText: config.priority && activeInputsIndices.length > 1
      ? `${activePinLabel} (out of ${activeInputsIndices.map((i) => `D${i}`).join(', ')})`
      : activePinLabel,
    inputMeaningText,
    binaryIndexText,
    outputLogicText: outputModeText,
    finalOutputText,
    explanation: explanationText,
    statusType: 'success',
  };
}
