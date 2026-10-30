import React, { useState, useRef, useId } from 'react';
import { ModalFrame } from '../ui/Dialog';
import { ModalHeader } from '../ui/ModalHeader';
import { useCircuitStore } from '../../store/useCircuitStore';
import { useShallow } from 'zustand/react/shallow';
import { CustomComponentDefinition } from '../../types/customComponent';
import {
  X,
  Search,
  Plus,
  Layers,
  Star,
  Download,
  Upload,
  Trash2,
  ExternalLink,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface CustomComponentLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWizard: () => void;
}

export const CustomComponentLibraryModal: React.FC<CustomComponentLibraryModalProps> = ({
  isOpen,
  onClose,
  onOpenWizard,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const {
    customComponents,
    deleteCustomComponent,
    toggleFavoriteCustomComponent,
    instantiateCustomComponent,
    enterSubcircuitView,
    importCustomComponentJSON,
    exportCustomComponentJSON,
    showToast,
  } = useCircuitStore(useShallow((s) => ({ customComponents: s.customComponents, deleteCustomComponent: s.deleteCustomComponent, toggleFavoriteCustomComponent: s.toggleFavoriteCustomComponent, instantiateCustomComponent: s.instantiateCustomComponent, enterSubcircuitView: s.enterSubcircuitView, importCustomComponentJSON: s.importCustomComponentJSON, exportCustomComponentJSON: s.exportCustomComponentJSON, showToast: s.showToast })));

  if (!isOpen) return null;

  const componentList = Object.values(customComponents);

  // Extract unique categories
  const categories = Array.from(new Set(componentList.map((c) => c.category || 'Custom Components')));

  // Filter & sort
  const filtered = componentList.filter((comp) => {
    const matchesSearch =
      comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comp.description && comp.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      comp.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || comp.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  filtered.sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;

    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  const handleExport = (comp: CustomComponentDefinition) => {
    const jsonStr = exportCustomComponentJSON(comp.id);
    if (!jsonStr) return;

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${comp.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.subcircuit.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported "${comp.name}" component JSON`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importCustomComponentJSON(content);
      if (success) {
        showToast('Subcircuit component imported successfully!');
      } else {
        showToast('Failed to import subcircuit component');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      className="w-full max-w-4xl h-[80vh]"
    >
        <ModalHeader
          titleId={titleId}
          icon={<Layers className="w-5 h-5" />}
          title="My components"
          description="Subcircuits you built. Place them like any other part, or open one to edit its inside."
          onClose={onClose}
          actions={
            <>
              <Button variant="ghost" size="sm" leftIcon={<Upload className="w-4 h-4" />} onClick={() => fileInputRef.current?.click()}>
                <span className="hidden sm:inline">Import</span>
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" />
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  onClose();
                  onOpenWizard();
                }}
              >
                <span className="hidden sm:inline">New component</span>
              </Button>
            </>
          }
        />

        {/* Search & Category Filter Toolbar */}
        <div className="p-4 bg-surface-0/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search components by name or category..."
              className="pl-9 bg-slate-900 border-slate-800 text-xs w-full"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-emerald-500 text-on-accent font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All ({componentList.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-on-accent font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Component Grid View */}
        <div className="p-6 overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
              <Layers className="w-12 h-12 stroke-1 text-slate-600" />
              <p className="text-sm font-mono">No custom components found</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Select nodes on the canvas and right-click "Create Custom Component" to build your first reusable subcircuit block.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((comp) => (
                <div
                  key={comp.id}
                  className="group relative rounded-2xl bg-surface-1 border border-slate-800 hover:border-emerald-500/50 p-4 transition-all duration-200 hover:shadow-xl flex flex-col justify-between"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md"
                          style={{ backgroundColor: comp.color || '#10b981' }}
                        >
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold font-mono tracking-tight truncate text-slate-100">
                            {comp.name}
                          </h3>
                          <span className="text-[11px] font-mono text-slate-400">
                            {comp.category}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleFavoriteCustomComponent(comp.id)}
                        className={`p-1 rounded-lg transition-colors ${
                          comp.isFavorite ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    {comp.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {comp.description}
                      </p>
                    )}

                    {/* Pin Summary Badge */}
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mb-4 bg-slate-900/60 p-2 rounded-xl border border-slate-850">
                      <span className="text-cyan-400 font-bold">{comp.inputs.length} Inputs</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">{comp.outputs.length} Outputs</span>
                      <span>•</span>
                      <span>{comp.nodes?.length || 0} Internal Gates</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between border-t border-slate-850 pt-3 gap-2">
                    <Button
                      variant="success"
                      size="xs"
                      onClick={() => {
                        instantiateCustomComponent(comp.id, { x: 200, y: 200 });
                        showToast(`Added ${comp.name} to canvas`);
                        onClose();
                      }}
                    >
                      + Add to Canvas
                    </Button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onClose();
                          enterSubcircuitView(comp.id);
                        }}
                        title="Edit Internal Schematic"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                        aria-label="Edit Internal Schematic"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleExport(comp)}
                        title="Export JSON"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                        aria-label="Export JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setPendingDelete({ id: comp.id, name: comp.name })}
                        aria-label={`Delete ${comp.name}`}
                        title="Delete Subcircuit"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Delete component?"
        message={
          <>
            <strong className="text-fg">{pendingDelete?.name}</strong> will be removed from your library. Parts already
            placed on a canvas must be deleted first.
          </>
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            deleteCustomComponent(pendingDelete.id);
            if (!useCircuitStore.getState().customComponents[pendingDelete.id]) {
              showToast(`Deleted "${pendingDelete.name}"`);
            }
          }
          setPendingDelete(null);
        }}
      />
    </ModalFrame>
  );
};
