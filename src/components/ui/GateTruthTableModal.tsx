import React, { useRef, useState, useMemo, useId } from 'react';
import { ModalFrame } from './Dialog';
import { ModalHeader } from './ModalHeader';
import { TruthTable } from './TruthTable';
import { Button } from './Button';
import { toPng } from 'html-to-image';
import { Download, Copy, Check, Table, Image as ImageIcon } from 'lucide-react';
import { GateType, PinData } from '../../types/circuit';
import { buildGateTruthTable } from '../../utils/gateTruthTable';
import { getComponentInfo } from '../../data/components';
import { resolveCssColor } from '../../theme/signals';

interface GateTruthTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  gateType: GateType;
  inputCount: number;
  currentInputs?: PinData[];
  nodeLabel?: string;
}

export const GateTruthTableModal: React.FC<GateTruthTableModalProps> = ({
  isOpen,
  onClose,
  gateType,
  inputCount,
  currentInputs,
  nodeLabel,
}) => {
  const [copied, setCopied] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const info = getComponentInfo(gateType);

  const table = useMemo(
    () => buildGateTruthTable(gateType, inputCount, currentInputs?.map((p) => p.value)),
    [gateType, inputCount, currentInputs]
  );

  if (!isOpen) return null;

  const active = table.rows.find((r) => r.isActive);
  const fileBase = `${(nodeLabel || info.name).toLowerCase().replace(/\s+/g, '-')}-truth-table`;
  const lines = (sep: string) => [
    [...table.inputHeaders, ...table.outputHeaders].join(sep),
    ...table.rows.map((r) => [...r.inputs, ...r.outputs].join(sep)),
  ];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(lines('\t').join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleCSV = () => {
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines(',').join('\n'));
    link.download = `${fileBase}.csv`;
    link.click();
  };

  const handlePNG = async () => {
    if (!tableRef.current) return;
    const dataUrl = await toPng(tableRef.current, { backgroundColor: resolveCssColor('--surface-1', '#ffffff') });
    const link = document.createElement('a');
    link.download = `${fileBase}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <ModalFrame isOpen={isOpen} onClose={onClose} labelledBy={titleId} className="w-full max-w-xl max-h-[85vh]">
      <ModalHeader
        titleId={titleId}
        icon={<Table className="w-5 h-5" />}
        title={`Truth table: ${nodeLabel && nodeLabel !== info.name ? `${nodeLabel} (${info.name})` : info.name}`}
        description={info.description}
        onClose={onClose}
      />

      <div className="px-5 py-2.5 border-b border-line text-[13px] text-fg-muted shrink-0" aria-live="polite">
        {active ? (
          <>
            On the canvas right now: inputs <span className="font-mono text-fg">{active.inputs.join('')}</span> give{' '}
            <span className="font-mono text-fg">{active.outputs.join(', ')}</span> (row m{active.index}).
          </>
        ) : (
          'Connect every input to see which row the circuit is on.'
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-5 py-3">
        <div ref={tableRef} className="bg-surface-1">
          <TruthTable
            caption={`Truth table for ${info.name}`}
            inputHeaders={table.inputHeaders}
            outputHeaders={table.outputHeaders}
            rows={table.rows}
          />
        </div>
      </div>

      <footer className="px-5 py-3 border-t border-line flex items-center gap-2 shrink-0">
        <span className="text-xs text-fg-subtle mr-auto">{table.rows.length} rows</span>
        <Button size="sm" variant="ghost" leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button size="sm" variant="ghost" leftIcon={<Download className="w-4 h-4" />} onClick={handleCSV}>
          CSV
        </Button>
        <Button size="sm" variant="secondary" leftIcon={<ImageIcon className="w-4 h-4" />} onClick={handlePNG}>
          Save image
        </Button>
      </footer>
    </ModalFrame>
  );
};
