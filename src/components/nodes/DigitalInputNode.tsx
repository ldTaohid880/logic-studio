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
      className="relative min-w-[130px] p-3 rounded-xl transition-all duration-200 border border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-md"
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
              ? 'bg-emerald-600/80 border-emerald-500 shadow-sm'
              : 'bg-slate-800 border-slate-700'
          }`}
        >
          {/* Flat Switch Button Knob */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm font-mono transition-transform duration-300 shadow-sm ${
              isHigh
                ? 'translate-x-6 bg-white text-emerald-600'
                : 'translate-x-0 bg-slate-400 text-slate-950'
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
                ? 'bg-emerald-500'
                : 'bg-slate-700'
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
        className={`!w-3.5 !h-3.5 !border-2 !rounded-full ${
          isHigh
            ? '!bg-emerald-500 !border-emerald-250'
            : '!bg-slate-800 !border-slate-600'
        }`}
      />
    </div>
  );
});

DigitalInputNode.displayName = 'DigitalInputNode';
