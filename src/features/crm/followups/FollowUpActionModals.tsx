import React, { useState } from 'react';
import { X, CheckCircle2, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { FollowUpService } from '@/core/crm/followup.service';
import type { FollowUp } from '@/storage/schemas';

// ── Completion Modal ────────────────────────────────────────────────────────

interface CompletionModalProps {
  isOpen: boolean;
  followUp: FollowUp;
  onClose: () => void;
  onCompleted: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  followUp,
  onClose,
  onCompleted,
}) => {
  const [completionNote, setCompletionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await FollowUpService.complete(followUp.id, completionNote.trim() || undefined);
      onCompleted();
      onClose();
    } catch (err) {
      console.error('Failed to complete follow-up:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Complete Follow-up
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <p className="text-xs text-zinc-300">
            Completing: <span className="font-semibold text-zinc-100">{followUp.title}</span>
          </p>

          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">
              Completion Note (optional)
            </label>
            <textarea
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              placeholder="Add a note about this follow-up..."
              rows={3}
              className="w-full px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 font-semibold flex items-center gap-1.5 transition"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isSubmitting ? 'Completing...' : 'Complete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Snooze Modal ────────────────────────────────────────────────────────────

const SNOOZE_PRESETS = [
  { label: '10 minutes', ms: 10 * 60 * 1000 },
  { label: '30 minutes', ms: 30 * 60 * 1000 },
  { label: '1 hour', ms: 60 * 60 * 1000 },
  { label: '2 hours', ms: 2 * 60 * 60 * 1000 },
];

interface SnoozeModalProps {
  isOpen: boolean;
  followUp: FollowUp;
  onClose: () => void;
  onSnoozed: () => void;
}

export const SnoozeModal: React.FC<SnoozeModalProps> = ({
  isOpen,
  followUp,
  onClose,
  onSnoozed,
}) => {
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSnoozePreset = async (ms: number) => {
    setIsSubmitting(true);
    try {
      const snoozedUntil = Date.now() + ms;
      await FollowUpService.snooze(followUp.id, snoozedUntil);
      onSnoozed();
      onClose();
    } catch (err) {
      console.error('Failed to snooze:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSnoozeTomorrow = async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    await handleSnoozePreset(tomorrow.getTime() - Date.now());
  };

  const handleSnoozeCustom = async () => {
    if (!customDate || !customTime) return;
    setIsSubmitting(true);
    try {
      const snoozedUntil = new Date(`${customDate}T${customTime}`).getTime();
      await FollowUpService.snooze(followUp.id, snoozedUntil);
      onSnoozed();
      onClose();
    } catch (err) {
      console.error('Failed to snooze:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            Snooze Follow-up
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <p className="text-xs text-zinc-400 mb-1">
            Snooze: <span className="text-zinc-200 font-semibold">{followUp.title}</span>
          </p>

          {/* Quick Presets */}
          <div className="grid grid-cols-2 gap-2">
            {SNOOZE_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => handleSnoozePreset(p.ms)}
                disabled={isSubmitting}
                className="px-3 py-2 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition disabled:opacity-40"
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={handleSnoozeTomorrow}
              disabled={isSubmitting}
              className="px-3 py-2 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition disabled:opacity-40 col-span-2"
            >
              Tomorrow 9:00 AM
            </button>
          </div>

          {/* Custom Date/Time */}
          <div className="border-t border-zinc-800 pt-3">
            <label className="text-xs font-semibold text-zinc-400 block mb-2">Custom</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={handleSnoozeCustom}
              disabled={isSubmitting || !customDate || !customTime}
              className="mt-2 w-full px-3 py-2 text-xs rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 disabled:opacity-40 font-semibold transition"
            >
              Snooze to Custom Time
            </button>
          </div>

          <button
            onClick={onClose}
            className="mt-1 w-full px-3 py-2 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Reschedule Modal ────────────────────────────────────────────────────────

interface RescheduleModalProps {
  isOpen: boolean;
  followUp: FollowUp;
  onClose: () => void;
  onRescheduled: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  followUp,
  onClose,
  onRescheduled,
}) => {
  const currentDue = new Date(followUp.dueAt);
  const [newDate, setNewDate] = useState(currentDue.toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState(currentDue.toTimeString().slice(0, 5));
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newTime) return;
    setIsSubmitting(true);
    try {
      const newDueAt = new Date(`${newDate}T${newTime}`).getTime();
      await FollowUpService.reschedule(followUp.id, newDueAt);
      onRescheduled();
      onClose();
    } catch (err) {
      console.error('Failed to reschedule:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setNewDate(d.toISOString().split('T')[0]);
  };

  const setNextWeek = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setNewDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-blue-400" />
            Reschedule Follow-up
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleReschedule} className="p-5 flex flex-col gap-4">
          <p className="text-xs text-zinc-400">
            Current: <span className="text-zinc-200">{currentDue.toLocaleString()}</span>
          </p>

          <div className="flex items-center gap-2">
            <button type="button" onClick={setTomorrow} className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition">
              Tomorrow
            </button>
            <button type="button" onClick={setNextWeek} className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition">
              Next Week
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">New Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">New Time</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-40 font-semibold flex items-center gap-1.5 transition"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {isSubmitting ? 'Rescheduling...' : 'Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
