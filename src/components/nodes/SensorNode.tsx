import React, { memo } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { SENSORS, SensorType, formatSensorValue, sensorLevel } from '../../simulation/sensors';
import { Pin } from './Pin';
import { Lead, PartLabel, PartSvg } from './partKit';

const W = 120;
const MODULE_W = 104;

// Module boards look the same in both themes, like real hardware (see DisplayFace in partKit)
const HW = {
  blue: '#1d54a8',
  blueEdge: '#143d7c',
  green: '#2c7a3c',
  greenEdge: '#1e5a2b',
  silk: '#eef3fb',
  gold: '#d9b45a',
  chip: '#161616',
  trimmer: '#2f6fd6',
  ledRed: '#ff4a3d',
  ledGreen: '#3ddc63',
  ledOff: '#3b3b3b',
};

const Trimmer: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <rect x={x - 7} y={y - 7} width={14} height={14} rx={2} fill={HW.trimmer} stroke="#1a3f80" />
    <circle cx={x} cy={y} r={4.5} fill={HW.gold} />
    <path d={`M${x - 3} ${y} H${x + 3} M${x} ${y - 3} V${y + 3}`} stroke="#7a5d1c" strokeWidth={1.25} />
  </g>
);

/** The sensing element at the left of the module. */
const Element: React.FC<{ type: SensorType; level: number }> = ({ type, level }) => {
  switch (type) {
    case 'SENSOR_LIGHT':
      return (
        <g>
          <circle cx={22} cy={24} r={16} fill="#ffd54a" opacity={(level / 100) * 0.55} />
          <circle cx={22} cy={24} r={10} fill="#efe2c4" stroke="#b9a77d" />
          <path d="M15 20 h3 v8 h3 v-8 h3 v8 h3 v-8 h2" fill="none" stroke="#9b3b2a" strokeWidth={1.3} />
        </g>
      );
    case 'SENSOR_TEMPERATURE': {
      // The bead glows warmer as it heats up
      const heat = Math.min(1, Math.max(0, (level + 10) / 70));
      return (
        <g>
          <path d="M19 30 V44 M25 30 V44" stroke="#c9cdd2" strokeWidth={1.5} />
          <circle cx={22} cy={23} r={10} fill="#ff6a3d" opacity={heat * 0.45} />
          <ellipse cx={22} cy={23} rx={6} ry={8} fill="#1a1a1a" />
        </g>
      );
    }
    case 'SENSOR_OBSTACLE':
      return (
        <g>
          <circle cx={16} cy={18} r={7.5} fill="#e9eef2" stroke="#9aa3ab" />
          <circle cx={16} cy={36} r={7.5} fill="#1a1a1a" stroke="#000" />
          <path d="M3 18 h-6 M3 36 h-6" stroke="#9aa3ab" strokeWidth={1} />
        </g>
      );
    case 'POTENTIOMETER': {
      // Knob pointer turns from -135° to 135° across the range
      const angle = -135 + (level / 100) * 270;
      return (
        <g>
          <rect x={6} y={8} width={44} height={44} rx={3} fill="#1f3f7a" stroke="#132a55" />
          <circle cx={28} cy={30} r={15} fill="#e9eef2" stroke="#9aa3ab" />
          <line x1={28} y1={30} x2={28} y2={18} stroke="#1a1a1a" strokeWidth={2.5} strokeLinecap="round" transform={`rotate(${angle} 28 30)`} />
        </g>
      );
    }
    case 'SENSOR_MOTION':
      return (
        <g>
          <circle cx={36} cy={30} r={25} fill={level ? '#fff4d6' : '#f4f4f0'} stroke="#c9c9c0" strokeWidth={1.5} />
          {[-14, -5, 5, 14].map((dx) => (
            <path key={dx} d={`M${36 + dx} 8 Q${36 + dx * 1.3} 30 ${36 + dx} 52`} fill="none" stroke="#d9d9cf" strokeWidth={1} />
          ))}
          <path d="M13 22 Q36 26 59 22 M13 38 Q36 34 59 38" fill="none" stroke="#d9d9cf" strokeWidth={1} />
        </g>
      );
  }
};

