import { SignalValue } from './circuit';

export type ClockStartState = 'low' | 'high';

export interface ClockConfig {
  frequencyHz: number; // e.g. 1, 2, 5, 10, or custom (Hz)
  startState: ClockStartState; // 'low' (0) or 'high' (1)
  isCustomFreq?: boolean;
}

export interface ClockState {
  status: 'stopped' | 'running' | 'paused';
  tickCount: number;
  outputValue: SignalValue;
}

export const DEFAULT_CLOCK_CONFIG: ClockConfig = {
  frequencyHz: 1,
  startState: 'low',
  isCustomFreq: false,
};

export const DEFAULT_CLOCK_STATE: ClockState = {
  status: 'stopped',
  tickCount: 0,
  outputValue: 0,
};
