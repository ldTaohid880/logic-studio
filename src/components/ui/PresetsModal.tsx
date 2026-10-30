import React, { useState, useMemo, useId } from 'react';
import { ModalFrame } from './Dialog';
import { ModalHeader } from './ModalHeader';
import { Button } from './Button';
import { Input } from './Input';
import { useCircuitStore } from '../../store/useCircuitStore';
import { CircuitPreset } from '../../types/circuit';
import { FolderOpen, Pencil, Trash2, RefreshCw, RotateCcw, Search, Save } from 'lucide-react';
import { CIRCUIT_PRESETS } from '../../utils/presets';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormState = { mode: 'create' | 'edit'; preset?: CircuitPreset; name: string; category: string; description: string; updateCircuit: boolean };

const BUILT_IN_IDS = new Set(CIRCUIT_PRESETS.map((p) => p.id));

export const PresetsModal: React.FC<PresetsModalProps> = ({ isOpen, onClose }) => {
  const presets = useCircuitStore((s) => s.presets);
  const loadPreset = useCircuitStore((s) => s.loadPreset);
  const addPreset = useCircuitStore((s) => s.addPreset);
  const updatePreset = useCircuitStore((s) => s.updatePreset);
  const removePreset = useCircuitStore((s) => s.removePreset);
  const resetPresetsToDefault = useCircuitStore((s) => s.resetPresetsToDefault);
  const showToast = useCircuitStore((s) => s.showToast);
  const nodeCount = useCircuitStore((s) => s.nodes.length);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const titleId = useId();

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    presets.forEach((p) => counts.set(p.category, (counts.get(p.category) ?? 0) + 1));
    return [['All', presets.length] as const, ...Array.from(counts.entries())];
  }, [presets]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return presets.filter(
      (p) =>
        (category === 'All' || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    );
  }, [presets, category, query]);

  if (!isOpen) return null;

  const openPreset = (preset: CircuitPreset) => {
    loadPreset(preset.id);
    showToast(`Opened "${preset.name}". Ctrl+Z brings back your previous circuit.`);
    onClose();
  };

  const startCreate = () => {
    setFormError('');
    setForm({ mode: 'create', name: '', category: 'My circuits', description: '', updateCircuit: false });
  };

  const startEdit = (preset: CircuitPreset) => {
    setFormError('');
    setForm({ mode: 'edit', preset, name: preset.name, category: preset.category, description: preset.description, updateCircuit: false });
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.name.trim()) {
      setFormError('Give the circuit a name.');
      return;
    }
    if (form.mode === 'create') {
      if (nodeCount === 0) {
        setFormError('The canvas is empty. Build something first, then save it here.');
        return;
      }
      addPreset({ name: form.name, category: form.category || 'My circuits', description: form.description });
      showToast(`Saved "${form.name.trim()}"`);
    } else if (form.preset) {
      updatePreset(form.preset.id, {
        name: form.name,
        category: form.category || 'My circuits',
        description: form.description,
        updateCircuit: form.updateCircuit,
      });
      showToast(`Updated "${form.name.trim()}"`);
    }
    setForm(null);
  };

  return (
    <ModalFrame isOpen={isOpen} onClose={onClose} labelledBy={titleId} className="w-full max-w-3xl h-[min(640px,88vh)]">
      <ModalHeader
        titleId={titleId}
        icon={<FolderOpen className="w-5 h-5" />}
        title="Example circuits"
        description="Open a working circuit to explore it, or save your own to come back to."
        actions={
          <Button size="sm" variant="secondary" leftIcon={<Save className="w-4 h-4" />} onClick={startCreate}>
            Save current circuit
          </Button>
        }
        onClose={onClose}
      />

      <div className="flex-1 min-h-0 flex">
        {/* Categories */}
        <nav aria-label="Example categories" className="hidden sm:flex w-44 shrink-0 border-r border-line flex-col p-2 gap-0.5 overflow-y-auto">
          {categories.map(([name, count]) => (
            <button
              key={name}
              type="button"
              aria-current={category === name ? 'true' : undefined}
              onClick={() => setCategory(name)}
              className={`flex items-center justify-between h-8 px-2.5 rounded-lg text-[13px] text-left cursor-pointer ${
                category === name ? 'bg-accent-soft text-accent-fg font-medium' : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
              }`}
            >
              <span className="truncate">{name}</span>
              <span className="text-xs tabular-nums opacity-70">{count}</span>
            </button>
          ))}
          <div className="mt-auto pt-2">
            {confirmReset ? (
              <div className="p-2 rounded-lg bg-surface-2 text-xs text-fg-muted space-y-2">
                <p>Restore the built-in examples? Your saved circuits are removed.</p>
                <div className="flex gap-1.5">
                  <Button size="xs" variant="ghost" onClick={() => setConfirmReset(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="xs"
                    variant="danger"
                    onClick={() => {
                      resetPresetsToDefault();
                      setConfirmReset(false);
                      setCategory('All');
                      showToast('Built-in examples restored');
                    }}
                  >
                    Restore
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="w-full flex items-center gap-2 h-8 px-2.5 rounded-lg text-xs text-fg-subtle hover:text-fg hover:bg-surface-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore built-in examples
              </button>
            )}
          </div>
        </nav>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="p-3 border-b border-line">
            <Input
              placeholder="Search examples"
              aria-label="Search examples"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery('')}
              leftIcon={<Search className="w-3.5 h-3.5" />}
            />
          </div>

          {form && (
            <form onSubmit={submitForm} className="p-4 border-b border-line bg-surface-0/60 space-y-3" aria-label={form.mode === 'create' ? 'Save current circuit' : 'Edit example details'}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-[13px] text-fg-muted">
                  <span>Name</span>
                  <Input data-autofocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. 2-bit comparator" />
                </label>
                <label className="space-y-1 text-[13px] text-fg-muted">
                  <span>Category</span>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="My circuits" />
                </label>
              </div>
              <label className="block space-y-1 text-[13px] text-fg-muted">
                <span>Description</span>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What does this circuit show?"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-0 border border-line text-[13px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 resize-none"
                />
              </label>
              {form.mode === 'edit' && (
                <label className="flex items-center gap-2 text-[13px] text-fg-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.updateCircuit}
                    onChange={(e) => setForm({ ...form, updateCircuit: e.target.checked })}
                    className="w-4 h-4 accent-[var(--accent)]"
                  />
                  Also replace its circuit with what's on the canvas now ({nodeCount} parts)
                </label>
              )}
              {formError && (
                <p role="alert" className="text-[13px] text-rose-400">
                  {formError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setForm(null)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit">
                  {form.mode === 'create' ? 'Save circuit' : 'Save changes'}
                </Button>
              </div>
            </form>
          )}

          <ul className="flex-1 overflow-y-auto p-2" aria-label="Examples">
            {visible.length === 0 && (
              <li className="px-3 py-10 text-center text-[13px] text-fg-subtle">
                {query ? `No examples match "${query}".` : 'No examples in this category yet.'}
              </li>
            )}
            {visible.map((preset) => {
              const parts = preset.nodes.filter((n: { type?: string }) => n.type !== 'groupNode').length;
              const isBuiltIn = BUILT_IN_IDS.has(preset.id);
              return (
                <li key={preset.id} className="group relative rounded-lg hover:bg-surface-2 focus-within:bg-surface-2">
                  <button
                    type="button"
                    onClick={() => openPreset(preset)}
                    className="w-full text-left pl-3 pr-28 py-2.5 cursor-pointer rounded-lg"
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-fg">{preset.name}</span>
                      <span className="text-xs text-fg-subtle">{parts} parts</span>
                    </span>
                    <span className="block text-[13px] text-fg-muted line-clamp-2 mt-0.5">{preset.description}</span>
                    {category === 'All' && <span className="block text-xs text-fg-subtle mt-1">{preset.category}</span>}
                  </button>

                  <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                    {confirmDeleteId === preset.id ? (
                      <>
                        <Button size="xs" variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                          Keep
                        </Button>
                        <Button
                          size="xs"
                          variant="danger"
                          onClick={() => {
                            removePreset(preset.id);
                            setConfirmDeleteId(null);
                            showToast(`Deleted "${preset.name}"`);
                          }}
                        >
                          Delete
                        </Button>
                      </>
                    ) : (
                      <>
                        {!isBuiltIn && (
                          <button
                            type="button"
                            title="Replace with the circuit on the canvas"
                            aria-label={`Replace ${preset.name} with the circuit on the canvas`}
                            onClick={() => {
                              updatePreset(preset.id, { updateCircuit: true });
                              showToast(`Updated "${preset.name}" from the canvas`);
                            }}
                            className="p-1.5 rounded-md text-fg-subtle hover:text-fg hover:bg-surface-3 cursor-pointer"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          title="Edit name and description"
                          aria-label={`Edit ${preset.name}`}
                          onClick={() => startEdit(preset)}
                          className="p-1.5 rounded-md text-fg-subtle hover:text-fg hover:bg-surface-3 cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          aria-label={`Delete ${preset.name}`}
                          onClick={() => setConfirmDeleteId(preset.id)}
                          className="p-1.5 rounded-md text-fg-subtle hover:text-rose-400 hover:bg-surface-3 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </ModalFrame>
  );
};
