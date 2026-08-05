import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Layers, ExternalLink, Sparkles } from 'lucide-react';

export const CustomComponentNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = data as unknown as NodeData;
  const { enterSubcircuitView } = useCircuitStore();

  const customComponentId = nodeData.customComponentId;
  const customComponents = useCircuitStore((s) => s.customComponents);
  const def = customComponentId ? customComponents[customComponentId] : undefined;

  const inputs = nodeData.inputs || (def ? def.inputs.map((p) => ({ id: p.id, name: p.name, value: -1 as const })) : []);
  const outputs = nodeData.outputs || (def ? def.outputs.map((p) => ({ id: p.id, name: p.name, value: -1 as const })) : []);

  const titleName = nodeData.label || def?.name || 'Custom Component';
  const colorTheme = def?.color || '#10b981';

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (customComponentId) {
      enterSubcircuitView(customComponentId, id);
    }
  };

  const getSignalColor = (val: number) => {
    if (val === 1) return 'bg-emerald-500 border-emerald-400';
    if (val === 0) return 'bg-slate-700 border-slate-650';
    return 'bg-amber-500/50 border-amber-400/50 animate-pulse';
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className="relative group rounded-xl transition-all duration-200 border min-w-[170px] shadow-lg select-none bg-slate-900/90 border-slate-800 text-slate-100 backdrop-blur-md"
    >
      {/* Header Bar */}
      <div className="px-3 py-2 rounded-t-xl flex items-center justify-between border-b gap-2 bg-slate-950/90 border-slate-800">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: colorTheme }}
          >
            <Layers className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-bold font-mono truncate tracking-tight" title={titleName}>
            {titleName}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {customComponentId && (
            <button
              onClick={handleDoubleClick}
              title="Edit Subcircuit (Double-click)"
              className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Body: Inputs & Outputs */}
      <div className="p-3 flex justify-between gap-6 min-h-[60px]">
        {/* Left Side: Inputs */}
        <div className="flex flex-col justify-center space-y-3 text-left w-1/2">
          {inputs.map((inPin, index) => {
            const handleId = inPin.id || `in-${index}`;
            return (
              <div key={handleId} className="relative flex items-center gap-2 group/pin py-0.5">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={handleId}
                  className="!w-3.5 !h-3.5 !bg-slate-400 hover:!bg-cyan-400 !border-2 !border-slate-900 transition-colors cursor-crosshair !-left-[12px] top-1/2 -translate-y-1/2"
                />
                <span className={`w-2 h-2 rounded-full border shrink-0 ${getSignalColor(inPin.value)}`} />
                <span className="text-[11px] font-mono font-medium tracking-tight text-slate-300 truncate">
                  {inPin.name || `IN_${index + 1}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right Side: Outputs */}
        <div className="flex flex-col justify-center space-y-3 text-right w-1/2">
          {outputs.map((outPin, index) => {
            const handleId = outPin.id || `out-${index}`;
            return (
              <div key={handleId} className="relative flex items-center justify-end gap-2 group/pin py-0.5">
                <span className="text-[11px] font-mono font-medium tracking-tight text-slate-300 truncate">
                  {outPin.name || `OUT_${index + 1}`}
                </span>
                <span className={`w-2 h-2 rounded-full border shrink-0 ${getSignalColor(outPin.value)}`} />
                <Handle
                  type="source"
                  position={Position.Right}
                  id={handleId}
                  className="!w-3.5 !h-3.5 !bg-slate-400 hover:!bg-emerald-400 !border-2 !border-slate-900 transition-colors cursor-crosshair !-right-[12px] top-1/2 -translate-y-1/2"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

CustomComponentNode.displayName = 'CustomComponentNode';
