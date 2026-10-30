import React, { useRef, useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/toolbar/TopBar';
import { LeftToolbox } from './components/toolbar/LeftToolbox';
import { StatusBar } from './components/toolbar/StatusBar';
import { CircuitCanvas } from './components/canvas/CircuitCanvas';
import { InspectorPanel } from './components/inspector/InspectorPanel';
import { TimingPanel } from './components/timeline/TimingPanel';
import { PresetsModal } from './components/ui/PresetsModal';
import { ShortcutsModal } from './components/ui/ShortcutsModal';
import { CircuitTruthTableModal } from './components/ui/CircuitTruthTableModal';
import { CustomComponentWizardModal } from './components/custom/CustomComponentWizardModal';
import { CustomComponentLibraryModal } from './components/custom/CustomComponentLibraryModal';
import { Toast } from './components/ui/Toast';
import { useCircuitStore } from './store/useCircuitStore';
import { useShallow } from 'zustand/react/shallow';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useMediaQuery } from './hooks/useMediaQuery';

const INSPECTOR_WIDTH_KEY = 'logic_studio_inspector_width';
const INSPECTOR_MIN = 300;
const INSPECTOR_MAX = 480;

function readInspectorWidth() {
  try {
    const saved = Number(localStorage.getItem(INSPECTOR_WIDTH_KEY));
    if (saved >= INSPECTOR_MIN && saved <= INSPECTOR_MAX) return saved;
  } catch {
    // ignore unavailable storage
  }
  return 340;
}

export default function App() {
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCircuitTruthTableOpen, setIsCircuitTruthTableOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [inspectorWidth, setInspectorWidth] = useState(readInspectorWidth);

  const canvasRef = useRef<HTMLDivElement>(null);

  const { showInspector, showToolbox, setShowInspector, setShowToolbox, theme, density } = useCircuitStore(
    useShallow((s) => ({
      showInspector: s.showInspector,
      showToolbox: s.showToolbox,
      setShowInspector: s.setShowInspector,
      setShowToolbox: s.setShowToolbox,
      theme: s.theme,
      density: s.density,
    }))
  );

  // Below 1024px the side panels become overlay drawers so the canvas keeps its space
  const isNarrow = useMediaQuery('(max-width: 1023px)');
  const isPhone = useMediaQuery('(max-width: 639px)');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.density = density;
  }, [theme, density]);

  // Collapse both drawers when the viewport becomes narrow
  useEffect(() => {
    if (isNarrow) {
      setShowToolbox(false);
      setShowInspector(false);
    }
  }, [isNarrow, setShowToolbox, setShowInspector]);

  useGlobalShortcuts({ onOpenShortcuts: () => setIsShortcutsOpen(true) });

  const startResize = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = inspectorWidth;
      let latest = startWidth;
      const onMove = (ev: PointerEvent) => {
        latest = Math.min(INSPECTOR_MAX, Math.max(INSPECTOR_MIN, startWidth + (startX - ev.clientX)));
        setInspectorWidth(latest);
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        try {
          localStorage.setItem(INSPECTOR_WIDTH_KEY, String(latest));
        } catch {
          // ignore unavailable storage
        }
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [inspectorWidth]
  );

  const onResizeKey = (e: React.KeyboardEvent) => {
    const delta = e.key === 'ArrowLeft' ? 16 : e.key === 'ArrowRight' ? -16 : 0;
    if (!delta) return;
    e.preventDefault();
    setInspectorWidth((w) => Math.min(INSPECTOR_MAX, Math.max(INSPECTOR_MIN, w + delta)));
  };

  const drawerOpen = isNarrow && (showToolbox || showInspector);

  return (
    <div className="w-screen h-dvh flex flex-col overflow-hidden bg-surface-0 text-fg">
      <TopBar
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenSubcircuitLibrary={() => setIsLibraryOpen(true)}
        onOpenCircuitTruthTable={() => setIsCircuitTruthTableOpen(true)}
        canvasRef={canvasRef}
      />

      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        {/* Parts bin: full panel, or an icon rail when collapsed (phones get a drawer only) */}
        {!isPhone && (
          <div className="ui-scale h-full shrink-0 relative z-10">
            <LeftToolbox mode={showToolbox && !isNarrow ? 'panel' : 'rail'} />
          </div>
        )}
        {showToolbox && isNarrow && (
          <div className={`ui-scale h-full absolute top-0 bottom-0 z-40 shadow-2xl animate-drawer ${isPhone ? 'left-0' : 'left-14'}`}>
            <LeftToolbox />
          </div>
        )}

        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          <CircuitCanvas
            canvasRef={canvasRef}
            onOpenCircuitTruthTable={() => setIsCircuitTruthTableOpen(true)}
            onOpenWizard={() => setIsWizardOpen(true)}
            onOpenPresets={() => setIsPresetsOpen(true)}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
          />
          <TimingPanel />
        </div>

        {showInspector && (
          <div
            className={`ui-scale h-full shrink-0 border-l border-line ${
              isNarrow ? 'absolute right-0 top-0 bottom-0 z-40 shadow-2xl animate-drawer max-w-[90vw]' : 'relative'
            }`}
            style={{ width: inspectorWidth, ['--drawer-from' as string]: '16px' }}
          >
            {!isNarrow && (
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize properties panel"
                aria-valuemin={INSPECTOR_MIN}
                aria-valuemax={INSPECTOR_MAX}
                aria-valuenow={inspectorWidth}
                tabIndex={0}
                onPointerDown={startResize}
                onKeyDown={onResizeKey}
                className="absolute -left-1 top-0 bottom-0 w-2 z-10 cursor-col-resize hover:bg-accent/30 focus-visible:bg-accent/40"
              />
            )}
            <InspectorPanel
              onOpenWizard={() => setIsWizardOpen(true)}
              onOpenCircuitTruthTable={() => setIsCircuitTruthTableOpen(true)}
            />
          </div>
        )}

        {drawerOpen && (
          <button
            type="button"
            aria-label="Close panel"
            className="absolute inset-0 z-30 bg-black/30 cursor-default"
            onClick={() => {
              setShowToolbox(false);
              setShowInspector(false);
            }}
          />
        )}
      </div>

      <StatusBar />

      <PresetsModal isOpen={isPresetsOpen} onClose={() => setIsPresetsOpen(false)} />
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      <CircuitTruthTableModal isOpen={isCircuitTruthTableOpen} onClose={() => setIsCircuitTruthTableOpen(false)} />
      <CustomComponentWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
      <CustomComponentLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onOpenWizard={() => setIsWizardOpen(true)}
      />
      <Toast />
    </div>
  );
}
