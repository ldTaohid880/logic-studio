import React from 'react';
import { X } from 'lucide-react';

interface ModalHeaderProps {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  /** Buttons shown before the close button. */
  actions?: React.ReactNode;
  onClose: () => void;
  titleId?: string;
}

/** Shared header for full dialogs: title and one-line description, actions, close. */
export const ModalHeader: React.FC<ModalHeaderProps> = ({ title, description, icon, actions, onClose, titleId }) => (
  <header className="px-5 py-3.5 border-b border-line flex items-center gap-3 shrink-0 print:hidden">
    {icon && (
      <div className="w-9 h-9 rounded-lg bg-surface-2 text-fg-muted flex items-center justify-center shrink-0" aria-hidden="true">
        {icon}
      </div>
    )}
    <div className="min-w-0 flex-1">
      <h2 id={titleId} className="text-base font-semibold text-fg truncate">
        {title}
      </h2>
      {description && <p className="text-[13px] text-fg-muted truncate">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
    <button
      type="button"
      onClick={onClose}
      aria-label="Close dialog"
      className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors shrink-0 cursor-pointer"
    >
      <X className="w-5 h-5" />
    </button>
  </header>
);
