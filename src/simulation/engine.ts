import { Node, Edge } from '@xyflow/react';
import { NodeData, SignalValue } from '../types/circuit';
import { evaluateGate } from '../utils/gateLogic';
import { evaluateEncoder } from './encoderLogic';
import { DEFAULT_ENCODER_CONFIG } from '../types/encoder';
import { DEFAULT_MULTI_INPUT_CONFIG } from '../types/multiInput';

export interface PropagateResult {
  nodes: Node[];
  edges: Edge[];
  hasChanged: boolean;
}

export function propagateSignals(
  inputNodes: Node[],
  inputEdges: Edge[],
  clockTick: boolean = false
): PropagateResult {
  // Deep clone or construct updated node state map
  const nodesMap = new Map<string, Node>();
  
  // Clone nodes into our working map
  inputNodes.forEach((node) => {
    const data = { ...(node.data as unknown as NodeData) };
    
    // Deep clone input and output pin arrays
    data.inputs = data.inputs ? data.inputs.map((pin) => ({ ...pin })) : [];
    data.outputs = data.outputs ? data.outputs.map((pin) => ({ ...pin })) : [];

    // Pre-sync MultiInput node output pin values from multiInputConfig
    if (data.gateType === 'MULTI_INPUT' && data.multiInputConfig) {
      const config = data.multiInputConfig;
      data.outputs.forEach((outPin) => {
        if (outPin.id === 'out-bus') {
          outPin.value = config.values.some((v) => v === 1) ? 1 : 0;
        } else if (outPin.id.startsWith('out-')) {
          const idx = parseInt(outPin.id.replace('out-', ''), 10);
          if (!isNaN(idx) && idx >= 0 && idx < config.values.length) {
            outPin.value = config.values[idx] ?? 0;
          }
        }
      });
    }

    // Handle Clock tick
    if (data.gateType === 'CLOCK' && clockTick) {
      const curVal = data.value ?? 0;
      data.value = curVal === 1 ? 0 : 1;
    }

    nodesMap.set(node.id, {
      ...node,
      data: data as Record<string, unknown>,
    });
  });

  // Track if any node output or pin value changed
  let overallChanged = false;
  const MAX_ITERATIONS = 12; // Multi-pass propagation for feedback loops / latches

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let iterChanged = false;

    // Step A: Map output signals from source pins to connected input pins via edges
    inputEdges.forEach((edge) => {
      const sourceNode = nodesMap.get(edge.source);
      const targetNode = nodesMap.get(edge.target);

      if (!sourceNode || !targetNode) return;

      const sourceData = sourceNode.data as unknown as NodeData;
      const targetData = targetNode.data as unknown as NodeData;

      // Find source pin output value
      let signalVal: SignalValue = -1;
      if (sourceData.gateType === 'INPUT' || sourceData.gateType === 'CLOCK') {
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

      if (data.gateType === 'INPUT' || data.gateType === 'CLOCK') {
        // Output pins inherit current user value
        const val = data.value ?? 0;
        data.outputs.forEach((outPin) => {
          if (outPin.value !== val) {
            outPin.value = val;
            iterChanged = true;
          }
        });
      } else if (data.gateType === 'MULTI_INPUT') {
        // Multi-Input node output pins reflect the values configured in multiInputConfig
        const config = data.multiInputConfig || DEFAULT_MULTI_INPUT_CONFIG;
        data.outputs.forEach((outPin) => {
          let expectedVal: SignalValue = 0;
          if (outPin.id === 'out-bus') {
            expectedVal = config.values.some((v) => v === 1) ? 1 : 0;
          } else if (outPin.id.startsWith('out-')) {
            const idx = parseInt(outPin.id.replace('out-', ''), 10);
            if (!isNaN(idx) && idx >= 0 && idx < config.values.length) {
              expectedVal = config.values[idx] ?? 0;
            }
          }
          if (outPin.value !== expectedVal) {
            outPin.value = expectedVal;
            iterChanged = true;
          }
        });
      } else if (data.gateType === 'OUTPUT') {
        // Output node takes first input pin or target value
        const val = inputs[0] ?? data.value ?? -1;
        if (data.value !== val) {
          data.value = val;
          iterChanged = true;
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
          }
        });
      } else if (data.gateType === 'SEVEN_SEGMENT') {
        // 7-Segment display evaluates visually from current input pins
      } else {
        // Logic Gates (AND, OR, NOT, NAND, NOR, XOR, XNOR)
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
          }
        });
      }
    });

    if (iterChanged) {
      overallChanged = true;
    } else {
      // Converged! No further changes in this pass
      break;
    }
  }

  // Step C: Update wire edge data with current signal value for animated rendering
  const updatedEdges = inputEdges.map((edge) => {
    const sourceNode = nodesMap.get(edge.source);
    if (!sourceNode) return edge;

    const sourceData = sourceNode.data as unknown as NodeData;
    let signalVal: SignalValue = -1;

    if (sourceData.gateType === 'INPUT' || sourceData.gateType === 'CLOCK') {
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
  };
}
