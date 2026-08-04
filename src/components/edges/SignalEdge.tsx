import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';
import { SignalValue } from '../../types/circuit';

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

  const signalValue = (data?.signalValue ?? -1) as SignalValue;

  const isHigh = signalValue === 1;
  const isLow = signalValue === 0;

  let strokeColor = '#f97316'; // Orange for Unknown
  if (isHigh) strokeColor = '#22c55e'; // Bright Green for HIGH
  if (isLow) strokeColor = '#64748b'; // Slate Gray for LOW

  return (
    <>
      {/* Main Connection Wire Base Path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: selected ? 3.5 : 2.5,
          transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
        }}
      />

      {/* Animated Flowing Signal Pulses on HIGH Wires */}
      {isHigh && (
        <path
          d={edgePath}
          fill="none"
          stroke="#a7f3d0"
          strokeWidth={2.5}
          strokeDasharray="6 12"
          className="animate-[wireFlow_1s_linear_infinite]"
        />
      )}

      {/* Selected wire indicator ring or button at midpoint */}
      {selected && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <circle
            r={8}
            className="fill-slate-900 stroke-emerald-400 stroke-2 cursor-pointer shadow-md"
          />
          <text
            y={3}
            textAnchor="middle"
            className="text-[9px] font-mono font-bold fill-emerald-300 pointer-events-none"
          >
            x
          </text>
        </g>
      )}
    </>
  );
};
