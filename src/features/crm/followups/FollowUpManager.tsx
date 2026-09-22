import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar as CalendarIcon,
  Search,
  Edit2,
  Trash2,
  User,
  MessageSquare,
  Loader2,
  List,
} from 'lucide-react';
import { FollowUp, FollowUpStatus, FollowUpPriority, FollowUpType, Contact } from '@/storage/schemas';
import { FollowUpRepository, FollowUpDashboardCounts } from '@/storage/repositories/followup.repository';
import { FollowUpService } from '@/core/crm/followup.service';
import { db } from '@/storage/db';
import { FollowUpModal } from './FollowUpModal';
import { CompletionModal, SnoozeModal, RescheduleModal } from './FollowUpActionModals';
import { TodayView } from './TodayView';
import { FollowUpCalendarView } from './FollowUpCalendarView';
import { useUIStore } from '@/ui/store';

type ViewTab = 'today' | 'upcoming' | 'overdue' | 'completed' | 'cancelled' | 'all';

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

const PRIORITY_COLORS: Record<FollowUpPriority, string> = {
  LOW: 'bg-zinc-700 text-zinc-300',
  MEDIUM: 'bg-blue-500/20 text-blue-400',
  HIGH: 'bg-amber-500/20 text-amber-400',
  URGENT: 'bg-red-500/20 text-red-400',
};

const STATUS_BADGES: Record<FollowUpStatus, { label: string; classes: string }> = {
  PENDING: { label: 'Pending', classes: 'bg-zinc-700 text-zinc-300' },
  DUE: { label: 'Due', classes: 'bg-amber-500/20 text-amber-400' },
  OVERDUE: { label: 'Overdue', classes: 'bg-red-500/20 text-red-400' },
  COMPLETED: { label: 'Completed', classes: 'bg-emerald-500/20 text-emerald-400' },
  CANCELLED: { label: 'Cancelled', classes: 'bg-zinc-600/40 text-zinc-400' },
  SNOOZED: { label: 'Snoozed', classes: 'bg-purple-500/20 text-purple-400' },
};

