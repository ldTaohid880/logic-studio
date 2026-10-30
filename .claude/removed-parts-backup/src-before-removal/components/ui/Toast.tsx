import React from 'react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const VARIANT_ICON = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />,
  error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" aria-hidden="true" />,
  info: <Info className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />,
};

export const Toast: React.FC = () => {
  const toastMessage = useCircuitStore((state) => state.toastMessage);
  const toastVariant = useCircuitStore((state) => state.toastVariant);

  return (
    <div
      aria-live={toastVariant === 'error' ? 'assertive' : 'polite'}
      role="status"
      className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[900] pointer-events-none"
    >
      {toastMessage && (
        <div
          className={`pointer-events-auto flex items-center gap-2.5 pl-3 pr-1.5 py-1.5 bg-surface-1 border text-fg rounded-xl shadow-lg animate-fadeIn text-[13px] font-medium max-w-[min(90vw,480px)] ${
            toastVariant === 'error' ? 'border-rose-500/40' : 'border-line'
          }`}
        >
          {VARIANT_ICON[toastVariant]}
          <span>{toastMessage}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => useCircuitStore.setState({ toastMessage: null })}
            className="p-1 rounded-md text-fg-subtle hover:text-fg hover:bg-surface-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
