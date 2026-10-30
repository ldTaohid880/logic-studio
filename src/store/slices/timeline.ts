import { Node } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { advanceCircuit, hasTimedParts, nextEdgeTime, recordTraces, Traces } from '../../simulation/timeline';
import { boardFor, boardSerial, loadEmulator, restartBoards } from '../../simulation/avr/boards';
import { parseIntelHex } from '../../simulation/avr/intelHex';
import { makeId } from '../../utils/ids';
import { markUnstable } from './simulation';
import { CircuitStore, StoreSlice } from '../types';

// Longest stretch of simulated time one frame may cover (a background tab resumes without a jump)
const MAX_FRAME_MS = 100;
// Wall-clock budget per frame; the simulation falls behind real time rather than freezing the page
const FRAME_BUDGET_MS = 25;
// Step without a clock: a short slice of board time
const STEP_WITHOUT_CLOCK_MS = 10;

export const TIMELINE_SPEEDS = [0.25, 1, 4];

export const DEFAULT_TIMELINE = { running: true, time: 0, speed: 1, behind: false, traces: {} as Traces };

const lookupBoard = (node: Node) => {
  const data = node.data as unknown as NodeData;
  return boardFor(node.id, data.firmware);
};

/** Serial monitor text for every board on the canvas, reusing the previous object when nothing changed. */
function collectSerial(nodes: Node[], previous: Record<string, string>): Record<string, string> {
  const next: Record<string, string> = {};
  let changed = false;
  nodes.forEach((n) => {
    if ((n.data as unknown as NodeData).gateType !== 'ARDUINO_UNO') return;
    next[n.id] = boardSerial(n.id);
    if (next[n.id] !== previous[n.id]) changed = true;
  });
  return changed || Object.keys(previous).length !== Object.keys(next).length ? next : previous;
}

// Simulated time for clocks and boards. Only used when the circuit has one; see simulation/timeline.ts.
export type TimelineSlice = Pick<
  CircuitStore,
  | 'timeline'
  | 'boardSerial'
  | 'setTimelineRunning'
  | 'setTimelineSpeed'
  | 'advanceTimeline'
  | 'stepTimeline'
  | 'restartTimeline'
  | 'loadBoardFirmware'
>;

export const createTimelineSlice: StoreSlice<TimelineSlice> = (set, get) => {
  const advanceTo = (target: number, deadline?: number) => {
    const { nodes, edges, customComponents, timeline, simulation } = get();
    let traces = timeline.traces;
    const result = advanceCircuit({ nodes, edges }, customComponents, timeline.time, target, lookupBoard, {
      deadline,
      onSettle: (t, settled) => (traces = recordTraces(traces, settled, t)),
    });
    set({
      nodes: result.unstableNodeIds ? markUnstable(result.nodes, result.unstableNodeIds) : result.nodes,
      edges: result.edges,
      simulation: result.unstableNodeIds ? { ...simulation, unstableNodeIds: result.unstableNodeIds } : simulation,
      timeline: { ...timeline, time: result.time, traces, behind: result.time < target },
      boardSerial: collectSerial(result.nodes, get().boardSerial),
    });
  };

  return {
    timeline: DEFAULT_TIMELINE,
    boardSerial: {},

    setTimelineRunning: (running) => set({ timeline: { ...get().timeline, running, behind: false } }),

    setTimelineSpeed: (speed) => set({ timeline: { ...get().timeline, speed } }),

    advanceTimeline: (realMs) => {
      const { timeline, nodes } = get();
      if (!timeline.running || !hasTimedParts(nodes)) return;
      advanceTo(timeline.time + Math.min(realMs, MAX_FRAME_MS) * timeline.speed, performance.now() + FRAME_BUDGET_MS);
    },

    stepTimeline: () => {
      const { timeline, nodes } = get();
      set({ timeline: { ...timeline, running: false, behind: false } });
      advanceTo(nextEdgeTime(nodes, timeline.time) ?? timeline.time + STEP_WITHOUT_CLOCK_MS);
    },

    restartTimeline: () => {
      restartBoards();
      // Clocks start low, memory is cleared and board pins float until their programs start again
      const nodes = get().nodes.map((node) => {
        const data = node.data as unknown as NodeData;
        if (data.gateType === 'CLOCK') return { ...node, data: { ...data, value: 0 } };
        if (data.gateType === 'ARDUINO_UNO') return { ...node, data: { ...data, outputs: data.outputs.map((p) => ({ ...p, value: -1 })) } };
        if (data.icState) return { ...node, data: { ...data, icState: undefined } };
        return node;
      });
      set({ nodes, timeline: { ...get().timeline, time: 0, traces: {}, behind: false }, boardSerial: {} });
      get().tickSimulation();
    },

    loadBoardFirmware: (nodeId, name, hex) => {
      try {
        parseIntelHex(hex);
      } catch (e) {
        get().showToast(e instanceof Error ? e.message : 'Invalid .hex file');
        return false;
      }
      void loadEmulator();
      get().updateNodeData(nodeId, { firmware: { id: makeId('fw'), name, hex } });
      get().showToast(get().timeline.running ? `Running ${name}` : `Loaded ${name}. Press Run to start it`, 'success');
      return true;
    },
  };
};
