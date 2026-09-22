/**
 * ReminderService
 * Schedules, cancels, and reconciles chrome.alarms for follow-up reminders.
 * Handles business hours adjustment and duplicate alarm protection.
 */

import { AlarmManager } from '@/background/alarms';
import { FollowUpRepository } from '@/storage/repositories/followup.repository';
import { FollowUp, FollowUpSettings } from '@/storage/schemas';
import { db } from '@/storage/db';

const ALARM_PREFIX = 'fu_reminder_';

export class ReminderService {
  /**
   * Schedules a chrome.alarm for a follow-up reminder.
   * Applies business hours adjustment based on user settings.
   */
  static async scheduleReminder(followUp: FollowUp): Promise<void> {
    if (!followUp.reminderAt || followUp.reminderAt <= 0) return;

    // Don't schedule for already triggered / completed / cancelled reminders
    if (
      followUp.reminderStatus === 'TRIGGERED' ||
      followUp.reminderStatus === 'COMPLETED' ||
      followUp.reminderStatus === 'CANCELLED' ||
      followUp.reminderStatus === 'DISMISSED'
    ) {
      return;
    }

    const settings = await FollowUpRepository.getSettings();
    let triggerAt = followUp.reminderAt;

    // Apply business hours adjustment if configured
    if (settings.outsideHoursBehavior === 'MOVE_TO_NEXT_BUSINESS_HOUR') {
      triggerAt = this.adjustToBusinessHours(triggerAt, settings);
    }

    const alarmId = `${ALARM_PREFIX}${followUp.id}`;

    // Cancel existing alarm for this follow-up (idempotency)
    AlarmManager.cancel(alarmId);

    // Only schedule if in the future (or just passed — alarm manager handles minimum delay)
    AlarmManager.schedule(alarmId, triggerAt);
  }

  /**
   * Cancels the chrome.alarm for a follow-up.
   */
  static cancelReminder(followUpId: string): void {
    AlarmManager.cancel(`${ALARM_PREFIX}${followUpId}`);
  }

  /**
   * Reschedules a reminder after snooze or reschedule.
   */
  static async rescheduleReminder(followUp: FollowUp): Promise<void> {
    this.cancelReminder(followUp.id);
    await this.scheduleReminder(followUp);
  }

  /**
   * Rebuilds all alarms for pending follow-up reminders.
   * Called on service worker startup / extension reload.
   */
  static async rebuildAll(): Promise<void> {
    const pending = await FollowUpRepository.getPendingReminders();
    const now = Date.now();

    for (const fu of pending) {
      if (!fu.reminderAt) continue;

      if (fu.reminderAt <= now) {
        // Reminder time already passed — trigger immediately
        await this.triggerReminder(fu);
      } else {
        await this.scheduleReminder(fu);
      }
    }

    console.log(`[ReminderService] Rebuilt alarms for ${pending.length} pending follow-up reminders.`);
  }

  /**
   * Handles an alarm firing for a follow-up reminder.
   * Called from AlarmManager when an fu_reminder_ alarm fires.
   */
  static async handleAlarmFired(followUpId: string): Promise<void> {
    const fu = await db.followUps.get(followUpId);
    if (!fu) return;

    // Prevent duplicate triggers
    if (
      fu.reminderStatus === 'TRIGGERED' ||
      fu.reminderStatus === 'COMPLETED' ||
      fu.reminderStatus === 'CANCELLED' ||
      fu.reminderStatus === 'DISMISSED'
    ) {
      return;
    }

    await this.triggerReminder(fu);
  }

  /**
   * Fires the reminder notification and updates state.
   */
  private static async triggerReminder(fu: FollowUp): Promise<void> {
    // Update reminder status
    await db.followUps.update(fu.id, {
      reminderStatus: 'TRIGGERED',
      updatedAt: Date.now(),
    });

    // Log activity
    await FollowUpRepository.logActivity(
      fu.id,
      fu.contactId,
      'REMINDER_TRIGGERED',
      `Reminder triggered for: ${fu.title}`
    );

    // Send Chrome notification
    const settings = await FollowUpRepository.getSettings();
    if (settings.enableNotifications) {
      this.sendChromeNotification(fu);
    }
  }

  /**
   * Sends a Chrome desktop notification for the follow-up.
   */
  private static sendChromeNotification(fu: FollowUp): void {
    if (typeof chrome === 'undefined' || !chrome.notifications) return;

    const dueDate = new Date(fu.dueAt);
    const timeStr = dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    chrome.notifications.create(`fu_notif_${fu.id}`, {
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: `Follow-up Reminder — ${fu.priority}`,
      message: `${fu.title}\nDue: ${timeStr}`,
      priority: fu.priority === 'URGENT' ? 2 : fu.priority === 'HIGH' ? 1 : 0,
      requireInteraction: fu.priority === 'URGENT' || fu.priority === 'HIGH',
    });
  }

  /**
   * Adjusts a timestamp to fall within business hours.
   * If the timestamp is outside working hours, moves it to the next business hour.
   */
  static adjustToBusinessHours(timestamp: number, settings: FollowUpSettings): number {
    const date = new Date(timestamp);
    const dayOfWeek = date.getDay(); // 0=Sun .. 6=Sat

    // Parse business hours
    const [startH, startM] = settings.businessHoursStart.split(':').map(Number);
    const [endH, endM] = settings.businessHoursEnd.split(':').map(Number);

    const isWorkingDay = settings.workingDays.includes(dayOfWeek);
    const isHoliday = settings.holidays.some((h) => {
      const hDate = new Date(h);
      return (
        hDate.getFullYear() === date.getFullYear() &&
        hDate.getMonth() === date.getMonth() &&
        hDate.getDate() === date.getDate()
      );
    });

    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    const businessStart = startH * 60 + startM;
    const businessEnd = endH * 60 + endM;

    // If it's a working day, not a holiday, and within business hours → no adjustment
    if (isWorkingDay && !isHoliday && currentMinutes >= businessStart && currentMinutes < businessEnd) {
      return timestamp;
    }

    // Move to the next business start
    const result = new Date(date);

    // If after business hours or non-working day, advance to next working day
    if (!isWorkingDay || isHoliday || currentMinutes >= businessEnd) {
      result.setDate(result.getDate() + 1);
    }

    // Find the next working day
    let attempts = 0;
    while (attempts < 14) {
      const rDay = result.getDay();
      const rIsHoliday = settings.holidays.some((h) => {
        const hDate = new Date(h);
        return (
          hDate.getFullYear() === result.getFullYear() &&
          hDate.getMonth() === result.getMonth() &&
          hDate.getDate() === result.getDate()
        );
      });

      if (settings.workingDays.includes(rDay) && !rIsHoliday) break;
      result.setDate(result.getDate() + 1);
      attempts++;
    }

    // Set to business hours start
    result.setHours(startH, startM, 0, 0);
    return result.getTime();
  }

  /**
   * Extracts a follow-up ID from an alarm name.
   */
  static extractFollowUpId(alarmName: string): string | null {
    if (!alarmName.startsWith(ALARM_PREFIX)) return null;
    return alarmName.substring(ALARM_PREFIX.length);
  }
}
