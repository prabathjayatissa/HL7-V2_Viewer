import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { ParsedMessage } from '@/hl7/types';
import { getSegmentDef, getFieldDef } from '@/hl7/segmentDefs';
import { lookupTable, lookupValue } from '@/hl7/tables';

interface TreeViewerProps {
  parsed: ParsedMessage;
  onUpdateField: (segIdx: number, fieldIdx: number, rep: number, compIdx: number, subcompIdx: number, value: string) => void;
}

export function TreeViewer({ parsed, onUpdateField }: TreeViewerProps) {
  const [expandedSegs, setExpandedSegs] = useState<Set<number>>(new Set([0]));
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const toggleSeg = (idx: number) => {
    setExpandedSegs((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleField = (key: string) => {
    setExpandedFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (parsed.segments.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 text-sm">
        No message loaded
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto rounded-lg border border-slate-700 bg-slate-900">
      <div className="p-2">
        {parsed.segments.map((seg, segIdx) => {
          const segDef = getSegmentDef(seg.id);
          const isExpanded = expandedSegs.has(segIdx);
          return (
            <div key={segIdx} className="mb-1">
              <button
                onClick={() => toggleSeg(segIdx)}
                className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-sm hover:bg-slate-800 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                )}
                <span className="font-mono font-bold text-cyan-300">{seg.id}</span>
                {segDef && (
                  <span className="text-xs text-slate-500">
                    {segDef.description}
                  </span>
                )}
              </button>

              {isExpanded && (
                <div className="ml-4 border-l border-slate-700 pl-2">
                  {seg.fields.map((field) => {
                    const fieldKey = `${segIdx}-${field.index}`;
                    const fdef = getFieldDef(seg.id, field.index);
                    const isFieldExpanded = expandedFields.has(fieldKey);
                    const hasComponents = field.repetitions.some((rep) => rep.length > 1 || (rep[0] && rep[0].length > 1));
                    const rawValue = field.raw;

                    return (
                      <div key={fieldKey} className="mb-0.5">
                        <div className="flex items-start gap-1.5">
                          {hasComponents ? (
                            <button
                              onClick={() => toggleField(fieldKey)}
                              className="mt-0.5 shrink-0"
                            >
                              {isFieldExpanded ? (
                                <ChevronDown className="h-3 w-3 text-slate-500" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-slate-500" />
                              )}
                            </button>
                          ) : (
                            <span className="mt-0.5 inline-block w-3" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="font-mono text-xs text-emerald-400">
                                {seg.id}-{field.index}
                              </span>
                              {fdef && (
                                <span className="text-xs text-slate-500 truncate">
                                  {fdef.name}
                                </span>
                              )}
                            </div>
                            {!hasComponents && (
                              <FieldInput
                                value={rawValue}
                                tableId={fdef?.table}
                                onChange={(val) => onUpdateField(segIdx, field.index, 0, 0, 0, val)}
                              />
                            )}
                            {hasComponents && !isFieldExpanded && (
                              <div className="truncate font-mono text-xs text-slate-400">
                                {rawValue || <span className="text-slate-600">(empty)</span>}
                              </div>
                            )}
                          </div>
                        </div>

                        {hasComponents && isFieldExpanded && (
                          <div className="ml-4 border-l border-slate-700 pl-2 mt-0.5">
                            {field.repetitions.map((rep, repIdx) => (
                              <div key={repIdx}>
                                {field.repetitions.length > 1 && (
                                  <div className="text-xs text-slate-500 py-0.5">
                                    Repetition {repIdx + 1}
                                  </div>
                                )}
                                {rep.map((comp, compIdx) => {
                                  const compValue = comp.join(parsed.delimiters.subcomponent);
                                  const hasSub = comp.length > 1;
                                  return (
                                    <div key={compIdx} className="mb-0.5">
                                      <div className="flex items-baseline gap-2">
                                        <span className="font-mono text-xs text-amber-400">
                                          {seg.id}-{field.index}.{compIdx + 1}
                                        </span>
                                      </div>
                                      {hasSub ? (
                                        <div className="ml-4 border-l border-slate-700 pl-2 mt-0.5">
                                          {comp.map((sub, subIdx) => (
                                            <div key={subIdx} className="mb-0.5">
                                              <div className="flex items-baseline gap-2">
                                                <span className="font-mono text-xs text-slate-400">
                                                  {seg.id}-{field.index}.{compIdx + 1}.{subIdx + 1}
                                                </span>
                                              </div>
                                              <FieldInput
                                                value={sub}
                                                onChange={(val) => onUpdateField(segIdx, field.index, repIdx, compIdx, subIdx, val)}
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <FieldInput
                                          value={compValue}
                                          tableId={fdef?.table}
                                          onChange={(val) => onUpdateField(segIdx, field.index, repIdx, compIdx, 0, val)}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FieldInput({
  value,
  tableId,
  onChange,
}: {
  value: string;
  tableId?: string;
  onChange: (val: string) => void;
}) {
  const table = tableId ? lookupTable(tableId) : undefined;

  if (table && table.length > 0) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
      >
        <option value="">(empty)</option>
        {table.map((entry) => (
          <option key={entry.value} value={entry.value}>
            {entry.value} - {entry.description}
          </option>
        ))}
        {!table.some((e) => e.value === value) && value && (
          <option value={value}>{value} (non-standard)</option>
        )}
      </select>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-0.5 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 font-mono text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
    />
  );
}
