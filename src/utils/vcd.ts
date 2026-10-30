import { SignalValue } from '../types/circuit';
import { TracePoint } from '../simulation/timeline';

export interface VcdSignal {
  name: string;
  points: TracePoint[];
}

const VCD_LEVEL: Record<SignalValue, string> = { 1: '1', 0: '0', [-1]: 'x' };

/** Value change dump (IEEE 1364) of timing diagram traces, readable by GTKWave and similar viewers. Times are in µs. */
export function tracesToVcd(signals: VcdSignal[], date = new Date()): string {
  const ids = signals.map((_, i) => String.fromCharCode(33 + (i % 94)) + (i >= 94 ? String(Math.floor(i / 94)) : ''));
  const lines = [
    `$date ${date.toISOString()} $end`,
    '$version Logic Studio $end',
    '$timescale 1 us $end',
    '$scope module circuit $end',
    ...signals.map((s, i) => `$var wire 1 ${ids[i]} ${s.name.replace(/\s+/g, '_') || `signal_${i + 1}`} $end`),
    '$upscope $end',
    '$enddefinitions $end',
  ];

  const changes = new Map<number, string[]>();
  signals.forEach((s, i) =>
    s.points.forEach(([t, v]) => {
      const at = Math.round(t * 1000);
      changes.set(at, [...(changes.get(at) ?? []), `${VCD_LEVEL[v]}${ids[i]}`]);
    })
  );
  [...changes.keys()].sort((a, b) => a - b).forEach((at) => lines.push(`#${at}`, ...changes.get(at)!));
  return lines.join('\n') + '\n';
}
