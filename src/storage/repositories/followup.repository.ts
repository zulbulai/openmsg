/**
 * FollowUp Repository
 * CRUD operations, filtered queries, dashboard aggregations, and recurrence calculation.
 */

import { db } from '@/storage/db';
import {
  FollowUp,
  FollowUpActivity,
  FollowUpActivityAction,
  FollowUpSettings,
  FollowUpStatus,
  FollowUpPriority,
  FollowUpType,
} from '@/storage/schemas';

// Priority sort weight (lower = sorted first)
const PRIORITY_WEIGHT: Record<FollowUpPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export interface FollowUpFilterOptions {
  status?: FollowUpStatus | FollowUpStatus[];
  priority?: FollowUpPriority | FollowUpPriority[];
  type?: FollowUpType | FollowUpType[];
  contactId?: string;
  dateFrom?: number;
  dateTo?: number;
  search?: string;
}

export interface FollowUpDashboardCounts {
  today: number;
  upcoming: number;
  overdue: number;
  completedToday: number;
  highPriority: number;
  total: number;
}

export class FollowUpRepository {
  private static generateId(): string {
    return `fu_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private static activityId(): string {
    return `fua_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  static async create(data: Omit<FollowUp, 'id' | 'createdAt' | 'updatedAt'>): Promise<FollowUp> {
    const now = Date.now();
    const followUp: FollowUp = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await db.followUps.add(followUp);
    await this.logActivity(followUp.id, followUp.contactId, 'CREATED', `Created: ${followUp.title}`);
    return followUp;
  }

  static async update(id: string, changes: Partial<FollowUp>): Promise<void> {
    await db.followUps.update(id, { ...changes, updatedAt: Date.now() });
  }

  static async getById(id: string): Promise<FollowUp | undefined> {
    return db.followUps.get(id);
  }

  static async delete(id: string): Promise<void> {
    await db.followUps.delete(id);
    // Clean up associated activities
    await db.followUpActivities.where('followUpId').equals(id).delete();
  }

  static async getByContactId(contactId: string): Promise<FollowUp[]> {
    return db.followUps.where('contactId').equals(contactId).reverse().sortBy('dueAt');
  }

  // ── Filtered Listing ──────────────────────────────────────────────────────

  static async list(filters?: FollowUpFilterOptions): Promise<FollowUp[]> {
    let collection = db.followUps.toCollection();

    if (filters?.contactId) {
      collection = db.followUps.where('contactId').equals(filters.contactId);
    }

    let results = await collection.toArray();

    // Apply in-memory filters
    if (filters) {
      const statusSet = filters.status
        ? new Set(Array.isArray(filters.status) ? filters.status : [filters.status])
        : null;
      const prioritySet = filters.priority
        ? new Set(Array.isArray(filters.priority) ? filters.priority : [filters.priority])
        : null;
      const typeSet = filters.type
        ? new Set(Array.isArray(filters.type) ? filters.type : [filters.type])
        : null;

      results = results.filter((fu) => {
        if (statusSet && !statusSet.has(this.computeStatus(fu))) return false;
        if (prioritySet && !prioritySet.has(fu.priority)) return false;
        if (typeSet && !typeSet.has(fu.type)) return false;
        if (filters.dateFrom && fu.dueAt < filters.dateFrom) return false;
        if (filters.dateTo && fu.dueAt > filters.dateTo) return false;
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const searchable = `${fu.title} ${fu.description || ''} ${fu.notes || ''}`.toLowerCase();
          if (!searchable.includes(q)) return false;
        }
        return true;
      });
    }

    // Default sort: overdue first, then by priority weight, then by dueAt ascending
    results.sort((a, b) => {
      const statusA = this.computeStatus(a);
      const statusB = this.computeStatus(b);
      // Overdue first
      if (statusA === 'OVERDUE' && statusB !== 'OVERDUE') return -1;
      if (statusB === 'OVERDUE' && statusA !== 'OVERDUE') return 1;
      // Then by priority
      const pw = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      if (pw !== 0) return pw;
      // Then by due time
      return a.dueAt - b.dueAt;
    });

    return results;
  }

