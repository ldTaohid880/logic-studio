import React, { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock,
  Unlock,
  Table,
  Tag,
  Layers,
  Unlink,
} from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { Button } from '../ui/Button';
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
    <line x1="2" y1="2" x2="22" y2="22" className="text-rose-500" strokeWidth="2.5" />
  </svg>
);

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  onOpenCircuitTruthTable,
}) => {
  const { zoomIn, zoomOut, fitView, setNodes } = useReactFlow();
  const [isLocked, setIsLocked] = useState(false);
  const showToast = useCircuitStore((state) => state.showToast);
  const showWireLabels = useCircuitStore((state) => state.showWireLabels);
  const toggleWireLabels = useCircuitStore((state) => state.toggleWireLabels);

  const handleToggleLock = () => {
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);
    setNodes((nodes) =>
      nodes.map((node) => ({
        ...node,
        draggable: !nextLocked,
      }))
    );
    showToast(nextLocked ? 'Canvas nodes locked' : 'Canvas nodes unlocked');
  };

  const handleResetZoom = () => {
    fitView({ padding: 0.2, duration: 300 });
  };

  return (
    <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1.5 p-1.5 backdrop-blur-xl border rounded-2xl shadow-2xl select-none bg-slate-950/90 border-slate-800">
      <IconButton
        icon={<ZoomIn className="w-4 h-4" />}
        tooltip="Zoom In"
        variant="secondary"
        size="md"
        onClick={() => zoomIn({ duration: 200 })}
      />

      <IconButton
        icon={<ZoomOut className="w-4 h-4" />}
        tooltip="Zoom Out"
        variant="secondary"
        size="md"
        onClick={() => zoomOut({ duration: 200 })}
      />

      <IconButton
        icon={<Maximize2 className="w-4 h-4" />}
        tooltip="Fit View"
        variant="secondary"
        size="md"
        onClick={handleResetZoom}
      />

      <div className="w-[1px] h-5 my-auto mx-0.5 bg-slate-800" />

      <IconButton
        icon={isLocked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-slate-350" />}
        tooltip={isLocked ? 'Unlock Canvas' : 'Lock Node Positions'}
        variant={isLocked ? 'secondary' : 'ghost'}
        size="md"
        isActive={isLocked}
        onClick={handleToggleLock}
      />

      <IconButton
        icon={showWireLabels ? <Tag className="w-4 h-4 text-emerald-400" /> : <TagOff className="w-4 h-4 text-rose-500/80" />}
        tooltip={showWireLabels ? 'Hide Wire Labels' : 'Show Wire Labels'}
        variant={showWireLabels ? 'secondary' : 'ghost'}
        size="md"
        isActive={showWireLabels}
        onClick={toggleWireLabels}
      />

      <div className="w-[1px] h-5 my-auto mx-0.5 bg-slate-800" />

      <IconButton
        icon={<Layers className="w-4 h-4 text-purple-400" />}
        tooltip="Group Selected Components (Ctrl+G)"
        variant="ghost"
        size="md"
        onClick={() => useCircuitStore.getState().groupSelectedNodes()}
      />

      {onOpenCircuitTruthTable && (
        <>
          <div className="w-[1px] h-5 my-auto mx-0.5 bg-slate-800" />
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Table className="w-3.5 h-3.5 text-cyan-400" />}
            onClick={onOpenCircuitTruthTable}
            className="border-cyan-500/40 text-cyan-300"
          >
            Circuit Table
          </Button>
        </>
      )}
    </div>
  );
};
