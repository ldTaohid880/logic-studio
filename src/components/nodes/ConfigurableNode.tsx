import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { Settings, Cpu } from 'lucide-react';

export const ConfigurableNode: React.FC<NodeProps> = memo(({ id, data: nodeData, selected }) => {
  const data = nodeData as unknown as NodeData;
  const inputs = data.inputs || [];
  const outputs = data.outputs || [];

  const getHeaderInfo = () => {
    switch (data.gateType) {
      case 'CFG_ENCODER': return { title: 'Config Encoder', tag: 'CFG' };
      case 'CFG_DECODER': return { title: 'Config Decoder', tag: 'CFG' };
      case 'CFG_MUX': return { title: 'Config MUX', tag: 'CFG' };
      case 'CFG_DEMUX': return { title: 'Config DEMUX', tag: 'CFG' };
      case 'CFG_COMPARATOR': return { title: 'Config Comparator', tag: 'CFG' };
      case 'CFG_REGISTER': return { title: 'Config Register', tag: 'CFG' };
      case 'CFG_SHIFT_REGISTER': return { title: 'Config Shift Reg', tag: 'CFG' };
      case 'CFG_COUNTER': return { title: 'Config Counter', tag: 'CFG' };
      case 'CFG_CONSTANT': return { title: 'Config Constant', tag: 'CFG' };
      case 'CFG_BUS_SPLITTER': return { title: 'Bus Splitter', tag: 'CFG' };
      case 'CFG_BUS_JOINER': return { title: 'Bus Joiner', tag: 'CFG' };
      default: return { title: data.label || 'Configurable Block', tag: 'CFG' };
    }
  };

  const header = getHeaderInfo();

  return (
    <div
      className={`min-w-[180px] bg-slate-900/95 border-2 rounded-xl shadow-md backdrop-blur-md transition-all duration-150 ${
        selected
          ? 'border-purple-400 ring-1 ring-purple-400/50'
          : 'border-purple-600/40 hover:border-purple-500/70'
      }`}
    >
      {/* Configurable Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-purple-900/50 bg-slate-950/90 rounded-t-xl">
        <div className="flex items-center gap-1.5 min-w-0">
          <Settings className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="text-xs font-mono font-bold text-slate-100 truncate">
            {data.label || header.title}
          </span>
        </div>
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
          {header.tag}
        </span>
      </div>

      {/* Pin Grid Body */}
      <div className="p-3 flex justify-between gap-6 relative">
        {/* Left Side: Inputs */}
        <div className="flex flex-col gap-2.5">
          {inputs.map((pin) => {
            const isHigh = pin.value === 1;
            return (
              <div key={pin.id} className="relative flex items-center gap-2 group">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={pin.id}
                  className={`!w-3 !h-3 !-left-[19px] !border-2 !transition-all ${
                    isHigh
                      ? '!bg-purple-500 !border-purple-200'
                      : '!bg-slate-800 !border-purple-900'
                  }`}
                />
                <span className={`text-[10px] font-mono font-medium ${isHigh ? 'text-purple-300 font-semibold' : 'text-slate-400'}`}>
                  {pin.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right Side: Outputs */}
        <div className="flex flex-col gap-2.5 items-end">
          {outputs.map((pin) => {
            const isHigh = pin.value === 1;
            return (
              <div key={pin.id} className="relative flex items-center gap-2 group">
                <span className={`text-[10px] font-mono font-medium ${isHigh ? 'text-purple-300 font-semibold' : 'text-slate-400'}`}>
                  {pin.name}
                </span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={pin.id}
                  className={`!w-3 !h-3 !-right-[19px] !border-2 !transition-all ${
                    isHigh
                      ? '!bg-purple-500 !border-purple-200'
                      : '!bg-slate-800 !border-purple-900'
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

ConfigurableNode.displayName = 'ConfigurableNode';
