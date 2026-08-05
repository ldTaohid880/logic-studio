import React, { useRef, useState, useEffect } from 'react';
import { TopBar } from './components/toolbar/TopBar';
import { LeftToolbox } from './components/toolbar/LeftToolbox';
import { CircuitCanvas } from './components/canvas/CircuitCanvas';
import { InspectorPanel } from './components/inspector/InspectorPanel';
import { PresetsModal } from './components/ui/PresetsModal';
import { ShortcutsModal } from './components/ui/ShortcutsModal';
import { CircuitTruthTableModal } from './components/ui/CircuitTruthTableModal';
import { CustomComponentWizardModal } from './components/custom/CustomComponentWizardModal';
import { CustomComponentLibraryModal } from './components/custom/CustomComponentLibraryModal';
import { Toast } from './components/ui/Toast';
import { useCircuitStore } from './store/useCircuitStore';

export default function App() {
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCircuitTruthTableOpen, setIsCircuitTruthTableOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  const showInspector = useCircuitStore((state) => state.showInspector);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col font-sans overflow-hidden select-none transition-colors duration-200 bg-slate-950 text-slate-100">
      {/* Top Navigation Bar */}
      <TopBar
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenSubcircuitLibrary={() => setIsLibraryOpen(true)}
        canvasRef={canvasRef}
      />

      {/* Interactive Main Workspace Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Toolbox Palette */}
        <LeftToolbox />

        {/* Infinite React Flow Circuit Canvas */}
        <CircuitCanvas
          canvasRef={canvasRef}
          onOpenCircuitTruthTable={() => setIsCircuitTruthTableOpen(true)}
          onOpenWizard={() => setIsWizardOpen(true)}
        />

        {/* Right Node & Wire Inspector Panel */}
        {showInspector && <InspectorPanel />}
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
      <CustomComponentWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />
      <CustomComponentLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onOpenWizard={() => setIsWizardOpen(true)}
      />
      <Toast />
    </div>
  );
}
