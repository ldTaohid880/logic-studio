import { SignalValue } from './circuit';

export type ClockStartState = 'low' | 'high';
export type FrequencyUnit = 'Hz' | 'kHz' | 'MHz';

export interface ClockConfig {
  frequencyHz: number;          // Base frequency value (in the selected unit, converted to Hz for computation)
  frequencyUnit: FrequencyUnit; // Display unit
  startState: ClockStartState;  // 'low' (0) or 'high' (1)
  dutyCycle: number;            // 1–99 percent
  enabled: boolean;
  startAutomatically: boolean;
  pulseWidthMs: number;         // For manual pulse feature (ms)
}

export interface ClockState {
  status: 'stopped' | 'running' | 'paused';
  tickCount: number;
  outputValue: SignalValue;
  // Phase accumulator for simulation-accurate timing
  lastTickTime: number;         // Wall-clock timestamp of last tick (ms)
  phaseAccumulator: number;     // Accumulated time within current half-period (ms)
}

export const DEFAULT_CLOCK_CONFIG: ClockConfig = {
  frequencyHz: 1,
  frequencyUnit: 'Hz',
  startState: 'low',
  dutyCycle: 50,
  enabled: true,
  startAutomatically: true,
  pulseWidthMs: 100,
};

export const DEFAULT_CLOCK_STATE: ClockState = {
  status: 'stopped',
  tickCount: 0,
  outputValue: 0,
  lastTickTime: 0,
  phaseAccumulator: 0,
};

/**
 * Convert a display frequency + unit into raw Hz.
 * e.g. frequencyDisplay=10, unit='kHz' -> 10000 Hz
 */
export function toHz(displayValue: number, unit: FrequencyUnit): number {
  switch (unit) {
    case 'kHz': return displayValue * 1000;
    case 'MHz': return displayValue * 1_000_000;
    default: return displayValue;
  }
}

/**
 * Format a frequency value in Hz into a human-readable string with auto-unit.
 */
export function formatFrequency(hz: number, unit: FrequencyUnit): string {
  switch (unit) {
    case 'MHz': return `${(hz / 1_000_000).toFixed(hz % 1_000_000 === 0 ? 0 : 2)} MHz`;
    case 'kHz': return `${(hz / 1000).toFixed(hz % 1000 === 0 ? 0 : 2)} kHz`;
    default: return `${hz % 1 === 0 ? hz : hz.toFixed(2)} Hz`;
  }
}
