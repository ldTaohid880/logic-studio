import React from 'react';
import { NodeData } from '../../types/circuit';
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
import { InspectorSection } from '../ui/InspectorSection';
import { PropertyRow } from '../ui/PropertyRow';
import { Input } from '../ui/Input';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Button } from '../ui/Button';
import { Sliders, Settings } from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';

interface ConfigurablePropertiesProps {
  nodeId: string;
  nodeData: NodeData;
}

export const ConfigurableProperties: React.FC<ConfigurablePropertiesProps> = ({ nodeId, nodeData }) => {
  const { gateType } = nodeData;
  const updateConfigurableConfig = useCircuitStore((state) => (state as any).updateConfigurableConfig);

  switch (gateType) {
    case 'CFG_ENCODER': {
      const cfg: CfgEncoderConfig = nodeData.cfgEncoderConfig || DEFAULT_CFG_ENCODER_CONFIG;
      return (
        <InspectorSection title="Encoder Configuration" icon={<Settings className="w-4 h-4 text-purple-400" />}>
          <PropertyRow label="Number of Inputs">
            <SegmentedControl
              options={[
                { value: 2, label: '2' },
                { value: 4, label: '4' },
                { value: 8, label: '8' },
                { value: 16, label: '16' },
              ]}
              value={cfg.inputCount}
              onChange={(val) => updateConfigurableConfig(nodeId, { inputCount: val as number })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>

          <PropertyRow label="Priority Mode">
            <SegmentedControl
              options={[
                { value: 'high', label: 'High' },
                { value: 'low', label: 'Low' },
              ]}
              value={cfg.priorityMode}
              onChange={(val) => updateConfigurableConfig(nodeId, { priorityMode: val as 'high' | 'low' })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>

          <PropertyRow label="Logic Level">
            <Button
              variant="secondary"
              size="xs"
              onClick={() => updateConfigurableConfig(nodeId, { activeLow: !cfg.activeLow })}
            >
              {cfg.activeLow ? 'Active Low (0)' : 'Active High (1)'}
            </Button>
          </PropertyRow>

          <PropertyRow label="Enable Pin (EN)">
            <Button
              variant={cfg.enableInput ? 'primary' : 'secondary'}
              size="xs"
              onClick={() => updateConfigurableConfig(nodeId, { enableInput: !cfg.enableInput })}
            >
              {cfg.enableInput ? 'Enabled' : 'Disabled'}
            </Button>
          </PropertyRow>
        </InspectorSection>
      );
    }

    case 'CFG_DECODER': {
      const cfg: CfgDecoderConfig = nodeData.cfgDecoderConfig || DEFAULT_CFG_DECODER_CONFIG;
      return (
        <InspectorSection title="Decoder Configuration" icon={<Settings className="w-4 h-4 text-purple-400" />}>
          <PropertyRow label="Input Bit Width">
            <SegmentedControl
              options={[
                { value: 1, label: '1->2' },
                { value: 2, label: '2->4' },
                { value: 3, label: '3->8' },
                { value: 4, label: '4->16' },
              ]}
              value={cfg.bitWidth}
              onChange={(val) => updateConfigurableConfig(nodeId, { bitWidth: val as number })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>

          <PropertyRow label="Logic Level">
            <Button
              variant="secondary"
              size="xs"
              onClick={() => updateConfigurableConfig(nodeId, { activeLow: !cfg.activeLow })}
            >
              {cfg.activeLow ? 'Active Low (0)' : 'Active High (1)'}
            </Button>
          </PropertyRow>

          <PropertyRow label="Enable Pin (EN)">
            <Button
              variant={cfg.enableInput ? 'primary' : 'secondary'}
              size="xs"
              onClick={() => updateConfigurableConfig(nodeId, { enableInput: !cfg.enableInput })}
            >
              {cfg.enableInput ? 'Enabled' : 'Disabled'}
            </Button>
          </PropertyRow>
        </InspectorSection>
      );
    }

    case 'CFG_MUX': {
      const cfg: CfgMuxConfig = nodeData.cfgMuxConfig || DEFAULT_CFG_MUX_CONFIG;
      return (
        <InspectorSection title="MUX Configuration" icon={<Settings className="w-4 h-4 text-purple-400" />}>
          <PropertyRow label="Input Channels">
            <SegmentedControl
              options={[
                { value: 2, label: '2' },
                { value: 4, label: '4' },
                { value: 8, label: '8' },
                { value: 16, label: '16' },
              ]}
              value={cfg.inputCount}
              onChange={(val) => updateConfigurableConfig(nodeId, { inputCount: val as number })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>

          <PropertyRow label="Data Width">
            <SegmentedControl
              options={[
                { value: 1, label: '1-Bit' },
                { value: 2, label: '2-Bit' },
                { value: 4, label: '4-Bit' },
                { value: 8, label: '8-Bit' },
              ]}
              value={cfg.dataWidth}
              onChange={(val) => updateConfigurableConfig(nodeId, { dataWidth: val as number })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>

          <PropertyRow label="Enable Pin (EN)">
            <Button
              variant={cfg.enableInput ? 'primary' : 'secondary'}
              size="xs"
              onClick={() => updateConfigurableConfig(nodeId, { enableInput: !cfg.enableInput })}
            >
              {cfg.enableInput ? 'Enabled' : 'Disabled'}
            </Button>
          </PropertyRow>
        </InspectorSection>
      );
    }

    case 'CFG_DEMUX': {
      const cfg: CfgDemuxConfig = nodeData.cfgDemuxConfig || DEFAULT_CFG_DEMUX_CONFIG;
      return (
        <InspectorSection title="DEMUX Configuration" icon={<Settings className="w-4 h-4 text-purple-400" />}>
          <PropertyRow label="Output Channels">
            <SegmentedControl
              options={[
                { value: 2, label: '2' },
                { value: 4, label: '4' },
                { value: 8, label: '8' },
                { value: 16, label: '16' },
              ]}
              value={cfg.outputCount}
              onChange={(val) => updateConfigurableConfig(nodeId, { outputCount: val as number })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>

          <PropertyRow label="Data Width">
            <SegmentedControl
              options={[
                { value: 1, label: '1-Bit' },
                { value: 2, label: '2-Bit' },
                { value: 4, label: '4-Bit' },
                { value: 8, label: '8-Bit' },
              ]}
              value={cfg.dataWidth}
              onChange={(val) => updateConfigurableConfig(nodeId, { dataWidth: val as number })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>

          <PropertyRow label="Enable Pin (EN)">
            <Button
              variant={cfg.enableInput ? 'primary' : 'secondary'}
              size="xs"
              onClick={() => updateConfigurableConfig(nodeId, { enableInput: !cfg.enableInput })}
            >
              {cfg.enableInput ? 'Enabled' : 'Disabled'}
            </Button>
          </PropertyRow>
        </InspectorSection>
      );
    }

    case 'CFG_COMPARATOR': {
      const cfg: CfgComparatorConfig = nodeData.cfgComparatorConfig || DEFAULT_CFG_COMPARATOR_CONFIG;
      return (
        <InspectorSection title="Comparator Configuration" icon={<Settings className="w-4 h-4 text-purple-400" />}>
          <PropertyRow label="Bit Width">
            <SegmentedControl
              options={[
                { value: 2, label: '2-Bit' },
                { value: 4, label: '4-Bit' },
                { value: 8, label: '8-Bit' },
                { value: 16, label: '16-Bit' },
              ]}
              value={cfg.bitWidth}
              onChange={(val) => updateConfigurableConfig(nodeId, { bitWidth: val as number })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>
        </InspectorSection>
      );
    }

    case 'CFG_REGISTER': {
      const cfg: CfgRegisterConfig = nodeData.cfgRegisterConfig || DEFAULT_CFG_REGISTER_CONFIG;
      return (
        <InspectorSection title="Register Configuration" icon={<Settings className="w-4 h-4 text-purple-400" />}>
          <PropertyRow label="Bit Width">
            <SegmentedControl
              options={[
                { value: 2, label: '2-Bit' },
                { value: 4, label: '4-Bit' },
                { value: 8, label: '8-Bit' },
                { value: 16, label: '16-Bit' },
              ]}
              value={cfg.bitWidth}
              onChange={(val) => updateConfigurableConfig(nodeId, { bitWidth: val as number })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>

          <PropertyRow label="Clock Edge">
            <SegmentedControl
              options={[
                { value: 'rising', label: 'Rising ↑' },
                { value: 'falling', label: 'Falling ↓' },
              ]}
              value={cfg.clockEdge}
              onChange={(val) => updateConfigurableConfig(nodeId, { clockEdge: val as 'rising' | 'falling' })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>

          <PropertyRow label="Enable Pin (EN)">
            <Button
              variant={cfg.enable ? 'primary' : 'secondary'}
              size="xs"
              onClick={() => updateConfigurableConfig(nodeId, { enable: !cfg.enable })}
            >
              {cfg.enable ? 'Enabled' : 'Disabled'}
            </Button>
          </PropertyRow>

          <PropertyRow label="Reset Pin (CLR)">
            <Button
              variant={cfg.reset ? 'primary' : 'secondary'}
              size="xs"
              onClick={() => updateConfigurableConfig(nodeId, { reset: !cfg.reset })}
            >
              {cfg.reset ? 'Enabled' : 'Disabled'}
            </Button>
          </PropertyRow>
        </InspectorSection>
      );
    }

    case 'CFG_SHIFT_REGISTER': {
      const cfg: CfgShiftRegisterConfig = nodeData.cfgShiftRegisterConfig || DEFAULT_CFG_SHIFT_REGISTER_CONFIG;
      return (
        <InspectorSection title="Shift Register Configuration" icon={<Settings className="w-4 h-4 text-purple-400" />}>
          <PropertyRow label="Bit Width">
            <SegmentedControl
              options={[
                { value: 2, label: '2-Bit' },
                { value: 4, label: '4-Bit' },
                { value: 8, label: '8-Bit' },
                { value: 16, label: '16-Bit' },
              ]}
              value={cfg.bitWidth}
              onChange={(val) => updateConfigurableConfig(nodeId, { bitWidth: val as number })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>

          <PropertyRow label="Shift Direction">
            <SegmentedControl
              options={[
                { value: 'left', label: 'Left (LSB->MSB)' },
                { value: 'right', label: 'Right (MSB->LSB)' },
              ]}
              value={cfg.shiftDirection}
              onChange={(val) => updateConfigurableConfig(nodeId, { shiftDirection: val as 'left' | 'right' })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>

          <PropertyRow label="Parallel Load">
            <Button
              variant={cfg.parallelLoad ? 'primary' : 'secondary'}
              size="xs"
              onClick={() => updateConfigurableConfig(nodeId, { parallelLoad: !cfg.parallelLoad })}
            >
              {cfg.parallelLoad ? 'Enabled' : 'Disabled'}
            </Button>
          </PropertyRow>

          <PropertyRow label="Serial Input">
            <Button
              variant={cfg.serialInput ? 'primary' : 'secondary'}
              size="xs"
              onClick={() => updateConfigurableConfig(nodeId, { serialInput: !cfg.serialInput })}
            >
              {cfg.serialInput ? 'Enabled' : 'Disabled'}
            </Button>
          </PropertyRow>
        </InspectorSection>
      );
    }

    case 'CFG_COUNTER': {
      const cfg: CfgCounterConfig = nodeData.cfgCounterConfig || DEFAULT_CFG_COUNTER_CONFIG;
      return (
        <InspectorSection title="Counter Configuration" icon={<Settings className="w-4 h-4 text-purple-400" />}>
          <PropertyRow label="Bit Width">
            <SegmentedControl
              options={[
                { value: 2, label: '2-Bit' },
                { value: 4, label: '4-Bit' },
                { value: 8, label: '8-Bit' },
                { value: 16, label: '16-Bit' },
              ]}
              value={cfg.bitWidth}
              onChange={(val) => updateConfigurableConfig(nodeId, { bitWidth: val as number })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>

          <PropertyRow label="Direction Mode">
            <SegmentedControl
              options={[
                { value: 'up', label: 'Up' },
                { value: 'down', label: 'Down' },
                { value: 'up_down', label: 'Up/Down' },
              ]}
              value={cfg.mode}
              onChange={(val) => updateConfigurableConfig(nodeId, { mode: val as 'up' | 'down' | 'up_down' })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>

          <PropertyRow label="Modulo (Limit)">
            <Input
              type="number"
              value={cfg.modulo}
              onChange={(e) => updateConfigurableConfig(nodeId, { modulo: Math.max(0, parseInt(e.target.value, 10) || 0) })}
              placeholder="0 = 2^N"
              className="w-36 font-mono"
            />
          </PropertyRow>

          <PropertyRow label="Enable Pin (EN)">
            <Button
              variant={cfg.enable ? 'primary' : 'secondary'}
              size="xs"
              onClick={() => updateConfigurableConfig(nodeId, { enable: !cfg.enable })}
            >
              {cfg.enable ? 'Enabled' : 'Disabled'}
            </Button>
          </PropertyRow>

          <PropertyRow label="Reset Pin (CLR)">
            <Button
              variant={cfg.reset ? 'primary' : 'secondary'}
              size="xs"
              onClick={() => updateConfigurableConfig(nodeId, { reset: !cfg.reset })}
            >
              {cfg.reset ? 'Enabled' : 'Disabled'}
            </Button>
          </PropertyRow>
        </InspectorSection>
      );
    }

    case 'CFG_CONSTANT': {
      const cfg: CfgConstantConfig = nodeData.cfgConstantConfig || DEFAULT_CFG_CONSTANT_CONFIG;
      return (
        <InspectorSection title="Constant Configuration" icon={<Settings className="w-4 h-4 text-purple-400" />}>
          <PropertyRow label="Bit Width">
            <SegmentedControl
              options={[
                { value: 1, label: '1-Bit' },
                { value: 2, label: '2-Bit' },
                { value: 4, label: '4-Bit' },
                { value: 8, label: '8-Bit' },
              ]}
              value={cfg.bitWidth}
              onChange={(val) => updateConfigurableConfig(nodeId, { bitWidth: val as number })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>

          <PropertyRow label="Value">
            <Input
              type="number"
              value={cfg.value}
              onChange={(e) => {
                const maxVal = Math.pow(2, cfg.bitWidth) - 1;
                const val = Math.max(0, Math.min(maxVal, parseInt(e.target.value, 10) || 0));
                updateConfigurableConfig(nodeId, { value: val });
              }}
              className="w-36 font-mono"
            />
          </PropertyRow>

          <PropertyRow label="Display Format">
            <SegmentedControl
              options={[
                { value: 'dec', label: 'DEC' },
                { value: 'hex', label: 'HEX' },
                { value: 'bin', label: 'BIN' },
              ]}
              value={cfg.displayFormat}
              onChange={(val) => updateConfigurableConfig(nodeId, { displayFormat: val as 'dec' | 'hex' | 'bin' })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>
        </InspectorSection>
      );
    }

    case 'CFG_BUS_SPLITTER': {
      const cfg: CfgBusSplitterConfig = nodeData.cfgBusSplitterConfig || DEFAULT_CFG_BUS_SPLITTER_CONFIG;
      return (
        <InspectorSection title="Bus Splitter Configuration" icon={<Settings className="w-4 h-4 text-purple-400" />}>
          <PropertyRow label="Input Width">
            <SegmentedControl
              options={[
                { value: 2, label: '2-Bit' },
                { value: 4, label: '4-Bit' },
                { value: 8, label: '8-Bit' },
                { value: 16, label: '16-Bit' },
              ]}
              value={cfg.inputWidth}
              onChange={(val) => updateConfigurableConfig(nodeId, { inputWidth: val as number })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>
        </InspectorSection>
      );
    }

    case 'CFG_BUS_JOINER': {
      const cfg: CfgBusJoinerConfig = nodeData.cfgBusJoinerConfig || DEFAULT_CFG_BUS_JOINER_CONFIG;
      return (
        <InspectorSection title="Bus Joiner Configuration" icon={<Settings className="w-4 h-4 text-purple-400" />}>
          <PropertyRow label="Number of Inputs">
            <SegmentedControl
              options={[
                { value: 2, label: '2-Bit' },
                { value: 4, label: '4-Bit' },
                { value: 8, label: '8-Bit' },
                { value: 16, label: '16-Bit' },
              ]}
              value={cfg.inputCount}
              onChange={(val) => updateConfigurableConfig(nodeId, { inputCount: val as number })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>
        </InspectorSection>
      );
    }

    default:
      return null;
  }
};
