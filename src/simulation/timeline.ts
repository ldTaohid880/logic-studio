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
/** Board pins on the canvas, in pin order: D2–D13 and A0–A5 (D0 and D1 are the serial port). */
export const BOARD_PINS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
/** Arduino name of a board pin: D2–D13, then A0–A5 (pins 14–19, used as digital pins). */
export const boardPinName = (pin: number) => (pin >= 14 ? `A${pin - 14}` : `D${pin}`);

const TIMED_TYPES = new Set<string>(['CLOCK', 'ARDUINO_UNO']);
const EPSILON = 1e-9;

const halfPeriod = (hz: number) => 500 / hz;
const clockHz = (data: NodeData) => data.clockHz ?? DEFAULT_CLOCK_HZ;

/** A clock starts low and rises after half a period. */
export const clockLevelAt = (t: number, hz: number): 0 | 1 => (Math.floor(t / halfPeriod(hz) + EPSILON) % 2 === 0 ? 0 : 1);
export const nextClockEdge = (t: number, hz: number) => (Math.floor(t / halfPeriod(hz) + EPSILON) + 1) * halfPeriod(hz);

/** Whether the circuit has parts that need simulated time (and so the run controls and timing diagram). */
export const hasTimedParts = (nodes: Node[]) => nodes.some((n) => TIMED_TYPES.has((n.data as unknown as NodeData)?.gateType));

/** Wires the student added to the timing diagram. */
export const isWatched = (edge: Edge) => edge.data?.watched === true;

/**
 * Whether time runs and the timing diagram shows: with a clock or board, or once a wire is watched
 * (then time runs like a logic analyser's, and edits are recorded when they happen).
 */
export const isTimelineActive = (nodes: Node[], edges: Edge[]) => hasTimedParts(nodes) || edges.some(isWatched);

/** Trace key of a watched wire (part traces use the part's id). */
export const wireTraceKey = (edgeId: string) => `wire:${edgeId}`;

export const GATE_DELAYS_MS = [0, 1, 10, 100];

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
  /** With gate delays: when the next propagation pass is due, or null once the circuit has settled. */
  passDue: number | null;
  /** Set when the circuit was re-settled at least once. */
  unstableNodeIds?: string[];
  conflictNodeIds?: string[];
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
  options: {
    deadline?: number;
    onSettle?: (t: number, nodes: Node[], edges: Edge[]) => void;
    /** Gate delay in ms; 0 settles instantly. */
    gateDelay?: number;
    /** With gate delays: when the next pass is due (carried between calls), null when settled. */
    passDue?: number | null;
  } = {}
): AdvanceResult {
  let { nodes, edges } = circuit;
  const delay = options.gateDelay ?? 0;
  let passDue = delay > 0 ? options.passDue ?? null : null;
  let unstableNodeIds: string[] | undefined;
  let conflictNodeIds: string[] | undefined;
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
    if (passDue !== null) next = Math.min(next, Math.max(passDue, t));
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

    const passNow = delay > 0 && (dirty || (passDue !== null && passDue <= t + EPSILON));
    if (passNow) {
      // Gate delays: one pass per delay; a source that just changed starts a new wave of passes
      const pass = propagateSignals(nodes, edges, customComponents, { maxPasses: 1 });
      nodes = pass.nodes;
      edges = pass.edges;
      unstableNodeIds = []; // a circuit that keeps changing is expected here (a ring oscillator runs)
      conflictNodeIds = pass.conflictNodeIds;
      passDue = pass.hasChanged ? (passDue !== null && passDue > t + EPSILON ? passDue : t + delay) : null;
      options.onSettle?.(t, nodes, edges);
    } else if (dirty && delay === 0) {
      const settled = propagateSignals(nodes, edges, customComponents);
      nodes = settled.nodes;
      edges = settled.edges;
      unstableNodeIds = settled.unstableNodeIds;
      conflictNodeIds = settled.conflictNodeIds;
      options.onSettle?.(t, nodes, edges);
    }
  }

  return { nodes, edges, time: t, passDue, unstableNodeIds, conflictNodeIds };
}

// Timing diagram traces: one list of [time, level] changes per traced part

export type TracePoint = [time: number, value: SignalValue];
export type Traces = Record<string, TracePoint[]>;

const TRACED_TYPES = new Set<string>([
  'CLOCK', 'INPUT', 'PUSH_BUTTON', 'OUTPUT', 'LOGIC_PROBE', 'SENSOR_LIGHT', 'SENSOR_TEMPERATURE', 'SENSOR_OBSTACLE', 'SENSOR_MOTION',
]);
export const MAX_TRACE_POINTS = 2000;

/** Level a traced part shows in the timing diagram; undefined for parts that aren't traced. */
export function tracedValue(data: NodeData): SignalValue | undefined {
  if (!TRACED_TYPES.has(data.gateType)) return undefined;
  if (data.gateType === 'OUTPUT' || data.gateType === 'LOGIC_PROBE') return data.inputs?.[0]?.value ?? data.value ?? -1;
  if (data.gateType.startsWith('SENSOR_')) return data.outputs?.[0]?.value ?? -1;
  return data.value ?? 0;
}

/**
 * Adds a point for every traced part and watched wire whose level differs from its last point.
 * Returns the same object when nothing changed.
 */
export function recordTraces(traces: Traces, nodes: Node[], t: number, edges: Edge[] = []): Traces {
  let next = traces;
  const levels: [string, SignalValue][] = [
    ...nodes.flatMap((node): [string, SignalValue][] => {
      const value = tracedValue(node.data as unknown as NodeData);
      return value === undefined ? [] : [[node.id, value]];
    }),
    ...edges.filter(isWatched).map((e): [string, SignalValue] => [wireTraceKey(e.id), (e.data?.signalValue as SignalValue) ?? -1]),
  ];
  levels.forEach(([key, value]) => {
    const points = traces[key] ?? [];
    const last = points[points.length - 1];
    if (last && last[1] === value) return;
    if (next === traces) next = { ...traces };
    // A second change at the same moment replaces the first (the circuit settled through it)
    const kept = last && Math.abs(last[0] - t) < EPSILON ? points.slice(0, -1) : points.slice(-(MAX_TRACE_POINTS - 1));
    next[key] = [...kept, [t, value]];
  });
  return next;
}
