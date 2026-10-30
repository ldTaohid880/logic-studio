import React, { useRef } from 'react';
import { Clock, Cpu, Database, FileUp, RotateCcw, Terminal } from 'lucide-react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { CLOCK_RATES_HZ, DEFAULT_CLOCK_HZ } from '../../simulation/timeline';
import { ALU_OPERATIONS, DEFAULT_ROM_CONTENTS } from '../../simulation/icLogic';
import { loadHexFile } from '../nodes/BoardNode';
import { InspectorSection } from '../ui/InspectorSection';
import { PropertyRow } from '../ui/PropertyRow';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

interface PanelProps {
  nodeId: string;
  nodeData: NodeData;
}

/** Number on `count` input pins starting at `first` (least significant first); null while any floats. */
const readNumber = (data: NodeData, first: number, count: number): number | null => {
  const pins = data.inputs.slice(first, first + count);
  if (pins.some((p) => p.value === -1)) return null;
  return pins.reduce((acc, p, i) => acc | ((p.value === 1 ? 1 : 0) << i), 0);
};

const hex = (n: number) => n.toString(16).toUpperCase();

export const ClockProperties: React.FC<PanelProps> = ({ nodeId, nodeData }) => (
  <InspectorSection title="Clock" icon={<Clock className="w-4 h-4" />}>
    <PropertyRow label="Frequency">
      <Select
        options={CLOCK_RATES_HZ.map((hz) => ({ value: hz, label: `${hz} Hz` }))}
        value={nodeData.clockHz ?? DEFAULT_CLOCK_HZ}
        onChange={(clockHz) => useCircuitStore.getState().updateNodeData(nodeId, { clockHz })}
      />
    </PropertyRow>
    <p className="text-xs text-fg-subtle">
      Frequencies are in simulated time. Use the run controls under the canvas to pause, step one edge at a time or change the speed.
    </p>
  </InspectorSection>
);

/** 16 words as a 4 × 4 grid, the addressed one highlighted; editable for ROM. */
const MemoryGrid: React.FC<{ words: number[]; address: number | null; onChange?: (address: number, value: number) => void }> = ({
  words,
  address,
  onChange,
}) => (
  <div className="grid grid-cols-4 gap-1" role="grid" aria-label="Memory contents">
    {words.map((w, a) => (
      <label
        key={a}
        className={`flex items-center gap-1.5 rounded-md px-1.5 h-8 text-xs font-mono ${
          a === address ? 'bg-accent/15 ring-1 ring-inset ring-accent' : 'bg-surface-2'
        }`}
      >
        <span className="text-fg-subtle w-3">{hex(a)}</span>
        {onChange ? (
          <input
            value={hex(w)}
            maxLength={1}
            aria-label={`Address ${hex(a)}`}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const v = parseInt(e.target.value, 16);
              if (!Number.isNaN(v)) onChange(a, v);
            }}
            className="w-full min-w-0 bg-transparent text-fg font-semibold outline-none uppercase"
          />
        ) : (
          <span className="text-fg font-semibold">{hex(w)}</span>
        )}
      </label>
    ))}
  </div>
);

export const RomProperties: React.FC<PanelProps> = ({ nodeId, nodeData }) => {
  const words = nodeData.romContents ?? DEFAULT_ROM_CONTENTS;
  return (
    <InspectorSection title="Contents" icon={<Database className="w-4 h-4" />}>
      <p className="text-xs text-fg-subtle">One hex digit (0–F) per address. The highlighted address is the one A3–A0 selects.</p>
      <MemoryGrid
        words={words}
        address={readNumber(nodeData, 0, 4)}
        onChange={(address, value) => {
          const romContents = words.slice();
          romContents[address] = value;
          useCircuitStore.getState().updateNodeData(nodeId, { romContents }, { propagate: true });
        }}
      />
    </InspectorSection>
  );
};

export const RamProperties: React.FC<PanelProps> = ({ nodeData }) => (
  <InspectorSection title="Contents" icon={<Database className="w-4 h-4" />}>
    <p className="text-xs text-fg-subtle">
      Written on a rising CLK edge while WE is 1. Contents are lost on restart, like real RAM losing power.
    </p>
    <MemoryGrid words={(nodeData.icState?.mem as number[] | undefined) ?? new Array(16).fill(0)} address={readNumber(nodeData, 0, 4)} />
  </InspectorSection>
);

export const AluProperties: React.FC<PanelProps> = ({ nodeData }) => {
  const op = readNumber(nodeData, 8, 3);
  return (
    <InspectorSection title="Operations" icon={<Cpu className="w-4 h-4" />}>
      <ul className="grid grid-cols-2 gap-1 text-xs">
        {ALU_OPERATIONS.map((name, i) => (
          <li key={name} className={`flex gap-2 rounded-md px-2 h-7 items-center ${i === op ? 'bg-accent/15 ring-1 ring-inset ring-accent' : 'bg-surface-2'}`}>
            <span className="font-mono text-fg-subtle">{i.toString(2).padStart(3, '0')}</span>
            <span className="text-fg">{name}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-fg-subtle">
        S2 S1 S0 pick the operation. C is the carry for addition and the borrow for subtraction; Z is 1 when the result F is 0.
      </p>
    </InspectorSection>
  );
};

export const BoardProperties: React.FC<PanelProps> = ({ nodeId, nodeData }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const serial = useCircuitStore((s) => s.boardSerial[nodeId] ?? '');
  const restartTimeline = useCircuitStore((s) => s.restartTimeline);

  return (
    <>
      <InspectorSection title="Program" icon={<Cpu className="w-4 h-4" />}>
        <p className="text-[13px] text-fg">
          {nodeData.firmware ? <span className="font-mono">{nodeData.firmware.name}</span> : 'No program loaded yet.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary" leftIcon={<FileUp className="w-4 h-4" />} onClick={() => fileRef.current?.click()}>
            {nodeData.firmware ? 'Load another .hex' : 'Load .hex file'}
          </Button>
          {nodeData.firmware && (
            <Button size="sm" leftIcon={<RotateCcw className="w-4 h-4" />} onClick={restartTimeline}>
              Restart
            </Button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".hex,.ihex,text/plain"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void loadHexFile(nodeId, file);
            e.target.value = '';
          }}
        />
        <details className="text-xs text-fg-muted">
          <summary className="cursor-pointer text-accent-fg">How to get a .hex file</summary>
          <ol className="list-decimal pl-4 mt-2 space-y-1">
            <li>Open your sketch in the Arduino IDE with the board set to Arduino Uno (or Nano).</li>
            <li>Choose Sketch → Export compiled binary.</li>
            <li>Choose Sketch → Show sketch folder and open the build folder.</li>
            <li>Use the file ending in <span className="font-mono">.ino.hex</span>, not the one “with_bootloader”.</li>
          </ol>
        </details>
        <p className="text-xs text-fg-subtle">
          Wire the left side of a pin to read it (digitalRead) and the right side to drive parts (digitalWrite). pinMode, INPUT_PULLUP,
          delay, millis and Serial work; analogRead and analogWrite aren't simulated.
        </p>
      </InspectorSection>

      {nodeData.firmware && (
        <InspectorSection title="Serial monitor" icon={<Terminal className="w-4 h-4" />}>
          <pre className="max-h-48 overflow-y-auto rounded-md bg-surface-2 p-2 text-xs font-mono text-fg whitespace-pre-wrap break-all select-text" aria-live="off">
            {serial || <span className="text-fg-subtle">Nothing printed yet. Serial.begin(9600) and Serial.println show here.</span>}
          </pre>
        </InspectorSection>
      )}
    </>
  );
};
