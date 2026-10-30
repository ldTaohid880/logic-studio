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
  // Arithmetic
  | 'HALF_ADDER'
  | 'FULL_ADDER'
  | 'ADDER_4BIT'
  | 'INCREMENTER_4BIT'
  | 'DECREMENTER_4BIT'
  | 'ADDER_SUBTRACTOR_4BIT'
  // Utility
  | 'DELAY_ELEMENT'
  | 'TUNNEL'
  | 'TEXT_LABEL'
  // Custom Component / Subcircuit
  | 'CUSTOM';

export interface PinData {
  id: string;
  name: string;
  value: SignalValue;
  driven?: boolean; // Set while a wire drives this input pin; used to float the pin once the wire is removed
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
  [key: string]: unknown;
}

export interface SimulationState {
  stepCount: number; // Number of propagation passes since the last reset
}

export interface CircuitPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: any[];
  edges: any[];
}
