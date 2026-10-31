import { describe, it, expect, beforeEach } from 'vitest';
import { Node, Edge } from '@xyflow/react';
import { useCircuitStore } from './useCircuitStore';
import { NodeData, SignalValue } from '../types/circuit';
import { wordsToIntelHex } from '../simulation/avr/intelHex';

const store = () => useCircuitStore.getState();
const data = (id: string) => store().nodes.find((n) => n.id === id)?.data as unknown as NodeData | undefined;

const sw = (id: string, value: SignalValue): Node => ({
  id,
  type: 'digitalInput',
  position: { x: 0, y: 0 },
  data: { label: id, gateType: 'INPUT', value, inputs: [], outputs: [{ id: 'out-0', name: 'Out', value }] },
});
const not = (id: string): Node => ({
  id,
  type: 'logicGate',
  position: { x: 150, y: 0 },
  data: { label: 'NOT', gateType: 'NOT', inputs: [{ id: 'in-0', name: 'A', value: -1 }], outputs: [{ id: 'out-0', name: 'Y', value: -1 }] },
});
const led = (id: string): Node => ({
  id,
  type: 'digitalOutput',
  position: { x: 300, y: 0 },
  data: { label: id, gateType: 'OUTPUT', value: -1, inputs: [{ id: 'in-0', name: 'In', value: -1 }], outputs: [] },
});
const wire = (id: string, source: string, target: string): Edge => ({ id, source, target, sourceHandle: 'out-0', targetHandle: 'in-0' });

// Switch A (1) → NOT → LED Y
const loadInverter = () => store().loadCircuit([sw('A', 1), not('n'), led('Y')], [wire('e1', 'A', 'n'), wire('e2', 'n', 'Y')]);
const select = (...ids: string[]) =>
  useCircuitStore.setState({ nodes: store().nodes.map((n) => ({ ...n, selected: ids.includes(n.id) })) });

beforeEach(() => {
  useCircuitStore.setState({
    nodes: [],
    edges: [],
    historyPast: [],
    historyFuture: [],
    hierarchyPath: [{ id: 'root', name: 'Main Project' }],
    rootCircuitState: null,
    selectedNodeId: null,
    selectedEdgeId: null,
  });
  loadInverter();
  useCircuitStore.setState({ historyPast: [], historyFuture: [] });
});

describe('editing with undo and redo', () => {
  it('settles a loaded circuit', () => {
    expect(data('Y')?.value).toBe(0);
  });

  it('floats what a deleted part drove, and undo brings the part and its signal back', () => {
    select('n');
    store().deleteSelected();
    expect(data('n')).toBeUndefined();
    expect(store().edges).toHaveLength(0);
    expect(data('Y')?.value).toBe(-1);

    store().undo();
    expect(data('n')).toBeDefined();
    expect(store().edges).toHaveLength(2);
    expect(data('Y')?.value).toBe(0);

    store().redo();
    expect(data('n')).toBeUndefined();
    expect(data('Y')?.value).toBe(-1);
  });

  it('pastes a copy with a new id as one undo step', () => {
    select('n');
    store().copySelected();
    store().pasteClipboard();
    const nots = store().nodes.filter((n) => (n.data as unknown as NodeData).gateType === 'NOT');
    expect(nots).toHaveLength(2);
    expect(new Set(nots.map((n) => n.id)).size).toBe(2);

    store().undo();
    expect(store().nodes.filter((n) => (n.data as unknown as NodeData).gateType === 'NOT')).toHaveLength(1);
  });

  it('pastes a copied group with its parts in the same place inside it', () => {
    select('A', 'n');
    store().groupSelectedNodes('Front end');
    const group = store().nodes.find((n) => n.type === 'groupNode')!;
    const inside = (parentId: string) =>
      store()
        .nodes.filter((n) => n.parentId === parentId)
        .map((n) => n.position)
        .sort((p, q) => p.x - q.x);
    const original = inside(group.id);

    select(group.id, 'A', 'n');
    store().copySelected();
    store().pasteClipboard();
    const copy = store().nodes.find((n) => n.type === 'groupNode' && n.id !== group.id)!;
    expect(copy.position).toEqual({ x: group.position.x + 40, y: group.position.y + 40 });
    expect(inside(copy.id)).toEqual(original);
  });

  it('groups a selection and undoes the grouping', () => {
    select('A', 'n');
    store().groupSelectedNodes('Front end');
    const group = store().nodes.find((n) => n.type === 'groupNode');
    expect(group).toBeDefined();
    expect(store().nodes.filter((n) => n.parentId === group!.id).map((n) => n.id).sort()).toEqual(['A', 'n']);

    store().undo();
    expect(store().nodes.some((n) => n.type === 'groupNode')).toBe(false);
  });

  it('flipping switches is not recorded in undo history', () => {
    store().toggleInputValue('A');
    store().setInputLevels([{ nodeId: 'A', value: 1 }]);
    expect(store().historyPast).toHaveLength(0);
    expect(data('Y')?.value).toBe(0);
    store().setInputLevels([{ nodeId: 'A', value: 0 }]);
    expect(data('Y')?.value).toBe(1);
  });
});

