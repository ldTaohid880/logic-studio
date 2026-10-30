import React, { useState } from 'react';
import { GateType } from '../../types/circuit';
import { GateIcon } from '../nodes/GateIcons';
import { useCircuitStore } from '../../store/useCircuitStore';
import { useShallow } from 'zustand/react/shallow';
import { ToggleLeft, Plus, Search, ChevronRight, GitMerge, Timer, Calculator, Wrench, Lightbulb, Boxes, History } from 'lucide-react';
import { nextPlacementPosition } from '../../utils/canvasBridge';
import { Input } from '../ui/Input';
import { SegmentedControl } from '../ui/SegmentedControl';
import { TOOLBOX_ITEMS, ToolboxItem } from '../../data/components';

type Category = ToolboxItem['category'];

const RECENT_KEY = 'logic_studio_recent_parts';
const RECENT_MAX = 5;

function readRecent(): GateType[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(raw) ? raw.slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

const CATEGORIES: { id: Category; icon: React.ReactNode }[] = [
  { id: 'Inputs', icon: <ToggleLeft className="w-4 h-4" /> },
  { id: 'Logic Gates', icon: <GateIcon type="AND" className="w-4 h-4" /> },
  { id: 'Combinational', icon: <GitMerge className="w-4 h-4" /> },
  { id: 'Sequential', icon: <Timer className="w-4 h-4" /> },
  { id: 'Arithmetic', icon: <Calculator className="w-4 h-4" /> },
  { id: 'Utility', icon: <Wrench className="w-4 h-4" /> },
  { id: 'Outputs', icon: <Lightbulb className="w-4 h-4" /> },
];

interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon, count, isOpen, onToggle }) => (
  <h3>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className="w-full flex items-center gap-2 px-2 h-8 rounded-md text-[13px] font-semibold text-fg-muted hover:text-fg hover:bg-surface-2 cursor-pointer"
    >
      <ChevronRight className={`w-3.5 h-3.5 text-fg-subtle transition-transform ${isOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
      <span className="text-fg-subtle" aria-hidden="true">{icon}</span>
      <span className="flex-1 text-left">{title}</span>
      <span className="text-xs font-normal text-fg-subtle tabular-nums">{count}</span>
    </button>
  </h3>
);

export const LeftToolbox: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'fixed' | 'configurable'>('all');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [recent, setRecent] = useState<GateType[]>(readRecent);

  const rememberRecent = (type: GateType) => {
    setRecent((prev) => {
      const next = [type, ...prev.filter((t) => t !== type)].slice(0, RECENT_MAX);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // storage unavailable: recents last for this session only
      }
      return next;
    });
  };
  const addNode = useCircuitStore((state) => state.addNode);
  const { customComponents, instantiateCustomComponent } = useCircuitStore(
    useShallow((s) => ({ customComponents: s.customComponents, instantiateCustomComponent: s.instantiateCustomComponent }))
  );

  const handleAddAtCenter = (type: GateType) => {
    addNode(type, nextPlacementPosition());
    rememberRecent(type);
  };

  const handleDragStart = (e: React.DragEvent, type: GateType) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
    rememberRecent(type);
  };

  const query = searchQuery.trim().toLowerCase();

  const filteredItems = TOOLBOX_ITEMS.filter((item) => {
    const matchesSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query) ||
      (item.badgeTag && item.badgeTag.toLowerCase().includes(query));

    if (!matchesSearch) return false;
    if (typeFilter === 'fixed') return !item.isConfigurable;
    if (typeFilter === 'configurable') return item.isConfigurable;
    return true;
  });

  const customComponentList = Object.values(customComponents || {}).filter(
    (c) => typeFilter !== 'configurable' && (!query || c.name.toLowerCase().includes(query))
  );

  // While searching every section is shown expanded so matches are visible
  const isOpen = (id: string) => !!query || !collapsed[id];
  const toggle = (id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const renderItem = (item: ToolboxItem) => (
    <li key={`${item.type}-${item.isConfigurable ? 'cfg' : 'fixed'}`}>
      <button
        type="button"
        draggable
        onDragStart={(e) => handleDragStart(e, item.type)}
        onClick={() => handleAddAtCenter(item.type)}
        title={`${item.description}. Click to add, or drag onto the canvas.`}
        className="group w-full flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-md text-left hover:bg-surface-2 cursor-grab active:cursor-grabbing"
      >
        <span className="text-fg-muted group-hover:text-accent shrink-0" aria-hidden="true">
          <GateIcon type={item.type} className="w-6 h-6" />
        </span>
        <span className="flex flex-col min-w-0 flex-1">
          <span className="text-[13px] font-medium truncate text-fg">{item.name}</span>
          <span className="text-xs truncate text-fg-subtle">{item.description}</span>
        </span>
        {item.isConfigurable ? (
          <span className="text-xs font-medium px-1.5 py-px rounded bg-purple-500/10 text-purple-400 shrink-0">
            Cfg
          </span>
        ) : item.badgeTag && item.badgeTag.startsWith('74HC') ? (
          <span className="text-xs font-mono px-1.5 py-px rounded bg-surface-3 text-fg-muted shrink-0">
            {item.badgeTag}
          </span>
        ) : null}
      </button>
    </li>
  );

  const totalShown = filteredItems.length + customComponentList.length;

  const recentItems = recent
    .map((type) => TOOLBOX_ITEMS.find((i) => i.type === type))
    .filter((i): i is ToolboxItem => !!i);

  return (
    <aside
      aria-label="Components"
      className="w-72 h-full border-r border-line flex flex-col select-none overflow-hidden bg-surface-1 text-fg"
    >
      <div className="p-3 border-b border-line space-y-2.5 shrink-0">
        <div className="flex items-baseline justify-between px-0.5">
          <h2 className="text-sm font-semibold text-fg">Components</h2>
          <span className="text-xs text-fg-subtle tabular-nums" aria-live="polite">
            {totalShown} {query || typeFilter !== 'all' ? 'matching' : 'parts'}
          </span>
        </div>

        <Input
          placeholder="Search parts, e.g. XOR, 74HC283"
          aria-label="Search components"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-3.5 h-3.5" />}
          onClear={() => setSearchQuery('')}
        />

        <SegmentedControl
          ariaLabel="Component type filter"
          options={[
            { value: 'all', label: 'All' },
            { value: 'fixed', label: 'Fixed' },
            { value: 'configurable', label: 'Configurable' },
          ]}
          value={typeFilter}
          onChange={(val) => setTypeFilter(val as 'all' | 'fixed' | 'configurable')}
          size="xs"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {totalShown === 0 && (
          <p className="px-3 py-8 text-center text-[13px] text-fg-subtle">No parts match "{searchQuery}".</p>
        )}

        {!query && typeFilter === 'all' && recentItems.length > 0 && (
          <section>
            <SectionHeader
              title="Recent"
              icon={<History className="w-4 h-4" />}
              count={recentItems.length}
              isOpen={isOpen('recent')}
              onToggle={() => toggle('recent')}
            />
            {isOpen('recent') && <ul className="pb-2">{recentItems.map(renderItem)}</ul>}
          </section>
        )}

        {customComponentList.length > 0 && (
          <section>
            <SectionHeader
              title="My components"
              icon={<Boxes className="w-4 h-4" />}
              count={customComponentList.length}
              isOpen={isOpen('custom')}
              onToggle={() => toggle('custom')}
            />
            {isOpen('custom') && (
              <ul className="pb-2">
                {customComponentList.map((comp) => (
                  <li key={comp.id}>
                    <button
                      type="button"
                      onClick={() => instantiateCustomComponent(comp.id, nextPlacementPosition())}
                      title={comp.description || `Add ${comp.name}`}
                      className="group w-full flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-md text-left hover:bg-surface-2 cursor-pointer"
                    >
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-on-accent"
                        style={{ backgroundColor: comp.color || 'var(--signal-bus)' }}
                        aria-hidden="true"
                      >
                        <Boxes className="w-3.5 h-3.5" />
                      </span>
                      <span className="flex flex-col min-w-0 flex-1">
                        <span className="text-[13px] font-medium truncate text-fg">{comp.name}</span>
                        <span className="text-xs truncate text-fg-subtle">
                          {comp.inputs.length} in · {comp.outputs.length} out
                        </span>
                      </span>
                      <Plus
                        className="w-4 h-4 text-fg-subtle opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 shrink-0"
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {CATEGORIES.map(({ id: category, icon }) => {
          const items = filteredItems
            .filter((i) => i.category === category)
            .sort((a, b) => a.name.localeCompare(b.name));

          if (items.length === 0) return null;

          return (
            <section key={category}>
              <SectionHeader
                title={category}
                icon={icon}
                count={items.length}
                isOpen={isOpen(category)}
                onToggle={() => toggle(category)}
              />
              {isOpen(category) && (
                <ul className="pb-2">
                  {items.map(renderItem)}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <p className="px-4 py-2 border-t border-line text-xs text-fg-subtle shrink-0">Click to add · drag to place</p>
    </aside>
  );
};