  // ── Dashboard Aggregation ─────────────────────────────────────────────────

  static async getDashboardCounts(): Promise<FollowUpDashboardCounts> {
    const all = await db.followUps.toArray();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayStart = startOfToday.getTime();

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const todayEnd = endOfToday.getTime();

    let today = 0;
    let upcoming = 0;
    let overdue = 0;
    let completedToday = 0;
    let highPriority = 0;

    for (const fu of all) {
      const status = this.computeStatus(fu);

      if (status === 'OVERDUE') {
        overdue++;
      }

      if (status === 'COMPLETED' && fu.completedAt && fu.completedAt >= todayStart && fu.completedAt <= todayEnd) {
        completedToday++;
      }

      if ((status === 'PENDING' || status === 'DUE' || status === 'SNOOZED') && fu.dueAt >= todayStart && fu.dueAt <= todayEnd) {
        today++;
      }

      if ((status === 'PENDING' || status === 'DUE' || status === 'SNOOZED') && fu.dueAt > todayEnd) {
        upcoming++;
      }

      if ((status === 'PENDING' || status === 'DUE' || status === 'OVERDUE') && (fu.priority === 'HIGH' || fu.priority === 'URGENT')) {
        highPriority++;
      }
    }

    return { today, upcoming, overdue, completedToday, highPriority, total: all.length };
  }

  // ── Status Computation ────────────────────────────────────────────────────

  /**
   * Computes the effective status of a follow-up based on persistent data + current time.
   * Does NOT modify the stored record — this is a pure read-time calculation.
   */
  static computeStatus(fu: FollowUp): FollowUpStatus {
    // Terminal states are final
    if (fu.status === 'COMPLETED' || fu.status === 'CANCELLED') return fu.status;

    // If snoozed and snooze time has not elapsed, remain snoozed
    if (fu.status === 'SNOOZED' && fu.snoozedUntil && fu.snoozedUntil > Date.now()) {
      return 'SNOOZED';
    }

    const now = Date.now();
    if (fu.dueAt <= now) {
      return 'OVERDUE';
    }

    // Due within the next hour
    if (fu.dueAt - now <= 60 * 60 * 1000) {
      return 'DUE';
    }

    return 'PENDING';
  }

  // ── Today's follow-ups (sorted for Today view) ────────────────────────────

  static async getTodayFollowUps(): Promise<FollowUp[]> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const all = await db.followUps
      .where('dueAt')
      .between(startOfToday.getTime(), endOfToday.getTime(), true, true)
      .toArray();

    // Also include overdue items
    const overdue = await db.followUps
      .where('dueAt')
      .below(startOfToday.getTime())
      .toArray();

    const activeItems = [...overdue, ...all].filter((fu) => {
      const status = this.computeStatus(fu);
      return status !== 'COMPLETED' && status !== 'CANCELLED';
    });

    // Sort: overdue → urgent → high → due time
    activeItems.sort((a, b) => {
      const statusA = this.computeStatus(a);
      const statusB = this.computeStatus(b);
      if (statusA === 'OVERDUE' && statusB !== 'OVERDUE') return -1;
      if (statusB === 'OVERDUE' && statusA !== 'OVERDUE') return 1;
      const pw = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      if (pw !== 0) return pw;
      return a.dueAt - b.dueAt;
    });

