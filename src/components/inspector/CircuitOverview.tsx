import React from 'react';
import { Node } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { ToggleLeft, Lightbulb, Table, Cpu, BarChart3 } from 'lucide-react';
import { circuitStats } from '../../utils/circuitStats';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { getComponentInfo } from '../../data/components';
import { InspectorSection } from '../ui/InspectorSection';
import { Button } from '../ui/Button';
import { LevelBadge } from './PinStatusList';
import { PartGlyph } from '../toolbar/PartGlyph';

const INPUT_TYPES = new Set(['INPUT', 'PUSH_BUTTON', 'DIP_SWITCH']);
const OUTPUT_TYPES = new Set(['OUTPUT', 'LOGIC_PROBE', 'HEX_DISPLAY', 'BUS_MONITOR', 'SEVEN_SEGMENT']);

const selectNode = (id: string) => {
  const store = useCircuitStore.getState();
  useCircuitStore.setState({ nodes: store.nodes.map((n) => ({ ...n, selected: n.id === id })) });
  store.setSelectedEdgeId(null);
  store.setSelectedNodeId(id);
};

const bitsValue = (values: number[]): number | null =>
  values.every((v) => v === 0 || v === 1) ? values.reduce<number>((acc, v, i) => acc | (v << i), 0) : null;

/** Name of a part as the student sees it: its label, or the part name if it has none. */
const displayName = (data: NodeData) => data.label?.trim() || getComponentInfo(data.gateType).name;

const Row: React.FC<{ node: Node; children: React.ReactNode }> = ({ node, children }) => {
  const data = node.data as unknown as NodeData;
  return (
    <li className="flex items-center gap-2.5 h-10 pl-1.5 pr-2 rounded-lg hover:bg-surface-2">
      <button
        type="button"
        onClick={() => selectNode(node.id)}
        title="Select on canvas"
        className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
      >
        <span className="h-6 w-9 shrink-0 flex items-center justify-center text-fg-subtle" aria-hidden="true">
          <PartGlyph type={data.gateType} />
        </span>
        <span className="text-[13px] font-medium text-fg truncate">{displayName(data)}</span>
      </button>
      {children}
    </li>
  );
};

/**
 * Shown when nothing is selected: every input you can flip and every output you can read,
 * live, so the circuit can be exercised from one place.
 */
