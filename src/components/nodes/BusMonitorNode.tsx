import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { MonitorCheck } from 'lucide-react';

export const BusMonitorNode: React.FC<NodeProps> = memo(({ id, data: nodeData, selected }) => {
  const data = nodeData as unknown as NodeData;
  const bitWidth = data.bitWidth || 4;
  const inputs = data.inputs || [];

  let numericVal = 0;
  for (let i = 0; i < bitWidth; i++) {
    if (inputs[i]?.value === 1) {
      numericVal |= (1 << i);
    }
  }

  const binStr = numericVal.toString(2).padStart(bitWidth, '0');
  const hexStr = numericVal.toString(16).toUpperCase().padStart(Math.ceil(bitWidth / 4), '0');

  return (
    <div
      className={`min-w-[170px] bg-slate-900/95 border rounded-xl p-3 shadow-2xl backdrop-blur-md transition-all ${
        selected ? 'border-cyan-400 ring-2 ring-cyan-400/30' : 'border-slate-800'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-2.5 pb-1.5 border-b border-slate-800">
        <MonitorCheck className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-xs font-mono font-bold text-slate-100 truncate">
          {data.label || `${bitWidth}-Bit Bus Monitor`}
        </span>
      </div>

      <div className="flex justify-between gap-3 relative">
        {/* Input Pin list */}
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: bitWidth }).map((_, idx) => {
            const isHigh = inputs[idx]?.value === 1;
            return (
              <div key={idx} className="relative flex items-center gap-1.5">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`in-${idx}`}
                  className={`!w-3 !h-3 !-left-[19px] !border-2 !transition-all ${
                    isHigh
                      ? '!bg-cyan-400 !border-cyan-200 !shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                      : '!bg-slate-800 !border-slate-600'
                  }`}
                />
                <span className={`text-[10px] font-mono ${isHigh ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}>
                  B{idx}
                </span>
              </div>
            );
          })}
        </div>

        {/* Readout panel for Bin, Dec, Hex */}
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 flex flex-col justify-center gap-1 font-mono text-[10px]">
          <div className="flex items-center justify-between text-slate-400">
            <span>HEX:</span>
            <span className="text-cyan-300 font-bold">0x{hexStr}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>DEC:</span>
            <span className="text-emerald-300 font-bold">{numericVal}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>BIN:</span>
            <span className="text-amber-300 font-bold">{binStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

BusMonitorNode.displayName = 'BusMonitorNode';
