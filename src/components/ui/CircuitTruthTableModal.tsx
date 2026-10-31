import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, Copy, Download, Image as ImageIcon, Info, Table, Wand2 } from 'lucide-react';
import { exprFromSOP, formatExpr } from '../../utils/expression';
import { useShallow } from 'zustand/react/shallow';
import { ModalFrame } from './Dialog';
import { ModalHeader } from './ModalHeader';
import { Button } from './Button';
import { SegmentedControl } from './SegmentedControl';
import { TruthTable, TruthTableRow } from './TruthTable';
import { useCircuitStore } from '../../store/useCircuitStore';
import { useTableExport, tableLines } from './useTableExport';
import {
  CircuitTableModel,
  CircuitTableRow,
  MAX_TABLE_INPUTS,
  MemoryStart,
  currentRowIndex,
  describeCircuitForTable,
  generateCircuitTruthTable,
  rowInputLevels,
  shortSignalNames,
  tableInputsKey,
} from '../../utils/circuitTruthTableEngine';
import { Implicant, MAX_MINIMIZE_VARS, formatSOP, minimizeSOP } from '../../utils/booleanMinimizer';
import { KMAP_MAX_VARS, KMAP_MIN_VARS } from '../../utils/karnaugh';
import { KarnaughMap } from './KarnaughMap';

interface CircuitTruthTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Open the build dialog with these expressions (one output per line). */
  onBuildCircuit?: (expressions: string) => void;
}

export const CircuitTruthTableModal: React.FC<CircuitTruthTableModalProps> = ({ isOpen, onClose, onBuildCircuit }) =>
  // Only subscribe to the circuit while the dialog is open
  isOpen ? <CircuitTruthTableDialog onClose={onClose} onBuildCircuit={onBuildCircuit} /> : null;

interface OutputSummary {
  label: string;
  name: string;
  minterms: number[];
  unknownRows: number[];
  terms: Implicant[] | null;
}

/** Sum of products with complemented inputs drawn with an overbar, as in textbooks. */
const Expression: React.FC<{ terms: Implicant[]; names: string[] }> = ({ terms, names }) => {
  if (terms.length === 0) return <span>0</span>;
  if (terms.some((t) => t.every((b) => b === null))) return <span>1</span>;
  const multiChar = names.some((n) => n.length > 1);
  return (
    <>
      {terms.map((bits, ti) => (
        <React.Fragment key={ti}>
          {ti > 0 && <span className="text-fg-subtle"> + </span>}
          {bits.map((b, v) =>
            b === null ? null : (
              <React.Fragment key={v}>
                {multiChar && bits.slice(0, v).some((x) => x !== null) && <span className="text-fg-subtle">·</span>}
                <span className={b === 0 ? 'overline decoration-1' : undefined}>{names[v]}</span>
              </React.Fragment>
            )
          )}
        </React.Fragment>
      ))}
    </>
  );
};

const formatList = (items: (number | string)[], max = 24) =>
  items.length > max ? `${items.slice(0, max).join(', ')}, …` : items.join(', ');

