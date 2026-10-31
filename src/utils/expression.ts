import { Implicant } from './booleanMinimizer';

/**
 * Boolean expressions as students write them, parsed into a tree.
 *
 * - AND: `AB`, `A·B`, `A*B`, `A&B`, `A∧B`
 * - OR: `A + B`, `A|B`, `A∨B`
 * - XOR: `A ⊕ B`, `A^B`
 * - NOT: `A'`, `!A`, `~A`, `¬A`
 * - constants `0` and `1`, parentheses, and an optional output name: `Y = …`
 *
 * A name is a capital letter followed by lowercase letters, digits or `_` (`A`, `Cin`, `X1`), or a single
 * lowercase letter with digits (`a`, `b2`), so `AB` reads as A·B. Any other name goes in brackets: `[SW1]`.
 * Precedence from loosest: OR, XOR, AND, NOT.
 */
export type Expr =
  | { kind: 'var'; name: string }
  | { kind: 'const'; value: 0 | 1 }
  | { kind: 'not'; arg: Expr }
  | { kind: 'and' | 'or' | 'xor'; args: Expr[] };

export interface ParsedLine {
  output: string;
  expr: Expr;
}

const NAME = /^([A-Z][a-z0-9_]*|[a-z][0-9_]*)/;
const AND_OPS = new Set(['·', '*', '&', '∧', '.']);
const OR_OPS = new Set(['+', '|', '∨']);
const XOR_OPS = new Set(['⊕', '^']);
const NOT_PREFIX = new Set(['!', '~', '¬']);
const NOT_SUFFIX = new Set(["'", '’', '′']);

type Token = { type: 'name'; name: string; at: number } | { type: 'op'; op: string; at: number } | { type: 'end'; at: number };

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      i++;
    } else if (ch === '[') {
      const close = text.indexOf(']', i);
      if (close < 0) throw new SyntaxError(`Missing ] for the name starting at position ${i + 1}`);
      const name = text.slice(i + 1, close).trim();
      if (!name) throw new SyntaxError(`Empty name in brackets at position ${i + 1}`);
      tokens.push({ type: 'name', name, at: i });
      i = close + 1;
    } else if (NAME.test(text.slice(i))) {
      const name = text.slice(i).match(NAME)![0];
      tokens.push({ type: 'name', name, at: i });
      i += name.length;
    } else if ('01()'.includes(ch) || AND_OPS.has(ch) || OR_OPS.has(ch) || XOR_OPS.has(ch) || NOT_PREFIX.has(ch) || NOT_SUFFIX.has(ch)) {
      tokens.push({ type: 'op', op: ch, at: i });
      i++;
    } else {
      throw new SyntaxError(`Unexpected "${ch}" at position ${i + 1}`);
    }
  }
  tokens.push({ type: 'end', at: text.length });
  return tokens;
}

/** Parses one expression (without the `Y =` part). Throws a SyntaxError with a plain-language message. */
export function parseExpression(text: string): Expr {
  const tokens = tokenize(text);
  let pos = 0;
  const peek = () => tokens[pos];
  const isOp = (t: Token, set: Set<string> | string) => t.type === 'op' && (typeof set === 'string' ? t.op === set : set.has(t.op));
  const startsFactor = (t: Token) => t.type === 'name' || isOp(t, '(') || isOp(t, '0') || isOp(t, '1') || isOp(t, NOT_PREFIX);
  const where = (t: Token) => (t.type === 'end' ? 'at the end' : `at position ${t.at + 1}`);

  const flat = (kind: 'and' | 'or' | 'xor', args: Expr[]): Expr =>
    args.length === 1 ? args[0] : { kind, args: args.flatMap((a) => (a.kind === kind ? a.args : [a])) };

  function or(): Expr {
    const args = [xor()];
    while (isOp(peek(), OR_OPS)) {
      pos++;
      args.push(xor());
    }
    return flat('or', args);
  }
  function xor(): Expr {
    const args = [and()];
    while (isOp(peek(), XOR_OPS)) {
      pos++;
      args.push(and());
    }
    return flat('xor', args);
  }
  function and(): Expr {
    const args = [not()];
    for (;;) {
      if (isOp(peek(), AND_OPS)) {
        pos++;
        args.push(not());
      } else if (startsFactor(peek())) {
        args.push(not()); // juxtaposition: AB = A·B
      } else break;
    }
    return flat('and', args);
  }
  function not(): Expr {
    if (isOp(peek(), NOT_PREFIX)) {
      pos++;
      return { kind: 'not', arg: not() };
    }
    let e = atom();
    while (isOp(peek(), NOT_SUFFIX)) {
      pos++;
      e = { kind: 'not', arg: e };
    }
    return e;
  }
  function atom(): Expr {
    const t = peek();
    if (t.type === 'name') {
      pos++;
      return { kind: 'var', name: t.name };
    }
    if (isOp(t, '0') || isOp(t, '1')) {
      pos++;
      return { kind: 'const', value: t.type === 'op' && t.op === '1' ? 1 : 0 };
    }
    if (isOp(t, '(')) {
      pos++;
      const e = or();
      if (!isOp(peek(), ')')) throw new SyntaxError(`Missing ) ${where(peek())}`);
      pos++;
      return e;
    }
    throw new SyntaxError(t.type === 'end' ? 'The expression ends too early' : `Expected a name, 0, 1 or ( ${where(t)}`);
  }

  if (peek().type === 'end') throw new SyntaxError('Write an expression, for example A·B + C');
  const expr = or();
  if (peek().type !== 'end') throw new SyntaxError(`Unexpected "${(peek() as { op?: string }).op ?? ''}" ${where(peek())}`);
  return expr;
}

