import React from 'react';

export interface TruthTableRow {
  key: string;
  /** Row number = minterm index of the input combination. */
  index: number;
  inputs: (number | string)[];
  outputs: (number | string)[];
  isActive?: boolean;
}

interface TruthTableProps {
  inputHeaders: string[];
  outputHeaders: string[];
  rows: TruthTableRow[];
  activeRowRef?: React.Ref<HTMLTableRowElement>;
  caption?: string;
  /** Hide the minterm column (e.g. for sequential tables where rows are not minterms). */
  showMinterms?: boolean;
}

const cellValue = (v: number | string) => {
  if (v === 1 || v === '1') return <span className="font-semibold text-fg">1</span>;
  if (v === 0 || v === '0') return <span className="text-fg-subtle">0</span>;
  return <span className="text-signal-unknown">{v === -1 ? '?' : v}</span>;
};

/**
 * Textbook-style truth table: inputs | outputs separated by a double rule, minterm numbers
 * on the left, and the row matching the live circuit highlighted.
 */
export const TruthTable: React.FC<TruthTableProps> = ({
  inputHeaders,
  outputHeaders,
  rows,
  activeRowRef,
  caption,
  showMinterms = true,
}) => (
  <table className="w-full text-center font-mono text-[13px] tabular-nums border-separate border-spacing-0">
    {caption && <caption className="sr-only">{caption}</caption>}
    <thead className="sticky top-0 z-10 bg-surface-1">
      <tr className="text-fg">
        {showMinterms && (
          <th scope="col" className="w-12 py-2 px-2 border-b-2 border-line-strong text-left text-xs font-medium text-fg-subtle font-sans">
            <abbr title="Minterm number" className="no-underline">m</abbr>
          </th>
        )}
        {inputHeaders.map((h, i) => (
          <th
            key={`in-${h}-${i}`}
            scope="col"
            className={`py-2 px-3 border-b-2 border-line-strong font-semibold ${
              i === inputHeaders.length - 1 ? 'border-r-[3px] border-r-line-strong [border-right-style:double]' : ''
            }`}
          >
            {h}
          </th>
        ))}
        {outputHeaders.map((h, i) => (
          <th key={`out-${h}-${i}`} scope="col" className="py-2 px-3 border-b-2 border-line-strong font-semibold text-accent-fg">
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
          className={row.isActive ? 'bg-accent-soft' : 'even:bg-surface-0/50 hover:bg-surface-2'}
        >
          {showMinterms && (
            <td className={`py-1.5 px-2 text-left text-xs border-b border-line ${row.isActive ? 'text-accent-fg font-semibold' : 'text-fg-subtle'}`}>
              {row.isActive ? (
                <span title="Matches the inputs on the canvas right now">▸ m{row.index}</span>
              ) : (
                `m${row.index}`
              )}
            </td>
          )}
          {row.inputs.map((v, i) => (
            <td
              key={`i${i}`}
              className={`py-1.5 px-3 border-b border-line ${
                i === row.inputs.length - 1 ? 'border-r-[3px] border-r-line-strong [border-right-style:double]' : ''
              }`}
            >
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
