import { GateType } from '../types/circuit';

/**
 * Catalog of placeable parts, ordered the way a digital-logic course introduces them.
 * Drives the parts bin and the names shown in the properties panel.
 */
export type PartCategory = 'Signals' | 'Gates' | 'Combinational' | 'Arithmetic' | 'Memory' | 'Displays' | 'Sensors' | 'Boards' | 'Wiring';

export interface PartInfo {
  type: GateType;
  name: string;
  description: string;
  category: PartCategory;
  /** Real-world equivalent chip, shown in monospace. */
  partNumber?: string;
}

export interface CategoryInfo {
  id: PartCategory;
  title: string;
  /** Tiles for parts recognisable by their symbol; rows for chips. */
  layout: 'tiles' | 'rows';
  defaultOpen: boolean;
}

export const PART_CATEGORIES: CategoryInfo[] = [
  { id: 'Signals', title: 'Signals', layout: 'tiles', defaultOpen: true },
  { id: 'Gates', title: 'Gates', layout: 'tiles', defaultOpen: true },
  { id: 'Combinational', title: 'Combinational', layout: 'rows', defaultOpen: false },
  { id: 'Arithmetic', title: 'Arithmetic', layout: 'rows', defaultOpen: false },
  { id: 'Memory', title: 'Memory', layout: 'rows', defaultOpen: false },
  { id: 'Displays', title: 'Displays', layout: 'tiles', defaultOpen: true },
  { id: 'Sensors', title: 'Sensors', layout: 'tiles', defaultOpen: false },
  { id: 'Boards', title: 'Programmable boards', layout: 'rows', defaultOpen: false },
  { id: 'Wiring', title: 'Wiring and notes', layout: 'rows', defaultOpen: false },
];

