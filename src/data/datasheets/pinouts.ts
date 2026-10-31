import { DatasheetPin, PinDir } from './types';

/** A pin row: [name, direction, function]. A name starting with "/" is active low. */
export type PinRow = [name: string, dir: PinDir, fn: string];

/** Numbers the rows 1..N in order, the way the pins run round the package from the notch. */
export function pinsOf(rows: PinRow[]): DatasheetPin[] {
  return rows.map(([name, dir, fn], i) =>
    name.startsWith('/') ? { n: i + 1, name: name.slice(1), low: true, dir, fn } : { n: i + 1, name, dir, fn }
  );
}

export const VCC: PinRow = ['VCC', 'power', 'Positive supply (2 V to 6 V)'];
export const GND: PinRow = ['GND', 'power', 'Ground (0 V)'];

const A = (g: number, what: string): PinRow => [`${g}A`, 'in', `Gate ${g}: ${what} input A`];
const B = (g: number, what: string): PinRow => [`${g}B`, 'in', `Gate ${g}: ${what} input B`];
const Y = (g: number, what: string): PinRow => [`${g}Y`, 'out', `Gate ${g}: ${what} output`];

/** 14-pin quad two-input gate in the common layout (74HC08, 32, 86, 00 and similar). */
export const quadGate = (what: string): PinRow[] => [
  A(1, what), B(1, what), Y(1, what), A(2, what), B(2, what), Y(2, what), GND,
  Y(3, what), A(3, what), B(3, what), Y(4, what), A(4, what), B(4, what), VCC,
];

/** 74HC02 puts each output before its inputs. */
export const quadNor: PinRow[] = [
  Y(1, 'NOR'), A(1, 'NOR'), B(1, 'NOR'), Y(2, 'NOR'), A(2, 'NOR'), B(2, 'NOR'), GND,
  A(3, 'NOR'), B(3, 'NOR'), Y(3, 'NOR'), A(4, 'NOR'), B(4, 'NOR'), Y(4, 'NOR'), VCC,
];

/** Hex inverter or hex buffer (74HC04, 74HC07). */
export const hexGate = (what: string): PinRow[] => [
  ['1A', 'in', `${what} 1 input`], ['1Y', 'out', `${what} 1 output`],
  ['2A', 'in', `${what} 2 input`], ['2Y', 'out', `${what} 2 output`],
  ['3A', 'in', `${what} 3 input`], ['3Y', 'out', `${what} 3 output`], GND,
  ['4Y', 'out', `${what} 4 output`], ['4A', 'in', `${what} 4 input`],
  ['5Y', 'out', `${what} 5 output`], ['5A', 'in', `${what} 5 input`],
  ['6Y', 'out', `${what} 6 output`], ['6A', 'in', `${what} 6 input`], VCC,
];

