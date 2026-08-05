export type LedMatrixSize = '8x8' | '16x16';
export type LedMatrixColor = 'red' | 'green' | 'blue' | 'yellow' | 'cyan';

export interface LedMatrixConfig {
  size: LedMatrixSize;
  showGrid: boolean;
  pixelSpacing: number; // Space between LEDs in pixels
  brightness: number; // 0.1 to 1.0
  rowActiveLevel: 0 | 1; // 0 = Active Low, 1 = Active High
  colActiveLevel: 0 | 1; // 0 = Active Low, 1 = Active High
  color: LedMatrixColor;
}

export const DEFAULT_LED_MATRIX_CONFIG: LedMatrixConfig = {
  size: '8x8',
  showGrid: true,
  pixelSpacing: 2,
  brightness: 1.0,
  rowActiveLevel: 1, // Row active HIGH
  colActiveLevel: 0, // Column active LOW (matching typical common anode matrix logic)
  color: 'green',
};

export const LED_MATRIX_COLORS: Record<LedMatrixColor, { label: string; active: string; inactive: string; glow: string }> = {
  red: {
    label: 'Red',
    active: '#ef4444',
    inactive: '#1a0b0b',
    glow: 'rgba(239, 68, 68, 0.65)',
  },
  green: {
    label: 'Green',
    active: '#22c55e',
    inactive: '#0b1a0f',
    glow: 'rgba(34, 197, 94, 0.65)',
  },
  blue: {
    label: 'Blue',
    active: '#3b82f6',
    inactive: '#0b111a',
    glow: 'rgba(59, 130, 246, 0.65)',
  },
  yellow: {
    label: 'Yellow',
    active: '#eab308',
    inactive: '#1a180b',
    glow: 'rgba(234, 179, 8, 0.65)',
  },
  cyan: {
    label: 'Cyan',
    active: '#06b6d4',
    inactive: '#0b1a1c',
    glow: 'rgba(6, 182, 212, 0.65)',
  },
};
