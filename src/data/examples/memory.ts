import { CircuitPreset } from '../../types/circuit';

// Memory: latches and flip-flops
export const MEMORY_EXAMPLES: CircuitPreset[] = [
  {
    id: 'sr-latch',
    name: 'SR Latch',
    category: 'Memory',
    description: 'Bistable memory element using cross-coupled NOR gates for Set (S) and Reset (R).',
    nodes: [
      {
        id: 'in-s',
        type: 'digitalInput',
        position: { x: 80, y: 100 },
        data: { label: 'Set (S)', gateType: 'INPUT', value: 1, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 1 }] },
      },
      {
        id: 'in-r',
        type: 'digitalInput',
        position: { x: 80, y: 300 },
        data: { label: 'Reset (R)', gateType: 'INPUT', value: 0, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 0 }] },
      },
      {
        id: 'nor-top',
        type: 'logicGate',
        position: { x: 300, y: 100 },
        data: {
          label: 'NOR Top',
          gateType: 'NOR',
          inputCount: 2,
          inputs: [{ id: 'in-0', name: 'In 1', value: 1 }, { id: 'in-1', name: 'In 2', value: 0 }],
          outputs: [{ id: 'out-0', name: 'Out', value: 0 }],
        },
      },
      {
        id: 'nor-bottom',
        type: 'logicGate',
        position: { x: 300, y: 300 },
        data: {
          label: 'NOR Bottom',
          gateType: 'NOR',
          inputCount: 2,
          inputs: [{ id: 'in-0', name: 'In 1', value: 0 }, { id: 'in-1', name: 'In 2', value: 0 }],
          outputs: [{ id: 'out-0', name: 'Out', value: 1 }],
        },
      },
      {
        id: 'out-qbar',
        type: 'digitalOutput',
        position: { x: 540, y: 110 },
        data: { label: 'Q̄ (Inverted)', gateType: 'OUTPUT', value: 0, inputs: [{ id: 'in-0', name: 'In', value: 0 }], outputs: [] },
      },
      {
        id: 'out-q',
        type: 'digitalOutput',
        position: { x: 540, y: 310 },
        data: { label: 'Q (Output)', gateType: 'OUTPUT', value: 1, inputs: [{ id: 'in-0', name: 'In', value: 1 }], outputs: [] },
      },
    ],
    edges: [
      { id: 'e1', source: 'in-s', sourceHandle: 'out-0', target: 'nor-top', targetHandle: 'in-0', type: 'signalEdge' },
      { id: 'e2', source: 'in-r', sourceHandle: 'out-0', target: 'nor-bottom', targetHandle: 'in-1', type: 'signalEdge' },
      { id: 'e3', source: 'nor-top', sourceHandle: 'out-0', target: 'nor-bottom', targetHandle: 'in-0', type: 'signalEdge' },
      { id: 'e4', source: 'nor-bottom', sourceHandle: 'out-0', target: 'nor-top', targetHandle: 'in-1', type: 'signalEdge' },
      { id: 'e5', source: 'nor-top', sourceHandle: 'out-0', target: 'out-qbar', targetHandle: 'in-0', type: 'signalEdge' },
      { id: 'e6', source: 'nor-bottom', sourceHandle: 'out-0', target: 'out-q', targetHandle: 'in-0', type: 'signalEdge' },
    ],
  },
  {
    id: 'd-latch-demo',
    name: 'D Latch',
    category: 'Memory',
    description: 'Level-sensitive D Latch IC holding data when Enable is LOW and tracking Data when Enable is HIGH.',
    nodes: [
      {
        id: 'in-d',
        type: 'digitalInput',
        position: { x: 80, y: 100 },
        data: { label: 'Data In (D)', gateType: 'INPUT', value: 1, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 1 }] },
      },
      {
        id: 'in-en',
        type: 'digitalInput',
        position: { x: 80, y: 220 },
        data: { label: 'Enable (EN)', gateType: 'INPUT', value: 1, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 1 }] },
      },
      {
        id: 'latch-ic',
        type: 'icComponent',
        position: { x: 300, y: 120 },
        data: {
          label: '74HC75 D Latch',
          gateType: 'D_LATCH',
          inputs: [{ id: 'in-0', name: 'D', value: 1 }, { id: 'in-1', name: 'EN', value: 1 }, { id: 'in-2', name: 'CLR', value: 0 }],
          outputs: [{ id: 'out-0', name: 'Q', value: 1 }, { id: 'out-1', name: 'Q̄', value: 0 }],
        },
      },
      {
        id: 'out-q',
        type: 'digitalOutput',
        position: { x: 540, y: 100 },
        data: { label: 'Output Q', gateType: 'OUTPUT', value: 1, inputs: [{ id: 'in-0', name: 'In', value: 1 }], outputs: [] },
      },
      {
        id: 'out-qbar',
        type: 'digitalOutput',
        position: { x: 540, y: 220 },
        data: { label: 'Output Q̄', gateType: 'OUTPUT', value: 0, inputs: [{ id: 'in-0', name: 'In', value: 0 }], outputs: [] },
      },
    ],
    edges: [
      { id: 'e1', source: 'in-d', sourceHandle: 'out-0', target: 'latch-ic', targetHandle: 'in-0', type: 'signalEdge' },
      { id: 'e2', source: 'in-en', sourceHandle: 'out-0', target: 'latch-ic', targetHandle: 'in-1', type: 'signalEdge' },
      { id: 'e3', source: 'latch-ic', sourceHandle: 'out-0', target: 'out-q', targetHandle: 'in-0', type: 'signalEdge' },
      { id: 'e4', source: 'latch-ic', sourceHandle: 'out-1', target: 'out-qbar', targetHandle: 'in-0', type: 'signalEdge' },
    ],
  },
  {
    id: 'jk-flipflop-demo',
    name: 'JK Flip-Flop',
    category: 'Memory',
    description: 'Edge-triggered JK Flip-Flop: J=1,K=0 Sets; J=0,K=1 Resets; J=1,K=1 Toggles. Press the clock button to make a clock edge.',
    nodes: [
      {
        id: 'in-j',
        type: 'digitalInput',
        position: { x: 80, y: 80 },
        data: { label: 'J Input', gateType: 'INPUT', value: 1, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 1 }] },
      },
      {
        id: 'clk-gen',
        type: 'pushButton',
        position: { x: 80, y: 180 },
        data: { label: 'Clock (press)', gateType: 'PUSH_BUTTON', value: 0, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 0 }] },
      },
      {
        id: 'in-k',
        type: 'digitalInput',
        position: { x: 80, y: 320 },
        data: { label: 'K Input', gateType: 'INPUT', value: 1, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value: 1 }] },
      },
      {
        id: 'jk-ic',
        type: 'icComponent',
        position: { x: 320, y: 120 },
        data: {
          label: 'JK Flip-Flop',
          gateType: 'JK_FLIPFLOP',
          inputs: [
            { id: 'in-0', name: 'J', value: 1 }, { id: 'in-1', name: 'CLK', value: 0 },
            { id: 'in-2', name: 'K', value: 1 }, { id: 'in-3', name: 'CLR', value: 0 }
          ],
          outputs: [{ id: 'out-0', name: 'Q', value: 0 }, { id: 'out-1', name: 'Q̄', value: 1 }],
        },
      },
      {
        id: 'out-q',
        type: 'digitalOutput',
        position: { x: 560, y: 110 },
        data: { label: 'Q (Output)', gateType: 'OUTPUT', value: 0, inputs: [{ id: 'in-0', name: 'In', value: 0 }], outputs: [] },
      },
      {
        id: 'out-qbar',
        type: 'digitalOutput',
        position: { x: 560, y: 230 },
        data: { label: 'Q̄ (Inverted)', gateType: 'OUTPUT', value: 1, inputs: [{ id: 'in-0', name: 'In', value: 1 }], outputs: [] },
      },
    ],
    edges: [
      { id: 'e1', source: 'in-j', sourceHandle: 'out-0', target: 'jk-ic', targetHandle: 'in-0', type: 'signalEdge' },
      { id: 'e2', source: 'clk-gen', sourceHandle: 'out-0', target: 'jk-ic', targetHandle: 'in-1', type: 'signalEdge' },
      { id: 'e3', source: 'in-k', sourceHandle: 'out-0', target: 'jk-ic', targetHandle: 'in-2', type: 'signalEdge' },
      { id: 'e4', source: 'jk-ic', sourceHandle: 'out-0', target: 'out-q', targetHandle: 'in-0', type: 'signalEdge' },
      { id: 'e5', source: 'jk-ic', sourceHandle: 'out-1', target: 'out-qbar', targetHandle: 'in-0', type: 'signalEdge' },
    ],
  },
];
