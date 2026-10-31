import React, { useState } from 'react';
import { Copy, FolderOpen, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { ConfirmDialog } from './ConfirmDialog';
import { useCircuitStore } from '../../store/useCircuitStore';
import { ProjectMeta } from '../../store/projectStorage';

export function editedAgo(time: number, now = Date.now()): string {
  const minutes = Math.round((now - time) / 60000);
  if (minutes < 1) return 'Edited just now';
  if (minutes < 60) return `Edited ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Edited ${hours} h ago`;
  return `Edited ${new Date(time).toLocaleDateString()}`;
}

/** Saved projects: each keeps its own circuit and autosaves while open. */
export const ProjectsDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { projects, currentProjectId, newProject, openProject, renameProject, duplicateProject, deleteProject } = useCircuitStore(
    useShallow((s) => ({
      projects: s.projects,
      currentProjectId: s.currentProjectId,
      newProject: s.newProject,
      openProject: s.openProject,
      renameProject: s.renameProject,
      duplicateProject: s.duplicateProject,
      deleteProject: s.deleteProject,
    }))
  );
  const [renaming, setRenaming] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ProjectMeta | null>(null);
  const sorted = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title="Projects"
        description="Each project keeps its own circuit and saves itself as you work, in this browser."
        icon={<FolderOpen className="w-4 h-4" />}
        maxWidth="lg"
        footer={
          <Button
            variant="primary"
            leftIcon={<FolderPlus className="w-4 h-4" />}
            onClick={() => {
              newProject();
              onClose();
            }}
          >
            New project
          </Button>
        }
      >
        <ul className="space-y-1" aria-label="Projects">
          {sorted.map((p) => {
            const open = p.id === currentProjectId;
            return (
              <li key={p.id} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${open ? 'bg-accent/10' : 'hover:bg-surface-2'}`}>
                <div className="flex-1 min-w-0">
                  {renaming === p.id ? (
                    <input
                      autoFocus
                      defaultValue={p.name}
                      aria-label="Project name"
                      onBlur={(e) => {
                        renameProject(p.id, e.target.value);
                        setRenaming(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        if (e.key === 'Escape') setRenaming(null);
                        e.stopPropagation();
                      }}
                      className="w-full rounded-md border border-accent bg-surface-0 px-2 py-0.5 text-[13px] text-fg focus:outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      disabled={open}
                      onClick={() => {
                        openProject(p.id);
                        onClose();
                      }}
                      className="w-full text-left cursor-pointer disabled:cursor-default"
                    >
                      <span className="block text-[13px] font-medium text-fg truncate">
                        {p.name}
                        {open && <span className="ml-2 text-xs font-normal text-accent-fg">Open</span>}
                      </span>
                      <span className="block text-xs text-fg-subtle">{editedAgo(p.updatedAt)}</span>
                    </button>
                  )}
                </div>
                <IconButton icon={<Pencil className="w-3.5 h-3.5" />} tooltip="Rename" size="xs" onClick={() => setRenaming(p.id)} />
                <IconButton icon={<Copy className="w-3.5 h-3.5" />} tooltip="Make a copy" size="xs" onClick={() => duplicateProject(p.id)} />
                <IconButton icon={<Trash2 className="w-3.5 h-3.5" />} tooltip="Delete" size="xs" variant="danger" onClick={() => setToDelete(p)} />
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-fg-subtle">Projects live in this browser only. Use File → Save as JSON to keep a copy elsewhere.</p>
      </Dialog>
      <ConfirmDialog
        isOpen={toDelete !== null}
        title={`Delete "${toDelete?.name}"?`}
        message="Its circuit is removed from this browser. This can't be undone."
        confirmLabel="Delete project"
        destructive
        onConfirm={() => {
          if (toDelete) deleteProject(toDelete.id);
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
};
