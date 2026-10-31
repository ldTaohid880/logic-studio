import { Node, Edge } from '@xyflow/react';
import { NodeData } from '../types/circuit';
import { CustomComponentDefinition } from '../types/customComponent';

/**
 * Circuits shared as links: the circuit (in the same shape as a saved file) is compressed and put in the
 * URL after #circuit=, so it never reaches a server. Opening one goes through openCircuitFile like a file.
 */
export const SHARE_PREFIX = '#circuit=';
/** Links longer than this may be cut short by chat apps and email; the share dialog warns. */
export const LONG_LINK = 8000;

const RUNTIME_DATA = ['icState', 'subcircuitNodeStates', 'encoderState'];

const stripNode = (n: Node): Node => {
  const { selected: _s, dragging: _d, measured: _m, className: _c, ...rest } = n as Node & { measured?: unknown };
  const data = { ...(n.data as Record<string, unknown>) };
  RUNTIME_DATA.forEach((k) => delete data[k]);
  return { ...rest, data } as Node;
};
const stripEdge = (e: Edge): Edge => {
  const { selected: _s, ...rest } = e;
  const data = { ...(e.data ?? {}) } as Record<string, unknown>;
  ['signalValue', 'bus', 'conflict'].forEach((k) => delete data[k]);
  return { ...rest, data };
};

/** The circuit as a file-shaped object, with only the custom components it uses (built-in ones are always there). */
export function sharePayload(
  nodes: Node[],
  edges: Edge[],
  library: Record<string, CustomComponentDefinition>,
  expected: string
): Record<string, unknown> {
  const used: Record<string, CustomComponentDefinition> = {};
  const collect = (list: Node[]) =>
    list.forEach((n) => {
      const id = (n.data as unknown as NodeData)?.customComponentId;
      if (!id || used[id] || id.startsWith('builtin_') || !library[id]) return;
      used[id] = { ...library[id], nodes: library[id].nodes.map(stripNode), edges: library[id].edges.map(stripEdge) };
      collect(library[id].nodes);
    });
  collect(nodes);
  return {
    version: '1.0',
    nodes: nodes.map(stripNode),
    edges: edges.map(stripEdge),
    ...(Object.keys(used).length ? { customComponents: used } : {}),
    ...(expected.trim() ? { expected } : {}),
  };
}

const toBase64Url = (bytes: Uint8Array) => {
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromBase64Url = (text: string) => Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

/** The part after # for a share link. */
export async function encodeShare(payload: unknown): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(payload));
  return SHARE_PREFIX + toBase64Url(await pipe(json, new CompressionStream('deflate-raw')));
}

/** JSON text of a shared circuit, or null when the hash isn't a share link (or is damaged). */
export async function decodeShare(hash: string): Promise<string | null> {
  if (!hash.startsWith(SHARE_PREFIX)) return null;
  try {
    const bytes = await pipe(fromBase64Url(hash.slice(SHARE_PREFIX.length)), new DecompressionStream('deflate-raw'));
    const text = new TextDecoder().decode(bytes);
    JSON.parse(text);
    return text;
  } catch {
    return null;
  }
}
