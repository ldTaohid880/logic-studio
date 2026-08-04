import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  SevenSegmentConfig,
  COLOR_CONFIGS,
} from '../../types/sevenSegment';
import { PinData, SignalValue } from '../../types/circuit';
import { evaluateSevenSegment } from '../../utils/sevenSegmentLogic';
import {
  X,
  Search,
  Download,
  Copy,
  Printer,
  Check,
  Eye,
  Table as TableIcon,
} from 'lucide-react';

interface SevenSegmentTruthTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SevenSegmentConfig;
  currentInputs: PinData[];
  nodeLabel: string;
}

interface TableRowData {
  rowIdx: number;
  inputValues: Record<string, number>;
  binaryStr: string;
  decodedChar: string;
  decimalVal: number | null;
  segments: {
    a: boolean;
    b: boolean;
    c: boolean;
    d: boolean;
    e: boolean;
    f: boolean;
    g: boolean;
    dp: boolean;
  };
  isActive: boolean;
}

export const SevenSegmentTruthTableModal: React.FC<SevenSegmentTruthTableModalProps> = ({
  isOpen,
  onClose,
  config,
  currentInputs,
  nodeLabel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [followActiveRow, setFollowActiveRow] = useState(true);
  const [copied, setCopied] = useState(false);
  const activeRowRef = useRef<HTMLTableRowElement | null>(null);

  // Generate truth table rows based on current mode & config
  const rows: TableRowData[] = useMemo(() => {
    if (!isOpen) return [];

    const isDirect = config.mode === 'direct';
    const totalRows = isDirect ? 128 : 16;
    const tableRows: TableRowData[] = [];

    // Current canvas input map to determine active row
    const canvasInputMap: Record<string, number> = {};
    currentInputs.forEach((p) => {
      canvasInputMap[p.id] = p.value === 1 ? 1 : 0;
    });

    for (let i = 0; i < totalRows; i++) {
      const mockPins: { id: string; value: SignalValue }[] = [];
      const inputValues: Record<string, number> = {};

      if (isDirect) {
        // Pins: in-a, in-b, in-c, in-d, in-e, in-f, in-g
        const segmentNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
        segmentNames.forEach((seg, bitIdx) => {
          const bitVal = (i >> (6 - bitIdx)) & 1; // MSB 'a' to LSB 'g'
          mockPins.push({ id: `in-${seg}`, value: bitVal as SignalValue });
          inputValues[`in-${seg}`] = bitVal;
        });

        if (config.showDecimalPoint) {
          const dpVal = canvasInputMap['in-dp'] ?? 0;
          mockPins.push({ id: 'in-dp', value: dpVal as SignalValue });
          inputValues['in-dp'] = dpVal;
        }
      } else {
        // Pins: in-0 (A - LSB), in-1 (B), in-2 (C), in-3 (D - MSB)
        const bitA = i & 1;
        const bitB = (i >> 1) & 1;
        const bitC = (i >> 2) & 1;
        const bitD = (i >> 3) & 1;

        mockPins.push({ id: 'in-0', value: bitA as SignalValue });
        mockPins.push({ id: 'in-1', value: bitB as SignalValue });
        mockPins.push({ id: 'in-2', value: bitC as SignalValue });
        mockPins.push({ id: 'in-3', value: bitD as SignalValue });

        inputValues['in-0'] = bitA;
        inputValues['in-1'] = bitB;
        inputValues['in-2'] = bitC;
        inputValues['in-3'] = bitD;

        if (config.showDecimalPoint) {
          const dpVal = canvasInputMap['in-dp'] ?? 0;
          mockPins.push({ id: 'in-dp', value: dpVal as SignalValue });
          inputValues['in-dp'] = dpVal;
        }
      }

      // Evaluate logic for row
      const evalRes = evaluateSevenSegment(mockPins, config);

      // Test if active row matches current canvas inputs
      const isActive = Object.entries(inputValues).every(([pId, pVal]) => {
        if (pId === 'in-dp') return true; // ignore DP for main row match
        return (canvasInputMap[pId] ?? 0) === pVal;
      });

      tableRows.push({
        rowIdx: i,
        inputValues,
        binaryStr: evalRes.binaryString,
        decodedChar: evalRes.decodedChar,
        decimalVal: evalRes.decimalValue,
        segments: evalRes.segments,
        isActive,
      });
    }

    return tableRows;
  }, [isOpen, config, currentInputs]);

  // Filter rows based on search
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();

    return rows.filter((r) => {
      const idxStr = r.rowIdx.toString();
      const binStr = r.binaryStr.toLowerCase();
      const decChar = r.decodedChar.toLowerCase();
      const decValStr = r.decimalVal !== null ? r.decimalVal.toString() : '';

      return (
        idxStr.includes(term) ||
        binStr.includes(term) ||
        decChar.includes(term) ||
        decValStr.includes(term)
      );
    });
  }, [rows, searchTerm]);

  // Scroll to active row when open or inputs change
  useEffect(() => {
    if (followActiveRow && activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [followActiveRow, rows]);

  if (!isOpen) return null;

  const colorStyle = COLOR_CONFIGS[config.color] || COLOR_CONFIGS.red;

  const handleCopyCSV = () => {
    let csv = '';
    if (config.mode === 'direct') {
      csv += 'Row,a,b,c,d,e,f,g,Decoded,Segments(a-g)\n';
      filteredRows.forEach((r) => {
        const segStr = Object.values(r.segments).map((v) => (v ? '1' : '0')).join('');
        csv += `${r.rowIdx},${r.inputValues['in-a']},${r.inputValues['in-b']},${r.inputValues['in-c']},${r.inputValues['in-d']},${r.inputValues['in-e']},${r.inputValues['in-f']},${r.inputValues['in-g']},"${r.decodedChar}",${segStr}\n`;
      });
    } else {
      csv += 'Row,D(MSB),C,B,A(LSB),Decoded,Decimal,Hex,a,b,c,d,e,f,g\n';
      filteredRows.forEach((r) => {
        const segs = r.segments;
        csv += `${r.rowIdx},${r.inputValues['in-3']},${r.inputValues['in-2']},${r.inputValues['in-1']},${r.inputValues['in-0']},"${r.decodedChar}",${r.decimalVal},0x${r.decimalVal?.toString(16).toUpperCase()},${segs.a?1:0},${segs.b?1:0},${segs.c?1:0},${segs.d?1:0},${segs.e?1:0},${segs.f?1:0},${segs.g?1:0}\n`;
      });
    }

    navigator.clipboard.writeText(csv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-mono">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                7-Segment Truth Table - {nodeLabel}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-cyan-400 font-semibold uppercase bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                  Mode: {config.mode.toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-400 uppercase">
                  {config.displayType === 'common_anode' ? 'Common Anode (Active LOW)' : 'Common Cathode (Active HIGH)'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Controls */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/30 flex flex-wrap items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by binary, digit, or row #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFollowActiveRow(!followActiveRow)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                followActiveRow
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Follow Active Row</span>
            </button>

            <button
              onClick={handleCopyCSV}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied CSV!' : 'Copy CSV'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Table Container */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full border-collapse text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase bg-slate-950/60 sticky top-0 z-10">
                <th className="p-2.5 w-12 text-center">Row</th>
                {config.mode === 'direct' ? (
                  <>
                    <th className="p-2.5 text-center">a</th>
                    <th className="p-2.5 text-center">b</th>
                    <th className="p-2.5 text-center">c</th>
                    <th className="p-2.5 text-center">d</th>
                    <th className="p-2.5 text-center">e</th>
                    <th className="p-2.5 text-center">f</th>
                    <th className="p-2.5 text-center">g</th>
                  </>
                ) : (
                  <>
                    <th className="p-2.5 text-center">D (MSB)</th>
                    <th className="p-2.5 text-center">C</th>
                    <th className="p-2.5 text-center">B</th>
                    <th className="p-2.5 text-center">A (LSB)</th>
                  </>
                )}
                {config.showDecimalPoint && <th className="p-2.5 text-center">DP</th>}
                <th className="p-2.5 text-center">Decoded</th>
                <th className="p-2.5 text-center">Dec / Hex</th>
                <th className="p-2.5 text-center">Segment LEDs (a b c d e f g)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRows.map((row) => (
                <tr
                  key={row.rowIdx}
                  ref={row.isActive ? activeRowRef : null}
                  className={`transition-colors ${
                    row.isActive
                      ? 'bg-cyan-950/70 border-y border-cyan-500/80 font-bold text-cyan-200'
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  {/* Row # */}
                  <td className="p-2 text-center font-mono opacity-60">{row.rowIdx}</td>

                  {/* Input Pins */}
                  {config.mode === 'direct' ? (
                    ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((seg) => {
                      const val = row.inputValues[`in-${seg}`];
                      return (
                        <td key={seg} className="p-2 text-center">
                          <span
                            className={`inline-block w-5 py-0.5 rounded text-[10px] font-bold ${
                              val === 1
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-900 text-slate-500'
                            }`}
                          >
                            {val}
                          </span>
                        </td>
                      );
                    })
                  ) : (
                    [3, 2, 1, 0].map((bitIdx) => {
                      const val = row.inputValues[`in-${bitIdx}`];
                      return (
                        <td key={bitIdx} className="p-2 text-center">
                          <span
                            className={`inline-block w-5 py-0.5 rounded text-[10px] font-bold ${
                              val === 1
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-900 text-slate-500'
                            }`}
                          >
                            {val}
                          </span>
                        </td>
                      );
                    })
                  )}

                  {/* DP pin if active */}
                  {config.showDecimalPoint && (
                    <td className="p-2 text-center">
                      <span
                        className={`inline-block w-5 py-0.5 rounded text-[10px] font-bold ${
                          row.inputValues['in-dp'] === 1
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-900 text-slate-500'
                        }`}
                      >
                        {row.inputValues['in-dp'] ?? 0}
                      </span>
                    </td>
                  )}

                  {/* Decoded Character */}
                  <td className="p-2 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-bold">
                      {row.decodedChar === ' ' ? 'BLANK' : row.decodedChar}
                    </span>
                  </td>

                  {/* Decimal / Hex */}
                  <td className="p-2 text-center">
                    <span className="text-slate-400 font-mono">
                      {row.decimalVal !== null
                        ? `${row.decimalVal} (0x${row.decimalVal.toString(16).toUpperCase()})`
                        : 'Custom'}
                    </span>
                  </td>

                  {/* Segment LED Badges */}
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((seg) => {
                        const isOn = (row.segments as Record<string, boolean>)[seg];
                        return (
                          <span
                            key={seg}
                            title={`Seg ${seg.toUpperCase()}: ${isOn ? 'ON' : 'OFF'}`}
                            className={`w-4 h-5 rounded text-[9px] font-bold flex items-center justify-center uppercase transition-all ${
                              isOn
                                ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 shadow-[0_0_4px_rgba(6,182,212,0.4)]'
                                : 'bg-slate-950 border border-slate-800 text-slate-600'
                            }`}
                          >
                            {seg}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredRows.length} rows</span>
          <div className="flex items-center gap-1 text-[11px]">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Row automatically tracks current circuit inputs</span>
          </div>
        </div>
      </div>
    </div>
  );
};
