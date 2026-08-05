import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';
import { SignalValue } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { getWireColors } from '../../utils/colorUtils';

export const SignalEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const showWireLabels = useCircuitStore((s) => s.showWireLabels);


  const signalValue = (data?.signalValue ?? -1) as SignalValue;

  const isHigh = signalValue === 1;
  const isLow = signalValue === 0;

  const customColor = data?.color as string | undefined;

  let strokeColor = '#f97316'; // Default: Unknown/Floating
  let pulseColor = '#a7f3d0';  // Default pulse
  let glowColor = '';

  if (customColor) {
    const colors = getWireColors(customColor);
    if (isHigh) {
      strokeColor = colors.high;
      pulseColor = colors.anim;
      glowColor = colors.high;
    } else {
      // For LOW (0) or UNKNOWN (-1)
      strokeColor = colors.low;
    }
  } else {
    if (isHigh) {
      strokeColor = '#22c55e'; // Bright Green for HIGH
      pulseColor = '#a7f3d0';  // Default pulse
      glowColor = '#22c55e';
    } else if (isLow) {
      strokeColor = '#64748b'; // Slate Gray for LOW
    } else {
      strokeColor = '#f97316'; // Orange for Unknown/Floating
    }
  }

  const wireLabel = data?.label as string | undefined;

  return (
    <>
      {/* Subtle Glow Path behind main path when HIGH */}
      {isHigh && glowColor && (
        <path
          d={edgePath}
          fill="none"
          stroke={glowColor}
          strokeWidth={selected ? 5.5 : 4.5}
          style={{
            opacity: 0.12,
            filter: 'blur(1.5px)',
            transition: 'stroke 0.2s ease',
          }}
        />
      )}

      {/* Main Connection Wire Base Path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#64748b' : strokeColor,
          strokeWidth: 2.5,
        }}
      />

      {/* Animated Flowing Signal Pulses on HIGH Wires */}
      {isHigh && (
        <path
          d={edgePath}
          fill="none"
          stroke={pulseColor}
          strokeWidth={2.5}
          strokeDasharray="6 12"
          className="animate-[wireFlow_1s_linear_infinite]"
        />
      )}

      {/* Edge label display */}
      {showWireLabels && wireLabel && wireLabel.trim() !== '' && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          {/* Background pill */}
          <rect
            x={-((wireLabel.length * 6 + 10) / 2)}
            y={-8}
            width={wireLabel.length * 6 + 10}
            height={16}
            rx={4}
            fill="#0b0f19"
            stroke={selected ? '#a855f7' : (customColor || '#334155')}
            strokeWidth={1}
            className="filter drop-shadow-md"
          />
          {/* Label Text */}
          <text
            textAnchor="middle"
            y={3}
            className="text-[9px] font-mono font-bold pointer-events-none select-none fill-slate-250"
          >
            {wireLabel}
          </text>
        </g>
      )}

      {/* Selected wire indicator ring or button at midpoint (fallback if no label) */}
      {selected && (!showWireLabels || !wireLabel || wireLabel.trim() === '') && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <circle
            r={8}
            className="fill-slate-900 stroke-purple-500 stroke-2 cursor-pointer shadow-md"
          />
          <text
            y={3}
            textAnchor="middle"
            className="text-[9px] font-mono font-bold fill-purple-300 pointer-events-none"
          >
            x
          </text>
        </g>
      )}
    </>
  );
};

