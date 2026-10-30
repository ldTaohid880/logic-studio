import React, { useRef, useState } from 'react';
import {
  FilePlus,
  Download,
  Upload,
  Image as ImageIcon,
  Trash2,
  Undo2,
  Redo2,
  FolderOpen,
  Keyboard,
  Cpu,
  Layers,
  PanelRight,
  PanelLeft,
  RotateCcw,
  ChevronDown,
  Sun,
  Moon,
  Table2,
  ToggleLeft,
  Monitor,
} from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { useShallow } from 'zustand/react/shallow';
import { IconButton } from '../ui/IconButton';
import { DropdownMenu, MenuEntry } from '../ui/DropdownMenu';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Tooltip } from '../ui/Tooltip';
import { toPng } from 'html-to-image';
import { resolveCssColor } from '../../theme/signals';
import { UiDensity } from '../../store/types';
import { saveCircuitAsJSON } from '../../utils/fileActions';

interface TopBarProps {
  onOpenPresets: () => void;
  onOpenShortcuts: () => void;
  onOpenSubcircuitLibrary?: () => void;
  onOpenCircuitTruthTable?: () => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

const DENSITY_LABELS: Record<UiDensity, string> = {
  compact: 'Compact',
  comfortable: 'Comfortable',
  presentation: 'Presentation (projector)',
};

const Divider = ({ className = '' }: { className?: string }) => (
  <div className={`w-px h-5 bg-line mx-1 shrink-0 ${className}`} aria-hidden="true" />
);

type PendingConfirm = 'new' | 'clear' | null;

export const TopBar: React.FC<TopBarProps> = ({
  onOpenPresets,
  onOpenShortcuts,
  onOpenSubcircuitLibrary,
  onOpenCircuitTruthTable,
  canvasRef,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);

  const {
    nodes,
    presets,
    customComponents,
    showInspector,
    toggleInspector,
    showToolbox,
    toggleToolbox,
    openCircuitFile,
    clearCanvas,
    historyPast,
    historyFuture,
    undo,
    redo,
    showToast,
    resetSimulation,
    theme,
    toggleTheme,
    density,
    setDensity,
  } = useCircuitStore(
    useShallow((s) => ({
      nodes: s.nodes,
      presets: s.presets,
      customComponents: s.customComponents,
      showInspector: s.showInspector,
      toggleInspector: s.toggleInspector,
      showToolbox: s.showToolbox,
      toggleToolbox: s.toggleToolbox,
      openCircuitFile: s.openCircuitFile,
      clearCanvas: s.clearCanvas,
      historyPast: s.historyPast,
      historyFuture: s.historyFuture,
      undo: s.undo,
      redo: s.redo,
      showToast: s.showToast,
      resetSimulation: s.resetSimulation,
      theme: s.theme,
      toggleTheme: s.toggleTheme,
      density: s.density,
      setDensity: s.setDensity,
    }))
  );

  const handleSaveJSON = saveCircuitAsJSON;

  const handleLoadJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      openCircuitFile(String(event.target?.result ?? ''));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportPNG = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = await toPng(canvasRef.current, {
        backgroundColor: resolveCssColor('--canvas-bg', theme === 'dark' ? '#101114' : '#fafbfc'),
        quality: 0.95,
      });
      const link = document.createElement('a');
      link.download = `circuit-export-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Canvas exported as PNG');
    } catch (err) {
      console.error('Failed to export image:', err);
      showToast('Failed to export PNG image', 'error');
    }
  };

  const confirmPending = () => {
    if (pendingConfirm === 'new') {
      clearCanvas();
      showToast('New circuit — press Ctrl+Z to restore the previous one');
    } else if (pendingConfirm === 'clear') {
      clearCanvas();
      showToast('Canvas cleared — press Ctrl+Z to undo');
    }
    setPendingConfirm(null);
  };

  const requestNew = () => (nodes.length === 0 ? clearCanvas() : setPendingConfirm('new'));

  const customCount = Object.keys(customComponents || {}).length;

  const fileMenu: MenuEntry[] = [
    { id: 'new', label: 'New circuit', icon: <FilePlus className="w-4 h-4" />, onSelect: requestNew },
    { id: 'open', label: 'Open file…', icon: <Upload className="w-4 h-4" />, onSelect: () => fileInputRef.current?.click() },
    { id: 'save', label: 'Save as JSON', icon: <Download className="w-4 h-4" />, shortcut: 'Ctrl+S', onSelect: handleSaveJSON },
    { id: 'png', label: 'Export image (PNG)', icon: <ImageIcon className="w-4 h-4" />, onSelect: handleExportPNG },
    { type: 'separator', id: 'sep1' },
    { id: 'presets', label: `Example circuits (${presets.length})`, icon: <FolderOpen className="w-4 h-4" />, onSelect: onOpenPresets },
    {
      id: 'library',
      label: `Subcircuit library (${customCount})`,
      icon: <Layers className="w-4 h-4" />,
      onSelect: () => onOpenSubcircuitLibrary?.(),
    },
    { type: 'separator', id: 'sep2' },
    {
      id: 'reset-signals',
      label: 'Reset all signals',
      icon: <RotateCcw className="w-4 h-4" />,
      onSelect: resetSimulation,
    },
    {
      id: 'reset-inputs',
      label: 'Set all inputs to 0',
      icon: <ToggleLeft className="w-4 h-4" />,
      onSelect: () => useCircuitStore.getState().resetAllInputs(),
    },
    {
      id: 'clear',
      label: 'Clear canvas',
      icon: <Trash2 className="w-4 h-4" />,
      destructive: true,
      disabled: nodes.length === 0,
      onSelect: () => setPendingConfirm('clear'),
    },
  ];

  const viewMenu: MenuEntry[] = [
    {
      id: 'theme',
      label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
      icon: theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
      onSelect: toggleTheme,
    },
    { type: 'separator', id: 'sep-density' },
    { type: 'label', id: 'density-label', label: 'Interface size' },
    ...(['compact', 'comfortable', 'presentation'] as UiDensity[]).map<MenuEntry>((d) => ({
      id: `density-${d}`,
      label: `${density === d ? '✓ ' : '   '}${DENSITY_LABELS[d]}`,
      icon: d === 'presentation' ? <Monitor className="w-4 h-4" /> : undefined,
      onSelect: () => setDensity(d),
    })),
    { type: 'separator', id: 'sep-panels' },
    {
      id: 'toolbox',
      label: showToolbox ? 'Hide components panel' : 'Show components panel',
      icon: <PanelLeft className="w-4 h-4" />,
      onSelect: toggleToolbox,
    },
    {
      id: 'inspector',
      label: showInspector ? 'Hide properties panel' : 'Show properties panel',
      icon: <PanelRight className="w-4 h-4" />,
      onSelect: toggleInspector,
    },
    { type: 'separator', id: 'sep-analyze' },
    {
      id: 'truth-table',
      label: 'Circuit truth table',
      icon: <Table2 className="w-4 h-4" />,
      onSelect: () => onOpenCircuitTruthTable?.(),
    },
    { type: 'separator', id: 'sep-help' },
    { id: 'shortcuts', label: 'Keyboard shortcuts', icon: <Keyboard className="w-4 h-4" />, shortcut: '?', onSelect: onOpenShortcuts },
  ];

  const menuTrigger = (label: string) =>
    (props: Parameters<React.ComponentProps<typeof DropdownMenu>['trigger']>[0]) => (
      <button
        {...props}
        type="button"
        className="h-8 px-2.5 inline-flex items-center gap-1 rounded-lg text-[13px] font-medium text-fg-muted hover:text-fg hover:bg-surface-2 aria-expanded:bg-surface-2 aria-expanded:text-fg cursor-pointer"
      >
        {label}
        <ChevronDown className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
      </button>
    );

  return (
    <header className="ui-scale w-full h-12 border-b border-line flex items-center gap-1 px-2 sm:px-3 shrink-0 z-30 bg-surface-1">
      {/* Brand + panel toggle */}
      <IconButton
        icon={<PanelLeft className="w-4 h-4" />}
        tooltip={showToolbox ? 'Hide components panel' : 'Show components panel'}
        isActive={showToolbox}
        onClick={toggleToolbox}
      />
      <div className="hidden sm:flex items-center gap-2 pl-1 pr-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-accent text-on-accent flex items-center justify-center" aria-hidden="true">
          <Cpu className="w-4 h-4" />
        </div>
        <h1 className="hidden md:block text-sm font-semibold text-fg tracking-tight">Logic Studio</h1>
      </div>

      <nav aria-label="Main menu" className="flex items-center">
        <DropdownMenu ariaLabel="File" items={fileMenu} trigger={menuTrigger('File')} />
        <DropdownMenu ariaLabel="View" items={viewMenu} trigger={menuTrigger('View')} />
      </nav>
      <input type="file" ref={fileInputRef} onChange={handleLoadJSON} accept=".json" className="hidden" />

      <Divider className="hidden sm:block" />

      <IconButton
        className="hidden sm:inline-flex"
        icon={<Undo2 className="w-4 h-4" />}
        tooltip="Undo"
        shortcut="Ctrl+Z"
        disabled={historyPast.length === 0}
        onClick={undo}
      />
      <IconButton
        className="hidden sm:inline-flex"
        icon={<Redo2 className="w-4 h-4" />}
        tooltip="Redo"
        shortcut="Ctrl+Y"
        disabled={historyFuture.length === 0}
        onClick={redo}
      />

      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-1 shrink-0">
        <Tooltip content="Truth table for the whole circuit">
          <button
            type="button"
            onClick={onOpenCircuitTruthTable}
            className="h-8 px-2.5 hidden md:inline-flex items-center gap-1.5 rounded-lg text-[13px] font-medium text-fg-muted hover:text-fg hover:bg-surface-2 cursor-pointer"
          >
            <Table2 className="w-4 h-4" />
            <span className="hidden xl:inline">Truth table</span>
          </button>
        </Tooltip>
        <IconButton
          icon={theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          tooltip={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          onClick={toggleTheme}
          className="hidden sm:inline-flex"
        />
        <IconButton
          icon={<Keyboard className="w-4 h-4" />}
          tooltip="Keyboard shortcuts"
          shortcut="?"
          onClick={onOpenShortcuts}
          className="hidden sm:inline-flex"
        />
        <IconButton
          icon={<PanelRight className="w-4 h-4" />}
          tooltip={showInspector ? 'Hide properties panel' : 'Show properties panel'}
          isActive={showInspector}
          onClick={toggleInspector}
        />
      </div>

      <ConfirmDialog
        isOpen={pendingConfirm !== null}
        title={pendingConfirm === 'new' ? 'Start a new circuit?' : 'Clear the canvas?'}
        message={
          <>
            This removes all {nodes.length} component{nodes.length === 1 ? '' : 's'} from the canvas. You can
            bring them back with <kbd className="font-mono text-fg">Ctrl+Z</kbd>.
          </>
        }
        confirmLabel={pendingConfirm === 'new' ? 'New circuit' : 'Clear canvas'}
        destructive
        onConfirm={confirmPending}
        onCancel={() => setPendingConfirm(null)}
      />
    </header>
  );
};
