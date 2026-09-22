import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Play,
  Key,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { WebhookConfig } from '@/storage/schemas';
import { db } from '@/storage/db';
import { WebhookModal } from './WebhookModal';
import { WebhookDispatcher } from '@/core/webhook/dispatcher';

export const WebhookManager: React.FC = () => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(
    null
  );

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setIsLoading(true);
      const all = await db.webhooks.toArray();
      setWebhooks(all);
    } catch (err) {
      console.error('Failed to load webhooks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (webhook: WebhookConfig) => {
    const updated = { ...webhook, enabled: !webhook.enabled };
    await db.webhooks.put(updated);
    setWebhooks((prev) => prev.map((w) => (w.id === webhook.id ? updated : w)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this webhook endpoint?')) return;
    await db.webhooks.delete(id);
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  };

  const handleTestDelivery = async (webhook: WebhookConfig) => {
    setTestingId(webhook.id);
    setTestResult(null);
    try {
      await WebhookDispatcher.dispatch('TEST_EVENT', {
        test: true,
        timestamp: Date.now(),
        message: 'Hello from OpenMsg Webhook Test Dispatcher',
      });

      setTestResult({
        id: webhook.id,
        success: true,
        message: 'Test payload dispatched with HMAC signature.',
      });
    } catch (err: any) {
      setTestResult({
        id: webhook.id,
        success: false,
        message: err?.message || 'Delivery failed.',
      });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 p-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Globe className="h-6 w-6 text-orange-400" />
            Outbound Webhooks
          </h1>
          <p className="text-xs text-zinc-400">
            Stream WhatsApp messages, contact updates, and workflow completions to external servers.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingWebhook(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-orange-950/40"
        >
          <Plus className="h-4 w-4" />
          <span>New Webhook</span>
        </button>
      </div>

      {/* Security Architecture Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-orange-950/20 border border-orange-500/20 rounded-2xl text-xs text-zinc-300">
        <ShieldCheck className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-zinc-100">Cryptographic Signing &amp; SSRF Protection</p>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            All outbound payloads include the <code className="font-mono text-orange-300">X-OpenMsg-Signature</code> header
            computed using HMAC-SHA256. The built-in SSRF Guard blocks attempts to target private networks, localhost, or link-local metadata addresses.
          </p>
        </div>
      </div>

      {/* Webhooks List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-zinc-500">Loading webhooks...</div>
        ) : webhooks.length === 0 ? (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-12 text-center space-y-3">
            <Globe className="h-10 w-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-300">No Webhooks Configured</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Connect OpenMsg to your CRM, Slack, Zapier, or internal backend by adding a webhook destination.
            </p>
            <button
              onClick={() => {
                setEditingWebhook(null);
                setModalOpen(true);
              }}
              className="px-4 py-2 bg-orange-600/20 text-orange-400 border border-orange-500/30 hover:bg-orange-600/30 rounded-xl text-xs font-semibold transition"
            >
              Configure First Webhook
            </button>
          </div>
        ) : (
          webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-zinc-100 truncate">{webhook.name}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      webhook.enabled
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700/50'
                    }`}
                  >
                    {webhook.enabled ? 'ACTIVE' : 'DISABLED'}
                  </span>

                  {webhook.secret && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700/50 flex items-center gap-1">
                      <Key className="h-2.5 w-2.5 text-orange-400" />
                      <span>Signed</span>
                    </span>
                  )}
                </div>

                {/* URL */}
                <p className="text-xs font-mono text-zinc-400 truncate flex items-center gap-1.5">
                  <span className="text-zinc-600">POST</span>
                  <span className="text-zinc-300">{webhook.url}</span>
                </p>

                {/* Events list */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {webhook.events.map((ev) => (
                    <span
                      key={ev}
                      className="text-[10px] bg-zinc-950 px-2 py-0.5 rounded text-zinc-400 border border-zinc-800 font-mono"
                    >
                      {ev}
                    </span>
                  ))}
                </div>

                {/* Test Feedback */}
                {testResult && testResult.id === webhook.id && (
                  <div
                    className={`text-[11px] p-2 rounded-lg mt-2 flex items-center gap-1.5 ${
                      testResult.success
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleTestDelivery(webhook)}
                  disabled={testingId === webhook.id}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30 hover:bg-orange-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Play className="h-3 w-3" />
                  <span>{testingId === webhook.id ? 'Sending...' : 'Test Send'}</span>
                </button>

                <button
                  onClick={() => handleToggle(webhook)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                    webhook.enabled
                      ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
                      : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30'
                  }`}
                >
                  {webhook.enabled ? 'Disable' : 'Enable'}
                </button>

                <button
                  onClick={() => {
                    setEditingWebhook(webhook);
                    setModalOpen(true);
                  }}
                  className="p-2 text-zinc-400 hover:text-zinc-200 bg-zinc-800/60 hover:bg-zinc-800 rounded-xl border border-zinc-750 transition"
                  title="Edit Webhook"
                >
                  <Edit2 className="h-4 w-4" />
                </button>

                <button
                  onClick={() => handleDelete(webhook.id)}
                  className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/20 transition"
                  title="Delete Webhook"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <WebhookModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadWebhooks}
        initialWebhook={editingWebhook}
      />
    </div>
  );
};
