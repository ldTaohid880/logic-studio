import { Node } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { propagateSignals } from '../../simulation/engine';
import { DEFAULT_SIMULATION } from '../helpers';
import { isTimelineActive, recordTraces } from '../../simulation/timeline';
import { CircuitStore, StoreSlice } from '../types';

// Classes React Flow puts on a part's wrapper (styled in index.css): it keeps changing, or its input is fought over
const UNSTABLE_CLASS = 'ls-unstable';
const CONFLICT_CLASS = 'ls-conflict';

/** Adds or removes the warning outlines so they match the latest propagation. */
export const markUnstable = (nodes: Node[], unstableIds: string[], conflictIds: string[] = []): Node[] => {
  const unstable = new Set(unstableIds);
  const conflict = new Set(conflictIds);
  return nodes.map((node) => {
    const classes = (node.className ?? '').split(' ').filter(Boolean);
    const wanted = [UNSTABLE_CLASS, CONFLICT_CLASS].filter((c) => (c === UNSTABLE_CLASS ? unstable : conflict).has(node.id));
    const current = classes.filter((c) => c === UNSTABLE_CLASS || c === CONFLICT_CLASS);
    if (wanted.join() === current.join()) return node;
    const next = [...classes.filter((c) => c !== UNSTABLE_CLASS && c !== CONFLICT_CLASS), ...wanted];
    return { ...node, className: next.length > 0 ? next.join(' ') : undefined };
  });
};

// Signal propagation: every edit re-settles the circuit immediately. Clocks and boards move time forward in the timeline slice.
export type SimulationSlice = Pick<CircuitStore, 'simulation' | 'resetSimulation' | 'tickSimulation'>;

export const createSimulationSlice: StoreSlice<SimulationSlice> = (set, get) => ({
  simulation: DEFAULT_SIMULATION,

  resetSimulation: () => {
    // Inputs go back to 0, everything else floats until the circuit re-settles
    const nodes = get().nodes.map((node) => {
      const data = node.data as unknown as NodeData;
      if (!data.inputs) return node;
      const isSource = data.gateType === 'INPUT';
      return {
        ...node,
        data: {
          ...data,
          value: isSource ? 0 : data.value,
          icState: undefined,
          inputs: data.inputs.map((p) => ({ ...p, value: -1 })),
          outputs: data.outputs.map((p) => ({ ...p, value: isSource ? 0 : -1 })),
        },
      };
    });

    const edges = get().edges.map((edge) => ({
      ...edge,
      data: { ...edge.data, signalValue: -1 },
    }));

    set({ nodes, edges, simulation: { stepCount: 0, unstableNodeIds: [], conflictNodeIds: [] } });
    get().tickSimulation();
  },

  tickSimulation: () => {
    const { nodes, edges, customComponents, simulation, timeline } = get();
    // With gate delays (and time running), an edit starts a wave of passes instead of settling at once
    const delayed = timeline.gateDelay > 0 && isTimelineActive(nodes, edges);
    const result = propagateSignals(nodes, edges, customComponents, delayed ? { maxPasses: 1 } : {});
    if (delayed) result.unstableNodeIds = [];
    const passDue = delayed && result.hasChanged ? timeline.passDue ?? timeline.time + timeline.gateDelay : timeline.passDue;
    set({
      nodes: markUnstable(result.nodes, result.unstableNodeIds, result.conflictNodeIds),
      edges: result.edges,
      simulation: {
        stepCount: simulation.stepCount + 1,
        unstableNodeIds: result.unstableNodeIds,
        conflictNodeIds: result.conflictNodeIds,
      },
      // Edits made while time is paused (a switch flipped) still show up in the timing diagram
      ...(isTimelineActive(result.nodes, result.edges)
        ? { timeline: { ...timeline, passDue, traces: recordTraces(timeline.traces, result.nodes, timeline.time, result.edges) } }
        : {}),
    });
    // Tell the user once, when the circuit starts oscillating, not on every edit while it does
    if (result.unstableNodeIds.length > 0 && simulation.unstableNodeIds.length === 0) {
      get().showToast("The circuit doesn't settle: the parts outlined in amber keep changing", 'info');
    }
    if (result.conflictNodeIds.length > 0 && simulation.conflictNodeIds.length === 0) {
      get().showToast('Two outputs drive the same wire to different levels: the red wires conflict. Enable only one tri-state output at a time', 'info');
    }
  },
});
