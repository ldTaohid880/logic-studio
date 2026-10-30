import React from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { Pin, pinDisplayName } from './Pin';
import { gateGeometry } from './symbols/gateGeometry';
import { signalColor, signalState } from '../../theme/signals';

const LEVEL_GLYPH = { high: '1', low: '0', unknown: '?' } as const;

// Default labels add nothing next to a schematic symbol, so only custom labels are printed
const DEFAULT_LABEL = /^(and|or|not|nand|nor|xor|xnor|buffer|tri-state buffer)( gate)?$/i;

/** Constant HIGH/LOW source drawn as a small labelled terminal. */
const ConstantNode: React.FC<{ nodeData: NodeData; isHigh: boolean }> = ({ nodeData, isHigh }) => {
  const out = nodeData.outputs[0];
  return (
    <div className="lsp-schematic relative bg-transparent border-0 shadow-none rounded-none" style={{ width: 60, height: 30 }}>
      <svg width={60} height={30} className="overflow-visible" aria-hidden="true">
        <rect x={1} y={4} width={38} height={22} rx={4} className="lsp-symbol-body" />
        <text
          x={20}
          y={19.5}
          textAnchor="middle"
          className="font-mono text-[12px] font-semibold"
          style={{ fill: signalColor(isHigh ? 1 : 0) }}
        >
          {isHigh ? 'VCC' : 'GND'}
        </text>
        <line x1={39} y1={15} x2={60} y2={15} className="lsp-symbol-lead" style={{ stroke: signalColor(out?.value) }} />
      </svg>
      {out && (
        <Pin type="source" position={Position.Right} id={out.id} value={out.value} label="Out" style={{ top: 15 }} />
      )}
    </div>
  );
};

export const LogicGateNode = React.memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as NodeData;
  const { label, gateType, inputs = [], outputs = [] } = nodeData;
  const pinAliases = nodeData.pinAliases || {};

  if (gateType === 'CONST_HIGH' || gateType === 'CONST_LOW') {
    return <ConstantNode nodeData={nodeData} isHigh={gateType === 'CONST_HIGH'} />;
  }

  const geo = gateGeometry(gateType, inputs.length);
  const out = outputs[0];
  const outState = signalState(out?.value);
  const leftInputs = gateType === 'TRI_STATE_BUFFER' ? inputs.slice(0, 1) : inputs;
  const enablePin = gateType === 'TRI_STATE_BUFFER' ? inputs[1] : undefined;
  const showLabel = label && !DEFAULT_LABEL.test(label.trim());

  return (
    <div
      className="lsp-schematic relative bg-transparent border-0 shadow-none rounded-none"
      style={{ width: geo.width, height: geo.height }}
    >
      <svg width={geo.width} height={geo.height} className="overflow-visible block" aria-hidden="true">
        {/* Input leads, colored by the level on each pin */}
        {leftInputs.map((pin, i) => {
          const g = geo.inputs[i];
          if (!g) return null;
          return (
            <line
              key={pin.id}
              x1={0}
              y1={g.y}
              x2={g.leadEnd + 1}
              y2={g.y}
              className="lsp-symbol-lead"
              style={{ stroke: signalColor(pin.value) }}
            />
          );
        })}
        {geo.enable && enablePin && (
          <line
            x1={geo.enable.x}
            y1={geo.height}
            x2={geo.enable.x}
            y2={geo.enable.leadEnd}
            className="lsp-symbol-lead"
            style={{ stroke: signalColor(enablePin.value) }}
          />
        )}

        {/* Output lead */}
        <line
          x1={geo.output.leadStart}
          y1={geo.output.y}
          x2={geo.width}
          y2={geo.output.y}
          className="lsp-symbol-lead"
          style={{ stroke: signalColor(out?.value) }}
        />

        {/* Body */}
        <path d={geo.body} className="lsp-symbol-body" />
        {geo.extras.map((d) => (
          <path key={d} d={d} className="lsp-symbol-body" style={{ fill: 'none' }} />
        ))}
        {geo.bubble && (
          <circle cx={geo.bubble.cx} cy={geo.bubble.cy} r={geo.bubble.r} className="lsp-symbol-body" />
        )}

        {/* Output level as text, so the state is readable without color */}
        <text
          x={geo.width - 4}
          y={geo.output.y - 5}
          textAnchor="end"
          className="font-mono text-[10px] font-semibold"
          style={{ fill: signalColor(out?.value) }}
        >
          {LEVEL_GLYPH[outState]}
        </text>

        {enablePin && geo.enable && (
          <text x={geo.enable.x + 5} y={geo.height - 3} className="font-mono text-[9px]" style={{ fill: 'var(--fg-subtle)' }}>
            EN
          </text>
        )}

        {/* Aliased pin names */}
        {leftInputs.map((pin, i) =>
          pinAliases[pin.id] && geo.inputs[i] ? (
            <text
              key={`alias-${pin.id}`}
              x={2}
              y={geo.inputs[i].y - 4}
              className="font-mono text-[9px]"
              style={{ fill: 'var(--fg-subtle)' }}
            >
              {pinDisplayName(pin, pinAliases, 6)}
            </text>
          ) : null
        )}
      </svg>

      {leftInputs.map((pin, i) => (
        <Pin
          key={pin.id}
          type="target"
          position={Position.Left}
          id={pin.id}
          value={pin.value}
          label={pinDisplayName(pin, pinAliases, 16)}
          style={{ top: geo.inputs[i]?.y ?? geo.height / 2 }}
        />
      ))}
      {enablePin && geo.enable && (
        <Pin
          type="target"
          position={Position.Bottom}
          id={enablePin.id}
          value={enablePin.value}
          label="Enable"
          style={{ left: geo.enable.x }}
        />
      )}
      {out && (
        <Pin
          type="source"
          position={Position.Right}
          id={out.id}
          value={out.value}
          label={pinDisplayName(out, pinAliases, 16)}
          style={{ top: geo.output.y }}
        />
      )}

      {showLabel && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-0.5 text-[11px] font-medium text-fg-muted whitespace-nowrap pointer-events-none">
          {label}
        </div>
      )}
    </div>
  );
});

LogicGateNode.displayName = 'LogicGateNode';
