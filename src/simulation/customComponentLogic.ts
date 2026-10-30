import { Node, Edge } from '@xyflow/react';
import { NodeData, SignalValue } from '../types/circuit';
import { CustomComponentDefinition } from '../types/customComponent';

export function evaluateCustomComponentLogic(
  data: NodeData,
  customComponentsMap: Record<string, CustomComponentDefinition>,
  propagateSignalsFn: (nodes: Node[], edges: Edge[]) => { nodes: Node[]; edges: Edge[]; hasChanged: boolean }
): { updatedOutputs: Record<string, SignalValue>; internalNodeStates: Record<string, any>; hasChanged: boolean } {
  if (!data.customComponentId) {
    return { updatedOutputs: {}, internalNodeStates: {}, hasChanged: false };
  }

  const def = customComponentsMap[data.customComponentId];
  if (!def) {
    return { updatedOutputs: {}, internalNodeStates: {}, hasChanged: false };
  }

  // Retrieve or initialize instance internal nodes
  let internalNodes: Node[] = [];
  const existingStates = data.subcircuitNodeStates;

  if (existingStates && Array.isArray(existingStates.nodes) && existingStates.defVersion === def.updatedAt) {
    internalNodes = existingStates.nodes.map((n: Node) => ({
      ...n,
      data: structuredClone(n.data),
    }));
  } else {
    // Clone template nodes from definition (first use, or the definition was edited since the last evaluation)
    const previousById = new Map<string, NodeData>(
      Array.isArray(existingStates?.nodes)
        ? existingStates!.nodes.map((n: Node) => [n.id, n.data as unknown as NodeData])
        : []
    );
    internalNodes = def.nodes.map((n) => {
      const nodeData = structuredClone(n.data) as unknown as NodeData;
      // Keep sequential memory of nodes that survived the edit unchanged in type
      const previous = previousById.get(n.id);
      if (previous && previous.gateType === nodeData.gateType) {
        if (previous.icState) nodeData.icState = previous.icState;
        if (previous.subcircuitNodeStates) nodeData.subcircuitNodeStates = previous.subcircuitNodeStates;
      }
      return { ...n, data: nodeData as unknown as Record<string, unknown> };
    });
  }

  const internalEdges = def.edges || [];

  // Filter internal input nodes
  const internalInputNodes = internalNodes.filter((n) => {
    const nd = n.data as unknown as NodeData;
    return ['INPUT', 'PUSH_BUTTON', 'CONST_HIGH', 'CONST_LOW'].includes(nd.gateType);
  });

  // Map instance input pin values to internal subcircuit input nodes
  data.inputs.forEach((inPin, pinIdx) => {
    const pinDef = def.inputs.find((p) => p.id === inPin.id) || def.inputs.find((p) => p.name === inPin.name) || def.inputs[pinIdx];

    // Locate target internal input node
    const targetInternalNode =
      internalNodes.find((n) => pinDef?.internalNodeId && n.id === pinDef.internalNodeId) ||
      internalNodes.find((n) => (n.data as unknown as NodeData).label === inPin.name || (n.data as unknown as NodeData).label === pinDef?.name) ||
      internalInputNodes[pinIdx];

    if (targetInternalNode) {
      const nd = targetInternalNode.data as unknown as NodeData;
      
      // If a specific input pin ID is targeted, update that pin in inputs array
      if (pinDef?.internalPinId && nd.inputs) {
        const targetPin = nd.inputs.find((p) => p.id === pinDef.internalPinId);
        if (targetPin) {
          targetPin.value = inPin.value;
        }
      }

      // If it's a source node (INPUT, etc.), update its value and outputs
      if (['INPUT', 'PUSH_BUTTON', 'CONST_HIGH', 'CONST_LOW'].includes(nd.gateType)) {
        nd.value = inPin.value;
        if (nd.outputs && nd.outputs.length > 0) {
          nd.outputs.forEach((out) => {
            out.value = inPin.value;
          });
        }
      }
    }
  });

  // Execute signal propagation inside the subcircuit
  const propRes = propagateSignalsFn(internalNodes, internalEdges);
  const evaluatedNodes = propRes.nodes;

  // Extract internal output node values back to instance output pins
  const updatedOutputs: Record<string, SignalValue> = {};

  const internalOutputNodes = evaluatedNodes.filter((n) => {
    const nd = n.data as unknown as NodeData;
    return ['OUTPUT', 'LOGIC_PROBE', 'SEVEN_SEGMENT', 'HEX_DISPLAY'].includes(nd.gateType);
  });

  data.outputs.forEach((outPin, pinIdx) => {
    const pinDef = def.outputs.find((p) => p.id === outPin.id) || def.outputs.find((p) => p.name === outPin.name) || def.outputs[pinIdx];

    // Locate source internal node
    const sourceInternalNode =
      evaluatedNodes.find((n) => pinDef?.internalNodeId && n.id === pinDef.internalNodeId) ||
      evaluatedNodes.find((n) => (n.data as unknown as NodeData).label === outPin.name || (n.data as unknown as NodeData).label === pinDef?.name) ||
      internalOutputNodes[pinIdx];

    if (sourceInternalNode) {
      const nd = sourceInternalNode.data as unknown as NodeData;

      // If a specific output pin ID is targeted, read that pin's value
      if (pinDef?.internalPinId && nd.outputs && nd.outputs.length > 0) {
        const targetPin = nd.outputs.find((p) => p.id === pinDef.internalPinId);
        if (targetPin) {
          updatedOutputs[outPin.id] = targetPin.value;
        } else {
          updatedOutputs[outPin.id] = nd.outputs[0]?.value ?? nd.value ?? 0;
        }
      } else if (pinDef?.internalPinId && nd.inputs && nd.inputs.length > 0) {
        // If targeted to an output node's input pin (which is common for OUTPUT nodes)
        const targetPin = nd.inputs.find((p) => p.id === pinDef.internalPinId);
        updatedOutputs[outPin.id] = targetPin ? targetPin.value : (nd.value !== undefined ? nd.value : 0);
      } else {
        // Standard mapping logic
        if (['OUTPUT', 'LOGIC_PROBE'].includes(nd.gateType)) {
          updatedOutputs[outPin.id] = nd.value !== undefined ? nd.value : (nd.inputs[0]?.value ?? 0);
        } else if (nd.outputs && nd.outputs.length > 0) {
          updatedOutputs[outPin.id] = nd.outputs[0]?.value ?? 0;
        } else {
          updatedOutputs[outPin.id] = nd.value !== undefined ? nd.value : 0;
        }
      }
    } else {
      // No internal node backs this pin: report it as floating instead of reading an unrelated node
      updatedOutputs[outPin.id] = -1;
    }
  });

  return {
    updatedOutputs,
    internalNodeStates: { nodes: evaluatedNodes, defVersion: def.updatedAt },
    hasChanged: propRes.hasChanged,
  };
}

/**
 * Detect if adding targetComponentId into parentComponentId would cause circular dependency.
 */
export function detectComponentRecursion(
  targetComponentId: string,
  parentComponentId: string,
  customComponentsMap: Record<string, CustomComponentDefinition>
): boolean {
  if (targetComponentId === parentComponentId) {
    return true;
  }

  const visited = new Set<string>();
  const queue: string[] = [targetComponentId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (currentId === parentComponentId) {
      return true;
    }

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const def = customComponentsMap[currentId];
    if (!def || !def.nodes) continue;

    for (const node of def.nodes) {
      const nd = node.data as unknown as NodeData;
      if (nd.gateType === 'CUSTOM' && nd.customComponentId) {
        if (nd.customComponentId === parentComponentId) {
          return true;
        }
        if (!visited.has(nd.customComponentId)) {
          queue.push(nd.customComponentId);
        }
      }
    }
  }

  return false;
}
