import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GateType } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { useShallow } from 'zustand/react/shallow';
import {
  Search,
  X,
  ChevronRight,
  ToggleLeft,
  GitMerge,
  Calculator,
  MemoryStick,
  Lightbulb,
  Spline,
  Boxes,
  History,
  PanelLeftClose,
} from 'lucide-react';
import { PARTS, PART_CATEGORIES, PartCategory, PartInfo } from '../../data/components';
import { PartGlyph, ChipGlyph } from './PartGlyph';
import { nextPlacementPosition } from '../../utils/canvasBridge';
import { getDefaultICPins } from '../../simulation/icLogic';
import { Tooltip } from '../ui/Tooltip';

const RECENT_KEY = 'logic_studio_recent_parts';
const RECENT_MAX = 6;
const OPEN_KEY = 'logic_studio_bin_sections';

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable: preference lasts for this session only
  }
}

const CATEGORY_ICON: Record<PartCategory | 'custom' | 'recent', React.ReactNode> = {
  recent: <History className="w-[18px] h-[18px]" />,
  custom: <Boxes className="w-[18px] h-[18px]" />,
  Signals: <ToggleLeft className="w-[18px] h-[18px]" />,
  Gates: (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
      <path d="M5 5h7a7 7 0 0 1 0 14H5z" />
    </svg>
  ),
  Combinational: <GitMerge className="w-[18px] h-[18px]" />,
  Arithmetic: <Calculator className="w-[18px] h-[18px]" />,
  Memory: <MemoryStick className="w-[18px] h-[18px]" />,
  Displays: <Lightbulb className="w-[18px] h-[18px]" />,
  Wiring: <Spline className="w-[18px] h-[18px]" />,
};

const pinCount = (type: GateType) => {
  try {
    const pins = getDefaultICPins(type);
    return pins.inputs.length + pins.outputs.length;
  } catch {
    return 4;
  }
};

interface PartButtonProps {
  part: PartInfo;
  onAdd: (type: GateType) => void;
  onDragStart: (e: React.DragEvent, type: GateType) => void;
}

/** Symbol tile: the part's schematic symbol with its short name underneath. */
const PartTile: React.FC<PartButtonProps> = ({ part, onAdd, onDragStart }) => (
  <Tooltip content={part.description} side="right" delay={500}>
    <button
      type="button"
      draggable
      onDragStart={(e) => onDragStart(e, part.type)}
      onClick={() => onAdd(part.type)}
      aria-label={`${part.name}: ${part.description}`}
      className="group flex flex-col items-center justify-end gap-1.5 h-[76px] px-1 pb-2 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2 active:bg-surface-3 cursor-grab active:cursor-grabbing transition-colors"
    >
      <span className="h-8 flex items-center justify-center group-hover:text-accent transition-colors">
        <PartGlyph type={part.type} />
      </span>
      <span className="text-xs font-medium leading-tight text-center text-fg">{part.name}</span>
    </button>
  </Tooltip>
);

/** Chip row: DIP glyph, name and description, part number at the right. */
const PartRow: React.FC<PartButtonProps & { showCategory?: boolean }> = ({ part, onAdd, onDragStart, showCategory }) => {
  const isChip = ['Combinational', 'Arithmetic', 'Memory'].includes(part.category);
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => onDragStart(e, part.type)}
      onClick={() => onAdd(part.type)}
      title={part.description}
      className="group w-full flex items-center gap-3 pl-2 pr-2.5 py-1.5 rounded-lg text-left hover:bg-surface-2 active:bg-surface-3 cursor-grab active:cursor-grabbing transition-colors"
    >
      <span className="h-7 w-11 shrink-0 flex items-center justify-center text-fg-subtle group-hover:text-accent transition-colors">
        {isChip ? <ChipGlyph pins={pinCount(part.type)} /> : <PartGlyph type={part.type} />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-medium text-fg truncate">{part.name}</span>
        <span className="block text-xs text-fg-subtle truncate">
          {showCategory ? `${part.category} · ${part.description}` : part.description}
        </span>
      </span>
      {part.partNumber && <span className="text-[11px] font-mono text-fg-subtle shrink-0">{part.partNumber}</span>}
    </button>
  );
};

