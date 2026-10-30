import React from 'react';

interface InspectorHeaderProps {
  /** Symbol or icon for the selection. */
  icon: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** When set, the title is an inline text field that renames the part. */
  rename?: { value: string; placeholder: string; onChange: (value: string) => void };
}

/** Top of the properties panel: the part's symbol, its name (editable in place) and what kind of part it is. */
export const InspectorHeader: React.FC<InspectorHeaderProps> = ({ icon, title, subtitle, actions, rename }) => (
  <header className="px-3 pt-3 pb-3 border-b border-line shrink-0 flex items-start gap-3">
    <div
      className="w-14 h-12 rounded-lg bg-surface-2 text-fg-muted flex items-center justify-center shrink-0 p-1.5 [&_svg]:max-h-full"
      aria-hidden="true"
    >
      {icon}
    </div>
    <div className="min-w-0 flex-1 pt-0.5">
      {rename ? (
        <input
          value={rename.value}
          placeholder={rename.placeholder}
          aria-label="Name"
          title="Click to rename"
          onChange={(e) => rename.onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur();
          }}
          className="w-full -ml-1.5 px-1.5 h-7 rounded-md bg-transparent border border-transparent hover:border-line focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 text-[15px] font-semibold text-fg placeholder:text-fg-subtle placeholder:font-normal"
        />
      ) : (
        <h2 className="h-7 flex items-center text-[15px] font-semibold text-fg truncate">{title}</h2>
      )}
      {subtitle && <p className="text-xs text-fg-subtle truncate">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-0.5 shrink-0">{actions}</div>}
  </header>
);
