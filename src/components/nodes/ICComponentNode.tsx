import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { useShallow } from 'zustand/react/shallow';
import { ExternalLink } from 'lucide-react';
import { ChipFrame, ChipPinRow } from './ChipFrame';
import { getComponentInfo } from '../../data/components';

const CATEGORY_COLOR: Record<string, string> = {
  Combinational: 'var(--cy-500)',
  Memory: 'var(--pu-500)',
  Arithmetic: 'var(--am-500)',
};

export const ICComponentNode: React.FC<NodeProps> = memo(({ id, data: nodeData }) => {
  const data = nodeData as unknown as NodeData;
  const { enterSubcircuitView } = useCircuitStore(useShallow((s) => ({ enterSubcircuitView: s.enterSubcircuitView })));
  const inputs = data.inputs || [];
  const outputs = data.outputs || [];

  const subcircuitId = data.customComponentId || 
    (data.gateType === 'HALF_ADDER' ? 'builtin_half_adder' : 
     data.gateType === 'FULL_ADDER' ? 'builtin_full_adder' : undefined);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (subcircuitId) {
      enterSubcircuitView(subcircuitId, id);
    }
  };

  const info = getComponentInfo(data.gateType);
  const header = { title: info.name, code: info.partNumber, category: info.category };


  return (
    <ChipFrame
      title={data.label || header.title}
      tag={header.code}
      accentColor={CATEGORY_COLOR[header.category] ?? 'var(--fg-subtle)'}
      onDoubleClick={handleDoubleClick}
      action={
        subcircuitId ? (
          <button
            type="button"
            onClick={handleDoubleClick}
            title="Show internal logic (double-click)"
            aria-label="Show internal logic"
            className="nodrag p-1 rounded text-fg-subtle hover:text-fg hover:bg-surface-2 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        ) : undefined
      }
    >
      <ChipPinRow inputs={inputs} outputs={outputs} aliases={data.pinAliases} />
    </ChipFrame>
  );
});

ICComponentNode.displayName = 'ICComponentNode';
