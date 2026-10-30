import { describe, it, expect } from 'vitest';
import { Node } from '@xyflow/react';
import { parseCircuitFile } from './circuitFile';
import { CustomComponentDefinition } from '../types/customComponent';
import { NodeData } from '../types/circuit';

const def = (id: string, updatedAt: number, children: string[] = []): CustomComponentDefinition => ({
  id,
  name: id,
  category: 'Custom',
  inputs: [],
  outputs: [],
  nodes: children.map((child, i) => ({ id: `${id}-c${i}`, position: { x: 0, y: 0 }, data: { gateType: 'CUSTOM', customComponentId: child } })),
  edges: [],
  createdAt: 0,
  updatedAt,
});

const instance = (id: string, componentId: string): Node => ({
  id,
  position: { x: 0, y: 0 },
  data: { gateType: 'CUSTOM', customComponentId: componentId, inputs: [], outputs: [], subcircuitNodeStates: { nodes: [] } },
});

const componentIdOf = (n: Node) => (n.data as unknown as NodeData).customComponentId;

describe('parseCircuitFile', () => {
  it('rejects a file without parts and wires', () => {
    expect(parseCircuitFile({ hello: 1 }, {}).ok).toBe(false);
    expect(parseCircuitFile(null, {}).ok).toBe(false);
  });

  it('drops malformed parts and wires to missing parts', () => {
    const res = parseCircuitFile(
      {
        nodes: [{ id: 'a', position: { x: 0, y: 0 }, data: { gateType: 'AND' } }, { id: 'broken' }],
        edges: [
          { id: 'e1', source: 'a', target: 'a' },
          { id: 'e2', source: 'a', target: 'broken' },
        ],
      },
      {}
    );
    expect(res.ok && res.nodes.map((n) => n.id)).toEqual(['a']);
    expect(res.ok && res.edges.map((e) => e.id)).toEqual(['e1']);
  });

  it('adds new components and skips ones already in the library', () => {
    const res = parseCircuitFile(
      { nodes: [], edges: [], customComponents: { same: def('same', 5), fresh: def('fresh', 1) } },
      { same: def('same', 5) }
    );
    expect(res.ok && Object.keys(res.components)).toEqual(['fresh']);
    expect(res.ok && res.renamed).toBe(0);
  });

  it('adds a clashing component as a copy and points instances at it', () => {
    const res = parseCircuitFile(
      {
        nodes: [instance('i1', 'adder')],
        edges: [],
        customComponents: { adder: def('adder', 2), wrapper: def('wrapper', 1, ['adder']) },
      },
      { adder: def('adder', 1) }
    );
    if (!res.ok) throw new Error(res.error);
    expect(res.renamed).toBe(1);
    const copy = Object.values(res.components).find((c) => c.name === 'adder (from file)')!;
    expect(copy.id).not.toBe('adder');
    expect(componentIdOf(res.nodes[0])).toBe(copy.id);
    expect((res.nodes[0].data as unknown as NodeData).subcircuitNodeStates).toBeUndefined();
    expect(componentIdOf(res.components.wrapper.nodes[0])).toBe(copy.id);
  });

  it('rejects components that contain themselves', () => {
    const res = parseCircuitFile(
      { nodes: [], edges: [], customComponents: { a: def('a', 1, ['b']), b: def('b', 1, ['a']) } },
      {}
    );
    expect(res.ok).toBe(false);
  });
});
