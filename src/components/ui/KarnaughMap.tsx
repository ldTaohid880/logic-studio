import React from 'react';
import { Implicant, formatSOP } from '../../utils/booleanMinimizer';
import { KMapLayout, groupRects, kmapLayout } from '../../utils/karnaugh';

const CELL = 30;
// Group outlines cycle through these; each group also gets its own inset, so overlapping groups stay visible
const GROUP_COLORS = ['var(--accent)', 'var(--pu-500)', 'var(--am-500)', 'var(--cy-500)', 'var(--danger)', 'var(--signal-high)'];

const codeLabel = (code: number, bits: number) => code.toString(2).padStart(bits, '0');

interface KarnaughMapProps {
  names: string[];
  minterms: number[];
  unknownRows: number[];
  /** Rows marked "don't care" (shown as X); groups may cover them. */
  dontCares?: number[];
  terms: Implicant[] | null;
  outputName: string;
}

/** K-map of one output (2–4 inputs), with each simplified term's group outlined in its own color. */
export const KarnaughMap: React.FC<KarnaughMapProps> = ({ names, minterms, unknownRows, dontCares = [], terms, outputName }) => {
  const dc = new Set(dontCares);
  const layout: KMapLayout = kmapLayout(names.length);
  const ones = new Set(minterms);
  const unknown = new Set(unknownRows);
  const rowNames = names.slice(0, layout.rowVars).join('');
  const colNames = names.slice(layout.rowVars).join('');
  const width = layout.colCodes.length * CELL;
  const height = layout.rowCodes.length * CELL;

  return (
    <figure className="space-y-2">
      <div className="inline-grid font-mono text-xs" style={{ gridTemplateColumns: `auto repeat(${layout.colCodes.length}, ${CELL}px)` }}>
        <div className="pr-1.5 pb-1 text-[10px] text-fg-subtle leading-tight text-right">
          <span className="block">{colNames} →</span>
          <span className="block">{rowNames} ↓</span>
        </div>
        {layout.colCodes.map((c) => (
          <div key={c} className="text-center text-fg-subtle self-end pb-1">
            {codeLabel(c, layout.colVars)}
          </div>
        ))}
        {layout.rowCodes.map((r, ri) => (
          <React.Fragment key={r}>
            <div className="pr-1.5 text-right text-fg-subtle self-center" style={{ gridColumn: 1, gridRow: ri + 2 }}>
              {codeLabel(r, layout.rowVars)}
            </div>
            {layout.cells[ri].map((m, ci) => (
              <div
                key={m}
                className={`relative border border-line flex items-center justify-center ${ones.has(m) ? 'text-fg font-semibold' : 'text-fg-subtle'}`}
                style={{ height: CELL, gridColumn: ci + 2, gridRow: ri + 2 }}
                title={`m${m}: ${outputName} = ${unknown.has(m) ? 'unknown' : dc.has(m) ? "don't care" : ones.has(m) ? 1 : 0}`}
              >
                {unknown.has(m) ? <span className="text-signal-unknown">?</span> : dc.has(m) ? 'X' : ones.has(m) ? 1 : 0}
                <span className="absolute right-0.5 bottom-0 text-[8px] text-fg-subtle font-normal">{m}</span>
              </div>
            ))}
          </React.Fragment>
        ))}
        {/* Group outlines over the cells */}
        {terms && terms.length > 0 && (
          <svg
            width={width}
            height={height}
            className="pointer-events-none overflow-visible"
            style={{ gridColumn: `2 / span ${layout.colCodes.length}`, gridRow: `2 / span ${layout.rowCodes.length}` }}
            aria-hidden="true"
          >
            {terms.map((term, gi) => {
              const inset = 3 + (gi % 4) * 2;
              const color = GROUP_COLORS[gi % GROUP_COLORS.length];
              return groupRects(term, layout).map((r, ri) => (
                <rect
                  key={`${gi}-${ri}`}
                  x={r.col * CELL + inset}
                  y={r.row * CELL + inset}
                  width={r.cols * CELL - 2 * inset}
                  height={r.rows * CELL - 2 * inset}
                  rx={8}
                  fill={color}
                  fillOpacity={0.08}
                  stroke={color}
                  strokeWidth={2}
                />
              ));
            })}
          </svg>
        )}
      </div>
      {terms && terms.length > 0 && (
        <figcaption className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono">
          {terms.map((term, gi) => (
            <span key={gi} className="inline-flex items-center gap-1.5 text-fg-muted">
              <span className="w-2.5 h-2.5 rounded-sm border-2" style={{ borderColor: GROUP_COLORS[gi % GROUP_COLORS.length] }} aria-hidden="true" />
              {formatSOP([term], names)}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
};
