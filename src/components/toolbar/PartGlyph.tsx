import React from 'react';
import { GateType } from '../../types/circuit';
import { gateGeometry, SCHEMATIC_GATES } from '../nodes/symbols/gateGeometry';

/**
 * Small drawing of a part as it appears on the canvas. Gates reuse the canvas
 * geometry, so the bin shows exactly the symbol that will be placed.
 */
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const body = { fill: 'var(--surface-1)', stroke: 'currentColor', strokeWidth: 2, strokeLinejoin: 'round' } as const;

const GateSymbol: React.FC<{ type: GateType }> = ({ type }) => {
  const inputs = type === 'NOT' || type === 'BUFFER' || type === 'TRI_STATE_BUFFER' ? 1 : 2;
  const g = gateGeometry(type, inputs);
  return (
    <svg viewBox={`-2 -2 ${g.width + 4} ${g.height + 4}`} className="h-full w-auto overflow-visible" aria-hidden="true">
      {g.inputs.map((pin) => (
        <line key={pin.y} x1={0} y1={pin.y} x2={pin.leadEnd + 1} y2={pin.y} {...stroke} />
      ))}
      {g.enable && <line x1={g.enable.x} y1={g.height} x2={g.enable.x} y2={g.enable.leadEnd} {...stroke} />}
      <line x1={g.output.leadStart} y1={g.output.y} x2={g.width} y2={g.output.y} {...stroke} />
      <path d={g.body} {...body} />
      {g.extras.map((d) => (
        <path key={d} d={d} {...stroke} />
      ))}
      {g.bubble && <circle cx={g.bubble.cx} cy={g.bubble.cy} r={g.bubble.r} {...body} />}
    </svg>
  );
};

const frame = (children: React.ReactNode, viewBox = '0 0 64 40') => (
  <svg viewBox={viewBox} className="h-full w-auto overflow-visible" aria-hidden="true">
    {children}
  </svg>
);

/** Sensor breakout board: module outline, the sensing element (children) and the DO lead. */
const module = (element: React.ReactNode) =>
  frame(
    <>
      <rect x={4} y={4} width={40} height={32} rx={3} {...body} />
      {element}
      <line x1={44} y1={20} x2={62} y2={20} {...stroke} />
    </>
  );

