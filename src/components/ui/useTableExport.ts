import { useCallback, useState } from 'react';
import { toPng } from 'html-to-image';
import { resolveCssColor } from '../../theme/signals';

/** Copy as tab-separated text, download as CSV, or save an element as a PNG; shared by the truth table dialogs. */
export function useTableExport(fileBase: string) {
  const [copied, setCopied] = useState(false);

  const copyLines = useCallback(async (lines: string[]) => {
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, []);

  const downloadCSV = useCallback(
    (lines: string[]) => {
      const link = document.createElement('a');
      link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
      link.download = `${fileBase}.csv`;
      link.click();
    },
    [fileBase]
  );

  const saveImage = useCallback(
    async (element: HTMLElement | null) => {
      if (!element) return;
      const dataUrl = await toPng(element, { backgroundColor: resolveCssColor('--surface-1', '#ffffff') });
      const link = document.createElement('a');
      link.download = `${fileBase}.png`;
      link.href = dataUrl;
      link.click();
    },
    [fileBase]
  );

  return { copied, copyLines, downloadCSV, saveImage };
}

/** One line per row, quoting cells for CSV when they contain a separator or quote. */
export function tableLines(headers: string[], rows: (string | number)[][], sep: string): string[] {
  const cell = (v: string | number) => {
    const s = v === -1 ? '?' : String(v);
    return sep === ',' && /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(cell).join(sep));
}

/** File-friendly name: "Full adder 1" → "full-adder-1". */
export const fileSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'table';
