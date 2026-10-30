import React from 'react';
import { SevenSegmentConfig, BcdInvalidBehavior } from '../../types/sevenSegment';
import { PinData } from '../../types/circuit';
import { Sliders } from 'lucide-react';
import { InspectorSection } from '../ui/InspectorSection';
import { PropertyRow } from '../ui/PropertyRow';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Switch } from '../ui/Switch';
import { OutputColorPicker } from './OutputColorPicker';

interface SevenSegmentPropertiesProps {
  nodeId: string;
  label: string;
  config: SevenSegmentConfig;
  currentInputs: PinData[];
  onUpdateLabel: (label: string) => void;
  onUpdateConfig: (config: Partial<SevenSegmentConfig>) => void;
}

type InputMode = 'binary' | 'bcd' | 'direct';

const MODE_HINT: Record<InputMode, string> = {
  binary: 'Four inputs A–D (A is the lowest bit) form a number; shows 0–9 and A–F.',
  bcd: 'Four inputs form a decimal digit 0–9 (binary-coded decimal).',
  direct: 'One input per segment a–g: you build the decoder yourself.',
};

/**
 * Settings for the 7-segment display. "Hex" and "binary" decode the same way, so they are one choice;
 * common cathode/anode is phrased as which level lights a segment.
 */
export const SevenSegmentProperties: React.FC<SevenSegmentPropertiesProps> = ({ config, onUpdateConfig }) => {
  const mode: InputMode = config.mode === 'hex' ? 'binary' : config.mode;

  return (
    <InspectorSection title="Settings" icon={<Sliders className="w-4 h-4" />}>
      <div className="space-y-1.5">
        <span className="text-[13px] text-fg-muted">Inputs are</span>
        <SegmentedControl
          ariaLabel="What the inputs mean"
          options={[
            { value: 'binary', label: 'Hex 0–F' },
            { value: 'bcd', label: 'BCD 0–9' },
            { value: 'direct', label: 'Segments a–g' },
          ]}
          value={mode}
          onChange={(val) => onUpdateConfig({ mode: val as InputMode })}
          size="sm"
        />
        <p className="text-xs text-fg-subtle">{MODE_HINT[mode]}</p>
      </div>

      {mode === 'bcd' && (
        <PropertyRow label="For 10–15 show" hint="Values above 9 are not valid BCD.">
          <SegmentedControl
            ariaLabel="What to show for 10 to 15"
            options={[
              { value: 'blank', label: 'Nothing' },
              { value: 'error', label: 'E' },
              { value: 'dash', label: '–' },
            ]}
            value={config.bcdInvalidBehavior}
            onChange={(val) => onUpdateConfig({ bcdInvalidBehavior: val as BcdInvalidBehavior })}
            size="sm"
          />
        </PropertyRow>
      )}

      <PropertyRow
        label="Lit by"
        hint="Which input level lights a segment. 1 = common cathode (active high), 0 = common anode (active low)."
      >
        <SegmentedControl
          ariaLabel="Level that lights a segment"
          options={[
            { value: 'common_cathode', label: '1' },
            { value: 'common_anode', label: '0' },
          ]}
          value={config.displayType}
          onChange={(val) => onUpdateConfig({ displayType: val as SevenSegmentConfig['displayType'] })}
          size="sm"
        />
      </PropertyRow>

      <PropertyRow label="Decimal point" hint="Adds a DP input and the dot after the digit.">
        <Switch checked={!!config.showDecimalPoint} onChange={(checked) => onUpdateConfig({ showDecimalPoint: checked })} />
      </PropertyRow>

      <PropertyRow label="Color">
        <OutputColorPicker value={config.color} onChange={(color) => onUpdateConfig({ color })} />
      </PropertyRow>
    </InspectorSection>
  );
};
