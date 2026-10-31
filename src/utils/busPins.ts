import { GateType, PinData, SignalValue } from '../types/circuit';

export const BUS_WIDTHS = [2, 4, 8];
export const DEFAULT_BUS_WIDTH = 4;

const busPin = (id: string, width: number): PinData => ({ id, name: 'Bus', value: -1, width, bus: new Array<SignalValue>(width).fill(-1) });
const bitPins = (prefix: 'in' | 'out', width: number): PinData[] =>
  Array.from({ length: width }, (_, i) => ({ id: `${prefix}-${i}`, name: `b${i}`, value: -1 }));

/** Pins of a bus joiner (single wires in, bus out) or splitter (bus in, single wires out); bit 0 is the first. */
export function createBusPins(gateType: GateType, width: number): { inputs: PinData[]; outputs: PinData[] } {
  return gateType === 'BUS_JOIN'
    ? { inputs: bitPins('in', width), outputs: [busPin('out-0', width)] }
    : { inputs: [busPin('in-0', width)], outputs: bitPins('out', width) };
}

/** Value of a bus as hex, or null while any bit is unknown. */
export function busHex(bits: SignalValue[]): string | null {
  if (bits.some((b) => b === -1)) return null;
  const n = bits.reduce<number>((acc, b, i) => acc | (b << i), 0);
  return n.toString(16).toUpperCase().padStart(Math.ceil(bits.length / 4), '0');
}
