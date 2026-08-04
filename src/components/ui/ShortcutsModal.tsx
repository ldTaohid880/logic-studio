import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Delete / Backspace', action: 'Delete selected node or wire' },
    { key: 'Ctrl + Z / Cmd + Z', action: 'Undo last action' },
    { key: 'Ctrl + Y / Cmd + Shift + Z', action: 'Redo action' },
    { key: 'Click Input Toggle', action: 'Toggle Digital Input state (0 ↔ 1)' },
    { key: 'Drag Wire from Pin', action: 'Connect output pin to input pin' },
    { key: 'Click Wire', action: 'Select wire to inspect or delete' },
    { key: 'Scroll Wheel', action: 'Zoom canvas in / out' },
    { key: 'Right Click + Drag', action: 'Pan canvas view' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 font-mono tracking-wide uppercase">
              Keyboard & Controls Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-4 space-y-2">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-mono"
            >
              <span className="text-slate-400 font-medium">{item.action}</span>
              <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-bold shadow-sm">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
