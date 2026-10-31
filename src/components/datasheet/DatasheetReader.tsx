import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ExternalLink, Link2, Plus, Printer, Search } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useCircuitStore } from '../../store/useCircuitStore';
import { ModalFrame } from '../ui/Dialog';
import { ModalHeader } from '../ui/ModalHeader';
import { Button } from '../ui/Button';
import { PARTS, PART_CATEGORIES, getComponentInfo } from '../../data/components';
import { FAMILY_NOTE, buildFunctionTable, familySpecs, findPin, getDatasheet, Datasheet } from '../../data/datasheets';
import { nextPlacementPosition } from '../../utils/canvasBridge';
import { DipPinout, isDip } from './DipPinout';
import { PinName, PinTable } from './PinTable';
import { SpecTable, TimingTable } from './SpecTable';
import { FunctionTable, ModeTableView } from './FunctionTable';
import { GateType } from '../../types/circuit';

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'pinout', label: 'Pinout' },
  { id: 'function', label: 'Function table' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'timing', label: 'Timing' },
  { id: 'using', label: 'Using it' },
  { id: 'studio', label: 'In Logic Studio' },
] as const;
type SectionId = (typeof SECTIONS)[number]['id'];

const TIMING_GLOSSARY: Record<string, string> = {
  tpd: 'Propagation delay: time from an input change to the output change.',
  tt: 'Transition time: how long the output takes to swing between low and high.',
  fmax: 'Maximum clock frequency the chip is guaranteed to count or shift at.',
  tsu: 'Setup time: how long data must be stable before the clock edge.',
  th: 'Hold time: how long data must stay stable after the clock edge.',
  tw: 'Pulse width: shortest clock or enable pulse the chip accepts.',
};
const ELECTRICAL_GLOSSARY: [string, string][] = [
  ['VIH / VIL', 'The lowest voltage an input still reads as 1, and the highest it still reads as 0. Between them the input is undefined.'],
  ['VOH / VOL', 'The voltage an output actually reaches for 1 and for 0.'],
  ['IOH / IOL', 'How much current an output can supply (high) or absorb (low) while holding its level.'],
];

const Heading: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <h3 id={`${id}-title`} className="text-base font-semibold text-fg mb-3">
    {children}
  </h3>
);

const Callout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div role="note" className="mt-4 rounded-lg border border-line bg-surface-2 px-4 py-3 text-[13px] text-fg-muted">
    <p className="font-semibold text-fg mb-1">{title}</p>
    {children}
  </div>
);

const Bullets: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="list-disc pl-5 space-y-1.5 text-[13px] text-fg-muted marker:text-fg-subtle">
    {items.map((t) => (
      <li key={t}>{t}</li>
    ))}
  </ul>
);

/** Name of the first timing row for tpd, shown in the quick facts. */
const typicalDelay = (sheet: Datasheet) => {
  const row = sheet.timing?.find((t) => t.symbol.startsWith('tpd'));
  return row ? `${row.typ} ${row.unit}` : undefined;
};

const QuickFacts: React.FC<{ sheet: Datasheet }> = ({ sheet }) => {
  const pkg = sheet.package;
  const vcc = pkg?.pins.filter((p) => p.name.startsWith('VCC') || p.name.startsWith('VDD')).map((p) => p.n);
  const gnd = pkg?.pins.filter((p) => p.name.startsWith('GND') || p.name.startsWith('VSS')).map((p) => p.n);
  const facts: [string, string | undefined][] = [
    ['Part number', sheet.partNumber],
    ['Package', pkg ? (isDip(pkg.kind) ? pkg.kind : 'Module with pin header') : undefined],
    ['VCC pin', vcc && vcc.length > 0 && isDip(pkg!.kind) ? vcc.join(', ') : undefined],
    ['GND pin', gnd && gnd.length > 0 && isDip(pkg!.kind) ? gnd.join(', ') : undefined],
    ['Per package', sheet.gatesPerPackage ? `${sheet.gatesPerPackage} in one chip` : undefined],
    ['Logic family', sheet.logicFamily ? '74HC CMOS' : undefined],
    ['Supply', sheet.logicFamily ? '2 V to 6 V' : undefined],
    ['Typical delay', typicalDelay(sheet)],
  ];
  const shown = facts.filter((f): f is [string, string] => !!f[1]);
  if (shown.length === 0) return null;
  return (
    <section aria-label="Quick facts" className="rounded-xl border border-line bg-surface-0/60 p-4">
      <h3 className="text-xs font-medium text-fg-subtle mb-2">Quick facts</h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
        {shown.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="text-fg-muted">{k}</dt>
            <dd className="text-right font-mono tabular-nums text-fg">{v}</dd>
          </React.Fragment>
        ))}
      </dl>
    </section>
  );
};

