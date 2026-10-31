import { describe, it, expect } from 'vitest';
import { checkText, RULES } from './conventions-rules.mjs';

type Finding = { rule: string; line: number };
const rulesHit = (file: string, text: string) => (checkText(file, text) as Finding[]).map((f) => f.rule);

// One snippet that must be flagged and one that must pass, per rule
const CASES: Record<string, { file: string; bad: string; good: string }> = {
  'no-native-dialog': {
    file: 'src/components/ui/Thing.tsx',
    bad: "if (window.confirm('Delete?')) remove();",
    good: "<ConfirmDialog title=\"Delete?\" onConfirm={remove} />",
  },
  'store-selector': {
    file: 'src/components/ui/Thing.tsx',
    bad: 'const store = useCircuitStore();',
    good: 'const nodes = useCircuitStore((s) => s.nodes);',
  },
  'floating-default': {
    file: 'src/simulation/icLogic.ts',
    bad: 'const en = inputs[2] ?? 1;',
    good: 'const en = floatingAs(inputs[2], 1);',
  },
  'make-id': {
    file: 'src/store/slices/editor.ts',
    bad: 'const node = { id: `node-${Date.now()}` };',
    good: "const node = { id: makeId('node'), updatedAt: Date.now() };",
  },
  'semantic-colors': {
    file: 'src/components/inspector/NewPanel.tsx',
    bad: "<div style={{ color: '#ff0000' }} />",
    good: '<div className="text-fg-muted bg-surface-2" />',
  },
  'sentence-case': {
    file: 'src/components/ui/Thing.tsx',
    bad: '<h3 className="text-xs uppercase">Editing</h3>',
    good: '<h3 className="text-xs font-semibold">Editing</h3>',
  },
  'lf-endings': {
    file: 'src/utils/thing.ts',
    bad: 'const a = 1;\r\nconst b = 2;\r\n',
    good: 'const a = 1;\nconst b = 2;\n',
  },
};

describe('convention rules', () => {
  it('has a case for every rule', () => {
    expect(Object.keys(CASES).sort()).toEqual((RULES as { id: string }[]).map((r) => r.id).sort());
  });

  it.each(Object.entries(CASES))('%s flags the bad snippet and passes the good one', (id, c) => {
    expect(rulesHit(c.file, c.bad)).toContain(id);
    expect(rulesHit(c.file, c.good)).not.toContain(id);
  });

  it('reports the line number', () => {
    const [f] = checkText('src/components/ui/Thing.tsx', 'a\nb\nwindow.alert(1)\n') as Finding[];
    expect(f.line).toBe(3);
  });

  it('allows hex colours in hardware faces', () => {
    expect(rulesHit('src/components/nodes/ChipFrame.tsx', "const c = '#2c2e33';")).toEqual([]);
  });

  it('skips a line marked as a deliberate exception', () => {
    expect(rulesHit('src/components/ui/Thing.tsx', 'className="uppercase" // conventions-ignore sentence-case: hex digits')).toEqual([]);
  });

  it('does not flag colours in non-component code or test files for dialogs', () => {
    expect(rulesHit('src/theme/signals.ts', "const x = '#123456';")).toEqual([]);
    expect(rulesHit('src/components/ui/Thing.test.tsx', 'window.confirm = vi.fn();')).not.toContain('no-native-dialog');
  });
});
