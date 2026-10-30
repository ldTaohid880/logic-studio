# Logic Studio

Browser-based digital logic simulator for engineering students. React 19 + TypeScript (strict) + Vite 6, canvas via `@xyflow/react` (React Flow 12), state in Zustand 5, styling with Tailwind v4. No backend: everything runs client-side and persists to `localStorage`.

## Commands

```bash
npm install          # npm is the package manager (package-lock.json); don't add bun/yarn lockfiles
npm run dev          # dev server on http://localhost:3000
npm run lint         # tsc --noEmit (strict)
npm test             # vitest run (npm run test:watch for watch mode)
npm run check        # lint + test + build — run before declaring work done
npm run build        # production bundle to dist/
```

CI (`.github/workflows/ci.yml`) runs `npm ci`, lint, test and build on pushes to `main` and on PRs. Vitest skips `.claude/` (local backups and tooling).

## Layout

```
src/
  simulation/   pure logic, no React — engine.ts (propagateSignals), icLogic.ts,
                customComponentLogic.ts, encoderLogic.ts (+ engine.test.ts)
  store/        Zustand store, split into slices
    useCircuitStore.ts   composes slices + throttled autosave
    types.ts             CircuitStore interface, StoreSlice<T>, ThemeMode/UiDensity/WireStyle
    helpers.ts           storage keys/loaders, makeId, removeUnsupportedParts, markRemovedWireTargets
    partFactory.ts       createPart: default pins, label and settings for a new part (used by addNode)
    slices/              editor, clipboard, groups, devices, simulation, customComponents, project, history, ui
  data/components.ts     parts catalog (PARTS, PART_CATEGORIES, getComponentInfo): names, descriptions,
                         categories and part numbers used by the parts bin and the properties panel
  data/examples/         built-in example circuits, one module per category; index.ts sets the order
  theme/signals.ts       signal colors/widths as CSS variables (signalColor, signalState, wireStrokeWidth)
  components/
    canvas/     CircuitCanvas (nodeTypes, context menu, drop), CanvasControls, EmptyCanvas, breadcrumbs
    nodes/      one React Flow node per family; Pin.tsx (all handles), partKit.tsx (labels/leads for I/O parts),
                ChipFrame.tsx (ICs and custom components), symbols/gateGeometry.ts (IEEE gate shapes)
    toolbar/    TopBar (File/View menus), LeftToolbox (parts bin + icon rail), PartGlyph, StatusBar
    inspector/  InspectorPanel (picks the view), PartLiveView ("How it works"), CircuitOverview (nothing
                selected), SelectionSummary (several selected), WireInspector, per-part panels
    ui/         primitives: Dialog/ModalFrame, ModalHeader, ConfirmDialog, DropdownMenu/MenuPanel, Tooltip,
                IconButton, Button, Input, SegmentedControl, Select, TruthTable, Toast; plus dialogs.
                Part truth tables (gate, encoder, 7-segment) use TruthTableDialog + useTableExport
    custom/     custom component wizard and library dialogs
  hooks/        useGlobalShortcuts (all keyboard shortcuts), useMediaQuery
  config/       shortcuts.ts (list shown in the Shortcuts dialog — keep in sync with useGlobalShortcuts)
  types/        circuit.ts (GateType, NodeData, PinData, SignalValue) + encoder/sevenSegment/customComponent
  utils/        pin factories, truth tables (gateTruthTable, circuitTruthTableEngine, booleanMinimizer),
                canvasBridge (visible canvas center for click-to-add), fileActions, import/export
```

## How the simulation works

