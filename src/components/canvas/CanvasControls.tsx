import React, { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock,
  Unlock,
  Table,
} from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { Button } from '../ui/Button';
import { useCircuitStore } from '../../store/useCircuitStore';

interface CanvasControlsProps {
  onOpenCircuitTruthTable?: () => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  onOpenCircuitTruthTable,
}) => {
  const { zoomIn, zoomOut, fitView, setNodes } = useReactFlow();
  const [isLocked, setIsLocked] = useState(false);
  const showToast = useCircuitStore((state) => state.showToast);
  const theme = useCircuitStore((state) => state.theme);

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
    <div className={`absolute bottom-5 left-5 z-20 flex items-center gap-1.5 p-1.5 backdrop-blur-xl border rounded-2xl shadow-2xl select-none transition-colors duration-200 ${
      theme === 'light' ? 'bg-white/95 border-slate-200 shadow-slate-200' : 'bg-slate-950/90 border-slate-800'
    }`}>
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

      <div className={`w-[1px] h-5 my-auto mx-0.5 ${theme === 'light' ? 'bg-slate-300' : 'bg-slate-800'}`} />

      <IconButton
        icon={isLocked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-slate-300" />}
        tooltip={isLocked ? 'Unlock Canvas' : 'Lock Node Positions'}
        variant={isLocked ? 'secondary' : 'ghost'}
        size="md"
        isActive={isLocked}
        onClick={handleToggleLock}
      />

      {onOpenCircuitTruthTable && (
        <>
          <div className={`w-[1px] h-5 my-auto mx-0.5 ${theme === 'light' ? 'bg-slate-300' : 'bg-slate-800'}`} />
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
