import React from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { signalState } from '../../theme/signals';
import { outputColor } from '../../theme/outputColors';
import { Pin } from './Pin';
import { Lead, PartLabel, PartSvg, levelGlyph } from './partKit';

const W = 60;
const H = 30;

/**
 * LED in its chosen color: a dim tinted lens when 0, lit with a halo when 1, and a dashed
 * amber ring while floating. The level digit sits under the lens so it reads without color.
 */
export const DigitalOutputNode = React.memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as NodeData;
  const { label } = nodeData;
  const value = nodeData.inputs?.[0]?.value ?? nodeData.value ?? -1;
  const state = signalState(value);
  const col = outputColor(nodeData.displayColor, 'red');

  return (
    <div className="lsp-schematic relative" style={{ width: W, height: H }}>
      <PartLabel text={label} />
      <PartSvg width={W} height={H}>
        <Lead x1={0} x2={25} y={15} value={value} />
        {/* Lens rim */}
        <circle
          cx={40}
          cy={15}
          r={14}
          style={{
            fill: '#15181d',
            stroke: state === 'unknown' ? 'var(--signal-unknown)' : 'var(--line-strong)',
            strokeWidth: 1.5,
            strokeDasharray: state === 'unknown' ? '3 2.5' : undefined,
          }}
        />
        {/* Lens */}
        <circle
          cx={40}
          cy={15}
          r={10.5}
          style={{
            fill: state === 'high' ? col.on : col.off,
            filter: state === 'high' ? `drop-shadow(0 0 7px ${col.glow})` : undefined,
            transition: 'fill 0.12s ease',
          }}
        />
        {/* Highlight, like light catching the dome */}
        <ellipse cx={36} cy={10.5} rx={3.5} ry={2.2} style={{ fill: 'rgb(255 255 255 / 0.35)' }} />
        <text
          x={40}
          y={H + 11}
          textAnchor="middle"
          className="font-mono text-[10px] font-semibold"
          style={{ fill: state === 'high' ? 'var(--fg)' : state === 'unknown' ? 'var(--signal-unknown)' : 'var(--fg-subtle)' }}
        >
          {levelGlyph(value)}
        </text>
      </PartSvg>
      <Pin type="target" position={Position.Left} id="in-0" value={value} label={label || 'LED'} style={{ top: 15 }} />
    </div>
  );
});

DigitalOutputNode.displayName = 'DigitalOutputNode';
