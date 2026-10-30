import React, { useEffect, useMemo, useState } from 'react';
import { Node } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { ChevronDown, ChevronUp, Download, Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { TIMELINE_SPEEDS } from '../../store/slices/timeline';
import { NodeData, SignalValue } from '../../types/circuit';
import { DEFAULT_CLOCK_HZ, hasTimedParts, TracePoint } from '../../simulation/timeline';
import { getComponentInfo } from '../../data/components';
import { signalColor } from '../../theme/signals';
import { tracesToVcd } from '../../utils/vcd';
import { IconButton } from '../ui/IconButton';
import { SegmentedControl } from '../ui/SegmentedControl';

const OPEN_KEY = 'logic_studio_timing_open';
const ROW_ORDER: Record<string, number> = {
  CLOCK: 0, INPUT: 1, PUSH_BUTTON: 1, SENSOR_LIGHT: 1, SENSOR_TEMPERATURE: 1, SENSOR_OBSTACLE: 1, SENSOR_MOTION: 1, OUTPUT: 2, LOGIC_PROBE: 2,
};
const VIEW_W = 1000;
const ROW_H = 22;

export function formatTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms * 10) / 10} ms`;
  return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`;
}

const readOpen = () => {
  try {
    return localStorage.getItem(OPEN_KEY) !== 'false';
  } catch {
    return true;
  }
};

/** Runs the simulation clock while mounted and running: one step per animation frame. */
function useAnimationLoop(running: boolean) {
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      useCircuitStore.getState().advanceTimeline(now - last);
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);
}

interface Row {
  id: string;
  name: string;
  points: TracePoint[];
}

