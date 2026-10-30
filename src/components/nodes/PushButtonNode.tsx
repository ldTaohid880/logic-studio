import React, { memo } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Pin } from './Pin';
import { HW, Lead, PartLabel, PartSvg } from './partKit';

const W = 75;
const H = 30;

/** Push button: a 12 mm tactile switch; outputs 1 only while held (mouse, touch, or Space/Enter when focused). */
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
        className="nodrag absolute left-0 top-0 w-[30px] h-[30px] cursor-pointer select-none rounded-[3px] focus-visible:outline-2 focus-visible:outline-accent"
      >
        <svg width={30} height={30} className="block" aria-hidden="true">
          <rect x={0.75} y={0.75} width={28.5} height={28.5} rx={2} fill={HW.plastic} stroke={HW.plasticEdge} strokeWidth={1.5} />
          <rect x={3} y={3} width={24} height={24} rx={1.5} fill={HW.metal} stroke={HW.metalEdge} />
          {[[5.5, 5.5], [24.5, 5.5], [5.5, 24.5], [24.5, 24.5]].map(([cx, cy]) => (
            <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={1.4} fill={HW.metalEdge} />
          ))}
          {isPressed && <circle cx={15} cy={15} r={11} fill="var(--signal-high)" opacity={0.45} />}
          <circle cx={15} cy={isPressed ? 15 : 14} r={isPressed ? 7.5 : 8.5} fill={isPressed ? '#24262a' : HW.plastic} stroke="#000" strokeWidth={1} />
          {!isPressed && <ellipse cx={12.5} cy={11} rx={3} ry={1.8} fill="rgb(255 255 255 / 0.18)" />}
        </svg>
      </button>

      <Pin type="source" position={Position.Right} id="out-0" value={data.value ?? 0} label={data.label || 'Push button'} style={{ top: 15 }} />
    </div>
  );
});

PushButtonNode.displayName = 'PushButtonNode';
