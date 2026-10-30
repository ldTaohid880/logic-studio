import React, { useState } from 'react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { OscilloscopeConfig, DEFAULT_OSCILLOSCOPE_CONFIG, WaveColor, TriggerMode } from '../../types/oscilloscope';
import { InspectorSection } from '../ui/InspectorSection';
import { PropertyRow } from '../ui/PropertyRow';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Gauge, Zap, Palette, Play, Pause, Trash2 } from 'lucide-react';
import { Input } from '../ui/Input';

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
    bufferSize = 2000,
    triggerMode = 'auto',
    autoScroll = true,
    waveColor = 'cyan',
    gridVisible = true,
    showLabels = true,
    isPaused = false,
    selectedBitIndex = 0,
  } = config;

  const [sampleRateVal, setSampleRateVal] = useState(sampleRateHz.toString());
  const [bufferSizeVal, setBufferSizeVal] = useState(bufferSize.toString());
  const [timePerDivVal, setTimePerDivVal] = useState(timePerDivMs.toString());

  const updateConfig = (partial: Partial<OscilloscopeConfig>) => {
    useCircuitStore.getState().updateNodeData(nodeId, { scopeConfig: { ...config, ...partial } });
  };

  const handleClearHistory = () => {
    useCircuitStore.getState().clearOscilloscopeBuffer(nodeId);
    useCircuitStore.getState().showToast('Oscilloscope capture cleared');
  };

  const triggerModeOptions = [
    { value: 'auto', label: 'Auto' },
    { value: 'rising', label: 'Rising ↗' },
    { value: 'falling', label: 'Falling ↘' },
  ];

  const colorOptions = [
    { value: 'cyan', label: 'Cyan' },
    { value: 'emerald', label: 'Green' },
    { value: 'amber', label: 'Yellow' },
    { value: 'purple', label: 'Purple' },
    { value: 'rose', label: 'Rose' },
  ];

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* 1. Acquisition Settings */}
      <InspectorSection title="Acquisition" icon={<Gauge className="w-4 h-4 text-cyan-400" />}>
        <PropertyRow label="Sample Rate (Hz)" hint="Frequency of signal sampling">
          <Input
            type="number"
            min="10"
            max="100000"
            step="10"
            value={sampleRateVal}
            onChange={(e) => {
              setSampleRateVal(e.target.value);
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val > 0) updateConfig({ sampleRateHz: val });
            }}
            className="w-36 font-mono text-cyan-400 font-bold"
          />
        </PropertyRow>

        <PropertyRow label="Buffer Size" hint="Maximum captured samples limit">
          <Input
            type="number"
            min="100"
            max="50000"
            step="100"
            value={bufferSizeVal}
            onChange={(e) => {
              setBufferSizeVal(e.target.value);
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val > 0) updateConfig({ bufferSize: val });
            }}
            className="w-36 font-mono"
          />
        </PropertyRow>

        <PropertyRow label="Trigger Mode" hint="Selects stabilization lock mode">
          <SegmentedControl
            options={triggerModeOptions}
            value={triggerMode}
            onChange={(val) => updateConfig({ triggerMode: val as TriggerMode })}
            size="xs"
            className="w-36"
          />
        </PropertyRow>
      </InspectorSection>

      {/* 2. Display Settings */}
      <InspectorSection title="Display" icon={<Palette className="w-4 h-4 text-purple-400" />}>
        <PropertyRow label="Time / Div (ms)" hint="Width of each grid division in milliseconds">
          <Input
            type="number"
            min="0.1"
            max="10000"
            step="any"
            value={timePerDivVal}
            onChange={(e) => {
              setTimePerDivVal(e.target.value);
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val > 0) updateConfig({ timePerDivMs: val });
            }}
            className="w-36 font-mono text-purple-400 font-bold"
          />
        </PropertyRow>

        <PropertyRow label="Trace Color" hint="Waveform signal line theme">
          <SegmentedControl
            options={colorOptions}
            value={waveColor}
            onChange={(val) => updateConfig({ waveColor: val as WaveColor })}
            size="xs"
            className="w-36"
          />
        </PropertyRow>

        {inputPins.length > 1 && (
          <PropertyRow label="Active Channel" hint="Select multi-bit input bit channel">
            <SegmentedControl
              options={inputPins.map((pin, idx) => ({
                value: idx,
                label: `CH ${idx + 1}`,
              }))}
              value={selectedBitIndex}
              onChange={(val) => updateConfig({ selectedBitIndex: val as number })}
              size="xs"
              className="w-36 font-mono"
            />
          </PropertyRow>
        )}

        <PropertyRow label="Grid Lines" hint="Toggles backdrop grid lines">
          <Switch
            checked={gridVisible}
            onChange={(checked) => updateConfig({ gridVisible: checked })}
          />
        </PropertyRow>

        <PropertyRow label="Voltage Labels" hint="Shows logic level guides">
          <Switch
            checked={showLabels}
            onChange={(checked) => updateConfig({ showLabels: checked })}
          />
        </PropertyRow>
      </InspectorSection>

      {/* 3. Control Operations */}
      <InspectorSection title="Controls" icon={<Zap className="w-4 h-4 text-amber-400" />}>
        <PropertyRow label="Pause Capture" hint="Holds current capture buffer scroll">
          <Switch
            checked={isPaused}
            onChange={(checked) => updateConfig({ isPaused: checked })}
          />
        </PropertyRow>

        <PropertyRow label="Auto Scroll" hint="Pins viewport to the newest samples">
          <Switch
            checked={autoScroll}
            onChange={(checked) => updateConfig({ autoScroll: checked })}
          />
        </PropertyRow>

        <div className="grid grid-cols-2 gap-1.5 pt-1.5">
          <Button
            variant={isPaused ? 'success' : 'outline'}
            size="xs"
            leftIcon={isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            onClick={() => updateConfig({ isPaused: !isPaused })}
            className="cursor-pointer"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>

          <Button
            variant="danger"
            size="xs"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={handleClearHistory}
            className="cursor-pointer"
          >
            Clear
          </Button>
        </div>
      </InspectorSection>
    </div>
  );
};
