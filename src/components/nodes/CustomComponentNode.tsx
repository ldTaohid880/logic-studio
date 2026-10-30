import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { useShallow } from 'zustand/react/shallow';
import { ExternalLink } from 'lucide-react';
import { ChipFrame, ChipPinRow, chipActionClass } from './ChipFrame';

export const CustomComponentNode: React.FC<NodeProps> = memo(({ id, data }) => {
  const nodeData = data as unknown as NodeData;
  const { enterSubcircuitView } = useCircuitStore(useShallow((s) => ({ enterSubcircuitView: s.enterSubcircuitView })));

  const customComponentId = nodeData.customComponentId;
  const customComponents = useCircuitStore((s) => s.customComponents);
  const def = customComponentId ? customComponents[customComponentId] : undefined;

  const inputs = nodeData.inputs || (def ? def.inputs.map((p) => ({ id: p.id, name: p.name, value: -1 as const })) : []);
  const outputs = nodeData.outputs || (def ? def.outputs.map((p) => ({ id: p.id, name: p.name, value: -1 as const })) : []);

  const titleName = nodeData.label || def?.name || 'Custom Component';

  const openSubcircuit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (customComponentId) {
      enterSubcircuitView(customComponentId, id);
    }
  };

  return (
    <ChipFrame
      title={titleName}
      tag="Subcircuit"
      accentColor={def?.color || 'var(--signal-bus)'}
      onDoubleClick={openSubcircuit}
      action={
        customComponentId ? (
          <button
            type="button"
            onClick={openSubcircuit}
            title="Open subcircuit (double-click)"
            aria-label="Open subcircuit"
            className={chipActionClass}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        ) : undefined
      }
    >
      <ChipPinRow
        inputs={inputs.map((p, i) => ({ ...p, id: p.id || `in-${i}`, name: p.name || `IN_${i + 1}` }))}
        outputs={outputs.map((p, i) => ({ ...p, id: p.id || `out-${i}`, name: p.name || `OUT_${i + 1}` }))}
      />
    </ChipFrame>
  );
});

CustomComponentNode.displayName = 'CustomComponentNode';
