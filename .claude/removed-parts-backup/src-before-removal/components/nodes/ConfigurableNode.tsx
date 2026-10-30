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
      case 'CFG_ENCODER': return { title: 'Config Encoder', tag: 'Cfg' };
      case 'CFG_DECODER': return { title: 'Config Decoder', tag: 'Cfg' };
      case 'CFG_MUX': return { title: 'Config MUX', tag: 'Cfg' };
      case 'CFG_DEMUX': return { title: 'Config DEMUX', tag: 'Cfg' };
      case 'CFG_COMPARATOR': return { title: 'Config Comparator', tag: 'Cfg' };
      case 'CFG_REGISTER': return { title: 'Config Register', tag: 'Cfg' };
      case 'CFG_SHIFT_REGISTER': return { title: 'Config Shift Reg', tag: 'Cfg' };
      case 'CFG_COUNTER': return { title: 'Config Counter', tag: 'Cfg' };
      case 'CFG_CONSTANT': return { title: 'Config Constant', tag: 'Cfg' };
      case 'CFG_BUS_SPLITTER': return { title: 'Bus Splitter', tag: 'Cfg' };
      case 'CFG_BUS_JOINER': return { title: 'Bus Joiner', tag: 'Cfg' };
      default: return { title: data.label || 'Configurable Block', tag: 'Cfg' };
    }
  };

  const header = getHeaderInfo();

  return (
    <div
      className="min-w-[180px] bg-slate-900/95 border rounded-xl shadow-md backdrop-blur-md transition-all duration-150 border-slate-800 hover:border-slate-750"
    >
      {/* Configurable Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950/90 rounded-t-xl">
        <div className="flex items-center gap-1.5 min-w-0">
          <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
                  className="lsp-pin !-left-[12px]"
                  data-signal={isHigh ? 'high' : 'low'}
                />
                <span className={`text-[10px] font-mono font-medium ${isHigh ? 'text-emerald-300 font-semibold' : 'text-slate-400'}`}>
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
                <span className={`text-[10px] font-mono font-medium ${isHigh ? 'text-emerald-300 font-semibold' : 'text-slate-400'}`}>
                  {pin.name}
                </span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={pin.id}
                  className="lsp-pin !-right-[12px]"
                  data-signal={isHigh ? 'high' : 'low'}
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
