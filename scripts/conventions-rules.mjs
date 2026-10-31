// Project conventions that can be checked mechanically (see CLAUDE.md and .claude/rules/).
// Shared by scripts/check-conventions.mjs (whole repo, run by `npm run check` and CI) and
// .claude/hooks/post-edit.mjs (the file an agent just edited). Plain Node, no dependencies.
//
// A line can opt out of a rule with a trailing comment: `// conventions-ignore <rule-id>: reason`.

/** Files under src/components that may use hex colours, with the reason. New entries need a reason too. */
export const HEX_ALLOWED = {
  'src/components/nodes/': 'Real-hardware faces (chips, switches, displays, board, sensors) look the same in both themes',
  'src/components/datasheet/DipPinout.tsx': 'Chip package drawing, same colours as ChipFrame',
  'src/components/ui/Logo.tsx': 'The logo mark',
  'src/components/toolbar/TopBar.tsx': 'Fallback canvas colour for exports when the CSS variable cannot be read',
  'src/components/ui/useTableExport.ts': 'Fallback background for table images',
  'src/components/inspector/WireInspector.tsx': 'Wire colour palette the user picks from',
  'src/components/inspector/OutputColorPicker.tsx': 'LED colour swatches the user picks from',
  'src/components/inspector/CustomComponentProperties.tsx': 'Default colour of a user-coloured component',
  'src/components/custom/': 'Colour palette for user-made components',
};

const isAllowed = (file, table) => Object.keys(table).some((p) => (p.endsWith('/') ? file.startsWith(p) : file === p));

/**
 * Each rule: id, which files it applies to, a per-line regex (or a whole-file check) and the message.
 * Keep messages short and say what to do instead.
 */
export const RULES = [
  {
    id: 'no-native-dialog',
    applies: (f) => /^src\/.*\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f),
    pattern: /\bwindow\.(confirm|prompt|alert)\s*\(|(^|[^.\w])(confirm|prompt|alert)\s*\(\s*['"`]/,
    message: 'Use ConfirmDialog (components/ui) instead of window.confirm/prompt/alert',
  },
  {
    id: 'store-selector',
    applies: (f) => /^src\/.*\.tsx?$/.test(f),
    pattern: /\buseCircuitStore\(\s*\)/,
    message: 'Subscribe with a selector: useCircuitStore((s) => s.x) or useShallow; a bare useCircuitStore() re-renders on every change',
  },
  {
    id: 'floating-default',
    applies: (f) => /^src\/.*\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f),
    pattern: /\b(inputs|outputs)\[[^\]]+\](\.value)?\s*\?\?\s*1\b/,
    message: 'Floating is -1, not undefined: use floatingAs(value, default) from simulation/icLogic.ts',
  },
  {
    id: 'make-id',
    applies: (f) => /^src\/.*\.tsx?$/.test(f) && f !== 'src/utils/ids.ts' && !/\.test\.tsx?$/.test(f),
    pattern: /\bid\s*[:=]\s*`[^`]*\$\{Date\.now\(\)\}|`[\w-]*-\$\{Date\.now\(\)\}-\$\{Math\.random/,
    message: 'Make ids with makeId(prefix) from utils/ids.ts, not Date.now()',
  },
  {
    id: 'semantic-colors',
    applies: (f) => /^src\/components\/.*\.tsx?$/.test(f) && !isAllowed(f, HEX_ALLOWED),
    pattern: /(['"`\[(\s:])#[0-9a-fA-F]{3}([0-9a-fA-F]{3}([0-9a-fA-F]{2})?)?\b(?![\w-])/,
    message: 'Use semantic colour tokens (bg-surface-*, text-fg-*, accent, signal-*); hex is for hardware faces listed in HEX_ALLOWED',
  },
  {
    id: 'sentence-case',
    applies: (f) => /^src\/components\/.*\.tsx$/.test(f),
    pattern: /className=[^>]*\buppercase\b/,
    message: 'UI copy is sentence case: no `uppercase` labels',
  },
  {
    id: 'lf-endings',
    applies: (f) => /\.(ts|tsx|mjs|cjs|js|css|md|json|html)$/.test(f),
    file: (text) => (text.includes('\r\n') ? 'File has CRLF line endings; save it with LF' : null),
  },
];

/** Check one file's text. `file` is repo-relative with forward slashes. */
export function checkText(file, text) {
  const findings = [];
  const lines = text.split('\n');
  for (const rule of RULES) {
    if (!rule.applies(file)) continue;
    if (rule.file) {
      const message = rule.file(text);
      if (message) findings.push({ file, line: 1, rule: rule.id, message });
      continue;
    }
    lines.forEach((line, i) => {
      if (!rule.pattern.test(line)) return;
      if (new RegExp(`conventions-ignore\\s+${rule.id}\\b`).test(line)) return;
      findings.push({ file, line: i + 1, rule: rule.id, message: rule.message });
    });
  }
  return findings;
}

export const formatFinding = (f) => `${f.file}:${f.line}  ${f.rule}  ${f.message}`;
