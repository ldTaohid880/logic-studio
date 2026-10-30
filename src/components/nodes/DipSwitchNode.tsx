import React, { memo } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Pin } from './Pin';
import { Lead, PartLabel, PartSvg, PITCH } from './partKit';

const W = 90;
const BODY = 60;

/** DIP switch: one slide switch per output, stacked on the pin pitch. */
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

      <div className="absolute left-0 top-0 rounded-md border-[1.5px] border-line-strong bg-surface-1" style={{ width: BODY, height: H }}>
        {Array.from({ length: bitWidth }, (_, i) => {
          const on = dipValues[i] === 1;
          return (
            <div key={i} className="flex items-center gap-1.5 pl-1.5" style={{ height: PITCH }}>
              <span className="w-3 text-[10px] font-mono text-fg-subtle text-right">{i + 1}</span>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`Switch ${i + 1}: ${on ? '1' : '0'}`}
                onClick={(e) => toggleBit(i, e)}
                className={`nodrag relative w-[30px] h-4 rounded-[3px] border cursor-pointer transition-colors ${
                  on ? 'bg-signal-high/25 border-signal-high' : 'bg-surface-2 border-line-strong hover:border-fg-subtle'
                }`}
              >
                <span
                  className={`absolute top-[1px] w-3 h-3 rounded-[2px] transition-[left] duration-150 ${
                    on ? 'left-[15px] bg-signal-high' : 'left-[1px] bg-fg-subtle'
                  }`}
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
