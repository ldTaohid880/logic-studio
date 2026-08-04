import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';

export const DigitalOutputNode = React.memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as NodeData;
  const { label, value = -1 } = nodeData;

  const isHigh = value === 1;
  const isLow = value === 0;

  return (
    <div
      className={`relative min-w-[130px] p-3 rounded-xl transition-all duration-200 border backdrop-blur-md shadow-lg ${
        selected
          ? 'border-emerald-400/80 shadow-emerald-500/20 ring-2 ring-emerald-500/30 bg-slate-900/90'
          : 'border-slate-700/60 hover:border-slate-500/80 bg-slate-900/80 hover:shadow-cyan-500/10'
      }`}
    >
      {/* Input Pin Handle (Left Side) */}
      <Handle
        type="target"
        position={Position.Left}
        id="in-0"
        style={{ left: '-12px', top: '50%' }}
        className={`!w-3.5 !h-3.5 !border-2 !rounded-full transition-all duration-200 ${
          isHigh
            ? '!bg-emerald-400 !border-emerald-200 shadow-[0_0_8px_#34d399]'
            : isLow
            ? '!bg-slate-700 !border-slate-400'
            : '!bg-amber-500 !border-amber-300'
        }`}
      />

      <div className="flex flex-col items-center gap-2">
        {/* Label */}
        <span className="text-xs font-semibold text-slate-300 tracking-wide font-mono">
          {label}
        </span>

        {/* Large Glowing LED Screen Display */}
        <div
          className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all duration-300 relative overflow-hidden ${
            isHigh
              ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(34,197,94,0.5)]'
              : isLow
              ? 'bg-slate-950/80 border-slate-700 text-slate-600'
              : 'bg-amber-950/50 border-amber-600 text-amber-500'
          }`}
        >
          {/* Inner LED Glow Circle */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-2xl font-black transition-all duration-300 ${
              isHigh
                ? 'bg-emerald-500/20 border border-emerald-400/50 shadow-[0_0_12px_#34d399]'
                : isLow
                ? 'bg-slate-800/50 border border-slate-700'
                : 'bg-amber-500/20 border border-amber-400/50'
            }`}
          >
            {value === -1 ? '?' : value}
          </div>
        </div>

        {/* LED Status Text */}
        <span className="text-[10px] font-mono font-medium text-slate-400 uppercase">
          {isHigh ? 'HIGH (1)' : isLow ? 'LOW (0)' : 'UNKNOWN (?)'}
        </span>
      </div>
    </div>
  );
});

DigitalOutputNode.displayName = 'DigitalOutputNode';
