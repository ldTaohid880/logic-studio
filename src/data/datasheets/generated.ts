import { GateType } from '../../types/circuit';
import { getComponentInfo } from '../components';
import { Datasheet } from './types';

/** Plain-language text for parts that are not a single standard chip (or not a chip at all). */
interface Extra {
  how: string[];
  nearest?: string[];
  note?: string;
  apps?: string[];
  pitfalls?: string[];
  related?: GateType[];
}

const EXTRA: Partial<Record<GateType, Extra>> = {
  INPUT: { how: ['A switch you click to flip between 0 and 1. It is the simplest way to feed a signal into a circuit.', 'In a real circuit this is a toggle or slide switch with a pull-up or pull-down resistor, so the input is never left floating.'], nearest: ['SPST toggle switch', 'slide switch with a 10 kΩ pull-down'], apps: ['Test inputs while you build a circuit.'], related: ['PUSH_BUTTON', 'DIP_SWITCH', 'CONST_HIGH'] },
  PUSH_BUTTON: { how: ['Outputs 1 while you hold it and 0 when released. Click and hold on the canvas.', 'Real buttons bounce: the contact chatters for a few milliseconds. Use a latch or a debounce circuit before a counter or clock.'], nearest: ['tactile push button with a pull-down resistor'], pitfalls: ['Mechanical switch bounce makes a counter count several times for one press.'], related: ['INPUT', 'SR_LATCH'] },
  DIP_SWITCH: { how: ['A row of 2, 4 or 8 small switches in one package. Each switch is an independent output.', 'Useful for setting a binary number or a configuration by hand.'], nearest: ['4- or 8-position DIP switch with pull-down resistors'], related: ['INPUT', 'BUS_JOIN'] },
  CLOCK: { how: ['A square wave that ticks on its own. Adding a clock to a circuit brings the run controls and the timing diagram.', 'Sequential parts such as flip-flops and counters act on its rising edge.'], nearest: ['555 timer in astable mode', 'crystal oscillator module'], pitfalls: ['A very fast clock makes the timing diagram hard to read. Pick a rate you can follow.'], related: ['D_FLIPFLOP', 'COUNTER_4BIT', 'PUSH_BUTTON'] },
  CONST_HIGH: { how: ['A fixed 1, the supply voltage (VCC). Use it to tie an input permanently high.'], nearest: ['a wire to VCC (often through a 10 kΩ resistor)'], related: ['CONST_LOW', 'PULL_UP'] },
  CONST_LOW: { how: ['A fixed 0, ground (GND). Use it to tie an input permanently low.'], nearest: ['a wire to GND'], related: ['CONST_HIGH', 'PULL_DOWN'] },
  OUTPUT: { how: ['An LED that lights when its input is 1. Its pin shows 1, 0 or a floating level.', 'A real LED needs a series resistor (about 330 Ω at 5 V) and glows by the current through it.'], nearest: ['5 mm LED with a 330 Ω series resistor'], pitfalls: ['Never connect an LED straight across the supply without a resistor.'], related: ['LOGIC_PROBE', 'BUZZER'] },
  LOGIC_PROBE: { how: ['Shows the level on a wire: 1, 0 or ? when floating. It does not change the circuit.', 'Unlike an LED it can tell a floating wire from a low one.'], nearest: ['a logic probe tool or an oscilloscope probe'], related: ['OUTPUT', 'BUS_MONITOR'] },
  BUZZER: { how: ['Makes a tone while its input is 1. When driven by a clock or a board pin it sounds at that frequency, once you turn sound on.'], nearest: ['active or passive piezo buzzer'], pitfalls: ['A passive buzzer needs a square wave at the pitch you want; an active one makes its own tone.'], related: ['ARDUINO_UNO', 'CLOCK'] },
  SEVEN_SEGMENT: { how: ['A display made of seven bar segments plus a decimal point that draws the digits 0 to 9. In Logic Studio you feed it a 4-bit number.', 'Real displays need one resistor per segment and are either common-cathode or common-anode.'], nearest: ['common-cathode 7-segment LED display', '74HC4511 to drive it'], related: ['DECODER_BCD_TO_7SEG', 'HEX_DISPLAY'] },
  HEX_DISPLAY: { how: ['Shows a 4-bit value as one hex digit, 0 to F.'], nearest: ['7-segment display with a decoder that also shows A to F (for example a microcontroller driver)'], related: ['SEVEN_SEGMENT', 'BUS_MONITOR'] },
  BUS_MONITOR: { how: ['Shows a 2 to 8 bit value as a number in hex, decimal or binary. It reads single wires, bit 0 first.'], nearest: ['a row of LEDs, or a logic analyser'], related: ['HEX_DISPLAY', 'BUS_JOIN'] },
  BUS_JOIN: { how: ['Bundles 2, 4 or 8 wires into one thick bus wire, so a word travels as a unit.', 'Real buses are just wires drawn together; this part only tidies the drawing.'], nearest: ['a ribbon cable or parallel wires'], related: ['BUS_SPLIT', 'BUS_MONITOR'] },
  BUS_SPLIT: { how: ['Splits a bus wire back into single wires.'], nearest: ['a ribbon cable broken out into single wires'], related: ['BUS_JOIN', 'BUS_MONITOR'] },
  TUNNEL: { how: ['Connects to every other tunnel with the same tag, without a wire across the canvas. It keeps big diagrams tidy.', 'It exists only in the drawing; a real circuit would just use a wire.'], nearest: ['a wire'], related: ['DELAY_ELEMENT', 'BUS_JOIN'] },
  TEXT_LABEL: { how: ['A text note on the canvas. It does nothing to the signals.'], nearest: ['a silkscreen label or a comment'], related: ['TUNNEL'] },
  HALF_ADDER: { how: ['Adds two bits. Sum is the XOR of the inputs and Cout (carry) is the AND: 1 + 1 gives sum 0 and carry 1.', 'It is called "half" because it cannot take a carry in. Chain two half adders and an OR gate to make a full adder.'], nearest: ['74HC86 (XOR) plus 74HC08 (AND)'], apps: ['The first stage of an adder.', 'Counting one bit.'], related: ['FULL_ADDER', 'XOR', 'AND'] },
  FULL_ADDER: { how: ['Adds two bits and a carry in, giving a sum and a carry out. Sum = A ⊕ B ⊕ Cin; the carry is 1 when at least two inputs are 1.', 'Chain full adders, carry out to carry in, to add numbers of any length.'], nearest: ['one stage of a 74HC283', '74HC86 and 74HC08 gates'], apps: ['Building multi-bit adders.'], related: ['ADDER_4BIT', 'HALF_ADDER'] },
  HALF_SUBTRACTOR: { how: ['Subtracts B from A. The difference is A ⊕ B and the borrow is 1 only when A = 0 and B = 1.'], nearest: ['74HC86 (XOR) plus 74HC04 and 74HC08'], related: ['FULL_SUBTRACTOR', 'HALF_ADDER'] },
  FULL_SUBTRACTOR: { how: ['Subtracts B and a borrow in from A. It gives a difference and a borrow out, and chains like a full adder.'], nearest: ['74HC283 adder with inverted B (two\'s complement)'], related: ['HALF_SUBTRACTOR', 'ADDER_SUBTRACTOR_4BIT'] },
  ADDER_SUBTRACTOR_4BIT: { how: ['Adds A and B when SUB = 0 and subtracts B from A when SUB = 1. Inside, SUB inverts B with XOR gates and feeds the carry in.', 'This is how a simple CPU does both operations with one adder.'], nearest: ['74HC283 with four 74HC86 XOR gates on the B inputs'], related: ['ADDER_4BIT', 'ALU_4BIT_8FN'] },
  INCREMENTER_4BIT: { how: ['Adds 1 to a 4-bit number. Cout is 1 when it wraps from 15 to 0.'], nearest: ['74HC283 with B = 0000 and Cin = 1'], related: ['DECREMENTER_4BIT', 'ADDER_4BIT', 'COUNTER_4BIT'] },
  DECREMENTER_4BIT: { how: ['Subtracts 1 from a 4-bit number. Cout is 1 when it wraps from 0 to 15.'], nearest: ['74HC283 with B = 1111 and Cin = 0'], related: ['INCREMENTER_4BIT', 'ADDER_4BIT'] },
  ALU_4BIT_8FN: { how: ['An arithmetic logic unit does the calculations in a CPU. Select one of eight operations with S2 S1 S0: add, subtract, AND, OR, XOR, NOT A, A + 1 and A − 1.', 'C reports a carry or borrow, and Z is 1 when the result is zero.'], nearest: ['74181 4-bit ALU (TTL, 16 functions)', '74HC283 plus gates and multiplexers'], note: 'The classic 74181 has a different set of functions and pin layout; this part is a simplified teaching ALU.', related: ['ADDER_4BIT', 'ADDER_SUBTRACTOR_4BIT', 'MUX_8TO1'] },
  PRIORITY_ENCODER: { how: ['Outputs the number of the highest active input of four (I3 wins). V says whether any input was active.'], nearest: ['74HC148 (8-line version, active-low)', '74HC147 (decimal to BCD)'], related: ['ENCODER_8TO3', 'DECODER_3TO8'] },
  PARITY_CHECKER: { how: ['Counts the ones in four data bits plus a parity bit. ERR is 1 when that total is odd, meaning an error was detected (even parity).'], nearest: ['74HC280 used as a checker'], related: ['PARITY_GENERATOR', 'XOR'] },
  ROM_16X4: { how: ['Sixteen 4-bit words that you set in the properties panel. The four address lines choose the word shown on Q0–Q3.', 'A ROM (read-only memory) keeps its contents without power and can implement any truth table with four inputs and four outputs.'], nearest: ['small PROM or EPROM such as the 27C64 (8 K × 8)', 'a 74HC151 or a diode matrix for tiny tables'], related: ['RAM_16X4', 'DECODER_4TO16_HC'] },
};

export function generateDatasheet(type: GateType): Datasheet {
  const info = getComponentInfo(type);
  const extra = EXTRA[type];
  return {
    type,
    title: info.name,
    partNumber: info.partNumber,
    summary: info.description ? `${info.description}.` : `${info.name} is a part of Logic Studio.`,
    howItWorks: extra?.how ?? [`${info.description || info.name}.`, 'Open the properties panel after you place the part to see its settings.'],
    noStandardChip: { nearest: extra?.nearest ?? [], note: extra?.note },
    logicFamily: undefined,
    applications: extra?.apps ?? [],
    pitfalls: extra?.pitfalls ?? [],
    simNotes: ['Power and ground are implied; there are no VCC or GND pins to wire up.', 'Signals are 0, 1 or floating (?). Gates react at once unless a gate delay is set in the timing panel.'],
    related: extra?.related ?? [],
    generated: true,
  };
}
