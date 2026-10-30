import { describe, it, expect } from 'vitest';
import { clockValueAt, nextClockEdgeAfter } from './clockLogic';
import { DEFAULT_CLOCK_CONFIG, DEFAULT_CLOCK_STATE, ClockConfig } from '../types/clock';

const running = { ...DEFAULT_CLOCK_STATE, status: 'running' as const };

describe('clockLogic', () => {
  it('produces a 50% duty waveform starting low', () => {
    const cfg: ClockConfig = { ...DEFAULT_CLOCK_CONFIG, frequencyHz: 1 };
    expect(clockValueAt(cfg, running, 100)).toBe(0);
    expect(clockValueAt(cfg, running, 600)).toBe(1);
    expect(clockValueAt(cfg, running, 1100)).toBe(0);
  });

  it('finds every edge of a fast clock', () => {
    const cfg: ClockConfig = { ...DEFAULT_CLOCK_CONFIG, frequencyHz: 100 }; // 10 ms period
    let t = 0;
    let rising = 0;
    let prev = clockValueAt(cfg, running, t);
    for (;;) {
      const next = nextClockEdgeAfter(cfg, running, t);
      if (next === null || next > 100) break;
      t = next;
      const v = clockValueAt(cfg, running, t);
      expect(v).not.toBe(prev);
      if (v === 1) rising++;
      prev = v;
    }
    expect(rising).toBe(10);
  });

  it('keeps phase relative to its origin', () => {
    const cfg: ClockConfig = { ...DEFAULT_CLOCK_CONFIG, frequencyHz: 1 };
    const shifted = { ...running, phaseOriginMs: 300 };
    expect(clockValueAt(cfg, shifted, 600)).toBe(0);
    expect(clockValueAt(cfg, shifted, 850)).toBe(1);
  });
});
