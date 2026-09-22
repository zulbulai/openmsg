import React, { useState, useEffect } from 'react';
import { X, Clock, Send, User, FileText } from 'lucide-react';
import { Contact, MessageTemplate, ScheduledMessage } from '@/storage/schemas';
import { db } from '@/storage/db';
import { AlarmManager } from '@/background/alarms';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  preselectedContactId?: string;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  preselectedContactId,
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  const [contactId, setContactId] = useState(preselectedContactId || '');
  const [messageText, setMessageText] = useState('');
  const [recurrence, setRecurrence] = useState<'once' | 'daily' | 'weekly' | 'custom'>('once');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      db.contacts.toArray().then(setContacts);
      db.templates.toArray().then(setTemplates);

      // Default scheduled date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(tomorrow.toISOString().split('T')[0]);

      if (preselectedContactId) {
        setContactId(preselectedContactId);
      }
    }
  }, [isOpen, preselectedContactId]);

  if (!isOpen) return null;

  const calculateTriggerTimestamp = (): number => {
    const [hours, minutes] = scheduledTime.split(':').map(Number);

    if (recurrence === 'once') {
      const date = new Date(scheduledDate);
      date.setHours(hours || 0, minutes || 0, 0, 0);
      return date.getTime();
    }

    // For recurring, calculate next occurrence
    const now = new Date();
    const target = new Date();
    target.setHours(hours || 0, minutes || 0, 0, 0);

    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    if (recurrence === 'weekly' || recurrence === 'custom') {
      // Find next matching day
      while (!selectedDays.includes(target.getDay())) {
        target.setDate(target.getDate() + 1);
      }
    }

    return target.getTime();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId.trim() || !messageText.trim()) return;

    setIsSubmitting(true);
    try {
      const triggerAt = calculateTriggerTimestamp();
      const id = `sched_${Date.now()}`;

      const scheduledItem: ScheduledMessage = {
        id,
        contactId: contactId.trim(),
        messageText: messageText.trim(),
        triggerAt,
        status: 'pending',
        recurrence,
        recurrenceConfig: {
          timeOfDay: scheduledTime,
          daysOfWeek: selectedDays,
        },
        createdAt: Date.now(),
      };

      await db.scheduledMessages.put(scheduledItem);

      // Register persistent alarm in Chrome alarms API
      AlarmManager.schedule(id, triggerAt);

      await db.auditLogs.add({
        id: `audit_${Date.now()}`,
        timestamp: Date.now(),
        eventType: 'SCHEDULE_MESSAGE',
        actor: 'USER',
        description: `Scheduled message for contact ${contactId} at ${new Date(triggerAt).toLocaleString()}`,
      });

      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to schedule message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Schedule Message</h2>
              <p className="text-[11px] text-zinc-400">
                Persistent alarm queue surviving service worker restart
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
          {/* Recipient Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-zinc-400" />
              <span>Recipient Contact</span>
            </label>
            <select
              required
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="">Select a contact...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.phone} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Schedule Recurrence Type */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Schedule Recurrence</label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px]">
              {(['once', 'daily', 'weekly', 'custom'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRecurrence(r)}
                  className={`py-1.5 rounded-lg font-medium capitalize transition ${
                    recurrence === r
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time Pickers */}
          {recurrence === 'once' ? (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Date</label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Time</label>
                <input
                  type="time"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Time of Day</label>
                <input
                  type="time"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {(recurrence === 'weekly' || recurrence === 'custom') && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Days of Week</label>
                  <div className="flex gap-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name, idx) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={`flex-1 py-1.5 text-[11px] rounded-lg font-medium border transition ${
                          selectedDays.includes(idx)
                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                            : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Template Selector */}
          {templates.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-zinc-400" />
                <span>Insert Template</span>
              </label>
              <select
                onChange={(e) => {
                  const t = templates.find((tpl) => tpl.id === e.target.value);
                  if (t) setMessageText(t.content);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select a template to insert...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Message Text */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">Message Content</label>
              <span className="text-[10px] text-zinc-500">&#123;&#123;contact.name&#125;&#125;</span>
            </div>
            <textarea
              rows={4}
              required
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Hi {{contact.name}}, this is a scheduled reminder..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500 resize-none font-sans"
            />
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
              disabled={isSubmitting || !contactId.trim() || !messageText.trim()}
              className="px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-cyan-950/40"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Schedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
