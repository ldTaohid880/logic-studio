import React, { useState, useRef } from 'react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { NodeData, SignalValue } from '../../types/circuit';
import { GateIcon } from '../nodes/GateIcons';
import { Sliders, Trash2, Table, Info, Activity, Hash, Palette, Check, Ban, Pipette } from 'lucide-react';
import { EncoderProperties } from './EncoderProperties';
import { SevenSegmentProperties } from './SevenSegmentProperties';
import { ClockProperties } from './ClockProperties';
import { MultiInputProperties } from './MultiInputProperties';
import { OscilloscopeProperties } from './OscilloscopeProperties';
import { ConfigurableProperties } from './ConfigurableProperties';
import { LedMatrixProperties } from './LedMatrixProperties';
import { EquationGeneratorProperties } from './EquationGeneratorProperties';
import { GroupProperties } from './GroupProperties';
import { DEFAULT_OSCILLOSCOPE_CONFIG } from '../../types/oscilloscope';
import { GateTruthTableModal } from '../ui/GateTruthTableModal';
import { DEFAULT_ENCODER_CONFIG } from '../../types/encoder';
import { DEFAULT_SEVEN_SEGMENT_CONFIG } from '../../types/sevenSegment';
import { DEFAULT_CLOCK_CONFIG, DEFAULT_CLOCK_STATE } from '../../types/clock';
import { DEFAULT_MULTI_INPUT_CONFIG } from '../../types/multiInput';
import { DEFAULT_LED_MATRIX_CONFIG } from '../../types/ledMatrix';

import { InspectorSection } from '../ui/InspectorSection';
import { PropertyRow } from '../ui/PropertyRow';
import { Input } from '../ui/Input';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Badge } from '../ui/Badge';

import { CustomComponentProperties } from './CustomComponentProperties';

const PREDEFINED_COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Gray', hex: '#64748b' },
  { name: 'Green', hex: '#22c55e' },
];

