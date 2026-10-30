import React from 'react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { useShallow } from 'zustand/react/shallow';

/** Bottom status strip: selection, circuit size, simulation state. */
export const StatusBar: React.FC = () => {
  const { nodeCount, edgeCount, selectedCount, selectedEdgeId, depth } = useCircuitStore(
    useShallow((s) => ({
      nodeCount: s.nodes.filter((n) => n.type !== 'groupNode').length,
      edgeCount: s.edges.length,
      selectedCount: s.nodes.filter((n) => n.selected).length,
      selectedEdgeId: s.selectedEdgeId,
      depth: s.hierarchyPath.length,
    }))
  );

  const selection =
    selectedCount > 0
      ? `${selectedCount} selected`
      : selectedEdgeId
      ? 'Wire selected'
      : 'Nothing selected';

  const hint =
    nodeCount === 0
      ? 'Add parts from the Components panel or open an example from File → Example circuits'
      : selectedCount > 1
      ? 'Right-click to group the selection or turn it into a reusable component'
      : 'Drag from a pin to wire it · Shift-drag to box-select';

  return (
    <footer className="ui-scale h-7 shrink-0 flex items-center gap-4 px-3 border-t border-line bg-surface-1 text-xs text-fg-subtle select-none">
      <span className="text-fg-muted">{selection}</span>
      <span className="hidden sm:inline tabular-nums">
        {nodeCount} part{nodeCount === 1 ? '' : 's'} · {edgeCount} wire{edgeCount === 1 ? '' : 's'}
      </span>
      {depth > 1 && <span className="hidden sm:inline text-accent-fg">Editing subcircuit</span>}
      <span className="flex-1 truncate hidden md:block text-center">{hint}</span>
      <span className="ml-auto md:ml-0 hidden sm:inline">Signals update as you edit</span>
    </footer>
  );
};
