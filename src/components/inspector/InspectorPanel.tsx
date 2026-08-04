import React, { useState } from 'react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { NodeData, SignalValue } from '../../types/circuit';
import { GateIcon } from '../nodes/GateIcons';
import { Sliders, Trash2, Table, Info, Activity, Hash } from 'lucide-react';
import { EncoderProperties } from './EncoderProperties';
import { SevenSegmentProperties } from './SevenSegmentProperties';
import { ClockProperties } from './ClockProperties';
import { MultiInputProperties } from './MultiInputProperties';
import { OscilloscopeProperties } from './OscilloscopeProperties';
import { ConfigurableProperties } from './ConfigurableProperties';
import { DEFAULT_OSCILLOSCOPE_CONFIG } from '../../types/oscilloscope';
import { GateTruthTableModal } from '../ui/GateTruthTableModal';
import { DEFAULT_ENCODER_CONFIG } from '../../types/encoder';
import { DEFAULT_SEVEN_SEGMENT_CONFIG } from '../../types/sevenSegment';
import { DEFAULT_CLOCK_CONFIG, DEFAULT_CLOCK_STATE } from '../../types/clock';
import { DEFAULT_MULTI_INPUT_CONFIG } from '../../types/multiInput';

import { InspectorSection } from '../ui/InspectorSection';
import { PropertyRow } from '../ui/PropertyRow';
import { Input } from '../ui/Input';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Badge } from '../ui/Badge';

export const InspectorPanel: React.FC = () => {
  const [isGateTruthTableOpen, setIsGateTruthTableOpen] = useState(false);

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

  const theme = useCircuitStore((state) => state.theme);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  if (!selectedNode && !selectedEdge) {
    return (
      <aside className={`w-80 h-full border-l p-5 flex flex-col items-center justify-center text-center z-20 select-none transition-colors duration-200 ${
        theme === 'light'
          ? 'bg-white/95 border-slate-200 text-slate-600 shadow-sm'
          : 'bg-slate-950/90 border-slate-800 text-slate-500'
      }`}>
        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 text-cyan-400 ${
          theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <Info className="w-6 h-6 opacity-60" />
        </div>
        <p className={`text-xs font-mono font-bold uppercase tracking-wider ${
          theme === 'light' ? 'text-slate-700' : 'text-slate-300'
        }`}>
          No Component Selected
        </p>
        <p className={`text-[11px] mt-1 max-w-[220px] leading-relaxed ${
          theme === 'light' ? 'text-slate-500' : 'text-slate-400'
        }`}>
          Click any logic gate, wire connection, clock, or display to inspect signal parameters.
        </p>
      </aside>
    );
  }

  if (selectedEdge) {
    const signalVal = (selectedEdge.data?.signalValue ?? -1) as SignalValue;
    return (
      <aside className={`w-80 h-full border-l p-4 flex flex-col z-20 select-none space-y-4 transition-colors duration-200 ${
        theme === 'light'
          ? 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
          : 'bg-slate-950/90 border-slate-800 text-slate-100'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${
          theme === 'light' ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <span className={`text-xs font-bold font-mono uppercase tracking-wider ${
            theme === 'light' ? 'text-slate-800' : 'text-slate-200'
          }`}>
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
            <span className={`text-xs font-mono truncate max-w-[140px] ${
              theme === 'light' ? 'text-slate-700' : 'text-slate-300'
            }`}>
              {selectedEdge.id}
            </span>
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
    <aside className={`w-80 h-full border-l flex flex-col z-20 select-none overflow-hidden transition-colors duration-200 ${
      theme === 'light'
        ? 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
        : 'bg-slate-950/90 border-slate-800 text-slate-100'
    }`}>
      {/* Inspector Header */}
      <div className={`p-4 pb-3 border-b shrink-0 flex items-center justify-between ${
        theme === 'light' ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-1.5 rounded-xl border text-emerald-400 shrink-0 ${
            theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <GateIcon type={gateType} className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className={`text-xs font-bold font-mono tracking-wider uppercase truncate ${
              theme === 'light' ? 'text-slate-900' : 'text-slate-100'
            }`}>
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
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 block">
                  Inputs ({inputs.length})
                </span>
                {inputs.map((pin) => (
                  <div
                    key={pin.id}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono"
                  >
                    <span className="text-slate-300 font-medium">{pin.name}</span>
                    <Badge
                      variant={pin.value === 1 ? 'emerald' : pin.value === 0 ? 'slate' : 'amber'}
                      pulse={pin.value === 1}
                    >
                      {pin.value === 1 ? 'HIGH (1)' : pin.value === 0 ? 'LOW (0)' : 'UNKNOWN (?)'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Output Pins */}
            {outputs.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-mono text-slate-400 block">
                  Outputs ({outputs.length})
                </span>
                {outputs.map((pin) => (
                  <div
                    key={pin.id}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono"
                  >
                    <span className="text-slate-300 font-medium">{pin.name}</span>
                    <Badge
                      variant={pin.value === 1 ? 'emerald' : pin.value === 0 ? 'slate' : 'amber'}
                      pulse={pin.value === 1}
                    >
                      {pin.value === 1 ? 'HIGH (1)' : pin.value === 0 ? 'LOW (0)' : 'UNKNOWN (?)'}
                    </Badge>
                  </div>
                ))}
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
