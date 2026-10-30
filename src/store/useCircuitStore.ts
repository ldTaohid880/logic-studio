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

// Settle the restored circuit once so wires and displays show live values instead of whatever was saved
useCircuitStore.getState().tickSimulation();

// Autosave the root circuit so a page refresh doesn't lose work
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
// Warn once per session: a full localStorage would otherwise fail on every edit without the user knowing
let autosaveWarned = false;
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
      autosaveWarned = false;
    } catch (e) {
      console.error('Failed to autosave circuit to localStorage', e);
      if (!autosaveWarned) {
        autosaveWarned = true;
        useCircuitStore
          .getState()
          .showToast('Failed to autosave: browser storage is full. Use File → Save as JSON to keep a copy of this circuit', 'error');
      }
    }
  }, 1000);
});
