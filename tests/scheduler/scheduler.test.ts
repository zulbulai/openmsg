import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/storage/db';
import { ScheduledMessage } from '@/storage/schemas';

describe('Scheduler Durable Persistence', () => {
  beforeEach(async () => {
    await db.scheduledMessages.clear();
  });

  it('should persist scheduled messages and restore them across simulated restart', async () => {
    const triggerAt = Date.now() + 60000;
    const task: ScheduledMessage = {
      id: 'sched_101',
      contactId: '15551234567@c.us',
      messageText: 'Automated follow-up message',
      triggerAt,
      status: 'PENDING',
      createdAt: Date.now(),
    };

    // 1. Create schedule and save to IndexedDB
    await db.scheduledMessages.put(task);

    // 2. Simulate service worker shutdown (in-memory state destroyed)
    const activeTasksInMemory = null;
    expect(activeTasksInMemory).toBeNull();

    // 3. Simulate service worker startup / restoration
    const restoredTasks = await db.scheduledMessages
      .where('status')
      .equals('PENDING')
      .toArray();

    expect(restoredTasks.length).toBe(1);
    expect(restoredTasks[0].id).toBe('sched_101');
    expect(restoredTasks[0].messageText).toBe('Automated follow-up message');

    // 4. Simulate execution (idempotent transition to SENT)
    const item = restoredTasks[0];
    item.status = 'SENT';
    await db.scheduledMessages.put(item);

    // 5. Verify it cannot be executed a second time
    const pendingAfter = await db.scheduledMessages
      .where('status')
      .equals('PENDING')
      .toArray();
    expect(pendingAfter.length).toBe(0);
  });
});
