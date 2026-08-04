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
  Sun,
  Moon,
  Table,
} from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Badge } from '../ui/Badge';
import { toPng } from 'html-to-image';

interface TopBarProps {
  onOpenPresets: () => void;
  onOpenShortcuts: () => void;
  onOpenCircuitTruthTable: () => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenPresets,
  onOpenShortcuts,
  onOpenCircuitTruthTable,
  canvasRef,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    nodes,
    edges,
    presets,
    loadCircuit,
    clearCanvas,
    historyPast,
    historyFuture,
    undo,
    redo,
    theme,
    toggleTheme,
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
        backgroundColor: theme === 'light' ? '#f8fafc' : '#080b11',
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
    <header className={`h-14 px-4 flex items-center justify-between z-30 select-none border-b transition-colors duration-200 ${
      theme === 'light'
        ? 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
        : 'bg-slate-950/90 border-slate-800 text-slate-100'
    }`}>
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <Cpu className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className={`text-sm font-bold font-mono tracking-wider ${
              theme === 'light' ? 'text-slate-900' : 'text-slate-100'
            }`}>
              LOGIC STUDIO
            </h1>
            <Badge variant="emerald" size="xs">
              v1.0 Pro
            </Badge>
          </div>
          <span className={`text-[10px] font-sans ${
            theme === 'light' ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Professional Desktop Circuit Suite
          </span>
        </div>
      </div>

      {/* Middle: Action Toolbar */}
      <div className={`flex items-center gap-1 border p-1 rounded-2xl shadow-inner transition-colors duration-200 ${
        theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
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

        <div className={`w-[1px] h-4 my-auto mx-1 ${theme === 'light' ? 'bg-slate-300' : 'bg-slate-800'}`} />

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

        <div className={`w-[1px] h-4 my-auto mx-1 ${theme === 'light' ? 'bg-slate-300' : 'bg-slate-800'}`} />

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
          leftIcon={<Camera className="w-3.5 h-3.5 text-purple-400" />}
          onClick={handleExportPNG}
        >
          Export PNG
        </Button>

        <div className="w-[1px] h-4 bg-slate-800 my-auto mx-1" />

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

      {/* Right Controls: Theme Switch & Shortcuts */}
      <div className="flex items-center gap-2">
        <IconButton
          icon={theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
          tooltip={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          variant="secondary"
          size="sm"
          onClick={toggleTheme}
        />

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
