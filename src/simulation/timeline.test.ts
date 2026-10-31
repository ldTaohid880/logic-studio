import { describe, it, expect } from 'vitest';
import { Node, Edge } from '@xyflow/react';
import { createPart } from '../store/partFactory';
import { NodeData, GateType } from '../types/circuit';
import { advanceCircuit, clockLevelAt, nextClockEdge, recordTraces, BoardLike, Traces } from './timeline';
import { propagateSignals } from './engine';
import { UnoBoard } from './avr/unoBoard';
import { parseIntelHex, wordsToIntelHex } from './avr/intelHex';

const part = (type: GateType, patch: Partial<NodeData> = {}): Node => {
  const node = createPart(type, { x: 0, y: 0 }, []);
  return { ...node, data: { ...node.data, ...patch } };
};
const wire = (source: Node, target: Node, sourceHandle = 'out-0', targetHandle = 'in-0'): Edge => ({
  id: `${source.id}-${sourceHandle}-${target.id}-${targetHandle}`,
  source: source.id,
  target: target.id,
  sourceHandle,
  targetHandle,
});
const dataOf = (nodes: Node[], id: string) => nodes.find((n) => n.id === id)!.data as unknown as NodeData;
const noBoards = () => null;

// Hand-assembled ATmega328P program: D13 follows D2.
//   ldi r16,0x20 / out DDRB,r16 / loop: sbic PIND,2 / rjmp high / cbi PORTB,5 / rjmp loop / high: sbi PORTB,5 / rjmp loop
const ECHO_D2_TO_D13 = wordsToIntelHex([0xe200, 0xb904, 0x994a, 0xc002, 0x982d, 0xcffc, 0x9a2d, 0xcffa]);

describe('clock timing', () => {
  it('starts low and changes every half period', () => {
    expect([0, 499, 500, 999, 1000].map((t) => clockLevelAt(t, 1))).toEqual([0, 0, 1, 1, 0]);
    expect(nextClockEdge(0, 1)).toBe(500);
    expect(nextClockEdge(500, 1)).toBe(1000);
    expect(nextClockEdge(12.5, 10)).toBe(50);
  });
});

describe('advanceCircuit', () => {
  it('toggles clocks on their edges and settles the circuit after each one', () => {
    const clock = part('CLOCK', { clockHz: 1 });
    const led = part('OUTPUT');
    const settled: [number, number][] = [];
    const result = advanceCircuit({ nodes: [clock, led], edges: [wire(clock, led)] }, {}, 0, 1200, noBoards, {
      onSettle: (t, nodes) => settled.push([t, dataOf(nodes, led.id).value as number]),
    });
    expect(settled).toEqual([[500, 1], [1000, 0]]);
    expect(result.time).toBe(1200);
  });

  it('drives a counter: ten rising edges of a 10 Hz clock in one second', () => {
    const clock = part('CLOCK', { clockHz: 10 });
    const counter = part('COUNTER_4BIT');
    const start = propagateSignals([clock, counter], [wire(clock, counter)], {});
    const { nodes } = advanceCircuit(start, {}, 0, 1000, noBoards);
    const q = dataOf(nodes, counter.id).outputs.slice(0, 4).reduce((acc, p, i) => acc | ((p.value as number) << i), 0);
    expect(q).toBe(10);
  });

  it('stops at the deadline and reports how far it got', () => {
    const clock = part('CLOCK', { clockHz: 100 });
    const result = advanceCircuit({ nodes: [clock], edges: [] }, {}, 0, 10_000, noBoards, { deadline: performance.now() - 1 });
    expect(result.time).toBe(0);
  });

  it('runs boards in 1 ms slices, feeding their inputs and applying their outputs', () => {
    const calls: number[] = [];
    let level: 0 | 1 = 0;
    const fake: BoardLike = {
      run: (ms) => calls.push(ms),
      input: (pin, value) => {
        if (pin === 2) level = value === 1 ? 1 : 0;
      },
      output: (pin) => (pin === 13 ? level : -1),
    };
    const sw = part('INPUT', { value: 1 });
    const board = part('ARDUINO_UNO');
    const led = part('OUTPUT');
    const start = propagateSignals([sw, board, led], [wire(sw, board), wire(board, led, 'out-11')], {});
    const { nodes } = advanceCircuit(start, {}, 0, 3, () => fake);
    expect(calls).toEqual([1, 1, 1]);
    expect(dataOf(nodes, led.id).inputs[0].value).toBe(1);
  });
});

describe('recordTraces', () => {
  it('adds a point only when a traced level changes', () => {
    const sw = part('INPUT', { value: 0 });
    const gate = part('AND');
    let traces: Traces = {};
    traces = recordTraces(traces, [sw, gate], 0);
    const same = recordTraces(traces, [sw, gate], 5);
    expect(same).toBe(traces);
    traces = recordTraces(traces, [{ ...sw, data: { ...sw.data, value: 1 } }], 10);
    expect(traces[sw.id]).toEqual([[0, 0], [10, 1]]);
    expect(traces[gate.id]).toBeUndefined();
  });
});

