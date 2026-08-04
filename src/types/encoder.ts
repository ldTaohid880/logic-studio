export type EncoderInputCount = 4 | 8 | 16 | 32;
export type EncoderActiveMode = 'high' | 'low';
export type EncoderPriorityDirection = 'highest' | 'lowest';
export type EncoderOutputFormat = 'binary' | 'decimal' | 'binary_decimal';

export interface EncoderConfig {
  inputs: EncoderInputCount;
  inputActiveMode: EncoderActiveMode;
  outputActiveMode: EncoderActiveMode;
  activeMode?: EncoderActiveMode; // Fallback for legacy configurations
  priority: boolean;
  priorityDirection: EncoderPriorityDirection;
  showValid: boolean;
  showEnableOutput: boolean;
  showGroupSignal: boolean;
  showEnableInput: boolean;
  enableInputActiveMode: EncoderActiveMode;
  outputFormat: EncoderOutputFormat;
  showTruthTable: boolean;
  animateActiveSignals: boolean;
}

export interface EncoderState {
  activeIndex: number | null;
  activeInputsIndices: number[];
  binaryVal: string;       // Binary representation on output pins (reflects outputActiveMode)
  rawBinaryVal: string;    // Internal binary index (e.g., '101' for index 5)
  decimalVal: number;
  valid: boolean;
  eo: boolean;
  gs: boolean;
  error?: string;
  warning?: string;
}

export const DEFAULT_ENCODER_CONFIG: EncoderConfig = {
  inputs: 8,
  inputActiveMode: 'high',
  outputActiveMode: 'high',
  activeMode: 'high',
  priority: false,
  priorityDirection: 'highest',
  showValid: true,
  showEnableOutput: true,
  showGroupSignal: false,
  showEnableInput: true,
  enableInputActiveMode: 'low',
  outputFormat: 'binary_decimal',
  showTruthTable: true,
  animateActiveSignals: true,
};