/**
 * Parses one output per line, `Y = A·B + C` (a line without a name gets Y, Y1, Y2…). Blank lines are skipped.
 * Throws a SyntaxError naming the line.
 */
export function parseExpressions(text: string): ParsedLine[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const used = new Set<string>();
  return lines.map((line, i) => {
    const named = line.match(/^([A-Za-z][A-Za-z0-9_]*|\[[^\]]+\])\s*=(.*)$/);
    try {
      const expr = parseExpression(named ? named[2] : line);
      let output = named ? named[1].replace(/^\[|\]$/g, '') : '';
      if (!output) output = ['Y', ...Array.from({ length: 20 }, (_, n) => `Y${n + 1}`)].find((n) => !used.has(n))!;
      if (used.has(output)) throw new SyntaxError(`${output} is defined twice`);
      used.add(output);
      return { output, expr };
    } catch (e) {
      throw new SyntaxError(lines.length > 1 ? `Line ${i + 1}: ${(e as Error).message}` : (e as Error).message);
    }
  });
}

/** Variable names in an expression, in natural order (A, B, …, X2, X10). */
export function variablesOf(exprs: Expr[]): string[] {
  const names = new Set<string>();
  const walk = (e: Expr) => {
    if (e.kind === 'var') names.add(e.name);
    else if (e.kind === 'not') walk(e.arg);
    else if (e.kind !== 'const') e.args.forEach(walk);
  };
  exprs.forEach(walk);
  return [...names].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function evaluate(e: Expr, env: Record<string, 0 | 1>): 0 | 1 {
  switch (e.kind) {
    case 'var':
      return env[e.name] ?? 0;
    case 'const':
      return e.value;
    case 'not':
      return evaluate(e.arg, env) === 1 ? 0 : 1;
    case 'and':
      return e.args.every((a) => evaluate(a, env) === 1) ? 1 : 0;
    case 'or':
      return e.args.some((a) => evaluate(a, env) === 1) ? 1 : 0;
    case 'xor':
      return (e.args.reduce((acc, a) => acc + evaluate(a, env), 0) % 2) as 0 | 1;
  }
}

/** Rows (first variable = MSB) where the expression is 1. */
export function mintermsOf(e: Expr, vars: string[]): number[] {
  const out: number[] = [];
  for (let row = 0; row < 1 << vars.length; row++) {
    const env = Object.fromEntries(vars.map((v, i) => [v, ((row >> (vars.length - 1 - i)) & 1) as 0 | 1]));
    if (evaluate(e, env) === 1) out.push(row);
  }
  return out;
}

/** Sum of products from minimised terms (see booleanMinimizer). */
export function exprFromSOP(terms: Implicant[], names: string[]): Expr {
  if (terms.length === 0) return { kind: 'const', value: 0 };
  const products: Expr[] = terms.map((bits) => {
    const literals: Expr[] = bits.flatMap((b, i) =>
      b === null ? [] : [b === 1 ? { kind: 'var', name: names[i] } : { kind: 'not', arg: { kind: 'var', name: names[i] } }]
    ) as Expr[];
    if (literals.length === 0) return { kind: 'const', value: 1 };
    return literals.length === 1 ? literals[0] : { kind: 'and', args: literals };
  });
  if (products.some((p) => p.kind === 'const')) return { kind: 'const', value: 1 };
  return products.length === 1 ? products[0] : { kind: 'or', args: products };
}

const SIMPLE_NAME = /^([A-Z][a-z0-9_]*|[a-z][0-9_]*)$/;
const nameText = (name: string) => (SIMPLE_NAME.test(name) ? name : `[${name}]`);

/** Text that parseExpression reads back as the same expression. */
export function formatExpr(e: Expr, parent: 'or' | 'xor' | 'and' | 'not' | null = null): string {
  switch (e.kind) {
    case 'var':
      return nameText(e.name);
    case 'const':
      return String(e.value);
    case 'not':
      return e.arg.kind === 'var' || e.arg.kind === 'const' ? `${formatExpr(e.arg)}'` : `(${formatExpr(e.arg)})'`;
    default: {
      const sep = e.kind === 'and' ? '·' : e.kind === 'or' ? ' + ' : ' ⊕ ';
      const text = e.args.map((a) => formatExpr(a, e.kind)).join(sep);
      const rank = { or: 0, xor: 1, and: 2, not: 3 };
      return parent !== null && rank[parent] > rank[e.kind] ? `(${text})` : text;
    }
  }
}
