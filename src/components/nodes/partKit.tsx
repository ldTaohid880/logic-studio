import React from 'react';
import { signalColor, signalState } from '../../theme/signals';

/**
 * Building blocks for input/output parts. Parts sit on the 15px canvas grid with pins
 * on a 30px pitch, have no card chrome, and print their label above the body.
 */

export const PITCH = 30;

// Generic names given by older versions; they repeat what the symbol already shows, so they are not printed
const GENERIC_NAMES = new Set([
  'Digital Input', 'Digital Output', 'Push Button', 'DIP Switch', 'Logic Probe', 'Hex Display',
  'Bus Monitor', '7-Segment Display', 'Constant HIGH', 'Constant LOW',
]);

/** Name of the part, printed above it (e.g. "A", "Sum"). Generic default names are omitted. */
export const PartLabel: React.FC<{ text?: string; align?: 'left' | 'center' }> = ({ text, align = 'left' }) =>
  text && !GENERIC_NAMES.has(text.trim()) ? (
    <div
      className={`absolute bottom-full mb-0.5 text-xs font-medium text-fg whitespace-nowrap pointer-events-none max-w-[160px] truncate ${
        align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0'
      }`}
    >
      {text}
    </div>
  ) : null;

/** Horizontal wire stub colored by the signal it carries. */
export const Lead: React.FC<{ x1: number; x2: number; y: number; value: number | undefined }> = ({ x1, x2, y, value }) => (
  <line
    x1={x1}
    x2={x2}
    y1={y}
    y2={y}
    className="lsp-symbol-lead"
    style={{ stroke: signalColor(value), strokeDasharray: signalState(value) === 'unknown' ? '4 3' : undefined }}
  />
);

/** SVG layer filling the part's box, for leads and simple drawings. */
export const PartSvg: React.FC<{ width: number; height: number; children: React.ReactNode }> = ({ width, height, children }) => (
  <svg width={width} height={height} className="absolute inset-0 overflow-visible pointer-events-none" aria-hidden="true">
    {children}
  </svg>
);

/**
 * Colors of real components (metal, plastic, epoxy). Like display faces they look the same in both
 * themes; the signal level is still shown by the lead, the pin and a printed digit.
 */
export const HW = {
  metal: '#c7ccd2',
  metalEdge: '#8d939b',
  metalDark: '#a9afb7',
  plastic: '#1f2125',
  plasticEdge: '#3d4046',
  slot: '#0b0c0e',
  print: '#f2f4f6',
  dipBody: '#c62f2f',
  dipEdge: '#8f1d1d',
  dipSlot: '#6e1414',
};

/** Black plastic housing of display modules. */
export const MODULE_BODY = 'linear-gradient(180deg, #2a2c31 0%, #1b1c20 100%)';

/** Text for a level, so state is readable without color. */
export const levelGlyph = (value: number | undefined) => ({ high: '1', low: '0', unknown: '?' })[signalState(value)];

/** Dark display window used by 7-segment, hex and bus readouts (stays dark in both themes, like real hardware). */
export const DisplayFace: React.FC<{ className?: string; style?: React.CSSProperties; children: React.ReactNode }> = ({
  className = '',
  style,
  children,
}) => (
  <div
    className={`absolute rounded-md border-[1.5px] border-line-strong bg-[#0d1014] shadow-[inset_0_1px_3px_rgb(0_0_0/0.6)] ${className}`}
    style={style}
  >
    {children}
  </div>
);
