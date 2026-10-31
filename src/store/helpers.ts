import { Node, Edge } from '@xyflow/react';
import { NodeData, SimulationState, CircuitPreset } from '../types/circuit';
import { CIRCUIT_PRESETS } from '../data/examples';
import { CustomComponentDefinition } from '../types/customComponent';
import { BUILTIN_HALF_ADDER, BUILTIN_FULL_ADDER } from '../utils/builtinAdders';

export const DEFAULT_SIMULATION: SimulationState = {
  stepCount: 0,
  unstableNodeIds: [],
  conflictNodeIds: [],
};

// Parts that were removed from Logic Studio. Saved circuits may still contain them.
const REMOVED_GATE_TYPES = new Set<string>([
  'OSCILLOSCOPE', 'MULTI_INPUT', 'RGB_LED', 'LED_MATRIX', 'BOOLEAN_EQUATION_GENERATOR',
  'BUS_SPLITTER', 'BUS_JOINER', 'BUS_TAP', 'BIT_EXTRACTOR',
  'ALU_4BIT', 'UP_COUNTER_4BIT', 'DOWN_COUNTER_4BIT', 'RING_COUNTER', 'RIPPLE_COUNTER',
  'SYNCHRONOUS_COUNTER', 'UP_DOWN_COUNTER', 'SHIFT_REGISTER_4BIT', 'DECODER_4TO16',
  'FREQUENCY_DIVIDER', 'CONVERTER_BIN_TO_GRAY', 'CONVERTER_GRAY_TO_BIN',
]);

const REMOVED_NODE_TYPES = new Set<string>([
  'clockNode', 'oscilloscope', 'multiInput', 'rgbLed', 'ledMatrix', 'equationGenerator', 'configurableNode',
]);

const isRemovedNode = (node: Node) => {
  const gateType = (node.data as { gateType?: string } | undefined)?.gateType ?? '';
  return REMOVED_NODE_TYPES.has(node.type ?? '') || REMOVED_GATE_TYPES.has(gateType) || gateType.startsWith('CFG_');
};

/**
 * Drops parts that no longer exist (and the wires attached to them) from a loaded circuit.
 * Returns how many parts were dropped so callers can tell the user.
 */
export const removeUnsupportedParts = (nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[]; removed: number } => {
  const dropped = new Set(nodes.filter(isRemovedNode).map((n) => n.id));
  if (dropped.size === 0) return { nodes, edges, removed: 0 };
  return {
    nodes: nodes.filter((n) => !dropped.has(n.id)),
    edges: edges.filter((e) => !dropped.has(e.source) && !dropped.has(e.target)),
    removed: dropped.size,
  };
};

export const STORAGE_KEY_PRESETS = 'logic_studio_presets';

export const getInitialPresets = (): CircuitPreset[] => {
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
          return refreshBuiltInPresets(validPresets);
        }
      }
    }
  } catch (e) {
    console.error('Failed to load presets from localStorage', e);
  }
  return CIRCUIT_PRESETS;
};

// Examples saved before parts were removed: built-ins that use removed parts are replaced by the
// current built-in (or dropped if that example no longer exists); user presets are left to load-time cleanup
function refreshBuiltInPresets(stored: CircuitPreset[]): CircuitPreset[] {
  const builtIns = new Map(CIRCUIT_PRESETS.map((p) => [p.id, p]));
  const RETIRED = new Set(['counter-4bit-demo', 'traffic-light-controller', 'ring-counter-demo']);
  return stored
    .filter((p) => !RETIRED.has(p.id))
    .map((p) => (builtIns.has(p.id) && p.nodes.some(isRemovedNode) ? builtIns.get(p.id)! : p));
}

export const savePresetsToStorage = (presets: CircuitPreset[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to save presets to localStorage', e);
  }
};

// Flag the input pins fed by removed wires so the engine floats them (covers circuits loaded before any propagation)
export const markRemovedWireTargets = (nodes: Node[], removedEdges: Edge[]): Node[] => {
  if (removedEdges.length === 0) return nodes;
  const targets = new Set(removedEdges.map((e) => `${e.target}|${e.targetHandle || 'in-0'}`));
  return nodes.map((node) => {
    const data = node.data as unknown as NodeData;
    if (!data.inputs?.some((p) => targets.has(`${node.id}|${p.id}`))) return node;
    return {
      ...node,
      data: {
        ...data,
        inputs: data.inputs.map((p) => (targets.has(`${node.id}|${p.id}`) ? { ...p, driven: true } : p)),
      } as unknown as Record<string, unknown>,
    };
  });
};

export { makeId } from '../utils/ids';

export const STORAGE_KEY_CIRCUIT = 'logic_studio_circuit';

// Restore the last open root circuit, falling back to the Half Adder preset
export const getInitialCircuit = (): { nodes: Node[]; edges: Edge[]; expected: string } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CIRCUIT);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
        const { nodes, edges } = removeUnsupportedParts(parsed.nodes, parsed.edges);
        return { nodes, edges, expected: typeof parsed.expected === 'string' ? parsed.expected : '' };
      }
    }
  } catch (e) {
    console.error('Failed to load circuit from localStorage', e);
  }
  return { nodes: CIRCUIT_PRESETS[0].nodes, edges: CIRCUIT_PRESETS[0].edges, expected: '' };
};

export const initialCircuit = getInitialCircuit();

export const STORAGE_KEY_CUSTOM_COMPONENTS = 'logic_studio_custom_components';

export const getInitialCustomComponents = (): Record<string, CustomComponentDefinition> => {
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

export const saveCustomComponentsToStorage = (customComponents: Record<string, CustomComponentDefinition>) => {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_COMPONENTS, JSON.stringify(customComponents));
  } catch (e) {
    console.error('Failed to save custom components to localStorage', e);
  }
};
