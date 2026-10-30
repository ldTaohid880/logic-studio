import React from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Pin } from './Pin';
import { HW, Lead, PartLabel, PartSvg } from './partKit';

const W = 75;
const H = 30;

/** Switch: a slide switch in a metal housing; click (or Space/Enter when focused) flips it between 0 and 1. */
export const DigitalInputNode = React.memo(({ id, data }: NodeProps) => {
  const nodeData = data as unknown as NodeData;
  const { label, value = 0 } = nodeData;
  const toggleInputValue = useCircuitStore((state) => state.toggleInputValue);
  const isHigh = value === 1;

  return (
    <div className="lsp-schematic relative" style={{ width: W, height: H }}>
      <PartLabel text={label} />
      <PartSvg width={W} height={H}>
        <Lead x1={44} x2={W} y={15} value={value} />
      </PartSvg>

      <button
        type="button"
        role="switch"
        aria-checked={isHigh}
        aria-label={`${label || 'Switch'}: ${isHigh ? '1' : '0'}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleInputValue(id);
        }}
        className="nodrag absolute left-0 top-[3px] w-[44px] h-6 cursor-pointer rounded-[3px] focus-visible:outline-2 focus-visible:outline-accent"
      >
        <svg width={44} height={24} className="block" aria-hidden="true">
          <rect x={0.75} y={0.75} width={42.5} height={22.5} rx={2.5} fill={HW.metal} stroke={HW.metalEdge} strokeWidth={1.5} />
          <rect x={4} y={5} width={36} height={14} rx={1.5} fill={HW.slot} />
          {/* The slot glows faintly in the signal color when on */}
          {isHigh && <rect x={4} y={5} width={36} height={14} rx={1.5} fill="var(--signal-high)" opacity={0.35} />}
          <g style={{ transform: `translateX(${isHigh ? 20 : 0}px)`, transition: 'transform 0.15s ease' }}>
            <rect x={5} y={6} width={15} height={12} rx={1.5} fill={HW.plastic} stroke="#3a3d43" />
            {[9, 12.5, 16].map((x) => (
              <line key={x} x1={x} x2={x} y1={8} y2={16} stroke="#3a3d43" strokeWidth={1} />
            ))}
          </g>
          <text x={isHigh ? 12 : 32} y={15.5} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily="ui-monospace, monospace" fill={HW.print}>
            {isHigh ? '1' : '0'}
          </text>
        </svg>
      </button>

      <Pin type="source" position={Position.Right} id="out-0" value={value} label={label || 'Switch'} style={{ top: 15 }} />
    </div>
  );
});

DigitalInputNode.displayName = 'DigitalInputNode';
