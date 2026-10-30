import React from 'react';

export interface TruthTableRow {
  key: string;
  /** Row number = minterm index of the input combination. */
  index: number;
  inputs: (number | string)[];
  /** Values for the intermediate columns, when the table has any. */
  internal?: (number | string)[];
  outputs: (number | string)[];
  isActive?: boolean;
  /** Short warning shown on the row (e.g. the circuit doesn't settle for it). */
  warning?: string;
}

interface TruthTableProps {
  inputHeaders: string[];
  /** Intermediate signals shown between inputs and outputs, in a muted style. */
  internalHeaders?: string[];
  outputHeaders: string[];
  rows: TruthTableRow[];
  activeRowRef?: React.Ref<HTMLTableRowElement>;
  caption?: string;
  /** Hide the minterm column (e.g. for sequential tables where rows are not minterms). */
  showMinterms?: boolean;
  /** Makes rows clickable (and focusable with Enter/Space). */
  onRowClick?: (row: TruthTableRow) => void;
  rowActionLabel?: string;
}

const cellValue = (v: number | string) => {
  if (v === 1 || v === '1') return <span className="font-semibold text-fg">1</span>;
  if (v === 0 || v === '0') return <span className="text-fg-subtle">0</span>;
  if (v === -1 || v === '?') return <span className="text-signal-unknown">?</span>;
  return <span className="font-semibold text-fg">{v}</span>;
};

const DOUBLE_RULE = 'border-r-[3px] border-r-line-strong [border-right-style:double]';

/**
 * Textbook-style truth table: inputs | outputs separated by a double rule, minterm numbers
 * on the left, and the row matching the live circuit highlighted.
 */
export const TruthTable: React.FC<TruthTableProps> = ({
  inputHeaders,
  internalHeaders = [],
  outputHeaders,
  rows,
  activeRowRef,
  caption,
  showMinterms = true,
  onRowClick,
  rowActionLabel = 'Set the inputs on the canvas to this row',
}) => {
  const hasInternal = internalHeaders.length > 0;
  const onRowKeyDown = (e: React.KeyboardEvent, row: TruthTableRow) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick?.(row);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const tr = e.currentTarget as HTMLElement;
      const next = (e.key === 'ArrowDown' ? tr.nextElementSibling : tr.previousElementSibling) as HTMLElement | null;
      next?.focus();
    }
  };

  return (
    <table className="w-full text-center font-mono text-[13px] tabular-nums border-separate border-spacing-0">
      {caption && <caption className="sr-only">{caption}</caption>}
      <thead className="sticky top-0 z-10 bg-surface-1">
        {hasInternal && (
          <tr className="font-sans text-[11px] text-fg-subtle">
            {showMinterms && <th aria-hidden="true" className="pt-2" />}
            <th scope="colgroup" colSpan={inputHeaders.length} className={`pt-2 px-3 font-medium ${DOUBLE_RULE} border-r-transparent`}>
              Inputs
            </th>
            <th scope="colgroup" colSpan={internalHeaders.length} className="pt-2 px-3 font-medium border-r border-line">
              Intermediate
            </th>
            <th scope="colgroup" colSpan={outputHeaders.length} className="pt-2 px-3 font-medium text-accent-fg">
              Outputs
            </th>
          </tr>
        )}
        <tr className="text-fg">
          {showMinterms && (
            <th scope="col" className="w-14 py-2 px-2 border-b-2 border-line-strong text-left text-xs font-medium text-fg-subtle font-sans">
              <abbr title="Minterm number" className="no-underline">m</abbr>
            </th>
          )}
          {inputHeaders.map((h, i) => (
            <th
              key={`in-${h}-${i}`}
              scope="col"
              className={`py-2 px-3 border-b-2 border-line-strong font-semibold whitespace-nowrap ${i === inputHeaders.length - 1 ? DOUBLE_RULE : ''}`}
            >
              {h}
            </th>
          ))}
          {internalHeaders.map((h, i) => (
            <th
              key={`int-${h}-${i}`}
              scope="col"
              className={`py-2 px-3 border-b-2 border-line-strong font-medium font-sans text-xs text-fg-muted whitespace-nowrap ${
                i === internalHeaders.length - 1 ? 'border-r border-r-line' : ''
              }`}
            >
              {h}
            </th>
          ))}
          {outputHeaders.map((h, i) => (
            <th key={`out-${h}-${i}`} scope="col" className="py-2 px-3 border-b-2 border-line-strong font-semibold text-accent-fg whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.key}
            ref={row.isActive ? activeRowRef : undefined}
            aria-current={row.isActive ? 'true' : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            title={onRowClick ? rowActionLabel : undefined}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onKeyDown={onRowClick ? (e) => onRowKeyDown(e, row) : undefined}
            className={`${row.isActive ? 'bg-accent-soft' : 'even:bg-surface-0/50 hover:bg-surface-2'} ${
              onRowClick ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2' : ''
            }`}
          >
            {showMinterms && (
              <td className={`py-1.5 px-2 text-left text-xs border-b border-line whitespace-nowrap ${row.isActive ? 'text-accent-fg font-semibold' : 'text-fg-subtle'}`}>
                {row.isActive ? (
                  <span title="Matches the inputs on the canvas right now">▸ m{row.index}</span>
                ) : (
                  `m${row.index}`
                )}
                {row.warning && (
                  <span className="ml-1 text-signal-unknown" title={row.warning} aria-label={row.warning}>
                    ⚠
                  </span>
                )}
              </td>
            )}
            {row.inputs.map((v, i) => (
              <td key={`i${i}`} className={`py-1.5 px-3 border-b border-line ${i === row.inputs.length - 1 ? DOUBLE_RULE : ''}`}>
                {cellValue(v)}
              </td>
            ))}
            {(row.internal ?? []).map((v, i, all) => (
              <td key={`n${i}`} className={`py-1.5 px-3 border-b border-line opacity-75 ${i === all.length - 1 ? 'border-r border-r-line' : ''}`}>
                {cellValue(v)}
              </td>
            ))}
            {row.outputs.map((v, i) => (
              <td key={`o${i}`} className="py-1.5 px-3 border-b border-line">
                {cellValue(v)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
