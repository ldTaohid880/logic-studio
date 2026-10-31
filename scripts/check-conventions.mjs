#!/usr/bin/env node
// Checks the project conventions in scripts/conventions-rules.mjs over src/ and scripts/.
// Usage: node scripts/check-conventions.mjs [files...]   (no files = whole repo). Exits 1 on findings.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkText, formatFinding } from './conventions-rules.mjs';

const root = resolve(fileURLToPath(import.meta.url), '../..');
const SKIP = new Set(['node_modules', 'dist', '.git', '.claude']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

const args = process.argv.slice(2);
const files = args.length ? args.map((f) => resolve(f)) : ['src', 'scripts'].flatMap((d) => walk(join(root, d)));

const findings = files.flatMap((path) => {
  const file = relative(root, path).split(sep).join('/');
  return checkText(file, readFileSync(path, 'utf8'));
});

if (findings.length) {
  findings.forEach((f) => console.error(formatFinding(f)));
  console.error(`\n${findings.length} convention finding${findings.length === 1 ? '' : 's'}. Fix them, or add "// conventions-ignore <rule>: reason" to a line that is a deliberate exception.`);
  process.exit(1);
}
console.log(`Conventions OK (${files.length} files)`);
