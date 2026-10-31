import { Node } from '@xyflow/react';
import { NodeData, GateType, PinData } from '../types/circuit';
import { DEFAULT_ENCODER_CONFIG } from '../types/encoder';
import { createEncoderPins } from '../utils/encoderPins';
import { DEFAULT_SEVEN_SEGMENT_CONFIG } from '../types/sevenSegment';
import { createSevenSegmentPins } from '../utils/sevenSegmentPins';
import { getDefaultICPins, DEFAULT_ROM_CONTENTS } from '../simulation/icLogic';
import { BOARD_PINS, DEFAULT_CLOCK_HZ, boardPinName } from '../simulation/timeline';
import { isSensor, SENSORS } from '../simulation/sensors';
import { createBusPins, DEFAULT_BUS_WIDTH } from '../utils/busPins';
import { IC_GATE_TYPES } from '../simulation/engine';
import { makeId } from '../utils/ids';

// Switches are named A, B, C... and LEDs Y, Y1, Y2..., skipping names already on the canvas
function nextFreeLabel(nodes: Node[], gateType: 'INPUT' | 'OUTPUT'): string {
  const used = new Set(
    nodes
      .map((n) => n.data as unknown as NodeData)
      .filter((d) => (gateType === 'INPUT' ? d?.gateType === 'INPUT' || d?.gateType === 'PUSH_BUTTON' : d?.gateType === gateType))
      .map((d) => d.label)
  );
  const candidates =
    gateType === 'INPUT'
      ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      : ['Y', ...Array.from({ length: 25 }, (_, i) => `Y${i + 1}`)];
  return candidates.find((c) => !used.has(c)) ?? (gateType === 'INPUT' ? 'In' : 'Out');
}

interface PartShape {
  /** React Flow node type (key in nodeTypes). */
  nodeType: string;
  /** Fixed label; undefined keeps the gate type as the label. */
  label?: string;
  /** Input count for parts built from generic pins. */
  inputCount: number;
}

// Pass-through and tunnel are utilities, not chips, even though the engine evaluates the former as an IC
const UTILITY_TYPES = new Set<string>(['DELAY_ELEMENT', 'TUNNEL', 'TEXT_LABEL']);

const SHAPES: Partial<Record<GateType, PartShape>> = {
  INPUT: { nodeType: 'digitalInput', inputCount: 0 },
  OUTPUT: { nodeType: 'digitalOutput', inputCount: 1 },
  PUSH_BUTTON: { nodeType: 'pushButton', inputCount: 0 },
  CLOCK: { nodeType: 'clockSource', label: 'CLK', inputCount: 0 },
  ARDUINO_UNO: { nodeType: 'boardNode', label: 'Uno', inputCount: 0 },
  BUS_JOIN: { nodeType: 'busNode', label: '', inputCount: DEFAULT_BUS_WIDTH },
  BUS_SPLIT: { nodeType: 'busNode', label: '', inputCount: 1 },
  PULL_UP: { nodeType: 'resistorNode', label: '', inputCount: 0 },
  PULL_DOWN: { nodeType: 'resistorNode', label: '', inputCount: 0 },
  SENSOR_LIGHT: { nodeType: 'sensorModule', label: 'Light', inputCount: 0 },
  SENSOR_TEMPERATURE: { nodeType: 'sensorModule', label: 'Temperature', inputCount: 0 },
  SENSOR_OBSTACLE: { nodeType: 'sensorModule', label: 'Obstacle', inputCount: 0 },
  SENSOR_MOTION: { nodeType: 'sensorModule', label: 'Motion', inputCount: 0 },
  POTENTIOMETER: { nodeType: 'sensorModule', label: 'Pot', inputCount: 0 },
  BUZZER: { nodeType: 'buzzerNode', label: '', inputCount: 1 },
  LCD_16X2: { nodeType: 'lcdNode', label: '', inputCount: 6 },
  DIP_SWITCH: { nodeType: 'dipSwitch', label: '', inputCount: 0 },
  CONST_HIGH: { nodeType: 'logicGate', label: 'Constant HIGH', inputCount: 0 },
  CONST_LOW: { nodeType: 'logicGate', label: 'Constant LOW', inputCount: 0 },
  LOGIC_PROBE: { nodeType: 'logicProbe', label: '', inputCount: 1 },
  SEVEN_SEGMENT: { nodeType: 'sevenSegment', label: '', inputCount: 4 },
  HEX_DISPLAY: { nodeType: 'hexDisplay', label: '', inputCount: 4 },
  BUS_MONITOR: { nodeType: 'busMonitor', label: '', inputCount: 4 },
  ENCODER: { nodeType: 'encoderNode', label: 'Encoder', inputCount: 2 },
  BUFFER: { nodeType: 'logicGate', label: 'Buffer', inputCount: 1 },
  TRI_STATE_BUFFER: { nodeType: 'logicGate', label: 'Tri-State Buffer', inputCount: 2 },
  NOT: { nodeType: 'logicGate', inputCount: 1 },
  HALF_ADDER: { nodeType: 'icComponent', label: 'Half Adder', inputCount: 2 },
  FULL_ADDER: { nodeType: 'icComponent', label: 'Full Adder', inputCount: 2 },
  ADDER_4BIT: { nodeType: 'icComponent', label: '4-Bit Adder', inputCount: 2 },
};

function shapeOf(gateType: GateType): PartShape {
  const shape = SHAPES[gateType];
  if (shape) return shape;
  if (UTILITY_TYPES.has(gateType)) return { nodeType: 'utility', inputCount: 2 };
  if (IC_GATE_TYPES.has(gateType)) return { nodeType: 'icComponent', inputCount: 2 };
  // AND, OR, NAND, NOR, XOR, XNOR
  return { nodeType: 'logicGate', inputCount: 2 };
}

