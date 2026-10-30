import React from 'react';
import { Tooltip } from './Tooltip';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  /** Accessible name; also shown as the hover/focus tooltip. */
  tooltip: string;
  shortcut?: string;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'ghost' | 'secondary' | 'outline' | 'primary' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Pass only for toggle buttons; sets aria-pressed. */
  isActive?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  tooltip,
  shortcut,
  tooltipSide = 'bottom',
  variant = 'ghost',
  size = 'sm',
  isActive,
  className = '',
  type = 'button',
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-7 h-7 rounded-md',
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-9 h-9 rounded-lg',
    lg: 'w-11 h-11 rounded-xl',
  };

  const variantClasses = {
    ghost: isActive
      ? 'bg-accent-soft text-accent-fg'
      : 'bg-transparent text-fg-muted hover:text-fg hover:bg-surface-2',
    secondary: isActive
      ? 'bg-accent-soft text-accent-fg border border-accent/30'
      : 'bg-surface-2 text-fg-muted hover:text-fg border border-line hover:bg-surface-3',
    outline: 'bg-transparent border border-line text-fg-muted hover:bg-surface-2 hover:text-fg',
    primary: 'bg-accent text-on-accent hover:bg-accent-hover shadow-sm',
    danger: 'bg-transparent text-rose-400 hover:bg-rose-500/10',
  };

  return (
    <Tooltip content={tooltip} shortcut={shortcut} side={tooltipSide}>
      <button
        type={type}
        aria-label={tooltip}
        aria-pressed={isActive === undefined ? undefined : isActive}
        className={`inline-flex items-center justify-center shrink-0 transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {icon}
      </button>
    </Tooltip>
  );
};
