import React, { useRef } from 'react';

export interface SegmentedControlOption<T = string | number> {
  value: T;
  label: string | React.ReactNode;
  /** Accessible name when label is not plain text. */
  ariaLabel?: string;
}

export interface SegmentedControlProps<T = string | number> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'xs' | 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

/** Single-choice control with radiogroup semantics; arrow keys move and select. */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  size = 'sm',
  fullWidth = true,
  className = '',
  disabled = false,
  ariaLabel,
}: SegmentedControlProps<T>) {
  const groupRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    xs: 'p-0.5 text-xs',
    sm: 'p-0.5 text-xs',
    md: 'p-1 text-[13px]',
  };

  const itemSizeClasses = {
    xs: 'h-6 px-2 rounded-md',
    sm: 'h-7 px-2.5 rounded-md',
    md: 'h-8 px-3 rounded-lg',
  };

  const selectedIndex = options.findIndex((o) => o.value === value);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (Math.max(selectedIndex, 0) + delta + options.length) % options.length;
    onChange(options[next].value);
    groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      onKeyDown={onKeyDown}
      className={`inline-flex items-center bg-surface-0 border border-line rounded-lg ${sizeClasses[size]} ${
        fullWidth ? 'w-full grid grid-flow-col auto-cols-fr' : ''
      } ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''} ${className}`}
    >
      {options.map((option, i) => {
        const isSelected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.ariaLabel}
            tabIndex={isSelected || (selectedIndex === -1 && i === 0) ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center justify-center font-medium transition-colors duration-150 text-center select-none cursor-pointer whitespace-nowrap ${
              itemSizeClasses[size]
            } ${
              isSelected
                ? 'bg-surface-1 text-fg shadow-sm ring-1 ring-line'
                : 'text-fg-subtle hover:text-fg'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
