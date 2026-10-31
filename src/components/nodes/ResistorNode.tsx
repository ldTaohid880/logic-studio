import React, { memo } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { Pin } from './Pin';
import { PartLabel, PartSvg } from './partKit';

const W = 60;
const H = 60;
const X = 18;
const stroke = { fill: 'none', stroke: 'var(--fg-muted)', strokeWidth: 1.75, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;

/** Zigzag between y1 and y2 at x = X. */
const zigzag = (y1: number, y2: number) => {
  const step = (y2 - y1) / 6;
  const points = Array.from({ length: 5 }, (_, i) => `${X + (i % 2 === 0 ? 6 : -6)} ${y1 + step * (i + 1)}`);
  return `M${X} ${y1} L${points.join(' L')} L${X} ${y2}`;
};

/**
 * Pull-up (to VCC) or pull-down (to ground) resistor in schematic form. It holds a wire at 1 or 0 only while
 * no real output drives it, so it pairs with tri-state and open-drain outputs and board inputs.
 */
export const ResistorNode: React.FC<NodeProps> = memo(({ data: nodeData }) => {
  const data = nodeData as unknown as NodeData;
  const up = data.gateType === 'PULL_UP';
  const pinY = up ? 45 : 15;
  const value = data.outputs?.[0]?.value;

  return (
    <div className="lsp-schematic relative" style={{ width: W, height: H }}>
      <PartLabel text={data.label} />
      <PartSvg width={W} height={H}>
        {up ? (
          <>
            <path d={`M${X - 9} 3 H${X + 9}`} {...stroke} strokeWidth={2} />
            <text x={X + 12} y={7} fontSize={8} style={{ fill: 'var(--fg-subtle)' }}>VCC</text>
            <path d={`M${X} 3 V10 ${zigzag(10, 38).slice(1)} M${X} 38 V${pinY} H${W}`} {...stroke} />
          </>
        ) : (
          <>
            <path d={`M${W} ${pinY} H${X} V22 ${zigzag(22, 48).slice(1)} M${X} 48 V52`} {...stroke} />
            <path d={`M${X - 9} 52 H${X + 9} M${X - 6} 55 H${X + 6} M${X - 3} 58 H${X + 3}`} {...stroke} />
          </>
        )}
        <text x={X + 10} y={up ? 27 : 38} fontSize={9} className="font-mono" style={{ fill: 'var(--fg-subtle)' }}>
          10k
        </text>
      </PartSvg>
      <Pin
        type="source"
        position={Position.Right}
        id="out-0"
        value={value}
        label={up ? 'Pull-up (1 when undriven)' : 'Pull-down (0 when undriven)'}
        style={{ top: pinY }}
      />
    </div>
  );
});

ResistorNode.displayName = 'ResistorNode';
