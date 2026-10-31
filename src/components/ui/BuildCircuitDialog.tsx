import React, { useEffect, useMemo, useState } from 'react';
import { Wand2 } from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { SegmentedControl } from './SegmentedControl';
import { KarnaughMap } from './KarnaughMap';
import { useCircuitStore } from '../../store/useCircuitStore';
import { MAX_MINIMIZE_VARS, minimizeSOP } from '../../utils/booleanMinimizer';
import { ParsedLine, exprFromSOP, formatExpr, mintermsOf, parseExpressions, variablesOf } from '../../utils/expression';
import { GateStyle, buildNetlist, layoutNetlist, netlistStats } from '../../utils/circuitBuilder';

type Mode = 'expression' | 'table';
type Cell = 0 | 1 | 'X';

const STYLES: { value: GateStyle; label: string }[] = [
  { value: 'basic', label: 'AND, OR, NOT' },
  { value: 'nand', label: 'NAND only' },
  { value: 'nor', label: 'NOR only' },
];
const TABLE_VARS = ['A', 'B', 'C', 'D'];
const NEXT_CELL: Record<string, Cell> = { 0: 1, 1: 'X', X: 0 };

interface BuildCircuitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Expressions to start from, one output per line (e.g. from the circuit truth table). */
  initialText?: string;
}

