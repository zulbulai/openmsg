import React, { useState, useEffect } from 'react';
import {
  Send,
  Plus,
  Play,
  Pause,
  Trash2,
} from 'lucide-react';
import { BroadcastCampaign } from '@/storage/schemas';
import { db } from '@/storage/db';
import { CampaignWizard } from './CampaignWizard';
import { messageQueue } from '@/core/rate-limiter/queue';

export const BroadcastManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isQueuePaused, setIsQueuePaused] = useState(messageQueue.isPausedState);

  const loadCampaigns = async () => {
    const list = await db.broadcastCampaigns.reverse().sortBy('createdAt');
    setCampaigns(list);
  };

  useEffect(() => {
    loadCampaigns();
    const interval = setInterval(() => {
      loadCampaigns();
      setIsQueuePaused(messageQueue.isPausedState);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleQueuePause = () => {
    if (isQueuePaused) {
      messageQueue.resume();
      setIsQueuePaused(false);
    } else {
      messageQueue.pause();
      setIsQueuePaused(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this broadcast campaign record?')) {
      await db.broadcastCampaigns.delete(id);
      await db.broadcastRecipients.where('campaignId').equals(id).delete();
      await loadCampaigns();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 p-6 overflow-y-auto text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Send className="h-5 w-5 text-emerald-400" />
            Broadcast Campaigns & Dispatch Queue
          </h2>
          <p className="text-zinc-400 text-xs mt-0.5">
            Bulk mass messaging with anti-ban rate limiting and real-time delivery telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Global Queue Pause / Resume */}
          <button
            onClick={handleToggleQueuePause}
            className={`px-3 py-2 rounded-lg border font-semibold flex items-center gap-1.5 transition ${
              isQueuePaused
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            {isQueuePaused ? (
              <>
                <Play className="h-3.5 w-3.5" /> Resume Dispatch
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5" /> Pause Dispatch
              </>
            )}
          </button>

          <button
            onClick={() => setIsWizardOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="flex flex-col gap-4">
        {campaigns.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/20 flex flex-col items-center">
            <Send className="h-12 w-12 text-zinc-600 mb-3" />
            <h3 className="text-sm font-bold text-zinc-300">No Broadcast Campaigns</h3>
            <p className="text-zinc-500 text-xs max-w-sm mt-1 mb-4">
              Create a targeted broadcast campaign to send personalized messages to customer groups.
            </p>
            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium transition"
            >
              Launch First Campaign
            </button>
          </div>
        ) : (
          campaigns.map((camp) => {
            const percent =
              camp.totalRecipients > 0
                ? Math.round(((camp.sentCount + camp.failedCount) / camp.totalRecipients) * 100)
                : 0;

            return (
              <div
                key={camp.id}
                className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition flex flex-col gap-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100">{camp.name}</h4>
                    <span className="text-[11px] text-zinc-500">
                      Created on {new Date(camp.createdAt).toLocaleDateString()} at{' '}
                      {new Date(camp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        camp.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : camp.status === 'RUNNING'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20 animate-pulse'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {camp.status}
                    </span>

                    <button
                      onClick={() => handleDelete(camp.id)}
                      className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 rounded transition"
                      title="Delete Campaign"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>
                      {camp.sentCount} of {camp.totalRecipients} sent ({camp.failedCount} failed)
                    </span>
                    <span className="font-semibold text-zinc-200">{percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${(camp.sentCount / (camp.totalRecipients || 1)) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-rose-500 transition-all duration-500"
                      style={{
                        width: `${(camp.failedCount / (camp.totalRecipients || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Message preview snippet */}
                <p className="text-[11px] text-zinc-400 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80 truncate">
                  &quot;{camp.messageText}&quot;
                </p>
              </div>
            );
          })
        )}
      </div>

      <CampaignWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCreated={loadCampaigns}
      />
    </div>
  );
};
