import { describe, it, expect } from 'vitest';
import { Node, Edge } from '@xyflow/react';
import { propagateSignals } from './engine';
import { evaluateIC, getDefaultICPins } from './icLogic';
import { evaluateGate } from '../utils/gateLogic';
import { NodeData, GateType, PinData, SignalValue } from '../types/circuit';
import { CustomComponentDefinition } from '../types/customComponent';

function makeNode(id: string, gateType: GateType, extra: Partial<NodeData> = {}, inputs?: PinData[], outputs?: PinData[]): Node {
  const ic = getDefaultICPins(gateType);
  const defaultIn = gateType === 'INPUT' ? [] : gateType === 'NOT' || gateType === 'OUTPUT' ? [{ id: 'in-0', name: 'A', value: -1 as SignalValue }] : [
    { id: 'in-0', name: 'A', value: -1 as SignalValue },
    { id: 'in-1', name: 'B', value: -1 as SignalValue },
  ];
  const defaultOut = gateType === 'OUTPUT' ? [] : [{ id: 'out-0', name: 'Y', value: -1 as SignalValue }];
  return {
    id,
    position: { x: 0, y: 0 },
    data: {
      label: id,
      gateType,
      inputs: inputs ?? (ic.inputs.length ? ic.inputs : defaultIn),
      outputs: outputs ?? (ic.outputs.length ? ic.outputs : defaultOut),
      ...extra,
    } as unknown as Record<string, unknown>,
  };
}

function wire(source: string, target: string, sourceHandle = 'out-0', targetHandle = 'in-0'): Edge {
  return { id: `${source}-${sourceHandle}-${target}-${targetHandle}`, source, target, sourceHandle, targetHandle };
}

const d = (nodes: Node[], id: string) => nodes.find((n) => n.id === id)!.data as unknown as NodeData;

describe('propagateSignals', () => {
  it('evaluates a simple AND gate', () => {
    const nodes = [makeNode('a', 'INPUT', { value: 1 }), makeNode('b', 'INPUT', { value: 1 }), makeNode('g', 'AND')];
    const edges = [wire('a', 'g'), wire('b', 'g', 'out-0', 'in-1')];
    const res = propagateSignals(nodes, edges);
    expect(d(res.nodes, 'g').outputs[0].value).toBe(1);
  });

  it('floats an input pin after its wire is removed', () => {
    const nodes = [makeNode('a', 'INPUT', { value: 1 }), makeNode('g', 'NOT')];
    const first = propagateSignals(nodes, [wire('a', 'g')]);
    expect(d(first.nodes, 'g').outputs[0].value).toBe(0);
    const second = propagateSignals(first.nodes, []);
    expect(d(second.nodes, 'g').inputs[0].value).toBe(-1);
    expect(d(second.nodes, 'g').outputs[0].value).toBe(-1);
  });

  it('carries a signal through a tunnel pair and converges', () => {
    const nodes = [
      makeNode('a', 'INPUT', { value: 1 }),
      makeNode('t1', 'TUNNEL', { tunnelLabel: 'x' }),
      makeNode('t2', 'TUNNEL', { tunnelLabel: 'X' }),
      makeNode('g', 'NOT'),
    ];
    const edges = [wire('a', 't1'), wire('t2', 'g')];
    const res = propagateSignals(nodes, edges);
    expect(d(res.nodes, 't2').outputs[0].value).toBe(1);
    expect(d(res.nodes, 'g').outputs[0].value).toBe(0);
    expect(res.edges.find((e) => e.source === 't2')!.data!.signalValue).toBe(1);
    // A second pass on a settled circuit reports no change
    expect(propagateSignals(res.nodes, edges).hasChanged).toBe(false);
  });

  it('does not overflow the stack on a self-referencing custom component', () => {
    const def: CustomComponentDefinition = {
      id: 'loop',
      name: 'Loop',
      category: 'Custom',
      inputs: [],
      outputs: [{ id: 'out-0', name: 'Y', direction: 'output' }],
      nodes: [makeNode('inner', 'CUSTOM', { customComponentId: 'loop' }, [], [{ id: 'out-0', name: 'Y', value: -1 }])],
      edges: [],
      createdAt: 0,
      updatedAt: 0,
    };
    const nodes = [makeNode('c', 'CUSTOM', { customComponentId: 'loop' }, [], [{ id: 'out-0', name: 'Y', value: -1 }])];
    expect(() => propagateSignals(nodes, [], { loop: def })).not.toThrow();
  });

  it('picks up edits to a custom component definition in existing instances', () => {
    const inPin: PinData = { id: 'in-0', name: 'A', value: -1 };
    const def: CustomComponentDefinition = {
      id: 'inv',
      name: 'Inv',
      category: 'Custom',
      inputs: [{ id: 'in-0', name: 'A', direction: 'input', internalNodeId: 'i' }],
      outputs: [{ id: 'out-0', name: 'Y', direction: 'output', internalNodeId: 'o' }],
      nodes: [makeNode('i', 'INPUT', { value: 0 }), makeNode('n', 'BUFFER', {}, [{ id: 'in-0', name: 'A', value: -1 }]), makeNode('o', 'OUTPUT')],
      edges: [wire('i', 'n'), wire('n', 'o')],
      createdAt: 0,
      updatedAt: 1,
    };
    const nodes = [makeNode('src', 'INPUT', { value: 1 }), makeNode('c', 'CUSTOM', { customComponentId: 'inv' }, [inPin], [{ id: 'out-0', name: 'Y', value: -1 }])];
    const edges = [wire('src', 'c')];
    const first = propagateSignals(nodes, edges, { inv: def });
    expect(d(first.nodes, 'c').outputs[0].value).toBe(1);

    const edited: CustomComponentDefinition = {
      ...def,
      nodes: [def.nodes[0], makeNode('n', 'NOT'), def.nodes[2]],
      updatedAt: 2,
    };
    const second = propagateSignals(first.nodes, edges, { inv: edited });
    expect(d(second.nodes, 'c').outputs[0].value).toBe(0);
  });
});

