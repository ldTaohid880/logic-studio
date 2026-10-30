import { Node, Edge } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { detectComponentRecursion } from '../../simulation/customComponentLogic';
import { makeId } from '../helpers';
import { CircuitStore, StoreSlice } from '../types';

// Copy, cut, paste and duplicate of the selection
export type ClipboardSlice = Pick<CircuitStore, 'duplicateSelected' | 'copySelected' | 'cutSelected' | 'pasteClipboard'>;

// Copied parts and the wires between them; in memory only, shared by every hierarchy level
let clipboard: { nodes: Node[]; edges: Edge[] } | null = null;

export const createClipboardSlice: StoreSlice<ClipboardSlice> = (set, get) => ({
  duplicateSelected: () => {
    get().copySelected();
    get().pasteClipboard();
  },

  copySelected: () => {
    const { nodes, edges, selectedNodeId } = get();
    const selectedNodes = nodes.filter((n) => n.selected || n.id === selectedNodeId);
    if (selectedNodes.length === 0) return;

    const selectedIds = new Set(selectedNodes.map((n) => n.id));
    const internalEdges = edges.filter((e) => selectedIds.has(e.source) && selectedIds.has(e.target));

    clipboard = {
      nodes: JSON.parse(JSON.stringify(selectedNodes)),
      edges: JSON.parse(JSON.stringify(internalEdges)),
    };

    get().showToast(`Copied ${selectedNodes.length} item${selectedNodes.length > 1 ? 's' : ''} to clipboard`);
  },

  cutSelected: () => {
    get().copySelected();
    get().deleteSelected();
    get().showToast('Cut items to clipboard');
  },

  pasteClipboard: () => {
    if (!clipboard) return;
    const { nodes: rawNodes, edges: rawEdges } = clipboard;
    const idMap = new Map<string, string>();

    // Pasting an instance of the component being edited (or one that contains it) would make it recursive
    const currentPath = get().hierarchyPath;
    if (currentPath.length > 1) {
      const editingId = currentPath[currentPath.length - 1].id;
      const recursive = rawNodes.some((node) => {
        const nd = node.data as unknown as NodeData;
        return nd.gateType === 'CUSTOM' && !!nd.customComponentId &&
          detectComponentRecursion(nd.customComponentId, editingId, get().customComponents);
      });
      if (recursive) {
        get().showToast('Cannot paste: a component cannot contain itself.');
        return;
      }
    }

    get().saveHistory();

    rawNodes.forEach((node) => idMap.set(node.id, makeId(node.type || 'node')));
    const newNodes: Node[] = rawNodes.map((node) => {
      // Children of a copied group keep their place inside it; everything else shifts so the copy is visible
      const insideCopiedGroup = !!node.parentId && idMap.has(node.parentId);
      return {
        ...node,
        id: idMap.get(node.id)!,
        position: insideCopiedGroup ? { ...node.position } : { x: node.position.x + 40, y: node.position.y + 40 },
        selected: true,
        data: JSON.parse(JSON.stringify(node.data)),
      };
    });

    // Re-link parentId if parent group was also copied
    newNodes.forEach((node) => {
      if (node.parentId && idMap.has(node.parentId)) {
        node.parentId = idMap.get(node.parentId);
      } else if (node.parentId && !idMap.has(node.parentId)) {
        // If parent wasn't copied, make node top-level
        delete node.parentId;
      }
    });

    const newEdges: Edge[] = rawEdges.map((edge) => {
      const newSource = idMap.get(edge.source) || edge.source;
      const newTarget = idMap.get(edge.target) || edge.target;
      return {
        ...edge,
        id: makeId('edge'),
        source: newSource,
        target: newTarget,
        type: 'signalEdge',
        data: {
          ...edge.data,
          signalValue: -1,
        },
      };
    });

    const updatedExistingNodes = get().nodes.map((n) => ({ ...n, selected: false }));
    set({
      nodes: [...updatedExistingNodes, ...newNodes],
      edges: [...get().edges, ...newEdges],
      selectedNodeId: newNodes.length === 1 ? newNodes[0].id : null,
    });

    get().tickSimulation();
    get().showToast(`Pasted ${newNodes.length} item${newNodes.length > 1 ? 's' : ''}`);
  },
});
