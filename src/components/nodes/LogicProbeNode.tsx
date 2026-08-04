import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { Activity } from 'lucide-react';

export const LogicProbeNode: React.FC<NodeProps> = memo(({ id, data: nodeData, selected }) => {
  const data = nodeData as unknown as NodeData;
  const val = data.inputs?.[0]?.value ?? data.value ?? -1;

  const getProbeStatus = () => {
    if (val === 1) {
      return {
        label: 'HIGH (1)',
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-400',
        border: 'border-emerald-500/40',
        glow: 'shadow-[0_0_12px_rgba(52,211,153,0.5)]',
      };
    }
    if (val === 0) {
      return {
        label: 'LOW (0)',
        bg: 'bg-rose-500/20',
        text: 'text-rose-400',
        border: 'border-rose-500/40',
        glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]',
      };
    }
    return {
      label: 'FLOATING (Z)',
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/40',
      glow: 'shadow-none',
    };
  };

  const status = getProbeStatus();

  return (
    <div
      className={`min-w-[120px] bg-slate-900/95 border rounded-xl p-3 shadow-2xl backdrop-blur-md transition-all ${
        selected ? 'border-emerald-400 ring-2 ring-emerald-400/30' : 'border-slate-800'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-800">
        <Activity className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xs font-mono font-bold text-slate-100 truncate">
          {data.label || 'Logic Probe'}
        </span>
      </div>

      <div className="flex items-center gap-2 relative">
        <Handle
          type="target"
          position={Position.Left}
          id="in-0"
          className={`!w-3 !h-3 !-left-[19px] !border-2 !transition-all ${
            val === 1
              ? '!bg-emerald-400 !border-emerald-200 !shadow-[0_0_8px_rgba(52,211,153,0.8)]'
              : '!bg-slate-800 !border-slate-600'
          }`}
        />

        <div
          className={`flex-1 py-1.5 px-2.5 rounded-lg border flex items-center justify-center font-mono font-bold text-xs transition-all ${status.bg} ${status.text} ${status.border} ${status.glow}`}
        >
          {status.label}
        </div>
      </div>
    </div>
  );
});

LogicProbeNode.displayName = 'LogicProbeNode';
