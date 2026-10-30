import React, { useState } from 'react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { useShallow } from 'zustand/react/shallow';
import { GateType, NodeData } from '../../types/circuit';
import { GateIcon } from '../nodes/GateIcons';
import { Sliders, Trash2, Table, Hash, Lock, Unlock, MousePointerClick, Wrench, Layers } from 'lucide-react';
import { EncoderProperties } from './EncoderProperties';
import { SevenSegmentProperties } from './SevenSegmentProperties';
import { ClockProperties } from './ClockProperties';
import { MultiInputProperties } from './MultiInputProperties';
import { OscilloscopeProperties } from './OscilloscopeProperties';
import { ConfigurableProperties } from './ConfigurableProperties';
import { LedMatrixProperties } from './LedMatrixProperties';
import { EquationGeneratorProperties } from './EquationGeneratorProperties';
import { GroupProperties } from './GroupProperties';
import { CustomComponentProperties } from './CustomComponentProperties';
import { WireInspector } from './WireInspector';
import { InspectorHeader } from './InspectorHeader';
import { PinStatusList } from './PinStatusList';
import { DEFAULT_OSCILLOSCOPE_CONFIG } from '../../types/oscilloscope';
import { GateTruthTableModal } from '../ui/GateTruthTableModal';
import { DEFAULT_ENCODER_CONFIG } from '../../types/encoder';
import { DEFAULT_SEVEN_SEGMENT_CONFIG } from '../../types/sevenSegment';
import { DEFAULT_CLOCK_CONFIG, DEFAULT_CLOCK_STATE } from '../../types/clock';
import { DEFAULT_MULTI_INPUT_CONFIG } from '../../types/multiInput';
import { DEFAULT_LED_MATRIX_CONFIG } from '../../types/ledMatrix';
import { getComponentInfo } from '../../data/components';

import { InspectorSection } from '../ui/InspectorSection';
import { PropertyRow } from '../ui/PropertyRow';
import { Input } from '../ui/Input';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';

interface PanelProps {
  nodeId: string;
  nodeData: NodeData;
}

/**
 * Parts with their own complete property panel. Everything else gets the generic
 * General / Pins / Analysis layout below.
 */
const TYPE_PANELS: Partial<Record<GateType, React.FC<PanelProps>>> = {
  CUSTOM: ({ nodeId, nodeData }) => <CustomComponentProperties nodeId={nodeId} data={nodeData} />,
  OSCILLOSCOPE: ({ nodeId, nodeData }) => (
    <OscilloscopeProperties
      nodeId={nodeId}
      config={nodeData.scopeConfig || DEFAULT_OSCILLOSCOPE_CONFIG}
      inputPins={nodeData.inputs || []}
    />
  ),
  CLOCK: ({ nodeId, nodeData }) => (
    <ClockProperties
      nodeId={nodeId}
      label={nodeData.label}
      config={nodeData.clockConfig || DEFAULT_CLOCK_CONFIG}
      state={nodeData.clockState || DEFAULT_CLOCK_STATE}
      outputValue={nodeData.value ?? 0}
    />
  ),
  MULTI_INPUT: ({ nodeId, nodeData }) => (
    <MultiInputProperties
      nodeId={nodeId}
      label={nodeData.label}
      config={nodeData.multiInputConfig || DEFAULT_MULTI_INPUT_CONFIG}
    />
  ),
  ENCODER: ({ nodeId, nodeData }) => (
    <EncoderProperties
      nodeId={nodeId}
      label={nodeData.label}
      config={nodeData.encoderConfig || DEFAULT_ENCODER_CONFIG}
      state={nodeData.encoderState}
      currentInputs={(nodeData.inputs || []).map((p) => p.value)}
      onUpdateLabel={(l) => useCircuitStore.getState().updateNodeLabel(nodeId, l)}
      onUpdateConfig={(cfg) => useCircuitStore.getState().updateEncoderConfig(nodeId, cfg)}
    />
  ),
  SEVEN_SEGMENT: ({ nodeId, nodeData }) => (
    <SevenSegmentProperties
      nodeId={nodeId}
      label={nodeData.label}
      config={nodeData.sevenSegmentConfig || DEFAULT_SEVEN_SEGMENT_CONFIG}
      currentInputs={nodeData.inputs || []}
      onUpdateLabel={(l) => useCircuitStore.getState().updateNodeLabel(nodeId, l)}
      onUpdateConfig={(cfg) => useCircuitStore.getState().updateSevenSegmentConfig(nodeId, cfg)}
    />
  ),
  LED_MATRIX: ({ nodeId, nodeData }) => (
    <LedMatrixProperties nodeId={nodeId} label={nodeData.label} config={nodeData.ledMatrixConfig || DEFAULT_LED_MATRIX_CONFIG} />
  ),
  BOOLEAN_EQUATION_GENERATOR: ({ nodeId, nodeData }) => (
    <EquationGeneratorProperties
      nodeId={nodeId}
      outputVarName={(nodeData.outputVarName as string) || 'F'}
      label={nodeData.label}
    />
  ),
};

