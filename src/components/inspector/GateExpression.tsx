import React from 'react';
import { GateType } from '../../types/circuit';

/** Bar over a term, the textbook notation for NOT. */
const Bar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="[text-decoration-line:overline] [text-decoration-thickness:1.5px]">{children}</span>
);

const join = (names: string[], op: string) =>
  names.map((n, i) => (
    <React.Fragment key={n + i}>
      {i > 0 && <span className="text-fg-subtle"> {op} </span>}
      {n}
    </React.Fragment>
  ));

/**
 * Boolean expression for a gate or 1-bit adder, using the input names (pin aliases or A, B, C).
 * Returns null for parts without a short expression.
 */
export function gateExpression(gateType: GateType, names: string[]): { label: string; expr: React.ReactNode }[] | null {
  const [a, b, c] = names;
  switch (gateType) {
    case 'AND':
      return [{ label: 'Y', expr: join(names, '·') }];
    case 'OR':
      return [{ label: 'Y', expr: join(names, '+') }];
    case 'XOR':
      return [{ label: 'Y', expr: join(names, '⊕') }];
    case 'NAND':
      return [{ label: 'Y', expr: <Bar>{join(names, '·')}</Bar> }];
    case 'NOR':
      return [{ label: 'Y', expr: <Bar>{join(names, '+')}</Bar> }];
    case 'XNOR':
      return [{ label: 'Y', expr: <Bar>{join(names, '⊕')}</Bar> }];
    case 'NOT':
      return [{ label: 'Y', expr: <Bar>{a}</Bar> }];
    case 'BUFFER':
      return [{ label: 'Y', expr: a }];
    case 'HALF_ADDER':
      return [
        { label: 'Sum', expr: join([a, b], '⊕') },
        { label: 'Cout', expr: join([a, b], '·') },
      ];
    case 'FULL_ADDER':
      return [
        { label: 'Sum', expr: join([a, b, c], '⊕') },
        {
          label: 'Cout',
          expr: (
            <>
              {a}·{b} <span className="text-fg-subtle">+</span> {c}·({a} <span className="text-fg-subtle">⊕</span> {b})
            </>
          ),
        },
      ];
    default:
      return null;
  }
}
