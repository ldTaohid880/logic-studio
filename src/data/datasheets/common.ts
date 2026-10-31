import { TimingRow } from './types';

export const CL = 'CL = 50 pF, VCC = 4.5 V, 25 °C';

/** Propagation delay row: time from an input change to the output change. */
export const tpd = (typ: string, max: string, param = 'Propagation delay, input to output', symbol = 'tpd'): TimingRow => ({
  param, symbol, typ, max, unit: 'ns', conditions: CL,
});

/** Output transition time row. */
export const tt = (typ = '7', max = '15'): TimingRow => ({
  param: 'Output transition time', symbol: 'tt', typ, max, unit: 'ns', conditions: CL,
});

export const fmax = (typ: string, min: string): TimingRow => ({
  param: 'Maximum clock frequency', symbol: 'fmax', typ, max: `min ${min}`, unit: 'MHz', conditions: 'VCC = 4.5 V, 25 °C',
});

export const tsu = (min: string, what = 'Setup time, data before clock'): TimingRow => ({
  param: what, symbol: 'tsu', typ: '–', max: `min ${min}`, unit: 'ns', conditions: 'VCC = 4.5 V, 25 °C',
});

export const th = (min = '0'): TimingRow => ({
  param: 'Hold time, data after clock', symbol: 'th', typ: '–', max: `min ${min}`, unit: 'ns', conditions: 'VCC = 4.5 V, 25 °C',
});

export const tw = (min: string, what = 'Pulse width, clock high or low'): TimingRow => ({
  param: what, symbol: 'tw', typ: '–', max: `min ${min}`, unit: 'ns', conditions: 'VCC = 4.5 V, 25 °C',
});

/** Notes on how Logic Studio treats real-chip details, shared by many sheets. */
export const SIM = {
  zeroDelay: 'Gates react instantly unless you set a gate delay in the timing panel; a real chip takes the propagation delay shown above.',
  floating: 'An unconnected input shows as ? (floating). A real CMOS input left open picks up noise and can draw extra current, so always tie unused inputs.',
  oneGate: 'The part on the canvas is one gate of the package. A real chip holds several, sharing one VCC and GND pair.',
  noPower: 'Power and ground are implied; there are no VCC or GND pins to wire up.',
};

export const TIE_UNUSED = 'Unused inputs must be tied to VCC or GND (or to a used input). A floating CMOS input can oscillate and waste power.';
export const DECOUPLE = 'Put a 100 nF ceramic capacitor between VCC and GND close to the chip. Fast edges cause supply spikes that upset other chips.';
