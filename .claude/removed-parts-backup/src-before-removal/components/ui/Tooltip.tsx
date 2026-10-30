import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
  content: React.ReactNode;
  shortcut?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactElement<any>;
  delay?: number;
}

/**
 * Hover/focus tooltip rendered in a portal so panels with overflow clipping don't cut it off.
 * The trigger gets aria-describedby while the tooltip is visible.
 */
export const Tooltip: React.FC<TooltipProps> = ({ content, shortcut, side = 'bottom', children, delay = 350 }) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const id = useId();

  const show = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const el = triggerRef.current;
      if (!el || !el.isConnected) return;
      const r = el.getBoundingClientRect();
      const gap = 8;
      const coords = {
        top: { x: r.left + r.width / 2, y: r.top - gap },
        bottom: { x: r.left + r.width / 2, y: r.bottom + gap },
        left: { x: r.left - gap, y: r.top + r.height / 2 },
        right: { x: r.right + gap, y: r.top + r.height / 2 },
      }[side];
      setPos(coords);
    }, delay);
  }, [delay, side]);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setPos(null);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const transform = {
    top: 'translate(-50%, -100%)',
    bottom: 'translate(-50%, 0)',
    left: 'translate(-100%, -50%)',
    right: 'translate(0, -50%)',
  }[side];

  const childProps = children.props;
  const child = React.cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const ref = childProps.ref;
      if (typeof ref === 'function') ref(node);
      else if (ref && typeof ref === 'object') ref.current = node;
    },
    onMouseEnter: (e: React.MouseEvent) => {
      childProps.onMouseEnter?.(e);
      show();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      childProps.onMouseLeave?.(e);
      hide();
    },
    onFocus: (e: React.FocusEvent) => {
      childProps.onFocus?.(e);
      if ((e.target as HTMLElement).matches?.(':focus-visible')) show();
    },
    onBlur: (e: React.FocusEvent) => {
      childProps.onBlur?.(e);
      hide();
    },
    onPointerDown: (e: React.PointerEvent) => {
      childProps.onPointerDown?.(e);
      hide();
    },
    'aria-describedby': pos ? id : childProps['aria-describedby'],
  });

  return (
    <>
      {child}
      {pos &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            className="fixed z-[1000] pointer-events-none px-2 py-1 rounded-md bg-fg text-surface-1 text-xs font-medium shadow-lg flex items-center gap-2 whitespace-nowrap animate-fadeIn"
            style={{ left: pos.x, top: pos.y, transform }}
          >
            {content}
            {shortcut && <kbd className="font-mono text-xs opacity-70">{shortcut}</kbd>}
          </div>,
          document.body
        )}
    </>
  );
};
