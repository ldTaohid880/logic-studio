import React, { memo, useState } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { NodeData, SignalValue } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { BOARD_PINS, boardPinName } from '../../simulation/timeline';
import { Pin } from './Pin';
import { PartLabel } from './partKit';

/** Reads a dropped or chosen .hex file and loads it onto the board. */
export async function loadHexFile(nodeId: string, file: File) {
  const text = await file.text();
  useCircuitStore.getState().loadBoardFirmware(nodeId, file.name, text);
}

// Real hardware looks the same in both themes, like the display faces (see DisplayFace in partKit)
const HW = {
  pcb: '#0b7e86',
  pcbEdge: '#06646b',
  silk: '#eef6f5',
  header: '#161616',
  chip: '#1b1b1b',
  chipText: '#a3a9b0',
  metal: '#c6cbd1',
  metalEdge: '#8e959c',
  hole: '#e7dcb8',
  lit: '#3ddc63',
  ledOn: '#ffb020',
  ledOff: '#5d5338',
};

const W = 570;
const H = 435;
const PWM_PINS = new Set([3, 5, 6, 9, 10, 11]);

/** x of a digital header position (pins 13…8, a gap, then 7…0), as on the real board. */
const digitalX = (pin: number) => (pin >= 8 ? 135 + (13 - pin) * 30 : 330 + (7 - pin) * 30);
const analogX = (i: number) => 390 + i * 30;
const POWER_PINS = ['', 'IOREF', 'RESET', '3.3V', '5V', 'GND', 'GND', 'Vin'];
const powerX = (i: number) => 120 + i * 30;

/** Where each board pin (BOARD_PINS order) sits: top header for D2–D13, bottom header for A0–A5. */
const pinPlace = (pin: number) => (pin >= 14 ? { x: analogX(pin - 14), top: false } : { x: digitalX(pin), top: true });

const Text: React.FC<{ x: number; y: number; size?: number; weight?: number; anchor?: 'start' | 'middle' | 'end'; fill?: string; children: React.ReactNode }> = ({
  x,
  y,
  size = 8,
  weight = 600,
  anchor = 'middle',
  fill = HW.silk,
  children,
}) => (
  <text x={x} y={y} fontSize={size} fontWeight={weight} textAnchor={anchor} fill={fill} fontFamily="ui-sans-serif, system-ui, sans-serif">
    {children}
  </text>
);

/** Header hole; lit when the pin is at 1. */
const Hole: React.FC<{ x: number; y: number; value?: SignalValue }> = ({ x, y, value }) => (
  <rect x={x - 4.5} y={y - 4.5} width={9} height={9} rx={1} fill={value === 1 ? HW.lit : '#050505'} stroke="#3a3a3a" strokeWidth={0.75} />
);