const DatasheetReader: React.FC = () => {
  const { type, openDatasheet, closeDatasheet, addNode, showToast } = useCircuitStore(
    useShallow((s) => ({ type: s.datasheetType, openDatasheet: s.openDatasheet, closeDatasheet: s.closeDatasheet, addNode: s.addNode, showToast: s.showToast }))
  );
  if (!type) return null;
  return (
    <Reader type={type} onOpen={openDatasheet} onClose={closeDatasheet} onAdd={(t) => { addNode(t, nextPlacementPosition()); showToast(`Added ${getComponentInfo(t).name} to the canvas`); }} showToast={showToast} />
  );
};

interface ReaderProps {
  type: GateType;
  onOpen: (t: GateType) => void;
  onClose: () => void;
  onAdd: (t: GateType) => void;
  showToast: (message: string) => void;
}

const Reader: React.FC<ReaderProps> = ({ type, onOpen, onClose, onAdd, showToast }) => {
  const sheet = useMemo(() => getDatasheet(type), [type]);
  const fnTable = useMemo(() => buildFunctionTable(type), [type]);
  const info = getComponentInfo(type);
  const canPlace = PARTS.some((p) => p.type === type);

  const [query, setQuery] = useState('');
  const [activePin, setActivePin] = useState<number | null>(null);
  const [section, setSection] = useState<SectionId>('overview');
  const scrollRef = useRef<HTMLDivElement>(null);
  const programmatic = useRef(false);

  // Printing shows only the sheet: the stylesheet hides the app behind it while this class is set
  useEffect(() => {
    document.body.classList.add('ls-printing-datasheet');
    return () => document.body.classList.remove('ls-printing-datasheet');
  }, []);

  // A new part starts at the top
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setActivePin(null);
    setSection('overview');
  }, [type]);

  const studioPins = useMemo(() => {
    const names = new Map<number, string[]>();
    const nameById = new Map((sheet.logicStudioPins ?? []).map((p) => [p.id, p.name]));
    for (const m of sheet.mapping ?? []) {
      const pin = sheet.package ? findPin(sheet.package.pins, m.real) : undefined;
      const studio = nameById.get(m.pin);
      if (!pin || !studio) continue;
      names.set(pin.n, [...(names.get(pin.n) ?? []), studio]);
    }
    return names;
  }, [sheet]);
  const usedPins = useMemo(() => new Set(studioPins.keys()), [studioPins]);

  const available = useMemo(() => {
    const ids = new Set<SectionId>(['overview', 'studio']);
    if (sheet.package) ids.add('pinout');
    if (fnTable || sheet.modeTable) ids.add('function');
    if (sheet.logicFamily || sheet.electrical) ids.add('electrical');
    if (sheet.timing && sheet.timing.length > 0) ids.add('timing');
    if (sheet.applications.length > 0 || sheet.pitfalls.length > 0) ids.add('using');
    return SECTIONS.filter((s) => ids.has(s.id));
  }, [sheet, fnTable]);

  // Scroll-spy: the current section is the last one whose top has passed the top of the reading area
  const onScroll = useCallback(() => {
    if (programmatic.current) return;
    const box = scrollRef.current;
    if (!box) return;
    const top = box.getBoundingClientRect().top + 72;
    let current: SectionId = 'overview';
    for (const s of available) {
      const el = box.querySelector<HTMLElement>(`[data-section="${s.id}"]`);
      if (el && el.getBoundingClientRect().top <= top) current = s.id;
    }
    if (box.scrollTop + box.clientHeight >= box.scrollHeight - 4) current = available[available.length - 1].id;
    setSection(current);
  }, [available]);

  const goTo = (id: SectionId) => {
    const box = scrollRef.current;
    const el = box?.querySelector<HTMLElement>(`[data-section="${id}"]`);
    if (!box || !el) return;
    setSection(id);
    programmatic.current = true;
    const y = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 56;
    box.scrollTo({ top: Math.max(0, y), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    window.setTimeout(() => { programmatic.current = false; }, 500);
  };

  const copyLink = async () => {
    const link = `${window.location.origin}${window.location.pathname}#datasheet=${type}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast('Datasheet link copied');
    } catch {
      showToast('Failed to copy the link');
    }
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PARTS.filter((p) => !q || [p.name, p.type, p.partNumber ?? '', p.description].some((t) => t.toLowerCase().includes(q)));
  }, [query]);

  const showStudioPinTable = (sheet.logicStudioPins?.length ?? 0) > 0;
  const mappingByPin = new Map((sheet.mapping ?? []).map((m) => [m.pin, m]));
  const pinoutNote = sheet.package && !isDip(sheet.package.kind);

  return (
    <ModalFrame
      isOpen
      onClose={onClose}
      labelledBy="datasheet-title"
      className="w-[96vw] h-[92vh] max-w-[1400px] print:w-full print:h-auto print:max-w-none print:max-h-none print:overflow-visible print:border-0 print:shadow-none print:rounded-none"
    >
      <ModalHeader
        titleId="datasheet-title"
        title={sheet.title}
        description={`${sheet.partNumber ? `${sheet.partNumber} · ` : ''}${PART_CATEGORIES.find((c) => c.id === info.category)?.title ?? info.category}`}
        icon={<BookOpen className="w-4 h-4" />}
        onClose={onClose}
        actions={
          <>
            {canPlace && (
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => onAdd(type)} title="Add this part to the canvas">
                <span className="hidden sm:inline">Add to canvas</span>
                <span className="sm:hidden sr-only">Add to canvas</span>
              </Button>
            )}
            <Button variant="secondary" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={() => window.print()} title="Print or save as PDF">
              <span className="hidden md:inline">Print or PDF</span>
              <span className="md:hidden sr-only">Print or save as PDF</span>
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<Link2 className="w-4 h-4" />} onClick={copyLink} title="Copy a link to this datasheet">
              <span className="hidden md:inline">Copy link</span>
              <span className="md:hidden sr-only">Copy link</span>
            </Button>
            {sheet.vendorUrl && (
              <a
                href={sheet.vendorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium rounded-lg bg-surface-2 hover:bg-surface-3 text-fg border border-line"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden lg:inline">Manufacturer page</span>
                <span className="lg:hidden sr-only">Manufacturer page (opens in a new tab)</span>
              </a>
            )}
          </>
        }
      />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Index of all parts */}
        <nav aria-label="All datasheets" className="print:hidden shrink-0 lg:w-64 border-b lg:border-b-0 lg:border-r border-line bg-surface-0/40 flex flex-col min-h-0">
          <div className="p-3 border-b border-line">
            <label className="relative block">
              <span className="sr-only">Search parts</span>
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search parts"
                className="w-full h-8 pl-8 pr-2 rounded-lg bg-surface-1 border border-line text-[13px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
              />
            </label>
            {/* Narrow screens: a plain select instead of the list */}
            <label className="lg:hidden block mt-2">
              <span className="sr-only">Choose a part</span>
              <select
                value={type}
                onChange={(e) => onOpen(e.target.value as GateType)}
                className="w-full h-8 px-2 rounded-lg bg-surface-1 border border-line text-[13px] text-fg focus:border-accent focus:outline-none"
              >
                {PART_CATEGORIES.map((c) => {
                  const parts = results.filter((p) => p.category === c.id);
                  return parts.length === 0 ? null : (
                    <optgroup key={c.id} label={c.title}>
                      {parts.map((p) => (
                        <option key={p.type} value={p.type}>
                          {p.name}{p.partNumber ? ` (${p.partNumber})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </label>
          </div>
          <div className="hidden lg:block flex-1 overflow-y-auto p-2">
            {results.length === 0 && <p className="px-2 py-4 text-[13px] text-fg-subtle">No part matches “{query}”.</p>}
            {PART_CATEGORIES.map((c) => {
              const parts = results.filter((p) => p.category === c.id);
              if (parts.length === 0) return null;
              return (
                <div key={c.id} className="mb-3">
                  <h2 className="px-2 pb-1 text-xs font-medium text-fg-subtle">{c.title}</h2>
                  <ul>
                    {parts.map((p) => (
                      <li key={p.type}>
                        <button
                          type="button"
                          onClick={() => onOpen(p.type)}
                          aria-current={p.type === type ? 'page' : undefined}
                          className={`w-full flex items-baseline gap-2 px-2 py-1.5 rounded-md text-left text-[13px] cursor-pointer ${
                            p.type === type ? 'bg-accent-soft text-accent-fg font-medium' : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
                          }`}
                        >
                          <span className="flex-1 min-w-0 truncate">{p.name}</span>
                          {p.partNumber && <span className="font-mono text-[11px] text-fg-subtle shrink-0">{p.partNumber}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </nav>

        {/* The sheet */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          <nav aria-label="Sections" className="print:hidden shrink-0 border-b border-line bg-surface-1 px-3 flex gap-1 overflow-x-auto">
            {available.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(s.id)}
                aria-current={section === s.id ? 'true' : undefined}
                className={`h-10 px-3 text-[13px] whitespace-nowrap border-b-2 cursor-pointer ${
                  section === s.id ? 'border-accent text-fg font-medium' : 'border-transparent text-fg-muted hover:text-fg'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div ref={scrollRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto print:overflow-visible px-4 sm:px-6 py-5">
            <h1 className="hidden print:block text-2xl font-semibold mb-1">{sheet.title}</h1>
            <p className="hidden print:block text-sm mb-4">{sheet.partNumber ?? info.name} · Logic Studio datasheet</p>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] items-start">
              {/* Drawing and quick facts: above the text on narrow screens, beside it on wide ones */}
              <aside aria-label="Package and quick facts" className="space-y-4 xl:order-last xl:sticky xl:top-0">
                {sheet.package && isDip(sheet.package.kind) && (
                  <DipPinout pkg={sheet.package} label={sheet.partNumber ?? sheet.title} usedPins={usedPins} activePin={activePin} onActivePin={setActivePin} />
                )}
                <QuickFacts sheet={sheet} />
              </aside>

              <div className="min-w-0 space-y-10">
                <section data-section="overview" aria-labelledby="overview-title">
                  <Heading id="overview">Overview</Heading>
                  <p className="text-[15px] leading-relaxed text-fg">{sheet.summary}</p>
                  <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-fg-muted max-w-prose">
                    {sheet.howItWorks.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                  {sheet.noStandardChip && (
                    <Callout title="No single standard chip">
                      <p>
                        This part has no one-to-one real chip.
                        {sheet.noStandardChip.nearest.length > 0 && ' The nearest real parts to look at are:'}
                      </p>
                      {sheet.noStandardChip.nearest.length > 0 && (
                        <ul className="list-disc pl-5 mt-1 space-y-0.5">
                          {sheet.noStandardChip.nearest.map((n) => (
                            <li key={n}>{n}</li>
                          ))}
                        </ul>
                      )}
                      {sheet.noStandardChip.note && <p className="mt-1">{sheet.noStandardChip.note}</p>}
                    </Callout>
                  )}
                </section>

                {sheet.package && (
                  <section data-section="pinout" aria-labelledby="pinout-title">
                    <Heading id="pinout">Pinout</Heading>
                    <p className="text-[13px] text-fg-muted mb-3 max-w-prose">
                      {pinoutNote
                        ? 'The pins of the real module, in the order they appear on its header.'
                        : 'Pins are numbered counter-clockwise from the notch. Hover or focus a pin, in the drawing or in this table, to find it in the other.'}
                      {(sheet.gatesPerPackage ?? 0) > 1 && ' The Logic Studio part is one of the gates in the package, so the table lists all of them; the pins it uses are marked.'}
                    </p>
                    <PinTable pins={sheet.package.pins} studioPins={studioPins} activePin={activePin} onActivePin={setActivePin} />
                  </section>
                )}

                {(fnTable || sheet.modeTable) && (
                  <section data-section="function" aria-labelledby="function-title">
                    <Heading id="function">Function table</Heading>
                    <p className="text-[13px] text-fg-muted mb-3 max-w-prose">
                      {sheet.modeTable
                        ? 'This part remembers, so its outputs depend on what happened before. The table lists what each input pattern does.'
                        : 'What the outputs do for each input pattern. The table is made by running the simulation, so it matches the part on the canvas.'}
                    </p>
                    {sheet.modeTable ? (
                      <>
                        <ModeTableView table={sheet.modeTable} caption={`${sheet.title} mode table`} />
                        {sheet.modeTable.notes && (
                          <ul className="mt-2 space-y-1 text-xs text-fg-subtle">
                            {sheet.modeTable.notes.map((n) => (
                              <li key={n}>{n}</li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      fnTable && (
                        <>
                          <FunctionTable data={fnTable} caption={`${sheet.title} function table`} />
                          {fnTable.condensed && <p className="mt-2 text-xs text-fg-subtle">Example rows only, because the part has too many inputs for a full table.</p>}
                          {fnTable.note && <p className="mt-1 text-xs text-fg-subtle">{fnTable.note}</p>}
                        </>
                      )
                    )}
                  </section>
                )}

                {(sheet.logicFamily || sheet.electrical) && (
                  <section data-section="electrical" aria-labelledby="electrical-title">
                    <Heading id="electrical">Electrical characteristics</Heading>
                    <p className="text-[13px] text-fg-muted mb-3 max-w-prose">
                      {sheet.logicFamily ? FAMILY_NOTE : 'Typical figures for this kind of part. Real parts vary, so check the datasheet of the one you buy.'}
                    </p>
                    {sheet.logicFamily && (
                      <SpecTable caption="74HC family characteristics" rows={familySpecs({ iccUa: sheet.supplyCurrentUa, driveMa: sheet.busDrive ? 6 : 4 })} />
                    )}
                    {sheet.electrical && (
                      <div className={sheet.logicFamily ? 'mt-4' : ''}>
                        {sheet.logicFamily && <h4 className="text-[13px] font-semibold text-fg mb-2">This part</h4>}
                        <SpecTable caption="Electrical figures of this part" rows={sheet.electrical} />
                      </div>
                    )}
                    {sheet.logicFamily && (
                      <dl className="mt-3 space-y-1 text-xs text-fg-subtle max-w-prose">
                        {ELECTRICAL_GLOSSARY.map(([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <dt className="font-mono text-fg-muted shrink-0">{k}</dt>
                            <dd>{v}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </section>
                )}

                {sheet.timing && sheet.timing.length > 0 && (
                  <section data-section="timing" aria-labelledby="timing-title">
                    <Heading id="timing">Timing</Heading>
                    <p className="text-[13px] text-fg-muted mb-3 max-w-prose">
                      Approximate typical figures at VCC = 4.5 V and 25 °C. Worst-case limits are larger at low supply voltage and high temperature, so check the manufacturer datasheet before you rely on them.
                    </p>
                    <TimingTable rows={sheet.timing} />
                    <dl className="mt-3 space-y-1 text-xs text-fg-subtle max-w-prose">
                      {Object.entries(TIMING_GLOSSARY)
                        .filter(([k]) => sheet.timing!.some((t) => t.symbol.startsWith(k)))
                        .map(([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <dt className="font-mono text-fg-muted shrink-0 w-10">{k}</dt>
                            <dd>{v}</dd>
                          </div>
                        ))}
                    </dl>
                  </section>
                )}

                {(sheet.applications.length > 0 || sheet.pitfalls.length > 0) && (
                  <section data-section="using" aria-labelledby="using-title">
                    <Heading id="using">Using it</Heading>
                    <div className="grid gap-6 md:grid-cols-2">
                      {sheet.applications.length > 0 && (
                        <div>
                          <h4 className="text-[13px] font-semibold text-fg mb-2">What it is used for</h4>
                          <Bullets items={sheet.applications} />
                        </div>
                      )}
                      {sheet.pitfalls.length > 0 && (
                        <div>
                          <h4 className="text-[13px] font-semibold text-fg mb-2">Watch out for</h4>
                          <Bullets items={sheet.pitfalls} />
                        </div>
                      )}
                    </div>
                  </section>
                )}

                <section data-section="studio" aria-labelledby="studio-title">
                  <Heading id="studio">In Logic Studio</Heading>
                  {showStudioPinTable && (
                    <div className="overflow-x-auto rounded-lg border border-line mb-4">
                      <table className="w-full text-[13px] border-separate border-spacing-0">
                        <caption className="sr-only">Pins of the part on the canvas</caption>
                        <thead className="text-xs text-fg-subtle text-left">
                          <tr>
                            <th scope="col" className="py-2 px-3 font-medium border-b border-line">Pin on the canvas</th>
                            <th scope="col" className="py-2 px-3 font-medium border-b border-line">Direction</th>
                            {sheet.mapping && <th scope="col" className="py-2 px-3 font-medium border-b border-line">Real pin</th>}
                            {sheet.mapping && <th scope="col" className="py-2 px-3 font-medium border-b border-line">Remark</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {sheet.logicStudioPins!.map((p) => {
                            const m = mappingByPin.get(p.id);
                            const real = m && sheet.package ? findPin(sheet.package.pins, m.real) : undefined;
                            return (
                              <tr
                                key={p.id}
                                className={`even:bg-surface-0/50 ${real && activePin === real.n ? 'bg-accent-soft' : ''}`}
                                onMouseEnter={() => real && setActivePin(real.n)}
                                onMouseLeave={() => setActivePin(null)}
                              >
                                <td className="py-1.5 px-3 border-b border-line font-mono font-semibold text-fg">{p.name}</td>
                                <td className="py-1.5 px-3 border-b border-line text-fg-muted">{p.dir === 'in' ? 'Input' : 'Output'}</td>
                                {sheet.mapping && (
                                  <td className="py-1.5 px-3 border-b border-line font-mono text-fg-muted whitespace-nowrap">
                                    {real ? (
                                      <>
                                        <PinName pin={real} /> <span className="text-fg-subtle">(pin {real.n})</span>
                                      </>
                                    ) : (
                                      <span className="text-fg-subtle">–</span>
                                    )}
                                  </td>
                                )}
                                {sheet.mapping && <td className="py-1.5 px-3 border-b border-line text-xs text-fg-subtle">{m?.note}</td>}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <h4 className="text-[13px] font-semibold text-fg mb-2">How the simulation differs from the real part</h4>
                  <Bullets items={sheet.simNotes} />
                  {sheet.related.length > 0 && (
                    <div className="mt-5 print:hidden">
                      <h4 className="text-[13px] font-semibold text-fg mb-2">See also</h4>
                      <div className="flex flex-wrap gap-2">
                        {sheet.related.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => onOpen(r)}
                            className="h-7 px-2.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs text-fg cursor-pointer"
                          >
                            {getComponentInfo(r).name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                <p className="text-xs text-fg-subtle border-t border-line pt-4 max-w-prose">
                  {sheet.generated
                    ? 'This sheet is made from the part catalog. '
                    : ''}
                  Figures here are for learning and orientation. Check the manufacturer datasheet before you build or buy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalFrame>
  );
};

export default DatasheetReader;
