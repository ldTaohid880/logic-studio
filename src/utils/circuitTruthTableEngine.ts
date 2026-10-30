import { Node, Edge } from '@xyflow/react';
import { NodeData, SignalValue } from '../types/circuit';
import { propagateSignals } from '../simulation/engine';
import { CustomComponentDefinition } from '../types/customComponent';

export interface CircuitSignal {
  id: string;
  nodeId: string;
  label: string;
  type: 'input' | 'internal' | 'output';
  gateType?: string;
  pinId?: string;
}

export interface CircuitAnalysisResult {
  inputs: CircuitSignal[];
  internal: CircuitSignal[];
  outputs: CircuitSignal[];
  hasSequentialLogic: boolean;
  cyclesFound: string[][];
}

export interface TruthTableRowData {
  id: string;
  index: number;
  inputsPattern: number[];
  inputsMap: Record<string, number>;
  internalMap: Record<string, number>;
  outputsMap: Record<string, number>;
  isActive: boolean;
}

export interface CircuitTruthTableData {
  inputs: CircuitSignal[];
  internal: CircuitSignal[];
  outputs: CircuitSignal[];
  rows: TruthTableRowData[];
  hasSequentialLogic: boolean;
}

/**
 * Dynamically analyzes the circuit graph to detect inputs, internal signals, outputs,
 * and feedback loops / sequential logic.
 */
export function analyzeCircuitGraph(nodes: Node[], edges: Edge[]): CircuitAnalysisResult {
  const inputs: CircuitSignal[] = [];
  const internal: CircuitSignal[] = [];
  const outputs: CircuitSignal[] = [];

  // Track connected input handles
  const connectedInputHandles = new Set<string>();
  edges.forEach((edge) => {
    if (edge.target && edge.targetHandle) {
      connectedInputHandles.add(`${edge.target}-${edge.targetHandle}`);
    }
  });

  // Graph adjacency map for cycle detection
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (e.source && e.target) {
      adj.get(e.source)?.push(e.target);
    }
  });

  // Cycle detection via DFS
  let hasSequentialLogic = false;
  const cyclesFound: string[][] = [];
  const visited = new Map<string, number>(); // 0: unvisited, 1: visiting, 2: visited

  function dfs(nodeId: string, path: string[]) {
    visited.set(nodeId, 1);
    path.push(nodeId);

    const neighbors = adj.get(nodeId) || [];
    for (const neighbor of neighbors) {
      const state = visited.get(neighbor) || 0;
      if (state === 1) {
        // Found back-edge / feedback loop!
        hasSequentialLogic = true;
        const cyclePath = path.slice(path.indexOf(neighbor));
        cyclesFound.push(cyclePath);
      } else if (state === 0) {
        dfs(neighbor, path);
      }
    }

    visited.set(nodeId, 2);
    path.pop();
  }

  nodes.forEach((n) => {
    if ((visited.get(n.id) || 0) === 0) {
      dfs(n.id, []);
    }
  });

  // Classify nodes
  nodes.forEach((node) => {
    const data = node.data as unknown as NodeData;
    const nodeLabel = data.label || `${data.gateType || 'Component'} (${node.id.slice(0, 4)})`;

    if (data.gateType === 'INPUT') {
      inputs.push({
        id: node.id,
        nodeId: node.id,
        label: nodeLabel,
        type: 'input',
        gateType: data.gateType,
      });
    } else if (data.gateType === 'OUTPUT' || data.gateType === 'SEVEN_SEGMENT') {
      outputs.push({
        id: node.id,
        nodeId: node.id,
        label: nodeLabel,
        type: 'output',
        gateType: data.gateType,
      });
    } else {
      // Check if gate input pins are unconnected primary inputs
      data.inputs?.forEach((pin, idx) => {
        const pinKey = `${node.id}-${pin.id}`;
        if (!connectedInputHandles.has(pinKey)) {
          inputs.push({
            id: pinKey,
            nodeId: node.id,
            label: `${nodeLabel} - Pin In ${idx + 1}`,
            type: 'input',
            pinId: pin.id,
          });
        }
      });

      // Internal / Gate output signals
      data.outputs?.forEach((outPin, idx) => {
        const isConnectedToOutputNode = edges.some(
          (e) => e.source === node.id && (e.sourceHandle === outPin.id || !e.sourceHandle)
        );

        const sigItem: CircuitSignal = {
          id: `${node.id}-${outPin.id}`,
          nodeId: node.id,
          label: `${nodeLabel}${data.outputs.length > 1 ? ` Out ${idx + 1}` : ''}`,
          type: 'internal',
          gateType: data.gateType,
          pinId: outPin.id,
        };

        // If not connected or feeds an output node directly, mark as output as well if no dedicated output node
        if (!isConnectedToOutputNode) {
          outputs.push({ ...sigItem, type: 'output' });
        } else {
          internal.push(sigItem);
        }
      });
    }
  });

  // Deduplicate signals by ID
  const uniqueInputs = Array.from(new Map(inputs.map((i) => [i.id, i])).values());
  const uniqueOutputs = Array.from(new Map(outputs.map((o) => [o.id, o])).values());
  const uniqueInternal = Array.from(new Map(internal.map((i) => [i.id, i])).values());

  return {
    inputs: uniqueInputs,
    internal: uniqueInternal,
    outputs: uniqueOutputs,
    hasSequentialLogic,
    cyclesFound,
  };
}

/**
 * Asynchronously generates the circuit truth table in chunks to keep UI 60fps responsive.
 */
