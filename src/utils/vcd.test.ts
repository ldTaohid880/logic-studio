import { describe, it, expect } from 'vitest';
import { tracesToVcd } from './vcd';

describe('tracesToVcd', () => {
  it('declares one wire per signal and lists changes in time order', () => {
    const vcd = tracesToVcd(
      [
        { name: 'CLK', points: [[0, 0], [500, 1]] },
        { name: 'Out Y', points: [[0, -1], [500.5, 1]] },
      ],
      new Date(0)
    );
    expect(vcd).toContain('$var wire 1 ! CLK $end');
    expect(vcd).toContain('$var wire 1 " Out_Y $end');
    expect(vcd.split('$enddefinitions $end\n')[1]).toBe('#0\n0!\nx"\n#500000\n1!\n#500500\n1"\n');
  });
});
