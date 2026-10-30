import React from 'react';
import { Position } from '@xyflow/react';
import { SignalValue } from '../../types/circuit';
import { Pin, pinDisplayName } from './Pin';
import { signalState } from '../../theme/signals';

/**
 * Datasheet-style chip: a header with the name and part number, then pins on a 30px pitch
 * (two canvas grid steps) with names printed inside the package edge.
 */
interface ChipFrameProps {
  title: string;
  /** Part number or kind, shown at the right of the header. */
  tag?: string;
  /** Color of the strip at the left of the header (category or user color). */
  accentColor?: string;
  action?: React.ReactNode;
  onDoubleClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  minWidth?: number;
}

export const ChipFrame: React.FC<ChipFrameProps> = ({
  title,
  tag,
  accentColor = 'var(--fg-subtle)',
  action,
  onDoubleClick,
  children,
  minWidth = 150,
}) => (
  <div
    onDoubleClick={onDoubleClick}
    className="relative rounded-md bg-surface-1 border-[1.5px] border-line-strong text-fg select-none overflow-visible"
    style={{ minWidth }}
  >
    <div className="h-[30px] flex items-center gap-2 pl-2.5 pr-1.5 border-b border-line bg-surface-2 rounded-t-[5px]">
      <span className="w-1 h-3.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} aria-hidden="true" />
      <span className="text-xs font-semibold truncate flex-1" title={title}>
        {title}
      </span>
      {tag && <span className="text-[10px] font-mono text-fg-subtle shrink-0">{tag}</span>}
      {action}
    </div>
    {children}
  </div>
);

interface ChipPin {
  id: string;
  name: string;
  value: SignalValue | number;
}

interface ChipPinRowProps {
  inputs: ChipPin[];
  outputs: ChipPin[];
  aliases?: Record<string, string>;
}

const GLYPH = { high: '1', low: '0', unknown: '–' } as const;

export const ChipPinRow: React.FC<ChipPinRowProps> = ({ inputs, outputs, aliases }) => {
  const rows = Math.max(inputs.length, outputs.length, 1);
  return (
    <div className="flex justify-between gap-6" style={{ minHeight: rows * 30 }}>
      <div className="flex flex-col">
        {inputs.map((pin) => {
          const name = pinDisplayName(pin, aliases);
          return (
            <div key={pin.id} className="relative h-[30px] flex items-center pl-2.5">
              <Pin type="target" position={Position.Left} id={pin.id} value={pin.value} label={pin.name} />
              <span
                className={`text-[11px] font-mono ${signalState(pin.value) === 'high' ? 'text-fg font-semibold' : 'text-fg-muted'}`}
                title={aliases?.[pin.id] ? `${pin.name} (${aliases[pin.id]})` : pin.name}
              >
                {name}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col items-end">
        {outputs.map((pin) => {
          const state = signalState(pin.value);
          return (
            <div key={pin.id} className="relative h-[30px] flex items-center gap-1.5 pr-2.5">
              <span
                className={`text-[11px] font-mono ${state === 'high' ? 'text-fg font-semibold' : 'text-fg-muted'}`}
                title={aliases?.[pin.id] ? `${pin.name} (${aliases[pin.id]})` : pin.name}
              >
                {pinDisplayName(pin, aliases)}
              </span>
              <span
                className="text-[10px] font-mono font-semibold w-2 text-center"
                style={{ color: `var(--signal-${state})` }}
                aria-hidden="true"
              >
                {GLYPH[state]}
              </span>
              <Pin type="source" position={Position.Right} id={pin.id} value={pin.value} label={pin.name} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