export const PARTS: PartInfo[] = [
  // Signals
  { type: 'INPUT', name: 'Switch', description: 'Click to toggle between 0 and 1', category: 'Signals' },
  { type: 'PUSH_BUTTON', name: 'Push button', description: 'Outputs 1 while held down', category: 'Signals' },
  { type: 'DIP_SWITCH', name: 'DIP switch', description: 'A row of 2, 4 or 8 switches', category: 'Signals' },
  { type: 'CLOCK', name: 'Clock', description: 'Ticks on its own; brings run controls and a timing diagram', category: 'Signals' },
  { type: 'CONST_HIGH', name: 'Logic 1', description: 'Always 1 (VCC)', category: 'Signals' },
  { type: 'CONST_LOW', name: 'Logic 0', description: 'Always 0 (GND)', category: 'Signals' },

  // Gates
  { type: 'AND', name: 'AND', description: '1 when every input is 1', category: 'Gates', partNumber: '74HC08' },
  { type: 'OR', name: 'OR', description: '1 when any input is 1', category: 'Gates', partNumber: '74HC32' },
  { type: 'NOT', name: 'NOT', description: 'Inverts its input', category: 'Gates', partNumber: '74HC04' },
  { type: 'NAND', name: 'NAND', description: '0 only when every input is 1', category: 'Gates', partNumber: '74HC00' },
  { type: 'NOR', name: 'NOR', description: '1 only when every input is 0', category: 'Gates', partNumber: '74HC02' },
  { type: 'XOR', name: 'XOR', description: '1 when an odd number of inputs are 1', category: 'Gates', partNumber: '74HC86' },
  { type: 'XNOR', name: 'XNOR', description: '1 when an even number of inputs are 1', category: 'Gates' },
  { type: 'BUFFER', name: 'Buffer', description: 'Passes its input through', category: 'Gates', partNumber: '74HC125' },
  { type: 'TRI_STATE_BUFFER', name: 'Tri-state', description: 'Passes its input while EN is 1, otherwise floats', category: 'Gates', partNumber: '74HC125' },

  // Combinational
  { type: 'MUX_2TO1', name: '2:1 multiplexer', description: 'Picks one of 2 inputs with a select line', category: 'Combinational', partNumber: '74HC157' },
  { type: 'MUX_4TO1', name: '4:1 multiplexer', description: 'Picks one of 4 inputs with 2 select lines', category: 'Combinational', partNumber: '74HC153' },
  { type: 'MUX_8TO1', name: '8:1 multiplexer', description: 'Picks one of 8 inputs with 3 select lines', category: 'Combinational', partNumber: '74HC151' },
  { type: 'DEMUX_1TO4', name: '1:4 demultiplexer', description: 'Sends its input to one of 4 outputs', category: 'Combinational', partNumber: '74HC139' },
  { type: 'DEMUX_1TO8', name: '1:8 demultiplexer', description: 'Sends its input to one of 8 outputs', category: 'Combinational', partNumber: '74HC138' },
  { type: 'DECODER_3TO8', name: '3-to-8 decoder', description: 'Sets the one output numbered by 3 input bits', category: 'Combinational', partNumber: '74HC138' },
  { type: 'DECODER_4TO16_HC', name: '4-to-16 decoder', description: 'Sets the one of 16 outputs numbered by 4 input bits', category: 'Combinational', partNumber: '74HC154' },
  { type: 'DECODER_BCD_TO_7SEG', name: 'BCD to 7-segment', description: 'Drives segments a–g from a 4-bit digit', category: 'Combinational', partNumber: '74HC4511' },
  { type: 'ENCODER_8TO3', name: '8-to-3 encoder', description: 'Outputs the number of the highest active input', category: 'Combinational', partNumber: '74HC148' },
  { type: 'PRIORITY_ENCODER', name: '4-to-2 priority encoder', description: 'Outputs the number of the highest active of 4 inputs', category: 'Combinational' },
  { type: 'COMPARATOR_4BIT', name: '4-bit comparator', description: 'Tells whether A is greater than, equal to or less than B', category: 'Combinational', partNumber: '74HC85' },
  { type: 'PARITY_GENERATOR', name: 'Parity generator', description: 'Makes even and odd parity bits', category: 'Combinational', partNumber: '74HC280' },
  { type: 'PARITY_CHECKER', name: 'Parity checker', description: 'Flags a parity error', category: 'Combinational' },

  // Arithmetic
  { type: 'HALF_ADDER', name: 'Half adder', description: 'Adds 2 bits into sum and carry', category: 'Arithmetic' },
  { type: 'FULL_ADDER', name: 'Full adder', description: 'Adds 2 bits and a carry in', category: 'Arithmetic' },
  { type: 'ADDER_4BIT', name: '4-bit adder', description: 'Ripple-carry adder for two 4-bit numbers', category: 'Arithmetic', partNumber: '74HC283' },
  { type: 'HALF_SUBTRACTOR', name: 'Half subtractor', description: 'Subtracts 2 bits into difference and borrow', category: 'Arithmetic' },
  { type: 'FULL_SUBTRACTOR', name: 'Full subtractor', description: 'Subtracts 2 bits and a borrow in', category: 'Arithmetic' },
  { type: 'ADDER_SUBTRACTOR_4BIT', name: '4-bit adder/subtractor', description: 'Adds or subtracts, chosen by a mode line', category: 'Arithmetic' },
  { type: 'INCREMENTER_4BIT', name: '4-bit incrementer', description: 'Adds 1 to a 4-bit number', category: 'Arithmetic' },
  { type: 'ALU_4BIT_8FN', name: '4-bit ALU', description: 'Adds, subtracts, ANDs, ORs and more, picked by S2–S0', category: 'Arithmetic' },
  { type: 'DECREMENTER_4BIT', name: '4-bit decrementer', description: 'Subtracts 1 from a 4-bit number', category: 'Arithmetic' },

  // Memory
  { type: 'SR_LATCH', name: 'SR latch', description: 'Set and reset; holds while both are 0', category: 'Memory' },
  { type: 'D_LATCH', name: 'D latch', description: 'Follows D while enabled, holds otherwise', category: 'Memory', partNumber: '74HC75' },
  { type: 'D_FLIPFLOP', name: 'D flip-flop', description: 'Stores D on the rising clock edge; preset and clear', category: 'Memory', partNumber: '74HC74' },
  { type: 'JK_FLIPFLOP', name: 'JK flip-flop', description: 'Sets, resets or toggles on the clock edge', category: 'Memory', partNumber: '74HC109' },
  { type: 'T_FLIPFLOP', name: 'T flip-flop', description: 'Toggles on the clock edge while T is 1', category: 'Memory' },
  { type: 'REGISTER_4BIT', name: '4-bit register', description: 'Stores 4 bits on the clock edge', category: 'Memory', partNumber: '74HC173' },
  { type: 'COUNTER_4BIT', name: '4-bit counter', description: 'Counts clock edges up or down', category: 'Memory', partNumber: '74HC193' },
  { type: 'COUNTER_LOAD_4BIT', name: '4-bit counter with load', description: 'Counts up, or loads D on the clock edge', category: 'Memory', partNumber: '74HC161' },
  { type: 'DECADE_COUNTER', name: 'Decade counter', description: 'Counts 0 to 9 and starts again', category: 'Memory', partNumber: '74HC160' },
  { type: 'SHIFT_REG_UNIVERSAL', name: 'Universal shift register', description: 'Holds, shifts left or right, or loads, picked by S1 S0', category: 'Memory', partNumber: '74HC194' },
  { type: 'REGISTER_8BIT', name: '8-bit register', description: 'Stores 8 bits on the clock edge', category: 'Memory', partNumber: '74HC273' },
  { type: 'LATCH_8BIT', name: '8-bit latch', description: 'Follows D while LE is 1; outputs float while OE is 0', category: 'Memory', partNumber: '74HC373' },
  { type: 'SHIFT_REG_4BIT', name: '4-bit shift register', description: 'Shifts a serial bit in on each clock edge', category: 'Memory', partNumber: '74HC164' },
  { type: 'RAM_16X4', name: '16 × 4 RAM', description: 'Stores 16 four-bit words, written on the clock edge', category: 'Memory' },
  { type: 'ROM_16X4', name: '16 × 4 ROM', description: 'Reads one of 16 four-bit words you set', category: 'Memory' },

  // Displays
  { type: 'OUTPUT', name: 'LED', description: 'Lights when its input is 1', category: 'Displays' },
  { type: 'LOGIC_PROBE', name: 'Probe', description: 'Shows 1, 0 or floating', category: 'Displays' },
  { type: 'BUZZER', name: 'Buzzer', description: 'Beeps while its input is 1, at the frequency it is driven at', category: 'Displays' },
  { type: 'LCD_16X2', name: '16 × 2 LCD', description: 'Character display driven like the Arduino LiquidCrystal library (RS, E, D4–D7)', category: 'Displays', partNumber: 'HD44780' },
  { type: 'SEVEN_SEGMENT', name: '7-segment', description: 'Shows a digit from 4 input bits', category: 'Displays' },
  { type: 'HEX_DISPLAY', name: 'Hex digit', description: 'Shows 0–F from 4 input bits', category: 'Displays' },
  { type: 'BUS_MONITOR', name: 'Bus value', description: 'Shows a 2–8 bit value in hex, decimal or binary', category: 'Displays' },

  // Sensors
  { type: 'SENSOR_LIGHT', name: 'Light', description: 'Outputs 1 when brighter than its threshold', category: 'Sensors', partNumber: 'LDR module' },
  { type: 'SENSOR_TEMPERATURE', name: 'Temperature', description: 'Outputs 1 when hotter than its threshold', category: 'Sensors', partNumber: 'Thermistor module' },
  { type: 'SENSOR_OBSTACLE', name: 'Obstacle', description: 'Outputs 1 when something is closer than its threshold', category: 'Sensors', partNumber: 'IR proximity module' },
  { type: 'POTENTIOMETER', name: 'Potentiometer', description: 'A knob giving 0–5 V on its wiper, for analogRead', category: 'Sensors', partNumber: '10 kΩ' },
  { type: 'SENSOR_MOTION', name: 'Motion', description: 'Outputs 1 while it sees movement', category: 'Sensors', partNumber: 'PIR module' },

  // Programmable boards
  { type: 'ARDUINO_UNO', name: 'Uno-compatible board', description: 'Runs a compiled Arduino sketch on pins D2–D13 and A0–A5', category: 'Boards', partNumber: 'ATmega328P' },

  // Wiring and notes
  { type: 'BUS_JOIN', name: 'Bus joiner', description: 'Bundles 2, 4 or 8 wires into one bus wire', category: 'Wiring' },
  { type: 'BUS_SPLIT', name: 'Bus splitter', description: 'Splits a bus wire back into single wires', category: 'Wiring' },
  { type: 'PULL_UP', name: 'Pull-up resistor', description: 'Holds a wire at 1 while nothing else drives it', category: 'Wiring', partNumber: '10 kΩ' },
  { type: 'PULL_DOWN', name: 'Pull-down resistor', description: 'Holds a wire at 0 while nothing else drives it', category: 'Wiring', partNumber: '10 kΩ' },
  { type: 'OPEN_DRAIN_BUFFER', name: 'Open-drain buffer', description: 'Pulls its output to 0, or lets it float on a 1; needs a pull-up', category: 'Wiring', partNumber: '74HC07' },
  { type: 'TUNNEL', name: 'Tunnel', description: 'Connects to every tunnel with the same tag, without a wire', category: 'Wiring' },
  { type: 'DELAY_ELEMENT', name: 'Pass-through', description: 'Copies its input to its output', category: 'Wiring' },
  { type: 'TEXT_LABEL', name: 'Note', description: 'A text note on the canvas', category: 'Wiring' },
];

const EXTRA_INFO: Partial<Record<GateType, Omit<PartInfo, 'type'>>> = {
  ENCODER: { name: 'Encoder', description: 'Binary or priority encoder', category: 'Combinational' },
  CUSTOM: { name: 'Custom component', description: 'A subcircuit you built', category: 'Wiring' },
};

const BY_TYPE = new Map<string, PartInfo>(PARTS.map((p) => [p.type, p]));

/** Human-readable name and description for a gate type. */
export function getComponentInfo(gateType: GateType): Omit<PartInfo, 'type'> {
  const part = BY_TYPE.get(gateType);
  if (part) return part;
  const extra = EXTRA_INFO[gateType];
  if (extra) return extra;
  const pretty = gateType.toLowerCase().replace(/_/g, ' ');
  return { name: pretty.charAt(0).toUpperCase() + pretty.slice(1), description: '', category: 'Wiring' };
}
