import React from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  StepForward,
  Gauge,
} from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Badge } from '../ui/Badge';
import { SegmentedControl } from '../ui/SegmentedControl';

interface SimulationBarProps {
  onOpenCircuitTruthTable?: () => void;
}

const RoundedLoopIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

export const SimulationBar: React.FC<SimulationBarProps> = () => {
  const {
    simulation,
    startSimulation,
    pauseSimulation,
    stopSimulation,
    resetSimulation,
    stepSimulation,
    setSpeed,
    toggleLoopMode,
  } = useCircuitStore();

  const speedOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 5, label: '5x' },
    { value: 10, label: '10x' },
  ];

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-3 py-2 backdrop-blur-xl border rounded-2xl transition-colors duration-200 bg-slate-950/90 border-slate-800 text-slate-200 shadow-2xl">
      {/* Play / Pause / Stop Group */}
      <div className="flex items-center gap-1 border p-1 rounded-xl bg-slate-900/90 border-slate-800/80">
        {!simulation.isRunning || simulation.isPaused ? (
          <Button
            variant="primary"
            size="xs"
            leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
            onClick={startSimulation}
          >
            Run
          </Button>
        ) : (
          <Button
            variant="outline"
            size="xs"
            leftIcon={<Pause className="w-3.5 h-3.5 fill-current text-amber-400" />}
            onClick={pauseSimulation}
            className="border-amber-500/40 text-amber-300"
          >
            Pause
          </Button>
        )}

        <IconButton
          icon={<Square className="w-3.5 h-3.5 fill-current text-rose-400" />}
          tooltip="Stop Simulation"
          variant="ghost"
          size="xs"
          disabled={!simulation.isRunning}
          onClick={stopSimulation}
        />

        <div className="w-[1px] h-4 my-auto mx-0.5 bg-slate-800" />

        <IconButton
          icon={<RotateCcw className="w-3.5 h-3.5 text-slate-400" />}
          tooltip="Reset Circuit Signals"
          variant="ghost"
          size="xs"
          onClick={resetSimulation}
        />

        <Button
          variant="ghost"
          size="xs"
          leftIcon={<StepForward className="w-3.5 h-3.5 text-cyan-400" />}
          onClick={stepSimulation}
        >
          Step
        </Button>
      </div>

      <div className="w-[1px] h-5 my-auto bg-slate-800" />

      {/* Loop Toggle Button */}
      <Button
        variant={simulation.loopMode ? 'success' : 'outline'}
        size="xs"
        leftIcon={
          <RoundedLoopIcon className={`w-3.5 h-3.5 ${simulation.loopMode ? 'animate-spin' : ''}`} />
        }
        onClick={toggleLoopMode}
      >
        Loop
      </Button>

      {/* Speed Selector Segmented Control */}
      <div className="flex items-center gap-1.5 border px-2 py-1 rounded-xl bg-slate-900/90 border-slate-800/80">
        <Gauge className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <SegmentedControl
          options={speedOptions}
          value={simulation.speed}
          onChange={(val) => setSpeed(val as number)}
          size="xs"
          fullWidth={false}
        />
      </div>

      {/* Ticks Counter Badge */}
      <Badge variant="emerald" size="sm" pulse>
        Ticks: {simulation.stepCount}
      </Badge>
    </div>
  );
};
