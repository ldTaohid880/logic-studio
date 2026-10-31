import { describe, it, expect } from 'vitest';
import { parseExpressions } from './expression';
import { buildNetlist, layoutNetlist, netlistStats } from './circuitBuilder';
import { circuitStats } from './circuitStats';
import { createPart } from '../store/partFactory';
import { NodeData } from '../types/circuit';

const build = (text: string, style: 'basic' | 'nand' = 'basic') => layoutNetlist(buildNetlist(parseExpressions(text), style));

describe('circuitStats', () => {
  it('counts gates by type and the logic levels on the longest path', () => {
    const { nodes, edges } = build("Y = AB + A'C");
    const stats = circuitStats(nodes, edges);
    expect(stats).toMatchObject({ gates: 4, chips: 0, levels: 3, hasLoop: false });
    expect(stats.gatesByType).toEqual({ NOT: 1, AND: 2, OR: 1 });
    // A → NOT → AND → OR → Y
    const labels = stats.longestPath.map((id) => {
      const d = nodes.find((n) => n.id === id)!.data as unknown as NodeData;
      return d.gateType === 'INPUT' || d.gateType === 'OUTPUT' ? d.label : d.gateType;
    });
    expect(labels).toEqual(['A', 'NOT', 'AND', 'OR', 'Y']);
  });

  it('agrees with the build dialog on gates and levels', () => {
    for (const style of ['basic', 'nand'] as const) {
      const lines = parseExpressions('S = A ⊕ B ⊕ C\nCo = AB + C(A ⊕ B)');
      const net = buildNetlist(lines, style);
      const { nodes, edges } = layoutNetlist(net);
      const fromNet = netlistStats(net);
      expect(circuitStats(nodes, edges)).toMatchObject({ gates: fromNet.gates, levels: fromNet.levels });
    }
  });

  it('starts paths at memory parts and reports feedback loops', () => {
    const ff = createPart('D_FLIPFLOP', { x: 0, y: 0 }, []);
    const not = createPart('NOT', { x: 150, y: 0 }, []);
    const toggle = [
      { id: 'a', source: ff.id, sourceHandle: 'out-0', target: not.id, targetHandle: 'in-0' },
      { id: 'b', source: not.id, sourceHandle: 'out-0', target: ff.id, targetHandle: 'in-0' },
    ];
    expect(circuitStats([ff, not], toggle)).toMatchObject({ gates: 1, memoryParts: 1, levels: 1, hasLoop: false });

    const [n1, n2] = [createPart('NOT', { x: 0, y: 0 }, []), createPart('NOT', { x: 150, y: 0 }, [])];
    const ring = [
      { id: 'c', source: n1.id, sourceHandle: 'out-0', target: n2.id, targetHandle: 'in-0' },
      { id: 'd', source: n2.id, sourceHandle: 'out-0', target: n1.id, targetHandle: 'in-0' },
    ];
    expect(circuitStats([n1, n2], ring).hasLoop).toBe(true);
  });

  it('is empty for a circuit without logic', () => {
    expect(circuitStats([createPart('INPUT', { x: 0, y: 0 }, [])], [])).toMatchObject({ gates: 0, levels: 0, longestPath: [] });
  });
});
