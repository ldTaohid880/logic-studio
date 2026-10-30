import React from 'react';
import { PinData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { signalState } from '../../theme/signals';

const LEVEL = {
  high: { text: '1', title: 'HIGH', cls: 'bg-emerald-500/15 text-emerald-400' },
  low: { text: '0', title: 'LOW', cls: 'bg-surface-3 text-fg-muted' },
  unknown: { text: '?', title: 'floating', cls: 'bg-amber-500/15 text-amber-400 ring-1 ring-inset ring-amber-500/40' },
} as const;

export const LevelBadge: React.FC<{ value: number | undefined }> = ({ value }) => {
  const level = LEVEL[signalState(value)];
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[1.75rem] h-6 px-1.5 rounded-md font-mono text-xs font-semibold ${level.cls}`}
      title={level.title}
    >
      {level.text}
      <span className="sr-only"> ({level.title})</span>
    </span>
  );
};

interface PinGroupProps {
  title: string;
  nodeId: string;
  pins: PinData[];
  aliases: Record<string, string>;
  editable: boolean;
}

const PinGroup: React.FC<PinGroupProps> = ({ title, nodeId, pins, aliases, editable }) => (
  <div>
    <div className="text-xs font-medium text-fg-subtle mb-1.5">
      {title} <span className="tabular-nums">({pins.length})</span>
    </div>
    <ul className="rounded-lg border border-line divide-y divide-line overflow-hidden">
      {pins.map((pin) => (
        <li key={pin.id} className="flex items-center gap-2 px-2.5 h-9 bg-surface-0/40">
          <span className="font-mono text-xs text-fg w-12 shrink-0 truncate" title={pin.name}>
            {pin.name}
          </span>
          {editable ? (
            <input
              type="text"
              aria-label={`Alias for pin ${pin.name}`}
              placeholder="alias"
              value={aliases[pin.id] || ''}
              maxLength={16}
              onChange={(e) => useCircuitStore.getState().updatePinAlias(nodeId, pin.id, e.target.value)}
              className="flex-1 min-w-0 h-6 px-1.5 rounded bg-transparent border border-transparent hover:border-line focus:border-accent text-xs text-fg-muted placeholder:text-fg-subtle/70"
            />
          ) : (
            <span className="flex-1" />
          )}
          <LevelBadge value={pin.value} />
        </li>
      ))}
    </ul>
  </div>
);

interface PinStatusListProps {
  nodeId: string;
  inputs: PinData[];
  outputs: PinData[];
  aliases?: Record<string, string>;
  /** Allow renaming pins with aliases (shown on the canvas). */
  editableAliases?: boolean;
}

/** Live pin levels with optional alias editing; replaces the per-type copies in the inspector. */
export const PinStatusList: React.FC<PinStatusListProps> = ({
  nodeId,
  inputs,
  outputs,
  aliases = {},
  editableAliases = true,
}) => {
  if (inputs.length === 0 && outputs.length === 0) {
    return <p className="text-[13px] text-fg-subtle">This part has no pins.</p>;
  }
  return (
    <div className="space-y-3">
      {inputs.length > 0 && (
        <PinGroup title="Inputs" nodeId={nodeId} pins={inputs} aliases={aliases} editable={editableAliases} />
      )}
      {outputs.length > 0 && (
        <PinGroup title="Outputs" nodeId={nodeId} pins={outputs} aliases={aliases} editable={editableAliases} />
      )}
    </div>
  );
};
