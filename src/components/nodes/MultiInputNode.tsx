import React, { useEffect } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { MultiInputConfig, DEFAULT_MULTI_INPUT_CONFIG } from '../../types/multiInput';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Layers, Dices, ArrowUpCircle, ArrowDownCircle, RefreshCw, Plus } from 'lucide-react';

export const MultiInputNode = React.memo(({ id, data, selected }: NodeProps) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const nodeData = data as unknown as NodeData;
  const { label } = nodeData;
  const config: MultiInputConfig = nodeData.multiInputConfig || DEFAULT_MULTI_INPUT_CONFIG;
  const { inputCount, values, labels } = config;

  const toggleMultiInputBit = useCircuitStore((s) => s.toggleMultiInputBit);
  const setAllMultiInput = useCircuitStore((s) => s.setAllMultiInput);
  const invertAllMultiInput = useCircuitStore((s) => s.invertAllMultiInput);
  const randomizeMultiInput = useCircuitStore((s) => s.randomizeMultiInput);
  const incrementMultiInputCounter = useCircuitStore((s) => s.incrementMultiInputCounter);

  // Notify React Flow whenever input count or values change so edge connection handles re-index
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, inputCount, values, updateNodeInternals]);

  // Compute Decimal, Binary, Hex values
  const { decimalVal, binaryString, hexString } = React.useMemo(() => {
    let dec = 0;
    values.forEach((v, idx) => {
      if (v === 1) dec += Math.pow(2, idx);
    });

    const bin = [...values]
      .reverse()
      .map((v) => (v === 1 ? '1' : '0'))
      .join('');

    const hex = '0x' + dec.toString(16).toUpperCase().padStart(Math.ceil(inputCount / 4), '0');

    return { decimalVal: dec, binaryString: bin, hexString: hex };
  }, [values, inputCount]);

  return (
    <div
      className={`relative min-w-[210px] p-3 rounded-2xl transition-all duration-200 border backdrop-blur-md shadow-xl select-none overflow-visible ${
        selected
          ? 'border-emerald-400 shadow-emerald-500/20 ring-2 ring-emerald-500/30 bg-slate-900/95'
          : 'border-slate-800 hover:border-slate-700 bg-slate-900/90 hover:shadow-emerald-500/10'
      }`}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between gap-1 border-b border-slate-800 pb-1.5 mb-2">
        <div className="flex items-center gap-1.5 text-emerald-400 min-w-0">
          <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-slate-200 font-mono tracking-wide truncate">
            {label}
          </span>
        </div>
        <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700 shrink-0">
          {inputCount}-Bit Bus
        </span>
      </div>

      {/* Numeric Displays (Binary, Decimal, Hex) */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-2 mb-2.5 font-mono space-y-1 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[9px] uppercase tracking-wider text-slate-500">Binary</span>
          <span className="font-bold text-emerald-400 tracking-wider truncate max-w-[130px]">{binaryString}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[9px] uppercase tracking-wider text-slate-500">Decimal</span>
          <span className="font-bold text-cyan-300">{decimalVal}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[9px] uppercase tracking-wider text-slate-500">Hex</span>
          <span className="font-bold text-purple-300">{hexString}</span>
        </div>
      </div>

      {/* Quick Action Control Buttons */}
      <div className="grid grid-cols-5 gap-1 mb-2.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setAllMultiInput(id, 1);
          }}
          title="Set All Bits HIGH (1)"
          className="p-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900 transition-all flex items-center justify-center text-[9px] font-mono font-bold cursor-pointer"
        >
          <ArrowUpCircle className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setAllMultiInput(id, 0);
          }}
          title="Set All Bits LOW (0)"
          className="p-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all flex items-center justify-center text-[9px] font-mono font-bold cursor-pointer"
        >
          <ArrowDownCircle className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            invertAllMultiInput(id);
          }}
          title="Invert All Bits"
          className="p-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 transition-all flex items-center justify-center text-[9px] font-mono font-bold cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            randomizeMultiInput(id);
          }}
          title="Randomize Values"
          className="p-1 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:bg-purple-900 transition-all flex items-center justify-center text-[9px] font-mono font-bold cursor-pointer"
        >
          <Dices className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            incrementMultiInputCounter(id);
          }}
          title="Binary Counter Step (+1)"
          className="p-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900 transition-all flex items-center justify-center text-[9px] font-mono font-bold cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Uncapped vertical list of Input Bit Switches (All inputs displayed, no scrollbar cutoff) */}
      <div className="space-y-1.5 pr-0">
        {values.map((val, idx) => {
          const isHigh = val === 1;
          const pinLabel = labels[idx] || `Bit ${idx}`;
          const handleId = `out-${idx}`;

          return (
            <div
              key={idx}
              className="relative flex items-center justify-between p-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all min-h-[30px]"
            >
              <div className="flex items-center gap-1.5 min-w-0 pr-1">
                {/* Status LED */}
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all duration-200 ${
                    isHigh
                      ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                      : 'bg-slate-700'
                  }`}
                />
                <span className="text-xs font-mono font-semibold text-slate-300 truncate">
                  {pinLabel}
                </span>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMultiInputBit(id, idx);
                }}
                className={`w-10 h-5 rounded-full p-0.5 transition-all duration-200 flex items-center border cursor-pointer shrink-0 ${
                  isHigh
                    ? 'bg-emerald-950 border-emerald-500/80'
                    : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold text-[9px] font-mono transition-transform duration-200 shadow ${
                    isHigh
                      ? 'translate-x-4 bg-emerald-400 text-slate-950 shadow-[0_0_6px_#34d399]'
                      : 'translate-x-0 bg-slate-500 text-slate-200'
                  }`}
                >
                  {val}
                </div>
              </button>

              {/* Right Output Pin Handle - positioned at top 50% of this specific pin row */}
              <Handle
                type="source"
                position={Position.Right}
                id={handleId}
                style={{ right: '-19px', top: '50%' }}
                className={`!w-3.5 !h-3.5 !border-2 !rounded-full transition-all duration-150 ${
                  isHigh
                    ? '!bg-emerald-400 !border-emerald-200 shadow-[0_0_8px_#34d399]'
                    : '!bg-slate-700 !border-slate-400'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Bus Handle (at bottom right) */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400 relative min-h-[24px]">
        <span>Combined Bus Output</span>
        <Handle
          type="source"
          position={Position.Right}
          id="out-bus"
          style={{ right: '-12px', top: '50%' }}
          className="!w-4 !h-4 !border-2 !rounded-sm !bg-purple-500 !border-purple-300 shadow-[0_0_8px_#a855f7]"
        />
      </div>
    </div>
  );
});

MultiInputNode.displayName = 'MultiInputNode';

