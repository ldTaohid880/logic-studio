/**
 * HD44780 character LCD controller (what the Arduino LiquidCrystal library drives), wired in 4-bit mode:
 * RS, E and D4–D7. Data is taken on the falling edge of E. After power-on the chip is in 8-bit mode, so
 * each E pulse is a whole byte with D0–D3 low, until a "function set" command switches it to 4-bit mode;
 * then a byte takes two pulses, high nibble first. Implements the commands LiquidCrystal uses.
 */
export interface LcdState {
  /** Display memory: line 1 at addresses 0x00–0x27, line 2 at 0x40–0x67. */
  ddram: number[];
  addr: number;
  eightBit: boolean;
  /** High nibble waiting for its low nibble (4-bit mode). */
  pendingHigh: number | null;
  increment: boolean;
  displayOn: boolean;
  /** Data writes go to the custom-character memory (not shown) until a DDRAM address is set. */
  cgram: boolean;
}

export const LCD_COLUMNS = 16;

export const initialLcd = (): LcdState => ({
  ddram: new Array(128).fill(0x20),
  addr: 0,
  eightBit: true,
  pendingHigh: null,
  increment: true,
  displayOn: false,
  cgram: false,
});

const step = (s: LcdState) => (s.increment ? s.addr + 1 : s.addr - 1) & 0x7f;

export function lcdByte(s: LcdState, rs: boolean, byte: number): LcdState {
  if (rs) {
    if (s.cgram) return s;
    const ddram = s.ddram.slice();
    ddram[s.addr] = byte;
    return { ...s, ddram, addr: step(s) };
  }
  if (byte & 0x80) return { ...s, addr: byte & 0x7f, cgram: false };
  if (byte & 0x40) return { ...s, cgram: true };
  if (byte & 0x20) return { ...s, eightBit: (byte & 0x10) !== 0, pendingHigh: null };
  if (byte & 0x10) return s; // cursor or display shift: the display isn't shifted here
  if (byte & 0x08) return { ...s, displayOn: (byte & 0x04) !== 0 };
  if (byte & 0x04) return { ...s, increment: (byte & 0x02) !== 0 };
  if (byte & 0x02) return { ...s, addr: 0, cgram: false };
  if (byte & 0x01) return { ...s, ddram: new Array(128).fill(0x20), addr: 0, cgram: false };
  return s;
}

/** One E pulse with RS and D4–D7 (nibble, D4 = bit 0). */
export function lcdNibble(s: LcdState, rs: boolean, nibble: number): LcdState {
  if (s.eightBit) return lcdByte(s, rs, (nibble & 0xf) << 4);
  if (s.pendingHigh === null) return { ...s, pendingHigh: nibble & 0xf };
  return lcdByte({ ...s, pendingHigh: null }, rs, (s.pendingHigh << 4) | (nibble & 0xf));
}

/** The two lines as shown (blank while the display is off). */
export function lcdLines(s: LcdState | undefined): [string, string] {
  if (!s || !s.displayOn) return [' '.repeat(LCD_COLUMNS), ' '.repeat(LCD_COLUMNS)];
  const line = (start: number) =>
    s.ddram
      .slice(start, start + LCD_COLUMNS)
      .map((c) => (c >= 0x20 && c < 0x7f ? String.fromCharCode(c) : c === 0xdf ? '°' : ' '))
      .join('');
  return [line(0), line(0x40)];
}
