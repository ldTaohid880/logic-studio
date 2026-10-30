import React, { memo } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { signalColor } from '../../theme/signals';
import { DEFAULT_CLOCK_HZ } from '../../simulation/timeline';
import { Pin } from './Pin';
import { Lead, PartLabel, PartSvg } from './partKit';

const W = 60;
const H = 30;

export const formatHz = (hz: number) => `${hz} Hz`;

/** Clock: a square-wave source driven by simulated time; its wave lights up while the output is 1. */
export const ClockNode: React.FC<NodeProps> = memo(({ data: nodeData }) => {
  const data = nodeData as unknown as NodeData;
  const value = data.value ?? 0;
  const hz = data.clockHz ?? DEFAULT_CLOCK_HZ;

  return (
    <div className="lsp-schematic relative" style={{ width: W, height: H }}>
      <PartLabel text={data.label} />
      <PartSvg width={W} height={H}>
        <rect x={1} y={1} width={36} height={28} rx={3} style={{ fill: 'var(--surface-1)', stroke: 'var(--line-strong)', strokeWidth: 1.5 }} />
        <path
          d="M6 22 H12 V8 H19 V22 H26 V8 H32"
          style={{ fill: 'none', stroke: signalColor(value), strokeWidth: 2, strokeLinejoin: 'round' }}
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
