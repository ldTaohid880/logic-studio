import { GateType, SignalValue } from '../../types/circuit';
import { buildGateTruthTable } from '../../utils/gateTruthTable';
import { evaluateIC, getDefaultICPins, MEMORY_GATE_TYPES } from '../../simulation/icLogic';
import { IC_GATE_TYPES } from '../../simulation/engine';

/** Largest number of inputs listed row by row; wider parts get a table of example rows. */
export const MAX_FULL_INPUTS = 6;

export interface FunctionRow {
  key: string;
  index: number;
  inputs: string[];
  outputs: string[];
  label?: string;
}

export interface FunctionTableData {
  inputHeaders: string[];
  outputHeaders: string[];
  rows: FunctionRow[];
  /** True when only example rows are listed. */
  condensed: boolean;
  note?: string;
}

const GATE_TABLE_TYPES = new Set<GateType>(['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR', 'NOT', 'BUFFER', 'HALF_ADDER', 'FULL_ADDER']);

const level = (v: SignalValue | undefined) => (v === 1 ? '1' : v === 0 ? '0' : 'Z');
const bits = (value: number, n: number) => Array.from({ length: n }, (_, i) => (value >> i) & 1);
const bin = (value: number, n: number) => value.toString(2).padStart(n, '0');

/** Evaluates a combinational chip once; every output comes from the simulation itself. */
function run(type: GateType, pins: number[]): Record<string, SignalValue> {
  return evaluateIC(type, pins as SignalValue[], {}).outputs;
}

interface WideSpec {
  inputHeaders: string[];
  outputHeaders: string[];
  /** Example cases: the cells to print and the matching pin levels in pin order. */
  cases: { cells: string[]; pins: number[] }[];
  /** Turns the evaluated outputs into cells. */
  show: (out: Record<string, SignalValue>) => string[];
  note: string;
}

const outBits = (out: Record<string, SignalValue>, first: number, count: number) =>
  Array.from({ length: count }, (_, i) => (out[`out-${first + i}`] === 1 ? 1 << i : 0)).reduce((a, b) => a + b, 0);

function muxSpec(dataCount: number, selBits: number): WideSpec {
  const cases: WideSpec['cases'] = [];
  for (let sel = 0; sel < dataCount; sel++) {
    for (const data of [1 << sel, ((1 << dataCount) - 1) & ~(1 << sel)]) {
      cases.push({ cells: [bin(data, dataCount), String(sel), '1'], pins: [...bits(data, dataCount), ...bits(sel, selBits).reverse(), 1] });
    }
  }
  cases.push({ cells: [bin(1, dataCount), '0', '0'], pins: [...bits(1, dataCount), ...bits(0, selBits), 0] });
  return {
    inputHeaders: [`Data (I${dataCount - 1}…I0)`, 'Select', 'EN'], outputHeaders: ['Y'], cases,
    show: (o) => [level(o['out-0'])],
    note: 'Select is the number of the input to pass (S as a binary number). Each select value is shown with its input high and the others low, then the other way round.',
  };
}