export const InspectorPanel: React.FC = () => {
  const [isGateTruthTableOpen, setIsGateTruthTableOpen] = useState(false);
  const customColorInputRef = useRef<HTMLInputElement>(null);

  const {
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    updateNodeLabel,
    updateNodeInputCount,
    updateEncoderConfig,
    updateSevenSegmentConfig,
    deleteSelected,
    showToast,
  } = useCircuitStore();


  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  if (!selectedNode && !selectedEdge) {
    return (
      <aside className="w-80 h-full border-l p-5 flex flex-col items-center justify-center text-center z-20 select-none bg-slate-950/90 border-slate-800 text-slate-500">
        <div className="w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 text-cyan-400 bg-slate-900 border-slate-800">
          <Info className="w-6 h-6 opacity-60" />
        </div>
        <p className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
          No Component Selected
        </p>
        <p className="text-[11px] mt-1 max-w-[220px] leading-relaxed text-slate-400">
          Click any logic gate, wire connection, clock, or display to inspect signal parameters.
        </p>
      </aside>
    );
  }

  if (selectedEdge) {
    const signalVal = (selectedEdge.data?.signalValue ?? -1) as SignalValue;
    return (
      <aside className="w-80 h-full border-l p-4 flex flex-col z-20 select-none space-y-4 bg-slate-950/90 border-slate-800 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
            Wire Connection
          </span>
          <IconButton
            icon={<Trash2 className="w-4 h-4 text-rose-400" />}
            tooltip="Delete Wire"
            variant="danger"
            size="sm"
            onClick={() => {
              deleteSelected();
              showToast('Wire deleted');
            }}
          />
        </div>

        <InspectorSection title="Connection Details" icon={<Activity className="w-4 h-4" />}>
          <PropertyRow label="Wire ID">
            <span className={`text-xs font-mono truncate max-w-[140px] text-slate-300`}>
              {selectedEdge.id}
            </span>
          </PropertyRow>

          <PropertyRow label="Wire Label">
            <Input
              value={selectedEdge.data?.label || ''}
              onChange={(e) => useCircuitStore.getState().updateEdgeLabel(selectedEdge.id, e.target.value)}
              placeholder="e.g. CLK, RESET..."
              className="w-36 font-sans text-slate-300"
            />
          </PropertyRow>

          <PropertyRow label="Signal State">
            <Badge
              variant={signalVal === 1 ? 'emerald' : signalVal === 0 ? 'slate' : 'amber'}
              pulse={signalVal === 1}
            >
              {signalVal === 1 ? 'HIGH (1)' : signalVal === 0 ? 'LOW (0)' : 'UNKNOWN (?)'}
            </Badge>
          </PropertyRow>
        </InspectorSection>

        <InspectorSection title="Wire Appearance" icon={<Palette className="w-4 h-4" />}>
          <PropertyRow label="Wire Color">
            <div className="flex flex-col gap-2 w-full">
              {/* Color Grid */}
              <div className="grid grid-cols-5 gap-2.5">
                {/* None/Default button */}
                <button
                  onClick={() => useCircuitStore.getState().updateEdgeColor(selectedEdge.id, undefined)}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                    !selectedEdge.data?.color
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400 shadow-md ring-1 ring-purple-500'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                  title="Default Color"
                >
                  <Ban className="w-4 h-4" />
                </button>

                {PREDEFINED_COLORS.map((c) => {
                  const isSelected = selectedEdge.data?.color === c.hex;
                  return (
                    <button
                      key={c.name}
                      onClick={() => useCircuitStore.getState().updateEdgeColor(selectedEdge.id, c.hex)}
                      className={`w-7 h-7 rounded-lg border transition-all relative flex items-center justify-center hover:scale-105 shadow-sm ${
                        isSelected
                          ? 'border-purple-500 ring-2 ring-purple-500/50'
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 mix-blend-difference text-white" />
                      )}
                    </button>
                  );
                })}

                {/* Custom Color Picker Button */}
                <div className="relative w-7 h-7">
                  <button
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all relative hover:scale-105 ${
                      selectedEdge.data?.color && !PREDEFINED_COLORS.some((c) => c.hex === selectedEdge.data?.color)
                        ? 'border-purple-500 ring-2 ring-purple-500/50'
                        : 'border-slate-800 bg-slate-900 hover:bg-slate-850'
                    }`}
                    style={
                      selectedEdge.data?.color && !PREDEFINED_COLORS.some((c) => c.hex === selectedEdge.data?.color)
                        ? { backgroundColor: selectedEdge.data.color }
                        : {}
                    }
                    title="Custom Color"
                    onClick={() => customColorInputRef.current?.click()}
                  >
                    {(!selectedEdge.data?.color || PREDEFINED_COLORS.some((c) => c.hex === selectedEdge.data?.color)) ? (
                      <Pipette className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Check className="w-3.5 h-3.5 mix-blend-difference text-white" />
                    )}
                  </button>
                  <input
                    type="color"
                    ref={customColorInputRef}
                    value={
                      (selectedEdge.data?.color && !PREDEFINED_COLORS.some((c) => c.hex === selectedEdge.data?.color))
                        ? selectedEdge.data.color
                        : '#3b82f6'
                    }
                    onChange={(e) => useCircuitStore.getState().updateEdgeColor(selectedEdge.id, e.target.value)}
                    className="absolute inset-0 opacity-0 w-0 h-0 cursor-pointer pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </PropertyRow>
        </InspectorSection>
      </aside>
    );
  }

  const nodeData = selectedNode!.data as unknown as NodeData;
  const { label, gateType, inputs = [], outputs = [], inputCount = 2 } = nodeData;

  const isConfigurableGate = ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR'].includes(gateType);

  const pinCountOptions = [
    { value: 2, label: '2 Pins' },
    { value: 3, label: '3 Pins' },
    { value: 4, label: '4 Pins' },
  ];

  return (
    <aside className="w-80 h-full border-l flex flex-col z-20 select-none overflow-hidden bg-slate-950/90 border-slate-800 text-slate-100">
      {/* Inspector Header */}
      <div className="p-4 pb-3 border-b shrink-0 flex items-center justify-between border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-xl border text-emerald-400 shrink-0 bg-slate-900 border-slate-800">
            <GateIcon type={gateType} className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-bold font-mono tracking-wider uppercase truncate text-slate-100">
              {gateType} Inspector
            </h2>
            <p className="text-[10px] font-mono text-slate-500 truncate">ID: {selectedNode!.id}</p>
          </div>
        </div>

        <IconButton
          icon={<Trash2 className="w-4 h-4 text-rose-400" />}
          tooltip="Delete Component"
          variant="danger"
          size="sm"
          onClick={() => {
            deleteSelected();
            showToast('Component deleted');
          }}
        />
      </div>

      {/* Scrollable Inspector Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* Specialty IC Properties */}
      {gateType.startsWith('CFG_') ? (
        <>
          <InspectorSection title="General Configuration" icon={<Sliders className="w-4 h-4" />}>
            <PropertyRow label="Label">
              <Input
                value={label}
                onChange={(e) => updateNodeLabel(selectedNode!.id, e.target.value)}
                placeholder="Component label..."
                className="w-36"
              />
            </PropertyRow>
          </InspectorSection>
          <ConfigurableProperties nodeId={selectedNode!.id} nodeData={nodeData} />
          {/* Pin Status Monitor */}
          <InspectorSection title="Pin Status Monitor" icon={<Hash className="w-4 h-4" />}>
            {inputs.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 block">Inputs ({inputs.length})</span>
                {inputs.map((pin) => (
                  <div key={pin.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
                    <span className="text-slate-300 font-medium">{pin.name}</span>
                    <Badge variant={pin.value === 1 ? 'emerald' : pin.value === 0 ? 'slate' : 'amber'} pulse={pin.value === 1}>
                      {pin.value === 1 ? 'HIGH (1)' : pin.value === 0 ? 'LOW (0)' : 'UNKNOWN (?)'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            {outputs.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-mono text-slate-400 block">Outputs ({outputs.length})</span>
                {outputs.map((pin) => (
                  <div key={pin.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
                    <span className="text-slate-300 font-medium">{pin.name}</span>
                    <Badge variant={pin.value === 1 ? 'emerald' : pin.value === 0 ? 'slate' : 'amber'} pulse={pin.value === 1}>
                      {pin.value === 1 ? 'HIGH (1)' : pin.value === 0 ? 'LOW (0)' : 'UNKNOWN (?)'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </InspectorSection>
        </>
      ) : gateType === 'CUSTOM' ? (
        <CustomComponentProperties
          nodeId={selectedNode!.id}
          data={nodeData}
        />
      ) : gateType === 'OSCILLOSCOPE' ? (
        <OscilloscopeProperties
          nodeId={selectedNode!.id}
          config={nodeData.scopeConfig || DEFAULT_OSCILLOSCOPE_CONFIG}
          inputPins={inputs}
        />
      ) : gateType === 'CLOCK' ? (
        <ClockProperties
          nodeId={selectedNode!.id}
          label={label}
          config={nodeData.clockConfig || DEFAULT_CLOCK_CONFIG}
          state={nodeData.clockState || DEFAULT_CLOCK_STATE}
          outputValue={nodeData.value ?? 0}
        />
      ) : gateType === 'MULTI_INPUT' ? (
        <MultiInputProperties
          nodeId={selectedNode!.id}
          label={label}
          config={nodeData.multiInputConfig || DEFAULT_MULTI_INPUT_CONFIG}
        />
      ) : gateType === 'ENCODER' ? (
        <EncoderProperties
          nodeId={selectedNode!.id}
          label={label}
          config={nodeData.encoderConfig || DEFAULT_ENCODER_CONFIG}
          state={nodeData.encoderState}
          currentInputs={inputs.map((p) => p.value)}
          onUpdateLabel={(l) => updateNodeLabel(selectedNode!.id, l)}
          onUpdateConfig={(cfg) => updateEncoderConfig(selectedNode!.id, cfg)}
        />
      ) : gateType === 'SEVEN_SEGMENT' ? (
        <SevenSegmentProperties
          nodeId={selectedNode!.id}
          label={label}
          config={nodeData.sevenSegmentConfig || DEFAULT_SEVEN_SEGMENT_CONFIG}
          currentInputs={inputs}
          onUpdateLabel={(l) => updateNodeLabel(selectedNode!.id, l)}
          onUpdateConfig={(cfg) => updateSevenSegmentConfig(selectedNode!.id, cfg)}
        />
      ) : gateType === 'LED_MATRIX' ? (
        <LedMatrixProperties
          nodeId={selectedNode!.id}
          label={label}
          config={nodeData.ledMatrixConfig || DEFAULT_LED_MATRIX_CONFIG}
        />
      ) : gateType === 'BOOLEAN_EQUATION_GENERATOR' ? (
        <EquationGeneratorProperties
          nodeId={selectedNode!.id}
          outputVarName={(nodeData.outputVarName as string) || 'F'}
          label={label}
        />
      ) : gateType === 'HALF_ADDER' || gateType === 'FULL_ADDER' ? (
        <>
          {/* General Properties */}
          <InspectorSection title="General Configuration" icon={<Sliders className="w-4 h-4" />}>
            <PropertyRow label="Label">
              <Input
                value={label}
                onChange={(e) => updateNodeLabel(selectedNode!.id, e.target.value)}
                placeholder="Component label..."
                className="w-36"
              />
            </PropertyRow>

            <PropertyRow label="Propagation Delay">
              <div className="flex items-center gap-1.5 w-36">
                <Input
                  type="number"
                  min="0"
                  max="1000"
                  value={nodeData.propagationDelayNs !== undefined ? (nodeData.propagationDelayNs as number) : 5}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    const nodes = useCircuitStore.getState().nodes;
                    useCircuitStore.setState({
                      nodes: nodes.map((n) =>
                        n.id === selectedNode!.id
                          ? { ...n, data: { ...n.data, propagationDelayNs: val } }
                          : n
                      ),
                    });
                  }}
                  className="w-24 text-right font-mono"
                />
                <span className="text-xs font-mono text-slate-400">ns</span>
              </div>
            </PropertyRow>

            <PropertyRow label="Lock Position">
              <Button
                variant={nodeData.isLocked ? 'danger' : 'secondary'}
                size="xs"
                onClick={() => useCircuitStore.getState().toggleLockNode(selectedNode!.id)}
              >
                {nodeData.isLocked ? 'Locked (Fixed)' : 'Unlocked'}
              </Button>
            </PropertyRow>
          </InspectorSection>

          {/* Pin Status Monitor */}
          <InspectorSection title="Pin Status Monitor" icon={<Hash className="w-4 h-4" />}>
            {inputs.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-400 block font-bold">
                  Inputs ({inputs.length})
                </span>
                {inputs.map((pin) => {
                  const alias = nodeData.pinAliases?.[pin.id] || '';
                  return (
                    <div
                      key={pin.id}
                      className="flex flex-col p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-semibold">{pin.name}</span>
                        <Badge
                          variant={pin.value === 1 ? 'emerald' : pin.value === 0 ? 'slate' : 'amber'}
                          pulse={pin.value === 1}
                        >
                          {pin.value === 1 ? 'HIGH (1)' : pin.value === 0 ? 'LOW (0)' : 'UNKNOWN (?)'}
                        </Badge>
                      </div>
                      <input
                        type="text"
                        placeholder="Set pin alias..."
                        value={alias}
                        onChange={(e) => useCircuitStore.getState().updatePinAlias(selectedNode!.id, pin.id, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none focus:border-cyan-500 font-sans"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {outputs.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800 mt-2">
                <span className="text-[10px] font-mono text-slate-400 block font-bold">
                  Outputs ({outputs.length})
                </span>
                {outputs.map((pin) => {
                  const alias = nodeData.pinAliases?.[pin.id] || '';
                  return (
                    <div
                      key={pin.id}
                      className="flex flex-col p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-semibold">{pin.name}</span>
                        <Badge
                          variant={pin.value === 1 ? 'emerald' : pin.value === 0 ? 'slate' : 'amber'}
                          pulse={pin.value === 1}
                        >
                          {pin.value === 1 ? 'HIGH (1)' : pin.value === 0 ? 'LOW (0)' : 'UNKNOWN (?)'}
                        </Badge>
                      </div>
                      <input
                        type="text"
                        placeholder="Set pin alias..."
                        value={alias}
                        onChange={(e) => useCircuitStore.getState().updatePinAlias(selectedNode!.id, pin.id, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none focus:border-cyan-500 font-sans"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </InspectorSection>

          {/* View Truth Table Action */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Table className="w-4 h-4" />}
              onClick={() => setIsGateTruthTableOpen(true)}
              className="w-full"
            >
              View Component Truth Table
            </Button>

            <GateTruthTableModal
              isOpen={isGateTruthTableOpen}
              onClose={() => setIsGateTruthTableOpen(false)}
              gateType={gateType}
              inputCount={inputs.length}
              currentInputs={inputs}
              nodeLabel={label}
            />
          </div>
        </>
      ) : (
        <>
          {/* General Properties */}
          <InspectorSection title="General Configuration" icon={<Sliders className="w-4 h-4" />}>
            <PropertyRow label="Label">
              <Input
                value={label}
                onChange={(e) => updateNodeLabel(selectedNode!.id, e.target.value)}
                placeholder="Component label..."
                className="w-36"
              />
            </PropertyRow>

            {gateType === 'TUNNEL' && (
              <PropertyRow label="Wireless Tag">
                <Input
                  value={nodeData.tunnelLabel || ''}
                  onChange={(e) => {
                    const tag = e.target.value.toUpperCase();
                    useCircuitStore.setState({
                      nodes: useCircuitStore.getState().nodes.map((n) =>
                        n.id === selectedNode!.id
                          ? { ...n, data: { ...n.data, tunnelLabel: tag } }
                          : n
                      ),
                    });
                  }}
                  placeholder="e.g. CLK_BUS"
                  className="w-36 font-mono"
                />
              </PropertyRow>
            )}

            {gateType === 'TEXT_LABEL' && (
              <PropertyRow label="Note Text">
                <Input
                  value={nodeData.annotationText || ''}
                  onChange={(e) => {
                    const text = e.target.value;
                    useCircuitStore.setState({
                      nodes: useCircuitStore.getState().nodes.map((n) =>
                        n.id === selectedNode!.id
                          ? { ...n, data: { ...n.data, annotationText: text } }
                          : n
                      ),
                    });
                  }}
                  placeholder="Enter note text..."
                  className="w-36"
                />
              </PropertyRow>
            )}

            <PropertyRow label="Lock Position">
              <Button
                variant={nodeData.isLocked ? 'danger' : 'secondary'}
                size="xs"
                onClick={() => useCircuitStore.getState().toggleLockNode(selectedNode!.id)}
              >
                {nodeData.isLocked ? 'Locked (Fixed)' : 'Unlocked'}
              </Button>
            </PropertyRow>

            {isConfigurableGate && (
              <PropertyRow label="Input Pins">
                <SegmentedControl
                  options={pinCountOptions}
                  value={inputCount}
                  onChange={(val) => updateNodeInputCount(selectedNode!.id, val as number)}
                  size="xs"
                  className="w-36"
                />
              </PropertyRow>
            )}

            {(gateType === 'DIP_SWITCH' || gateType === 'BUS_MONITOR') && (
              <PropertyRow label="Bit Width">
                <SegmentedControl
                  options={[
                    { value: 2, label: '2 Bit' },
                    { value: 4, label: '4 Bit' },
                    { value: 8, label: '8 Bit' },
                  ]}
                  value={nodeData.bitWidth || 4}
                  onChange={(val) => {
                    const width = val as number;
                    const nodes = useCircuitStore.getState().nodes;
                    useCircuitStore.setState({
                      nodes: nodes.map((n) => {
                        if (n.id === selectedNode!.id) {
                          const newPins = Array.from({ length: width }, (_, i) => ({
                            id: gateType === 'DIP_SWITCH' ? `out-${i}` : `in-${i}`,
                            name: gateType === 'DIP_SWITCH' ? `SW${i + 1}` : `B${i}`,
                            value: 0 as SignalValue,
                          }));
                          return {
                            ...n,
                            data: {
                              ...n.data,
                              bitWidth: width,
                              ...(gateType === 'DIP_SWITCH' ? { outputs: newPins, dipValues: Array(width).fill(0) } : { inputs: newPins }),
                            },
                          };
                        }
                        return n;
                      }),
                    });
                    useCircuitStore.getState().tickSimulation(true);
                  }}
                  size="xs"
                  className="w-36"
                />
              </PropertyRow>
            )}

            {gateType === 'BUS_MONITOR' && (
              <PropertyRow label="Format">
                <SegmentedControl
                  options={[
                    { value: 'hex', label: 'HEX' },
                    { value: 'dec', label: 'DEC' },
                    { value: 'bin', label: 'BIN' },
                  ]}
                  value={nodeData.displayFormat || 'hex'}
                  onChange={(val) => {
                    const fmt = val as 'hex' | 'dec' | 'bin';
                    const nodes = useCircuitStore.getState().nodes;
                    useCircuitStore.setState({
                      nodes: nodes.map((n) =>
                        n.id === selectedNode!.id
                          ? { ...n, data: { ...n.data, displayFormat: fmt } }
                          : n
                      ),
                    });
                  }}
                  size="xs"
                  className="w-36"
                />
              </PropertyRow>
            )}
          </InspectorSection>

          {/* Pin Status Monitor Section */}
          <InspectorSection title="Pin Status Monitor" icon={<Hash className="w-4 h-4" />}>
            {/* Input Pins */}
            {inputs.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-400 block font-bold">
                  Inputs ({inputs.length})
                </span>
                {inputs.map((pin) => {
                  const alias = nodeData.pinAliases?.[pin.id] || '';
                  return (
                    <div
                      key={pin.id}
                      className="flex flex-col p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-semibold">{pin.name}</span>
                        <Badge
                          variant={pin.value === 1 ? 'emerald' : pin.value === 0 ? 'slate' : 'amber'}
                          pulse={pin.value === 1}
                        >
                          {pin.value === 1 ? 'HIGH (1)' : pin.value === 0 ? 'LOW (0)' : 'UNKNOWN (?)'}
                        </Badge>
                      </div>
                      <input
                        type="text"
                        placeholder="Set pin alias..."
                        value={alias}
                        onChange={(e) => useCircuitStore.getState().updatePinAlias(selectedNode!.id, pin.id, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none focus:border-cyan-500 font-sans"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Output Pins */}
            {outputs.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800 mt-2">
                <span className="text-[10px] font-mono text-slate-400 block font-bold">
                  Outputs ({outputs.length})
                </span>
                {outputs.map((pin) => {
                  const alias = nodeData.pinAliases?.[pin.id] || '';
                  return (
                    <div
                      key={pin.id}
                      className="flex flex-col p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-semibold">{pin.name}</span>
                        <Badge
                          variant={pin.value === 1 ? 'emerald' : pin.value === 0 ? 'slate' : 'amber'}
                          pulse={pin.value === 1}
                        >
                          {pin.value === 1 ? 'HIGH (1)' : pin.value === 0 ? 'LOW (0)' : 'UNKNOWN (?)'}
                        </Badge>
                      </div>
                      <input
                        type="text"
                        placeholder="Set pin alias..."
                        value={alias}
                        onChange={(e) => useCircuitStore.getState().updatePinAlias(selectedNode!.id, pin.id, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none focus:border-cyan-500 font-sans"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </InspectorSection>

          {/* View Truth Table Action */}
          {isConfigurableGate && (
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                leftIcon={<Table className="w-4 h-4" />}
                onClick={() => setIsGateTruthTableOpen(true)}
                className="w-full"
              >
                View Gate Truth Table
              </Button>

              <GateTruthTableModal
                isOpen={isGateTruthTableOpen}
                onClose={() => setIsGateTruthTableOpen(false)}
                gateType={gateType}
                inputCount={inputCount}
                currentInputs={inputs}
                nodeLabel={label}
              />
            </div>
          )}
        </>
      )}
      </div>
    </aside>
  );
};
