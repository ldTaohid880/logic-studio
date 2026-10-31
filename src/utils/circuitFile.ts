import { Node, Edge } from '@xyflow/react';
import { NodeData } from '../types/circuit';
import { CustomComponentDefinition } from '../types/customComponent';
import { detectComponentRecursion } from '../simulation/customComponentLogic';
import { makeId } from './ids';

export type ParsedCircuitFile =
  | {
      ok: true;
      nodes: Node[];
      edges: Edge[];
      /** Definitions to add to the library (already renamed where they clashed). */
      components: Record<string, CustomComponentDefinition>;
      /** Definitions that shared an id with a different library entry and were added under a new id. */
      renamed: number;
      /** Expected outputs saved with the circuit ("check my circuit"), or an empty string. */
      expected: string;
    }
  | { ok: false; error: string };

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const isNode = (v: unknown): v is Node =>
  isObject(v) && typeof v.id === 'string' && isObject(v.data) && typeof v.data.gateType === 'string';

const isEdge = (v: unknown): v is Edge => isObject(v) && typeof v.source === 'string' && typeof v.target === 'string';

const isDefinition = (v: unknown): v is CustomComponentDefinition =>
  isObject(v) &&
  typeof v.id === 'string' &&
  typeof v.name === 'string' &&
  Array.isArray(v.nodes) &&
  Array.isArray(v.edges) &&
  Array.isArray(v.inputs) &&
  Array.isArray(v.outputs);

// Point custom component instances at their new ids; their cached internals belong to the old definition
const remapInstances = (nodes: Node[], idMap: Map<string, string>): Node[] =>
  nodes.map((node) => {
    const data = node.data as unknown as NodeData;
    const newId = data.customComponentId && idMap.get(data.customComponentId);
    if (!newId) return node;
    const { subcircuitNodeStates: _cached, ...rest } = data;
    return { ...node, data: { ...rest, customComponentId: newId } as unknown as Record<string, unknown> };
  });

/**
 * Checks a saved circuit file before it is opened: drops malformed parts and wires, adds custom components
 * that aren't in the library yet, gives a new id to any that clash with a different library entry, and
 * rejects files whose components contain themselves.
 */
export function parseCircuitFile(json: unknown, library: Record<string, CustomComponentDefinition>): ParsedCircuitFile {
  if (!isObject(json) || !Array.isArray(json.nodes) || !Array.isArray(json.edges)) {
    return { ok: false, error: 'Invalid circuit file: it has no parts or wires list' };
  }

  let nodes = json.nodes.filter(isNode);
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = json.edges
    .filter(isEdge)
    .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map((e) => (typeof e.id === 'string' ? e : { ...e, id: makeId('edge') }));

  const incoming = isObject(json.customComponents) ? Object.values(json.customComponents).filter(isDefinition) : [];

  // Same id and same version as the library: already there. Same id, different version: add it under a new id.
  const idMap = new Map<string, string>();
  const toAdd: CustomComponentDefinition[] = [];
  incoming.forEach((def) => {
    const existing = library[def.id];
    if (existing && existing.updatedAt === def.updatedAt) return;
    if (existing) {
      const newId = makeId('custom');
      idMap.set(def.id, newId);
      toAdd.push({ ...def, id: newId, name: `${def.name} (from file)` });
    } else {
      toAdd.push(def);
    }
  });

  const components: Record<string, CustomComponentDefinition> = {};
  toAdd.forEach((def) => {
    components[def.id] = idMap.size > 0 ? { ...def, nodes: remapInstances(def.nodes, idMap) } : def;
  });
  if (idMap.size > 0) nodes = remapInstances(nodes, idMap);

  const merged = { ...library, ...components };
  const recursive = Object.values(components).find((def) =>
    def.nodes.some((n) => {
      const childId = (n.data as unknown as NodeData)?.customComponentId;
      return !!childId && detectComponentRecursion(childId, def.id, merged);
    })
  );
  if (recursive) {
    return { ok: false, error: `Cannot open this file: the component "${recursive.name}" contains itself` };
  }

  return { ok: true, nodes, edges, components, renamed: idMap.size, expected: typeof json.expected === 'string' ? json.expected : '' };
}
