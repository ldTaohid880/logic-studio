import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type MenuEntry =
  | {
      type?: 'item';
      id: string;
      label: string;
      icon?: React.ReactNode;
      shortcut?: string;
      disabled?: boolean;
      destructive?: boolean;
      onSelect: () => void;
    }
  | { type: 'separator'; id: string }
  | { type: 'label'; id: string; label: string };

interface MenuPanelProps {
  items: MenuEntry[];
  /** Viewport coordinates of the menu's preferred top-left corner. */
  anchor: { x: number; y: number };
  onClose: () => void;
  ariaLabel?: string;
}

/**
 * Keyboard-accessible menu panel (role="menu"): arrow keys / Home / End move focus,
 * Enter/Space selects, Escape or an outside click closes. Position is clamped to the viewport.
 * Used by DropdownMenu and can be opened directly for context menus.
 */
export const MenuPanel: React.FC<MenuPanelProps> = ({ items, anchor, onClose, ariaLabel }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(anchor);

  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const margin = 8;
    setPos({
      x: Math.max(margin, Math.min(anchor.x, window.innerWidth - width - margin)),
      y: Math.max(margin, Math.min(anchor.y, window.innerHeight - height - margin)),
    });
  }, [anchor.x, anchor.y]);

  const focusables = () =>
    Array.from(panelRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])') ?? []);

  useEffect(() => {
    focusables()[0]?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    const onResize = () => onClose();
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('resize', onResize);
    window.addEventListener('blur', onResize);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('blur', onResize);
    };
  }, [onClose]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const list = focusables();
    const idx = list.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      list[(idx + 1) % list.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      list[(idx - 1 + list.length) % list.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      list[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      list[list.length - 1]?.focus();
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  return createPortal(
    <div
      ref={panelRef}
      role="menu"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed z-[850] min-w-[220px] py-1.5 rounded-xl bg-surface-1 border border-line shadow-xl text-[13px] animate-fadeIn"
      style={{ left: pos.x, top: pos.y }}
    >
      {items.map((item) => {
        if (item.type === 'separator') {
          return <div key={item.id} role="separator" className="my-1.5 h-px bg-line" />;
        }
        if (item.type === 'label') {
          return (
            <div key={item.id} className="px-3 pt-1.5 pb-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
              {item.label}
            </div>
          );
        }
        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              onClose();
              item.onSelect();
            }}
            className={`w-[calc(100%-8px)] mx-1 flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left cursor-pointer outline-none disabled:opacity-40 disabled:cursor-default focus-visible:bg-surface-2 hover:bg-surface-2 ${
              item.destructive ? 'text-rose-400' : 'text-fg'
            }`}
          >
            <span className={`w-4 h-4 flex items-center justify-center shrink-0 ${item.destructive ? '' : 'text-fg-subtle'}`}>
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
            {item.shortcut && <kbd className="font-mono text-xs text-fg-subtle">{item.shortcut}</kbd>}
          </button>
        );
      })}
    </div>,
    document.body
  );
};

interface DropdownMenuProps {
  items: MenuEntry[];
  ariaLabel: string;
  /** Renders the trigger; spread the given props onto a button. */
  trigger: (props: {
    ref: React.Ref<HTMLButtonElement>;
    onClick: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    'aria-haspopup': 'menu';
    'aria-expanded': boolean;
  }) => React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ items, ariaLabel, trigger }) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  const open = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setAnchor({ x: r.left, y: r.bottom + 6 });
  };

  const close = useCallback(() => {
    setAnchor(null);
    triggerRef.current?.focus();
  }, []);

  return (
    <>
      {trigger({
        ref: triggerRef,
        onClick: () => (anchor ? close() : open()),
        onKeyDown: (e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            open();
          }
        },
        'aria-haspopup': 'menu',
        'aria-expanded': anchor !== null,
      })}
      {anchor && <MenuPanel items={items} anchor={anchor} onClose={close} ariaLabel={ariaLabel} />}
    </>
  );
};
