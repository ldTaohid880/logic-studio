import { SignalValue } from '../types/circuit';

/**
 * Single source of truth for how logic levels look. Values are CSS variables
 * (defined per theme in index.css) so SVG/inline styles follow the active theme.
 */
export const SIGNAL_COLORS = {
  high: 'var(--signal-high)',
  low: 'var(--signal-low)',
  unknown: 'var(--signal-unknown)',
  bus: 'var(--signal-bus)',
} as const;

export type SignalState = 'high' | 'low' | 'unknown';

export function signalState(value: SignalValue | number | undefined | null): SignalState {
  if (value === 1) return 'high';
  if (value === 0) return 'low';
  return 'unknown';
}

export function signalColor(value: SignalValue | number | undefined | null): string {
  return SIGNAL_COLORS[signalState(value)];
}

/** Base wire widths in px; multiplied by --wire-scale (presentation density). */
export const WIRE_WIDTH = {
  high: 3,
  low: 2,
  unknown: 2,
} as const;

export function wireStrokeWidth(state: SignalState, extra = 0): string {
  return `calc(${WIRE_WIDTH[state] + extra}px * var(--wire-scale, 1))`;
}

/** Unknown/floating wires are dashed so the state is readable without color. */
export function wireDashArray(state: SignalState): string | undefined {
  return state === 'unknown' ? '5 4' : undefined;
}

/** Resolves a CSS variable to a concrete color (for <canvas> drawing and image export). */
export function resolveCssColor(cssVar: string, fallback = '#888888'): string {
  if (typeof window === 'undefined') return fallback;
  const name = cssVar.startsWith('var(') ? cssVar.slice(4, -1).split(',')[0].trim() : cssVar;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}
