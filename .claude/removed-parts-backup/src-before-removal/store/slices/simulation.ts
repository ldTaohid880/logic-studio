import { Node } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { ClockConfig, DEFAULT_CLOCK_CONFIG, DEFAULT_CLOCK_STATE } from '../../types/clock';
import { clockValueAt, isClockRunning } from '../../simulation/clockLogic';
import { DEFAULT_OSCILLOSCOPE_CONFIG } from '../../types/oscilloscope';
import { createMultiInputPins } from '../../utils/multiInputPins';
import { propagateSignals } from '../../simulation/engine';
import { oscilloscopeBuffers, DEFAULT_SIMULATION, MAX_CLOCK_EDGES_PER_TICK, getNextClockEdge } from '../helpers';
import { CircuitStore, StoreSlice } from '../types';

// Simulation loop, clocks and oscilloscope sampling
export type SimulationSlice = Pick<CircuitStore,
  | 'simulation'
  | 'simulationTimeMs'
  | 'lastTickTime'
  | 'startSimulation'
  | 'pauseSimulation'
  | 'stopSimulation'
  | 'resetSimulation'
  | 'stepSimulation'
  | 'setSpeed'
  | 'toggleLoopMode'
  | 'tickSimulation'
  | 'startClockNode'
  | 'pauseClockNode'
  | 'resetClockNode'
  | 'stopClockNode'
  | 'singleTickClockNode'
  | 'updateClockConfig'
  | 'tickClockNode'
  | 'updateClocks'
  | 'sampleOscilloscopes'
  | 'getOscilloscopeBuffer'
  | 'clearOscilloscopeBuffer'
>;

