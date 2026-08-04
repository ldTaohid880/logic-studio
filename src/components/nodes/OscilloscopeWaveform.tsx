import React, { useEffect, useState, useRef } from 'react';

interface OscilloscopeWaveformProps {
  value: number; // 0 or 1
  status: 'stopped' | 'running' | 'paused';
  frequencyHz: number;
}

const BUFFER_SIZE = 64; // 64 samples across 160px width (2.5px per sample)
const SAMPLES_PER_SEC = 16; // 16 samples per second -> 1 sample = 62.5ms

export const OscilloscopeWaveform: React.FC<OscilloscopeWaveformProps> = ({
  value,
  status,
  frequencyHz,
}) => {
  const isHigh = value === 1;
  const currentLevel = isHigh ? 1 : 0;

  // History buffer initialized as flat array with current level
  const [history, setHistory] = useState<number[]>(() =>
    new Array(BUFFER_SIZE).fill(currentLevel)
  );

  const levelRef = useRef(currentLevel);
  levelRef.current = currentLevel;

  const prevValueRef = useRef(value);
  const prevStatusRef = useRef(status);

  // Calculate number of samples in a half-period for the given frequency
  const halfPeriodSamples = Math.max(1, Math.round(SAMPLES_PER_SEC / (2 * Math.max(0.1, frequencyHz))));

  // Handle status & value changes
  useEffect(() => {
    // If status transitioned to 'stopped' or reset was triggered (status is stopped), reset to flat line
    if (status === 'stopped') {
      setHistory(new Array(BUFFER_SIZE).fill(currentLevel));
      prevValueRef.current = value;
      prevStatusRef.current = status;
      return;
    }

    // If value changed (e.g. via Step or Clock tick), append halfPeriodSamples of the new level
    if (value !== prevValueRef.current) {
      setHistory((prev) => {
        const next = [...prev];
        for (let i = 0; i < halfPeriodSamples; i++) {
          next.shift();
          next.push(currentLevel);
        }
        return next;
      });
      prevValueRef.current = value;
    }

    prevStatusRef.current = status;
  }, [value, status, currentLevel, halfPeriodSamples]);

  // While running, continuously sample at 62.5ms interval so waveform moves smoothly in real time
  useEffect(() => {
    if (status !== 'running') return;

    const sampleIntervalMs = Math.round(1000 / SAMPLES_PER_SEC); // 62.5ms

    const timer = setInterval(() => {
      setHistory((prev) => [...prev.slice(1), levelRef.current]);
    }, sampleIntervalMs);

    return () => clearInterval(timer);
  }, [status]);

  // Generate crisp square wave SVG path (sharp 90-degree digital steps)
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
        // Vertical step transition, then horizontal segment
        path += ` V ${curY} H ${x.toFixed(1)}`;
        prevY = curY;
      } else {
        path += ` H ${x.toFixed(1)}`;
      }
    }

    return path;
  };

  const pathD = generatePath();
  const lastY = isHigh ? 8 : 32;

  return (
    <div className="relative h-11 w-full bg-[#060a12] rounded-lg border border-slate-800/90 overflow-hidden flex items-center select-none">
      {/* Reticle grid */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
          backgroundSize: '16px 10px',
        }}
      />

      {/* Midline reference */}
      <div className="absolute top-1/2 left-0 right-0 h-[1px] border-t border-dashed border-slate-800" />

      {/* Real Live Waveform SVG */}
      <svg className="w-full h-full relative z-10" viewBox="0 0 160 40" preserveAspectRatio="none">
        {/* Glow line underneath */}
        <path
          d={pathD}
          fill="none"
          stroke={isHigh ? '#34d399' : '#22d3ee'}
          strokeWidth="3.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
          opacity="0.25"
          className="blur-[2px]"
        />

        {/* Sharp digital trace */}
        <path
          d={pathD}
          fill="none"
          stroke={isHigh ? '#10b981' : '#06b6d4'}
          strokeWidth="2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />

        {/* Live Leading Edge Cursor Dot */}
        <circle
          cx="157"
          cy={lastY}
          r="3"
          fill={isHigh ? '#34d399' : '#38bdf8'}
          className={isHigh ? 'drop-shadow-[0_0_6px_#34d399]' : 'drop-shadow-[0_0_6px_#38bdf8]'}
        />
      </svg>
    </div>
  );
};
