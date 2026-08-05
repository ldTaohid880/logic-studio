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
  disabled?: boolean;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  size = 'sm',
  fullWidth = true,
  className = '',
  disabled = false,
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    xs: 'p-0.5 text-[10px]',
    sm: 'p-1 text-xs',
    md: 'p-1 text-xs',
  };

  const itemSizeClasses = {
    xs: 'py-0.5 px-2 rounded-md',
    sm: 'py-1 px-2.5 rounded-lg',
    md: 'py-1.5 px-3 rounded-lg',
  };

  return (
    <div
      className={`inline-flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg shadow-inner ${
        sizeClasses[size]
      } ${fullWidth ? 'w-full grid grid-flow-col auto-cols-fr' : ''} ${
        disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
      } ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`font-mono font-bold transition-all duration-150 text-center select-none cursor-pointer ${
              itemSizeClasses[size]
            } ${
              isSelected
                ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

