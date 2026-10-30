import { CircuitPreset } from '../../types/circuit';
import { CIRCUIT_PRESETS } from '../../utils/presets';
import { getInitialPresets, savePresetsToStorage, removeUnsupportedParts, saveCustomComponentsToStorage } from '../helpers';
import { parseCircuitFile } from '../../utils/circuitFile';
import { CircuitStore, StoreSlice } from '../types';

// Presets and whole-circuit load/clear
export type ProjectSlice = Pick<CircuitStore,
  | 'presets'
  | 'loadCircuit'
  | 'openCircuitFile'
  | 'loadPreset'
  | 'addPreset'
  | 'updatePreset'
  | 'removePreset'
  | 'resetPresetsToDefault'
  | 'clearCanvas'
>;

export const createProjectSlice: StoreSlice<ProjectSlice> = (set, get) => ({
  presets: getInitialPresets(),
  loadCircuit: (rawNodes, rawEdges) => {
    get().saveHistory();
    const { nodes, edges, removed } = removeUnsupportedParts(rawNodes, rawEdges);
    set({
      nodes,
      edges,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
    get().tickSimulation();
    if (removed > 0) {
      get().showToast(
        `${removed} part${removed === 1 ? '' : 's'} left out: clocks, oscilloscopes, buses and some ICs are no longer available`,
        'info'
      );
    }
  },

  openCircuitFile: (text) => {
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      get().showToast('Failed to read the file: it is not valid JSON', 'error');
      return false;
    }

    const parsed = parseCircuitFile(json, get().customComponents);
    if (!parsed.ok) {
      get().showToast(parsed.error, 'error');
      return false;
    }

    if (Object.keys(parsed.components).length > 0) {
      const customComponents = { ...get().customComponents, ...parsed.components };
      set({ customComponents });
      saveCustomComponentsToStorage(customComponents);
    }
    const toastBefore = get().toastMessage;
    get().loadCircuit(parsed.nodes, parsed.edges);
    if (parsed.renamed > 0) {
      get().showToast(
        `Circuit opened. ${parsed.renamed} component${parsed.renamed === 1 ? '' : 's'} differed from your library and ${
          parsed.renamed === 1 ? 'was' : 'were'
        } added as a copy`,
        'info'
      );
    } else if (get().toastMessage === toastBefore) {
      // Keep loadCircuit's note about left-out parts if it showed one
      get().showToast('Circuit opened');
    }
    return true;
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
});
