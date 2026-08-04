import React, { useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import {
  X,
  Download,
  Copy,
  Check,
  Table,
  AlertTriangle,
  ShieldCheck,
  Search,
  Filter,
  HelpCircle,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { EncoderConfig, EncoderState } from '../../types/encoder';
import { SignalValue } from '../../types/circuit';
import { generateEncoderTruthTable, exportTruthTableToCSV, TruthTableRow } from '../../utils/truthTableGenerator';
import { getEncoderExplanation } from '../../utils/encoderExplanation';

interface EncoderTruthTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EncoderConfig;
  encoderState?: EncoderState;
  currentInputs?: SignalValue[];
  nodeLabel?: string;
}

type FilterMode = 'all' | 'valid_only' | 'active_only' | 'hide_errors';

export const EncoderTruthTableModal: React.FC<EncoderTruthTableModalProps> = ({
  isOpen,
  onClose,
  config,
  encoderState,
  currentInputs,
  nodeLabel = 'Encoder',
}) => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [showExplanation, setShowExplanation] = useState(true);

  const [followActiveRow, setFollowActiveRow] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLTableRowElement>(null);

  // Auto-scroll active row into view ONLY if Live Tracking (Follow Active Row) is enabled
  useEffect(() => {
    if (isOpen && followActiveRow && activeRowRef.current) {
      setTimeout(() => {
        activeRowRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [isOpen, followActiveRow, encoderState?.activeIndex, currentInputs]);

  const tableData = useMemo(() => {
    return generateEncoderTruthTable(config, currentInputs);
  }, [config, currentInputs]);

  const explanation = useMemo(() => {
    return getEncoderExplanation(config, encoderState);
  }, [config, encoderState]);

  // Apply search & filter modes
  const filteredRows = useMemo(() => {
    return tableData.rows.filter((row) => {
      // 1. Filter Mode
      if (filterMode === 'valid_only' && row.valid !== 1) return false;
      if (filterMode === 'active_only' && !row.isActive) return false;
      if (filterMode === 'hide_errors' && row.isError) return false;

      // 2. Search Query Filter
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const labelMatch = row.label.toLowerCase().includes(q);
      const decMatch = String(row.decimal).toLowerCase().includes(q);
      const outputBinaryStr = row.outputs.join('');
      const binaryMatch = outputBinaryStr.includes(q);
      const inputsStr = row.inputs.join('');
      const inputsMatch = inputsStr.includes(q);

      return labelMatch || decMatch || binaryMatch || inputsMatch;
    });
  }, [tableData.rows, filterMode, searchQuery]);

  if (!isOpen) return null;

  const activeRowItem = tableData.rows.find((r) => r.isActive);

  const handleCopy = () => {
    const text = [
      ['Row Label', ...tableData.headers.inputs, ...tableData.headers.outputs, 'Decimal', 'Valid', 'EO', 'GS'].join('\t'),
      ...tableData.rows.map((r) =>
        [r.label, ...r.inputs, ...r.outputs, r.decimal, r.valid, r.eo, r.gs].join('\t')
      ),
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    exportTruthTableToCSV(tableData, `${nodeLabel.toLowerCase().replace(/\s+/g, '_')}_truth_table.csv`);
  };

  const handleExportPNG = async () => {
    if (!tableContainerRef.current) return;
    try {
      const dataUrl = await toPng(tableContainerRef.current, { backgroundColor: '#0f141c' });
      const link = document.createElement('a');
      link.download = `${nodeLabel.toLowerCase().replace(/\s+/g, '_')}_truth_table.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export PNG', err);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 animate-fadeIn">
      <div 
        role="dialog"
        aria-modal="true"
        aria-label={`${nodeLabel} Truth Table`}
        className="bg-[#0f141c] border border-white/10 rounded-2xl w-[94vw] max-w-[1400px] h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans"
      >
        
        {/* ================= HEADER ================= */}
        <div className="px-6 py-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-lg flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Title & Configuration Badges */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    {nodeLabel}
                  </h2>
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                    {config.inputs}-to-{Math.log2(config.inputs)} Encoder
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] font-mono">
                  <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md font-semibold">
                    Input: Active {(config.inputActiveMode ?? config.activeMode ?? 'high').toUpperCase()}
                  </span>
                  <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-md font-semibold">
                    Output: Active {(config.outputActiveMode ?? config.activeMode ?? 'high').toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md font-semibold border ${
                    config.priority
                      ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    Priority: {config.priority ? `Enabled (${config.priorityDirection === 'highest' ? 'Highest First' : 'Lowest First'})` : 'Disabled'}
                  </span>
                  {config.inputs >= 16 && (
                    <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md font-semibold">
                      Large Configuration Matrix
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  showExplanation
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
                title="Toggle Educational Logic Explanation"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Guide</span>
                {showExplanation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 transition-colors flex items-center gap-1.5"
                title="Copy Table to Clipboard (TSV)"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 transition-colors flex items-center gap-1.5"
                title="Export Truth Table as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>

              <button
                onClick={handleExportPNG}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-900/30"
                title="Export Truth Table as Image"
              >
                <Download className="w-3.5 h-3.5" />
                PNG
              </button>

              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
                title="Close Dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search & Row Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search D-index, binary '101', decimal 5..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              <span className="text-[10px] text-slate-500 px-2 font-semibold uppercase flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter:
              </span>
              {[
                { id: 'all', label: 'All Rows' },
                { id: 'valid_only', label: 'Valid Only' },
                { id: 'active_only', label: 'Active Row Only' },
                { id: 'hide_errors', label: 'Hide Errors' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterMode(f.id as FilterMode)}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    filterMode === f.id
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Follow Active Row Toggle */}
            <label className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg cursor-pointer hover:border-slate-700 select-none">
              <input
                type="checkbox"
                checked={followActiveRow}
                onChange={(e) => setFollowActiveRow(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 cursor-pointer"
              />
              <span>Follow Active Row</span>
            </label>
          </div>
        </div>

        {/* ================= MODAL BODY ================= */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Educational Logic Explanation Panel */}
          {showExplanation && (
            <div className={`p-4 rounded-xl border backdrop-blur-md transition-all ${
              explanation.statusType === 'error'
                ? 'bg-rose-950/30 border-rose-500/40 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                : explanation.statusType === 'success'
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                : 'bg-blue-950/20 border-blue-500/20 text-blue-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 mt-0.5">
                  {explanation.statusType === 'error' ? (
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                  ) : explanation.statusType === 'success' ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-400" /> Educational Logic Explanation
                    </span>
                    <div className="flex gap-2 text-[10px] font-mono">
                      <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">In Logic: {explanation.inputModeText}</span>
                      <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">Out Logic: {explanation.outputModeText}</span>
                      <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">Priority: {explanation.priorityText}</span>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                    <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] text-slate-400 block">Active Input</span>
                      <span className="font-bold text-white text-sm">{explanation.activeInputText}</span>
                    </div>
                    <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] text-slate-400 block">Internal Index</span>
                      <span className="font-bold text-emerald-400 text-sm">{explanation.binaryIndexText}</span>
                    </div>
                    <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] text-slate-400 block">Output Pin Binary</span>
                      <span className="font-bold text-cyan-400 text-sm">{explanation.finalOutputText}</span>
                    </div>
                    <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] text-slate-400 block">Valid Signal (V)</span>
                      <span className={`font-bold text-sm ${encoderState?.valid ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {encoderState?.valid ? 'HIGH (1)' : 'LOW (0)'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    {explanation.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Table Container */}
          <div
            ref={tableContainerRef}
            className="bg-[#0b0e14] rounded-xl border border-white/10 shadow-xl overflow-auto max-h-[52vh] relative"
          >
            <table className="w-full text-center text-xs font-mono border-collapse min-w-[700px]">
              {/* Sticky Table Header */}
              <thead>
                <tr className="bg-slate-900/95 text-slate-200 border-b border-white/10 sticky top-0 z-20 backdrop-blur-md shadow-md">
                  <th className="py-3 px-3 border-r border-white/10 text-slate-400 bg-slate-900/90 text-left sticky left-0 z-30 font-semibold w-40">
                    State / Row
                  </th>

                  {/* Input Headers */}
                  {tableData.headers.inputs.map((h) => (
                    <th key={h} className="py-3 px-2 border-r border-white/5 text-cyan-300 bg-cyan-950/30 font-bold min-w-[36px]">
                      {h}
                    </th>
                  ))}

                  {/* Output Headers */}
                  {tableData.headers.outputs.map((h) => (
                    <th key={h} className="py-3 px-2 border-r border-white/5 text-emerald-400 bg-emerald-950/40 font-bold min-w-[36px]">
                      {h}
                    </th>
                  ))}

                  <th className="py-3 px-3 border-r border-white/5 text-purple-300 bg-purple-950/30 font-bold min-w-[70px]">
                    {tableData.headers.decimal}
                  </th>
                  <th className="py-3 px-3 border-r border-white/5 text-yellow-300 bg-yellow-950/30 font-bold min-w-[65px]">
                    {tableData.headers.valid}
                  </th>
                  {config.showEnableOutput && (
                    <th className="py-3 px-2 border-r border-white/5 text-slate-300 bg-slate-800/40 font-bold min-w-[45px]">
                      EO
                    </th>
                  )}
                  {config.showGroupSignal && (
                    <th className="py-3 px-2 text-slate-300 bg-slate-800/40 font-bold min-w-[45px]">
                      GS
                    </th>
                  )}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-white/5 bg-[#0b0e14]">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={tableData.headers.inputs.length + tableData.headers.outputs.length + 5}
                      className="py-8 text-center text-slate-500 font-sans"
                    >
                      <Info className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                      No matching truth table rows found for your filter/search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const isActive = row.isActive;
                    const isError = row.isError;

                    return (
                      <tr
                        key={row.id}
                        ref={isActive ? activeRowRef : null}
                        className={`transition-colors relative ${
                          isActive
                            ? 'bg-blue-600/30 text-white font-bold shadow-[inset_0_0_15px_rgba(59,130,246,0.3)] border-y border-blue-400'
                            : isError
                            ? 'bg-rose-950/40 text-rose-200 border-l-4 border-rose-500'
                            : 'hover:bg-white/[0.04] odd:bg-white/[0.01]'
                        }`}
                      >
                        {/* Sticky First Column */}
                        <td
                          className={`py-2.5 px-3 border-r border-white/10 text-left sticky left-0 z-10 font-bold ${
                            isActive
                              ? 'bg-blue-900/90 text-white border-blue-400'
                              : 'bg-[#0f141c]/95 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isActive && (
                              <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#3b82f6] animate-ping" />
                            )}
                            <span className="truncate max-w-[140px]" title={row.label}>
                              {row.label}
                            </span>
                          </div>
                        </td>

                        {/* Input Bits */}
                        {row.inputs.map((val, idx) => (
                          <td
                            key={idx}
                            className={`py-2.5 px-2 border-r border-white/5 transition-colors ${
                              val === 1 || val === '1'
                                ? 'text-cyan-300 font-bold bg-cyan-500/15'
                                : val === 'X'
                                ? 'text-amber-400 font-bold bg-amber-500/10'
                                : 'text-slate-500'
                            }`}
                          >
                            {val}
                          </td>
                        ))}

                        {/* Binary Outputs */}
                        {row.outputs.map((val, idx) => (
                          <td
                            key={idx}
                            className={`py-2.5 px-2 border-r border-white/5 font-bold ${
                              val === 1
                                ? 'text-emerald-400 bg-emerald-500/15 font-black text-sm'
                                : 'text-slate-600'
                            }`}
                          >
                            {val}
                          </td>
                        ))}

                        {/* Decimal Value */}
                        <td className="py-2.5 px-3 border-r border-white/5 font-bold text-purple-300 text-sm">
                          {row.decimal}
                        </td>

                        {/* Valid Signal (V) */}
                        <td className="py-2.5 px-3 border-r border-white/5 font-bold">
                          {row.valid === 1 ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px]">
                              1 (HIGH)
                            </span>
                          ) : (
                            <span className="text-slate-600">0</span>
                          )}
                        </td>

                        {/* Optional EO */}
                        {config.showEnableOutput && (
                          <td className="py-2.5 px-2 border-r border-white/5 text-slate-400">
                            {row.eo}
                          </td>
                        )}

                        {/* Optional GS */}
                        {config.showGroupSignal && (
                          <td className="py-2.5 px-2 text-slate-400">
                            {row.gs}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-6 py-3 border-t border-white/10 bg-slate-900/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              Showing <strong className="text-white">{filteredRows.length}</strong> of{' '}
              <strong className="text-white">{tableData.rows.length}</strong> rows
            </span>
            {activeRowItem && (
              <span className="text-blue-400 font-bold bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
                Active Row: {activeRowItem.label} (Decimal {activeRowItem.decimal})
              </span>
            )}
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-cyan-500/20 border border-cyan-400" />
              <span>Active Input (1)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-400" />
              <span>Don't Care (X)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-400" />
              <span>Output Bit (1)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-500 border border-blue-400" />
              <span>Live Sim Row</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500" />
              <span>Error State</span>
            </div>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
