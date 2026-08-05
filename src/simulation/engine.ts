import { Node, Edge } from '@xyflow/react';
import { NodeData, SignalValue } from '../types/circuit';
import { evaluateGate } from '../utils/gateLogic';
import { evaluateEncoder } from './encoderLogic';
import { evaluateIC } from './icLogic';
import { DEFAULT_ENCODER_CONFIG } from '../types/encoder';
import { DEFAULT_MULTI_INPUT_CONFIG } from '../types/multiInput';
import {
  evaluateCfgEncoder,
  evaluateCfgDecoder,
  evaluateCfgMux,
  evaluateCfgDemux,
  evaluateCfgComparator,
  evaluateCfgRegister,
  evaluateCfgShiftRegister,
  evaluateCfgCounter,
  evaluateCfgConstant,
  evaluateCfgBusSplitter,
  evaluateCfgBusJoiner,
} from './configurableLogic';
import {
  DEFAULT_CFG_ENCODER_CONFIG,
  DEFAULT_CFG_DECODER_CONFIG,
  DEFAULT_CFG_MUX_CONFIG,
  DEFAULT_CFG_DEMUX_CONFIG,
  DEFAULT_CFG_COMPARATOR_CONFIG,
  DEFAULT_CFG_REGISTER_CONFIG,
  DEFAULT_CFG_SHIFT_REGISTER_CONFIG,
  DEFAULT_CFG_COUNTER_CONFIG,
  DEFAULT_CFG_CONSTANT_CONFIG,
  DEFAULT_CFG_BUS_SPLITTER_CONFIG,
  DEFAULT_CFG_BUS_JOINER_CONFIG,
} from '../types/configurable';

import { CustomComponentDefinition } from '../types/customComponent';
import { evaluateCustomComponentLogic } from './customComponentLogic';

export interface PropagateResult {
  nodes: Node[];
  edges: Edge[];
  hasChanged: boolean;
}

