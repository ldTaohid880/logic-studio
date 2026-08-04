import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { GateIcon } from './GateIcons';

export const LogicGateNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const nodeData = data as unknown as NodeData;
  const { label, gateType, inputs = [], outputs = [] } = nodeData;

  const primaryOutputVal = outputs[0]?.value ?? -1;

  // LED Glow state
  const isHigh = primaryOutputVal === 1;
  const isLow = primaryOutputVal === 0;

  return (
    <div
      className={`relative min-w-[140px] px-3 py-2.5 rounded-xl transition-all duration-200 border backdrop-blur-md shadow-lg group ${
        selected
          ? 'border-emerald-400/80 shadow-emerald-500/20 ring-2 ring-emerald-500/30 bg-slate-900/90'
          : 'border-slate-700/60 hover:border-slate-500/80 bg-slate-900/80 hover:shadow-cyan-500/10'
      }`}
    >
      {/* Small LED status indicator at top-right */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
        <span
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            isHigh
              ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
              : isLow
              ? 'bg-slate-600'
              : 'bg-amber-500/80'
          }`}
        />
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-2 pr-4">
        <div className={`${isHigh ? 'text-emerald-400' : 'text-cyan-400'}`}>
          <GateIcon type={gateType} className="w-8 h-8" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-200 tracking-wide font-mono">
            {label}
          </span>
          <span className="text-[10px] text-slate-400 font-sans">
            {inputs.length} IN • 1 OUT
          </span>
        </div>
      </div>

      {/* Input Handles (Left Side) */}
      <div className="flex flex-col justify-around py-1 gap-3.5 my-1">
        {inputs.map((pin, index) => {
          const pinHigh = pin.value === 1;
          const pinLow = pin.value === 0;
          const topPercent = inputs.length === 1 ? 50 : 25 + index * (50 / (inputs.length - 1));

          return (
            <div key={pin.id} className="relative flex items-center">
              <Handle
                type="target"
                position={Position.Left}
                id={pin.id}
                style={{
                  top: `${topPercent}%`,
                  left: '-12px',
                }}
                className={`!w-3 !h-3 !border-2 !rounded-full transition-all duration-200 ${
                  pinHigh
                    ? '!bg-emerald-400 !border-emerald-200 shadow-[0_0_6px_#34d399]'
                    : pinLow
                    ? '!bg-slate-700 !border-slate-400'
                    : '!bg-amber-500 !border-amber-300'
                }`}
              />
              <span className="text-[10px] text-slate-400 font-mono pl-1">
                {pin.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Output Handles (Right Side) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
        {outputs.map((pin) => {
          const pinHigh = pin.value === 1;
          const pinLow = pin.value === 0;

          return (
            <React.Fragment key={pin.id}>
              <span className="text-[10px] text-slate-400 font-mono pr-2">
                {pin.name}
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={pin.id}
                style={{
                  right: '-12px',
                  top: '50%',
                }}
                className={`!w-3 !h-3 !border-2 !rounded-full transition-all duration-200 ${
                  pinHigh
                    ? '!bg-emerald-400 !border-emerald-200 shadow-[0_0_8px_#34d399]'
                    : pinLow
                    ? '!bg-slate-700 !border-slate-400'
                    : '!bg-amber-500 !border-amber-300'
                }`}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
