import { create } from 'zustand';
import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
} from '@xyflow/react';
import { NodeData, GateType, SimulationState, PinData, CircuitPreset } from '../types/circuit';
import { EncoderConfig, DEFAULT_ENCODER_CONFIG } from '../types/encoder';
import { createEncoderPins } from '../utils/encoderPins';
import { SevenSegmentConfig, DEFAULT_SEVEN_SEGMENT_CONFIG } from '../types/sevenSegment';
import { createSevenSegmentPins } from '../utils/sevenSegmentPins';
import { ClockConfig, ClockState, DEFAULT_CLOCK_CONFIG, DEFAULT_CLOCK_STATE } from '../types/clock';
import { MultiInputConfig, DEFAULT_MULTI_INPUT_CONFIG, generateInputLabels } from '../types/multiInput';
import { createMultiInputPins } from '../utils/multiInputPins';
import { propagateSignals } from '../simulation/engine';
import { CIRCUIT_PRESETS } from '../utils/presets';

interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
}

interface CircuitStore {
  nodes: Node[];
  edges: Edge[];
  simulation: SimulationState;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  // History stack
  historyPast: HistorySnapshot[];
  historyFuture: HistorySnapshot[];
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;

  // React Flow Handlers
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  // Selection
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;

  // Node operations
  addNode: (gateType: GateType, position: { x: number; y: number }) => void;
  deleteSelected: () => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateNodeInputCount: (nodeId: string, count: number) => void;
  updateEncoderConfig: (nodeId: string, config: Partial<EncoderConfig>) => void;
  updateSevenSegmentConfig: (nodeId: string, config: Partial<SevenSegmentConfig>) => void;
  toggleInputValue: (nodeId: string) => void;

  // Clock Node Controls
  startClockNode: (nodeId: string) => void;
  pauseClockNode: (nodeId: string) => void;
  stopClockNode: (nodeId: string) => void;
  resetClockNode: (nodeId: string) => void;
  singleTickClockNode: (nodeId: string) => void;
  updateClockConfig: (nodeId: string, config: Partial<ClockConfig>) => void;
  tickClockNode: (nodeId: string) => void;

  // Encoder Node Manual Controls
  toggleEncoderInputPin: (nodeId: string, pinIdx: number) => void;
  setAllEncoderInputs: (nodeId: string, value: 0 | 1) => void;
  invertAllEncoderInputs: (nodeId: string) => void;

  // Multi-Input Node Controls
  updateMultiInputConfig: (nodeId: string, config: Partial<MultiInputConfig>) => void;
  toggleMultiInputBit: (nodeId: string, bitIndex: number) => void;
  setMultiInputBit: (nodeId: string, bitIndex: number, value: 0 | 1) => void;
  setAllMultiInput: (nodeId: string, value: 0 | 1) => void;
  invertAllMultiInput: (nodeId: string) => void;
  randomizeMultiInput: (nodeId: string) => void;
  incrementMultiInputCounter: (nodeId: string) => void;

  // Simulation controls
  startSimulation: () => void;
  pauseSimulation: () => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
  stepSimulation: () => void;
  setSpeed: (speed: number) => void;
  toggleLoopMode: () => void;
  tickSimulation: (isStep?: boolean) => void;

  // Theme & Toasts
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  toastMessage: string | null;
  showToast: (message: string) => void;

  // Project management
  presets: CircuitPreset[];
  loadCircuit: (nodes: Node[], edges: Edge[]) => void;
  loadPreset: (presetId: string) => void;
  addPreset: (data: { name: string; category: string; description: string }) => string;
  updatePreset: (presetId: string, data: { name?: string; category?: string; description?: string; updateCircuit?: boolean }) => void;
  removePreset: (presetId: string) => void;
  resetPresetsToDefault: () => void;
  clearCanvas: () => void;
}

