import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
}) => {
  return (
    <label className={`inline-flex items-center justify-between w-full cursor-pointer select-none ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}>
      {(label || description) && (
        <div className="flex flex-col pr-2">
          {label && <span className="text-xs font-mono font-medium text-slate-200">{label}</span>}
          {description && <span className="text-[11px] font-sans text-slate-400">{description}</span>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200 ease-in-out ${
          checked
            ? 'bg-emerald-600 border-emerald-550 shadow-sm'
            : 'bg-slate-800 border-slate-750'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-slate-400 shadow-sm transition duration-200 ease-in-out ${
            checked ? 'translate-x-4 bg-white' : 'translate-x-0.5 bg-slate-450'
          }`}
        />
      </button>
    </label>
  );
};
