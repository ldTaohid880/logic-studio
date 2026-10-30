import React from 'react';
import { Node } from '@xyflow/react';
import { Layers, PackagePlus, Copy, Trash2, BoxSelect } from 'lucide-react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { getComponentInfo } from '../../data/components';
import { PartGlyph } from '../toolbar/PartGlyph';
import { InspectorHeader } from './InspectorHeader';

interface SelectionSummaryProps {
  selected: Node[];
  onOpenWizard?: () => void;
}

/** Several parts selected: what is in the selection and what you can do with it. */
export const SelectionSummary: React.FC<SelectionSummaryProps> = ({ selected, onOpenWizard }) => {
  const counts = new Map<string, { name: string; type: NodeData['gateType']; count: number }>();
  selected
    .filter((n) => n.type !== 'groupNode')
    .forEach((n) => {
      const data = n.data as unknown as NodeData;
      const key = data.gateType;
      const entry = counts.get(key) ?? { name: getComponentInfo(data.gateType).name, type: data.gateType, count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    });
  const store = useCircuitStore.getState;

  const actions = [
    { id: 'group', label: 'Group', hint: 'Ctrl+G', icon: <Layers className="w-4 h-4" />, run: () => store().groupSelectedNodes() },
    {
      id: 'component',
      label: 'Make a component…',
      hint: 'Reuse it as one part',
      icon: <PackagePlus className="w-4 h-4" />,
      run: () => onOpenWizard?.(),
    },
    { id: 'duplicate', label: 'Duplicate', hint: 'Ctrl+D', icon: <Copy className="w-4 h-4" />, run: () => store().duplicateSelected() },
    { id: 'delete', label: 'Delete', hint: 'Del', icon: <Trash2 className="w-4 h-4" />, run: () => store().deleteSelected(), danger: true },
  ];

  return (
    <aside aria-label="Selection" className="w-full h-full flex flex-col overflow-hidden bg-surface-1 text-fg">
      <InspectorHeader icon={<BoxSelect className="w-6 h-6" />} title={`${selected.length} parts selected`} subtitle="Ctrl+click a part to add or remove it" />
      <div className="flex-1 overflow-y-auto min-h-0 p-2">
        <ul className="mb-2">
          {Array.from(counts.values()).map((c) => (
            <li key={c.type} className="flex items-center gap-2.5 h-9 px-2 text-[13px]">
              <span className="h-6 w-9 shrink-0 flex items-center justify-center text-fg-subtle" aria-hidden="true">
                <PartGlyph type={c.type} />
              </span>
              <span className="flex-1 text-fg">{c.name}</span>
              <span className="text-fg-subtle tabular-nums">× {c.count}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-line pt-2 space-y-0.5">
          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={a.run}
              className={`w-full flex items-center gap-2.5 h-9 px-2 rounded-lg text-[13px] text-left hover:bg-surface-2 cursor-pointer ${
                a.danger ? 'text-rose-400' : 'text-fg'
              }`}
            >
              <span className={a.danger ? '' : 'text-fg-subtle'}>{a.icon}</span>
              <span className="flex-1">{a.label}</span>
              <span className="text-xs text-fg-subtle">{a.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
