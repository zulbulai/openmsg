import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  Bell,
  Save,
  Search,
  Repeat,
} from 'lucide-react';
import { Contact, FollowUpType, FollowUpPriority } from '@/storage/schemas';
import { db } from '@/storage/db';
import { FollowUpService, CreateFollowUpInput } from '@/core/crm/followup.service';
import { FollowUpRepository } from '@/storage/repositories/followup.repository';
import type { FollowUp, FollowUpSource } from '@/storage/schemas';

const FOLLOW_UP_TYPES: { value: FollowUpType; label: string; icon: string }[] = [
  { value: 'CALL', label: 'Call', icon: '📞' },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: '💬' },
  { value: 'MEETING', label: 'Meeting', icon: '🤝' },
  { value: 'PAYMENT', label: 'Payment', icon: '💰' },
  { value: 'QUOTE', label: 'Quotation', icon: '📋' },
  { value: 'ORDER', label: 'Order', icon: '📦' },
  { value: 'GENERAL', label: 'General', icon: '📌' },
  { value: 'CUSTOM', label: 'Custom', icon: '✏️' },
];

const PRIORITIES: { value: FollowUpPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'text-zinc-400' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-blue-400' },
  { value: 'HIGH', label: 'High', color: 'text-amber-400' },
  { value: 'URGENT', label: 'Urgent', color: 'text-red-400' },
];

