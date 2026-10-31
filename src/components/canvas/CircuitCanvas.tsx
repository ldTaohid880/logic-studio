import React, { useRef, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCircuitStore } from '../../store/useCircuitStore';
import { useShallow } from 'zustand/react/shallow';
import { LogicGateNode } from '../nodes/LogicGateNode';
import { DigitalInputNode } from '../nodes/DigitalInputNode';
import { DigitalOutputNode } from '../nodes/DigitalOutputNode';
import { SevenSegmentNode } from '../nodes/SevenSegmentNode';
import { EncoderNode } from '../nodes/EncoderNode';
import { ICComponentNode } from '../nodes/ICComponentNode';
import { DipSwitchNode } from '../nodes/DipSwitchNode';
import { PushButtonNode } from '../nodes/PushButtonNode';
import { LogicProbeNode } from '../nodes/LogicProbeNode';
import { HexDisplayNode } from '../nodes/HexDisplayNode';
import { BusMonitorNode } from '../nodes/BusMonitorNode';
import { UtilityNode } from '../nodes/UtilityNode';
import { GroupNode } from '../nodes/GroupNode';
import { CustomComponentNode } from '../nodes/CustomComponentNode';
import { HierarchyBreadcrumbs } from './HierarchyBreadcrumbs';
import { EmptyCanvas } from './EmptyCanvas';
import { ClockNode } from '../nodes/ClockNode';
import { BoardNode } from '../nodes/BoardNode';
import { SensorNode } from '../nodes/SensorNode';
import { ResistorNode } from '../nodes/ResistorNode';
import { BusNode } from '../nodes/BusNode';
import { BuzzerNode } from '../nodes/BuzzerNode';
import { LcdNode } from '../nodes/LcdNode';
import { SignalEdge } from '../edges/SignalEdge';
import { GateType, NodeData } from '../../types/circuit';
import { MenuPanel, MenuEntry } from '../ui/DropdownMenu';
import { registerCanvasCenter } from '../../utils/canvasBridge';
import { Activity, ExternalLink, Search, PackagePlus, Group, Copy, ClipboardPaste, Trash2, BookOpen } from 'lucide-react';

const nodeTypes = {
  logicGate: LogicGateNode,
  digitalInput: DigitalInputNode,
  digitalOutput: DigitalOutputNode,
  sevenSegment: SevenSegmentNode,
  encoderNode: EncoderNode,
  icComponent: ICComponentNode,
  dipSwitch: DipSwitchNode,
  pushButton: PushButtonNode,
  logicProbe: LogicProbeNode,
  hexDisplay: HexDisplayNode,
  busMonitor: BusMonitorNode,
  utility: UtilityNode,
  groupNode: GroupNode,
  customNode: CustomComponentNode,
  clockSource: ClockNode,
  boardNode: BoardNode,
  sensorModule: SensorNode,
  resistorNode: ResistorNode,
  busNode: BusNode,
  buzzerNode: BuzzerNode,
  lcdNode: LcdNode,
};

const edgeTypes = {
  signalEdge: SignalEdge,
};

import { CanvasControls } from './CanvasControls';

interface CircuitCanvasContentProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onOpenCircuitTruthTable?: () => void;
  onOpenWizard?: () => void;
  onOpenPresets?: () => void;
  onOpenShortcuts?: () => void;
}

