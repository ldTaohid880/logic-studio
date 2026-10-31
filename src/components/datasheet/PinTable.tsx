import React from 'react';
import { DatasheetPin } from '../../data/datasheets/types';

const DIR_LABEL: Record<DatasheetPin['dir'], string> = { in: 'Input', out: 'Output', io: 'In/out', power: 'Power', nc: 'None' };

/** Pin name with an overbar when the pin is active low. */
export const PinName: React.FC<{ pin: Pick<DatasheetPin, 'name' | 'low'> }> = ({ pin }) =>
  pin.low ? (
    <span className="underline-offset-0 [text-decoration:overline]" title="Active low">
      {pin.name}
    </span>
  ) : (
    <span>{pin.name}</span>
  );

interface PinTableProps {
  pins: DatasheetPin[];
  /** Names of the Logic Studio pins that stand for each package pin number. */
  studioPins: ReadonlyMap<number, string[]>;
  activePin: number | null;
  onActivePin: (n: number | null) => void;
}

/** One row per package pin. Hovering or focusing a row lights up the pin in the drawing. */
export const PinTable: React.FC<PinTableProps> = ({ pins, studioPins, activePin, onActivePin }) => {
  const hasStudio = studioPins.size > 0;
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-[13px] border-separate border-spacing-0">
        <caption className="sr-only">Pins of the package</caption>
        <thead className="text-left text-xs text-fg-subtle">
          <tr>
            <th scope="col" className="sticky top-0 bg-surface-1 py-2 px-3 font-medium border-b border-line w-12">Pin</th>
            <th scope="col" className="sticky top-0 bg-surface-1 py-2 px-3 font-medium border-b border-line">Name</th>
            <th scope="col" className="sticky top-0 bg-surface-1 py-2 px-3 font-medium border-b border-line">Type</th>
            <th scope="col" className="sticky top-0 bg-surface-1 py-2 px-3 font-medium border-b border-line">What it does</th>
            {hasStudio && <th scope="col" className="sticky top-0 bg-surface-1 py-2 px-3 font-medium border-b border-line">In Logic Studio</th>}
          </tr>
        </thead>
        <tbody>
          {pins.map((p) => {
            const active = activePin === p.n;
            const studio = studioPins.get(p.n);
            return (
              <tr
                key={p.n}
                tabIndex={0}
                aria-label={`Pin ${p.n}, ${p.name}`}
                onMouseEnter={() => onActivePin(p.n)}
                onMouseLeave={() => onActivePin(null)}
                onFocus={() => onActivePin(p.n)}
                onBlur={() => onActivePin(null)}
                className={`outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${active ? 'bg-accent-soft' : 'even:bg-surface-0/50'}`}
              >
                <td className="py-1.5 px-3 border-b border-line font-mono tabular-nums text-fg-muted">{p.n}</td>
                <td className="py-1.5 px-3 border-b border-line font-mono font-semibold text-fg whitespace-nowrap">
                  <PinName pin={p} />
                </td>
                <td className="py-1.5 px-3 border-b border-line text-fg-muted whitespace-nowrap">{DIR_LABEL[p.dir]}</td>
                <td className="py-1.5 px-3 border-b border-line text-fg-muted">{p.fn}</td>
                {hasStudio && (
                  <td className="py-1.5 px-3 border-b border-line font-mono text-xs text-accent-fg whitespace-nowrap">{studio ? studio.join(', ') : ''}</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
