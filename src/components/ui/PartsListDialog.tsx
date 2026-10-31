import React, { useMemo } from 'react';
import { Check, ClipboardList, Copy, Download } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { tableLines, useTableExport } from './useTableExport';
import { useCircuitStore } from '../../store/useCircuitStore';
import { billOfMaterials } from '../../utils/billOfMaterials';

/** What to buy to build the circuit on a breadboard with 74HC chips. */
export const PartsListDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) =>
  isOpen ? <PartsList onClose={onClose} /> : null;

const PartsList: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { nodes, customComponents } = useCircuitStore(useShallow((s) => ({ nodes: s.nodes, customComponents: s.customComponents })));
  const bom = useMemo(() => billOfMaterials(nodes, customComponents), [nodes, customComponents]);
  const { copied, copyLines, downloadCSV } = useTableExport('parts-list');
  const lines = (sep: string) =>
    tableLines(['Item', 'Part number', 'Quantity', 'Notes'], bom.map((l) => [l.item, l.partNumber, l.quantity, l.notes]), sep);

  return (
    <Dialog
      isOpen
      onClose={onClose}
      title="Parts list"
      description="What to buy to build this circuit with 74HC chips. Gates are packed into real chips; custom components are counted by their insides."
      icon={<ClipboardList className="w-4 h-4" />}
      maxWidth="4xl"
      footer={
        <>
          <Button variant="ghost" disabled={bom.length === 0} leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} onClick={() => copyLines(lines('\t'))}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button variant="secondary" disabled={bom.length === 0} leftIcon={<Download className="w-4 h-4" />} onClick={() => downloadCSV(lines(','))}>
            CSV
          </Button>
        </>
      }
    >
      {bom.length === 0 ? (
        <p className="text-sm text-fg-subtle py-6 text-center">Add some parts to the canvas to see what building it takes.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-xs text-fg-subtle text-left">
              <tr className="border-b border-line">
                <th className="py-1.5 pr-3 font-medium">Item</th>
                <th className="py-1.5 pr-3 font-medium">Part number</th>
                <th className="py-1.5 pr-3 font-medium text-right">Qty</th>
                <th className="py-1.5 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {bom.map((l) => (
                <tr key={`${l.item}|${l.partNumber}`} className="border-b border-line/60 align-top">
                  <td className="py-1.5 pr-3 text-fg">{l.item}</td>
                  <td className="py-1.5 pr-3 font-mono text-fg-muted whitespace-nowrap">{l.partNumber || '–'}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-fg font-medium">{l.quantity}</td>
                  <td className="py-1.5 text-xs text-fg-subtle">{l.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-fg-subtle">
            Part numbers are common 74HC equivalents; the app's parts use active-high controls, so check a chip's datasheet before wiring it.
            Breadboard, wires and a 5 V supply aren't listed.
          </p>
        </div>
      )}
    </Dialog>
  );
};
