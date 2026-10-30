import React, { useId, useRef } from 'react';
import { Check, Copy, Download, Image as ImageIcon, Table } from 'lucide-react';
import { ModalFrame } from './Dialog';
import { ModalHeader } from './ModalHeader';
import { Button } from './Button';
import { useTableExport } from './useTableExport';

interface TruthTableDialogProps {
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  /** Live line under the header (which row the canvas is on); announced politely. */
  status?: React.ReactNode;
  /** Optional panel between the status line and the table (settings, explanations). */
  toolbar?: React.ReactNode;
  /** The table; it is also what "Save image" captures. */
  children: React.ReactNode;
  /** Left side of the footer, e.g. the row count and legend. */
  footerNote?: React.ReactNode;
  fileBase: string;
  /** Header line plus one line per row, joined with the given separator. */
  lines: (sep: string) => string[];
  className?: string;
}

/** Shell shared by the part truth tables: header, live status, scrolling table and copy/CSV/image footer. */
export const TruthTableDialog: React.FC<TruthTableDialogProps> = ({
  onClose,
  title,
  description,
  status,
  toolbar,
  children,
  footerNote,
  fileBase,
  lines,
  className = 'w-full max-w-xl max-h-[85vh]',
}) => {
  const titleId = useId();
  const tableRef = useRef<HTMLDivElement>(null);
  const { copied, copyLines, downloadCSV, saveImage } = useTableExport(fileBase);

  return (
    <ModalFrame isOpen onClose={onClose} labelledBy={titleId} className={className}>
      <ModalHeader titleId={titleId} icon={<Table className="w-5 h-5" />} title={title} description={description} onClose={onClose} />

      {status && (
        <div className="px-5 py-2.5 border-b border-line text-[13px] text-fg-muted shrink-0" aria-live="polite">
          {status}
        </div>
      )}
      {toolbar}

      <div className="flex-1 min-h-0 overflow-auto px-5 py-3">
        <div ref={tableRef} className="bg-surface-1">
          {children}
        </div>
      </div>

      <footer className="px-5 py-3 border-t border-line flex flex-wrap items-center gap-2 shrink-0">
        <span className="text-xs text-fg-subtle mr-auto">{footerNote}</span>
        <Button size="sm" variant="ghost" leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} onClick={() => copyLines(lines('\t'))}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button size="sm" variant="ghost" leftIcon={<Download className="w-4 h-4" />} onClick={() => downloadCSV(lines(','))}>
          CSV
        </Button>
        <Button size="sm" variant="secondary" leftIcon={<ImageIcon className="w-4 h-4" />} onClick={() => saveImage(tableRef.current)}>
          Save image
        </Button>
      </footer>
    </ModalFrame>
  );
};