export async function generateCircuitTruthTableAsync(
  nodes: Node[],
  edges: Edge[],
  analysis: CircuitAnalysisResult,
  options: {
    selectedSignalIds?: Set<string>;
    initialSeqState?: number;
    batchSize?: number;
    onProgress?: (progress: number, current: number, total: number, timeEstMs: number) => void;
    shouldCancel?: () => boolean;
    customComponents?: Record<string, CustomComponentDefinition>;
  } = {}
): Promise<CircuitTruthTableData> {
  const { inputs, internal, outputs, hasSequentialLogic } = analysis;
  const initialSeqState = options.initialSeqState ?? 0;
  const batchSize = options.batchSize ?? 32;

  const totalInputs = inputs.length;
  const totalRows = Math.pow(2, totalInputs);

  // Current canvas active input pattern for matching
  const currentInputsPattern = inputs.map((inp) => {
    const node = nodes.find((n) => n.id === inp.nodeId);
    if (!node) return 0;
    const data = node.data as unknown as NodeData;
    if (inp.pinId) {
      const pin = data.inputs?.find((p) => p.id === inp.pinId);
      return pin && pin.value === 1 ? 1 : 0;
    }
    return data.value === 1 ? 1 : 0;
  });

  const rows: TruthTableRowData[] = [];
  const startTime = Date.now();

  for (let i = 0; i < totalRows; i++) {
    if (options.shouldCancel && options.shouldCancel()) {
      break;
    }

    // Binary pattern for inputs
    const pattern: number[] = [];
    for (let bit = totalInputs - 1; bit >= 0; bit--) {
      pattern.push((i >> bit) & 1);
    }

    // Clone nodes and apply binary inputs
    const clonedNodes: Node[] = nodes.map((node) => {
      const data = { ...(node.data as unknown as NodeData) };
      data.inputs = data.inputs ? data.inputs.map((p) => ({ ...p })) : [];
      data.outputs = data.outputs ? data.outputs.map((p) => ({ ...p })) : [];

      // Every row starts from the same sequential state, not from whatever the canvas currently holds
      delete data.icState;
      delete data.subcircuitNodeStates;

      // Check if node is one of the input signals
      const matchIdx = inputs.findIndex((inp) => inp.nodeId === node.id && !inp.pinId);
      if (matchIdx !== -1) {
        data.value = pattern[matchIdx] as SignalValue;
      }

      // Check for pin level primary inputs
      inputs.forEach((inp, idx) => {
        if (inp.nodeId === node.id && inp.pinId) {
          const pin = data.inputs.find((p) => p.id === inp.pinId);
          if (pin) {
            pin.value = pattern[idx] as SignalValue;
          }
        }
      });

      // If sequential logic, initialize output state
      if (hasSequentialLogic && data.outputs.length > 0) {
        data.outputs.forEach((p) => {
          if (p.value === -1 || p.value === undefined) {
            p.value = initialSeqState as SignalValue;
          }
        });
      }

      return {
        ...node,
        data: data as Record<string, unknown>,
      };
    });

    // Run circuit signal propagation
    const propRes = propagateSignals(clonedNodes, edges, options.customComponents ?? {});
    const resultMap = new Map<string, Node>(propRes.nodes.map((n) => [n.id, n]));

    // Map Inputs
    const inputsMap: Record<string, number> = {};
    inputs.forEach((inp, idx) => {
      inputsMap[inp.id] = pattern[idx];
    });

    // Map Internal Signals
    const internalMap: Record<string, number> = {};
    internal.forEach((sig) => {
      const node = resultMap.get(sig.nodeId);
      if (!node) {
        internalMap[sig.id] = 0;
        return;
      }
      const data = node.data as unknown as NodeData;
      if (sig.pinId) {
        const pin = data.outputs.find((p) => p.id === sig.pinId);
        internalMap[sig.id] = pin ? (pin.value === 1 ? 1 : 0) : 0;
      } else {
        internalMap[sig.id] = data.value === 1 ? 1 : 0;
      }
    });

    // Map Output Signals
    const outputsMap: Record<string, number> = {};
    outputs.forEach((sig) => {
      const node = resultMap.get(sig.nodeId);
      if (!node) {
        outputsMap[sig.id] = 0;
        return;
      }
      const data = node.data as unknown as NodeData;
      if (data.gateType === 'OUTPUT' || data.gateType === 'SEVEN_SEGMENT') {
        outputsMap[sig.id] = data.value === 1 ? 1 : 0;
      } else if (sig.pinId) {
        const pin = data.outputs.find((p) => p.id === sig.pinId);
        outputsMap[sig.id] = pin ? (pin.value === 1 ? 1 : 0) : 0;
      } else {
        outputsMap[sig.id] = data.value === 1 ? 1 : 0;
      }
    });

    const isActive =
      currentInputsPattern.length === pattern.length &&
      pattern.every((v, idx) => v === currentInputsPattern[idx]);

    rows.push({
      id: `c-row-${i}`,
      index: i,
      inputsPattern: pattern,
      inputsMap,
      internalMap,
      outputsMap,
      isActive,
    });

    // Yield control to UI thread every batch
    if (i > 0 && i % batchSize === 0) {
      const elapsed = Date.now() - startTime;
      const avgTimePerRow = elapsed / i;
      const remainingRows = totalRows - i;
      const timeEstMs = remainingRows * avgTimePerRow;
      const progress = Math.round((i / totalRows) * 100);

      if (options.onProgress) {
        options.onProgress(progress, i, totalRows, Math.round(timeEstMs));
      }

      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return {
    inputs,
    internal,
    outputs,
    rows,
    hasSequentialLogic,
  };
}
