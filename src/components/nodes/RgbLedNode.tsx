import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { Sparkles } from 'lucide-react';

export const RgbLedNode: React.FC<NodeProps> = memo(({ id, data: nodeData, selected }) => {
  const data = nodeData as unknown as NodeData;
  const inputs = data.inputs || [
    { id: 'in-0', name: 'R', value: 0 },
    { id: 'in-1', name: 'G', value: 0 },
    { id: 'in-2', name: 'B', value: 0 },
  ];

  const r = inputs[0]?.value === 1;
  const g = inputs[1]?.value === 1;
  const b = inputs[2]?.value === 1;

  // Calculate CSS RGB color
  const colorStyle = () => {
    if (!r && !g && !b) return { bg: 'bg-slate-950', glow: 'shadow-none', border: 'border-slate-800' };
    const rHex = r ? 'ff' : '00';
    const gHex = g ? 'ff' : '00';
    const bHex = b ? 'ff' : '00';
    const hex = `#${rHex}${gHex}${bHex}`;
    return {
      bg: `bg-[${hex}]`,
      glow: `shadow-[0_0_20px_${hex}]`,
      border: `border-white/40`,
      hex,
    };
  };

  const style = colorStyle();

  return (
    <div
      className={`min-w-[130px] bg-slate-900/95 border rounded-xl p-3 shadow-2xl backdrop-blur-md transition-all ${
        selected ? 'border-purple-400 ring-2 ring-purple-400/30' : 'border-slate-800'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-800">
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-xs font-mono font-bold text-slate-100 truncate">
          {data.label || 'RGB LED'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 relative">
        {/* Input Pins: R, G, B */}
        <div className="flex flex-col gap-2">
          {['R', 'G', 'B'].map((label, idx) => {
            const isHigh = inputs[idx]?.value === 1;
            const pinColor = idx === 0 ? 'text-red-400' : idx === 1 ? 'text-green-400' : 'text-blue-400';
            return (
              <div key={label} className="relative flex items-center gap-1.5">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`in-${idx}`}
                  className={`!w-3 !h-3 !-left-[12px] !border-2 !transition-all ${
                    isHigh
                      ? '!bg-white !border-purple-300 !shadow-[0_0_8px_rgba(217,70,239,0.8)]'
                      : '!bg-slate-800 !border-slate-600'
                  }`}
                />
                <span className={`text-[10px] font-mono font-bold ${pinColor}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* LED Glow Display Bulb */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${style.border} ${style.glow}`}
            style={{ backgroundColor: style.hex || '#090d16' }}
          >
            <div className="w-3 h-3 rounded-full bg-white/40 blur-[1px]" />
          </div>
          <span className="text-[9px] font-mono text-slate-400 uppercase">
            {r ? 'R' : ''}{g ? 'G' : ''}{b ? 'B' : ''}{!r && !g && !b ? 'OFF' : ''}
          </span>
        </div>
      </div>
    </div>
  );
});

RgbLedNode.displayName = 'RgbLedNode';
