# Agent instructions

For any coding agent (Claude Code, Codex, Cursor, Copilot, …) working on Logic Studio.

## Read first

1. [CLAUDE.md](CLAUDE.md) — commands, layout, the ten hard rules and the definition of done.
2. The topic rules for the area you are changing (Claude Code loads these automatically by path; other agents should open them):
   - [.claude/rules/simulation.md](.claude/rules/simulation.md) — `src/simulation/`, `src/utils/`, `src/types/`
   - [.claude/rules/store.md](.claude/rules/store.md) — `src/store/`, `src/App.tsx`, `src/hooks/`
   - [.claude/rules/ui.md](.claude/rules/ui.md) — `src/components/`, `src/index.css`, `src/theme/`
   - [.claude/rules/testing.md](.claude/rules/testing.md) — tests
   - [.claude/rules/data.md](.claude/rules/data.md) — `src/data/` (catalog, examples, datasheets)

## Runbooks

Step-by-step guides in `.claude/skills/<name>/SKILL.md` (Claude Code skills; plain markdown for everyone else):

| Task | Runbook |
|---|---|
| Add a component type | [add-part](.claude/skills/add-part/SKILL.md) |
| Add a built-in example circuit | [add-example](.claude/skills/add-example/SKILL.md) |
| Check a change in a real browser | [verify-in-browser](.claude/skills/verify-in-browser/SKILL.md) |
| Write Arduino/AVR emulator tests | [avr-program](.claude/skills/avr-program/SKILL.md) |
| Regenerate README screenshots and og-image | [refresh-screenshots](.claude/skills/refresh-screenshots/SKILL.md) |
| Wrap up: checks, docs, commit, PR | [finish-round](.claude/skills/finish-round/SKILL.md) |

A review checklist for a finished diff is in [.claude/agents/convention-reviewer.md](.claude/agents/convention-reviewer.md).

## Before you finish

- `npm run check` — types, project conventions (`npm run lint:conventions`), tests, build. CI runs the same.
- The conventions check prints `file:line rule message`. Fix the code, or mark a deliberate exception with `// conventions-ignore <rule>: reason`.
- Browser checks: `npm run dev`, then `node scripts/agent/browser.mjs` (options at the top of the file; see verify-in-browser). Dev builds expose `window.__logicStudio.store`.