describe('oscillation', () => {
  it('reports parts that never settle and clears the report once fixed', () => {
    const ring = { ...not('r'), data: { ...not('r').data, outputs: [{ id: 'out-0', name: 'Y', value: 0 }] } };
    store().loadCircuit([ring], [wire('loop', 'r', 'r')]);
    expect(store().simulation.unstableNodeIds).toEqual(['r']);
    expect(store().nodes[0].className).toContain('ls-unstable');

    loadInverter();
    expect(store().simulation.unstableNodeIds).toEqual([]);
    expect(store().nodes.some((n) => n.className?.includes('ls-unstable'))).toBe(false);
  });
});

describe('opening files', () => {
  it('opens a valid file as one undo step', () => {
    const file = JSON.stringify({ nodes: [sw('B', 0), led('Z')], edges: [wire('w', 'B', 'Z')] });
    expect(store().openCircuitFile(file)).toBe(true);
    expect(data('Z')?.value).toBe(0);

    store().undo();
    expect(data('Y')).toBeDefined();
  });

  it('refuses a file that is not JSON and keeps the circuit', () => {
    expect(store().openCircuitFile('not json')).toBe(false);
    expect(data('Y')).toBeDefined();
    expect(store().toastVariant).toBe('error');
  });
});

describe('sub-circuits', () => {
  it('opens a custom component, saves edits to its definition and returns to the main circuit', () => {
    const id = 'builtin_half_adder';
    const before = store().customComponents[id];
    store().instantiateCustomComponent(id, { x: 0, y: 200 });
    const instance = store().nodes.find((n) => (n.data as unknown as NodeData).customComponentId === id)!;
    const rootCount = store().nodes.length;

    store().enterSubcircuitView(id, instance.id);
    expect(store().hierarchyPath).toHaveLength(2);
    expect(store().nodes).toHaveLength(before.nodes.length);
    // Undo history never crosses between levels
    expect(store().historyPast).toHaveLength(0);

    store().addNode('AND', { x: 0, y: 0 });
    store().exitSubcircuitView(0);
    expect(store().hierarchyPath).toHaveLength(1);
    expect(store().nodes).toHaveLength(rootCount);
    expect(store().historyPast).toHaveLength(0);

    const after = store().customComponents[id];
    expect(after.nodes).toHaveLength(before.nodes.length + 1);
    expect(after.updatedAt).toBeGreaterThan(before.updatedAt);
  });
});

