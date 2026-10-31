import { createBusPins } from '../../utils/busPins';
import { visibleCanvasCenter } from '../../utils/canvasBridge';
import {
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
} from '@xyflow/react';
import { NodeData, GateType, PinData } from '../../types/circuit';
import { markRemovedWireTargets, initialCircuit } from '../helpers';
import { createPart } from '../partFactory';
import { CircuitStore, StoreSlice } from '../types';

// Parts whose outputs can float, so several of them may share one wire (a bus)
const BUS_DRIVERS = new Set<string>(['TRI_STATE_BUFFER', 'ARDUINO_UNO', 'OPEN_DRAIN_BUFFER', 'PULL_UP', 'PULL_DOWN', 'LATCH_8BIT']);

// Canvas editing: nodes, wires, selection, part properties and labels
export type EditorSlice = Pick<CircuitStore,
  | 'nodes'
  | 'edges'
  | 'selectedNodeId'
  | 'selectedEdgeId'
  | 'insertCircuit'
  | 'isDragging'
  | 'setIsDragging'
  | 'onNodesChange'
  | 'onEdgesChange'
  | 'onConnect'
  | 'setSelectedNodeId'
  | 'setSelectedEdgeId'
  | 'addNode'
  | 'deleteSelected'
  | 'resetAllInputs'
  | 'toggleLockNode'
  | 'updateNodeLabel'
  | 'updateNodeData'
  | 'setNodeBitWidth'
  | 'updateNodeInputCount'
  | 'updateEdgeLabel'
  | 'updateEdgeColor'
  | 'updatePinAlias'
>;

