import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Send,
  Calendar,
  User,
  Filter,
} from 'lucide-react';
import { ScheduledMessage, Contact } from '@/storage/schemas';
import { db } from '@/storage/db';
import { ScheduleModal } from './ScheduleModal';
import { AlarmManager } from '@/background/alarms';
import { getWhatsAppClient } from '@/content/whatsapp';
import { messageQueue } from '@/core/rate-limiter/queue';

export const SchedulerManager: React.FC = () => {
  const [tasks, setTasks] = useState<ScheduledMessage[]>([]);
  const [contactsMap, setContactsMap] = useState<Map<string, Contact>>(new Map());
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'cancelled'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const client = getWhatsAppClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [allTasks, allContacts] = await Promise.all([
        db.scheduledMessages.reverse().toArray(),
        db.contacts.toArray(),
      ]);

      setTasks(allTasks);
      const cMap = new Map<string, Contact>();
      allContacts.forEach((c) => cMap.set(c.id, c));
      setContactsMap(cMap);
    } catch (err) {
      console.error('Failed to load scheduled tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (task: ScheduledMessage) => {
    AlarmManager.cancel(task.id);
    const updated: ScheduledMessage = { ...task, status: 'cancelled' };
    await db.scheduledMessages.put(updated);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled task?')) return;
    AlarmManager.cancel(id);
    await db.scheduledMessages.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSendNow = async (task: ScheduledMessage) => {
    try {
      messageQueue.enqueue(task.id, () =>
        client.sendText({
          chatId: task.contactId,
          text: task.messageText,
        })
      );

      const updated: ScheduledMessage = { ...task, status: 'sent' };
      await db.scheduledMessages.put(updated);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      console.error('Immediate dispatch failed:', err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'all') return true;
    const st = t.status.toLowerCase();
    return st === filter;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 p-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Clock className="h-6 w-6 text-cyan-400" />
            Scheduled Messages &amp; Tasks
          </h1>
          <p className="text-xs text-zinc-400">
            Durable message queue powered by Chrome Alarms and Dexie IndexedDB.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-cyan-950/40"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Message</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 text-xs">
        <Filter className="h-4 w-4 text-zinc-500 mr-1" />
        {(['all', 'pending', 'sent', 'cancelled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg font-medium capitalize transition ${
              filter === tab
                ? 'bg-zinc-800 text-cyan-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-zinc-500">Loading scheduled tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-12 text-center space-y-3">
            <Clock className="h-10 w-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-300">No Scheduled Messages</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Plan ahead by scheduling reminders, greetings, or follow-ups to be dispatched automatically.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30 rounded-xl text-xs font-semibold transition"
            >
              Schedule First Message
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const contact = contactsMap.get(task.contactId);
            const isPending = task.status.toLowerCase() === 'pending';
            const isSent = task.status.toLowerCase() === 'sent';

            return (
              <div
                key={task.id}
                className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 transition flex items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5 truncate">
                      <User className="h-3.5 w-3.5 text-zinc-400" />
                      <span>{contact ? contact.name || contact.phone : task.contactId}</span>
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border uppercase ${
                        isPending
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          : isSent
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-500 border-zinc-700/50'
                      }`}
                    >
                      {task.status}
                    </span>

                    {task.recurrence && task.recurrence !== 'once' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 capitalize">
                        {task.recurrence}
                      </span>
                    )}
                  </div>

                  {/* Message Preview */}
                  <p className="text-xs text-zinc-300 line-clamp-2 font-sans bg-zinc-950/60 p-2 rounded-lg border border-zinc-850">
                    {task.messageText}
                  </p>

                  {/* Time info */}
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(task.triggerAt).toLocaleString()}</span>
                    </span>
                    <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isPending && (
                    <>
                      <button
                        onClick={() => handleSendNow(task)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30 transition flex items-center gap-1.5"
                      >
                        <Send className="h-3 w-3" />
                        <span>Send Now</span>
                      </button>

                      <button
                        onClick={() => handleCancel(task)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200 transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/20 transition"
                    title="Delete Task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ScheduleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
      />
    </div>
  );
};