describe('clocks and boards', () => {
  const clocked = () => {
    store().addNode('CLOCK', { x: 0, y: 0 });
    const clock = store().nodes[store().nodes.length - 1];
    store().loadCircuit([clock, led('Y')], [{ id: 'w', source: clock.id, target: 'Y', sourceHandle: 'out-0', targetHandle: 'in-0' }]);
    return clock.id;
  };

  it('moves a clock forward only while running, and records it in the timing diagram', () => {
    const clockId = clocked();
    store().setTimelineRunning(false);
    store().advanceTimeline(600);
    expect(data('Y')?.inputs[0].value).toBe(0);

    store().setTimelineRunning(true);
    store().advanceTimeline(100);
    store().advanceTimeline(100);
    store().advanceTimeline(100);
    store().advanceTimeline(100);
    store().advanceTimeline(100);
    expect(store().timeline.time).toBe(500);
    expect(data('Y')?.inputs[0].value).toBe(1);
    expect(store().timeline.traces[clockId]).toEqual([[0, 0], [500, 1]]);
  });

  it('steps to the next clock edge and pauses; restart goes back to time 0', () => {
    clocked();
    store().stepTimeline();
    expect(store().timeline.running).toBe(false);
    expect(store().timeline.time).toBe(500);
    store().stepTimeline();
    expect(store().timeline.time).toBe(1000);
    expect(data('Y')?.inputs[0].value).toBe(0);
    store().restartTimeline();
    expect(store().timeline.time).toBe(0);
  });

  it('rejects a file that isn’t a compiled program', () => {
    store().addNode('ARDUINO_UNO', { x: 0, y: 0 });
    const board = store().nodes[store().nodes.length - 1];
    expect(store().loadBoardFirmware(board.id, 'sketch.ino', 'void setup() {}')).toBe(false);
    expect(store().toastMessage).toMatch(/^Invalid \.hex file/);
    expect(data(board.id)?.firmware).toBeUndefined();
    expect(store().loadBoardFirmware(board.id, 'echo.hex', wordsToIntelHex([0xe200, 0xb904]))).toBe(true);
    expect(data(board.id)?.firmware?.name).toBe('echo.hex');
  });
});

describe('sensors', () => {
  it('changes what a sensor senses without an undo step, and re-settles', () => {
    store().addNode('SENSOR_TEMPERATURE', { x: 0, y: 0 });
    const id = store().nodes[store().nodes.length - 1].id;
    const undoSteps = store().historyPast.length;
    expect(data(id)?.outputs[0].value).toBe(0);
    store().setSensorLevel(id, 45);
    expect(data(id)?.outputs[0].value).toBe(1);
    expect(store().historyPast.length).toBe(undoSteps);
  });
});

describe('wiring several outputs to one input', () => {
  const connect = (source: string, target: string) =>
    store().onConnect({ source, sourceHandle: 'out-0', target, targetHandle: 'in-0' });
  const intoY = () => store().edges.filter((e) => e.target === 'Y').map((e) => e.source).sort();

  it('replaces the old wire for ordinary outputs, as before', () => {
    store().loadCircuit([sw('A', 1), sw('B', 0), led('Y')], []);
    connect('A', 'Y');
    connect('B', 'Y');
    expect(intoY()).toEqual(['B']);
  });

  it('keeps both wires when tri-state outputs share the input, and reports a conflict', () => {
    store().loadCircuit([], []);
    store().addNode('TRI_STATE_BUFFER', { x: 0, y: 0 });
    store().addNode('TRI_STATE_BUFFER', { x: 0, y: 90 });
    const [t1, t2] = store().nodes.map((n) => n.id);
    store().loadCircuit([...store().nodes, sw('A', 1), sw('B', 0), led('Y')], []);
    connect('A', t1);
    connect('B', t2);
    connect(t1, 'Y');
    connect(t2, 'Y');
    expect(intoY()).toEqual([t1, t2].sort());
    // Both buffers are enabled (EN floats to enabled) and disagree
    expect(store().simulation.conflictNodeIds).toEqual(['Y']);
    expect(store().nodes.find((n) => n.id === 'Y')?.className).toContain('ls-conflict');
  });
});

describe('watching a wire', () => {
  it('starts the timing diagram without a clock and records the wire as it changes', () => {
    loadInverter();
    store().setTimelineRunning(true);
    store().advanceTimeline(100);
    expect(store().timeline.time).toBe(0); // nothing timed yet

    store().setWireWatched('e2', true);
    expect(store().edges.find((e) => e.id === 'e2')?.data?.watched).toBe(true);
    store().advanceTimeline(100);
    expect(store().timeline.time).toBe(100); // time runs while a wire is watched
    store().toggleInputValue('A');
    expect(store().timeline.traces['wire:e2']).toEqual([[0, 0], [100, 1]]);

    store().undo();
    expect(store().edges.find((e) => e.id === 'e2')?.data?.watched).toBeUndefined();
  });
});

