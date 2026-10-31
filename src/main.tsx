import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { useCircuitStore } from './store/useCircuitStore';
import { propagateSignals } from './simulation/engine';

// Dev builds only: lets agents and tests in the browser reach the store the app renders
// (a dynamic import of the store module can return a second instance after hot reloads)
if (import.meta.env.DEV) window.__logicStudio = { store: useCircuitStore, propagateSignals };

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
