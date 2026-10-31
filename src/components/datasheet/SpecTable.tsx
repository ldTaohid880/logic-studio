import React from 'react';
import { SpecRow, TimingRow } from '../../data/datasheets/types';

const TH = 'sticky top-0 bg-surface-1 py-2 px-3 font-medium border-b border-line text-left';
const TD = 'py-1.5 px-3 border-b border-line';

/** Parameter | symbol | value | conditions. */
export const SpecTable: React.FC<{ rows: SpecRow[]; caption: string }> = ({ rows, caption }) => (
  <div className="overflow-x-auto rounded-lg border border-line">
    <table className="w-full text-[13px] border-separate border-spacing-0">
      <caption className="sr-only">{caption}</caption>
      <thead className="text-xs text-fg-subtle">
        <tr>
          <th scope="col" className={TH}>Parameter</th>
          <th scope="col" className={TH}>Symbol</th>
          <th scope="col" className={TH}>Value</th>
          <th scope="col" className={TH}>Conditions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.param} className="even:bg-surface-0/50">
            <td className={`${TD} text-fg`}>{r.param}</td>
            <td className={`${TD} font-mono text-fg-muted whitespace-nowrap`}>{r.symbol}</td>
            <td className={`${TD} font-mono tabular-nums font-semibold text-fg whitespace-nowrap`}>{r.value}</td>
            <td className={`${TD} text-xs text-fg-subtle`}>{r.conditions}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const TimingTable: React.FC<{ rows: TimingRow[] }> = ({ rows }) => (
  <div className="overflow-x-auto rounded-lg border border-line">
    <table className="w-full text-[13px] border-separate border-spacing-0">
      <caption className="sr-only">Timing figures</caption>
      <thead className="text-xs text-fg-subtle">
        <tr>
          <th scope="col" className={TH}>Parameter</th>
          <th scope="col" className={TH}>Symbol</th>
          <th scope="col" className={`${TH} text-right`}>Typical</th>
          <th scope="col" className={`${TH} text-right`}>Limit</th>
          <th scope="col" className={TH}>Unit</th>
          <th scope="col" className={TH}>Conditions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={`${r.symbol}-${i}`} className="even:bg-surface-0/50">
            <td className={`${TD} text-fg`}>{r.param}</td>
            <td className={`${TD} font-mono text-fg-muted whitespace-nowrap`}>{r.symbol}</td>
            <td className={`${TD} font-mono tabular-nums text-right text-fg`}>{r.typ}</td>
            <td className={`${TD} font-mono tabular-nums text-right font-semibold text-fg whitespace-nowrap`}>{r.max}</td>
            <td className={`${TD} text-fg-muted`}>{r.unit}</td>
            <td className={`${TD} text-xs text-fg-subtle`}>{r.conditions}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
