import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ValidationResult } from '@/hl7/types';

interface ValidationPanelProps {
  results: ValidationResult[];
  errorCount: number;
  warningCount: number;
}

export function ValidationPanel({ results, errorCount, warningCount }: ValidationPanelProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-slate-200">Validation</h3>
        <div className="flex items-center gap-3 text-xs">
          {errorCount === 0 && warningCount === 0 ? (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Valid
            </span>
          ) : (
            <>
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  {errorCount} error{errorCount !== 1 ? 's' : ''}
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-1 text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  {warningCount} warning{warningCount !== 1 ? 's' : ''}
                </span>
              )}
            </>
          )}
        </div>
      </div>
      <div className="max-h-48 overflow-auto">
        {results.length === 0 || (errorCount === 0 && warningCount === 0) ? (
          <div className="flex items-center gap-2 px-4 py-3 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            No issues found
          </div>
        ) : (
          results.map((r, i) => (
            <div
              key={i}
              className="flex items-start gap-2 px-4 py-2 text-sm hover:bg-slate-800/50 transition-colors border-b border-slate-700/30 last:border-0"
            >
              {r.severity === 'error' ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              )}
              <div className="min-w-0">
                {r.field && (
                  <span className={`font-mono text-xs ${r.severity === 'error' ? 'text-red-300' : 'text-amber-300'}`}>
                    {r.field}:{' '}
                  </span>
                )}
                <span className={r.severity === 'error' ? 'text-red-200' : 'text-amber-200'}>
                  {r.message}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
