/** Flash size of the ATmega328P on Uno and Nano boards. */
export const FLASH_BYTES = 32 * 1024;

/**
 * Reads an Intel HEX file (what the Arduino IDE writes with Sketch → Export compiled binary)
 * into a flash image. Throws an Error with a plain-language message when the file isn't valid.
 */
export function parseIntelHex(text: string, size = FLASH_BYTES): Uint8Array {
  const flash = new Uint8Array(size);
  let base = 0;
  let sawData = false;
  let sawEnd = false;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) throw new Error('Invalid .hex file: it is empty');

  lines.forEach((line, i) => {
    if (sawEnd) return;
    const where = `line ${i + 1}`;
    if (!/^:([0-9a-fA-F]{2})+$/.test(line)) throw new Error(`Invalid .hex file: ${where} isn't an Intel HEX record`);
    const bytes = line
      .slice(1)
      .match(/../g)!
      .map((h) => parseInt(h, 16));
    const [count, addrHi, addrLo, type] = bytes;
    if (bytes.length !== count + 5) throw new Error(`Invalid .hex file: ${where} has the wrong length`);
    if ((bytes.reduce((a, b) => a + b, 0) & 0xff) !== 0) throw new Error(`Invalid .hex file: ${where} fails its checksum`);
    const payload = bytes.slice(4, 4 + count);

    switch (type) {
      case 0x00: {
        const start = base + ((addrHi << 8) | addrLo);
        if (start + count > size) throw new Error('Invalid .hex file: the program is too big for this board (32 KB of flash)');
        flash.set(payload, start);
        sawData = true;
        break;
      }
      case 0x01:
        sawEnd = true;
        break;
      case 0x02:
        base = ((payload[0] << 8) | payload[1]) << 4;
        break;
      case 0x04:
        base = ((payload[0] << 8) | payload[1]) << 16;
        break;
      default:
        // Start address records (03, 05) don't affect the flash image
        break;
    }
  });

  if (!sawData) throw new Error('Invalid .hex file: it contains no program');
  return flash;
}

/** Intel HEX text for a flash image given as 16-bit instruction words (used by tests). */
export function wordsToIntelHex(words: number[]): string {
  const bytes = words.flatMap((w) => [w & 0xff, (w >> 8) & 0xff]);
  const lines: string[] = [];
  for (let at = 0; at < bytes.length; at += 16) {
    const chunk = bytes.slice(at, at + 16);
    const record = [chunk.length, (at >> 8) & 0xff, at & 0xff, 0, ...chunk];
    const checksum = (0x100 - (record.reduce((a, b) => a + b, 0) & 0xff)) & 0xff;
    lines.push(':' + [...record, checksum].map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(''));
  }
  lines.push(':00000001FF');
  return lines.join('\n');
}
