import { useEffect, useRef } from 'react';
import { useCircuitStore } from '../store/useCircuitStore';
import { saveCircuitAsJSON } from '../utils/fileActions';

interface ShortcutHandlers {
  onOpenShortcuts: () => void;
}

const isTypingTarget = (el: EventTarget | null) => {
  const target = el as HTMLElement | null;
  return !!target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);
};

/** App-wide keyboard shortcuts. The list shown to users lives in config/shortcuts.ts. */
export function useGlobalShortcuts(handlers: ShortcutHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      // Dialogs and menus own the keyboard while open
      if (document.querySelector('[role="dialog"], [role="menu"]')) return;

      const store = useCircuitStore.getState();
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod) {
        if (key === 's') {
          e.preventDefault();
          saveCircuitAsJSON();
        } else if (key === 'c') {
          e.preventDefault();
          store.copySelected();
        } else if (key === 'x') {
          e.preventDefault();
          store.cutSelected();
        } else if (key === 'v') {
          e.preventDefault();
          store.pasteClipboard();
        } else if (key === 'd') {
          e.preventDefault();
          store.duplicateSelected();
        } else if (key === 'g') {
          e.preventDefault();
          if (e.shiftKey) {
            const selectedGroup = store.nodes.find((n) => n.selected && n.type === 'groupNode');
            if (selectedGroup) store.ungroupNode(selectedGroup.id);
          } else {
            store.groupSelectedNodes();
          }
        } else if (key === 'z') {
          e.preventDefault();
          if (e.shiftKey) store.redo();
          else store.undo();
        } else if (key === 'y') {
          e.preventDefault();
          store.redo();
        }
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        store.deleteSelected();
      } else if (e.key === '/') {
        // Focus the parts search, expanding the parts panel if it is collapsed
        e.preventDefault();
        store.setShowToolbox(true);
        requestAnimationFrame(() => document.getElementById('parts-search')?.focus());
      } else if (e.key === '?') {
        handlersRef.current.onOpenShortcuts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
