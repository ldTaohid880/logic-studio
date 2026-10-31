import { describe, it, expect } from 'vitest';
import { jpegSize, jpegToPdf } from './pdf';

// Start of a JPEG: SOI, an APP0 segment, then SOF0 for a 640 × 360 image
const fakeJpeg = new Uint8Array([
  0xff, 0xd8,
  0xff, 0xe0, 0x00, 0x04, 0x00, 0x00,
  0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x68, 0x02, 0x80, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
  0xff, 0xd9,
]);

describe('jpegSize', () => {
  it('reads the size from the frame header', () => {
    expect(jpegSize(fakeJpeg)).toEqual({ width: 640, height: 360 });
  });
});

describe('jpegToPdf', () => {
  it('writes a landscape A4 page with a valid cross-reference table', () => {
    const pdf = jpegToPdf(fakeJpeg);
    const text = new TextDecoder('latin1').decode(pdf);
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).toContain('/MediaBox [0 0 842 595]');
    expect(text).toContain('/Width 640 /Height 360');
    // Every xref offset points at the start of its object
    const xrefAt = Number(text.match(/startxref\n(\d+)/)![1]);
    expect(text.slice(xrefAt, xrefAt + 4)).toBe('xref');
    const offsets = [...text.slice(xrefAt).matchAll(/(\d{10}) 00000 n/g)].map((m) => Number(m[1]));
    offsets.forEach((o, i) => expect(text.slice(o, o + 7)).toBe(`${i + 1} 0 obj`));
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
  });
});
