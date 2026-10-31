import React from 'react';
import { Handle, HandleProps } from '@xyflow/react';
import { SignalValue } from '../../types/circuit';
import { signalState } from '../../theme/signals';

export interface PinProps extends Omit<HandleProps, 'children'> {
  value: SignalValue | number | undefined;
  /** Shown as the native hover title (pin name and level). */
  label?: string;
  /** A bus pin: drawn in the bus color, its level is the bus value in the label. */
  bus?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const LEVEL_TEXT = { high: '1 (HIGH)', low: '0 (LOW)', unknown: 'floating' } as const;

/** Connection pin; its look comes from .lsp-pin + data-signal in index.css. */
export const Pin: React.FC<PinProps> = ({ value, label, bus, className = '', ...handleProps }) => {
  const state = signalState(value);
  return (
    <Handle
      {...handleProps}
      className={`lsp-pin ${className}`}
      data-signal={bus ? 'bus' : state}
      title={bus ? label : label ? `${label}: ${LEVEL_TEXT[state]}` : LEVEL_TEXT[state]}
    />
  );
};

/** Pin alias display helper shared by nodes that print pin names. */
export function pinDisplayName(
  pin: { id: string; name: string },
  aliases: Record<string, string> | undefined,
  max = 8
): string {
  const alias = aliases?.[pin.id];
  if (!alias) return pin.name;
  return alias.length > max ? alias.substring(0, max) + '…' : alias;
}
