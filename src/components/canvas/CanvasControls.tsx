import React from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock,
  Unlock,
  Tag,
  Layers,
  CornerDownRight,
  Spline,
  Map as MapIcon,
} from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { useCircuitStore } from '../../store/useCircuitStore';

interface CanvasControlsProps {
  onOpenCircuitTruthTable?: () => void;
}

const TagOff: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" className="opacity-45" />
    <path d="M7 7h.01" className="opacity-45" />
    <line x1="2" y1="2" x2="22" y2="22" strokeWidth="2.5" />
  </svg>
);

export const CanvasControls: React.FC<CanvasControlsProps> = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const isLocked = useCircuitStore((state) => state.isCanvasLocked);
  const toggleCanvasLock = useCircuitStore((state) => state.toggleCanvasLock);
  const showWireLabels = useCircuitStore((state) => state.showWireLabels);
  const toggleWireLabels = useCircuitStore((state) => state.toggleWireLabels);
  const wireStyle = useCircuitStore((state) => state.wireStyle);
  const setWireStyle = useCircuitStore((state) => state.setWireStyle);
  const showMinimap = useCircuitStore((state) => state.showMinimap);
  const toggleMinimap = useCircuitStore((state) => state.toggleMinimap);

  const handleResetZoom = () => {
    fitView({ padding: 0.2, duration: 300 });
  };

  return (
    <div
      role="toolbar"
      aria-label="Canvas view"
      className="ui-scale absolute bottom-3 left-3 z-20 flex items-center gap-0.5 p-1 border border-line rounded-xl shadow-lg select-none bg-surface-1"
    >
      <IconButton
        icon={<ZoomOut className="w-4 h-4" />}
        tooltip="Zoom out"
        tooltipSide="top"
        onClick={() => zoomOut({ duration: 200 })}
      />
      <IconButton
        icon={<ZoomIn className="w-4 h-4" />}
        tooltip="Zoom in"
        tooltipSide="top"
        onClick={() => zoomIn({ duration: 200 })}
      />
      <IconButton
        icon={<Maximize2 className="w-4 h-4" />}
        tooltip="Fit circuit to screen"
        tooltipSide="top"
        onClick={handleResetZoom}
      />

      <div className="w-px h-5 mx-1 bg-line" aria-hidden="true" />

      <IconButton
        icon={isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        tooltip={isLocked ? 'Unlock part positions' : 'Lock part positions'}
        tooltipSide="top"
        isActive={isLocked}
        onClick={toggleCanvasLock}
      />
      <IconButton
        icon={showWireLabels ? <Tag className="w-4 h-4" /> : <TagOff className="w-4 h-4" />}
        tooltip={showWireLabels ? 'Hide wire labels' : 'Show wire labels'}
        tooltipSide="top"
        isActive={showWireLabels}
        onClick={toggleWireLabels}
      />
      <IconButton
        icon={wireStyle === 'orthogonal' ? <CornerDownRight className="w-4 h-4" /> : <Spline className="w-4 h-4" />}
        tooltip={wireStyle === 'orthogonal' ? 'Use curved wires' : 'Use right-angle wires'}
        tooltipSide="top"
        isActive={wireStyle === 'orthogonal'}
        onClick={() => setWireStyle(wireStyle === 'orthogonal' ? 'curved' : 'orthogonal')}
      />
      <IconButton
        icon={<MapIcon className="w-4 h-4" />}
        tooltip={showMinimap ? 'Hide overview map' : 'Show overview map'}
        tooltipSide="top"
        isActive={showMinimap}
        onClick={toggleMinimap}
        className="hidden md:inline-flex"
      />
      <IconButton
        icon={<Layers className="w-4 h-4" />}
        tooltip="Group selected parts"
        shortcut="Ctrl+G"
        tooltipSide="top"
        onClick={() => useCircuitStore.getState().groupSelectedNodes()}
      />
    </div>
  );
};
