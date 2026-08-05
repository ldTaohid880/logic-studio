import React, { memo, useState } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Layers, Edit2, Check, Lock, Unlock, X, Palette } from 'lucide-react';

export const GROUP_COLORS: Record<string, { bg: string; border: string; text: string; badge: string; headerBg: string }> = {
  purple: {
    bg: 'bg-purple-950/20',
    border: 'border-purple-500/40 hover:border-purple-500/70',
    text: 'text-purple-300',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    headerBg: 'bg-purple-950/70 border-purple-500/30',
  },
  cyan: {
    bg: 'bg-cyan-950/20',
    border: 'border-cyan-500/40 hover:border-cyan-500/70',
    text: 'text-cyan-300',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    headerBg: 'bg-cyan-950/70 border-cyan-500/30',
  },
  emerald: {
    bg: 'bg-emerald-950/20',
    border: 'border-emerald-500/40 hover:border-emerald-500/70',
    text: 'text-emerald-300',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    headerBg: 'bg-emerald-950/70 border-emerald-500/30',
  },
  amber: {
    bg: 'bg-amber-950/20',
    border: 'border-amber-500/40 hover:border-amber-500/70',
    text: 'text-amber-300',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    headerBg: 'bg-amber-950/70 border-amber-500/30',
  },
  rose: {
    bg: 'bg-rose-950/20',
    border: 'border-rose-500/40 hover:border-rose-500/70',
    text: 'text-rose-300',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    headerBg: 'bg-rose-950/70 border-rose-500/30',
  },
  blue: {
    bg: 'bg-blue-950/20',
    border: 'border-blue-500/40 hover:border-blue-500/70',
    text: 'text-blue-300',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    headerBg: 'bg-blue-950/70 border-blue-500/30',
  },
  slate: {
    bg: 'bg-slate-900/40',
    border: 'border-slate-700/60 hover:border-slate-600',
    text: 'text-slate-300',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    headerBg: 'bg-slate-900/80 border-slate-700',
  },
};

export const GroupNode: React.FC<NodeProps> = memo(({ id, data: nodeData, selected }) => {
  const data = nodeData as unknown as NodeData;
  const label = data.label || 'Logic Group';
  const colorKey = (data.color as string) || 'purple';
  const colorTheme = GROUP_COLORS[colorKey] || GROUP_COLORS.purple;

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [tempLabel, setTempLabel] = useState(label);

  const nodes = useCircuitStore((s) => s.nodes);
  const ungroupNode = useCircuitStore((s) => s.ungroupNode);
  const updateNodeLabel = useCircuitStore((s) => s.updateNodeLabel);

  // Count child nodes inside this group
  const childCount = nodes.filter((n) => n.parentId === id).length;

  const handleSaveLabel = () => {
    if (tempLabel.trim()) {
      updateNodeLabel(id, tempLabel.trim());
    }
    setIsEditingLabel(false);
  };

  return (
    <div
      className={`w-full h-full rounded-2xl border-2 backdrop-blur-md transition-all duration-150 relative group select-none pointer-events-auto ${
        colorTheme.bg
      } ${colorTheme.border} ${
        selected ? 'ring-2 ring-purple-500/30 border-purple-400 shadow-xl' : ''
      }`}
    >
      <NodeResizer
        minWidth={160}
        minHeight={120}
        isVisible={selected}
        lineClassName="border-purple-400"
        handleClassName="w-2.5 h-2.5 bg-purple-500 border border-white rounded-full"
      />

      {/* Group Header Bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-9 px-3 rounded-t-[14px] border-b flex items-center justify-between z-10 ${colorTheme.headerBg}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Layers className={`w-3.5 h-3.5 shrink-0 ${colorTheme.text}`} />

          {isEditingLabel ? (
            <div className="flex items-center gap-1 flex-1 max-w-[200px]">
              <input
                type="text"
                value={tempLabel}
                onChange={(e) => setTempLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveLabel()}
                autoFocus
                className="w-full bg-slate-950 text-white font-mono text-xs font-bold px-1.5 py-0.5 rounded border border-purple-500 focus:outline-none"
              />
              <button
                onClick={handleSaveLabel}
                className="p-1 rounded bg-purple-600 text-white hover:bg-purple-500"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 cursor-pointer" onClick={() => setIsEditingLabel(true)}>
              <span className={`font-mono font-bold text-xs truncate ${colorTheme.text}`}>
                {label}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingLabel(true);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-white transition-opacity text-slate-400"
                title="Edit Group Name"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${colorTheme.badge}`}>
            {childCount} {childCount === 1 ? 'node' : 'nodes'}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              ungroupNode(id);
            }}
            title="Ungroup nodes (Ctrl+Shift+G)"
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

GroupNode.displayName = 'GroupNode';
