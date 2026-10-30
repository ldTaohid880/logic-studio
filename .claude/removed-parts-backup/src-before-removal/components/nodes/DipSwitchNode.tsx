import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Sliders } from 'lucide-react';

export const DipSwitchNode: React.FC<NodeProps> = memo(({ id, data: nodeData, selected }) => {
  const data = nodeData as unknown as NodeData;
  const bitWidth = data.bitWidth || 4;
  const dipValues = data.dipValues || Array(bitWidth).fill(0);
  const outputs = data.outputs || [];

  const updateNodeData = useCircuitStore((s) => s.updateNodeLabel); // We will add toggleDipSwitch to store or handle in store

  const toggleBit = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newVals = [...dipValues];
    newVals[idx] = newVals[idx] === 1 ? 0 : 1;

    // Save directly into node data
    const nodes = useCircuitStore.getState().nodes;
    useCircuitStore.setState({
      nodes: nodes.map((n) =>
        n.id === id
          ? {
              ...n,
              data: {
                ...n.data,
                dipValues: newVals,
              },
            }
          : n
      ),
    });

    useCircuitStore.getState().tickSimulation(true);
  };

  return (
    <div
      className={`min-w-[140px] bg-slate-900/95 border rounded-xl p-3 shadow-2xl backdrop-blur-md transition-all ${
        selected ? 'border-cyan-400 ring-2 ring-cyan-400/30' : 'border-slate-800'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-2.5 pb-1.5 border-b border-slate-800">
        <Sliders className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-xs font-mono font-bold text-slate-100 truncate">
          {data.label || `${bitWidth}-Bit DIP Switch`}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {Array.from({ length: bitWidth }).map((_, idx) => {
          const isHigh = dipValues[idx] === 1;
          const pinId = `out-${idx}`;
          return (
            <div key={idx} className="flex items-center justify-between gap-3 relative">
              <span className="text-[10px] font-mono text-slate-400">SW{idx + 1}</span>

              {/* Toggle switch button */}
              <button
                type="button"
                onClick={(e) => toggleBit(idx, e)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors relative cursor-pointer ${
                  isHigh ? 'bg-cyan-500' : 'bg-slate-800 border border-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                    isHigh ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>

              <Handle
                type="source"
                position={Position.Right}
                id={pinId}
                className="lsp-pin !-right-[12px]"
                  data-signal={isHigh ? 'high' : 'low'}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

DipSwitchNode.displayName = 'DipSwitchNode';