export const createSimulationSlice: StoreSlice<SimulationSlice> = (set, get) => ({
  simulation: DEFAULT_SIMULATION,
  simulationTimeMs: 0,
  lastTickTime: 0,
  startSimulation: () => {
    set((state) => ({
      simulation: { ...state.simulation, isRunning: true, isPaused: false },
      lastTickTime: performance.now(),
    }));
  },

  pauseSimulation: () => {
    set((state) => ({
      simulation: { ...state.simulation, isPaused: true },
    }));
  },

  stopSimulation: () => {
    set((state) => ({
      simulation: { ...state.simulation, isRunning: false, isPaused: false },
    }));
  },

  resetSimulation: () => {
    // Reset all signals to default
    const nodes = get().nodes.map((node) => {
      const data = node.data as unknown as NodeData;
      if (data.gateType === 'MULTI_INPUT' && data.multiInputConfig) {
        return {
          ...node,
          data: {
            ...data,
            outputs: createMultiInputPins(data.multiInputConfig, data.outputs),
          },
        };
      }
      return {
        ...node,
        data: {
          ...data,
          value: data.gateType === 'INPUT' ? 0 : -1,
          inputs: data.inputs.map((p) => ({ ...p, value: -1 })),
          outputs: data.outputs.map((p) => ({ ...p, value: data.gateType === 'INPUT' ? 0 : -1 })),
        },
      };
    });

    const edges = get().edges.map((edge) => ({
      ...edge,
      data: { ...edge.data, signalValue: -1 },
    }));

    // Clear all scope buffers
    oscilloscopeBuffers.forEach((buf) => {
      buf.samples.fill(0);
      buf.writeIndex = 0;
      buf.lastSampleSimTime = 0;
    });

    set({
      nodes,
      edges,
      simulationTimeMs: 0,
      lastTickTime: 0,
      simulation: { ...get().simulation, stepCount: 0 },
    });

    get().tickSimulation();
  },

  stepSimulation: () => {
    const nextTime = get().simulationTimeMs + 10; // Advance 10ms of simulation time on step
    set({
      simulationTimeMs: nextTime,
      lastTickTime: performance.now(),
    });
    get().updateClocks(nextTime);
    get().tickSimulation(true);
  },

  setSpeed: (speed) => {
    set((state) => ({
      simulation: { ...state.simulation, speed },
      lastTickTime: performance.now(), // Reset tick timer reference for smooth speed change transition
    }));
  },

  toggleLoopMode: () => {
    set((state) => ({
      simulation: { ...state.simulation, loopMode: !state.simulation.loopMode },
      lastTickTime: performance.now(),
    }));
  },

  tickSimulation: (isStep: boolean = true) => {
    const { edges, simulation, simulationTimeMs, lastTickTime } = get();

    let nextTimeMs = simulationTimeMs;
    let nextLastTickTime = lastTickTime;

    if (!isStep && simulation.isRunning && !simulation.isPaused) {
      const now = performance.now();
      const elapsedWallTime = lastTickTime > 0 ? now - lastTickTime : 0;
      const cappedWallTime = Math.min(100, elapsedWallTime); // cap huge deltas
      nextTimeMs = simulationTimeMs + cappedWallTime * simulation.speed;
      nextLastTickTime = now;
    }

    // Step 1: Walk every clock edge between the previous and target time so fast clocks don't skip edges
    let stepTime = simulationTimeMs;
    for (let i = 0; i < MAX_CLOCK_EDGES_PER_TICK; i++) {
      const nextEdge = getNextClockEdge(get().nodes, stepTime);
      if (nextEdge === null || nextEdge >= nextTimeMs) break;
      stepTime = nextEdge;
      get().updateClocks(stepTime);
      const intermediate = propagateSignals(get().nodes, edges, get().customComponents, { timeMs: stepTime });
      set({ nodes: intermediate.nodes });
    }

    // Step 2: Settle the circuit at the target simulation time
    get().updateClocks(nextTimeMs);
    const result = propagateSignals(get().nodes, edges, get().customComponents, { timeMs: nextTimeMs });

    set({
      nodes: result.nodes,
      edges: result.edges,
      simulationTimeMs: nextTimeMs,
      lastTickTime: nextLastTickTime,
      simulation: {
        ...simulation,
        stepCount: simulation.stepCount + 1,
      },
    });

    // Step 3: Sample oscilloscopes
    get().sampleOscilloscopes(nextTimeMs);
  },

  // Clock Node Actions
  startClockNode: (nodeId: string) => {
    const now = performance.now();
    const simTime = get().simulationTimeMs;
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const curState = data.clockState || DEFAULT_CLOCK_STATE;
        // Resume a paused clock where it left off; a stopped clock starts a fresh period now
        const phaseOriginMs = curState.status === 'paused' && curState.pausedAtMs !== undefined
          ? (curState.phaseOriginMs ?? 0) + (simTime - curState.pausedAtMs)
          : simTime;
        return {
          ...node,
          data: {
            ...data,
            clockState: {
              ...curState,
              status: 'running',
              lastTickTime: now,
              phaseAccumulator: 0,
              phaseOriginMs,
              pausedAtMs: undefined,
            },
          },
        };
      }
      return node;
    });
    set({ nodes });
  },

  pauseClockNode: (nodeId: string) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const curState = data.clockState || DEFAULT_CLOCK_STATE;
        return {
          ...node,
          data: {
            ...data,
            clockState: { ...curState, status: 'paused', pausedAtMs: get().simulationTimeMs },
          },
        };
      }
      return node;
    });
    set({ nodes });
  },

  resetClockNode: (nodeId: string) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const curConfig = data.clockConfig || DEFAULT_CLOCK_CONFIG;
        const curState = data.clockState || DEFAULT_CLOCK_STATE;
        const startVal = curConfig.startState === 'high' ? 1 : 0;
        return {
          ...node,
          data: {
            ...data,
            value: startVal,
            outputs: (data.outputs || []).map((p) => ({ ...p, value: startVal })),
            clockState: {
              ...curState,
              status: 'stopped',
              tickCount: 0,
              outputValue: startVal,
              lastTickTime: 0,
              phaseAccumulator: 0,
            },
          },
        };
      }
      return node;
    });
    set({ nodes });
    get().tickSimulation(true);
  },

  stopClockNode: (nodeId: string) => {
    get().resetClockNode(nodeId);
  },

  singleTickClockNode: (nodeId: string) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const curState = data.clockState || DEFAULT_CLOCK_STATE;
        const curVal = data.value === 1 ? 0 : 1;
        const nextTick = curState.tickCount + 1;
        return {
          ...node,
          data: {
            ...data,
            value: curVal,
            outputs: (data.outputs || []).map((p) => ({ ...p, value: curVal })),
            clockState: { ...curState, tickCount: nextTick, outputValue: curVal },
          },
        };
      }
      return node;
    });
    set({ nodes });
    get().tickSimulation(true);
  },

  updateClockConfig: (nodeId: string, config: Partial<ClockConfig>) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const curConfig = data.clockConfig || DEFAULT_CLOCK_CONFIG;
        const curState = data.clockState || DEFAULT_CLOCK_STATE;
        const newConfig = { ...curConfig, ...config };

        let newVal = data.value;
        let newOutputVal = curState.outputValue;
        let newOutputs = data.outputs;

        if (config.startState !== undefined && curState.status === 'stopped') {
          const startVal = config.startState === 'high' ? 1 : 0;
          newVal = startVal;
          newOutputVal = startVal;
          newOutputs = (data.outputs || []).map((p) => ({ ...p, value: startVal }));
        }

        // Reset phase accumulator when frequency or duty cycle changes
        const freqChanged = config.frequencyHz !== undefined || config.dutyCycle !== undefined;

        return {
          ...node,
          data: {
            ...data,
            value: newVal,
            outputs: newOutputs,
            clockConfig: newConfig,
            clockState: {
              ...curState,
              outputValue: newOutputVal,
              ...(freqChanged ? { phaseAccumulator: 0, lastTickTime: performance.now() } : {}),
            },
          },
        };
      }
      return node;
    });
    set({ nodes });
    get().tickSimulation(true);
  },

  tickClockNode: (nodeId: string) => {
    const now = performance.now();
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const curState = data.clockState || DEFAULT_CLOCK_STATE;
        if (curState.status !== 'running') return node;

        const curVal = data.value === 1 ? 0 : 1;
        const nextTick = curState.tickCount + 1;
        return {
          ...node,
          data: {
            ...data,
            value: curVal,
            outputs: data.outputs.map((p) => ({ ...p, value: curVal })),
            clockState: {
              ...curState,
              tickCount: nextTick,
              outputValue: curVal,
              lastTickTime: now,
              phaseAccumulator: 0,
            },
          },
        };
      }
      return node;
    });
    set({ nodes });
    get().tickSimulation(true);
  },

  // Multi-Input Actions
  updateClocks: (currentTime: number) => {
    const { nodes } = get();
    let changed = false;
    const nextNodes = nodes.map((node) => {
      if (node.type === 'clockNode') {
        const data = node.data as unknown as NodeData;
        const config = data.clockConfig || DEFAULT_CLOCK_CONFIG;
        const state = data.clockState || DEFAULT_CLOCK_STATE;

        if (!isClockRunning(config, state)) return node;

        const newValue = clockValueAt(config, state, currentTime);
        if (data.value !== newValue) {
          changed = true;
          // Count full cycles (rising edges), not every level change
          const nextTick = newValue === 1 ? state.tickCount + 1 : state.tickCount;
          return {
            ...node,
            data: {
              ...data,
              value: newValue,
              outputs: (data.outputs || []).map((p) => ({ ...p, value: newValue })),
              clockState: {
                ...state,
                tickCount: nextTick,
                outputValue: newValue,
                lastTickTime: performance.now(),
              },
            },
          };
        }
      }
      return node;
    });

    if (changed) {
      set({ nodes: nextNodes });
    }
  },

  sampleOscilloscopes: (currentTime: number) => {
    const { nodes } = get();
    nodes.forEach((node) => {
      if (node.type === 'oscilloscope') {
        const data = node.data as unknown as NodeData;
        const config = data.scopeConfig || DEFAULT_OSCILLOSCOPE_CONFIG;
        if (config.isPaused) return;

        let buffer = oscilloscopeBuffers.get(node.id);
        const limit = config.bufferSize || 2000;

        if (!buffer) {
          buffer = {
            samples: new Array(limit).fill(0),
            writeIndex: 0,
            lastSampleSimTime: currentTime,
          };
          oscilloscopeBuffers.set(node.id, buffer);
        }

        // Resize buffer if limit changed
        if (buffer.samples.length !== limit) {
          const newSamples = new Array(limit).fill(0);
          const oldLen = buffer.samples.length;
          const w = buffer.writeIndex;
          for (let i = 0; i < Math.min(oldLen, limit); i++) {
            newSamples[i] = buffer.samples[(w - i - 1 + oldLen) % oldLen];
          }
          buffer.samples = newSamples;
          buffer.writeIndex = Math.min(oldLen, limit) % limit;
        }

        const selectedIdx = config.selectedBitIndex ?? 0;
        const activeInputPin = data.inputs[selectedIdx] || data.inputs[0];
        const currentSignalVal = activeInputPin?.value === 1 ? 1 : 0;

        const sampleIntervalMs = 1000 / config.sampleRateHz;
        const elapsed = currentTime - buffer.lastSampleSimTime;

        if (elapsed >= sampleIntervalMs) {
          const sampleCount = Math.floor(elapsed / sampleIntervalMs);
          const samples = buffer.samples;
          let w = buffer.writeIndex;
          const N = samples.length;

          for (let i = 0; i < sampleCount; i++) {
            samples[w] = currentSignalVal;
            w = (w + 1) % N;
          }

          buffer.writeIndex = w;
          buffer.lastSampleSimTime += sampleCount * sampleIntervalMs;
        }
      }
    });
  },

  getOscilloscopeBuffer: (nodeId: string) => {
    return oscilloscopeBuffers.get(nodeId);
  },

  clearOscilloscopeBuffer: (nodeId: string) => {
    const buffer = oscilloscopeBuffers.get(nodeId);
    if (buffer) {
      buffer.samples.fill(0);
      buffer.writeIndex = 0;
    }
  },
});
