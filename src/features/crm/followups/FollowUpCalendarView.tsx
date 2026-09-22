import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  CheckCircle2,
  Calendar as CalendarIcon,
  MessageSquare,
  Edit2,
  Trash2,
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

const PRIORITY_COLORS: Record<FollowUpPriority, string> = {
  LOW: 'border-l-zinc-500',
  MEDIUM: 'border-l-blue-500',
  HIGH: 'border-l-amber-500',
  URGENT: 'border-l-red-500',
};

interface FollowUpCalendarViewProps {
  followUps: FollowUp[];
  contacts: Map<string, Contact>;
  onComplete: (fu: FollowUp) => void;
  onSnooze: (fu: FollowUp) => void;
  onReschedule: (fu: FollowUp) => void;
  onEdit: (fu: FollowUp) => void;
  onDelete: (fu: FollowUp) => void;
  onOpenChat: (fu: FollowUp) => void;
  onCreateForDate?: (timestamp: number) => void;
}

export const FollowUpCalendarView: React.FC<FollowUpCalendarViewProps> = ({
  followUps,
  contacts,
  onComplete,
  onSnooze,
  onReschedule,
  onEdit,
  onDelete,
  onOpenChat,
  onCreateForDate,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today);
  };

  // Group follow-ups by date string 'YYYY-MM-DD'
  const followUpsByDate = useMemo(() => {
    const map = new Map<string, FollowUp[]>();
    for (const fu of followUps) {
      const d = new Date(fu.dueAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(fu);
    }
    return map;
  }, [followUps]);

  // Generate calendar grid days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      dateKey: string;
      dayNumber: number;
    }> = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevLastDate - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      days.push({
        date: d,
        isCurrentMonth: false,
        dateKey: key,
        dayNumber: prevLastDate - i,
      });
    }

    // Current month days
    for (let d = 1; d <= lastDate; d++) {
      const dateObj = new Date(year, month, d);
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: dateObj,
        isCurrentMonth: true,
        dateKey: key,
        dayNumber: d,
      });
    }

    // Next month padding to fill complete grid rows (42 days total)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const dateObj = new Date(year, month + 1, d);
      const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(
        d
      ).padStart(2, '0')}`;
      days.push({
        date: dateObj,
        isCurrentMonth: false,
        dateKey: key,
        dayNumber: d,
      });
    }

    return days;
  }, [year, month]);

  const selectedKey = `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(selectedDay.getDate()).padStart(2, '0')}`;
  const selectedDayItems = followUpsByDate.get(selectedKey) || [];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Calendar Header */}
      <div className="px-5 py-2.5 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-zinc-100">
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={handleToday}
            className="px-2 py-0.5 text-xs rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col border-r border-zinc-800 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-semibold text-zinc-400 text-center py-1.5">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Grid Cells */}
          <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-px bg-zinc-800/60 overflow-y-auto">
            {calendarDays.map((cd) => {
              const dayItems = followUpsByDate.get(cd.dateKey) || [];
              const isSelected = cd.dateKey === selectedKey;
              const isToday =
                new Date().toDateString() === cd.date.toDateString();

              return (
                <div
                  key={cd.dateKey}
                  onClick={() => setSelectedDay(cd.date)}
                  className={`bg-zinc-950 p-1.5 flex flex-col justify-between cursor-pointer transition select-none hover:bg-zinc-900 ${
                    !cd.isCurrentMonth ? 'opacity-30' : ''
                  } ${isSelected ? 'ring-1 ring-emerald-500 bg-zinc-900/80' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-medium w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-emerald-500 text-white font-bold'
                          : isSelected
                          ? 'text-emerald-400 font-bold'
                          : 'text-zinc-300'
                      }`}
                    >
                      {cd.dayNumber}
                    </span>

                    {dayItems.length > 0 && (
                      <span className="text-[10px] px-1 rounded-full bg-zinc-800 text-zinc-300 font-semibold">
                        {dayItems.length}
                      </span>
                    )}
                  </div>

                  {/* Item Indicators */}
                  <div className="flex flex-col gap-0.5 mt-1 overflow-hidden">
                    {dayItems.slice(0, 2).map((fu) => {
                      const status = FollowUpRepository.computeStatus(fu);
                      const isOverdue = status === 'OVERDUE';
                      return (
                        <div
                          key={fu.id}
                          className={`text-[9px] truncate px-1 py-0.5 rounded flex items-center gap-1 ${
                            isOverdue
                              ? 'bg-red-500/20 text-red-300'
                              : status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-zinc-800/80 text-zinc-300'
                          }`}
                        >
                          <span>{TYPE_ICONS[fu.type]}</span>
                          <span className="truncate">{fu.title}</span>
                        </div>
                      );
                    })}
                    {dayItems.length > 2 && (
                      <span className="text-[8px] text-zinc-500 px-1">
                        +{dayItems.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Drawer */}
        <div className="w-80 flex flex-col bg-zinc-900/30 overflow-hidden shrink-0">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-zinc-200">
                {selectedDay.toLocaleDateString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </h4>
              <span className="text-[10px] text-zinc-500">
                {selectedDayItems.length} follow-up
                {selectedDayItems.length === 1 ? '' : 's'}
              </span>
            </div>

            {onCreateForDate && (
              <button
                onClick={() => onCreateForDate(selectedDay.getTime())}
                className="px-2 py-1 text-[11px] rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 font-semibold transition"
              >
                + Add
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {selectedDayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center text-zinc-500 text-xs">
                <CalendarIcon className="h-6 w-6 text-zinc-700 mb-1.5" />
                No follow-ups for this date.
              </div>
            ) : (
              selectedDayItems.map((fu) => {
                const status = FollowUpRepository.computeStatus(fu);
                const contact = contacts.get(fu.contactId);
                const isOverdue = status === 'OVERDUE';
                const isCompleted = status === 'COMPLETED';

                return (
                  <div
                    key={fu.id}
                    className={`p-2.5 rounded-lg border border-l-4 bg-zinc-900/80 border-zinc-800 text-xs ${
                      PRIORITY_COLORS[fu.priority]
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span>{TYPE_ICONS[fu.type]}</span>
                        <h5
                          className={`font-semibold truncate ${
                            isCompleted ? 'line-through text-zinc-400' : 'text-zinc-100'
                          }`}
                        >
                          {fu.title}
                        </h5>
                        {isOverdue && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-red-500/20 text-red-400 font-bold">
                            OVERDUE
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 shrink-0">
                        {new Date(fu.dueAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {contact && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-400">
                        <User className="h-2.5 w-2.5 text-zinc-500" />
                        <span className="truncate">{contact.name}</span>
                      </div>
                    )}

                    {fu.description && (
                      <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{fu.description}</p>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/60">
                      <div className="flex items-center gap-1">
                        {contact && (
                          <button
                            onClick={() => onOpenChat(fu)}
                            title="Chat"
                            className="p-1 rounded hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </button>
                        )}
                        {!isCompleted && (
                          <button
                            onClick={() => onComplete(fu)}
                            title="Complete"
                            className="p-1 rounded hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                          </button>
                        )}
                        {!isCompleted && (
                          <>
                            <button
                              onClick={() => onSnooze(fu)}
                              title="Snooze"
                              className="p-1 rounded hover:bg-amber-500/20 text-zinc-400 hover:text-amber-400"
                            >
                              <Clock className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => onReschedule(fu)}
                              title="Reschedule"
                              className="p-1 rounded hover:bg-blue-500/20 text-zinc-400 hover:text-blue-400"
                            >
                              <CalendarIcon className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => onEdit(fu)}
                          title="Edit"
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onDelete(fu)}
                          title="Delete"
                          className="p-1 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
