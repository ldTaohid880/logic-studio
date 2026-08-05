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
import { ClockConfig, ClockState, DEFAULT_CLOCK_CONFIG, DEFAULT_CLOCK_STATE, toHz } from '../types/clock';
import { DEFAULT_OSCILLOSCOPE_CONFIG } from '../types/oscilloscope';
import { MultiInputConfig, DEFAULT_MULTI_INPUT_CONFIG, generateInputLabels } from '../types/multiInput';
import { createMultiInputPins } from '../utils/multiInputPins';
import { LedMatrixConfig, DEFAULT_LED_MATRIX_CONFIG } from '../types/ledMatrix';
import { createLedMatrixPins } from '../utils/ledMatrixPins';
import { propagateSignals } from '../simulation/engine';
import { getDefaultICPins } from '../simulation/icLogic';
import { CIRCUIT_PRESETS } from '../utils/presets';
import { CustomComponentDefinition, CustomPinDefinition, HierarchyBreadcrumb } from '../types/customComponent';
import { detectComponentRecursion } from '../simulation/customComponentLogic';
import { exportCustomComponentToJSON, parseCustomComponentFromJSON } from '../utils/customComponentIO';
import {
  DEFAULT_CFG_ENCODER_CONFIG,
  DEFAULT_CFG_DECODER_CONFIG,
  DEFAULT_CFG_MUX_CONFIG,
  DEFAULT_CFG_DEMUX_CONFIG,
  DEFAULT_CFG_COMPARATOR_CONFIG,
  DEFAULT_CFG_REGISTER_CONFIG,
  DEFAULT_CFG_SHIFT_REGISTER_CONFIG,
  DEFAULT_CFG_COUNTER_CONFIG,
  DEFAULT_CFG_CONSTANT_CONFIG,
  DEFAULT_CFG_BUS_SPLITTER_CONFIG,
  DEFAULT_CFG_BUS_JOINER_CONFIG,
  CfgEncoderConfig,
  CfgDecoderConfig,
  CfgMuxConfig,
  CfgDemuxConfig,
  CfgComparatorConfig,
  CfgRegisterConfig,
  CfgShiftRegisterConfig,
  CfgCounterConfig,
  CfgConstantConfig,
  CfgBusSplitterConfig,
  CfgBusJoinerConfig,
} from '../types/configurable';
import {
  createCfgEncoderPins,
  createCfgDecoderPins,
  createCfgMuxPins,
  createCfgDemuxPins,
  createCfgComparatorPins,
  createCfgRegisterPins,
  createCfgShiftRegisterPins,
  createCfgCounterPins,
  createCfgConstantPins,
  createCfgBusSplitterPins,
  createCfgBusJoinerPins,
} from '../utils/configurablePins';

const oscilloscopeBuffers = new Map<string, { samples: number[]; writeIndex: number; lastSampleSimTime: number }>();

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
  isDragging: boolean;
  setIsDragging: (val: boolean) => void;

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

  // Grouping
  groupSelectedNodes: (label?: string) => void;
  ungroupNode: (groupId: string) => void;

  // Node operations
  addNode: (gateType: GateType, position: { x: number; y: number }) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  copySelected: () => void;
  cutSelected: () => void;
  pasteClipboard: () => void;
  resetAllInputs: () => void;
  toggleLockNode: (nodeId: string) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateNodeInputCount: (nodeId: string, count: number) => void;
  updateEncoderConfig: (nodeId: string, config: Partial<EncoderConfig>) => void;
  updateSevenSegmentConfig: (nodeId: string, config: Partial<SevenSegmentConfig>) => void;
  updateConfigurableConfig: (nodeId: string, partialConfig: Record<string, any>) => void;
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

  // Wire Labels
  showWireLabels: boolean;
  toggleWireLabels: () => void;
  updateEdgeLabel: (edgeId: string, label: string) => void;
  updateEdgeColor: (edgeId: string, color: string | undefined) => void;

  // Inspector visibility
  showInspector: boolean;
  toggleInspector: () => void;

  // Pin Aliases
  updatePinAlias: (nodeId: string, pinId: string, alias: string) => void;

  // Led Matrix Config
  updateLedMatrixConfig: (nodeId: string, config: Partial<LedMatrixConfig>) => void;

  // Clock manual pulse
  triggerManualPulse: (nodeId: string) => void;

  // Simulation time-based logic
  simulationTimeMs: number;
  lastTickTime: number;
  updateClocks: (currentTime: number) => void;
  sampleOscilloscopes: (currentTime: number) => void;
  getOscilloscopeBuffer: (nodeId: string) => { samples: number[]; writeIndex: number; lastSampleSimTime: number } | undefined;
  clearOscilloscopeBuffer: (nodeId: string) => void;
  // Custom Components & Subcircuits
  customComponents: Record<string, CustomComponentDefinition>;
  hierarchyPath: HierarchyBreadcrumb[];
  rootCircuitState: { nodes: Node[]; edges: Edge[] } | null;
  addCustomComponent: (def: CustomComponentDefinition) => void;
  updateCustomComponent: (id: string, updates: Partial<CustomComponentDefinition>) => void;
  deleteCustomComponent: (id: string) => void;
  toggleFavoriteCustomComponent: (id: string) => void;
  convertSelectionToCustomComponent: (
    name: string,
    category: string,
    description?: string,
    customPins?: { inputs: CustomPinDefinition[]; outputs: CustomPinDefinition[] },
    color?: string,
    targetNodeIds?: string[]
  ) => string | null;
  instantiateCustomComponent: (customComponentId: string, position: { x: number; y: number }) => void;
  enterSubcircuitView: (componentId: string, instanceId?: string) => void;
  exitSubcircuitView: (targetDepth?: number) => void;
  findCustomComponentInstances: (componentId: string) => void;
  importCustomComponentJSON: (jsonString: string) => boolean;
  exportCustomComponentJSON: (componentId: string) => string | null;
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
        const validPresets = parsed.filter((p) => {
          return (
            p &&
            typeof p === 'object' &&
            typeof p.id === 'string' &&
            typeof p.name === 'string' &&
            Array.isArray(p.nodes) &&
            Array.isArray(p.edges)
          );
        });
        if (validPresets.length > 0) {
          return validPresets;
        }
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



