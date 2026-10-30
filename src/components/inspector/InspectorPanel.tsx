import React from 'react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { useShallow } from 'zustand/react/shallow';
import { GateType, NodeData } from '../../types/circuit';
import { PartGlyph } from '../toolbar/PartGlyph';
import { Sliders, Trash2, Hash, Lock, Unlock, Wrench, Layers, Activity } from 'lucide-react';
import { EncoderProperties } from './EncoderProperties';
import { SevenSegmentProperties } from './SevenSegmentProperties';
import { GroupProperties } from './GroupProperties';
import { CustomComponentProperties } from './CustomComponentProperties';
import { WireInspector } from './WireInspector';
import { InspectorHeader } from './InspectorHeader';
import { PinStatusList } from './PinStatusList';
import { OutputColorPicker } from './OutputColorPicker';
import { OutputColor } from '../../theme/outputColors';
import { PartLiveView, hasLiveView } from './PartLiveView';
import { CircuitOverview } from './CircuitOverview';
import { SelectionSummary } from './SelectionSummary';
import { DEFAULT_ENCODER_CONFIG } from '../../types/encoder';
import { DEFAULT_SEVEN_SEGMENT_CONFIG } from '../../types/sevenSegment';
import { getComponentInfo } from '../../data/components';

import { InspectorSection } from '../ui/InspectorSection';
import { PropertyRow } from '../ui/PropertyRow';
import { Input } from '../ui/Input';
import { SegmentedControl } from '../ui/SegmentedControl';
import { IconButton } from '../ui/IconButton';

interface PanelProps {
  nodeId: string;
  nodeData: NodeData;
}

/**
 * Parts with their own settings panel, shown below "How it works". Everything else gets
 * the generic Settings / Pins sections.
 */
const TYPE_PANELS: Partial<Record<GateType, React.FC<PanelProps>>> = {
  CUSTOM: ({ nodeId, nodeData }) => <CustomComponentProperties nodeId={nodeId} data={nodeData} />,
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
};

const MULTI_INPUT_GATES = new Set<GateType>(['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR']);

const SETTINGS_TYPES = new Set<GateType>([...MULTI_INPUT_GATES, 'TUNNEL', 'TEXT_LABEL', 'DIP_SWITCH', 'BUS_MONITOR', 'OUTPUT', 'HEX_DISPLAY']);

// Per-part panels built from InspectorSections (no extra padding around them)
const SECTIONED_PANELS = new Set<GateType>(['SEVEN_SEGMENT']);

// Default display color per part, matching the node renderers
const DEFAULT_COLOR: Partial<Record<GateType, OutputColor>> = { OUTPUT: 'red', HEX_DISPLAY: 'red', BUS_MONITOR: 'green' };

