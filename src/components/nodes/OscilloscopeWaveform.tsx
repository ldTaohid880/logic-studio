import React, { useEffect, useState, useRef } from 'react';

interface OscilloscopeWaveformProps {
  value: number; // 0 or 1
  status: 'stopped' | 'running' | 'paused';
  frequencyHz: number;
}

const BUFFER_SIZE = 64; // 64 samples across 160px width

export const OscilloscopeWaveform: React.FC<OscilloscopeWaveformProps> = ({
  value,
  status,
}) => {
  const currentLevel = value === 1 ? 1 : 0;

  // History buffer initialized with the current level
  const [history, setHistory] = useState<number[]>(() =>
    new Array(BUFFER_SIZE).fill(currentLevel)
  );

  const prevStatusRef = useRef(status);

  // Sync value changes instantly to prevent lag, especially in single-stepping
  const latestValueRef = useRef(currentLevel);
  latestValueRef.current = currentLevel;

  useEffect(() => {
    if (status === 'stopped') {
      setHistory(new Array(BUFFER_SIZE).fill(currentLevel));
    }
    prevStatusRef.current = status;
  }, [status, currentLevel]);

  // When value changes manually (e.g. stepping), push it to the history immediately
  const prevValueRef = useRef(currentLevel);
  useEffect(() => {
    if (currentLevel !== prevValueRef.current) {
      setHistory((prev) => [...prev.slice(1), currentLevel]);
      prevValueRef.current = currentLevel;
    }
  }, [currentLevel]);

  // When running, continuously sample at a regular interval to scroll the trace
  useEffect(() => {
    if (status !== 'running') return;

    // Sample interval of 40ms (~25 FPS scroll rate)
    const sampleIntervalMs = 40;

    const timer = setInterval(() => {
      setHistory((prev) => [...prev.slice(1), latestValueRef.current]);
    }, sampleIntervalMs);

    return () => clearInterval(timer);
  }, [status]);

  // Generate crisp square wave digital path snap-aligned to 0.5px
  const generatePath = () => {
    const totalSamples = history.length;
    if (totalSamples === 0) return 'M 0 32 H 160';

    const dx = 160 / (totalSamples - 1);
    let path = '';

    let prevY = history[0] === 1 ? 8 : 32;
    path += `M 0 ${prevY}`;

    for (let i = 1; i < totalSamples; i++) {
      const curY = history[i] === 1 ? 8 : 32;
      const x = i * dx;

      if (curY !== prevY) {
        // Vertical step, then horizontal segment
        path += ` V ${curY} H ${Math.round(x) + 0.5}`;
        prevY = curY;
      } else {
        path += ` H ${Math.round(x) + 0.5}`;
      }
    }

    return path;
  };

  const pathD = generatePath();
  const lastY = value === 1 ? 8 : 32;
  const traceColor = value === 1 ? '#10b981' : '#06b6d4'; // Emerald for High, Cyan for Low
  const glowColor = value === 1 ? '#34d399' : '#22d3ee';

  return (
    <div className="relative h-11 w-full bg-[#060a12] rounded-lg border border-slate-900 overflow-hidden flex items-center select-none">
      {/* Reticle grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
          backgroundSize: '16px 10px',
        }}
      />

      {/* Midline reference */}
      <div className="absolute top-1/2 left-0 right-0 h-[1px] border-t border-dashed border-slate-800/60 pointer-events-none" />

      {/* Live Waveform SVG */}
      <svg className="w-full h-full relative z-10" viewBox="0 0 160 40" preserveAspectRatio="none">
        {/* Glow trace underneath */}
        <path
          d={pathD}
          fill="none"
          stroke={glowColor}
          strokeWidth="3.0"
          strokeLinecap="square"
          strokeLinejoin="miter"
          opacity="0.2"
          className="blur-[1px]"
        />

        {/* Sharp digital trace */}
        <path
          d={pathD}
          fill="none"
          stroke={traceColor}
          strokeWidth="1.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />

        {/* Leading cursor indicator */}
        <circle
          cx="157"
          cy={lastY}
          r="2.5"
          fill={glowColor}
          className="shadow-[0_0_4px_currentColor]"
        />
      </svg>
    </div>
  );
};
