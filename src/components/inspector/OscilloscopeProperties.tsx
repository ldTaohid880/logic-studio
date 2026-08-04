import React from 'react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { OscilloscopeConfig, DEFAULT_OSCILLOSCOPE_CONFIG, WaveColor, TriggerMode } from '../../types/oscilloscope';
import { InspectorSection } from '../ui/InspectorSection';
import { PropertyRow } from '../ui/PropertyRow';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Button } from '../ui/Button';
import { Activity, Eye, Zap, Gauge, RefreshCw, Palette } from 'lucide-react';

interface OscilloscopePropertiesProps {
  nodeId: string;
  config: OscilloscopeConfig;
  inputPins: { id: string; name: string }[];
}

export const OscilloscopeProperties: React.FC<OscilloscopePropertiesProps> = ({
  nodeId,
  config = DEFAULT_OSCILLOSCOPE_CONFIG,
  inputPins = [],
}) => {
  const {
    sampleRateHz = 500,
    timePerDivMs = 10,
    bufferSize = 500,
    triggerMode = 'auto',
    autoScroll = true,
    waveColor = 'cyan',
    gridVisible = true,
    showLabels = true,
    isPaused = false,
    selectedBitIndex = 0,
  } = config;

  const updateConfig = (partial: Partial<OscilloscopeConfig>) => {
    const nodes = useCircuitStore.getState().nodes;
    useCircuitStore.setState({
      nodes: nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                scopeConfig: { ...config, ...partial },
              },
            }
          : n
      ),
    });
  };

  return (
    <div className="space-y-4">
      {/* Sampling & Time Base Section */}
      <InspectorSection title="Time Base & Sampling" icon={<Gauge className="w-4 h-4 text-cyan-400" />}>
        <PropertyRow label="Sample Rate">
          <SegmentedControl
            options={[
              { value: 100, label: '100Hz' },
              { value: 500, label: '500Hz' },
              { value: 1000, label: '1kHz' },
            ]}
            value={sampleRateHz}
            onChange={(val) => updateConfig({ sampleRateHz: val as number })}
            size="xs"
            className="w-36"
          />
        </PropertyRow>

        <PropertyRow label="Time / Div">
          <SegmentedControl
            options={[
              { value: 5, label: '5ms' },
              { value: 10, label: '10ms' },
              { value: 25, label: '25ms' },
              { value: 50, label: '50ms' },
            ]}
            value={timePerDivMs}
            onChange={(val) => updateConfig({ timePerDivMs: val as number })}
            size="xs"
            className="w-36"
          />
        </PropertyRow>

        <PropertyRow label="Buffer Size">
          <SegmentedControl
            options={[
              { value: 200, label: '200' },
              { value: 500, label: '500' },
              { value: 1000, label: '1000' },
            ]}
            value={bufferSize}
            onChange={(val) => updateConfig({ bufferSize: val as number })}
            size="xs"
            className="w-36"
          />
        </PropertyRow>
      </InspectorSection>

      {/* Trigger & Scroll Controls */}
      <InspectorSection title="Trigger & Acquisition" icon={<Zap className="w-4 h-4 text-amber-400" />}>
        <PropertyRow label="Trigger Mode">
          <SegmentedControl
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'rising', label: 'Rising' },
              { value: 'falling', label: 'Falling' },
            ]}
            value={triggerMode}
            onChange={(val) => updateConfig({ triggerMode: val as TriggerMode })}
            size="xs"
            className="w-36"
          />
        </PropertyRow>

        <PropertyRow label="Auto Scroll">
          <Button
            variant={autoScroll ? 'success' : 'secondary'}
            size="xs"
            onClick={() => updateConfig({ autoScroll: !autoScroll })}
          >
            {autoScroll ? 'Scrolling ON' : 'Scrolling OFF'}
          </Button>
        </PropertyRow>

        <PropertyRow label="Capture State">
          <Button
            variant={isPaused ? 'danger' : 'success'}
            size="xs"
            onClick={() => updateConfig({ isPaused: !isPaused })}
          >
            {isPaused ? 'PAUSED' : 'RUNNING'}
          </Button>
        </PropertyRow>
      </InspectorSection>

      {/* Channel & Display Customization */}
      <InspectorSection title="Display Styling" icon={<Palette className="w-4 h-4 text-purple-400" />}>
        {inputPins.length > 1 && (
          <PropertyRow label="Active Channel">
            <SegmentedControl
              options={inputPins.map((pin, idx) => ({
                value: idx,
                label: `CH ${idx + 1}`,
              }))}
              value={selectedBitIndex}
              onChange={(val) => updateConfig({ selectedBitIndex: val as number })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>
        )}

        <PropertyRow label="Trace Color">
          <SegmentedControl
            options={[
              { value: 'cyan', label: 'Cyan' },
              { value: 'emerald', label: 'Green' },
              { value: 'amber', label: 'Yellow' },
              { value: 'purple', label: 'Purple' },
            ]}
            value={waveColor}
            onChange={(val) => updateConfig({ waveColor: val as WaveColor })}
            size="xs"
            className="w-36"
          />
        </PropertyRow>

        <PropertyRow label="Grid Gridlines">
          <Button
            variant={gridVisible ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => updateConfig({ gridVisible: !gridVisible })}
          >
            {gridVisible ? 'Visible' : 'Hidden'}
          </Button>
        </PropertyRow>

        <PropertyRow label="Voltage Labels">
          <Button
            variant={showLabels ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => updateConfig({ showLabels: !showLabels })}
          >
            {showLabels ? 'Show' : 'Hide'}
          </Button>
        </PropertyRow>
      </InspectorSection>
    </div>
  );
};
