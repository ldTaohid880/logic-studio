import { GateType } from '../../types/circuit';
import { CircuitStore, StoreSlice, ThemeMode, UiDensity, ToastVariant, WireStyle } from '../types';

// Toasts, theme/density preferences and panel/label visibility toggles
export type UiSlice = Pick<CircuitStore,
  | 'showWireLabels'
  | 'showInspector'
  | 'showToolbox'
  | 'theme'
  | 'density'
  | 'toastMessage'
  | 'toastVariant'
  | 'showToast'
  | 'toggleWireLabels'
  | 'toggleInspector'
  | 'setShowInspector'
  | 'toggleToolbox'
  | 'setShowToolbox'
  | 'setTheme'
  | 'toggleTheme'
  | 'setDensity'
  | 'wireStyle'
  | 'setWireStyle'
  | 'showMinimap'
  | 'toggleMinimap'
  | 'editingEdgeId'
  | 'setEditingEdgeId'
  | 'isCanvasLocked'
  | 'toggleCanvasLock'
  | 'datasheetType'
  | 'openDatasheet'
  | 'closeDatasheet'
>;

const PREFS_KEY = 'logic_studio_ui_prefs';

interface UiPrefs {
  theme?: ThemeMode;
  density?: UiDensity;
  wireStyle?: WireStyle;
  showMinimap?: boolean;
}

function readPrefs(): UiPrefs {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(PREFS_KEY) : null;
    return raw ? (JSON.parse(raw) as UiPrefs) : {};
  } catch {
    return {};
  }
}

function writePrefs(prefs: UiPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...readPrefs(), ...prefs }));
  } catch {
    // Storage can be unavailable (private mode); preferences then last for the session only
  }
}

function initialTheme(): ThemeMode {
  const saved = readPrefs().theme;
  if (saved === 'light' || saved === 'dark') return saved;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

function initialDensity(): UiDensity {
  const saved = readPrefs().density;
  return saved === 'compact' || saved === 'presentation' ? saved : 'comfortable';
}

// Messages that report a failure get the error style unless a variant is passed explicitly
const ERROR_PATTERN = /^(fail|invalid|cannot|import rejected|recursion|error)/i;

const isNarrowViewport = () => typeof window !== 'undefined' && window.innerWidth < 1024;

let toastTimer: ReturnType<typeof setTimeout> | undefined;
let lastDatasheetType: GateType = 'AND';

export const createUiSlice: StoreSlice<UiSlice> = (set, get) => ({
  showWireLabels: true,
  showInspector: !isNarrowViewport(),
  showToolbox: !isNarrowViewport(),
  theme: initialTheme(),
  density: initialDensity(),
  wireStyle: readPrefs().wireStyle === 'orthogonal' ? 'orthogonal' : 'curved',
  showMinimap: readPrefs().showMinimap !== false,
  editingEdgeId: null,
  isCanvasLocked: false,
  datasheetType: null,

  toastMessage: null,
  toastVariant: 'success',

  showToast: (message, variant) => {
    const resolved: ToastVariant = variant ?? (ERROR_PATTERN.test(message) ? 'error' : 'success');
    set({ toastMessage: message, toastVariant: resolved });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (get().toastMessage === message) {
        set({ toastMessage: null });
      }
    }, resolved === 'error' ? 4500 : 2800);
  },

  toggleWireLabels: () => {
    set({ showWireLabels: !get().showWireLabels });
  },

  toggleInspector: () => {
    set({ showInspector: !get().showInspector });
  },

  setShowInspector: (show) => {
    set({ showInspector: show });
  },

  toggleToolbox: () => {
    set({ showToolbox: !get().showToolbox });
  },

  setShowToolbox: (show) => {
    set({ showToolbox: show });
  },

  setTheme: (theme) => {
    writePrefs({ theme });
    set({ theme });
  },

  toggleTheme: () => {
    get().setTheme(get().theme === 'dark' ? 'light' : 'dark');
  },

  setDensity: (density) => {
    writePrefs({ density });
    set({ density });
  },

  setWireStyle: (wireStyle) => {
    writePrefs({ wireStyle });
    set({ wireStyle });
  },

  toggleMinimap: () => {
    const showMinimap = !get().showMinimap;
    writePrefs({ showMinimap });
    set({ showMinimap });
  },

  setEditingEdgeId: (id) => {
    set({ editingEdgeId: id });
  },

  toggleCanvasLock: () => {
    const isCanvasLocked = !get().isCanvasLocked;
    set({ isCanvasLocked });
    get().showToast(isCanvasLocked ? 'Part positions locked' : 'Part positions unlocked', 'info');
  },

  // Without a type, reopens the part viewed last (AND the first time)
  openDatasheet: (type) => {
    if (type) lastDatasheetType = type;
    set({ datasheetType: type ?? lastDatasheetType });
  },

  closeDatasheet: () => {
    set({ datasheetType: null });
  },
});
