import React from 'react';

export interface SegmentedControlOption<T = string | number> {
  value: T;
  label: string | React.ReactNode;
}

export interface SegmentedControlProps<T = string | number> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'xs' | 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  size = 'sm',
  fullWidth = true,
  className = '',
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    xs: 'p-0.5 text-[10px]',
    sm: 'p-1 text-xs',
    md: 'p-1 text-xs',
  };

  const itemSizeClasses = {
    xs: 'py-0.5 px-2 rounded-md',
    sm: 'py-1 px-2.5 rounded-lg',
    md: 'py-1.5 px-3 rounded-xl',
  };

  return (
    <div
      className={`inline-flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl shadow-inner ${
        sizeClasses[size]
      } ${fullWidth ? 'w-full grid grid-flow-col auto-cols-fr' : ''} ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={`font-mono font-bold transition-all duration-150 text-center select-none cursor-pointer ${
              itemSizeClasses[size]
            } ${
              isSelected
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)] border border-emerald-400/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
