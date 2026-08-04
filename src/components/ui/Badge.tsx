import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'cyan' | 'slate' | 'amber' | 'rose' | 'purple' | 'blue';
  size?: 'xs' | 'sm' | 'md';
  icon?: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'emerald',
  size = 'sm',
  icon,
  pulse = false,
  className = '',
}) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[9px] gap-1 rounded',
    sm: 'px-2 py-0.5 text-[10px] gap-1 rounded-md',
    md: 'px-2.5 py-1 text-xs gap-1.5 rounded-lg',
  };

  const variantClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold',
    cyan: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono font-bold',
    slate: 'bg-slate-800 text-slate-400 border border-slate-700 font-mono',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-bold',
    rose: 'bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono font-bold',
    purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/30 font-mono font-bold',
    blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono font-bold',
  };

  return (
    <span
      className={`inline-flex items-center tracking-wider uppercase select-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {pulse && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1 ${
            variant === 'emerald'
              ? 'bg-emerald-400 animate-pulse'
              : variant === 'rose'
              ? 'bg-rose-400 animate-pulse'
              : 'bg-cyan-400 animate-pulse'
          }`}
        />
      )}
      {icon}
      {children}
    </span>
  );
};
