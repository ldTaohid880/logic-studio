import React, { useRef } from 'react';
import {
  FilePlus,
  Download,
  Upload,
  Camera,
  Trash2,
  Undo,
  Redo,
  FolderOpen,
  Keyboard,
  Cpu,
  Layers,
  PanelRight,
} from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Badge } from '../ui/Badge';
import { toPng } from 'html-to-image';

interface TopBarProps {
  onOpenPresets: () => void;
  onOpenShortcuts: () => void;
  onOpenSubcircuitLibrary?: () => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenPresets,
  onOpenShortcuts,
  onOpenSubcircuitLibrary,
  canvasRef,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    nodes,
    edges,
    presets,
    customComponents,
    showInspector,
    toggleInspector,
    loadCircuit,
    clearCanvas,
    historyPast,
    historyFuture,
    undo,
    redo,
    showToast,
  } = useCircuitStore();

  const handleNewProject = () => {
    clearCanvas();
    showToast('New project created');
  };

  const handleSaveJSON = () => {
    const circuitData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      nodes,
      edges,
      customComponents: useCircuitStore.getState().customComponents,
    };

    const blob = new Blob([JSON.stringify(circuitData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logic-circuit-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Circuit JSON exported');
  };

  const handleLoadJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.nodes && json.edges) {
          if (json.customComponents && typeof json.customComponents === 'object') {
            useCircuitStore.setState((state) => ({
              customComponents: { ...state.customComponents, ...json.customComponents },
            }));
          }
          loadCircuit(json.nodes, json.edges);
          showToast('Circuit JSON loaded successfully');
        } else {
          showToast('Invalid circuit file format');
        }
      } catch (err) {
        showToast('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportPNG = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = await toPng(canvasRef.current, {
        backgroundColor: '#080b11',
        quality: 0.95,
      });
      const link = document.createElement('a');
      link.download = `circuit-export-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Exported PNG canvas image');
    } catch (err) {
      console.error('Failed to export image:', err);
      showToast('Failed to export PNG image');
    }
  };

  return (
    <header className="w-full h-14 border-b flex items-center justify-between px-4 shrink-0 z-10 bg-slate-950/80 border-slate-900 backdrop-blur-md">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
          <Cpu className="w-5 h-5 stroke-[2]" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-mono font-bold text-slate-100">
              LOGIC STUDIO
            </h1>
            <Badge variant="emerald" size="xs">
              v1.0 Pro
            </Badge>
          </div>
          <span className="text-[9px] font-mono font-bold text-slate-400 px-1.5 py-0.5 bg-slate-900 rounded-full border border-slate-800">
            Professional Desktop Circuit Suite
          </span>
        </div>
      </div>

      {/* Middle: Action Toolbar */}
      <div className="flex items-center gap-1 p-1 rounded-xl border bg-slate-900/90 border-slate-800">
        <Button
          variant="ghost"
          size="xs"
          leftIcon={<FilePlus className="w-3.5 h-3.5 text-slate-400" />}
          onClick={handleNewProject}
        >
          New
        </Button>

        <Button
          variant="success"
          size="xs"
          leftIcon={<FolderOpen className="w-3.5 h-3.5 text-emerald-400" />}
          onClick={onOpenPresets}
        >
          Presets ({presets.length})
        </Button>

        <Button
          variant="success"
          size="xs"
          leftIcon={<Layers className="w-3.5 h-3.5 text-emerald-400" />}
          onClick={onOpenSubcircuitLibrary}
        >
          Subcircuits ({Object.keys(customComponents || {}).length})
        </Button>

        <div className="w-[1px] h-4 my-auto mx-1 bg-slate-800" />

        {/* Undo / Redo */}
        <IconButton
          icon={<Undo className="w-3.5 h-3.5" />}
          tooltip="Undo (Ctrl+Z)"
          size="xs"
          disabled={historyPast.length === 0}
          onClick={undo}
        />

        <IconButton
          icon={<Redo className="w-3.5 h-3.5" />}
          tooltip="Redo (Ctrl+Y)"
          size="xs"
          disabled={historyFuture.length === 0}
          onClick={redo}
        />

        <div className="w-[1px] h-4 my-auto mx-1 bg-slate-800" />

        {/* Save / Load / Export */}
        <Button
          variant="ghost"
          size="xs"
          leftIcon={<Download className="w-3.5 h-3.5 text-cyan-400" />}
          onClick={handleSaveJSON}
        >
          Save
        </Button>

        <Button
          variant="ghost"
          size="xs"
          leftIcon={<Upload className="w-3.5 h-3.5 text-cyan-400" />}
          onClick={() => fileInputRef.current?.click()}
        >
          Load
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleLoadJSON}
          accept=".json"
          className="hidden"
        />

        <Button
          variant="ghost"
          size="xs"
          leftIcon={<Camera className="w-3.5 h-3.5 text-slate-450" />}
          onClick={handleExportPNG}
        >
          Export PNG
        </Button>

        <div className="w-[1px] h-4 bg-slate-800 my-auto mx-1" />

        <Button
          variant="ghost"
          size="xs"
          leftIcon={<Undo className="w-3.5 h-3.5 text-amber-400" />}
          onClick={() => useCircuitStore.getState().resetAllInputs()}
        >
          Reset Inputs
        </Button>

        <IconButton
          icon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
          tooltip="Clear Canvas"
          variant="danger"
          size="xs"
          onClick={() => {
            clearCanvas();
            showToast('Canvas cleared');
          }}
        />
      </div>

      {/* Right Controls: Properties & Shortcuts */}
      <div className="flex items-center gap-2">
        <Button
          variant={showInspector ? 'success' : 'secondary'}
          size="xs"
          leftIcon={<PanelRight className={`w-3.5 h-3.5 ${showInspector ? 'text-emerald-400' : 'text-slate-450'}`} />}
          onClick={toggleInspector}
        >
          {showInspector ? 'Hide Properties' : 'Show Properties'}
        </Button>

        <Button
          variant="secondary"
          size="xs"
          leftIcon={<Keyboard className="w-3.5 h-3.5 text-slate-400" />}
          onClick={onOpenShortcuts}
        >
          Shortcuts
        </Button>
      </div>
    </header>
  );
};