const WIDE: Partial<Record<GateType, WideSpec>> = {
  MUX_4TO1: muxSpec(4, 2),
  MUX_8TO1: muxSpec(8, 3),
  ENCODER_8TO3: {
    inputHeaders: ['Active inputs (I7…I0)'], outputHeaders: ['Code Y2 Y1 Y0', 'V'],
    cases: [0b00000000, 0b00000001, 0b00000010, 0b00000100, 0b00001000, 0b00010000, 0b00100000, 0b01000000, 0b10000000, 0b00100100, 0b01001010, 0b10000001].map((v) => ({ cells: [bin(v, 8)], pins: bits(v, 8) })),
    show: (o) => [`${o['out-0']}${o['out-1']}${o['out-2']}`, level(o['out-3'])],
    note: 'When several inputs are active, the highest-numbered one decides the code.',
  },
  COMPARATOR_4BIT: {
    inputHeaders: ['A', 'B'], outputHeaders: ['A > B', 'A = B', 'A < B'],
    cases: [[0, 0], [5, 5], [9, 3], [3, 9], [15, 0], [0, 15], [7, 8], [8, 7]].map(([a, b]) => ({ cells: [String(a), String(b)], pins: [...bits(a, 4), ...bits(b, 4)] })),
    show: (o) => [level(o['out-0']), level(o['out-1']), level(o['out-2'])],
    note: 'A and B are 4-bit numbers from 0 to 15.',
  },
  ADDER_4BIT: {
    inputHeaders: ['A', 'B', 'Cin'], outputHeaders: ['Sum', 'Cout'],
    cases: [[0, 0, 0], [1, 1, 0], [5, 3, 0], [7, 8, 0], [9, 6, 1], [15, 1, 0], [15, 15, 1], [8, 8, 0]].map(([a, b, c]) => ({ cells: [String(a), String(b), String(c)], pins: [...bits(a, 4), ...bits(b, 4), c] })),
    show: (o) => [String(outBits(o, 0, 4)), level(o['out-4'])],
    note: 'A, B and Sum are 4-bit numbers (0 to 15). The true result is Cout × 16 + Sum.',
  },
  ADDER_SUBTRACTOR_4BIT: {
    inputHeaders: ['A', 'B', 'SUB'], outputHeaders: ['Result', 'Cout'],
    cases: [[9, 3, 0], [9, 3, 1], [3, 9, 1], [5, 5, 1], [15, 1, 0], [0, 1, 1]].map(([a, b, s]) => ({ cells: [String(a), String(b), String(s)], pins: [...bits(a, 4), ...bits(b, 4), s] })),
    show: (o) => [String(outBits(o, 0, 4)), level(o['out-4'])],
    note: 'With SUB = 1 the part computes A − B in two\'s complement: Cout = 1 means no borrow was needed.',
  },
  ALU_4BIT_8FN: {
    inputHeaders: ['A', 'B', 'S2 S1 S0'], outputHeaders: ['F', 'C', 'Z'],
    cases: [
      ...Array.from({ length: 8 }, (_, op) => ({ cells: ['6', '3', bin(op, 3)], pins: [...bits(6, 4), ...bits(3, 4), ...bits(op, 3)] })),
      { cells: ['15', '1', '000'], pins: [...bits(15, 4), ...bits(1, 4), 0, 0, 0] },
      { cells: ['2', '5', '001'], pins: [...bits(2, 4), ...bits(5, 4), 1, 0, 0] },
      { cells: ['5', '5', '001'], pins: [...bits(5, 4), ...bits(5, 4), 1, 0, 0] },
    ],
    show: (o) => [String(outBits(o, 0, 4)), level(o['out-4']), level(o['out-5'])],
    note: 'Operations by S2 S1 S0: 000 A + B, 001 A − B, 010 AND, 011 OR, 100 XOR, 101 NOT A, 110 A + 1, 111 A − 1. C is the carry or borrow, Z says the result is zero.',
  },
};

function triStateTable(): FunctionTableData {
  const rows: FunctionRow[] = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([inp, en], i) => ({
    key: `r${i}`, index: i, inputs: [String(inp), String(en)], outputs: [en === 1 ? String(inp) : 'Z'],
  }));
  return { inputHeaders: ['In', 'EN'], outputHeaders: ['Out'], rows, condensed: false, note: 'Z = output off (floating).' };
}

/**
 * Function table of a part, made by running the simulation, so it cannot drift from the part's behaviour.
 * Returns null for parts without one (sources, displays, memory parts, which have a mode table instead).
 */
export function buildFunctionTable(type: GateType): FunctionTableData | null {
  if (type === 'TRI_STATE_BUFFER') return triStateTable();

  if (GATE_TABLE_TYPES.has(type)) {
    const count = type === 'NOT' || type === 'BUFFER' ? 1 : type === 'FULL_ADDER' ? 3 : 2;
    const t = buildGateTruthTable(type, count);
    return {
      inputHeaders: t.inputHeaders,
      outputHeaders: t.outputHeaders,
      rows: t.rows.map((r) => ({ key: r.key, index: r.index, inputs: r.inputs.map(String), outputs: r.outputs.map(String) })),
      condensed: false,
    };
  }

  if (MEMORY_GATE_TYPES.has(type) || !IC_GATE_TYPES.has(type)) return null;
  const pins = getDefaultICPins(type);
  if (pins.inputs.length === 0 || pins.outputs.length === 0) return null;
  if (type === 'DELAY_ELEMENT') return null;

  const wide = WIDE[type];
  if (wide) {
    return {
      inputHeaders: wide.inputHeaders,
      outputHeaders: wide.outputHeaders,
      rows: wide.cases.map((c, i) => ({ key: `r${i}`, index: i, inputs: c.cells, outputs: wide.show(run(type, c.pins)) })),
      condensed: true,
      note: wide.note,
    };
  }

  const n = pins.inputs.length;
  if (n > MAX_FULL_INPUTS) return null;
  const rows: FunctionRow[] = Array.from({ length: 2 ** n }, (_, i) => {
    const inputs = Array.from({ length: n }, (_, bit) => (i >> (n - 1 - bit)) & 1);
    const out = run(type, inputs);
    return { key: `r${i}`, index: i, inputs: inputs.map(String), outputs: pins.outputs.map((_, k) => level(out[`out-${k}`])) };
  });
  return {
    inputHeaders: pins.inputs.map((p) => p.name),
    outputHeaders: pins.outputs.map((p) => p.name),
    rows,
    condensed: false,
    note: type === 'ROM_16X4' ? 'Shows a new ROM, where each address holds its own number. You can change the contents in the properties panel.' : undefined,
  };
}
