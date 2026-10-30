import { PinData } from '../types/circuit';
import { LedMatrixConfig } from '../types/ledMatrix';

export const createLedMatrixPins = (config: LedMatrixConfig): PinData[] => {
  const size = config.size === '16x16' ? 16 : 8;
  const pins: PinData[] = [];

  // Rows: in-0 to in-(N-1)
  for (let r = 0; r < size; r++) {
    pins.push({
      id: `in-${r}`,
      name: `R${r + 1}`,
      value: 0,
    });
  }

  // Columns: in-N to in-(2N-1)
  for (let c = 0; c < size; c++) {
    pins.push({
      id: `in-${size + c}`,
      name: `C${c + 1}`,
      value: 0,
    });
  }

  return pins;
};
export const createLedMatrixPinsForSize = (sizeStr: '8x8' | '16x16'): PinData[] => {
  const size = sizeStr === '16x16' ? 16 : 8;
  const pins: PinData[] = [];

  for (let r = 0; r < size; r++) {
    pins.push({
      id: `in-${r}`,
      name: `R${r + 1}`,
      value: 0,
    });
  }

  for (let c = 0; c < size; c++) {
    pins.push({
      id: `in-${size + c}`,
      name: `C${c + 1}`,
      value: 0,
    });
  }

  return pins;
};
