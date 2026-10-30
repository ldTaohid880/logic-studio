import React from 'react';
import { RotateCcw, Download, Trash2 } from 'lucide-react';
import { STORAGE_KEY_CIRCUIT, STORAGE_KEY_CUSTOM_COMPONENTS } from '../store/helpers';
import { Logo } from './ui/Logo';

interface ErrorBoundaryState {
  error: Error | null;
  confirmingReset: boolean;
}

const readStored = (key: string): unknown => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** Same shape as File → Save as JSON, built from the autosave so it works even when the store is broken. */
function downloadAutosave() {
  const circuit = readStored(STORAGE_KEY_CIRCUIT) as { nodes?: unknown[]; edges?: unknown[] } | null;
  const file = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    nodes: circuit?.nodes ?? [],
    edges: circuit?.edges ?? [],
    customComponents: readStored(STORAGE_KEY_CUSTOM_COMPONENTS) ?? {},
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `logic-circuit-recovered-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Last line of defence: if rendering throws, show a recovery screen instead of a blank page.
 * Students can save their autosaved work before reloading or clearing it.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, confirmingReset: false };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Logic Studio crashed', error, info.componentStack);
  }

  private clearAndReload = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_CIRCUIT);
    } catch {
      // Storage unavailable: reloading still gives the user a fresh attempt
    }
    window.location.reload();
  };

  render() {
    const { error, confirmingReset } = this.state;
    if (!error) return this.props.children;

    const hasAutosave = readStored(STORAGE_KEY_CIRCUIT) !== null;
    const button =
      'inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg text-sm font-medium transition-colors cursor-pointer';

    return (
      <main role="alert" className="min-h-screen bg-surface-0 text-fg flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface-1 border border-line rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Logo className="w-9 h-9 shrink-0" />
            <div>
              <h1 className="text-base font-semibold">Something went wrong</h1>
              <p className="text-[13px] text-fg-muted">Logic Studio hit an error and stopped drawing the page.</p>
            </div>
          </div>

          <p className="text-sm text-fg-muted">
            {hasAutosave
              ? 'Your circuit is still saved in this browser. Download a copy first, then reload to carry on.'
              : 'Reloading usually fixes this.'}
          </p>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => window.location.reload()} className={`${button} bg-accent text-on-accent hover:opacity-90`}>
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Reload
            </button>
            {hasAutosave && (
              <button type="button" onClick={downloadAutosave} className={`${button} border border-line bg-surface-2 hover:bg-surface-3`}>
                <Download className="w-4 h-4" aria-hidden="true" />
                Download my circuit
              </button>
            )}
          </div>

          {hasAutosave && (
            <div className="pt-3 border-t border-line text-[13px] text-fg-muted space-y-2">
              {confirmingReset ? (
                <>
                  <p>This deletes the autosaved circuit from this browser. Custom components are kept.</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={this.clearAndReload} className={`${button} h-8 bg-danger text-white hover:opacity-90`}>
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      Delete and start fresh
                    </button>
                    <button
                      type="button"
                      onClick={() => this.setState({ confirmingReset: false })}
                      className={`${button} h-8 text-fg-muted hover:text-fg`}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <p>
                  Still broken after reloading?{' '}
                  <button type="button" onClick={() => this.setState({ confirmingReset: true })} className="text-accent-fg hover:underline cursor-pointer">
                    Start with an empty canvas
                  </button>
                </p>
              )}
            </div>
          )}

          <details className="text-xs text-fg-subtle">
            <summary className="cursor-pointer select-none">Error details</summary>
            <pre className="mt-2 p-2 rounded-md bg-surface-0 border border-line overflow-auto max-h-40 whitespace-pre-wrap break-words">
              Logic Studio {__APP_VERSION__}
              {'\n'}
              {error.name}: {error.message}
            </pre>
          </details>
        </div>
      </main>
    );
  }
}
