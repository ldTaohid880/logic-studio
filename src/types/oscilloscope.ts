export type TriggerMode = 'auto' | 'rising' | 'falling';
export type WaveColor = 'cyan' | 'emerald' | 'amber' | 'purple' | 'rose';

export interface OscilloscopeConfig {
  sampleRateHz: number; // e.g., 100, 500, 1000 Hz
  timePerDivMs: number; // e.g., 1, 5, 10, 25, 50, 100 ms/div
  bufferSize: number; // e.g., 200, 500, 1000, 2000 samples
  triggerMode: TriggerMode;
  autoScroll: boolean;
  waveColor: WaveColor;
  gridVisible: boolean;
  showLabels: boolean;
  isPaused: boolean;
  selectedBitIndex: number; // For multi-bit bus inputs
}

export interface OscilloscopeState {
  samples: number[]; // Circular buffer of signal values (0 or 1)
  writeIndex: number;
  triggerFired: boolean;
  lastSampleVal: number;
}

export const DEFAULT_OSCILLOSCOPE_CONFIG: OscilloscopeConfig = {
  sampleRateHz: 500,
  timePerDivMs: 10,
  bufferSize: 500,
  triggerMode: 'auto',
  autoScroll: true,
  waveColor: 'cyan',
  gridVisible: true,
  showLabels: true,
  isPaused: false,
  selectedBitIndex: 0,
};

export const COLOR_MAP: Record<WaveColor, { line: string; glow: string; text: string; bg: string }> = {
  cyan: { line: '#22d3ee', glow: '#06b6d4', text: 'text-cyan-400', bg: 'bg-cyan-500' },
  emerald: { line: '#34d399', glow: '#059669', text: 'text-emerald-400', bg: 'bg-emerald-500' },
  amber: { line: '#fbbf24', glow: '#d97706', text: 'text-amber-400', bg: 'bg-amber-500' },
  purple: { line: '#c084fc', glow: '#9333ea', text: 'text-purple-400', bg: 'bg-purple-500' },
  rose: { line: '#f43f5e', glow: '#e11d48', text: 'text-rose-400', bg: 'bg-rose-500' },
};
