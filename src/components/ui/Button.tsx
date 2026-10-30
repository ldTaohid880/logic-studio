import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'emerald' | 'cyan';
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
  type = 'button',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-sans font-medium whitespace-nowrap transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

  const sizeClasses = {
    xs: 'h-7 px-2 text-xs gap-1.5 rounded-md',
    sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
    md: 'h-9 px-4 text-sm gap-2 rounded-lg',
    lg: 'h-11 px-5 text-base gap-2.5 rounded-xl',
  };

  const variantClasses = {
    primary: 'bg-accent hover:bg-accent-hover text-on-accent shadow-sm',
    secondary: 'bg-surface-2 hover:bg-surface-3 text-fg border border-line',
    outline: 'bg-transparent hover:bg-surface-2 text-fg border border-line',
    ghost: 'bg-transparent hover:bg-surface-2 text-fg-muted hover:text-fg',
    danger: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25',
    success: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-on-accent shadow-sm',
    cyan: 'bg-cyan-600 hover:bg-cyan-700 text-on-accent shadow-sm',
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin w-3.5 h-3.5 text-current" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
