---
name: add-example
description: Add a built-in example circuit (File → Example circuits) to Logic Studio with the golden checks it must pass. Use when asked for a new demo/example/preset circuit.
---

# Add an example circuit

1. **Pick the module** — `src/data/examples/gates.ts`, `combinational.ts`, `memory.ts` or `projects.ts`. A new category gets a new module, imported into `src/data/examples/index.ts`, whose array order is the order the examples dialog lists them.
2. **Write the preset** — a `CircuitPreset`: unique kebab-case `id`, `name`, `category`, one-sentence `description`, `nodes`, `edges`. Copy the shape of an existing example:
   - Node `type` is the React Flow node type `createPart` would use (`digitalInput`, `logicGate`, `icComponent`, `digitalOutput`, …) and `data.gateType` the `GateType`.
   - Pins come from the part's defaults (`getDefaultICPins` or the pin factory); ids `in-N` / `out-N`.
   - Positions on the 15px grid; leave about 220px between columns.
   - Edges: `type: 'signalEdge'`, `sourceHandle` / `targetHandle` set.
   - Easiest route: build it in the running app, then read `window.__logicStudio.store.getState()` `nodes`/`edges` with `node scripts/agent/browser.mjs --eval ...` and trim running state (`selected`, `measured`, signal values can stay).
3. **Golden checks** — `src/data/examples/examples.test.ts` runs automatically for every preset: only supported parts, wires to existing pins, settles with every wire at a known level, and every output known for every input combination. If it has a clock or latches that legitimately float, fix the circuit (add a reset, pull-down, …) rather than loosening the test.
4. **Check** — `npx vitest run src/data/examples` then `npm run check`. Open it in the app (File → Example circuits) and look at it in both themes.
