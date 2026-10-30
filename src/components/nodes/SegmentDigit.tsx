import React from 'react';
import { SEGMENT_OFF } from '../../theme/outputColors';

export interface Segments {
  a: boolean;
  b: boolean;
  c: boolean;
  d: boolean;
  e: boolean;
  f: boolean;
  g: boolean;
  dp?: boolean;
}

// Hexagonal segment outlines in a 70×110 box, standard a–g layout
const SEGMENT_POINTS: Record<Exclude<keyof Segments, 'dp'>, string> = {
  a: '16,10 22,4 48,4 54,10 48,16 22,16',
  b: '54,16 60,22 60,48 54,54 48,48 48,22',
  c: '54,54 60,60 60,86 54,92 48,86 48,60',
  d: '16,98 22,92 48,92 54,98 48,104 22,104',
  e: '10,54 16,60 16,86 10,92 4,86 4,60',
  f: '10,16 16,22 16,48 10,54 4,48 4,22',
  g: '16,54 22,48 48,48 54,54 48,60 22,60',
};

interface SegmentDigitProps {
  segments: Segments;
  color: string;
  glow?: string;
  showDecimalPoint?: boolean;
  className?: string;
}

/** One 7-segment digit, used by the 7-segment display and the hex digit. */
export const SegmentDigit: React.FC<SegmentDigitProps> = ({ segments, color, glow, showDecimalPoint, className = '' }) => {
  const style = (on: boolean): React.CSSProperties => ({
    fill: on ? color : SEGMENT_OFF,
    filter: on && glow ? `drop-shadow(0 0 3px ${glow})` : undefined,
    transition: 'fill 0.12s ease',
  });
  return (
    <svg viewBox="0 0 70 110" className={`-skew-x-[6deg] ${className}`} aria-hidden="true">
      {(Object.keys(SEGMENT_POINTS) as (keyof typeof SEGMENT_POINTS)[]).map((seg) => (
        <polygon key={seg} points={SEGMENT_POINTS[seg]} style={style(segments[seg])} />
      ))}
      {showDecimalPoint && <circle cx={66} cy={100} r={4} style={style(!!segments.dp)} />}
    </svg>
  );
};