const Board: React.FC<{ levels: (SignalValue | undefined)[]; d13: SignalValue | undefined; title: string; status: string; empty: boolean }> = ({
  levels,
  d13,
  title,
  status,
  empty,
}) => (
  <svg width={W} height={H} className="absolute inset-0 overflow-visible pointer-events-none" aria-hidden="true">
    {/* PCB */}
    <rect x={0} y={0} width={W} height={H} rx={10} fill={HW.pcb} stroke={HW.pcbEdge} strokeWidth={2} />
    {[[42, 398], [552, 62], [552, 300]].map(([cx, cy]) => (
      <g key={`${cx}-${cy}`}>
        <circle cx={cx} cy={cy} r={8} fill={HW.hole} />
        <circle cx={cx} cy={cy} r={4.5} fill={HW.pcbEdge} />
      </g>
    ))}

    {/* USB-B and barrel jack stick out of the left edge */}
    <rect x={-18} y={62} width={84} height={68} rx={2} fill={HW.metal} stroke={HW.metalEdge} strokeWidth={1.5} />
    <rect x={-18} y={76} width={62} height={40} fill="#9ba1a8" />
    <rect x={-18} y={88} width={44} height={16} fill="#e9ecef" />
    <rect x={-12} y={300} width={78} height={58} rx={2} fill="#202020" stroke="#000" strokeWidth={1} />
    <circle cx={16} cy={329} r={11} fill="#3a3a3a" />
    <circle cx={16} cy={329} r={4} fill={HW.metal} />

    {/* Reset button */}
    <rect x={86} y={52} width={26} height={26} rx={2} fill={HW.metal} stroke={HW.metalEdge} />
    <circle cx={99} cy={65} r={8} fill="#b93a32" />
    <Text x={99} y={90} size={7}>RESET</Text>

    {/* USB interface chip, LEDs */}
    <rect x={150} y={118} width={34} height={34} fill={HW.chip} transform="rotate(45 167 135)" />
    {[
      { y: 76, label: 'L', on: d13 === 1 },
      { y: 92, label: 'TX', on: false },
      { y: 108, label: 'RX', on: false },
    ].map((led) => (
      <g key={led.label}>
        <rect x={210} y={led.y - 3} width={12} height={7} rx={1} fill={led.on ? HW.ledOn : HW.ledOff} />
        {led.on && <rect x={207} y={led.y - 6} width={18} height={13} rx={4} fill={HW.ledOn} opacity={0.35} />}
        <Text x={230} y={led.y + 3} size={8} anchor="start">{led.label}</Text>
      </g>
    ))}
    <rect x={500} y={92} width={12} height={7} rx={1} fill={HW.lit} />
    <rect x={497} y={89} width={18} height={13} rx={4} fill={HW.lit} opacity={0.35} />
    <Text x={506} y={114} size={8}>ON</Text>

    {/* Name and the loaded program */}
    <text x={330} y={196} fontSize={48} fontWeight={800} fontStyle="italic" textAnchor="middle" fill={HW.silk} letterSpacing={3} fontFamily="ui-sans-serif, system-ui, sans-serif">
      UNO
    </text>
    {empty ? (
      <>
        <rect x={225} y={214} width={210} height={44} rx={6} fill="none" stroke={HW.silk} strokeWidth={1.25} strokeDasharray="5 4" />
        <Text x={330} y={233} size={12}>Drop a .hex file here</Text>
        <Text x={330} y={249} size={9} weight={500}>or load one in the inspector</Text>
      </>
    ) : (
      <>
        <Text x={330} y={228} size={12} weight={700}>{title.length > 30 ? `${title.slice(0, 29)}…` : title}</Text>
        <Text x={330} y={246} size={10} weight={500}>{status}</Text>
      </>
    )}

    {/* Crystal, capacitors, regulator */}
    <rect x={170} y={305} width={42} height={16} rx={8} fill={HW.metal} stroke={HW.metalEdge} />
    {[96, 132].map((cx) => (
      <g key={cx}>
        <circle cx={cx} cy={330} r={14} fill={HW.metal} stroke={HW.metalEdge} strokeWidth={1.5} />
        <path d={`M${cx - 6} 330 H${cx + 6} M${cx} 324 V336`} stroke={HW.metalEdge} strokeWidth={1.5} />
      </g>
    ))}
    <rect x={84} y={364} width={28} height={20} rx={1} fill={HW.chip} />

    {/* ATmega328P in its DIP-28 package */}
    {Array.from({ length: 14 }, (_, i) => (
      <g key={i}>
        <rect x={262 + i * 18.6} y={293} width={6} height={8} fill={HW.metal} />
        <rect x={262 + i * 18.6} y={339} width={6} height={8} fill={HW.metal} />
      </g>
    ))}
    <rect x={252} y={299} width={274} height={42} rx={2} fill={HW.chip} />
    <circle cx={252} cy={320} r={6} fill={HW.pcb} />
    <Text x={392} y={324} size={10} fill={HW.chipText}>ATMEGA328P-PU</Text>

    {/* ICSP header */}
    <rect x={520} y={168} width={34} height={52} rx={1} fill={HW.header} />
    {[0, 1, 2].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={526 + c * 14} y={174 + r * 15} width={8} height={8} fill="#050505" stroke="#3a3a3a" strokeWidth={0.75} />))}
    <Text x={537} y={234} size={7}>ICSP</Text>

    {/* Digital header (top edge) */}
    <rect x={60} y={3} width={240} height={20} rx={1} fill={HW.header} />
    <rect x={315} y={3} width={240} height={20} rx={1} fill={HW.header} />
    <Hole x={75} y={13} />
    <Hole x={105} y={13} />
    <Text x={75} y={36} size={7}>AREF</Text>
    <Text x={105} y={36} size={7}>GND</Text>
    {Array.from({ length: 14 }, (_, pin) => (
      <g key={pin}>
        <Hole x={digitalX(pin)} y={13} value={pin >= 2 ? levels[pin - 2] : undefined} />
        <Text x={digitalX(pin)} y={36} size={pin < 2 ? 7 : 9}>
          {pin === 1 ? 'TX→1' : pin === 0 ? 'RX←0' : `${PWM_PINS.has(pin) ? '~' : ''}${pin}`}
        </Text>
      </g>
    ))}
    <Text x={330} y={54} size={10} weight={700}>DIGITAL (PWM ~)</Text>

    {/* Power and analog headers (bottom edge) */}
    <rect x={105} y={H - 23} width={240} height={20} rx={1} fill={HW.header} />
    <rect x={375} y={H - 23} width={180} height={20} rx={1} fill={HW.header} />
    {POWER_PINS.map((name, i) => (
      <g key={i}>
        <Hole x={powerX(i)} y={H - 13} />
        <Text x={powerX(i)} y={H - 30} size={7}>{name}</Text>
      </g>
    ))}
    {Array.from({ length: 6 }, (_, i) => (
      <g key={i}>
        <Hole x={analogX(i)} y={H - 13} value={levels[12 + i]} />
        <Text x={analogX(i)} y={H - 30} size={9}>{`A${i}`}</Text>
      </g>
    ))}
    <Text x={225} y={H - 46} size={10} weight={700}>POWER</Text>
    <Text x={465} y={H - 46} size={10} weight={700}>ANALOG IN</Text>
  </svg>
);

