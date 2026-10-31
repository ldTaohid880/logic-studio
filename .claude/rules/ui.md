---
paths:
  - "src/components/**"
  - "src/index.css"
  - "src/theme/**"
---

# UI conventions

Loaded when working on components and styles. `npm run lint:conventions` checks the mechanical parts (colours, all-caps, native dialogs, store selectors).

- Colors come from semantic tokens in `src/index.css` (`bg-surface-0..3`, `text-fg/-muted/-subtle`, `border-line(-strong)`, `accent`, `signal-high/low/unknown/bus`), defined for both `[data-theme="dark"]` and `[data-theme="light"]`. Legacy `slate-*`/`emerald-*`/`cyan-*` classes are remapped to theme variables (light theme mirrors the accent scales), but new code should use the semantic names. Avoid hard-coded hex except for real-hardware faces that look the same in both themes: chips (`CHIP` in ChipFrame), switches, buttons, DIP switch, clock and display housings (`HW`, `MODULE_BODY`, `DisplayFace` in partKit), the Uno board (`BoardNode`) and sensor modules (`SensorNode`). Those parts still show the level by their lead, pin and a printed digit.
- Signal state must be readable without color: digits (1/0/?), hollow amber pins and dashed wires for floating. Use `Pin` for every handle (state via `data-signal`) and `signalColor`/`signalState` from `theme/signals.ts`.
- Canvas parts sit on the 15px snap grid with pins on a 30px pitch. Unboxed parts (gates, switch, LED…) use the `lsp-schematic` class (no card chrome, dashed selection frame); parts drawn as hardware with a solid outline (chips, display modules) use `lsp-hw` (no card chrome, solid selection outline). Chip legs are 12px long; the pin handle sits on the leg tip.
- Dialogs use `ModalFrame`/`Dialog` (portal, Escape closes the topmost dialog, focus trap/restore) with `ModalHeader`. Confirm destructive actions with `ConfirmDialog`, never `window.confirm`/`prompt`.
- Copy is sentence case and plain language; no all-caps labels.
- React Flow's built-in delete key is disabled (`deleteKeyCode={null}`); deletion goes through `useGlobalShortcuts` → `deleteSelected` so it is undoable and re-propagates.
- `.react-flow__node > div` card defaults live in `@layer components` in `index.css` so a node's own Tailwind utilities win; unlayered rules there (selection outline, `lsp-schematic`) beat utilities.
