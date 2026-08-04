import React from 'react';
import { MultiInputConfig } from '../../types/multiInput';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Plus, ArrowUpCircle, ArrowDownCircle, RefreshCw, Dices, Sliders, Hash, Zap } from 'lucide-react';

import { InspectorSection } from '../ui/InspectorSection';
import { PropertyRow } from '../ui/PropertyRow';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { SegmentedControl } from '../ui/SegmentedControl';

interface MultiInputPropertiesProps {
  nodeId: string;
  label: string;
  config: MultiInputConfig;
}

export const MultiInputProperties: React.FC<MultiInputPropertiesProps> = ({
  nodeId,
  label,
  config,
}) => {
  const updateNodeLabel = useCircuitStore((s) => s.updateNodeLabel);
  const updateMultiInputConfig = useCircuitStore((s) => s.updateMultiInputConfig);
  const toggleMultiInputBit = useCircuitStore((s) => s.toggleMultiInputBit);
  const setAllMultiInput = useCircuitStore((s) => s.setAllMultiInput);
  const invertAllMultiInput = useCircuitStore((s) => s.invertAllMultiInput);
  const randomizeMultiInput = useCircuitStore((s) => s.randomizeMultiInput);
  const incrementMultiInputCounter = useCircuitStore((s) => s.incrementMultiInputCounter);

  const { inputCount, values, labels } = config;

  let decimalVal = 0;
  values.forEach((v, idx) => {
    if (v === 1) decimalVal += Math.pow(2, idx);
  });

  const binaryString = [...values]
    .reverse()
    .map((v) => (v === 1 ? '1' : '0'))
    .join('');

  const hexString = '0x' + decimalVal.toString(16).toUpperCase().padStart(Math.ceil(inputCount / 4), '0');

  const handleCountChange = (newCount: number) => {
    const clamped = Math.max(1, Math.min(32, newCount));
    updateMultiInputConfig(nodeId, { inputCount: clamped });
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      <InspectorSection title="Multi-Input Bus Settings" icon={<Sliders className="w-4 h-4" />}>
        <PropertyRow label="Label">
          <Input
            value={label}
            onChange={(e) => updateNodeLabel(nodeId, e.target.value)}
            placeholder="Bus label..."
            className="w-36"
          />
        </PropertyRow>

        <PropertyRow label="Pin Count (1-32)">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="32"
              value={inputCount}
              onChange={(e) => handleCountChange(parseInt(e.target.value, 10) || 1)}
              className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-center font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-400 font-mono">Pins</span>
          </div>
        </PropertyRow>

        <PropertyRow label="Bus Presets">
          <SegmentedControl
            options={[
              { value: 2, label: '2-Bit' },
              { value: 4, label: '4-Bit' },
              { value: 8, label: '8-Bit' },
              { value: 16, label: '16-Bit' },
            ]}
            value={inputCount}
            onChange={(val) => handleCountChange(val as number)}
            size="xs"
            className="w-48"
          />
        </PropertyRow>
      </InspectorSection>

      <InspectorSection title="Value Representations" icon={<Hash className="w-4 h-4" />}>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 font-mono space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px]">BIN:</span>
            <span className="font-bold text-emerald-400 tracking-wider truncate max-w-[170px]">
              {binaryString}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px]">DEC:</span>
            <span className="font-bold text-cyan-300">{decimalVal}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px]">HEX:</span>
            <span className="font-bold text-purple-300">{hexString}</span>
          </div>
        </div>
      </InspectorSection>

      <InspectorSection title="Batch Quick Actions" icon={<Zap className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-1.5 font-mono">
          <Button
            variant="success"
            size="xs"
            leftIcon={<ArrowUpCircle className="w-3.5 h-3.5" />}
            onClick={() => setAllMultiInput(nodeId, 1)}
          >
            All HIGH
          </Button>

          <Button
            variant="outline"
            size="xs"
            leftIcon={<ArrowDownCircle className="w-3.5 h-3.5" />}
            onClick={() => setAllMultiInput(nodeId, 0)}
          >
            All LOW
          </Button>

          <Button
            variant="cyan"
            size="xs"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => invertAllMultiInput(nodeId)}
          >
            Invert All
          </Button>

          <Button
            variant="ghost"
            size="xs"
            leftIcon={<Dices className="w-3.5 h-3.5 text-purple-400" />}
            onClick={() => randomizeMultiInput(nodeId)}
          >
            Randomize
          </Button>
        </div>

        <Button
          variant="secondary"
          size="xs"
          leftIcon={<Plus className="w-4 h-4 text-amber-400" />}
          onClick={() => incrementMultiInputCounter(nodeId)}
          className="w-full mt-2"
        >
          Binary Counter Step (+1)
        </Button>
      </InspectorSection>

      <InspectorSection title={`Individual Bit Toggles (${inputCount})`} icon={<Sliders className="w-4 h-4" />}>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {values.map((val, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">{labels[idx] || `Bit ${idx}`}</span>
                <span className="text-[10px] text-slate-500">(b{idx})</span>
              </div>

              <Button
                variant={val === 1 ? 'success' : 'outline'}
                size="xs"
                onClick={() => toggleMultiInputBit(nodeId, idx)}
              >
                {val === 1 ? '1 (HIGH)' : '0 (LOW)'}
              </Button>
            </div>
          ))}
        </div>
      </InspectorSection>
    </div>
  );
};