interface SectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Section = React.forwardRef<HTMLElement, SectionProps>(({ id, title, icon, count, isOpen, onToggle, children }, ref) => (
  <section ref={ref} data-section={id} className="scroll-mt-2">
    <h3>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center gap-2 pl-2 pr-2.5 h-9 rounded-lg text-[13px] font-semibold text-fg hover:bg-surface-2 cursor-pointer"
      >
        <span className="text-fg-subtle" aria-hidden="true">
          {icon}
        </span>
        <span className="flex-1 text-left">{title}</span>
        <span className="text-xs font-normal text-fg-subtle tabular-nums">{count}</span>
        <ChevronRight
          className={`w-4 h-4 text-fg-subtle transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}
          aria-hidden="true"
        />
      </button>
    </h3>
    {isOpen && <div className="pt-0.5 pb-3">{children}</div>}
  </section>
));
Section.displayName = 'Section';

interface LeftToolboxProps {
  /** Rail: icon-only strip; clicking an icon expands the bin at that section. */
  mode?: 'panel' | 'rail';
}

export const LeftToolbox: React.FC<LeftToolboxProps> = ({ mode = 'panel' }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    readJSON(OPEN_KEY, Object.fromEntries(PART_CATEGORIES.map((c) => [c.id, c.defaultOpen])))
  );
  const [recent, setRecent] = useState<GateType[]>(() => readJSON<GateType[]>(RECENT_KEY, []).slice(0, RECENT_MAX));
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const pendingScroll = useRef<string | null>(null);

  const { addNode, customComponents, instantiateCustomComponent, setShowToolbox } = useCircuitStore(
    useShallow((s) => ({
      addNode: s.addNode,
      customComponents: s.customComponents,
      instantiateCustomComponent: s.instantiateCustomComponent,
      setShowToolbox: s.setShowToolbox,
    }))
  );

  const rememberRecent = (type: GateType) => {
    setRecent((prev) => {
      const next = [type, ...prev.filter((t) => t !== type)].slice(0, RECENT_MAX);
      writeJSON(RECENT_KEY, next);
      return next;
    });
  };

  const handleAdd = (type: GateType) => {
    addNode(type, nextPlacementPosition());
    rememberRecent(type);
  };

  const handleDragStart = (e: React.DragEvent, type: GateType) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
    rememberRecent(type);
  };

  const setSectionOpen = (id: string, value: boolean) =>
    setOpen((prev) => {
      const next = { ...prev, [id]: value };
      writeJSON(OPEN_KEY, next);
      return next;
    });

  const q = query.trim().toLowerCase();
  const results = useMemo(
    () =>
      q
        ? PARTS.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q) ||
              p.type.toLowerCase().replace(/_/g, ' ').includes(q) ||
              p.partNumber?.toLowerCase().includes(q)
          )
        : [],
    [q]
  );

  const customList = Object.values(customComponents || {}).filter((c) => !q || c.name.toLowerCase().includes(q));
  const recentParts = recent.map((t) => PARTS.find((p) => p.type === t)).filter((p): p is PartInfo => !!p);

  // After expanding from the rail, open and scroll to the chosen section
  useEffect(() => {
    if (mode !== 'panel' || !pendingScroll.current) return;
    const id = pendingScroll.current;
    pendingScroll.current = null;
    requestAnimationFrame(() => sectionRefs.current[id]?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  }, [mode]);

  if (mode === 'rail') {
    const railItems: { id: string; title: string }[] = [
      ...PART_CATEGORIES.map((c) => ({ id: c.id, title: c.title })),
      ...(Object.keys(customComponents || {}).length ? [{ id: 'custom', title: 'My components' }] : []),
    ];
    return (
      <nav aria-label="Part categories" className="w-14 h-full border-r border-line bg-surface-1 flex flex-col items-center gap-1 py-2">
        <Tooltip content="Find a part" shortcut="/" side="right">
          <button
            type="button"
            aria-label="Find a part"
            onClick={() => {
              setShowToolbox(true);
              requestAnimationFrame(() => document.getElementById('parts-search')?.focus());
            }}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-fg-muted hover:text-fg hover:bg-surface-2 cursor-pointer"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>
        </Tooltip>
        <div className="w-6 h-px bg-line my-1" aria-hidden="true" />
        {railItems.map((item) => (
          <Tooltip key={item.id} content={item.title} side="right">
            <button
              type="button"
              aria-label={item.title}
              onClick={() => {
                setSectionOpen(item.id, true);
                pendingScroll.current = item.id;
                setShowToolbox(true);
              }}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-fg-muted hover:text-fg hover:bg-surface-2 cursor-pointer"
            >
              {CATEGORY_ICON[item.id as PartCategory]}
            </button>
          </Tooltip>
        ))}
      </nav>
    );
  }

  return (
    <aside aria-label="Parts" className="w-72 h-full border-r border-line flex flex-col select-none overflow-hidden bg-surface-1 text-fg">
      <div className="px-3 pt-3 pb-2 shrink-0 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-fg-subtle absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            id="parts-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setQuery('');
                (e.target as HTMLInputElement).blur();
              }
              if (e.key === 'Enter' && results[0]) handleAdd(results[0].type);
            }}
            placeholder="Find a part"
            aria-label="Find a part"
            aria-describedby="parts-search-hint"
            className="w-full h-9 pl-8 pr-8 rounded-lg bg-surface-0 border border-line text-[13px] text-fg placeholder:text-fg-subtle hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-fg-subtle hover:text-fg hover:bg-surface-2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd
              id="parts-search-hint"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-5 min-w-5 px-1 rounded border border-line text-[11px] font-mono text-fg-subtle flex items-center justify-center pointer-events-none"
            >
              /
            </kbd>
          )}
        </div>
        <Tooltip content="Collapse to icons" side="bottom">
          <button
            type="button"
            aria-label="Collapse parts panel"
            onClick={() => setShowToolbox(false)}
            className="hidden lg:flex w-9 h-9 shrink-0 rounded-lg items-center justify-center text-fg-subtle hover:text-fg hover:bg-surface-2 cursor-pointer"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        {q ? (
          <div role="region" aria-live="polite" aria-label="Search results">
            <p className="px-2 pt-1 pb-2 text-xs text-fg-subtle">
              {results.length + customList.length === 0
                ? `Nothing matches "${query}". Try a gate name like XOR or a chip like 74HC283.`
                : `${results.length + customList.length} found${results.length ? ' · Enter adds the first' : ''}`}
            </p>
            {results.map((part) => (
              <PartRow key={part.type} part={part} onAdd={handleAdd} onDragStart={handleDragStart} showCategory />
            ))}
            {customList.map((comp) => (
              <button
                key={comp.id}
                type="button"
                onClick={() => instantiateCustomComponent(comp.id, nextPlacementPosition())}
                className="w-full flex items-center gap-3 pl-2 pr-2.5 py-1.5 rounded-lg text-left hover:bg-surface-2 cursor-pointer"
              >
                <span className="h-7 w-11 shrink-0 flex items-center justify-center" style={{ color: comp.color || 'var(--signal-bus)' }}>
                  <ChipGlyph pins={comp.inputs.length + comp.outputs.length} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-medium text-fg truncate">{comp.name}</span>
                  <span className="block text-xs text-fg-subtle truncate">My components</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {recentParts.length > 0 && (
              <Section
                id="recent"
                title="Recently used"
                icon={CATEGORY_ICON.recent}
                count={recentParts.length}
                isOpen={open.recent !== false}
                onToggle={() => setSectionOpen('recent', open.recent === false)}
              >
                <div className="grid grid-cols-3 gap-0.5">
                  {recentParts.map((part) => (
                    <PartTile key={part.type} part={part} onAdd={handleAdd} onDragStart={handleDragStart} />
                  ))}
                </div>
              </Section>
            )}

            {PART_CATEGORIES.map((cat) => {
              const parts = PARTS.filter((p) => p.category === cat.id);
              const isOpen = open[cat.id] ?? cat.defaultOpen;
              return (
                <Section
                  key={cat.id}
                  ref={(el) => {
                    sectionRefs.current[cat.id] = el;
                  }}
                  id={cat.id}
                  title={cat.title}
                  icon={CATEGORY_ICON[cat.id]}
                  count={parts.length}
                  isOpen={isOpen}
                  onToggle={() => setSectionOpen(cat.id, !isOpen)}
                >
                  {cat.layout === 'tiles' ? (
                    <div className="grid grid-cols-3 gap-0.5">
                      {parts.map((part) => (
                        <PartTile key={part.type} part={part} onAdd={handleAdd} onDragStart={handleDragStart} />
                      ))}
                    </div>
                  ) : (
                    parts.map((part) => <PartRow key={part.type} part={part} onAdd={handleAdd} onDragStart={handleDragStart} />)
                  )}
                </Section>
              );
            })}

            {customList.length > 0 && (
              <Section
                ref={(el) => {
                  sectionRefs.current.custom = el;
                }}
                id="custom"
                title="My components"
                icon={CATEGORY_ICON.custom}
                count={customList.length}
                isOpen={open.custom !== false}
                onToggle={() => setSectionOpen('custom', open.custom === false)}
              >
                {customList.map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => instantiateCustomComponent(comp.id, nextPlacementPosition())}
                    title={comp.description || `Add ${comp.name}`}
                    className="group w-full flex items-center gap-3 pl-2 pr-2.5 py-1.5 rounded-lg text-left hover:bg-surface-2 cursor-pointer"
                  >
                    <span className="h-7 w-11 shrink-0 flex items-center justify-center" style={{ color: comp.color || 'var(--signal-bus)' }}>
                      <ChipGlyph pins={comp.inputs.length + comp.outputs.length} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-medium text-fg truncate">{comp.name}</span>
                      <span className="block text-xs text-fg-subtle truncate">
                        {comp.inputs.length} in, {comp.outputs.length} out
                      </span>
                    </span>
                  </button>
                ))}
              </Section>
            )}
          </>
        )}
      </div>

      <p className="px-4 py-2.5 border-t border-line text-xs text-fg-subtle shrink-0">
        Click to place at the center, or drag onto the canvas.
      </p>
    </aside>
  );
};
