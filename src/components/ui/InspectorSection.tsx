import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface InspectorSectionProps {
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const InspectorSection: React.FC<InspectorSectionProps> = ({
  title,
  icon,
  badge,
  defaultExpanded = true,
  children,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`border border-slate-800/80 rounded-2xl bg-slate-900/50 overflow-hidden transition-colors ${className}`}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-800/40 transition-colors select-none cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-emerald-400">{icon}</span>}
          <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            {title}
          </span>
          {badge}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && <div className="p-3.5 pt-1 border-t border-slate-800/60 space-y-3">{children}</div>}
    </div>
  );
};