export const createEditorSlice: StoreSlice<EditorSlice> = (set, get) => ({
  nodes: initialCircuit.nodes,
  edges: initialCircuit.edges,
  selectedNodeId: null,
  selectedEdgeId: null,
  isDragging: false,
  setIsDragging: (isDragging) => set({ isDragging }),
  onNodesChange: (changes) => {
    const updatedNodes = applyNodeChanges(changes, get().nodes);
    set({ nodes: updatedNodes });

    // Process all selection changes sequentially to find the final selected node
    let nextSelectedNodeId = get().selectedNodeId;
    changes.forEach((c) => {
      if (c.type === 'select') {
        if (c.selected) {
          nextSelectedNodeId = c.id;
        } else if (nextSelectedNodeId === c.id) {
          nextSelectedNodeId = null;
        }
      }
    });
    
    if (get().selectedNodeId !== nextSelectedNodeId) {
      set({ selectedNodeId: nextSelectedNodeId });
    }
  },

  onEdgesChange: (changes) => {
    const removedIds = new Set(changes.filter((c) => c.type === 'remove').map((c) => (c as { id: string }).id));
    const removedEdges = get().edges.filter((e) => removedIds.has(e.id));
    const updatedEdges = applyEdgeChanges(changes, get().edges);
    set({ edges: updatedEdges });

    // A removed wire changes what its target sees, so re-propagate
    if (removedEdges.length > 0) {
      set({ nodes: markRemovedWireTargets(get().nodes, removedEdges) });
      get().tickSimulation();
    }

    // Process all selection changes sequentially to find the final selected edge
    let nextSelectedEdgeId = get().selectedEdgeId;
    changes.forEach((c) => {
      if (c.type === 'select') {
        if (c.selected) {
          nextSelectedEdgeId = c.id;
        } else if (nextSelectedEdgeId === c.id) {
          nextSelectedEdgeId = null;
        }
      }
    });

    if (get().selectedEdgeId !== nextSelectedEdgeId) {
      set({ selectedEdgeId: nextSelectedEdgeId });
    }
  },

  onConnect: (connection: Connection) => {
    if (!connection.source || !connection.target) return;

    // Prevent connecting to self or same node
    if (connection.source === connection.target) return;

    // A bus wire only joins pins of the same width (a 4-bit bus to a 4-bit bus pin)
    const pinWidth = (nodeId: string, handle: string | null | undefined, side: 'inputs' | 'outputs') =>
      ((get().nodes.find((n) => n.id === nodeId)?.data as unknown as NodeData | undefined)?.[side] ?? []).find(
        (p) => p.id === (handle || (side === 'inputs' ? 'in-0' : 'out-0'))
      )?.width ?? 1;
    const bits = (n: number) => `${n === 8 ? 'an' : 'a'} ${n}-bit`;
    const fromWidth = pinWidth(connection.source, connection.sourceHandle, 'outputs');
    const toWidth = pinWidth(connection.target, connection.targetHandle, 'inputs');
    if (fromWidth !== toWidth) {
      get().showToast(
        fromWidth > 1 && toWidth > 1
          ? `Cannot connect ${bits(fromWidth)} bus to ${bits(toWidth)} bus pin`
          : `Cannot connect: ${bits(Math.max(fromWidth, toWidth))} bus only connects to a bus pin. Use a bus splitter or joiner`,
        'error'
      );
      return;
    }


    get().saveHistory();

    const newEdge: Edge = {
      id: `e-${connection.source}-${connection.sourceHandle || '0'}-${connection.target}-${connection.targetHandle || '0'}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'signalEdge',
      data: { signalValue: -1 },
    };

    // A new wire on a used input replaces the old one, except on a shared bus: outputs that can float
    // (tri-state buffers, board pins) may all drive the same input, and the engine resolves them together
    const gateTypeOf = (id: string) => (get().nodes.find((n) => n.id === id)?.data as unknown as NodeData | undefined)?.gateType;
    const intoSameInput = (e: Edge) => e.target === connection.target && e.targetHandle === connection.targetHandle;
    const shareable = (id: string) => BUS_DRIVERS.has(gateTypeOf(id) ?? '');
    const keepExisting = shareable(connection.source) && get().edges.filter(intoSameInput).every((e) => shareable(e.source));
    const filteredEdges = get().edges.filter((e) => !intoSameInput(e) || (keepExisting && e.id !== newEdge.id));

    const nextEdges = [...filteredEdges, newEdge];
    set({ edges: nextEdges });

    // Propagate signals immediately
    get().tickSimulation();
  },

  insertCircuit: (newNodes, newEdges) => {
    if (newNodes.length === 0) return;
    get().saveHistory();
    // Centre the new parts in view; they arrive selected so they can be moved together
    const maxX = Math.max(...newNodes.map((n) => n.position.x)) + 90;
    const maxY = Math.max(...newNodes.map((n) => n.position.y)) + 60;
    const center = visibleCanvasCenter();
    const snap = (v: number) => Math.round(v / 15) * 15;
    const dx = snap(center.x - maxX / 2);
    const dy = snap(center.y - maxY / 2);
    set({
      nodes: [
        ...get().nodes.map((n) => (n.selected ? { ...n, selected: false } : n)),
        ...newNodes.map((n) => ({ ...n, position: { x: n.position.x + dx, y: n.position.y + dy }, selected: true })),
      ],
      edges: [...get().edges, ...newEdges],
      selectedNodeId: null,
      selectedEdgeId: null,
    });
    get().tickSimulation();
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),

  addNode: (gateType: GateType, position: { x: number; y: number }) => {
    get().saveHistory();
    const node = createPart(gateType, position, get().nodes);
    set({ nodes: [...get().nodes, node], selectedNodeId: node.id });
    get().tickSimulation();
  },

  deleteSelected: () => {
    const { nodes, edges, selectedNodeId, selectedEdgeId } = get();
    const selectedNodes = nodes.filter((n) => n.selected || n.id === selectedNodeId);
    const selectedEdges = edges.filter((e) => e.selected || e.id === selectedEdgeId);

    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

    get().saveHistory();

    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    const selectedEdgeIds = new Set(selectedEdges.map((e) => e.id));

    // Also include any child nodes inside deleted group nodes
    selectedNodes.forEach((n) => {
      if (n.type === 'groupNode') {
        nodes.forEach((child) => {
          if (child.parentId === n.id) {
            selectedNodeIds.add(child.id);
          }
        });
      }
    });

    const newNodes = nodes.filter((n) => !selectedNodeIds.has(n.id));
    const newEdges = edges.filter(
      (e) => !selectedEdgeIds.has(e.id) && !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target)
    );


    const removedEdges = edges.filter((e) => !newEdges.includes(e));

    set({
      nodes: markRemovedWireTargets(newNodes, removedEdges),
      edges: newEdges,
      selectedNodeId: null,
      selectedEdgeId: null,
    });

    get().tickSimulation();
  },

  resetAllInputs: () => {
    get().saveHistory();
    const updatedNodes = get().nodes.map((n) => {
      const d = n.data as unknown as NodeData;
      if (d.gateType === 'INPUT' || d.gateType === 'PUSH_BUTTON') {
        return { ...n, data: { ...n.data, value: 0 } };
      }
      if (d.gateType === 'DIP_SWITCH' && d.dipValues) {
        return { ...n, data: { ...n.data, dipValues: Array(d.bitWidth || 4).fill(0) } };
      }
      return n;
    });
    set({ nodes: updatedNodes });
    get().tickSimulation(true);
    get().showToast('All inputs reset to LOW (0)');
  },

  toggleLockNode: (nodeId: string) => {
    get().saveHistory();
    const updatedNodes = get().nodes.map((n) => {
      if (n.id === nodeId) {
        const isLocked = !(n.data as unknown as NodeData).isLocked;
        return {
          ...n,
          // Unlocked nodes defer to the canvas-wide lock (React Flow's nodesDraggable)
          draggable: isLocked ? false : undefined,
          data: { ...n.data, isLocked },
        };
      }
      return n;
    });
    set({ nodes: updatedNodes });
    const locked = (updatedNodes.find((n) => n.id === nodeId)?.data as unknown as NodeData | undefined)?.isLocked;
    get().showToast(locked ? 'Part locked in place' : 'Part unlocked', 'info');
  },

  updateNodeLabel: (nodeId: string, label: string) => {
    get().saveHistoryCoalesced(`label:${nodeId}`);
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            label,
          },
        };
      }
      return node;
    });
    set({ nodes });
  },

  updateNodeData: (nodeId, patch, options) => {
    get().saveHistoryCoalesced(`data:${nodeId}:${Object.keys(patch).sort().join(',')}`);
    set({
      nodes: get().nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n)),
    });
    if (options?.propagate) get().tickSimulation(true);
  },

  setNodeBitWidth: (nodeId, width) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const data = node.data as unknown as NodeData;
    const isDip = data.gateType === 'DIP_SWITCH';
    const isBus = data.gateType === 'BUS_JOIN' || data.gateType === 'BUS_SPLIT';
    // The bus pin of a joiner or splitter: its wire goes too, as the other end no longer has the same width
    const busHandle = data.gateType === 'BUS_JOIN' ? 'out-0' : data.gateType === 'BUS_SPLIT' ? 'in-0' : null;
    const newPins: PinData[] = Array.from({ length: width }, (_, i) => ({
      id: isDip ? `out-${i}` : `in-${i}`,
      name: isDip ? `SW${i + 1}` : `B${i}`,
      value: 0,
    }));
    get().saveHistory();
    // Drop wires attached to pins that no longer exist
    const edges = get().edges.filter((e) => {
      const handle = e.source === nodeId ? e.sourceHandle : e.target === nodeId ? e.targetHandle : null;
      if (!handle) return true;
      if (handle === busHandle) return false;
      const idx = parseInt(handle.replace(/^(out|in)-/, ''), 10);
      return Number.isNaN(idx) || idx < width;
    });
    set({
      edges,
      nodes: get().nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                bitWidth: width,
                ...(isBus
                  ? createBusPins(data.gateType, width)
                  : isDip
                  ? { outputs: newPins, dipValues: Array(width).fill(0) }
                  : { inputs: newPins }),
              },
            }
          : n
      ),
    });
    get().tickSimulation(true);
  },

  updateNodeInputCount: (nodeId: string, count: number) => {
    get().saveHistory();

    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const currentInputs = data.inputs || [];
        const newInputs: PinData[] = Array.from({ length: count }, (_, i) => ({
          id: `in-${i}`,
          name: `In ${i + 1}`,
          value: currentInputs[i]?.value ?? -1,
        }));

        return {
          ...node,
          data: {
            ...data,
            inputCount: count,
            inputs: newInputs,
          },
        };
      }
      return node;
    });

    // Clean up edges connected to removed handles
    const newEdges = get().edges.filter((e) => {
      if (e.target === nodeId) {
        const handleIndex = parseInt(e.targetHandle?.replace('in-', '') || '0', 10);
        return handleIndex < count;
      }
      return true;
    });

    set({ nodes, edges: newEdges });
    get().tickSimulation();
  },

  updateEdgeLabel: (edgeId: string, label: string) => {
    get().saveHistoryCoalesced(`edge-label:${edgeId}`);
    const edges = get().edges.map((edge) => {
      if (edge.id === edgeId) {
        return {
          ...edge,
          data: {
            ...edge.data,
            label,
          },
        };
      }
      return edge;
    });
    set({ edges });
  },

  updateEdgeColor: (edgeId: string, color: string | undefined) => {
    get().saveHistory();
    const edges = get().edges.map((edge) => {
      if (edge.id === edgeId) {
        return {
          ...edge,
          data: {
            ...edge.data,
            color,
          },
        };
      }
      return edge;
    });
    set({ edges });
  },

  updatePinAlias: (nodeId: string, pinId: string, alias: string) => {
    get().saveHistoryCoalesced(`alias:${nodeId}:${pinId}`);
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const currentAliases = data.pinAliases || {};
        const nextAliases = { ...currentAliases };
        if (alias.trim() === '') {
          delete nextAliases[pinId];
        } else {
          nextAliases[pinId] = alias;
        }
        return {
          ...node,
          data: {
            ...data,
            pinAliases: nextAliases,
          },
        };
      }
      return node;
    });
    set({ nodes });
  },
});
