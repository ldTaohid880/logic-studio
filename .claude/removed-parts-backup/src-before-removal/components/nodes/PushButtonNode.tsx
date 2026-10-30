import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { CircleDot } from 'lucide-react';

export const PushButtonNode: React.FC<NodeProps> = memo(({ id, data: nodeData, selected }) => {
  const data = nodeData as unknown as NodeData;
  const isPressed = data.value === 1;

  const setPressedState = (pressed: boolean) => {
    const nodes = useCircuitStore.getState().nodes;
    useCircuitStore.setState({
      nodes: nodes.map((n) =>
        n.id === id
          ? {
              ...n,
              data: {
                ...n.data,
                value: pressed ? 1 : 0,
              },
            }
          : n
      ),
    });
    useCircuitStore.getState().tickSimulation(true);
  };

  return (
    <div
      className={`min-w-[130px] bg-slate-900/95 border rounded-xl p-3 shadow-2xl backdrop-blur-md transition-all select-none ${
        selected ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-800'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-800">
        <CircleDot className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-mono font-bold text-slate-100 truncate">
          {data.label || 'Push Button'}
        </span>
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onMouseDown={() => setPressedState(true)}
          onMouseUp={() => setPressedState(false)}
          onMouseLeave={() => setPressedState(false)}
          onTouchStart={() => setPressedState(true)}
          onTouchEnd={() => setPressedState(false)}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-mono font-bold text-xs transition-all active:scale-95 cursor-pointer ${
            isPressed
              ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.9)] scale-95'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-500/50'
          }`}
        >
          {isPressed ? 'HIGH' : 'PUSH'}
        </button>

        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
          {isPressed ? 'ON (1)' : 'OFF (0)'}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="out-0"
        className="lsp-pin !-right-[12px] !top-1/2 !-translate-y-1/2"
                  data-signal={isPressed ? 'high' : 'low'}
      />
    </div>
  );
});

PushButtonNode.displayName = 'PushButtonNode';
