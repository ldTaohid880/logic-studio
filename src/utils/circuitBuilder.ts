import { Node, Edge } from '@xyflow/react';
import { GateType, NodeData, PinData } from '../types/circuit';
import { createPart } from '../store/partFactory';
import { Expr, ParsedLine, variablesOf } from './expression';

/**
 * Turns expressions into a gate circuit: switches for the variables on the left, gates in columns by
 * logic level, an LED per output on the right. Identical sub-expressions share one gate.
 */
export type GateStyle = 'basic' | 'nand' | 'nor';

/** Most inputs a gate on the canvas can have; wider operations become trees of gates. */
const MAX_FAN_IN = 4;

type Signal = { kind: 'var'; name: string } | { kind: 'const'; value: 0 | 1 } | { kind: 'gate'; id: number };

interface Gate {
  id: number;
  type: GateType;
  inputs: Signal[];
}

export interface Netlist {
  vars: string[];
  gates: Gate[];
  outputs: { name: string; signal: Signal }[];
}

const sigKey = (s: Signal) => (s.kind === 'var' ? `v:${s.name}` : s.kind === 'const' ? `c:${s.value}` : `g:${s.id}`);

/** Builds the gates for some outputs in one style. */
export function buildNetlist(lines: ParsedLine[], style: GateStyle): Netlist {
  const gates: Gate[] = [];
  const shared = new Map<string, Signal>();
  // Inverters (NOT, or in NAND/NOR style a gate with one signal on every input), so a double inversion cancels out
  const inverterOf = new Map<number, Signal>();

  const gate = (type: GateType, inputs: Signal[]): Signal => {
    const key = `${type}(${inputs.map(sigKey).join(',')})`;
    const known = shared.get(key);
    if (known) return known;
    const g: Gate = { id: gates.length, type, inputs };
    gates.push(g);
    const signal: Signal = { kind: 'gate', id: g.id };
    shared.set(key, signal);
    return signal;
  };

  // Gate of `type` over any number of inputs: wider ones become a tree (the inner gates are non-inverting)
  const wide = (type: GateType, inner: (args: Signal[]) => Signal, inputs: Signal[]): Signal => {
    if (inputs.length <= MAX_FAN_IN) return gate(type, inputs);
    const groups: Signal[] = [];
    for (let i = 0; i < inputs.length; i += MAX_FAN_IN) {
      const chunk = inputs.slice(i, i + MAX_FAN_IN);
      groups.push(chunk.length === 1 ? chunk[0] : inner(chunk));
    }
    return wide(type, inner, groups);
  };

  const universal: GateType = style === 'nor' ? 'NOR' : 'NAND';
  const invert = (s: Signal): Signal => {
    if (s.kind === 'const') return { kind: 'const', value: s.value === 1 ? 0 : 1 };
    if (s.kind === 'gate' && inverterOf.has(s.id)) return inverterOf.get(s.id)!;
    const inv = style === 'basic' ? gate('NOT', [s]) : gate(universal, [s, s]);
    if (inv.kind === 'gate') inverterOf.set(inv.id, s);
    return inv;
  };

  const and = (args: Signal[]): Signal => {
    if (style === 'basic') return wide('AND', and, args);
    // NAND style: AND = NOT(NAND); NOR style: AND = NOR of the inverted inputs
    if (style === 'nand') return invert(wide('NAND', and, args));
    return wide('NOR', or, args.map(invert));
  };
  const or = (args: Signal[]): Signal => {
    if (style === 'basic') return wide('OR', or, args);
    if (style === 'nor') return invert(wide('NOR', or, args));
    return wide('NAND', and, args.map(invert));
  };

  const build = (e: Expr): Signal => {
    switch (e.kind) {
      case 'var':
        return e;
      case 'const':
        return e;
      case 'not':
        return invert(build(e.arg));
      case 'and':
        return and(e.args.map(build));
      case 'or':
        return or(e.args.map(build));
      case 'xor': {
        const args = e.args.map(build);
        // XOR of XORs is still the parity of all inputs, so wide XORs split like AND and OR
        if (style === 'basic') return wide('XOR', (chunk) => gate('XOR', chunk), args);
        // a ⊕ b = a·b' + a'·b, folded left for more than two inputs
        return args.slice(1).reduce((a, b) => or([and([a, invert(b)]), and([invert(a), b])]), args[0]);
      }
    }
  };

  const outputs = lines.map((l) => ({ name: l.output, signal: build(l.expr) }));
  return prune({ vars: variablesOf(lines.map((l) => l.expr)), gates, outputs });
}

