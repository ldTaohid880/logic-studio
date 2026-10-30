import { Node, Edge } from '@xyflow/react';
import { NodeData, SignalValue } from '../types/circuit';
import { CustomComponentDefinition } from '../types/customComponent';
import { propagateSignals } from './engine';

/**
 * Simulated time. Circuits without clocks or boards never use this: they settle instantly on every edit.
 * Once a clock or a programmed board is on the canvas, time moves forward in milliseconds; between events
 * the circuit is settled exactly as before (gates have no delay).
 */

export const CLOCK_RATES_HZ = [0.5, 1, 2, 5, 10, 50, 100];
export const DEFAULT_CLOCK_HZ = 1;
/** Board pins shown on the canvas, in pin order: D2–D13 (D0 and D1 are the serial port). */
export const BOARD_PINS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

const TIMED_TYPES = new Set<string>(['CLOCK', 'ARDUINO_UNO']);
const EPSILON = 1e-9;

const halfPeriod = (hz: number) => 500 / hz;
const clockHz = (data: NodeData) => data.clockHz ?? DEFAULT_CLOCK_HZ;

/** A clock starts low and rises after half a period. */
export const clockLevelAt = (t: number, hz: number): 0 | 1 => (Math.floor(t / halfPeriod(hz) + EPSILON) % 2 === 0 ? 0 : 1);
export const nextClockEdge = (t: number, hz: number) => (Math.floor(t / halfPeriod(hz) + EPSILON) + 1) * halfPeriod(hz);

/** Whether the circuit has parts that need simulated time (and so the run controls and timing diagram). */
export const hasTimedParts = (nodes: Node[]) => nodes.some((n) => TIMED_TYPES.has((n.data as unknown as NodeData)?.gateType));

/** Time of the next clock edge after t, or undefined without clocks. */
export function nextEdgeTime(nodes: Node[], t: number): number | undefined {
  const edges = nodes
    .map((n) => n.data as unknown as NodeData)
    .filter((d) => d.gateType === 'CLOCK')
    .map((d) => nextClockEdge(t, clockHz(d)));
  return edges.length > 0 ? Math.min(...edges) : undefined;
}

/** A running program, as the time engine sees it. */
export interface BoardLike {
  run(ms: number): void;
  output(pin: number): SignalValue;
  input(pin: number, value: SignalValue): void;
}

export interface AdvanceResult {
  nodes: Node[];
  edges: Edge[];
  /** Time reached; earlier than requested when the deadline cut the step short. */
  time: number;
  /** Set when the circuit was re-settled at least once. */
  unstableNodeIds?: string[];
}

/**
 * Moves the circuit from `from` to `to` ms: toggles clocks on their edges and runs boards in 1 ms slices,
 * re-settling the circuit whenever a clock or board pin changes. `onSettle` sees every settled state.
 */
export function advanceCircuit(
  circuit: { nodes: Node[]; edges: Edge[] },
  customComponents: Record<string, CustomComponentDefinition>,
  from: number,
  to: number,
  boardFor: (node: Node) => BoardLike | null,
  options: { deadline?: number; onSettle?: (t: number, nodes: Node[]) => void } = {}
): AdvanceResult {
  let { nodes, edges } = circuit;
  let unstableNodeIds: string[] | undefined;
  const clocks = nodes
    .filter((n) => (n.data as unknown as NodeData).gateType === 'CLOCK')
    .map((n) => ({ id: n.id, hz: clockHz(n.data as unknown as NodeData) }));
  const boards = nodes
    .filter((n) => (n.data as unknown as NodeData).gateType === 'ARDUINO_UNO')
    .map((n) => ({ id: n.id, board: boardFor(n) }))
    .filter((b): b is { id: string; board: BoardLike } => b.board !== null);

  let t = from;
  while (t < to - EPSILON) {
    if (options.deadline !== undefined && performance.now() > options.deadline) break;

    let next = to;
    clocks.forEach((c) => (next = Math.min(next, nextClockEdge(t, c.hz))));
    if (boards.length > 0) {
      next = Math.min(next, Math.floor(t + EPSILON) + 1);
      const byId = new Map(nodes.map((n) => [n.id, n.data as unknown as NodeData]));
      boards.forEach(({ id, board }) => {
        const inputs = byId.get(id)?.inputs ?? [];
        BOARD_PINS.forEach((pin, i) => board.input(pin, inputs[i]?.value ?? -1));
        board.run(next - t);
      });
    }
    t = next;

    // Apply the new clock levels and board outputs
    const clockLevels = new Map(clocks.map((c) => [c.id, clockLevelAt(t, c.hz)]));
    const boardsById = new Map(boards.map((b) => [b.id, b.board]));
    let dirty = false;
    nodes = nodes.map((node) => {
      const data = node.data as unknown as NodeData;
      const level = clockLevels.get(node.id);
      if (level !== undefined && data.value !== level) {
        dirty = true;
        return { ...node, data: { ...data, value: level } };
      }
      const board = boardsById.get(node.id);
      if (board) {
        const levels = BOARD_PINS.map((pin) => board.output(pin));
        if (levels.some((v, i) => data.outputs[i]?.value !== v)) {
          dirty = true;
          return { ...node, data: { ...data, outputs: data.outputs.map((p, i) => ({ ...p, value: levels[i] ?? -1 })) } };
        }
      }
      return node;
    });

    if (dirty) {
      const settled = propagateSignals(nodes, edges, customComponents);
      nodes = settled.nodes;
      edges = settled.edges;
      unstableNodeIds = settled.unstableNodeIds;
      options.onSettle?.(t, nodes);
    }
  }

  return { nodes, edges, time: t, unstableNodeIds };
}

// Timing diagram traces: one list of [time, level] changes per traced part

export type TracePoint = [time: number, value: SignalValue];
export type Traces = Record<string, TracePoint[]>;

const TRACED_TYPES = new Set<string>(['CLOCK', 'INPUT', 'PUSH_BUTTON', 'OUTPUT', 'LOGIC_PROBE']);
export const MAX_TRACE_POINTS = 2000;

/** Level a traced part shows in the timing diagram; undefined for parts that aren't traced. */
export function tracedValue(data: NodeData): SignalValue | undefined {
  if (!TRACED_TYPES.has(data.gateType)) return undefined;
  if (data.gateType === 'OUTPUT' || data.gateType === 'LOGIC_PROBE') return data.inputs?.[0]?.value ?? data.value ?? -1;
  return data.value ?? 0;
}

/** Adds a point for every traced part whose level differs from its last point. Returns the same object when nothing changed. */
export function recordTraces(traces: Traces, nodes: Node[], t: number): Traces {
  let next = traces;
  nodes.forEach((node) => {
    const value = tracedValue(node.data as unknown as NodeData);
    if (value === undefined) return;
    const points = traces[node.id] ?? [];
    const last = points[points.length - 1];
    if (last && last[1] === value) return;
    if (next === traces) next = { ...traces };
    // A second change at the same moment replaces the first (the circuit settled through it)
    const kept = last && Math.abs(last[0] - t) < EPSILON ? points.slice(0, -1) : points.slice(-(MAX_TRACE_POINTS - 1));
    next[node.id] = [...kept, [t, value]];
  });
  return next;
}
