import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl';
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Backdrop click listener */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div
        className={`relative w-full ${widthClasses[maxWidth]} bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10 animate-popIn`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-start justify-between bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3 pr-4">
            {icon && (
              <div className="p-2 rounded-xl bg-slate-800/90 border border-slate-700/80 text-emerald-400 shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-base font-bold text-slate-100 font-mono tracking-wide flex items-center gap-2">
                {title}
              </h2>
              {description && (
                <p className="text-xs font-sans text-slate-400 mt-0.5">{description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">{children}</div>

        {/* Sticky Footer */}
        {footer && (
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
