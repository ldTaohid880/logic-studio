import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import {
  SevenSegmentConfig,
  DEFAULT_SEVEN_SEGMENT_CONFIG,
  COLOR_CONFIGS,
} from '../../types/sevenSegment';
import { evaluateSevenSegment } from '../../utils/sevenSegmentLogic';

export const SevenSegmentNode = React.memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as NodeData;
  const { label, inputs = [] } = nodeData;

  const config: SevenSegmentConfig = nodeData.sevenSegmentConfig || DEFAULT_SEVEN_SEGMENT_CONFIG;
  const evalRes = evaluateSevenSegment(inputs, config);
  const { segments, decodedChar } = evalRes;

  const colorStyle = COLOR_CONFIGS[config.color] || COLOR_CONFIGS.red;
  const opacityVal = (config.brightness ?? 100) / 100;
  const glowBlur = ((config.glowIntensity ?? 60) / 100) * 8;

  // Retrieve pin aliases
  const pinAliases = nodeData.pinAliases || {};

  const getPinDisplayName = (pin: { id: string; name: string }) => {
    const alias = pinAliases[pin.id];
    if (!alias) return pin.name;
    return alias.length > 6 ? alias.substring(0, 6) + '…' : alias;
  };

  const getSegmentStyle = (isOn: boolean) => {
    if (!isOn) {
      return {
        fill: '#151c28', // Darker gray for inactive state
        opacity: 0.15,   // Dim/subtle but visible
        filter: 'none',
        transition: 'fill 0.15s ease, opacity 0.15s ease',
      };
    }
    return {
      fill: colorStyle.stroke,
      opacity: opacityVal,
      filter: glowBlur > 0 ? `drop-shadow(0 0 ${glowBlur}px ${colorStyle.glow})` : 'none',
      transition: 'fill 0.15s ease, opacity 0.15s ease, filter 0.15s ease',
    };
  };

  const getDpStyle = (isOn: boolean) => {
    if (!isOn) {
      return {
        fill: '#151c28',
        opacity: 0.15,
        filter: 'none',
        transition: 'fill 0.15s ease, opacity 0.15s ease',
      };
    }
    return {
      fill: colorStyle.stroke,
      opacity: opacityVal,
      filter: glowBlur > 0 ? `drop-shadow(0 0 ${glowBlur}px ${colorStyle.glow})` : 'none',
      transition: 'fill 0.15s ease, opacity 0.15s ease, filter 0.15s ease',
    };
  };

  const modeBadgeText = {
    binary: 'BIN 4-BIT',
    direct: 'DIRECT SEG',
    bcd: 'BCD DECODER',
    hex: 'HEX DECODER',
  }[config.mode];

  return (
    <div
      className={`relative min-w-[180px] p-3.5 rounded-xl transition-all duration-200 border backdrop-blur-xl shadow-sm ${
        selected
          ? 'border-purple-500 ring-1 ring-purple-500/20 bg-slate-950/95'
          : 'border-slate-800 hover:border-slate-700 bg-slate-950/90'
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        {/* Node Label & Mode Badge */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-bold text-slate-200 font-mono tracking-wide">
            {label}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 uppercase">
              {modeBadgeText}
            </span>
            <span className="text-[9px] font-mono text-slate-400 uppercase">
              {config.displayType === 'common_anode' ? 'Anode' : 'Cathode'}
            </span>
          </div>
        </div>

        {/* 7-Segment SVG Graphic Container */}
        <div className="w-28 h-36 bg-surface-0 border border-slate-900 rounded-lg p-3.5 flex flex-col items-center justify-center relative shadow-inner group">
          <svg viewBox="0 0 70 110" className="w-full h-full transform skew-x-[-4deg]">
            {/* Segment a (Top horizontal) */}
            <polygon
              points="16,10 22,4 48,4 54,10 48,16 22,16"
              className="transition-all duration-150 cursor-pointer"
              style={getSegmentStyle(segments.a)}
            />
            {/* Segment f (Top Left vertical) */}
            <polygon
              points="10,16 16,22 16,48 10,54 4,48 4,22"
              className="transition-all duration-150 cursor-pointer"
              style={getSegmentStyle(segments.f)}
            />
            {/* Segment b (Top Right vertical) */}
            <polygon
              points="54,16 60,22 60,48 54,54 48,48 48,22"
              className="transition-all duration-150 cursor-pointer"
              style={getSegmentStyle(segments.b)}
            />
            {/* Segment g (Middle horizontal) */}
            <polygon
              points="16,54 22,48 48,48 54,54 48,60 22,60"
              className="transition-all duration-150 cursor-pointer"
              style={getSegmentStyle(segments.g)}
            />
            {/* Segment e (Bottom Left vertical) */}
            <polygon
              points="10,54 16,60 16,86 10,92 4,86 4,60"
              className="transition-all duration-150 cursor-pointer"
              style={getSegmentStyle(segments.e)}
            />
            {/* Segment c (Bottom Right vertical) */}
            <polygon
              points="54,54 60,60 60,86 54,92 48,86 48,60"
              className="transition-all duration-150 cursor-pointer"
              style={getSegmentStyle(segments.c)}
            />
            {/* Segment d (Bottom horizontal) */}
            <polygon
              points="16,98 22,92 48,92 54,98 48,104 22,104"
              className="transition-all duration-150 cursor-pointer"
              style={getSegmentStyle(segments.d)}
            />

            {/* Optional DP (Decimal Point) */}
            {config.showDecimalPoint && (
              <circle
                cx="64" cy="98" r="3.5"
                className="transition-all duration-150"
                style={getDpStyle(segments.dp)}
              />
            )}
          </svg>

          {/* Decoded Character Overlay Badge */}
          <div className="absolute bottom-1.5 right-2 px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-[10px] font-mono font-black text-slate-400">
            {decodedChar === ' ' ? 'OFF' : decodedChar}
          </div>
        </div>
      </div>

      {/* Dynamic Input Handles on Left */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col justify-around h-32 my-1">
        {inputs.map((pin, i) => {
          const pinHigh = pin.value === 1;
          const pinLow = pin.value === 0;

          return (
            <div key={pin.id} className="relative flex items-center">
              <Handle
                type="target"
                position={Position.Left}
                id={pin.id}
                style={{ left: '-12px' }}
                className="lsp-pin"
                  data-signal={pinHigh ? 'high' : pinLow ? 'low' : 'unknown'}
                title={`${pin.name}: ${pin.value === 1 ? 'HIGH' : pin.value === 0 ? 'LOW' : 'UNKNOWN'}`}
              />
              <span
                className="text-[9px] text-slate-500 font-mono font-bold pl-1.5 select-none truncate max-w-[50px]"
                title={pinAliases[pin.id] ? `${pin.name} (${pinAliases[pin.id]})` : pin.name}
              >
                {getPinDisplayName(pin)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

SevenSegmentNode.displayName = 'SevenSegmentNode';
