import { describe, it, expect } from 'vitest';
import { CIRCUIT_PRESETS } from './index';
import { propagateSignals } from '../../simulation/engine';
import { removeUnsupportedParts } from '../../store/helpers';
import { describeCircuitForTable, generateCircuitTruthTable } from '../../utils/circuitTruthTableEngine';
import { NodeData } from '../../types/circuit';

// Golden checks for the built-in examples: they are the first circuits students open
describe.each(CIRCUIT_PRESETS.map((p) => [p.name, p] as const))('example "%s"', (_name, preset) => {
  it('uses only supported parts', () => {
    expect(removeUnsupportedParts(preset.nodes, preset.edges).removed).toBe(0);
  });

  it('wires only to pins that exist', () => {
    const byId = new Map(preset.nodes.map((n) => [n.id, n.data as unknown as NodeData]));
    const broken = preset.edges.filter((e) => {
      const source = byId.get(e.source);
      const target = byId.get(e.target);
      if (!source || !target) return true;
      const sourceOk = source.gateType === 'INPUT' || source.outputs.some((p) => p.id === (e.sourceHandle || 'out-0'));
      const targetOk = target.inputs.some((p) => p.id === (e.targetHandle || 'in-0'));
      return !sourceOk || !targetOk;
    });
    expect(broken.map((e) => e.id)).toEqual([]);
  });

  it('settles with every wire at a known level', () => {
    const result = propagateSignals(preset.nodes, preset.edges, {});
    expect(result.unstableNodeIds).toEqual([]);
    expect(result.edges.filter((e) => e.data?.signalValue === -1).map((e) => e.id)).toEqual([]);
  });

  it('gives every output a known value for every input combination', async () => {
    const model = describeCircuitForTable(preset.nodes, preset.edges);
    if (model.inputs.length === 0 || model.outputs.length === 0) return;
    // Latches hold whatever the example stores, so start their rows from the example's own state
    const rows = (await generateCircuitTruthTable(preset.nodes, preset.edges, model, { memoryStart: 'canvas' }))!;
    const unknown = rows.filter((r) => r.outputs.some((v) => v === -1 || v === '?')).map((r) => `m${r.index}`);
    expect(unknown).toEqual([]);
  });
});