const MULTI_INPUT_GATES = new Set<GateType>(['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR']);
const TRUTH_TABLE_GATES = new Set<GateType>([...MULTI_INPUT_GATES, 'NOT', 'BUFFER', 'HALF_ADDER', 'FULL_ADDER']);

const EmptyState: React.FC = () => (
  <aside
    aria-label="Properties"
    className="w-full h-full p-6 flex flex-col items-center justify-center text-center select-none bg-surface-1 text-fg-subtle"
  >
    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 bg-surface-2 text-fg-subtle">
      <MousePointerClick className="w-5 h-5" />
    </div>
    <p className="text-sm font-semibold text-fg">Nothing selected</p>
    <p className="text-[13px] mt-1.5 max-w-[240px] leading-relaxed text-fg-muted">
      Select a part or a wire on the canvas to see its signals and settings here.
    </p>
    <ul className="mt-5 space-y-1.5 text-xs text-fg-subtle text-left">
      <li>
        <kbd className="font-mono text-fg-muted">Shift</kbd> + drag to select several parts
      </li>
      <li>Right-click a selection to group it or make a component</li>
      <li>
        <kbd className="font-mono text-fg-muted">?</kbd> shows all shortcuts
      </li>
    </ul>
  </aside>
);

/** Generic settings for parts without a dedicated panel. */
const GeneralSettings: React.FC<PanelProps> = ({ nodeId, nodeData }) => {
  const { gateType, label, inputCount = 2 } = nodeData;
  const updateNodeData = useCircuitStore((s) => s.updateNodeData);

  return (
    <InspectorSection title="General" icon={<Sliders className="w-4 h-4" />}>
      <PropertyRow label="Label">
        <Input
          value={label}
          aria-label="Label"
          onChange={(e) => useCircuitStore.getState().updateNodeLabel(nodeId, e.target.value)}
          placeholder="Part label"
        />
      </PropertyRow>

      {gateType === 'TUNNEL' && (
        <PropertyRow label="Tunnel tag" hint="Tunnels with the same tag are connected without a wire.">
          <Input
            value={nodeData.tunnelLabel || ''}
            aria-label="Tunnel tag"
            onChange={(e) => updateNodeData(nodeId, { tunnelLabel: e.target.value.toUpperCase() }, { propagate: true })}
            placeholder="e.g. CLK_BUS"
            className="font-mono"
          />
        </PropertyRow>
      )}

      {gateType === 'TEXT_LABEL' && (
        <PropertyRow label="Note text">
          <Input
            value={nodeData.annotationText || ''}
            aria-label="Note text"
            onChange={(e) => updateNodeData(nodeId, { annotationText: e.target.value })}
            placeholder="Write a note"
          />
        </PropertyRow>
      )}

      {(gateType === 'HALF_ADDER' || gateType === 'FULL_ADDER') && (
        <PropertyRow label="Propagation delay" hint="Display only; the simulator evaluates in ticks.">
          <div className="flex items-center gap-1.5 w-full">
            <Input
              type="number"
              min="0"
              max="1000"
              aria-label="Propagation delay in nanoseconds"
              value={nodeData.propagationDelayNs !== undefined ? (nodeData.propagationDelayNs as number) : 5}
              onChange={(e) => updateNodeData(nodeId, { propagationDelayNs: parseFloat(e.target.value) || 0 })}
              className="text-right font-mono"
            />
            <span className="text-xs text-fg-subtle">ns</span>
          </div>
        </PropertyRow>
      )}

      {MULTI_INPUT_GATES.has(gateType) && (
        <PropertyRow label="Inputs">
          <SegmentedControl
            ariaLabel="Number of inputs"
            options={[
              { value: 2, label: '2' },
              { value: 3, label: '3' },
              { value: 4, label: '4' },
            ]}
            value={inputCount}
            onChange={(val) => useCircuitStore.getState().updateNodeInputCount(nodeId, val as number)}
            size="sm"
          />
        </PropertyRow>
      )}

      {(gateType === 'DIP_SWITCH' || gateType === 'BUS_MONITOR') && (
        <PropertyRow label="Bit width" hint="Changing the width removes wires on pins that no longer exist.">
          <SegmentedControl
            ariaLabel="Bit width"
            options={[
              { value: 2, label: '2-bit' },
              { value: 4, label: '4-bit' },
              { value: 8, label: '8-bit' },
            ]}
            value={nodeData.bitWidth || 4}
            onChange={(val) => useCircuitStore.getState().setNodeBitWidth(nodeId, val as number)}
            size="sm"
          />
        </PropertyRow>
      )}

      {gateType === 'BUS_MONITOR' && (
        <PropertyRow label="Number format">
          <SegmentedControl
            ariaLabel="Number format"
            options={[
              { value: 'hex', label: 'Hex' },
              { value: 'dec', label: 'Dec' },
              { value: 'bin', label: 'Bin' },
            ]}
            value={nodeData.displayFormat || 'hex'}
            onChange={(val) => updateNodeData(nodeId, { displayFormat: val })}
            size="sm"
          />
        </PropertyRow>
      )}
    </InspectorSection>
  );
};

