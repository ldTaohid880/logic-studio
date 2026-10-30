import {
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
} from '@xyflow/react';
import { NodeData, GateType, PinData } from '../../types/circuit';
import { DEFAULT_ENCODER_CONFIG } from '../../types/encoder';
import { createEncoderPins } from '../../utils/encoderPins';
import { DEFAULT_SEVEN_SEGMENT_CONFIG } from '../../types/sevenSegment';
import { createSevenSegmentPins } from '../../utils/sevenSegmentPins';
import { getDefaultICPins } from '../../simulation/icLogic';
import { detectComponentRecursion } from '../../simulation/customComponentLogic';
import { markRemovedWireTargets, makeId, initialCircuit } from '../helpers';
import { CircuitStore, StoreSlice } from '../types';

// Switches are named A, B, C... and LEDs Y, Y1, Y2..., skipping names already on the canvas
function nextFreeLabel(nodes: Node[], gateType: 'INPUT' | 'OUTPUT'): string {
  const used = new Set(
    nodes
      .map((n) => n.data as unknown as NodeData)
      .filter((d) => (gateType === 'INPUT' ? d?.gateType === 'INPUT' || d?.gateType === 'PUSH_BUTTON' : d?.gateType === gateType))
      .map((d) => d.label)
  );
  const candidates =
    gateType === 'INPUT'
      ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      : ['Y', ...Array.from({ length: 25 }, (_, i) => `Y${i + 1}`)];
  return candidates.find((c) => !used.has(c)) ?? (gateType === 'INPUT' ? 'In' : 'Out');
}

