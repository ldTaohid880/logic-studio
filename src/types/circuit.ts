import { EncoderConfig, EncoderState } from './encoder';
import { SevenSegmentConfig } from './sevenSegment';
import { ClockConfig, ClockState } from './clock';
import { MultiInputConfig } from './multiInput';

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
  | 'CLOCK'
  | 'SEVEN_SEGMENT'
  | 'ENCODER'
  | 'MULTI_INPUT';

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
  value?: SignalValue; // For INPUT or OUTPUT node
  inputCount?: number; // For configurable gate inputs (e.g., 2, 3, 4)
  frequencyMs?: number; // For CLOCK node (ms pulse interval)
  clockConfig?: ClockConfig;
  clockState?: ClockState;
  multiInputConfig?: MultiInputConfig;
  encoderConfig?: EncoderConfig;
  encoderState?: EncoderState;
  sevenSegmentConfig?: SevenSegmentConfig;
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
