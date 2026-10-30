import { CircuitPreset } from '../../types/circuit';

// Gate demonstrations
export const GATE_EXAMPLES: CircuitPreset[] = [
  {
    id: 'xor-demo',
    name: 'XOR Demonstration',
    category: 'Gates',
    description: 'Demonstrates Exclusive OR (XOR) logic: Output is HIGH (1) when inputs differ.',
    nodes: [
      {
        id: 'in-a',
        type: 'digitalInput',
        position: { x: 100, y: 120 },
        data: { label: 'Input A', gateType: 'INPUT', value: 1, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 1 }] },
      },
      {
        id: 'in-b',
        type: 'digitalInput',
        position: { x: 100, y: 240 },
        data: { label: 'Input B', gateType: 'INPUT', value: 0, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 0 }] },
      },
      {
        id: 'xor-1',
        type: 'logicGate',
        position: { x: 320, y: 160 },
        data: {
          label: 'XOR',
          gateType: 'XOR',
          inputCount: 2,
          inputs: [{ id: 'in-0', name: 'In 1', value: 1 }, { id: 'in-1', name: 'In 2', value: 0 }],
          outputs: [{ id: 'out-0', name: 'Out', value: 1 }],
        },
      },
      {
        id: 'out-y',
        type: 'digitalOutput',
        position: { x: 540, y: 175 },
        data: { label: 'Output (A ⊕ B)', gateType: 'OUTPUT', value: 1, inputs: [{ id: 'in-0', name: 'In', value: 1 }], outputs: [] },
      },
    ],
    edges: [
      { id: 'e1', source: 'in-a', sourceHandle: 'out-0', target: 'xor-1', targetHandle: 'in-0', type: 'signalEdge' },
      { id: 'e2', source: 'in-b', sourceHandle: 'out-0', target: 'xor-1', targetHandle: 'in-1', type: 'signalEdge' },
      { id: 'e3', source: 'xor-1', sourceHandle: 'out-0', target: 'out-y', targetHandle: 'in-0', type: 'signalEdge' },
    ],
  },
  {
    id: 'xnor-demo',
    name: 'XNOR Demonstration',
    category: 'Gates',
    description: 'Demonstrates Inverted XOR (XNOR) logic: Output is HIGH (1) when inputs are identical.',
    nodes: [
      {
        id: 'in-a',
        type: 'digitalInput',
        position: { x: 100, y: 120 },
        data: { label: 'Input A', gateType: 'INPUT', value: 1, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 1 }] },
      },
      {
        id: 'in-b',
        type: 'digitalInput',
        position: { x: 100, y: 240 },
        data: { label: 'Input B', gateType: 'INPUT', value: 1, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 1 }] },
      },
      {
        id: 'xnor-1',
        type: 'logicGate',
        position: { x: 320, y: 160 },
        data: {
          label: 'XNOR',
          gateType: 'XNOR',
          inputCount: 2,
          inputs: [{ id: 'in-0', name: 'In 1', value: 1 }, { id: 'in-1', name: 'In 2', value: 1 }],
          outputs: [{ id: 'out-0', name: 'Out', value: 1 }],
        },
      },
      {
        id: 'out-y',
        type: 'digitalOutput',
        position: { x: 540, y: 175 },
        data: { label: 'Output (Equivalence)', gateType: 'OUTPUT', value: 1, inputs: [{ id: 'in-0', name: 'In', value: 1 }], outputs: [] },
      },
    ],
    edges: [
      { id: 'e1', source: 'in-a', sourceHandle: 'out-0', target: 'xnor-1', targetHandle: 'in-0', type: 'signalEdge' },
      { id: 'e2', source: 'in-b', sourceHandle: 'out-0', target: 'xnor-1', targetHandle: 'in-1', type: 'signalEdge' },
      { id: 'e3', source: 'xnor-1', sourceHandle: 'out-0', target: 'out-y', targetHandle: 'in-0', type: 'signalEdge' },
    ],
  },
  {
    id: 'nand-universal',
    name: 'NAND as Universal Gate',
    category: 'Gates',
    description: 'Demonstrates building NOT, AND, and OR logic using only universal NAND gates.',
    nodes: [
      {
        id: 'in-a',
        type: 'digitalInput',
        position: { x: 80, y: 120 },
        data: { label: 'Input A', gateType: 'INPUT', value: 1, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 1 }] },
      },
      {
        id: 'in-b',
        type: 'digitalInput',
        position: { x: 80, y: 280 },
        data: { label: 'Input B', gateType: 'INPUT', value: 0, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 0 }] },
      },
      // NAND Inverter
      {
        id: 'nand-not',
        type: 'logicGate',
        position: { x: 280, y: 100 },
        data: {
          label: 'NAND (NOT)',
          gateType: 'NAND',
          inputCount: 2,
          inputs: [{ id: 'in-0', name: 'In 1', value: 1 }, { id: 'in-1', name: 'In 2', value: 1 }],
          outputs: [{ id: 'out-0', name: 'Out', value: 0 }],
        },
      },
      {
        id: 'out-not',
        type: 'digitalOutput',
        position: { x: 500, y: 110 },
        data: { label: 'NOT A', gateType: 'OUTPUT', value: 0, inputs: [{ id: 'in-0', name: 'In', value: 0 }], outputs: [] },
      },
      // NAND AND gate
      {
        id: 'nand-and-1',
        type: 'logicGate',
        position: { x: 280, y: 240 },
        data: {
          label: 'NAND Stage 1',
          gateType: 'NAND',
          inputCount: 2,
          inputs: [{ id: 'in-0', name: 'In 1', value: 1 }, { id: 'in-1', name: 'In 2', value: 0 }],
          outputs: [{ id: 'out-0', name: 'Out', value: 1 }],
        },
      },
      {
        id: 'nand-and-2',
        type: 'logicGate',
        position: { x: 440, y: 240 },
        data: {
          label: 'NAND Inverter',
          gateType: 'NAND',
          inputCount: 2,
          inputs: [{ id: 'in-0', name: 'In 1', value: 1 }, { id: 'in-1', name: 'In 2', value: 1 }],
          outputs: [{ id: 'out-0', name: 'Out', value: 0 }],
        },
      },
      {
        id: 'out-and',
        type: 'digitalOutput',
        position: { x: 620, y: 250 },
        data: { label: 'A AND B', gateType: 'OUTPUT', value: 0, inputs: [{ id: 'in-0', name: 'In', value: 0 }], outputs: [] },
      },
    ],
    edges: [
      { id: 'e1', source: 'in-a', sourceHandle: 'out-0', target: 'nand-not', targetHandle: 'in-0', type: 'signalEdge' },
      { id: 'e2', source: 'in-a', sourceHandle: 'out-0', target: 'nand-not', targetHandle: 'in-1', type: 'signalEdge' },
      { id: 'e3', source: 'nand-not', sourceHandle: 'out-0', target: 'out-not', targetHandle: 'in-0', type: 'signalEdge' },
      { id: 'e4', source: 'in-a', sourceHandle: 'out-0', target: 'nand-and-1', targetHandle: 'in-0', type: 'signalEdge' },
      { id: 'e5', source: 'in-b', sourceHandle: 'out-0', target: 'nand-and-1', targetHandle: 'in-1', type: 'signalEdge' },
      { id: 'e6', source: 'nand-and-1', sourceHandle: 'out-0', target: 'nand-and-2', targetHandle: 'in-0', type: 'signalEdge' },
      { id: 'e7', source: 'nand-and-1', sourceHandle: 'out-0', target: 'nand-and-2', targetHandle: 'in-1', type: 'signalEdge' },
      { id: 'e8', source: 'nand-and-2', sourceHandle: 'out-0', target: 'out-and', targetHandle: 'in-0', type: 'signalEdge' },
    ],
  },
  {
    id: 'nor-universal',
    name: 'NOR as Universal Gate',
    category: 'Gates',
    description: 'Demonstrates building NOT and OR logic using universal NOR gates.',
    nodes: [
      {
        id: 'in-a',
        type: 'digitalInput',
        position: { x: 100, y: 120 },
        data: { label: 'Input A', gateType: 'INPUT', value: 0, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 0 }] },
      },
      {
        id: 'in-b',
        type: 'digitalInput',
        position: { x: 100, y: 260 },
        data: { label: 'Input B', gateType: 'INPUT', value: 1, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 1 }] },
      },
      {
        id: 'nor-1',
        type: 'logicGate',
        position: { x: 300, y: 170 },
        data: {
          label: 'NOR',
          gateType: 'NOR',
          inputCount: 2,
          inputs: [{ id: 'in-0', name: 'In 1', value: 0 }, { id: 'in-1', name: 'In 2', value: 1 }],
          outputs: [{ id: 'out-0', name: 'Out', value: 0 }],
        },
      },
      {
        id: 'nor-inv',
        type: 'logicGate',
        position: { x: 460, y: 170 },
        data: {
          label: 'NOR Inverter',
          gateType: 'NOR',
          inputCount: 2,
          inputs: [{ id: 'in-0', name: 'In 1', value: 0 }, { id: 'in-1', name: 'In 2', value: 0 }],
          outputs: [{ id: 'out-0', name: 'Out', value: 1 }],
        },
      },
      {
        id: 'out-or',
        type: 'digitalOutput',
        position: { x: 640, y: 180 },
        data: { label: 'A OR B', gateType: 'OUTPUT', value: 1, inputs: [{ id: 'in-0', name: 'In', value: 1 }], outputs: [] },
      },
    ],
    edges: [
      { id: 'e1', source: 'in-a', sourceHandle: 'out-0', target: 'nor-1', targetHandle: 'in-0', type: 'signalEdge' },
      { id: 'e2', source: 'in-b', sourceHandle: 'out-0', target: 'nor-1', targetHandle: 'in-1', type: 'signalEdge' },
      { id: 'e3', source: 'nor-1', sourceHandle: 'out-0', target: 'nor-inv', targetHandle: 'in-0', type: 'signalEdge' },
      { id: 'e4', source: 'nor-1', sourceHandle: 'out-0', target: 'nor-inv', targetHandle: 'in-1', type: 'signalEdge' },
      { id: 'e5', source: 'nor-inv', sourceHandle: 'out-0', target: 'out-or', targetHandle: 'in-0', type: 'signalEdge' },
    ],
  },
];
