import React, { useId } from 'react';
import { HelpCircle } from 'lucide-react';
import { Tooltip } from './Tooltip';

export interface PropertyRowProps {
  label: string;
  tooltip?: string;
  hint?: string; // Alias of tooltip
  children: React.ReactNode;
  align?: 'center' | 'top';
  className?: string;
}

/**
 * Label + control row. Side by side when the panel is wide enough (container query on the
 * inspector body), stacked when it is narrow so controls never get squeezed.
 */
export const PropertyRow: React.FC<PropertyRowProps> = ({
  label,
  hint,
  tooltip = hint,
  children,
  align = 'center',
  className = '',
}) => {
  const labelId = useId();
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={`flex flex-col gap-1.5 @[300px]:flex-row ${
        align === 'top' ? '@[300px]:items-start' : '@[300px]:items-center'
      } @[300px]:justify-between @[300px]:gap-3 text-[13px] ${className}`}
    >
      <div className="flex items-center gap-1 min-w-0 @[300px]:w-[38%] @[300px]:shrink-0">
        <span id={labelId} className="text-fg-muted truncate">
          {label}
        </span>
        {tooltip && (
          <Tooltip content={tooltip} side="top">
            <span tabIndex={0} aria-label={tooltip} className="text-fg-subtle hover:text-fg cursor-help rounded">
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
          </Tooltip>
        )}
      </div>
      <div className="flex-1 min-w-0 flex @[300px]:justify-end">{children}</div>
    </div>
  );
};
