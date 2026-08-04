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
import { Activity, Play, Pause, Trash2, Zap, Sliders } from 'lucide-react';

export const OscilloscopeNode: React.FC<NodeProps> = memo(({ id, data: nodeData, selected }) => {
  const data = nodeData as unknown as NodeData;
  const config: OscilloscopeConfig = data.scopeConfig || DEFAULT_OSCILLOSCOPE_CONFIG;
  const inputs = data.inputs || [{ id: 'in-0', name: 'CH 1', value: 0 }];

  const isSimulationPaused = useCircuitStore((s) => s.simulation.isPaused);
  const isDragging = useCircuitStore((s) => s.isDragging);

  const {
    sampleRateHz = 500,
    timePerDivMs = 10,
    bufferSize = 500,
    triggerMode = 'auto',
    autoScroll = true,
    waveColor = 'cyan',
    gridVisible = true,
    showLabels = true,
    isPaused = false,
    selectedBitIndex = 0,
  } = config;

  // Selected channel / input signal value
  const activeInputPin = inputs[selectedBitIndex] || inputs[0];
  const rawVal = activeInputPin?.value;
  const currentSignalVal = rawVal === 1 ? 1 : 0;

  // High performance circular sample buffer ref
  const bufferRef = useRef<number[]>(new Array(bufferSize).fill(currentSignalVal));
  const writeIdxRef = useRef<number>(0);
  const prevValRef = useRef<number>(currentSignalVal);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Local state for stats UI
  const [activeSignal, setActiveSignal] = useState<number>(currentSignalVal);
  const [triggerFired, setTriggerFired] = useState<boolean>(true);

  const colors = COLOR_MAP[waveColor] || COLOR_MAP.cyan;

  // Reset buffer if bufferSize changes
  useEffect(() => {
    bufferRef.current = new Array(bufferSize).fill(currentSignalVal);
    writeIdxRef.current = 0;
  }, [bufferSize]);

  // Sampling Loop (independent of rendering)
  useEffect(() => {
    if (isPaused || isSimulationPaused || isDragging) return;

    const intervalMs = Math.max(1, Math.round(1000 / sampleRateHz));

    const sampleTimer = setInterval(() => {
      const val = currentSignalVal;
      setActiveSignal(val);

      const prevVal = prevValRef.current;
      prevValRef.current = val;

      // Trigger condition check
      let shouldRecord = true;
      if (triggerMode === 'rising') {
        shouldRecord = prevVal === 0 && val === 1;
        if (shouldRecord) setTriggerFired(true);
      } else if (triggerMode === 'falling') {
        shouldRecord = prevVal === 1 && val === 0;
        if (shouldRecord) setTriggerFired(true);
      }

      if (shouldRecord || autoScroll || triggerMode === 'auto') {
        const buf = bufferRef.current;
        if (buf.length !== bufferSize) {
          buf.length = bufferSize;
        }
        buf.shift();
        buf.push(val);
      }
    }, intervalMs);

    return () => clearInterval(sampleTimer);
  }, [sampleRateHz, isPaused, isSimulationPaused, isDragging, currentSignalVal, triggerMode, autoScroll, bufferSize]);

  // 60 FPS Canvas Waveform Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderCanvas = () => {
      const width = canvas.width;
      const height = canvas.height;
      const samples = bufferRef.current;
      const count = samples.length;

      // Clear Screen
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, width, height);

      // 1. Grid Rendering
      if (gridVisible) {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;

        // Major Vertical Time Divs (5 Divisions)
        const divWidth = width / 5;
        for (let i = 1; i < 5; i++) {
          const x = i * divWidth;
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        // Horizontal 1V & 0V Reference Lines
        const yHigh = height * 0.25;
        const yLow = height * 0.75;

        ctx.beginPath();
        ctx.setLineDash([2, 4]);
        ctx.moveTo(0, yHigh);
        ctx.lineTo(width, yHigh);
        ctx.moveTo(0, yLow);
        ctx.lineTo(width, yLow);
        ctx.stroke();

        ctx.setLineDash([]); // Reset dash
      }

      // 2. Trigger Level Marker
      if (triggerMode !== 'auto') {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, height * 0.5);
        ctx.lineTo(width, height * 0.5);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3. Render Digital Waveform with 90° transitions
      if (count > 1) {
        const dx = width / (count - 1);
        const yHigh = height * 0.25;
        const yLow = height * 0.75;

        const getY = (val: number) => (val === 1 ? yHigh : yLow);

        // A. Glow Shadow Pass
        ctx.shadowColor = colors.line;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = colors.line;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'miter';
        ctx.lineCap = 'square';

        ctx.beginPath();
        let prevY = getY(samples[0]);
        ctx.moveTo(0, prevY);

        for (let i = 1; i < count; i++) {
          const curY = getY(samples[i]);
          const x = i * dx;

          if (curY !== prevY) {
            // Vertical step transition, then horizontal line
            ctx.lineTo(x, prevY);
            ctx.lineTo(x, curY);
            prevY = curY;
          } else {
            ctx.lineTo(x, curY);
          }
        }
        ctx.stroke();

        // B. Core Crisp High-Contrast Path
        ctx.shadowBlur = 0; // Reset blur for sharp core line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        prevY = getY(samples[0]);
        ctx.moveTo(0, prevY);

        for (let i = 1; i < count; i++) {
          const curY = getY(samples[i]);
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

        // C. Leading Edge Cursor Pulse Dot
        const lastVal = samples[count - 1];
        const lastY = getY(lastVal);
        ctx.fillStyle = colors.line;
        ctx.beginPath();
        ctx.arc(width - 4, lastY, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(renderCanvas);
    };

    animId = requestAnimationFrame(renderCanvas);
    return () => cancelAnimationFrame(animId);
  }, [gridVisible, triggerMode, colors]);

  const handleClear = () => {
    bufferRef.current = new Array(bufferSize).fill(currentSignalVal);
    useCircuitStore.getState().showToast('Oscilloscope buffer cleared');
  };

  const handleTogglePause = () => {
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

  const handleTriggerChange = (mode: TriggerMode) => {
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
  };

  return (
    <div
      className={`relative min-w-[340px] bg-slate-950 border rounded-2xl p-3 shadow-2xl backdrop-blur-xl select-none transition-all duration-200 ${
        selected
          ? 'border-cyan-400 ring-2 ring-cyan-500/30 shadow-cyan-950/60'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Instrument Bezel Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/90">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border bg-slate-900 border-slate-800 ${colors.text}`}>
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider block">
              {data.label || 'Digital Oscilloscope'}
            </span>
            <span className="text-[9px] font-mono text-slate-500">
              CH1: {activeInputPin?.name || 'IN'} ({activeSignal === 1 ? 'HIGH' : 'LOW'})
            </span>
          </div>
        </div>

        {/* Screen Status Badges & Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleTogglePause}
            className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold flex items-center gap-1 border transition-all ${
              isPaused
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/60'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
            }`}
          >
            {isPaused ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isPaused ? 'HOLD' : 'RUN'}
          </button>

          <button
            onClick={handleClear}
            className="p-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
            title="Clear Waveform Capture"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Screen Frame & HTML5 Canvas Oscilloscope Display */}
      <div className="relative rounded-xl border border-slate-800/90 bg-[#060a12] overflow-hidden p-2 shadow-inner">
        {/* Voltage Scale Markers */}
        {showLabels && (
          <div className="absolute left-2 top-2 bottom-2 flex flex-col justify-between text-[9px] font-mono font-bold text-slate-500 pointer-events-none z-10">
            <span className={colors.text}>1V (HIGH)</span>
            <span className="text-slate-600">0.5V</span>
            <span className="text-slate-500">0V (LOW)</span>
          </div>
        )}

        {/* Main Canvas Waveform Display */}
        <canvas
          ref={canvasRef}
          width={310}
          height={130}
          className="w-full h-[130px] rounded-lg block"
        />

        {/* Status Overlay Footer */}
        <div className="mt-1 flex items-center justify-between px-1 text-[9px] font-mono text-slate-500">
          <span>TB: {timePerDivMs}ms/div</span>
          <span>SR: {sampleRateHz}Hz</span>
          <span className="uppercase">TRIG: {triggerMode}</span>
          <span>BUF: {bufferSize}</span>
        </div>
      </div>

      {/* Quick Mode Toolbar Footer */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] font-mono text-slate-400 font-medium">Trigger:</span>
        </div>

        <div className="flex items-center gap-1 font-mono text-[9px]">
          {(['auto', 'rising', 'falling'] as TriggerMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleTriggerChange(mode)}
              className={`px-2 py-0.5 rounded border uppercase transition-all ${
                triggerMode === mode
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-Bit Input Handles (left side) */}
      <div className="absolute -left-[14px] top-1/2 -translate-y-1/2 flex flex-col gap-3">
        {inputs.map((pin, idx) => (
          <Handle
            key={pin.id}
            type="target"
            position={Position.Left}
            id={pin.id}
            className={`!w-3.5 !h-3.5 !border-2 !transition-all ${
              selectedBitIndex === idx
                ? '!bg-cyan-400 !border-cyan-200 !shadow-[0_0_10px_rgba(34,211,238,0.8)]'
                : '!bg-slate-800 !border-slate-600'
            }`}
            title={`Channel Input: ${pin.name}`}
          />
        ))}
      </div>
    </div>
  );
});

OscilloscopeNode.displayName = 'OscilloscopeNode';
