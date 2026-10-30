import { NodeData } from '../../types/circuit';
import { EncoderConfig, DEFAULT_ENCODER_CONFIG } from '../../types/encoder';
import { createEncoderPins } from '../../utils/encoderPins';
import { SevenSegmentConfig, DEFAULT_SEVEN_SEGMENT_CONFIG } from '../../types/sevenSegment';
import { createSevenSegmentPins } from '../../utils/sevenSegmentPins';
import { DEFAULT_CLOCK_CONFIG } from '../../types/clock';
import { MultiInputConfig, DEFAULT_MULTI_INPUT_CONFIG, generateInputLabels } from '../../types/multiInput';
import { createMultiInputPins } from '../../utils/multiInputPins';
import { LedMatrixConfig, DEFAULT_LED_MATRIX_CONFIG } from '../../types/ledMatrix';
import { createLedMatrixPins } from '../../utils/ledMatrixPins';
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
  CfgEncoderConfig,
  CfgDecoderConfig,
  CfgMuxConfig,
  CfgDemuxConfig,
  CfgComparatorConfig,
  CfgRegisterConfig,
  CfgShiftRegisterConfig,
  CfgCounterConfig,
  CfgConstantConfig,
  CfgBusSplitterConfig,
  CfgBusJoinerConfig,
} from '../../types/configurable';
import {
  createCfgEncoderPins,
  createCfgDecoderPins,
  createCfgMuxPins,
  createCfgDemuxPins,
  createCfgComparatorPins,
  createCfgRegisterPins,
  createCfgShiftRegisterPins,
  createCfgCounterPins,
  createCfgConstantPins,
  createCfgBusSplitterPins,
  createCfgBusJoinerPins,
} from '../../utils/configurablePins';
import { CircuitStore, StoreSlice } from '../types';

// Per-component controls and configuration (inputs, encoders, displays, configurable ICs)
export type DevicesSlice = Pick<CircuitStore,
  | 'updateEncoderConfig'
  | 'toggleEncoderInputPin'
  | 'setAllEncoderInputs'
  | 'invertAllEncoderInputs'
  | 'updateSevenSegmentConfig'
  | 'updateConfigurableConfig'
  | 'toggleInputValue'
  | 'updateMultiInputConfig'
  | 'toggleMultiInputBit'
  | 'setMultiInputBit'
  | 'setAllMultiInput'
  | 'invertAllMultiInput'
  | 'randomizeMultiInput'
  | 'incrementMultiInputCounter'
  | 'updateLedMatrixConfig'
  | 'triggerManualPulse'
>;

