import React from 'react';

export interface SliderProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  disabled?: boolean;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit = '',
  disabled = false,
  className = '',
}) => {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || value !== undefined) && (
        <div className="flex items-center justify-between text-xs font-mono">
          {label && <span className="text-slate-400 font-medium">{label}</span>}
          <span className="text-emerald-400 font-bold">
            {value} {unit}
          </span>
        </div>
      )}
      <div className="relative flex items-center select-none">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer focus:outline-none disabled:opacity-40 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(16,185,129,0.5)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-950 transition-all"
        />
        <div
          className="absolute left-0 h-1.5 bg-emerald-500 rounded-lg pointer-events-none"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
