/**
 * FollowUpService
 * Central orchestrator connecting repository, reminder service, activity logging,
 * recurrence management, and event propagation.
 */

import { db } from '@/storage/db';
import { FollowUp, FollowUpPriority, FollowUpSource, FollowUpType } from '@/storage/schemas';
import { FollowUpRepository } from '@/storage/repositories/followup.repository';
import { ReminderService } from './reminder.service';

export interface CreateFollowUpInput {
  contactId: string;
  conversationId?: string;
  title: string;
  description?: string;
  type: FollowUpType;
  priority: FollowUpPriority;
  dueAt: number;
  reminderMinutesBefore?: number;
  notes?: string;
  source: FollowUpSource;
  relatedMessageId?: string;
  relatedWorkflowId?: string;
  autoCompleteOnReply?: boolean;
  recurrence?: FollowUp['recurrence'];
}

export class FollowUpService {
  /**
   * Creates a new follow-up and schedules the reminder alarm.
   */
  static async create(input: CreateFollowUpInput): Promise<FollowUp> {
    const reminderAt = this.computeReminderAt(input.dueAt, input.reminderMinutesBefore);

    const followUp = await FollowUpRepository.create({
      contactId: input.contactId,
      conversationId: input.conversationId,
      title: input.title,
      description: input.description,
      type: input.type,
      status: 'PENDING',
      priority: input.priority,
      dueAt: input.dueAt,
      reminderMinutesBefore: input.reminderMinutesBefore,
      reminderAt,
      reminderStatus: reminderAt ? 'PENDING' : undefined,
      notes: input.notes,
      source: input.source,
      relatedMessageId: input.relatedMessageId,
      relatedWorkflowId: input.relatedWorkflowId,
      autoCompleteOnReply: input.autoCompleteOnReply,
      recurrence: input.recurrence,
    });

    // Schedule alarm
    if (reminderAt) {
      await ReminderService.scheduleReminder(followUp);
    }

    return followUp;
  }

  /**
   * Completes a follow-up. If recurring, schedules the next occurrence.
   */
  static async complete(
    followUpId: string,
    completionNote?: string
  ): Promise<FollowUp | null> {
    const fu = await db.followUps.get(followUpId);
    if (!fu) return null;

    const now = Date.now();
    await FollowUpRepository.update(followUpId, {
      status: 'COMPLETED',
      completedAt: now,
      completionNote: completionNote || undefined,
      reminderStatus: 'COMPLETED',
    });

    await FollowUpRepository.logActivity(
      followUpId,
      fu.contactId,
      'COMPLETED',
      completionNote ? `Completed: ${completionNote}` : 'Follow-up completed'
    );

    // Cancel any pending alarm
    ReminderService.cancelReminder(followUpId);

    // Handle recurrence — create next occurrence
    if (fu.recurrence) {
      await this.createNextRecurrence(fu);
    }

    return { ...fu, status: 'COMPLETED', completedAt: now, completionNote };
  }

  /**
   * Snoozes a follow-up until a specific time.
   */
  static async snooze(followUpId: string, snoozedUntil: number): Promise<FollowUp | null> {
    const fu = await db.followUps.get(followUpId);
    if (!fu) return null;

    await FollowUpRepository.update(followUpId, {
      status: 'SNOOZED',
      snoozedUntil,
      reminderAt: snoozedUntil,
      reminderStatus: 'SNOOZED',
    });

    await FollowUpRepository.logActivity(
      followUpId,
      fu.contactId,
      'SNOOZED',
      `Snoozed until ${new Date(snoozedUntil).toLocaleString()}`
    );

    // Reschedule alarm to snooze time
    const updated = await db.followUps.get(followUpId);
    if (updated) {
      await ReminderService.rescheduleReminder(updated);
    }

    return updated || null;
  }

  /**
   * Reschedules a follow-up to a new date/time.
   */
  static async reschedule(
    followUpId: string,
    newDueAt: number,
    reminderMinutesBefore?: number
  ): Promise<FollowUp | null> {
    const fu = await db.followUps.get(followUpId);
    if (!fu) return null;

    const rmb = reminderMinutesBefore ?? fu.reminderMinutesBefore;
    const reminderAt = this.computeReminderAt(newDueAt, rmb);

    await FollowUpRepository.update(followUpId, {
      dueAt: newDueAt,
      status: 'PENDING',
      reminderMinutesBefore: rmb,
      reminderAt,
      reminderStatus: reminderAt ? 'PENDING' : undefined,
      snoozedUntil: undefined,
    });

    await FollowUpRepository.logActivity(
      followUpId,
      fu.contactId,
      'RESCHEDULED',
      `Rescheduled to ${new Date(newDueAt).toLocaleString()}`
    );

    // Reschedule alarm
    const updated = await db.followUps.get(followUpId);
    if (updated) {
      ReminderService.cancelReminder(followUpId);
      if (updated.reminderAt) {
        await ReminderService.scheduleReminder(updated);
      }
    }

    return updated || null;
  }

