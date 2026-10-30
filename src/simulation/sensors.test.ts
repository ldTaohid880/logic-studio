import { describe, it, expect } from 'vitest';
import { Node } from '@xyflow/react';
import { createPart } from '../store/partFactory';
import { NodeData, GateType } from '../types/circuit';
import { propagateSignals } from './engine';
import { SENSORS, sensorOutput } from './sensors';

const sensor = (type: GateType, sensorLevel: number, sensorThreshold?: number) => {
  const node = createPart(type, { x: 0, y: 0 }, []);
  return { ...node, data: { ...node.data, sensorLevel, ...(sensorThreshold === undefined ? {} : { sensorThreshold }) } } as Node;
};
const out = (node: Node) => sensorOutput(node.data as unknown as NodeData);

describe('sensor modules', () => {
  it('compare their reading with the threshold the way the module does', () => {
    expect(out(sensor('SENSOR_LIGHT', 80, 50))).toBe(1); // bright
    expect(out(sensor('SENSOR_LIGHT', 50, 50))).toBe(0);
    expect(out(sensor('SENSOR_TEMPERATURE', 31, 30))).toBe(1); // hot
    expect(out(sensor('SENSOR_TEMPERATURE', 12, 30))).toBe(0);
    expect(out(sensor('SENSOR_OBSTACLE', 10, 15))).toBe(1); // something close
    expect(out(sensor('SENSOR_OBSTACLE', 40, 15))).toBe(0);
    expect(out(sensor('SENSOR_MOTION', 1))).toBe(1);
    expect(out(sensor('SENSOR_MOTION', 0))).toBe(0);
  });

  it('start with defaults inside their range', () => {
    Object.values(SENSORS).forEach((spec) => {
      expect(spec.level).toBeGreaterThanOrEqual(spec.min);
      expect(spec.threshold).toBeLessThanOrEqual(spec.max);
    });
  });

  it('drive their DO pin through the engine', () => {
    const light = sensor('SENSOR_LIGHT', 90);
    const led = createPart('OUTPUT', { x: 200, y: 0 }, []);
    const { nodes } = propagateSignals([light, led], [{ id: 'w', source: light.id, target: led.id, sourceHandle: 'out-0', targetHandle: 'in-0' }], {});
    expect((nodes[1].data as unknown as NodeData).inputs[0].value).toBe(1);
  });
});
