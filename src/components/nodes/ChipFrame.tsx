import React from 'react';
import { Position } from '@xyflow/react';
import { SignalValue } from '../../types/circuit';
import { Pin, pinDisplayName } from './Pin';
import { signalState } from '../../theme/signals';

/**
 * Chip drawn as a DIP package: black epoxy body, a notch marking pin 1's end, the name and part number
 * printed on top, and a silver leg per pin on a 30px pitch. Wires attach at the tips of the legs.
 * Like the other real-hardware faces it looks the same in both themes.
 */
export const CHIP = {
  body: 'linear-gradient(180deg, #2c2e33 0%, #1d1e22 55%, #16171a 100%)',
  notch: '#0c0d0f',
  print: '#e4e6ea',
  printMuted: '#a2a7af',
  printDim: '#787e87',
  leg: 'linear-gradient(180deg, #f1f3f5 0%, #b9bec5 55%, #8b919a 100%)',
};
/** Length of the legs sticking out of the body. */
const LEG = 12;

interface ChipFrameProps {
  title: string;
  /** Part number or kind, printed at the right of the name. */
  tag?: string;
  /** Color of the pin-1 dot (category or user color). */
  accentColor?: string;
  action?: React.ReactNode;
  onDoubleClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  minWidth?: number;
}

export const ChipFrame: React.FC<ChipFrameProps> = ({
  title,
  tag,
  accentColor = CHIP.printDim,
  action,
  onDoubleClick,
  children,
  minWidth = 150,
}) => (
  <div onDoubleClick={onDoubleClick} className="lsp-hw relative select-none overflow-visible pb-2" style={{ minWidth: minWidth + 2 * LEG }}>
    <div
      className="absolute inset-y-0 rounded-[3px]"
      style={{ left: LEG, right: LEG, background: CHIP.body, boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.09), 0 0 0 1px #3d4046, 0 2px 6px -2px rgb(0 0 0 / 0.45)' }}
      aria-hidden="true"
    />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-2.5 rounded-b-full" style={{ background: CHIP.notch }} aria-hidden="true" />
    <div className="relative h-[30px] flex items-center gap-1.5" style={{ paddingLeft: LEG + 8, paddingRight: LEG + 4 }}>
      <span className="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/40" style={{ backgroundColor: accentColor }} aria-hidden="true" />
      <span className="text-[11px] font-semibold tracking-wide truncate flex-1" style={{ color: CHIP.print }} title={title}>
        {title}
      </span>
      {tag && (
        <span className="text-[10px] font-mono shrink-0" style={{ color: CHIP.printMuted }}>
          {tag}
        </span>
      )}
      {action}
    </div>
    {children}
  </div>
);

/** Style for a small button printed on the chip (e.g. "open the inside"). */
export const chipActionClass = 'nodrag p-1 rounded text-[#a2a7af] hover:text-white hover:bg-white/10 cursor-pointer';

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

const Leg: React.FC<{ side: 'left' | 'right' }> = ({ side }) => (
  <span className="absolute top-[12px] h-[6px] rounded-[1px]" style={{ [side]: 0, width: LEG + 1, background: CHIP.leg }} aria-hidden="true" />
);

export const ChipPinRow: React.FC<ChipPinRowProps> = ({ inputs, outputs, aliases }) => {
  const rows = Math.max(inputs.length, outputs.length, 1);
  const nameStyle = (value: SignalValue | number) =>
    signalState(value) === 'high' ? { color: CHIP.print, fontWeight: 600 } : { color: CHIP.printMuted };
  return (
    <div className="relative flex justify-between gap-6" style={{ minHeight: rows * 30 }}>
      <div className="flex flex-col">
        {inputs.map((pin) => (
          <div key={pin.id} className="relative h-[30px] flex items-center" style={{ paddingLeft: LEG + 8 }}>
            <Leg side="left" />
            <Pin type="target" position={Position.Left} id={pin.id} value={pin.value} label={pin.name} />
            <span
              className="text-[11px] font-mono"
              style={nameStyle(pin.value)}
              title={aliases?.[pin.id] ? `${pin.name} (${aliases[pin.id]})` : pin.name}
            >
              {pinDisplayName(pin, aliases)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-end">
        {outputs.map((pin) => {
          const state = signalState(pin.value);
          return (
            <div key={pin.id} className="relative h-[30px] flex items-center gap-1.5" style={{ paddingRight: LEG + 8 }}>
              <Leg side="right" />
              <span
                className="text-[11px] font-mono"
                style={nameStyle(pin.value)}
                title={aliases?.[pin.id] ? `${pin.name} (${aliases[pin.id]})` : pin.name}
              >
                {pinDisplayName(pin, aliases)}
              </span>
              <span
                className="text-[10px] font-mono font-semibold w-2 text-center"
                style={{ color: state === 'low' ? CHIP.printDim : `var(--signal-${state})` }}
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
