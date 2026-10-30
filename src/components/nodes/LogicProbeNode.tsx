import React, { memo } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { signalState } from '../../theme/signals';
import { Pin } from './Pin';
import { Lead, PartLabel, PartSvg } from './partKit';

const W = 75;
const H = 30;

const TEXT = { high: '1', low: '0', unknown: 'Z' } as const;

/** Probe: a tag that reads out the level on its tip, including floating (Z). */
export const LogicProbeNode: React.FC<NodeProps> = memo(({ data: nodeData }) => {
  const data = nodeData as unknown as NodeData;
  const value = data.inputs?.[0]?.value ?? -1;
  const state = signalState(value);
  const tint = { high: 'var(--signal-high)', low: 'var(--fg-subtle)', unknown: 'var(--signal-unknown)' }[state];

  return (
    <div className="lsp-schematic relative" style={{ width: W, height: H }}>
      <PartLabel text={data.label} />
      <PartSvg width={W} height={H}>
        <Lead x1={0} x2={16} y={15} value={value} />
        <path
          d={`M15 15 L26 3 H${W - 2} V27 H26 Z`}
          style={{
            fill: `color-mix(in srgb, ${tint} 14%, var(--surface-1))`,
            stroke: tint,
            strokeWidth: 1.5,
            strokeLinejoin: 'round',
            strokeDasharray: state === 'unknown' ? '3 2.5' : undefined,
          }}
        />
        <text x={(W + 26) / 2} y={20.5} textAnchor="middle" className="font-mono text-[15px] font-bold" style={{ fill: tint }}>
          {TEXT[state]}
        </text>
      </PartSvg>
      <Pin type="target" position={Position.Left} id="in-0" value={value} label={data.label || 'Probe'} style={{ top: 15 }} />
    </div>
  );
});

LogicProbeNode.displayName = 'LogicProbeNode';