// Drops gates no output uses (inverters left over when a double inversion cancelled) and renumbers the rest
function prune(net: Netlist): Netlist {
  const used = new Set<number>();
  const mark = (s: Signal) => {
    if (s.kind !== 'gate' || used.has(s.id)) return;
    used.add(s.id);
    net.gates[s.id].inputs.forEach(mark);
  };
  net.outputs.forEach((o) => mark(o.signal));
  const newId = new Map<number, number>();
  net.gates.filter((g) => used.has(g.id)).forEach((g, i) => newId.set(g.id, i));
  const remap = (s: Signal): Signal => (s.kind === 'gate' ? { kind: 'gate', id: newId.get(s.id)! } : s);
  return {
    vars: net.vars,
    gates: net.gates.filter((g) => used.has(g.id)).map((g) => ({ ...g, id: newId.get(g.id)!, inputs: g.inputs.map(remap) })),
    outputs: net.outputs.map((o) => ({ ...o, signal: remap(o.signal) })),
  };
}

/** Counts for comparing styles: gates by type and the number of gate levels on the longest path. */
export function netlistStats(net: Netlist): { gates: number; levels: number; byType: Partial<Record<GateType, number>> } {
  const level = levelsOf(net);
  const byType: Partial<Record<GateType, number>> = {};
  net.gates.forEach((g) => (byType[g.type] = (byType[g.type] ?? 0) + 1));
  return { gates: net.gates.length, levels: Math.max(0, ...net.outputs.map((o) => (o.signal.kind === 'gate' ? level[o.signal.id] : 0))), byType };
}

function levelsOf(net: Netlist): number[] {
  const level: number[] = [];
  net.gates.forEach((g) => {
    level[g.id] = 1 + Math.max(0, ...g.inputs.map((s) => (s.kind === 'gate' ? level[s.id] : 0)));
  });
  return level;
}

const COLUMN = 150;
const SWITCH_ROW = 60;
const snap = (v: number) => Math.round(v / 15) * 15;

/** Canvas parts and wires for a netlist, with the top-left part at (0, 0). */
export function layoutNetlist(net: Netlist): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const level = levelsOf(net);
  const maxLevel = Math.max(0, ...level);
  const pinY = new Map<string, number>(); // y of each signal's output pin, used to order the next column

  const place = (type: GateType, x: number, y: number, data: Partial<NodeData> = {}) => {
    const node = createPart(type, { x: snap(x), y: snap(y) }, nodes);
    const full = { ...node, data: { ...node.data, ...data } };
    nodes.push(full);
    return full;
  };
  const wire = (from: Node, to: Node, targetHandle: string) =>
    edges.push({
      id: `e-${from.id}-out-0-${to.id}-${targetHandle}`,
      source: from.id,
      sourceHandle: 'out-0',
      target: to.id,
      targetHandle,
      type: 'signalEdge',
      data: { signalValue: -1 },
    });

  const sourceNode = new Map<string, Node>();
  net.vars.forEach((name, i) => {
    const sw = place('INPUT', 0, i * SWITCH_ROW, { label: name });
    sourceNode.set(`v:${name}`, sw);
    pinY.set(`v:${name}`, i * SWITCH_ROW + 15);
  });
  const constNode = (value: 0 | 1) => {
    const key = `c:${value}`;
    if (!sourceNode.has(key)) {
      const y = net.vars.length * SWITCH_ROW + (value === 1 ? 0 : SWITCH_ROW);
      sourceNode.set(key, place(value === 1 ? 'CONST_HIGH' : 'CONST_LOW', 0, y));
      pinY.set(key, y + 15);
    }
    return sourceNode.get(key)!;
  };
  const nodeFor = (s: Signal) => (s.kind === 'const' ? constNode(s.value) : sourceNode.get(sigKey(s))!);

  for (let lv = 1; lv <= maxLevel; lv++) {
    // Order each column by where its inputs come from, so wires cross less
    const column = net.gates
      .filter((g) => level[g.id] === lv)
      .map((g) => ({ g, y: g.inputs.reduce((acc, s) => acc + (pinY.get(sigKey(s)) ?? 0), 0) / g.inputs.length }))
      .sort((a, b) => a.y - b.y);
    let nextY = 0;
    column.forEach(({ g, y: wanted }) => {
      const pins = g.type === 'NOT' ? 1 : g.inputs.length;
      const top = Math.max(nextY, wanted - (pins * 30) / 2);
      const inputs: PinData[] = Array.from({ length: pins }, (_, i) => ({ id: `in-${i}`, name: pins === 1 ? 'In' : `In ${i + 1}`, value: -1 }));
      const node = place(g.type, 60 + lv * COLUMN, top, g.type === 'NOT' ? {} : { inputCount: pins, inputs });
      g.inputs.forEach((s, i) => wire(nodeFor(s), node, `in-${i}`));
      sourceNode.set(`g:${g.id}`, node);
      pinY.set(`g:${g.id}`, snap(top) + (pins * 30) / 2);
      nextY = snap(top) + pins * 30 + 30;
    });
  }

  net.outputs.forEach((o, i) => {
    const y = o.signal.kind === 'gate' ? (pinY.get(sigKey(o.signal)) ?? 0) - 15 : i * SWITCH_ROW;
    const led = place('OUTPUT', 60 + (maxLevel + 1) * COLUMN, Math.max(y, i * SWITCH_ROW), { label: o.name });
    wire(nodeFor(o.signal), led, 'in-0');
  });

  return { nodes, edges };
}