/** Waveform of one signal between start and end, drawn in a 1000-wide view box. */
const Wave: React.FC<{ points: TracePoint[]; start: number; end: number }> = ({ points, start, end }) => {
  const x = (t: number) => ((Math.max(t, start) - start) / (end - start)) * VIEW_W;
  const y = (v: SignalValue) => (v === 1 ? 4 : v === 0 ? ROW_H - 4 : ROW_H / 2);
  const segments: { from: number; to: number; v: SignalValue }[] = [];
  points.forEach(([t, v], i) => {
    const to = points[i + 1]?.[0] ?? end;
    if (to >= start && t <= end) segments.push({ from: t, to: Math.min(to, end), v });
  });

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${ROW_H}`} preserveAspectRatio="none" className="w-full h-full" aria-hidden="true">
      {segments.map((s, i) => (
        <g key={i}>
          {i > 0 && (
            <line x1={x(s.from)} x2={x(s.from)} y1={y(segments[i - 1].v)} y2={y(s.v)} stroke="var(--fg-subtle)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          )}
          <line
            x1={x(s.from)}
            x2={x(s.to)}
            y1={y(s.v)}
            y2={y(s.v)}
            stroke={signalColor(s.v)}
            strokeWidth={s.v === 1 ? 2.5 : 1.75}
            strokeDasharray={s.v === -1 ? '5 4' : undefined}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
    </svg>
  );
};

/**
 * Run controls and timing diagram. Shown only while the circuit has a clock or a board, so circuits
 * without them keep the instant, timeless behaviour.
 */
export const TimingPanel: React.FC = () => {
  const visible = useCircuitStore((s) => hasTimedParts(s.nodes));
  return visible ? <TimingPanelContent /> : null;
};

const TimingPanelContent: React.FC = () => {
  const [open, setOpen] = useState(readOpen);
  const { timeline, nodes, setTimelineRunning, setTimelineSpeed, stepTimeline, restartTimeline } = useCircuitStore(
    useShallow((s) => ({
      timeline: s.timeline,
      nodes: s.nodes,
      setTimelineRunning: s.setTimelineRunning,
      setTimelineSpeed: s.setTimelineSpeed,
      stepTimeline: s.stepTimeline,
      restartTimeline: s.restartTimeline,
    }))
  );
  useAnimationLoop(timeline.running);

  const toggleOpen = () => {
    setOpen(!open);
    try {
      localStorage.setItem(OPEN_KEY, String(!open));
    } catch {
      // preference lasts for this session only
    }
  };

  const rows = useMemo<Row[]>(
    () =>
      nodes
        .filter((n) => (n.data as unknown as NodeData).gateType in ROW_ORDER && timeline.traces[n.id])
        .sort((a: Node, b: Node) => {
          const ra = ROW_ORDER[(a.data as unknown as NodeData).gateType];
          const rb = ROW_ORDER[(b.data as unknown as NodeData).gateType];
          return ra - rb || a.position.y - b.position.y || a.position.x - b.position.x;
        })
        .map((n) => {
          const data = n.data as unknown as NodeData;
          return { id: n.id, name: data.label || getComponentInfo(data.gateType).name, points: timeline.traces[n.id] };
        }),
    [nodes, timeline.traces]
  );

  // Show about ten periods of the fastest clock (two seconds with only boards)
  const fastestHalf = Math.min(
    ...nodes.filter((n) => (n.data as unknown as NodeData).gateType === 'CLOCK').map((n) => 500 / ((n.data as unknown as NodeData).clockHz ?? DEFAULT_CLOCK_HZ))
  );
  const span = Number.isFinite(fastestHalf) ? Math.min(Math.max(fastestHalf * 20, 100), 20_000) : 2000;
  const end = Math.max(timeline.time, span);
  const start = end - span;

  const downloadVcd = () => {
    const text = tracesToVcd(rows.map((r) => ({ name: r.name, points: r.points })));
    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
    link.download = 'timing.vcd';
    link.click();
  };

  return (
    <section aria-label="Run controls and timing diagram" className="ui-scale shrink-0 border-t border-line bg-surface-1 text-fg">
      <div className="flex items-center gap-1 sm:gap-1.5 px-2 h-11">
        <IconButton
          icon={timeline.running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          tooltip={timeline.running ? 'Pause' : 'Run'}
          variant={timeline.running ? 'secondary' : 'primary'}
          size="sm"
          onClick={() => setTimelineRunning(!timeline.running)}
        />
        <IconButton icon={<StepForward className="w-4 h-4" />} tooltip="Step to the next clock edge" size="sm" onClick={stepTimeline} />
        <IconButton icon={<RotateCcw className="w-4 h-4" />} tooltip="Restart from time 0" size="sm" onClick={restartTimeline} />
        <div className="ml-1 shrink-0">
          <SegmentedControl
            size="xs"
            ariaLabel="Simulation speed"
            options={TIMELINE_SPEEDS.map((s) => ({ value: s, label: s === 0.25 ? '¼×' : `${s}×` }))}
            value={timeline.speed}
            onChange={setTimelineSpeed}
          />
        </div>
        <span className="ml-1 sm:ml-2 font-mono text-xs text-fg-muted tabular-nums whitespace-nowrap" aria-live="off">
          <span className="hidden sm:inline">t = </span>
          {formatTime(timeline.time)}
        </span>
        {timeline.running && timeline.behind && <span className="text-xs text-signal-unknown whitespace-nowrap truncate">slower than real time</span>}
        <div className="flex-1" />
        {open && rows.length > 0 && (
          <span className="hidden sm:contents">
            <IconButton icon={<Download className="w-4 h-4" />} tooltip="Download as VCD (for GTKWave)" size="sm" onClick={downloadVcd} />
          </span>
        )}
        <button
          type="button"
          onClick={toggleOpen}
          aria-expanded={open}
          aria-label="Timing diagram"
          className="h-8 px-2 rounded-lg flex items-center gap-1 whitespace-nowrap text-xs font-medium text-fg-muted hover:text-fg hover:bg-surface-2"
        >
          <span className="hidden sm:inline">Timing diagram</span> {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {open && (
        <div className="px-2 pb-2 max-h-48 overflow-y-auto">
          {rows.length === 0 ? (
            <p className="text-xs text-fg-subtle px-1 py-2">Clocks, switches, buttons, sensors, LEDs and probes appear here as their levels change.</p>
          ) : (
            <>
              {rows.map((r) => (
                <div key={r.id} className="flex items-center gap-2" style={{ height: ROW_H + 4 }}>
                  <span className="w-24 shrink-0 truncate text-xs text-fg-muted text-right" title={r.name}>
                    {r.name}
                  </span>
                  <div className="flex-1 min-w-0" style={{ height: ROW_H }}>
                    <Wave points={r.points} start={start} end={end} />
                  </div>
                </div>
              ))}
              <div className="flex gap-2 text-[11px] font-mono text-fg-subtle">
                <span className="w-24 shrink-0" />
                <div className="flex-1 flex justify-between">
                  <span>{formatTime(start)}</span>
                  <span>{formatTime(end)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};
