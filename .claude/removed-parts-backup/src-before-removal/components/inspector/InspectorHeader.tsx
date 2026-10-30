import React from 'react';

interface InspectorHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const InspectorHeader: React.FC<InspectorHeaderProps> = ({ icon, title, subtitle, actions }) => (
  <header className="px-4 h-14 border-b border-line shrink-0 flex items-center gap-3">
    <div className="w-9 h-9 rounded-lg bg-surface-2 text-fg-muted flex items-center justify-center shrink-0" aria-hidden="true">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <h2 className="text-sm font-semibold text-fg truncate">{title}</h2>
      {subtitle && <p className="text-xs text-fg-subtle truncate">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-0.5 shrink-0">{actions}</div>}
  </header>
);
