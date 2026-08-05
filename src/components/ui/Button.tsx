import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'sm',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-sans font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-700/50 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

  const sizeClasses = {
    xs: 'px-2 py-1 text-[11px] gap-1 rounded-lg',
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-4 py-2 text-sm gap-2 rounded-lg',
    lg: 'px-5 py-2.5 text-base gap-2.5 rounded-xl',
  };

  const variantClasses = {
    primary:
      'bg-emerald-600 hover:bg-emerald-550 active:bg-emerald-750 text-white font-medium shadow-sm border border-emerald-550/20 focus:ring-emerald-500/40',
    secondary:
      'bg-slate-800/90 hover:bg-slate-850 text-slate-100 border border-slate-800 focus:ring-slate-700/40 shadow-sm',
    outline:
      'bg-transparent hover:bg-slate-850 text-slate-200 border border-slate-800 focus:ring-slate-700/40',
    ghost:
      'bg-transparent hover:bg-slate-850 text-slate-300 hover:text-slate-100 focus:ring-slate-700/40',
    danger:
      'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 focus:ring-rose-500/40',
    success:
      'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 focus:ring-emerald-500/40',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin w-3.5 h-3.5 text-current" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
