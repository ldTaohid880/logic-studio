# Logic Studio

Browser-based digital logic simulator for engineering students. React 19 + TypeScript (strict) + Vite 6, canvas via `@xyflow/react` (React Flow 12), state in Zustand 5, styling with Tailwind v4. No backend: everything runs client-side and persists to `localStorage`.

## Commands

```bash
npm install              # npm is the package manager (package-lock.json); don't add bun/yarn lockfiles
npm run dev              # dev server on http://localhost:3000 (stop with `fuser -k 3000/tcp`, not pkill)
npm run lint             # tsc --noEmit (strict)
npm run lint:conventions # project conventions (scripts/conventions-rules.mjs)
npm test                 # vitest run (npm run test:watch for watch mode)
npm run check            # lint + conventions + test + build — run before declaring work done
npm run build            # production bundle to dist/
npm run screenshots      # README screenshots + og-image (dev server must be running)
```

CI (`.github/workflows/ci.yml`) runs `npm ci`, lint, conventions, test and build on pushes to `main` and on PRs. Vitest skips `.claude/` (local backups and tooling).

## Where the details are

This file stays short. Topic rules load automatically when you work on matching files; read them directly if your tool doesn't:

| Topic | File |
|---|---|
| Simulation: signals, engine, shared wires, buses, analog, timeline, boards, LCD, memory, custom components, removed parts | `.claude/rules/simulation.md` |
| Store: slices, undo, selectors, ids, files, projects, share links, storage keys | `.claude/rules/store.md` |
| UI: colour tokens, signal readability, grid, hardware faces, dialogs, copy | `.claude/rules/ui.md` |
| Tests: helpers, IC reference tests, example golden checks, AVR programs, browser checks | `.claude/rules/testing.md` |
| Catalog, examples, datasheets | `.claude/rules/data.md` |

Runbooks (Claude Code skills in `.claude/skills/`, plain markdown for any agent): `add-part`, `add-example`, `verify-in-browser`, `avr-program`, `refresh-screenshots`, `finish-round`. The `convention-reviewer` agent (`.claude/agents/`) reviews a diff against these rules.

## Hard rules

1. Signals are `0 | 1 | -1`; **-1 is floating**, never `undefined`. Unconnected control inputs use `floatingAs(value, default)`, never `?? 1`.
2. The engine (`propagateSignals`) never mutates its inputs; every store mutation ends with `get().tickSimulation()`.
3. User-visible edits are undoable (`saveHistory`, `saveHistoryCoalesced`, `updateNodeData`); momentary input changes are not.
4. Components read the store with a selector (`useCircuitStore((s) => s.x)` or `useShallow`), never bare `useCircuitStore()`.
5. Ids come from `makeId(prefix)`; pin ids are `in-N` / `out-N` and match React Flow handle ids.
6. Colours come from semantic tokens; hex only on real-hardware faces. Signal state must be readable without colour (1/0/? digits, hollow amber pins, dashed wires).
7. Dialogs use `ModalFrame`/`ModalHeader`; destructive actions confirm with `ConfirmDialog`, never `window.confirm`.
8. Copy is sentence case and plain language; no all-caps labels.
9. Every new part follows the `add-part` checklist, including a test (`icLogic.test.ts` fails for a chip without one) and its datasheet.
10. Don't download or run external toolchains (e.g. arduino-cli): emulator tests use hand-assembled programs (`avr-program` skill).

Rules 1, 4, 5 (ids), 6, 7, 8 and LF line endings are checked by `npm run lint:conventions`, and in Claude Code by a hook after each edit (`.claude/hooks/post-edit.mjs`). A deliberate exception gets `// conventions-ignore <rule>: reason` on the line.

## Definition of done

`npm run check` passes; behaviour/UI changes are tried in the browser (`verify-in-browser`); CLAUDE.md, the matching rule file, ROADMAP.md and README.md describe the change; no model names or ids in commits, PRs or code (`finish-round`).

## Layout

