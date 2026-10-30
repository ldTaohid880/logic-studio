/** Shortcut reference shown in the Shortcuts dialog. Keep in sync with useGlobalShortcuts. */
export interface ShortcutEntry {
  keys: string[];
  action: string;
}

export interface ShortcutGroup {
  title: string;
  items: ShortcutEntry[];
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Simulation',
    items: [
      { keys: ['Space'], action: 'Run / pause clocks and timed parts' },
      { keys: ['.'], action: 'Step one tick' },
    ],
  },
  {
    title: 'Editing',
    items: [
      { keys: ['Ctrl', 'Z'], action: 'Undo' },
      { keys: ['Ctrl', 'Y'], action: 'Redo (also Ctrl+Shift+Z)' },
      { keys: ['Ctrl', 'C'], action: 'Copy selection' },
      { keys: ['Ctrl', 'X'], action: 'Cut selection' },
      { keys: ['Ctrl', 'V'], action: 'Paste' },
      { keys: ['Ctrl', 'D'], action: 'Duplicate selection' },
      { keys: ['Delete'], action: 'Delete selected parts or wire' },
      { keys: ['Ctrl', 'G'], action: 'Group selection' },
      { keys: ['Ctrl', 'Shift', 'G'], action: 'Ungroup selected group' },
    ],
  },
  {
    title: 'File & view',
    items: [
      { keys: ['Ctrl', 'S'], action: 'Save circuit as JSON' },
      { keys: ['?'], action: 'Show this shortcut list' },
    ],
  },
  {
    title: 'Mouse & touch',
    items: [
      { keys: ['Drag empty canvas'], action: 'Pan the view' },
      { keys: ['Scroll / pinch'], action: 'Zoom in or out' },
      { keys: ['Shift', 'Drag'], action: 'Box-select several parts' },
      { keys: ['Drag from a pin'], action: 'Draw a wire to another pin' },
      { keys: ['Click an input'], action: 'Toggle its value between 0 and 1' },
      { keys: ['Double-click a wire'], action: 'Name the wire' },
      { keys: ['Right-click'], action: 'Context menu for parts and canvas' },
    ],
  },
];
