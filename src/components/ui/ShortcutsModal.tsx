import React from 'react';
import { Keyboard } from 'lucide-react';
import { Dialog } from './Dialog';
import { SHORTCUT_GROUPS } from '../../config/shortcuts';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => (
  <Dialog
    isOpen={isOpen}
    onClose={onClose}
    title="Keyboard shortcuts"
    description="On macOS use Cmd instead of Ctrl."
    icon={<Keyboard className="w-4 h-4" />}
    maxWidth="2xl"
  >
    <div className="grid gap-6 sm:grid-cols-2">
      {SHORTCUT_GROUPS.map((group) => (
        <section key={group.title}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle mb-2">{group.title}</h3>
          <dl className="space-y-1">
            {group.items.map((item) => (
              <div key={item.action} className="flex items-center justify-between gap-3 py-1 text-[13px]">
                <dt className="text-fg-muted">{item.action}</dt>
                <dd className="flex items-center gap-1 shrink-0">
                  {item.keys.map((k) => (
                    <kbd
                      key={k}
                      className="px-1.5 min-w-[1.5rem] h-6 inline-flex items-center justify-center rounded-md bg-surface-2 border border-line border-b-2 text-xs font-mono text-fg"
                    >
                      {k}
                    </kbd>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  </Dialog>
);
