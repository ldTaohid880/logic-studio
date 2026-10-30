import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const isTopmost = (el: HTMLElement | null) => {
  const dialogs = document.querySelectorAll('[role="dialog"]');
  return !!el && dialogs[dialogs.length - 1] === el;
};

export interface ModalFrameProps {
  isOpen: boolean;
  onClose: () => void;
  /** Accessible name, or pass labelledBy. */
  ariaLabel?: string;
  labelledBy?: string;
  describedBy?: string;
  /** Classes for the dialog card (size, layout). */
  className?: string;
  children: React.ReactNode;
}

/**
 * Modal plumbing shared by every dialog: portal + backdrop, Escape and backdrop click close
 * the topmost dialog only, Tab is trapped inside, focus moves in on open and back on close.
 */
export const ModalFrame: React.FC<ModalFrameProps> = ({
  isOpen,
  onClose,
  ariaLabel,
  labelledBy,
  describedBy,
  className = '',
  children,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTopmost(cardRef.current)) return;
      if (e.key === 'Escape') {
        // Let open menus/selects inside the dialog close first
        if (document.querySelector('[role="menu"], [role="listbox"]')) return;
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab' && cardRef.current) {
        const items = Array.from(cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => el.offsetParent !== null
        );
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (!cardRef.current.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown, true);
    requestAnimationFrame(() => {
      const card = cardRef.current;
      if (!card || card.contains(document.activeElement)) return;
      const target = card.querySelector<HTMLElement>('[data-autofocus]') ?? card.querySelector<HTMLElement>(FOCUSABLE);
      (target ?? card).focus();
    });

    return () => {
      if (document.querySelectorAll('[role="dialog"]').length <= 1) document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown, true);
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[800] flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm animate-fadeIn print:static print:block print:p-0 print:bg-transparent print:backdrop-blur-none">
      <div className="absolute inset-0 print:hidden" onClick={onClose} aria-hidden="true" />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : ariaLabel}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={`relative z-10 bg-surface-1 text-fg border border-line rounded-2xl shadow-2xl flex flex-col overflow-hidden outline-none animate-popIn ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

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

const WIDTH_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
};

/** Standard dialog: header with title and close button, scrollable body, optional footer. */
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
  const titleId = useId();
  const descId = useId();

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={description ? descId : undefined}
      className={`w-full ${WIDTH_CLASSES[maxWidth]} max-h-[90vh]`}
    >
      <div className="px-5 py-4 border-b border-line flex items-start justify-between shrink-0">
        <div className="flex items-center gap-3 pr-4">
          {icon && <div className="p-2 rounded-xl bg-accent-soft text-accent-fg shrink-0">{icon}</div>}
          <div>
            <h2 id={titleId} className="text-base font-semibold text-fg flex items-center gap-2">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-[13px] text-fg-muted mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 overflow-y-auto flex-1 space-y-4">{children}</div>

      {footer && (
        <div className="px-5 py-3 border-t border-line bg-surface-0/60 flex items-center justify-end gap-2 shrink-0">
          {footer}
        </div>
      )}
    </ModalFrame>
  );
};
