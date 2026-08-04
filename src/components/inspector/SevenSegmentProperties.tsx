import React, { useState } from 'react';
import {
  SevenSegmentConfig,
  SevenSegmentDisplayMode,
  SevenSegmentColor,
  BcdInvalidBehavior,
  COLOR_CONFIGS,
} from '../../types/sevenSegment';
import { PinData } from '../../types/circuit';
import { evaluateSevenSegment } from '../../utils/sevenSegmentLogic';
import { SevenSegmentTruthTableModal } from '../ui/SevenSegmentTruthTableModal';
import {
  Table,
  Palette,
  CheckCircle2,
  XCircle,
  Sliders,
  Tv,
} from 'lucide-react';

import { InspectorSection } from '../ui/InspectorSection';
import { PropertyRow } from '../ui/PropertyRow';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import { Badge } from '../ui/Badge';

interface SevenSegmentPropertiesProps {
  nodeId: string;
  label: string;
  config: SevenSegmentConfig;
  currentInputs: PinData[];
  onUpdateLabel: (label: string) => void;
  onUpdateConfig: (config: Partial<SevenSegmentConfig>) => void;
}

export const SevenSegmentProperties: React.FC<SevenSegmentPropertiesProps> = ({
  nodeId,
  label,
  config,
  currentInputs,
  onUpdateLabel,
  onUpdateConfig,
}) => {
  const [isTruthTableOpen, setIsTruthTableOpen] = useState(false);

  const evalRes = evaluateSevenSegment(currentInputs, config);
  const { segments, decodedChar, decimalValue, binaryString, isValidBcd } = evalRes;

  const modeOptions: { value: SevenSegmentDisplayMode; label: string; desc: string }[] = [
    { value: 'binary', label: 'Binary Decoder (4-bit)', desc: 'Decodes 0000-1111 into 0-F' },
    { value: 'direct', label: 'Direct Segment Control', desc: 'Direct inputs for pins a,b,c,d,e,f,g' },
    { value: 'bcd', label: 'BCD Decoder (0-9)', desc: 'Valid BCD 0-9; invalid values configurable' },
    { value: 'hex', label: 'Hexadecimal Decoder', desc: 'Displays 0-9, A, b, C, d, E, F' },
  ];

  const colorOptions: SevenSegmentColor[] = ['red', 'green', 'blue', 'amber', 'white'];

  return (
    <div className="space-y-4 text-xs font-sans text-slate-200">
      <InspectorSection title="Display Settings" icon={<Tv className="w-4 h-4" />}>
        <PropertyRow label="Label">
          <Input
            value={label}
            onChange={(e) => onUpdateLabel(e.target.value)}
            placeholder="Display label..."
            className="w-36"
          />
        </PropertyRow>

        <PropertyRow label="Display Mode" hint={modeOptions.find((m) => m.value === config.mode)?.desc}>
          <Select
            options={modeOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
            value={config.mode}
            onChange={(val) => onUpdateConfig({ mode: val as SevenSegmentDisplayMode })}
            className="w-40"
          />
        </PropertyRow>

        <PropertyRow label="Display Type">
          <SegmentedControl
            options={[
              { value: 'common_cathode', label: 'Cathode (HIGH)' },
              { value: 'common_anode', label: 'Anode (LOW)' },
            ]}
            value={config.displayType}
            onChange={(val) => onUpdateConfig({ displayType: val as 'common_cathode' | 'common_anode' })}
            size="xs"
            className="w-48"
          />
        </PropertyRow>

        <PropertyRow label="Show Decimal Point (DP)">
          <Switch
            checked={!!config.showDecimalPoint}
            onChange={(checked) => onUpdateConfig({ showDecimalPoint: checked })}
          />
        </PropertyRow>

        {config.mode === 'bcd' && (
          <PropertyRow label="Invalid BCD Behavior">
            <Select
              options={[
                { value: 'blank', label: 'Blank (All OFF)' },
                { value: 'error', label: "Display Error ('E')" },
                { value: 'dash', label: "Display Dash ('-')" },
              ]}
              value={config.bcdInvalidBehavior}
              onChange={(val) =>
                onUpdateConfig({ bcdInvalidBehavior: val as BcdInvalidBehavior })
              }
              className="w-40"
            />
          </PropertyRow>
        )}
      </InspectorSection>

      <InspectorSection title="Appearance & LED Style" icon={<Palette className="w-4 h-4" />}>
        <PropertyRow label="Segment Color">
          <div className="flex items-center gap-1.5">
            {colorOptions.map((col) => {
              const style = COLOR_CONFIGS[col];
              const isActive = config.color === col;
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => onUpdateConfig({ color: col })}
                  title={style.label}
                  className={`w-6 h-6 rounded-lg transition-all border flex items-center justify-center cursor-pointer ${
                    isActive
                      ? 'border-white scale-110 ring-2 ring-cyan-500/50 shadow-md'
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                  style={{ backgroundColor: style.stroke }}
                >
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                </button>
              );
            })}
          </div>
        </PropertyRow>

        <PropertyRow label={`Glow Intensity (${config.glowIntensity}%)`}>
          <Slider
            min={0}
            max={100}
            value={config.glowIntensity}
            onChange={(val) => onUpdateConfig({ glowIntensity: val })}
            className="w-32"
          />
        </PropertyRow>

        <PropertyRow label={`Brightness (${config.brightness}%)`}>
          <Slider
            min={10}
            max={100}
            value={config.brightness}
            onChange={(val) => onUpdateConfig({ brightness: val })}
            className="w-32"
          />
        </PropertyRow>
      </InspectorSection>

      <InspectorSection title="Educational Analysis" icon={<Tv className="w-4 h-4" />}>
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Decoded Character:</span>
            <Badge variant="cyan" size="md">
              '{decodedChar === ' ' ? 'BLANK' : decodedChar}'
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1.5 border-t border-slate-800">
            <div>
              <span className="text-slate-500 block">Binary:</span>
              <span className="font-bold text-slate-200">{binaryString || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Decimal / Hex:</span>
              <span className="font-bold text-slate-200">
                {decimalValue !== null ? `${decimalValue} (0x${decimalValue.toString(16).toUpperCase()})` : 'N/A'}
              </span>
            </div>
          </div>

          {config.mode === 'bcd' && (
            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">BCD Validation:</span>
              {isValidBcd ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Valid BCD
                </span>
              ) : (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Invalid (&gt; 9)
                </span>
              )}
            </div>
          )}
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-mono block mb-1 uppercase">
            Segment States Matrix (a-g)
          </span>
          <div className="grid grid-cols-4 gap-1 text-[11px] font-mono">
            {Object.entries(segments).map(([seg, isOn]) => {
              if (seg === 'dp' && !config.showDecimalPoint) return null;
              return (
                <div
                  key={seg}
                  className={`px-1.5 py-1 rounded border text-center font-bold flex flex-col items-center justify-center ${
                    isOn
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-[0_0_6px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900/60 border-slate-800 text-slate-600'
                  }`}
                >
                  <span className="text-[9px] uppercase text-slate-400">{seg}</span>
                  <span>{isOn ? '1 (ON)' : '0 (OFF)'}</span>
                </div>
              );
            })}
          </div>
        </div>

        <Button
          variant="cyan"
          size="sm"
          leftIcon={<Table className="w-4 h-4" />}
          onClick={() => setIsTruthTableOpen(true)}
          className="w-full mt-2"
        >
          7-Segment Truth Table
        </Button>
      </InspectorSection>

      <SevenSegmentTruthTableModal
        isOpen={isTruthTableOpen}
        onClose={() => setIsTruthTableOpen(false)}
        config={config}
        currentInputs={currentInputs}
        nodeLabel={label}
      />
    </div>
  );
};

