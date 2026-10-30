import { SignalValue } from './circuit';

export interface MultiInputConfig {
  inputCount: number; // 1 to 32
  values: SignalValue[];
  labels: string[];
}

export const DEFAULT_MULTI_INPUT_CONFIG: MultiInputConfig = {
  inputCount: 4,
  values: [0, 0, 0, 0],
  labels: ['A', 'B', 'C', 'D'],
};

/**
 * Generates default labels for N inputs.
 * For 1..26: A, B, C, D...
 * Beyond 26: In 1, In 2...
 */
export function generateInputLabels(count: number): string[] {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const labels: string[] = [];
  for (let i = 0; i < count; i++) {
    if (count <= 26) {
      labels.push(alphabet[i]);
    } else {
      labels.push(`In ${i + 1}`);
    }
  }
  return labels;
}
