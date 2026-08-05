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
          <label className="block text-[11px] font-mono font-medium text-slate-400">
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
            className={`w-full bg-slate-900/90 border border-slate-800 rounded-xl py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500 transition-all duration-150 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-700/50 disabled:opacity-50 disabled:bg-slate-950 ${
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
              className="absolute right-2.5 p-0.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
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
          <p className="text-[10px] text-rose-400 font-mono mt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
