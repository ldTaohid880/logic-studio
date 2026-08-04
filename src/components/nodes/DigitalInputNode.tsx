import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';

export const DigitalInputNode = React.memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as NodeData;
  const { label, value = 0 } = nodeData;
  const toggleInputValue = useCircuitStore((state) => state.toggleInputValue);

  const isHigh = value === 1;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleInputValue(id);
  };

  return (
    <div
      className={`relative min-w-[130px] p-3 rounded-xl transition-all duration-200 border backdrop-blur-md shadow-lg ${
        selected
          ? 'border-emerald-400/80 shadow-emerald-500/20 ring-2 ring-emerald-500/30 bg-slate-900/90'
          : 'border-slate-700/60 hover:border-slate-500/80 bg-slate-900/80 hover:shadow-emerald-500/10'
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        {/* Label */}
        <span className="text-xs font-semibold text-slate-300 tracking-wide font-mono">
          {label}
        </span>

        {/* Large Interactive Toggle Switch */}
        <button
          onClick={handleToggle}
          type="button"
          className={`relative w-16 h-10 rounded-full p-1 transition-all duration-300 cursor-pointer flex items-center border ${
            isHigh
              ? 'bg-emerald-950/80 border-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]'
              : 'bg-slate-800 border-slate-600'
          }`}
        >
          {/* Glowing Switch Button Knob */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm font-mono transition-transform duration-300 shadow-md ${
              isHigh
                ? 'translate-x-6 bg-emerald-400 text-slate-950 shadow-[0_0_10px_#34d399]'
                : 'translate-x-0 bg-slate-600 text-slate-300'
            }`}
          >
            {value}
          </div>
        </button>

        {/* LED Indicator Status Text */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              isHigh
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                : 'bg-slate-600'
            }`}
          />
          <span className="text-[10px] font-mono font-medium text-slate-400 uppercase">
            {isHigh ? 'HIGH (1)' : 'LOW (0)'}
          </span>
        </div>
      </div>

      {/* Output Pin Handle (Right Side) */}
      <Handle
        type="source"
        position={Position.Right}
        id="out-0"
        style={{ right: '-12px', top: '50%' }}
        className={`!w-3.5 !h-3.5 !border-2 !rounded-full transition-all duration-200 ${
          isHigh
            ? '!bg-emerald-400 !border-emerald-200 shadow-[0_0_8px_#34d399]'
            : '!bg-slate-700 !border-slate-400'
        }`}
      />
    </div>
  );
});

DigitalInputNode.displayName = 'DigitalInputNode';
