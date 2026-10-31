import React, { memo } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Pin } from './Pin';
import { HW, Lead, PartLabel, PartSvg, PITCH } from './partKit';

const W = 90;
const BODY = 60;

/** DIP switch: a red housing with one white slider per output, stacked on the pin pitch. */
export const DipSwitchNode: React.FC<NodeProps> = memo(({ id, data: nodeData }) => {
  const data = nodeData as unknown as NodeData;
  const bitWidth = data.bitWidth || 4;
  const dipValues = data.dipValues || Array(bitWidth).fill(0);
  const outputs = data.outputs || [];
  const H = bitWidth * PITCH;

  const toggleBit = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    useCircuitStore.getState().toggleDipBit(id, idx);
  };

  return (
    <div className="lsp-schematic relative" style={{ width: W, height: H }}>
      <PartLabel text={data.label} />
      <PartSvg width={W} height={H}>
        {Array.from({ length: bitWidth }, (_, i) => (
          <Lead key={i} x1={BODY} x2={W} y={i * PITCH + 15} value={dipValues[i] === 1 ? 1 : 0} />
        ))}
      </PartSvg>

      <div
        className="absolute left-0 top-0 rounded-[3px] border-[1.5px]"
        style={{ width: BODY, height: H, background: HW.dipBody, borderColor: HW.dipEdge, boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.18)' }}
      >
        <span className="absolute -top-0.5 right-1 text-[7px] font-bold" style={{ color: HW.print }} aria-hidden="true">
          ON ▸
        </span>
        {Array.from({ length: bitWidth }, (_, i) => {
          const on = dipValues[i] === 1;
          return (
            <div key={i} className="flex items-center gap-1.5 pl-1.5" style={{ height: PITCH }}>
              <span className="w-3 text-[10px] font-mono font-semibold text-right" style={{ color: HW.print }}>
                {i + 1}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`Switch ${i + 1}: ${on ? '1' : '0'}`}
                onClick={(e) => toggleBit(i, e)}
                className="nodrag relative w-[30px] h-4 rounded-[2px] cursor-pointer"
                style={{ background: HW.dipSlot, boxShadow: on ? 'inset 0 0 0 1.5px var(--signal-high)' : 'inset 0 1px 2px rgb(0 0 0 / 0.5)' }}
              >
                <span
                  className="absolute top-[2px] w-[13px] h-3 rounded-[1.5px] transition-[left] duration-150"
                  style={{ left: on ? 15 : 2, background: 'linear-gradient(180deg, #ffffff, #d9dce0)' }}
                />
              </button>
            </div>
          );
        })}
      </div>

      {Array.from({ length: bitWidth }, (_, i) => {
        const pinId = `out-${i}`;
        const pin = outputs.find((p) => p.id === pinId);
        return (
          <Pin
            key={pinId}
            type="source"
            position={Position.Right}
            id={pinId}
            value={pin?.value ?? (dipValues[i] === 1 ? 1 : 0)}
            label={pin?.name || `SW${i + 1}`}
            style={{ top: i * PITCH + 15 }}
          />
        );
      })}
    </div>
  );
});

DipSwitchNode.displayName = 'DipSwitchNode';