export const CircuitOverview: React.FC<{ onOpenCircuitTruthTable?: () => void }> = ({ onOpenCircuitTruthTable }) => {
  const { nodes, edges } = useCircuitStore(useShallow((s) => ({ nodes: s.nodes, edges: s.edges })));
  const edgeCount = edges.length;
  // Structure only changes with parts and wires, not with signal levels
  const structure = nodes.map((n) => `${n.id}:${(n.data as unknown as NodeData).gateType}`).join() + '|' + edges.map((e) => `${e.source}>${e.target}`).join();
  const stats = React.useMemo(() => circuitStats(nodes, edges), [structure]);
  const toggleInputValue = useCircuitStore((s) => s.toggleInputValue);
  const setButtonPressed = useCircuitStore((s) => s.setButtonPressed);

  const parts = nodes.filter((n) => n.type !== 'groupNode');
  const inputs = parts.filter((n) => INPUT_TYPES.has((n.data as unknown as NodeData).gateType));
  const outputs = parts.filter((n) => OUTPUT_TYPES.has((n.data as unknown as NodeData).gateType));
  const logicCount = parts.length - inputs.length - outputs.length;

  return (
    <aside aria-label="Circuit overview" className="w-full h-full flex flex-col overflow-hidden bg-surface-1 text-fg">
      <header className="px-4 pt-4 pb-3 border-b border-line shrink-0">
        <h2 className="text-[15px] font-semibold text-fg">This circuit</h2>
        <p className="text-xs text-fg-subtle mt-0.5">
          {parts.length === 0
            ? 'Empty. Add parts from the left to get started.'
            : `${inputs.length} input${inputs.length === 1 ? '' : 's'}, ${logicCount} logic part${logicCount === 1 ? '' : 's'}, ${outputs.length} output${outputs.length === 1 ? '' : 's'}, ${edgeCount} wire${edgeCount === 1 ? '' : 's'}`}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto min-h-0">
        <InspectorSection title="Inputs" icon={<ToggleLeft className="w-4 h-4" />} badge={<span className="text-xs text-fg-subtle tabular-nums">{inputs.length}</span>}>
          {inputs.length === 0 ? (
            <p className="text-[13px] text-fg-subtle">No switches or buttons yet.</p>
          ) : (
            <ul className="-mx-1.5">
              {inputs.map((node) => {
                const data = node.data as unknown as NodeData;
                if (data.gateType === 'INPUT') {
                  const on = data.value === 1;
                  return (
                    <Row key={node.id} node={node}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        aria-label={`${displayName(data)}: ${on ? '1' : '0'}`}
                        onClick={() => toggleInputValue(node.id)}
                        className={`relative w-10 h-6 rounded-full border transition-colors cursor-pointer ${
                          on ? 'bg-signal-high border-signal-high' : 'bg-surface-3 border-line-strong'
                        }`}
                      >
                        <span
                          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-surface-1 shadow-sm flex items-center justify-center font-mono text-[10px] font-bold transition-[left] ${
                            on ? 'left-[19px] text-signal-high' : 'left-[3px] text-fg-muted'
                          }`}
                        >
                          {on ? '1' : '0'}
                        </span>
                      </button>
                    </Row>
                  );
                }
                if (data.gateType === 'PUSH_BUTTON') {
                  return (
                    <Row key={node.id} node={node}>
                      <LevelBadge value={data.value ?? 0} />
                      <button
                        type="button"
                        onPointerDown={(e) => {
                          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                          setButtonPressed(node.id, true);
                        }}
                        onPointerUp={() => setButtonPressed(node.id, false)}
                        onLostPointerCapture={() => setButtonPressed(node.id, false)}
                        onKeyDown={(e) => {
                          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
                            e.preventDefault();
                            setButtonPressed(node.id, true);
                          }
                        }}
                        onKeyUp={() => setButtonPressed(node.id, false)}
                        className="h-7 px-2.5 rounded-md border border-line bg-surface-2 active:bg-signal-high active:text-on-accent text-xs font-medium cursor-pointer select-none"
                      >
                        Hold
                      </button>
                    </Row>
                  );
                }
                const bits = Array.from({ length: data.bitWidth || 4 }, (_, i) => (data.dipValues?.[i] === 1 ? 1 : 0));
                return (
                  <Row key={node.id} node={node}>
                    <span className="font-mono text-xs text-fg-muted tabular-nums">
                      {bits.slice().reverse().join('')} = {bitsValue(bits)}
                    </span>
                  </Row>
                );
              })}
            </ul>
          )}
        </InspectorSection>

        <InspectorSection title="Outputs" icon={<Lightbulb className="w-4 h-4" />} badge={<span className="text-xs text-fg-subtle tabular-nums">{outputs.length}</span>}>
          {outputs.length === 0 ? (
            <p className="text-[13px] text-fg-subtle">No LEDs or displays yet.</p>
          ) : (
            <ul className="-mx-1.5">
              {outputs.map((node) => {
                const data = node.data as unknown as NodeData;
                const values = (data.inputs || []).map((p) => p.value as number);
                if (data.gateType === 'OUTPUT' || data.gateType === 'LOGIC_PROBE') {
                  return (
                    <Row key={node.id} node={node}>
                      <LevelBadge value={values[0]} />
                    </Row>
                  );
                }
                const n = bitsValue(data.gateType === 'SEVEN_SEGMENT' ? values.slice(0, 4) : values);
                return (
                  <Row key={node.id} node={node}>
                    <span className="font-mono text-[13px] text-fg tabular-nums">
                      {n === null ? <span className="text-signal-unknown">?</span> : data.gateType === 'HEX_DISPLAY' ? n.toString(16).toUpperCase() : n}
                    </span>
                  </Row>
                );
              })}
            </ul>
          )}
        </InspectorSection>

        {inputs.length > 0 && outputs.length > 0 && (
          <div className="p-4 space-y-2">
            <Button variant="secondary" size="md" className="w-full" leftIcon={<Table className="w-4 h-4" />} onClick={onOpenCircuitTruthTable}>
              Truth table for this circuit
            </Button>
            <p className="text-xs text-fg-subtle text-center">Lists every input combination and what the outputs show.</p>
          </div>
        )}

        {stats.gates + stats.chips + stats.memoryParts > 0 && (
          <InspectorSection title="Statistics" icon={<BarChart3 className="w-4 h-4" />} defaultExpanded={false}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
              <dt className="text-fg-muted">Gates</dt>
              <dd className="text-fg tabular-nums">
                {stats.gates}
                {stats.gates > 0 && (
                  <span className="text-fg-subtle">
                    {' '}
                    ({Object.entries(stats.gatesByType)
                      .map(([t, n]) => `${n} ${getComponentInfo(t as NodeData['gateType']).name}`)
                      .join(', ')})
                  </span>
                )}
              </dd>
              <dt className="text-fg-muted">Chips</dt>
              <dd className="text-fg tabular-nums">{stats.chips}</dd>
              <dt className="text-fg-muted">Memory parts</dt>
              <dd className="text-fg tabular-nums">{stats.memoryParts}</dd>
              <dt className="text-fg-muted">Logic levels</dt>
              <dd className="text-fg tabular-nums">{stats.levels}</dd>
            </dl>
            {stats.longestPath.length > 1 && (
              <div className="space-y-1.5">
                <p className="text-xs text-fg-subtle">Longest path (each gate or chip adds one gate delay):</p>
                <p className="text-xs font-mono text-fg break-words">
                  {stats.longestPath
                    .map((id) => {
                      const node = nodes.find((n) => n.id === id);
                      return node ? displayName(node.data as unknown as NodeData) : '?';
                    })
                    .join(' → ')}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const path = new Set(stats.longestPath);
                    useCircuitStore.setState({ nodes: useCircuitStore.getState().nodes.map((n) => ({ ...n, selected: path.has(n.id) })) });
                  }}
                >
                  Select it on the canvas
                </Button>
              </div>
            )}
            {stats.hasLoop && (
              <p className="text-xs text-signal-unknown">The logic has a feedback loop, so paths are only measured up to it.</p>
            )}
          </InspectorSection>
        )}

        {parts.length > 0 && (
          <p className="px-4 pb-4 text-xs text-fg-subtle flex items-start gap-2">
            <Cpu className="w-3.5 h-3.5 mt-px shrink-0" aria-hidden="true" />
            Select a part to see how it works. Shift-drag on the canvas selects several.
          </p>
        )}
      </div>
    </aside>
  );
};
