import { CustomComponentDefinition } from '../types/customComponent';

export const BUILTIN_HALF_ADDER: CustomComponentDefinition = {
  id: 'builtin_half_adder',
  name: 'Half Adder',
  category: 'Arithmetic',
  description: 'Standard 2-bit Half Adder subcircuit (Sum = A ⊕ B, Cout = A & B)',
  color: '#10b981',
  inputs: [
    { id: 'in-0', name: 'A', direction: 'input', internalNodeId: 'in-a' },
    { id: 'in-1', name: 'B', direction: 'input', internalNodeId: 'in-b' },
  ],
  outputs: [
    { id: 'out-0', name: 'Sum', direction: 'output', internalNodeId: 'out-sum' },
    { id: 'out-1', name: 'Cout', direction: 'output', internalNodeId: 'out-cout' },
  ],
  nodes: [
    {
      id: 'in-a',
      type: 'digitalInput',
      position: { x: 80, y: 100 },
      data: { label: 'Input A', gateType: 'INPUT', value: 0, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 0 }] },
    },
    {
      id: 'in-b',
      type: 'digitalInput',
      position: { x: 80, y: 240 },
      data: { label: 'Input B', gateType: 'INPUT', value: 0, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 0 }] },
    },
    {
      id: 'xor-1',
      type: 'logicGate',
      position: { x: 300, y: 90 },
      data: { label: 'XOR Gate', gateType: 'XOR', inputCount: 2, inputs: [{ id: 'in-0', name: 'In 1', value: 0 }, { id: 'in-1', name: 'In 2', value: 0 }], outputs: [{ id: 'out-0', name: 'Out', value: 0 }] },
    },
    {
      id: 'and-1',
      type: 'logicGate',
      position: { x: 300, y: 230 },
      data: { label: 'AND Gate', gateType: 'AND', inputCount: 2, inputs: [{ id: 'in-0', name: 'In 1', value: 0 }, { id: 'in-1', name: 'In 2', value: 0 }], outputs: [{ id: 'out-0', name: 'Out', value: 0 }] },
    },
    {
      id: 'out-sum',
      type: 'digitalOutput',
      position: { x: 520, y: 100 },
      data: { label: 'Sum', gateType: 'OUTPUT', value: 0, inputs: [{ id: 'in-0', name: 'In', value: 0 }], outputs: [] },
    },
    {
      id: 'out-cout',
      type: 'digitalOutput',
      position: { x: 520, y: 240 },
      data: { label: 'Cout', gateType: 'OUTPUT', value: 0, inputs: [{ id: 'in-0', name: 'In', value: 0 }], outputs: [] },
    },
  ],
  edges: [
    { id: 'e1', source: 'in-a', sourceHandle: 'out-0', target: 'xor-1', targetHandle: 'in-0', type: 'signalEdge' },
    { id: 'e2', source: 'in-b', sourceHandle: 'out-0', target: 'xor-1', targetHandle: 'in-1', type: 'signalEdge' },
    { id: 'e3', source: 'in-a', sourceHandle: 'out-0', target: 'and-1', targetHandle: 'in-0', type: 'signalEdge' },
    { id: 'e4', source: 'in-b', sourceHandle: 'out-0', target: 'and-1', targetHandle: 'in-1', type: 'signalEdge' },
    { id: 'e5', source: 'xor-1', sourceHandle: 'out-0', target: 'out-sum', targetHandle: 'in-0', type: 'signalEdge' },
    { id: 'e6', source: 'and-1', sourceHandle: 'out-0', target: 'out-cout', targetHandle: 'in-0', type: 'signalEdge' },
  ],
  createdAt: 0,
  updatedAt: 0,
};

