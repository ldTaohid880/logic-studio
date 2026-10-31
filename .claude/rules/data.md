---
paths:
  - "src/data/**"
---

# Catalog, examples and datasheets

Loaded when working on the parts catalog, built-in examples or datasheets.

- `PARTS` (`data/components.ts`) is the catalog: name, one-line description, category and the real `partNumber`. The parts bin, properties panel, parts list (BOM) and datasheets all read it; keep descriptions one plain sentence.
- Examples live in `data/examples/<category>.ts`; `index.ts` sets the order. `examples.test.ts` checks every example (supported parts, valid pins, settles, known outputs for every row) — add expectations for a new one (see the `add-example` skill).
- Datasheets: `getDatasheet(type)` (`data/datasheets/index.ts`) merges a hand-written entry from the category module (`gates.ts`, `combinational.ts`, `arithmetic.ts`, `memory.ts`, `io.ts`, `boards.ts`) with generated content (`generated.ts`), so every `PARTS` type has a sheet. Real pinouts live in `pinouts.ts`, shared text in `common.ts`, 74HC electrical figures in `family.ts`.
- Function tables are built from the simulation (`functionTable.ts`: `buildGateTruthTable`, `evaluateIC`), never typed by hand, so they can't drift. Memory parts (`MEMORY_GATE_TYPES`) need a hand-written `modeTable` in H/L/X/↑ notation.
- Accuracy: pinouts must match the manufacturer's datasheet (pin 1 next to the notch, counted counter-clockwise from the top). Electrical and timing figures are typical values at VCC = 4.5 V and are labelled as such; don't present them as guaranteed. Only add a `vendorUrl` you are confident exists.
- A Logic Studio part with no single real chip says so ("No single standard chip") and names the nearest real parts.
- Adding a part: every `PARTS` entry already gets a generated sheet. For a part with a real chip, add a hand-written entry in the matching `data/datasheets/` module (its `partNumber` must equal the catalog's; `datasheets.test.ts` checks pin numbering, `mapping` ids and that memory parts have a `modeTable`).
