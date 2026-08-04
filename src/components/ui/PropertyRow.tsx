import React from 'react';
import { HelpCircle } from 'lucide-react';

export interface PropertyRowProps {
  label: string;
  tooltip?: string;
  children: React.ReactNode;
  align?: 'center' | 'top';
  className?: string;
}

export const PropertyRow: React.FC<PropertyRowProps> = ({
  label,
  tooltip,
  children,
  align = 'center',
  className = '',
}) => {
  return (
    <div
      className={`flex ${align === 'top' ? 'items-start' : 'items-center'} justify-between gap-3 text-xs font-mono ${className}`}
    >
      <div className="flex items-center gap-1.5 shrink-0 max-w-[130px]">
        <span className="text-slate-400 font-medium truncate">{label}</span>
        {tooltip && (
          <span title={tooltip} className="text-slate-500 hover:text-slate-300 cursor-help">
            <HelpCircle className="w-3 h-3" />
          </span>
        )}
      </div>
      <div className="flex-1 flex justify-end">{children}</div>
    </div>
  );
};