export const FollowUpManager: React.FC = () => {
  const { setActiveTab } = useUIStore();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [counts, setCounts] = useState<FollowUpDashboardCounts>({ today: 0, upcoming: 0, overdue: 0, completedToday: 0, highPriority: 0, total: 0 });
  const [contacts, setContacts] = useState<Map<string, Contact>>(new Map());
  const [activeView, setActiveView] = useState<ViewTab>('today');
  const [mode, setMode] = useState<'list' | 'today' | 'calendar'>('list');
  const [allFollowUps, setAllFollowUps] = useState<FollowUp[]>([]);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingFu, setEditingFu] = useState<FollowUp | null>(null);
  const [completingFu, setCompletingFu] = useState<FollowUp | null>(null);
  const [snoozingFu, setSnoozingFu] = useState<FollowUp | null>(null);
  const [reschedulingFu, setReschedulingFu] = useState<FollowUp | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [dashCounts, allContacts, everyFu] = await Promise.all([
        FollowUpRepository.getDashboardCounts(),
        db.contacts.toArray(),
        FollowUpRepository.list(),
      ]);

      setCounts(dashCounts);
      setContacts(new Map(allContacts.map((c) => [c.id, c])));
      setAllFollowUps(everyFu);

      // Load follow-ups based on active view
      let items: FollowUp[];
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      switch (activeView) {
        case 'today':
          items = await FollowUpRepository.getTodayFollowUps();
          break;
        case 'upcoming':
          items = await FollowUpRepository.list({
            status: ['PENDING', 'DUE', 'SNOOZED'],
            dateFrom: endOfToday.getTime(),
          });
          break;
        case 'overdue':
          items = (await FollowUpRepository.list()).filter(
            (fu) => FollowUpRepository.computeStatus(fu) === 'OVERDUE'
          );
          break;
        case 'completed':
          items = await FollowUpRepository.list({ status: 'COMPLETED' });
          break;
        case 'cancelled':
          items = await FollowUpRepository.list({ status: 'CANCELLED' });
          break;
        default:
          items = await FollowUpRepository.list();
      }

      // Apply local search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        items = items.filter((fu) => {
          const contact = allContacts.find((c) => c.id === fu.contactId);
          const searchable = `${fu.title} ${fu.description || ''} ${fu.notes || ''} ${contact?.name || ''} ${contact?.phone || ''}`.toLowerCase();
          return searchable.includes(q);
        });
      }

      setFollowUps(items);
    } catch (err) {
      setError('Unable to load follow-ups. Please try again.');
      console.error('Failed to load follow-ups:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeView, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCancel = async (fu: FollowUp) => {
    if (confirm('Cancel this follow-up? It will remain in history.')) {
      await FollowUpService.cancel(fu.id);
      await loadData();
    }
  };

  const handleDelete = async (fu: FollowUp) => {
    if (confirm('Permanently delete this follow-up?')) {
      await FollowUpRepository.delete(fu.id);
      await loadData();
    }
  };

  const handleOpenChat = () => {
    setActiveTab('inbox');
  };

  const formatDueTime = (ts: number) => {
    const d = new Date(ts);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today ${time}`;
    if (isTomorrow) return `Tomorrow ${time}`;
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
  };

  const viewTabs: { key: ViewTab; label: string; count: number }[] = [
    { key: 'today', label: 'Today', count: counts.today },
    { key: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { key: 'overdue', label: 'Overdue', count: counts.overdue },
    { key: 'completed', label: 'Completed', count: counts.completedToday },
    { key: 'cancelled', label: 'Cancelled', count: 0 },
    { key: 'all', label: 'All', count: counts.total },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-zinc-800 px-5 flex items-center justify-between bg-zinc-900/40 backdrop-blur shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-zinc-100">Follow-ups & Reminders</h2>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setMode('list')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium flex items-center gap-1.5 transition ${
                mode === 'list'
                  ? 'bg-zinc-800 text-zinc-100 shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
            <button
              onClick={() => setMode('today')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium flex items-center gap-1.5 transition ${
                mode === 'today'
                  ? 'bg-zinc-800 text-zinc-100 shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              Today Focus
            </button>
            <button
              onClick={() => setMode('calendar')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium flex items-center gap-1.5 transition ${
                mode === 'calendar'
                  ? 'bg-zinc-800 text-zinc-100 shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5 text-purple-400" />
              Calendar
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            setCalendarSelectedDate(undefined);
            setCreateModalOpen(true);
          }}
          className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 font-semibold flex items-center gap-1.5 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          New Follow-up
        </button>
      </div>

      {/* List Mode Content */}
      {mode === 'list' && (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-5 gap-3 px-5 py-3 border-b border-zinc-800/50 bg-zinc-900/20">
        {[
          { label: "Today's", value: counts.today, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Overdue', value: counts.overdue, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Upcoming', value: counts.upcoming, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Completed', value: counts.completedToday, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'High Priority', value: counts.highPriority, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map((card) => (
          <div
            key={card.label}
            className={`${card.bg} rounded-xl p-3 border border-zinc-800/50 flex flex-col items-center`}
          >
            <span className={`text-lg font-bold ${card.color}`}>{card.value}</span>
            <span className="text-[10px] text-zinc-400 mt-0.5">{card.label}</span>
          </div>
        ))}
      </div>

      {/* View Tabs + Search */}
      <div className="px-5 py-2.5 flex items-center justify-between border-b border-zinc-800/50">
        <div className="flex items-center gap-1">
          {viewTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeView === tab.key
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 text-[10px] bg-zinc-700/60 px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search follow-ups..."
            className="pl-8 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 w-52"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
            <span className="text-xs text-zinc-400 ml-2">Loading follow-ups...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <AlertTriangle className="h-6 w-6 text-red-400 mb-2" />
            <p className="text-xs text-zinc-400">{error}</p>
            <button onClick={loadData} className="mt-2 text-xs text-emerald-400 hover:underline">
              Retry
            </button>
          </div>
        ) : followUps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Bell className="h-8 w-8 text-zinc-700 mb-2" />
            <p className="text-xs text-zinc-500">No follow-ups yet.</p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="mt-2 text-xs text-emerald-400 hover:underline"
            >
              Create your first follow-up
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {followUps.map((fu) => {
              const status = FollowUpRepository.computeStatus(fu);
              const contact = contacts.get(fu.contactId);
              const statusBadge = STATUS_BADGES[status];

              return (
                <div
                  key={fu.id}
                  className="group flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 transition"
                >
                  {/* Type Icon */}
                  <div className="text-lg mt-0.5 shrink-0">{TYPE_ICONS[fu.type]}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-xs font-semibold text-zinc-100 truncate">{fu.title}</h4>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${statusBadge.classes}`}>
                        {statusBadge.label}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${PRIORITY_COLORS[fu.priority]}`}>
                        {fu.priority}
                      </span>
                    </div>

                    {/* Contact & Due */}
                    <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                      {contact && (
                        <span className="flex items-center gap-0.5">
                          <User className="h-2.5 w-2.5" />
                          {contact.name}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDueTime(fu.dueAt)}
                      </span>
                      {fu.recurrence && (
                        <span className="flex items-center gap-0.5 text-purple-400">
                          🔄 {fu.recurrence.frequency.toLowerCase()}
                        </span>
                      )}
                    </div>

                    {fu.description && (
                      <p className="text-[10px] text-zinc-500 mt-1 truncate">{fu.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    {status !== 'COMPLETED' && status !== 'CANCELLED' && (
                      <>
                        <button
                          onClick={() => setCompletingFu(fu)}
                          title="Complete"
                          className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-zinc-500 hover:text-emerald-400 transition"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setSnoozingFu(fu)}
                          title="Snooze"
                          className="p-1.5 rounded-lg hover:bg-amber-500/20 text-zinc-500 hover:text-amber-400 transition"
                        >
                          <Clock className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setReschedulingFu(fu)}
                          title="Reschedule"
                          className="p-1.5 rounded-lg hover:bg-blue-500/20 text-zinc-500 hover:text-blue-400 transition"
                        >
                          <CalendarIcon className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    {contact && (
                      <button
                        onClick={() => handleOpenChat()}
                        title={`Open chat with ${contact.name}`}
                        className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-zinc-500 hover:text-emerald-400 transition"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingFu(fu)}
                      title="Edit"
                      className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {status !== 'COMPLETED' && status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancel(fu)}
                        title="Cancel"
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(fu)}
                      title="Delete"
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
        </>
      )}

      {/* Today Focus Mode */}
      {mode === 'today' && (
        <TodayView
          contacts={contacts}
          onComplete={(fu) => setCompletingFu(fu)}
          onSnooze={(fu) => setSnoozingFu(fu)}
          onReschedule={(fu) => setReschedulingFu(fu)}
          onEdit={(fu) => setEditingFu(fu)}
          onCancel={(fu) => handleCancel(fu)}
          onDelete={(fu) => handleDelete(fu)}
          onOpenChat={() => handleOpenChat()}
          onRefresh={loadData}
        />
      )}

      {/* Calendar Mode */}
      {mode === 'calendar' && (
        <FollowUpCalendarView
          followUps={allFollowUps}
          contacts={contacts}
          onComplete={(fu) => setCompletingFu(fu)}
          onSnooze={(fu) => setSnoozingFu(fu)}
          onReschedule={(fu) => setReschedulingFu(fu)}
          onEdit={(fu) => setEditingFu(fu)}
          onDelete={(fu) => handleDelete(fu)}
          onOpenChat={() => handleOpenChat()}
          onCreateForDate={(ts) => {
            setCalendarSelectedDate(ts);
            setCreateModalOpen(true);
          }}
        />
      )}

      {/* Modals */}
      <FollowUpModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setCalendarSelectedDate(undefined);
        }}
        onSaved={loadData}
        source="CRM"
        initialDueAt={calendarSelectedDate}
      />
      {editingFu && (
        <FollowUpModal
          isOpen={true}
          onClose={() => setEditingFu(null)}
          onSaved={loadData}
          editingFollowUp={editingFu}
        />
      )}
      {completingFu && (
        <CompletionModal
          isOpen={true}
          followUp={completingFu}
          onClose={() => setCompletingFu(null)}
          onCompleted={loadData}
        />
      )}
      {snoozingFu && (
        <SnoozeModal
          isOpen={true}
          followUp={snoozingFu}
          onClose={() => setSnoozingFu(null)}
          onSnoozed={loadData}
        />
      )}
      {reschedulingFu && (
        <RescheduleModal
          isOpen={true}
          followUp={reschedulingFu}
          onClose={() => setReschedulingFu(null)}
          onRescheduled={loadData}
        />
      )}
    </div>
  );
};
