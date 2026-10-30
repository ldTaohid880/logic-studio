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