const CircuitCanvasContent: React.FC<CircuitCanvasContentProps> = ({
  canvasRef,
  onOpenCircuitTruthTable,
  onOpenWizard,
  onOpenPresets,
  onOpenShortcuts,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    nodeId?: string;
    edgeId?: string;
    isCustom?: boolean;
    customComponentId?: string;
    gateType?: GateType;
  } | null>(null);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    deleteSelected,
    duplicateSelected,
    groupSelectedNodes,
    undo,
    redo,
    isDragging,
    setIsDragging,
    enterSubcircuitView,
    findCustomComponentInstances,
  } = useCircuitStore(useShallow((s) => ({ nodes: s.nodes, edges: s.edges, onNodesChange: s.onNodesChange, onEdgesChange: s.onEdgesChange, onConnect: s.onConnect, addNode: s.addNode, deleteSelected: s.deleteSelected, duplicateSelected: s.duplicateSelected, groupSelectedNodes: s.groupSelectedNodes, undo: s.undo, redo: s.redo, isDragging: s.isDragging, setIsDragging: s.setIsDragging, enterSubcircuitView: s.enterSubcircuitView, findCustomComponentInstances: s.findCustomComponentInstances })));

  const selectedNodes = nodes.filter((n) => n.selected);
  const showMinimap = useCircuitStore((s) => s.showMinimap);
  const isCanvasLocked = useCircuitStore((s) => s.isCanvasLocked);

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    const data = node.data as unknown as NodeData;
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
      isCustom: !!data.customComponentId,
      customComponentId: data.customComponentId,
      gateType: data.gateType,
    });
  }, []);

  const handlePaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  const handleEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, edgeId: edge.id });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);
  const menuEdge = contextMenu?.edgeId ? edges.find((e) => e.id === contextMenu.edgeId) : undefined;

  // Touch devices have no right-click: a 550ms press without moving opens the same menu
  const longPress = useRef<{ timer?: ReturnType<typeof setTimeout>; x: number; y: number } | null>(null);
  const longPressHandlers = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      const target = e.target as HTMLElement;
      if (target.closest('.react-flow__handle, button, input')) return;
      const nodeEl = target.closest('.react-flow__node') as HTMLElement | null;
      const nodeId = nodeEl?.dataset.id;
      const { clientX: x, clientY: y } = e;
      longPress.current = {
        x,
        y,
        timer: setTimeout(() => {
          const node = nodeId ? useCircuitStore.getState().nodes.find((n) => n.id === nodeId) : undefined;
          const data = node?.data as unknown as NodeData | undefined;
          setContextMenu({ x, y, nodeId, isCustom: !!data?.customComponentId, customComponentId: data?.customComponentId, gateType: data?.gateType });
        }, 550),
      };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const lp = longPress.current;
      if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 8) {
        clearTimeout(lp.timer);
        longPress.current = null;
      }
    },
    onPointerUp: () => {
      clearTimeout(longPress.current?.timer);
      longPress.current = null;
    },
  };

  // Drag and drop node from toolbox onto canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as GateType;
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [screenToFlowPosition, addNode]
  );

  const handleNodeDragStart = useCallback(() => {
    setIsDragging(true);
  }, [setIsDragging]);

  const handleNodeDragStop = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  const handleEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: { id: string }) => {
    event.stopPropagation();
    const store = useCircuitStore.getState();
    store.setSelectedEdgeId(edge.id);
    store.setSelectedNodeId(null);
    store.setEditingEdgeId(edge.id);
  }, []);

  // Let the toolbox place click-added parts at the visible center of the canvas
  useEffect(() => {
    registerCanvasCenter(() => {
      const rect = reactFlowWrapper.current?.getBoundingClientRect();
      if (!rect) return { x: 320, y: 180 };
      return screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    });
    return () => registerCanvasCenter(null);
  }, [screenToFlowPosition]);

  return (
    <div
      ref={canvasRef}
      {...longPressHandlers}
      className="flex-1 min-w-0 min-h-0 relative overflow-hidden bg-canvas select-none"
      onDragOver={onDragOver}
      onDrop={onDrop}
          >
      {/* Floating Hierarchical Breadcrumbs */}
      <HierarchyBreadcrumbs />

      {nodes.length === 0 && <EmptyCanvas onOpenPresets={onOpenPresets} onOpenShortcuts={onOpenShortcuts} />}

      <div ref={reactFlowWrapper} className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStart={handleNodeDragStart}
          onNodeDragStop={handleNodeDragStop}
          onEdgeDoubleClick={handleEdgeDoubleClick}
          onNodeContextMenu={handleNodeContextMenu}
          onPaneContextMenu={handlePaneContextMenu}
          onEdgeContextMenu={handleEdgeContextMenu}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          // Deletion goes through the global shortcut handler (deleteSelected) so it is undoable and re-propagates
          deleteKeyCode={null}
          nodesDraggable={!isCanvasLocked}
          snapToGrid
          snapGrid={[15, 15]}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          defaultEdgeOptions={{ type: 'signalEdge' }}
          proOptions={{ hideAttribution: true }}
          zoomOnPinch
          panOnDrag
          minZoom={0.2}
          maxZoom={3}
          className="bg-transparent"
        >
          {/* Grid Background */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.5}
            color="var(--canvas-grid)"
          />

          {/* Minimap */}
          {showMinimap && (
          <MiniMap
            zoomable
            pannable
            nodeColor={(node: Node) => {
              if (node.type === 'groupNode') return 'transparent';
              if (['digitalInput', 'dipSwitch', 'pushButton'].includes(node.type ?? '')) return 'var(--accent)';
              if (node.type === 'customNode' || node.type === 'icComponent') return 'var(--signal-bus)';
              return 'var(--fg-subtle)';
            }}
            nodeBorderRadius={4}
            ariaLabel="Circuit overview"
            className="!border !rounded-xl !overflow-hidden shadow-lg !bottom-3 !right-3 !border-line hidden md:block"
          />
          )}

          {/* Custom Floating Canvas Controls */}
          <CanvasControls onOpenCircuitTruthTable={onOpenCircuitTruthTable} />
        </ReactFlow>
      </div>

      {/* Wire right-click menu */}
      {contextMenu && menuEdge && (
        <MenuPanel
          ariaLabel="Wire actions"
          anchor={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={closeContextMenu}
          items={[
            {
              id: 'watch',
              label: menuEdge.data?.watched ? 'Stop watching in timing diagram' : 'Watch in timing diagram',
              icon: <Activity className="w-4 h-4" />,
              onSelect: () => useCircuitStore.getState().setWireWatched(menuEdge.id, !menuEdge.data?.watched),
            },
            { type: 'separator', id: 'sep-wire' },
            {
              id: 'delete-wire',
              label: 'Delete wire',
              icon: <Trash2 className="w-4 h-4" />,
              shortcut: 'Del',
              destructive: true,
              onSelect: () => {
                useCircuitStore.setState({ selectedEdgeId: menuEdge.id, selectedNodeId: null });
                deleteSelected();
              },
            },
          ]}
        />
      )}

      {/* Canvas / Node Right Click Context Menu */}
      {contextMenu && !contextMenu.edgeId && (
        <MenuPanel
          ariaLabel="Canvas actions"
          anchor={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={closeContextMenu}
          items={[
            ...(contextMenu.isCustom && contextMenu.customComponentId
              ? ([
                  {
                    id: 'edit-sub',
                    label: 'Open subcircuit',
                    icon: <ExternalLink className="w-4 h-4" />,
                    onSelect: () => enterSubcircuitView(contextMenu.customComponentId!, contextMenu.nodeId),
                  },
                  {
                    id: 'find-instances',
                    label: 'Find all instances',
                    icon: <Search className="w-4 h-4" />,
                    onSelect: () => findCustomComponentInstances(contextMenu.customComponentId!),
                  },
                  { type: 'separator', id: 'sep-custom' },
                ] as MenuEntry[])
              : []),
            ...(contextMenu.gateType && contextMenu.gateType !== 'CUSTOM' && contextMenu.gateType !== 'ENCODER'
              ? ([
                  {
                    id: 'datasheet',
                    label: 'Datasheet',
                    icon: <BookOpen className="w-4 h-4" />,
                    onSelect: () => useCircuitStore.getState().openDatasheet(contextMenu.gateType),
                  },
                  { type: 'separator', id: 'sep-datasheet' },
                ] as MenuEntry[])
              : []),
            ...(selectedNodes.length > 0
              ? ([
                  {
                    id: 'make-component',
                    label: `Create component from ${selectedNodes.length} part${selectedNodes.length === 1 ? '' : 's'}…`,
                    icon: <PackagePlus className="w-4 h-4" />,
                    onSelect: () => onOpenWizard?.(),
                  },
                  {
                    id: 'group',
                    label: 'Group',
                    icon: <Group className="w-4 h-4" />,
                    shortcut: 'Ctrl+G',
                    onSelect: () => groupSelectedNodes(),
                  },
                ] as MenuEntry[])
              : []),
            {
              id: 'duplicate',
              label: 'Duplicate',
              icon: <Copy className="w-4 h-4" />,
              shortcut: 'Ctrl+D',
              disabled: selectedNodes.length === 0,
              onSelect: () => duplicateSelected(),
            },
            {
              id: 'paste',
              label: 'Paste',
              icon: <ClipboardPaste className="w-4 h-4" />,
              shortcut: 'Ctrl+V',
              onSelect: () => useCircuitStore.getState().pasteClipboard(),
            },
            { type: 'separator', id: 'sep-delete' },
            {
              id: 'delete',
              label: 'Delete',
              icon: <Trash2 className="w-4 h-4" />,
              shortcut: 'Del',
              destructive: true,
              disabled: selectedNodes.length === 0 && !useCircuitStore.getState().selectedEdgeId,
              onSelect: () => deleteSelected(),
            },
          ]}
        />
      )}
    </div>
  );
};

export const CircuitCanvas: React.FC<CircuitCanvasContentProps> = (props) => {
  return (
    <ReactFlowProvider>
      <CircuitCanvasContent {...props} />
    </ReactFlowProvider>
  );
};
