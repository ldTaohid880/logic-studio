import { Node, Edge } from '@xyflow/react';
import { NodeData, SignalValue } from '../types/circuit';
import { evaluateGate } from '../utils/gateLogic';
import { evaluateEncoder } from './encoderLogic';
import { evaluateIC } from './icLogic';
import { DEFAULT_ENCODER_CONFIG } from '../types/encoder';
import { CustomComponentDefinition } from '../types/customComponent';
import { evaluateCustomComponentLogic } from './customComponentLogic';
import { isSensor, sensorOutput } from './sensors';

// Nested custom components deeper than this are treated as unresolvable (guards against recursive definitions)
export const MAX_SUBCIRCUIT_DEPTH = 16;

export const IC_GATE_TYPES = new Set<string>([
  'HALF_ADDER', 'FULL_ADDER', 'ADDER_4BIT',
  'HALF_SUBTRACTOR', 'FULL_SUBTRACTOR', 'MUX_4TO1', 'DEMUX_1TO4',
  'PRIORITY_ENCODER', 'COMPARATOR_4BIT', 'DECODER_BCD_TO_7SEG',
  'D_LATCH', 'SR_LATCH', 'D_FLIPFLOP', 'JK_FLIPFLOP', 'MUX_2TO1', 'T_FLIPFLOP', 'REGISTER_4BIT',
  'MUX_8TO1', 'DEMUX_1TO8', 'DECODER_3TO8', 'ENCODER_8TO3',
  'PARITY_GENERATOR', 'PARITY_CHECKER',
  'INCREMENTER_4BIT', 'DECREMENTER_4BIT', 'ADDER_SUBTRACTOR_4BIT',
  'OPEN_DRAIN_BUFFER',
  'COUNTER_4BIT', 'COUNTER_LOAD_4BIT', 'DECADE_COUNTER', 'SHIFT_REG_UNIVERSAL', 'DECODER_4TO16_HC', 'REGISTER_8BIT', 'LATCH_8BIT',
  'SHIFT_REG_4BIT', 'ALU_4BIT_8FN', 'RAM_16X4', 'ROM_16X4',
  'DELAY_ELEMENT',
]);

export interface PropagateOptions {
  // Current subcircuit nesting depth (internal)
  depth?: number;
  /**
   * Passes to run before returning. One pass = one gate delay: every part reacts to the levels its inputs had
   * after the previous pass (used for gate delays). By default the circuit runs until it settles.
   */
  maxPasses?: number;
}

export interface PropagateResult {
  nodes: Node[];
  edges: Edge[];
  hasChanged: boolean;
  /** Parts still changing when propagation gave up (oscillation, e.g. a ring of inverters). Empty once settled. */
  unstableNodeIds: string[];
  /** Parts with an input driven to different levels at once (two outputs fighting over one wire), and tunnels whose tag is. */
  conflictNodeIds: string[];
}

/**
 * Level on a wire with several drivers (a shared bus). Floating drivers (disabled tri-state outputs) don't count;
 * drivers that agree give their level; drivers that disagree are a conflict, which reads as unknown (-1).
 */
const floatingBus = (width: number): SignalValue[] => new Array(width).fill(-1);
const sameBus = (a: SignalValue[] | undefined, b: SignalValue[]) => !!a && a.length === b.length && a.every((v, i) => v === b[i]);

/** Pull-up and pull-down resistors: weak drivers that only set a wire's level when nothing else drives it. */
export const WEAK_DRIVERS = new Set<string>(['PULL_UP', 'PULL_DOWN']);

