import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface AckModalProps {
  open: boolean;
  ackMessage: string;
  onClose: () => void;
}

export function AckModal({ open, ackMessage, onClose }: AckModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(ackMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-200">Generated ACK Message</h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">
          <pre className="max-h-80 overflow-auto rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-xs text-cyan-200 whitespace-pre-wrap break-all">
            {ackMessage || 'No ACK could be generated. Load a valid HL7 message first.'}
          </pre>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