export const createDevicesSlice: StoreSlice<DevicesSlice> = (set, get) => ({
  updateEncoderConfig: (nodeId: string, partialConfig: Partial<EncoderConfig>) => {
    get().saveHistory();

    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const currentConfig = data.encoderConfig || DEFAULT_ENCODER_CONFIG;
        const newConfig = { ...currentConfig, ...partialConfig };

        const { inputs, outputs } = createEncoderPins(newConfig, data.inputs, data.outputs);

        return {
          ...node,
          data: {
            ...data,
            encoderConfig: newConfig,
            inputs,
            outputs,
          },
        };
      }
      return node;
    });

    // Clean up edges connected to handles that no longer exist
    const updatedNode = nodes.find((n) => n.id === nodeId);
    if (updatedNode) {
      const data = updatedNode.data as unknown as NodeData;
      const validInHandles = new Set(data.inputs.map((p) => p.id));
      const validOutHandles = new Set(data.outputs.map((p) => p.id));

      const newEdges = get().edges.filter((e) => {
        if (e.target === nodeId && e.targetHandle && !validInHandles.has(e.targetHandle)) {
          return false;
        }
        if (e.source === nodeId && e.sourceHandle && !validOutHandles.has(e.sourceHandle)) {
          return false;
        }
        return true;
      });

      set({ nodes, edges: newEdges });
    } else {
      set({ nodes });
    }

    get().tickSimulation();
  },

  toggleEncoderInputPin: (nodeId: string, pinIdx: number) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const inputs = data.inputs ? [...data.inputs] : [];
        if (inputs[pinIdx]) {
          const curVal = inputs[pinIdx].value;
          const newVal = curVal === 1 ? 0 : 1;
          inputs[pinIdx] = { ...inputs[pinIdx], value: newVal };
        }
        return {
          ...node,
          data: {
            ...data,
            inputs,
          },
        };
      }
      return node;
    });
    set({ nodes });
    get().tickSimulation(true);
  },

  setAllEncoderInputs: (nodeId: string, value: 0 | 1) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const inputs = (data.inputs || []).map((pin) => ({ ...pin, value }));
        return {
          ...node,
          data: { ...data, inputs },
        };
      }
      return node;
    });
    set({ nodes });
    get().tickSimulation(true);
  },

  invertAllEncoderInputs: (nodeId: string) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const inputs = (data.inputs || []).map((pin) => ({
          ...pin,
          value: pin.value === 1 ? 0 : 1,
        }));
        return {
          ...node,
          data: { ...data, inputs },
        };
      }
      return node;
    });
    set({ nodes });
    get().tickSimulation(true);
  },

  updateSevenSegmentConfig: (nodeId: string, partialConfig: Partial<SevenSegmentConfig>) => {
    get().saveHistory();

    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const currentConfig: SevenSegmentConfig = (data.sevenSegmentConfig as SevenSegmentConfig) || DEFAULT_SEVEN_SEGMENT_CONFIG;
        const newConfig: SevenSegmentConfig = { ...currentConfig, ...partialConfig };

        const newInputs = createSevenSegmentPins(newConfig, data.inputs);

        return {
          ...node,
          data: {
            ...data,
            sevenSegmentConfig: newConfig,
            inputs: newInputs,
          },
        };
      }
      return node;
    });

    // Clean up edges connected to handles that no longer exist
    const updatedNode = nodes.find((n) => n.id === nodeId);
    if (updatedNode) {
      const data = updatedNode.data as unknown as NodeData;
      const validInHandles = new Set(data.inputs.map((p) => p.id));

      const newEdges = get().edges.filter((e) => {
        if (e.target === nodeId && e.targetHandle && !validInHandles.has(e.targetHandle)) {
          return false;
        }
        return true;
      });

      set({ nodes, edges: newEdges });
    } else {
      set({ nodes });
    }

    get().tickSimulation();
  },

  updateConfigurableConfig: (nodeId: string, partialConfig: Record<string, any>) => {
    get().saveHistory();

    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        let newInputs = data.inputs;
        let newOutputs = data.outputs;
        const configUpdates: Record<string, any> = {};

        switch (data.gateType) {
          case 'CFG_ENCODER': {
            const cur = (data.cfgEncoderConfig as CfgEncoderConfig) || DEFAULT_CFG_ENCODER_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgEncoderConfig = updated;
            const pins = createCfgEncoderPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_DECODER': {
            const cur = (data.cfgDecoderConfig as CfgDecoderConfig) || DEFAULT_CFG_DECODER_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgDecoderConfig = updated;
            const pins = createCfgDecoderPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_MUX': {
            const cur = (data.cfgMuxConfig as CfgMuxConfig) || DEFAULT_CFG_MUX_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgMuxConfig = updated;
            const pins = createCfgMuxPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_DEMUX': {
            const cur = (data.cfgDemuxConfig as CfgDemuxConfig) || DEFAULT_CFG_DEMUX_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgDemuxConfig = updated;
            const pins = createCfgDemuxPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_COMPARATOR': {
            const cur = (data.cfgComparatorConfig as CfgComparatorConfig) || DEFAULT_CFG_COMPARATOR_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgComparatorConfig = updated;
            const pins = createCfgComparatorPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_REGISTER': {
            const cur = (data.cfgRegisterConfig as CfgRegisterConfig) || DEFAULT_CFG_REGISTER_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgRegisterConfig = updated;
            const pins = createCfgRegisterPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_SHIFT_REGISTER': {
            const cur = (data.cfgShiftRegisterConfig as CfgShiftRegisterConfig) || DEFAULT_CFG_SHIFT_REGISTER_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgShiftRegisterConfig = updated;
            const pins = createCfgShiftRegisterPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_COUNTER': {
            const cur = (data.cfgCounterConfig as CfgCounterConfig) || DEFAULT_CFG_COUNTER_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgCounterConfig = updated;
            const pins = createCfgCounterPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_CONSTANT': {
            const cur = (data.cfgConstantConfig as CfgConstantConfig) || DEFAULT_CFG_CONSTANT_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgConstantConfig = updated;
            const pins = createCfgConstantPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_BUS_SPLITTER': {
            const cur = (data.cfgBusSplitterConfig as CfgBusSplitterConfig) || DEFAULT_CFG_BUS_SPLITTER_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgBusSplitterConfig = updated;
            const pins = createCfgBusSplitterPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
          case 'CFG_BUS_JOINER': {
            const cur = (data.cfgBusJoinerConfig as CfgBusJoinerConfig) || DEFAULT_CFG_BUS_JOINER_CONFIG;
            const updated = { ...cur, ...partialConfig };
            configUpdates.cfgBusJoinerConfig = updated;
            const pins = createCfgBusJoinerPins(updated, data.inputs, data.outputs);
            newInputs = pins.inputs;
            newOutputs = pins.outputs;
            break;
          }
        }

        return {
          ...node,
          data: {
            ...data,
            ...configUpdates,
            inputs: newInputs,
            outputs: newOutputs,
          },
        };
      }
      return node;
    });

    const updatedNode = nodes.find((n) => n.id === nodeId);
    if (updatedNode) {
      const data = updatedNode.data as unknown as NodeData;
      const validInHandles = new Set(data.inputs.map((p) => p.id));
      const validOutHandles = new Set(data.outputs.map((p) => p.id));

      const newEdges = get().edges.filter((e) => {
        if (e.target === nodeId && e.targetHandle && !validInHandles.has(e.targetHandle)) {
          return false;
        }
        if (e.source === nodeId && e.sourceHandle && !validOutHandles.has(e.sourceHandle)) {
          return false;
        }
        return true;
      });

      set({ nodes, edges: newEdges });
    } else {
      set({ nodes });
    }

    get().tickSimulation();
  },

  toggleInputValue: (nodeId: string) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const currentVal = data.value ?? 0;
        const newVal = currentVal === 1 ? 0 : 1;
        return {
          ...node,
          data: {
            ...data,
            value: newVal,
            outputs: data.outputs.map((p) => ({ ...p, value: newVal })),
          },
        };
      }
      return node;
    });

    set({ nodes });
    get().tickSimulation();
  },

  updateMultiInputConfig: (nodeId: string, partialConfig: Partial<MultiInputConfig>) => {
    const { nodes, edges } = get();
    let newEdges = edges;

    const newNodes = nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const currentConfig = data.multiInputConfig || DEFAULT_MULTI_INPUT_CONFIG;
        const newCount = Math.max(1, Math.min(32, partialConfig.inputCount ?? currentConfig.inputCount));
        
        let newValues = [...(partialConfig.values ?? currentConfig.values)];
        if (newValues.length < newCount) {
          while (newValues.length < newCount) newValues.push(0);
        } else if (newValues.length > newCount) {
          newValues = newValues.slice(0, newCount);
        }

        const newLabels = generateInputLabels(newCount);

        const newConfig: MultiInputConfig = {
          inputCount: newCount,
          values: newValues,
          labels: newLabels,
        };

        const newOutputs = createMultiInputPins(newConfig, data.outputs);

        const validHandleIds = new Set(newOutputs.map((p) => p.id));
        newEdges = edges.filter(
          (edge) => !(edge.source === nodeId && edge.sourceHandle && !validHandleIds.has(edge.sourceHandle))
        );

        return {
          ...node,
          data: {
            ...data,
            multiInputConfig: newConfig,
            outputs: newOutputs,
          },
        };
      }
      return node;
    });

    set({ nodes: newNodes, edges: newEdges });
    get().tickSimulation(true);
  },

  toggleMultiInputBit: (nodeId: string, bitIndex: number) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const config = data.multiInputConfig || DEFAULT_MULTI_INPUT_CONFIG;
        const newValues = [...config.values];
        newValues[bitIndex] = newValues[bitIndex] === 1 ? 0 : 1;

        const newConfig = { ...config, values: newValues };
        const newOutputs = createMultiInputPins(newConfig, data.outputs);

        return {
          ...node,
          data: {
            ...data,
            multiInputConfig: newConfig,
            outputs: newOutputs,
          },
        };
      }
      return node;
    });

    set({ nodes });
    get().tickSimulation(true);
  },

  setMultiInputBit: (nodeId: string, bitIndex: number, value: 0 | 1) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const config = data.multiInputConfig || DEFAULT_MULTI_INPUT_CONFIG;
        const newValues = [...config.values];
        newValues[bitIndex] = value;

        const newConfig = { ...config, values: newValues };
        const newOutputs = createMultiInputPins(newConfig, data.outputs);

        return {
          ...node,
          data: {
            ...data,
            multiInputConfig: newConfig,
            outputs: newOutputs,
          },
        };
      }
      return node;
    });

    set({ nodes });
    get().tickSimulation(true);
  },

  setAllMultiInput: (nodeId: string, value: 0 | 1) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const config = data.multiInputConfig || DEFAULT_MULTI_INPUT_CONFIG;
        const newValues = config.values.map(() => value);

        const newConfig = { ...config, values: newValues };
        const newOutputs = createMultiInputPins(newConfig, data.outputs);

        return {
          ...node,
          data: {
            ...data,
            multiInputConfig: newConfig,
            outputs: newOutputs,
          },
        };
      }
      return node;
    });

    set({ nodes });
    get().tickSimulation(true);
  },

  invertAllMultiInput: (nodeId: string) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const config = data.multiInputConfig || DEFAULT_MULTI_INPUT_CONFIG;
        const newValues = config.values.map((v) => (v === 1 ? 0 : 1));

        const newConfig = { ...config, values: newValues };
        const newOutputs = createMultiInputPins(newConfig, data.outputs);

        return {
          ...node,
          data: {
            ...data,
            multiInputConfig: newConfig,
            outputs: newOutputs,
          },
        };
      }
      return node;
    });

    set({ nodes });
    get().tickSimulation(true);
  },

  randomizeMultiInput: (nodeId: string) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const config = data.multiInputConfig || DEFAULT_MULTI_INPUT_CONFIG;
        const newValues = config.values.map(() => (Math.random() < 0.5 ? 0 : 1));

        const newConfig = { ...config, values: newValues };
        const newOutputs = createMultiInputPins(newConfig, data.outputs);

        return {
          ...node,
          data: {
            ...data,
            multiInputConfig: newConfig,
            outputs: newOutputs,
          },
        };
      }
      return node;
    });

    set({ nodes });
    get().tickSimulation(true);
  },

  incrementMultiInputCounter: (nodeId: string) => {
    const nodes = get().nodes.map((node) => {
      if (node.id === nodeId) {
        const data = node.data as unknown as NodeData;
        const config = data.multiInputConfig || DEFAULT_MULTI_INPUT_CONFIG;
        
        let currentInt = 0;
        config.values.forEach((v, idx) => {
          if (v === 1) currentInt += Math.pow(2, idx);
        });

        const maxVal = Math.pow(2, config.inputCount);
        const nextInt = (currentInt + 1) % maxVal;

        const newValues = Array.from({ length: config.inputCount }, (_, idx) => {
          return ((nextInt >> idx) & 1) === 1 ? 1 : 0;
        });

        const newConfig = { ...config, values: newValues };
        const newOutputs = createMultiInputPins(newConfig, data.outputs);

        return {
          ...node,
          data: {
            ...data,
            multiInputConfig: newConfig,
            outputs: newOutputs,
          },
        };
      }
      return node;
    });

    set({ nodes });
    get().tickSimulation(true);
  },

  updateLedMatrixConfig: (nodeId: string, config: Partial<LedMatrixConfig>) => {
    const { nodes, edges } = get();
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    const data = targetNode.data as unknown as NodeData;
    const curConfig = data.ledMatrixConfig || DEFAULT_LED_MATRIX_CONFIG;
    const newConfig = { ...curConfig, ...config };

    let newInputs = data.inputs;
    let nextEdges = edges;

    if (config.size && config.size !== curConfig.size) {
      newInputs = createLedMatrixPins(newConfig);
      nextEdges = edges.filter((e) => {
        if (e.target === nodeId) {
          return newInputs.some((p) => p.id === e.targetHandle);
        }
        return true;
      });
    }

    const updatedNodes = nodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...data,
            ledMatrixConfig: newConfig,
            inputs: newInputs,
          },
        };
      }
      return node;
    });

    set({ nodes: updatedNodes, edges: nextEdges });
    get().tickSimulation(true);
  },

  triggerManualPulse: (nodeId: string) => {
    const { nodes } = get();
    const target = nodes.find((n) => n.id === nodeId);
    if (!target) return;
    const data = target.data as unknown as NodeData;
    const config = data.clockConfig || DEFAULT_CLOCK_CONFIG;
    const pulseWidth = config.pulseWidthMs || 100;

    const activeVal = config.startState === 'low' ? 1 : 0;

    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          const currentData = node.data as unknown as NodeData;
          return {
            ...node,
            data: {
              ...currentData,
              value: activeVal,
              outputs: (currentData.outputs || []).map((p) => ({ ...p, value: activeVal })),
            },
          };
        }
        return node;
      }),
    });
    get().tickSimulation(true);

    setTimeout(() => {
      const inactiveVal = config.startState === 'low' ? 0 : 1;
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === nodeId) {
            const currentData = node.data as unknown as NodeData;
            return {
              ...node,
              data: {
                ...currentData,
                value: inactiveVal,
                outputs: (currentData.outputs || []).map((p) => ({ ...p, value: inactiveVal })),
              },
            };
          }
          return node;
        }),
      });
      get().tickSimulation(true);
    }, pulseWidth);
  },
});
