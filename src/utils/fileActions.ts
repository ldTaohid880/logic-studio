import { useCircuitStore } from '../store/useCircuitStore';

/** Downloads the current circuit (and custom component definitions) as JSON. */
export function saveCircuitAsJSON() {
  const { nodes, edges, customComponents, showToast } = useCircuitStore.getState();
  const circuitData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    nodes,
    edges,
    customComponents,
  };

  const blob = new Blob([JSON.stringify(circuitData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `logic-circuit-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('Circuit saved as JSON');
}
