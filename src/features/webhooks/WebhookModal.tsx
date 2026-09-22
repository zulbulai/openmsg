import React, { useState, useEffect } from 'react';
import { X, Globe, Key, ShieldCheck, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { WebhookConfig } from '@/storage/schemas';
import { db } from '@/storage/db';
import { SSRFGuard } from '@/core/security/ssrf';

interface WebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialWebhook?: WebhookConfig | null;
}

const AVAILABLE_EVENTS = [
  { id: 'MESSAGE_RECEIVED', label: 'Message Received (Inbound)' },
  { id: 'MESSAGE_SENT', label: 'Message Sent (Outbound)' },
  { id: 'CONTACT_CREATED', label: 'Contact Created / Updated' },
  { id: 'TAG_ADDED', label: 'Tag Assigned to Contact' },
  { id: 'WORKFLOW_COMPLETED', label: 'Workflow Execution Completed' },
  { id: 'CAMPAIGN_FINISHED', label: 'Broadcast Campaign Finished' },
];

export const WebhookModal: React.FC<WebhookModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialWebhook,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [events, setEvents] = useState<string[]>(['MESSAGE_RECEIVED']);
  const [enabled, setEnabled] = useState(true);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialWebhook?.name || '');
      setUrl(initialWebhook?.url || '');
      setSecret(initialWebhook?.secret || '');
      setEvents(initialWebhook?.events || ['MESSAGE_RECEIVED']);
      setEnabled(initialWebhook?.enabled ?? true);
      setUrlError(null);
    }
  }, [isOpen, initialWebhook]);

  if (!isOpen) return null;

  const generateSecret = () => {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    const sec = Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
    setSecret(sec);
  };

  const handleUrlChange = (val: string) => {
    setUrl(val);
    if (!val.trim()) {
      setUrlError(null);
      return;
    }
    const check = SSRFGuard.validateUrl(val);
    setUrlError(check.allowed ? null : check.reason || 'Invalid URL');
  };

  const toggleEvent = (eventId: string) => {
    setEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  };

  const toggleAllEvents = () => {
    if (events.length === AVAILABLE_EVENTS.length) {
      setEvents([]);
    } else {
      setEvents(AVAILABLE_EVENTS.map((e) => e.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim() || urlError) return;

    setIsSubmitting(true);
    try {
      const webhook: WebhookConfig = {
        id: initialWebhook?.id || `wh_${Date.now()}`,
        name: name.trim(),
        url: url.trim(),
        secret: secret.trim() || undefined,
        events: events.length > 0 ? events : ['*'],
        enabled,
      };

      await db.webhooks.put(webhook);

      await db.auditLogs.add({
        id: `audit_${Date.now()}`,
        timestamp: Date.now(),
        eventType: initialWebhook ? 'UPDATE_WEBHOOK' : 'CREATE_WEBHOOK',
        actor: 'USER',
        description: `Webhook "${name}" ${initialWebhook ? 'updated' : 'configured'}`,
      });

      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save webhook:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">
                {initialWebhook ? 'Edit Outbound Webhook' : 'New Outbound Webhook'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                HTTP notifications with HMAC-SHA256 signature verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Webhook Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Webhook Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CRM Sync, Zapier Receiver, Internal Slack"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Webhook URL with SSRF indicator */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">Target Endpoint URL</label>
              <span className="text-[10px] text-zinc-500">SSRF Guard Protected</span>
            </div>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://api.yourcompany.com/webhooks/openmsg"
              className={`w-full bg-zinc-950 border rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none ${
                urlError
                  ? 'border-red-500 focus:border-red-400'
                  : 'border-zinc-800 focus:border-orange-500'
              }`}
            />
            {urlError && <p className="text-[10px] text-red-400">{urlError}</p>}
          </div>

          {/* Secret Token */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                <Key className="h-3 w-3 text-zinc-400" />
                <span>HMAC Secret Key (Optional)</span>
              </label>
              <button
                type="button"
                onClick={generateSecret}
                className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-1"
              >
                <RefreshCw className="h-2.5 w-2.5" />
                <span>Generate</span>
              </button>
            </div>
            <div className="relative flex items-center">
              <input
                type={showSecret ? 'text' : 'password'}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Secret key for X-OpenMsg-Signature verification"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500 pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 text-zinc-400 hover:text-zinc-200"
              >
                {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Subscribed Events */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">Subscribed Events</label>
              <button
                type="button"
                onClick={toggleAllEvents}
                className="text-[10px] text-zinc-400 hover:text-zinc-200"
              >
                {events.length === AVAILABLE_EVENTS.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-1.5">
              {AVAILABLE_EVENTS.map((ev) => (
                <label
                  key={ev.id}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer text-xs transition"
                >
                  <input
                    type="checkbox"
                    checked={events.includes(ev.id)}
                    onChange={() => toggleEvent(ev.id)}
                    className="rounded border-zinc-700 bg-zinc-900 text-orange-500 focus:ring-orange-500/20"
                  />
                  <span className="text-zinc-300">{ev.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !url.trim() || !!urlError}
              className="px-4 py-2 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-orange-950/40"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{initialWebhook ? 'Save Webhook' : 'Create Webhook'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
