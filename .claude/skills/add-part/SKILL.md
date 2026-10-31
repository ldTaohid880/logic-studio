---
name: add-part
description: Add a new component type (gate, chip, display, sensor, board part) to Logic Studio end to end — type, pins, simulation, factory, rendering, catalog, datasheet, tests. Use whenever a new GateType is introduced.
---

# Add a part

Work through every step; skipping one usually shows up as a failing coverage test, a part that can't be placed, or a blank datasheet. Read `.claude/rules/simulation.md` first if the part has memory, drives shared wires, carries buses or analog levels.

## Steps

1. **Type** — add the literal to `GateType` in `src/types/circuit.ts` (plus a config type in `src/types/` if it has settings). Use a new name rather than reviving one listed as removed in `store/helpers.ts`.
2. **Pins** — `getDefaultICPins` in `src/simulation/icLogic.ts` for fixed ICs, or a pin factory in `src/utils/`. Pin ids are `in-N` / `out-N` and must match the React Flow handle ids.
3. **Behaviour** — `evaluateIC` (icLogic.ts) or `evaluateGate` (`utils/gateLogic.ts`), then register the type in the matching set/branch in `src/simulation/engine.ts` (`IC_GATE_TYPES` for fixed chips). Unconnected control inputs use `floatingAs(value, default)`, never `?? 1`.
   - Memory: keep state in `data.icState`, act on the rising CLK edge, and add the type to `MEMORY_GATE_TYPES`.
   - Shared-wire drivers (tri-state, open-drain, resistors): add to `BUS_DRIVERS` / `WEAK_DRIVERS` as appropriate.
4. **Creation** — `createPart` in `src/store/partFactory.ts`: node `type`, label, pins, config.
5. **Rendering** — reuse a node family (`ICComponentNode` via `ChipFrame` for chips) or add one in `src/components/nodes/` and register it in `nodeTypes` in `components/canvas/CircuitCanvas.tsx`. Every handle is a `Pin`; signal state must read without colour (digits, hollow amber pins for floating). Hex colours are only for hardware faces (`HEX_ALLOWED` in `scripts/conventions-rules.mjs`).
6. **Catalog** — add to `PARTS` in `src/data/components.ts` (name, one-sentence description, category, real `partNumber`). Give it a glyph in `components/toolbar/PartGlyph.tsx` if it isn't a chip. Settings → a panel in `TYPE_PANELS` (`components/inspector/InspectorPanel.tsx`); something live to show → a case in `PartLiveView.tsx`.
7. **Datasheet** — a generated sheet appears automatically. If it is a real chip, add a hand-written entry in the matching `src/data/datasheets/` module and its pinout in `pinouts.ts` (see `.claude/rules/data.md` for the accuracy rules). Memory parts need a `modeTable`.
8. **Elsewhere** — parts list: a line in `IO_PARTS` (`utils/billOfMaterials.ts`) if it isn't a 74-series chip; Verilog: a `BEHAVIOUR` entry in `utils/verilog.ts` if it has a simple model (otherwise it exports as a black box).
9. **Tests**
   - Chips: a reference model (or a sequence test for memory parts) in `src/simulation/icLogic.test.ts` — the coverage test fails without it.
   - Other parts: engine behaviour in `engine.test.ts` using `makeNode` / `wire`.
   - `partFactory.test.ts` and `datasheets.test.ts` run over every `PARTS` entry automatically; fix what they report.
10. **Docs** — update the part count in `README.md` and, if the part adds a new mechanism, the matching `.claude/rules/*.md`.

## Done when

`npm run check` passes and the part can be dragged from the parts bin, wired, and shows the right value (use the `verify-in-browser` skill).
