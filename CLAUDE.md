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
public/         favicon.svg (the logo; Logo.tsx draws the same mark), PNG icons, og-image.png (link preview)
src/
  main.tsx      wraps App in ErrorBoundary (recovery screen: reload, download autosave, clear autosave)
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
  data/examples/         built-in example circuits, one module per category; index.ts sets the order
  theme/signals.ts       signal colors/widths as CSS variables (signalColor, signalState, wireStrokeWidth)
  components/
    canvas/     CircuitCanvas (nodeTypes, context menu, drop), CanvasControls, EmptyCanvas, breadcrumbs
    nodes/      one React Flow node per family; Pin.tsx (all handles), partKit.tsx (labels/leads for I/O parts),
                ChipFrame.tsx (ICs, encoder and custom components drawn as DIP packages), symbols/gateGeometry.ts
                (IEEE gate shapes; gates stay schematic symbols)
    toolbar/    TopBar (File/View menus), LeftToolbox (parts bin + icon rail), PartGlyph, StatusBar
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

## How the simulation works

- Signals are `SignalValue = 0 | 1 | -1`; **-1 means floating/unknown**, never `undefined`.
- The store owns `nodes`/`edges` (React Flow shape). Pin values live in `node.data.inputs[]` / `node.data.outputs[]`; pin ids are `in-N` / `out-N` and must match React Flow handle ids.
- Every mutation ends with `get().tickSimulation()`, which calls `propagateSignals(nodes, edges, customComponents)` from `simulation/engine.ts` and bumps `simulation.stepCount`. The engine clones nodes, iterates until stable (at least 12 passes, up to node count + 4, capped at 256), and returns new nodes/edges — it never mutates its inputs. If it runs out of passes it returns the still-changing parts in `unstableNodeIds`; `tickSimulation` stores them in `simulation.unstableNodeIds`, adds the `ls-unstable` class (amber outline) and the status bar warns. `resetSimulation` sets inputs to 0, floats everything else and re-settles.
- Simulated time (`simulation/timeline.ts`, `timeline` slice) exists only while `isTimelineActive`: the circuit has a CLOCK or ARDUINO_UNO part, or a watched wire (`edge.data.watched`, set by `setWireWatched`; traced under `wire:<edgeId>`) — "depth on demand": other circuits never see run controls or time. `TimingPanel` runs a requestAnimationFrame loop calling `advanceTimeline(realMs)` → `advanceCircuit`, which toggles clocks on their edges (they start low; rates in `CLOCK_RATES_HZ`), runs boards in 1 ms slices, and re-settles with `propagateSignals` after each change. Gates have no delay unless `timeline.gateDelay` > 0: then `advanceCircuit` runs one pass (`propagateSignals(…, { maxPasses: 1 })`) per delay, `timeline.passDue` carries the next pass between frames, `tickSimulation` starts an edit's wave with one pass, Step moves one pass, and oscillation isn't flagged (a ring oscillator runs). Frames are capped (100 ms simulated, 25 ms wall clock; `behind` flags falling behind). Traces (`[time, level]` changes for clocks, switches, buttons, LEDs, probes) are recorded by `recordTraces`, also from `tickSimulation` so paused edits show. `loadCircuit`/`clearCanvas` reset time and restart boards. Clocks inside custom components don't tick.
- Boards: `ARDUINO_UNO` pins (`BOARD_PINS`: D2–D13, then A0–A5 as digital pins 14–19) each have a read side (`in-N`) and a drive side (`out-N`, -1 while the sketch has the pin as input). `BoardNode` draws them as one header pin: both handles stacked at the same spot (the target one has `lsp-pin-ghost`), and React Flow picks the opposite type when handles overlap, so dragging out drives and dropping a wire in reads. The engine skips the board; `advanceCircuit` writes its outputs. Programs are compiled Intel HEX (`data.firmware`, a new `id` per load restarts the board); `loadBoardFirmware` validates with `parseIntelHex`. avr8js is dynamically imported by `simulation/avr/boards.ts` so it's only downloaded when a board runs. Only digital I/O, timers and USART (serial monitor, `boardSerial`) are wired up.
- Sensors (`simulation/sensors.ts`, `SENSORS`): light, temperature, obstacle and motion modules with one digital output (DO = level above/below `sensorThreshold`). They're sources in the engine; `setSensorLevel` changes the reading without an undo step (like a switch); the threshold is an undoable setting. They aren't truth table inputs.
- Engine dispatch: fixed ICs are in the `IC_GATE_TYPES` set; special cases are sources (INPUT, PUSH_BUTTON, CLOCK, sensors, CONST_*), ARDUINO_UNO, DIP_SWITCH, displays (OUTPUT, LOGIC_PROBE, SEVEN_SEGMENT, HEX_DISPLAY, BUS_MONITOR), ENCODER, CUSTOM and TUNNEL; plain gates go through `evaluateGate` (`utils/gateLogic.ts`).
- Which chips have memory is `MEMORY_GATE_TYPES` (icLogic.ts), used by the truth table and statistics; a test keeps it equal to the chips with sequence tests.
- Memory parts keep state in `data.icState`: the D latch follows D while enabled; flip-flops, the register, counter, shift register and RAM act on the rising CLK edge (from a clock, push button or switch). ROM contents live in `data.romContents` (settings, not state), passed to `evaluateIC` as its 4th argument.
- `PinData.driven` marks pins fed by a wire; when the wire disappears the engine floats the pin to -1. Pins without the flag (e.g. encoder inputs toggled in the UI) keep manual values. When removing edges in the store, call `markRemovedWireTargets` (helpers.ts) first.
- Unconnected control inputs use `floatingAs(value, default)` (icLogic.ts) — never `inputs[n] ?? 1`, because floating is -1, not undefined.
- Shared wires: an input may have several wires. `resolveDrivers` (engine.ts) ignores floating drivers, takes the level they agree on, and reports a conflict (value -1) when they disagree; the result lists `conflictNodeIds`, conflicting wires get `data.conflict` (drawn red and dashed) and parts get the `ls-conflict` class via `markUnstable`. In the editor, a new wire on a used input replaces the old one unless every driver is in `BUS_DRIVERS` (tri-state buffer, board) — beginners keep the replace behaviour.
- Pull-up/pull-down resistors (`PULL_UP`, `PULL_DOWN`, in `WEAK_DRIVERS`) are weak: they only set a wire no real output drives; a pull-up against a pull-down leaves it -1 without a conflict. `OPEN_DRAIN_BUFFER` outputs 0 or floats, for wired-AND buses. Both are in `BUS_DRIVERS`.
- Buses: a pin with `width` carries `bus` (one level per bit, LSB first; `value` stays -1). `BUS_JOIN` packs single wires into a bus, `BUS_SPLIT` unpacks it; bus inputs are resolved bit by bit with `resolveDrivers`, bus wires get `data.bus` (drawn thick with a width/hex badge). `onConnect` refuses wires between pins of different widths; `setNodeBitWidth` rebuilds joiner/splitter pins and drops the bus wire.
- Analog levels: pins may carry `analog` (fraction of 5 V) and `freq` (Hz) besides `value`. The engine copies them along a wire with a single (non-resistor) driver. Sources: sensor AO pins and the POTENTIOMETER (value = 1 above half), clocks (freq), and board pins that keep switching: `UnoBoard` measures high time and rising edges per pin over the last 4 ms (`pwm(pin)`), and `advanceCircuit` publishes duty as `analog` and the frequency as `freq` (value = 1 above 50% duty). Board A0–A5 feed the ADC (`analog(channel, volts)`) from the wire's analog level (else 0 V / 5 V). LEDs glow by `analog`; BUZZER sounds at `freq` (WebAudio, off until the user turns sound on).
- LCD_16X2 (HD44780, 4-bit: RS, E, D4–D7) is an IC with memory: `evaluateIC` takes a nibble on each falling edge of E (slow edges, e.g. switches). A board's E pulses last ~1 µs, so for an LCD wired straight to board pins `advanceCircuit` sets `UnoBoard.setTaps`; the board records RS/D4–D7 at each E falling edge inside the emulator, and the writes are applied to the LCD's `icState.lcd` (marked `fromBoard`, so the engine doesn't take them twice).
- Expected outputs ("check my circuit") are `expected` in the project slice: expressions saved in the autosave and JSON file (`parseCircuitFile` returns them), cleared by `loadCircuit`/`clearCanvas`, not an undo step. `utils/circuitCheck.ts` compares them with the truth table rows.
- TUNNEL: only tunnels with a wired input drive their label (case-insensitive); drivers on a tag are resolved like a shared wire. Tunnels are not evaluated as ICs.
- Custom components: an instance caches internal state in `data.subcircuitNodeStates` tagged with `defVersion = def.updatedAt`; bump `updatedAt` whenever a definition changes so instances rebuild. Nesting is capped at `MAX_SUBCIRCUIT_DEPTH`; check `detectComponentRecursion` before inserting, pasting or importing components.
- Removed parts (the old clock node type `clockNode`, oscilloscope, configurable `CFG_*`, multi-input bus, bus splitter/joiner/tap, LED matrix, RGB LED, equation generator, the old counters/shift registers/ALU and similar) are listed in `helpers.ts`. Their replacements use new type names (CLOCK on node type `clockSource`, COUNTER_4BIT, SHIFT_REG_4BIT, ALU_4BIT_8FN) so old saved data never meets new pin layouts. `removeUnsupportedParts` drops them from the autosaved circuit, opened files and loaded examples; `loadCircuit` tells the user how many were left out. Don't reintroduce those gate types without restoring their logic.

## Store conventions

- Put new actions in the slice that owns the domain; add the signature to `CircuitStore` in `store/types.ts` and the key to that slice's `Pick<>` type.
- Make user-visible edits undoable: `get().saveHistory()` for discrete edits, `get().saveHistoryCoalesced(key)` for typing-style edits (same key within ~1.2s = one undo step). `updateNodeData(nodeId, patch, { propagate })` does this for simple data fields — prefer it over `useCircuitStore.setState` in components. Momentary input changes (switch flips, `setButtonPressed`, `toggleDipBit`) are deliberately not recorded. History is cleared when entering/leaving a sub-circuit.
- Components subscribe with selectors: `useCircuitStore(useShallow((s) => ({ a: s.a })))` or `useCircuitStore((s) => s.a)`. Never call `useCircuitStore()` without a selector (re-renders on every change). `useCircuitStore.getState()` is fine inside event handlers, not during render.
- New ids come from `makeId(prefix)` (`utils/ids.ts`, re-exported from `store/helpers.ts`), not `Date.now()` alone.
- Opening a circuit file goes through `openCircuitFile(text)` (project slice) → `parseCircuitFile` (`utils/circuitFile.ts`), which validates, adds bundled custom components (clashing ids become copies) and rejects recursive ones. Don't merge `customComponents` with `setState`.
- Projects (`projects` slice, `store/projectStorage.ts`): `logic_studio_projects` (index: id, name, updatedAt), `logic_studio_current_project`, and `logic_studio_project:<id>` per project. Autosave writes the open project (`saveCurrentProject`) as well as `logic_studio_circuit`, which the error screen and startup read. Switching projects saves the current one, loads the other via `loadCircuit` and clears undo history.
- Share links: `#circuit=` + base64url(deflate-raw(file-shaped JSON)) without running state (`utils/shareLink.ts`). App.tsx checks the hash on load and on `hashchange`, asks with a ConfirmDialog, then opens it with `openCircuitFile`.
- localStorage keys: `logic_studio_circuit` (autosaved root circuit), `logic_studio_presets`, `logic_studio_custom_components`, `logic_studio_ui_prefs` (theme, density, wire style, minimap; ui slice). UI-only keys written by components: `logic_studio_recent_parts`, `logic_studio_bin_sections` (parts bin), `logic_studio_inspector_width`, `logic_studio_timing_open`.
- `showToast(message, variant?)` picks the error style automatically for messages starting with "Cannot", "Failed", "Invalid", etc.; pass a variant to override.

## UI conventions

- Colors come from semantic tokens in `src/index.css` (`bg-surface-0..3`, `text-fg/-muted/-subtle`, `border-line(-strong)`, `accent`, `signal-high/low/unknown/bus`), defined for both `[data-theme="dark"]` and `[data-theme="light"]`. Legacy `slate-*`/`emerald-*`/`cyan-*` classes are remapped to theme variables (light theme mirrors the accent scales), but new code should use the semantic names. Avoid hard-coded hex except for real-hardware faces that look the same in both themes: chips (`CHIP` in ChipFrame), switches, buttons, DIP switch, clock and display housings (`HW`, `MODULE_BODY`, `DisplayFace` in partKit), the Uno board (`BoardNode`) and sensor modules (`SensorNode`). Those parts still show the level by their lead, pin and a printed digit.
- Signal state must be readable without color: digits (1/0/?), hollow amber pins and dashed wires for floating. Use `Pin` for every handle (state via `data-signal`) and `signalColor`/`signalState` from `theme/signals.ts`.
- Canvas parts sit on the 15px snap grid with pins on a 30px pitch. Unboxed parts (gates, switch, LED…) use the `lsp-schematic` class (no card chrome, dashed selection frame); parts drawn as hardware with a solid outline (chips, display modules) use `lsp-hw` (no card chrome, solid selection outline). Chip legs are 12px long; the pin handle sits on the leg tip.
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
- `data/examples/examples.test.ts` runs golden checks on every built-in example (supported parts, valid pins, settles, known outputs for every row).
- `simulation/timeline.test.ts` covers clocks, `advanceCircuit` and the emulator with hand-assembled AVR programs (`wordsToIntelHex`), since there's no AVR compiler in CI: pin echo, ADC read, PWM duty, LCD E-pulse taps. Encode instructions carefully (e.g. LDI is `0xE000 | (K & 0xF0) << 4 | (d - 16) << 4 | K & 0x0F`; a branch offset counts words from the next instruction).
- Store tests (`store/useCircuitStore.test.ts`) drive the real store; `src/test/setup.ts` provides an in-memory `localStorage` for Node.
- To check behaviour in the running app, start the `dev` config from `.claude/launch.json` and drive the store from the browser console: `const { useCircuitStore: s } = await import('/src/store/useCircuitStore.ts')`. Reload the page first: after hot reloads this import can return a different store instance from the one the app renders. Autosave writes your experiments to `localStorage`; remove `logic_studio_circuit` afterwards to restore the default circuit.
- React Flow adds to a selection on Ctrl/Cmd+click and reads the modifier from key state, so synthetic multi-select needs a `keydown` for Control before the clicks.

## Gotchas

- `index.html` link-preview tags use `%SITE_URL%`, replaced at build time by a plugin in `vite.config.ts` (`SITE_URL`, else Vercel's production domain, else https://logic-studio-gamma.vercel.app, the live deployment). `__APP_VERSION__` comes from `package.json`.
- Regenerate `public/og-image.png` and the README screenshots in `.github/assets/` when the UI changes noticeably.

- React Flow's built-in delete key is disabled (`deleteKeyCode={null}`); deletion goes through `useGlobalShortcuts` → `deleteSelected` so it is undoable and re-propagates.
- `.react-flow__node > div` card defaults live in `@layer components` in `index.css` so a node's own Tailwind utilities win; unlayered rules there (selection outline, `lsp-schematic`) beat utilities.
- Circuit truth table (`utils/circuitTruthTableEngine.ts`): inputs are switches, push buttons and wired DIP bits in canvas reading order (first = MSB); outputs are wired LEDs/probes, hex displays (one digit) and 7-segment pins, falling back to unwired gate outputs. Pass `customComponents`. Rows start from `reset` (memory cleared, every signal floating) or `canvas`; tables are capped at `MAX_TABLE_INPUTS`. Expressions come from `utils/booleanMinimizer.ts` (Quine–McCluskey).
- The store settles the restored circuit once at startup (`useCircuitStore.ts`); every other load goes through `loadCircuit`, which ticks.
- `tsconfig` has `allowJs` and a `@` → repo-root alias; imports in `src/` use relative paths.
- Files use LF line endings; when editing with scripts on Windows, write with `newline=''` (Python) so they don't turn into CRLF.