describe('Uno board emulation', () => {
  it('runs a compiled program: D13 follows D2', () => {
    const board = new UnoBoard(ECHO_D2_TO_D13);
    board.run(1);
    expect(board.output(13)).toBe(0);
    expect(board.output(12)).toBe(-1); // never made an output
    board.input(2, 1);
    board.run(1);
    expect(board.output(13)).toBe(1);
    board.input(2, 0);
    board.run(1);
    expect(board.output(13)).toBe(0);
  });

  it('wires into a circuit: a switch on D2 lights an LED on D13', () => {
    const sw = part('INPUT', { value: 0 });
    const board = part('ARDUINO_UNO');
    const led = part('OUTPUT');
    const uno = new UnoBoard(ECHO_D2_TO_D13);
    let circuit = propagateSignals([sw, board, led], [wire(sw, board), wire(board, led, 'out-11')], {});
    circuit = { ...circuit, ...advanceCircuit(circuit, {}, 0, 2, () => uno) };
    expect(dataOf(circuit.nodes, led.id).inputs[0].value).toBe(0);

    const flipped = circuit.nodes.map((n) => (n.id === sw.id ? { ...n, data: { ...n.data, value: 1 } } : n));
    circuit = propagateSignals(flipped, circuit.edges, {});
    const { nodes } = advanceCircuit(circuit, {}, 2, 4, () => uno);
    expect(dataOf(nodes, led.id).inputs[0].value).toBe(1);
  });
});

describe('parseIntelHex', () => {
  it('loads data records into flash', () => {
    const flash = parseIntelHex(wordsToIntelHex([0xe200, 0xb904]));
    expect([...flash.slice(0, 4)]).toEqual([0x00, 0xe2, 0x04, 0xb9]);
  });

  it('rejects files that aren’t Intel HEX, with a reason', () => {
    expect(() => parseIntelHex('')).toThrow(/empty/);
    expect(() => parseIntelHex('void setup() {}')).toThrow(/line 1/);
    expect(() => parseIntelHex(':0400000000E204B901')).toThrow(/checksum/);
    expect(() => parseIntelHex(':00000001FF')).toThrow(/no program/);
  });
});

describe('watched wires', () => {
  it('are traced alongside parts, keyed by wire', () => {
    const sw = part('INPUT', { value: 1 });
    const gate = part('NOT');
    const edge = { ...wire(sw, gate), data: { watched: true, signalValue: 1 } };
    const traces = recordTraces({}, [sw, gate], 5, [edge, wire(gate, sw)]);
    expect(traces[`wire:${edge.id}`]).toEqual([[5, 1]]);
    expect(Object.keys(traces)).toHaveLength(2); // the switch and the watched wire; the other wire isn't watched
  });
});

describe('gate delays', () => {
  // Y = A·B + A'·C with B = C = 1: Y should stay 1, but when A falls the A'·C path is one gate slower
  const hazard = () => {
    const a = part('INPUT', { value: 1 });
    const b = part('INPUT', { value: 1 });
    const c = part('INPUT', { value: 1 });
    const not = part('NOT');
    const and1 = part('AND');
    const and2 = part('AND');
    const or = part('OR');
    const y = part('OUTPUT');
    const edges = [
      wire(a, and1), wire(b, and1, 'out-0', 'in-1'),
      wire(a, not), wire(not, and2), wire(c, and2, 'out-0', 'in-1'),
      wire(and1, or), wire(and2, or, 'out-0', 'in-1'), wire(or, y),
    ];
    return { circuit: propagateSignals([a, b, c, not, and1, and2, or, y], edges, {}), a, y };
  };

  it('shows the static hazard as a one-delay glitch, which instant gates hide', () => {
    const { circuit, a, y } = hazard();
    const fallen = circuit.nodes.map((n) => (n.id === a.id ? { ...n, data: { ...n.data, value: 0 } } : n));

    // Instant gates: Y never leaves 1
    const instant = propagateSignals(fallen, circuit.edges, {});
    expect(dataOf(instant.nodes, y.id).inputs[0].value).toBe(1);

    // 10 ms gate delay: the edit's pass at t = 0, then one pass every 10 ms
    const levels: [number, number][] = [];
    const first = propagateSignals(fallen, circuit.edges, {}, { maxPasses: 1 });
    advanceCircuit(first, {}, 0, 100, () => null, {
      gateDelay: 10,
      passDue: 10,
      onSettle: (t, nodes) => levels.push([t, dataOf(nodes, y.id).inputs[0].value as number]),
    });
    const changes = levels.filter(([, v], i) => i === 0 || v !== levels[i - 1][1]);
    expect(changes).toEqual([[10, 1], [20, 0], [30, 1]]); // glitch to 0 for exactly one delay
  });

  it('lets a ring of three inverters oscillate instead of flagging it', () => {
    // All-unknown inverters stay unknown, so one starts at a known level
    const seeded = part('NOT');
    const n1 = { ...seeded, data: { ...seeded.data, outputs: [{ id: 'out-0', name: 'Out', value: 0 }] } };
    const [n2, n3] = [part('NOT'), part('NOT')];
    const ring = { nodes: [n1, n2, n3], edges: [wire(n1, n2), wire(n2, n3), wire(n3, n1)] };
    const seen = new Set<number>();
    const result = advanceCircuit(ring, {}, 0, 200, () => null, {
      gateDelay: 10,
      passDue: 0,
      onSettle: (_, nodes) => seen.add(dataOf(nodes, n1.id).outputs[0].value as number),
    });
    expect(result.passDue).not.toBeNull(); // still running
    expect(result.unstableNodeIds).toEqual([]);
    expect(seen.has(0) && seen.has(1)).toBe(true);
  });
});
