import { Node, Edge } from '@xyflow/react';
import { makeId } from '../utils/ids';

/**
 * Saved projects: a small index (names and dates) plus one storage key per project, so autosave only
 * rewrites the project that is open. The open project is also mirrored in logic_studio_circuit.
 */
export interface ProjectMeta {
  id: string;
  name: string;
  updatedAt: number;
}

export interface ProjectContent {
  nodes: Node[];
  edges: Edge[];
  expected?: string;
}

export const STORAGE_KEY_PROJECTS = 'logic_studio_projects';
export const STORAGE_KEY_CURRENT_PROJECT = 'logic_studio_current_project';
const contentKey = (id: string) => `logic_studio_project:${id}`;

const read = <T>(key: string): T | null => {
  try {
    const text = localStorage.getItem(key);
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
};

export function loadProjectIndex(): ProjectMeta[] {
  const list = read<ProjectMeta[]>(STORAGE_KEY_PROJECTS);
  return Array.isArray(list) ? list.filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string') : [];
}

export function saveProjectIndex(list: ProjectMeta[], currentId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(list));
    localStorage.setItem(STORAGE_KEY_CURRENT_PROJECT, currentId);
  } catch (e) {
    console.error('Failed to save the project list', e);
  }
}

export function loadProjectContent(id: string): ProjectContent | null {
  const content = read<ProjectContent>(contentKey(id));
  return content && Array.isArray(content.nodes) && Array.isArray(content.edges) ? content : null;
}

/** Throws when browser storage is full, so the caller can tell the user. */
export function saveProjectContent(id: string, content: ProjectContent): void {
  localStorage.setItem(contentKey(id), JSON.stringify(content));
}

export function deleteProjectContent(id: string): void {
  try {
    localStorage.removeItem(contentKey(id));
  } catch {
    // nothing to free
  }
}

/** The project list and open project at startup; the first run turns the autosaved circuit into "My circuit". */
export function initialProjects(current: ProjectContent): { projects: ProjectMeta[]; currentId: string } {
  const projects = loadProjectIndex();
  const currentId = read<string>(STORAGE_KEY_CURRENT_PROJECT) ?? localStorage.getItem(STORAGE_KEY_CURRENT_PROJECT);
  if (projects.length > 0 && currentId && projects.some((p) => p.id === currentId)) return { projects, currentId };
  const first: ProjectMeta = { id: makeId('project'), name: 'My circuit', updatedAt: Date.now() };
  const list = [...projects, first];
  try {
    saveProjectContent(first.id, current);
  } catch (e) {
    console.error('Failed to save the first project', e);
  }
  saveProjectIndex(list, first.id);
  return { projects: list, currentId: first.id };
}

/** A name not used by another project: "Untitled", "Untitled 2", … */
export function freeProjectName(projects: ProjectMeta[], base = 'Untitled'): string {
  const names = new Set(projects.map((p) => p.name));
  if (!names.has(base)) return base;
  for (let i = 2; ; i++) if (!names.has(`${base} ${i}`)) return `${base} ${i}`;
}
