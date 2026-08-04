import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { GateIcon } from './GateIcons';
import { AlertCircle, Table } from 'lucide-react';
import { DEFAULT_ENCODER_CONFIG } from '../../types/encoder';
import { evaluateEncoder } from '../../simulation/encoderLogic';
import { EncoderTruthTableModal } from '../ui/EncoderTruthTableModal';
import { useCircuitStore } from '../../store/useCircuitStore';

export const EncoderNode = memo(({ id, data, selected }: NodeProps) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const [isTruthTableOpen, setIsTruthTableOpen] = useState(false);
  const toggleEncoderInputPin = useCircuitStore((s) => s.toggleEncoderInputPin);

  const nodeData = data as unknown as NodeData;
  const { label, inputs = [], outputs = [] } = nodeData;
  const config = nodeData.encoderConfig || DEFAULT_ENCODER_CONFIG;

  const isInputActiveHigh = (config.inputActiveMode ?? config.activeMode ?? 'high') === 'high';
  const isOutputActiveHigh = (config.outputActiveMode ?? config.activeMode ?? 'high') === 'high';

  // Compute live state if not pre-populated
  const inputSignalVals = inputs.map((p) => p.value);
  const evaluated = evaluateEncoder(inputSignalVals, config);
  const state = nodeData.encoderState || evaluated.state;

  const hasError = !!state.error;

  // Trigger handle re-indexing whenever input or output count changes
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, inputs.length, outputs.length, updateNodeInternals]);

  return (
    <>
      <div
        className={`relative min-w-[220px] rounded-2xl bg-[#151a23]/95 backdrop-blur-xl border-2 transition-all duration-200 select-none shadow-xl overflow-visible ${
          hasError
            ? 'border-rose-500/90 shadow-[0_0_20px_rgba(244,63,94,0.4)] bg-rose-950/20'
            : selected
            ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]'
            : 'border-[#2D3748] hover:border-slate-500'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-white/[0.03] rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="text-blue-400">
              <GateIcon type="ENCODER" className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-100 font-mono tracking-tight leading-none">
                {label || 'Encoder'}
              </span>
              <span className="text-[9px] text-blue-400 font-mono mt-0.5 font-bold">
                {config.inputs}-to-{Math.log2(config.inputs)} {config.priority ? 'Priority' : ''}
              </span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsTruthTableOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-colors cursor-pointer"
            title="Open Truth Table & Logic Guide"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3 space-y-2.5">
          {/* Error Banner */}
          {hasError && (
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-[10px] text-rose-300 font-mono font-medium animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span className="line-clamp-2">{state.error}</span>
            </div>
          )}

          {/* Mode & Output Status Display */}
          <div className="bg-[#0b0e14] p-2 rounded-xl border border-slate-800 space-y-1 font-mono">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Input Logic:</span>
              <span className="text-emerald-400 font-bold uppercase">
                {isInputActiveHigh ? 'Active HIGH' : 'Active LOW'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Output Logic:</span>
              <span className="text-cyan-400 font-bold uppercase">
                {isOutputActiveHigh ? 'Active HIGH' : 'Active LOW'}
              </span>
            </div>

            {/* Configured Output Formats */}
            {(config.outputFormat === 'binary' || config.outputFormat === 'binary_decimal') && (
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Binary Out:</span>
                <span className={`font-bold ${hasError ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {state.binaryVal}
                </span>
              </div>
            )}

            {(config.outputFormat === 'decimal' || config.outputFormat === 'binary_decimal') && (
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Decimal Out:</span>
                <span className={`font-bold ${hasError ? 'text-rose-400' : 'text-cyan-400'}`}>
                  {hasError ? 'N/A' : state.decimalVal}
                </span>
              </div>
            )}

            {/* Valid Output LED */}
            {config.showValid && (
              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/5">
                <span className="text-slate-400">Valid Signal (V):</span>
                <div className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full transition-all ${
                      state.valid
                        ? 'bg-emerald-400 shadow-[0_0_8px_#4ade80]'
                        : 'bg-slate-700'
                    }`}
                  />
                  <span className={state.valid ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {state.valid ? '1' : '0'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Pin Grid Section (Inputs on Left, Outputs on Right) */}
          <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-800/80">
            {/* Input Pins List */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                Inputs ({inputs.length})
              </span>
              {inputs.map((pin, idx) => {
                const isActive = isInputActiveHigh ? pin.value === 1 : pin.value === 0;
                return (
                  <div
                    key={pin.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEncoderInputPin(id, idx);
                    }}
                    className="relative flex items-center h-6 py-0.5 cursor-pointer group hover:bg-white/5 px-1 rounded transition-colors"
                    title={`Click to toggle ${pin.name} value`}
                  >
                    {/* Left Target Handle */}
                    <Handle
                      type="target"
                      position={Position.Left}
                      id={pin.id}
                      style={{ left: '-12px', top: '50%' }}
                      className={`!w-3 !h-3 !border-2 !border-[#151a23] !transition-all ${
                        isActive
                          ? '!bg-emerald-400 shadow-[0_0_8px_#4ade80]'
                          : pin.value === -1
                          ? '!bg-amber-500'
                          : '!bg-slate-600'
                      }`}
                    />
                    <div className="flex items-center gap-1.5 pl-1">
                      <span
                        className={`w-2 h-2 rounded-full transition-all ${
                          isActive
                            ? 'bg-emerald-400 shadow-[0_0_6px_#4ade80]'
                            : 'bg-slate-700'
                        }`}
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-300">
                        {pin.name}
                      </span>
                      <span
                        className={`text-[8px] font-mono font-bold px-1 rounded ${
                          pin.value === 1
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : pin.value === 0
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {pin.value === -1 ? '?' : pin.value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Output Pins List */}
            <div className="space-y-1.5 text-right">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                Outputs ({outputs.length})
              </span>
              {outputs.map((pin) => {
                const isHigh = pin.value === 1;
                return (
                  <div key={pin.id} className="relative flex items-center justify-end h-6 py-0.5 pr-1">
                    <div className="flex items-center gap-1.5 pr-1">
                      <span className="text-[10px] font-mono font-bold text-slate-300">
                        {pin.name}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full transition-all ${
                          isHigh
                            ? 'bg-emerald-400 shadow-[0_0_6px_#4ade80]'
                            : 'bg-slate-700'
                        }`}
                      />
                    </div>
                    {/* Right Source Handle */}
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={pin.id}
                      style={{ right: '-12px', top: '50%' }}
                      className={`!w-3 !h-3 !border-2 !border-[#151a23] !transition-all ${
                        isHigh
                          ? '!bg-emerald-400 shadow-[0_0_8px_#4ade80]'
                          : pin.value === -1
                          ? '!bg-amber-500'
                          : '!bg-slate-600'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Truth Table Modal */}
      <EncoderTruthTableModal
        isOpen={isTruthTableOpen}
        onClose={() => setIsTruthTableOpen(false)}
        config={config}
        encoderState={state}
        currentInputs={inputSignalVals}
        nodeLabel={label || 'Encoder'}
      />
    </>
  );
});

EncoderNode.displayName = 'EncoderNode';