```
scripts/        check-conventions.mjs + conventions-rules.mjs (npm run lint:conventions; also the edit hook),
                agent/ (browser.mjs Playwright helper, screenshots.mjs, og-image.mjs)
public/         favicon.svg (the logo; Logo.tsx draws the same mark), PNG icons, og-image.png (link preview)
src/
  main.tsx      wraps App in ErrorBoundary (recovery screen: reload, download autosave, clear autosave);
                dev builds expose window.__logicStudio = { store, propagateSignals } for browser checks
  simulation/   pure logic, no React — engine.ts (propagateSignals), icLogic.ts,
                customComponentLogic.ts, encoderLogic.ts (+ engine.test.ts);
                timeline.ts (simulated time: clocks, boards, timing diagram traces);
                avr/ (Uno-compatible board: intelHex.ts, unoBoard.ts on avr8js, boards.ts = lazy-loaded running boards);
                sensors.ts (sensor modules and potentiometer), hd44780.ts (16×2 LCD controller)
  store/        Zustand store, split into slices
    useCircuitStore.ts   composes slices + throttled autosave
    types.ts             CircuitStore interface, StoreSlice<T>, ThemeMode/UiDensity/WireStyle
    helpers.ts           storage keys/loaders, makeId, removeUnsupportedParts, markRemovedWireTargets
    partFactory.ts       createPart: default pins, label and settings for a new part (used by addNode)
    projectStorage.ts    saved projects: index + one localStorage key per project
    slices/              editor, clipboard, groups, devices, simulation, timeline, customComponents, project, projects, history, ui
  data/components.ts     parts catalog (PARTS, PART_CATEGORIES, getComponentInfo): names, descriptions,
                         categories and part numbers used by the parts bin and the properties panel
  data/datasheets/       datasheet for every part (types, family.ts = 74HC figures, one module per category, generated.ts fallback,
                         functionTable.ts built from the simulation; getDatasheet(type) in index.ts)
  data/examples/         built-in example circuits, one module per category; index.ts sets the order
  theme/signals.ts       signal colors/widths as CSS variables (signalColor, signalState, wireStrokeWidth)
  components/
    canvas/     CircuitCanvas (nodeTypes, context menu, drop), CanvasControls, EmptyCanvas, breadcrumbs
    nodes/      one React Flow node per family; Pin.tsx (all handles), partKit.tsx (labels/leads for I/O parts),
                ChipFrame.tsx (ICs, encoder and custom components drawn as DIP packages), symbols/gateGeometry.ts
                (IEEE gate shapes; gates stay schematic symbols)
    toolbar/    TopBar (File/View menus), LeftToolbox (parts bin + icon rail), PartGlyph, StatusBar
    datasheet/  DatasheetReader (lazy-loaded wide reader, opened with `openDatasheet(type)` from the ui slice), DipPinout, PinTable, SpecTable, FunctionTable
    timeline/   TimingPanel: run controls + timing diagram under the canvas, shown only with a clock or board
    inspector/  InspectorPanel (picks the view), TimedPartPanels (clock, ROM/RAM, ALU, board), PartLiveView ("How it works"), CircuitOverview (nothing
                selected), SelectionSummary (several selected), WireInspector, per-part panels
    ui/         primitives: Dialog/ModalFrame, ModalHeader, ConfirmDialog, DropdownMenu/MenuPanel, Tooltip,
                IconButton, Button, Input, SegmentedControl, Select, TruthTable, Toast; plus dialogs.
                Part truth tables (gate, encoder, 7-segment) use TruthTableDialog + useTableExport
    custom/     custom component wizard and library dialogs
  hooks/        useGlobalShortcuts (all keyboard shortcuts), useMediaQuery
  config/       shortcuts.ts (list shown in the Shortcuts dialog — keep in sync with useGlobalShortcuts)
  types/        circuit.ts (GateType, NodeData, PinData, SignalValue) + encoder/sevenSegment/customComponent
  utils/        pin factories, truth tables (gateTruthTable, circuitTruthTableEngine, booleanMinimizer),
                karnaugh (K-map layout and groups), expression (parser/printer for Boolean expressions),
                circuitBuilder (expression → gates in AND/OR/NOT, NAND or NOR style, laid out by level),
                circuitCheck (truth table vs expected outputs), busPins (joiner/splitter pins, bus hex),
                circuitStats (gate counts, logic levels, longest path), billOfMaterials (parts list packed into 74HC chips),
                exportCanvas + pdf (PNG/SVG/PDF export, no PDF library), verilog (structural Verilog), shareLink (#circuit= links),
                canvasBridge (visible canvas center for click-to-add), fileActions, import/export
```

## Gotchas

- `index.html` link-preview tags use `%SITE_URL%`, replaced at build time by a plugin in `vite.config.ts` (`SITE_URL`, else Vercel's production domain, else https://logic-studio-gamma.vercel.app, the live deployment). `__APP_VERSION__` comes from `package.json`.
- Regenerate `public/og-image.png` and the README screenshots in `.github/assets/` when the UI changes noticeably (`npm run screenshots`, `refresh-screenshots` skill).
- `tsconfig` has `allowJs` and a `@` → repo-root alias; imports in `src/` use relative paths.
- Files use LF line endings; when editing with scripts on Windows, write with `newline=''` (Python) so they don't turn into CRLF.
