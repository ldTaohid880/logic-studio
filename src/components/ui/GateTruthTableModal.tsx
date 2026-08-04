import React, { useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import {
  X,
  Download,
  Copy,
  Check,
  Table,
  Search,
  Filter,
  Zap,
} from 'lucide-react';
import { SignalValue } from '../../types/circuit';
import { evaluateGate } from '../../utils/gateLogic';

interface GateTruthTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  gateType: string;
  inputCount: number;
  currentInputs?: SignalValue[];
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
  const [searchQuery, setSearchQuery] = useState('');
  const [followActiveRow, setFollowActiveRow] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLTableRowElement>(null);

  // Generate truth table data for N inputs
  const tableData = useMemo(() => {
    const totalRows = Math.pow(2, inputCount);
    const rows = [];

    // Current simulation input signal pattern
    const currentPattern = currentInputs
      ? currentInputs.map((p) => (p.value === 1 ? 1 : 0))
      : null;

    for (let i = 0; i < totalRows; i++) {
      const inputs: number[] = [];
      for (let bit = inputCount - 1; bit >= 0; bit--) {
        inputs.push((i >> bit) & 1);
      }

      // Convert inputs to SignalValue[] for evaluation
      const sigInputs: SignalValue[] = inputs.map((v) => v as SignalValue);
      const outputVal = evaluateGate(gateType, sigInputs);

      // Check if matches live canvas inputs
      const isActive =
        currentPattern &&
        currentPattern.length === inputCount &&
        inputs.every((val, idx) => val === currentPattern[idx]);

      rows.push({
        id: `row-${i}`,
        index: i,
        inputs,
        output: outputVal === 1 ? 1 : 0,
        isActive: !!isActive,
      });
    }

    const inputHeaders = Array.from({ length: inputCount }, (_, idx) => `In ${idx + 1}`);

    return {
      headers: {
        inputs: inputHeaders,
        output: 'Out',
      },
      rows,
    };
  }, [gateType, inputCount, currentInputs]);

  // Auto scroll to active row ONLY when followActiveRow is true
  useEffect(() => {
    if (isOpen && followActiveRow && activeRowRef.current) {
      setTimeout(() => {
        activeRowRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [isOpen, followActiveRow, currentInputs]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return tableData.rows;
    const q = searchQuery.toLowerCase().trim();
    return tableData.rows.filter((r) => {
      const inputStr = r.inputs.join('');
      return inputStr.includes(q) || String(r.output).includes(q) || String(r.index).includes(q);
    });
  }, [tableData.rows, searchQuery]);

  if (!isOpen) return null;

  const activeRow = tableData.rows.find((r) => r.isActive);

  const handleCopy = () => {
    const text = [
      [...tableData.headers.inputs, tableData.headers.output].join('\t'),
      ...tableData.rows.map((r) => [...r.inputs, r.output].join('\t')),
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    const headerLine = [...tableData.headers.inputs, tableData.headers.output].join(',');
    const rowLines = tableData.rows.map((r) => [...r.inputs, r.output].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headerLine, ...rowLines].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `${(nodeLabel || gateType).toLowerCase()}_truth_table.csv`;
    link.click();
  };

  const handleExportPNG = async () => {
    if (!tableContainerRef.current) return;
    try {
      const dataUrl = await toPng(tableContainerRef.current, { backgroundColor: '#0f141c' });
      const link = document.createElement('a');
      link.download = `${(nodeLabel || gateType).toLowerCase()}_truth_table.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('PNG export failed', err);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 animate-fadeIn font-sans">
      <div 
        role="dialog"
        aria-modal="true"
        aria-label={`${nodeLabel || `${gateType} Gate`} Truth Table`}
        className="bg-[#0f141c] border border-white/10 rounded-2xl w-[90vw] max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden text-slate-100"
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {nodeLabel || `${gateType} Gate`}{' '}
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  {inputCount}-Input Logic Gate
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Full boolean truth table ({Math.pow(2, inputCount)} combinations)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>

            <button
              onClick={handleExportPNG}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              PNG
            </button>

            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Follow Active Row */}
        <div className="px-6 py-2.5 border-b border-white/10 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bit combination..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-lg cursor-pointer hover:border-slate-700 select-none shrink-0">
              <input
                type="checkbox"
                checked={followActiveRow}
                onChange={(e) => setFollowActiveRow(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-950 cursor-pointer"
              />
              <span>Follow Active Row</span>
            </label>
          </div>

          {activeRow && (
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              <span>Live Input Match: Row {activeRow.index} ({activeRow.inputs.join('')} → {activeRow.output})</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div
            ref={tableContainerRef}
            className="bg-[#0b0e14] rounded-xl border border-white/10 shadow-xl overflow-auto max-h-[55vh]"
          >
            <table className="w-full text-center text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-slate-300 border-b border-white/10 sticky top-0 z-10 backdrop-blur-md">
                  <th className="py-3 px-3 border-r border-white/10 text-slate-400">Row #</th>
                  {tableData.headers.inputs.map((h) => (
                    <th key={h} className="py-3 px-3 border-r border-white/5 text-cyan-300 bg-cyan-950/30">
                      {h}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-emerald-400 bg-emerald-950/40 font-bold">
                    Output ({tableData.headers.output})
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5 bg-[#0b0e14]">
                {filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    ref={row.isActive ? activeRowRef : null}
                    className={`transition-colors ${
                      row.isActive
                        ? 'bg-emerald-600/30 border-y border-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.3)]'
                        : 'hover:bg-white/[0.04] odd:bg-white/[0.01]'
                    }`}
                  >
                    <td className="py-2.5 px-3 border-r border-white/10 font-bold text-slate-400">
                      {row.isActive ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[10px] animate-pulse">
                          ACTIVE
                        </span>
                      ) : (
                        `Row ${row.index}`
                      )}
                    </td>

                    {row.inputs.map((val, idx) => (
                      <td
                        key={idx}
                        className={`py-2.5 px-3 border-r border-white/5 font-bold ${
                          val === 1 ? 'text-cyan-300 bg-cyan-500/15' : 'text-slate-500'
                        }`}
                      >
                        {val}
                      </td>
                    ))}

                    <td
                      className={`py-2.5 px-3 font-bold text-sm ${
                        row.output === 1 ? 'text-emerald-400 bg-emerald-500/15' : 'text-slate-600'
                      }`}
                    >
                      {row.output}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-slate-900/90 text-xs font-mono text-slate-400 flex items-center justify-between">
          <span>Total Rows: {tableData.rows.length}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-cyan-500/20 border border-cyan-400" /> Input HIGH
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-400" /> Output HIGH
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
