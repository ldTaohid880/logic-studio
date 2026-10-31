import { Node, Edge } from '@xyflow/react';
import { NodeData, SignalValue } from '../types/circuit';
import { propagateSignals } from '../simulation/engine';
import { CustomComponentDefinition } from '../types/customComponent';
import { getComponentInfo } from '../data/components';

/** More inputs than this would make a table too long to read (2^10 = 1024 rows). */
export const MAX_TABLE_INPUTS = 10;

export type TableColumnKind = 'input' | 'internal' | 'output';

export interface TableColumn {
  id: string;
  label: string;
  kind: TableColumnKind;
  nodeId: string;
  /** Output pin read for internal/fallback columns, or the display input pin for 7-segment columns. */
  pinId?: string;
  /** DIP switch bit for input columns. */
  bit?: number;
  /** 'hex' reads a 4-bit display (D0 = least significant) as one digit. */
  format: 'bit' | 'hex';
}

export interface CircuitTableModel {
  inputs: TableColumn[];
  internal: TableColumn[];
  outputs: TableColumn[];
  /** Memory parts or feedback loops: a row's result can depend on what happened before. */
  isSequential: boolean;
  /** No LEDs or displays: the table falls back to gate outputs that aren't wired anywhere. */
  usesFallbackOutputs: boolean;
}

export type CellValue = SignalValue | string;

export interface CircuitTableRow {
  /** Row number; the first input column is the most significant bit. */
  index: number;
  inputs: SignalValue[];
  internal: CellValue[];
  outputs: CellValue[];
  /** The circuit didn't settle for this combination. */
  unstable: boolean;
}

/** Where each row's memory (latches, flip-flops, feedback loops) starts. */
export type MemoryStart = 'reset' | 'canvas';

const SOURCE_TYPES = new Set(['INPUT', 'PUSH_BUTTON', 'DIP_SWITCH', 'CONST_HIGH', 'CONST_LOW']);
const MEMORY_TYPES = new Set(['D_LATCH', 'JK_FLIPFLOP', 'T_FLIPFLOP', 'REGISTER_4BIT', 'DELAY_ELEMENT']);
const LED_TYPES = new Set(['OUTPUT', 'LOGIC_PROBE']);
const HEX_TYPES = new Set(['HEX_DISPLAY', 'BUS_MONITOR']);

const dataOf = (n: Node) => n.data as unknown as NodeData;

// Reading order on the canvas: top to bottom, then left to right
const byPosition = (a: Node, b: Node) => a.position.y - b.position.y || a.position.x - b.position.x;

/** Feedback loop in the wiring (tunnels count as wires between matching labels). */
function hasFeedbackLoop(nodes: Node[], edges: Edge[]): boolean {
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => adj.get(e.source)?.push(e.target));

  const tunnels = new Map<string, { drivers: string[]; readers: string[] }>();
  const wiredInputs = new Set(edges.map((e) => e.target));
  nodes.forEach((n) => {
    const d = dataOf(n);
    if (d.gateType !== 'TUNNEL' || !d.tunnelLabel) return;
    const key = d.tunnelLabel.toUpperCase();
    const entry = tunnels.get(key) ?? { drivers: [], readers: [] };
    (wiredInputs.has(n.id) ? entry.drivers : entry.readers).push(n.id);
    tunnels.set(key, entry);
  });
  tunnels.forEach(({ drivers, readers }) => drivers.forEach((dr) => adj.get(dr)?.push(...readers)));

  const state = new Map<string, number>(); // 1 = on the current path, 2 = done
  const visit = (id: string): boolean => {
    state.set(id, 1);
    for (const next of adj.get(id) ?? []) {
      const s = state.get(next) ?? 0;
      if (s === 1 || (s === 0 && visit(next))) return true;
    }
    state.set(id, 2);
    return false;
  };
  return nodes.some((n) => !state.has(n.id) && visit(n.id));
}

