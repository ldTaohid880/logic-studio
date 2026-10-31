/// <reference types="vite/client" />

/** Version from package.json, injected by vite.config.ts. */
declare const __APP_VERSION__: string;

interface Window {
  /** Dev builds only (src/main.tsx): the app's store and engine, for agents and browser checks. */
  __logicStudio?: {
    store: typeof import('./store/useCircuitStore').useCircuitStore;
    propagateSignals: typeof import('./simulation/engine').propagateSignals;
  };
}
