import React, { useState } from 'react';
import { ClockConfig, ClockState } from '../../types/clock';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Play, Pause, SkipForward, RotateCcw, Activity, Sliders, Zap } from 'lucide-react';
import { OscilloscopeWaveform } from '../nodes/OscilloscopeWaveform';

import { InspectorSection } from '../ui/InspectorSection';
import { PropertyRow } from '../ui/PropertyRow';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SegmentedControl } from '../ui/SegmentedControl';

interface ClockPropertiesProps {
  nodeId: string;
  label: string;
  config: ClockConfig;
  state: ClockState;
  outputValue: number;
}

const STANDARD_FREQS = [1, 2, 5, 10];

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

  const { frequencyHz, startState, isCustomFreq } = config;
  const { status, tickCount } = state;
  const isHigh = outputValue === 1;

  const [customFreq, setCustomFreq] = useState(frequencyHz.toString());

  const handleSelectFreq = (hz: number) => {
    setCustomFreq(hz.toString());
    updateClockConfig(nodeId, { frequencyHz: hz, isCustomFreq: false });
  };

  const handleCustomFreqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomFreq(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && num <= 100) {
      updateClockConfig(nodeId, { frequencyHz: num, isCustomFreq: true });
    }
  };

  const freqOptions = [
    { value: 1, label: '1Hz' },
    { value: 2, label: '2Hz' },
    { value: 5, label: '5Hz' },
    { value: 10, label: '10Hz' },
  ];

  const startStateOptions = [
    { value: 'low', label: 'LOW (0)' },
    { value: 'high', label: 'HIGH (1)' },
  ];

  return (
    <div className="space-y-4 font-sans text-xs">
      <InspectorSection title="Clock Settings" icon={<Sliders className="w-4 h-4" />}>
        <PropertyRow label="Label">
          <Input
            value={label}
            onChange={(e) => updateNodeLabel(nodeId, e.target.value)}
            placeholder="Clock label..."
            className="w-36"
          />
        </PropertyRow>

        <PropertyRow label="Start State">
          <SegmentedControl
            options={startStateOptions}
            value={startState}
            onChange={(val) => updateClockConfig(nodeId, { startState: val as 'low' | 'high' })}
            size="xs"
            className="w-36"
          />
        </PropertyRow>

        <PropertyRow label="Frequency">
          <SegmentedControl
            options={freqOptions}
            value={isCustomFreq ? 0 : frequencyHz}
            onChange={(val) => handleSelectFreq(val as number)}
            size="xs"
            className="w-36"
          />
        </PropertyRow>

        <PropertyRow label="Custom Hz">
          <Input
            type="number"
            min="0.1"
            max="100"
            step="0.1"
            value={customFreq}
            onChange={handleCustomFreqChange}
            className="w-36 text-cyan-400 font-bold"
          />
        </PropertyRow>
      </InspectorSection>

      <InspectorSection title="Live Signal & Oscilloscope" icon={<Activity className="w-4 h-4" />}>
        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] uppercase">Clock Status</span>
            <Badge
              variant={status === 'running' ? 'emerald' : status === 'paused' ? 'amber' : 'slate'}
              pulse={status === 'running'}
            >
              {status.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-xs mb-1">
            <div>
              <span className="text-[10px] text-slate-500 block">LED Signal</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isHigh ? 'bg-emerald-500 shadow-[0_0_8px_#22c55e]' : 'bg-slate-700'
                  }`}
                />
                <span className={`font-bold ${isHigh ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {isHigh ? '1 (HIGH)' : '0 (LOW)'}
                </span>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Total Ticks</span>
              <span className="font-bold text-slate-200 mt-0.5 block">{tickCount}</span>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-800">
            <OscilloscopeWaveform value={outputValue} status={status} frequencyHz={frequencyHz} />
          </div>
        </div>
      </InspectorSection>

      <InspectorSection title="Clock Simulation Controls" icon={<Zap className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            variant={status === 'running' ? 'outline' : 'success'}
            size="xs"
            disabled={status === 'running'}
            leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
            onClick={() => startClockNode(nodeId)}
          >
            Play
          </Button>

          <Button
            variant="outline"
            size="xs"
            disabled={status !== 'running'}
            leftIcon={<Pause className="w-3.5 h-3.5 fill-current text-amber-400" />}
            onClick={() => pauseClockNode(nodeId)}
            className="border-amber-500/40 text-amber-300"
          >
            Pause
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <Button
            variant="secondary"
            size="xs"
            leftIcon={<SkipForward className="w-3.5 h-3.5 text-cyan-400" />}
            onClick={() => singleTickClockNode(nodeId)}
          >
            Step
          </Button>

          <Button
            variant="danger"
            size="xs"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={() => resetClockNode(nodeId)}
          >
            Reset
          </Button>
        </div>
      </InspectorSection>
    </div>
  );
};
