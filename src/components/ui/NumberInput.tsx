import React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface NumberInputProps {
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

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit,
  disabled = false,
  className = '',
}) => {
  const handleDecrement = () => {
    if (disabled) return;
    const next = Math.max(min, value - step);
    onChange(next);
  };

  const handleIncrement = () => {
    if (disabled) return;
    const next = Math.min(max, value + step);
    onChange(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10);
    if (isNaN(raw)) return;
    const clamped = Math.max(min, Math.min(max, raw));
    onChange(clamped);
  };

  return (
    <div className={`w-full space-y-1 ${className}`}>
      {label && (
        <label className="block text-[11px] font-mono font-medium text-slate-400">
          {label}
        </label>
      )}
      <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 shadow-inner">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1 flex items-center justify-center gap-1 px-2">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onChange={handleInputChange}
            className="w-full text-center bg-transparent text-xs font-mono font-bold text-slate-100 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {unit && <span className="text-[10px] font-mono text-slate-500">{unit}</span>}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
