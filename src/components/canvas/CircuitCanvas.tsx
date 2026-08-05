import React, { useRef, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCircuitStore } from '../../store/useCircuitStore';
import { LogicGateNode } from '../nodes/LogicGateNode';
import { DigitalInputNode } from '../nodes/DigitalInputNode';
import { DigitalOutputNode } from '../nodes/DigitalOutputNode';
import { ClockNode } from '../nodes/ClockNode';
import { SevenSegmentNode } from '../nodes/SevenSegmentNode';
import { EncoderNode } from '../nodes/EncoderNode';
import { MultiInputNode } from '../nodes/MultiInputNode';
import { ICComponentNode } from '../nodes/ICComponentNode';
import { DipSwitchNode } from '../nodes/DipSwitchNode';
import { PushButtonNode } from '../nodes/PushButtonNode';
import { RgbLedNode } from '../nodes/RgbLedNode';
import { LogicProbeNode } from '../nodes/LogicProbeNode';
import { HexDisplayNode } from '../nodes/HexDisplayNode';
import { BusMonitorNode } from '../nodes/BusMonitorNode';
import { UtilityNode } from '../nodes/UtilityNode';
import { OscilloscopeNode } from '../nodes/OscilloscopeNode';
import { ConfigurableNode } from '../nodes/ConfigurableNode';
import { LedMatrixNode } from '../nodes/LedMatrixNode';
import { EquationGeneratorNode } from '../nodes/EquationGeneratorNode';
import { GroupNode } from '../nodes/GroupNode';
import { CustomComponentNode } from '../nodes/CustomComponentNode';
import { HierarchyBreadcrumbs } from './HierarchyBreadcrumbs';
import { SignalEdge } from '../edges/SignalEdge';
import { GateType, NodeData } from '../../types/circuit';

const nodeTypes = {
  logicGate: LogicGateNode,
  digitalInput: DigitalInputNode,
  digitalOutput: DigitalOutputNode,
  clockNode: ClockNode,
  sevenSegment: SevenSegmentNode,
  encoderNode: EncoderNode,
  multiInput: MultiInputNode,
  icComponent: ICComponentNode,
  configurableNode: ConfigurableNode,
  dipSwitch: DipSwitchNode,
  pushButton: PushButtonNode,
  rgbLed: RgbLedNode,
  logicProbe: LogicProbeNode,
  hexDisplay: HexDisplayNode,
  busMonitor: BusMonitorNode,
  utility: UtilityNode,
  oscilloscope: OscilloscopeNode,
  ledMatrix: LedMatrixNode,
  equationGenerator: EquationGeneratorNode,
  groupNode: GroupNode,
  customNode: CustomComponentNode,
};

const edgeTypes = {
  signalEdge: SignalEdge,
};

import { CanvasControls } from './CanvasControls';

interface CircuitCanvasContentProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onOpenCircuitTruthTable?: () => void;
  onOpenWizard?: () => void;
}