    return activeItems;
  }

  // ── Pending Reminders (for alarm reconciliation) ──────────────────────────

  static async getPendingReminders(): Promise<FollowUp[]> {
    return db.followUps
      .filter((fu) => {
        if (fu.status === 'COMPLETED' || fu.status === 'CANCELLED') return false;
        if (!fu.reminderAt) return false;
        if (fu.reminderStatus === 'TRIGGERED' || fu.reminderStatus === 'DISMISSED' || fu.reminderStatus === 'COMPLETED' || fu.reminderStatus === 'CANCELLED') return false;
        return true;
      })
      .toArray();
  }

  // ── Activity Log ──────────────────────────────────────────────────────────

  static async logActivity(
    followUpId: string,
    contactId: string,
    action: FollowUpActivityAction,
    details?: string
  ): Promise<void> {
    const activity: FollowUpActivity = {
      id: this.activityId(),
      followUpId,
      contactId,
      action,
      details,
      timestamp: Date.now(),
    };
    await db.followUpActivities.add(activity);
  }

  static async getActivities(followUpId: string): Promise<FollowUpActivity[]> {
    return db.followUpActivities
      .where('followUpId')
      .equals(followUpId)
      .reverse()
      .sortBy('timestamp');
  }

  static async getContactActivities(contactId: string): Promise<FollowUpActivity[]> {
    return db.followUpActivities
      .where('contactId')
      .equals(contactId)
      .reverse()
      .sortBy('timestamp');
  }

  // ── Recurrence ────────────────────────────────────────────────────────────

  /**
   * Calculates the next due timestamp for a recurring follow-up.
   * Returns null if recurrence has ended.
   */
  static computeNextDueAt(fu: FollowUp): number | null {
    if (!fu.recurrence) return null;

    const rec = fu.recurrence;
    const currentDue = new Date(fu.dueAt);

    // Check max occurrences
    if (rec.maxOccurrences && rec.currentOccurrence >= rec.maxOccurrences) {
      return null;
    }

    // Check end date
    if (rec.endDate && fu.dueAt >= rec.endDate) {
      return null;
    }

    let nextDue: Date;

    switch (rec.frequency) {
      case 'DAILY':
        nextDue = new Date(currentDue.getTime() + rec.interval * 24 * 60 * 60 * 1000);
        break;
      case 'WEEKLY':
        nextDue = new Date(currentDue.getTime() + rec.interval * 7 * 24 * 60 * 60 * 1000);
        break;
      case 'MONTHLY': {
        nextDue = new Date(currentDue);
        nextDue.setMonth(nextDue.getMonth() + rec.interval);
        break;
      }
      case 'CUSTOM':
        // Custom uses interval as hours
        nextDue = new Date(currentDue.getTime() + rec.interval * 60 * 60 * 1000);
        break;
      default:
        return null;
    }

    // Validate against end date
    if (rec.endDate && nextDue.getTime() > rec.endDate) {
      return null;
    }

    return nextDue.getTime();
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  static async getSettings(): Promise<FollowUpSettings> {
    const existing = await db.followUpSettings.get('default');
    if (existing) return existing;

    // Return sensible defaults
    const defaults: FollowUpSettings = {
      id: 'default',
      enableNotifications: true,
      defaultReminderMinutes: 30,
      defaultPriority: 'MEDIUM',
      workingDays: [1, 2, 3, 4, 5], // Mon-Fri
      businessHoursStart: '09:00',
      businessHoursEnd: '18:00',
      outsideHoursBehavior: 'NOTIFY_ANYWAY',
      holidays: [],
    };
    return defaults;
  }

  static async saveSettings(settings: FollowUpSettings): Promise<void> {
    await db.followUpSettings.put({ ...settings, id: 'default' });
  }

  // ── Calendar ──────────────────────────────────────────────────────────────

  static async getFollowUpsForDateRange(
    startMs: number,
    endMs: number
  ): Promise<FollowUp[]> {
    return db.followUps
      .where('dueAt')
      .between(startMs, endMs, true, true)
      .toArray();
  }

  // ── Search (cross-contact) ────────────────────────────────────────────────

  static async search(query: string): Promise<FollowUp[]> {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    return db.followUps
      .filter((fu) => {
        const searchable = `${fu.title} ${fu.description || ''} ${fu.notes || ''} ${fu.contactId}`.toLowerCase();
        return searchable.includes(q);
      })
      .toArray();
  }
}