const DEFAULT_SIMULATION: SimulationState = {
  isRunning: true,
  isPaused: false,
  speed: 1, // 1x
  stepCount: 0,
  loopMode: true,
};

const STORAGE_KEY_PRESETS = 'logic_studio_presets';

const getInitialPresets = (): CircuitPreset[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PRESETS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load presets from localStorage', e);
  }
  return CIRCUIT_PRESETS;
};

const savePresetsToStorage = (presets: CircuitPreset[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to save presets to localStorage', e);
  }
};

// Initial state with Half Adder preset loaded by default
const initialPreset = CIRCUIT_PRESETS[0];

const STORAGE_KEY_THEME = 'logic_studio_theme';

const getInitialTheme = (): 'dark' | 'light' => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_THEME);
    if (stored === 'light' || stored === 'dark') {
      if (stored === 'light') document.documentElement.classList.add('light');
      else document.documentElement.classList.remove('light');
      return stored;
    }
  } catch (e) {
    console.error('Failed to read theme', e);
  }
  return 'dark';
};

export const useCircuitStore = create<CircuitStore>((set, get) => ({
  nodes: initialPreset.nodes,
  edges: initialPreset.edges,
  presets: getInitialPresets(),
  simulation: DEFAULT_SIMULATION,
  selectedNodeId: null,
  selectedEdgeId: null,

  theme: getInitialTheme(),
  toastMessage: null,

  setTheme: (theme) => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch (e) {
      console.error('Failed to save theme', e);
    }
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    set({ theme });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },

  showToast: (message) => {
    set({ toastMessage: message });
    setTimeout(() => {
      if (get().toastMessage === message) {
        set({ toastMessage: null });
      }
    }, 2800);
  },

  historyPast: [],
  historyFuture: [],

  saveHistory: () => {
    const { nodes, edges, historyPast } = get();
    // Keep max 30 snapshots
    const newPast = [...historyPast.slice(-29), { nodes, edges }];
    set({ historyPast: newPast, historyFuture: [] });
  },

  undo: () => {
    const { historyPast, historyFuture, nodes, edges } = get();
    if (historyPast.length === 0) return;

    const previous = historyPast[historyPast.length - 1];
    const newPast = historyPast.slice(0, -1);
    const newFuture = [{ nodes, edges }, ...historyFuture];

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      historyPast: newPast,
      historyFuture: newFuture,
    });

    // Re-propagate signals after state change
    get().tickSimulation();
  },

  redo: () => {
    const { historyPast, historyFuture, nodes, edges } = get();
    if (historyFuture.length === 0) return;

    const next = historyFuture[0];
    const newFuture = historyFuture.slice(1);
    const newPast = [...historyPast, { nodes, edges }];

    set({
      nodes: next.nodes,
      edges: next.edges,
      historyPast: newPast,
      historyFuture: newFuture,
    });

    get().tickSimulation();
  },

  onNodesChange: (changes) => {
    const updatedNodes = applyNodeChanges(changes, get().nodes);
    set({ nodes: updatedNodes });

    // Find if node selection changed
    const selectionChange = changes.find((c) => c.type === 'select');
    if (selectionChange) {
      if (selectionChange.selected) {
        set({ selectedNodeId: selectionChange.id });
      } else if (get().selectedNodeId === selectionChange.id) {
        set({ selectedNodeId: null });
      }
    }
  },

  onEdgesChange: (changes) => {
    const updatedEdges = applyEdgeChanges(changes, get().edges);
    set({ edges: updatedEdges });

    const selectionChange = changes.find((c) => c.type === 'select');
    if (selectionChange) {
      if (selectionChange.selected) {
        set({ selectedEdgeId: selectionChange.id });
      } else if (get().selectedEdgeId === selectionChange.id) {
        set({ selectedEdgeId: null });
      }
    }
  },

  onConnect: (connection: Connection) => {
    if (!connection.source || !connection.target) return;

    // Prevent connecting to self or same node
    if (connection.source === connection.target) return;

    get().saveHistory();

    const newEdge: Edge = {
      id: `e-${connection.source}-${connection.sourceHandle || '0'}-${connection.target}-${connection.targetHandle || '0'}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'signalEdge',
      data: { signalValue: -1 },
    };

    // Filter out existing edge connected to the same target handle (inputs can only receive 1 wire)
    const filteredEdges = get().edges.filter(
      (e) => !(e.target === connection.target && e.targetHandle === connection.targetHandle)
    );

    const nextEdges = [...filteredEdges, newEdge];
    set({ edges: nextEdges });

    // Propagate signals immediately
    get().tickSimulation();
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),

  addNode: (gateType: GateType, position: { x: number; y: number }) => {
    get().saveHistory();

    const id = `${gateType.toLowerCase()}-${Date.now()}`;
    let nodeLabel: string = gateType;
    let inputsCount = 2;
    let typeName = 'logicGate';

    if (gateType === 'INPUT') {
      nodeLabel = 'Digital Input';
      inputsCount = 0;
      typeName = 'digitalInput';
    } else if (gateType === 'OUTPUT') {
      nodeLabel = 'Digital Output';
      inputsCount = 1;
      typeName = 'digitalOutput';
    } else if (gateType === 'CLOCK') {
      nodeLabel = 'Clock Generator';
      inputsCount = 0;
      typeName = 'clockNode';
    } else if (gateType === 'MULTI_INPUT') {
      nodeLabel = 'Multi-Input Bus';
      inputsCount = 0;
      typeName = 'multiInput';
    } else if (gateType === 'SEVEN_SEGMENT') {
      nodeLabel = '7-Segment Display';
      inputsCount = 4;
      typeName = 'sevenSegment';
    } else if (gateType === 'ENCODER') {
      nodeLabel = 'Encoder';
      typeName = 'encoderNode';
    } else if (gateType === 'NOT') {
      inputsCount = 1;
    }

    let inputs: PinData[] = [];
    let outputs: PinData[] = [];

    if (gateType === 'ENCODER') {
      const encConfig = DEFAULT_ENCODER_CONFIG;
      const pins = createEncoderPins(encConfig);
      inputs = pins.inputs;
      outputs = pins.outputs;
    } else if (gateType === 'SEVEN_SEGMENT') {
      const segConfig = DEFAULT_SEVEN_SEGMENT_CONFIG;
      inputs = createSevenSegmentPins(segConfig);
      outputs = [];
    } else if (gateType === 'MULTI_INPUT') {
      inputs = [];
      outputs = createMultiInputPins(DEFAULT_MULTI_INPUT_CONFIG);
    } else {
      inputs = Array.from({ length: inputsCount }, (_, i) => ({
        id: `in-${i}`,
        name: inputsCount === 1 ? 'In' : `In ${i + 1}`,
        value: -1,
      }));

      outputs = gateType === 'OUTPUT' ? [] : [
        { id: 'out-0', name: 'Out', value: gateType === 'INPUT' ? 0 : gateType === 'CLOCK' ? 0 : -1 },
      ];
    }

    const newNode: Node = {
      id,
      type: typeName,
      position,
      data: {
        label: nodeLabel,
        gateType,
        value: gateType === 'INPUT' ? 0 : gateType === 'CLOCK' ? 0 : -1,
        inputCount: inputsCount,
        inputs,
        outputs,
        ...(gateType === 'CLOCK' ? { clockConfig: DEFAULT_CLOCK_CONFIG, clockState: DEFAULT_CLOCK_STATE } : {}),
        ...(gateType === 'MULTI_INPUT' ? { multiInputConfig: DEFAULT_MULTI_INPUT_CONFIG } : {}),
        ...(gateType === 'ENCODER' ? { encoderConfig: DEFAULT_ENCODER_CONFIG } : {}),
        ...(gateType === 'SEVEN_SEGMENT' ? { sevenSegmentConfig: DEFAULT_SEVEN_SEGMENT_CONFIG } : {}),
      } as unknown as Record<string, unknown>,
    };

    set({ nodes: [...get().nodes, newNode], selectedNodeId: id });
    get().tickSimulation();
  },

  deleteSelected: () => {
    const { nodes, edges, selectedNodeId, selectedEdgeId } = get();
    if (!selectedNodeId && !selectedEdgeId) return;

    get().saveHistory();

    let newNodes = [...nodes];
    let newEdges = [...edges];

    if (selectedNodeId) {
      newNodes = newNodes.filter((n) => n.id !== selectedNodeId);
      // Remove connected edges
      newEdges = newEdges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId);
    }

    if (selectedEdgeId) {
      newEdges = newEdges.filter((e) => e.id !== selectedEdgeId);
    }

    set({
      nodes: newNodes,
      edges: newEdges,
      selectedNodeId: null,
      selectedEdgeId: null,
    });

    get().tickSimulation();
  },

  updateNodeLabel: (nodeId: string, label: string) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            label,
          },
        };
      }
      return node;
    });
    set({ nodes });
  },

  updateNodeInputCount: (nodeId: string, count: number) => {
    get().saveHistory();

    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const currentInputs = data.inputs || [];
        const newInputs: PinData[] = Array.from({ length: count }, (_, i) => ({
          id: `in-${i}`,
          name: `In ${i + 1}`,
          value: currentInputs[i]?.value ?? -1,
        }));

        return {
          ...node,
          data: {
            ...data,
            inputCount: count,
            inputs: newInputs,
          },
        };
      }
      return node;
    });

    // Clean up edges connected to removed handles
    const newEdges = get().edges.filter((e) => {
      if (e.target === nodeId) {
        const handleIndex = parseInt(e.targetHandle?.replace('in-', '') || '0', 10);
        return handleIndex < count;
      }
      return true;
    });

    set({ nodes, edges: newEdges });
    get().tickSimulation();
  },

  updateEncoderConfig: (nodeId: string, partialConfig: Partial<EncoderConfig>) => {
    get().saveHistory();

    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const currentConfig = data.encoderConfig || DEFAULT_ENCODER_CONFIG;
        const newConfig = { ...currentConfig, ...partialConfig };

        const { inputs, outputs } = createEncoderPins(newConfig, data.inputs, data.outputs);

        return {
          ...node,
          data: {
            ...data,
            encoderConfig: newConfig,
            inputs,
            outputs,
          },
        };
      }
      return node;
    });

    // Clean up edges connected to handles that no longer exist
    const updatedNode = nodes.find((n) => n.id === nodeId);
    if (updatedNode) {
      const data = updatedNode.data as unknown as NodeData;
      const validInHandles = new Set(data.inputs.map((p) => p.id));
      const validOutHandles = new Set(data.outputs.map((p) => p.id));

      const newEdges = get().edges.filter((e) => {
        if (e.target === nodeId && e.targetHandle && !validInHandles.has(e.targetHandle)) {
          return false;
        }
        if (e.source === nodeId && e.sourceHandle && !validOutHandles.has(e.sourceHandle)) {
          return false;
        }
        return true;
      });

      set({ nodes, edges: newEdges });
    } else {
      set({ nodes });
    }

    get().tickSimulation();
  },

  toggleEncoderInputPin: (nodeId: string, pinIdx: number) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const inputs = data.inputs ? [...data.inputs] : [];
        if (inputs[pinIdx]) {
          const curVal = inputs[pinIdx].value;
          const newVal = curVal === 1 ? 0 : 1;
          inputs[pinIdx] = { ...inputs[pinIdx], value: newVal };
        }
        return {
          ...node,
          data: {
            ...data,
            inputs,
          },
        };
      }
      return node;
    });
    set({ nodes });
    get().tickSimulation(true);
  },

  setAllEncoderInputs: (nodeId: string, value: 0 | 1) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const inputs = (data.inputs || []).map((pin) => ({ ...pin, value }));
        return {
          ...node,
          data: { ...data, inputs },
        };
      }
      return node;
    });
    set({ nodes });
    get().tickSimulation(true);
  },

  invertAllEncoderInputs: (nodeId: string) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const inputs = (data.inputs || []).map((pin) => ({
          ...pin,
          value: pin.value === 1 ? 0 : 1,
        }));
        return {
          ...node,
          data: { ...data, inputs },
        };
      }
      return node;
    });
    set({ nodes });
    get().tickSimulation(true);
  },

  updateSevenSegmentConfig: (nodeId: string, partialConfig: Partial<SevenSegmentConfig>) => {
    get().saveHistory();

    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const currentConfig: SevenSegmentConfig = (data.sevenSegmentConfig as SevenSegmentConfig) || DEFAULT_SEVEN_SEGMENT_CONFIG;
        const newConfig: SevenSegmentConfig = { ...currentConfig, ...partialConfig };

        const newInputs = createSevenSegmentPins(newConfig, data.inputs);

        return {
          ...node,
          data: {
            ...data,
            sevenSegmentConfig: newConfig,
            inputs: newInputs,
          },
        };
      }
      return node;
    });

    // Clean up edges connected to handles that no longer exist
    const updatedNode = nodes.find((n) => n.id === nodeId);
    if (updatedNode) {
      const data = updatedNode.data as unknown as NodeData;
      const validInHandles = new Set(data.inputs.map((p) => p.id));

      const newEdges = get().edges.filter((e) => {
        if (e.target === nodeId && e.targetHandle && !validInHandles.has(e.targetHandle)) {
          return false;
        }
        return true;
      });

      set({ nodes, edges: newEdges });
    } else {
      set({ nodes });
    }

    get().tickSimulation();
  },

  toggleInputValue: (nodeId: string) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const currentVal = data.value ?? 0;
        const newVal = currentVal === 1 ? 0 : 1;
        return {
          ...node,
          data: {
            ...data,
            value: newVal,
            outputs: data.outputs.map((p) => ({ ...p, value: newVal })),
          },
        };
      }
      return node;
    });

    set({ nodes });
    get().tickSimulation();
  },

  startSimulation: () => {
    set((state) => ({
      simulation: { ...state.simulation, isRunning: true, isPaused: false },
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

    set({
      nodes,
      edges,
      simulation: { ...get().simulation, stepCount: 0 },
    });

    get().tickSimulation();
  },

  stepSimulation: () => {
    get().tickSimulation(true);
  },

  setSpeed: (speed) => {
    set((state) => ({
      simulation: { ...state.simulation, speed },
    }));
  },

  toggleLoopMode: () => {
    set((state) => ({
      simulation: { ...state.simulation, loopMode: !state.simulation.loopMode },
    }));
  },

  tickSimulation: (isStep: boolean = true) => {
    const { nodes, edges, simulation } = get();
    const result = propagateSignals(nodes, edges, false);

    set({
      nodes: result.nodes,
      edges: result.edges,
      simulation: {
        ...simulation,
        stepCount: simulation.stepCount + 1,
      },
    });
  },

  // Clock Node Actions
  startClockNode: (nodeId: string) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const curState = data.clockState || DEFAULT_CLOCK_STATE;
        return {
          ...node,
          data: {
            ...data,
            clockState: { ...curState, status: 'running' },
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
            clockState: { ...curState, status: 'paused' },
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
            clockState: { ...curState, status: 'stopped', tickCount: 0, outputValue: startVal },
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

        return {
          ...node,
          data: {
            ...data,
            value: newVal,
            outputs: newOutputs,
            clockConfig: newConfig,
            clockState: { ...curState, outputValue: newOutputVal },
          },
        };
      }
      return node;
    });
    set({ nodes });
    get().tickSimulation(true);
  },

  tickClockNode: (nodeId: string) => {
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
            clockState: { ...curState, tickCount: nextTick, outputValue: curVal },
          },
        };
      }
      return node;
    });
    set({ nodes });
    get().tickSimulation(true);
  },

  // Multi-Input Actions
  updateMultiInputConfig: (nodeId: string, partialConfig: Partial<MultiInputConfig>) => {
    const { nodes, edges } = get();
    let newEdges = edges;

    const newNodes = nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const currentConfig = data.multiInputConfig || DEFAULT_MULTI_INPUT_CONFIG;
        const newCount = Math.max(1, Math.min(32, partialConfig.inputCount ?? currentConfig.inputCount));
        
        let newValues = [...(partialConfig.values ?? currentConfig.values)];
        if (newValues.length < newCount) {
          while (newValues.length < newCount) newValues.push(0);
        } else if (newValues.length > newCount) {
          newValues = newValues.slice(0, newCount);
        }

        const newLabels = generateInputLabels(newCount);

        const newConfig: MultiInputConfig = {
          inputCount: newCount,
          values: newValues,
          labels: newLabels,
        };

        const newOutputs = createMultiInputPins(newConfig, data.outputs);

        const validHandleIds = new Set(newOutputs.map((p) => p.id));
        newEdges = edges.filter(
          (edge) => !(edge.source === nodeId && edge.sourceHandle && !validHandleIds.has(edge.sourceHandle))
        );

        return {
          ...node,
          data: {
            ...data,
            multiInputConfig: newConfig,
            outputs: newOutputs,
          },
        };
      }
      return node;
    });

    set({ nodes: newNodes, edges: newEdges });
    get().tickSimulation(true);
  },

  toggleMultiInputBit: (nodeId: string, bitIndex: number) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const config = data.multiInputConfig || DEFAULT_MULTI_INPUT_CONFIG;
        const newValues = [...config.values];
        newValues[bitIndex] = newValues[bitIndex] === 1 ? 0 : 1;

        const newConfig = { ...config, values: newValues };
        const newOutputs = createMultiInputPins(newConfig, data.outputs);

        return {
          ...node,
          data: {
            ...data,
            multiInputConfig: newConfig,
            outputs: newOutputs,
          },
        };
      }
      return node;
    });

    set({ nodes });
    get().tickSimulation(true);
  },

  setMultiInputBit: (nodeId: string, bitIndex: number, value: 0 | 1) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const config = data.multiInputConfig || DEFAULT_MULTI_INPUT_CONFIG;
        const newValues = [...config.values];
        newValues[bitIndex] = value;

        const newConfig = { ...config, values: newValues };
        const newOutputs = createMultiInputPins(newConfig, data.outputs);

        return {
          ...node,
          data: {
            ...data,
            multiInputConfig: newConfig,
            outputs: newOutputs,
          },
        };
      }
      return node;
    });

    set({ nodes });
    get().tickSimulation(true);
  },

  setAllMultiInput: (nodeId: string, value: 0 | 1) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const config = data.multiInputConfig || DEFAULT_MULTI_INPUT_CONFIG;
        const newValues = config.values.map(() => value);

        const newConfig = { ...config, values: newValues };
        const newOutputs = createMultiInputPins(newConfig, data.outputs);

        return {
          ...node,
          data: {
            ...data,
            multiInputConfig: newConfig,
            outputs: newOutputs,
          },
        };
      }
      return node;
    });

    set({ nodes });
    get().tickSimulation(true);
  },

  invertAllMultiInput: (nodeId: string) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const config = data.multiInputConfig || DEFAULT_MULTI_INPUT_CONFIG;
        const newValues = config.values.map((v) => (v === 1 ? 0 : 1));

        const newConfig = { ...config, values: newValues };
        const newOutputs = createMultiInputPins(newConfig, data.outputs);

        return {
          ...node,
          data: {
            ...data,
            multiInputConfig: newConfig,
            outputs: newOutputs,
          },
        };
      }
      return node;
    });

    set({ nodes });
    get().tickSimulation(true);
  },

  randomizeMultiInput: (nodeId: string) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const config = data.multiInputConfig || DEFAULT_MULTI_INPUT_CONFIG;
        const newValues = config.values.map(() => (Math.random() < 0.5 ? 0 : 1));

        const newConfig = { ...config, values: newValues };
        const newOutputs = createMultiInputPins(newConfig, data.outputs);

        return {
          ...node,
          data: {
            ...data,
            multiInputConfig: newConfig,
            outputs: newOutputs,
          },
        };
      }
      return node;
    });

    set({ nodes });
    get().tickSimulation(true);
  },

  incrementMultiInputCounter: (nodeId: string) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const config = data.multiInputConfig || DEFAULT_MULTI_INPUT_CONFIG;
        
        let currentInt = 0;
        config.values.forEach((v, idx) => {
          if (v === 1) currentInt += Math.pow(2, idx);
        });

        const maxVal = Math.pow(2, config.inputCount);
        const nextInt = (currentInt + 1) % maxVal;

        const newValues = Array.from({ length: config.inputCount }, (_, idx) => {
          return ((nextInt >> idx) & 1) === 1 ? 1 : 0;
        });

        const newConfig = { ...config, values: newValues };
        const newOutputs = createMultiInputPins(newConfig, data.outputs);

        return {
          ...node,
          data: {
            ...data,
            multiInputConfig: newConfig,
            outputs: newOutputs,
          },
        };
      }
      return node;
    });

    set({ nodes });
    get().tickSimulation(true);
  },

  loadCircuit: (nodes, edges) => {
    get().saveHistory();
    set({
      nodes,
      edges,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
    get().tickSimulation();
  },

  loadPreset: (presetId) => {
    const preset = get().presets.find((p) => p.id === presetId);
    if (preset) {
      get().loadCircuit(preset.nodes, preset.edges);
    }
  },

  addPreset: (data) => {
    const newPreset: CircuitPreset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: data.name.trim() || 'Custom Preset',
      category: data.category.trim() || 'Custom',
      description: data.description.trim() || 'Custom user created circuit preset.',
      nodes: JSON.parse(JSON.stringify(get().nodes)),
      edges: JSON.parse(JSON.stringify(get().edges)),
    };
    const updatedPresets = [newPreset, ...get().presets];
    set({ presets: updatedPresets });
    savePresetsToStorage(updatedPresets);
    return newPreset.id;
  },

  updatePreset: (presetId, data) => {
    const updatedPresets = get().presets.map((p) => {
      if (p.id === presetId) {
        return {
          ...p,
          name: data.name !== undefined ? data.name.trim() : p.name,
          category: data.category !== undefined ? data.category.trim() : p.category,
          description: data.description !== undefined ? data.description.trim() : p.description,
          nodes: data.updateCircuit ? JSON.parse(JSON.stringify(get().nodes)) : p.nodes,
          edges: data.updateCircuit ? JSON.parse(JSON.stringify(get().edges)) : p.edges,
        };
      }
      return p;
    });
    set({ presets: updatedPresets });
    savePresetsToStorage(updatedPresets);
  },

  removePreset: (presetId) => {
    const updatedPresets = get().presets.filter((p) => p.id !== presetId);
    set({ presets: updatedPresets });
    savePresetsToStorage(updatedPresets);
  },

  resetPresetsToDefault: () => {
    set({ presets: CIRCUIT_PRESETS });
    savePresetsToStorage(CIRCUIT_PRESETS);
  },

  clearCanvas: () => {
    get().saveHistory();
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },
}));
