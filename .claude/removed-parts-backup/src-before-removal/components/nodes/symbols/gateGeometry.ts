import { GateType } from '../../../types/circuit';

/**
 * IEEE/ANSI distinctive-shape gate geometry, in node-local pixels.
 * Pins sit on a 15px grid (the canvas snap grid) so wires line up cleanly.
 */
export interface GateGeometry {
  width: number;
  height: number;
  /** Body outline (filled). */
  body: string;
  /** Extra stroke-only paths (e.g. the second back curve of XOR). */
  extras: string[];
  bubble: { cx: number; cy: number; r: number } | null;
  inputs: { y: number; leadEnd: number }[];
  output: { y: number; leadStart: number };
  /** Enable pin entering from below (tri-state buffer). */
  enable?: { x: number; leadEnd: number };
}

const PITCH = 30;
const X0 = 15;
const BUBBLE_R = 4.5;

const roundUp = (v: number, step = 15) => Math.ceil(v / step) * step;

const INVERTED = new Set<GateType>(['NOT', 'NAND', 'NOR', 'XNOR']);

export const SCHEMATIC_GATES = new Set<GateType>([
  'AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER', 'TRI_STATE_BUFFER',
]);

export function gateGeometry(gateType: GateType, inputCount: number): GateGeometry {
  const leftPins = gateType === 'TRI_STATE_BUFFER' ? 1 : Math.max(1, inputCount);
  const height = Math.max(60, leftPins * PITCH);
  const cy = height / 2;
  const inputYs =
    leftPins === 1 ? [cy] : Array.from({ length: leftPins }, (_, i) => i * PITCH + PITCH / 2);

  const family =
    gateType === 'AND' || gateType === 'NAND'
      ? 'and'
      : gateType === 'OR' || gateType === 'NOR'
      ? 'or'
      : gateType === 'XOR' || gateType === 'XNOR'
      ? 'xor'
      : 'triangle';

  let body = '';
  const extras: string[] = [];
  let x1 = X0;
  let leadEndAt = (_y: number) => X0;
  let enable: GateGeometry['enable'];

  if (family === 'and') {
    const t = 4;
    const b = height - 4;
    const r = (b - t) / 2;
    x1 = X0 + Math.max(45, r + 20);
    const xm = x1 - r;
    body = `M ${X0} ${t} H ${xm} A ${r} ${r} 0 0 1 ${xm} ${b} H ${X0} Z`;
  } else if (family === 'or' || family === 'xor') {
    const t = 4;
    const b = height - 4;
    const k = 12; // depth of the concave back
    const bx = family === 'xor' ? X0 + 7 : X0; // XOR body is shifted right of its extra curve
    const len = Math.max(50, (b - t) / 2 + 28);
    x1 = bx + len;
    const cx = bx + len * 0.55;
    body = `M ${bx} ${t} Q ${cx} ${t} ${x1} ${cy} Q ${cx} ${b} ${bx} ${b} Q ${bx + k} ${cy} ${bx} ${t} Z`;
    if (family === 'xor') extras.push(`M ${X0} ${t} Q ${X0 + k} ${cy} ${X0} ${b}`);
    // Leads stop on the (outermost) back curve: x(s) = x0 + 2s(1-s)k with s along the height
    leadEndAt = (y) => {
      const s = (y - t) / (b - t);
      return X0 + 2 * s * (1 - s) * k;
    };
  } else {
    const t = 10;
    const b = height - 10;
    x1 = X0 + (gateType === 'TRI_STATE_BUFFER' ? 30 : 40);
    body = `M ${X0} ${t} L ${x1} ${cy} L ${X0} ${b} Z`;
    if (gateType === 'TRI_STATE_BUFFER') {
      const ex = (X0 + x1) / 2;
      // Point on the lower edge of the triangle directly above the enable pin
      const edgeY = b - ((b - cy) * (ex - X0)) / (x1 - X0);
      enable = { x: ex, leadEnd: edgeY };
    }
  }

  const bubble = INVERTED.has(gateType) ? { cx: x1 + BUBBLE_R, cy, r: BUBBLE_R } : null;
  const leadStart = bubble ? x1 + BUBBLE_R * 2 : x1;
  const width = roundUp(leadStart + 15);

  return {
    width,
    height,
    body,
    extras,
    bubble,
    inputs: inputYs.map((y) => ({ y, leadEnd: leadEndAt(y) })),
    output: { y: cy, leadStart },
    enable,
  };
}
