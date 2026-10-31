import { EncoderConfig, EncoderState } from './encoder';
import { SevenSegmentConfig, SevenSegmentColor } from './sevenSegment';

export type SignalValue = 0 | 1 | -1; // 0 = LOW, 1 = HIGH, -1 = UNKNOWN/FLOATING

export type GateType = 
  | 'INPUT' 
  | 'OUTPUT' 
  | 'AND' 
  | 'OR' 
  | 'NOT' 
  | 'NAND' 
  | 'NOR' 
  | 'XOR' 
  | 'XNOR'
  | 'BUFFER'
  | 'TRI_STATE_BUFFER'
  | 'PUSH_BUTTON'
  | 'DIP_SWITCH'
  | 'CONST_HIGH'
  | 'CONST_LOW'
  | 'LOGIC_PROBE'
  | 'SEVEN_SEGMENT'
  | 'HEX_DISPLAY'
  | 'BUS_MONITOR'
  | 'HALF_SUBTRACTOR'
  | 'FULL_SUBTRACTOR'
  | 'MUX_4TO1'
  | 'DEMUX_1TO4'
  | 'ENCODER'
  | 'PRIORITY_ENCODER'
  | 'COMPARATOR_4BIT'
  | 'DECODER_BCD_TO_7SEG'
  | 'D_LATCH'
  | 'JK_FLIPFLOP'
  | 'D_FLIPFLOP'
  | 'SR_LATCH'
  | 'MUX_2TO1'
  | 'REGISTER_4BIT'
  // Combinational
  | 'MUX_8TO1'
  | 'DEMUX_1TO8'
  | 'DECODER_3TO8'
  | 'ENCODER_8TO3'
  | 'PARITY_GENERATOR'
  | 'PARITY_CHECKER'
  // Sequential
  | 'T_FLIPFLOP'
  | 'COUNTER_4BIT'
  | 'COUNTER_LOAD_4BIT'
  | 'DECADE_COUNTER'
  | 'SHIFT_REG_UNIVERSAL'
  | 'DECODER_4TO16_HC'
  | 'REGISTER_8BIT'
  | 'LATCH_8BIT'
  | 'SHIFT_REG_4BIT'
  | 'RAM_16X4'
  | 'ROM_16X4'
  // Clocked and programmable parts
  | 'CLOCK'
  | 'ARDUINO_UNO'
  // Sensor modules with a digital output
  | 'SENSOR_LIGHT'
  | 'SENSOR_TEMPERATURE'
  | 'SENSOR_OBSTACLE'
  | 'SENSOR_MOTION'
  // Arithmetic
  | 'HALF_ADDER'
  | 'FULL_ADDER'
  | 'ADDER_4BIT'
  | 'INCREMENTER_4BIT'
  | 'DECREMENTER_4BIT'
  | 'ADDER_SUBTRACTOR_4BIT'
  | 'ALU_4BIT_8FN'
  // Utility
  | 'DELAY_ELEMENT'
  | 'TUNNEL'
  | 'BUS_JOIN'
  | 'BUS_SPLIT'
  | 'PULL_UP'
  | 'PULL_DOWN'
  | 'OPEN_DRAIN_BUFFER'
  | 'TEXT_LABEL'
  // Custom Component / Subcircuit
  | 'CUSTOM';

export interface PinData {
  id: string;
  name: string;
  value: SignalValue;
  driven?: boolean; // Set while a wire drives this input pin; used to float the pin once the wire is removed
  width?: number; // Bus pins: number of bits (2–8); the pin carries `bus` and `value` stays -1
  bus?: SignalValue[]; // Bus pins: one level per bit, least significant first
}

export interface NodeData {
  label: string;
  gateType: GateType;
  inputs: PinData[];
  outputs: PinData[];
  customComponentId?: string; // Reference ID of CustomComponentDefinition
  customPinConfig?: {
    inputs: { id: string; name: string; description?: string }[];
    outputs: { id: string; name: string; description?: string }[];
  };
  subcircuitNodeStates?: Record<string, any>; // Internal node states for this specific instance
  value?: SignalValue; // For INPUT, OUTPUT, PUSH_BUTTON, CONST_HIGH, CONST_LOW
  inputCount?: number; // Number of inputs on AND/OR/XOR-family gates (2, 3 or 4)
  bitWidth?: number; // For DIP switch and bus monitor (2, 4, 8)
  activeLow?: boolean; // For active low enable/reset controls
  displayFormat?: 'hex' | 'dec' | 'bin';
  displayColor?: SevenSegmentColor; // LED, hex digit and bus value color (7-segment uses sevenSegmentConfig.color)
  dipValues?: number[]; // For DIP_SWITCH node bit states
  icState?: Record<string, any>; // Internal sequential memory state (q, qPrev, prevClk, etc.)
  tunnelLabel?: string; // For TUNNEL node wireless connection
  annotationText?: string; // For TEXT_LABEL node
  fontSize?: number; // For TEXT_LABEL node
  isLocked?: boolean; // Position lock flag
  encoderConfig?: EncoderConfig;
  encoderState?: EncoderState;
  sevenSegmentConfig?: SevenSegmentConfig;
  pinAliases?: Record<string, string>;
  clockHz?: number; // CLOCK: frequency in simulated time
  romContents?: number[]; // ROM_16X4: the 4-bit value stored at each of the 16 addresses
  firmware?: BoardFirmware; // ARDUINO_UNO: the loaded program
  sensorLevel?: number; // Sensors: what the sensor senses now (light %, °C, cm, motion 0/1)
  sensorThreshold?: number; // Sensors: where the module's output switches
  [key: string]: unknown;
}

/** A compiled program loaded onto a board. */
export interface BoardFirmware {
  id: string; // Changes on every load, so the emulator restarts with the new program
  name: string; // File name, shown on the board
  hex: string; // Intel HEX text exported by the Arduino IDE
}

export interface SimulationState {
  stepCount: number; // Number of propagation passes since the last reset
  unstableNodeIds: string[]; // Parts that never settled in the last propagation (oscillation)
  conflictNodeIds: string[]; // Parts with an input driven to different levels at once (bus conflict)
}

export interface CircuitPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: any[];
  edges: any[];
}
