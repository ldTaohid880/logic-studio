import React, { memo } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { outputColor } from '../../theme/outputColors';
import { Pin, pinDisplayName } from './Pin';
import { DisplayFace, HW, MODULE_BODY, PartLabel, PITCH } from './partKit';

const W = 150;

/**
 * Bus value: reads 2–8 input bits (B0 least significant) as hex, decimal or binary, with one lamp
 * per bit underneath (most significant on the left, as the number is written).
 */
export const BusMonitorNode: React.FC<NodeProps> = memo(({ data: nodeData }) => {
  const data = nodeData as unknown as NodeData;
  const bitWidth = data.bitWidth || 4;
  const inputs = data.inputs || [];
  const format = data.displayFormat || 'hex';
  const col = outputColor(data.displayColor, 'green');
  const H = Math.max(bitWidth, 3) * PITCH;

  const bits = Array.from({ length: bitWidth }, (_, i) => inputs[i]?.value ?? -1);
  const known = bits.every((v) => v === 0 || v === 1);
  const num = bits.reduce<number>((acc, v, i) => acc | ((v === 1 ? 1 : 0) << i), 0);

  const text = !known
    ? '?'
    : format === 'dec'
    ? String(num)
    : format === 'bin'
    ? num.toString(2).padStart(bitWidth, '0')
    : '0x' + num.toString(16).toUpperCase().padStart(Math.ceil(bitWidth / 4), '0');

  return (
    <div className="lsp-hw relative rounded-[4px] border-[1.5px]" style={{ width: W, height: H, background: MODULE_BODY, borderColor: HW.plasticEdge }}>
      <PartLabel text={data.label} />
      {bits.map((v, i) => {
        const pin = inputs[i] ?? { id: `in-${i}`, name: `B${i}`, value: -1 as const };
        return (
          <div key={pin.id} className="absolute left-0 flex items-center pl-2.5" style={{ top: i * PITCH, height: PITCH }}>
            <span className="text-[11px] font-mono text-[#b4b9c0]">{pinDisplayName(pin, data.pinAliases, 4)}</span>
            <Pin type="target" position={Position.Left} id={pin.id} value={v} label={pin.name} style={{ top: 15 }} />
          </div>
        );
      })}
      <DisplayFace className="right-1.5 left-[42px] top-1/2 -translate-y-1/2 h-[64px] flex flex-col items-end justify-center gap-1.5 px-2">
        <span
          className="font-mono text-[18px] font-semibold leading-none tabular-nums"
          style={{ color: known ? col.on : '#f5b14c', textShadow: known ? `0 0 8px ${col.glow}` : undefined }}
        >
          {text}
        </span>
        <span className="flex gap-[3px]" aria-hidden="true">
          {bits
            .slice()
            .reverse()
            .map((v, i) => (
              <span
                key={i}
                className="w-[7px] h-[7px] rounded-full"
                style={{
                  backgroundColor: v === 1 ? col.on : v === 0 ? col.off : 'transparent',
                  border: v === -1 ? '1px dashed #f5b14c' : undefined,
                }}
              />
            ))}
        </span>
        <span className="sr-only">{known ? `Value ${num}` : 'Some bits are floating'}</span>
      </DisplayFace>
    </div>
  );
});

BusMonitorNode.displayName = 'BusMonitorNode';