const REMINDER_OPTIONS = [
  { value: -1, label: 'No reminder' },
  { value: 0, label: 'At due time' },
  { value: 5, label: '5 minutes before' },
  { value: 10, label: '10 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
];

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  preselectedContactId?: string;
  preselectedConversationId?: string;
  editingFollowUp?: FollowUp | null;
  source?: FollowUpSource;
  initialDueAt?: number;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  preselectedContactId,
  preselectedConversationId,
  editingFollowUp,
  source = 'MANUAL',
  initialDueAt,
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [contactId, setContactId] = useState(preselectedContactId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<FollowUpType>('GENERAL');
  const [priority, setPriority] = useState<FollowUpPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [notes, setNotes] = useState('');
  const [autoCompleteOnReply, setAutoCompleteOnReply] = useState(false);
  const [enableRecurrence, setEnableRecurrence] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'>('WEEKLY');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    db.contacts.toArray().then(setContacts);
  }, []);

  useEffect(() => {
    if (editingFollowUp) {
      setContactId(editingFollowUp.contactId);
      setTitle(editingFollowUp.title);
      setDescription(editingFollowUp.description || '');
      setType(editingFollowUp.type);
      setPriority(editingFollowUp.priority);
      setNotes(editingFollowUp.notes || '');
      setAutoCompleteOnReply(editingFollowUp.autoCompleteOnReply || false);
      setReminderMinutes(editingFollowUp.reminderMinutesBefore ?? 30);

      const due = new Date(editingFollowUp.dueAt);
      setDueDate(due.toISOString().split('T')[0]);
      setDueTime(due.toTimeString().slice(0, 5));

      if (editingFollowUp.recurrence) {
        setEnableRecurrence(true);
        setRecurrenceFreq(editingFollowUp.recurrence.frequency);
        setRecurrenceInterval(editingFollowUp.recurrence.interval);
      }
    } else {
      // Defaults
      setContactId(preselectedContactId || '');
      setTitle('');
      setDescription('');
      setType('GENERAL');
      setPriority('MEDIUM');
      setNotes('');
      setAutoCompleteOnReply(false);
      setEnableRecurrence(false);

      // Load defaults from settings
      FollowUpRepository.getSettings().then((s) => {
        setPriority(s.defaultPriority);
        setReminderMinutes(s.defaultReminderMinutes);
      });

      // Default due date
      if (initialDueAt) {
        const initialDate = new Date(initialDueAt);
        setDueDate(initialDate.toISOString().split('T')[0]);
        setDueTime('10:00');
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDueDate(tomorrow.toISOString().split('T')[0]);
        setDueTime('10:00');
      }
    }
  }, [editingFollowUp, preselectedContactId, isOpen, initialDueAt]);

  if (!isOpen) return null;

  const filteredContacts = contacts.filter((c) => {
    if (!contactSearch) return true;
    const q = contactSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId || !title.trim() || !dueDate || !dueTime) return;

    setIsSaving(true);
    try {
      const dueAt = new Date(`${dueDate}T${dueTime}`).getTime();
      const recurrence = enableRecurrence
        ? { frequency: recurrenceFreq, interval: recurrenceInterval, currentOccurrence: 0 }
        : undefined;

      if (editingFollowUp) {
        await FollowUpService.edit(editingFollowUp.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          type,
          priority,
          dueAt,
          reminderMinutesBefore: reminderMinutes >= 0 ? reminderMinutes : undefined,
          notes: notes.trim() || undefined,
          autoCompleteOnReply,
          recurrence,
        });
      } else {
        const input: CreateFollowUpInput = {
          contactId,
          conversationId: preselectedConversationId,
          title: title.trim(),
          description: description.trim() || undefined,
          type,
          priority,
          dueAt,
          reminderMinutesBefore: reminderMinutes >= 0 ? reminderMinutes : undefined,
          notes: notes.trim() || undefined,
          source,
          autoCompleteOnReply,
          recurrence,
        };
        await FollowUpService.create(input);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save follow-up:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedContact = contacts.find((c) => c.id === contactId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Bell className="h-4 w-4 text-emerald-400" />
            {editingFollowUp ? 'Edit Follow-up' : 'Create Follow-up'}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
          {/* Contact Selector */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Contact *</label>
            {selectedContact ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800 border border-zinc-700">
                <div className="h-7 w-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold">
                  {selectedContact.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-zinc-100 truncate">{selectedContact.name}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">{selectedContact.phone}</div>
                </div>
                <button type="button" onClick={() => setContactId('')} className="text-zinc-500 hover:text-zinc-300">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                {contactSearch && (
                  <div className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg">
                    {filteredContacts.slice(0, 10).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setContactId(c.id); setContactSearch(''); }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-700 flex items-center gap-2"
                      >
                        <span className="text-zinc-100 font-semibold">{c.name}</span>
                        <span className="text-zinc-500 font-mono">{c.phone}</span>
                      </button>
                    ))}
                    {filteredContacts.length === 0 && (
                      <div className="px-3 py-2 text-xs text-zinc-500">No contacts found</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Call regarding quotation"
              className="w-full px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {/* Type & Priority Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as FollowUpType)}
                className="w-full px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                {FOLLOW_UP_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as FollowUpPriority)}
                className="w-full px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1 flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" /> Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Time *
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Reminder */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1 flex items-center gap-1">
              <Bell className="h-3 w-3" /> Reminder
            </label>
            <select
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              {REMINDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional detailed notes..."
              rows={2}
              className="w-full px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Internal Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Private notes..."
              rows={2}
              className="w-full px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Auto-complete on Reply */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoCompleteOnReply}
              onChange={(e) => setAutoCompleteOnReply(e.target.checked)}
              className="accent-emerald-500"
            />
            <span className="text-xs text-zinc-300">Auto-complete when customer replies</span>
          </label>

          {/* Recurrence */}
          <div className="border-t border-zinc-800 pt-3">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={enableRecurrence}
                onChange={(e) => setEnableRecurrence(e.target.checked)}
                className="accent-emerald-500"
              />
              <span className="text-xs text-zinc-300 flex items-center gap-1">
                <Repeat className="h-3 w-3" /> Recurring follow-up
              </span>
            </label>
            {enableRecurrence && (
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={recurrenceFreq}
                  onChange={(e) => setRecurrenceFreq(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM')}
                  className="px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="CUSTOM">Custom (hours)</option>
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Every</span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(Number(e.target.value) || 1)}
                    className="w-16 px-2 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-zinc-500">
                    {recurrenceFreq === 'DAILY' ? 'day(s)' : recurrenceFreq === 'WEEKLY' ? 'week(s)' : recurrenceFreq === 'MONTHLY' ? 'month(s)' : 'hour(s)'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !contactId || !title.trim() || !dueDate || !dueTime}
              className="px-4 py-2 text-xs rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1.5 transition"
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? 'Saving...' : editingFollowUp ? 'Update' : 'Create Follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
