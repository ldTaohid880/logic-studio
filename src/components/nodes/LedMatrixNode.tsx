import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { DEFAULT_LED_MATRIX_CONFIG, LED_MATRIX_COLORS } from '../../types/ledMatrix';

export const LedMatrixNode: React.FC<NodeProps> = memo(({ data: nodeData, selected }) => {
  const data = nodeData as unknown as NodeData;
  const config = data.ledMatrixConfig || DEFAULT_LED_MATRIX_CONFIG;
  const inputs = data.inputs || [];

  const size = config.size === '16x16' ? 16 : 8;
  const showGrid = config.showGrid;
  const pixelSpacing = config.pixelSpacing;
  const brightness = config.brightness;
  const rowActive = config.rowActiveLevel;
  const colActive = config.colActiveLevel;
  const colorScheme = LED_MATRIX_COLORS[config.color] || LED_MATRIX_COLORS.green;
  const pinAliases = data.pinAliases || {};

  const getPinDisplayName = (pin: { id: string; name: string }) => {
    const alias = pinAliases[pin.id];
    if (!alias) return pin.name;
    return alias.length > 6 ? alias.substring(0, 6) + '…' : alias;
  };

  // Check if a pixel at (row r, col c) is lit
  const isPixelOn = (r: number, c: number) => {
    const rowPin = inputs[r];
    const colPin = inputs[size + c];

    if (!rowPin || !colPin) return false;
    const rowMatch = rowPin.value === rowActive;
    const colMatch = colPin.value === colActive;

    return rowMatch && colMatch;
  };

  const matrixSizePx = size === 8 ? 160 : 240;

  return (
    <div
      className={`relative bg-slate-900/95 border rounded-xl shadow-xl backdrop-blur-md transition-all duration-150 p-3 select-none ${
        selected
          ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-purple-950/40'
          : 'border-slate-800 hover:border-slate-700'
      }`}
      style={{
        width: `${matrixSizePx + 44}px`,
      }}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
        <span className="text-xs font-mono font-bold text-slate-100 truncate">
          {data.label || 'LED Matrix'}
        </span>
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
          {config.size}
        </span>
      </div>

      {/* Grid + Left Row Handles Container */}
      <div className="flex items-center gap-2">
        {/* LEFT Row Handles Container */}
        <div
          className="flex flex-col justify-between h-full py-0.5"
          style={{ height: `${matrixSizePx}px` }}
        >
          {Array.from({ length: size }).map((_, r) => {
            const pin = inputs[r] || { id: `in-${r}`, name: `R${r + 1}`, value: 0 };
            const isHigh = pin.value === 1;

            return (
              <div key={pin.id} className="relative flex items-center h-4">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={pin.id}
                  style={{ left: '-13px' }}
                  className={`!w-2.5 !h-2.5 !border-2 !transition-all ${
                    isHigh
                      ? '!bg-emerald-400 !border-emerald-200 shadow-[0_0_6px_#34d399]'
                      : pin.value === 0
                      ? '!bg-slate-700 !border-slate-500'
                      : '!bg-amber-500 !border-amber-300'
                  }`}
                  title={`Row ${r + 1} (${pin.name}): ${pin.value === 1 ? 'HIGH' : pin.value === 0 ? 'LOW' : 'UNKNOWN'}`}
                />
                <span
                  className={`text-[8px] font-mono font-bold ${
                    isHigh ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                  title={pinAliases[pin.id] ? `${pin.name} (${pinAliases[pin.id]})` : pin.name}
                >
                  {getPinDisplayName(pin)}
                </span>
              </div>
            );
          })}
        </div>

        {/* LED Matrix Visual Display */}
        <div
          className="bg-[#05080e] rounded-xl border border-slate-950 p-2 shadow-inner flex-1"
          style={{
            height: `${matrixSizePx}px`,
          }}
        >
          <div
            className="grid w-full h-full"
            style={{
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
              gap: `${pixelSpacing}px`,
            }}
          >
            {Array.from({ length: size }).map((_, r) =>
              Array.from({ length: size }).map((_, c) => {
                const on = isPixelOn(r, c);
                return (
                  <div
                    key={`${r}-${c}`}
                    className="rounded-[2px] transition-all duration-75 relative"
                    style={{
                      backgroundColor: on ? colorScheme.active : colorScheme.inactive,
                      border: showGrid ? '1px solid rgba(255,255,255,0.03)' : 'none',
                      opacity: on ? brightness : 0.8,
                      boxShadow: on
                        ? `0 0 ${6 * brightness}px ${colorScheme.glow}`
                        : 'none',
                    }}
                    title={`LED [Row ${r + 1}, Col ${c + 1}]: ${on ? 'ON' : 'OFF'}`}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM Column Handles Container */}
      <div className="relative w-full h-5 mt-2 flex items-center justify-between pl-8 pr-2">
        {Array.from({ length: size }).map((_, c) => {
          const pinIndex = size + c;
          const pin = inputs[pinIndex] || { id: `in-${pinIndex}`, name: `C${c + 1}`, value: 0 };
          const isHigh = pin.value === 1;

          return (
            <div
              key={pin.id}
              className="relative flex flex-col items-center justify-center"
              style={{ width: `${100 / size}%` }}
            >
              <span
                className={`text-[8px] font-mono font-bold ${
                  isHigh ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                C{c + 1}
              </span>
              <Handle
                type="target"
                position={Position.Bottom}
                id={pin.id}
                style={{ bottom: '-17px' }}
                className={`!w-2.5 !h-2.5 !border-2 !transition-all ${
                  isHigh
                    ? '!bg-emerald-400 !border-emerald-200 shadow-[0_0_6px_#34d399]'
                    : pin.value === 0
                    ? '!bg-slate-700 !border-slate-500'
                    : '!bg-amber-500 !border-amber-300'
                }`}
                title={`Col ${c + 1} (${pin.name}): ${pin.value === 1 ? 'HIGH' : pin.value === 0 ? 'LOW' : 'UNKNOWN'}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

LedMatrixNode.displayName = 'LedMatrixNode';
