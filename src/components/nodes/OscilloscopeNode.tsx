import React, { memo, useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import {
  OscilloscopeConfig,
  DEFAULT_OSCILLOSCOPE_CONFIG,
  COLOR_MAP,
  TriggerMode,
} from '../../types/oscilloscope';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Activity, Trash2, Zap } from 'lucide-react';

export const OscilloscopeNode: React.FC<NodeProps> = memo(({ id, data: nodeData, selected }) => {
  const data = nodeData as unknown as NodeData;
  const config: OscilloscopeConfig = data.scopeConfig || DEFAULT_OSCILLOSCOPE_CONFIG;
  const inputs = data.inputs || [{ id: 'in-0', name: 'CH 1', value: 0 }];

  const isSimulationPaused = useCircuitStore((s) => s.simulation.isPaused);
  const getOscilloscopeBuffer = useCircuitStore((s) => s.getOscilloscopeBuffer);
  const clearOscilloscopeBuffer = useCircuitStore((s) => s.clearOscilloscopeBuffer);

  const {
    sampleRateHz = 500,
    timePerDivMs = 10,
    triggerMode = 'auto',
    autoScroll = true,
    waveColor = 'cyan',
    gridVisible = true,
    showLabels = true,
    isPaused = false,
    selectedBitIndex = 0,
  } = config;

  // Pin alias display
  const pinAliases = data.pinAliases || {};
  const getPinDisplayName = (pin: { id: string; name: string }) => {
    const alias = pinAliases[pin.id];
    if (!alias) return pin.name;
    return alias.length > 8 ? alias.substring(0, 8) + '…' : alias;
  };

  const activeInputPin = inputs[selectedBitIndex] || inputs[0];
  const colors = COLOR_MAP[waveColor] || COLOR_MAP.cyan;

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas Waveform & Grid Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth || 320;
      const height = canvas.clientHeight || 140;

      // Only set internal dimensions if changed to prevent flashing
      const scaledWidth = Math.round(width * dpr);
      const scaledHeight = Math.round(height * dpr);
      if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
      }

      // Scale back context
      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      // Fetch oscilloscope buffer
      const bufferObj = getOscilloscopeBuffer(id);
      const currentSignalVal = activeInputPin?.value === 1 ? 1 : 0;
      
      const samples = bufferObj?.samples || new Array(2000).fill(currentSignalVal);
      const w = bufferObj?.writeIndex ?? 0;
      const N = samples.length;

      // Chronological samples reconstruction
      const chronoSamples = new Array(N);
      for (let i = 0; i < N; i++) {
        chronoSamples[i] = samples[(w - N + i + N) % N];
      }

      // Calculate sample counts
      const totalTimeMs = 10 * timePerDivMs;
      const visibleCount = Math.max(
        10,
        Math.min(N, Math.round((totalTimeMs * sampleRateHz) / 1000))
      );

      let displaySamples = chronoSamples.slice(-visibleCount);

      // Trigger Mode Edge-Stabilization
      if (triggerMode !== 'auto' && N >= visibleCount) {
        let triggerIdx = -1;
        const searchLen = Math.min(N, visibleCount * 2);
        const searchSamples = chronoSamples.slice(-searchLen);

        if (triggerMode === 'rising') {
          for (let i = searchSamples.length - 2; i >= 0; i--) {
            if (searchSamples[i] === 0 && searchSamples[i + 1] === 1) {
              triggerIdx = i + 1;
              break;
            }
          }
        } else if (triggerMode === 'falling') {
          for (let i = searchSamples.length - 2; i >= 0; i--) {
            if (searchSamples[i] === 1 && searchSamples[i + 1] === 0) {
              triggerIdx = i + 1;
              break;
            }
          }
        }

        if (triggerIdx !== -1) {
          const globalTriggerIdx = N - searchLen + triggerIdx;
          const half = Math.floor(visibleCount / 2);
          let start = globalTriggerIdx - half;
          let end = globalTriggerIdx + (visibleCount - half);

          if (start < 0) {
            start = 0;
            end = Math.min(N, visibleCount);
          } else if (end > N) {
            end = N;
            start = Math.max(0, end - visibleCount);
          }
          displaySamples = chronoSamples.slice(start, end);
        }
      }

      // Background clearing
      ctx.fillStyle = '#05080e';
      ctx.fillRect(0, 0, width, height);

      const centerX = Math.round(width / 2) + 0.5;
      const centerY = Math.round(height / 2) + 0.5;

      // 1. Grid Lines
      if (gridVisible) {
        // Subtle solid divisions
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
        ctx.lineWidth = 1;

        // Draw 10 vertical divisions
        const stepX = width / 10;
        for (let i = 1; i < 10; i++) {
          const x = Math.round(i * stepX) + 0.5;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        // Draw 4 horizontal divisions
        const stepY = height / 4;
        for (let i = 1; i < 4; i++) {
          const y = Math.round(i * stepY) + 0.5;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Minor ticks along central axes
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();

        // Horizontal axis ticks
        const minorStepX = stepX / 5;
        for (let x = 0; x < width; x += minorStepX) {
          const px = Math.round(x) + 0.5;
          ctx.moveTo(px, centerY - 2.5);
          ctx.lineTo(px, centerY + 2.5);
        }

        // Vertical axis ticks
        const minorStepY = stepY / 5;
        for (let y = 0; y < height; y += minorStepY) {
          const py = Math.round(y) + 0.5;
          ctx.moveTo(centerX - 2.5, py);
          ctx.lineTo(centerX + 2.5, py);
        }
        ctx.stroke();

        // Central main axes
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, height);
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
      }

      // 2. Waveform Plotting
      const count = displaySamples.length;
      if (count > 1) {
        const dx = width / (count - 1);
        const yHigh = Math.round(height * 0.25) + 0.5;
        const yLow = Math.round(height * 0.75) + 0.5;
        const getY = (val: number) => (val === 1 ? yHigh : yLow);

        // A. Glow shadow trace
        ctx.strokeStyle = colors.line;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = colors.line;
        ctx.shadowBlur = 4;
        ctx.lineJoin = 'miter';
        ctx.lineCap = 'square';

        ctx.beginPath();
        let prevY = getY(displaySamples[0]);
        ctx.moveTo(0, prevY);

        for (let i = 1; i < count; i++) {
          const curY = getY(displaySamples[i]);
          const x = i * dx;
          if (curY !== prevY) {
            ctx.lineTo(x, prevY);
            ctx.lineTo(x, curY);
            prevY = curY;
          } else {
            ctx.lineTo(x, curY);
          }
        }
        ctx.stroke();

        // B. Core white trace
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.0;
        ctx.shadowBlur = 0; // Disable shadow for clean core line

        ctx.beginPath();
        prevY = getY(displaySamples[0]);
        ctx.moveTo(0, prevY);

        for (let i = 1; i < count; i++) {
          const curY = getY(displaySamples[i]);
          const x = i * dx;
          if (curY !== prevY) {
            ctx.lineTo(x, prevY);
            ctx.lineTo(x, curY);
            prevY = curY;
          } else {
            ctx.lineTo(x, curY);
          }
        }
        ctx.stroke();

        // C. Current time cursor dot
        if (autoScroll) {
          const lastVal = displaySamples[count - 1];
          const lastY = getY(lastVal);
          ctx.fillStyle = colors.line;
          ctx.beginPath();
          ctx.arc(width - 3, lastY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Trigger Mode status icon overlay
      if (triggerMode !== 'auto') {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(width - 24, 12);
        if (triggerMode === 'rising') {
          ctx.lineTo(width - 18, 12);
          ctx.lineTo(width - 18, 6);
          ctx.lineTo(width - 12, 6);
          ctx.moveTo(width - 18, 9);
          ctx.lineTo(width - 21, 8);
          ctx.moveTo(width - 18, 9);
          ctx.lineTo(width - 15, 8);
        } else {
          ctx.lineTo(width - 18, 12);
          ctx.lineTo(width - 18, 18);
          ctx.lineTo(width - 12, 18);
          ctx.moveTo(width - 18, 15);
          ctx.lineTo(width - 21, 16);
          ctx.moveTo(width - 18, 15);
          ctx.lineTo(width - 15, 16);
        }
        ctx.stroke();
      }

      if (!isPaused && !isSimulationPaused) {
        animId = requestAnimationFrame(renderCanvas);
      }
    };

    renderCanvas();
    return () => cancelAnimationFrame(animId);
  }, [gridVisible, triggerMode, waveColor, timePerDivMs, sampleRateHz, isPaused, isSimulationPaused, activeInputPin, colors.line, getOscilloscopeBuffer]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearOscilloscopeBuffer(id);
  };

  const handleTogglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedNodes = useCircuitStore.getState().nodes.map((n) =>
      n.id === id
        ? {
            ...n,
            data: {
              ...n.data,
              scopeConfig: { ...config, isPaused: !isPaused },
            },
          }
        : n
    );
    useCircuitStore.setState({ nodes: updatedNodes });
  };

  const isRunning = !isPaused && !isSimulationPaused;

  return (
    <div
      ref={wrapperRef}
      className={`relative min-w-[340px] w-full min-h-[220px] h-full bg-slate-950/95 border rounded-xl p-3 shadow-lg select-none transition-all duration-200 ${
        selected
          ? 'border-purple-500 ring-1 ring-purple-500/20 bg-slate-900/95'
          : 'border-slate-800 hover:border-slate-700 bg-slate-900/90'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded bg-slate-950 border border-slate-900 ${colors.text}`}>
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-200 uppercase tracking-wider block">
              {data.label || 'Oscilloscope'}
            </span>
            <span className="text-[9px] font-mono text-slate-500">
              CH{selectedBitIndex + 1}: {getPinDisplayName(activeInputPin)} ({activeInputPin?.value === 1 ? 'HIGH' : 'LOW'})
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleTogglePause}
            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border transition-colors cursor-pointer ${
              isPaused
                ? 'bg-amber-950/80 text-amber-300 border-amber-800/60 hover:bg-amber-900/40'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/40'
            }`}
          >
            {isPaused ? 'HOLD' : 'RUN'}
          </button>

          <button
            onClick={handleClear}
            className="p-1 rounded bg-slate-950 border border-slate-900 text-slate-400 hover:text-red-400 hover:border-red-950/40 transition-colors cursor-pointer"
            title="Clear capture buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Screen Box */}
      <div className="relative rounded-lg border border-slate-900 bg-[#05080e] overflow-hidden p-1 shadow-inner">
        {/* Voltage Levels overlay */}
        {showLabels && (
          <div className="absolute left-2.5 top-2 bottom-2 flex flex-col justify-between text-[8px] font-mono font-bold text-slate-500 pointer-events-none z-10 select-none">
            <span className={colors.text}>1V (HIGH)</span>
            <span className="text-slate-700/60">0.5V</span>
            <span className="text-slate-500">0V (LOW)</span>
          </div>
        )}

        {/* Screen Canvas */}
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '140px' }}
          className="rounded block"
        />

        {/* Status Indicators footer */}
        <div className="mt-1 px-1 flex items-center justify-between text-[8px] font-mono text-slate-500 select-none">
          <span>TIMEBASE: {timePerDivMs}ms/div</span>
          <span>SAMPLE RATE: {sampleRateHz}Hz</span>
          <span className="uppercase">TRIG: {triggerMode}</span>
        </div>
      </div>

      {/* Quick Trigger Mode Selector */}
      <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 select-none">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wide">Trigger</span>
        </div>

        <div className="flex items-center gap-1 font-mono text-[8px]">
          {(['auto', 'rising', 'falling'] as TriggerMode[]).map((mode) => (
            <button
              key={mode}
              onClick={(e) => {
                e.stopPropagation();
                const updatedNodes = useCircuitStore.getState().nodes.map((n) =>
                  n.id === id
                    ? {
                        ...n,
                        data: {
                          ...n.data,
                          scopeConfig: { ...config, triggerMode: mode },
                        },
                      }
                    : n
                );
                useCircuitStore.setState({ nodes: updatedNodes });
              }}
              className={`px-1.5 py-0.5 rounded border uppercase transition-colors cursor-pointer ${
                triggerMode === mode
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                  : 'bg-slate-950 text-slate-400 border-slate-900 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-Bit Input Handle Connectors on left side */}
      <div className="absolute -left-[14px] top-1/2 -translate-y-1/2 flex flex-col gap-3">
        {inputs.map((pin, idx) => (
          <div key={pin.id} className="relative flex items-center">
            <Handle
              type="target"
              position={Position.Left}
              id={pin.id}
              style={{ right: '-12px', top:  20 + idx * (50 / (inputs.length - 1)) }}
              className={`!w-3.5 !h-3.5 !border-2 !transition-all ${
                selectedBitIndex === idx
                  ? '!bg-cyan-400 !border-cyan-200 shadow-[0_0_4px_#22d3ee]'
                  : '!bg-slate-800 !border-slate-650'
              }`}
              title={`CH ${idx + 1}: ${getPinDisplayName(pin)}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

OscilloscopeNode.displayName = 'OscilloscopeNode';