const CircuitCanvasContent: React.FC<CircuitCanvasContentProps> = ({
  canvasRef,
  onOpenCircuitTruthTable,
  onOpenWizard,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    nodeId?: string;
    isCustom?: boolean;
    customComponentId?: string;
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
    simulation,
    tickSimulation,
    undo,
    redo,
    isDragging,
    setIsDragging,
    enterSubcircuitView,
    findCustomComponentInstances,
  } = useCircuitStore();

  const selectedNodes = nodes.filter((n) => n.selected);

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    const data = node.data as unknown as NodeData;
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
      isCustom: !!data.customComponentId,
      customComponentId: data.customComponentId,
    });
  }, []);

  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // Check if circuit contains any active dynamic nodes (running Clocks, active Oscilloscopes, etc.)
  const hasActiveDynamicNodes = nodes.some((node) => {
    const data = node.data as unknown as NodeData;
    if (data.gateType === 'CLOCK') {
      const isRunning = (data.clockState?.status ?? 'running') === 'running' && data.clockConfig?.enabled !== false;
      return isRunning;
    }
    if (data.gateType === 'OSCILLOSCOPE') {
      return !data.scopeConfig?.isPaused;
    }
    return false;
  });

  // Continuous simulation ticker loop (only runs when active dynamic components exist)
  useEffect(() => {
    if (!simulation.isRunning || simulation.isPaused || !simulation.loopMode || isDragging || !hasActiveDynamicNodes) {
      return;
    }

    const intervalMs = Math.max(30, 400 / simulation.speed);

    const timer = setInterval(() => {
      tickSimulation(false);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [
    simulation.isRunning,
    simulation.isPaused,
    simulation.loopMode,
    simulation.speed,
    tickSimulation,
    isDragging,
    hasActiveDynamicNodes,
  ]);

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

  const handleEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: any) => {
    event.stopPropagation();
    useCircuitStore.getState().setSelectedEdgeId(edge.id);
    useCircuitStore.getState().setSelectedNodeId(null);
    const newLabel = window.prompt('Enter custom name for this wire:', edge.data?.label || '');
    if (newLabel !== null) {
      useCircuitStore.getState().updateEdgeLabel(edge.id, newLabel.trim());
    }
  }, []);

  // Global Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        useCircuitStore.getState().copySelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        useCircuitStore.getState().cutSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        useCircuitStore.getState().pasteClipboard();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          const selectedGroup = useCircuitStore.getState().nodes.find((n) => n.selected && n.type === 'groupNode');
          if (selectedGroup) {
            useCircuitStore.getState().ungroupNode(selectedGroup.id);
          }
        } else {
          useCircuitStore.getState().groupSelectedNodes();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        useCircuitStore.getState().duplicateSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, undo, redo]);

  return (
    <div
      ref={canvasRef}
      className="flex-1 h-[calc(100vh-3.5rem)] relative overflow-hidden bg-[#090d16]"
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={closeContextMenu}
    >
      {/* Floating Hierarchical Breadcrumbs */}
      <HierarchyBreadcrumbs />

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
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          snapToGrid
          snapGrid={[15, 15]}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          defaultEdgeOptions={{ type: 'signalEdge' }}
          proOptions={{ hideAttribution: true }}
          className="bg-transparent"
        >
          {/* Grid Background */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.5}
             color="#334155"
          />

          {/* Minimap */}
          <MiniMap
            zoomable
            pannable
            nodeColor={(node: Node) => {
              if (node.type === 'digitalInput') return '#22d3ee';
              if (node.type === 'digitalOutput') return '#a855f7';
              if (node.type === 'customNode') return '#10b981';
              return '#22c55e';
            }}
            maskColor="rgba(9, 13, 22, 0.85)"
            className="!border !rounded-2xl !overflow-hidden shadow-2xl !bottom-4 !right-4 !bg-slate-950 !border-slate-800"
          />

          {/* Custom Floating Canvas Controls */}
          <CanvasControls onOpenCircuitTruthTable={onOpenCircuitTruthTable} />
        </ReactFlow>
      </div>

      {/* Canvas / Node Right Click Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[200px] py-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl text-xs font-mono select-none animate-fadeIn"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.isCustom && contextMenu.customComponentId && (
            <>
              <button
                onClick={() => {
                  closeContextMenu();
                  enterSubcircuitView(contextMenu.customComponentId!, contextMenu.nodeId);
                }}
                className="w-full px-3 py-1.5 text-left text-emerald-400 hover:bg-slate-800 flex items-center gap-2 font-bold"
              >
                <span>⚡ Edit Subcircuit</span>
              </button>

              <button
                onClick={() => {
                  closeContextMenu();
                  findCustomComponentInstances(contextMenu.customComponentId!);
                }}
                className="w-full px-3 py-1.5 text-left text-cyan-400 hover:bg-slate-800 flex items-center gap-2"
              >
                <span>🔍 Find All Instances</span>
              </button>

              <div className="my-1 border-t border-slate-800" />
            </>
          )}

          {selectedNodes.length > 0 && (
            <button
              onClick={() => {
                closeContextMenu();
                if (onOpenWizard) onOpenWizard();
              }}
              className="w-full px-3 py-1.5 text-left text-emerald-400 hover:bg-slate-800 flex items-center gap-2 font-bold"
            >
              <span>✨ Create Custom Component ({selectedNodes.length})</span>
            </button>
          )}

          {selectedNodes.length > 0 && (
            <button
              onClick={() => {
                closeContextMenu();
                groupSelectedNodes();
              }}
              className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2"
            >
              <span>📦 Group Nodes</span>
            </button>
          )}

          <button
            onClick={() => {
              closeContextMenu();
              duplicateSelected();
            }}
            className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2"
          >
            <span>📋 Duplicate Selected</span>
          </button>

          <div className="my-1 border-t border-slate-800" />

          <button
            onClick={() => {
              closeContextMenu();
              deleteSelected();
            }}
            className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-slate-800 flex items-center gap-2"
          >
            <span>🗑️ Delete Selected</span>
          </button>
        </div>
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
