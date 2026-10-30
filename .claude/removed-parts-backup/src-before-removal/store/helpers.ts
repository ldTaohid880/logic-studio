import { Node, Edge } from '@xyflow/react';
import { NodeData, SimulationState, CircuitPreset } from '../types/circuit';
import { DEFAULT_CLOCK_CONFIG, DEFAULT_CLOCK_STATE } from '../types/clock';
import { isClockRunning, nextClockEdgeAfter } from '../simulation/clockLogic';
import { CIRCUIT_PRESETS } from '../utils/presets';
import { CustomComponentDefinition } from '../types/customComponent';
import { BUILTIN_HALF_ADDER, BUILTIN_FULL_ADDER } from '../utils/builtinAdders';

export const oscilloscopeBuffers = new Map<string, { samples: number[]; writeIndex: number; lastSampleSimTime: number }>();

export const DEFAULT_SIMULATION: SimulationState = {
  isRunning: true,
  isPaused: false,
  speed: 1, // 1x
  stepCount: 0,
  loopMode: true,
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
          return validPresets;
        }
      }
    }
  } catch (e) {
    console.error('Failed to load presets from localStorage', e);
  }
  return CIRCUIT_PRESETS;
};

export const savePresetsToStorage = (presets: CircuitPreset[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to save presets to localStorage', e);
  }
};

// Clock edges simulated per tick before falling back to sampling (protects against kHz/MHz clocks)
export const MAX_CLOCK_EDGES_PER_TICK = 256;

export const getNextClockEdge = (nodes: Node[], afterTimeMs: number): number | null => {
  let next: number | null = null;
  nodes.forEach((node) => {
    if (node.type !== 'clockNode') return;
    const data = node.data as unknown as NodeData;
    const config = data.clockConfig || DEFAULT_CLOCK_CONFIG;
    const state = data.clockState || DEFAULT_CLOCK_STATE;
    if (!isClockRunning(config, state)) return;
    const edge = nextClockEdgeAfter(config, state, afterTimeMs);
    if (edge !== null && (next === null || edge < next)) next = edge;
  });
  return next;
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

export const makeId = (prefix: string): string => {
  const unique = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${unique}`;
};

export const STORAGE_KEY_CIRCUIT = 'logic_studio_circuit';

// Restore the last open root circuit, falling back to the Half Adder preset
export const getInitialCircuit = (): { nodes: Node[]; edges: Edge[] } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CIRCUIT);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
        return { nodes: parsed.nodes, edges: parsed.edges };
      }
    }
  } catch (e) {
    console.error('Failed to load circuit from localStorage', e);
  }
  return { nodes: CIRCUIT_PRESETS[0].nodes, edges: CIRCUIT_PRESETS[0].edges };
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
