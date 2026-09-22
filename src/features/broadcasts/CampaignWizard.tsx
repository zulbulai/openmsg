import React, { useState, useEffect } from 'react';
import { X, Send, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Contact, BroadcastCampaign, BroadcastRecipient } from '@/storage/schemas';
import { db } from '@/storage/db';
import { SafeTemplate } from '@/core/template/safe-template';
import { messageQueue } from '@/core/rate-limiter/queue';
import { getWhatsAppClient } from '@/content/whatsapp';

interface CampaignWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const CampaignWizard: React.FC<CampaignWizardProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [messageText, setMessageText] = useState('');

  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [matchedContacts, setMatchedContacts] = useState<Contact[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    db.contacts.toArray().then(setAllContacts);
  }, [isOpen]);

  // Recalculate audience
  useEffect(() => {
    let filtered = allContacts.filter((c) => !c.isGroup);
    if (selectedStage !== 'all') {
      filtered = filtered.filter((c) => c.stageId === selectedStage);
    }
    setMatchedContacts(filtered);
  }, [allContacts, selectedStage]);

  if (!isOpen) return null;

  const handleLaunch = async () => {
    if (matchedContacts.length === 0) {
      alert('Cannot launch campaign with 0 recipients.');
      return;
    }

    setIsSubmitting(true);
    try {
      const campaignId = `camp_${Date.now()}`;
      const campaign: BroadcastCampaign = {
        id: campaignId,
        name: name.trim() || `Campaign ${new Date().toLocaleDateString()}`,
        status: 'RUNNING',
        messageText,
        recipientFilter: {
          stageId: selectedStage !== 'all' ? selectedStage : undefined,
        },
        totalRecipients: matchedContacts.length,
        sentCount: 0,
        failedCount: 0,
        createdAt: Date.now(),
      };

      await db.broadcastCampaigns.put(campaign);

      // Create recipients in IndexedDB and enqueue in anti-ban rate limiter
      const client = getWhatsAppClient();

      for (const contact of matchedContacts) {
        const recipRecord: BroadcastRecipient = {
          id: `${campaignId}:${contact.id}`,
          campaignId,
          contactId: contact.id,
          status: 'PENDING',
        };
        await db.broadcastRecipients.put(recipRecord);

        // Enqueue into rate limiter with anti-ban jitter
        messageQueue.enqueue(
          `msg_${campaignId}_${contact.id}`,
          async () => {
            const rendered = SafeTemplate.render(messageText, {
              contact: { name: contact.name, phone: contact.phone, id: contact.id },
            });
            await client.sendText({
              chatId: contact.id,
              text: rendered,
            });
            await db.broadcastRecipients.update(recipRecord.id, {
              status: 'SENT',
              sentAt: Date.now(),
            });
            await db.broadcastCampaigns.where('id').equals(campaignId).modify((c) => {
              c.sentCount += 1;
              if (c.sentCount + c.failedCount >= c.totalRecipients) {
                c.status = 'COMPLETED';
              }
            });
          },
          {
            onError: async (err) => {
              await db.broadcastRecipients.update(recipRecord.id, {
                status: 'FAILED',
                error: err.message,
              });
              await db.broadcastCampaigns.where('id').equals(campaignId).modify((c) => {
                c.failedCount += 1;
              });
            },
          }
        );
      }

      onCreated();
      onClose();
    } catch (err: any) {
      alert(`Launch error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleContact = matchedContacts[0] || { name: 'Alex Smith', phone: '+15551234567' };
  const previewText = SafeTemplate.render(messageText, { contact: sampleContact as any });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* Wizard Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-400" />
              New Broadcast Campaign
            </h3>
            <span className="text-[11px] text-zinc-400">Step {step} of 3</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-800 text-zinc-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Wizard Step Body */}
        <div className="p-6 flex flex-col gap-4 min-h-[280px]">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="font-semibold text-zinc-200 block mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer Promo 2026"
                  className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-2 text-zinc-100"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-200 block mb-1">Target Audience Stage</label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg px-3 py-2 text-zinc-200"
                >
                  <option value="all">All Direct Contacts ({allContacts.length})</option>
                  <option value="lead">Leads</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="customer">Customers</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Selected Recipients:</span>
                <span className="text-emerald-400 font-bold text-sm">{matchedContacts.length} Contacts</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="font-semibold text-zinc-200 block mb-1">Broadcast Message Content</label>
                <textarea
                  rows={5}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Hi {{contact.name}}, check out our new update!"
                  className="w-full bg-zinc-950 border border-zinc-700/60 rounded-lg p-3 text-zinc-100 placeholder-zinc-500"
                />
                <span className="text-[10px] text-zinc-400">
                  Use {'{{contact.name}}'}, {'{{contact.phone}}'} for personalized messages.
                </span>
              </div>

              {messageText && (
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Live Preview</span>
                  <p className="text-zinc-200 whitespace-pre-wrap">{previewText}</p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>
                  Anti-ban protection active: Dispatches with randomized 3s–8s interval and 250 sends/hr cap.
                </span>
              </div>

              <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950 flex flex-col gap-2">
                <div className="flex justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-zinc-400">Campaign Name:</span>
                  <span className="text-zinc-200 font-semibold">{name || 'Untitled Campaign'}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-zinc-400">Total Recipients:</span>
                  <span className="text-emerald-400 font-bold">{matchedContacts.length} Contacts</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-zinc-400">Estimated Duration:</span>
                  <span className="text-zinc-200">
                    ~{Math.round((matchedContacts.length * 5) / 60)} minutes
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-3 py-1.5 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 2 && !messageText.trim()) {
                  alert('Message text is required.');
                  return;
                }
                setStep((s) => s + 1);
              }}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-1"
            >
              Next Step
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLaunch}
              disabled={isSubmitting || matchedContacts.length === 0}
              className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-950"
            >
              <Send className="h-3.5 w-3.5" />
              {isSubmitting ? 'Starting...' : 'Start Broadcast Queue'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
