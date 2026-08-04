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
import { SignalEdge } from '../edges/SignalEdge';
import { GateType } from '../../types/circuit';

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
};

const edgeTypes = {
  signalEdge: SignalEdge,
};

import { CanvasControls } from './CanvasControls';

interface CircuitCanvasContentProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onOpenCircuitTruthTable?: () => void;
}

const CircuitCanvasContent: React.FC<CircuitCanvasContentProps> = ({ canvasRef, onOpenCircuitTruthTable }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    deleteSelected,
    simulation,
    tickSimulation,
    undo,
    redo,
    theme,
    isDragging,
    setIsDragging,
  } = useCircuitStore();

  // Continuous simulation ticker loop
  useEffect(() => {
    if (!simulation.isRunning || simulation.isPaused || !simulation.loopMode || isDragging) {
      return;
    }

    // Speed 1x = 400ms, 2x = 200ms, 5x = 80ms, 10x = 40ms
    const intervalMs = Math.max(30, 400 / simulation.speed);

    const timer = setInterval(() => {
      tickSimulation();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [simulation.isRunning, simulation.isPaused, simulation.loopMode, simulation.speed, tickSimulation, isDragging]);

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

  // Global Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
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
      className={`flex-1 h-[calc(100vh-3.5rem)] relative overflow-hidden transition-colors duration-200 ${
        theme === 'light' ? 'bg-slate-100' : 'bg-[#090d16]'
      }`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div ref={reactFlowWrapper} className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStart={handleNodeDragStart}
          onNodeDragStop={handleNodeDragStop}
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
            color={theme === 'light' ? '#94a3b8' : '#334155'}
          />

          {/* Minimap */}
          <MiniMap
            zoomable
            pannable
            nodeColor={(node: Node) => {
              if (node.type === 'digitalInput') return '#22d3ee';
              if (node.type === 'digitalOutput') return '#a855f7';
              return '#22c55e';
            }}
            maskColor={theme === 'light' ? 'rgba(241, 245, 249, 0.85)' : 'rgba(9, 13, 22, 0.85)'}
            className={`!border !rounded-2xl !overflow-hidden shadow-2xl !bottom-4 !right-4 ${
              theme === 'light' ? '!bg-white !border-slate-300' : '!bg-slate-950 !border-slate-800'
            }`}
          />

          {/* Custom Floating Canvas Controls */}
          <CanvasControls onOpenCircuitTruthTable={onOpenCircuitTruthTable} />
        </ReactFlow>
      </div>
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
