import React, { useState, useEffect } from 'react';
import {
  Bell,
  Save,
  Check,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import { FollowUpSettings, FollowUpPriority } from '@/storage/schemas';
import { FollowUpRepository } from '@/storage/repositories/followup.repository';
import { ReminderService } from '@/core/crm/reminder.service';

const DAYS_OF_WEEK = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
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

export const FollowUpSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<FollowUpSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [rebuildSuccess, setRebuildSuccess] = useState(false);

  useEffect(() => {
    FollowUpRepository.getSettings().then(setSettings);
  }, []);

  if (!settings) {
    return <div className="text-zinc-500 py-6">Loading settings...</div>;
  }

  const handleDayToggle = (day: number) => {
    const current = new Set(settings.workingDays || []);
    if (current.has(day)) {
      current.delete(day);
    } else {
      current.add(day);
    }
    setSettings({ ...settings, workingDays: Array.from(current) });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await FollowUpRepository.saveSettings(settings);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save follow-up settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRebuildAlarms = async () => {
    setIsRebuilding(true);
    try {
      await ReminderService.rebuildAll();
      setRebuildSuccess(true);
      setTimeout(() => setRebuildSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to rebuild alarms:', err);
    } finally {
      setIsRebuilding(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 max-w-2xl text-xs">
      {/* Defaults Card */}
      <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-4">
        <div className="flex items-center gap-2 font-bold text-zinc-100">
          <Bell className="h-4 w-4 text-emerald-400" />
          <span>Notification &amp; Reminder Defaults</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-zinc-300 font-semibold block mb-1">
              Default Reminder Offset
            </label>
            <select
              value={settings.defaultReminderMinutes}
              onChange={(e) =>
                setSettings({ ...settings, defaultReminderMinutes: parseInt(e.target.value) })
              }
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-200"
            >
              {REMINDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-zinc-300 font-semibold block mb-1">
              Default Priority
            </label>
            <select
              value={settings.defaultPriority}
              onChange={(e) =>
                setSettings({ ...settings, defaultPriority: e.target.value as FollowUpPriority })
              }
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-200"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
          <div>
            <span className="font-semibold text-zinc-200 block">Chrome Desktop Notifications</span>
            <span className="text-[11px] text-zinc-400">
              Show native desktop notifications when reminder alarms fire.
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.enableNotifications}
            onChange={(e) =>
              setSettings({ ...settings, enableNotifications: e.target.checked })
            }
            className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
          />
        </div>
      </div>

      {/* Working Days & Business Hours */}
      <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-4">
        <div className="flex items-center gap-2 font-bold text-zinc-100">
          <Calendar className="h-4 w-4 text-blue-400" />
          <span>Working Schedule &amp; Business Hours</span>
        </div>
        <p className="text-[11px] text-zinc-400 -mt-2">
          Configure office operating hours to automatically avoid waking you up on weekends or off-hours.
        </p>

        <div>
          <label className="text-zinc-300 font-semibold block mb-2">Working Days</label>
          <div className="flex items-center gap-2">
            {DAYS_OF_WEEK.map((item) => {
              const isSelected = (settings.workingDays || []).includes(item.day);
              return (
                <button
                  type="button"
                  key={item.day}
                  onClick={() => handleDayToggle(item.day)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700/40'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-zinc-300 font-semibold block mb-1">
              Business Hours Start
            </label>
            <input
              type="time"
              value={settings.businessHoursStart}
              onChange={(e) => setSettings({ ...settings, businessHoursStart: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-200"
            />
          </div>

          <div>
            <label className="text-zinc-300 font-semibold block mb-1">
              Business Hours End
            </label>
            <input
              type="time"
              value={settings.businessHoursEnd}
              onChange={(e) => setSettings({ ...settings, businessHoursEnd: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-200"
            />
          </div>
        </div>

        <div>
          <label className="text-zinc-300 font-semibold block mb-1">
            Outside Working Hours Behavior
          </label>
          <select
            value={settings.outsideHoursBehavior}
            onChange={(e) =>
              setSettings({
                ...settings,
                outsideHoursBehavior: e.target.value as 'NOTIFY_ANYWAY' | 'MOVE_TO_NEXT_BUSINESS_HOUR',
              })
            }
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-200"
          >
            <option value="NOTIFY_ANYWAY">Notify anyway at scheduled time</option>
            <option value="MOVE_TO_NEXT_BUSINESS_HOUR">
              Postpone reminder to next business opening hour
            </option>
          </select>
        </div>
      </div>

      {/* Alarm Diagnostics & Rebuild */}
      <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
        <div>
          <span className="font-semibold text-zinc-200 block">Reconcile Chrome Alarms</span>
          <span className="text-[11px] text-zinc-400">
            Resynchronizes all pending reminders with Chrome service worker alarms.
          </span>
        </div>
        <button
          type="button"
          onClick={handleRebuildAlarms}
          disabled={isRebuilding}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold flex items-center gap-1.5 transition"
        >
          {rebuildSuccess ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>Synchronized!</span>
            </>
          ) : (
            <>
              <RotateCcw className={`h-3.5 w-3.5 ${isRebuilding ? 'animate-spin' : ''}`} />
              <span>Rebuild Alarms</span>
            </>
          )}
        </button>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition"
        >
          {isSaved ? (
            <>
              <Check className="h-4 w-4" />
              <span>Settings Saved!</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
