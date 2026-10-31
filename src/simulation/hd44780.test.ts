import { describe, it, expect } from 'vitest';
import { initialLcd, lcdByte, lcdLines, lcdNibble, LcdState } from './hd44780';

/** What LiquidCrystal.begin(16, 2) sends in 4-bit mode, then print("Hello"). */
function liquidCrystalHello(): LcdState {
  let s = initialLcd();
  const nib = (rs: boolean, n: number) => (s = lcdNibble(s, rs, n));
  const send = (rs: boolean, b: number) => {
    nib(rs, b >> 4);
    nib(rs, b & 15);
  };
  nib(false, 0x3); nib(false, 0x3); nib(false, 0x3); nib(false, 0x2); // reset dance into 4-bit mode
  send(false, 0x28); // 2 lines, 5×8
  send(false, 0x0c); // display on
  send(false, 0x01); // clear
  send(false, 0x06); // entry mode: left to right
  [...'Hello'].forEach((c) => send(true, c.charCodeAt(0)));
  return s;
}

describe('HD44780', () => {
  it('follows the LiquidCrystal start-up sequence and prints', () => {
    const s = liquidCrystalHello();
    expect(s.eightBit).toBe(false);
    expect(lcdLines(s)[0]).toBe('Hello           ');
  });

  it('is blank until the display is turned on, and clears', () => {
    expect(lcdLines(initialLcd())[0].trim()).toBe('');
    let s = liquidCrystalHello();
    s = lcdByte(s, false, 0x08); // display off
    expect(lcdLines(s)[0].trim()).toBe('');
    s = lcdByte(lcdByte(s, false, 0x0c), false, 0x01);
    expect(lcdLines(s)[0].trim()).toBe('');
  });

  it('moves the cursor to line 2 with a DDRAM address and ignores custom-character data', () => {
    let s = liquidCrystalHello();
    s = lcdByte(s, false, 0x40); // CGRAM address
    s = lcdByte(s, true, 0x1f);
    s = lcdByte(s, false, 0x80 | 0x45); // line 2, column 5
    s = lcdByte(s, true, 'x'.charCodeAt(0));
    expect(lcdLines(s)).toEqual(['Hello           ', '     x          ']);
  });
});
