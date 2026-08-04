import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import {
  SevenSegmentConfig,
  DEFAULT_SEVEN_SEGMENT_CONFIG,
  COLOR_CONFIGS,
} from '../../types/sevenSegment';
import { evaluateSevenSegment } from '../../utils/sevenSegmentLogic';

export const SevenSegmentNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as NodeData;
  const { label, inputs = [] } = nodeData;

  const config: SevenSegmentConfig = nodeData.sevenSegmentConfig || DEFAULT_SEVEN_SEGMENT_CONFIG;
  const evalRes = evaluateSevenSegment(inputs, config);
  const { segments, decodedChar } = evalRes;

  const colorStyle = COLOR_CONFIGS[config.color] || COLOR_CONFIGS.red;
  const opacityVal = (config.brightness ?? 100) / 100;
  const glowBlur = ((config.glowIntensity ?? 60) / 100) * 8;

  const getSegmentStyle = (isOn: boolean) => {
    if (!isOn) {
      return {
        stroke: '#1e293b',
        opacity: 0.35,
        filter: 'none',
      };
    }
    return {
      stroke: colorStyle.stroke,
      opacity: opacityVal,
      filter: glowBlur > 0 ? `drop-shadow(0 0 ${glowBlur}px ${colorStyle.glow})` : 'none',
    };
  };

  const getDpStyle = (isOn: boolean) => {
    if (!isOn) {
      return {
        fill: '#1e293b',
        opacity: 0.35,
        filter: 'none',
      };
    }
    return {
      fill: colorStyle.stroke,
      opacity: opacityVal,
      filter: glowBlur > 0 ? `drop-shadow(0 0 ${glowBlur}px ${colorStyle.glow})` : 'none',
    };
  };

  const modeBadgeText = {
    binary: 'BINARY (4-bit)',
    direct: 'DIRECT SEG',
    bcd: 'BCD DECODER',
    hex: 'HEX DECODER',
  }[config.mode];

  return (
    <div
      className={`relative min-w-[180px] p-3.5 rounded-2xl transition-all duration-200 border backdrop-blur-xl shadow-2xl ${
        selected
          ? 'border-cyan-400/80 shadow-cyan-500/20 ring-2 ring-cyan-500/30 bg-slate-950/95'
          : 'border-slate-800/80 hover:border-slate-600/80 bg-slate-950/90 hover:shadow-cyan-500/10'
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        {/* Node Label & Mode Badge */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-bold text-slate-200 font-mono tracking-wide">
            {label}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 uppercase">
              {modeBadgeText}
            </span>
            <span className="text-[9px] font-mono text-slate-400 uppercase">
              {config.displayType === 'common_anode' ? 'Anode' : 'Cathode'}
            </span>
          </div>
        </div>

        {/* 7-Segment SVG Graphic Container */}
        <div className="w-28 h-36 bg-[#080c14] border-2 border-slate-800/80 rounded-2xl p-3 flex flex-col items-center justify-center relative shadow-inner group">
          <svg viewBox="0 0 70 110" className="w-full h-full">
            {/* Segment a (Top) */}
            <line
              x1="18" y1="12" x2="52" y2="12"
              strokeWidth="5.5" strokeLinecap="round"
              className="transition-all duration-150"
              style={getSegmentStyle(segments.a)}
            />
            {/* Segment f (Top Left) */}
            <line
              x1="14" y1="16" x2="14" y2="48"
              strokeWidth="5.5" strokeLinecap="round"
              className="transition-all duration-150"
              style={getSegmentStyle(segments.f)}
            />
            {/* Segment b (Top Right) */}
            <line
              x1="56" y1="16" x2="56" y2="48"
              strokeWidth="5.5" strokeLinecap="round"
              className="transition-all duration-150"
              style={getSegmentStyle(segments.b)}
            />
            {/* Segment g (Middle) */}
            <line
              x1="18" y1="52" x2="52" y2="52"
              strokeWidth="5.5" strokeLinecap="round"
              className="transition-all duration-150"
              style={getSegmentStyle(segments.g)}
            />
            {/* Segment e (Bottom Left) */}
            <line
              x1="14" y1="56" x2="14" y2="88"
              strokeWidth="5.5" strokeLinecap="round"
              className="transition-all duration-150"
              style={getSegmentStyle(segments.e)}
            />
            {/* Segment c (Bottom Right) */}
            <line
              x1="56" y1="56" x2="56" y2="88"
              strokeWidth="5.5" strokeLinecap="round"
              className="transition-all duration-150"
              style={getSegmentStyle(segments.c)}
            />
            {/* Segment d (Bottom) */}
            <line
              x1="18" y1="92" x2="52" y2="92"
              strokeWidth="5.5" strokeLinecap="round"
              className="transition-all duration-150"
              style={getSegmentStyle(segments.d)}
            />

            {/* Optional DP (Decimal Point) */}
            {config.showDecimalPoint && (
              <circle
                cx="64" cy="92" r="3.5"
                className="transition-all duration-150"
                style={getDpStyle(segments.dp)}
              />
            )}
          </svg>

          {/* Decoded Character Overlay Badge */}
          <div className="absolute bottom-1.5 right-2 px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700/80 text-[10px] font-mono font-black text-slate-300">
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
                className={`!w-3 !h-3 !border-2 !rounded-full transition-all duration-200 ${
                  pinHigh
                    ? '!bg-emerald-400 !border-emerald-200 shadow-[0_0_8px_#34d399]'
                    : pinLow
                    ? '!bg-slate-800 !border-slate-500'
                    : '!bg-amber-500 !border-amber-300'
                }`}
              />
              <span className="text-[9px] text-slate-400 font-mono font-semibold pl-1.5 select-none">
                {pin.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
