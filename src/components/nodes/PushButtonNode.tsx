import React, { memo } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Pin } from './Pin';
import { Lead, PartLabel, PartSvg } from './partKit';

const W = 75;
const H = 30;

/** Push button: outputs 1 only while held (mouse, touch, or Space/Enter when focused). */
export const PushButtonNode: React.FC<NodeProps> = memo(({ id, data: nodeData }) => {
  const data = nodeData as unknown as NodeData;
  const isPressed = data.value === 1;

  const setPressed = (pressed: boolean) => useCircuitStore.getState().setButtonPressed(id, pressed);

  return (
    <div className="lsp-schematic relative" style={{ width: W, height: H }}>
      <PartLabel text={data.label} />
      <PartSvg width={W} height={H}>
        <Lead x1={30} x2={W} y={15} value={data.value} />
      </PartSvg>

      <button
        type="button"
        aria-pressed={isPressed}
        aria-label={`${data.label || 'Push button'}: hold to output 1`}
        onPointerDown={(e) => {
          e.stopPropagation();
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          setPressed(true);
        }}
        onPointerUp={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        onLostPointerCapture={() => setPressed(false)}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
            e.preventDefault();
            setPressed(true);
          }
        }}
        onKeyUp={(e) => {
          if (e.key === ' ' || e.key === 'Enter') setPressed(false);
        }}
        onBlur={() => setPressed(false)}
        className={`nodrag absolute left-0 top-0 w-[30px] h-[30px] rounded-full border-[1.5px] flex items-center justify-center cursor-pointer select-none transition-colors ${
          isPressed ? 'border-signal-high bg-signal-high/20' : 'border-line-strong bg-surface-1 hover:border-fg-subtle'
        }`}
      >
        <span
          className={`w-[18px] h-[18px] rounded-full transition-all duration-75 ${
            isPressed ? 'bg-signal-high scale-90' : 'bg-surface-3 shadow-[0_2px_0_var(--line-strong)]'
          }`}
        />
      </button>

      <Pin type="source" position={Position.Right} id="out-0" value={data.value ?? 0} label={data.label || 'Push button'} style={{ top: 15 }} />
    </div>
  );
});

PushButtonNode.displayName = 'PushButtonNode';
