import React from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Pin } from './Pin';
import { Lead, PartLabel, PartSvg } from './partKit';

const W = 75;
const H = 30;

/** Switch: a slide toggle; click (or Space/Enter when focused) flips it between 0 and 1. */
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
        className={`nodrag absolute left-0 top-[3px] w-[44px] h-6 rounded-full border-[1.5px] transition-colors cursor-pointer ${
          isHigh ? 'bg-signal-high border-signal-high' : 'bg-surface-2 border-line-strong hover:border-fg-subtle'
        }`}
      >
        <span
          className={`absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full bg-surface-1 shadow-sm flex items-center justify-center font-mono text-[11px] font-bold transition-[left] duration-150 ${
            isHigh ? 'left-[21px] text-signal-high' : 'left-[2px] text-fg-muted'
          }`}
        >
          {isHigh ? '1' : '0'}
        </span>
      </button>

      <Pin type="source" position={Position.Right} id="out-0" value={value} label={label || 'Switch'} style={{ top: 15 }} />
    </div>
  );
});

DigitalInputNode.displayName = 'DigitalInputNode';
