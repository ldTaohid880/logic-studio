import React from 'react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { useShallow } from 'zustand/react/shallow';
import { AlertTriangle } from 'lucide-react';

/** Bottom status strip: selection, circuit size, simulation state. */
export const StatusBar: React.FC = () => {
  const { nodeCount, edgeCount, selectedCount, selectedEdgeId, depth, unstableCount, conflictCount } = useCircuitStore(
    useShallow((s) => ({
      nodeCount: s.nodes.filter((n) => n.type !== 'groupNode').length,
      edgeCount: s.edges.length,
      selectedCount: s.nodes.filter((n) => n.selected).length,
      selectedEdgeId: s.selectedEdgeId,
      depth: s.hierarchyPath.length,
      unstableCount: s.simulation.unstableNodeIds.length,
      conflictCount: s.simulation.conflictNodeIds.length,
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
      {conflictCount > 0 ? (
        <span
          role="status"
          title="Two or more outputs drive the same wire to different levels, which on real hardware is a short circuit. Enable only one tri-state output on a shared wire at a time."
          className="ml-auto md:ml-0 inline-flex items-center gap-1.5 text-danger font-medium"
        >
          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
          Outputs conflict on a wire
        </span>
      ) : unstableCount > 0 ? (
        <span
          role="status"
          title="A feedback loop keeps flipping (for example an odd ring of inverters). The parts outlined in amber never reach a steady value."
          className="ml-auto md:ml-0 inline-flex items-center gap-1.5 text-signal-unknown font-medium"
        >
          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
          Circuit doesn't settle
        </span>
      ) : (
        <span className="ml-auto md:ml-0 hidden sm:inline">Signals update as you edit</span>
      )}
    </footer>
  );
};
