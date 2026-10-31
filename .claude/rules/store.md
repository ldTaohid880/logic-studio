---
paths:
  - "src/store/**"
  - "src/App.tsx"
  - "src/hooks/**"
---

# Store conventions

Loaded when working on the Zustand store, app shell or hooks.

- Put new actions in the slice that owns the domain; add the signature to `CircuitStore` in `store/types.ts` and the key to that slice's `Pick<>` type.
- Make user-visible edits undoable: `get().saveHistory()` for discrete edits, `get().saveHistoryCoalesced(key)` for typing-style edits (same key within ~1.2s = one undo step). `updateNodeData(nodeId, patch, { propagate })` does this for simple data fields — prefer it over `useCircuitStore.setState` in components. Momentary input changes (switch flips, `setButtonPressed`, `toggleDipBit`) are deliberately not recorded. History is cleared when entering/leaving a sub-circuit.
- Components subscribe with selectors: `useCircuitStore(useShallow((s) => ({ a: s.a })))` or `useCircuitStore((s) => s.a)`. Never call `useCircuitStore()` without a selector (re-renders on every change). `useCircuitStore.getState()` is fine inside event handlers, not during render.
- New ids come from `makeId(prefix)` (`utils/ids.ts`, re-exported from `store/helpers.ts`), not `Date.now()` alone.
- Opening a circuit file goes through `openCircuitFile(text)` (project slice) → `parseCircuitFile` (`utils/circuitFile.ts`), which validates, adds bundled custom components (clashing ids become copies) and rejects recursive ones. Don't merge `customComponents` with `setState`.
- Projects (`projects` slice, `store/projectStorage.ts`): `logic_studio_projects` (index: id, name, updatedAt), `logic_studio_current_project`, and `logic_studio_project:<id>` per project. Autosave writes the open project (`saveCurrentProject`) as well as `logic_studio_circuit`, which the error screen and startup read. Switching projects saves the current one, loads the other via `loadCircuit` and clears undo history.
- Share links: `#circuit=` + base64url(deflate-raw(file-shaped JSON)) without running state (`utils/shareLink.ts`). App.tsx checks the hash on load and on `hashchange`, asks with a ConfirmDialog, then opens it with `openCircuitFile`.
- localStorage keys: `logic_studio_circuit` (autosaved root circuit), `logic_studio_presets`, `logic_studio_custom_components`, `logic_studio_ui_prefs` (theme, density, wire style, minimap; ui slice). UI-only keys written by components: `logic_studio_recent_parts`, `logic_studio_bin_sections` (parts bin), `logic_studio_inspector_width`, `logic_studio_timing_open`.
- `showToast(message, variant?)` picks the error style automatically for messages starting with "Cannot", "Failed", "Invalid", etc.; pass a variant to override.
- The store settles the restored circuit once at startup (`useCircuitStore.ts`); every other load goes through `loadCircuit`, which ticks.
