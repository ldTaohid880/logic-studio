import React, { useRef, useState, useEffect } from 'react';
import { TopBar } from './components/toolbar/TopBar';
import { SimulationBar } from './components/toolbar/SimulationBar';
import { LeftToolbox } from './components/toolbar/LeftToolbox';
import { CircuitCanvas } from './components/canvas/CircuitCanvas';
import { InspectorPanel } from './components/inspector/InspectorPanel';
import { PresetsModal } from './components/ui/PresetsModal';
import { ShortcutsModal } from './components/ui/ShortcutsModal';
import { CircuitTruthTableModal } from './components/ui/CircuitTruthTableModal';
import { Toast } from './components/ui/Toast';
import { useCircuitStore } from './store/useCircuitStore';

export default function App() {
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCircuitTruthTableOpen, setIsCircuitTruthTableOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const theme = useCircuitStore((state) => state.theme);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  return (
    <div className={`w-screen h-screen flex flex-col font-sans overflow-hidden select-none transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Top Main Navigation Bar */}
      <TopBar
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenCircuitTruthTable={() => setIsCircuitTruthTableOpen(true)}
        canvasRef={canvasRef}
      />

      {/* Interactive Main Workspace Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Floating Simulation Control Bar */}
        <SimulationBar onOpenCircuitTruthTable={() => setIsCircuitTruthTableOpen(true)} />

        {/* Left Toolbox Palette */}
        <LeftToolbox />

        {/* Infinite React Flow Circuit Canvas */}
        <CircuitCanvas
          canvasRef={canvasRef}
          onOpenCircuitTruthTable={() => setIsCircuitTruthTableOpen(true)}
        />

        {/* Right Node & Wire Inspector Panel */}
        <InspectorPanel />
      </div>

      {/* Modals */}
      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
      />
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
      <CircuitTruthTableModal
        isOpen={isCircuitTruthTableOpen}
        onClose={() => setIsCircuitTruthTableOpen(false)}
      />
      <Toast />
    </div>
  );
}
