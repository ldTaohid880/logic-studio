import { CircuitPreset } from '../../types/circuit';

// Small projects that combine several ideas
export const PROJECT_EXAMPLES: CircuitPreset[] = [
  {
    id: 'digital-door-lock',
    name: 'Digital Security Door Lock',
    category: 'Projects',
    description: 'Requires correct 4-bit PIN match on Comparator to unlock door solenoid.',
    nodes: [
      {
        id: 'pin-keypad',
        type: 'dipSwitch',
        position: { x: 80, y: 100 },
        data: { label: 'Keypad Input', gateType: 'DIP_SWITCH', bitWidth: 4, dipValues: [1, 0, 1, 0], inputs: [], outputs: Array.from({ length: 4 }, (_, i) => ({ id: `out-${i}`, name: `SW${i}`, value: 0 })) },
      },
      {
        id: 'pin-secret',
        type: 'dipSwitch',
        position: { x: 80, y: 260 },
        data: { label: 'Preset Passcode (1010)', gateType: 'DIP_SWITCH', bitWidth: 4, dipValues: [1, 0, 1, 0], inputs: [], outputs: Array.from({ length: 4 }, (_, i) => ({ id: `out-${i}`, name: `SW${i}`, value: 0 })) },
      },
      {
        id: 'comp-lock',
        type: 'icComponent',
        position: { x: 340, y: 140 },
        data: {
          label: 'PIN Matcher',
          gateType: 'COMPARATOR_4BIT',
          inputs: [
            { id: 'in-0', name: 'A0', value: 0 }, { id: 'in-1', name: 'A1', value: 0 }, { id: 'in-2', name: 'A2', value: 0 }, { id: 'in-3', name: 'A3', value: 0 },
            { id: 'in-4', name: 'B0', value: 0 }, { id: 'in-5', name: 'B1', value: 0 }, { id: 'in-6', name: 'B2', value: 0 }, { id: 'in-7', name: 'B3', value: 0 },
          ],
          outputs: [{ id: 'out-0', name: 'A > B', value: 0 }, { id: 'out-1', name: 'A = B', value: 1 }, { id: 'out-2', name: 'A < B', value: 0 }],
        },
      },
      {
        id: 'door-solenoid',
        type: 'digitalOutput',
        position: { x: 600, y: 180 },
        data: { label: 'Door Unlocked Solenoid', gateType: 'OUTPUT', value: 1, inputs: [{ id: 'in-0', name: 'In', value: 1 }], outputs: [] },
      },
    ],
    edges: [
      { id: 'e-a0', source: 'pin-keypad', sourceHandle: 'out-0', target: 'comp-lock', targetHandle: 'in-0', type: 'signalEdge' },
      { id: 'e-a1', source: 'pin-keypad', sourceHandle: 'out-1', target: 'comp-lock', targetHandle: 'in-1', type: 'signalEdge' },
      { id: 'e-a2', source: 'pin-keypad', sourceHandle: 'out-2', target: 'comp-lock', targetHandle: 'in-2', type: 'signalEdge' },
      { id: 'e-a3', source: 'pin-keypad', sourceHandle: 'out-3', target: 'comp-lock', targetHandle: 'in-3', type: 'signalEdge' },
      { id: 'e-b0', source: 'pin-secret', sourceHandle: 'out-0', target: 'comp-lock', targetHandle: 'in-4', type: 'signalEdge' },
      { id: 'e-b1', source: 'pin-secret', sourceHandle: 'out-1', target: 'comp-lock', targetHandle: 'in-5', type: 'signalEdge' },
      { id: 'e-b2', source: 'pin-secret', sourceHandle: 'out-2', target: 'comp-lock', targetHandle: 'in-6', type: 'signalEdge' },
      { id: 'e-b3', source: 'pin-secret', sourceHandle: 'out-3', target: 'comp-lock', targetHandle: 'in-7', type: 'signalEdge' },
      { id: 'e-lock', source: 'comp-lock', sourceHandle: 'out-1', target: 'door-solenoid', targetHandle: 'in-0', type: 'signalEdge' },
    ],
  },
];
