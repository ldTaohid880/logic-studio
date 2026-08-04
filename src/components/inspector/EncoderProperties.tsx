import React, { useState } from 'react';
import {
  EncoderConfig,
  EncoderInputCount,
  EncoderActiveMode,
  EncoderPriorityDirection,
  EncoderOutputFormat,
  EncoderState,
} from '../../types/encoder';
import { Sliders, Table, Cpu, Settings } from 'lucide-react';
import { EncoderTruthTableModal } from '../ui/EncoderTruthTableModal';
import { SignalValue } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { evaluateEncoder } from '../../simulation/encoderLogic';
import { getEncoderExplanation } from '../../utils/encoderExplanation';

import { InspectorSection } from '../ui/InspectorSection';
import { PropertyRow } from '../ui/PropertyRow';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { SegmentedControl } from '../ui/SegmentedControl';

interface EncoderPropertiesProps {
  nodeId: string;
  label: string;
  config: EncoderConfig;
  state?: EncoderState;
  currentInputs?: SignalValue[];
  onUpdateLabel: (label: string) => void;
  onUpdateConfig: (config: Partial<EncoderConfig>) => void;
}

export const EncoderProperties: React.FC<EncoderPropertiesProps> = ({
  nodeId,
  label,
  config,
  state,
  currentInputs = [],
  onUpdateLabel,
  onUpdateConfig,
}) => {
  const [isTruthTableOpen, setIsTruthTableOpen] = useState(false);

  const toggleEncoderInputPin = useCircuitStore((s) => s.toggleEncoderInputPin);
  const setAllEncoderInputs = useCircuitStore((s) => s.setAllEncoderInputs);
  const invertAllEncoderInputs = useCircuitStore((s) => s.invertAllEncoderInputs);

  const evaluated = evaluateEncoder(currentInputs, config);
  const liveState = state || evaluated.state;
  const explanation = getEncoderExplanation(config, liveState);

  const isInputActiveHigh = (config.inputActiveMode ?? config.activeMode ?? 'high') === 'high';
  const isOutputActiveHigh = (config.outputActiveMode ?? config.activeMode ?? 'high') === 'high';

  return (
    <div className="space-y-4 text-xs font-sans text-slate-200">
      <Button
        variant="cyan"
        size="sm"
        leftIcon={<Table className="w-4 h-4" />}
        onClick={() => setIsTruthTableOpen(true)}
        className="w-full"
      >
        View Truth Table & Logic Guide
      </Button>

      <InspectorSection title="General Settings" icon={<Settings className="w-4 h-4" />}>
        <PropertyRow label="Label">
          <Input
            value={label}
            onChange={(e) => onUpdateLabel(e.target.value)}
            placeholder="Encoder label..."
            className="w-36"
          />
        </PropertyRow>

        <PropertyRow label="Inputs Count">
          <SegmentedControl
            options={[
              { value: 4, label: '4' },
              { value: 8, label: '8' },
              { value: 16, label: '16' },
              { value: 32, label: '32' },
            ]}
            value={config.inputs}
            onChange={(val) => onUpdateConfig({ inputs: val as EncoderInputCount })}
            size="xs"
            className="w-36"
          />
        </PropertyRow>
      </InspectorSection>

      <InspectorSection title="Independent Logic Polarity" icon={<Cpu className="w-4 h-4" />}>
        <PropertyRow label="Input Logic" hint={`Active when ${isInputActiveHigh ? 'HIGH (1)' : 'LOW (0)'}`}>
          <SegmentedControl
            options={[
              { value: 'high', label: 'Active HIGH' },
              { value: 'low', label: 'Active LOW' },
            ]}
            value={isInputActiveHigh ? 'high' : 'low'}
            onChange={(val) => onUpdateConfig({ inputActiveMode: val as EncoderActiveMode })}
            size="xs"
            className="w-36"
          />
        </PropertyRow>

        <PropertyRow label="Output Logic" hint={isOutputActiveHigh ? 'Direct Binary' : 'Inverted Binary'}>
          <SegmentedControl
            options={[
              { value: 'high', label: 'Active HIGH' },
              { value: 'low', label: 'Active LOW' },
            ]}
            value={isOutputActiveHigh ? 'high' : 'low'}
            onChange={(val) => onUpdateConfig({ outputActiveMode: val as EncoderActiveMode })}
            size="xs"
            className="w-36"
          />
        </PropertyRow>
      </InspectorSection>

      <InspectorSection title={`Manual Input Controls (${config.inputs} Inputs)`} icon={<Sliders className="w-4 h-4" />}>
        <div className="flex gap-1 font-mono justify-end mb-2">
          <Button variant="ghost" size="xs" onClick={() => setAllEncoderInputs(nodeId, 1)}>
            All 1s
          </Button>
          <Button variant="ghost" size="xs" onClick={() => setAllEncoderInputs(nodeId, 0)}>
            All 0s
          </Button>
          <Button variant="ghost" size="xs" onClick={() => invertAllEncoderInputs(nodeId)}>
            Invert
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto pr-1">
          {Array.from({ length: config.inputs }, (_, i) => {
            const val = currentInputs[i] ?? -1;
            const isActive = isInputActiveHigh ? val === 1 : val === 0;
            return (
              <button
                key={`input-ctl-${i}`}
                onClick={() => toggleEncoderInputPin(nodeId, i)}
                className={`py-1.5 px-2 rounded-lg border font-mono text-[10px] flex items-center justify-between transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                    : val === 1
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <span className="font-bold">D{i}</span>
                <span
                  className={`px-1 rounded text-[9px] font-bold ${
                    val === 1
                      ? 'bg-emerald-500 text-slate-950'
                      : val === 0
                      ? 'bg-slate-700 text-slate-300'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  {val === -1 ? '?' : val}
                </span>
              </button>
            );
          })}
        </div>
      </InspectorSection>

      <InspectorSection title="Live Encoder Analysis" icon={<Cpu className="w-4 h-4" />}>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-cyan-400 font-bold">Analysis Status</span>
            <Badge
              variant={
                explanation.statusType === 'error'
                  ? 'rose'
                  : explanation.statusType === 'warning'
                  ? 'amber'
                  : 'emerald'
              }
            >
              {explanation.statusType.toUpperCase()}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Active Input:</span>
              <span className="text-slate-200 font-bold">{explanation.activeInputText}</span>
            </div>

            <div className="text-[10px] text-slate-400 bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
              {explanation.inputMeaningText}
            </div>

            <div className="flex justify-between pt-1">
              <span className="text-slate-400">Internal Binary Index:</span>
              <span className="text-emerald-400 font-bold">{explanation.binaryIndexText}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Output Pin Binary:</span>
              <span className="text-cyan-400 font-bold">{explanation.finalOutputText}</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-300 pt-1 border-t border-slate-800/80 leading-relaxed font-sans">
            {explanation.explanation}
          </p>
        </div>
      </InspectorSection>

      <InspectorSection title="Priority & Signal Configuration" icon={<Settings className="w-4 h-4" />}>
        <PropertyRow label="Priority Encoding">
          <Switch
            checked={!!config.priority}
            onChange={(checked) => onUpdateConfig({ priority: checked })}
          />
        </PropertyRow>

        {config.priority && (
          <PropertyRow label="Priority Direction">
            <SegmentedControl
              options={[
                { value: 'highest', label: 'Highest First' },
                { value: 'lowest', label: 'Lowest First' },
              ]}
              value={config.priorityDirection || 'highest'}
              onChange={(val) => onUpdateConfig({ priorityDirection: val as EncoderPriorityDirection })}
              size="xs"
              className="w-36"
            />
          </PropertyRow>
        )}

        <PropertyRow label="Valid Output (V)">
          <Switch
            checked={!!config.showValid}
            onChange={(checked) => onUpdateConfig({ showValid: checked })}
          />
        </PropertyRow>

        <PropertyRow label="Enable Output (EO)">
          <Switch
            checked={!!config.showEnableOutput}
            onChange={(checked) => onUpdateConfig({ showEnableOutput: checked })}
          />
        </PropertyRow>

        <PropertyRow label="Group Signal (GS)">
          <Switch
            checked={!!config.showGroupSignal}
            onChange={(checked) => onUpdateConfig({ showGroupSignal: checked })}
          />
        </PropertyRow>

        <PropertyRow label="Display Format">
          <SegmentedControl
            options={[
              { value: 'binary', label: 'Binary' },
              { value: 'decimal', label: 'Decimal' },
              { value: 'binary_decimal', label: 'Both' },
            ]}
            value={config.outputFormat || 'binary'}
            onChange={(val) => onUpdateConfig({ outputFormat: val as EncoderOutputFormat })}
            size="xs"
            className="w-36"
          />
        </PropertyRow>
      </InspectorSection>

      <EncoderTruthTableModal
        isOpen={isTruthTableOpen}
        onClose={() => setIsTruthTableOpen(false)}
        config={config}
        encoderState={liveState}
        currentInputs={currentInputs}
        nodeLabel={label}
      />
    </div>
  );
};