/** Works out which switches are the table's inputs and which LEDs, displays and gates it reports. */
export function describeCircuitForTable(nodes: Node[], edges: Edge[]): CircuitTableModel {
  const parts = nodes.filter((n) => n.type !== 'groupNode' && typeof dataOf(n)?.gateType === 'string').sort(byPosition);
  const wiredOutputs = new Set(edges.map((e) => `${e.source}|${e.sourceHandle || 'out-0'}`));
  const wiredInputs = new Set(edges.map((e) => `${e.target}|${e.targetHandle || 'in-0'}`));

  // Gates without a custom name get numbered per type: "AND 1", "AND 2"
  const typeCounters = new Map<string, number>();
  const partName = (n: Node) => {
    const d = dataOf(n);
    const count = (typeCounters.get(d.gateType) ?? 0) + 1;
    typeCounters.set(d.gateType, count);
    if (d.label && d.label !== d.gateType) return d.label;
    return `${getComponentInfo(d.gateType).name} ${count}`;
  };

  const inputs: TableColumn[] = [];
  const internal: TableColumn[] = [];
  const outputs: TableColumn[] = [];
  const unwiredGateOutputs: TableColumn[] = [];

  parts.forEach((n) => {
    const d = dataOf(n);
    const name = partName(n);

    if (d.gateType === 'INPUT' || d.gateType === 'PUSH_BUTTON') {
      inputs.push({ id: n.id, label: name, kind: 'input', nodeId: n.id, format: 'bit' });
    } else if (d.gateType === 'DIP_SWITCH') {
      const width = d.dipValues?.length || d.bitWidth || 4;
      const prefix = d.label || 'SW';
      for (let bit = 0; bit < width; bit++) {
        if (!wiredOutputs.has(`${n.id}|${d.outputs[bit]?.id ?? `out-${bit}`}`)) continue;
        inputs.push({ id: `${n.id}|${bit}`, label: `${prefix}${bit + 1}`, kind: 'input', nodeId: n.id, bit, format: 'bit' });
      }
    } else if (LED_TYPES.has(d.gateType)) {
      if (wiredInputs.has(`${n.id}|${d.inputs[0]?.id ?? 'in-0'}`)) {
        outputs.push({ id: n.id, label: d.label || name, kind: 'output', nodeId: n.id, format: 'bit' });
      }
    } else if (HEX_TYPES.has(d.gateType)) {
      if (d.inputs.some((p) => wiredInputs.has(`${n.id}|${p.id}`))) {
        outputs.push({ id: n.id, label: d.label || name, kind: 'output', nodeId: n.id, format: 'hex' });
      }
    } else if (d.gateType === 'SEVEN_SEGMENT') {
      d.inputs.forEach((pin) => {
        if (!wiredInputs.has(`${n.id}|${pin.id}`)) return;
        const label = d.label ? `${d.label}.${pin.name}` : pin.name;
        outputs.push({ id: `${n.id}|${pin.id}`, label, kind: 'output', nodeId: n.id, pinId: pin.id, format: 'bit' });
      });
    } else if (!SOURCE_TYPES.has(d.gateType) && d.gateType !== 'TUNNEL' && d.gateType !== 'PULL_UP' && d.gateType !== 'PULL_DOWN') {
      d.outputs.forEach((pin) => {
        if (pin.width) return; // bus pins carry several bits; their single wires show as columns instead
        const column: TableColumn = {
          id: `${n.id}|${pin.id}`,
          label: d.outputs.length > 1 ? `${name}.${pin.name}` : name,
          kind: 'internal',
          nodeId: n.id,
          pinId: pin.id,
          format: 'bit',
        };
        if (wiredOutputs.has(`${n.id}|${pin.id}`)) internal.push(column);
        else unwiredGateOutputs.push({ ...column, kind: 'output' });
      });
    }
  });

  const usesFallbackOutputs = outputs.length === 0 && unwiredGateOutputs.length > 0;
  const isSequential = parts.some((n) => MEMORY_TYPES.has(dataOf(n).gateType)) || hasFeedbackLoop(parts, edges);

  const labelled = numberDuplicateLabels([...inputs, ...internal, ...(usesFallbackOutputs ? unwiredGateOutputs : outputs)]);
  return {
    inputs: labelled.filter((c) => c.kind === 'input'),
    internal: labelled.filter((c) => c.kind === 'internal'),
    outputs: labelled.filter((c) => c.kind === 'output'),
    isSequential,
    usesFallbackOutputs,
  };
}

