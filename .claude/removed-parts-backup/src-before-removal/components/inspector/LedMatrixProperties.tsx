import React from 'react';
import { LedMatrixConfig, LED_MATRIX_COLORS, LedMatrixColor, LedMatrixSize } from '../../types/ledMatrix';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Tv, Palette, Sliders } from 'lucide-react';
import { InspectorSection } from '../ui/InspectorSection';
import { PropertyRow } from '../ui/PropertyRow';
import { Input } from '../ui/Input';
import { Switch } from '../ui/Switch';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Slider } from '../ui/Slider';

interface LedMatrixPropertiesProps {
  nodeId: string;
  label: string;
  config: LedMatrixConfig;
}

export const LedMatrixProperties: React.FC<LedMatrixPropertiesProps> = ({
  nodeId,
  label,
  config,
}) => {
  const updateNodeLabel = useCircuitStore((s) => s.updateNodeLabel);
  const updateLedMatrixConfig = useCircuitStore((s) => s.updateLedMatrixConfig);

  const {
    size = '8x8',
    showGrid = true,
    pixelSpacing = 2,
    brightness = 1.0,
    rowActiveLevel = 1,
    colActiveLevel = 0,
    color = 'green',
  } = config;

  const colorOptions: LedMatrixColor[] = ['red', 'green', 'blue', 'yellow', 'cyan'];

  return (
    <div className="space-y-4 text-xs font-sans text-slate-200">
      {/* 1. General Config */}
      <InspectorSection title="Display Configuration" icon={<Tv className="w-4 h-4 text-purple-400" />}>
        <PropertyRow label="Label">
          <Input
            value={label}
            onChange={(e) => updateNodeLabel(nodeId, e.target.value)}
            placeholder="LED Matrix label..."
            className="w-36"
          />
        </PropertyRow>

        <PropertyRow label="Matrix Size">
          <SegmentedControl
            options={[
              { value: '8x8', label: '8 × 8' },
              { value: '16x16', label: '16 × 16' },
            ]}
            value={size}
            onChange={(val) => updateLedMatrixConfig(nodeId, { size: val as LedMatrixSize })}
            size="xs"
            className="w-36"
          />
        </PropertyRow>

        <PropertyRow label="Grid Lines">
          <Switch
            checked={showGrid}
            onChange={(checked) => updateLedMatrixConfig(nodeId, { showGrid: checked })}
          />
        </PropertyRow>
      </InspectorSection>

      {/* 2. LED Appearance */}
      <InspectorSection title="Appearance & Styles" icon={<Palette className="w-4 h-4 text-emerald-400" />}>
        <PropertyRow label="LED Color">
          <div className="flex items-center gap-1.5">
            {colorOptions.map((col) => {
              const style = LED_MATRIX_COLORS[col];
              const isActive = color === col;
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => updateLedMatrixConfig(nodeId, { color: col })}
                  title={style.label}
                  className={`w-6 h-6 rounded-lg transition-all border flex items-center justify-center cursor-pointer ${
                    isActive
                      ? 'border-white scale-110 ring-2 ring-purple-500/50 shadow-md'
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                  style={{ backgroundColor: style.active }}
                  aria-label={style.label}
                >
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                </button>
              );
            })}
          </div>
        </PropertyRow>

        <PropertyRow label={`Brightness (${Math.round(brightness * 100)}%)`}>
          <Slider
            min={10}
            max={100}
            value={Math.round(brightness * 100)}
            onChange={(val) => updateLedMatrixConfig(nodeId, { brightness: val / 100 })}
            className="w-32"
          />
        </PropertyRow>

        <PropertyRow label={`Pixel Spacing (${pixelSpacing}px)`}>
          <Slider
            min={0}
            max={6}
            value={pixelSpacing}
            onChange={(val) => updateLedMatrixConfig(nodeId, { pixelSpacing: val })}
            className="w-32"
          />
        </PropertyRow>
      </InspectorSection>

      {/* 3. Driver Config */}
      <InspectorSection title="Electrical / Drivers" icon={<Sliders className="w-4 h-4 text-amber-400" />}>
        <PropertyRow label="Row Drive Level" hint="Selects active signal level for Rows">
          <SegmentedControl
            options={[
              { value: 1, label: 'HIGH (1)' },
              { value: 0, label: 'LOW (0)' },
            ]}
            value={rowActiveLevel}
            onChange={(val) => updateLedMatrixConfig(nodeId, { rowActiveLevel: val as 0 | 1 })}
            size="xs"
            className="w-36"
          />
        </PropertyRow>

        <PropertyRow label="Col Drive Level" hint="Selects active signal level for Columns">
          <SegmentedControl
            options={[
              { value: 1, label: 'HIGH (1)' },
              { value: 0, label: 'LOW (0)' },
            ]}
            value={colActiveLevel}
            onChange={(val) => updateLedMatrixConfig(nodeId, { colActiveLevel: val as 0 | 1 })}
            size="xs"
            className="w-36"
          />
        </PropertyRow>
      </InspectorSection>
    </div>
  );
};
