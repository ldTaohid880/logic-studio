import { Node } from '@xyflow/react';
import { GateType, NodeData } from '../types/circuit';
import { CustomComponentDefinition } from '../types/customComponent';
import { getComponentInfo } from '../data/components';
import { SENSORS, isSensor } from '../simulation/sensors';

/**
 * Parts list (bill of materials) for building the circuit on a breadboard with 74HC chips.
 * Gates are packed into real packages (four 2-input ANDs per 74HC08, and so on), custom components are
 * expanded into their parts, and each chip gets a decoupling capacitor and each LED a series resistor.
 */
export interface BomLine {
  item: string;
  partNumber: string;
  quantity: number;
  notes: string;
}

// Real packages for gates by type and number of inputs: part number and gates per package
const GATE_PACKAGES: Partial<Record<GateType, Record<number, [string, number]>>> = {
  AND: { 2: ['74HC08', 4], 3: ['74HC11', 3], 4: ['74HC21', 2] },
  OR: { 2: ['74HC32', 4], 3: ['74HC4075', 3], 4: ['74HC4072', 2] },
  NAND: { 2: ['74HC00', 4], 3: ['74HC10', 3], 4: ['74HC20', 2] },
  NOR: { 2: ['74HC02', 4], 3: ['74HC27', 3], 4: ['74HC4002', 2] },
  XOR: { 2: ['74HC86', 4] },
  XNOR: { 2: ['74HC7266', 4] },
  NOT: { 1: ['74HC04', 6] },
  BUFFER: { 1: ['74HC125', 4] },
  TRI_STATE_BUFFER: { 1: ['74HC125', 4] },
  OPEN_DRAIN_BUFFER: { 1: ['74HC07', 6] },
};

// Parts that are wiring, labels or test equipment rather than components
const NOT_PARTS = new Set<string>(['TUNNEL', 'TEXT_LABEL', 'LOGIC_PROBE', 'CONST_HIGH', 'CONST_LOW', 'BUS_JOIN', 'BUS_SPLIT', 'DELAY_ELEMENT']);

const IO_PARTS: Partial<Record<GateType, [string, string]>> = {
  INPUT: ['Slide switch (SPDT)', ''],
  PUSH_BUTTON: ['Tactile push button, 12 mm', ''],
  OUTPUT: ['LED, 5 mm', ''],
  SEVEN_SEGMENT: ['7-segment display, common cathode', ''],
  HEX_DISPLAY: ['7-segment display with hex decoder', ''],
  BUS_MONITOR: ['LED bar or display for the bus value', ''],
  CLOCK: ['Clock source (555 timer or oscillator)', 'NE555'],
  PULL_UP: ['Resistor 10 kΩ (pull-up)', ''],
  PULL_DOWN: ['Resistor 10 kΩ (pull-down)', ''],
  ARDUINO_UNO: ['Arduino Uno-compatible board', 'ATmega328P'],
  POTENTIOMETER: ['Potentiometer 10 kΩ', ''],
  BUZZER: ['Buzzer, 5 V', ''],
  LCD_16X2: ['16 × 2 character LCD (needs a 10 kΩ contrast potentiometer)', 'HD44780'],
};

const dataOf = (n: Node) => n.data as unknown as NodeData;

/** Every part in the circuit, with custom components replaced by their insides. */
function flatten(nodes: Node[], library: Record<string, CustomComponentDefinition>, depth = 0): NodeData[] {
  return nodes.flatMap((n) => {
    const d = dataOf(n);
    if (!d?.gateType) return [];
    const def = d.gateType === 'CUSTOM' && d.customComponentId ? library[d.customComponentId] : undefined;
    if (def && depth < 16) return flatten(def.nodes as Node[], library, depth + 1);
    return [d];
  });
}

export function billOfMaterials(nodes: Node[], library: Record<string, CustomComponentDefinition> = {}): BomLine[] {
  const parts = flatten(nodes, library);
  const lines = new Map<string, BomLine>();
  const add = (item: string, partNumber: string, quantity: number, notes = '') => {
    const key = `${item}|${partNumber}`;
    const line = lines.get(key) ?? { item, partNumber, quantity: 0, notes };
    line.quantity += quantity;
    lines.set(key, line);
  };

  // Gates: count by package, then round up to whole chips
  const gateCounts = new Map<string, { type: GateType; inputs: number; count: number }>();
  let packages = 0;
  parts.forEach((d) => {
    const pkgs = GATE_PACKAGES[d.gateType];
    if (!pkgs) return;
    const inputs = d.gateType === 'NOT' || d.gateType.includes('BUFFER') ? 1 : d.inputs.length;
    const key = `${d.gateType}|${inputs}`;
    const entry = gateCounts.get(key) ?? { type: d.gateType, inputs, count: 0 };
    entry.count++;
    gateCounts.set(key, entry);
  });
  gateCounts.forEach(({ type, inputs, count }) => {
    const pkg = GATE_PACKAGES[type]![inputs];
    const name = getComponentInfo(type).name;
    if (!pkg) {
      add(`${inputs}-input ${name} gate`, '', count, `No common ${inputs}-input ${name} chip: build it from 2-input gates`);
      return;
    }
    const [partNumber, perChip] = pkg;
    const chips = Math.ceil(count / perChip);
    packages += chips;
    const spare = chips * perChip - count;
    add(
      `${inputs > 1 ? `${inputs}-input ` : ''}${name} gates (${perChip} per chip)`,
      partNumber,
      chips,
      `${count} gate${count === 1 ? '' : 's'} used${spare ? `, ${spare} spare` : ''}`
    );
  });

  parts.forEach((d) => {
    const t = d.gateType;
    if (GATE_PACKAGES[t] || NOT_PARTS.has(t)) return;
    const io = IO_PARTS[t];
    if (io) return add(io[0], io[1], 1);
    if (t === 'DIP_SWITCH') return add(`DIP switch, ${d.bitWidth ?? 4} positions`, '', 1);
    if (isSensor(t)) return add(`${SENSORS[t].name} module`, SENSORS[t].module, 1);
    const info = getComponentInfo(t);
    if (info.partNumber && /^74/.test(info.partNumber)) {
      packages++;
      return add(info.name, info.partNumber, 1);
    }
    add(info.name, '', 1, 'No single standard chip does exactly this: build it from gates, or use a microcontroller');
  });

  const leds = parts.filter((d) => d.gateType === 'OUTPUT').length;
  if (leds > 0) add('Resistor 330 Ω (LED current limit)', '', leds, 'One in series with each LED');
  if (packages > 0) add('Capacitor 100 nF (decoupling)', '', packages, 'One across VCC and GND next to each chip');

  return [...lines.values()];
}
