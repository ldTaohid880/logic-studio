import React, { memo } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { signalColor } from '../../theme/signals';
import { DEFAULT_CLOCK_HZ } from '../../simulation/timeline';
import { Pin } from './Pin';
import { HW, Lead, PartLabel, PartSvg } from './partKit';

const W = 60;
const H = 30;

export const formatHz = (hz: number) => `${hz} Hz`;

/** Clock: a crystal oscillator can driven by simulated time; the engraved wave lights up while the output is 1. */
export const ClockNode: React.FC<NodeProps> = memo(({ data: nodeData }) => {
  const data = nodeData as unknown as NodeData;
  const value = data.value ?? 0;
  const hz = data.clockHz ?? DEFAULT_CLOCK_HZ;

  return (
    <div className="lsp-schematic relative" style={{ width: W, height: H }}>
      <PartLabel text={data.label} />
      <PartSvg width={W} height={H}>
        <rect x={1} y={1} width={36} height={28} rx={5} fill={HW.metal} stroke={HW.metalEdge} strokeWidth={1.5} />
        <rect x={4} y={4} width={30} height={22} rx={3.5} fill="none" stroke={HW.metalDark} strokeWidth={1} />
        <path d="M4.5 4.5 L9 4.5 L4.5 9 Z" fill={HW.metalEdge} />
        <path
          d="M8 21 H13 V9 H19 V21 H25 V9 H30"
          style={{ fill: 'none', stroke: value === 1 ? signalColor(1) : '#6f757d', strokeWidth: 2, strokeLinejoin: 'round' }}
        />
        <Lead x1={37} x2={W} y={15} value={value} />
      </PartSvg>
      <div className="absolute top-full mt-0.5 left-0 text-[11px] font-mono text-fg-subtle whitespace-nowrap pointer-events-none">
        {formatHz(hz)}
      </div>
      <Pin type="source" position={Position.Right} id="out-0" value={value} label={data.label || 'Clock'} style={{ top: 15 }} />
    </div>
  );
});

ClockNode.displayName = 'ClockNode';
