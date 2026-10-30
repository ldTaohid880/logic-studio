import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { ModalFrame } from './Dialog';
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
  Printer,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Loader2,
} from 'lucide-react';

import { useCircuitStore } from '../../store/useCircuitStore';
import { useShallow } from 'zustand/react/shallow';
import {
  analyzeCircuitGraph,
  generateCircuitTruthTableAsync,
  CircuitTruthTableData,
  CircuitSignal,
  TruthTableRowData,
} from '../../utils/circuitTruthTableEngine';

interface CircuitTruthTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CircuitTruthTableModal: React.FC<CircuitTruthTableModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { nodes, edges, customComponents } = useCircuitStore(useShallow((s) => ({ nodes: s.nodes, edges: s.edges, customComponents: s.customComponents })));

  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [followActiveRow, setFollowActiveRow] = useState(false);
  const [initialSeqState, setInitialSeqState] = useState<number>(0);

  // Column Visibility state
  const [visibleSignalIds, setVisibleSignalIds] = useState<Set<string>>(new Set());
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // Async Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentGeneratedRow, setCurrentGeneratedRow] = useState(0);
  const [totalRowsToGenerate, setTotalRowsToGenerate] = useState(0);
  const [timeEstimateMs, setTimeEstimateMs] = useState(0);
  const [truthTableData, setTruthTableData] = useState<CircuitTruthTableData | null>(null);

  const cancellationRef = useRef(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLTableRowElement>(null);

  // Create stable topology key (gate types, IDs, labels, wire connections)
  const topologyKey = useMemo(() => {
    if (!isOpen) return '';
    const nodeStr = nodes
      .map((n) => `${n.id}:${(n.data as any).gateType}:${(n.data as any).label || ''}`)
      .join('|');
    const edgeStr = edges
      .map((e) => `${e.id}:${e.source}:${e.sourceHandle}->${e.target}:${e.targetHandle}`)
      .join('|');
    return `${nodeStr}___${edgeStr}`;
  }, [isOpen, nodes, edges]);

  // Analyze circuit graph only when topology changes
  const analysis = useMemo(() => {
    if (!isOpen) return null;
    return analyzeCircuitGraph(nodes, edges);
  }, [isOpen, topologyKey]);

  // Initialize visible signals on open/analysis
  useEffect(() => {
    if (analysis) {
      const allIds = new Set<string>([
        ...analysis.inputs.map((s) => s.id),
        ...analysis.internal.map((s) => s.id),
        ...analysis.outputs.map((s) => s.id),
      ]);
      setVisibleSignalIds(allIds);
    }
  }, [analysis]);

  // Generate Truth Table Action
  const runGeneration = useCallback(async (showLoader: boolean = false) => {
    if (!analysis) return;

    cancellationRef.current = false;
    if (showLoader) {
      setIsGenerating(true);
      setProgress(0);
    }

    const total = Math.pow(2, analysis.inputs.length);
    setTotalRowsToGenerate(total);

    try {
      const result = await generateCircuitTruthTableAsync(nodes, edges, analysis, {
        initialSeqState,
        customComponents,
        batchSize: total > 128 ? 64 : 16,
        onProgress: (prog, curr, tot, timeEst) => {
          if (showLoader) {
            setProgress(prog);
            setCurrentGeneratedRow(curr);
            setTimeEstimateMs(timeEst);
          }
        },
        shouldCancel: () => cancellationRef.current,
      });

      if (!cancellationRef.current) {
        setTruthTableData(result);
      }
    } catch (err) {
      console.error('Circuit truth table generation error:', err);
    } finally {
      if (showLoader) {
        setIsGenerating(false);
      }
    }
  }, [analysis, nodes, edges, initialSeqState]);

  // Run generation whenever modal is opened or initial state changed
  const prevTopologyRef = useRef<string>('');
  const isFirstLoadRef = useRef<boolean>(true);

  useEffect(() => {
    if (isOpen && analysis) {
      const isTopologyChanged = prevTopologyRef.current !== topologyKey;
      prevTopologyRef.current = topologyKey;

      const shouldShowLoader = isFirstLoadRef.current || isTopologyChanged;
      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
      }

      runGeneration(shouldShowLoader);
    }
  }, [isOpen, analysis, topologyKey, runGeneration]);

  // Follow active row auto-scroll
  useEffect(() => {
    if (isOpen && followActiveRow && activeRowRef.current) {
      setTimeout(() => {
        activeRowRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [isOpen, followActiveRow, truthTableData]);

  if (!isOpen || !analysis) return null;

  const handleCancelGeneration = () => {
    cancellationRef.current = true;
    setIsGenerating(false);
  };

  const toggleSignalVisibility = (id: string) => {
    setVisibleSignalIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllCategory = (signals: CircuitSignal[], enable: boolean) => {
    setVisibleSignalIds((prev) => {
      const next = new Set(prev);
      signals.forEach((s) => {
        if (enable) next.add(s.id);
        else next.delete(s.id);
      });
      return next;
    });
  };

  // Filtered Visible Columns
  const visibleInputs = analysis.inputs.filter((s) => visibleSignalIds.has(s.id));
  const visibleInternal = analysis.internal.filter((s) => visibleSignalIds.has(s.id));
  const visibleOutputs = analysis.outputs.filter((s) => visibleSignalIds.has(s.id));

  // Filtered Rows for Search
  const filteredRows = (truthTableData?.rows || []).filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();

    const inputMatch = r.inputsPattern.join('').includes(q);
    const indexMatch = String(r.index).includes(q);
    const outputVals = Object.values(r.outputsMap).join('');
    const outputMatch = outputVals.includes(q);

    return inputMatch || indexMatch || outputMatch;
  });

  const activeRow = truthTableData?.rows.find((r) => r.isActive);

  // Export handlers
  const handleCopy = () => {
    if (!truthTableData) return;
    const headers = [
      'Row',
      ...visibleInputs.map((s) => s.label),
      ...visibleInternal.map((s) => s.label),
      ...visibleOutputs.map((s) => s.label),
    ].join('\t');

    const rowLines = filteredRows.map((r) => {
      const inVals = visibleInputs.map((s) => r.inputsMap[s.id] ?? 0);
      const intVals = visibleInternal.map((s) => r.internalMap[s.id] ?? 0);
      const outVals = visibleOutputs.map((s) => r.outputsMap[s.id] ?? 0);
      return [r.index, ...inVals, ...intVals, ...outVals].join('\t');
    });

    navigator.clipboard.writeText([headers, ...rowLines].join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    if (!truthTableData) return;
    const headers = [
      'Row',
      ...visibleInputs.map((s) => `"${s.label}"`),
      ...visibleInternal.map((s) => `"${s.label}"`),
      ...visibleOutputs.map((s) => `"${s.label}"`),
    ].join(',');

    const rowLines = filteredRows.map((r) => {
      const inVals = visibleInputs.map((s) => r.inputsMap[s.id] ?? 0);
      const intVals = visibleInternal.map((s) => r.internalMap[s.id] ?? 0);
      const outVals = visibleOutputs.map((s) => r.outputsMap[s.id] ?? 0);
      return [r.index, ...inVals, ...intVals, ...outVals].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rowLines].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `circuit_truth_table_${Date.now()}.csv`;
    link.click();
  };

  const handleExportPNG = async () => {
    if (!tableContainerRef.current) return;
    try {
      const dataUrl = await toPng(tableContainerRef.current, { backgroundColor: '#0b0e14' });
      const link = document.createElement('a');
      link.download = `circuit_truth_table_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={"Circuit truth table"}
      className="w-[96vw] max-w-[1500px] h-[92vh] print:w-full print:h-full print:border-none print:rounded-none"
    >
        {/* ================= HEADER ================= */}
        <div className="px-6 py-4 border-b border-white/10 bg-slate-900/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Circuit Truth Table Generator
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {analysis.inputs.length} Inputs • {analysis.outputs.length} Outputs
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Complete combinational logic truth table ({Math.pow(2, analysis.inputs.length)} rows)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                showColumnPicker
                  ? 'bg-cyan-600 text-on-accent border-cyan-400 shadow-lg shadow-cyan-900/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Select Signals</span>
            </button>

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
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              PNG
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= SEQUENTIAL LOGIC BANNER NOTICE ================= */}
        {analysis.hasSequentialLogic && (
          <div className="px-6 py-2.5 bg-amber-950/40 border-b border-amber-500/30 text-amber-200 text-xs font-mono flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Sequential Logic / Feedback Loop Detected:</strong> Truth table outcomes may depend on initial latch state (e.g. SR Latch).
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Initial State Q:</span>
              <button
                onClick={() => setInitialSeqState(0)}
                className={`px-2 py-0.5 rounded text-xs font-bold border ${
                  initialSeqState === 0
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                Q = 0
              </button>
              <button
                onClick={() => setInitialSeqState(1)}
                className={`px-2 py-0.5 rounded text-xs font-bold border ${
                  initialSeqState === 1
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                Q = 1
              </button>
            </div>
          </div>
        )}

        {/* ================= SEARCH & FOLLOW ACTIVE ROW TOOLBAR ================= */}
        <div className="px-6 py-2.5 border-b border-white/10 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bit pattern or row..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs font-mono text-slate-200 focus:border-cyan-500"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-lg cursor-pointer hover:border-slate-700 select-none shrink-0">
              <input
                type="checkbox"
                checked={followActiveRow}
                onChange={(e) => setFollowActiveRow(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 text-cyan-500 bg-slate-950 cursor-pointer"
              />
              <span>Follow Active Row</span>
            </label>
          </div>

          {activeRow && (
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              <span>Live Active Match: Row {activeRow.index}</span>
            </div>
          )}
        </div>

        {/* ================= COLUMN SIGNAL PICKER DRAWER ================= */}
        {showColumnPicker && (
          <div className="px-6 py-3 border-b border-white/10 bg-slate-900/90 text-xs font-mono flex flex-wrap gap-6 animate-fadeIn print:hidden">
            {/* Inputs Column Toggle */}
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <div className="flex items-center justify-between text-cyan-300 font-bold border-b border-cyan-500/30 pb-1">
                <span>INPUT SIGNALS ({analysis.inputs.length})</span>
                <div className="flex gap-1 text-[11px]">
                  <button onClick={() => toggleAllCategory(analysis.inputs, true)} className="hover:underline text-cyan-400">All</button>
                  <span>/</span>
                  <button onClick={() => toggleAllCategory(analysis.inputs, false)} className="hover:underline text-slate-400">None</button>
                </div>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                {analysis.inputs.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleSignalIds.has(s.id)}
                      onChange={() => toggleSignalVisibility(s.id)}
                      className="rounded border-slate-700 text-cyan-500"
                    />
                    <span>{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Internal Signals Column Toggle */}
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <div className="flex items-center justify-between text-amber-300 font-bold border-b border-amber-500/30 pb-1">
                <span>INTERNAL SIGNALS ({analysis.internal.length})</span>
                <div className="flex gap-1 text-[11px]">
                  <button onClick={() => toggleAllCategory(analysis.internal, true)} className="hover:underline text-amber-400">All</button>
                  <span>/</span>
                  <button onClick={() => toggleAllCategory(analysis.internal, false)} className="hover:underline text-slate-400">None</button>
                </div>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                {analysis.internal.length === 0 ? (
                  <span className="text-slate-500 italic">No internal signals</span>
                ) : (
                  analysis.internal.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleSignalIds.has(s.id)}
                        onChange={() => toggleSignalVisibility(s.id)}
                        className="rounded border-slate-700 text-amber-500"
                      />
                      <span>{s.label}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Output Signals Column Toggle */}
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <div className="flex items-center justify-between text-emerald-300 font-bold border-b border-emerald-500/30 pb-1">
                <span>OUTPUT SIGNALS ({analysis.outputs.length})</span>
                <div className="flex gap-1 text-[11px]">
                  <button onClick={() => toggleAllCategory(analysis.outputs, true)} className="hover:underline text-emerald-400">All</button>
                  <span>/</span>
                  <button onClick={() => toggleAllCategory(analysis.outputs, false)} className="hover:underline text-slate-400">None</button>
                </div>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                {analysis.outputs.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleSignalIds.has(s.id)}
                      onChange={() => toggleSignalVisibility(s.id)}
                      className="rounded border-slate-700 text-emerald-500"
                    />
                    <span>{s.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= ASYNC PROGRESS BAR ================= */}
        {isGenerating && (
          <div className="px-6 py-3 bg-cyan-950/40 border-b border-cyan-500/30 text-xs font-mono text-cyan-200 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Generating combinations... ({currentGeneratedRow} / {totalRowsToGenerate} rows • {progress}%)</span>
            </div>

            <div className="flex items-center gap-4 flex-1 max-w-xs">
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-400">Est. remaining: {(timeEstimateMs / 1000).toFixed(1)}s</span>
              <button
                onClick={handleCancelGeneration}
                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-on-accent font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ================= MAIN TRUTH TABLE BODY ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div
            ref={tableContainerRef}
            className="bg-surface-0 rounded-xl border border-white/10 shadow-2xl overflow-auto max-h-[62vh] print:max-h-none print:border-none"
          >
            <table className="w-full text-center text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-300 border-b border-white/10 sticky top-0 z-20 backdrop-blur-md">
                  <th className="py-3 px-3 border-r border-white/10 text-slate-400 w-16">Row #</th>

                  {/* Inputs Group Header */}
                  {visibleInputs.map((s) => (
                    <th key={s.id} className="py-3 px-3 border-r border-white/5 text-cyan-300 bg-cyan-950/40">
                      {s.label}
                    </th>
                  ))}

                  {/* Internal Group Header */}
                  {visibleInternal.map((s) => (
                    <th key={s.id} className="py-3 px-3 border-r border-white/5 text-amber-300 bg-amber-950/30">
                      {s.label}
                    </th>
                  ))}

                  {/* Outputs Group Header */}
                  {visibleOutputs.map((s) => (
                    <th key={s.id} className="py-3 px-3 border-r border-white/5 text-emerald-300 bg-emerald-950/40 font-bold">
                      {s.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5 bg-surface-0">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={1 + visibleInputs.length + visibleInternal.length + visibleOutputs.length}
                      className="py-12 text-slate-500 italic text-sm"
                    >
                      {isGenerating ? 'Computing circuit state matrix...' : 'No combinations match the search query.'}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      ref={row.isActive ? activeRowRef : null}
                      className={`transition-colors ${
                        row.isActive
                          ? 'bg-cyan-600/30 border-y border-cyan-400 shadow-[inset_0_0_15px_rgba(6,182,212,0.3)]'
                          : 'hover:bg-white/[0.04] odd:bg-white/[0.01]'
                      }`}
                    >
                      {/* Row Index */}
                      <td className="py-2.5 px-3 border-r border-white/10 font-bold text-slate-400">
                        {row.isActive ? (
                          <span className="px-2 py-0.5 rounded bg-cyan-400 text-slate-950 font-black text-[11px] animate-pulse">
                            ACTIVE
                          </span>
                        ) : (
                          row.index
                        )}
                      </td>

                      {/* Input Cells */}
                      {visibleInputs.map((s) => {
                        const val = row.inputsMap[s.id] ?? 0;
                        return (
                          <td
                            key={s.id}
                            className={`py-2.5 px-3 border-r border-white/5 font-bold ${
                              val === 1 ? 'text-cyan-300 bg-cyan-500/15' : 'text-slate-500'
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}

                      {/* Internal Cells */}
                      {visibleInternal.map((s) => {
                        const val = row.internalMap[s.id] ?? 0;
                        return (
                          <td
                            key={s.id}
                            className={`py-2.5 px-3 border-r border-white/5 font-bold ${
                              val === 1 ? 'text-amber-300 bg-amber-500/15' : 'text-slate-600'
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}

                      {/* Output Cells */}
                      {visibleOutputs.map((s) => {
                        const val = row.outputsMap[s.id] ?? 0;
                        return (
                          <td
                            key={s.id}
                            className={`py-2.5 px-3 border-r border-white/5 font-bold text-sm ${
                              val === 1 ? 'text-emerald-400 bg-emerald-500/15' : 'text-slate-600'
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-6 py-3 border-t border-white/10 bg-slate-900/90 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <span>
            Total Rows: {filteredRows.length} of {truthTableData?.rows.length || Math.pow(2, analysis.inputs.length)}
          </span>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-cyan-500/30 border border-cyan-400" /> Input HIGH (1)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-400" /> Output HIGH (1)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-400" /> Internal High (1)
            </span>
          </div>
        </div>

    </ModalFrame>
  );
};
