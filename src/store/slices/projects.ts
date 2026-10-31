import { CircuitStore, StoreSlice } from '../types';
import { initialCircuit } from '../helpers';
import { makeId } from '../../utils/ids';
import {
  deleteProjectContent,
  freeProjectName,
  initialProjects,
  loadProjectContent,
  ProjectContent,
  saveProjectContent,
  saveProjectIndex,
} from '../projectStorage';

// Several saved projects; the open one autosaves (useCircuitStore.ts). Switching isn't an undo step.
export type ProjectsSlice = Pick<
  CircuitStore,
  'projects' | 'currentProjectId' | 'newProject' | 'openProject' | 'renameProject' | 'duplicateProject' | 'deleteProject' | 'saveCurrentProject'
>;

const initial = initialProjects(initialCircuit);

export const createProjectsSlice: StoreSlice<ProjectsSlice> = (set, get) => {
  /** The open project's circuit, from the main circuit even while a sub-circuit is open. */
  const currentContent = (): ProjectContent => {
    const { nodes, edges, hierarchyPath, rootCircuitState, expected } = get();
    const root = hierarchyPath.length > 1 && rootCircuitState ? rootCircuitState : { nodes, edges };
    return { nodes: root.nodes, edges: root.edges, ...(expected.trim() ? { expected } : {}) };
  };

  const show = (id: string, content: ProjectContent) => {
    if (get().hierarchyPath.length > 1) get().exitSubcircuitView(0);
    get().loadCircuit(content.nodes, content.edges);
    set({ currentProjectId: id, expected: content.expected ?? '', historyPast: [], historyFuture: [] });
    saveProjectIndex(get().projects, id);
  };

  return {
    projects: initial.projects,
    currentProjectId: initial.currentId,

    saveCurrentProject: () => {
      const { currentProjectId, projects } = get();
      saveProjectContent(currentProjectId, currentContent());
      const list = projects.map((p) => (p.id === currentProjectId ? { ...p, updatedAt: Date.now() } : p));
      set({ projects: list });
      saveProjectIndex(list, currentProjectId);
    },

    newProject: () => {
      get().saveCurrentProject();
      const project = { id: makeId('project'), name: freeProjectName(get().projects), updatedAt: Date.now() };
      set({ projects: [...get().projects, project] });
      show(project.id, { nodes: [], edges: [] });
      get().saveCurrentProject();
    },

    openProject: (id) => {
      if (id === get().currentProjectId) return;
      const content = loadProjectContent(id);
      if (!content) {
        get().showToast('Failed to open the project: its saved circuit is missing');
        return;
      }
      get().saveCurrentProject();
      show(id, content);
    },

    renameProject: (id, name) => {
      const list = get().projects.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p));
      set({ projects: list });
      saveProjectIndex(list, get().currentProjectId);
    },

    duplicateProject: (id) => {
      if (id === get().currentProjectId) get().saveCurrentProject();
      const content = loadProjectContent(id);
      const source = get().projects.find((p) => p.id === id);
      if (!content || !source) return;
      const copy = { id: makeId('project'), name: freeProjectName(get().projects, `${source.name} copy`), updatedAt: Date.now() };
      try {
        saveProjectContent(copy.id, content);
      } catch {
        get().showToast('Failed to copy the project: browser storage is full');
        return;
      }
      const list = [...get().projects, copy];
      set({ projects: list });
      saveProjectIndex(list, get().currentProjectId);
    },

    deleteProject: (id) => {
      const rest = get().projects.filter((p) => p.id !== id);
      deleteProjectContent(id);
      if (id !== get().currentProjectId) {
        set({ projects: rest });
        saveProjectIndex(rest, get().currentProjectId);
        return;
      }
      // Deleting the open project opens the most recent other one, or a new empty one
      const next = [...rest].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      const fallback = { id: makeId('project'), name: freeProjectName(rest), updatedAt: Date.now() };
      set({ projects: next ? rest : [fallback] });
      show(next?.id ?? fallback.id, (next && loadProjectContent(next.id)) || { nodes: [], edges: [] });
      if (!next) get().saveCurrentProject();
    },
  };
};
