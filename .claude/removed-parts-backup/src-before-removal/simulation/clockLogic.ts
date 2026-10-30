import { SignalValue } from '../types/circuit';
import { ClockConfig, ClockState, toHz } from '../types/clock';

function getPeriodMs(config: ClockConfig): number | null {
  const hz = toHz(config.frequencyHz, config.frequencyUnit || 'Hz');
  if (!(hz > 0)) return null;
  return 1000 / hz;
}

function getPhase(state: ClockState, periodMs: number, timeMs: number): number {
  const phase = (timeMs - (state.phaseOriginMs ?? 0)) % periodMs;
  return phase < 0 ? phase + periodMs : phase;
}

/**
 * Phase boundaries (in ms within one period) where the clock output changes.
 */
function getEdgePhases(config: ClockConfig, periodMs: number): number[] {
  const dutyRatio = (config.dutyCycle ?? 50) / 100;
  return config.startState === 'high' ? [periodMs * dutyRatio, periodMs] : [periodMs * (1 - dutyRatio), periodMs];
}

export function isClockRunning(config: ClockConfig, state: ClockState): boolean {
  return state.status === 'running' && config.enabled !== false;
}

/**
 * Clock output level at a given simulation time.
 */
export function clockValueAt(config: ClockConfig, state: ClockState, timeMs: number): SignalValue {
  const periodMs = getPeriodMs(config);
  if (periodMs === null) return config.startState === 'high' ? 1 : 0;

  const phase = getPhase(state, periodMs, timeMs);
  const dutyRatio = (config.dutyCycle ?? 50) / 100;
  const isHigh = config.startState === 'high'
    ? phase < periodMs * dutyRatio
    : phase >= periodMs * (1 - dutyRatio);
  return isHigh ? 1 : 0;
}

/**
 * Simulation time of the first output change strictly after timeMs, or null if the clock is static.
 */
export function nextClockEdgeAfter(config: ClockConfig, state: ClockState, timeMs: number): number | null {
  const periodMs = getPeriodMs(config);
  if (periodMs === null) return null;

  const phase = getPhase(state, periodMs, timeMs);
  const epsilon = periodMs * 1e-9;
  const boundary = getEdgePhases(config, periodMs).find((b) => b > phase + epsilon) ?? periodMs + getEdgePhases(config, periodMs)[0];
  return timeMs + (boundary - phase);
}