const GLYPHS: Partial<Record<GateType, () => React.ReactNode>> = {
  CLOCK: () =>
    frame(
      <>
        <rect x={4} y={6} width={36} height={28} rx={3} {...body} />
        <path d="M9 26 H15 V14 H22 V26 H29 V14 H35" {...stroke} strokeWidth={1.75} />
        <line x1={40} y1={20} x2={62} y2={20} {...stroke} />
      </>
    ),
  BUS_JOIN: () =>
    frame(
      <>
        {[8, 16, 24, 32].map((y) => (
          <line key={y} x1={6} y1={y} x2={34} y2={y} {...stroke} strokeWidth={1.5} />
        ))}
        <rect x={34} y={5} width={5} height={30} rx={1.5} fill="currentColor" />
        <line x1={39} y1={20} x2={60} y2={20} {...stroke} strokeWidth={4} />
      </>
    ),
  BUS_SPLIT: () =>
    frame(
      <>
        <line x1={4} y1={20} x2={25} y2={20} {...stroke} strokeWidth={4} />
        <rect x={25} y={5} width={5} height={30} rx={1.5} fill="currentColor" />
        {[8, 16, 24, 32].map((y) => (
          <line key={y} x1={30} y1={y} x2={58} y2={y} {...stroke} strokeWidth={1.5} />
        ))}
      </>
    ),
  PULL_UP: () =>
    frame(
      <>
        <path d="M14 5 H34 M24 5 V10 L30 13 L18 18 L30 23 L18 28 L24 31 V34 H58" {...stroke} strokeWidth={1.75} />
      </>
    ),
  PULL_DOWN: () =>
    frame(
      <>
        <path d="M58 6 H24 V9 L30 12 L18 17 L30 22 L18 27 L24 30 V33 M14 33 H34 M18 36 H30 M22 39 H26" {...stroke} strokeWidth={1.75} />
      </>
    ),
  SENSOR_LIGHT: () =>
    module(
      <>
        <circle cx={20} cy={20} r={8} {...stroke} strokeWidth={1.75} />
        <path d="M15 17 h3 v6 h3 v-6 h3" {...stroke} strokeWidth={1.5} />
      </>
    ),
  SENSOR_TEMPERATURE: () =>
    module(
      <>
        <path d="M18 9 v13 M22 9 v13" {...stroke} strokeWidth={1.5} />
        <ellipse cx={20} cy={25} rx={5} ry={6} fill="currentColor" />
      </>
    ),
  SENSOR_OBSTACLE: () =>
    module(
      <>
        <circle cx={16} cy={13} r={5} {...stroke} strokeWidth={1.75} />
        <circle cx={16} cy={27} r={5} fill="currentColor" />
      </>
    ),
  SENSOR_MOTION: () =>
    module(
      <>
        <circle cx={22} cy={20} r={11} {...stroke} strokeWidth={1.75} />
        <path d="M17 10 Q15 20 17 30 M27 10 Q29 20 27 30" {...stroke} strokeWidth={1.25} />
      </>
    ),
  ARDUINO_UNO: () =>
    frame(
      <>
        <rect x={6} y={4} width={52} height={32} rx={3} {...body} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={13 + i * 7} y={8} width={4} height={4} fill="currentColor" />
        ))}
        <rect x={22} y={19} width={20} height={10} rx={1.5} {...stroke} strokeWidth={1.5} />
      </>
    ),
  INPUT: () =>
    frame(
      <>
        <rect x={6} y={11} width={30} height={18} rx={9} {...body} />
        <circle cx={27} cy={20} r={5.5} fill="currentColor" />
        <line x1={36} y1={20} x2={62} y2={20} {...stroke} />
      </>
    ),
  PUSH_BUTTON: () =>
    frame(
      <>
        <line x1={8} y1={13} x2={34} y2={13} {...stroke} />
        <line x1={21} y1={13} x2={21} y2={5} {...stroke} />
        <line x1={6} y1={24} x2={36} y2={24} {...stroke} />
        <circle cx={6} cy={24} r={2.5} fill="currentColor" />
        <circle cx={36} cy={24} r={2.5} fill="currentColor" />
        <line x1={36} y1={24} x2={62} y2={24} {...stroke} />
      </>
    ),
  DIP_SWITCH: () =>
    frame(
      <>
        <rect x={4} y={8} width={40} height={24} rx={3} {...body} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={9 + i * 9} y={i % 2 ? 19 : 13} width={5} height={8} rx={1} fill="currentColor" />
        ))}
        <line x1={44} y1={20} x2={62} y2={20} {...stroke} />
      </>
    ),
  CONST_HIGH: () =>
    frame(
      <>
        <line x1={14} y1={8} x2={34} y2={8} {...stroke} />
        <line x1={24} y1={8} x2={24} y2={24} {...stroke} />
        <line x1={24} y1={24} x2={60} y2={24} {...stroke} />
        <text x={24} y={38} textAnchor="middle" className="font-mono" fontSize={10} fill="currentColor">
          1
        </text>
      </>
    ),
  CONST_LOW: () =>
    frame(
      <>
        <line x1={24} y1={16} x2={60} y2={16} {...stroke} />
        <line x1={24} y1={16} x2={24} y2={26} {...stroke} />
        <line x1={14} y1={26} x2={34} y2={26} {...stroke} />
        <line x1={18} y1={30} x2={30} y2={30} {...stroke} />
        <line x1={22} y1={34} x2={26} y2={34} {...stroke} />
      </>
    ),
  OUTPUT: () =>
    frame(
      <>
        <line x1={2} y1={20} x2={20} y2={20} {...stroke} />
        <circle cx={34} cy={20} r={13} {...body} />
        <circle cx={34} cy={20} r={6} fill="currentColor" opacity={0.35} />
      </>
    ),
  LOGIC_PROBE: () =>
    frame(
      <>
        <line x1={2} y1={20} x2={18} y2={20} {...stroke} />
        <path d="M18 20 L26 13 H58 V27 H26 Z" {...body} />
        <text x={42} y={24} textAnchor="middle" className="font-mono" fontSize={10} fill="currentColor">
          1/0
        </text>
      </>
    ),
  SEVEN_SEGMENT: () =>
    frame(
      <>
        <rect x={14} y={2} width={34} height={36} rx={3} {...body} />
        <path d="M24 9 H38 M39 10 V19 M39 21 V30 M24 31 H38 M23 21 V30 M23 10 V19 M24 20 H38" {...stroke} strokeWidth={2.5} />
      </>
    ),
  HEX_DISPLAY: () =>
    frame(
      <>
        <rect x={14} y={2} width={34} height={36} rx={3} {...body} />
        <text x={31} y={28} textAnchor="middle" className="font-mono" fontSize={20} fontWeight={600} fill="currentColor">
          F
        </text>
      </>
    ),
  BUS_MONITOR: () =>
    frame(
      <>
        <rect x={4} y={9} width={56} height={22} rx={3} {...body} />
        <text x={32} y={24.5} textAnchor="middle" className="font-mono" fontSize={11} fill="currentColor">
          0x3A
        </text>
      </>
    ),
  TUNNEL: () =>
    frame(
      <>
        <line x1={2} y1={20} x2={18} y2={20} {...stroke} />
        <path d="M18 12 H46 L54 20 L46 28 H18 Z" {...body} />
      </>
    ),
  DELAY_ELEMENT: () =>
    frame(
      <>
        <line x1={2} y1={20} x2={18} y2={20} {...stroke} />
        <rect x={18} y={11} width={28} height={18} rx={2} {...body} />
        <line x1={46} y1={20} x2={62} y2={20} {...stroke} />
      </>
    ),
  TEXT_LABEL: () =>
    frame(
      <>
        <path d="M10 6 H46 L54 14 V34 H10 Z" {...body} />
        <line x1={17} y1={18} x2={44} y2={18} {...stroke} strokeWidth={1.5} />
        <line x1={17} y1={25} x2={38} y2={25} {...stroke} strokeWidth={1.5} />
      </>
    ),
};

/** Generic chip: a DIP outline with notch, used for every multi-pin part. */
export const ChipGlyph: React.FC<{ pins?: number }> = ({ pins = 4 }) => {
  const perSide = Math.min(4, Math.max(2, Math.ceil(pins / 2)));
  return frame(
    <>
      <rect x={14} y={4} width={36} height={32} rx={3} {...body} />
      <path d="M28 4 A4 4 0 0 0 36 4" {...stroke} strokeWidth={1.5} />
      {Array.from({ length: perSide }, (_, i) => {
        const y = 8 + ((i + 0.5) * 24) / perSide;
        return (
          <g key={i}>
            <line x1={6} y1={y} x2={14} y2={y} {...stroke} strokeWidth={1.75} />
            <line x1={50} y1={y} x2={58} y2={y} {...stroke} strokeWidth={1.75} />
          </g>
        );
      })}
    </>
  );
};

export const PartGlyph: React.FC<{ type: GateType }> = ({ type }) => {
  if (SCHEMATIC_GATES.has(type)) return <GateSymbol type={type} />;
  const glyph = GLYPHS[type];
  return glyph ? <>{glyph()}</> : <ChipGlyph />;
};
