import { GateType, SignalValue } from '../types/circuit';
import { evaluateGate } from './gateLogic';

export interface GateTableRow {
  key: string;
  /** Minterm index: inputs read MSB-first (A is the most significant). */
  index: number;
  inputs: number[];
  outputs: number[];
  isActive: boolean;
}

export interface GateTable {
  inputHeaders: string[];
  outputHeaders: string[];
  rows: GateTableRow[];
}

const LETTERS = ['A', 'B', 'C', 'D'];

/** Parts whose behaviour fits a small truth table (shown in the properties panel). */
export const TRUTH_TABLE_PARTS = new Set<GateType>([
  'AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER', 'HALF_ADDER', 'FULL_ADDER',
]);

/**
 * Truth table for a gate or 1-bit adder. `live` holds the current pin levels; the row that
 * matches them is marked active (only when every input is 0 or 1).
 */
export function buildGateTruthTable(gateType: GateType, inputCount: number, live?: SignalValue[], names?: string[]): GateTable {
  const isHalfAdder = gateType === 'HALF_ADDER';
  const isFullAdder = gateType === 'FULL_ADDER';
  const count = isHalfAdder ? 2 : isFullAdder ? 3 : Math.max(1, inputCount);
  const liveKnown = !!live && live.length >= count && live.slice(0, count).every((v) => v === 0 || v === 1);

  const rows: GateTableRow[] = Array.from({ length: 2 ** count }, (_, i) => {
    const inputs = Array.from({ length: count }, (_, bit) => (i >> (count - 1 - bit)) & 1);
    let outputs: number[];
    if (isHalfAdder) {
      const [a, b] = inputs;
      outputs = [a ^ b, a & b];
    } else if (isFullAdder) {
      const [a, b, cin] = inputs;
      outputs = [a ^ b ^ cin, (a & b) | (cin & (a ^ b))];
    } else {
      outputs = [evaluateGate(gateType, inputs as SignalValue[]) === 1 ? 1 : 0];
    }
    return {
      key: `r${i}`,
      index: i,
      inputs,
      outputs,
      isActive: liveKnown && inputs.every((v, idx) => v === live![idx]),
    };
  });

  const defaultNames = isHalfAdder ? ['A', 'B'] : isFullAdder ? ['A', 'B', 'Cin'] : LETTERS.slice(0, count);
  return {
    inputHeaders: defaultNames.map((n, i) => names?.[i] || n),
    outputHeaders: isHalfAdder || isFullAdder ? ['Sum', 'Cout'] : ['Y'],
    rows,
  };
}