const CircuitTruthTableDialog: React.FC<{ onClose: () => void; onBuildCircuit?: (expressions: string) => void }> = ({
  onClose,
  onBuildCircuit,
}) => {
  const { nodes, edges, customComponents, setInputLevels } = useCircuitStore(
    useShallow((s) => ({ nodes: s.nodes, edges: s.edges, customComponents: s.customComponents, setInputLevels: s.setInputLevels }))
  );
  const titleId = useId();
  const tableRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLTableRowElement>(null);

  const [showInternal, setShowInternal] = useState(false);
  const [memoryStart, setMemoryStart] = useState<MemoryStart>('reset');
  const [rows, setRows] = useState<CircuitTableRow[] | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const structureKey = tableInputsKey(nodes, edges, false);
  // Recompute only when the circuit's structure changes, not on every switch flip
  const model: CircuitTableModel = useMemo(() => describeCircuitForTable(nodes, edges), [structureKey]);

  const tooManyInputs = model.inputs.length > MAX_TABLE_INPUTS;
  const canBuild = model.inputs.length > 0 && model.outputs.length > 0 && !tooManyInputs;
  // Rows that start from the canvas depend on its current values, so those must regenerate the table too
  const fromCanvas = model.isSequential && memoryStart === 'canvas';
  const generationKey = fromCanvas ? tableInputsKey(nodes, edges, true) : structureKey;

  useEffect(() => {
    if (!canBuild) {
      setRows(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const state = useCircuitStore.getState();
      const total = 2 ** model.inputs.length;
      const result = await generateCircuitTruthTable(state.nodes, state.edges, model, {
        memoryStart: model.isSequential ? memoryStart : 'reset',
        customComponents: state.customComponents,
        onProgress: (done) => setProgress(total > 128 && done < total ? { done, total } : null),
        shouldCancel: () => cancelled,
      });
      if (!cancelled && result) setRows(result);
    }, 80);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [generationKey, memoryStart, customComponents, canBuild, model]);

  const activeIndex = canBuild ? currentRowIndex(nodes, model) : -1;

  // Keep the live row in view as switches change
  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, rows]);

  const inputNames = model.inputs.map((c) => c.label);
  const varNames = useMemo(() => shortSignalNames(inputNames), [inputNames.join('\n')]);
  const outputVarNames = useMemo(() => shortSignalNames(model.outputs.map((c) => c.label)), [model]);
  const renamed = varNames.some((v, i) => v !== inputNames[i]);
  const visibleInternal = showInternal ? model.internal : [];

  const summaries: OutputSummary[] = useMemo(() => {
    if (!rows) return [];
    return model.outputs.flatMap((column, oi) => {
      if (column.format !== 'bit') return [];
      const minterms: number[] = [];
      const unknownRows: number[] = [];
      rows.forEach((r) => {
        const v = r.outputs[oi];
        if (v === 1) minterms.push(r.index);
        else if (v !== 0) unknownRows.push(r.index);
      });
      const terms = unknownRows.length === 0 && model.inputs.length <= MAX_MINIMIZE_VARS ? minimizeSOP(minterms, model.inputs.length) : null;
      return [{ label: column.label, name: outputVarNames[oi], minterms, unknownRows, terms }];
    });
  }, [rows, model, outputVarNames]);

  const tableRows: TruthTableRow[] = (rows ?? []).map((r) => ({
    key: `r${r.index}`,
    index: r.index,
    inputs: r.inputs,
    internal: showInternal ? r.internal : undefined,
    outputs: r.outputs,
    isActive: r.index === activeIndex,
    warning: r.unstable ? "The circuit doesn't settle for this combination" : undefined,
  }));
  const activeRow = tableRows.find((r) => r.isActive);

  const { copied, copyLines, downloadCSV, saveImage } = useTableExport('circuit-truth-table');
  const lines = (sep: string) =>
    tableLines(
      ['m', ...inputNames, ...visibleInternal.map((c) => c.label), ...model.outputs.map((c) => c.label)],
      tableRows.map((r) => [r.index, ...r.inputs, ...(r.internal ?? []), ...r.outputs]),
      sep
    );

  const handleCopy = () => {
    const expressions = summaries
      .filter((s) => s.terms)
      .map((s) => `${s.name} = ${formatSOP(s.terms!, varNames)}`);
    copyLines([...lines('\t'), ...(expressions.length ? ['', ...expressions] : [])]);
  };

  // Simplified expressions as text the build dialog reads back (needs every output simplified)
  const buildText = summaries.length > 0 && summaries.every((s) => s.terms)
    ? summaries.map((s) => `${/^[A-Za-z][A-Za-z0-9_]*$/.test(s.name) ? s.name : `[${s.name}]`} = ${formatExpr(exprFromSOP(s.terms!, varNames))}`).join('\n')
    : null;

  const rowCount = 2 ** model.inputs.length;
  const description = canBuild
    ? `${model.inputs.length} input${model.inputs.length === 1 ? '' : 's'} · ${model.outputs.length} output${
        model.outputs.length === 1 ? '' : 's'
      } · ${rowCount} rows`
    : 'Every input combination and what the outputs show';

  const emptyMessage =
    model.inputs.length === 0
      ? 'Add a switch, push button or DIP switch and wire it into your circuit to build its truth table.'
      : model.outputs.length === 0
      ? 'Wire an LED, logic probe or display to the result you want to see. The table lists what it shows for every input combination.'
      : tooManyInputs
      ? `This circuit has ${model.inputs.length} inputs (${rowCount.toLocaleString()} rows). Truth tables are limited to ${MAX_TABLE_INPUTS} inputs; try a smaller part of the circuit, or turn it into a custom component and test that.`
      : null;

  return (
    <ModalFrame isOpen onClose={onClose} labelledBy={titleId} className="w-[96vw] max-w-6xl h-[88vh] print:w-full print:h-auto">
      <ModalHeader titleId={titleId} icon={<Table className="w-5 h-5" />} title="Circuit truth table" description={description} onClose={onClose} />

      {emptyMessage ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-2">
            <Info className="w-6 h-6 mx-auto text-fg-subtle" aria-hidden="true" />
            <p className="text-sm text-fg-muted">{emptyMessage}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Live row and options */}
          <div className="px-5 py-2.5 border-b border-line flex flex-wrap items-center gap-x-6 gap-y-2 shrink-0 print:hidden">
            <p className="text-[13px] text-fg-muted flex-1 min-w-[240px]" aria-live="polite">
              {activeRow ? (
                <>
                  On the canvas now: row <span className="font-mono text-fg">m{activeRow.index}</span>
                  {model.outputs.length > 0 && (
                    <>
                      {' '}
                      ({model.outputs.map((c, i) => `${c.label} = ${activeRow.outputs[i] === -1 ? '?' : activeRow.outputs[i]}`).join(', ')})
                    </>
                  )}
                  . Click a row to set the switches to it.
                </>
              ) : (
                'Click a row to set the switches on the canvas to it.'
              )}
            </p>

            {model.internal.length > 0 && (
              <label className="inline-flex items-center gap-2 text-[13px] text-fg-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showInternal}
                  onChange={(e) => setShowInternal(e.target.checked)}
                  className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
                />
                Show intermediate signals ({model.internal.length})
              </label>
            )}

            {model.isSequential && (
              <div className="flex items-center gap-2 text-[13px] text-fg-muted">
                <span>Each row starts from</span>
                <SegmentedControl<MemoryStart>
                  ariaLabel="Each row starts from"
                  fullWidth={false}
                  size="xs"
                  value={memoryStart}
                  onChange={setMemoryStart}
                  options={[
                    { value: 'reset', label: 'Reset' },
                    { value: 'canvas', label: 'Canvas state' },
                  ]}
                />
              </div>
            )}
          </div>

          {(model.isSequential || model.usesFallbackOutputs) && (
            <div className="px-5 py-2 border-b border-line bg-surface-0 text-xs text-fg-muted space-y-1 shrink-0">
              {model.isSequential && (
                <p>
                  This circuit has memory (a latch, flip-flop or feedback loop), so an output can depend on earlier inputs, not only on the
                  row. <strong className="font-medium text-fg">Reset</strong> starts every row with memory cleared; a{' '}
                  <span className="text-signal-unknown">?</span> means the result depends on what was stored.{' '}
                  <strong className="font-medium text-fg">Canvas state</strong> starts from what the circuit holds right now.
                </p>
              )}
              {model.usesFallbackOutputs && (
                <p>No LEDs or displays are wired, so the outputs are the gate outputs that aren't connected to anything.</p>
              )}
            </div>
          )}

          {progress && (
            <div className="h-0.5 bg-surface-2 shrink-0" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done} aria-label="Building the table">
              <div className="h-full bg-accent transition-[width]" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
          )}

          <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
            <div className="flex-1 min-h-0 min-w-0 overflow-auto px-5 py-3">
              <div ref={tableRef} className="bg-surface-1 inline-block min-w-full">
                {rows ? (
                  <TruthTable
                    caption="Truth table for the circuit on the canvas"
                    inputHeaders={inputNames}
                    internalHeaders={visibleInternal.map((c) => c.label)}
                    outputHeaders={model.outputs.map((c) => c.label)}
                    rows={tableRows}
                    activeRowRef={activeRowRef}
                    showMinterms
                    onRowClick={(row) => setInputLevels(rowInputLevels(model, row.index))}
                  />
                ) : (
                  <p className="py-10 text-center text-sm text-fg-subtle">Working out every combination…</p>
                )}
              </div>
            </div>

            {summaries.length > 0 && (
              <aside
                aria-label="Output expressions"
                className="lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-line overflow-y-auto px-5 py-3 max-h-[35%] lg:max-h-none"
              >
                <h3 className="text-xs font-medium text-fg-subtle mb-2">Expressions</h3>
                <ul className="space-y-3">
                  {summaries.map((s) => (
                    <li key={s.label} className="text-[13px]">
                      <div className="font-mono text-fg break-words">
                        <span className="font-semibold text-accent-fg" title={s.label}>{s.name}</span>
                        <span className="text-fg-subtle"> = </span>
                        {s.terms ? <Expression terms={s.terms} names={varNames} /> : <span className="text-fg-subtle">…</span>}
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-fg-muted break-words">
                        Σm({formatList(s.minterms)})
                      </div>
                      {s.unknownRows.length > 0 && (
                        <p className="mt-0.5 text-xs text-signal-unknown">
                          Unknown in {s.unknownRows.length === 1 ? 'row' : 'rows'} {formatList(s.unknownRows.map((i) => `m${i}`), 8)}, so
                          it can't be simplified. Check for unconnected inputs{model.isSequential ? ' or memory that is never set' : ''}.
                        </p>
                      )}
                      {!s.terms && s.unknownRows.length === 0 && (
                        <p className="mt-0.5 text-xs text-fg-subtle">Simplified form is shown for up to {MAX_MINIMIZE_VARS} inputs.</p>
                      )}
                      {model.inputs.length >= KMAP_MIN_VARS && model.inputs.length <= KMAP_MAX_VARS && rows && (
                        <details className="mt-2" open={summaries.length <= 2}>
                          <summary className="text-xs text-accent-fg cursor-pointer select-none">Karnaugh map</summary>
                          <div className="mt-2">
                            <KarnaughMap names={varNames} minterms={s.minterms} unknownRows={s.unknownRows} terms={s.terms} outputName={s.name} />
                          </div>
                        </details>
                      )}
                    </li>
                  ))}
                </ul>
                {(renamed || outputVarNames.some((v, i) => v !== model.outputs[i].label)) && (
                  <p className="mt-3 text-xs text-fg-subtle">
                    {[...model.inputs.map((c, i) => [varNames[i], c.label]), ...model.outputs.map((c, i) => [outputVarNames[i], c.label])]
                      .filter(([v, label]) => v !== label)
                      .map(([v, label]) => `${v} = ${label}`)
                      .join(' · ')}
                  </p>
                )}
                {model.isSequential && (
                  <p className="mt-3 text-xs text-fg-subtle">With memory, these describe the table as built, not the circuit in every situation.</p>
                )}
              </aside>
            )}
          </div>

          <footer className="px-5 py-3 border-t border-line flex flex-wrap items-center gap-2 shrink-0 print:hidden">
            <span className="text-xs text-fg-subtle mr-auto">
              <span className="font-mono text-fg">1</span> high · <span className="font-mono">0</span> low ·{' '}
              <span className="font-mono text-signal-unknown">?</span> unknown (floating or never set)
              {tableRows.some((r) => r.warning) && <> · <span className="text-signal-unknown">⚠</span> doesn't settle</>}
            </span>
            <Button size="sm" variant="ghost" disabled={!rows} leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} onClick={handleCopy}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button size="sm" variant="ghost" disabled={!rows} leftIcon={<Download className="w-4 h-4" />} onClick={() => downloadCSV(lines(','))}>
              CSV
            </Button>
            <Button size="sm" variant="secondary" disabled={!rows} leftIcon={<ImageIcon className="w-4 h-4" />} onClick={() => saveImage(tableRef.current)}>
              Save image
            </Button>
            {onBuildCircuit && (
              <Button
                size="sm"
                variant="secondary"
                disabled={!buildText}
                title="Build these simplified expressions as a new circuit, for example with NAND gates only"
                leftIcon={<Wand2 className="w-4 h-4" />}
                onClick={() => buildText && onBuildCircuit(buildText)}
              >
                Build circuit
              </Button>
            )}
          </footer>
        </>
      )}
    </ModalFrame>
  );
};
