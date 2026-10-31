import { Node, Edge } from '@xyflow/react';
import { GateType, NodeData } from '../types/circuit';
import { IC_GATE_TYPES } from '../simulation/engine';
import { MEMORY_GATE_TYPES } from '../simulation/icLogic';

/**
 * Size and speed of a circuit, the way design exercises compare them: how many gates and chips it uses,
 * and how many logic levels a signal passes through on the longest path (each gate or chip is one level).
 * Paths start at inputs or memory outputs and end at outputs or memory inputs ("register to register").
 */
export const GATE_TYPES = new Set<GateType>(['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER', 'TRI_STATE_BUFFER']);

export interface CircuitStats {
  gates: number;
  gatesByType: Partial<Record<GateType, number>>;
  /** Fixed chips and custom components. */
  chips: number;
  memoryParts: number;
  /** Gates and chips on the longest path; 0 without logic. */
  levels: number;
  /** Part ids along the longest path, from where it starts to where it ends. */
  longestPath: string[];
  /** The logic has a feedback loop outside memory parts, so the longest path can't be measured through it. */
  hasLoop: boolean;
}

const dataOf = (n: Node) => n.data as unknown as NodeData;

export function circuitStats(nodes: Node[], edges: Edge[]): CircuitStats {
  const parts = nodes.filter((n) => dataOf(n)?.gateType);
  const byId = new Map(parts.map((n) => [n.id, n]));
  const isLogic = (n: Node) => {
    const t = dataOf(n).gateType;
    return (GATE_TYPES.has(t) || IC_GATE_TYPES.has(t) || t === 'CUSTOM' || t === 'ENCODER' || t === 'OPEN_DRAIN_BUFFER') && !MEMORY_GATE_TYPES.has(t);
  };

  const gatesByType: Partial<Record<GateType, number>> = {};
  let gates = 0;
  let chips = 0;
  let memoryParts = 0;
  parts.forEach((n) => {
    const t = dataOf(n).gateType;
    if (GATE_TYPES.has(t)) {
      gates++;
      gatesByType[t] = (gatesByType[t] ?? 0) + 1;
    } else if (MEMORY_GATE_TYPES.has(t)) memoryParts++;
    else if (isLogic(n)) chips++;
  });

  // Logic level of each logic part: 1 + the deepest logic part driving it
  const drivers = new Map<string, string[]>();
  edges.forEach((e) => {
    if (byId.has(e.source) && byId.has(e.target)) drivers.set(e.target, [...(drivers.get(e.target) ?? []), e.source]);
  });
  const depth = new Map<string, number>();
  const via = new Map<string, string | null>();
  const visiting = new Set<string>();
  let hasLoop = false;
  const levelOf = (id: string): number => {
    const node = byId.get(id)!;
    if (!isLogic(node)) return 0;
    if (depth.has(id)) return depth.get(id)!;
    if (visiting.has(id)) {
      hasLoop = true;
      return 0;
    }
    visiting.add(id);
    let best = 0;
    let from: string | null = null;
    (drivers.get(id) ?? []).forEach((src) => {
      const d = levelOf(src);
      if (d > best || from === null) {
        best = d;
        from = src;
      }
    });
    visiting.delete(id);
    depth.set(id, best + 1);
    via.set(id, from);
    return best + 1;
  };
  parts.forEach((n) => levelOf(n.id));

  let end: string | null = null;
  depth.forEach((d, id) => {
    if (end === null || d > depth.get(end)!) end = id;
  });
  const longestPath: string[] = [];
  if (end !== null) {
    // Walk back to where the path starts, then add the part it ends in (an LED, display or memory input)
    let at: string | null = end;
    // In a feedback loop the drivers lead back round, so stop at a part already on the path
    while (at !== null && !longestPath.includes(at)) {
      longestPath.unshift(at);
      at = via.get(at) ?? null;
      if (at !== null && !isLogic(byId.get(at)!)) {
        longestPath.unshift(at);
        break;
      }
    }
    const sink = edges.find((e) => e.source === end && byId.has(e.target) && !isLogic(byId.get(e.target)!));
    if (sink) longestPath.push(sink.target);
  }

  return { gates, gatesByType, chips, memoryParts, levels: end ? depth.get(end)! : 0, longestPath, hasLoop };
}
