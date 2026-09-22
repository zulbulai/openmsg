import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ReminderService } from '@/core/crm/reminder.service';
import { AlarmManager } from '@/background/alarms';
import { FollowUpRepository } from '@/storage/repositories/followup.repository';
import { db } from '@/storage/db';
import { FollowUp, FollowUpSettings } from '@/storage/schemas';

describe('ReminderService', () => {
  const baseSettings: FollowUpSettings = {
    id: 'default',
    enableNotifications: true,
    defaultReminderMinutes: 30,
    defaultPriority: 'MEDIUM',
    workingDays: [1, 2, 3, 4, 5], // Monday - Friday
    businessHoursStart: '09:00',
    businessHoursEnd: '18:00',
    outsideHoursBehavior: 'MOVE_TO_NEXT_BUSINESS_HOUR',
    holidays: [new Date(2026, 11, 25).getTime()], // Christmas Friday
  };

  beforeEach(async () => {
    await db.followUps.clear();
    await db.followUpActivities.clear();
    await db.followUpSettings.clear();
    await FollowUpRepository.saveSettings(baseSettings);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('extractFollowUpId', () => {
    it('should extract follow-up ID correctly from alarm name', () => {
      expect(ReminderService.extractFollowUpId('fu_reminder_abc-123')).toBe('abc-123');
      expect(ReminderService.extractFollowUpId('fu_reminder_f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('should return null for non-followup alarm names', () => {
      expect(ReminderService.extractFollowUpId('wf_delay_exec1_node2')).toBeNull();
      expect(ReminderService.extractFollowUpId('seq_exec_999')).toBeNull();
      expect(ReminderService.extractFollowUpId('random_alarm')).toBeNull();
    });
  });

  describe('adjustToBusinessHours', () => {
    it('should leave timestamp unchanged if already within working days and hours', () => {
      // 2026-09-23 is a Wednesday. 14:30 (2:30 PM) is within 09:00 - 18:00
      const wednesdayAfternoon = new Date(2026, 8, 23, 14, 30, 0, 0).getTime();
      const adjusted = ReminderService.adjustToBusinessHours(wednesdayAfternoon, baseSettings);
      expect(adjusted).toBe(wednesdayAfternoon);
    });

    it('should advance an after-hours timestamp on a weekday to the next working day start', () => {
      // Wednesday 2026-09-23 at 19:30 (7:30 PM, after 18:00 end)
      const wednesdayNight = new Date(2026, 8, 23, 19, 30, 0, 0).getTime();
      const adjusted = ReminderService.adjustToBusinessHours(wednesdayNight, baseSettings);

      const adjDate = new Date(adjusted);
      expect(adjDate.getFullYear()).toBe(2026);
      expect(adjDate.getMonth()).toBe(8);
      expect(adjDate.getDate()).toBe(24); // Thursday
      expect(adjDate.getHours()).toBe(9);
      expect(adjDate.getMinutes()).toBe(0);
    });

    it('should move a Friday night timestamp to Monday morning', () => {
      // Friday 2026-09-25 at 20:00 (8:00 PM)
      const fridayNight = new Date(2026, 8, 25, 20, 0, 0, 0).getTime();
      const adjusted = ReminderService.adjustToBusinessHours(fridayNight, baseSettings);

      const adjDate = new Date(adjusted);
      expect(adjDate.getDay()).toBe(1); // Monday
      expect(adjDate.getDate()).toBe(28); // Sept 28
      expect(adjDate.getHours()).toBe(9);
      expect(adjDate.getMinutes()).toBe(0);
    });

    it('should move weekend timestamps to Monday morning', () => {
      // Saturday 2026-09-26 at 11:00 AM
      const saturday = new Date(2026, 8, 26, 11, 0, 0, 0).getTime();
      const adjusted = ReminderService.adjustToBusinessHours(saturday, baseSettings);

      const adjDate = new Date(adjusted);
      expect(adjDate.getDay()).toBe(1); // Monday
      expect(adjDate.getDate()).toBe(28);
      expect(adjDate.getHours()).toBe(9);
      expect(adjDate.getMinutes()).toBe(0);
    });

    it('should advance past holidays to the next regular working day', () => {
      // 2026-12-25 is Friday (configured as holiday in baseSettings)
      const christmas = new Date(2026, 11, 25, 10, 0, 0, 0).getTime();
      const adjusted = ReminderService.adjustToBusinessHours(christmas, baseSettings);

      const adjDate = new Date(adjusted);
      // Dec 26 is Saturday, Dec 27 is Sunday -> Dec 28 is Monday
      expect(adjDate.getDay()).toBe(1); // Monday
      expect(adjDate.getDate()).toBe(28);
      expect(adjDate.getMonth()).toBe(11); // December
      expect(adjDate.getHours()).toBe(9);
      expect(adjDate.getMinutes()).toBe(0);
    });
  });

  describe('scheduleReminder and cancelReminder', () => {
    it('should call AlarmManager.schedule when reminderAt is in the future', async () => {
      const scheduleSpy = vi.spyOn(AlarmManager, 'schedule').mockImplementation(() => {});
      const cancelSpy = vi.spyOn(AlarmManager, 'cancel').mockImplementation(() => {});

      const fu: FollowUp = {
        id: 'fu-test-1',
        contactId: '1234567@c.us',
        title: 'Call prospect',
        type: 'CALL',
        status: 'PENDING',
        priority: 'HIGH',
        dueAt: Date.now() + 3600000,
        reminderAt: Date.now() + 1800000,
        reminderStatus: 'PENDING',
        source: 'CRM',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await ReminderService.scheduleReminder(fu);

      expect(cancelSpy).toHaveBeenCalledWith('fu_reminder_fu-test-1');
      expect(scheduleSpy).toHaveBeenCalled();
      expect(scheduleSpy.mock.calls[0][0]).toBe('fu_reminder_fu-test-1');
    });

    it('should not schedule if reminderStatus is already TRIGGERED or COMPLETED', async () => {
      const scheduleSpy = vi.spyOn(AlarmManager, 'schedule').mockImplementation(() => {});

      const triggeredFu: FollowUp = {
        id: 'fu-test-2',
        contactId: '1234567@c.us',
        title: 'Already triggered',
        type: 'WHATSAPP',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueAt: Date.now() + 3600000,
        reminderAt: Date.now() + 1800000,
        reminderStatus: 'TRIGGERED',
        source: 'CRM',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await ReminderService.scheduleReminder(triggeredFu);
      expect(scheduleSpy).not.toHaveBeenCalled();
    });

    it('should invoke AlarmManager.cancel with proper prefix on cancelReminder', () => {
      const cancelSpy = vi.spyOn(AlarmManager, 'cancel').mockImplementation(() => {});
      ReminderService.cancelReminder('my-followup-id');
      expect(cancelSpy).toHaveBeenCalledWith('fu_reminder_my-followup-id');
    });
  });

  describe('handleAlarmFired', () => {
    it('should mark reminder as TRIGGERED and log activity', async () => {
      const fu = await FollowUpRepository.create({
        contactId: 'contact-fired@c.us',
        title: 'Fired reminder task',
        type: 'WHATSAPP',
        status: 'PENDING',
        priority: 'URGENT',
        dueAt: Date.now() + 60000,
        reminderAt: Date.now() + 10000,
        reminderStatus: 'PENDING',
        source: 'CRM',
      });

      await ReminderService.handleAlarmFired(fu.id);

      const updated = await FollowUpRepository.getById(fu.id);
      expect(updated?.reminderStatus).toBe('TRIGGERED');

      const activities = await FollowUpRepository.getActivities(fu.id);
      const triggeredAct = activities.find((a) => a.action === 'REMINDER_TRIGGERED');
      expect(triggeredAct).toBeDefined();
      expect(triggeredAct?.details).toContain('Fired reminder task');
    });
  });
});
