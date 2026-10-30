import { describe, it, expect } from 'vitest';
import { buildSevenSegmentTable } from './sevenSegmentLogic';
import { DEFAULT_SEVEN_SEGMENT_CONFIG, SevenSegmentConfig } from '../types/sevenSegment';

const config = (patch: Partial<SevenSegmentConfig>): SevenSegmentConfig => ({ ...DEFAULT_SEVEN_SEGMENT_CONFIG, ...patch });

describe('buildSevenSegmentTable', () => {
  it('lists the 16 values of a binary display with their segments', () => {
    const { inputHeaders, rows } = buildSevenSegmentTable(config({ mode: 'binary' }), []);
    expect(inputHeaders).toEqual(['D', 'C', 'B', 'A']);
    expect(rows).toHaveLength(16);
    expect(rows[0].segments.join('')).toBe('1111110'); // 0
    expect(rows[1].segments.join('')).toBe('0110000'); // 1
    expect(rows[8].segments.join('')).toBe('1111111'); // 8
    expect(rows.map((r) => r.shows).slice(9, 11)).toEqual(['9', 'A']);
  });

  it('blanks invalid BCD codes when set to blank', () => {
    const { rows } = buildSevenSegmentTable(config({ mode: 'bcd', bcdInvalidBehavior: 'blank' }), []);
    expect(rows[12].shows).toBe('blank');
    expect(rows[12].segments.every((s) => s === 0)).toBe(true);
  });

  it('finds the row the canvas is on, but only when every input is known', () => {
    const pins = (values: number[]) => values.map((value, i) => ({ id: `in-${i}`, value: value as 0 | 1 | -1 }));
    // A = 1, B = 0, C = 1, D = 0 → 5
    expect(buildSevenSegmentTable(config({}), pins([1, 0, 1, 0])).rows.findIndex((r) => r.isActive)).toBe(5);
    expect(buildSevenSegmentTable(config({}), pins([1, -1, 1, 0])).rows.some((r) => r.isActive)).toBe(false);
  });

  it('has 128 rows in direct mode and recognises digit patterns', () => {
    const { inputHeaders, rows } = buildSevenSegmentTable(config({ mode: 'direct' }), []);
    expect(inputHeaders).toHaveLength(7);
    expect(rows).toHaveLength(128);
    // a b c d e f g = 1111110 shows 0
    expect(rows[0b1111110].shows).toBe('0');
    expect(rows[0b1000000].shows).toBe('custom');
  });
});
