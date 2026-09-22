import { describe, it, expect } from 'vitest';
import { MessageDispatchQueue } from '@/core/rate-limiter/queue';

describe('MessageDispatchQueue', () => {
  it('should initialize with configurable defaults', () => {
    const queue = new MessageDispatchQueue({
      minDelayMs: 10,
      maxDelayMs: 20,
      maxPerHour: 100,
    });
    const config = queue.getConfig();
    expect(config.minDelayMs).toBe(10);
    expect(config.maxDelayMs).toBe(20);
    expect(config.maxPerHour).toBe(100);
  });

  it('should enqueue and execute an item', async () => {
    const queue = new MessageDispatchQueue({
      minDelayMs: 1,
      maxDelayMs: 2,
    });

    let executed = false;
    await new Promise<void>((resolve) => {
      queue.enqueue(
        'job_1',
        async () => {
          executed = true;
          return { ok: true };
        },
        {
          onSuccess: () => {
            resolve();
          },
        }
      );
    });

    expect(executed).toBe(true);
  });

  it('should support pausing and resuming the queue', () => {
    const queue = new MessageDispatchQueue({
      minDelayMs: 50,
      maxDelayMs: 100,
    });

    queue.pause();
    expect(queue.isPausedState).toBe(true);

    queue.enqueue('job_paused', async () => {});
    expect(queue.pendingCount).toBe(1);

    queue.resume();
    expect(queue.isPausedState).toBe(false);

    queue.clear();
    expect(queue.pendingCount).toBe(0);
  });
});
