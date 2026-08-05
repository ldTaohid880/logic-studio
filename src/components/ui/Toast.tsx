import React from 'react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { CheckCircle2 } from 'lucide-react';

export const Toast: React.FC = () => {
  const toastMessage = useCircuitStore((state) => state.toastMessage);

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-100 rounded-xl shadow-lg animate-fadeIn font-sans text-xs font-medium">
      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
      <span>{toastMessage}</span>
    </div>
  );
};
