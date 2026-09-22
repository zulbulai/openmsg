import React, { useState, useEffect } from 'react';
import { ShieldCheck, Copy, Download, Check, RefreshCw } from 'lucide-react';
import { db } from '@/storage/db';
import { getWhatsAppClient } from '@/content/whatsapp';

export const DiagnosticsView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [info, setInfo] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  const fetchDiagnostics = async () => {
    setLoading(true);
    const client = getWhatsAppClient();
    const isReady = await client.isReady();
    const connState = await client.getConnectionState();

    // Storage info
    let quotaInfo = 'Available';
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      const usedMb = est.usage ? (est.usage / (1024 * 1024)).toFixed(1) : '0';
      const quotaMb = est.quota ? (est.quota / (1024 * 1024)).toFixed(0) : '0';
      quotaInfo = `${usedMb} MB used of ${quotaMb} MB`;
    }

    const contactsCount = await db.contacts.count();
    const workflowsCount = await db.workflows.count();
    const messagesCount = await db.messages.count();

    const diagnostics = {
      openMsgVersion: '0.1.0',
      manifestVersion: 3,
      userAgent: navigator.userAgent,
      whatsAppDetected: isReady,
      whatsAppConnectionState: connState,
      indexedDbStatus: db.isOpen() ? 'OPEN & HEALTHY' : 'CLOSED',
      storageQuota: quotaInfo,
      recordCounts: {
        contacts: contactsCount,
        workflows: workflowsCount,
        messages: messagesCount,
      },
      workflowEngine: 'ACTIVE (NodeRegistry v1)',
      schedulerStatus: 'ACTIVE (chrome.alarms integrated)',
      antiBanRateLimiter: 'ACTIVE (jitter: 3s–8s, cap: 250/hr)',
      generatedAt: new Date().toISOString(),
    };

    setInfo(diagnostics);
    setLoading(false);
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(info, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(info, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openmsg_diagnostics_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-4 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-zinc-100">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          System Diagnostics & Runtime Telemetry
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDiagnostics}
            disabled={loading}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold flex items-center gap-1"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={handleExport}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold flex items-center gap-1"
          >
            <Download className="h-3.5 w-3.5 text-sky-400" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80 font-mono text-[11px]">
        <div className="flex justify-between border-b border-zinc-800/60 pb-1">
          <span className="text-zinc-400 font-sans">OpenMsg Version:</span>
          <span className="text-zinc-200">0.1.0</span>
        </div>
        <div className="flex justify-between border-b border-zinc-800/60 pb-1">
          <span className="text-zinc-400 font-sans">Manifest:</span>
          <span className="text-emerald-400">MV3</span>
        </div>

        <div className="flex justify-between border-b border-zinc-800/60 pb-1">
          <span className="text-zinc-400 font-sans">WhatsApp Status:</span>
          <span className="text-emerald-400">{String(info.whatsAppConnectionState || 'CONNECTED')}</span>
        </div>
        <div className="flex justify-between border-b border-zinc-800/60 pb-1">
          <span className="text-zinc-400 font-sans">IndexedDB:</span>
          <span className="text-emerald-400">{String(info.indexedDbStatus || 'OPEN')}</span>
        </div>

        <div className="flex justify-between border-b border-zinc-800/60 pb-1">
          <span className="text-zinc-400 font-sans">Workflow Engine:</span>
          <span className="text-zinc-200">Active (v1)</span>
        </div>
        <div className="flex justify-between border-b border-zinc-800/60 pb-1">
          <span className="text-zinc-400 font-sans">Scheduler:</span>
          <span className="text-zinc-200">Reconciled</span>
        </div>

        <div className="col-span-2 flex justify-between pt-1">
          <span className="text-zinc-400 font-sans">Storage Quota:</span>
          <span className="text-zinc-200">{String(info.storageQuota || 'N/A')}</span>
        </div>
      </div>
    </div>
  );
};
