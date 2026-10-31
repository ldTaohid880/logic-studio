import React from 'react';
import { DatasheetPackage, DatasheetPin, PackageKind } from '../../data/datasheets/types';

const DIP_PINS: Partial<Record<PackageKind, number>> = { 'DIP-14': 14, 'DIP-16': 16, 'DIP-20': 20, 'DIP-24': 24, 'DIP-28': 28 };

/** True for packages that are drawn; modules only get the pin table. */
export const isDip = (kind: PackageKind) => kind in DIP_PINS;

interface DipPinoutProps {
  pkg: DatasheetPackage;
  /** Chip name printed on the body. */
  label: string;
  /** Pins (by number) that the Logic Studio part uses. */
  usedPins: ReadonlySet<number>;
  activePin: number | null;
  onActivePin: (n: number | null) => void;
}

const LABEL_W = 92;
const LEG = 18;
const BODY_W = 96;
const PAD = 6;

// Hardware faces look the same in both themes, like the chips on the canvas (see CHIP in ChipFrame)
const BODY_TOP = '#2c2e33';
const BODY_MID = '#1d1e22';
const BODY_BOTTOM = '#16171a';
const LEG_FILL = '#b9bec5';
const PRINT = '#e4e6ea';
const PRINT_DIM = '#a2a7af';

const pinText = (p: DatasheetPin) => p.name;

/**
 * Top view of a DIP package: pin 1 at the top left next to the notch, numbers running down the left side and
 * up the right. Hover or focus a pin to light up its row in the pin table, and the other way round.
 */
export const DipPinout: React.FC<DipPinoutProps> = ({ pkg, label, usedPins, activePin, onActivePin }) => {
  const total = DIP_PINS[pkg.kind] ?? pkg.pins.length;
  const half = total / 2;
  const pitch = half > 10 ? 24 : 28;
  const bodyTop = 14;
  const bodyH = half * pitch + 8;
  const bodyX = PAD + LABEL_W + LEG;
  const width = bodyX + BODY_W + LEG + LABEL_W + PAD;
  const height = bodyTop + bodyH + 14;
  const gradId = `dip-grad-${pkg.kind}`;

  const centerY = (i: number) => bodyTop + 4 + pitch * i + pitch / 2;
  const byNumber = new Map(pkg.pins.map((p) => [p.n, p]));

  const renderPin = (n: number, side: 'left' | 'right', i: number) => {
    const pin = byNumber.get(n);
    if (!pin) return null;
    const y = centerY(i);
    const active = activePin === n;
    const used = usedPins.has(n);
    const legX = side === 'left' ? bodyX - LEG : bodyX + BODY_W;
    const labelX = side === 'left' ? bodyX - LEG - 6 : bodyX + BODY_W + LEG + 6;
    const numberX = side === 'left' ? bodyX + 6 : bodyX + BODY_W - 6;
    const description = `Pin ${n}, ${pinText(pin)}${pin.low ? ' (active low)' : ''}: ${pin.fn}${used ? '. Used by the Logic Studio part' : ''}`;
    return (
      <g
        key={n}
        tabIndex={0}
        role="img"
        aria-label={description}
        onMouseEnter={() => onActivePin(n)}
        onMouseLeave={() => onActivePin(null)}
        onFocus={() => onActivePin(n)}
        onBlur={() => onActivePin(null)}
        className="cursor-default outline-none [&:focus-visible_rect.leg]:stroke-focus"
      >
        <title>{description}</title>
        {/* Larger invisible target so thin legs are easy to hit */}
        <rect x={side === 'left' ? PAD : bodyX - LEG} y={y - pitch / 2} width={LABEL_W + LEG} height={pitch} fill="transparent" transform={side === 'right' ? `translate(${BODY_W + LEG},0)` : undefined} />
        <rect
          className="leg"
          x={legX}
          y={y - 4}
          width={LEG}
          height={8}
          rx={1.5}
          fill={active ? 'var(--accent)' : LEG_FILL}
          stroke={used && !active ? 'var(--accent)' : 'transparent'}
          strokeWidth={2}
        />
        <text x={numberX} y={y + 3.5} textAnchor={side === 'left' ? 'start' : 'end'} fontSize={10} fill={active ? PRINT : PRINT_DIM} className="font-mono tabular-nums select-none">
          {n}
        </text>
        <text
          x={labelX}
          y={y + 4}
          textAnchor={side === 'left' ? 'end' : 'start'}
          fontSize={11}
          textDecoration={pin.low ? 'overline' : undefined}
          className={`font-mono select-none ${pin.dir === 'power' ? 'fill-warning' : active || used ? 'fill-accent-fg' : 'fill-fg-muted'} ${active ? 'font-bold' : ''}`}
        >
          {pinText(pin)}
        </text>
      </g>
    );
  };

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`${label} ${pkg.kind} pinout, top view`} className="w-full h-auto max-w-[360px] mx-auto">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BODY_TOP} />
            <stop offset="55%" stopColor={BODY_MID} />
            <stop offset="100%" stopColor={BODY_BOTTOM} />
          </linearGradient>
        </defs>
        <rect x={bodyX} y={bodyTop} width={BODY_W} height={bodyH} rx={4} fill={`url(#${gradId})`} stroke="#3d4046" />
        {/* Notch marks the pin 1 end; the dot sits by pin 1 */}
        <path d={`M ${bodyX + BODY_W / 2 - 10} ${bodyTop} a 10 10 0 0 0 20 0 z`} fill="#0c0d0f" />
        <circle cx={bodyX + 8} cy={bodyTop + 8} r={2.5} fill={PRINT_DIM} opacity={0.5} />
        <text x={bodyX + BODY_W / 2} y={bodyTop + bodyH / 2} textAnchor="middle" fontSize={12} fontWeight={600} fill={PRINT} transform={`rotate(-90 ${bodyX + BODY_W / 2} ${bodyTop + bodyH / 2})`} className="font-mono select-none">
          {label}
        </text>
        {Array.from({ length: half }, (_, i) => renderPin(i + 1, 'left', i))}
        {Array.from({ length: half }, (_, i) => renderPin(total - i, 'right', i))}
      </svg>
      <figcaption className="mt-1 text-center text-xs text-fg-subtle">
        {pkg.kind} seen from the top. Pin 1 is next to the notch.
        {usedPins.size > 0 && <span> Outlined pins are the ones this part uses.</span>}
      </figcaption>
    </figure>
  );
};
