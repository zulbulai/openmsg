import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, Clock, X } from 'lucide-react';
import { Workflow, Contact } from '@/storage/schemas';
import { WorkflowEngine } from '@/workflow-engine/engine';

interface WorkflowDebuggerProps {
  workflow: Workflow;
  contacts: Contact[];
  onClose: () => void;
}

export const WorkflowDebugger: React.FC<WorkflowDebuggerProps> = ({
  workflow,
  contacts,
  onClose,
}) => {
  const [selectedContactId, setSelectedContactId] = useState<string>(
    contacts[0]?.id || '15551234567@c.us'
  );
  const [variablesInput, setVariablesInput] = useState<string>(
    JSON.stringify({ intent: 'pricing', userType: 'lead' }, null, 2)
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [finalStatus, setFinalStatus] = useState<string | null>(null);

  const handleTestRun = async () => {
    setIsExecuting(true);
    setLogs([]);
    setFinalStatus(null);

    try {
      let initialVars: Record<string, unknown> = {};
      try {
        initialVars = JSON.parse(variablesInput);
      } catch {
        alert('Invalid variables JSON');
        setIsExecuting(false);
        return;
      }

      const engine = new WorkflowEngine({
        onTagContact: async (contactId, tagId) => {
          setLogs((prev) => [...prev, `[Side Effect] Applied tag "${tagId}" to ${contactId}`]);
        },
      });

      const context = engine.createContext(workflow, selectedContactId, initialVars);
      setLogs((prev) => [...prev, ...context.logs]);

      const finishedContext = await engine.runUntilHalt(workflow, context);
      setLogs([...finishedContext.logs]);
      setFinalStatus(finishedContext.status);
    } catch (err: any) {
      setLogs((prev) => [...prev, `[Fatal Error]: ${err.message}`]);
      setFinalStatus('FAILED');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-[420px] bg-zinc-950 border-l border-zinc-800 h-full shadow-2xl flex flex-col text-xs">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div>
            <h3 className="font-bold text-zinc-100 flex items-center gap-1.5">
              <Play className="h-4 w-4 text-emerald-400" />
              Workflow Test Runner & Debugger
            </h3>
            <p className="text-[11px] text-zinc-400">Simulate execution with local sandbox data</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded text-zinc-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Configuration Panel */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 flex flex-col gap-3">
          <div>
            <label className="font-semibold text-zinc-300 block mb-1">Simulated Contact</label>
            <select
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/60 rounded-lg px-3 py-1.5 text-zinc-200"
            >
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone || c.id})
                </option>
              ))}
              <option value="15551234567@c.us">Simulated Test Lead (+15551234567)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-zinc-300 block mb-1">Initial Variables (JSON)</label>
            <textarea
              rows={3}
              value={variablesInput}
              onChange={(e) => setVariablesInput(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/60 rounded-lg p-2 font-mono text-zinc-300 text-[11px]"
            />
          </div>

          <button
            onClick={handleTestRun}
            disabled={isExecuting}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
          >
            <Play className="h-3.5 w-3.5" />
            {isExecuting ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>

        {/* Execution Status Badge */}
        {finalStatus && (
          <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
            <span className="text-zinc-400 font-semibold">Final Status:</span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase flex items-center gap-1 ${
                finalStatus === 'COMPLETED'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : finalStatus === 'WAITING_DELAY'
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {finalStatus === 'COMPLETED' && <CheckCircle2 className="h-3 w-3" />}
              {finalStatus === 'WAITING_DELAY' && <Clock className="h-3 w-3" />}
              {finalStatus === 'FAILED' && <XCircle className="h-3 w-3" />}
              {finalStatus}
            </span>
          </div>
        )}

        {/* Step by Step Execution Logs */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1.5 font-mono text-[11px]">
          <span className="text-zinc-400 font-sans font-bold block mb-1">Execution Trace</span>
          {logs.length === 0 ? (
            <div className="text-zinc-600 text-center py-10 font-sans">
              Click &quot;Run Simulation&quot; to test workflow execution path.
            </div>
          ) : (
            logs.map((log, idx) => (
              <div
                key={idx}
                className={`p-2 rounded border leading-relaxed ${
                  log.startsWith('Error') || log.startsWith('[Fatal')
                    ? 'bg-rose-950/30 border-rose-900/50 text-rose-300'
                    : log.startsWith('Executing')
                    ? 'bg-zinc-900 border-zinc-800 text-emerald-400'
                    : 'bg-zinc-950 border-zinc-900 text-zinc-300'
                }`}
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
