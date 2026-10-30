import { Node, Edge } from '@xyflow/react';
import { NodeData, SignalValue } from '../types/circuit';
import { evaluateGate } from '../utils/gateLogic';
import { evaluateEncoder } from './encoderLogic';
import { evaluateIC } from './icLogic';
import { DEFAULT_ENCODER_CONFIG } from '../types/encoder';
import { CustomComponentDefinition } from '../types/customComponent';
import { evaluateCustomComponentLogic } from './customComponentLogic';

// Nested custom components deeper than this are treated as unresolvable (guards against recursive definitions)
export const MAX_SUBCIRCUIT_DEPTH = 16;

const IC_GATE_TYPES = new Set<string>([
  'HALF_ADDER', 'FULL_ADDER', 'ADDER_4BIT',
  'HALF_SUBTRACTOR', 'FULL_SUBTRACTOR', 'MUX_4TO1', 'DEMUX_1TO4',
  'PRIORITY_ENCODER', 'COMPARATOR_4BIT', 'DECODER_BCD_TO_7SEG',
  'D_LATCH', 'JK_FLIPFLOP', 'T_FLIPFLOP', 'REGISTER_4BIT',
  'MUX_8TO1', 'DEMUX_1TO8', 'DECODER_3TO8', 'ENCODER_8TO3',
  'PARITY_GENERATOR', 'PARITY_CHECKER',
  'INCREMENTER_4BIT', 'DECREMENTER_4BIT', 'ADDER_SUBTRACTOR_4BIT',
  'DELAY_ELEMENT',
]);

export interface PropagateOptions {
  // Current subcircuit nesting depth (internal)
  depth?: number;
}

export interface PropagateResult {
  nodes: Node[];
  edges: Edge[];
  hasChanged: boolean;
  /** Parts still changing when propagation gave up (oscillation, e.g. a ring of inverters). Empty once settled. */
  unstableNodeIds: string[];
}