describe('floating control pins use their documented default', () => {
  it('register loads when EN is floating', () => {
    const inputs: SignalValue[] = [1, 0, 1, 0, 0, -1, -1];
    const s1 = evaluateIC('REGISTER_4BIT', inputs, {});
    const s2 = evaluateIC('REGISTER_4BIT', [1, 0, 1, 0, 1, -1, -1], s1.newState);
    expect(s2.outputs['out-0']).toBe(1);
    expect(s2.outputs['out-2']).toBe(1);
  });

  it('tri-state buffer passes data when EN is floating', () => {
    expect(evaluateGate('TRI_STATE_BUFFER', [1, -1])).toBe(1);
    expect(evaluateGate('TRI_STATE_BUFFER', [1, 0])).toBe(-1);
  });
});

describe('circuits that never settle', () => {
  it('reports the parts of an inverter ring as unstable', () => {
    // A ring that starts fully floating stays unknown; one known level makes it oscillate
    const nodes = [
      makeNode('n1', 'NOT', {}, undefined, [{ id: 'out-0', name: 'Y', value: 0 }]),
      makeNode('n2', 'NOT'),
      makeNode('n3', 'NOT'),
    ];
    const edges = [wire('n1', 'n2'), wire('n2', 'n3'), wire('n3', 'n1')];
    const res = propagateSignals(nodes, edges);
    expect(res.unstableNodeIds.length).toBeGreaterThan(0);
    expect(res.unstableNodeIds.every((id) => ['n1', 'n2', 'n3'].includes(id))).toBe(true);
  });

  it('does not flag a latch holding its state', () => {
    // NOR SR latch with S = R = 0 after being set
    const nodes = [
      makeNode('s', 'INPUT', { value: 1 }, [], [{ id: 'out-0', name: 'Y', value: 1 }]),
      makeNode('r', 'INPUT', { value: 0 }, [], [{ id: 'out-0', name: 'Y', value: 0 }]),
      makeNode('q', 'NOR'),
      makeNode('qn', 'NOR'),
    ];
    const edges = [wire('r', 'q'), wire('qn', 'q', 'out-0', 'in-1'), wire('s', 'qn'), wire('q', 'qn', 'out-0', 'in-1')];
    const set = propagateSignals(nodes, edges);
    expect(set.unstableNodeIds).toEqual([]);
    expect(d(set.nodes, 'q').outputs[0].value).toBe(1);

    const released = set.nodes.map((n) => (n.id === 's' ? { ...n, data: { ...n.data, value: 0 } } : n));
    const hold = propagateSignals(released, edges);
    expect(hold.unstableNodeIds).toEqual([]);
    expect(d(hold.nodes, 'q').outputs[0].value).toBe(1);
  });

  it('settles a chain longer than the old 12-pass limit', () => {
    const count = 30;
    const nodes = [makeNode('src', 'INPUT', { value: 1 }, [], [{ id: 'out-0', name: 'Y', value: 1 }])];
    const edges: Edge[] = [];
    for (let i = 0; i < count; i++) {
      nodes.push(makeNode(`b${i}`, 'NOT'));
      edges.push(wire(i === 0 ? 'src' : `b${i - 1}`, `b${i}`));
    }
    const res = propagateSignals(nodes, edges);
    expect(res.unstableNodeIds).toEqual([]);
    expect(d(res.nodes, `b${count - 1}`).outputs[0].value).toBe(count % 2 === 0 ? 1 : 0);
  });
});

