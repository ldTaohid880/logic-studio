import React from 'react';
import { TruthTable } from '../ui/TruthTable';
import { FunctionTableData } from '../../data/datasheets';
import { ModeTable } from '../../data/datasheets/types';

/** Function table made from the simulation (one row per input combination, or example rows for wide parts). */
export const FunctionTable: React.FC<{ data: FunctionTableData; caption: string }> = ({ data, caption }) => (
  <div className="overflow-auto max-h-[28rem] rounded-lg border border-line bg-surface-1 print:max-h-none print:overflow-visible">
    <TruthTable
      caption={caption}
      inputHeaders={data.inputHeaders}
      outputHeaders={data.outputHeaders}
      showMinterms={false}
      rows={data.rows.map((r) => ({ key: r.key, index: r.index, inputs: r.inputs, outputs: r.outputs }))}
    />
  </div>
);

const cell = (v: string) => {
  if (v === 'H') return <span className="font-semibold text-fg">H</span>;
  if (v === 'L') return <span className="text-fg-subtle">L</span>;
  if (v === 'X') return <span className="text-fg-muted" title="Don't care: either value">X</span>;
  if (v === '↑') return <span className="font-semibold text-accent-fg" title="Rising clock edge">↑</span>;
  if (v === '↓') return <span className="font-semibold text-accent-fg" title="Falling edge">↓</span>;
  if (v === 'Z') return <span className="text-signal-unknown" title="Output off (floating)">Z</span>;
  return <span className="text-fg">{v}</span>;
};

/** Hand-written mode table in the H/L/X/↑ notation used by real datasheets. */
export const ModeTableView: React.FC<{ table: ModeTable; caption: string }> = ({ table, caption }) => {
  const hasNotes = table.rows.some((r) => r.note);
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-center font-mono text-[13px] tabular-nums border-separate border-spacing-0">
        <caption className="sr-only">{caption}</caption>
        <thead className="font-semibold text-fg">
          <tr>
            {table.inputHeaders.map((h, i) => (
              <th key={`i${h}`} scope="col" className={`py-2 px-3 border-b-2 border-line-strong bg-surface-1 ${i === table.inputHeaders.length - 1 ? 'border-r-[3px] border-r-line-strong [border-right-style:double]' : ''}`}>
                {h}
              </th>
            ))}
            {table.outputHeaders.map((h) => (
              <th key={`o${h}`} scope="col" className="py-2 px-3 border-b-2 border-line-strong bg-surface-1 text-accent-fg">
                {h}
              </th>
            ))}
            {hasNotes && (
              <th scope="col" className="py-2 px-3 border-b-2 border-line-strong bg-surface-1 font-sans text-xs font-medium text-fg-subtle text-left">
                Mode
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r, ri) => (
            <tr key={ri} className="even:bg-surface-0/50">
              {r.inputs.map((v, i) => (
                <td key={`i${i}`} className={`py-1.5 px-3 border-b border-line ${i === r.inputs.length - 1 ? 'border-r-[3px] border-r-line-strong [border-right-style:double]' : ''}`}>
                  {cell(v)}
                </td>
              ))}
              {r.outputs.map((v, i) => (
                <td key={`o${i}`} className="py-1.5 px-3 border-b border-line">
                  {cell(v)}
                </td>
              ))}
              {hasNotes && <td className="py-1.5 px-3 border-b border-line font-sans text-xs text-left text-fg-muted">{r.note}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
