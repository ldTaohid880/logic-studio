import { CircuitStore, StoreSlice } from '../types';

// Undo/redo snapshots of the current hierarchy level
export type HistorySlice = Pick<CircuitStore,
  | 'historyPast'
  | 'historyFuture'
  | 'saveHistory'
  | 'saveHistoryCoalesced'
  | 'undo'
  | 'redo'
>;

// Edits with the same key within this window share one undo step (e.g. typing a label)
const COALESCE_MS = 1200;
let lastCoalesce: { key: string; at: number } | null = null;

export const createHistorySlice: StoreSlice<HistorySlice> = (set, get) => ({
  historyPast: [],
  historyFuture: [],

  saveHistory: () => {
    const { nodes, edges, historyPast } = get();
    // Keep max 30 snapshots
    const newPast = [...historyPast.slice(-29), { nodes, edges }];
    set({ historyPast: newPast, historyFuture: [] });
    lastCoalesce = null;
  },

  saveHistoryCoalesced: (key) => {
    const now = Date.now();
    if (lastCoalesce && lastCoalesce.key === key && now - lastCoalesce.at < COALESCE_MS) {
      lastCoalesce.at = now;
      return;
    }
    get().saveHistory();
    lastCoalesce = { key, at: now };
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
});
