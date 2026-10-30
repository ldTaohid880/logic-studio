import React from 'react';
import { OUTPUT_COLORS, OutputColor, outputColor } from '../../theme/outputColors';

/** Swatches for LED/display color. Same control on every output part. */
export const OutputColorPicker: React.FC<{ value: OutputColor; onChange: (c: OutputColor) => void }> = ({ value, onChange }) => (
  <div role="radiogroup" aria-label="Color" className="flex items-center gap-1.5">
    {OUTPUT_COLORS.map((c) => {
      const col = outputColor(c);
      const selected = value === c;
      return (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={selected}
          aria-label={col.name}
          title={col.name}
          onClick={() => onChange(c)}
          className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 ${
            selected ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface-1' : 'ring-1 ring-line-strong'
          }`}
          style={{ backgroundColor: '#1b1f25' }}
        >
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: col.on, boxShadow: selected ? `0 0 6px ${col.glow}` : undefined }} />
        </button>
      );
    })}
  </div>
);
