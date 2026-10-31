import { Node, Edge } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { CustomComponentDefinition, CustomPinDefinition } from '../../types/customComponent';
import { detectComponentRecursion } from '../../simulation/customComponentLogic';
import { exportCustomComponentToJSON, parseCustomComponentFromJSON } from '../../utils/customComponentIO';
import { makeId, getInitialCustomComponents, saveCustomComponentsToStorage } from '../helpers';
import { CircuitStore, StoreSlice } from '../types';

// Custom component library and subcircuit hierarchy navigation
export type CustomComponentsSlice = Pick<CircuitStore,
  | 'customComponents'
  | 'hierarchyPath'
  | 'rootCircuitState'
  | 'addCustomComponent'
  | 'updateCustomComponent'
  | 'deleteCustomComponent'
  | 'toggleFavoriteCustomComponent'
  | 'convertSelectionToCustomComponent'
  | 'instantiateCustomComponent'
  | 'enterSubcircuitView'
  | 'exitSubcircuitView'
  | 'findCustomComponentInstances'
  | 'importCustomComponentJSON'
  | 'exportCustomComponentJSON'
>;

export const createCustomComponentsSlice: StoreSlice<CustomComponentsSlice> = (set, get) => ({
  customComponents: getInitialCustomComponents(),
  hierarchyPath: [{ id: 'root', name: 'Main Project' }],
  rootCircuitState: null,
  addCustomComponent: (def: CustomComponentDefinition) => {
    const customComponents = { ...get().customComponents, [def.id]: def };
    set({ customComponents });
    saveCustomComponentsToStorage(customComponents);
  },

  updateCustomComponent: (id: string, updates: Partial<CustomComponentDefinition>) => {
    const existing = get().customComponents[id];
    if (!existing) return;
    const updatedComp = { ...existing, ...updates, updatedAt: Date.now() };
    const customComponents = { ...get().customComponents, [id]: updatedComp };
    set({ customComponents });
    saveCustomComponentsToStorage(customComponents);
  },

  deleteCustomComponent: (id: string) => {
    // Refuse while instances exist: they would silently stop producing outputs
    const { nodes, rootCircuitState } = get();
    const usesComponent = (list: Node[]) =>
      list.some((n) => (n.data as unknown as NodeData).customComponentId === id);
    const usedOnCanvas = usesComponent(nodes) || (!!rootCircuitState && usesComponent(rootCircuitState.nodes));
    const usedBy = Object.values(get().customComponents).filter((c) => c.id !== id && usesComponent(c.nodes || []));
    if (usedOnCanvas || usedBy.length > 0) {
      const where = [usedOnCanvas ? 'the canvas' : '', ...usedBy.map((c) => `"${c.name}"`)].filter(Boolean).join(', ');
      get().showToast(`Cannot delete: component is still used in ${where}.`);
      return;
    }

    const customComponents = { ...get().customComponents };
    delete customComponents[id];
    set({ customComponents });
    saveCustomComponentsToStorage(customComponents);
  },

  toggleFavoriteCustomComponent: (id: string) => {
    const comp = get().customComponents[id];
    if (!comp) return;
    get().updateCustomComponent(id, { isFavorite: !comp.isFavorite });
  },

  convertSelectionToCustomComponent: (
    name: string,
    category: string,
    description: string = '',
    customPins?: { inputs: CustomPinDefinition[]; outputs: CustomPinDefinition[] },
    color: string = '#10b981',
    targetNodeIds?: string[]
  ) => {
    const { nodes, edges } = get();
    const selectedNodes = targetNodeIds && targetNodeIds.length > 0
      ? nodes.filter((n) => targetNodeIds.includes(n.id))
      : nodes.filter((n) => n.selected);
    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    const compId = makeId(`custom_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);

    const inputs = customPins?.inputs || [];
    const outputs = customPins?.outputs || [];

    // If 0 nodes selected, create a new subcircuit from scratch with template input/output nodes
    if (selectedNodes.length === 0) {
      const templateNodes: Node[] = [];

      inputs.forEach((p, idx) => {
        const inNodeId = p.internalNodeId || makeId(`in-node-${idx}`);
        p.internalNodeId = inNodeId;
        templateNodes.push({
          id: inNodeId,
          type: 'digitalInput',
          position: { x: 80, y: 100 + idx * 90 },
          data: {
            label: p.name,
            gateType: 'INPUT',
            inputs: [],
            outputs: [{ id: 'out-0', name: 'OUT', value: 0 }],
          },
        });
      });

      outputs.forEach((p, idx) => {
        const outNodeId = p.internalNodeId || makeId(`out-node-${idx}`);
        p.internalNodeId = outNodeId;
        templateNodes.push({
          id: outNodeId,
          type: 'digitalOutput',
          position: { x: 500, y: 100 + idx * 90 },
          data: {
            label: p.name,
            gateType: 'OUTPUT',
            inputs: [{ id: 'in-0', name: 'IN', value: 0 }],
            outputs: [],
          },
        });
      });

      const newDefinition: CustomComponentDefinition = {
        id: compId,
        name,
        category: category || 'Custom Components',
        description,
        color,
        inputs,
        outputs,
        nodes: templateNodes,
        edges: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const customComponents = { ...get().customComponents, [compId]: newDefinition };
      saveCustomComponentsToStorage(customComponents);

      set({ customComponents });
      get().enterSubcircuitView(compId);
      return compId;
    }

    // Filter edges internal to selection
    const internalEdges = edges.filter((e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target));
    const externalIncomingEdges = edges.filter((e) => !selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target));
    const externalOutgoingEdges = edges.filter((e) => selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target));

    const newDefinition: CustomComponentDefinition = {
      id: compId,
      name,
      category: category || 'Custom Components',
      description,
      color,
      inputs,
      outputs,
      nodes: JSON.parse(JSON.stringify(selectedNodes.map((n) => ({ ...n, selected: false })))),
      edges: JSON.parse(JSON.stringify(internalEdges)),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Bounding box center for position
    const avgX = selectedNodes.reduce((sum, n) => sum + n.position.x, 0) / selectedNodes.length;
    const avgY = selectedNodes.reduce((sum, n) => sum + n.position.y, 0) / selectedNodes.length;

    const customNodeId = makeId('custom-node');
    const customNode: Node = {
      id: customNodeId,
      type: 'customNode',
      position: { x: avgX, y: avgY },
      data: {
        label: name,
        gateType: 'CUSTOM',
        customComponentId: compId,
        inputs: inputs.map((p) => ({ id: p.id, name: p.name, value: -1 })),
        outputs: outputs.map((p) => ({ id: p.id, name: p.name, value: -1 })),
      },
    };

    // Re-route external edges
    const reRoutedEdges: Edge[] = [];
    externalIncomingEdges.forEach((e) => {
      const targetPin = inputs.find((p) => p.internalNodeId === e.target) || inputs[0];
      if (targetPin) {
        reRoutedEdges.push({
          ...e,
          id: `e-${e.source}-${e.sourceHandle || '0'}-${customNodeId}-${targetPin.id}`,
          target: customNodeId,
          targetHandle: targetPin.id,
        });
      }
    });

    externalOutgoingEdges.forEach((e) => {
      const sourcePin = outputs.find((p) => p.internalNodeId === e.source) || outputs[0];
      if (sourcePin) {
        reRoutedEdges.push({
          ...e,
          id: `e-${customNodeId}-${sourcePin.id}-${e.target}-${e.targetHandle || '0'}`,
          source: customNodeId,
          sourceHandle: sourcePin.id,
        });
      }
    });

    const remainingNodes = nodes.filter((n) => !selectedNodeIds.has(n.id));
    const remainingEdges = edges.filter(
      (e) => !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target)
    );

    const nextNodes = [...remainingNodes, customNode];
    const nextEdges = [...remainingEdges, ...reRoutedEdges];

    const customComponents = { ...get().customComponents, [compId]: newDefinition };
    saveCustomComponentsToStorage(customComponents);

    set({
      customComponents,
      nodes: nextNodes,
      edges: nextEdges,
    });

    get().saveHistory();
    get().tickSimulation();

    return compId;
  },

  instantiateCustomComponent: (customComponentId: string, position: { x: number; y: number }) => {
    const def = get().customComponents[customComponentId];
    if (!def) return;

    const currentPath = get().hierarchyPath;
    if (currentPath.length > 1) {
      const currentParentId = currentPath[currentPath.length - 1].id;
      if (detectComponentRecursion(customComponentId, currentParentId, get().customComponents)) {
        get().showToast(`Cannot add "${def.name}": Recursion detected! Component cannot contain itself.`);
        return;
      }
    }

    get().saveHistory();

    const nodeId = makeId(`custom-${customComponentId.replace(/[^a-zA-Z0-9]/g, '')}`);
    const newNode: Node = {
      id: nodeId,
      type: 'customNode',
      position,
      data: {
        label: def.name,
        gateType: 'CUSTOM',
        customComponentId,
        inputs: def.inputs.map((p) => ({ id: p.id, name: p.name, value: -1 })),
        outputs: def.outputs.map((p) => ({ id: p.id, name: p.name, value: -1 })),
      },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
    }));

    get().tickSimulation();
  },

  enterSubcircuitView: (componentId: string, instanceId?: string) => {
    const { hierarchyPath, customComponents, nodes, edges, rootCircuitState } = get();
    const targetComp = customComponents[componentId];
    if (!targetComp) return;

    if (hierarchyPath.length > 1) {
      const currentEditingId = hierarchyPath[hierarchyPath.length - 1].id;
      if (detectComponentRecursion(componentId, currentEditingId, customComponents)) {
        get().showToast('Recursion detected! Component cannot edit itself recursively.');
        return;
      }
    }

    if (hierarchyPath.length === 1) {
      set({ rootCircuitState: { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) } });
    } else {
      const currentId = hierarchyPath[hierarchyPath.length - 1].id;
      const updatedComponents = {
        ...customComponents,
        [currentId]: {
          ...customComponents[currentId],
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
          updatedAt: Date.now(),
        },
      };
      set({ customComponents: updatedComponents });
      saveCustomComponentsToStorage(updatedComponents);
    }

    const newPath = [...hierarchyPath, { id: componentId, name: targetComp.name, instanceId }];
    set({
      hierarchyPath: newPath,
      nodes: JSON.parse(JSON.stringify(targetComp.nodes || [])),
      edges: JSON.parse(JSON.stringify(targetComp.edges || [])),
      selectedNodeId: null,
      selectedEdgeId: null,
      // Undo snapshots belong to the level they were taken on; replaying them here would swap circuits
      historyPast: [],
      historyFuture: [],
    });

    get().tickSimulation();
  },

  exitSubcircuitView: (targetDepth: number = 0) => {
    const { hierarchyPath, customComponents, nodes, edges, rootCircuitState } = get();
    if (hierarchyPath.length <= 1) return;

    const currentId = hierarchyPath[hierarchyPath.length - 1].id;
    const updatedCustomComponents = {
      ...customComponents,
      [currentId]: {
        ...customComponents[currentId],
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        updatedAt: Date.now(),
      },
    };
    saveCustomComponentsToStorage(updatedCustomComponents);

    const newPath = hierarchyPath.slice(0, targetDepth + 1);

    if (newPath.length === 1 && rootCircuitState) {
      set({
        customComponents: updatedCustomComponents,
        hierarchyPath: newPath,
        nodes: rootCircuitState.nodes,
        edges: rootCircuitState.edges,
        selectedNodeId: null,
        selectedEdgeId: null,
        historyPast: [],
        historyFuture: [],
      });
    } else {
      const parentId = newPath[newPath.length - 1].id;
      const parentComp = updatedCustomComponents[parentId];
      set({
        customComponents: updatedCustomComponents,
        hierarchyPath: newPath,
        nodes: parentComp ? JSON.parse(JSON.stringify(parentComp.nodes)) : [],
        edges: parentComp ? JSON.parse(JSON.stringify(parentComp.edges)) : [],
        selectedNodeId: null,
        selectedEdgeId: null,
        historyPast: [],
        historyFuture: [],
      });
    }

    get().tickSimulation();
  },

  findCustomComponentInstances: (componentId: string) => {
    const { nodes } = get();
    const matchingNodeIds = nodes
      .filter(
        (n) =>
          (n.data as unknown as NodeData).gateType === 'CUSTOM' &&
          (n.data as unknown as NodeData).customComponentId === componentId
      )
      .map((n) => n.id);

    if (matchingNodeIds.length === 0) {
      get().showToast('No instances of this component placed on canvas');
      return;
    }

    const updatedNodes = nodes.map((n) => ({
      ...n,
      selected: matchingNodeIds.includes(n.id),
    }));

    set({ nodes: updatedNodes, selectedNodeId: matchingNodeIds[0] });
    get().showToast(`Found ${matchingNodeIds.length} instance(s) on canvas`);
  },

  importCustomComponentJSON: (jsonString: string) => {
    try {
      const { component, dependencies } = parseCustomComponentFromJSON(jsonString);
      if (!component || !component.id || !component.name) return false;

      const updatedComponents = {
        ...get().customComponents,
        ...dependencies,
        [component.id]: component,
      };

      // Reject definitions that (directly or through dependencies) contain themselves
      const imported = [component, ...Object.values(dependencies)];
      const isRecursive = imported.some((def) =>
        (def.nodes || []).some((n) => {
          const childId = (n.data as unknown as NodeData)?.customComponentId;
          return !!childId && detectComponentRecursion(childId, def.id, updatedComponents);
        })
      );
      if (isRecursive) {
        get().showToast('Import rejected: the component contains itself.');
        return false;
      }

      set({ customComponents: updatedComponents });
      saveCustomComponentsToStorage(updatedComponents);
      return true;
    } catch (e) {
      console.error('Failed to import subcircuit JSON', e);
      return false;
    }
  },

  exportCustomComponentJSON: (componentId: string) => {
    try {
      return exportCustomComponentToJSON(componentId, get().customComponents);
    } catch (e) {
      console.error('Failed to export subcircuit JSON', e);
      return null;
    }
  },
});
