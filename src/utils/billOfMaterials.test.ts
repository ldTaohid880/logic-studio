import { describe, it, expect } from 'vitest';
import { createPart } from '../store/partFactory';
import { GateType, PinData } from '../types/circuit';
import { billOfMaterials } from './billOfMaterials';

const parts = (spec: [GateType, number][]) => spec.flatMap(([t, n]) => Array.from({ length: n }, () => createPart(t, { x: 0, y: 0 }, [])));
const withInputs = (t: GateType, count: number) => {
  const node = createPart(t, { x: 0, y: 0 }, []);
  const inputs: PinData[] = Array.from({ length: count }, (_, i) => ({ id: `in-${i}`, name: `In ${i + 1}`, value: -1 }));
  return { ...node, data: { ...node.data, inputs, inputCount: count } };
};

describe('billOfMaterials', () => {
  it('packs gates into real chips and counts spares', () => {
    const bom = billOfMaterials([...parts([['AND', 5], ['NOT', 2]]), withInputs('NAND', 3)]);
    expect(bom.find((l) => l.partNumber === '74HC08')).toMatchObject({ quantity: 2, notes: '5 gates used, 3 spare' });
    expect(bom.find((l) => l.partNumber === '74HC04')).toMatchObject({ quantity: 1, notes: '2 gates used, 4 spare' });
    expect(bom.find((l) => l.partNumber === '74HC10')).toMatchObject({ quantity: 1 });
    // One decoupling capacitor per chip package
    expect(bom.find((l) => l.item.startsWith('Capacitor'))?.quantity).toBe(4);
  });

  it('lists inputs, outputs, chips and an LED resistor for each LED, and skips wiring', () => {
    const bom = billOfMaterials(parts([['INPUT', 3], ['OUTPUT', 2], ['FULL_ADDER', 1], ['COUNTER_LOAD_4BIT', 1], ['TUNNEL', 2], ['LOGIC_PROBE', 1]]));
    expect(bom.find((l) => l.item.startsWith('Slide switch'))?.quantity).toBe(3);
    expect(bom.find((l) => l.item.startsWith('Resistor 330'))?.quantity).toBe(2);
    expect(bom.find((l) => l.partNumber === '74HC161')?.quantity).toBe(1);
    expect(bom.find((l) => l.item === 'Full adder')?.notes).toMatch(/No single standard chip/);
    expect(bom.some((l) => /tunnel|probe/i.test(l.item))).toBe(false);
  });
});
