import React from 'react';
import { useCircuitStore } from '../../store/useCircuitStore';
import { useShallow } from 'zustand/react/shallow';
import { ChevronRight, Home, ArrowLeft, Layers } from 'lucide-react';

export const HierarchyBreadcrumbs: React.FC = () => {
  const { hierarchyPath, exitSubcircuitView } = useCircuitStore(useShallow((s) => ({ hierarchyPath: s.hierarchyPath, exitSubcircuitView: s.exitSubcircuitView })));

  if (!hierarchyPath || hierarchyPath.length <= 1) {
    return null;
  }

  return (
    <div
      className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-lg backdrop-blur-md text-xs font-mono select-none bg-slate-900/90 border-slate-800 text-slate-200 shadow-black/50"
    >
      {hierarchyPath.map((item, index) => {
        const isLast = index === hierarchyPath.length - 1;

        return (
          <React.Fragment key={`${item.id}-${index}`}>
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />}

            {isLast ? (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/80 text-emerald-400 font-bold border border-emerald-500/30">
                <Layers className="w-3.5 h-3.5" />
                {item.name}
              </span>
            ) : (
              <button
                onClick={() => exitSubcircuitView(index)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {index === 0 ? <Home className="w-3.5 h-3.5" /> : null}
                <span>{item.name}</span>
              </button>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
