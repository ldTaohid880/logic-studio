import { EncoderConfig, EncoderState } from './encoder';
import { SevenSegmentConfig } from './sevenSegment';
import { ClockConfig, ClockState } from './clock';
import { MultiInputConfig } from './multiInput';

export type SignalValue = 0 | 1 | -1; // 0 = LOW, 1 = HIGH, -1 = UNKNOWN/FLOATING

import { OscilloscopeConfig, OscilloscopeState } from './oscilloscope';

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
  | 'CLOCK'
  | 'CONST_HIGH'
  | 'CONST_LOW'
  | 'MULTI_INPUT'
  | 'RGB_LED'
  | 'LOGIC_PROBE'
  | 'SEVEN_SEGMENT'
  | 'HEX_DISPLAY'
  | 'BUS_MONITOR'
  | 'OSCILLOSCOPE'
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
  | 'SHIFT_REGISTER_4BIT'
  | 'UP_COUNTER_4BIT'
  | 'DOWN_COUNTER_4BIT'
  // Phase 2 Combinational
  | 'MUX_8TO1'
  | 'DEMUX_1TO8'
  | 'DECODER_3TO8'
  | 'DECODER_4TO16'
  | 'ENCODER_8TO3'
  | 'PARITY_GENERATOR'
  | 'PARITY_CHECKER'
  | 'CONVERTER_BIN_TO_GRAY'
  | 'CONVERTER_GRAY_TO_BIN'
  // Phase 2 Sequential
  | 'T_FLIPFLOP'
  | 'RING_COUNTER'
  | 'RIPPLE_COUNTER'
  | 'SYNCHRONOUS_COUNTER'
  | 'UP_DOWN_COUNTER'
  | 'FREQUENCY_DIVIDER'
  // Phase 2 Arithmetic
  | 'INCREMENTER_4BIT'
  | 'DECREMENTER_4BIT'
  | 'ADDER_SUBTRACTOR_4BIT'
  | 'ALU_4BIT'
  // Phase 2 Utility
  | 'BUS_SPLITTER'
  | 'BUS_JOINER'
  | 'BUS_TAP'
  | 'BIT_EXTRACTOR'
  | 'DELAY_ELEMENT'
  | 'TUNNEL'
  | 'TEXT_LABEL'
  // Configurable Components Family
  | 'CFG_ENCODER'
  | 'CFG_DECODER'
  | 'CFG_MUX'
  | 'CFG_DEMUX'
  | 'CFG_COMPARATOR'
  | 'CFG_REGISTER'
  | 'CFG_SHIFT_REGISTER'
  | 'CFG_COUNTER'
  | 'CFG_CONSTANT'
  | 'CFG_BUS_SPLITTER'
  | 'CFG_BUS_JOINER';

export interface PinData {
  id: string;
  name: string;
  value: SignalValue;
}

export interface NodeData {
  label: string;
  gateType: GateType;
  inputs: PinData[];
  outputs: PinData[];
  value?: SignalValue; // For INPUT, OUTPUT, PUSH_BUTTON, CONST_HIGH, CONST_LOW
  inputCount?: number; // For configurable gate inputs (e.g., 2, 3, 4)
  bitWidth?: number; // For DIP switch, bus monitor, counters (2, 4, 8)
  activeLow?: boolean; // For active low enable/reset controls
  displayFormat?: 'hex' | 'dec' | 'bin';
  dipValues?: number[]; // For DIP_SWITCH node bit states
  icState?: Record<string, any>; // Internal sequential memory state (q, qPrev, prevClk, etc.)
  tunnelLabel?: string; // For TUNNEL node wireless connection
  annotationText?: string; // For TEXT_LABEL node
  fontSize?: number; // For TEXT_LABEL node
  isLocked?: boolean; // Position lock flag
  aluOp?: number; // ALU operation mode
  frequencyMs?: number; // For CLOCK node (ms pulse interval)
  clockConfig?: ClockConfig;
  clockState?: ClockState;
  multiInputConfig?: MultiInputConfig;
  encoderConfig?: EncoderConfig;
  encoderState?: EncoderState;
  sevenSegmentConfig?: SevenSegmentConfig;
  scopeConfig?: OscilloscopeConfig;
  scopeState?: OscilloscopeState;
  cfgEncoderConfig?: any;
  cfgDecoderConfig?: any;
  cfgMuxConfig?: any;
  cfgDemuxConfig?: any;
  cfgComparatorConfig?: any;
  cfgRegisterConfig?: any;
  cfgShiftRegisterConfig?: any;
  cfgCounterConfig?: any;
  cfgConstantConfig?: any;
  cfgBusSplitterConfig?: any;
  cfgBusJoinerConfig?: any;
  [key: string]: unknown;
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  speed: number; // 1, 2, 5, 10
  stepCount: number;
  loopMode: boolean;
}

export interface CircuitPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: any[];
  edges: any[];
}