  /**
   * Cancels a follow-up.
   */
  static async cancel(followUpId: string, reason?: string): Promise<void> {
    const fu = await db.followUps.get(followUpId);
    if (!fu) return;

    await FollowUpRepository.update(followUpId, {
      status: 'CANCELLED',
      cancelledAt: Date.now(),
      cancellationReason: reason,
      reminderStatus: 'CANCELLED',
    });

    await FollowUpRepository.logActivity(
      followUpId,
      fu.contactId,
      'CANCELLED',
      reason ? `Cancelled: ${reason}` : 'Follow-up cancelled'
    );

    ReminderService.cancelReminder(followUpId);
  }

  /**
   * Edits a follow-up's details (not status transitions).
   */
  static async edit(
    followUpId: string,
    changes: Partial<Pick<FollowUp, 'title' | 'description' | 'type' | 'priority' | 'notes' | 'dueAt' | 'reminderMinutesBefore' | 'autoCompleteOnReply' | 'recurrence'>>
  ): Promise<FollowUp | null> {
    const fu = await db.followUps.get(followUpId);
    if (!fu) return null;

    const updates: Partial<FollowUp> = { ...changes };

    // Recalculate reminder if due date or reminder offset changed
    if (changes.dueAt || changes.reminderMinutesBefore !== undefined) {
      const dueAt = changes.dueAt ?? fu.dueAt;
      const rmb = changes.reminderMinutesBefore ?? fu.reminderMinutesBefore;
      updates.reminderAt = this.computeReminderAt(dueAt, rmb);
      updates.reminderStatus = updates.reminderAt ? 'PENDING' : undefined;
    }

    await FollowUpRepository.update(followUpId, updates);

    await FollowUpRepository.logActivity(
      followUpId,
      fu.contactId,
      'EDITED',
      'Follow-up details updated'
    );

    // Reschedule alarm if needed
    const updated = await db.followUps.get(followUpId);
    if (updated) {
      ReminderService.cancelReminder(followUpId);
      if (updated.reminderAt && updated.reminderStatus === 'PENDING') {
        await ReminderService.scheduleReminder(updated);
      }
    }

    return updated || null;
  }

  /**
   * Auto-completes follow-ups for a contact when a reply is received.
   * Only applies to follow-ups with autoCompleteOnReply = true.
   */
  static async handleContactReply(contactId: string, conversationId?: string): Promise<number> {
    const followUps = await FollowUpRepository.getByContactId(contactId);
    let completed = 0;

    for (const fu of followUps) {
      if (fu.status === 'COMPLETED' || fu.status === 'CANCELLED') continue;
      if (!fu.autoCompleteOnReply) continue;

      // Match conversation if available
      if (fu.conversationId && conversationId && fu.conversationId !== conversationId) continue;

      await FollowUpRepository.update(fu.id, {
        status: 'COMPLETED',
        completedAt: Date.now(),
        completionNote: 'Auto-completed: Customer replied',
        reminderStatus: 'COMPLETED',
      });

      await FollowUpRepository.logActivity(
        fu.id,
        contactId,
        'AUTO_COMPLETED',
        'Auto-completed because customer replied'
      );

      ReminderService.cancelReminder(fu.id);
      completed++;
    }

    return completed;
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private static computeReminderAt(
    dueAt: number,
    reminderMinutesBefore?: number
  ): number | undefined {
    if (reminderMinutesBefore === undefined || reminderMinutesBefore === null) return undefined;
    if (reminderMinutesBefore < 0) return undefined;
    return dueAt - reminderMinutesBefore * 60 * 1000;
  }

  /**
   * Creates the next occurrence when a recurring follow-up is completed.
   */
  private static async createNextRecurrence(completedFu: FollowUp): Promise<FollowUp | null> {
    const nextDueAt = FollowUpRepository.computeNextDueAt(completedFu);
    if (!nextDueAt) return null;

    const recurrence = completedFu.recurrence
      ? { ...completedFu.recurrence, currentOccurrence: completedFu.recurrence.currentOccurrence + 1 }
      : undefined;

    return this.create({
      contactId: completedFu.contactId,
      conversationId: completedFu.conversationId,
      title: completedFu.title,
      description: completedFu.description,
      type: completedFu.type,
      priority: completedFu.priority,
      dueAt: nextDueAt,
      reminderMinutesBefore: completedFu.reminderMinutesBefore,
      notes: completedFu.notes,
      source: completedFu.source,
      autoCompleteOnReply: completedFu.autoCompleteOnReply,
      recurrence,
    });
  }
}