export const BUILTIN_FULL_ADDER: CustomComponentDefinition = {
  id: 'builtin_full_adder',
  name: 'Full Adder',
  category: 'Arithmetic',
  description: 'Standard 3-bit Full Adder built with 2 Half Adders and 1 OR gate',
  color: '#10b981',
  inputs: [
    { id: 'in-0', name: 'A', direction: 'input', internalNodeId: 'in-a' },
    { id: 'in-1', name: 'B', direction: 'input', internalNodeId: 'in-b' },
    { id: 'in-2', name: 'Cin', direction: 'input', internalNodeId: 'in-cin' },
  ],
  outputs: [
    { id: 'out-0', name: 'Sum', direction: 'output', internalNodeId: 'out-sum' },
    { id: 'out-1', name: 'Cout', direction: 'output', internalNodeId: 'out-cout' },
  ],
  nodes: [
    {
      id: 'in-a',
      type: 'digitalInput',
      position: { x: 60, y: 80 },
      data: { label: 'Input A', gateType: 'INPUT', value: 0, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 0 }] },
    },
    {
      id: 'in-b',
      type: 'digitalInput',
      position: { x: 60, y: 180 },
      data: { label: 'Input B', gateType: 'INPUT', value: 0, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 0 }] },
    },
    {
      id: 'in-cin',
      type: 'digitalInput',
      position: { x: 60, y: 320 },
      data: { label: 'Carry In (Cin)', gateType: 'INPUT', value: 0, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 0 }] },
    },
    {
      id: 'ha-1',
      type: 'icComponent',
      position: { x: 260, y: 100 },
      data: {
        label: 'HA1 (Half Adder 1)',
        gateType: 'HALF_ADDER',
        customComponentId: 'builtin_half_adder',
        inputs: [{ id: 'in-0', name: 'A', value: 0 }, { id: 'in-1', name: 'B', value: 0 }],
        outputs: [{ id: 'out-0', name: 'Sum', value: 0 }, { id: 'out-1', name: 'Cout', value: 0 }],
      },
    },
    {
      id: 'ha-2',
      type: 'icComponent',
      position: { x: 480, y: 180 },
      data: {
        label: 'HA2 (Half Adder 2)',
        gateType: 'HALF_ADDER',
        customComponentId: 'builtin_half_adder',
        inputs: [{ id: 'in-0', name: 'A', value: 0 }, { id: 'in-1', name: 'B', value: 0 }],
        outputs: [{ id: 'out-0', name: 'Sum', value: 0 }, { id: 'out-1', name: 'Cout', value: 0 }],
      },
    },
    {
      id: 'or-1',
      type: 'logicGate',
      position: { x: 680, y: 300 },
      data: {
        label: 'OR Gate',
        gateType: 'OR',
        inputCount: 2,
        inputs: [{ id: 'in-0', name: 'In 1', value: 0 }, { id: 'in-1', name: 'In 2', value: 0 }],
        outputs: [{ id: 'out-0', name: 'Out', value: 0 }],
      },
    },
    {
      id: 'out-sum',
      type: 'digitalOutput',
      position: { x: 720, y: 190 },
      data: { label: 'Sum', gateType: 'OUTPUT', value: 0, inputs: [{ id: 'in-0', name: 'In', value: 0 }], outputs: [] },
    },
    {
      id: 'out-cout',
      type: 'digitalOutput',
      position: { x: 880, y: 310 },
      data: { label: 'Cout', gateType: 'OUTPUT', value: 0, inputs: [{ id: 'in-0', name: 'In', value: 0 }], outputs: [] },
    },
  ],
  edges: [
    { id: 'e1', source: 'in-a', sourceHandle: 'out-0', target: 'ha-1', targetHandle: 'in-0', type: 'signalEdge' },
    { id: 'e2', source: 'in-b', sourceHandle: 'out-0', target: 'ha-1', targetHandle: 'in-1', type: 'signalEdge' },
    { id: 'e3', source: 'ha-1', sourceHandle: 'out-0', target: 'ha-2', targetHandle: 'in-0', type: 'signalEdge' },
    { id: 'e4', source: 'in-cin', sourceHandle: 'out-0', target: 'ha-2', targetHandle: 'in-1', type: 'signalEdge' },
    { id: 'e5', source: 'ha-2', sourceHandle: 'out-0', target: 'out-sum', targetHandle: 'in-0', type: 'signalEdge' },
    { id: 'e6', source: 'ha-1', sourceHandle: 'out-1', target: 'or-1', targetHandle: 'in-0', type: 'signalEdge' },
    { id: 'e7', source: 'ha-2', sourceHandle: 'out-1', target: 'or-1', targetHandle: 'in-1', type: 'signalEdge' },
    { id: 'e8', source: 'or-1', sourceHandle: 'out-0', target: 'out-cout', targetHandle: 'in-0', type: 'signalEdge' },
  ],
  createdAt: 0,
  updatedAt: 0,
};
