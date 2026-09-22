import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { FollowUpRepository } from '@/storage/repositories/followup.repository';
import { db } from '@/storage/db';
import { FollowUp } from '@/storage/schemas';

describe('FollowUpRepository', () => {
  beforeEach(async () => {
    await db.followUps.clear();
    await db.followUpActivities.clear();
    await db.followUpSettings.clear();
  });

  it('should create and retrieve a follow-up with activity logging', async () => {
    const contactId = '15551234567@c.us';
    const dueAt = Date.now() + 3600000;

    const created = await FollowUpRepository.create({
      contactId,
      title: 'Call prospect regarding invoice',
      description: 'Follow up about contract details',
      type: 'CALL',
      status: 'PENDING',
      priority: 'HIGH',
      dueAt,
      source: 'CRM',
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Call prospect regarding invoice');
    expect(created.priority).toBe('HIGH');

    const found = await FollowUpRepository.getById(created.id);
    expect(found).toBeDefined();
    expect(found?.contactId).toBe(contactId);

    // Verify activity was logged
    const activities = await FollowUpRepository.getActivities(created.id);
    expect(activities.length).toBeGreaterThanOrEqual(1);
    expect(activities[0].action).toBe('CREATED');
  });

  it('should accurately compute overdue and due status based on timestamps', async () => {
    const now = Date.now();

    // Overdue item (due in the past)
    const overdueFu = await FollowUpRepository.create({
      contactId: 'c1@c.us',
      title: 'Overdue task',
      type: 'WHATSAPP',
      status: 'PENDING',
      priority: 'URGENT',
      dueAt: now - 3600000, // 1 hour ago
      source: 'MANUAL',
    });

    // Upcoming item (due tomorrow)
    const upcomingFu = await FollowUpRepository.create({
      contactId: 'c2@c.us',
      title: 'Upcoming task',
      type: 'MEETING',
      status: 'PENDING',
      priority: 'MEDIUM',
      dueAt: now + 86400000, // tomorrow
      source: 'MANUAL',
    });

    expect(FollowUpRepository.computeStatus(overdueFu)).toBe('OVERDUE');
    expect(FollowUpRepository.computeStatus(upcomingFu)).toBe('PENDING');

    // Completed item should stay completed even if dueAt is in the past
    const completedFu: FollowUp = {
      ...overdueFu,
      status: 'COMPLETED',
      completedAt: now,
    };
    expect(FollowUpRepository.computeStatus(completedFu)).toBe('COMPLETED');
  });

  it('should filter follow-ups by priority, type, and status', async () => {
    const now = Date.now();

    await FollowUpRepository.create({
      contactId: 'c1@c.us',
      title: 'Call 1',
      type: 'CALL',
      status: 'PENDING',
      priority: 'LOW',
      dueAt: now + 10000,
      source: 'CRM',
    });

    await FollowUpRepository.create({
      contactId: 'c2@c.us',
      title: 'Meeting 1',
      type: 'MEETING',
      status: 'PENDING',
      priority: 'HIGH',
      dueAt: now + 20000,
      source: 'CRM',
    });

    await FollowUpRepository.create({
      contactId: 'c3@c.us',
      title: 'Payment 1',
      type: 'PAYMENT',
      status: 'COMPLETED',
      priority: 'URGENT',
      dueAt: now + 30000,
      source: 'CRM',
    });

    // Filter by type
    const calls = await FollowUpRepository.list({ type: 'CALL' });
    expect(calls.length).toBe(1);
    expect(calls[0].title).toBe('Call 1');

    // Filter by priority
    const highPri = await FollowUpRepository.list({ priority: 'HIGH' });
    expect(highPri.length).toBe(1);
    expect(highPri[0].title).toBe('Meeting 1');

    // Filter by status
    const completed = await FollowUpRepository.list({ status: 'COMPLETED' });
    expect(completed.length).toBe(1);
    expect(completed[0].title).toBe('Payment 1');
  });

  it('should calculate accurate dashboard counts', async () => {
    const now = Date.now();

    // 1. Overdue
    await FollowUpRepository.create({
      contactId: 'c1@c.us',
      title: 'Overdue task',
      type: 'CALL',
      status: 'PENDING',
      priority: 'HIGH',
      dueAt: now - 7200000,
      source: 'CRM',
    });

    // 2. Today's task
    const today = new Date();
    today.setHours(14, 0, 0, 0);
    await FollowUpRepository.create({
      contactId: 'c2@c.us',
      title: 'Today task',
      type: 'WHATSAPP',
      status: 'PENDING',
      priority: 'MEDIUM',
      dueAt: today.getTime(),
      source: 'CRM',
    });

    // 3. Upcoming (next week)
    await FollowUpRepository.create({
      contactId: 'c3@c.us',
      title: 'Next week task',
      type: 'MEETING',
      status: 'PENDING',
      priority: 'LOW',
      dueAt: now + 7 * 86400000,
      source: 'CRM',
    });

    const counts = await FollowUpRepository.getDashboardCounts();
    expect(counts.total).toBe(3);
    expect(counts.overdue).toBe(1);
    expect(counts.today).toBe(1);
    expect(counts.upcoming).toBe(1);
    expect(counts.highPriority).toBe(1);
  });
});
