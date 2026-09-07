import { useRef, useEffect, useCallback } from 'react';

interface RawEditorProps {
  value: string;
  onChange: (text: string) => void;
  delimiters: { field: string; component: string; repetition: string; escape: string; subcomponent: string };
}

export function RawEditor({ value, onChange, delimiters }: RawEditorProps) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  const lines = value.split(/\r\n|\r|\n/);

  const syncScroll = useCallback(() => {
    if (textRef.current && preRef.current && lineRef.current) {
      preRef.current.scrollTop = textRef.current.scrollTop;
      preRef.current.scrollLeft = textRef.current.scrollLeft;
      lineRef.current.scrollTop = textRef.current.scrollTop;
    }
  }, []);

  useEffect(() => {
    syncScroll();
  }, [value, syncScroll]);

  return (
    <div className="relative flex h-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900 font-mono text-sm">
      <div
        ref={lineRef}
        className="select-none overflow-hidden bg-slate-950/50 py-3 text-right text-slate-600"
        style={{ width: '48px', minWidth: '48px' }}
      >
        {lines.map((_, i) => (
          <div key={i} className="px-2 leading-5">
            {i + 1}
          </div>
        ))}
      </div>
      <div className="relative flex-1 overflow-hidden">
        <pre
          ref={preRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-0 overflow-auto whitespace-pre-wrap break-all py-3 pl-3 pr-4 leading-5"
          dangerouslySetInnerHTML={{
            __html: lines.map((l) => highlightLine(l, delimiters)).join('\n'),
          }}
        />
        <textarea
          ref={textRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          spellCheck={false}
          className="absolute inset-0 m-0 resize-none overflow-auto whitespace-pre-wrap break-all bg-transparent py-3 pl-3 pr-4 font-mono text-sm leading-5 text-transparent outline-none"
          style={{ caretColor: '#67e8f9' }}
        />
      </div>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function highlightLine(
  line: string,
  delims: { field: string; component: string; repetition: string; escape: string; subcomponent: string }
): string {
  if (!line) return '';
  const esc = escapeHtml(line);
  const fSep = escapeHtml(delims.field);
  const comp = escapeHtml(delims.component);
  const rep = escapeHtml(delims.repetition);
  const escCh = escapeHtml(delims.escape);
  const sub = escapeHtml(delims.subcomponent);

  const delimChars = [comp, rep, escCh, sub, fSep].filter((c) => c.length > 0);
  const delimPattern = delimChars.length > 0 ? new RegExp(`[${delimChars.map(escapeRegexChar).join('')}]`, 'g') : null;

  const segMatch = esc.match(/^([A-Z][A-Z0-9]{2})/);
  let result = esc;
  if (segMatch) {
    result = `<span class="text-cyan-300 font-bold">${segMatch[1]}</span>` + esc.slice(segMatch[1].length);
  }

  if (delimPattern) {
    result = result.replace(delimPattern, (m) => {
      if (m === fSep) return `<span class="text-emerald-500/80">${m}</span>`;
      return `<span class="text-amber-500/60">${m}</span>`;
    });
  }

  return result;
}

function escapeRegexChar(c: string): string {
  return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