const pins = (prefix: 'in' | 'out', count: number, name: (i: number) => string, value: PinData['value'] = 0): PinData[] =>
  Array.from({ length: count }, (_, i) => ({ id: `${prefix}-${i}`, name: name(i), value }));

function defaultPins(gateType: GateType, shape: PartShape): { inputs: PinData[]; outputs: PinData[] } {
  if (shape.nodeType === 'icComponent' || gateType === 'LCD_16X2') return getDefaultICPins(gateType);

  switch (gateType) {
    case 'ENCODER':
      return createEncoderPins(DEFAULT_ENCODER_CONFIG);
    case 'SEVEN_SEGMENT':
      return { inputs: createSevenSegmentPins(DEFAULT_SEVEN_SEGMENT_CONFIG), outputs: [] };
    case 'DIP_SWITCH':
      return { inputs: [], outputs: pins('out', 4, (i) => `SW${i + 1}`) };
    case 'BUS_MONITOR':
      return { inputs: pins('in', 4, (i) => `B${i}`), outputs: [] };
    case 'HEX_DISPLAY':
      return { inputs: pins('in', 4, (i) => `D${i}`), outputs: [] };
    case 'BUS_JOIN':
    case 'BUS_SPLIT':
      return createBusPins(gateType, DEFAULT_BUS_WIDTH);
    case 'ARDUINO_UNO':
      // Each pin has a read side (input) and a drive side (output); outputs float until a program drives them
      return {
        inputs: BOARD_PINS.map((pin, i) => ({ id: `in-${i}`, name: boardPinName(pin), value: -1 as const })),
        outputs: BOARD_PINS.map((pin, i) => ({ id: `out-${i}`, name: boardPinName(pin), value: -1 as const })),
      };
    case 'TRI_STATE_BUFFER':
      return {
        inputs: [
          { id: 'in-0', name: 'In', value: -1 },
          { id: 'in-1', name: 'EN', value: 1 },
        ],
        outputs: [{ id: 'out-0', name: 'Out', value: -1 }],
      };
  }

  if (gateType === 'POTENTIOMETER') return { inputs: [], outputs: [{ id: 'out-0', name: 'W', value: -1 }] };
  if (isSensor(gateType)) {
    const outputs: PinData[] = [{ id: 'out-0', name: 'DO', value: -1 }];
    if (gateType !== 'SENSOR_MOTION') outputs.push({ id: 'out-1', name: 'AO', value: -1 });
    return { inputs: [], outputs };
  }
  if (gateType === 'BUZZER') return { inputs: [{ id: 'in-0', name: '+', value: -1 }], outputs: [] };

  const count = shape.inputCount;
  const inputs = pins('in', count, (i) => (count === 1 ? 'In' : `In ${i + 1}`), -1);
  if (gateType === 'OUTPUT' || gateType === 'LOGIC_PROBE') return { inputs, outputs: [] };
  const outValue =
    gateType === 'INPUT' || gateType === 'CLOCK' || gateType === 'CONST_LOW' || gateType === 'PULL_DOWN'
      ? 0
      : gateType === 'CONST_HIGH' || gateType === 'PULL_UP'
      ? 1
      : -1;
  return { inputs, outputs: [{ id: 'out-0', name: 'Out', value: outValue }] };
}

/** A new part of the given type, with default pins, label and settings, ready to add to the canvas. */
export function createPart(gateType: GateType, position: { x: number; y: number }, existingNodes: Node[]): Node {
  const shape = shapeOf(gateType);
  const { inputs, outputs } = defaultPins(gateType, shape);
  const label =
    gateType === 'INPUT' || gateType === 'PUSH_BUTTON'
      ? nextFreeLabel(existingNodes, 'INPUT')
      : gateType === 'OUTPUT'
      ? nextFreeLabel(existingNodes, 'OUTPUT')
      : shape.label ?? gateType;

  return {
    id: makeId(gateType.toLowerCase()),
    type: shape.nodeType,
    position,
    data: {
      label,
      gateType,
      value: gateType === 'CONST_HIGH' ? 1 : 0,
      inputCount: shape.inputCount,
      inputs,
      outputs,
      ...(gateType === 'HALF_ADDER' ? { customComponentId: 'builtin_half_adder' } : {}),
      ...(gateType === 'FULL_ADDER' ? { customComponentId: 'builtin_full_adder' } : {}),
      ...(gateType === 'DIP_SWITCH' ? { bitWidth: 4, dipValues: [0, 0, 0, 0] } : {}),
      ...(gateType === 'BUS_MONITOR' ? { bitWidth: 4, displayFormat: 'hex' } : {}),
      ...(gateType === 'ENCODER' ? { encoderConfig: DEFAULT_ENCODER_CONFIG } : {}),
      ...(gateType === 'SEVEN_SEGMENT' ? { sevenSegmentConfig: DEFAULT_SEVEN_SEGMENT_CONFIG } : {}),
      ...(gateType === 'CLOCK' ? { clockHz: DEFAULT_CLOCK_HZ } : {}),
      ...(gateType === 'BUS_JOIN' || gateType === 'BUS_SPLIT' ? { bitWidth: DEFAULT_BUS_WIDTH } : {}),
      ...(isSensor(gateType) ? { sensorLevel: SENSORS[gateType].level, sensorThreshold: SENSORS[gateType].threshold } : {}),
      ...(gateType === 'ROM_16X4' ? { romContents: DEFAULT_ROM_CONTENTS } : {}),
    } as unknown as Record<string, unknown>,
  };
}
