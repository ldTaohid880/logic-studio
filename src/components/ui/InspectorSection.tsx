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

/** Collapsible panel section; same header treatment as the parts bin on the left. */
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
    <section className={`px-2 py-1 border-b border-line last:border-b-0 ${className}`}>
      <h3>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          className="w-full flex items-center gap-2 pl-2 pr-2.5 h-9 rounded-lg hover:bg-surface-2 transition-colors cursor-pointer"
        >
          {icon && (
            <span className="text-fg-subtle [&_svg]:!text-current" aria-hidden="true">
              {icon}
            </span>
          )}
          <span className="text-[13px] font-semibold text-fg flex-1 text-left">{title}</span>
          {badge}
          <ChevronRight
            className={`w-4 h-4 text-fg-subtle transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
            aria-hidden="true"
          />
        </button>
      </h3>

      {isExpanded && (
        <div id={contentId} className="px-2 pt-1 pb-3 space-y-3">
          {children}
        </div>
      )}
    </section>
  );
};
