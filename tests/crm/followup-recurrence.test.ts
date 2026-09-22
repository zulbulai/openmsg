import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FollowUpRepository } from '@/storage/repositories/followup.repository';
import { FollowUpService } from '@/core/crm/followup.service';
import { db } from '@/storage/db';
import { FollowUp } from '@/storage/schemas';

describe('Follow-up Recurrence & Completion Workflows', () => {
  beforeEach(async () => {
    await db.followUps.clear();
    await db.followUpActivities.clear();
    await db.followUpSettings.clear();
    vi.restoreAllMocks();
  });

  describe('FollowUpRepository.computeNextDueAt', () => {
    const baseDue = new Date(2026, 8, 15, 10, 0, 0, 0).getTime(); // 2026-09-15 10:00 AM

    it('should compute DAILY intervals accurately', () => {
      const fu: FollowUp = {
        id: 'fu-rec-1',
        contactId: 'c1@c.us',
        title: 'Daily Standup',
        type: 'CALL',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueAt: baseDue,
        source: 'CRM',
        createdAt: baseDue,
        updatedAt: baseDue,
        recurrence: {
          frequency: 'DAILY',
          interval: 1,
          currentOccurrence: 1,
        },
      };

      const nextDue = FollowUpRepository.computeNextDueAt(fu);
      expect(nextDue).toBeDefined();
      const expected = baseDue + 24 * 60 * 60 * 1000;
      expect(nextDue).toBe(expected);
    });

    it('should compute WEEKLY intervals accurately', () => {
      const fu: FollowUp = {
        id: 'fu-rec-2',
        contactId: 'c1@c.us',
        title: 'Weekly Checkin',
        type: 'WHATSAPP',
        status: 'PENDING',
        priority: 'HIGH',
        dueAt: baseDue,
        source: 'CRM',
        createdAt: baseDue,
        updatedAt: baseDue,
        recurrence: {
          frequency: 'WEEKLY',
          interval: 2, // Every 2 weeks
          currentOccurrence: 1,
        },
      };

      const nextDue = FollowUpRepository.computeNextDueAt(fu);
      expect(nextDue).toBeDefined();
      const expected = baseDue + 14 * 24 * 60 * 60 * 1000;
      expect(nextDue).toBe(expected);
    });

    it('should compute MONTHLY intervals accurately', () => {
      const fu: FollowUp = {
        id: 'fu-rec-3',
        contactId: 'c1@c.us',
        title: 'Monthly Account Review',
        type: 'MEETING',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueAt: baseDue,
        source: 'CRM',
        createdAt: baseDue,
        updatedAt: baseDue,
        recurrence: {
          frequency: 'MONTHLY',
          interval: 1,
          currentOccurrence: 1,
        },
      };

      const nextDue = FollowUpRepository.computeNextDueAt(fu);
      expect(nextDue).toBeDefined();

      const nextDate = new Date(nextDue!);
      expect(nextDate.getFullYear()).toBe(2026);
      expect(nextDate.getMonth()).toBe(9); // October (0-indexed month 9)
      expect(nextDate.getDate()).toBe(15);
      expect(nextDate.getHours()).toBe(10);
    });

    it('should compute CUSTOM hourly intervals accurately', () => {
      const fu: FollowUp = {
        id: 'fu-rec-4',
        contactId: 'c1@c.us',
        title: '4-hour Ping',
        type: 'CUSTOM',
        status: 'PENDING',
        priority: 'LOW',
        dueAt: baseDue,
        source: 'AUTOMATION',
        createdAt: baseDue,
        updatedAt: baseDue,
        recurrence: {
          frequency: 'CUSTOM',
          interval: 4, // 4 hours
          currentOccurrence: 1,
        },
      };

      const nextDue = FollowUpRepository.computeNextDueAt(fu);
      expect(nextDue).toBe(baseDue + 4 * 60 * 60 * 1000);
    });

    it('should return null if maxOccurrences has been reached', () => {
      const fu: FollowUp = {
        id: 'fu-rec-5',
        contactId: 'c1@c.us',
        title: 'Limited Recurrence',
        type: 'CALL',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueAt: baseDue,
        source: 'CRM',
        createdAt: baseDue,
        updatedAt: baseDue,
        recurrence: {
          frequency: 'DAILY',
          interval: 1,
          currentOccurrence: 3,
          maxOccurrences: 3,
        },
      };

      const nextDue = FollowUpRepository.computeNextDueAt(fu);
      expect(nextDue).toBeNull();
    });

    it('should return null if next due date exceeds endDate', () => {
      const endDate = baseDue + 2 * 24 * 60 * 60 * 1000; // 2 days from baseDue
      const fu: FollowUp = {
        id: 'fu-rec-6',
        contactId: 'c1@c.us',
        title: 'End-Date Capped Recurrence',
        type: 'WHATSAPP',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueAt: baseDue,
        source: 'CRM',
        createdAt: baseDue,
        updatedAt: baseDue,
        recurrence: {
          frequency: 'WEEKLY', // +7 days will exceed 2 days endDate
          interval: 1,
          currentOccurrence: 1,
          endDate,
        },
      };

      const nextDue = FollowUpRepository.computeNextDueAt(fu);
      expect(nextDue).toBeNull();
    });
  });

  describe('FollowUpService.complete with Recurrence Chain', () => {
    it('should auto-create the next recurrence on completion until maxOccurrences is reached', async () => {
      const contactId = 'client99@c.us';
      const initialDue = Date.now() + 3600000;

      // Create recurring follow-up with max 2 occurrences
      const first = await FollowUpService.create({
        contactId,
        title: 'Recurring onboarding checkup',
        type: 'CALL',
        priority: 'HIGH',
        dueAt: initialDue,
        source: 'CRM',
        recurrence: {
          frequency: 'DAILY',
          interval: 1,
          currentOccurrence: 1,
          maxOccurrences: 2,
        },
      });

      expect(first.id).toBeDefined();

      // 1. Complete the first occurrence
      const completedFirst = await FollowUpService.complete(first.id, 'First checkup done');
      expect(completedFirst?.status).toBe('COMPLETED');
      expect(completedFirst?.completionNote).toBe('First checkup done');

      // Check that a 2nd follow-up was automatically created
      const allFollowUps = await FollowUpRepository.getByContactId(contactId);
      expect(allFollowUps.length).toBe(2);

      const second = allFollowUps.find((f) => f.id !== first.id);
      expect(second).toBeDefined();
      expect(second?.status).toBe('PENDING');
      expect(second?.title).toBe('Recurring onboarding checkup');
      expect(second?.recurrence?.currentOccurrence).toBe(2);
      expect(second?.recurrence?.maxOccurrences).toBe(2);
      expect(second?.dueAt).toBe(initialDue + 24 * 60 * 60 * 1000);

      // 2. Complete the second occurrence
      const completedSecond = await FollowUpService.complete(second!.id, 'Second checkup done');
      expect(completedSecond?.status).toBe('COMPLETED');

      // Check that NO 3rd follow-up was created because maxOccurrences (2) was hit
      const afterSecond = await FollowUpRepository.getByContactId(contactId);
      expect(afterSecond.length).toBe(2);
      expect(afterSecond.every((f) => f.status === 'COMPLETED')).toBe(true);
    });
  });

  describe('FollowUpService.handleContactReply (autoCompleteOnReply)', () => {
    it('should complete only follow-ups configured with autoCompleteOnReply', async () => {
      const contactId = 'reply-contact@c.us';

      const autoCompFu = await FollowUpService.create({
        contactId,
        title: 'Awaiting customer answer',
        type: 'WHATSAPP',
        priority: 'MEDIUM',
        dueAt: Date.now() + 86400000,
        source: 'CRM',
        autoCompleteOnReply: true,
      });

      const manualFu = await FollowUpService.create({
        contactId,
        title: 'Internal review of customer files',
        type: 'GENERAL',
        priority: 'LOW',
        dueAt: Date.now() + 86400000,
        source: 'CRM',
        autoCompleteOnReply: false,
      });

      const completedCount = await FollowUpService.handleContactReply(contactId);
      expect(completedCount).toBe(1);

      const updatedAuto = await FollowUpRepository.getById(autoCompFu.id);
      expect(updatedAuto?.status).toBe('COMPLETED');
      expect(updatedAuto?.completionNote).toContain('Customer replied');

      const updatedManual = await FollowUpRepository.getById(manualFu.id);
      expect(updatedManual?.status).toBe('PENDING');
    });
  });
});
