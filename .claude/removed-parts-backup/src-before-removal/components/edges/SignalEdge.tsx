import React, { useEffect, useRef, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath, getSmoothStepPath } from '@xyflow/react';
import { SignalValue } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { getWireColors } from '../../utils/colorUtils';
import { signalColor, signalState, wireDashArray, wireStrokeWidth } from '../../theme/signals';

/** Inline editor shown on the wire while it is being renamed (double-click a wire). */
const WireLabelEditor: React.FC<{ edgeId: string; initial: string; x: number; y: number }> = ({ edgeId, initial, x, y }) => {
  const [value, setValue] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);
  const done = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const finish = (save: boolean) => {
    if (done.current) return;
    done.current = true;
    const store = useCircuitStore.getState();
    if (save && value.trim() !== initial.trim()) store.updateEdgeLabel(edgeId, value.trim());
    store.setEditingEdgeId(null);
  };

  return (
    <div
      className="nodrag nopan absolute pointer-events-auto"
      style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
    >
      <input
        ref={inputRef}
        value={value}
        aria-label="Wire name"
        placeholder="Wire name"
        maxLength={24}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') finish(true);
          if (e.key === 'Escape') finish(false);
          e.stopPropagation();
        }}
        onBlur={() => finish(true)}
        className="w-36 h-7 px-2 rounded-md bg-surface-1 border border-accent text-xs font-mono text-fg shadow-lg outline-none ring-2 ring-accent/25"
      />
    </div>
  );
};

export const SignalEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}) => {
  const wireStyle = useCircuitStore((s) => s.wireStyle);
  const showWireLabels = useCircuitStore((s) => s.showWireLabels);
  const isEditing = useCircuitStore((s) => s.editingEdgeId === id);

  const pathParams = { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition };
  const [edgePath, labelX, labelY] =
    wireStyle === 'orthogonal'
      ? getSmoothStepPath({ ...pathParams, borderRadius: 6, offset: 15 })
      : getBezierPath(pathParams);

  const signalValue = (data?.signalValue ?? -1) as SignalValue;
  const isHigh = signalValue === 1;
  const state = signalState(signalValue);
  const customColor = data?.color as string | undefined;

  let strokeColor: string = signalColor(signalValue);
  let pulseColor = 'color-mix(in srgb, var(--signal-high) 35%, white)';

  if (customColor) {
    const colors = getWireColors(customColor);
    strokeColor = isHigh ? colors.high : colors.low;
    pulseColor = colors.anim;
  }

  const wireLabel = ((data?.label as string | undefined) ?? '').trim();

  return (
    <>
      {/* Selection halo: accent colored so it is never confused with a logic level */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ stroke: 'var(--accent)', opacity: 0.35 }}
        />
      )}

      <BaseEdge
        id={id}
        path={edgePath}
        interactionWidth={16}
        style={{
          stroke: strokeColor,
          strokeWidth: wireStrokeWidth(state),
          strokeDasharray: wireDashArray(state),
          strokeLinejoin: 'round',
          transition: 'stroke 0.15s ease',
        }}
      />

      {/* Flowing pulse on HIGH wires (disabled by prefers-reduced-motion) */}
      {isHigh && (
        <path
          d={edgePath}
          fill="none"
          strokeWidth={1.5}
          strokeDasharray="6 12"
          className="animate-wire-flow pointer-events-none"
          style={{ stroke: pulseColor, opacity: 0.8 }}
        />
      )}

      <EdgeLabelRenderer>
        {isEditing ? (
          <WireLabelEditor edgeId={id} initial={wireLabel} x={labelX} y={labelY} />
        ) : (
          showWireLabels &&
          wireLabel && (
            <div
              className={`absolute px-1.5 py-px rounded-md border bg-surface-1 text-[11px] font-mono font-medium text-fg whitespace-nowrap pointer-events-none ${
                selected ? 'border-accent' : 'border-line-strong'
              }`}
              style={{
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                borderColor: !selected && customColor ? customColor : undefined,
              }}
            >
              {wireLabel}
            </div>
          )
        )}
      </EdgeLabelRenderer>
    </>
  );
};