- Signals are `SignalValue = 0 | 1 | -1`; **-1 means floating/unknown**, never `undefined`.
- The store owns `nodes`/`edges` (React Flow shape). Pin values live in `node.data.inputs[]` / `node.data.outputs[]`; pin ids are `in-N` / `out-N` and must match React Flow handle ids.
- There is no clock and no running loop. Every mutation ends with `get().tickSimulation()`, which calls `propagateSignals(nodes, edges, customComponents)` from `simulation/engine.ts` and bumps `simulation.stepCount`. The engine clones nodes, iterates until stable (at least 12 passes, up to node count + 4, capped at 256), and returns new nodes/edges — it never mutates its inputs. If it runs out of passes it returns the still-changing parts in `unstableNodeIds`; `tickSimulation` stores them in `simulation.unstableNodeIds`, adds the `ls-unstable` class (amber outline) and the status bar warns. `resetSimulation` sets inputs to 0, floats everything else and re-settles.
- Engine dispatch: fixed ICs are in the `IC_GATE_TYPES` set; special cases are sources (INPUT, PUSH_BUTTON, CONST_*), DIP_SWITCH, displays (OUTPUT, LOGIC_PROBE, SEVEN_SEGMENT, HEX_DISPLAY, BUS_MONITOR), ENCODER, CUSTOM and TUNNEL; plain gates go through `evaluateGate` (`utils/gateLogic.ts`).
- Memory parts keep state in `data.icState`: the D latch follows D while enabled; flip-flops and the register act on the CLK edge, which students make with a push button or switch.
- `PinData.driven` marks pins fed by a wire; when the wire disappears the engine floats the pin to -1. Pins without the flag (e.g. encoder inputs toggled in the UI) keep manual values. When removing edges in the store, call `markRemovedWireTargets` (helpers.ts) first.
- Unconnected control inputs use `floatingAs(value, default)` (icLogic.ts) — never `inputs[n] ?? 1`, because floating is -1, not undefined.
- TUNNEL: only tunnels with a wired input drive their label (case-insensitive); conflicting drivers give -1. Tunnels are not evaluated as ICs.
- Custom components: an instance caches internal state in `data.subcircuitNodeStates` tagged with `defVersion = def.updatedAt`; bump `updatedAt` whenever a definition changes so instances rebuild. Nesting is capped at `MAX_SUBCIRCUIT_DEPTH`; check `detectComponentRecursion` before inserting, pasting or importing components.
- Removed parts (clock, oscilloscope, configurable `CFG_*`, multi-input bus, bus splitter/joiner/tap, LED matrix, RGB LED, equation generator, counters/shift registers/ALU and similar) are listed in `helpers.ts`. `removeUnsupportedParts` drops them from the autosaved circuit, opened files and loaded examples; `loadCircuit` tells the user how many were left out. Don't reintroduce those gate types without restoring their logic.

## Store conventions

- Put new actions in the slice that owns the domain; add the signature to `CircuitStore` in `store/types.ts` and the key to that slice's `Pick<>` type.
- Make user-visible edits undoable: `get().saveHistory()` for discrete edits, `get().saveHistoryCoalesced(key)` for typing-style edits (same key within ~1.2s = one undo step). `updateNodeData(nodeId, patch, { propagate })` does this for simple data fields — prefer it over `useCircuitStore.setState` in components. Momentary input changes (switch flips, `setButtonPressed`, `toggleDipBit`) are deliberately not recorded. History is cleared when entering/leaving a sub-circuit.
- Components subscribe with selectors: `useCircuitStore(useShallow((s) => ({ a: s.a })))` or `useCircuitStore((s) => s.a)`. Never call `useCircuitStore()` without a selector (re-renders on every change). `useCircuitStore.getState()` is fine inside event handlers, not during render.
- New ids come from `makeId(prefix)` (`utils/ids.ts`, re-exported from `store/helpers.ts`), not `Date.now()` alone.
- Opening a circuit file goes through `openCircuitFile(text)` (project slice) → `parseCircuitFile` (`utils/circuitFile.ts`), which validates, adds bundled custom components (clashing ids become copies) and rejects recursive ones. Don't merge `customComponents` with `setState`.
- localStorage keys: `logic_studio_circuit` (autosaved root circuit), `logic_studio_presets`, `logic_studio_custom_components`, `logic_studio_ui_prefs` (theme, density, wire style, minimap; ui slice). UI-only keys written by components: `logic_studio_recent_parts`, `logic_studio_bin_sections` (parts bin), `logic_studio_inspector_width`.
- `showToast(message, variant?)` picks the error style automatically for messages starting with "Cannot", "Failed", "Invalid", etc.; pass a variant to override.

## UI conventions