export const PINOUTS = {
  // 74HC125: quad bus buffer, active-low output enable
  hc125: [
    ['/1OE', 'in', 'Buffer 1 output enable, active low'], ['1A', 'in', 'Buffer 1 input'], ['1Y', 'out', 'Buffer 1 output (3-state)'],
    ['/2OE', 'in', 'Buffer 2 output enable, active low'], ['2A', 'in', 'Buffer 2 input'], ['2Y', 'out', 'Buffer 2 output (3-state)'], GND,
    ['3Y', 'out', 'Buffer 3 output (3-state)'], ['3A', 'in', 'Buffer 3 input'], ['/3OE', 'in', 'Buffer 3 output enable, active low'],
    ['4Y', 'out', 'Buffer 4 output (3-state)'], ['4A', 'in', 'Buffer 4 input'], ['/4OE', 'in', 'Buffer 4 output enable, active low'], VCC,
  ] as PinRow[],

  // 74HC157: quad 2:1 multiplexer
  hc157: [
    ['S', 'in', 'Select: 0 passes the I0 inputs, 1 passes the I1 inputs'],
    ['1I0', 'in', 'Mux 1 data input 0'], ['1I1', 'in', 'Mux 1 data input 1'], ['1Y', 'out', 'Mux 1 output'],
    ['2I0', 'in', 'Mux 2 data input 0'], ['2I1', 'in', 'Mux 2 data input 1'], ['2Y', 'out', 'Mux 2 output'], GND,
    ['3Y', 'out', 'Mux 3 output'], ['3I1', 'in', 'Mux 3 data input 1'], ['3I0', 'in', 'Mux 3 data input 0'],
    ['4Y', 'out', 'Mux 4 output'], ['4I1', 'in', 'Mux 4 data input 1'], ['4I0', 'in', 'Mux 4 data input 0'],
    ['/E', 'in', 'Enable, active low: outputs are 0 while high'], VCC,
  ] as PinRow[],

  // 74HC153: dual 4:1 multiplexer
  hc153: [
    ['/1E', 'in', 'Mux 1 enable, active low'], ['S1', 'in', 'Select bit 1 (shared)'],
    ['1I3', 'in', 'Mux 1 data input 3'], ['1I2', 'in', 'Mux 1 data input 2'], ['1I1', 'in', 'Mux 1 data input 1'], ['1I0', 'in', 'Mux 1 data input 0'],
    ['1Y', 'out', 'Mux 1 output'], GND,
    ['2Y', 'out', 'Mux 2 output'], ['2I0', 'in', 'Mux 2 data input 0'], ['2I1', 'in', 'Mux 2 data input 1'],
    ['2I2', 'in', 'Mux 2 data input 2'], ['2I3', 'in', 'Mux 2 data input 3'], ['S0', 'in', 'Select bit 0 (shared)'],
    ['/2E', 'in', 'Mux 2 enable, active low'], VCC,
  ] as PinRow[],

  // 74HC151: 8:1 multiplexer
  hc151: [
    ['I3', 'in', 'Data input 3'], ['I2', 'in', 'Data input 2'], ['I1', 'in', 'Data input 1'], ['I0', 'in', 'Data input 0'],
    ['Y', 'out', 'Output'], ['/Y', 'out', 'Inverted output'], ['/E', 'in', 'Enable, active low'], GND,
    ['S2', 'in', 'Select bit 2 (MSB)'], ['S1', 'in', 'Select bit 1'], ['S0', 'in', 'Select bit 0 (LSB)'],
    ['I7', 'in', 'Data input 7'], ['I6', 'in', 'Data input 6'], ['I5', 'in', 'Data input 5'], ['I4', 'in', 'Data input 4'], VCC,
  ] as PinRow[],

  // 74HC139: dual 2-to-4 decoder
  hc139: [
    ['/1E', 'in', 'Decoder 1 enable, active low'], ['1A0', 'in', 'Decoder 1 address bit 0'], ['1A1', 'in', 'Decoder 1 address bit 1'],
    ['/1Y0', 'out', 'Decoder 1 output 0, active low'], ['/1Y1', 'out', 'Decoder 1 output 1, active low'],
    ['/1Y2', 'out', 'Decoder 1 output 2, active low'], ['/1Y3', 'out', 'Decoder 1 output 3, active low'], GND,
    ['/2Y3', 'out', 'Decoder 2 output 3, active low'], ['/2Y2', 'out', 'Decoder 2 output 2, active low'],
    ['/2Y1', 'out', 'Decoder 2 output 1, active low'], ['/2Y0', 'out', 'Decoder 2 output 0, active low'],
    ['2A1', 'in', 'Decoder 2 address bit 1'], ['2A0', 'in', 'Decoder 2 address bit 0'], ['/2E', 'in', 'Decoder 2 enable, active low'], VCC,
  ] as PinRow[],

  // 74HC138: 3-to-8 decoder
  hc138: [
    ['A0', 'in', 'Address bit 0 (LSB)'], ['A1', 'in', 'Address bit 1'], ['A2', 'in', 'Address bit 2 (MSB)'],
    ['/E1', 'in', 'Enable 1, active low'], ['/E2', 'in', 'Enable 2, active low'], ['E3', 'in', 'Enable 3, active high'],
    ['/Y7', 'out', 'Output 7, active low'], GND,
    ['/Y6', 'out', 'Output 6, active low'], ['/Y5', 'out', 'Output 5, active low'], ['/Y4', 'out', 'Output 4, active low'],
    ['/Y3', 'out', 'Output 3, active low'], ['/Y2', 'out', 'Output 2, active low'], ['/Y1', 'out', 'Output 1, active low'],
    ['/Y0', 'out', 'Output 0, active low'], VCC,
  ] as PinRow[],

  // 74HC154: 4-to-16 decoder (24 pins)
  hc154: [
    ['/Y0', 'out', 'Output 0, active low'], ['/Y1', 'out', 'Output 1, active low'], ['/Y2', 'out', 'Output 2, active low'],
    ['/Y3', 'out', 'Output 3, active low'], ['/Y4', 'out', 'Output 4, active low'], ['/Y5', 'out', 'Output 5, active low'],
    ['/Y6', 'out', 'Output 6, active low'], ['/Y7', 'out', 'Output 7, active low'], ['/Y8', 'out', 'Output 8, active low'],
    ['/Y9', 'out', 'Output 9, active low'], ['/Y10', 'out', 'Output 10, active low'], GND,
    ['/Y11', 'out', 'Output 11, active low'], ['/Y12', 'out', 'Output 12, active low'], ['/Y13', 'out', 'Output 13, active low'],
    ['/Y14', 'out', 'Output 14, active low'], ['/Y15', 'out', 'Output 15, active low'],
    ['/E1', 'in', 'Enable 1, active low'], ['/E2', 'in', 'Enable 2, active low'],
    ['A3', 'in', 'Address bit 3 (MSB)'], ['A2', 'in', 'Address bit 2'], ['A1', 'in', 'Address bit 1'], ['A0', 'in', 'Address bit 0 (LSB)'], VCC,
  ] as PinRow[],

  // 74HC4511: BCD to 7-segment latch/decoder/driver
  hc4511: [
    ['B', 'in', 'BCD input bit 1'], ['C', 'in', 'BCD input bit 2'], ['/LT', 'in', 'Lamp test, active low: lights every segment'],
    ['/BI', 'in', 'Blanking, active low: turns every segment off'], ['LE', 'in', 'Latch enable: holds the input while high'],
    ['D', 'in', 'BCD input bit 3 (MSB)'], ['A', 'in', 'BCD input bit 0 (LSB)'], ['GND', 'power', 'Ground (0 V)'],
    ['e', 'out', 'Segment e'], ['d', 'out', 'Segment d'], ['c', 'out', 'Segment c'], ['b', 'out', 'Segment b'],
    ['a', 'out', 'Segment a'], ['g', 'out', 'Segment g'], ['f', 'out', 'Segment f'], ['VCC', 'power', 'Positive supply'],
  ] as PinRow[],

  // 74HC148: 8-to-3 priority encoder, active-low inputs and outputs
  hc148: [
    ['/I4', 'in', 'Input 4, active low'], ['/I5', 'in', 'Input 5, active low'], ['/I6', 'in', 'Input 6, active low'],
    ['/I7', 'in', 'Input 7, active low (highest priority)'], ['/EI', 'in', 'Enable input, active low'],
    ['/A2', 'out', 'Code bit 2, active low'], ['/A1', 'out', 'Code bit 1, active low'], GND,
    ['/A0', 'out', 'Code bit 0, active low'], ['/I0', 'in', 'Input 0, active low'], ['/I1', 'in', 'Input 1, active low'],
    ['/I2', 'in', 'Input 2, active low'], ['/I3', 'in', 'Input 3, active low'],
    ['/GS', 'out', 'Group select: low when any input is active'], ['/EO', 'out', 'Enable output: low when no input is active'], VCC,
  ] as PinRow[],

  // 74HC85: 4-bit magnitude comparator
  hc85: [
    ['B3', 'in', 'Word B bit 3 (MSB)'], ['IA<B', 'in', 'Cascade input: A less than B'], ['IA=B', 'in', 'Cascade input: A equal to B'],
    ['IA>B', 'in', 'Cascade input: A greater than B'], ['OA>B', 'out', 'A is greater than B'], ['OA=B', 'out', 'A equals B'],
    ['OA<B', 'out', 'A is less than B'], GND,
    ['B0', 'in', 'Word B bit 0 (LSB)'], ['A0', 'in', 'Word A bit 0 (LSB)'], ['B1', 'in', 'Word B bit 1'], ['A1', 'in', 'Word A bit 1'],
    ['A2', 'in', 'Word A bit 2'], ['B2', 'in', 'Word B bit 2'], ['A3', 'in', 'Word A bit 3 (MSB)'], VCC,
  ] as PinRow[],

  // 74HC280: 9-bit odd/even parity generator and checker
  hc280: [
    ['G', 'in', 'Data input G'], ['H', 'in', 'Data input H'], ['NC', 'nc', 'Not connected'], ['I', 'in', 'Data input I'],
    ['ΣEVEN', 'out', 'High when an even number of inputs are high'], ['ΣODD', 'out', 'High when an odd number of inputs are high'], GND,
    ['A', 'in', 'Data input A'], ['B', 'in', 'Data input B'], ['C', 'in', 'Data input C'], ['D', 'in', 'Data input D'],
    ['E', 'in', 'Data input E'], ['F', 'in', 'Data input F'], VCC,
  ] as PinRow[],

  // 74HC283: 4-bit full adder
  hc283: [
    ['S2', 'out', 'Sum bit 2'], ['B2', 'in', 'Word B bit 2'], ['A2', 'in', 'Word A bit 2'], ['S1', 'out', 'Sum bit 1'],
    ['A1', 'in', 'Word A bit 1'], ['B1', 'in', 'Word B bit 1'], ['C0', 'in', 'Carry in'], GND,
    ['C4', 'out', 'Carry out'], ['S4', 'out', 'Sum bit 4 (MSB)'], ['B4', 'in', 'Word B bit 4 (MSB)'], ['A4', 'in', 'Word A bit 4 (MSB)'],
    ['S3', 'out', 'Sum bit 3'], ['B3', 'in', 'Word B bit 3'], ['A3', 'in', 'Word A bit 3'], VCC,
  ] as PinRow[],

  // 74HC75: 4-bit bistable latch (two enables, two latches each)
  hc75: [
    ['/1Q', 'out', 'Latch 1 inverted output'], ['1D', 'in', 'Latch 1 data'], ['2D', 'in', 'Latch 2 data'],
    ['E34', 'in', 'Enable for latches 3 and 4 (transparent while high)'], VCC,
    ['3D', 'in', 'Latch 3 data'], ['4D', 'in', 'Latch 4 data'], ['/4Q', 'out', 'Latch 4 inverted output'],
    ['4Q', 'out', 'Latch 4 output'], ['3Q', 'out', 'Latch 3 output'], ['/3Q', 'out', 'Latch 3 inverted output'], GND,
    ['E12', 'in', 'Enable for latches 1 and 2 (transparent while high)'],
    ['2Q', 'out', 'Latch 2 output'], ['/2Q', 'out', 'Latch 2 inverted output'], ['1Q', 'out', 'Latch 1 output'],
  ] as PinRow[],

  // 74HC74: dual D flip-flop
  hc74: [
    ['/1CLR', 'in', 'Flip-flop 1 asynchronous clear, active low'], ['1D', 'in', 'Flip-flop 1 data'], ['1CLK', 'in', 'Flip-flop 1 clock (rising edge)'],
    ['/1PRE', 'in', 'Flip-flop 1 asynchronous preset, active low'], ['1Q', 'out', 'Flip-flop 1 output'], ['/1Q', 'out', 'Flip-flop 1 inverted output'], GND,
    ['/2Q', 'out', 'Flip-flop 2 inverted output'], ['2Q', 'out', 'Flip-flop 2 output'], ['/2PRE', 'in', 'Flip-flop 2 asynchronous preset, active low'],
    ['2CLK', 'in', 'Flip-flop 2 clock (rising edge)'], ['2D', 'in', 'Flip-flop 2 data'], ['/2CLR', 'in', 'Flip-flop 2 asynchronous clear, active low'], VCC,
  ] as PinRow[],

  // 74HC109: dual JK flip-flop (J and inverted K)
  hc109: [
    ['/1CLR', 'in', 'Flip-flop 1 asynchronous clear, active low'], ['1J', 'in', 'Flip-flop 1 J input'], ['/1K', 'in', 'Flip-flop 1 K input, active low'],
    ['1CLK', 'in', 'Flip-flop 1 clock (rising edge)'], ['/1PRE', 'in', 'Flip-flop 1 asynchronous preset, active low'],
    ['1Q', 'out', 'Flip-flop 1 output'], ['/1Q', 'out', 'Flip-flop 1 inverted output'], GND,
    ['/2Q', 'out', 'Flip-flop 2 inverted output'], ['2Q', 'out', 'Flip-flop 2 output'], ['/2PRE', 'in', 'Flip-flop 2 asynchronous preset, active low'],
    ['2CLK', 'in', 'Flip-flop 2 clock (rising edge)'], ['/2K', 'in', 'Flip-flop 2 K input, active low'], ['2J', 'in', 'Flip-flop 2 J input'],
    ['/2CLR', 'in', 'Flip-flop 2 asynchronous clear, active low'], VCC,
  ] as PinRow[],

  // 74HC173: 4-bit D register with 3-state outputs
  hc173: [
    ['/M', 'in', 'Output enable 1, active low'], ['/N', 'in', 'Output enable 2, active low'],
    ['Q0', 'out', 'Output 0 (3-state)'], ['Q1', 'out', 'Output 1 (3-state)'], ['Q2', 'out', 'Output 2 (3-state)'], ['Q3', 'out', 'Output 3 (3-state)'],
    ['CP', 'in', 'Clock (rising edge)'], GND,
    ['/G1', 'in', 'Data enable 1, active low'], ['/G2', 'in', 'Data enable 2, active low'],
    ['D3', 'in', 'Data input 3'], ['D2', 'in', 'Data input 2'], ['D1', 'in', 'Data input 1'], ['D0', 'in', 'Data input 0'],
    ['MR', 'in', 'Master reset, active high, asynchronous'], VCC,
  ] as PinRow[],

  // 74HC193: 4-bit up/down counter with separate clocks
  hc193: [
    ['D1', 'in', 'Preset data bit 1'], ['Q1', 'out', 'Count bit 1'], ['Q0', 'out', 'Count bit 0 (LSB)'],
    ['CPD', 'in', 'Count-down clock (rising edge)'], ['CPU', 'in', 'Count-up clock (rising edge)'],
    ['Q2', 'out', 'Count bit 2'], ['Q3', 'out', 'Count bit 3 (MSB)'], GND,
    ['D3', 'in', 'Preset data bit 3'], ['D2', 'in', 'Preset data bit 2'], ['/PL', 'in', 'Parallel load, active low, asynchronous'],
    ['/TCU', 'out', 'Terminal count up (carry), active low'], ['/TCD', 'out', 'Terminal count down (borrow), active low'],
    ['MR', 'in', 'Master reset, active high, asynchronous'], ['D0', 'in', 'Preset data bit 0 (LSB)'], VCC,
  ] as PinRow[],

  // 74HC161 and 74HC160: synchronous 4-bit counters
  hc161: [
    ['/MR', 'in', 'Master reset, active low (asynchronous on the 161)'], ['CP', 'in', 'Clock (rising edge)'],
    ['D0', 'in', 'Preset data bit 0 (LSB)'], ['D1', 'in', 'Preset data bit 1'], ['D2', 'in', 'Preset data bit 2'], ['D3', 'in', 'Preset data bit 3 (MSB)'],
    ['CEP', 'in', 'Count enable parallel: counts only while CEP and CET are high'], GND,
    ['/PE', 'in', 'Parallel enable, active low: loads D on the next clock edge'], ['CET', 'in', 'Count enable trickle, also enables TC'],
    ['Q3', 'out', 'Count bit 3 (MSB)'], ['Q2', 'out', 'Count bit 2'], ['Q1', 'out', 'Count bit 1'], ['Q0', 'out', 'Count bit 0 (LSB)'],
    ['TC', 'out', 'Terminal count: high at the last count while CET is high'], VCC,
  ] as PinRow[],

  // 74HC194: 4-bit bidirectional universal shift register
  hc194: [
    ['/MR', 'in', 'Master reset, active low, asynchronous'], ['DSR', 'in', 'Serial data in for shift right'],
    ['D0', 'in', 'Parallel data 0'], ['D1', 'in', 'Parallel data 1'], ['D2', 'in', 'Parallel data 2'], ['D3', 'in', 'Parallel data 3'],
    ['DSL', 'in', 'Serial data in for shift left'], GND,
    ['S0', 'in', 'Mode select 0'], ['S1', 'in', 'Mode select 1'], ['CP', 'in', 'Clock (rising edge)'],
    ['Q3', 'out', 'Output 3'], ['Q2', 'out', 'Output 2'], ['Q1', 'out', 'Output 1'], ['Q0', 'out', 'Output 0'], VCC,
  ] as PinRow[],

  // 74HC273: octal D flip-flop with clear
  hc273: [
    ['/MR', 'in', 'Master reset, active low, asynchronous'], ['Q0', 'out', 'Output 0'], ['D0', 'in', 'Data input 0'],
    ['D1', 'in', 'Data input 1'], ['Q1', 'out', 'Output 1'], ['Q2', 'out', 'Output 2'], ['D2', 'in', 'Data input 2'],
    ['D3', 'in', 'Data input 3'], ['Q3', 'out', 'Output 3'], GND, ['CP', 'in', 'Clock (rising edge)'],
    ['Q4', 'out', 'Output 4'], ['D4', 'in', 'Data input 4'], ['D5', 'in', 'Data input 5'], ['Q5', 'out', 'Output 5'],
    ['Q6', 'out', 'Output 6'], ['D6', 'in', 'Data input 6'], ['D7', 'in', 'Data input 7'], ['Q7', 'out', 'Output 7'], VCC,
  ] as PinRow[],

  // 74HC373: octal transparent latch, 3-state
  hc373: [
    ['/OE', 'in', 'Output enable, active low'], ['Q0', 'out', 'Output 0 (3-state)'], ['D0', 'in', 'Data input 0'],
    ['D1', 'in', 'Data input 1'], ['Q1', 'out', 'Output 1 (3-state)'], ['Q2', 'out', 'Output 2 (3-state)'], ['D2', 'in', 'Data input 2'],
    ['D3', 'in', 'Data input 3'], ['Q3', 'out', 'Output 3 (3-state)'], GND, ['LE', 'in', 'Latch enable: transparent while high'],
    ['Q4', 'out', 'Output 4 (3-state)'], ['D4', 'in', 'Data input 4'], ['D5', 'in', 'Data input 5'], ['Q5', 'out', 'Output 5 (3-state)'],
    ['Q6', 'out', 'Output 6 (3-state)'], ['D6', 'in', 'Data input 6'], ['D7', 'in', 'Data input 7'], ['Q7', 'out', 'Output 7 (3-state)'], VCC,
  ] as PinRow[],

  // 74HC164: 8-bit serial-in parallel-out shift register
  hc164: [
    ['DSA', 'in', 'Serial data input A'], ['DSB', 'in', 'Serial data input B (AND-ed with A)'],
    ['Q0', 'out', 'Output 0'], ['Q1', 'out', 'Output 1'], ['Q2', 'out', 'Output 2'], ['Q3', 'out', 'Output 3'], GND,
    ['CP', 'in', 'Clock (rising edge)'], ['/MR', 'in', 'Master reset, active low, asynchronous'],
    ['Q4', 'out', 'Output 4'], ['Q5', 'out', 'Output 5'], ['Q6', 'out', 'Output 6'], ['Q7', 'out', 'Output 7'], VCC,
  ] as PinRow[],

  // ATmega328P in DIP-28 (the chip on an Uno)
  atmega328p: [
    ['RESET', 'io', 'Reset (PC6), active low'], ['PD0', 'io', 'Digital pin 0 (RX)'], ['PD1', 'io', 'Digital pin 1 (TX)'],
    ['PD2', 'io', 'Digital pin 2'], ['PD3', 'io', 'Digital pin 3 (PWM)'], ['PD4', 'io', 'Digital pin 4'], ['VCC', 'power', 'Digital supply'],
    ['GND1', 'power', 'Ground'], ['PB6', 'io', 'Crystal 1'], ['PB7', 'io', 'Crystal 2'], ['PD5', 'io', 'Digital pin 5 (PWM)'],
    ['PD6', 'io', 'Digital pin 6 (PWM)'], ['PD7', 'io', 'Digital pin 7'], ['PB0', 'io', 'Digital pin 8'], ['PB1', 'io', 'Digital pin 9 (PWM)'],
    ['PB2', 'io', 'Digital pin 10 (PWM)'], ['PB3', 'io', 'Digital pin 11 (PWM)'], ['PB4', 'io', 'Digital pin 12'], ['PB5', 'io', 'Digital pin 13 (LED)'],
    ['AVCC', 'power', 'Analog supply'], ['AREF', 'in', 'Analog reference'], ['GND2', 'power', 'Ground'],
    ['PC0', 'io', 'Analog pin A0'], ['PC1', 'io', 'Analog pin A1'], ['PC2', 'io', 'Analog pin A2'], ['PC3', 'io', 'Analog pin A3'],
    ['PC4', 'io', 'Analog pin A4 (SDA)'], ['PC5', 'io', 'Analog pin A5 (SCL)'],
  ] as PinRow[],

  // HD44780 16-pin LCD module header
  hd44780: [
    ['VSS', 'power', 'Ground'], ['VDD', 'power', 'Supply, 5 V'], ['V0', 'in', 'Contrast: wiper of a 10 kΩ potentiometer'],
    ['RS', 'in', 'Register select: 0 = command, 1 = character data'], ['RW', 'in', 'Read/write: tie to ground to only write'],
    ['E', 'in', 'Enable: data is taken on the falling edge'],
    ['D0', 'io', 'Data bit 0 (unused in 4-bit mode)'], ['D1', 'io', 'Data bit 1 (unused in 4-bit mode)'],
    ['D2', 'io', 'Data bit 2 (unused in 4-bit mode)'], ['D3', 'io', 'Data bit 3 (unused in 4-bit mode)'],
    ['D4', 'io', 'Data bit 4'], ['D5', 'io', 'Data bit 5'], ['D6', 'io', 'Data bit 6'], ['D7', 'io', 'Data bit 7'],
    ['A', 'power', 'Backlight anode (through a resistor)'], ['K', 'power', 'Backlight cathode'],
  ] as PinRow[],
};

/** Unique key of a pin: its name, with a leading "/" when it is active low. */
export const pinKey = (p: DatasheetPin) => (p.low ? `/${p.name}` : p.name);

/** Looks a pin up by key ("/1Q") or plain name ("1Q"); the exact key wins. */
export function findPin(pins: DatasheetPin[], real: string): DatasheetPin | undefined {
  return pins.find((p) => pinKey(p) === real) ?? pins.find((p) => p.name === real);
}