import { BUILTIN_HALF_ADDER, BUILTIN_FULL_ADDER } from '../utils/builtinAdders';

const STORAGE_KEY_CUSTOM_COMPONENTS = 'logic_studio_custom_components';

const getInitialCustomComponents = (): Record<string, CustomComponentDefinition> => {
  let customComps: Record<string, CustomComponentDefinition> = {
    builtin_half_adder: BUILTIN_HALF_ADDER,
    builtin_full_adder: BUILTIN_FULL_ADDER,
  };
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_COMPONENTS);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        customComps = { ...customComps, ...parsed };
      }
    }
  } catch (e) {
    console.error('Failed to load custom components from localStorage', e);
  }
  customComps.builtin_half_adder = BUILTIN_HALF_ADDER;
  customComps.builtin_full_adder = BUILTIN_FULL_ADDER;
  saveCustomComponentsToStorage(customComps);
  return customComps;
};

const saveCustomComponentsToStorage = (customComponents: Record<string, CustomComponentDefinition>) => {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_COMPONENTS, JSON.stringify(customComponents));
  } catch (e) {
    console.error('Failed to save custom components to localStorage', e);
  }
};

export const useCircuitStore = create<CircuitStore>((set, get) => ({
  nodes: initialPreset.nodes,
  edges: initialPreset.edges,
  presets: getInitialPresets(),
  customComponents: getInitialCustomComponents(),
  hierarchyPath: [{ id: 'root', name: 'Main Project' }],
  rootCircuitState: null,
  simulation: DEFAULT_SIMULATION,
  simulationTimeMs: 0,
  lastTickTime: 0,
  selectedNodeId: null,
  selectedEdgeId: null,
  isDragging: false,
  setIsDragging: (isDragging) => set({ isDragging }),
  showWireLabels: true,
  showInspector: true,

  toastMessage: null,

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

    // Process all selection changes sequentially to find the final selected node
    let nextSelectedNodeId = get().selectedNodeId;
    changes.forEach((c) => {
      if (c.type === 'select') {
        if (c.selected) {
          nextSelectedNodeId = c.id;
        } else if (nextSelectedNodeId === c.id) {
          nextSelectedNodeId = null;
        }
      }
    });
    
    if (get().selectedNodeId !== nextSelectedNodeId) {
      set({ selectedNodeId: nextSelectedNodeId });
    }
  },

  onEdgesChange: (changes) => {
    const updatedEdges = applyEdgeChanges(changes, get().edges);
    set({ edges: updatedEdges });

    // Process all selection changes sequentially to find the final selected edge
    let nextSelectedEdgeId = get().selectedEdgeId;
    changes.forEach((c) => {
      if (c.type === 'select') {
        if (c.selected) {
          nextSelectedEdgeId = c.id;
        } else if (nextSelectedEdgeId === c.id) {
          nextSelectedEdgeId = null;
        }
      }
    });

    if (get().selectedEdgeId !== nextSelectedEdgeId) {
      set({ selectedEdgeId: nextSelectedEdgeId });
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
    } else if (gateType === 'PUSH_BUTTON') {
      nodeLabel = 'Push Button';
      inputsCount = 0;
      typeName = 'pushButton';
    } else if (gateType === 'DIP_SWITCH') {
      nodeLabel = 'DIP Switch';
      inputsCount = 0;
      typeName = 'dipSwitch';
    } else if (gateType === 'CONST_HIGH') {
      nodeLabel = 'Constant HIGH';
      inputsCount = 0;
      typeName = 'logicGate';
    } else if (gateType === 'CONST_LOW') {
      nodeLabel = 'Constant LOW';
      inputsCount = 0;
      typeName = 'logicGate';
    } else if (gateType === 'RGB_LED') {
      nodeLabel = 'RGB LED';
      inputsCount = 3;
      typeName = 'rgbLed';
    } else if (gateType === 'LOGIC_PROBE') {
      nodeLabel = 'Logic Probe';
      inputsCount = 1;
      typeName = 'logicProbe';
    } else if (gateType === 'HEX_DISPLAY') {
      nodeLabel = 'Hex Display';
      inputsCount = 4;
      typeName = 'hexDisplay';
    } else if (gateType === 'BUS_MONITOR') {
      nodeLabel = 'Bus Monitor';
      inputsCount = 4;
      typeName = 'busMonitor';
    } else if (gateType === 'OSCILLOSCOPE') {
      nodeLabel = 'Digital Oscilloscope';
      inputsCount = 4;
      typeName = 'oscilloscope';
    } else if (gateType === 'LED_MATRIX') {
      nodeLabel = 'LED Matrix Display';
      inputsCount = 16;
      typeName = 'ledMatrix';
    } else if (gateType === 'BOOLEAN_EQUATION_GENERATOR') {
      nodeLabel = 'Boolean Equation Generator';
      inputsCount = 3;
      typeName = 'equationGenerator';
    } else if (gateType === 'BUFFER') {
      nodeLabel = 'Buffer';
      inputsCount = 1;
      typeName = 'logicGate';
    } else if (gateType === 'TRI_STATE_BUFFER') {
      nodeLabel = 'Tri-State Buffer';
      inputsCount = 2;
      typeName = 'logicGate';
    } else if (gateType === 'NOT') {
      inputsCount = 1;
    } else if (['BUS_SPLITTER', 'BUS_JOINER', 'BUS_TAP', 'BIT_EXTRACTOR', 'DELAY_ELEMENT', 'TUNNEL', 'TEXT_LABEL'].includes(gateType)) {
      typeName = 'utility';
    } else if (gateType === 'HALF_ADDER') {
      nodeLabel = 'Half Adder';
      typeName = 'icComponent';
    } else if (gateType === 'FULL_ADDER') {
      nodeLabel = 'Full Adder';
      typeName = 'icComponent';
    } else if (gateType === 'ADDER_4BIT') {
      nodeLabel = '4-Bit Adder';
      typeName = 'icComponent';
    } else if ([
      'HALF_ADDER', 'FULL_ADDER', 'ADDER_4BIT',
      'HALF_SUBTRACTOR', 'FULL_SUBTRACTOR', 'MUX_4TO1', 'DEMUX_1TO4',
      'PRIORITY_ENCODER', 'COMPARATOR_4BIT', 'DECODER_BCD_TO_7SEG',
      'D_LATCH', 'JK_FLIPFLOP', 'REGISTER_4BIT', 'SHIFT_REGISTER_4BIT',
      'UP_COUNTER_4BIT', 'DOWN_COUNTER_4BIT',
      'MUX_8TO1', 'DEMUX_1TO8', 'DECODER_3TO8', 'DECODER_4TO16', 'ENCODER_8TO3',
      'PARITY_GENERATOR', 'PARITY_CHECKER', 'CONVERTER_BIN_TO_GRAY', 'CONVERTER_GRAY_TO_BIN',
      'T_FLIPFLOP', 'RING_COUNTER', 'RIPPLE_COUNTER', 'SYNCHRONOUS_COUNTER', 'UP_DOWN_COUNTER', 'FREQUENCY_DIVIDER',
      'INCREMENTER_4BIT', 'DECREMENTER_4BIT', 'ADDER_SUBTRACTOR_4BIT', 'ALU_4BIT'
    ].includes(gateType)) {
      typeName = 'icComponent';
    } else if ([
      'CFG_ENCODER', 'CFG_DECODER', 'CFG_MUX', 'CFG_DEMUX', 'CFG_COMPARATOR',
      'CFG_REGISTER', 'CFG_SHIFT_REGISTER', 'CFG_COUNTER', 'CFG_CONSTANT',
      'CFG_BUS_SPLITTER', 'CFG_BUS_JOINER'
    ].includes(gateType)) {
      typeName = 'configurableNode';
    }

    let inputs: PinData[] = [];
    let outputs: PinData[] = [];

    if (typeName === 'icComponent') {
      const icPins = getDefaultICPins(gateType);
      inputs = icPins.inputs;
      outputs = icPins.outputs;
    } else if (gateType === 'CFG_ENCODER') {
      nodeLabel = 'Config Encoder';
      const pins = createCfgEncoderPins(DEFAULT_CFG_ENCODER_CONFIG);
      inputs = pins.inputs;
      outputs = pins.outputs;
    } else if (gateType === 'CFG_DECODER') {
      nodeLabel = 'Config Decoder';
      const pins = createCfgDecoderPins(DEFAULT_CFG_DECODER_CONFIG);
      inputs = pins.inputs;
      outputs = pins.outputs;
    } else if (gateType === 'CFG_MUX') {
      nodeLabel = 'Config MUX';
      const pins = createCfgMuxPins(DEFAULT_CFG_MUX_CONFIG);
      inputs = pins.inputs;
      outputs = pins.outputs;
    } else if (gateType === 'CFG_DEMUX') {
      nodeLabel = 'Config DEMUX';
      const pins = createCfgDemuxPins(DEFAULT_CFG_DEMUX_CONFIG);
      inputs = pins.inputs;
      outputs = pins.outputs;
    } else if (gateType === 'CFG_COMPARATOR') {
      nodeLabel = 'Config Comparator';
      const pins = createCfgComparatorPins(DEFAULT_CFG_COMPARATOR_CONFIG);
      inputs = pins.inputs;
      outputs = pins.outputs;
    } else if (gateType === 'CFG_REGISTER') {
      nodeLabel = 'Config Register';
      const pins = createCfgRegisterPins(DEFAULT_CFG_REGISTER_CONFIG);
      inputs = pins.inputs;
      outputs = pins.outputs;
    } else if (gateType === 'CFG_SHIFT_REGISTER') {
      nodeLabel = 'Config Shift Reg';
      const pins = createCfgShiftRegisterPins(DEFAULT_CFG_SHIFT_REGISTER_CONFIG);
      inputs = pins.inputs;
      outputs = pins.outputs;
    } else if (gateType === 'CFG_COUNTER') {
      nodeLabel = 'Config Counter';
      const pins = createCfgCounterPins(DEFAULT_CFG_COUNTER_CONFIG);
      inputs = pins.inputs;
      outputs = pins.outputs;
    } else if (gateType === 'CFG_CONSTANT') {
      nodeLabel = 'Config Constant';
      const pins = createCfgConstantPins(DEFAULT_CFG_CONSTANT_CONFIG);
      inputs = pins.inputs;
      outputs = pins.outputs;
    } else if (gateType === 'CFG_BUS_SPLITTER') {
      nodeLabel = 'Bus Splitter';
      const pins = createCfgBusSplitterPins(DEFAULT_CFG_BUS_SPLITTER_CONFIG);
      inputs = pins.inputs;
      outputs = pins.outputs;
    } else if (gateType === 'CFG_BUS_JOINER') {
      nodeLabel = 'Bus Joiner';
      const pins = createCfgBusJoinerPins(DEFAULT_CFG_BUS_JOINER_CONFIG);
      inputs = pins.inputs;
      outputs = pins.outputs;
    } else if (gateType === 'ENCODER') {
      const encConfig = DEFAULT_ENCODER_CONFIG;
      const pins = createEncoderPins(encConfig);
      inputs = pins.inputs;
      outputs = pins.outputs;
    } else if (gateType === 'SEVEN_SEGMENT') {
      const segConfig = DEFAULT_SEVEN_SEGMENT_CONFIG;
      inputs = createSevenSegmentPins(segConfig);
      outputs = [];
    } else if (gateType === 'LED_MATRIX') {
      inputs = createLedMatrixPins(DEFAULT_LED_MATRIX_CONFIG);
      outputs = [];
    } else if (gateType === 'BOOLEAN_EQUATION_GENERATOR') {
      inputs = [{ id: 'in-0', name: 'In', value: 0 }];
      outputs = [];
    } else if (gateType === 'MULTI_INPUT') {
      inputs = [];
      outputs = createMultiInputPins(DEFAULT_MULTI_INPUT_CONFIG);
    } else if (gateType === 'DIP_SWITCH') {
      inputs = [];
      outputs = Array.from({ length: 4 }, (_, i) => ({ id: `out-${i}`, name: `SW${i + 1}`, value: 0 }));
    } else if (gateType === 'RGB_LED') {
      inputs = [
        { id: 'in-0', name: 'R', value: 0 },
        { id: 'in-1', name: 'G', value: 0 },
        { id: 'in-2', name: 'B', value: 0 },
      ];
      outputs = [];
    } else if (gateType === 'BUS_MONITOR') {
      inputs = Array.from({ length: 4 }, (_, i) => ({ id: `in-${i}`, name: `B${i}`, value: 0 }));
      outputs = [];
    } else if (gateType === 'HEX_DISPLAY') {
      inputs = Array.from({ length: 4 }, (_, i) => ({ id: `in-${i}`, name: `D${i}`, value: 0 }));
      outputs = [];
    } else if (gateType === 'TRI_STATE_BUFFER') {
      inputs = [
        { id: 'in-0', name: 'In', value: -1 },
        { id: 'in-1', name: 'EN', value: 1 },
      ];
      outputs = [{ id: 'out-0', name: 'Out', value: -1 }];
    } else {
      inputs = Array.from({ length: inputsCount }, (_, i) => ({
        id: `in-${i}`,
        name: inputsCount === 1 ? 'In' : `In ${i + 1}`,
        value: -1,
      }));

      outputs = ['OUTPUT', 'LOGIC_PROBE'].includes(gateType) ? [] : [
        { id: 'out-0', name: 'Out', value: gateType === 'INPUT' || gateType === 'CONST_LOW' ? 0 : gateType === 'CONST_HIGH' ? 1 : -1 },
      ];
    }

    const newNode: Node = {
      id,
      type: typeName,
      position,
      data: {
        label: nodeLabel,
        gateType,
        value: gateType === 'CONST_HIGH' ? 1 : 0,
        inputCount: inputsCount,
        inputs,
        outputs,
        ...(gateType === 'HALF_ADDER' ? { customComponentId: 'builtin_half_adder' } : {}),
        ...(gateType === 'FULL_ADDER' ? { customComponentId: 'builtin_full_adder' } : {}),
        ...(gateType === 'DIP_SWITCH' ? { bitWidth: 4, dipValues: [0, 0, 0, 0] } : {}),
        ...(gateType === 'BUS_MONITOR' ? { bitWidth: 4, displayFormat: 'hex' } : {}),
        ...(gateType === 'CLOCK' ? { clockConfig: DEFAULT_CLOCK_CONFIG, clockState: DEFAULT_CLOCK_STATE } : {}),
        ...(gateType === 'OSCILLOSCOPE' ? { scopeConfig: { ...DEFAULT_OSCILLOSCOPE_CONFIG } } : {}),
        ...(gateType === 'MULTI_INPUT' ? { multiInputConfig: DEFAULT_MULTI_INPUT_CONFIG } : {}),
        ...(gateType === 'ENCODER' ? { encoderConfig: DEFAULT_ENCODER_CONFIG } : {}),
        ...(gateType === 'SEVEN_SEGMENT' ? { sevenSegmentConfig: DEFAULT_SEVEN_SEGMENT_CONFIG } : {}),
        ...(gateType === 'LED_MATRIX' ? { ledMatrixConfig: DEFAULT_LED_MATRIX_CONFIG } : {}),
      } as unknown as Record<string, unknown>,
    };

    set({ nodes: [...get().nodes, newNode], selectedNodeId: id });
    get().tickSimulation();
  },

  deleteSelected: () => {
    const { nodes, edges, selectedNodeId, selectedEdgeId } = get();
    const selectedNodes = nodes.filter((n) => n.selected || n.id === selectedNodeId);
    const selectedEdges = edges.filter((e) => e.selected || e.id === selectedEdgeId);

    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

    get().saveHistory();

    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    const selectedEdgeIds = new Set(selectedEdges.map((e) => e.id));

    // Also include any child nodes inside deleted group nodes
    selectedNodes.forEach((n) => {
      if (n.type === 'groupNode') {
        nodes.forEach((child) => {
          if (child.parentId === n.id) {
            selectedNodeIds.add(child.id);
          }
        });
      }
    });

    const newNodes = nodes.filter((n) => !selectedNodeIds.has(n.id));
    const newEdges = edges.filter(
      (e) => !selectedEdgeIds.has(e.id) && !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target)
    );

    selectedNodeIds.forEach((id) => oscilloscopeBuffers.delete(id));

    set({
      nodes: newNodes,
      edges: newEdges,
      selectedNodeId: null,
      selectedEdgeId: null,
    });

    get().tickSimulation();
  },

  duplicateSelected: () => {
    get().copySelected();
    get().pasteClipboard();
  },

  copySelected: () => {
    const { nodes, edges, selectedNodeId } = get();
    const selectedNodes = nodes.filter((n) => n.selected || n.id === selectedNodeId);
    if (selectedNodes.length === 0) return;

    const selectedIds = new Set(selectedNodes.map((n) => n.id));
    const internalEdges = edges.filter((e) => selectedIds.has(e.source) && selectedIds.has(e.target));

    (window as any).__circuit_clipboard__ = {
      nodes: JSON.parse(JSON.stringify(selectedNodes)),
      edges: JSON.parse(JSON.stringify(internalEdges)),
    };

    get().showToast(`Copied ${selectedNodes.length} item${selectedNodes.length > 1 ? 's' : ''} to clipboard`);
  },

  cutSelected: () => {
    get().copySelected();
    get().deleteSelected();
    get().showToast('Cut items to clipboard');
  },

  pasteClipboard: () => {
    const clipboard = (window as any).__circuit_clipboard__ as
      | { nodes: Node[]; edges: Edge[] }
      | Node
      | undefined;
    if (!clipboard) return;

    get().saveHistory();

    const timestamp = Date.now();
    const idMap = new Map<string, string>();

    // Support both multi-node clipboard format and single legacy node clipboard
    const rawNodes: Node[] = Array.isArray((clipboard as any).nodes)
      ? (clipboard as any).nodes
      : [clipboard as Node];
    const rawEdges: Edge[] = Array.isArray((clipboard as any).edges)
      ? (clipboard as any).edges
      : [];

    const newNodes: Node[] = rawNodes.map((node, index) => {
      const newId = `${node.type || 'node'}-${timestamp}-${index}`;
      idMap.set(node.id, newId);

      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + 40,
          y: node.position.y + 40,
        },
        selected: true,
        data: JSON.parse(JSON.stringify(node.data)),
      };
    });

    // Re-link parentId if parent group was also copied
    newNodes.forEach((node) => {
      if (node.parentId && idMap.has(node.parentId)) {
        node.parentId = idMap.get(node.parentId);
      } else if (node.parentId && !idMap.has(node.parentId)) {
        // If parent wasn't copied, make node top-level
        delete node.parentId;
      }
    });

    const newEdges: Edge[] = rawEdges.map((edge, index) => {
      const newSource = idMap.get(edge.source) || edge.source;
      const newTarget = idMap.get(edge.target) || edge.target;
      return {
        ...edge,
        id: `e-${newSource}-${edge.sourceHandle || '0'}-${newTarget}-${edge.targetHandle || '0'}-${timestamp}-${index}`,
        source: newSource,
        target: newTarget,
        type: 'signalEdge',
        data: {
          ...edge.data,
          signalValue: -1,
        },
      };
    });

    const updatedExistingNodes = get().nodes.map((n) => ({ ...n, selected: false }));
    set({
      nodes: [...updatedExistingNodes, ...newNodes],
      edges: [...get().edges, ...newEdges],
      selectedNodeId: newNodes.length === 1 ? newNodes[0].id : null,
    });

    get().tickSimulation();
    get().showToast(`Pasted ${newNodes.length} item${newNodes.length > 1 ? 's' : ''}`);
  },

  groupSelectedNodes: (customLabel?: string) => {
    const { nodes } = get();
    const selectedNodes = nodes.filter((n) => n.selected && n.type !== 'groupNode');
    if (selectedNodes.length === 0) {
      get().showToast('Select components to group');
      return;
    }

    get().saveHistory();

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedNodes.forEach((n) => {
      let x = n.position.x;
      let y = n.position.y;
      if (n.parentId) {
        const parent = nodes.find((p) => p.id === n.parentId);
        if (parent) {
          x += parent.position.x;
          y += parent.position.y;
        }
      }

      const width = (n.measured?.width || n.width || 160);
      const height = (n.measured?.height || n.height || 100);

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    const groupWidth = Math.max(220, (maxX - minX) + 50);
    const groupHeight = Math.max(140, (maxY - minY) + 70);
    const groupX = minX - 25;
    const groupY = minY - 45;

    const groupId = `group-${Date.now()}`;
    const groupLabel = customLabel || `Group (${selectedNodes.length})`;

    const groupNode: Node = {
      id: groupId,
      type: 'groupNode',
      position: { x: groupX, y: groupY },
      style: { width: groupWidth, height: groupHeight },
      selected: true,
      data: {
        label: groupLabel,
        color: 'purple',
      } as unknown as Record<string, unknown>,
    };

    const selectedIds = new Set(selectedNodes.map((n) => n.id));
    const updatedNodes = nodes.map((node) => {
      if (selectedIds.has(node.id)) {
        let absX = node.position.x;
        let absY = node.position.y;
        if (node.parentId) {
          const parent = nodes.find((p) => p.id === node.parentId);
          if (parent) {
            absX += parent.position.x;
            absY += parent.position.y;
          }
        }

        return {
          ...node,
          selected: false,
          parentId: groupId,
          position: {
            x: absX - groupX,
            y: absY - groupY,
          },
          extent: 'parent' as const,
        };
      }
      return { ...node, selected: false };
    });

    set({
      nodes: [groupNode, ...updatedNodes],
      selectedNodeId: groupId,
    });

    get().showToast(`Created ${groupLabel}`);
  },

  ungroupNode: (groupId: string) => {
    const { nodes } = get();
    const groupNode = nodes.find((n) => n.id === groupId);
    if (!groupNode) return;

    get().saveHistory();

    const groupX = groupNode.position.x;
    const groupY = groupNode.position.y;

    const updatedNodes = nodes
      .filter((n) => n.id !== groupId)
      .map((node) => {
        if (node.parentId === groupId) {
          const { parentId, extent, ...rest } = node;
          return {
            ...rest,
            position: {
              x: node.position.x + groupX,
              y: node.position.y + groupY,
            },
            selected: true,
          };
        }
        return node;
      });

    set({
      nodes: updatedNodes,
      selectedNodeId: null,
    });

    get().showToast('Ungrouped selection');
  },

  resetAllInputs: () => {
    get().saveHistory();
    const updatedNodes = get().nodes.map((n) => {
      const d = n.data as unknown as NodeData;
      if (d.gateType === 'INPUT' || d.gateType === 'PUSH_BUTTON') {
        return { ...n, data: { ...n.data, value: 0 } };
      }
      if (d.gateType === 'DIP_SWITCH' && d.dipValues) {
        return { ...n, data: { ...n.data, dipValues: Array(d.bitWidth || 4).fill(0) } };
      }
      return n;
    });
    set({ nodes: updatedNodes });
    get().tickSimulation(true);
    get().showToast('All inputs reset to LOW (0)');
  },

  toggleLockNode: (nodeId: string) => {
    const updatedNodes = get().nodes.map((n) => {
      if (n.id === nodeId) {
        const isLocked = !(n.data as unknown as NodeData).isLocked;
        return {
          ...n,
          draggable: !isLocked,
          data: { ...n.data, isLocked },
        };
      }
      return n;
    });
    set({ nodes: updatedNodes });
    get().showToast('Node lock state toggled');
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

  updateConfigurableConfig: (nodeId: string, partialConfig: Record<string, any>) => {
    get().saveHistory();

    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        let newInputs = data.inputs;
        let newOutputs = data.outputs;
        const configUpdates: Record<string, any> = {};

        switch (data.gateType) {
          case 'CFG_ENCODER': {
            const cur = (data.cfgEncoderConfig as CfgEncoderConfig) || DEFAULT_CFG_ENCODER_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgEncoderConfig = updated;
            const pins = createCfgEncoderPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_DECODER': {
            const cur = (data.cfgDecoderConfig as CfgDecoderConfig) || DEFAULT_CFG_DECODER_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgDecoderConfig = updated;
            const pins = createCfgDecoderPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_MUX': {
            const cur = (data.cfgMuxConfig as CfgMuxConfig) || DEFAULT_CFG_MUX_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgMuxConfig = updated;
            const pins = createCfgMuxPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_DEMUX': {
            const cur = (data.cfgDemuxConfig as CfgDemuxConfig) || DEFAULT_CFG_DEMUX_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgDemuxConfig = updated;
            const pins = createCfgDemuxPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_COMPARATOR': {
            const cur = (data.cfgComparatorConfig as CfgComparatorConfig) || DEFAULT_CFG_COMPARATOR_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgComparatorConfig = updated;
            const pins = createCfgComparatorPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_REGISTER': {
            const cur = (data.cfgRegisterConfig as CfgRegisterConfig) || DEFAULT_CFG_REGISTER_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgRegisterConfig = updated;
            const pins = createCfgRegisterPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_SHIFT_REGISTER': {
            const cur = (data.cfgShiftRegisterConfig as CfgShiftRegisterConfig) || DEFAULT_CFG_SHIFT_REGISTER_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgShiftRegisterConfig = updated;
            const pins = createCfgShiftRegisterPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_COUNTER': {
            const cur = (data.cfgCounterConfig as CfgCounterConfig) || DEFAULT_CFG_COUNTER_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgCounterConfig = updated;
            const pins = createCfgCounterPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_CONSTANT': {
            const cur = (data.cfgConstantConfig as CfgConstantConfig) || DEFAULT_CFG_CONSTANT_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgConstantConfig = updated;
            const pins = createCfgConstantPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_BUS_SPLITTER': {
            const cur = (data.cfgBusSplitterConfig as CfgBusSplitterConfig) || DEFAULT_CFG_BUS_SPLITTER_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgBusSplitterConfig = updated;
            const pins = createCfgBusSplitterPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_BUS_JOINER': {
            const cur = (data.cfgBusJoinerConfig as CfgBusJoinerConfig) || DEFAULT_CFG_BUS_JOINER_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgBusJoinerConfig = updated;
            const pins = createCfgBusJoinerPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
        }

        return {
          ...node,
          data: {
            ...data,
            ...configUpdates,
            inputs: newInputs,
            outputs: newOutputs,
          },
        };
      }
      return node;
    });

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

    // Step 1: Update clock states at the target simulation time
    get().updateClocks(nextTimeMs);

    // Step 2: Propagate signals
    const result = propagateSignals(get().nodes, edges, false, get().customComponents);

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
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const curState = data.clockState || DEFAULT_CLOCK_STATE;
        return {
          ...node,
          data: {
            ...data,
            clockState: {
              ...curState,
              status: 'running',
              lastTickTime: now,
              phaseAccumulator: 0,
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

  toggleWireLabels: () => {
    set({ showWireLabels: !get().showWireLabels });
  },

  toggleInspector: () => {
    set({ showInspector: !get().showInspector });
  },

  updateEdgeLabel: (edgeId: string, label: string) => {
    const edges = get().edges.map((edge) => {
      if (edge.id === edgeId) {
        return {
          ...edge,
          data: {
            ...edge.data,
            label,
          },
        };
      }
      return edge;
    });
    set({ edges });
  },

  updateEdgeColor: (edgeId: string, color: string | undefined) => {
    get().saveHistory();
    const edges = get().edges.map((edge) => {
      if (edge.id === edgeId) {
        return {
          ...edge,
          data: {
            ...edge.data,
            color,
          },
        };
      }
      return edge;
    });
    set({ edges });
  },

  updatePinAlias: (nodeId: string, pinId: string, alias: string) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const currentAliases = data.pinAliases || {};
        const nextAliases = { ...currentAliases };
        if (alias.trim() === '') {
          delete nextAliases[pinId];
        } else {
          nextAliases[pinId] = alias;
        }
        return {
          ...node,
          data: {
            ...data,
            pinAliases: nextAliases,
          },
        };
      }
      return node;
    });
    set({ nodes });
  },

  updateLedMatrixConfig: (nodeId: string, config: Partial<LedMatrixConfig>) => {
    const { nodes, edges } = get();
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    const data = targetNode.data as unknown as NodeData;
    const curConfig = data.ledMatrixConfig || DEFAULT_LED_MATRIX_CONFIG;
    const newConfig = { ...curConfig, ...config };

    let newInputs = data.inputs;
    let nextEdges = edges;

    if (config.size && config.size !== curConfig.size) {
      newInputs = createLedMatrixPins(newConfig);
      nextEdges = edges.filter((e) => {
        if (e.target === nodeId) {
          return newInputs.some((p) => p.id === e.targetHandle);
        }
        return true;
      });
    }

    const updatedNodes = nodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...data,
            ledMatrixConfig: newConfig,
            inputs: newInputs,
          },
        };
      }
      return node;
    });

    set({ nodes: updatedNodes, edges: nextEdges });
    get().tickSimulation(true);
  },

  triggerManualPulse: (nodeId: string) => {
    const { nodes } = get();
    const target = nodes.find((n) => n.id === nodeId);
    if (!target) return;
    const data = target.data as unknown as NodeData;
    const config = data.clockConfig || DEFAULT_CLOCK_CONFIG;
    const pulseWidth = config.pulseWidthMs || 100;

    const activeVal = config.startState === 'low' ? 1 : 0;

    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          const currentData = node.data as unknown as NodeData;
          return {
            ...node,
            data: {
              ...currentData,
              value: activeVal,
              outputs: (currentData.outputs || []).map((p) => ({ ...p, value: activeVal })),
            },
          };
        }
        return node;
      }),
    });
    get().tickSimulation(true);

    setTimeout(() => {
      const inactiveVal = config.startState === 'low' ? 0 : 1;
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === nodeId) {
            const currentData = node.data as unknown as NodeData;
            return {
              ...node,
              data: {
                ...currentData,
                value: inactiveVal,
                outputs: (currentData.outputs || []).map((p) => ({ ...p, value: inactiveVal })),
              },
            };
          }
          return node;
        }),
      });
      get().tickSimulation(true);
    }, pulseWidth);
  },

  updateClocks: (currentTime: number) => {
    const { nodes } = get();
    let changed = false;
    const nextNodes = nodes.map((node) => {
      if (node.type === 'clockNode') {
        const data = node.data as unknown as NodeData;
        const config = data.clockConfig || DEFAULT_CLOCK_CONFIG;
        const state = data.clockState || DEFAULT_CLOCK_STATE;

        if (state.status !== 'running' || !config.enabled) return node;

        const actualHz = toHz(config.frequencyHz, config.frequencyUnit || 'Hz');
        if (actualHz <= 0) return node;

        const periodMs = 1000 / actualHz;
        const phase = currentTime % periodMs;
        const dutyRatio = (config.dutyCycle ?? 50) / 100;
        
        let isHigh = false;
        if (config.startState === 'high') {
          isHigh = phase < periodMs * dutyRatio;
        } else {
          isHigh = phase >= periodMs * (1 - dutyRatio);
        }

        const newValue = isHigh ? 1 : 0;
        if (data.value !== newValue) {
          changed = true;
          const nextTick = state.tickCount + 1;
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

  // Custom Components Actions
  addCustomComponent: (def: CustomComponentDefinition) => {
    const customComponents = { ...get().customComponents, [def.id]: def };
    set({ customComponents });
    saveCustomComponentsToStorage(customComponents);
  },

  updateCustomComponent: (id: string, updates: Partial<CustomComponentDefinition>) => {
    const existing = get().customComponents[id];
    if (!existing) return;
    const updatedComp = { ...existing, ...updates, updatedAt: Date.now() };
    const customComponents = { ...get().customComponents, [id]: updatedComp };
    set({ customComponents });
    saveCustomComponentsToStorage(customComponents);
  },

  deleteCustomComponent: (id: string) => {
    const customComponents = { ...get().customComponents };
    delete customComponents[id];
    set({ customComponents });
    saveCustomComponentsToStorage(customComponents);
  },

  toggleFavoriteCustomComponent: (id: string) => {
    const comp = get().customComponents[id];
    if (!comp) return;
    get().updateCustomComponent(id, { isFavorite: !comp.isFavorite });
  },

  convertSelectionToCustomComponent: (
    name: string,
    category: string,
    description: string = '',
    customPins?: { inputs: CustomPinDefinition[]; outputs: CustomPinDefinition[] },
    color: string = '#10b981',
    targetNodeIds?: string[]
  ) => {
    const { nodes, edges } = get();
    const selectedNodes = targetNodeIds && targetNodeIds.length > 0
      ? nodes.filter((n) => targetNodeIds.includes(n.id))
      : nodes.filter((n) => n.selected);
    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    const compId = `custom_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;

    const inputs = customPins?.inputs || [];
    const outputs = customPins?.outputs || [];

    // If 0 nodes selected, create a new subcircuit from scratch with template input/output nodes
    if (selectedNodes.length === 0) {
      const templateNodes: Node[] = [];

      inputs.forEach((p, idx) => {
        const inNodeId = p.internalNodeId || `in-node-${idx}-${Date.now()}`;
        p.internalNodeId = inNodeId;
        templateNodes.push({
          id: inNodeId,
          type: 'digitalInput',
          position: { x: 80, y: 100 + idx * 90 },
          data: {
            label: p.name,
            gateType: 'INPUT',
            inputs: [],
            outputs: [{ id: 'out-0', name: 'OUT', value: 0 }],
          },
        });
      });

      outputs.forEach((p, idx) => {
        const outNodeId = p.internalNodeId || `out-node-${idx}-${Date.now()}`;
        p.internalNodeId = outNodeId;
        templateNodes.push({
          id: outNodeId,
          type: 'digitalOutput',
          position: { x: 500, y: 100 + idx * 90 },
          data: {
            label: p.name,
            gateType: 'OUTPUT',
            inputs: [{ id: 'in-0', name: 'IN', value: 0 }],
            outputs: [],
          },
        });
      });

      const newDefinition: CustomComponentDefinition = {
        id: compId,
        name,
        category: category || 'Custom Components',
        description,
        color,
        inputs,
        outputs,
        nodes: templateNodes,
        edges: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const customComponents = { ...get().customComponents, [compId]: newDefinition };
      saveCustomComponentsToStorage(customComponents);

      set({ customComponents });
      get().enterSubcircuitView(compId);
      return compId;
    }

    // Filter edges internal to selection
    const internalEdges = edges.filter((e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target));
    const externalIncomingEdges = edges.filter((e) => !selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target));
    const externalOutgoingEdges = edges.filter((e) => selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target));

    const newDefinition: CustomComponentDefinition = {
      id: compId,
      name,
      category: category || 'Custom Components',
      description,
      color,
      inputs,
      outputs,
      nodes: JSON.parse(JSON.stringify(selectedNodes.map((n) => ({ ...n, selected: false })))),
      edges: JSON.parse(JSON.stringify(internalEdges)),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Bounding box center for position
    const avgX = selectedNodes.reduce((sum, n) => sum + n.position.x, 0) / selectedNodes.length;
    const avgY = selectedNodes.reduce((sum, n) => sum + n.position.y, 0) / selectedNodes.length;

    const customNodeId = `custom-node-${Date.now()}`;
    const customNode: Node = {
      id: customNodeId,
      type: 'customNode',
      position: { x: avgX, y: avgY },
      data: {
        label: name,
        gateType: 'CUSTOM',
        customComponentId: compId,
        inputs: inputs.map((p) => ({ id: p.id, name: p.name, value: -1 })),
        outputs: outputs.map((p) => ({ id: p.id, name: p.name, value: -1 })),
      },
    };

    // Re-route external edges
    const reRoutedEdges: Edge[] = [];
    externalIncomingEdges.forEach((e) => {
      const targetPin = inputs.find((p) => p.internalNodeId === e.target) || inputs[0];
      if (targetPin) {
        reRoutedEdges.push({
          ...e,
          id: `e-${e.source}-${e.sourceHandle || '0'}-${customNodeId}-${targetPin.id}`,
          target: customNodeId,
          targetHandle: targetPin.id,
        });
      }
    });

    externalOutgoingEdges.forEach((e) => {
      const sourcePin = outputs.find((p) => p.internalNodeId === e.source) || outputs[0];
      if (sourcePin) {
        reRoutedEdges.push({
          ...e,
          id: `e-${customNodeId}-${sourcePin.id}-${e.target}-${e.targetHandle || '0'}`,
          source: customNodeId,
          sourceHandle: sourcePin.id,
        });
      }
    });

    const remainingNodes = nodes.filter((n) => !selectedNodeIds.has(n.id));
    const remainingEdges = edges.filter(
      (e) => !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target)
    );

    const nextNodes = [...remainingNodes, customNode];
    const nextEdges = [...remainingEdges, ...reRoutedEdges];

    const customComponents = { ...get().customComponents, [compId]: newDefinition };
    saveCustomComponentsToStorage(customComponents);

    set({
      customComponents,
      nodes: nextNodes,
      edges: nextEdges,
    });

    get().saveHistory();
    get().tickSimulation();

    return compId;
  },

  instantiateCustomComponent: (customComponentId: string, position: { x: number; y: number }) => {
    const def = get().customComponents[customComponentId];
    if (!def) return;

    const currentPath = get().hierarchyPath;
    if (currentPath.length > 1) {
      const currentParentId = currentPath[currentPath.length - 1].id;
      if (detectComponentRecursion(customComponentId, currentParentId, get().customComponents)) {
        get().showToast(`Cannot add "${def.name}": Recursion detected! Component cannot contain itself.`);
        return;
      }
    }

    get().saveHistory();

    const nodeId = `custom-${customComponentId.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
    const newNode: Node = {
      id: nodeId,
      type: 'customNode',
      position,
      data: {
        label: def.name,
        gateType: 'CUSTOM',
        customComponentId,
        inputs: def.inputs.map((p) => ({ id: p.id, name: p.name, value: -1 })),
        outputs: def.outputs.map((p) => ({ id: p.id, name: p.name, value: -1 })),
      },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
    }));

    get().tickSimulation();
  },

  enterSubcircuitView: (componentId: string, instanceId?: string) => {
    const { hierarchyPath, customComponents, nodes, edges, rootCircuitState } = get();
    const targetComp = customComponents[componentId];
    if (!targetComp) return;

    if (hierarchyPath.length > 1) {
      const currentEditingId = hierarchyPath[hierarchyPath.length - 1].id;
      if (detectComponentRecursion(componentId, currentEditingId, customComponents)) {
        get().showToast('Recursion detected! Component cannot edit itself recursively.');
        return;
      }
    }

    if (hierarchyPath.length === 1) {
      set({ rootCircuitState: { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) } });
    } else {
      const currentId = hierarchyPath[hierarchyPath.length - 1].id;
      const updatedComponents = {
        ...customComponents,
        [currentId]: {
          ...customComponents[currentId],
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
          updatedAt: Date.now(),
        },
      };
      set({ customComponents: updatedComponents });
      saveCustomComponentsToStorage(updatedComponents);
    }

    const newPath = [...hierarchyPath, { id: componentId, name: targetComp.name, instanceId }];
    set({
      hierarchyPath: newPath,
      nodes: JSON.parse(JSON.stringify(targetComp.nodes || [])),
      edges: JSON.parse(JSON.stringify(targetComp.edges || [])),
      selectedNodeId: null,
      selectedEdgeId: null,
    });

    get().tickSimulation();
  },

  exitSubcircuitView: (targetDepth: number = 0) => {
    const { hierarchyPath, customComponents, nodes, edges, rootCircuitState } = get();
    if (hierarchyPath.length <= 1) return;

    const currentId = hierarchyPath[hierarchyPath.length - 1].id;
    const updatedCustomComponents = {
      ...customComponents,
      [currentId]: {
        ...customComponents[currentId],
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        updatedAt: Date.now(),
      },
    };
    saveCustomComponentsToStorage(updatedCustomComponents);

    const newPath = hierarchyPath.slice(0, targetDepth + 1);

    if (newPath.length === 1 && rootCircuitState) {
      set({
        customComponents: updatedCustomComponents,
        hierarchyPath: newPath,
        nodes: rootCircuitState.nodes,
        edges: rootCircuitState.edges,
        selectedNodeId: null,
        selectedEdgeId: null,
      });
    } else {
      const parentId = newPath[newPath.length - 1].id;
      const parentComp = updatedCustomComponents[parentId];
      set({
        customComponents: updatedCustomComponents,
        hierarchyPath: newPath,
        nodes: parentComp ? JSON.parse(JSON.stringify(parentComp.nodes)) : [],
        edges: parentComp ? JSON.parse(JSON.stringify(parentComp.edges)) : [],
        selectedNodeId: null,
        selectedEdgeId: null,
      });
    }

    get().tickSimulation();
  },

  findCustomComponentInstances: (componentId: string) => {
    const { nodes } = get();
    const matchingNodeIds = nodes
      .filter(
        (n) =>
          (n.data as unknown as NodeData).gateType === 'CUSTOM' &&
          (n.data as unknown as NodeData).customComponentId === componentId
      )
      .map((n) => n.id);

    if (matchingNodeIds.length === 0) {
      get().showToast('No instances of this component placed on canvas');
      return;
    }

    const updatedNodes = nodes.map((n) => ({
      ...n,
      selected: matchingNodeIds.includes(n.id),
    }));

    set({ nodes: updatedNodes, selectedNodeId: matchingNodeIds[0] });
    get().showToast(`Found ${matchingNodeIds.length} instance(s) on canvas`);
  },

  importCustomComponentJSON: (jsonString: string) => {
    try {
      const { component, dependencies } = parseCustomComponentFromJSON(jsonString);
      if (!component || !component.id || !component.name) return false;

      const updatedComponents = {
        ...get().customComponents,
        ...dependencies,
        [component.id]: component,
      };
      set({ customComponents: updatedComponents });
      saveCustomComponentsToStorage(updatedComponents);
      return true;
    } catch (e) {
      console.error('Failed to import subcircuit JSON', e);
      return false;
    }
  },

  exportCustomComponentJSON: (componentId: string) => {
    try {
      return exportCustomComponentToJSON(componentId, get().customComponents);
    } catch (e) {
      console.error('Failed to export subcircuit JSON', e);
      return null;
    }
  },
}));
