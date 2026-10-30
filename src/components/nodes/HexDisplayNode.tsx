import React, { memo } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { DEFAULT_SEVEN_SEGMENT_CONFIG } from '../../types/sevenSegment';
import { evaluateSevenSegment } from '../../utils/sevenSegmentLogic';
import { outputColor } from '../../theme/outputColors';
import { Pin, pinDisplayName } from './Pin';
import { DisplayFace, HW, MODULE_BODY, PartLabel, PITCH } from './partKit';
import { SegmentDigit } from './SegmentDigit';

const PINS = ['D0', 'D1', 'D2', 'D3'];
const W = 105;
const H = PINS.length * PITCH;
const BLANK = { a: false, b: false, c: false, d: false, e: false, f: false, g: false };

/** Hex digit: a 7-segment digit with a built-in decoder, showing 0–F from D0 (LSB) to D3. */
export const HexDisplayNode: React.FC<NodeProps> = memo(({ data: nodeData }) => {
  const data = nodeData as unknown as NodeData;
  const inputs = data.inputs || [];
  const bits = PINS.map((_, i) => inputs[i]?.value ?? -1);
  const known = bits.every((v) => v === 0 || v === 1);
  const col = outputColor(data.displayColor, 'red');
  const result = known
    ? evaluateSevenSegment(
        bits.map((value, i) => ({ id: `in-${i}`, value })),
        { ...DEFAULT_SEVEN_SEGMENT_CONFIG, mode: 'hex' }
      )
    : null;

  return (
    <div className="lsp-hw relative rounded-[4px] border-[1.5px]" style={{ width: W, height: H, background: MODULE_BODY, borderColor: HW.plasticEdge }}>
      <PartLabel text={data.label} />
      {PINS.map((name, i) => {
        const pin = inputs[i] ?? { id: `in-${i}`, name, value: -1 as const };
        return (
          <div key={pin.id} className="absolute left-0 flex items-center pl-2.5" style={{ top: i * PITCH, height: PITCH }}>
            <span className="text-[11px] font-mono text-[#b4b9c0]">{pinDisplayName(pin, data.pinAliases, 4)}</span>
            <Pin type="target" position={Position.Left} id={pin.id} value={pin.value} label={pin.name} style={{ top: 15 }} />
          </div>
        );
      })}
      <DisplayFace className="right-1.5 top-1.5 bottom-1.5 w-[54px] flex items-center justify-center px-2 py-3">
        <SegmentDigit segments={result?.segments ?? BLANK} color={col.on} glow={col.glow} className="w-full h-full" />
        <span className="sr-only">{result ? `Shows ${result.decodedChar}` : 'Some inputs are floating'}</span>
      </DisplayFace>
    </div>
  );
});

HexDisplayNode.displayName = 'HexDisplayNode';
