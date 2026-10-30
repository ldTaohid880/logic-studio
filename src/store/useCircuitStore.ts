import { create } from 'zustand';
import { CircuitStore } from './types';
import { STORAGE_KEY_CIRCUIT } from './helpers';
import { createUiSlice } from './slices/ui';
import { createHistorySlice } from './slices/history';
import { createEditorSlice } from './slices/editor';
import { createDevicesSlice } from './slices/devices';
import { createSimulationSlice } from './slices/simulation';
import { createProjectSlice } from './slices/project';
import { createCustomComponentsSlice } from './slices/customComponents';

export const useCircuitStore = create<CircuitStore>((set, get) => ({
  ...createUiSlice(set, get),
  ...createHistorySlice(set, get),
  ...createEditorSlice(set, get),
  ...createDevicesSlice(set, get),
  ...createSimulationSlice(set, get),
  ...createProjectSlice(set, get),
  ...createCustomComponentsSlice(set, get),
}));

// Autosave the root circuit so a page refresh doesn't lose work
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
useCircuitStore.subscribe((state, prev) => {
  if (state.nodes === prev.nodes && state.edges === prev.edges && state.hierarchyPath === prev.hierarchyPath) return;
  // Throttle rather than debounce: a running clock changes nodes every tick and would postpone a debounce forever
  if (autosaveTimer) return;
  autosaveTimer = setTimeout(() => {
    autosaveTimer = null;
    const { nodes, edges, hierarchyPath, rootCircuitState } = useCircuitStore.getState();
    const root = hierarchyPath.length === 1 ? { nodes, edges } : rootCircuitState;
    if (!root) return;
    try {
      localStorage.setItem(STORAGE_KEY_CIRCUIT, JSON.stringify(root));
    } catch (e) {
      console.error('Failed to autosave circuit to localStorage', e);
    }
  }, 1000);
});
