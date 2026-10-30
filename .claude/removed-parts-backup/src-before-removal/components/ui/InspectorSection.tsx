import React, { useId, useState } from 'react';
import { ChevronRight } from 'lucide-react';

export interface InspectorSectionProps {
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Collapsible inspector section; flat, divided by hairlines rather than boxed cards. */
export const InspectorSection: React.FC<InspectorSectionProps> = ({
  title,
  icon,
  badge,
  defaultExpanded = true,
  children,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentId = useId();

  return (
    <section className={`border-b border-line last:border-b-0 ${className}`}>
      <h3>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          className="w-full px-4 h-10 flex items-center gap-2 hover:bg-surface-2 transition-colors select-none cursor-pointer"
        >
          <ChevronRight
            className={`w-3.5 h-3.5 text-fg-subtle transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
            aria-hidden="true"
          />
          {icon && (
            <span className="text-fg-subtle [&_svg]:!text-current" aria-hidden="true">
              {icon}
            </span>
          )}
          <span className="text-[13px] font-semibold text-fg flex-1 text-left">{title}</span>
          {badge}
        </button>
      </h3>

      {isExpanded && (
        <div id={contentId} className="px-4 pb-4 pt-1 space-y-3">
          {children}
        </div>
      )}
    </section>
  );
};
