import { GateType, NodeData } from '../types/circuit';

/**
 * Sensor modules with a digital output (DO), like the comparator boards sold for Arduino kits:
 * the module compares what it senses with a threshold set by its trimmer and outputs 1 or 0.
 * Students change what the sensor senses with a slider on the part.
 */
export interface SensorSpec {
  name: string;
  /** Module the part imitates, shown as its part number. */
  module: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  level: number;
  threshold: number;
  /** DO is 1 when the level is above (or below) the threshold. */
  rule: 'above' | 'below';
  /** What DO = 1 means, e.g. "bright". */
  meaning: string;
  /** No comparator: the part only has an analog output (a potentiometer's wiper). */
  analogOnly?: boolean;
}

export const SENSORS = {
  SENSOR_LIGHT: {
    name: 'Light sensor', module: 'LDR module', unit: '%', min: 0, max: 100, step: 1, level: 70, threshold: 50,
    rule: 'above', meaning: 'bright',
  },
  SENSOR_TEMPERATURE: {
    name: 'Temperature sensor', module: 'Thermistor module', unit: '°C', min: -10, max: 60, step: 1, level: 22, threshold: 30,
    rule: 'above', meaning: 'hot',
  },
  SENSOR_OBSTACLE: {
    name: 'Obstacle sensor', module: 'IR proximity module', unit: 'cm', min: 2, max: 80, step: 1, level: 40, threshold: 15,
    rule: 'below', meaning: 'something close',
  },
  SENSOR_MOTION: {
    name: 'Motion sensor', module: 'PIR module', unit: '', min: 0, max: 1, step: 1, level: 0, threshold: 0.5,
    rule: 'above', meaning: 'motion',
  },
  POTENTIOMETER: {
    name: 'Potentiometer', module: '10 kΩ', unit: '%', min: 0, max: 100, step: 1, level: 50, threshold: 50,
    rule: 'above', meaning: 'past half way', analogOnly: true,
  },
} satisfies Partial<Record<GateType, SensorSpec>>;

export type SensorType = keyof typeof SENSORS;

export const isSensor = (gateType: string): gateType is SensorType => gateType in SENSORS;

export const sensorLevel = (data: NodeData) => data.sensorLevel ?? SENSORS[data.gateType as SensorType].level;
export const sensorThreshold = (data: NodeData) => data.sensorThreshold ?? SENSORS[data.gateType as SensorType].threshold;

/** The module's digital output for its current level and threshold. */
export function sensorOutput(data: NodeData): 0 | 1 {
  const spec: SensorSpec = SENSORS[data.gateType as SensorType];
  const level = sensorLevel(data);
  const threshold = sensorThreshold(data);
  return (spec.rule === 'above' ? level > threshold : level < threshold) ? 1 : 0;
}

/** The module's analog output (AO) as a fraction of 5 V; undefined for the motion sensor, which has none. */
export function sensorAnalog(data: NodeData): number | undefined {
  const spec: SensorSpec = SENSORS[data.gateType as SensorType];
  if (data.gateType === 'SENSOR_MOTION') return undefined;
  const fraction = (sensorLevel(data) - spec.min) / (spec.max - spec.min);
  // An IR proximity sensor reflects more light, so a higher voltage, when something is closer
  return data.gateType === 'SENSOR_OBSTACLE' ? 1 - fraction : fraction;
}

export const formatSensorValue = (spec: SensorSpec, value: number) => (spec.unit === '%' ? `${value}%` : `${value} ${spec.unit}`);