/** Settings for parts without a dedicated panel (the name is edited in the header). */
const GeneralSettings: React.FC<PanelProps> = ({ nodeId, nodeData }) => {
  const { gateType, inputCount = 2 } = nodeData;
  const updateNodeData = useCircuitStore((s) => s.updateNodeData);

  return (
    <InspectorSection title="Settings" icon={<Sliders className="w-4 h-4" />}>
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

      {DEFAULT_COLOR[gateType] && (
        <PropertyRow label="Color">
          <OutputColorPicker
            value={nodeData.displayColor ?? DEFAULT_COLOR[gateType]!}
            onChange={(c) => updateNodeData(nodeId, { displayColor: c })}
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

const NodeInspector: React.FC<PanelProps> = ({ nodeId, nodeData }) => {
  const { deleteSelected, showToast, toggleLockNode, updateNodeLabel } = useCircuitStore(
    useShallow((s) => ({
      deleteSelected: s.deleteSelected,
      showToast: s.showToast,
      toggleLockNode: s.toggleLockNode,
      updateNodeLabel: s.updateNodeLabel,
    }))
  );

  const { gateType, label, inputs = [], outputs = [] } = nodeData;
  const info = getComponentInfo(gateType);
  const TypePanel = TYPE_PANELS[gateType];

  return (
    <aside aria-label={`${info.name} properties`} className="w-full h-full flex flex-col overflow-hidden bg-surface-1 text-fg">
      <InspectorHeader
        icon={<PartGlyph type={gateType} />}
        title={info.name}
        rename={{ value: label ?? '', placeholder: info.name, onChange: (v) => updateNodeLabel(nodeId, v) }}
        subtitle={
          <>
            {info.name}
            {info.partNumber && <span className="font-mono"> · {info.partNumber}</span>}
          </>
        }
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
        {hasLiveView(gateType) && (
          <InspectorSection title="How it works" icon={<Activity className="w-4 h-4" />}>
            {info.description && !['INPUT', 'PUSH_BUTTON', 'OUTPUT', 'LOGIC_PROBE', 'CONST_HIGH', 'CONST_LOW'].includes(gateType) && (
              <p className="text-[13px] text-fg-muted">{info.description}.</p>
            )}
            <PartLiveView nodeId={nodeId} nodeData={nodeData} />
          </InspectorSection>
        )}

        {!hasLiveView(gateType) && info.description && (
          <p className="px-4 pt-3 pb-1 text-[13px] text-fg-muted">{info.description}.</p>
        )}

        {TypePanel && (
          // Section-based panels pad themselves; older card-style panels get the padding here
          <div className={SECTIONED_PANELS.has(gateType) ? '' : 'p-4 space-y-4 border-b border-line'}>
            <TypePanel nodeId={nodeId} nodeData={nodeData} />
          </div>
        )}

        {!TypePanel && SETTINGS_TYPES.has(gateType) && <GeneralSettings nodeId={nodeId} nodeData={nodeData} />}

        {!TypePanel && (inputs.length > 0 || outputs.length > 0) && (
          <InspectorSection
            title="Pins"
            icon={<Hash className="w-4 h-4" />}
            badge={<span className="text-xs text-fg-subtle tabular-nums">{inputs.length + outputs.length}</span>}
            defaultExpanded={!hasLiveView(gateType)}
          >
            <PinStatusList nodeId={nodeId} inputs={inputs} outputs={outputs} aliases={nodeData.pinAliases} />
          </InspectorSection>
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

interface InspectorPanelProps {
  onOpenWizard?: () => void;
  onOpenCircuitTruthTable?: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ onOpenWizard, onOpenCircuitTruthTable }) => {
  const { nodes, edges, selectedNodeId, selectedEdgeId } = useCircuitStore(
    useShallow((s) => ({ nodes: s.nodes, edges: s.edges, selectedNodeId: s.selectedNodeId, selectedEdgeId: s.selectedEdgeId }))
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);
  const multiSelection = nodes.filter((n) => n.selected);

  if (multiSelection.length > 1) {
    return <SelectionSummary selected={multiSelection} onOpenWizard={onOpenWizard} />;
  }

  if (selectedEdge && !selectedNode) {
    return <WireInspector edge={selectedEdge} />;
  }

  if (!selectedNode) return <CircuitOverview onOpenCircuitTruthTable={onOpenCircuitTruthTable} />;

  // Groups carry no gate type; they get their own panel
  if (selectedNode.type === 'groupNode') {
    const data = selectedNode.data as { label?: string; color?: string };
    return (
      <aside aria-label="Group properties" className="w-full h-full flex flex-col overflow-hidden bg-surface-1 text-fg">
        <InspectorHeader
          icon={<Layers className="w-6 h-6" />}
          title="Group"
          rename={{ value: data.label ?? '', placeholder: 'Group', onChange: (v) => useCircuitStore.getState().updateNodeLabel(selectedNode.id, v) }}
          subtitle="A frame around related parts"
        />
        <div className="@container flex-1 overflow-y-auto min-h-0 p-4">
          <GroupProperties nodeId={selectedNode.id} label={data.label} color={data.color} />
        </div>
      </aside>
    );
  }

  return <NodeInspector key={selectedNode.id} nodeId={selectedNode.id} nodeData={selectedNode.data as unknown as NodeData} />;
};