describe('gate delays in the store', () => {
  it('steps an edit through the gates one delay at a time, and settles at once when turned off', () => {
    loadInverter(); // A (1) → NOT → Y
    store().setWireWatched('e2', true);
    store().setTimelineRunning(false);
    store().setGateDelay(10);
    store().toggleInputValue('A'); // A → 0; the NOT hasn't responded yet
    expect(data('Y')?.inputs[0].value).toBe(0);
    expect(store().timeline.passDue).toBe(10);
    store().stepTimeline(); // one gate delay later the NOT output is 1
    store().stepTimeline(); // and the LED sees it a pass later
    expect(data('Y')?.inputs[0].value).toBe(1);

    store().toggleInputValue('A');
    store().setGateDelay(0);
    expect(data('Y')?.inputs[0].value).toBe(0);
    expect(store().timeline.passDue).toBeNull();
  });
});

describe('expected outputs', () => {
  it('are kept with the circuit, written to saved files, and cleared for a new circuit', async () => {
    const { parseCircuitFile } = await import('../utils/circuitFile');
    loadInverter();
    store().setExpected("Y = A'");
    const file = { nodes: store().nodes, edges: store().edges, expected: store().expected };
    expect(parseCircuitFile(file, {})).toMatchObject({ ok: true, expected: "Y = A'" });

    store().clearCanvas();
    expect(store().expected).toBe('');
    expect(store().openCircuitFile(JSON.stringify(file))).toBe(true);
    expect(store().expected).toBe("Y = A'");
  });
});

describe('bus wiring', () => {
  it('only joins bus pins of the same width, and resizing drops the bus wire', () => {
    store().loadCircuit([], []);
    store().addNode('BUS_JOIN', { x: 0, y: 0 });
    store().addNode('BUS_SPLIT', { x: 150, y: 0 });
    store().addNode('OUTPUT', { x: 300, y: 0 });
    const [join, split, ledId] = store().nodes.map((n) => n.id);
    const undoSteps = store().historyPast.length;

    store().onConnect({ source: join, sourceHandle: 'out-0', target: ledId, targetHandle: 'in-0' });
    expect(store().edges).toHaveLength(0);
    expect(store().toastMessage).toMatch(/only connects to a bus pin/);
    expect(store().historyPast.length).toBe(undoSteps); // a refused wire is not an undo step

    store().onConnect({ source: join, sourceHandle: 'out-0', target: split, targetHandle: 'in-0' });
    store().onConnect({ source: split, sourceHandle: 'out-3', target: ledId, targetHandle: 'in-0' });
    expect(store().edges).toHaveLength(2);

    store().setNodeBitWidth(split, 8);
    expect(store().edges).toHaveLength(1); // the bus wire went; bit 3 still exists on 8 bits
    store().onConnect({ source: join, sourceHandle: 'out-0', target: split, targetHandle: 'in-0' });
    expect(store().toastMessage).toMatch(/a 4-bit bus to an 8-bit bus pin/);
  });
});

describe('projects', () => {
  it('keeps a circuit per project, switches between them and deletes them', () => {
    loadInverter();
    const first = store().currentProjectId;
    store().setExpected("Y = A'");
    store().newProject();
    const second = store().currentProjectId;
    expect(second).not.toBe(first);
    expect(store().nodes).toHaveLength(0);
    expect(store().expected).toBe('');
    expect(store().historyPast).toHaveLength(0); // undo doesn't reach into the other project

    store().addNode('AND', { x: 0, y: 0 });
    store().openProject(first);
    expect(store().nodes.map((n) => n.id).sort()).toEqual(['A', 'Y', 'n']);
    expect(store().expected).toBe("Y = A'");

    store().openProject(second);
    expect(store().nodes).toHaveLength(1); // the AND was saved when switching away

    store().renameProject(second, 'Adder');
    expect(store().projects.find((p) => p.id === second)?.name).toBe('Adder');
    store().duplicateProject(second);
    expect(store().projects.some((p) => p.name === 'Adder copy')).toBe(true);

    store().deleteProject(second);
    expect(store().projects.some((p) => p.id === second)).toBe(false);
    expect(store().currentProjectId).not.toBe(second);
  });
});
