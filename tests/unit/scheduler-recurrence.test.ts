import { describe, it, expect } from 'vitest';

function calculateNextTrigger(
  timeOfDay: string, // "09:30"
  recurrence: 'daily' | 'weekly',
  daysOfWeek: number[] = [1, 2, 3, 4, 5],
  baseTime: Date = new Date('2026-09-22T08:00:00.000Z')
): Date {
  const [hours, minutes] = timeOfDay.split(':').map(Number);
  const target = new Date(baseTime);
  target.setUTCHours(hours, minutes, 0, 0);

  if (target.getTime() <= baseTime.getTime()) {
    target.setUTCDate(target.getUTCDate() + 1);
  }

  if (recurrence === 'weekly') {
    while (!daysOfWeek.includes(target.getUTCDay())) {
      target.setUTCDate(target.getUTCDate() + 1);
    }
  }

  return target;
}

describe('Scheduler Recurrence Calculator Tests', () => {
  it('calculates next daily occurrence for future time today', () => {
    const base = new Date('2026-09-22T08:00:00.000Z');
    const next = calculateNextTrigger('10:00', 'daily', [], base);

    expect(next.getUTCHours()).toBe(10);
    expect(next.getUTCDate()).toBe(22);
  });

  it('calculates next daily occurrence for past time as tomorrow', () => {
    const base = new Date('2026-09-22T14:00:00.000Z');
    const next = calculateNextTrigger('09:00', 'daily', [], base);

    expect(next.getUTCHours()).toBe(9);
    expect(next.getUTCDate()).toBe(23);
  });

  it('calculates next weekly occurrence on matching weekday', () => {
    // 2026-09-22 is a Tuesday (UTCDay 2)
    const base = new Date('2026-09-22T12:00:00.000Z');
    // We only want Mondays (UTCDay 1)
    const next = calculateNextTrigger('09:00', 'weekly', [1], base);

    expect(next.getUTCDay()).toBe(1); // Monday
    expect(next.getUTCHours()).toBe(9);
    expect(next.getUTCDate()).toBe(28); // Next Monday is Sept 28
  });
});
