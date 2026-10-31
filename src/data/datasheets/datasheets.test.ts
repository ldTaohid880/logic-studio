import { describe, it, expect } from 'vitest';
import { PARTS } from '../components';
import { createPart } from '../../store/partFactory';
import { MEMORY_GATE_TYPES } from '../../simulation/icLogic';
import { evaluateGate } from '../../utils/gateLogic';
import { SignalValue } from '../../types/circuit';
import { buildFunctionTable, findPin, getDatasheet, HAND_WRITTEN_SHEETS, pinKey, resolveDatasheetKey } from './index';

const PACKAGE_SIZE: Record<string, number> = { 'DIP-14': 14, 'DIP-16': 16, 'DIP-20': 20, 'DIP-24': 24, 'DIP-28': 28 };
const PART_TYPES = new Set<string>(PARTS.map((p) => p.type));

describe('datasheet coverage', () => {
  it('gives every part in the catalog a sheet with a summary, and a hand-written one for every part number', () => {
    for (const part of PARTS) {
      const sheet = getDatasheet(part.type);
      expect(sheet.type).toBe(part.type);
      expect(sheet.summary.length).toBeGreaterThan(10);
      expect(sheet.howItWorks.length).toBeGreaterThan(0);
      expect(sheet.simNotes.length).toBeGreaterThan(0);
      if (part.partNumber) expect(sheet.generated, `${part.type} should be hand-written`).toBeFalsy();
    }
  });

  it('keeps the part number of each hand-written sheet equal to the catalog', () => {
    for (const sheet of HAND_WRITTEN_SHEETS) {
      const part = PARTS.find((p) => p.type === sheet.type);
      expect(part, `${sheet.type} is not in PARTS`).toBeDefined();
      expect(sheet.partNumber, sheet.type).toBe(part!.partNumber);
    }
  });

  it('has no duplicate hand-written sheets', () => {
    const types = HAND_WRITTEN_SHEETS.map((s) => s.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it('only relates parts that exist', () => {
    for (const part of PARTS) {
      for (const r of getDatasheet(part.type).related) expect(PART_TYPES.has(r), `${part.type} -> ${r}`).toBe(true);
    }
  });

  it('gives every memory part a mode table', () => {
    for (const type of MEMORY_GATE_TYPES) {
      const table = getDatasheet(type as never).modeTable;
      expect(table, type).toBeDefined();
      for (const row of table!.rows) {
        expect(row.inputs.length, type).toBe(table!.inputHeaders.length);
        expect(row.outputs.length, type).toBe(table!.outputHeaders.length);
      }
    }
  });
});

describe('package pinouts', () => {
  const withPackage = HAND_WRITTEN_SHEETS.filter((s) => s.package);

  it('numbers pins 1..N without gaps, matching the package kind', () => {
    for (const sheet of withPackage) {
      const { kind, pins } = sheet.package!;
      if (kind === 'Module') {
        expect(pins.map((p) => p.n), sheet.type).toEqual(pins.map((_, i) => i + 1));
      } else {
        expect(pins.map((p) => p.n), sheet.type).toEqual(Array.from({ length: PACKAGE_SIZE[kind] }, (_, i) => i + 1));
      }
    }
  });

  it('has unique pin keys, a function for each pin, and supply pins on every chip', () => {
    for (const sheet of withPackage) {
      const pins = sheet.package!.pins;
      expect(new Set(pins.map(pinKey)).size, sheet.type).toBe(pins.length);
      for (const p of pins) expect(p.fn.length, `${sheet.type} pin ${p.n}`).toBeGreaterThan(3);
      if (sheet.package!.kind !== 'Module') {
        expect(pins.some((p) => /^(VCC|VDD)/.test(p.name)), `${sheet.type} VCC`).toBe(true);
        expect(pins.some((p) => /^GND/.test(p.name)), `${sheet.type} GND`).toBe(true);
      }
    }
  });

  it('maps only pins that exist on the part and on the package', () => {
    for (const sheet of withPackage) {
      const part = createPart(sheet.type, { x: 0, y: 0 }, []).data as { inputs: { id: string }[]; outputs: { id: string }[] };
      const ids = new Set([...part.inputs, ...part.outputs].map((p) => p.id));
      for (const m of sheet.mapping ?? []) {
        expect(ids.has(m.pin), `${sheet.type} ${m.pin}`).toBe(true);
        expect(findPin(sheet.package!.pins, m.real), `${sheet.type} ${m.real}`).toBeDefined();
      }
    }
  });

  it('uses the correct 74HC pinouts', () => {
    const name = (type: Parameters<typeof getDatasheet>[0], n: number) => {
      const p = getDatasheet(type).package!.pins.find((x) => x.n === n)!;
      return pinKey(p);
    };
    // 74HC08: 1A=1, 1B=2, 1Y=3, 2A=4, 2B=5, 2Y=6, GND=7, 3Y=8, 3A=9, 3B=10, 4Y=11, 4A=12, 4B=13, VCC=14
    expect(['1A', '1B', '1Y', '2A', '2B', '2Y', 'GND', '3Y', '3A', '3B', '4Y', '4A', '4B', 'VCC'].map((_, i) => name('AND', i + 1))).toEqual([
      '1A', '1B', '1Y', '2A', '2B', '2Y', 'GND', '3Y', '3A', '3B', '4Y', '4A', '4B', 'VCC',
    ]);
    // 74HC02 has the output first
    expect([1, 2, 3].map((n) => name('NOR', n))).toEqual(['1Y', '1A', '1B']);
    // 74HC04 inverters alternate input and output
    expect([1, 2, 3, 4].map((n) => name('NOT', n))).toEqual(['1A', '1Y', '2A', '2Y']);
    // 74HC138: A0 A1 A2 on pins 1 to 3, Y7 on pin 7, GND on 8
    expect([1, 2, 3, 7, 8, 15, 16].map((n) => name('DECODER_3TO8', n))).toEqual(['A0', 'A1', 'A2', '/Y7', 'GND', '/Y0', 'VCC']);
    // 74HC74: /1CLR 1D 1CLK /1PRE 1Q /1Q GND
    expect([1, 2, 3, 4, 5, 6, 7].map((n) => name('D_FLIPFLOP', n))).toEqual(['/1CLR', '1D', '1CLK', '/1PRE', '1Q', '/1Q', 'GND']);
    // 74HC283: C0 on 7, C4 on 9
    expect([7, 9].map((n) => name('ADDER_4BIT', n))).toEqual(['C0', 'C4']);
    // ATmega328P: PD2 (digital 2) on pin 4, PB5 (digital 13) on pin 19, PC0 (A0) on pin 23
    expect([4, 19, 23].map((n) => name('ARDUINO_UNO', n))).toEqual(['PD2', 'PB5', 'PC0']);
  });

  it('maps the Uno pins to the right ATmega pins', () => {
    const sheet = getDatasheet('ARDUINO_UNO');
    const pinName = (id: string) => (sheet.logicStudioPins ?? []).find((p) => p.id === id)!.name;
    for (const m of sheet.mapping ?? []) {
      const logical = pinName(m.pin);
      const real = findPin(sheet.package!.pins, m.real)!;
      if (logical === 'D13') expect(real.n).toBe(19);
      if (logical === 'D2') expect(real.n).toBe(4);
      if (logical === 'A5') expect(real.n).toBe(28);
    }
  });
});

describe('link keys', () => {
  it('resolves part types and part numbers, ignoring case and separators', () => {
    expect(resolveDatasheetKey('AND')).toBe('AND');
    expect(resolveDatasheetKey('mux_2to1')).toBe('MUX_2TO1');
    expect(resolveDatasheetKey('74hc08')).toBe('AND');
    expect(resolveDatasheetKey('74HC74')).toBe('D_FLIPFLOP');
    expect(resolveDatasheetKey('nonsense')).toBeNull();
  });
});

describe('generated function tables', () => {
  it('matches the AND, XOR and NOT truth tables', () => {
    const and = buildFunctionTable('AND')!;
    expect(and.rows.map((r) => r.outputs[0])).toEqual(['0', '0', '0', '1']);
    expect(and.rows.map((r) => r.inputs.join(''))).toEqual(['00', '01', '10', '11']);
    expect(buildFunctionTable('XOR')!.rows.map((r) => r.outputs[0])).toEqual(['0', '1', '1', '0']);
    expect(buildFunctionTable('NOT')!.rows.map((r) => r.outputs[0])).toEqual(['1', '0']);
    expect(buildFunctionTable('NAND')!.rows.map((r) => r.outputs[0])).toEqual(['1', '1', '1', '0']);
  });

  it('matches an independent model of the 2:1 multiplexer (I0, I1, S, EN)', () => {
    const table = buildFunctionTable('MUX_2TO1')!;
    expect(table.rows).toHaveLength(16);
    for (const row of table.rows) {
      const [i0, i1, s, en] = row.inputs.map(Number);
      const expected = en === 1 ? (s === 1 ? i1 : i0) : 0;
      expect(row.outputs[0], row.inputs.join('')).toBe(String(expected));
    }
  });

  it('matches an independent model of the 3-to-8 decoder (A0, A1, A2, EN)', () => {
    const table = buildFunctionTable('DECODER_3TO8')!;
    expect(table.rows).toHaveLength(16);
    for (const row of table.rows) {
      const [a0, a1, a2, en] = row.inputs.map(Number);
      const address = a0 | (a1 << 1) | (a2 << 2);
      row.outputs.forEach((out, y) => expect(out, `${row.inputs.join('')} Y${y}`).toBe(en === 1 && y === address ? '1' : '0'));
    }
  });

  it('shows an output that is off as Z for the tri-state and open-drain buffers', () => {
    expect(buildFunctionTable('TRI_STATE_BUFFER')!.rows.map((r) => r.outputs[0])).toEqual(['Z', 'Z', '0', '1']);
    expect(buildFunctionTable('OPEN_DRAIN_BUFFER')!.rows.map((r) => r.outputs[0])).toEqual(['0', 'Z']);
  });

  it('lists example rows for wide parts, computed by the simulation', () => {
    const adder = buildFunctionTable('ADDER_4BIT')!;
    expect(adder.condensed).toBe(true);
    for (const row of adder.rows) {
      const [a, b, cin] = row.inputs.map(Number);
      const total = a + b + cin;
      expect(row.outputs, row.inputs.join(',')).toEqual([String(total & 15), total > 15 ? '1' : '0']);
    }
    const alu = buildFunctionTable('ALU_4BIT_8FN')!;
    expect(alu.rows[0].outputs[0]).toBe('9'); // 6 + 3
    expect(alu.rows[1].outputs[0]).toBe('3'); // 6 − 3
  });

  it('has no function table for sources, displays and memory parts', () => {
    for (const type of ['INPUT', 'OUTPUT', 'D_FLIPFLOP', 'LCD_16X2', 'ARDUINO_UNO', 'TUNNEL'] as const) {
      expect(buildFunctionTable(type), type).toBeNull();
    }
  });

  it('builds a table for every combinational chip that has one, with no unknown cells', () => {
    for (const part of PARTS) {
      const table = buildFunctionTable(part.type);
      if (!table) continue;
      expect(table.rows.length, part.type).toBeGreaterThan(0);
      for (const row of table.rows) {
        expect(row.inputs.length, part.type).toBe(table.inputHeaders.length);
        expect(row.outputs.length, part.type).toBe(table.outputHeaders.length);
      }
    }
    // Sanity check of the gate model used by the independent references above
    expect(evaluateGate('AND', [1, 1] as SignalValue[])).toBe(1);
  });
});
