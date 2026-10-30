import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface SelectProps<T = string | number> {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Select<T extends string | number>({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select option...',
  searchable = false,
  disabled = false,
  className = '',
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const close = () => {
    setIsOpen(false);
    setSearch('');
    setActiveIndex(-1);
  };

  const choose = (opt: SelectOption<T>) => {
    onChange(opt.value);
    close();
  };

  // Keyboard: arrows open/move, Enter selects, Escape closes
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(Math.max(0, filteredOptions.findIndex((o) => o.value === value)));
        return;
      }
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((i) => (i + delta + filteredOptions.length) % Math.max(filteredOptions.length, 1));
    } else if (e.key === 'Enter' && isOpen && activeIndex >= 0 && filteredOptions[activeIndex]) {
      e.preventDefault();
      choose(filteredOptions[activeIndex]);
    }
  };

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} className={`w-full relative space-y-1 ${className}`}>
      {label && (
        <label className="block text-xs font-mono font-medium text-slate-400">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 hover:border-slate-600 focus:border-slate-500 disabled:opacity-40 transition-all cursor-pointer"
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div id={listboxId} role="listbox" className="absolute z-50 mt-1 w-full bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-xl shadow-2xl p-1.5 space-y-1 max-h-60 overflow-y-auto animate-fadeIn">
          {searchable && (
            <div className="relative mb-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:border-emerald-500"
              />
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div className="p-2 text-xs font-mono text-slate-500 text-center">No options found</div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => choose(opt)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors text-left ${
                    idx === activeIndex && !isSelected ? 'ring-1 ring-accent ' : ''
                  }${
                    isSelected
                      ? 'bg-slate-800 text-slate-100 font-bold border border-slate-700/60'
                      : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon}
                    <div>
                      <div>{opt.label}</div>
                      {opt.description && (
                        <div className="text-[11px] text-slate-400 font-sans">{opt.description}</div>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
