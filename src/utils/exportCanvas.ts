import { toJpeg, toPng, toSvg } from 'html-to-image';
import { jpegToPdf } from './pdf';

export type ExportFormat = 'png' | 'svg' | 'pdf';

const download = (href: string, name: string) => {
  const link = document.createElement('a');
  link.download = name;
  link.href = href;
  link.click();
};

/**
 * Saves the canvas as an image or a one-page PDF. The SVG keeps everything sharp at any zoom in browsers;
 * it embeds the canvas as HTML, so some drawing programs won't edit it.
 */
export async function exportCanvas(element: HTMLElement, format: ExportFormat, backgroundColor: string): Promise<void> {
  // The web fonts come from a stylesheet the browser won't let scripts read, so embedding them only logs errors
  const base = { backgroundColor, skipFonts: true };
  const name = `circuit-${new Date().toISOString().slice(0, 10)}`;
  if (format === 'png') {
    download(await toPng(element, { ...base, pixelRatio: 2 }), `${name}.png`);
  } else if (format === 'svg') {
    download(await toSvg(element, base), `${name}.svg`);
  } else {
    const dataUrl = await toJpeg(element, { ...base, pixelRatio: 2, quality: 0.92 });
    const jpeg = Uint8Array.from(atob(dataUrl.split(',')[1]), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([jpegToPdf(jpeg)], { type: 'application/pdf' }));
    download(url, `${name}.pdf`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
