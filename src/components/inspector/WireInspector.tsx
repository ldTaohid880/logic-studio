import React, { useRef } from 'react';
import { Edge } from '@xyflow/react';
import { Activity, Ban, Check, Palette, Pipette, Trash2, Wrench } from 'lucide-react';
import { SignalValue } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { InspectorSection } from '../ui/InspectorSection';
import { PropertyRow } from '../ui/PropertyRow';
import { Input } from '../ui/Input';
import { IconButton } from '../ui/IconButton';
import { LevelBadge } from './PinStatusList';
import { InspectorHeader } from './InspectorHeader';
import { Switch } from '../ui/Switch';

const PREDEFINED_COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Gray', hex: '#64748b' },
];

type WireEdge = Edge & { data?: { signalValue?: SignalValue; label?: string; color?: string } };

const swatchBase =
  'w-7 h-7 rounded-md border flex items-center justify-center transition-transform hover:scale-105 cursor-pointer';
const swatchSelected = 'ring-2 ring-accent ring-offset-2 ring-offset-surface-1 border-transparent';

export const WireInspector: React.FC<{ edge: WireEdge }> = ({ edge }) => {
  const customColorInputRef = useRef<HTMLInputElement>(null);
  const deleteSelected = useCircuitStore((s) => s.deleteSelected);
  const showToast = useCircuitStore((s) => s.showToast);

  const color = edge.data?.color;
  const isCustomColor = !!color && !PREDEFINED_COLORS.some((c) => c.hex === color);
  const setColor = (value: string | undefined) => useCircuitStore.getState().updateEdgeColor(edge.id, value);

  return (
    <aside aria-label="Wire properties" className="w-full h-full flex flex-col overflow-hidden bg-surface-1 text-fg">
      <InspectorHeader
        icon={<Activity className="w-5 h-5" />}
        title="Wire"
        subtitle={edge.data?.label || 'Unnamed connection'}
        actions={
          <IconButton
            icon={<Trash2 className="w-4 h-4" />}
            tooltip="Delete wire"
            shortcut="Del"
            variant="danger"
            onClick={() => {
              deleteSelected();
              showToast('Wire deleted');
            }}
          />
        }
      />

      <div className="@container flex-1 overflow-y-auto min-h-0">
        <InspectorSection title="Signal" icon={<Activity className="w-4 h-4" />}>
          <PropertyRow label="Level">
            <LevelBadge value={edge.data?.signalValue ?? -1} />
          </PropertyRow>
          <PropertyRow label="Name" hint="Shown on the wire. Double-click a wire on the canvas to rename it there.">
            <Input
              value={edge.data?.label || ''}
              onChange={(e) => useCircuitStore.getState().updateEdgeLabel(edge.id, e.target.value)}
              placeholder="e.g. CLK, RESET"
              aria-label="Wire name"
              className="font-mono"
            />
          </PropertyRow>
          <Switch
            checked={edge.data?.watched === true}
            onChange={(watched) => useCircuitStore.getState().setWireWatched(edge.id, watched)}
            label="Watch in timing diagram"
            description="Records this wire's level over time, like a logic analyser probe."
          />
        </InspectorSection>

        <InspectorSection title="Color" icon={<Palette className="w-4 h-4" />}>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Wire color">
            <button
              type="button"
              onClick={() => setColor(undefined)}
              aria-label="Default (signal) color"
              aria-pressed={!color}
              title="Default: colored by signal level"
              className={`${swatchBase} bg-surface-2 text-fg-subtle ${!color ? swatchSelected : 'border-line'}`}
            >
              <Ban className="w-4 h-4" />
            </button>
            {PREDEFINED_COLORS.map((c) => {
              const isSelected = color === c.hex;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  aria-label={c.name}
                  aria-pressed={isSelected}
                  title={c.name}
                  className={`${swatchBase} ${isSelected ? swatchSelected : 'border-black/10'}`}
                  style={{ backgroundColor: c.hex }}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-on-accent drop-shadow" />}
                </button>
              );
            })}
            <div className="relative">
              <button
                type="button"
                aria-label="Custom color"
                aria-pressed={isCustomColor}
                title="Pick a custom color"
                onClick={() => customColorInputRef.current?.click()}
                className={`${swatchBase} ${isCustomColor ? swatchSelected : 'border-line bg-surface-2'}`}
                style={isCustomColor ? { backgroundColor: color } : undefined}
              >
                {isCustomColor ? (
                  <Check className="w-3.5 h-3.5 text-on-accent drop-shadow" />
                ) : (
                  <Pipette className="w-4 h-4 text-fg-subtle" />
                )}
              </button>
              <input
                type="color"
                ref={customColorInputRef}
                tabIndex={-1}
                aria-hidden="true"
                value={isCustomColor ? color : '#3b82f6'}
                onChange={(e) => setColor(e.target.value)}
                className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
              />
            </div>
          </div>
          <p className="text-xs text-fg-subtle">
            Colored wires still show their level: brighter when 1, dimmer when 0.
          </p>
        </InspectorSection>

        <InspectorSection title="Advanced" icon={<Wrench className="w-4 h-4" />} defaultExpanded={false}>
          <PropertyRow label="Wire ID">
            <code className="text-xs font-mono text-fg-subtle truncate select-text">{edge.id}</code>
          </PropertyRow>
        </InspectorSection>
      </div>
    </aside>
  );
};