const NodeInspector: React.FC<PanelProps & { nodeType?: string }> = ({ nodeId, nodeData }) => {
  const [isGateTruthTableOpen, setIsGateTruthTableOpen] = useState(false);
  const { deleteSelected, showToast, toggleLockNode } = useCircuitStore(
    useShallow((s) => ({ deleteSelected: s.deleteSelected, showToast: s.showToast, toggleLockNode: s.toggleLockNode }))
  );

  const { gateType, label, inputs = [], outputs = [] } = nodeData;
  const info = getComponentInfo(gateType);
  const TypePanel = TYPE_PANELS[gateType];
  const isCfg = gateType.startsWith('CFG_');
  const hasCustomLabel = !!label && label.trim().toLowerCase() !== info.name.toLowerCase();

  return (
    <aside aria-label={`${info.name} properties`} className="w-full h-full flex flex-col overflow-hidden bg-surface-1 text-fg">
      <InspectorHeader
        icon={<GateIcon type={gateType} className="w-6 h-6" />}
        title={info.name}
        subtitle={hasCustomLabel ? label : info.description || info.category}
        actions={
          <>
            <IconButton
              icon={nodeData.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              tooltip={nodeData.isLocked ? 'Unlock position' : 'Lock position'}
              isActive={!!nodeData.isLocked}
              onClick={() => toggleLockNode(nodeId)}
            />
            <IconButton
              icon={<Trash2 className="w-4 h-4" />}
              tooltip="Delete part"
              shortcut="Del"
              variant="danger"
              onClick={() => {
                deleteSelected();
                showToast('Part deleted');
              }}
            />
          </>
        }
      />

      <div className="@container flex-1 overflow-y-auto min-h-0">
        {TypePanel ? (
          <div className="p-4 space-y-4">
            <TypePanel nodeId={nodeId} nodeData={nodeData} />
          </div>
        ) : (
          <>
            {isCfg ? (
              <>
                <InspectorSection title="General" icon={<Sliders className="w-4 h-4" />}>
                  <PropertyRow label="Label">
                    <Input
                      value={label}
                      aria-label="Label"
                      onChange={(e) => useCircuitStore.getState().updateNodeLabel(nodeId, e.target.value)}
                      placeholder="Part label"
                    />
                  </PropertyRow>
                </InspectorSection>
                <div className="p-4 space-y-4 border-b border-line">
                  <ConfigurableProperties nodeId={nodeId} nodeData={nodeData} />
                </div>
              </>
            ) : (
              <GeneralSettings nodeId={nodeId} nodeData={nodeData} />
            )}

            <InspectorSection title="Pins" icon={<Hash className="w-4 h-4" />}>
              <PinStatusList
                nodeId={nodeId}
                inputs={inputs}
                outputs={outputs}
                aliases={nodeData.pinAliases}
                editableAliases={!isCfg}
              />
            </InspectorSection>

            {TRUTH_TABLE_GATES.has(gateType) && (
              <InspectorSection title="Analysis" icon={<Table className="w-4 h-4" />}>
                <Button
                  variant="secondary"
                  size="md"
                  leftIcon={<Table className="w-4 h-4" />}
                  onClick={() => setIsGateTruthTableOpen(true)}
                  className="w-full"
                >
                  Show truth table
                </Button>
                <GateTruthTableModal
                  isOpen={isGateTruthTableOpen}
                  onClose={() => setIsGateTruthTableOpen(false)}
                  gateType={gateType}
                  inputCount={inputs.length}
                  currentInputs={inputs}
                  nodeLabel={label}
                />
              </InspectorSection>
            )}
          </>
        )}

        <InspectorSection title="Advanced" icon={<Wrench className="w-4 h-4" />} defaultExpanded={false}>
          <PropertyRow label="Part ID">
            <code className="text-xs font-mono text-fg-subtle truncate select-text">{nodeId}</code>
          </PropertyRow>
          <PropertyRow label="Type">
            <code className="text-xs font-mono text-fg-subtle select-text">{gateType}</code>
          </PropertyRow>
        </InspectorSection>
      </div>
    </aside>
  );
};

export const InspectorPanel: React.FC = () => {
  const { nodes, edges, selectedNodeId, selectedEdgeId } = useCircuitStore(
    useShallow((s) => ({ nodes: s.nodes, edges: s.edges, selectedNodeId: s.selectedNodeId, selectedEdgeId: s.selectedEdgeId }))
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  if (selectedEdge && !selectedNode) {
    return <WireInspector edge={selectedEdge} />;
  }

  if (!selectedNode) return <EmptyState />;

  // Groups carry no gate type; they get their own panel
  if (selectedNode.type === 'groupNode') {
    const data = selectedNode.data as { label?: string; color?: string };
    return (
      <aside aria-label="Group properties" className="w-full h-full flex flex-col overflow-hidden bg-surface-1 text-fg">
        <InspectorHeader icon={<Layers className="w-5 h-5" />} title="Group" subtitle={data.label} />
        <div className="@container flex-1 overflow-y-auto min-h-0 p-4">
          <GroupProperties nodeId={selectedNode.id} label={data.label} color={data.color} />
        </div>
      </aside>
    );
  }

  return <NodeInspector key={selectedNode.id} nodeId={selectedNode.id} nodeData={selectedNode.data as unknown as NodeData} />;
};
