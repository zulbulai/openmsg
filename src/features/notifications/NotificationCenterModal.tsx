import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  MessageSquare,
  CheckCheck,
} from 'lucide-react';
import { FollowUp, Contact } from '@/storage/schemas';
import { db } from '@/storage/db';
import { FollowUpService } from '@/core/crm/followup.service';
import { FollowUpRepository } from '@/storage/repositories/followup.repository';
import { useUIStore } from '@/ui/store';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { setActiveTab } = useUIStore();
  const [notifications, setNotifications] = useState<FollowUp[]>([]);
  const [contacts, setContacts] = useState<Map<string, Contact>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allFu, allContacts] = await Promise.all([
        db.followUps.toArray(),
        db.contacts.toArray(),
      ]);

      setContacts(new Map(allContacts.map((c) => [c.id, c])));

      // Notifications are follow-ups that:
      // 1. Have reminderStatus === 'TRIGGERED'
      // 2. Or are currently OVERDUE / DUE and not completed/cancelled/dismissed
      const activeAlerts = allFu.filter((fu) => {
        if (fu.status === 'COMPLETED' || fu.status === 'CANCELLED') return false;
        if (fu.reminderStatus === 'DISMISSED') return false;

        const isTriggered = fu.reminderStatus === 'TRIGGERED';
        const isOverdue = FollowUpRepository.computeStatus(fu) === 'OVERDUE';
        const isDue = FollowUpRepository.computeStatus(fu) === 'DUE';

        return isTriggered || isOverdue || isDue;
      });

      // Sort newest / most urgent first
      activeAlerts.sort((a, b) => {
        if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
        if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
        return a.dueAt - b.dueAt;
      });

      setNotifications(activeAlerts);
    } catch (err) {
      console.error('Failed to load notification alerts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  if (!isOpen) return null;

  const handleDismiss = async (fu: FollowUp) => {
    await db.followUps.update(fu.id, {
      reminderStatus: 'DISMISSED',
      updatedAt: Date.now(),
    });
    await loadNotifications();
  };

  const handleDismissAll = async () => {
    for (const fu of notifications) {
      await db.followUps.update(fu.id, {
        reminderStatus: 'DISMISSED',
        updatedAt: Date.now(),
      });
    }
    await loadNotifications();
  };

  const handleComplete = async (fu: FollowUp) => {
    await FollowUpService.complete(fu.id, 'Completed from notification center');
    await loadNotifications();
  };

  const handleSnooze10m = async (fu: FollowUp) => {
    await FollowUpService.snooze(fu.id, Date.now() + 10 * 60 * 1000);
    await loadNotifications();
  };

  const handleOpenChat = (_fu: FollowUp) => {
    onClose();
    setActiveTab('inbox');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-end p-4 pt-14">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden max-h-[80vh]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-zinc-100">Notification Center</h3>
            {notifications.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                {notifications.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={handleDismissAll}
                className="text-[10px] text-zinc-400 hover:text-zinc-200 transition"
              >
                Dismiss All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-xs text-zinc-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center text-zinc-500 text-xs">
              <CheckCheck className="h-8 w-8 text-emerald-500/60 mb-2" />
              <span>All notifications caught up!</span>
              <span className="text-[10px] text-zinc-600 mt-0.5">
                No active follow-up alarms or overdue alerts.
              </span>
            </div>
          ) : (
            notifications.map((fu) => {
              const contact = contacts.get(fu.contactId);
              const status = FollowUpRepository.computeStatus(fu);
              const isOverdue = status === 'OVERDUE';

              return (
                <div
                  key={fu.id}
                  className={`p-3 rounded-xl border flex flex-col gap-2 transition ${
                    isOverdue
                      ? 'bg-red-950/20 border-red-900/50'
                      : 'bg-zinc-950 border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-1.5 min-w-0">
                      {isOverdue ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                      ) : (
                        <Bell className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-zinc-200 truncate">{fu.title}</h4>
                        {contact && (
                          <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                            <User className="h-2.5 w-2.5 text-zinc-500" />
                            <span className="truncate">{contact.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          <span>Due {new Date(fu.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDismiss(fu)}
                      title="Dismiss"
                      className="text-zinc-500 hover:text-zinc-300 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800/60">
                    <div className="flex items-center gap-1">
                      {contact && (
                        <button
                          onClick={() => handleOpenChat(fu)}
                          className="px-2 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-medium flex items-center gap-1 transition"
                        >
                          <MessageSquare className="h-2.5 w-2.5" />
                          Chat
                        </button>
                      )}
                      <button
                        onClick={() => handleComplete(fu)}
                        className="px-2 py-0.5 text-[10px] rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 transition"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Done
                      </button>
                    </div>

                    <button
                      onClick={() => handleSnooze10m(fu)}
                      className="px-2 py-0.5 text-[10px] rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium flex items-center gap-1 transition"
                    >
                      <Clock className="h-2.5 w-2.5 text-amber-400" />
                      +10m
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