// Two parts with the same name (e.g. two instances of one custom component) get numbered columns
function numberDuplicateLabels(columns: TableColumn[]): TableColumn[] {
  const totals = new Map<string, number>();
  columns.forEach((c) => totals.set(c.label, (totals.get(c.label) ?? 0) + 1));
  const seen = new Map<string, number>();
  return columns.map((c) => {
    if ((totals.get(c.label) ?? 0) < 2) return c;
    const n = (seen.get(c.label) ?? 0) + 1;
    seen.set(c.label, n);
    return { ...c, label: `${c.label} (${n})` };
  });
}

function setInputs(nodes: Node[], columns: TableColumn[], values: SignalValue[], memoryStart: MemoryStart): Node[] {
  const byNode = new Map<string, { column: TableColumn; value: SignalValue }[]>();
  columns.forEach((column, i) => {
    const list = byNode.get(column.nodeId) ?? [];
    list.push({ column, value: values[i] });
    byNode.set(column.nodeId, list);
  });

  return nodes.map((node) => {
    const data = { ...dataOf(node) };
    data.inputs = data.inputs ? data.inputs.map((p) => ({ ...p })) : [];
    data.outputs = data.outputs ? data.outputs.map((p) => ({ ...p })) : [];

    if (memoryStart === 'reset' && !SOURCE_TYPES.has(data.gateType)) {
      // Same starting point for every row: memory cleared, every signal unknown until driven
      delete data.icState;
      delete data.subcircuitNodeStates;
      data.inputs.forEach((p) => {
        if (p.driven) p.value = -1;
      });
      data.outputs.forEach((p) => (p.value = -1));
      if (LED_TYPES.has(data.gateType)) data.value = -1;
    }

    byNode.get(node.id)?.forEach(({ column, value }) => {
      if (column.bit !== undefined) {
        const dip = [...(data.dipValues ?? Array(data.bitWidth || 4).fill(0))];
        dip[column.bit] = value === 1 ? 1 : 0;
        data.dipValues = dip;
      } else {
        data.value = value;
        data.outputs.forEach((p) => (p.value = value));
      }
    });

    return { ...node, data: data as unknown as Record<string, unknown> };
  });
}

function readColumn(column: TableColumn, node: Node | undefined): CellValue {
  if (!node) return -1;
  const d = dataOf(node);
  if (column.format === 'hex') {
    const bits = d.inputs.slice(0, 4).map((p) => p.value);
    if (bits.some((b) => b !== 0 && b !== 1)) return '?';
    return bits.reduce<number>((acc, b, i) => acc | (b << i), 0).toString(16).toUpperCase();
  }
  if (column.kind === 'output' && LED_TYPES.has(d.gateType)) return d.value ?? -1;
  if (column.kind === 'output' && d.gateType === 'SEVEN_SEGMENT') {
    return d.inputs.find((p) => p.id === column.pinId)?.value ?? -1;
  }
  return d.outputs.find((p) => p.id === column.pinId)?.value ?? -1;
}

export function evaluateTableRow(
  nodes: Node[],
  edges: Edge[],
  model: CircuitTableModel,
  index: number,
  options: { memoryStart?: MemoryStart; customComponents?: Record<string, CustomComponentDefinition> } = {}
): CircuitTableRow {
  const count = model.inputs.length;
  const pattern = Array.from({ length: count }, (_, i) => ((index >> (count - 1 - i)) & 1) as SignalValue);
  const start = setInputs(nodes, model.inputs, pattern, options.memoryStart ?? 'reset');
  const result = propagateSignals(start, edges, options.customComponents ?? {});
  const settled = new Map(result.nodes.map((n) => [n.id, n]));

  return {
    index,
    inputs: pattern,
    internal: model.internal.map((c) => readColumn(c, settled.get(c.nodeId))),
    outputs: model.outputs.map((c) => readColumn(c, settled.get(c.nodeId))),
    unstable: result.unstableNodeIds.length > 0,
  };
}

