import { useRef, useState } from 'react';
import {
  FileUp,
  FileText,
  Trash2,
  ShieldCheck,
  MessageSquareReply,
  Stethoscope,
  Download,
} from 'lucide-react';
import { useHL7State } from '@/hooks/useHL7State';
import { RawEditor } from '@/components/RawEditor';
import { TreeViewer } from '@/components/TreeViewer';
import { HumanReadablePanel } from '@/components/HumanReadablePanel';
import { ValidationPanel } from '@/components/ValidationPanel';
import { AckModal } from '@/components/AckModal';

type Pane = 'raw' | 'tree' | 'human';

function App() {
  const state = useHL7State();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showAck, setShowAck] = useState(false);
  const [activeMobilePane, setActiveMobilePane] = useState<Pane>('raw');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.loadFile(String(reader.result));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownload = () => {
    const blob = new Blob([state.rawText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'message.hl7';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600">
            <Stethoscope className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">HL7 v2 Inspector</h1>
            <p className="text-xs text-slate-500">Reader · Viewer · Editor — 100% client-side</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            ref={fileRef}
            type="file"
            accept=".hl7,.txt,.er7,text/plain"
            onChange={handleFile}
            className="hidden"
          />
          <ToolbarButton icon={<FileUp className="h-4 w-4" />} label="Upload" onClick={() => fileRef.current?.click()} />
          <ToolbarButton icon={<FileText className="h-4 w-4" />} label="Sample" onClick={state.loadSample} />
          <ToolbarButton icon={<Download className="h-4 w-4" />} label="Export" onClick={handleDownload} />
          <ToolbarButton icon={<Trash2 className="h-4 w-4" />} label="Clear" onClick={state.clearMessage} />
          <div className="mx-1 h-5 w-px bg-slate-700" />
          <ToolbarButton
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Anonymize"
            onClick={state.doAnonymize}
            variant="accent"
          />
          <ToolbarButton
            icon={<MessageSquareReply className="h-4 w-4" />}
            label="Generate ACK"
            onClick={() => {
              state.doGenerateACK();
              setShowAck(true);
            }}
            variant="accent"
          />
        </div>
      </header>

      {/* Validation bar */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-2">
        <ValidationPanel
          results={state.validation}
          errorCount={state.errorCount}
          warningCount={state.warningCount}
        />
      </div>

      {/* Mobile pane selector */}
      <div className="flex border-b border-slate-800 bg-slate-900 lg:hidden">
        {(['raw', 'tree', 'human'] as Pane[]).map((p) => (
          <button
            key={p}
            onClick={() => setActiveMobilePane(p)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              activeMobilePane === p
                ? 'border-b-2 border-cyan-500 text-cyan-300'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {p === 'raw' ? 'Raw Text' : p === 'tree' ? 'Tree View' : 'Human Readable'}
          </button>
        ))}
      </div>

      {/* Three-pane layout */}
      <div className="flex flex-1 gap-2 overflow-hidden p-2">
        {/* Pane A: Raw Editor */}
        <div
          className={`flex flex-1 flex-col overflow-hidden lg:flex ${
            activeMobilePane === 'raw' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="mb-1.5 flex items-center gap-2">
            <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400">
              A
            </span>
            <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Raw Text Editor
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <RawEditor
              value={state.rawText}
              onChange={state.updateFromRaw}
              delimiters={state.parsed.delimiters}
            />
          </div>
        </div>

        {/* Pane B: Tree Viewer */}
        <div
          className={`flex flex-1 flex-col overflow-hidden lg:flex ${
            activeMobilePane === 'tree' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="mb-1.5 flex items-center gap-2">
            <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400">
              B
            </span>
            <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Segment Tree Viewer
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <TreeViewer parsed={state.parsed} onUpdateField={state.updateField} />
          </div>
        </div>

        {/* Pane C: Human Readable */}
        <div
          className={`flex flex-1 flex-col overflow-hidden lg:flex ${
            activeMobilePane === 'human' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="mb-1.5 flex items-center gap-2">
            <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400">
              C
            </span>
            <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Human-Readable Interpretation
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <HumanReadablePanel items={state.humanReadable} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-slate-800 bg-slate-900/80 px-4 py-1.5 text-xs text-slate-600">
        <span>
          {state.parsed.segments.length} segment{state.parsed.segments.length !== 1 ? 's' : ''} ·
          Delimiters: <span className="font-mono text-slate-400">{state.parsed.delimiters.field} {state.parsed.delimiters.component} {state.parsed.delimiters.repetition} {state.parsed.delimiters.escape} {state.parsed.delimiters.subcomponent}</span>
        </span>
        <span className="flex items-center gap-1 text-emerald-500/70">
          <ShieldCheck className="h-3 w-3" />
          No data leaves your browser
        </span>
      </footer>

      <AckModal
        open={showAck}
        ackMessage={state.ackMessage}
        onClose={() => setShowAck(false)}
      />
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
  variant = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'accent';
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
        variant === 'accent'
          ? 'bg-cyan-600/15 text-cyan-300 hover:bg-cyan-600/25 border border-cyan-600/20'
          : 'text-slate-300 hover:bg-slate-800 border border-transparent'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default App;
