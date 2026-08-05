import React from 'react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Layers, ExternalLink, Sparkles, Edit3 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CustomComponentPropertiesProps {
  nodeId: string;
  data: NodeData;
}

export const CustomComponentProperties: React.FC<CustomComponentPropertiesProps> = ({
  nodeId,
  data,
}) => {
  const { customComponents, updateNodeLabel, updateCustomComponent, enterSubcircuitView, showToast } =
    useCircuitStore();

  const customComponentId = data.customComponentId;
  const def = customComponentId ? customComponents[customComponentId] : undefined;

  if (!def) {
    return (
      <div className="p-4 text-xs text-slate-500 font-mono text-center">
        Custom component definition missing.
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs">
      {/* Component Title & Edit Subcircuit Action */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: def.color || '#10b981' }}
            >
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold font-mono text-slate-100">{def.name}</span>
              <span className="block text-[10px] text-slate-400 font-mono">{def.category}</span>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            CUSTOM
          </span>
        </div>

        <Button
          variant="emerald"
          size="xs"
          className="w-full"
          leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
          onClick={() => enterSubcircuitView(def.id, nodeId)}
        >
          Edit Internal Subcircuit
        </Button>
      </div>

      {/* Instance Label Input */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-mono font-bold text-slate-400">
          Instance Label
        </label>
        <Input
          value={data.label || ''}
          onChange={(e) => updateNodeLabel(nodeId, e.target.value)}
          placeholder={def.name}
          className="w-full bg-slate-950 border-slate-800"
        />
      </div>

      {/* Component Details */}
      <div className="space-y-2 border-t border-slate-800 pt-3">
        <label className="block text-[11px] font-mono font-bold text-slate-400">
          Subcircuit Metadata
        </label>

        <div className="space-y-1.5">
          <span className="text-[10px] text-slate-500 font-mono">Component Name</span>
          <Input
            value={def.name}
            onChange={(e) => updateCustomComponent(def.id, { name: e.target.value })}
            className="w-full bg-slate-950 border-slate-800"
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] text-slate-500 font-mono">Category</span>
          <Input
            value={def.category}
            onChange={(e) => updateCustomComponent(def.id, { category: e.target.value })}
            className="w-full bg-slate-950 border-slate-800"
          />
        </div>
      </div>

      {/* Pin Information List */}
      <div className="space-y-2 border-t border-slate-800 pt-3">
        <label className="block text-[11px] font-mono font-bold text-slate-400">
          Pin Specifications
        </label>

        <div className="space-y-2 font-mono text-[11px]">
          <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-1">
              Inputs ({def.inputs.length}):
            </span>
            <div className="flex flex-wrap gap-1">
              {def.inputs.map((pin) => (
                <span
                  key={pin.id}
                  className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300"
                >
                  {pin.name}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            <span className="text-emerald-400 font-bold block mb-1">
              Outputs ({def.outputs.length}):
            </span>
            <div className="flex flex-wrap gap-1">
              {def.outputs.map((pin) => (
                <span
                  key={pin.id}
                  className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300"
                >
                  {pin.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
