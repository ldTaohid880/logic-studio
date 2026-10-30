import React from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { SevenSegmentConfig, DEFAULT_SEVEN_SEGMENT_CONFIG } from '../../types/sevenSegment';
import { evaluateSevenSegment } from '../../utils/sevenSegmentLogic';
import { outputColor } from '../../theme/outputColors';
import { Pin } from './Pin';
import { DisplayFace, PartLabel, PITCH } from './partKit';
import { SegmentDigit } from './SegmentDigit';

/** Short pin name for the package edge: "A (LSB)" → "A", "Seg B" → "b". The full name is in the pin tooltip. */
const shortPinName = (name: string, alias?: string) => {
  if (alias) return alias.length > 4 ? alias.slice(0, 4) + '…' : alias;
  if (name.startsWith('Seg ')) return name.slice(4).toLowerCase();
  return name.replace(/\s*\(.*\)$/, '');
};

const BLANK = { a: false, b: false, c: false, d: false, e: false, f: false, g: false, dp: false };

const MODE_TAG: Record<SevenSegmentConfig['mode'], string> = {
  binary: '0–F',
  hex: '0–F',
  bcd: '0–9',
  direct: 'a–g',
};

/** 7-segment display: decodes 4 bits (hex or BCD) or takes one input per segment. */
export const SevenSegmentNode = React.memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as NodeData;
  const { label, inputs = [] } = nodeData;
  const config: SevenSegmentConfig = nodeData.sevenSegmentConfig || DEFAULT_SEVEN_SEGMENT_CONFIG;
  const evaluated = evaluateSevenSegment(inputs, config);
  // The decoder reads floating bits as 0; show nothing until all four number inputs are driven
  const floating = config.mode !== 'direct' && inputs.slice(0, 4).some((p) => p.value === -1);
  const segments = floating ? BLANK : evaluated.segments;
  const decodedChar = floating ? ' ' : evaluated.decodedChar;
  const col = outputColor(config.color, 'red');
  const aliases = nodeData.pinAliases || {};

  const rows = Math.max(inputs.length, 4);
  const H = rows * PITCH;
  const W = 120;

  return (
    <div className="relative rounded-md border-[1.5px] border-line-strong bg-surface-1" style={{ width: W, height: H }}>
      <PartLabel text={label} />
      {inputs.map((pin, i) => (
        <div key={pin.id} className="absolute left-0 flex items-center pl-2.5" style={{ top: i * PITCH, height: PITCH }}>
          <span className="text-[11px] font-mono text-fg-muted" title={aliases[pin.id] ? `${pin.name} (${aliases[pin.id]})` : pin.name}>
            {shortPinName(pin.name, aliases[pin.id])}
          </span>
          <Pin type="target" position={Position.Left} id={pin.id} value={pin.value} label={pin.name} style={{ top: 15 }} />
        </div>
      ))}
      <DisplayFace className="right-1.5 top-1.5 bottom-1.5 w-[68px] flex flex-col items-center justify-center gap-1 px-2.5 py-2">
        <SegmentDigit
          segments={segments}
          color={col.on}
          glow={col.glow}
          showDecimalPoint={config.showDecimalPoint}
          className="w-full max-h-[96px] flex-1"
        />
        <span className="text-[9px] font-mono text-[#6b7480]">{MODE_TAG[config.mode]}</span>
        <span className="sr-only">{decodedChar.trim() ? `Shows ${decodedChar}` : 'Display off'}</span>
      </DisplayFace>
    </div>
  );
});

SevenSegmentNode.displayName = 'SevenSegmentNode';
