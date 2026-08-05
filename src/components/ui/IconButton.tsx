import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  tooltip?: string;
  variant?: 'ghost' | 'secondary' | 'outline' | 'primary' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isActive?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  tooltip,
  variant = 'ghost',
  size = 'sm',
  isActive = false,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 p-1 rounded-md text-xs',
    sm: 'w-8 h-8 p-1.5 rounded-lg text-sm',
    md: 'w-9 h-9 p-2 rounded-lg text-base',
    lg: 'w-10 h-10 p-2.5 rounded-lg text-lg',
  };

  const variantClasses = {
    ghost: isActive
      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/20'
      : 'bg-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-850 border border-transparent',
    secondary: isActive
      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
      : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-850',
    outline: 'bg-transparent border border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white',
    primary: 'bg-emerald-600 text-white hover:bg-emerald-550 shadow-sm border border-emerald-550/20',
    danger: 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 border border-rose-500/20',
  };

  return (
    <button
      title={tooltip}
      aria-label={tooltip || 'button'}
      aria-pressed={isActive}
      className={`inline-flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-700/50 disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
};
