import { describe, it, expect } from 'vitest';
import { Node } from '@xyflow/react';
import { createPart } from './partFactory';
import { PARTS } from '../data/components';
import { getDefaultICPins } from '../simulation/icLogic';
import { IC_GATE_TYPES } from '../simulation/engine';
import { NodeData } from '../types/circuit';

const dataOf = (n: Node) => n.data as unknown as NodeData;

describe('createPart', () => {
  it.each(PARTS.map((p) => [p.type] as const))('%s gets pins with React Flow handle ids', (type) => {
    const d = dataOf(createPart(type, { x: 0, y: 0 }, []));
    expect(d.gateType).toBe(type);
    d.inputs.forEach((p, i) => expect(p.id).toBe(`in-${i}`));
    d.outputs.forEach((p, i) => expect(p.id).toBe(`out-${i}`));
  });

  it('builds chips from their default IC pins', () => {
    [...IC_GATE_TYPES]
      .filter((t) => t !== 'DELAY_ELEMENT')
      .forEach((type) => {
        const node = createPart(type as never, { x: 0, y: 0 }, []);
        expect(node.type).toBe('icComponent');
        expect(dataOf(node).inputs.map((p) => p.id)).toEqual(getDefaultICPins(type as never).inputs.map((p) => p.id));
      });
  });

  it('names switches and LEDs with the next free letter', () => {
    const a = createPart('INPUT', { x: 0, y: 0 }, []);
    const b = createPart('PUSH_BUTTON', { x: 0, y: 0 }, [a]);
    const y = createPart('OUTPUT', { x: 0, y: 0 }, [a, b]);
    const y1 = createPart('OUTPUT', { x: 0, y: 0 }, [a, b, y]);
    expect([a, b, y, y1].map((n) => dataOf(n).label)).toEqual(['A', 'B', 'Y', 'Y1']);
  });

  it('gives each part a unique id', () => {
    const ids = new Set(Array.from({ length: 50 }, () => createPart('AND', { x: 0, y: 0 }, []).id));
    expect(ids.size).toBe(50);
  });
});
