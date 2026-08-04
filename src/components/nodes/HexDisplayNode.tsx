import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { Binary } from 'lucide-react';

export const HexDisplayNode: React.FC<NodeProps> = memo(({ id, data: nodeData, selected }) => {
  const data = nodeData as unknown as NodeData;
  const inputs = data.inputs || [];

  const d3 = inputs[3]?.value === 1 ? 1 : 0;
  const d2 = inputs[2]?.value === 1 ? 1 : 0;
  const d1 = inputs[1]?.value === 1 ? 1 : 0;
  const d0 = inputs[0]?.value === 1 ? 1 : 0;

  const num = (d3 << 3) | (d2 << 2) | (d1 << 1) | d0;
  const hexChar = num.toString(16).toUpperCase();

  return (
    <div
      className={`min-w-[130px] bg-slate-900/95 border rounded-xl p-3 shadow-2xl backdrop-blur-md transition-all ${
        selected ? 'border-indigo-400 ring-2 ring-indigo-400/30' : 'border-slate-800'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-2.5 pb-1.5 border-b border-slate-800">
        <Binary className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-xs font-mono font-bold text-slate-100 truncate">
          {data.label || 'Hex Display'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 relative">
        {/* 4 Inputs: D0..D3 */}
        <div className="flex flex-col gap-2">
          {['D0', 'D1', 'D2', 'D3'].map((lbl, idx) => {
            const isHigh = inputs[idx]?.value === 1;
            return (
              <div key={lbl} className="relative flex items-center gap-1.5">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`in-${idx}`}
                  className={`!w-3 !h-3 !-left-[19px] !border-2 !transition-all ${
                    isHigh
                      ? '!bg-indigo-400 !border-indigo-200 !shadow-[0_0_8px_rgba(129,140,248,0.8)]'
                      : '!bg-slate-800 !border-slate-600'
                  }`}
                />
                <span className={`text-[10px] font-mono ${isHigh ? 'text-indigo-300 font-bold' : 'text-slate-400'}`}>
                  {lbl}
                </span>
              </div>
            );
          })}
        </div>

        {/* OLED/7-segment Style Digital Hex Readout Box */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-14 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center shadow-inner">
            <span className="text-2xl font-mono font-black text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.8)]">
              {hexChar}
            </span>
          </div>
          <span className="text-[9px] font-mono text-slate-400">0x{hexChar}</span>
        </div>
      </div>
    </div>
  );
});

HexDisplayNode.displayName = 'HexDisplayNode';
