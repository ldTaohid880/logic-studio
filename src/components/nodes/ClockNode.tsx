import React, { useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import {
  ClockConfig,
  ClockState,
  DEFAULT_CLOCK_CONFIG,
  DEFAULT_CLOCK_STATE,
} from '../../types/clock';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Play, Pause, SkipForward, RotateCcw, Clock } from 'lucide-react';

const STANDARD_FREQS = [1, 2, 5, 10];

export const ClockNode = React.memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as NodeData;
  const { label, value = 0 } = nodeData;
  const config: ClockConfig = nodeData.clockConfig || DEFAULT_CLOCK_CONFIG;
  const state: ClockState = nodeData.clockState || DEFAULT_CLOCK_STATE;

  const startClockNode = useCircuitStore((s) => s.startClockNode);
  const pauseClockNode = useCircuitStore((s) => s.pauseClockNode);
  const resetClockNode = useCircuitStore((s) => s.resetClockNode);
  const singleTickClockNode = useCircuitStore((s) => s.singleTickClockNode);
  const tickClockNode = useCircuitStore((s) => s.tickClockNode);
  const updateClockConfig = useCircuitStore((s) => s.updateClockConfig);
  const isDragging = useCircuitStore((s) => s.isDragging);

  const { status } = state;
  const { frequencyHz, startState, isCustomFreq } = config;
  const isHigh = value === 1;

  const [customVal, setCustomVal] = useState(frequencyHz.toString());

  // Independent event-driven timer for this Clock node
  useEffect(() => {
    if (status !== 'running' || isDragging) return;

    // Interval T = 1000 / frequencyHz (clamped between 10ms and 10000ms)
    const intervalMs = Math.max(10, Math.round(1000 / Math.max(0.1, frequencyHz)));

    const timer = setInterval(() => {
      tickClockNode(id);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [id, status, frequencyHz, tickClockNode, isDragging]);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    startClockNode(id);
  };

  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    pauseClockNode(id);
  };

  const handleStep = (e: React.MouseEvent) => {
    e.stopPropagation();
    singleTickClockNode(id);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetClockNode(id);
  };

  const handleSelectFreq = (hz: number) => {
    setCustomVal(hz.toString());
    updateClockConfig(id, { frequencyHz: hz, isCustomFreq: false });
  };

  const handleSelectCustom = () => {
    updateClockConfig(id, { isCustomFreq: true });
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && num <= 100) {
      updateClockConfig(id, { frequencyHz: num, isCustomFreq: true });
    }
  };

  const handleStartStateChange = (newStartState: 'low' | 'high') => {
    updateClockConfig(id, { startState: newStartState });
  };

  const isCustomMode =
    isCustomFreq || !STANDARD_FREQS.includes(frequencyHz);

  return (
    <div
      className={`relative w-[215px] p-3 rounded-2xl transition-all duration-200 border backdrop-blur-md shadow-xl select-none ${
        selected
          ? 'border-cyan-400 shadow-cyan-500/20 ring-2 ring-cyan-500/30 bg-slate-900/95'
          : 'border-slate-800 hover:border-slate-700 bg-slate-900/90 hover:shadow-cyan-500/10'
      }`}
    >
      {/* 1. Node Header */}
      <div className="flex items-center justify-between gap-1.5 border-b border-slate-800/80 pb-2 mb-2">
        <div className="flex items-center gap-1.5 text-cyan-400 font-mono font-bold text-xs truncate">
          <Clock
            className={`w-3.5 h-3.5 ${
              status === 'running' ? 'text-cyan-300 animate-pulse' : 'text-slate-400'
            }`}
          />
          <span className="truncate text-slate-200">{label || 'Clock'}</span>
        </div>

        {/* Status Badge */}
        <span
          className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${
            status === 'running'
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
              : status === 'paused'
              ? 'bg-amber-950/80 text-amber-400 border-amber-500/50'
              : 'bg-slate-800/90 text-slate-400 border-slate-700'
          }`}
        >
          {status}
        </span>
      </div>

      {/* Output LED Status Indicator */}
      <div className="flex items-center justify-between mb-2.5 px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono">
        <span className="text-slate-400 font-medium">Output Signal</span>
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${
              isHigh
                ? 'bg-emerald-500 shadow-[0_0_8px_#22c55e]'
                : 'bg-slate-600 border border-slate-500/50'
            }`}
          />
          <span
            className={`font-bold text-[9px] ${
              isHigh ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {isHigh ? 'HIGH (1)' : 'LOW (0)'}
          </span>
        </div>
      </div>

      {/* 3. Settings: Frequency */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-mono uppercase text-slate-400">Frequency</span>
          <span className="text-[10px] font-mono font-bold text-cyan-300">
            {frequencyHz} Hz
          </span>
        </div>

        {/* Preset & Custom Toggle Buttons */}
        <div className="grid grid-cols-5 gap-1">
          {STANDARD_FREQS.map((hz) => (
            <button
              key={hz}
              type="button"
              onClick={() => handleSelectFreq(hz)}
              className={`py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                !isCustomMode && frequencyHz === hz
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {hz}Hz
            </button>
          ))}
          <button
            type="button"
            onClick={handleSelectCustom}
            className={`py-1 text-[9px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
              isCustomMode
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            Cust
          </button>
        </div>

        {/* Custom Input Field (shown when Custom is active) */}
        {isCustomMode && (
          <div className="mt-1.5 flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[9px] font-mono text-slate-400 pl-1">Hz:</span>
            <input
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              value={customVal}
              onChange={handleCustomInputChange}
              className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>
        )}
      </div>

      {/* 4. Settings: Start State */}
      <div className="mb-3">
        <span className="text-[9px] font-mono uppercase text-slate-400 block mb-1">
          Start State
        </span>
        <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
          <button
            type="button"
            onClick={() => handleStartStateChange('low')}
            className={`py-1 px-2 rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              startState === 'low'
                ? 'bg-slate-800 text-cyan-300 border-cyan-500/60 font-bold'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full border ${startState === 'low' ? 'bg-cyan-400 border-cyan-300' : 'border-slate-600'}`} />
            LOW (0)
          </button>

          <button
            type="button"
            onClick={() => handleStartStateChange('high')}
            className={`py-1 px-2 rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              startState === 'high'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/60 font-bold'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full border ${startState === 'high' ? 'bg-emerald-400 border-emerald-300' : 'border-slate-600'}`} />
            HIGH (1)
          </button>
        </div>
      </div>

      {/* 5. Clock Simulation Controls (Play | Pause, Step | Reset) */}
      <div className="space-y-1 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800">
        {/* Row 1: Play | Pause */}
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={handlePlay}
            type="button"
            title="Start Clock"
            disabled={status === 'running'}
            className={`flex items-center justify-center gap-1 py-1 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
              status === 'running'
                ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900 hover:border-emerald-400'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Play</span>
          </button>

          <button
            onClick={handlePause}
            type="button"
            title="Pause Clock"
            disabled={status !== 'running'}
            className={`flex items-center justify-center gap-1 py-1 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
              status !== 'running'
                ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-amber-950/80 border-amber-500/60 text-amber-300 hover:bg-amber-900 hover:border-amber-400'
            }`}
          >
            <Pause className="w-3 h-3 fill-current" />
            <span>Pause</span>
          </button>
        </div>

        {/* Row 2: Step | Reset */}
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={handleStep}
            type="button"
            title="Step (Advance 1 Clock Pulse)"
            className="flex items-center justify-center gap-1 py-1 rounded-lg border border-cyan-500/40 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900 hover:border-cyan-400 text-xs font-mono font-bold transition-all cursor-pointer"
          >
            <SkipForward className="w-3 h-3" />
            <span>Step</span>
          </button>

          <button
            onClick={handleReset}
            type="button"
            title="Reset Clock to Start State"
            className="flex items-center justify-center gap-1 py-1 rounded-lg border border-red-500/40 bg-red-950/60 text-red-300 hover:bg-red-900 hover:border-red-400 text-xs font-mono font-bold transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 6. Single CLK Output Pin */}
      <Handle
        type="source"
        position={Position.Right}
        id="out-0"
        style={{ right: '-12px', top: '50%' }}
        className={`!w-4 !h-4 !border-2 !rounded-full transition-all duration-150 ${
          isHigh
            ? '!bg-emerald-400 !border-emerald-200 shadow-[0_0_10px_#22c55e]'
            : '!bg-slate-700 !border-slate-400'
        }`}
      />
    </div>
  );
});

ClockNode.displayName = 'ClockNode';
