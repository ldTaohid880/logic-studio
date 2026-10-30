import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { GateType, NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { buildGateTruthTable, TRUTH_TABLE_PARTS } from '../../utils/gateTruthTable';
import { signalState } from '../../theme/signals';
import { TruthTable } from '../ui/TruthTable';
import { GateTruthTableModal } from '../ui/GateTruthTableModal';
import { gateExpression } from './GateExpression';
import { LevelBadge } from './PinStatusList';
import { DEFAULT_SEVEN_SEGMENT_CONFIG } from '../../types/sevenSegment';
import { evaluateSevenSegment } from '../../utils/sevenSegmentLogic';
import { SevenSegmentTruthTableModal } from '../ui/SevenSegmentTruthTableModal';

interface PartLiveViewProps {
  nodeId: string;
  nodeData: NodeData;
}

const LEVEL_WORDS = { high: '1', low: '0', unknown: 'floating' } as const;

const readBits = (values: number[]) => {
  const known = values.every((v) => v === 0 || v === 1);
  const num = values.reduce((acc, v, i) => acc | ((v === 1 ? 1 : 0) << i), 0);
  return { known, num };
};

/** Large reading of a single level, with the value spelled out for screen readers and projectors. */
const BigLevel: React.FC<{ value: number | undefined; caption: string }> = ({ value, caption }) => {
  const state = signalState(value);
  return (
    <div className="flex items-center gap-3">
      <span
        className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono text-2xl font-bold ${
          state === 'high'
            ? 'bg-signal-high text-on-accent'
            : state === 'low'
            ? 'bg-surface-3 text-fg-muted'
            : 'border-2 border-dashed border-signal-unknown text-signal-unknown'
        }`}
      >
        {state === 'high' ? '1' : state === 'low' ? '0' : '?'}
      </span>
      <p className="text-[13px] text-fg-muted leading-snug">{caption}</p>
    </div>
  );
};

const NumberReadout: React.FC<{ values: number[] }> = ({ values }) => {
  const { known, num } = readBits(values);
  if (!known) return <p className="text-[13px] text-fg-muted">Some inputs are floating, so there is no number to read yet.</p>;
  const rows = [
    ['Decimal', String(num)],
    ['Hex', '0x' + num.toString(16).toUpperCase()],
    ['Binary', num.toString(2).padStart(values.length, '0')],
  ];
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
      {rows.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt className="text-fg-subtle">{k}</dt>
          <dd className="font-mono text-fg tabular-nums">{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
};

/**
 * "How it works" for the selected part: the Boolean expression and a live truth table for gates,
 * direct controls for switches, and readings for LEDs and displays.
 */
export const PartLiveView: React.FC<PartLiveViewProps> = ({ nodeId, nodeData }) => {
  const [tableOpen, setTableOpen] = useState(false);
  const { gateType, inputs = [], outputs = [] } = nodeData;
  const aliases = nodeData.pinAliases || {};
  const live = inputs.map((p) => p.value);

  // Rebuilt on every render: at most 16 rows, and the live row changes with every signal update
  const table = TRUTH_TABLE_PARTS.has(gateType)
    ? buildGateTruthTable(gateType, inputs.length, live, inputs.map((p) => aliases[p.id] || ''))
    : null;

  if (table) {
    const exprs = gateExpression(gateType, table.inputHeaders);
    return (
      <div className="space-y-3">
        {exprs && (
          <div className="rounded-lg bg-surface-0/70 border border-line px-3 py-2.5 space-y-1">
            {exprs.map((e) => (
              <p key={e.label} className="font-mono text-[15px] text-fg">
                <span className="text-accent-fg">{e.label}</span> <span className="text-fg-subtle">=</span> {e.expr}
              </p>
            ))}
          </div>
        )}
        <div className="max-h-[264px] overflow-auto rounded-lg border border-line">
          <TruthTable
            caption="Truth table"
            inputHeaders={table.inputHeaders}
            outputHeaders={table.outputHeaders}
            rows={table.rows}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-fg-subtle">
            {table.rows.some((r) => r.isActive) ? 'The highlighted row is what the circuit is doing now.' : 'Connect every input to highlight the current row.'}
          </p>
          <button
            type="button"
            onClick={() => setTableOpen(true)}
            className="shrink-0 inline-flex items-center gap-1 text-xs text-accent-fg hover:underline cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Open
          </button>
        </div>
        <GateTruthTableModal
          isOpen={tableOpen}
          onClose={() => setTableOpen(false)}
          gateType={gateType}
          inputCount={inputs.length}
          currentInputs={inputs}
          nodeLabel={nodeData.label}
        />
      </div>
    );
  }

  return <OtherPartView nodeId={nodeId} gateType={gateType} nodeData={nodeData} inputValues={live} outputValue={outputs[0]?.value} />;
};

const OtherPartView: React.FC<{
  nodeId: string;
  gateType: GateType;
  nodeData: NodeData;
  inputValues: number[];
  outputValue: number | undefined;
}> = ({ nodeId, gateType, nodeData, inputValues, outputValue }) => {
  const store = useCircuitStore.getState;

  switch (gateType) {
    case 'INPUT': {
      const on = nodeData.value === 1;
      return (
        <div className="flex items-center justify-between gap-3">
          <BigLevel value={nodeData.value ?? 0} caption={`This switch outputs ${on ? '1' : '0'}.`} />
          <button
            type="button"
            onClick={() => store().toggleInputValue(nodeId)}
            className="shrink-0 h-8 px-3 rounded-lg border border-line bg-surface-2 hover:bg-surface-3 text-[13px] font-medium text-fg cursor-pointer"
          >
            Switch to {on ? '0' : '1'}
          </button>
        </div>
      );
    }
    case 'PUSH_BUTTON':
      return (
        <div className="flex items-center justify-between gap-3">
          <BigLevel value={nodeData.value ?? 0} caption="Outputs 1 only while held down." />
          <button
            type="button"
            onPointerDown={(e) => {
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              store().setButtonPressed(nodeId, true);
            }}
            onPointerUp={() => store().setButtonPressed(nodeId, false)}
            onLostPointerCapture={() => store().setButtonPressed(nodeId, false)}
            onKeyDown={(e) => {
              if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
                e.preventDefault();
                store().setButtonPressed(nodeId, true);
              }
            }}
            onKeyUp={() => store().setButtonPressed(nodeId, false)}
            onBlur={() => store().setButtonPressed(nodeId, false)}
            className="shrink-0 h-8 px-3 rounded-lg border border-line bg-surface-2 active:bg-signal-high active:text-on-accent text-[13px] font-medium text-fg cursor-pointer select-none"
          >
            Hold to press
          </button>
        </div>
      );
    case 'DIP_SWITCH': {
      const width = nodeData.bitWidth || 4;
      const bits = Array.from({ length: width }, (_, i) => (nodeData.dipValues?.[i] === 1 ? 1 : 0));
      return (
        <div className="space-y-3">
          <div className="flex gap-1.5" role="group" aria-label="Switches">
            {bits.map((b, i) => (
              <button
                key={i}
                type="button"
                role="switch"
                aria-checked={b === 1}
                aria-label={`Switch ${i + 1}`}
                onClick={() => store().toggleDipBit(nodeId, i)}
                className={`w-9 h-11 rounded-lg border flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  b ? 'bg-signal-high/15 border-signal-high text-fg' : 'bg-surface-2 border-line text-fg-muted hover:border-line-strong'
                }`}
              >
                <span className="font-mono text-sm font-bold">{b}</span>
                <span className="text-[10px] text-fg-subtle">{i + 1}</span>
              </button>
            ))}
          </div>
          <NumberReadout values={bits} />
        </div>
      );
    }
    case 'CONST_HIGH':
    case 'CONST_LOW':
      return <BigLevel value={gateType === 'CONST_HIGH' ? 1 : 0} caption={`Always ${gateType === 'CONST_HIGH' ? '1 (VCC)' : '0 (GND)'}.`} />;
    case 'OUTPUT': {
      const state = signalState(inputValues[0]);
      return (
        <BigLevel
          value={inputValues[0]}
          caption={state === 'high' ? 'The LED is on.' : state === 'low' ? 'The LED is off.' : 'Nothing drives this LED yet. Wire its input.'}
        />
      );
    }
    case 'LOGIC_PROBE':
      return <BigLevel value={inputValues[0]} caption={`The probe reads ${LEVEL_WORDS[signalState(inputValues[0])]}.`} />;
    case 'TRI_STATE_BUFFER':
      return (
        <div className="space-y-2">
          <p className="font-mono text-[15px] text-fg">
            <span className="text-accent-fg">Y</span> <span className="text-fg-subtle">=</span> A <span className="text-fg-subtle">when EN = 1</span>
          </p>
          <div className="flex items-center gap-2 text-[13px] text-fg-muted">
            Output now <LevelBadge value={outputValue} />
          </div>
        </div>
      );
    case 'SEVEN_SEGMENT':
      return <SevenSegmentLive nodeData={nodeData} />;
    case 'HEX_DISPLAY':
    case 'BUS_MONITOR':
      return <NumberReadout values={inputValues} />;
    default:
      return null;
  }
};

/** Lit segments, what the digit reads as, and the decoder truth table. */
const SevenSegmentLive: React.FC<{ nodeData: NodeData }> = ({ nodeData }) => {
  const [open, setOpen] = useState(false);
  const config = nodeData.sevenSegmentConfig || DEFAULT_SEVEN_SEGMENT_CONFIG;
  const inputs = nodeData.inputs || [];
  const evaluated = evaluateSevenSegment(inputs, config);
  // Same rule as the display: floating number inputs show nothing rather than a misleading 0
  const floating = config.mode !== 'direct' && inputs.slice(0, 4).some((p) => p.value === -1);
  const segments = floating
    ? { a: false, b: false, c: false, d: false, e: false, f: false, g: false, dp: false }
    : evaluated.segments;
  const { decodedChar, decimalValue } = evaluated;
  const lit = (Object.keys(segments) as (keyof typeof segments)[]).filter((k) => k !== 'dp' || config.showDecimalPoint);
  const shown = decodedChar.trim();

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-fg-muted">
        {floating
          ? 'Connect all four inputs A–D to show a digit.'
          : shown === 'Custom'
          ? 'The lit segments do not form a digit.'
          : shown
          ? <>Shows <span className="font-mono font-semibold text-fg">{shown}</span>{config.mode !== 'direct' && decimalValue !== null && <> (inputs = {decimalValue})</>}.</>
          : 'Nothing is lit.'}
      </p>
      <div className="flex flex-wrap gap-1" aria-label="Segments">
        {lit.map((seg) => (
          <span
            key={seg}
            className={`w-8 h-7 rounded-md flex items-center justify-center font-mono text-xs ${
              segments[seg] ? 'bg-signal-high/15 text-fg font-semibold ring-1 ring-inset ring-signal-high/50' : 'bg-surface-2 text-fg-subtle'
            }`}
            title={`Segment ${seg}: ${segments[seg] ? 'lit' : 'off'}`}
          >
            {seg}
          </span>
        ))}
      </div>
      {config.mode !== 'direct' && (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs text-accent-fg hover:underline cursor-pointer">
          <Maximize2 className="w-3.5 h-3.5" />
          Decoder truth table
        </button>
      )}
      <SevenSegmentTruthTableModal
        isOpen={open}
        onClose={() => setOpen(false)}
        config={config}
        currentInputs={inputs}
        nodeLabel={nodeData.label || '7-segment'}
      />
    </div>
  );
};

/** Whether PartLiveView has something to show for this part. */
export const hasLiveView = (gateType: GateType) =>
  TRUTH_TABLE_PARTS.has(gateType) ||
  ['INPUT', 'PUSH_BUTTON', 'DIP_SWITCH', 'CONST_HIGH', 'CONST_LOW', 'OUTPUT', 'LOGIC_PROBE', 'TRI_STATE_BUFFER', 'HEX_DISPLAY', 'BUS_MONITOR', 'SEVEN_SEGMENT'].includes(gateType);
