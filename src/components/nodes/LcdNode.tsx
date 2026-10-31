import React, { memo } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { lcdLines, LcdState } from '../../simulation/hd44780';
import { Pin } from './Pin';
import { PartLabel } from './partKit';

const W = 330;
const H = 120;
const PIN_NAMES = ['RS', 'E', 'D4', 'D5', 'D6', 'D7'];
const pinX = (i: number) => 60 + i * 30;

/**
 * 16 × 2 character LCD module (HD44780). Pins along the bottom edge, like the module's header:
 * RS, E and D4–D7 (RW is taken as tied to ground). Looks the same in both themes, like the real part.
 */
export const LcdNode: React.FC<NodeProps> = memo(({ data: nodeData }) => {
  const data = nodeData as unknown as NodeData;
  const lcd = data.icState?.lcd as LcdState | undefined;
  const [line1, line2] = lcdLines(lcd);
  const on = !!lcd?.displayOn;

  return (
    <div className="lsp-hw relative rounded-[4px]" style={{ width: W, height: H, background: '#1f6f3f', border: '1.5px solid #164f2d' }}>
      <PartLabel text={data.label} />
      {[8, W - 16].flatMap((x) => [8, H - 16].map((y) => (
        <span key={`${x}-${y}`} className="absolute w-2 h-2 rounded-full" style={{ left: x, top: y, background: '#d7c99a' }} aria-hidden="true" />
      )))}
      <div className="absolute rounded-[3px] p-1.5" style={{ left: 20, right: 20, top: 16, height: 66, background: '#101210' }}>
        <div
          className="w-full h-full rounded-[2px] flex flex-col justify-center px-1.5 font-mono text-[17px] leading-[24px] tracking-[0.12em] whitespace-pre"
          style={{ background: on ? '#9ccc3c' : '#5d7a2a', color: '#1d2a0d', boxShadow: 'inset 0 0 6px rgb(0 0 0 / 0.35)' }}
          role="img"
          aria-label={on ? `LCD shows: ${line1.trim()} / ${line2.trim()}` : 'LCD display is off'}
        >
          <span>{line1}</span>
          <span>{line2}</span>
        </div>
      </div>
      {PIN_NAMES.map((name, i) => (
        <span key={name} className="absolute text-[9px] font-mono" style={{ left: pinX(i) - 10, width: 20, top: H - 22, color: '#e6efe8', textAlign: 'center' }}>
          {name}
        </span>
      ))}
      {PIN_NAMES.map((name, i) => (
        <Pin key={name} type="target" position={Position.Bottom} id={`in-${i}`} value={data.inputs?.[i]?.value} label={name} style={{ left: pinX(i) }} />
      ))}
    </div>
  );
});

LcdNode.displayName = 'LcdNode';
