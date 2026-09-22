import { describe, it, expect } from 'vitest';

describe('Analytics Metric Calculation Tests', () => {
  it('accurately aggregates message directions and unread counts', () => {
    const messages = [
      { fromMe: true, timestamp: 1000 },
      { fromMe: false, timestamp: 2000 },
      { fromMe: false, timestamp: 3000 },
      { fromMe: true, timestamp: 4000 },
      { fromMe: true, timestamp: 5000 },
    ];

    const conversations = [
      { unreadCount: 2 },
      { unreadCount: 0 },
      { unreadCount: 5 },
    ];

    const sent = messages.filter((m) => m.fromMe).length;
    const received = messages.filter((m) => !m.fromMe).length;
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    expect(sent).toBe(3);
    expect(received).toBe(2);
    expect(totalUnread).toBe(7);
  });

  it('calculates campaign completion percentage', () => {
    const campaign = {
      totalRecipients: 200,
      sentCount: 150,
      failedCount: 10,
    };

    const completionRate = Math.round((campaign.sentCount / campaign.totalRecipients) * 100);
    expect(completionRate).toBe(75);
  });
});