/** Every input combination, yielding to the UI between batches. Returns null when cancelled. */
export async function generateCircuitTruthTable(
  nodes: Node[],
  edges: Edge[],
  model: CircuitTableModel,
  options: {
    memoryStart?: MemoryStart;
    customComponents?: Record<string, CustomComponentDefinition>;
    onProgress?: (done: number, total: number) => void;
    shouldCancel?: () => boolean;
  } = {}
): Promise<CircuitTableRow[] | null> {
  const total = 2 ** model.inputs.length;
  const rows: CircuitTableRow[] = [];
  const batch = 32;
  for (let i = 0; i < total; i++) {
    if (options.shouldCancel?.()) return null;
    rows.push(evaluateTableRow(nodes, edges, model, i, options));
    if ((i + 1) % batch === 0 && i + 1 < total) {
      options.onProgress?.(i + 1, total);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  options.onProgress?.(total, total);
  return rows;
}

/** Row matching the switches on the canvas right now. */
export function currentRowIndex(nodes: Node[], model: CircuitTableModel): number {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return model.inputs.reduce((acc, column) => {
    const node = byId.get(column.nodeId);
    const d = node ? dataOf(node) : undefined;
    const value = column.bit !== undefined ? d?.dipValues?.[column.bit] : d?.value;
    return (acc << 1) | (value === 1 ? 1 : 0);
  }, 0);
}

/** Input levels for one row, in the shape setInputLevels takes. */
export function rowInputLevels(model: CircuitTableModel, index: number): { nodeId: string; bit?: number; value: 0 | 1 }[] {
  const count = model.inputs.length;
  return model.inputs.map((column, i) => ({
    nodeId: column.nodeId,
    bit: column.bit,
    value: ((index >> (count - 1 - i)) & 1) as 0 | 1,
  }));
}

/**
 * Key that changes when anything affecting the table changes: wiring, parts, names, settings,
 * and (when rows start from the canvas) the current signal values.
 */
export function tableInputsKey(nodes: Node[], edges: Edge[], includeState: boolean): string {
  const nodePart = nodes.map((n) => {
    const { inputs, outputs, value, dipValues, icState, subcircuitNodeStates, encoderState, ...rest } = dataOf(n) as NodeData & Record<string, unknown>;
    const pins = `${inputs?.map((p) => p.id + (includeState ? p.value : '')).join(',')}/${outputs?.map((p) => p.id + (includeState ? p.value : '')).join(',')}`;
    const state = includeState ? JSON.stringify([value, dipValues, icState]) : '';
    return `${n.id}@${Math.round(n.position.y)},${Math.round(n.position.x)}:${JSON.stringify(rest)}:${pins}:${state}`;
  });
  const edgePart = edges.map((e) => `${e.source}.${e.sourceHandle}>${e.target}.${e.targetHandle}`);
  return `${nodePart.join('|')}#${edgePart.join('|')}`;
}

/**
 * Short variable names for expressions: "Carry In (Cin)" → "Cin", "Input A" → "A", "S" → "S".
 * Falls back to A, B, C… when names would be missing or clash.
 */
export function shortSignalNames(labels: string[]): string[] {
  const short = labels.map((label) => {
    const bracketed = label.match(/\(([^()\s]{1,5})\)\s*$/);
    if (bracketed) return bracketed[1];
    if (/^\S{1,4}$/.test(label)) return label;
    const lastWord = label.trim().split(/\s+/).pop() ?? '';
    return /^[A-Z][0-9]{0,2}$/.test(lastWord) ? lastWord : '';
  });
  if (short.every((s) => s !== '') && new Set(short).size === short.length) return short;
  return labels.map((_, i) => (i < 26 ? String.fromCharCode(65 + i) : `X${i}`));
}