export function propagateSignals(
  inputNodes: Node[],
  inputEdges: Edge[],
  customComponentsMap: Record<string, CustomComponentDefinition> = {},
  options: PropagateOptions = {}
): PropagateResult {
  const depth = options.depth ?? 0;

  // Input handles that currently have a wire attached
  const connectedInputs = new Set<string>();
  inputEdges.forEach((edge) => connectedInputs.add(`${edge.target}|${edge.targetHandle || 'in-0'}`));

  // Deep clone or construct updated node state map
  const nodesMap = new Map<string, Node>();
  
  // Clone nodes into our working map
  inputNodes.forEach((node) => {
    const data = { ...(node.data as unknown as NodeData) };
    
    // Deep clone input and output pin arrays
    data.inputs = data.inputs ? data.inputs.map((pin) => ({ ...pin })) : [];

    // A pin whose wire was removed floats instead of keeping its last value
    data.inputs.forEach((pin) => {
      if (pin.driven && !connectedInputs.has(`${node.id}|${pin.id}`)) {
        pin.value = -1;
        pin.driven = false;
      }
    });

    data.outputs = data.outputs ? data.outputs.map((pin) => ({ ...pin })) : [];

    nodesMap.set(node.id, {
      ...node,
      data: data as Record<string, unknown>,
    });
  });

  // Track if any node output or pin value changed
  let overallChanged = false;
  // Last input pattern each custom instance was evaluated with during this call
  const customEvalCache = new Map<string, string>();
  // A signal moves one part per pass, so long chains need more passes than small circuits
  const MAX_ITERATIONS = Math.min(Math.max(12, inputNodes.length + 4), 256);
  // Parts whose outputs changed in the latest pass; if passes run out these are the ones that never settled
  let changedThisPass = new Set<string>();
  // Custom component instances whose own subcircuit doesn't settle
  const unstableInside = new Set<string>();
  let settled = false;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let iterChanged = false;
    changedThisPass = new Set<string>();

    // Step A.1: Tunnel wireless signal propagation pass
    // Only tunnels with a wire on their input drive the label; conflicting drivers resolve to floating
    const tunnelMap = new Map<string, SignalValue>();
    nodesMap.forEach((n) => {
      const d = n.data as unknown as NodeData;
      if (d.gateType === 'TUNNEL' && d.tunnelLabel && d.inputs.length > 0 && connectedInputs.has(`${n.id}|${d.inputs[0].id}`)) {
        const key = d.tunnelLabel.toUpperCase();
        const val = d.inputs[0].value;
        tunnelMap.set(key, tunnelMap.has(key) && tunnelMap.get(key) !== val ? -1 : val);
      }
    });

    nodesMap.forEach((n) => {
      const d = n.data as unknown as NodeData;
      if (d.gateType === 'TUNNEL' && d.tunnelLabel) {
        const matchedVal = tunnelMap.get(d.tunnelLabel.toUpperCase()) ?? -1;
        if (d.outputs.length > 0 && d.outputs[0].value !== matchedVal) {
          d.outputs[0].value = matchedVal;
          iterChanged = true;
          changedThisPass.add(n.id);
        }
      }
    });

    // Step A.2: Map output signals from source pins to connected input pins via edges
    inputEdges.forEach((edge) => {
      const sourceNode = nodesMap.get(edge.source);
      const targetNode = nodesMap.get(edge.target);

      if (!sourceNode || !targetNode) return;

      const sourceData = sourceNode.data as unknown as NodeData;
      const targetData = targetNode.data as unknown as NodeData;

      // Find source pin output value
      let signalVal: SignalValue = -1;
      if (sourceData.gateType === 'INPUT') {
        signalVal = sourceData.value ?? 0;
      } else {
        const outPinHandle = edge.sourceHandle || 'out-0';
        const outPin = sourceData.outputs.find((p) => p.id === outPinHandle);
        signalVal = outPin ? outPin.value : (sourceData.outputs[0]?.value ?? -1);
      }

      // Update target pin value
      const inPinHandle = edge.targetHandle || 'in-0';
      const inPin = targetData.inputs.find((p) => p.id === inPinHandle);
      if (inPin) {
        inPin.driven = true;
        if (inPin.value !== signalVal) {
          inPin.value = signalVal;
          iterChanged = true;
        }
      } else if (targetData.gateType === 'OUTPUT') {
        if (targetData.value !== signalVal) {
          targetData.value = signalVal;
          iterChanged = true;
        }
      }
    });

    // Step B: Re-evaluate gate logic for every node
    nodesMap.forEach((node) => {
      const data = node.data as unknown as NodeData;
      const inputs = data.inputs.map((p) => p.value);

      if (data.gateType === 'TUNNEL') {
        // Tunnel outputs are resolved in the tunnel pass above
      } else if (data.gateType === 'INPUT' || data.gateType === 'PUSH_BUTTON' || data.gateType === 'CONST_HIGH' || data.gateType === 'CONST_LOW') {
        const val = data.gateType === 'CONST_HIGH' ? 1 : data.gateType === 'CONST_LOW' ? 0 : (data.value ?? 0);
        data.outputs.forEach((outPin) => {
          if (outPin.value !== val) {
            outPin.value = val;
            iterChanged = true;
            changedThisPass.add(node.id);
          }
        });
      } else if (data.gateType === 'DIP_SWITCH') {
        const dipVals = data.dipValues || [0, 0, 0, 0];
        data.outputs.forEach((outPin, idx) => {
          const expectedVal = (dipVals[idx] ?? 0) === 1 ? 1 : 0;
          if (outPin.value !== expectedVal) {
            outPin.value = expectedVal;
            iterChanged = true;
            changedThisPass.add(node.id);
          }
        });
      } else if (
        data.gateType === 'OUTPUT' ||
        data.gateType === 'LOGIC_PROBE' ||
        data.gateType === 'SEVEN_SEGMENT' ||
        data.gateType === 'HEX_DISPLAY' ||
        data.gateType === 'BUS_MONITOR'
      ) {
        const val = inputs[0] ?? data.value ?? -1;
        if (data.value !== val) {
          data.value = val;
          iterChanged = true;
          changedThisPass.add(node.id);
        }
      } else if (data.gateType === 'ENCODER') {
        const config = data.encoderConfig || DEFAULT_ENCODER_CONFIG;
        const evalRes = evaluateEncoder(inputs, config);
        data.encoderState = evalRes.state;

        data.outputs.forEach((outPin) => {
          const newPinVal = evalRes.outputPinValues[outPin.id] ?? -1;
          if (outPin.value !== newPinVal) {
            outPin.value = newPinVal;
            iterChanged = true;
            changedThisPass.add(node.id);
          }
        });
      } else if (data.gateType === 'CUSTOM') {
        // Re-running a settled subcircuit with unchanged inputs is a no-op, so skip it (avoids 12^depth work)
        const inputKey = inputs.join(',');
        if (customEvalCache.get(node.id) === inputKey) return;
        customEvalCache.set(node.id, inputKey);

        let updatedOutputs: Record<string, SignalValue> = {};
        if (depth < MAX_SUBCIRCUIT_DEPTH) {
          const evalRes = evaluateCustomComponentLogic(
            data,
            customComponentsMap,
            (nodes, edges) => propagateSignals(nodes, edges, customComponentsMap, { depth: depth + 1 })
          );
          data.subcircuitNodeStates = evalRes.internalNodeStates;
          updatedOutputs = evalRes.updatedOutputs;
          if (evalRes.unstable) unstableInside.add(node.id);
          else unstableInside.delete(node.id);
        }
        data.outputs.forEach((outPin) => {
          const expectedVal = updatedOutputs[outPin.id] ?? -1;
          if (outPin.value !== expectedVal) {
            outPin.value = expectedVal;
            iterChanged = true;
            changedThisPass.add(node.id);
          }
        });
      } else if (IC_GATE_TYPES.has(data.gateType)) {
        const icRes = evaluateIC(data.gateType, inputs, data.icState || {});
        data.icState = icRes.newState;
        data.outputs.forEach((outPin) => {
          const expectedVal = icRes.outputs[outPin.id] ?? 0;
          if (outPin.value !== expectedVal) {
            outPin.value = expectedVal;
            iterChanged = true;
            changedThisPass.add(node.id);
          }
        });
      } else {
        // Basic Logic Gates (AND, OR, NOT, NAND, NOR, XOR, XNOR, BUFFER, TRI_STATE_BUFFER)
        const computedOutput = evaluateGate(
          data.gateType,
          inputs,
          data.outputs[0]?.value ?? -1,
          { value: data.value }
        );

        data.outputs.forEach((outPin) => {
          if (outPin.value !== computedOutput) {
            outPin.value = computedOutput;
            iterChanged = true;
            changedThisPass.add(node.id);
          }
        });
      }
    });

    if (iterChanged) {
      overallChanged = true;
    } else {
      // Converged! No further changes in this pass
      settled = true;
      break;
    }
  }

  const unstableNodeIds = new Set<string>([...(settled ? [] : changedThisPass), ...unstableInside]);

  // Step C: Update wire edge data with current signal value for animated rendering
  const updatedEdges = inputEdges.map((edge) => {
    const sourceNode = nodesMap.get(edge.source);
    if (!sourceNode) return edge;

    const sourceData = sourceNode.data as unknown as NodeData;
    let signalVal: SignalValue = -1;

    if (sourceData.gateType === 'INPUT') {
      signalVal = sourceData.value ?? 0;
    } else {
      const outPinHandle = edge.sourceHandle || 'out-0';
      const outPin = sourceData.outputs.find((p) => p.id === outPinHandle);
      signalVal = outPin ? outPin.value : (sourceData.outputs[0]?.value ?? -1);
    }

    return {
      ...edge,
      data: {
        ...edge.data,
        signalValue: signalVal,
      },
    };
  });

  return {
    nodes: Array.from(nodesMap.values()),
    edges: updatedEdges,
    hasChanged: overallChanged,
    unstableNodeIds: Array.from(unstableNodeIds),
  };
}
