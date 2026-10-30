import React from 'react';
import { FolderOpen, MousePointer2, Keyboard, ToggleLeft } from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Button } from '../ui/Button';
import { nextPlacementPosition } from '../../utils/canvasBridge';

interface EmptyCanvasProps {
  onOpenPresets?: () => void;
  onOpenShortcuts?: () => void;
}

/** First-run guidance shown while the canvas has no parts. */
export const EmptyCanvas: React.FC<EmptyCanvasProps> = ({ onOpenPresets, onOpenShortcuts }) => {
  const addStarter = () => {
    const { addNode } = useCircuitStore.getState();
    const base = nextPlacementPosition();
    addNode('INPUT', { x: base.x - 150, y: base.y - 45 });
    addNode('INPUT', { x: base.x - 150, y: base.y + 60 });
    addNode('AND', { x: base.x + 30, y: base.y });
    addNode('OUTPUT', { x: base.x + 180, y: base.y });
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none p-6">
      <div className="pointer-events-auto max-w-md w-full text-center bg-surface-1/90 backdrop-blur border border-line rounded-2xl shadow-lg p-6 animate-fadeIn">
        <h2 className="text-base font-semibold text-fg">Start a circuit</h2>
        <p className="mt-1.5 text-[13px] text-fg-muted leading-relaxed">
          Drag parts from the Components panel, then draw wires from one pin to another. Inputs toggle with a click.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Button variant="primary" size="md" leftIcon={<FolderOpen className="w-4 h-4" />} onClick={onOpenPresets}>
            Open an example
          </Button>
          <Button variant="secondary" size="md" leftIcon={<ToggleLeft className="w-4 h-4" />} onClick={addStarter}>
            Add 2 inputs + AND
          </Button>
        </div>

        <ul className="mt-5 space-y-1.5 text-xs text-fg-subtle text-left inline-block">
          <li className="flex items-center gap-2">
            <MousePointer2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            Right-click the canvas for more actions
          </li>
          <li className="flex items-center gap-2">
            <Keyboard className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>
              Press{' '}
              <button type="button" onClick={onOpenShortcuts} className="font-mono text-fg-muted underline underline-offset-2 cursor-pointer">
                ?
              </button>{' '}
              for keyboard shortcuts
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
