import { SignalValue } from './circuit';

export type SevenSegmentDisplayMode = 'binary' | 'direct' | 'bcd' | 'hex';
export type SevenSegmentDisplayType = 'common_cathode' | 'common_anode';
export type SevenSegmentColor = 'red' | 'green' | 'blue' | 'amber' | 'white';
export type BcdInvalidBehavior = 'blank' | 'error' | 'dash';

export interface SevenSegmentConfig {
  mode: SevenSegmentDisplayMode;
  displayType: SevenSegmentDisplayType;
  showDecimalPoint: boolean;
  color: SevenSegmentColor;
  glowIntensity: number; // 0 to 100
  brightness: number; // 10 to 100
  bcdInvalidBehavior: BcdInvalidBehavior;
}

export const DEFAULT_SEVEN_SEGMENT_CONFIG: SevenSegmentConfig = {
  mode: 'binary',
  displayType: 'common_cathode',
  showDecimalPoint: false,
  color: 'red',
  glowIntensity: 60,
  brightness: 100,
  bcdInvalidBehavior: 'blank',
};

export interface SevenSegmentEvaluation {
  segments: {
    a: boolean;
    b: boolean;
    c: boolean;
    d: boolean;
    e: boolean;
    f: boolean;
    g: boolean;
    dp: boolean;
  };
  decodedChar: string;
  decimalValue: number | null;
  binaryString: string;
  isValidBcd: boolean;
}

export const COLOR_CONFIGS: Record<
  SevenSegmentColor,
  { label: string; stroke: string; glow: string; bgGlow: string }
> = {
  red: {
    label: 'Red',
    stroke: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.9)',
    bgGlow: 'rgba(239, 68, 68, 0.25)',
  },
  green: {
    label: 'Green',
    stroke: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.9)',
    bgGlow: 'rgba(34, 197, 94, 0.25)',
  },
  blue: {
    label: 'Blue',
    stroke: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.9)',
    bgGlow: 'rgba(59, 130, 246, 0.25)',
  },
  amber: {
    label: 'Amber',
    stroke: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.9)',
    bgGlow: 'rgba(245, 158, 11, 0.25)',
  },
  white: {
    label: 'White',
    stroke: '#f8fafc',
    glow: 'rgba(248, 250, 252, 0.95)',
    bgGlow: 'rgba(248, 250, 252, 0.3)',
  },
};
