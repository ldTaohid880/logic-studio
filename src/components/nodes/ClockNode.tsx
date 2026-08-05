import React, { useEffect } from 'react';
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

export const ClockNode = React.memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as NodeData;
  const { label, value = 0 } = nodeData;
  const config: ClockConfig = (nodeData.clockConfig as ClockConfig) || DEFAULT_CLOCK_CONFIG;
  const state: ClockState = (nodeData.clockState as ClockState) || DEFAULT_CLOCK_STATE;

  const startClockNode = useCircuitStore((s) => s.startClockNode);
  const pauseClockNode = useCircuitStore((s) => s.pauseClockNode);
  const resetClockNode = useCircuitStore((s) => s.resetClockNode);
  const singleTickClockNode = useCircuitStore((s) => s.singleTickClockNode);
  const isDragging = useCircuitStore((s) => s.isDragging);

  const { status } = state;
  const { frequencyHz, frequencyUnit, enabled } = config;
  const isHigh = value === 1;

  // Start automatically on mount if configured and enabled
  useEffect(() => {
    if (status === 'stopped' && config.startAutomatically && enabled) {
      startClockNode(id);
    }
  }, [id, status, config.startAutomatically, enabled, startClockNode]);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!enabled) return;
    if (status === 'running') {
      pauseClockNode(id);
    } else {
      startClockNode(id);
    }
  };

  const handleStep = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!enabled) return;
    singleTickClockNode(id);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!enabled) return;
    resetClockNode(id);
  };

  const formattedFreq = `${frequencyHz} ${frequencyUnit || 'Hz'}`;
  const isRunning = status === 'running' && enabled;

  return (
    <div
      className={`relative w-[160px] p-3 rounded-xl transition-all duration-200 border backdrop-blur-md shadow-lg select-none ${
        selected
          ? 'border-cyan-500 ring-1 ring-cyan-500/20 bg-slate-900/95 shadow-cyan-950/20'
          : 'border-slate-800 hover:border-slate-700 bg-slate-900/90 shadow-slate-950/30'
      }`}
    >
      {/* 1. Node Header */}
      <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-1.5 mb-2.5">
        <Clock
          className={`w-3.5 h-3.5 ${
            isRunning ? 'text-cyan-400 animate-pulse' : 'text-slate-500'
          }`}
        />
        <span className="text-[10px] font-bold text-slate-300 font-mono truncate tracking-wider uppercase">
          {label || 'CLOCK'}
        </span>
      </div>

      {/* 2. Frequency Value Display (Large, center readout) */}
      <div className="flex flex-col items-center justify-center py-2.5 px-2 bg-slate-950/80 rounded-lg border border-slate-800/60 mb-2.5">
        <span className="text-slate-500 text-[8px] uppercase tracking-widest font-mono mb-0.5">
          FREQUENCY
        </span>
        <span className="text-sm font-mono-code font-bold text-cyan-400 tabular-nums tracking-wide">
          {formattedFreq}
        </span>
      </div>

      {/* 3. Status LED & Minimal Instrument controls */}
      <div className="flex items-center justify-between gap-2 px-1">
        {/* LED Indicator */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2.5 h-2.5 rounded-full transition-all duration-150 border ${
              isHigh && enabled
                ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_4px_#34d399]'
                : 'bg-slate-900 border-slate-800'
            }`}
          />
          <span className="text-[9px] font-mono text-slate-500 uppercase">
            {isHigh && enabled ? 'HI' : 'LO'}
          </span>
        </div>

        {/* Minimal Control Buttons */}
        <div className="flex items-center gap-1 bg-slate-950/50 p-0.5 rounded-md border border-slate-800/40">
          <button
            onClick={handlePlayPause}
            disabled={!enabled}
            title={isRunning ? 'Pause' : 'Start'}
            className={`p-1 rounded cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
              isRunning
                ? 'text-amber-400 hover:bg-amber-950/40'
                : 'text-emerald-400 hover:bg-emerald-950/40'
            }`}
          >
            {isRunning ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
          </button>

          <button
            onClick={handleStep}
            disabled={!enabled}
            title="Step pulse"
            className="p-1 rounded cursor-pointer text-cyan-400 hover:bg-cyan-950/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <SkipForward className="w-3 h-3" />
          </button>

          <button
            onClick={handleReset}
            disabled={!enabled}
            title="Reset"
            className="p-1 rounded cursor-pointer text-red-400 hover:bg-red-950/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 4. Single CLK Output Pin */}
      <Handle
        type="source"
        position={Position.Right}
        id="out-0"
        style={{ right: '-12px', top: '50%' }}
        className={`!w-3.5 !h-3.5 !border-2 !rounded-full transition-all duration-150 ${
          isHigh && enabled
            ? '!bg-emerald-400 !border-emerald-200 shadow-[0_0_4px_#34d399]'
            : '!bg-slate-700 !border-slate-500'
        }`}
      />
    </div>
  );
});

ClockNode.displayName = 'ClockNode';
