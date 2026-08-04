import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { Radio, Type, Clock, Split, Merge } from 'lucide-react';

export const UtilityNode: React.FC<NodeProps> = memo(({ id, data: nodeData, selected }) => {
  const data = nodeData as unknown as NodeData;
  const inputs = data.inputs || [];
  const outputs = data.outputs || [];

  if (data.gateType === 'TEXT_LABEL') {
    return (
      <div
        className={`px-3 py-2 rounded-xl bg-slate-900/80 border backdrop-blur-sm transition-all ${
          selected ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-800'
        }`}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <Type className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="text-[10px] font-mono font-bold uppercase text-amber-400 tracking-wider">
            Annotation
          </span>
        </div>
        <p className="text-xs font-sans text-slate-200 whitespace-pre-wrap max-w-xs">
          {data.annotationText || data.label || 'Double-click inspector to edit note.'}
        </p>
      </div>
    );
  }

  if (data.gateType === 'TUNNEL') {
    const isConnected = inputs[0]?.value !== undefined && inputs[0]?.value !== -1;
    const isHigh = inputs[0]?.value === 1 || outputs[0]?.value === 1;

    return (
      <div
        className={`min-w-[120px] bg-slate-900/95 border rounded-xl p-2.5 shadow-xl backdrop-blur-md transition-all flex items-center justify-between gap-3 relative ${
          selected ? 'border-cyan-400 ring-2 ring-cyan-400/30' : 'border-slate-800'
        }`}
      >
        <Handle
          type="target"
          position={Position.Left}
          id="in-0"
          className={`!w-3 !h-3 !-left-[15px] !border-2 !transition-all ${
            isHigh ? '!bg-cyan-400 !border-cyan-200 !shadow-[0_0_8px_rgba(34,211,238,0.8)]' : '!bg-slate-800 !border-slate-600'
          }`}
        />

        <div className="flex items-center gap-1.5">
          <Radio className={`w-3.5 h-3.5 ${isHigh ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="text-xs font-mono font-bold text-cyan-300">
            {data.tunnelLabel || data.label || 'A'}
          </span>
        </div>

        <Handle
          type="source"
          position={Position.Right}
          id="out-0"
          className={`!w-3 !h-3 !-right-[15px] !border-2 !transition-all ${
            isHigh ? '!bg-cyan-400 !border-cyan-200 !shadow-[0_0_8px_rgba(34,211,238,0.8)]' : '!bg-slate-800 !border-slate-600'
          }`}
        />
      </div>
    );
  }

  return (
    <div
      className={`min-w-[130px] bg-slate-900/95 border rounded-xl p-2.5 shadow-xl backdrop-blur-md transition-all ${
        selected ? 'border-emerald-400 ring-2 ring-emerald-400/30' : 'border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between gap-1 mb-2 pb-1 border-b border-slate-800">
        <span className="text-[11px] font-mono font-bold text-slate-200 truncate">
          {data.label || data.gateType}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 relative">
        <div className="flex flex-col gap-2">
          {inputs.map((pin) => {
            const isHigh = pin.value === 1;
            return (
              <div key={pin.id} className="relative flex items-center gap-1">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={pin.id}
                  className={`!w-3 !h-3 !-left-[17px] !border-2 ${
                    isHigh ? '!bg-emerald-400 !border-emerald-200' : '!bg-slate-800 !border-slate-600'
                  }`}
                />
                <span className="text-[9px] font-mono text-slate-400">{pin.name}</span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 items-end">
          {outputs.map((pin) => {
            const isHigh = pin.value === 1;
            return (
              <div key={pin.id} className="relative flex items-center gap-1">
                <span className="text-[9px] font-mono text-slate-400">{pin.name}</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={pin.id}
                  className={`!w-3 !h-3 !-right-[17px] !border-2 ${
                    isHigh ? '!bg-emerald-400 !border-emerald-200' : '!bg-slate-800 !border-slate-600'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

UtilityNode.displayName = 'UtilityNode';
