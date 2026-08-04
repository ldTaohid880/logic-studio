import React from 'react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { CheckCircle2 } from 'lucide-react';

export const Toast: React.FC = () => {
  const toastMessage = useCircuitStore((state) => state.toastMessage);

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900/95 border border-emerald-500/40 text-emerald-300 rounded-2xl shadow-2xl backdrop-blur-xl animate-fadeIn font-mono text-xs font-bold">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <span>{toastMessage}</span>
    </div>
  );
};
