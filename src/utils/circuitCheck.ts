import { CellValue } from './circuitTruthTableEngine';
import { evaluate, parseExpressions, variablesOf, Expr } from './expression';

/**
 * "Check my circuit": compares a circuit's truth table with expected outputs written as expressions
 * (`Sum = A ⊕ B ⊕ Cin`, one output per line). Outputs and variables are matched to the table's columns
 * by their short name or full label, ignoring case.
 */
export interface CheckColumn {
  /** Name used in expressions (the table's short name, e.g. "Cin"). */
  name: string;
  /** Full label on the canvas (e.g. "Carry in (Cin)"). */
  label: string;
}

export interface CheckResult {
  /** Why the expected outputs can't be checked (a typing mistake, or a name the circuit doesn't have). */
  error?: string;
  /** Outputs that were checked (table column numbers). */
  checked: number[];
  /** Rows where some checked output differs, with what was expected for each differing output. */
  mismatches: { index: number; expected: { output: number; value: 0 | 1 }[] }[];
  rows: number;
}

const lookup = (columns: CheckColumn[], name: string) => {
  const key = name.toLowerCase();
  return columns.findIndex((c) => c.name.toLowerCase() === key || c.label.toLowerCase() === key);
};

export function checkCircuit(
  text: string,
  inputs: CheckColumn[],
  outputs: CheckColumn[],
  rows: { index: number; outputs: CellValue[] }[]
): CheckResult {
  const fail = (error: string): CheckResult => ({ error, checked: [], mismatches: [], rows: rows.length });
  let lines;
  try {
    lines = parseExpressions(text);
  } catch (e) {
    return fail((e as Error).message);
  }
  if (lines.length === 0) return fail('Write the expected outputs, for example Y = A·B');

  const targets: { output: number; expr: Expr }[] = [];
  for (const line of lines) {
    const output = lookup(outputs, line.output);
    if (output < 0) return fail(`The circuit has no output called ${line.output}. Outputs: ${outputs.map((o) => o.name).join(', ') || 'none'}`);
    targets.push({ output, expr: line.expr });
  }
  const unknown = variablesOf(targets.map((t) => t.expr)).filter((v) => lookup(inputs, v) < 0);
  if (unknown.length > 0) {
    return fail(`The circuit has no input called ${unknown.join(', ')}. Inputs: ${inputs.map((i) => i.name).join(', ') || 'none'}`);
  }

  const mismatches: CheckResult['mismatches'] = [];
  rows.forEach((row) => {
    // Row bits, first input = most significant
    const env: Record<string, 0 | 1> = {};
    inputs.forEach((col, i) => {
      const bit = ((row.index >> (inputs.length - 1 - i)) & 1) as 0 | 1;
      env[col.name] = bit;
      env[col.name.toLowerCase()] = bit;
      env[col.label] = bit;
    });
    const named = (e: Expr): Expr =>
      e.kind === 'var'
        ? { kind: 'var', name: inputs[lookup(inputs, e.name)].name }
        : e.kind === 'not'
        ? { kind: 'not', arg: named(e.arg) }
        : e.kind === 'const'
        ? e
        : { kind: e.kind, args: e.args.map(named) };
    const wrong = targets
      .map((t) => ({ output: t.output, value: evaluate(named(t.expr), env) }))
      .filter((t) => row.outputs[t.output] !== t.value);
    if (wrong.length > 0) mismatches.push({ index: row.index, expected: wrong });
  });

  return { checked: targets.map((t) => t.output), mismatches, rows: rows.length };
}
