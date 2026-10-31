#!/usr/bin/env node
// PostToolUse hook for Edit/Write/MultiEdit: checks the edited file against the project conventions
// (scripts/conventions-rules.mjs) and reports findings back to the agent. It never blocks the edit;
// on findings it exits 2 so Claude Code shows stderr to the agent as feedback to act on.
import { readFileSync, existsSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkText, formatFinding } from '../../scripts/conventions-rules.mjs';

const root = resolve(fileURLToPath(import.meta.url), '../../..');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  let path;
  try {
    path = JSON.parse(input)?.tool_input?.file_path;
  } catch {
    process.exit(0);
  }
  if (!path || !existsSync(path)) process.exit(0);
  const file = relative(root, resolve(path)).split(sep).join('/');
  if (file.startsWith('..') || file.startsWith('node_modules/') || file.startsWith('dist/')) process.exit(0);

  const findings = checkText(file, readFileSync(path, 'utf8'));
  if (findings.length === 0) process.exit(0);
  console.error(
    `Project conventions (see CLAUDE.md and .claude/rules/):\n${findings.map(formatFinding).join('\n')}\n` +
      'Fix these, or mark a deliberate exception with "// conventions-ignore <rule>: reason".'
  );
  process.exit(2);
});
