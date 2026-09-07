import type { HumanReadableItem } from '@/hl7/translator';
import { SEGMENT_DEFS } from '@/hl7/segmentDefs';

interface HumanReadablePanelProps {
  items: HumanReadableItem[][];
}

export function HumanReadablePanel({ items }: HumanReadablePanelProps) {
  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 text-sm">
        No message loaded
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto rounded-lg border border-slate-700 bg-slate-900">
      <div className="space-y-3 p-4">
        {items.map((segItems, segIdx) => {
          const segId = segItems[0]?.segment || '';
          const segDef = SEGMENT_DEFS[segId];
          const visibleItems = segItems.filter((i) => i.value);
          if (visibleItems.length === 0) return null;

          return (
            <div
              key={segIdx}
              className="rounded-lg border border-slate-700/50 bg-slate-800/30 overflow-hidden"
            >
              <div className="flex items-center gap-2 border-b border-slate-700/50 bg-slate-800/50 px-3 py-2">
                <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 font-mono text-xs font-bold text-cyan-300">
                  {segId}
                </span>
                <span className="text-sm font-medium text-slate-300">
                  {segDef?.description || segId}
                </span>
              </div>
              <div className="divide-y divide-slate-700/30">
                {visibleItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 px-3 py-2 hover:bg-slate-800/30 transition-colors">
                    <span className="mt-0.5 w-28 shrink-0 text-xs text-slate-500">
                      {item.label}
                    </span>
                    <span className="text-sm text-slate-200">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
