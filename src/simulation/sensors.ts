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

export const formatSensorValue = (spec: SensorSpec, value: number) => (spec.unit === '%' ? `${value}%` : `${value} ${spec.unit}`);
