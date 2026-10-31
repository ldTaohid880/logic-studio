import React, { memo } from 'react';
import { Position, NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { busHex } from '../../utils/busPins';
import { Pin } from './Pin';
import { Lead, PartLabel, PartSvg, PITCH } from './partKit';

const W = 60;
const BAR = 6;

/**
 * Bus joiner (single wires in on the left, one bus out on the right) or splitter (the mirror image),
 * drawn as a thick bar with a lead per bit. Bit 0 is at the top.
 */
export const BusNode: React.FC<NodeProps> = memo(({ id, data: nodeData }) => {
  const data = nodeData as unknown as NodeData;
  const updateNodeInternals = useUpdateNodeInternals();
  const join = data.gateType === 'BUS_JOIN';
  const bits = join ? data.inputs : data.outputs;
  const busPin = join ? data.outputs[0] : data.inputs[0];
  const width = bits.length;
  const H = width * PITCH;
  // The bus pin sits level with the middle bit (on the pin grid)
  const busY = Math.floor((width - 1) / 2) * PITCH + 15;
  const barX = join ? W - 20 : 20 - BAR;
  const hex = busPin?.bus ? busHex(busPin.bus) : null;

  React.useEffect(() => updateNodeInternals(id), [id, width, updateNodeInternals]);

  return (
    <div className="lsp-schematic relative" style={{ width: W, height: H }} title={`${width}-bit bus${hex ? ` = 0x${hex}` : ''}`}>
      <PartLabel text={data.label} />
      <PartSvg width={W} height={H}>
        {bits.map((p, i) => (
          <Lead key={p.id} x1={join ? 0 : barX + BAR} x2={join ? barX : W} y={i * PITCH + 15} value={p.value} />
        ))}
        <rect x={barX} y={4} width={BAR} height={H - 8} rx={2} style={{ fill: 'var(--signal-bus)' }} />
        <line
          x1={join ? barX + BAR : 0}
          x2={join ? W : barX}
          y1={busY}
          y2={busY}
          style={{ stroke: 'var(--signal-bus)', strokeWidth: 4, strokeLinecap: 'round' }}
        />
        {bits.map((p, i) => (
          <text
            key={p.id}
            x={join ? barX - 4 : barX + BAR + 4}
            y={i * PITCH + 11}
            textAnchor={join ? 'end' : 'start'}
            className="font-mono text-[9px]"
            style={{ fill: 'var(--fg-subtle)' }}
          >
            {i}
          </text>
        ))}
      </PartSvg>
      {bits.map((p, i) => (
        <Pin
          key={p.id}
          type={join ? 'target' : 'source'}
          position={join ? Position.Left : Position.Right}
          id={p.id}
          value={p.value}
          label={`Bit ${i}`}
          style={{ top: i * PITCH + 15 }}
        />
      ))}
      {busPin && (
        <Pin
          type={join ? 'source' : 'target'}
          position={join ? Position.Right : Position.Left}
          id={busPin.id}
          value={-1}
          bus
          label={`${width}-bit bus${hex ? ` = 0x${hex}` : ''}`}
          style={{ top: busY }}
        />
      )}
    </div>
  );
});

BusNode.displayName = 'BusNode';
