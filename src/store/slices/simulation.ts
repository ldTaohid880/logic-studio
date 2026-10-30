import { NodeData } from '../../types/circuit';
import { propagateSignals } from '../../simulation/engine';
import { DEFAULT_SIMULATION } from '../helpers';
import { CircuitStore, StoreSlice } from '../types';

// Signal propagation. There is no running clock: every edit re-settles the circuit immediately.
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

    set({ nodes, edges, simulation: { stepCount: 0 } });
    get().tickSimulation();
  },

  tickSimulation: () => {
    const { nodes, edges, customComponents, simulation } = get();
    const result = propagateSignals(nodes, edges, customComponents);
    set({
      nodes: result.nodes,
      edges: result.edges,
      simulation: { stepCount: simulation.stepCount + 1 },
    });
  },
});
