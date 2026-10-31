---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "src/test/**"
---

# Testing

Loaded when working on tests.

- Unit tests live next to the code. `src/simulation/engine.test.ts` has `makeNode` / `wire` helpers for building circuits without the UI — reuse them for new engine behaviour.
- `icLogic.test.ts` checks every fixed IC against an independent reference model for all input combinations, and fails if a type in `IC_GATE_TYPES` has no test: add a reference (or a sequence test for memory parts) when you add an IC.
- `data/examples/examples.test.ts` runs golden checks on every built-in example (supported parts, valid pins, settles, known outputs for every row).
- `simulation/timeline.test.ts` covers clocks, `advanceCircuit` and the emulator with hand-assembled AVR programs (`wordsToIntelHex`), since there's no AVR compiler in CI: pin echo, ADC read, PWM duty, LCD E-pulse taps. Encode instructions carefully (e.g. LDI is `0xE000 | (K & 0xF0) << 4 | (d - 16) << 4 | K & 0x0F`; a branch offset counts words from the next instruction).
- Store tests (`store/useCircuitStore.test.ts`) drive the real store; `src/test/setup.ts` provides an in-memory `localStorage` for Node.
- To check behaviour in the running app, start `npm run dev` (or the `dev` config in `.claude/launch.json`) and use `node scripts/agent/browser.mjs` (see the `verify-in-browser` skill). In dev builds the app's store is `window.__logicStudio.store` (with `propagateSignals`); use it rather than `await import('/src/store/useCircuitStore.ts')`, which can return a second store after hot reloads. Autosave writes your experiments to `localStorage`; pass `--fresh` or remove `logic_studio_circuit` afterwards to restore the default circuit.
- React Flow adds to a selection on Ctrl/Cmd+click and reads the modifier from key state, so synthetic multi-select needs a `keydown` for Control before the clicks.
- `scripts/conventions-rules.test.ts` needs one should-flag and one should-pass snippet for every rule in `scripts/conventions-rules.mjs`.
