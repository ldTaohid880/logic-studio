import React, { memo, useState } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { signalColor } from '../../theme/signals';
import { Pin } from './Pin';
import { PartLabel, levelGlyph } from './partKit';

const W = 150;
const HEADER = 60;
const PITCH = 30;

/** Reads a dropped or chosen .hex file and loads it onto the board. */
export async function loadHexFile(nodeId: string, file: File) {
  const text = await file.text();
  useCircuitStore.getState().loadBoardFirmware(nodeId, file.name, text);
}

/**
 * Uno-compatible board: each digital pin has a read side on the left (digitalRead) and a drive side
 * on the right (digitalWrite). A .hex file can be dropped straight onto it.
 */
export const BoardNode: React.FC<NodeProps> = memo(({ id, data: nodeData }) => {
  const data = nodeData as unknown as NodeData;
  const running = useCircuitStore((s) => s.timeline.running);
  const [dropping, setDropping] = useState(false);
  const pins = data.outputs ?? [];
  const height = HEADER + pins.length * PITCH;
  // Pin 13 drives the on-board "L" LED
  const led = pins[pins.length - 1]?.value;
  const status = !data.firmware ? 'No program' : running ? 'Running' : 'Paused';

  const hasFiles = (e: React.DragEvent) => e.dataTransfer.types.includes('Files');

  return (
    <div
      className={`relative rounded-lg border-[1.5px] bg-surface-2 ${dropping ? 'border-accent' : 'border-line-strong'}`}
      style={{ width: W, height }}
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.stopPropagation();
        setDropping(true);
      }}
      onDragLeave={() => setDropping(false)}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.stopPropagation();
        setDropping(false);
        const file = e.dataTransfer.files[0];
        if (file) void loadHexFile(id, file);
      }}
    >
      <PartLabel text={data.label === 'Uno' ? undefined : data.label} />
      <div className="absolute inset-x-0 top-0 px-2.5 pt-1.5 border-b border-line" style={{ height: HEADER - 15 }}>
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-fg">Uno</span>
          <span
            className="ml-auto w-2.5 h-2.5 rounded-full border border-line-strong"
            style={{ background: led === 1 ? 'var(--signal-high)' : 'transparent' }}
            title={`Built-in LED (D13): ${led === 1 ? 'on' : 'off'}`}
          />
          <span className="text-[10px] font-mono text-fg-subtle">L</span>
        </div>
        <div className="text-[11px] text-fg-subtle truncate" title={data.firmware?.name}>
          {data.firmware ? `${data.firmware.name} · ${status}` : 'Drop a .hex file here'}
        </div>
      </div>

      {pins.map((pin, i) => {
        const top = HEADER + i * PITCH;
        const read = data.inputs?.[i];
        return (
          <React.Fragment key={pin.id}>
            <div
              className="absolute inset-x-0 flex items-center justify-between px-3 text-[11px] font-mono pointer-events-none"
              style={{ top: top - 8, height: 16 }}
            >
              <span style={{ color: signalColor(read?.value) }}>{read?.driven ? levelGlyph(read.value) : ''}</span>
              <span className="text-fg">{pin.name}</span>
              <span style={{ color: signalColor(pin.value) }}>{pin.value === -1 ? '' : levelGlyph(pin.value)}</span>
            </div>
            <Pin type="target" position={Position.Left} id={`in-${i}`} value={read?.value} label={`${pin.name} (read)`} style={{ top }} />
            <Pin type="source" position={Position.Right} id={pin.id} value={pin.value} label={`${pin.name} (drive)`} style={{ top }} />
          </React.Fragment>
        );
      })}
    </div>
  );
});

BoardNode.displayName = 'BoardNode';
