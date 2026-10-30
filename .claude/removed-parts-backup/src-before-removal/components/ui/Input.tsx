import React from 'react';
import { X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, rightIcon, onClear, className = '', value, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="block text-xs font-mono font-medium text-slate-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-2.5 text-slate-500 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            value={value}
            className={`w-full h-8 bg-surface-0 border border-line rounded-lg text-[13px] text-fg placeholder:text-fg-subtle transition-colors duration-150 hover:border-line-strong focus:outline-none focus-visible:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:opacity-50 ${
              leftIcon ? 'pl-8' : 'pl-3'
            } ${rightIcon || onClear ? 'pr-8' : 'pr-3'} ${
              error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/50' : ''
            } ${className}`}
            {...props}
          />
          {value && onClear && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear"
              className="absolute right-2 p-0.5 rounded-md text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {!onClear && rightIcon && (
            <div className="absolute right-2.5 text-slate-500 pointer-events-none flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[11px] text-rose-400 font-mono mt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
