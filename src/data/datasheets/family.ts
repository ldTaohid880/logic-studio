import { SpecRow } from './types';

/**
 * Typical 74HC electrical characteristics at VCC = 4.5 V and 25 °C. Each chip adds only what differs.
 * Figures are for orientation; the manufacturer's datasheet has the exact limits per part and temperature.
 */
export const FAMILY_NOTE =
  'Typical values for the 74HC family at VCC = 4.5 V and 25 °C, for orientation only. Different makers and parts vary, so check the manufacturer datasheet before you design with a chip.';

export function familySpecs(opts: { iccUa?: string; driveMa?: number } = {}): SpecRow[] {
  const drive = opts.driveMa ?? 4;
  return [
    { param: 'Supply voltage', symbol: 'VCC', value: '2 V to 6 V', conditions: 'Recommended operating range' },
    { param: 'High-level input voltage', symbol: 'VIH', value: '3.15 V min', conditions: 'At 4.5 V: 70 % of VCC' },
    { param: 'Low-level input voltage', symbol: 'VIL', value: '1.35 V max', conditions: 'At 4.5 V: 30 % of VCC' },
    { param: 'High-level output voltage', symbol: 'VOH', value: '4.4 V min', conditions: 'Light load (20 µA); about 4.2 V at the full drive current' },
    { param: 'Low-level output voltage', symbol: 'VOL', value: '0.1 V max', conditions: 'Light load (20 µA); about 0.3 V at the full drive current' },
    { param: 'Output current', symbol: 'IOH / IOL', value: `±${drive} mA`, conditions: 'Continuous, per output at 4.5 V' },
    { param: 'Input current', symbol: 'II', value: '±1 µA max', conditions: 'CMOS inputs draw almost nothing' },
    { param: 'Input capacitance', symbol: 'CI', value: '10 pF max', conditions: 'Per input' },
    { param: 'Static supply current', symbol: 'ICC', value: `${opts.iccUa ?? '2'} µA max`, conditions: 'Inputs at VCC or GND; grows with switching frequency' },
  ];
}