- Colors come from semantic tokens in `src/index.css` (`bg-surface-0..3`, `text-fg/-muted/-subtle`, `border-line(-strong)`, `accent`, `signal-high/low/unknown/bus`), defined for both `[data-theme="dark"]` and `[data-theme="light"]`. Legacy `slate-*`/`emerald-*`/`cyan-*` classes are remapped to theme variables (light theme mirrors the accent scales), but new code should use the semantic names. Avoid hard-coded hex except for the always-dark display faces (`DisplayFace` in partKit).
- Signal state must be readable without color: digits (1/0/?), hollow amber pins and dashed wires for floating. Use `Pin` for every handle (state via `data-signal`) and `signalColor`/`signalState` from `theme/signals.ts`.
- Canvas parts sit on the 15px snap grid with pins on a 30px pitch. Unboxed parts (gates, switch, LED…) use the `lsp-schematic` class (no card chrome, dashed selection frame); boxed parts (chips, displays) don't.
- Dialogs use `ModalFrame`/`Dialog` (portal, Escape closes the topmost dialog, focus trap/restore) with `ModalHeader`. Confirm destructive actions with `ConfirmDialog`, never `window.confirm`/`prompt`.
- Copy is sentence case and plain language; no all-caps labels.

## Adding a new component type

1. Add the literal to `GateType` in `src/types/circuit.ts` (plus a config type in `src/types/` if it has settings).
2. Define default pins (`getDefaultICPins` in `icLogic.ts` for fixed ICs, or a pin factory in `src/utils/`).
3. Implement evaluation (`evaluateIC` in `icLogic.ts` or `evaluateGate` in `gateLogic.ts`) and register the type in the matching set/branch in `engine.ts`.
4. Handle creation in `createPart` (`store/partFactory.ts`): node `type`, label, pins, config.
5. Render it: reuse an existing node family (`ICComponentNode` via `ChipFrame` for chips) or add one in `components/nodes/` and register it in `nodeTypes` in `CircuitCanvas.tsx`.
6. Add it to `PARTS` in `src/data/components.ts` (name, description, category, part number); give it a glyph in `toolbar/PartGlyph.tsx` if it isn't a chip. Add an inspector panel (`TYPE_PANELS` in `InspectorPanel.tsx`) if it has settings, and a case in `PartLiveView.tsx` if it has something to show live.
7. Add a test in `src/simulation/*.test.ts`.

## Testing

- Unit tests live next to the code. `src/simulation/engine.test.ts` has `makeNode` / `wire` helpers for building circuits without the UI — reuse them for new engine behaviour.
- `icLogic.test.ts` checks every fixed IC against an independent reference model for all input combinations, and fails if a type in `IC_GATE_TYPES` has no test: add a reference (or a sequence test for memory parts) when you add an IC.
- `utils/presets.test.ts` runs golden checks on every built-in example (supported parts, valid pins, settles, known outputs for every row).
- Store tests (`store/useCircuitStore.test.ts`) drive the real store; `src/test/setup.ts` provides an in-memory `localStorage` for Node.
- To check behaviour in the running app, start the `dev` config from `.claude/launch.json` and drive the store from the browser console: `const { useCircuitStore: s } = await import('/src/store/useCircuitStore.ts')`. Reload the page first: after hot reloads this import can return a different store instance from the one the app renders. Autosave writes your experiments to `localStorage`; remove `logic_studio_circuit` afterwards to restore the default circuit.
- React Flow adds to a selection on Ctrl/Cmd+click and reads the modifier from key state, so synthetic multi-select needs a `keydown` for Control before the clicks.

## Gotchas

- React Flow's built-in delete key is disabled (`deleteKeyCode={null}`); deletion goes through `useGlobalShortcuts` → `deleteSelected` so it is undoable and re-propagates.
- `.react-flow__node > div` card defaults live in `@layer components` in `index.css` so a node's own Tailwind utilities win; unlayered rules there (selection outline, `lsp-schematic`) beat utilities.
- Circuit truth table (`utils/circuitTruthTableEngine.ts`): inputs are switches, push buttons and wired DIP bits in canvas reading order (first = MSB); outputs are wired LEDs/probes, hex displays (one digit) and 7-segment pins, falling back to unwired gate outputs. Pass `customComponents`. Rows start from `reset` (memory cleared, every signal floating) or `canvas`; tables are capped at `MAX_TABLE_INPUTS`. Expressions come from `utils/booleanMinimizer.ts` (Quine–McCluskey).
- The store settles the restored circuit once at startup (`useCircuitStore.ts`); every other load goes through `loadCircuit`, which ticks.
- `tsconfig` has `allowJs` and a `@` → repo-root alias; imports in `src/` use relative paths.
- Files use LF line endings; when editing with scripts on Windows, write with `newline=''` (Python) so they don't turn into CRLF.
