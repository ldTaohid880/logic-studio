import { Node } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { propagateSignals } from '../../simulation/engine';
import { DEFAULT_SIMULATION } from '../helpers';
import { hasTimedParts, recordTraces } from '../../simulation/timeline';
import { CircuitStore, StoreSlice } from '../types';

// Class React Flow puts on a part's wrapper while it keeps changing (styled in index.css)
const UNSTABLE_CLASS = 'ls-unstable';

export const markUnstable = (nodes: Node[], unstableIds: string[]): Node[] => {
  const ids = new Set(unstableIds);
  return nodes.map((node) => {
    const classes = (node.className ?? '').split(' ').filter(Boolean);
    const has = classes.includes(UNSTABLE_CLASS);
    if (has === ids.has(node.id)) return node;
    const next = has ? classes.filter((c) => c !== UNSTABLE_CLASS) : [...classes, UNSTABLE_CLASS];
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

    set({ nodes, edges, simulation: { stepCount: 0, unstableNodeIds: [] } });
    get().tickSimulation();
  },

  tickSimulation: () => {
    const { nodes, edges, customComponents, simulation, timeline } = get();
    const result = propagateSignals(nodes, edges, customComponents);
    set({
      nodes: markUnstable(result.nodes, result.unstableNodeIds),
      edges: result.edges,
      simulation: { stepCount: simulation.stepCount + 1, unstableNodeIds: result.unstableNodeIds },
      // Edits made while time is paused (a switch flipped) still show up in the timing diagram
      ...(hasTimedParts(result.nodes) ? { timeline: { ...timeline, traces: recordTraces(timeline.traces, result.nodes, timeline.time) } } : {}),
    });
    // Tell the user once, when the circuit starts oscillating, not on every edit while it does
    if (result.unstableNodeIds.length > 0 && simulation.unstableNodeIds.length === 0) {
      get().showToast("The circuit doesn't settle: the parts outlined in amber keep changing", 'info');
    }
  },
});