describe('shared bus wires', () => {
  // Two tri-state buffers (data, enable) drive one LED
  const bus = (a: SignalValue, enA: SignalValue, b: SignalValue, enB: SignalValue) => {
    const nodes = [
      makeNode('da', 'INPUT', { value: a }), makeNode('ea', 'INPUT', { value: enA }),
      makeNode('db', 'INPUT', { value: b }), makeNode('eb', 'INPUT', { value: enB }),
      makeNode('ta', 'TRI_STATE_BUFFER'), makeNode('tb', 'TRI_STATE_BUFFER'),
      makeNode('led', 'OUTPUT'),
    ];
    const edges = [
      wire('da', 'ta'), wire('ea', 'ta', 'out-0', 'in-1'),
      wire('db', 'tb'), wire('eb', 'tb', 'out-0', 'in-1'),
      wire('ta', 'led'), wire('tb', 'led'),
    ];
    const res = propagateSignals(nodes, edges);
    return { level: d(res.nodes, 'led').inputs[0].value, conflicts: res.conflictNodeIds, edges: res.edges };
  };

  it('takes the level of the one enabled driver', () => {
    expect(bus(1, 1, 0, 0)).toMatchObject({ level: 1, conflicts: [] });
    expect(bus(1, 0, 0, 1)).toMatchObject({ level: 0, conflicts: [] });
  });

  it('floats when no driver is enabled', () => {
    expect(bus(1, 0, 1, 0)).toMatchObject({ level: -1, conflicts: [] });
  });

  it('accepts drivers that agree and flags drivers that disagree', () => {
    expect(bus(1, 1, 1, 1)).toMatchObject({ level: 1, conflicts: [] });
    const fight = bus(1, 1, 0, 1);
    expect(fight).toMatchObject({ level: -1, conflicts: ['led'] });
    expect(fight.edges.filter((e) => e.data?.conflict).map((e) => e.source).sort()).toEqual(['ta', 'tb']);
  });

  it('lets tunnels share a tag with floating drivers', () => {
    const tunnel = (id: string) => makeNode(id, 'TUNNEL', { tunnelLabel: 'bus' }, [{ id: 'in-0', name: 'In', value: -1 }], [{ id: 'out-0', name: 'Out', value: -1 }]);
    const nodes = [
      makeNode('on', 'INPUT', { value: 1 }), makeNode('off', 'INPUT', { value: 0 }), makeNode('d', 'INPUT', { value: 0 }),
      makeNode('ta', 'TRI_STATE_BUFFER'), makeNode('tb', 'TRI_STATE_BUFFER'),
      tunnel('t1'), tunnel('t2'), tunnel('t3'), makeNode('led', 'OUTPUT'),
    ];
    const edges = [
      wire('on', 'ta'), wire('on', 'ta', 'out-0', 'in-1'), // drives 1
      wire('d', 'tb'), wire('off', 'tb', 'out-0', 'in-1'), // disabled: floats
      wire('ta', 't1'), wire('tb', 't2'), wire('t3', 'led'),
    ];
    const res = propagateSignals(nodes, edges);
    expect(d(res.nodes, 'led').inputs[0].value).toBe(1);
    expect(res.conflictNodeIds).toEqual([]);
  });
});

