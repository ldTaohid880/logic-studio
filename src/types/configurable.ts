export interface CfgEncoderConfig {
  inputCount: number; // 2..32, default 8
  priorityMode: 'high' | 'low'; // default 'high'
  activeLow: boolean; // default false (active high)
  enableInput: boolean; // default true
}

export const DEFAULT_CFG_ENCODER_CONFIG: CfgEncoderConfig = {
  inputCount: 8,
  priorityMode: 'high',
  activeLow: false,
  enableInput: true,
};

export interface CfgDecoderConfig {
  bitWidth: number; // 1..5 -> 2^N outputs (default 3 -> 8 outputs)
  activeLow: boolean; // default false
  enableInput: boolean; // default true
}

export const DEFAULT_CFG_DECODER_CONFIG: CfgDecoderConfig = {
  bitWidth: 3,
  activeLow: false,
  enableInput: true,
};

export interface CfgMuxConfig {
  inputCount: number; // 2, 4, 8, 16, 32 (default 4)
  dataWidth: number; // 1..16 (default 1)
  enableInput: boolean; // default true
}

export const DEFAULT_CFG_MUX_CONFIG: CfgMuxConfig = {
  inputCount: 4,
  dataWidth: 1,
  enableInput: true,
};

export interface CfgDemuxConfig {
  outputCount: number; // 2, 4, 8, 16, 32 (default 4)
  dataWidth: number; // 1..16 (default 1)
  enableInput: boolean; // default true
}

export const DEFAULT_CFG_DEMUX_CONFIG: CfgDemuxConfig = {
  outputCount: 4,
  dataWidth: 1,
  enableInput: true,
};

export interface CfgComparatorConfig {
  bitWidth: number; // 1..32 (default 4)
}

export const DEFAULT_CFG_COMPARATOR_CONFIG: CfgComparatorConfig = {
  bitWidth: 4,
};

export interface CfgRegisterConfig {
  bitWidth: number; // 1..32 (default 4)
  enable: boolean; // default true
  reset: boolean; // default true
  clockEdge: 'rising' | 'falling'; // default 'rising'
  initialValue: number; // default 0
}

export const DEFAULT_CFG_REGISTER_CONFIG: CfgRegisterConfig = {
  bitWidth: 4,
  enable: true,
  reset: true,
  clockEdge: 'rising',
  initialValue: 0,
};

export interface CfgShiftRegisterConfig {
  bitWidth: number; // 2..32 (default 4)
  shiftDirection: 'left' | 'right'; // default 'right'
  parallelLoad: boolean; // default true
  serialInput: boolean; // default true
}

export const DEFAULT_CFG_SHIFT_REGISTER_CONFIG: CfgShiftRegisterConfig = {
  bitWidth: 4,
  shiftDirection: 'right',
  parallelLoad: true,
  serialInput: true,
};

export interface CfgCounterConfig {
  bitWidth: number; // 2..32 (default 4)
  mode: 'up' | 'down' | 'up_down'; // default 'up'
  modulo: number; // 0 = full range 2^N, or specific limit (e.g. 10)
  enable: boolean; // default true
  reset: boolean; // default true
}

export const DEFAULT_CFG_COUNTER_CONFIG: CfgCounterConfig = {
  bitWidth: 4,
  mode: 'up',
  modulo: 0,
  enable: true,
  reset: true,
};

export interface CfgConstantConfig {
  bitWidth: number; // 1..32 (default 4)
  value: number; // default 0
  displayFormat: 'hex' | 'dec' | 'bin'; // default 'dec'
}

export const DEFAULT_CFG_CONSTANT_CONFIG: CfgConstantConfig = {
  bitWidth: 4,
  value: 0,
  displayFormat: 'dec',
};

export interface CfgBusSplitterConfig {
  inputWidth: number; // 2..32 (default 4)
}

export const DEFAULT_CFG_BUS_SPLITTER_CONFIG: CfgBusSplitterConfig = {
  inputWidth: 4,
};

export interface CfgBusJoinerConfig {
  inputCount: number; // 2..32 (default 4)
}

export const DEFAULT_CFG_BUS_JOINER_CONFIG: CfgBusJoinerConfig = {
  inputCount: 4,
};