/**
 * Uno-compatible board drawn like the real one. Each header pin is two-way: drag a wire out of it to
 * drive a part (digitalWrite), or drop a wire on it to read a part (digitalRead). A .hex file can be
 * dropped straight onto the board.
 */
export const BoardNode: React.FC<NodeProps> = memo(({ id, data: nodeData }) => {
  const data = nodeData as unknown as NodeData;
  const running = useCircuitStore((s) => s.timeline.running);
  const [dropping, setDropping] = useState(false);

  // What a pin shows: the level the program drives, or else the level wired into it
  const levels = BOARD_PINS.map((_, i) => {
    const out = data.outputs?.[i]?.value;
    const read = data.inputs?.[i];
    return out !== undefined && out !== -1 ? out : read?.driven ? read.value : out;
  });
  const status = running ? 'Running' : 'Paused';
  const hasFiles = (e: React.DragEvent) => e.dataTransfer.types.includes('Files');

  return (
    <div
      className="lsp-schematic relative"
      style={{ width: W, height: H, outline: dropping ? '2px solid var(--accent)' : undefined, outlineOffset: 4, borderRadius: 10 }}
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
      <Board levels={levels} d13={levels[11]} title={data.firmware?.name ?? ''} status={status} empty={!data.firmware} />

      {BOARD_PINS.map((pin, i) => {
        const { x, top } = pinPlace(pin);
        const name = boardPinName(pin);
        const position = top ? Position.Top : Position.Bottom;
        return (
          <React.Fragment key={pin}>
            {/* Stacked handles: React Flow picks whichever side the wire needs */}
            <Pin type="target" position={position} id={`in-${i}`} value={data.inputs?.[i]?.value} className="lsp-pin-ghost" style={{ left: x }} />
            <Pin type="source" position={position} id={`out-${i}`} value={levels[i]} label={name} style={{ left: x }} />
          </React.Fragment>
        );
      })}
    </div>
  );
});

BoardNode.displayName = 'BoardNode';