export function resolveDrivers(values: SignalValue[]): { value: SignalValue; conflict: boolean } {
  let value: SignalValue = -1;
  for (const v of values) {
    if (v === -1) continue;
    if (value !== -1 && v !== value) return { value: -1, conflict: true };
    value = v;
  }
  return { value, conflict: false };
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
    
    // Deep clone input and output pin arrays (bus arrays are replaced, never changed in place)
    data.inputs = data.inputs ? data.inputs.map((pin) => ({ ...pin })) : [];

    // A pin whose wire was removed floats instead of keeping its last value
    data.inputs.forEach((pin) => {
      if (pin.driven && !connectedInputs.has(`${node.id}|${pin.id}`)) {
        pin.value = -1;
        if (pin.width) pin.bus = floatingBus(pin.width);
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
  const MAX_ITERATIONS = options.maxPasses ?? Math.min(Math.max(12, inputNodes.length + 4), 256);
  // Parts whose outputs changed in the latest pass; if passes run out these are the ones that never settled
  let changedThisPass = new Set<string>();
  // Custom component instances whose own subcircuit doesn't settle
  const unstableInside = new Set<string>();
  let settled = false;
  // Inputs (node|pin) and tunnel tags driven to different levels in the latest pass
  let conflicts = new Set<string>();

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let iterChanged = false;
    changedThisPass = new Set<string>();
    conflicts = new Set<string>();

    // Step A.1: Tunnel wireless signal propagation pass
    // Only tunnels with a wire on their input drive the label; conflicting drivers resolve to floating
    // A tag works like a shared bus: floating drivers don't count, disagreeing ones conflict
    const tunnelDrivers = new Map<string, SignalValue[]>();
    nodesMap.forEach((n) => {
      const d = n.data as unknown as NodeData;
      if (d.gateType === 'TUNNEL' && d.tunnelLabel && d.inputs.length > 0 && connectedInputs.has(`${n.id}|${d.inputs[0].id}`)) {
        const key = d.tunnelLabel.toUpperCase();
        tunnelDrivers.set(key, [...(tunnelDrivers.get(key) ?? []), d.inputs[0].value]);
      }
    });
    const tunnelMap = new Map<string, SignalValue>();
    tunnelDrivers.forEach((values, key) => {
      const { value, conflict } = resolveDrivers(values);
      tunnelMap.set(key, value);
      if (conflict) conflicts.add(`tag|${key}`);
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

    // Step A.2: Map output signals from source pins to connected input pins via edges.
    // Several wires may end on one input (a shared bus); their levels are resolved together below.
    const pinDrivers = new Map<string, { strong: SignalValue[]; weak: SignalValue[] }>();
    // Bus inputs: the bus arrays driving them (resolved bit by bit like single wires)
    const busDrivers = new Map<string, SignalValue[][]>();
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

      const inPinHandle = edge.targetHandle || 'in-0';
      const inPin = targetData.inputs.find((p) => p.id === inPinHandle);
      if (inPin?.width) {
        const outPin = sourceData.outputs.find((p) => p.id === (edge.sourceHandle || 'out-0'));
        const key = `${edge.target}|${inPinHandle}`;
        busDrivers.set(key, [...(busDrivers.get(key) ?? []), outPin?.bus ?? floatingBus(inPin.width)]);
      } else if (inPin) {
        const key = `${edge.target}|${inPinHandle}`;
        const drivers = pinDrivers.get(key) ?? { strong: [], weak: [] };
        (WEAK_DRIVERS.has(sourceData.gateType) ? drivers.weak : drivers.strong).push(signalVal);
        pinDrivers.set(key, drivers);
      } else if (targetData.gateType === 'OUTPUT') {
        if (targetData.value !== signalVal) {
          targetData.value = signalVal;
          iterChanged = true;
        }
      }
    });

    pinDrivers.forEach((drivers, key) => {
      const [nodeId, pinId] = key.split('|');
      const inPin = (nodesMap.get(nodeId)!.data as unknown as NodeData).inputs.find((p) => p.id === pinId)!;
      // Real outputs win; resistors only decide a wire nothing else drives (a pull-up and pull-down together leave it unknown)
      const strong = resolveDrivers(drivers.strong);
      const { value, conflict } = strong.value !== -1 || strong.conflict ? strong : { value: resolveDrivers(drivers.weak).value, conflict: false };
      if (conflict) conflicts.add(key);
      inPin.driven = true;
      if (inPin.value !== value) {
        inPin.value = value;
        iterChanged = true;
      }
    });

    busDrivers.forEach((buses, key) => {
      const [nodeId, pinId] = key.split('|');
      const inPin = (nodesMap.get(nodeId)!.data as unknown as NodeData).inputs.find((p) => p.id === pinId)!;
      const bits = Array.from({ length: inPin.width! }, (_, bit) => {
        const { value, conflict } = resolveDrivers(buses.map((b) => b[bit] ?? -1));
        if (conflict) conflicts.add(key);
        return value;
      });
      inPin.driven = true;
      if (!sameBus(inPin.bus, bits)) {
        inPin.bus = bits;
        iterChanged = true;
      }
    });

    // Step B: Re-evaluate gate logic for every node
    nodesMap.forEach((node) => {
      const data = node.data as unknown as NodeData;
      const inputs = data.inputs.map((p) => p.value);

      if (data.gateType === 'TUNNEL') {
        // Tunnel outputs are resolved in the tunnel pass above
      } else if (data.gateType === 'BUS_JOIN') {
        // Single wires in, one bus out (bit 0 = first input)
        const bits = data.inputs.map((p) => p.value);
        const out = data.outputs[0];
        if (out && !sameBus(out.bus, bits)) {
          out.bus = bits;
          iterChanged = true;
          changedThisPass.add(node.id);
        }
      } else if (data.gateType === 'BUS_SPLIT') {
        const bits = data.inputs[0]?.bus ?? [];
        data.outputs.forEach((outPin, i) => {
          const v = bits[i] ?? -1;
          if (outPin.value !== v) {
            outPin.value = v;
            iterChanged = true;
            changedThisPass.add(node.id);
          }
        });
      } else if (data.gateType === 'ARDUINO_UNO') {
        // Board outputs come from the emulated chip (simulation/timeline.ts), not from its inputs
      } else if (
        data.gateType === 'INPUT' ||
        data.gateType === 'PUSH_BUTTON' ||
        data.gateType === 'CLOCK' ||
        data.gateType === 'CONST_HIGH' ||
        data.gateType === 'CONST_LOW' ||
        data.gateType === 'PULL_UP' ||
        data.gateType === 'PULL_DOWN' ||
        isSensor(data.gateType)
      ) {
        const val =
          data.gateType === 'CONST_HIGH' || data.gateType === 'PULL_UP'
            ? 1
            : data.gateType === 'CONST_LOW' || data.gateType === 'PULL_DOWN'
            ? 0
            : isSensor(data.gateType)
            ? sensorOutput(data)
            : (data.value ?? 0);
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
        const icRes = evaluateIC(data.gateType, inputs, data.icState || {}, data);
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

  // Parts with a conflicting input, and the tunnels sharing a conflicting tag
  const conflictNodeIds = new Set<string>();
  conflicts.forEach((key) => {
    const [first, second] = key.split('|');
    if (first !== 'tag') conflictNodeIds.add(first);
    else
      nodesMap.forEach((n) => {
        const d = n.data as unknown as NodeData;
        if (d.gateType === 'TUNNEL' && d.tunnelLabel?.toUpperCase() === second) conflictNodeIds.add(n.id);
      });
  });

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

    const conflict = conflicts.has(`${edge.target}|${edge.targetHandle || 'in-0'}`);
    const busOut = sourceData.outputs.find((p) => p.id === (edge.sourceHandle || 'out-0'));
    return {
      ...edge,
      data: {
        ...edge.data,
        signalValue: signalVal,
        // Bus wires carry every bit, for drawing the width and value
        bus: busOut?.width ? busOut.bus ?? floatingBus(busOut.width) : undefined,
        // Drawn as a conflict: this wire's driver disagrees with another driver on the same input
        conflict: conflict || undefined,
      },
    };
  });

  return {
    nodes: Array.from(nodesMap.values()),
    edges: updatedEdges,
    hasChanged: overallChanged,
    unstableNodeIds: Array.from(unstableNodeIds),
    conflictNodeIds: Array.from(conflictNodeIds),
  };
}
