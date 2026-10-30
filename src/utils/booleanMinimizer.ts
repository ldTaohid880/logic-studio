/**
 * Two-level Boolean minimisation (Quine–McCluskey) for truth tables up to MAX_MINIMIZE_VARS inputs.
 * Variable 0 is the most significant bit of a row index, matching textbook truth tables (A is the MSB).
 */

export const MAX_MINIMIZE_VARS = 8;

/** One product term: for each variable 1 (true), 0 (complemented) or null (not in the term). */
export type Implicant = (0 | 1 | null)[];

interface Term {
  bits: Implicant;
  covers: number[];
}

const toBits = (index: number, numVars: number): Implicant =>
  Array.from({ length: numVars }, (_, v) => ((index >> (numVars - 1 - v)) & 1) as 0 | 1);

const key = (bits: Implicant) => bits.map((b) => (b === null ? '-' : b)).join('');

// Two terms combine when they differ in exactly one fixed variable and share their don't-care positions
function combine(a: Implicant, b: Implicant): Implicant | null {
  let diff = -1;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    if (a[i] === null || b[i] === null || diff !== -1) return null;
    diff = i;
  }
  if (diff === -1) return null;
  const merged = [...a];
  merged[diff] = null;
  return merged;
}

function primeImplicants(terms: number[], numVars: number): Term[] {
  let current: Term[] = terms.map((t) => ({ bits: toBits(t, numVars), covers: [t] }));
  const primes = new Map<string, Term>();

  while (current.length > 0) {
    const used = new Set<number>();
    const next = new Map<string, Term>();
    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        const merged = combine(current[i].bits, current[j].bits);
        if (!merged) continue;
        used.add(i);
        used.add(j);
        const k = key(merged);
        if (!next.has(k)) {
          next.set(k, { bits: merged, covers: [...new Set([...current[i].covers, ...current[j].covers])] });
        }
      }
    }
    current.forEach((term, i) => {
      if (!used.has(i)) primes.set(key(term.bits), term);
    });
    current = Array.from(next.values());
  }
  return Array.from(primes.values());
}

const literalCount = (bits: Implicant) => bits.filter((b) => b !== null).length;

/**
 * Minimal sum of products covering `minterms`, free to use `dontCares`.
 * Essential prime implicants first, then a greedy cover of what remains
 * (minimal for the circuits students build; not guaranteed optimal for every function).
 * Returns [] for a constant 0 and [[null, ...]] for a constant 1.
 */
export function minimizeSOP(minterms: number[], numVars: number, dontCares: number[] = []): Implicant[] {
  if (minterms.length === 0) return [];
  if (numVars === 0) return [[]];

  const primes = primeImplicants([...new Set([...minterms, ...dontCares])].sort((a, b) => a - b), numVars);
  const remaining = new Set(minterms);
  const chosen: Term[] = [];

  // Essential primes: the only prime covering some minterm
  minterms.forEach((m) => {
    const covering = primes.filter((p) => p.covers.includes(m));
    if (covering.length === 1 && !chosen.includes(covering[0])) chosen.push(covering[0]);
  });
  chosen.forEach((p) => p.covers.forEach((m) => remaining.delete(m)));

  while (remaining.size > 0) {
    let best: Term | null = null;
    let bestGain = 0;
    primes.forEach((p) => {
      if (chosen.includes(p)) return;
      const gain = p.covers.filter((m) => remaining.has(m)).length;
      if (gain > bestGain || (gain === bestGain && gain > 0 && best && literalCount(p.bits) < literalCount(best.bits))) {
        best = p;
        bestGain = gain;
      }
    });
    if (!best) break;
    const pick: Term = best;
    chosen.push(pick);
    pick.covers.forEach((m) => remaining.delete(m));
  }

  return chosen
    .map((t) => t.bits)
    .sort((a, b) => key(b).localeCompare(key(a)));
}

/** Plain-text form, e.g. "A'B + AB'" ("0" and "1" for constants). */
export function formatSOP(terms: Implicant[], names: string[]): string {
  if (terms.length === 0) return '0';
  const multiChar = names.some((n) => n.length > 1);
  const parts = terms.map((bits) => {
    const literals = bits.flatMap((b, i) => (b === null ? [] : [`${names[i]}${b === 0 ? "'" : ''}`]));
    if (literals.length === 0) return '1';
    return literals.join(multiChar ? '·' : '');
  });
  return parts.includes('1') ? '1' : parts.join(' + ');
}