export function propagateSignals(
  inputNodes: Node[],
  inputEdges: Edge[],
  clockTick: boolean = false,
  customComponentsMap: Record<string, CustomComponentDefinition> = {}
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

    // Step A.1: Tunnel wireless signal propagation pass
    const tunnelMap = new Map<string, SignalValue>();
    nodesMap.forEach((n) => {
      const d = n.data as unknown as NodeData;
      if (d.gateType === 'TUNNEL' && d.tunnelLabel && d.inputs.length > 0) {
        const val = d.inputs[0]?.value ?? -1;
        if (val !== -1) {
          tunnelMap.set(d.tunnelLabel.toUpperCase(), val);
        }
      }
    });

    nodesMap.forEach((n) => {
      const d = n.data as unknown as NodeData;
      if (d.gateType === 'TUNNEL' && d.tunnelLabel) {
        const matchedVal = tunnelMap.get(d.tunnelLabel.toUpperCase()) ?? -1;
        if (d.outputs.length > 0 && d.outputs[0].value !== matchedVal) {
          d.outputs[0].value = matchedVal;
          iterChanged = true;
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

      if (data.gateType === 'INPUT' || data.gateType === 'CLOCK' || data.gateType === 'PUSH_BUTTON' || data.gateType === 'CONST_HIGH' || data.gateType === 'CONST_LOW') {
        const val = data.gateType === 'CONST_HIGH' ? 1 : data.gateType === 'CONST_LOW' ? 0 : (data.value ?? 0);
        data.outputs.forEach((outPin) => {
          if (outPin.value !== val) {
            outPin.value = val;
            iterChanged = true;
          }
        });
      } else if (data.gateType === 'DIP_SWITCH') {
        const dipVals = data.dipValues || [0, 0, 0, 0];
        data.outputs.forEach((outPin, idx) => {
          const expectedVal = (dipVals[idx] ?? 0) === 1 ? 1 : 0;
          if (outPin.value !== expectedVal) {
            outPin.value = expectedVal;
            iterChanged = true;
          }
        });
      } else if (data.gateType === 'MULTI_INPUT') {
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
      } else if (
        data.gateType === 'OUTPUT' ||
        data.gateType === 'LOGIC_PROBE' ||
        data.gateType === 'RGB_LED' ||
        data.gateType === 'SEVEN_SEGMENT' ||
        data.gateType === 'HEX_DISPLAY' ||
        data.gateType === 'BUS_MONITOR' ||
        data.gateType === 'OSCILLOSCOPE' ||
        data.gateType === 'LED_MATRIX' ||
        data.gateType === 'BOOLEAN_EQUATION_GENERATOR'
      ) {
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
      } else if (data.gateType === 'CUSTOM') {
        const evalRes = evaluateCustomComponentLogic(
          data,
          customComponentsMap,
          (nodes, edges, tick) => propagateSignals(nodes, edges, tick, customComponentsMap),
          clockTick
        );
        data.subcircuitNodeStates = evalRes.internalNodeStates;
        data.outputs.forEach((outPin) => {
          const expectedVal = evalRes.updatedOutputs[outPin.id] ?? -1;
          if (outPin.value !== expectedVal) {
            outPin.value = expectedVal;
            iterChanged = true;
          }
        });
      } else if ([
        'CFG_ENCODER', 'CFG_DECODER', 'CFG_MUX', 'CFG_DEMUX', 'CFG_COMPARATOR',
        'CFG_REGISTER', 'CFG_SHIFT_REGISTER', 'CFG_COUNTER', 'CFG_CONSTANT',
        'CFG_BUS_SPLITTER', 'CFG_BUS_JOINER'
      ].includes(data.gateType)) {
        let evalRes: { outputs: Record<string, SignalValue>; newState?: Record<string, any> } = { outputs: {} };

        switch (data.gateType) {
          case 'CFG_ENCODER':
            evalRes = evaluateCfgEncoder(data.inputs, data.cfgEncoderConfig || DEFAULT_CFG_ENCODER_CONFIG);
            break;
          case 'CFG_DECODER':
            evalRes = evaluateCfgDecoder(data.inputs, data.cfgDecoderConfig || DEFAULT_CFG_DECODER_CONFIG);
            break;
          case 'CFG_MUX':
            evalRes = evaluateCfgMux(data.inputs, data.cfgMuxConfig || DEFAULT_CFG_MUX_CONFIG);
            break;
          case 'CFG_DEMUX':
            evalRes = evaluateCfgDemux(data.inputs, data.cfgDemuxConfig || DEFAULT_CFG_DEMUX_CONFIG);
            break;
          case 'CFG_COMPARATOR':
            evalRes = evaluateCfgComparator(data.inputs, data.cfgComparatorConfig || DEFAULT_CFG_COMPARATOR_CONFIG);
            break;
          case 'CFG_REGISTER':
            evalRes = evaluateCfgRegister(data.inputs, data.cfgRegisterConfig || DEFAULT_CFG_REGISTER_CONFIG, data.icState || {});
            break;
          case 'CFG_SHIFT_REGISTER':
            evalRes = evaluateCfgShiftRegister(data.inputs, data.cfgShiftRegisterConfig || DEFAULT_CFG_SHIFT_REGISTER_CONFIG, data.icState || {});
            break;
          case 'CFG_COUNTER':
            evalRes = evaluateCfgCounter(data.inputs, data.cfgCounterConfig || DEFAULT_CFG_COUNTER_CONFIG, data.icState || {});
            break;
          case 'CFG_CONSTANT':
            evalRes = evaluateCfgConstant(data.cfgConstantConfig || DEFAULT_CFG_CONSTANT_CONFIG);
            break;
          case 'CFG_BUS_SPLITTER':
            evalRes = evaluateCfgBusSplitter(data.inputs, data.cfgBusSplitterConfig || DEFAULT_CFG_BUS_SPLITTER_CONFIG);
            break;
          case 'CFG_BUS_JOINER':
            evalRes = evaluateCfgBusJoiner(data.inputs, data.cfgBusJoinerConfig || DEFAULT_CFG_BUS_JOINER_CONFIG);
            break;
        }

        if (evalRes.newState) {
          data.icState = evalRes.newState;
        }

        data.outputs.forEach((outPin) => {
          const expectedVal = evalRes.outputs[outPin.id] ?? 0;
          if (outPin.value !== expectedVal) {
            outPin.value = expectedVal;
            iterChanged = true;
          }
        });
      } else if ([
        'HALF_ADDER', 'FULL_ADDER', 'ADDER_4BIT',
        'HALF_SUBTRACTOR', 'FULL_SUBTRACTOR', 'MUX_4TO1', 'DEMUX_1TO4',
        'PRIORITY_ENCODER', 'COMPARATOR_4BIT', 'DECODER_BCD_TO_7SEG',
        'D_LATCH', 'JK_FLIPFLOP', 'REGISTER_4BIT', 'SHIFT_REGISTER_4BIT',
        'UP_COUNTER_4BIT', 'DOWN_COUNTER_4BIT',
        'MUX_8TO1', 'DEMUX_1TO8', 'DECODER_3TO8', 'DECODER_4TO16', 'ENCODER_8TO3',
        'PARITY_GENERATOR', 'PARITY_CHECKER', 'CONVERTER_BIN_TO_GRAY', 'CONVERTER_GRAY_TO_BIN',
        'T_FLIPFLOP', 'RING_COUNTER', 'RIPPLE_COUNTER', 'SYNCHRONOUS_COUNTER', 'UP_DOWN_COUNTER', 'FREQUENCY_DIVIDER',
        'INCREMENTER_4BIT', 'DECREMENTER_4BIT', 'ADDER_SUBTRACTOR_4BIT', 'ALU_4BIT',
        'BUS_SPLITTER', 'BUS_JOINER', 'BUS_TAP', 'BIT_EXTRACTOR', 'DELAY_ELEMENT', 'TUNNEL'
      ].includes(data.gateType)) {
        const icRes = evaluateIC(data.gateType, inputs, data.icState || {});
        data.icState = icRes.newState;
        data.outputs.forEach((outPin) => {
          const expectedVal = icRes.outputs[outPin.id] ?? 0;
          if (outPin.value !== expectedVal) {
            outPin.value = expectedVal;
            iterChanged = true;
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