// Canvas editing: nodes, wires, selection, clipboard, grouping, labels
export type EditorSlice = Pick<CircuitStore,
  | 'nodes'
  | 'edges'
  | 'selectedNodeId'
  | 'selectedEdgeId'
  | 'isDragging'
  | 'setIsDragging'
  | 'onNodesChange'
  | 'onEdgesChange'
  | 'onConnect'
  | 'setSelectedNodeId'
  | 'setSelectedEdgeId'
  | 'addNode'
  | 'deleteSelected'
  | 'duplicateSelected'
  | 'copySelected'
  | 'cutSelected'
  | 'pasteClipboard'
  | 'groupSelectedNodes'
  | 'ungroupNode'
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

    // Filter out existing edge connected to the same target handle (inputs can only receive 1 wire)
    const filteredEdges = get().edges.filter(
      (e) => !(e.target === connection.target && e.targetHandle === connection.targetHandle)
    );

    const nextEdges = [...filteredEdges, newEdge];
    set({ edges: nextEdges });

    // Propagate signals immediately
    get().tickSimulation();
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),

  addNode: (gateType: GateType, position: { x: number; y: number }) => {
    get().saveHistory();

    const id = makeId(gateType.toLowerCase());
    let nodeLabel: string = gateType;
    let inputsCount = 2;
    let typeName = 'logicGate';

    if (gateType === 'INPUT') {
      nodeLabel = nextFreeLabel(get().nodes, 'INPUT');
      inputsCount = 0;
      typeName = 'digitalInput';
    } else if (gateType === 'OUTPUT') {
      nodeLabel = nextFreeLabel(get().nodes, 'OUTPUT');
      inputsCount = 1;
      typeName = 'digitalOutput';
    } else if (gateType === 'SEVEN_SEGMENT') {
      nodeLabel = '';
      inputsCount = 4;
      typeName = 'sevenSegment';
    } else if (gateType === 'ENCODER') {
      nodeLabel = 'Encoder';
      typeName = 'encoderNode';
    } else if (gateType === 'PUSH_BUTTON') {
      nodeLabel = nextFreeLabel(get().nodes, 'INPUT');
      inputsCount = 0;
      typeName = 'pushButton';
    } else if (gateType === 'DIP_SWITCH') {
      nodeLabel = '';
      inputsCount = 0;
      typeName = 'dipSwitch';
    } else if (gateType === 'CONST_HIGH') {
      nodeLabel = 'Constant HIGH';
      inputsCount = 0;
      typeName = 'logicGate';
    } else if (gateType === 'CONST_LOW') {
      nodeLabel = 'Constant LOW';
      inputsCount = 0;
      typeName = 'logicGate';
    } else if (gateType === 'LOGIC_PROBE') {
      nodeLabel = '';
      inputsCount = 1;
      typeName = 'logicProbe';
    } else if (gateType === 'HEX_DISPLAY') {
      nodeLabel = '';
      inputsCount = 4;
      typeName = 'hexDisplay';
    } else if (gateType === 'BUS_MONITOR') {
      nodeLabel = '';
      inputsCount = 4;
      typeName = 'busMonitor';
    } else if (gateType === 'BUFFER') {
      nodeLabel = 'Buffer';
      inputsCount = 1;
      typeName = 'logicGate';
    } else if (gateType === 'TRI_STATE_BUFFER') {
      nodeLabel = 'Tri-State Buffer';
      inputsCount = 2;
      typeName = 'logicGate';
    } else if (gateType === 'NOT') {
      inputsCount = 1;
    } else if (['DELAY_ELEMENT', 'TUNNEL', 'TEXT_LABEL'].includes(gateType)) {
      typeName = 'utility';
    } else if (gateType === 'HALF_ADDER') {
      nodeLabel = 'Half Adder';
      typeName = 'icComponent';
    } else if (gateType === 'FULL_ADDER') {
      nodeLabel = 'Full Adder';
      typeName = 'icComponent';
    } else if (gateType === 'ADDER_4BIT') {
      nodeLabel = '4-Bit Adder';
      typeName = 'icComponent';
    } else if ([
      'HALF_ADDER', 'FULL_ADDER', 'ADDER_4BIT',
      'HALF_SUBTRACTOR', 'FULL_SUBTRACTOR', 'MUX_4TO1', 'DEMUX_1TO4',
      'PRIORITY_ENCODER', 'COMPARATOR_4BIT', 'DECODER_BCD_TO_7SEG',
      'D_LATCH', 'JK_FLIPFLOP', 'T_FLIPFLOP', 'REGISTER_4BIT',
      'MUX_8TO1', 'DEMUX_1TO8', 'DECODER_3TO8', 'ENCODER_8TO3',
      'PARITY_GENERATOR', 'PARITY_CHECKER',
      'INCREMENTER_4BIT', 'DECREMENTER_4BIT', 'ADDER_SUBTRACTOR_4BIT',
    ].includes(gateType)) {
      typeName = 'icComponent';
    }

    let inputs: PinData[] = [];
    let outputs: PinData[] = [];

    if (typeName === 'icComponent') {
      const icPins = getDefaultICPins(gateType);
      inputs = icPins.inputs;
      outputs = icPins.outputs;
    } else if (gateType === 'ENCODER') {
      const encConfig = DEFAULT_ENCODER_CONFIG;
      const pins = createEncoderPins(encConfig);
      inputs = pins.inputs;
      outputs = pins.outputs;
    } else if (gateType === 'SEVEN_SEGMENT') {
      const segConfig = DEFAULT_SEVEN_SEGMENT_CONFIG;
      inputs = createSevenSegmentPins(segConfig);
      outputs = [];
    } else if (gateType === 'DIP_SWITCH') {
      inputs = [];
      outputs = Array.from({ length: 4 }, (_, i) => ({ id: `out-${i}`, name: `SW${i + 1}`, value: 0 }));
    } else if (gateType === 'BUS_MONITOR') {
      inputs = Array.from({ length: 4 }, (_, i) => ({ id: `in-${i}`, name: `B${i}`, value: 0 }));
      outputs = [];
    } else if (gateType === 'HEX_DISPLAY') {
      inputs = Array.from({ length: 4 }, (_, i) => ({ id: `in-${i}`, name: `D${i}`, value: 0 }));
      outputs = [];
    } else if (gateType === 'TRI_STATE_BUFFER') {
      inputs = [
        { id: 'in-0', name: 'In', value: -1 },
        { id: 'in-1', name: 'EN', value: 1 },
      ];
      outputs = [{ id: 'out-0', name: 'Out', value: -1 }];
    } else {
      inputs = Array.from({ length: inputsCount }, (_, i) => ({
        id: `in-${i}`,
        name: inputsCount === 1 ? 'In' : `In ${i + 1}`,
        value: -1,
      }));

      outputs = ['OUTPUT', 'LOGIC_PROBE'].includes(gateType) ? [] : [
        { id: 'out-0', name: 'Out', value: gateType === 'INPUT' || gateType === 'CONST_LOW' ? 0 : gateType === 'CONST_HIGH' ? 1 : -1 },
      ];
    }

    const newNode: Node = {
      id,
      type: typeName,
      position,
      data: {
        label: nodeLabel,
        gateType,
        value: gateType === 'CONST_HIGH' ? 1 : 0,
        inputCount: inputsCount,
        inputs,
        outputs,
        ...(gateType === 'HALF_ADDER' ? { customComponentId: 'builtin_half_adder' } : {}),
        ...(gateType === 'FULL_ADDER' ? { customComponentId: 'builtin_full_adder' } : {}),
        ...(gateType === 'DIP_SWITCH' ? { bitWidth: 4, dipValues: [0, 0, 0, 0] } : {}),
        ...(gateType === 'BUS_MONITOR' ? { bitWidth: 4, displayFormat: 'hex' } : {}),
        ...(gateType === 'ENCODER' ? { encoderConfig: DEFAULT_ENCODER_CONFIG } : {}),
        ...(gateType === 'SEVEN_SEGMENT' ? { sevenSegmentConfig: DEFAULT_SEVEN_SEGMENT_CONFIG } : {}),
      } as unknown as Record<string, unknown>,
    };

    set({ nodes: [...get().nodes, newNode], selectedNodeId: id });
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

    (window as any).__circuit_clipboard__ = {
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
    const clipboard = (window as any).__circuit_clipboard__ as
      | { nodes: Node[]; edges: Edge[] }
      | Node
      | undefined;
    if (!clipboard) return;

    const timestamp = Date.now();
    const idMap = new Map<string, string>();

    // Support both multi-node clipboard format and single legacy node clipboard
    const rawNodes: Node[] = Array.isArray((clipboard as any).nodes)
      ? (clipboard as any).nodes
      : [clipboard as Node];
    const rawEdges: Edge[] = Array.isArray((clipboard as any).edges)
      ? (clipboard as any).edges
      : [];

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

    const newNodes: Node[] = rawNodes.map((node, index) => {
      const newId = `${node.type || 'node'}-${timestamp}-${index}`;
      idMap.set(node.id, newId);

      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + 40,
          y: node.position.y + 40,
        },
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

    const newEdges: Edge[] = rawEdges.map((edge, index) => {
      const newSource = idMap.get(edge.source) || edge.source;
      const newTarget = idMap.get(edge.target) || edge.target;
      return {
        ...edge,
        id: `e-${newSource}-${edge.sourceHandle || '0'}-${newTarget}-${edge.targetHandle || '0'}-${timestamp}-${index}`,
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

  groupSelectedNodes: (customLabel?: string) => {
    const { nodes } = get();
    const selectedNodes = nodes.filter((n) => n.selected && n.type !== 'groupNode');
    if (selectedNodes.length === 0) {
      get().showToast('Select components to group');
      return;
    }

    get().saveHistory();

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedNodes.forEach((n) => {
      let x = n.position.x;
      let y = n.position.y;
      if (n.parentId) {
        const parent = nodes.find((p) => p.id === n.parentId);
        if (parent) {
          x += parent.position.x;
          y += parent.position.y;
        }
      }

      const width = (n.measured?.width || n.width || 160);
      const height = (n.measured?.height || n.height || 100);

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    const groupWidth = Math.max(220, (maxX - minX) + 50);
    const groupHeight = Math.max(140, (maxY - minY) + 70);
    const groupX = minX - 25;
    const groupY = minY - 45;

    const groupId = makeId('group');
    const groupLabel = customLabel || `Group (${selectedNodes.length})`;

    const groupNode: Node = {
      id: groupId,
      type: 'groupNode',
      position: { x: groupX, y: groupY },
      style: { width: groupWidth, height: groupHeight },
      selected: true,
      data: {
        label: groupLabel,
        color: 'purple',
      } as unknown as Record<string, unknown>,
    };

    const selectedIds = new Set(selectedNodes.map((n) => n.id));
    const updatedNodes = nodes.map((node) => {
      if (selectedIds.has(node.id)) {
        let absX = node.position.x;
        let absY = node.position.y;
        if (node.parentId) {
          const parent = nodes.find((p) => p.id === node.parentId);
          if (parent) {
            absX += parent.position.x;
            absY += parent.position.y;
          }
        }

        return {
          ...node,
          selected: false,
          parentId: groupId,
          position: {
            x: absX - groupX,
            y: absY - groupY,
          },
          extent: 'parent' as const,
        };
      }
      return { ...node, selected: false };
    });

    set({
      nodes: [groupNode, ...updatedNodes],
      selectedNodeId: groupId,
    });

    get().showToast(`Created ${groupLabel}`);
  },

  ungroupNode: (groupId: string) => {
    const { nodes } = get();
    const groupNode = nodes.find((n) => n.id === groupId);
    if (!groupNode) return;

    get().saveHistory();

    const groupX = groupNode.position.x;
    const groupY = groupNode.position.y;

    const updatedNodes = nodes
      .filter((n) => n.id !== groupId)
      .map((node) => {
        if (node.parentId === groupId) {
          const { parentId, extent, ...rest } = node;
          return {
            ...rest,
            position: {
              x: node.position.x + groupX,
              y: node.position.y + groupY,
            },
            selected: true,
          };
        }
        return node;
      });

    set({
      nodes: updatedNodes,
      selectedNodeId: null,
    });

    get().showToast('Ungrouped selection');
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
                ...(isDip ? { outputs: newPins, dipValues: Array(width).fill(0) } : { inputs: newPins }),
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
