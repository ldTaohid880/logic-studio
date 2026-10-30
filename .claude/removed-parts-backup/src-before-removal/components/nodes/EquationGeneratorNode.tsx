import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { generateBooleanEquation } from '../../utils/booleanEquation';
import { Copy, Check, FunctionSquare, AlertTriangle } from 'lucide-react';

export const EquationGeneratorNode: React.FC<NodeProps> = memo(({ id, data: nodeData, selected }) => {
  const data = nodeData as unknown as NodeData;
  const [copied, setCopied] = useState(false);

  // Retrieve current store nodes and edges for dynamic reactive evaluation
  const nodes = useCircuitStore((s) => s.nodes);
  const edges = useCircuitStore((s) => s.edges);

  const outputVarName = (data.outputVarName as string) || data.label || 'F';

  // Generate live Boolean equation
  const result = generateBooleanEquation(id, nodes, edges, outputVarName);

  const handleCopy = () => {
    if (result.equation) {
      navigator.clipboard.writeText(result.equation);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div
      className={`min-w-[240px] bg-slate-900/95 border rounded-xl shadow-xl backdrop-blur-md transition-all duration-150 p-3 select-none ${
        selected
          ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-cyan-950/40'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Target Handle on Left */}
      <Handle
        type="target"
        position={Position.Left}
        id="in-0"
        style={{ left: '0px' }}
        className="lsp-pin"
        data-signal={data.inputs?.[0]?.value === 1 ? 'high' : data.inputs?.[0]?.value === 0 ? 'low' : 'unknown'}
        title="Input logic signal"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <FunctionSquare className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-slate-100">
            Boolean Equation
          </span>
        </div>
        <button
          onClick={handleCopy}
          title="Copy equation to clipboard"
          disabled={!!result.error}
          className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          aria-label="Copy equation to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expression Card Display */}
      <div className="bg-surface-0 rounded-lg border border-slate-950 p-3 flex flex-col justify-center gap-1.5 shadow-inner">
        {result.error ? (
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-[11px] leading-tight">{result.error}</span>
          </div>
        ) : (
          <div className="font-mono text-sm font-bold text-cyan-300 tracking-wide break-all select-all">
            {result.equation}
          </div>
        )}
      </div>
    </div>
  );
});

EquationGeneratorNode.displayName = 'EquationGeneratorNode';
