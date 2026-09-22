/**
 * OpenMsg CRM Follow-up Management Modal
 * Integrated with AlarmManager and db.scheduledMessages to schedule, complete, and snooze follow-ups.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  CheckCircle2,
  Bell,
  Save,
} from 'lucide-react';
import { Contact, ScheduledMessage } from '@/storage/schemas';
import { db } from '@/storage/db';
import { AlarmManager } from '@/background/alarms';
import { ContactRepository } from '@/storage/repositories/contact.repository';

interface FollowUpModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  contact,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledMessage[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [reminderNote, setReminderNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadTasks = async () => {
    if (!contact) return;
    const tasks = await db.scheduledMessages
      .where('contactId')
      .equals(contact.id)
      .reverse()
      .toArray();
    setScheduledTasks(tasks);

    if (contact.nextFollowUp) {
      const d = new Date(contact.nextFollowUp);
      const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setDueDate(iso);
    } else {
      // Default to tomorrow 10:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const iso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDueDate(iso);
    }
  };

  useEffect(() => {
    if (isOpen && contact) {
      loadTasks();
      setReminderNote('');
    }
  }, [isOpen, contact]);

  if (!isOpen || !contact) return null;

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate) return;

    setIsSaving(true);
    try {
      const triggerAt = new Date(dueDate).getTime();
      const taskId = `followup_${contact.id}_${Date.now()}`;
      const text = reminderNote.trim() || `Follow up with ${contact.name}`;

      // 1. Create or update scheduled message
      await db.scheduledMessages.put({
        id: taskId,
        contactId: contact.id,
        messageText: text,
        triggerAt,
        status: 'pending',
        createdAt: Date.now(),
      });

      // 2. Schedule Chrome alarm
      AlarmManager.schedule(`openmsg:reminder:${taskId}`, triggerAt);

      // 3. Update contact.nextFollowUp
      await ContactRepository.update(contact.id, { nextFollowUp: triggerAt });

      onUpdated();
      onClose();
    } catch (err: any) {
      alert(`Failed to save follow-up: ${err.message || String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async (taskId?: string) => {
    setIsSaving(true);
    try {
      if (taskId) {
        AlarmManager.cancel(`openmsg:reminder:${taskId}`);
        await db.scheduledMessages.update(taskId, { status: 'sent' });
      }

      // Clear nextFollowUp on contact
      await ContactRepository.update(contact.id, { nextFollowUp: undefined });

      // Add timeline note
      await ContactRepository.addNote(contact.id, 'Completed scheduled follow-up');

      await loadTasks();
      onUpdated();
      onClose();
    } catch (err: any) {
      alert(`Failed to complete follow-up: ${err.message || String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSnooze = async (hours: number) => {
    setIsSaving(true);
    try {
      const now = Date.now();
      const newTriggerAt = now + hours * 60 * 60 * 1000;
      const taskId = `followup_${contact.id}_${Date.now()}`;

      await db.scheduledMessages.put({
        id: taskId,
        contactId: contact.id,
        messageText: `Snoozed follow-up with ${contact.name}`,
        triggerAt: newTriggerAt,
        status: 'pending',
        createdAt: now,
      });

      AlarmManager.schedule(`openmsg:reminder:${taskId}`, newTriggerAt);
      await ContactRepository.update(contact.id, { nextFollowUp: newTriggerAt });

      onUpdated();
      onClose();
    } catch (err: any) {
      alert(`Failed to snooze: ${err.message || String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const activeTask = scheduledTasks.find((t) => t.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-zinc-100">
              Follow-up Reminder: {contact.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreateOrUpdate} className="p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Active Reminder Banner */}
          {contact.nextFollowUp && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-300">
                <Bell className="h-4 w-4 shrink-0 text-amber-400" />
                <div>
                  <strong className="block font-semibold">Scheduled Follow-up</strong>
                  <span className="text-[11px] text-zinc-400">
                    {new Date(contact.nextFollowUp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleComplete(activeTask?.id)}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 shrink-0"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Done
              </button>
            </div>
          )}

          {/* Quick Snooze Presets */}
          {contact.nextFollowUp && (
            <div>
              <span className="text-zinc-400 font-semibold block mb-1">Quick Snooze</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSnooze(1)}
                  className="py-1.5 px-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-medium text-center"
                >
                  +1 Hour
                </button>
                <button
                  type="button"
                  onClick={() => handleSnooze(24)}
                  className="py-1.5 px-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-medium text-center"
                >
                  +1 Day
                </button>
                <button
                  type="button"
                  onClick={() => handleSnooze(72)}
                  className="py-1.5 px-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-medium text-center"
                >
                  +3 Days
                </button>
              </div>
            </div>
          )}

          {/* Date & Time Picker */}
          <div>
            <label className="text-zinc-300 font-semibold block mb-1">
              Select Due Date &amp; Time <span className="text-rose-400">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Note / Message Text */}
          <div>
            <label className="text-zinc-300 font-semibold block mb-1">Reminder Instructions / Note</label>
            <textarea
              rows={3}
              value={reminderNote}
              onChange={(e) => setReminderNote(e.target.value)}
              placeholder="e.g. Call regarding commercial pricing and contract sign-off..."
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg p-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Scheduling...' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
