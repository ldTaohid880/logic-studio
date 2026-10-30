import { SevenSegmentColor, COLOR_CONFIGS } from '../types/sevenSegment';

/**
 * Colors for LEDs and displays, matching real parts. One palette for every output
 * (LED, 7-segment, hex digit, bus value) so a student's color choices read the same everywhere.
 */
export type OutputColor = SevenSegmentColor;

export const OUTPUT_COLORS: OutputColor[] = ['red', 'green', 'amber', 'blue', 'white'];

export function outputColor(color: OutputColor | undefined, fallback: OutputColor = 'red') {
  const c = COLOR_CONFIGS[color ?? fallback] ?? COLOR_CONFIGS[fallback];
  return {
    name: c.label,
    /** Lit segment / lens */
    on: c.stroke,
    glow: c.glow,
    /** Unlit lens: a dim tint so the LED color is visible even when off */
    off: `color-mix(in srgb, ${c.stroke} 18%, #20242b)`,
  };
}

/** Unlit segment on the dark display face. */
export const SEGMENT_OFF = '#262b33';