export const BuildCircuitDialog: React.FC<BuildCircuitDialogProps> = ({ isOpen, onClose, initialText }) => {
  const [mode, setMode] = useState<Mode>('expression');
  const [text, setText] = useState(initialText || "Y = AB + A'C");
  const [simplify, setSimplify] = useState(false);
  const [style, setStyle] = useState<GateStyle>('basic');
  const [tableVars, setTableVars] = useState(3);
  const [cells, setCells] = useState<Cell[]>(() => new Array(8).fill(0));

  // Opening with new expressions (from the truth table) starts from them
  useEffect(() => {
    if (isOpen && initialText) {
      setText(initialText);
      setMode('expression');
    }
  }, [isOpen, initialText]);

  const tableNames = TABLE_VARS.slice(0, tableVars);
  const tableMinterms = cells.flatMap((c, i) => (c === 1 ? [i] : []));
  const tableDontCares = cells.flatMap((c, i) => (c === 'X' ? [i] : []));
  const tableTerms = useMemo(() => minimizeSOP(tableMinterms, tableVars, tableDontCares), [cells, tableVars]);

  // What will be built: parsed expressions (optionally simplified), or the simplified truth table
  const { lines, error } = useMemo((): { lines: ParsedLine[]; error?: string } => {
    if (mode === 'table') return { lines: [{ output: 'Y', expr: exprFromSOP(tableTerms, tableNames) }] };
    try {
      const parsed = parseExpressions(text);
      if (parsed.length === 0) return { lines: [], error: 'Write an expression, for example Y = A·B + C' };
      const vars = variablesOf(parsed.map((l) => l.expr));
      if (!simplify) return { lines: parsed };
      if (vars.length > MAX_MINIMIZE_VARS) return { lines: parsed, error: `Simplifying works for up to ${MAX_MINIMIZE_VARS} variables` };
      return {
        lines: parsed.map((l) => ({ output: l.output, expr: exprFromSOP(minimizeSOP(mintermsOf(l.expr, vars), vars.length), vars) })),
      };
    } catch (e) {
      return { lines: [], error: (e as Error).message };
    }
  }, [mode, text, simplify, tableTerms, tableNames.join()]);

  const nets = useMemo(
    () => (lines.length > 0 ? Object.fromEntries(STYLES.map((s) => [s.value, buildNetlist(lines, s.value)])) : null),
    [lines]
  ) as Record<GateStyle, ReturnType<typeof buildNetlist>> | null;
  const stats = nets ? Object.fromEntries(STYLES.map((s) => [s.value, netlistStats(nets[s.value])])) : null;

  const build = () => {
    if (!nets) return;
    const net = nets[style];
    const { nodes, edges } = layoutNetlist(net);
    useCircuitStore.getState().insertCircuit(nodes, edges);
    const gates = net.gates.length;
    useCircuitStore
      .getState()
      .showToast(`Added ${net.vars.length} switch${net.vars.length === 1 ? '' : 'es'}, ${gates} gate${gates === 1 ? '' : 's'} and ${net.outputs.length} LED${net.outputs.length === 1 ? '' : 's'}`, 'success');
    onClose();
  };

  const setVarCount = (n: number) => {
    setTableVars(n);
    setCells(new Array(1 << n).fill(0));
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Build a circuit"
      description="From a Boolean expression or a truth table. The circuit is added to the canvas, ready to test."
      icon={<Wand2 className="w-4 h-4" />}
      maxWidth="2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!nets || !!error} onClick={build}>
            Add to canvas
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SegmentedControl
          ariaLabel="Start from"
          options={[
            { value: 'expression', label: 'Expression' },
            { value: 'table', label: 'Truth table' },
          ]}
          value={mode}
          onChange={setMode}
        />

        {mode === 'expression' ? (
          <div className="space-y-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              spellCheck={false}
              aria-label="Expressions, one output per line"
              aria-invalid={!!error}
              className="w-full rounded-lg border border-line bg-surface-0 px-3 py-2 font-mono text-sm text-fg focus:outline-none focus:border-accent"
            />
            <p className="text-xs text-fg-subtle">
              One output per line, like <span className="font-mono text-fg-muted">S = A ⊕ B</span>. AND: <span className="font-mono">AB</span>,{' '}
              <span className="font-mono">A·B</span> or <span className="font-mono">A*B</span> · OR: <span className="font-mono">A + B</span> · NOT:{' '}
              <span className="font-mono">A'</span> or <span className="font-mono">!A</span> · XOR: <span className="font-mono">A ⊕ B</span> or{' '}
              <span className="font-mono">A ^ B</span>. Names are a capital letter with optional lowercase letters or digits (A, Cin, X1); put other
              names in brackets: <span className="font-mono">[SW1]</span>.
            </p>
            <label className="flex items-center gap-2 text-[13px] text-fg cursor-pointer w-fit">
              <input type="checkbox" checked={simplify} onChange={(e) => setSimplify(e.target.checked)} className="accent-[var(--accent)]" />
              Simplify first (fewest AND and OR terms)
            </label>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6">
            <div className="space-y-2">
              <SegmentedControl
                size="sm"
                ariaLabel="Number of inputs"
                options={[2, 3, 4].map((n) => ({ value: n, label: `${n} inputs` }))}
                value={tableVars}
                onChange={setVarCount}
              />
              <div className="max-h-72 overflow-y-auto rounded-lg border border-line">
                <table className="text-xs font-mono">
                  <thead className="sticky top-0 bg-surface-2 text-fg-subtle">
                    <tr>
                      {tableNames.map((n) => (
                        <th key={n} className="px-2.5 py-1 font-medium">{n}</th>
                      ))}
                      <th className="px-3 py-1 font-semibold text-accent-fg border-l border-line">Y</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cells.map((c, row) => (
                      <tr key={row} className="border-t border-line">
                        {tableNames.map((n, v) => (
                          <td key={n} className="px-2.5 py-0.5 text-center text-fg-muted">
                            {(row >> (tableVars - 1 - v)) & 1}
                          </td>
                        ))}
                        <td className="border-l border-line p-0.5">
                          <button
                            type="button"
                            onClick={() => setCells(cells.map((x, i) => (i === row ? NEXT_CELL[String(x)] : x)))}
                            aria-label={`Row ${row}: Y is ${c === 'X' ? "don't care" : c}. Change`}
                            className={`w-9 h-6 rounded-md font-semibold ${c === 1 ? 'bg-accent/15 text-fg' : c === 'X' ? 'text-signal-unknown' : 'text-fg-subtle'} hover:bg-surface-2`}
                          >
                            {c}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-fg-subtle max-w-[16rem]">Click an output to cycle 0, 1 and X (don't care).</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-fg-subtle">Karnaugh map</h3>
              <KarnaughMap names={tableNames} minterms={tableMinterms} unknownRows={[]} dontCares={tableDontCares} terms={tableTerms} outputName="Y" />
            </div>
          </div>
        )}

        <div className="rounded-lg bg-surface-2 px-3 py-2 min-h-[2.5rem]" aria-live="polite">
          {error ? (
            <p className="text-[13px] text-danger">{error}</p>
          ) : (
            <ul className="space-y-0.5 font-mono text-[13px] text-fg">
              {lines.map((l) => (
                <li key={l.output}>
                  <span className="text-accent-fg font-semibold">{l.output}</span> = {formatExpr(l.expr)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-fg-subtle mb-1.5">Build with</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {STYLES.map((s) => (
              <label
                key={s.value}
                className={`flex flex-col rounded-lg border px-3 py-2 cursor-pointer ${style === s.value ? 'border-accent bg-accent/5' : 'border-line hover:border-line-strong'}`}
              >
                <span className="flex items-center gap-2 text-[13px] font-medium text-fg">
                  <input type="radio" name="gate-style" checked={style === s.value} onChange={() => setStyle(s.value)} className="accent-[var(--accent)]" />
                  {s.label}
                </span>
                <span className="text-xs text-fg-subtle pl-5 tabular-nums">
                  {stats && !error ? `${stats[s.value].gates} gates · ${stats[s.value].levels} levels` : '–'}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </Dialog>
  );
};
