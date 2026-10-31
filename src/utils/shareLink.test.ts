import { describe, it, expect } from 'vitest';
import { parseExpressions } from './expression';
import { buildNetlist, layoutNetlist } from './circuitBuilder';
import { decodeShare, encodeShare, sharePayload, SHARE_PREFIX } from './shareLink';
import { parseCircuitFile } from './circuitFile';
import { propagateSignals } from '../simulation/engine';

describe('share links', () => {
  it('round-trips a circuit, without running state, and opens like a file', async () => {
    const built = layoutNetlist(buildNetlist(parseExpressions("S = A ⊕ B\nC = AB + A'B'"), 'basic'));
    const { nodes, edges } = propagateSignals(built.nodes, built.edges, {});
    const selected = nodes.map((n, i) => (i === 0 ? { ...n, selected: true } : n));
    const hash = await encodeShare(sharePayload(selected, edges, {}, 'S = A ⊕ B'));
    expect(hash.startsWith(SHARE_PREFIX)).toBe(true);
    expect(hash).toMatch(/^#circuit=[A-Za-z0-9_-]+$/); // URL-safe

    const text = await decodeShare(hash);
    const parsed = parseCircuitFile(JSON.parse(text!), {});
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.nodes).toHaveLength(nodes.length);
    expect(parsed.edges).toHaveLength(edges.length);
    expect(parsed.expected).toBe('S = A ⊕ B');
    expect(parsed.nodes.some((n) => n.selected)).toBe(false);
    expect(parsed.edges.every((e) => e.data?.signalValue === undefined)).toBe(true);
  });

  it('ignores other hashes and damaged links', async () => {
    expect(await decodeShare('#section')).toBeNull();
    expect(await decodeShare(`${SHARE_PREFIX}not-really-compressed`)).toBeNull();
  });
});