/** A sensor breakout module with a digital output pin; the control under it changes what it senses. */
export const SensorNode: React.FC<NodeProps> = memo(({ id, data: nodeData }) => {
  const data = nodeData as unknown as NodeData;
  const type = data.gateType as SensorType;
  const spec = SENSORS[type];
  const level = sensorLevel(data);
  const out = data.outputs?.[0]?.value ?? -1;
  const pir = type === 'SENSOR_MOTION';
  const pot = type === 'POTENTIOMETER';
  const ao = data.outputs?.find((p) => p.name === 'AO');
  // Comparator modules have a fourth pad for the analog output, so their board is taller
  const BODY = ao ? 75 : 60;
  const H = BODY + 30;
  const setLevel = (v: number) => useCircuitStore.getState().setSensorLevel(id, v);
  const pads: [string, number][] = pot
    ? [['VCC', 15], ['W', 30], ['GND', 45]]
    : [['VCC', 15], [pir ? 'OUT' : 'DO', 30], ['GND', 45], ...(ao ? ([['AO', 60]] as [string, number][]) : [])];

  return (
    <div className="lsp-schematic relative" style={{ width: W, height: H }}>
      <PartLabel text={data.label} />
      <PartSvg width={W} height={BODY}>
        <rect x={0} y={0} width={MODULE_W} height={BODY} rx={4} fill={pir ? HW.green : HW.blue} stroke={pir ? HW.greenEdge : HW.blueEdge} strokeWidth={1.5} />
        <Element type={type} level={level} />
        {pot ? null : pir ? (
          <>
            <Trimmer x={69} y={14} />
            <Trimmer x={69} y={46} />
          </>
        ) : (
          <>
            <rect x={44} y={8} width={20} height={12} rx={1} fill={HW.chip} />
            <Trimmer x={54} y={40} />
            <circle cx={72} cy={12} r={2.5} fill={HW.ledRed} />
            <circle cx={72} cy={48} r={2.5} fill={out === 1 ? HW.ledGreen : HW.ledOff} />
            <text x={72} y={24} fontSize={5} textAnchor="middle" fill={HW.silk}>PWR</text>
            <text x={72} y={42} fontSize={5} textAnchor="middle" fill={HW.silk}>DO</text>
          </>
        )}
        {/* Header pads */}
        {pads.map(([name, y]) => (
          <g key={name}>
            <rect x={95} y={(y as number) - 3} width={6} height={6} fill={HW.gold} />
            <text x={92} y={(y as number) + 2} fontSize={5.5} textAnchor="end" fill={HW.silk}>{name}</text>
          </g>
        ))}
        <Lead x1={101} x2={W} y={30} value={out} />
        {ao && <Lead x1={101} x2={W} y={60} value={ao.value} />}
      </PartSvg>

      <div className="absolute left-0 flex items-center gap-1.5" style={{ top: BODY + 6, width: MODULE_W + 14 }}>
        {pir ? (
          <button
            type="button"
            aria-pressed={level === 1}
            onClick={() => setLevel(level === 1 ? 0 : 1)}
            className={`nodrag h-6 w-full rounded-md text-[11px] font-medium border ${
              level === 1 ? 'border-signal-high bg-signal-high/15 text-fg' : 'border-line-strong bg-surface-1 text-fg-muted hover:text-fg'
            }`}
          >
            {level === 1 ? 'Motion' : 'No motion'}
          </button>
        ) : (
          <>
            <input
              type="range"
              min={spec.min}
              max={spec.max}
              step={spec.step}
              value={level}
              aria-label={`${spec.name}: ${formatSensorValue(spec, level)}`}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="nodrag nowheel flex-1 min-w-0 h-4 accent-[var(--accent)] cursor-pointer"
            />
            <span className="text-[11px] font-mono text-fg-muted tabular-nums whitespace-nowrap">{formatSensorValue(spec, level)}</span>
          </>
        )}
      </div>

      <Pin
        type="source"
        position={Position.Right}
        id="out-0"
        value={out}
        label={pot ? `Wiper: ${level}% of 5 V` : `${data.label || spec.name} ${pir ? 'OUT' : 'DO'}`}
        style={{ top: 30 }}
      />
      {ao && (
        <Pin
          type="source"
          position={Position.Right}
          id={ao.id}
          value={ao.value}
          label={`AO: ${((ao.analog ?? 0) * 5).toFixed(2)} V`}
          style={{ top: 60 }}
        />
      )}
    </div>
  );
});

SensorNode.displayName = 'SensorNode';
