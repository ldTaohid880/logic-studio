import { NodeData } from '../../types/circuit';
import { EncoderConfig, DEFAULT_ENCODER_CONFIG } from '../../types/encoder';
import { createEncoderPins } from '../../utils/encoderPins';
import { SevenSegmentConfig, DEFAULT_SEVEN_SEGMENT_CONFIG } from '../../types/sevenSegment';
import { createSevenSegmentPins } from '../../utils/sevenSegmentPins';
import { CircuitStore, StoreSlice } from '../types';

// Per-component controls and configuration (inputs, encoders, displays)
export type DevicesSlice = Pick<CircuitStore,
  | 'updateEncoderConfig'
  | 'toggleEncoderInputPin'
  | 'setAllEncoderInputs'
  | 'invertAllEncoderInputs'
  | 'updateSevenSegmentConfig'
  | 'toggleInputValue'
  | 'setButtonPressed'
  | 'toggleDipBit'
  | 'setInputLevels'
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

  // Momentary: not recorded in undo history, like flipping a switch
  setButtonPressed: (nodeId: string, pressed: boolean) => {
    const value = pressed ? 1 : 0;
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node || (node.data as unknown as NodeData).value === value) return;
    set({ nodes: get().nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, value } } : n)) });
    get().tickSimulation();
  },

  toggleDipBit: (nodeId: string, bitIndex: number) => {
    set({
      nodes: get().nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const data = n.data as unknown as NodeData;
        const values = [...(data.dipValues || Array(data.bitWidth || 4).fill(0))];
        values[bitIndex] = values[bitIndex] === 1 ? 0 : 1;
        return { ...n, data: { ...n.data, dipValues: values } };
      }),
    });
    get().tickSimulation();
  },

  // Momentary like toggleInputValue: flipping switches isn't an undoable edit
  setInputLevels: (levels) => {
    const byNode = new Map<string, { bit?: number; value: 0 | 1 }[]>();
    levels.forEach(({ nodeId, ...level }) => byNode.set(nodeId, [...(byNode.get(nodeId) ?? []), level]));
    set({
      nodes: get().nodes.map((n) => {
        const nodeLevels = byNode.get(n.id);
        if (!nodeLevels) return n;
        const data = n.data as unknown as NodeData;
        if (data.gateType === 'DIP_SWITCH') {
          const values = [...(data.dipValues || Array(data.bitWidth || 4).fill(0))];
          nodeLevels.forEach(({ bit, value }) => {
            if (bit !== undefined) values[bit] = value;
          });
          return { ...n, data: { ...n.data, dipValues: values } };
        }
        const value = nodeLevels[0].value;
        return { ...n, data: { ...n.data, value, outputs: data.outputs.map((p) => ({ ...p, value })) } };
      }),
    });
    get().tickSimulation();
  },
});
