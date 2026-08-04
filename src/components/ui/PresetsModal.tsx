import React, { useState, useMemo } from 'react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { CircuitPreset } from '../../types/circuit';
import {
  X,
  Boxes,
  Cpu,
  Play,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  RotateCcw,
  Search,
  FolderPlus,
  Save,
} from 'lucide-react';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({ isOpen, onClose }) => {
  const presets = useCircuitStore((state) => state.presets);
  const loadPreset = useCircuitStore((state) => state.loadPreset);
  const addPreset = useCircuitStore((state) => state.addPreset);
  const updatePreset = useCircuitStore((state) => state.updatePreset);
  const removePreset = useCircuitStore((state) => state.removePreset);
  const resetPresetsToDefault = useCircuitStore((state) => state.resetPresetsToDefault);

  const nodes = useCircuitStore((state) => state.nodes);
  const edges = useCircuitStore((state) => state.edges);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [editingPreset, setEditingPreset] = useState<CircuitPreset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUpdateCircuit, setFormUpdateCircuit] = useState(false);
  const [formError, setFormError] = useState('');

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(presets.map((p) => p.category)));
    return ['All', ...cats];
  }, [presets]);

  // Filtered presets
  const filteredPresets = useMemo(() => {
    return presets.filter((preset) => {
      const matchesCategory = selectedCategory === 'All' || preset.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        preset.name.toLowerCase().includes(q) ||
        preset.category.toLowerCase().includes(q) ||
        preset.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [presets, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleSelectPreset = (id: string) => {
    loadPreset(id);
    onClose();
  };

  const handleOpenCreateForm = () => {
    setFormName(`My Preset ${presets.length + 1}`);
    setFormCategory('Custom');
    setFormDescription('Saved circuit configuration.');
    setFormError('');
    setIsCreating(true);
    setEditingPreset(null);
  };

  const handleOpenEditForm = (preset: CircuitPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPreset(preset);
    setFormName(preset.name);
    setFormCategory(preset.category);
    setFormDescription(preset.description);
    setFormUpdateCircuit(false);
    setFormError('');
    setIsCreating(false);
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Preset name is required.');
      return;
    }
    if (nodes.length === 0) {
      setFormError('Cannot save empty canvas as preset. Please add circuit nodes first.');
      return;
    }

    addPreset({
      name: formName,
      category: formCategory || 'Custom',
      description: formDescription,
    });

    setIsCreating(false);
    setFormError('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPreset) return;
    if (!formName.trim()) {
      setFormError('Preset name is required.');
      return;
    }

    updatePreset(editingPreset.id, {
      name: formName,
      category: formCategory || 'Custom',
      description: formDescription,
      updateCircuit: formUpdateCircuit,
    });

    setEditingPreset(null);
    setFormError('');
  };

  const handleQuickUpdateCircuit = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updatePreset(presetId, { updateCircuit: true });
  };

  const handleConfirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removePreset(id);
    setDeletingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100 font-mono tracking-wide uppercase">
              Circuit Presets Library
            </h2>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80">
              {presets.length} Presets
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && !editingPreset && (
              <>
                <button
                  type="button"
                  onClick={handleOpenCreateForm}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Current Circuit</span>
                </button>

                <button
                  type="button"
                  onClick={resetPresetsToDefault}
                  title="Reset Presets Library to Defaults"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        {isCreating || editingPreset ? (
          /* Create / Edit Form View */
          <form
            onSubmit={isCreating ? handleSaveCreate : handleSaveEdit}
            className="p-5 space-y-4 overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold font-mono text-cyan-300 flex items-center gap-2 uppercase">
                {isCreating ? (
                  <>
                    <FolderPlus className="w-4 h-4 text-emerald-400" />
                    Save Current Canvas as Preset
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4 text-cyan-400" />
                    Edit Preset Details
                  </>
                )}
              </h3>

              <span className="text-xs font-mono text-slate-400">
                Current Canvas: {nodes.length} Nodes, {edges.length} Wires
              </span>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                  Preset Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. 4-Bit Synchronous Counter"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="e.g. Sequential Logic, Custom, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe what this circuit does..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-sans focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              />
            </div>

            {editingPreset && (
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formUpdateCircuit}
                  onChange={(e) => setFormUpdateCircuit(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-mono font-bold text-slate-200">
                    Overwrite circuit with current canvas layout
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">
                    Replaces saved nodes & wires with the current {nodes.length} nodes & {edges.length} wires on screen.
                  </span>
                </div>
              </label>
            )}

            {/* Form Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingPreset(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isCreating ? 'Save Preset' : 'Update Preset'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Presets List View */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search and Category Filter Bar */}
            <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search presets by name or description..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 font-sans focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap border transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets Grid */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {filteredPresets.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Cpu className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-mono text-slate-400">No presets match your search.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                filteredPresets.map((preset) => {
                  const isDeletingThis = deletingId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      className="group p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/60 hover:bg-slate-950 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                          <Cpu className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 font-mono truncate">
                              {preset.name}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800">
                              {preset.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {preset.description}
                          </p>
                          <span className="text-[10px] font-mono text-slate-500 mt-2">
                            Contains {preset.nodes.length} nodes and {preset.edges.length} wires
                          </span>
                        </div>
                      </div>

                      {/* Card Action Toolbar */}
                      <div className="flex items-center gap-1.5 shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                        {isDeletingThis ? (
                          <div className="flex items-center gap-1 bg-rose-950/90 border border-rose-800 p-1 rounded-xl">
                            <span className="text-[10px] font-mono text-rose-300 px-1">Delete?</span>
                            <button
                              type="button"
                              onClick={(e) => handleConfirmDelete(preset.id, e)}
                              className="px-2 py-1 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId(null);
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Update Circuit with current layout */}
                            <button
                              type="button"
                              onClick={(e) => handleQuickUpdateCircuit(preset.id, e)}
                              title="Overwrite circuit layout with current canvas"
                              className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>

                            {/* Edit Preset Metadata */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditForm(preset, e)}
                              title="Edit Preset Name & Details"
                              className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* Delete Preset */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId(preset.id);
                              }}
                              title="Delete Preset"
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-800 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Load Preset */}
                            <button
                              type="button"
                              onClick={() => handleSelectPreset(preset.id)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-400 group-hover:bg-emerald-300 shadow-md transition-all cursor-pointer ml-1"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Load</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
