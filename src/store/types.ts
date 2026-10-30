import { StoreApi } from 'zustand';
import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from '@xyflow/react';
import { GateType, SimulationState, CircuitPreset } from '../types/circuit';
import { EncoderConfig } from '../types/encoder';
import { SevenSegmentConfig } from '../types/sevenSegment';
import { Traces } from '../simulation/timeline';
import { CustomComponentDefinition, CustomPinDefinition, HierarchyBreadcrumb } from '../types/customComponent';

export type ThemeMode = 'light' | 'dark';
export type UiDensity = 'compact' | 'comfortable' | 'presentation';
export type ToastVariant = 'success' | 'error' | 'info';
export type WireStyle = 'curved' | 'orthogonal';

export interface TimelineState {
  running: boolean;
  /** Simulated time in ms. */
  time: number;
  /** Simulated ms per real ms. */
  speed: number;
  /** The last frame couldn't keep up with real time. */
  behind: boolean;
  traces: Traces;
}

export interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
}

export interface CircuitStore {
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
  /** Snapshot unless the previous snapshot used the same key moments ago. */
  saveHistoryCoalesced: (key: string) => void;
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
  /** Merge fields into a node's data with undo support; propagate re-runs the simulation. */
  updateNodeData: (nodeId: string, patch: Record<string, unknown>, options?: { propagate?: boolean }) => void;
  setNodeBitWidth: (nodeId: string, width: number) => void;
  updateNodeInputCount: (nodeId: string, count: number) => void;
  updateEncoderConfig: (nodeId: string, config: Partial<EncoderConfig>) => void;
  updateSevenSegmentConfig: (nodeId: string, config: Partial<SevenSegmentConfig>) => void;
  toggleInputValue: (nodeId: string) => void;
  setButtonPressed: (nodeId: string, pressed: boolean) => void;
  toggleDipBit: (nodeId: string, bitIndex: number) => void;
  /** Set several switches, buttons and DIP bits at once (e.g. from a truth table row); not recorded in undo. */
  setInputLevels: (levels: { nodeId: string; bit?: number; value: 0 | 1 }[]) => void;
  /** Change what a sensor senses (light, temperature, distance, motion); not recorded in undo. */
  setSensorLevel: (nodeId: string, level: number) => void;

  // Encoder Node Manual Controls
  toggleEncoderInputPin: (nodeId: string, pinIdx: number) => void;
  setAllEncoderInputs: (nodeId: string, value: 0 | 1) => void;
  invertAllEncoderInputs: (nodeId: string) => void;

  // Simulation: signals settle instantly; tickSimulation re-propagates the whole circuit
  resetSimulation: () => void;
  tickSimulation: (isStep?: boolean) => void;

  // Simulated time, used only when the circuit has a clock or a programmed board
  timeline: TimelineState;
  /** Serial monitor output per board part. */
  boardSerial: Record<string, string>;
  setTimelineRunning: (running: boolean) => void;
  setTimelineSpeed: (speed: number) => void;
  /** Called every animation frame while running with the real time elapsed. */
  advanceTimeline: (realMs: number) => void;
  /** Pause and move to the next clock edge (or 10 ms without a clock). */
  stepTimeline: () => void;
  /** Back to time 0: clocks low, memory cleared, board programs start over. */
  restartTimeline: () => void;
  /** Check and load a compiled program (.hex text) onto a board; undoable. Returns success. */
  loadBoardFirmware: (nodeId: string, name: string, hex: string) => boolean;

  // Theme, density & Toasts
  theme: ThemeMode;
  density: UiDensity;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setDensity: (density: UiDensity) => void;
  toastMessage: string | null;
  toastVariant: ToastVariant;
  showToast: (message: string, variant?: ToastVariant) => void;

  // Project management
  presets: CircuitPreset[];
  loadCircuit: (nodes: Node[], edges: Edge[]) => void;
  /** Open a saved circuit file (JSON text): checks it, adds its custom components, loads it. Returns success. */
  openCircuitFile: (text: string) => boolean;
  loadPreset: (presetId: string) => void;
  addPreset: (data: { name: string; category: string; description: string }) => string;
  updatePreset: (presetId: string, data: { name?: string; category?: string; description?: string; updateCircuit?: boolean }) => void;
  removePreset: (presetId: string) => void;
  resetPresetsToDefault: () => void;
  clearCanvas: () => void;

  // Wire appearance & editing
  wireStyle: WireStyle;
  setWireStyle: (style: WireStyle) => void;
  editingEdgeId: string | null;
  setEditingEdgeId: (id: string | null) => void;
  showMinimap: boolean;
  toggleMinimap: () => void;
  isCanvasLocked: boolean;
  toggleCanvasLock: () => void;

  // Wire Labels
  showWireLabels: boolean;
  toggleWireLabels: () => void;
  updateEdgeLabel: (edgeId: string, label: string) => void;
  updateEdgeColor: (edgeId: string, color: string | undefined) => void;

  // Panel visibility
  showInspector: boolean;
  toggleInspector: () => void;
  setShowInspector: (show: boolean) => void;
  showToolbox: boolean;
  toggleToolbox: () => void;
  setShowToolbox: (show: boolean) => void;

  // Pin Aliases
  updatePinAlias: (nodeId: string, pinId: string, alias: string) => void;

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

// A slice receives the full store setter/getter and returns its share of the state
export type StoreSlice<T> = (
  set: StoreApi<CircuitStore>['setState'],
  get: StoreApi<CircuitStore>['getState']
) => T;