describe('pull resistors and open-drain outputs', () => {
  const tri = (data: SignalValue, en: SignalValue, pull: 'PULL_UP' | 'PULL_DOWN') => {
    const nodes = [
      makeNode('d', 'INPUT', { value: data }), makeNode('en', 'INPUT', { value: en }),
      makeNode('t', 'TRI_STATE_BUFFER'), makeNode('r', pull, {}, [], [{ id: 'out-0', name: 'Out', value: pull === 'PULL_UP' ? 1 : 0 }]),
      makeNode('led', 'OUTPUT'),
    ];
    const edges = [wire('d', 't'), wire('en', 't', 'out-0', 'in-1'), wire('t', 'led'), wire('r', 'led')];
    const res = propagateSignals(nodes, edges);
    return { level: d(res.nodes, 'led').inputs[0].value, conflicts: res.conflictNodeIds };
  };

  it('gives an undriven wire the resistor level, and lets a real output win', () => {
    expect(tri(0, 0, 'PULL_UP')).toEqual({ level: 1, conflicts: [] });
    expect(tri(0, 1, 'PULL_UP')).toEqual({ level: 0, conflicts: [] });
    expect(tri(1, 0, 'PULL_DOWN')).toEqual({ level: 0, conflicts: [] });
    expect(tri(1, 1, 'PULL_DOWN')).toEqual({ level: 1, conflicts: [] });
  });

  it('makes a wired AND from open-drain outputs and a pull-up', () => {
    const wiredAnd = (a: SignalValue, b: SignalValue) => {
      const nodes = [
        makeNode('a', 'INPUT', { value: a }), makeNode('b', 'INPUT', { value: b }),
        makeNode('oa', 'OPEN_DRAIN_BUFFER'), makeNode('ob', 'OPEN_DRAIN_BUFFER'),
        makeNode('r', 'PULL_UP', {}, [], [{ id: 'out-0', name: 'Out', value: 1 }]), makeNode('led', 'OUTPUT'),
      ];
      const edges = [wire('a', 'oa'), wire('b', 'ob'), wire('oa', 'led'), wire('ob', 'led'), wire('r', 'led')];
      const res = propagateSignals(nodes, edges);
      expect(res.conflictNodeIds).toEqual([]);
      return d(res.nodes, 'led').inputs[0].value;
    };
    expect([wiredAnd(0, 0), wiredAnd(0, 1), wiredAnd(1, 0), wiredAnd(1, 1)]).toEqual([0, 0, 0, 1]);
  });

  it('leaves a wire unknown when a pull-up and a pull-down fight, without calling it a conflict', () => {
    const nodes = [
      makeNode('u', 'PULL_UP', {}, [], [{ id: 'out-0', name: 'Out', value: 1 }]),
      makeNode('dn', 'PULL_DOWN', {}, [], [{ id: 'out-0', name: 'Out', value: 0 }]),
      makeNode('led', 'OUTPUT'),
    ];
    const res = propagateSignals(nodes, [wire('u', 'led'), wire('dn', 'led')]);
    expect(d(res.nodes, 'led').inputs[0].value).toBe(-1);
    expect(res.conflictNodeIds).toEqual([]);
  });
});

describe('multi-bit buses', () => {
  it('carries every bit from a joiner through a bus wire to a splitter', async () => {
    const { createBusPins, busHex } = await import('../utils/busPins');
    const join = createBusPins('BUS_JOIN', 4);
    const split = createBusPins('BUS_SPLIT', 4);
    const bits: SignalValue[] = [1, 0, 1, 1]; // 0b1101 = D
    const nodes = [
      ...bits.map((v, i) => makeNode(`s${i}`, 'INPUT', { value: v })),
      makeNode('j', 'BUS_JOIN', {}, join.inputs, join.outputs),
      makeNode('sp', 'BUS_SPLIT', {}, split.inputs, split.outputs),
      ...bits.map((_, i) => makeNode(`l${i}`, 'OUTPUT')),
    ];
    const edges = [
      ...bits.map((_, i) => wire(`s${i}`, 'j', 'out-0', `in-${i}`)),
      wire('j', 'sp'),
      ...bits.map((_, i) => wire('sp', `l${i}`, `out-${i}`)),
    ];
    const res = propagateSignals(nodes, edges);
    expect(bits.map((_, i) => d(res.nodes, `l${i}`).inputs[0].value)).toEqual(bits);
    const busWire = res.edges.find((e) => e.source === 'j')!;
    expect(busWire.data?.bus).toEqual(bits);
    expect(busHex(busWire.data?.bus as SignalValue[])).toBe('D');

    // Unwiring one bit floats it on the bus, and the badge shows an unknown value
    const res2 = propagateSignals(res.nodes, edges.filter((e) => e.source !== 's2'));
    expect(res2.edges.find((e) => e.source === 'j')!.data?.bus).toEqual([1, 0, -1, 1]);
    expect(busHex([1, 0, -1, 1])).toBeNull();
  });
});
