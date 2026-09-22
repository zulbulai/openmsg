import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
  Edit2,
  Trash2,
  XCircle,
  User,
  MessageSquare,
  AlertCircle,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';
import { FollowUp, Contact, FollowUpPriority, FollowUpType } from '@/storage/schemas';
import { FollowUpRepository } from '@/storage/repositories/followup.repository';

const TYPE_ICONS: Record<FollowUpType, string> = {
  CALL: '📞',
  WHATSAPP: '💬',
  MEETING: '🤝',
  PAYMENT: '💰',
  QUOTE: '📋',
  ORDER: '📦',
  GENERAL: '📌',
  CUSTOM: '✏️',
};

const PRIORITY_BADGES: Record<FollowUpPriority, { label: string; classes: string }> = {
  LOW: { label: 'Low', classes: 'bg-zinc-800 text-zinc-400' },
  MEDIUM: { label: 'Medium', classes: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  HIGH: { label: 'High', classes: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  URGENT: { label: 'Urgent', classes: 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' },
};

interface TodayViewProps {
  contacts: Map<string, Contact>;
  onComplete: (fu: FollowUp) => void;
  onSnooze: (fu: FollowUp) => void;
  onReschedule: (fu: FollowUp) => void;
  onEdit: (fu: FollowUp) => void;
  onCancel: (fu: FollowUp) => void;
  onDelete: (fu: FollowUp) => void;
  onOpenChat: (fu: FollowUp) => void;
  onRefresh: () => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  contacts,
  onComplete,
  onSnooze,
  onReschedule,
  onEdit,
  onCancel,
  onDelete,
  onOpenChat,
  onRefresh,
}) => {
  const [items, setItems] = useState<FollowUp[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'OVERDUE' | 'HIGH_PRIORITY' | 'COMPLETED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadTodayItems = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch today's followups + overdue items
      const [todayList, all] = await Promise.all([
        FollowUpRepository.getTodayFollowUps(),
        FollowUpRepository.list(),
      ]);

      const overdueList = all.filter((fu) => FollowUpRepository.computeStatus(fu) === 'OVERDUE');

      // Merge unique by ID
      const map = new Map<string, FollowUp>();
      for (const fu of overdueList) map.set(fu.id, fu);
      for (const fu of todayList) map.set(fu.id, fu);

      const combined = Array.from(map.values());

      // Priority ranking: URGENT > HIGH > MEDIUM > LOW
      const priorityWeight: Record<FollowUpPriority, number> = {
        URGENT: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      };

      // Sort: OVERDUE first, then by priority desc, then dueAt asc
      combined.sort((a, b) => {
        const aOverdue = FollowUpRepository.computeStatus(a) === 'OVERDUE' ? 1 : 0;
        const bOverdue = FollowUpRepository.computeStatus(b) === 'OVERDUE' ? 1 : 0;
        if (aOverdue !== bOverdue) return bOverdue - aOverdue;

        const aP = priorityWeight[a.priority] || 0;
        const bP = priorityWeight[b.priority] || 0;
        if (aP !== bP) return bP - aP;

        return a.dueAt - b.dueAt;
      });

      setItems(combined);
    } catch (err) {
      console.error('Failed to load today items:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodayItems();
  }, [loadTodayItems]);

  const filteredItems = items.filter((fu) => {
    const status = FollowUpRepository.computeStatus(fu);
    if (filter === 'OVERDUE') return status === 'OVERDUE';
    if (filter === 'HIGH_PRIORITY') return fu.priority === 'HIGH' || fu.priority === 'URGENT';
    if (filter === 'COMPLETED') return status === 'COMPLETED';
    return true;
  });

  const overdueCount = items.filter((fu) => FollowUpRepository.computeStatus(fu) === 'OVERDUE').length;
  const highPriorityCount = items.filter((fu) => fu.priority === 'HIGH' || fu.priority === 'URGENT').length;
  const completedTodayCount = items.filter((fu) => fu.status === 'COMPLETED').length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Quick Filter Pill Bar */}
      <div className="px-5 py-2.5 flex items-center justify-between border-b border-zinc-800/60 bg-zinc-900/30">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              filter === 'ALL'
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            All Today ({items.length})
          </button>
          {overdueCount > 0 && (
            <button
              onClick={() => setFilter('OVERDUE')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                filter === 'OVERDUE'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'text-red-400 hover:bg-red-500/10'
              }`}
            >
              <AlertCircle className="h-3 w-3" />
              Overdue ({overdueCount})
            </button>
          )}
          {highPriorityCount > 0 && (
            <button
              onClick={() => setFilter('HIGH_PRIORITY')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'HIGH_PRIORITY'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              High Priority ({highPriorityCount})
            </button>
          )}
          {completedTodayCount > 0 && (
            <button
              onClick={() => setFilter('COMPLETED')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'COMPLETED'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              Completed ({completedTodayCount})
            </button>
          )}
        </div>

        <button
          onClick={() => {
            loadTodayItems();
            onRefresh();
          }}
          title="Refresh Today"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Focus Feed */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-xs text-zinc-400">
            Loading today&apos;s schedule...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <CheckCheck className="h-10 w-10 text-emerald-500 mb-2" />
            <h3 className="text-sm font-semibold text-zinc-200">You&apos;re all caught up for today!</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs">
              No follow-ups remaining in this view. Great job keeping your leads warm!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredItems.map((fu) => {
              const status = FollowUpRepository.computeStatus(fu);
              const contact = contacts.get(fu.contactId);
              const isOverdue = status === 'OVERDUE';
              const isCompleted = status === 'COMPLETED';

              const dueTime = new Date(fu.dueAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={fu.id}
                  className={`p-3.5 rounded-xl border transition flex flex-col gap-2.5 ${
                    isCompleted
                      ? 'bg-zinc-900/30 border-zinc-800/40 opacity-70'
                      : isOverdue
                      ? 'bg-red-950/20 border-red-900/40 hover:border-red-700/60'
                      : 'bg-zinc-900/60 border-zinc-800/70 hover:border-zinc-700'
                  }`}
                >
                  {/* Top Bar: Icon, Title, Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-xl shrink-0 mt-0.5">{TYPE_ICONS[fu.type]}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`text-xs font-bold truncate ${
                              isCompleted ? 'line-through text-zinc-400' : 'text-zinc-100'
                            }`}
                          >
                            {fu.title}
                          </h4>
                          {isOverdue && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                              OVERDUE
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              PRIORITY_BADGES[fu.priority].classes
                            }`}
                          >
                            {PRIORITY_BADGES[fu.priority].label}
                          </span>
                        </div>

                        {/* Contact info & Due Time */}
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400">
                          {contact && (
                            <span className="flex items-center gap-1 font-medium text-zinc-300">
                              <User className="h-3 w-3 text-zinc-500" />
                              {contact.name} {contact.phone ? `(${contact.phone})` : ''}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-zinc-500" />
                            {dueTime}
                          </span>
                          {fu.autoCompleteOnReply && (
                            <span className="text-[10px] text-emerald-400">⚡ Auto-complete on reply</span>
                          )}
                        </div>

                        {fu.description && (
                          <p className="text-xs text-zinc-400 mt-1.5 whitespace-pre-wrap">{fu.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/40">
                    <div className="flex items-center gap-1.5">
                      {contact && (
                        <button
                          onClick={() => onOpenChat(fu)}
                          className="px-2.5 py-1 text-xs rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-semibold flex items-center gap-1 transition"
                        >
                          <MessageSquare className="h-3 w-3" />
                          Chat
                        </button>
                      )}
                      {!isCompleted && (
                        <button
                          onClick={() => onComplete(fu)}
                          className="px-2.5 py-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 transition"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Complete
                        </button>
                      )}
                      {!isCompleted && (
                        <>
                          <button
                            onClick={() => onSnooze(fu)}
                            className="px-2 py-1 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium flex items-center gap-1 transition"
                          >
                            <Clock className="h-3 w-3 text-amber-400" />
                            Snooze
                          </button>
                          <button
                            onClick={() => onReschedule(fu)}
                            className="px-2 py-1 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium flex items-center gap-1 transition"
                          >
                            <CalendarIcon className="h-3 w-3 text-blue-400" />
                            Reschedule
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(fu)}
                        title="Edit Details"
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      {!isCompleted && (
                        <button
                          onClick={() => onCancel(fu)}
                          title="Cancel Follow-up"
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(fu)}
                        title="Delete Permanently"
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
