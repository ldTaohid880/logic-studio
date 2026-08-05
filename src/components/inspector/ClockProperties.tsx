import React, { useState } from 'react';
import { ClockConfig, ClockState, FrequencyUnit } from '../../types/clock';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Play, Pause, SkipForward, RotateCcw, Activity, Sliders, Zap, ToggleLeft } from 'lucide-react';
import { OscilloscopeWaveform } from '../nodes/OscilloscopeWaveform';

import { InspectorSection } from '../ui/InspectorSection';
import { PropertyRow } from '../ui/PropertyRow';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Switch } from '../ui/Switch';
import { Slider } from '../ui/Slider';

interface ClockPropertiesProps {
  nodeId: string;
  label: string;
  config: ClockConfig;
  state: ClockState;
  outputValue: number;
}

export const ClockProperties: React.FC<ClockPropertiesProps> = ({
  nodeId,
  label,
  config,
  state,
  outputValue,
}) => {
  const updateNodeLabel = useCircuitStore((s) => s.updateNodeLabel);
  const updateClockConfig = useCircuitStore((s) => s.updateClockConfig);
  const startClockNode = useCircuitStore((s) => s.startClockNode);
  const pauseClockNode = useCircuitStore((s) => s.pauseClockNode);
  const resetClockNode = useCircuitStore((s) => s.resetClockNode);
  const singleTickClockNode = useCircuitStore((s) => s.singleTickClockNode);
  const triggerManualPulse = useCircuitStore((s) => s.triggerManualPulse);

  const {
    frequencyHz = 1,
    frequencyUnit = 'Hz',
    startState = 'low',
    dutyCycle = 50,
    startAutomatically = true,
    enabled = true,
    pulseWidthMs = 100,
  } = config;

  const { status, tickCount } = state;
  const isHigh = outputValue === 1;

  const [freqVal, setFreqVal] = useState(frequencyHz.toString());
  const [pulseWidthVal, setPulseWidthVal] = useState(pulseWidthMs.toString());

  const handleFreqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFreqVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      updateClockConfig(nodeId, { frequencyHz: num });
    }
  };

  const handleUnitChange = (val: string) => {
    updateClockConfig(nodeId, { frequencyUnit: val as FrequencyUnit });
  };

  const handlePulseWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPulseWidthVal(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0 && num <= 5000) {
      updateClockConfig(nodeId, { pulseWidthMs: num });
    }
  };

  const startStateOptions = [
    { value: 'low', label: 'LOW (0)' },
    { value: 'high', label: 'HIGH (1)' },
  ];

  const unitOptions = [
    { value: 'Hz', label: 'Hz' },
    { value: 'kHz', label: 'kHz' },
    { value: 'MHz', label: 'MHz' },
  ];

  const isRunning = status === 'running' && enabled;

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* 1. Signal Configuration Section */}
      <InspectorSection title="Signal Configuration" icon={<Sliders className="w-4 h-4 text-cyan-400" />}>
        <PropertyRow label="Label" hint="Name/identifier of the clock node">
          <Input
            value={label}
            onChange={(e) => updateNodeLabel(nodeId, e.target.value)}
            placeholder="Clock label..."
            className="w-36"
          />
        </PropertyRow>

        <PropertyRow label="Frequency" hint="Oscillation frequency value">
          <Input
            type="number"
            min="0.1"
            max="1000000"
            step="any"
            value={freqVal}
            disabled={!enabled}
            onChange={handleFreqChange}
            className="w-36 text-cyan-400 font-bold font-mono"
          />
        </PropertyRow>

        <PropertyRow label="Unit" hint="Frequency unit scale">
          <SegmentedControl
            options={unitOptions}
            value={frequencyUnit || 'Hz'}
            disabled={!enabled}
            onChange={handleUnitChange}
            size="xs"
            className="w-36 font-mono"
          />
        </PropertyRow>

        <PropertyRow label={`Duty Cycle (${dutyCycle}%)`} hint="Percentage of period in high state">
          <Slider
            min={1}
            max={99}
            value={dutyCycle}
            disabled={!enabled}
            onChange={(val) => updateClockConfig(nodeId, { dutyCycle: val })}
            className="w-32"
          />
        </PropertyRow>

        <PropertyRow label="Initial State" hint="Signal level before starting simulation">
          <SegmentedControl
            options={startStateOptions}
            value={startState}
            disabled={!enabled}
            onChange={(val) => updateClockConfig(nodeId, { startState: val as 'low' | 'high' })}
            size="xs"
            className="w-36"
          />
        </PropertyRow>
      </InspectorSection>

      {/* 2. Behavior Settings Section */}
      <InspectorSection title="Behavior Settings" icon={<ToggleLeft className="w-4 h-4 text-emerald-400" />}>
        <PropertyRow label="Enabled" hint="Allows the clock to oscillate">
          <Switch
            checked={enabled}
            onChange={(checked) => updateClockConfig(nodeId, { enabled: checked })}
          />
        </PropertyRow>

        <PropertyRow label="Start Automatically" hint="Oscillates immediately on load">
          <Switch
            checked={startAutomatically}
            disabled={!enabled}
            onChange={(checked) => updateClockConfig(nodeId, { startAutomatically: checked })}
          />
        </PropertyRow>
      </InspectorSection>

      {/* 3. Manual Pulse Section */}
      <InspectorSection title="Manual Pulse" icon={<Zap className="w-4 h-4 text-amber-400" />}>
        <PropertyRow label="Pulse Width" hint="Pulse duration in milliseconds">
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="10"
              max="5000"
              step="10"
              value={pulseWidthVal}
              onChange={handlePulseWidthChange}
              className="w-24 text-amber-400 font-bold font-mono"
            />
            <span className="text-[10px] text-slate-500 font-mono">ms</span>
          </div>
        </PropertyRow>

        <Button
          variant="outline"
          size="sm"
          onClick={() => triggerManualPulse(nodeId)}
          className="w-full border-amber-500/40 text-amber-300 hover:bg-amber-500/10 mt-1 cursor-pointer font-bold tracking-wide transition-colors"
        >
          Inject Manual Pulse
        </Button>
      </InspectorSection>

      {/* 4. Live Waveform Preview */}
      <InspectorSection title="Live Output Stream" icon={<Activity className="w-4 h-4 text-cyan-400" />}>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] uppercase">STATUS</span>
            <Badge
              variant={!enabled ? 'slate' : isRunning ? 'emerald' : status === 'paused' ? 'amber' : 'slate'}
              pulse={isRunning}
            >
              {!enabled ? 'DISABLED' : status.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-900 text-xs">
            <div>
              <span className="text-[9px] text-slate-500 block uppercase">Signal</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isHigh && enabled ? 'bg-emerald-400 shadow-[0_0_4px_#34d399]' : 'bg-slate-800'
                  }`}
                />
                <span className={`font-bold text-[10px] ${isHigh && enabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {isHigh && enabled ? 'HIGH (1)' : 'LOW (0)'}
                </span>
              </div>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block uppercase">Ticks</span>
              <span className="font-bold text-slate-300 mt-0.5 block">{tickCount}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-900">
            <OscilloscopeWaveform value={enabled ? outputValue : 0} status={enabled ? status : 'stopped'} frequencyHz={frequencyHz} />
          </div>
        </div>
      </InspectorSection>

      {/* 5. Instrument Controls */}
      <InspectorSection title="Instrument Controls" icon={<Zap className="w-4 h-4 text-cyan-400" />}>
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            variant={isRunning ? 'outline' : 'success'}
            size="xs"
            disabled={status === 'running' || !enabled}
            leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
            onClick={() => startClockNode(nodeId)}
            className="cursor-pointer"
          >
            Run
          </Button>

          <Button
            variant="outline"
            size="xs"
            disabled={status !== 'running' || !enabled}
            leftIcon={<Pause className="w-3.5 h-3.5 fill-current" />}
            onClick={() => pauseClockNode(nodeId)}
            className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 cursor-pointer"
          >
            Pause
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <Button
            variant="secondary"
            size="xs"
            disabled={!enabled}
            leftIcon={<SkipForward className="w-3.5 h-3.5" />}
            onClick={() => singleTickClockNode(nodeId)}
            className="cursor-pointer"
          >
            Step
          </Button>

          <Button
            variant="danger"
            size="xs"
            disabled={!enabled}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={() => resetClockNode(nodeId)}
            className="cursor-pointer"
          >
            Reset
          </Button>
        </div>
      </InspectorSection>
    </div>
  );
};
