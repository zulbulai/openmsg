/**
 * OpenMsg Automation Rule Engine
 * Evaluates triggers, applies keyword matching, checks deduplication, and runs automated actions.
 */

import { db } from '@/storage/db';
import { AutomationRule } from '@/storage/schemas';
import { eventDeduplication } from './deduplication';
import { WhatsAppClient } from '@/types/whatsapp';
import { ContactRepository } from '@/storage/repositories/contact.repository';
import { WebhookDispatcher } from '@/core/webhook/dispatcher';
import { SafeTemplate } from '@/core/template/safe-template';
import { FollowUpService } from '@/core/crm/followup.service';
import { SequenceRepository } from '@/storage/repositories/sequence.repository';

export interface AutomationTriggerEvent {
  id: string; // Event or message ID for deduplication
  trigger:
    | 'MESSAGE_RECEIVED'
    | 'KEYWORD_MATCH'
    | 'CONTACT_CREATED'
    | 'TAG_ADDED'
    | 'SCHEDULE'
    | 'MANUAL'
    | 'CONTACT_STAGE_CHANGED';
  contactId: string;
  messageText?: string;
  tagId?: string;
  metadata?: Record<string, unknown>;
}

export class AutomationService {
  private static isInitialized = false;

  /**
   * Initializes listeners for CRM stage changes
   */
  static init(client?: WhatsAppClient, onStartWorkflow?: (workflowId: string, contactId: string) => Promise<void>): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Dynamically import crmEvents to avoid circular dependency
    import('@/core/events/crm-events').then(({ crmEvents }) => {
      crmEvents.on('CONTACT_STAGE_CHANGED', async (payload) => {
        await AutomationService.handleEvent(
          {
            id: payload.id || `stage_${payload.contactId}_${payload.changedAt}`,
            trigger: 'CONTACT_STAGE_CHANGED',
            contactId: payload.contactId,
            metadata: {
              pipelineId: payload.pipelineId,
              fromStageId: payload.fromStageId,
              toStageId: payload.toStageId,
            },
          },
          client,
          onStartWorkflow
        );
      });
    });
  }

  /**
   * Matches text against a keyword condition
   */
  static matchKeyword(
    text: string,
    pattern: string,
    matchType: 'exact' | 'contains' | 'starts_with' | 'regex' = 'contains'
  ): boolean {
    if (!text || !pattern) return false;
    const cleanText = text.trim().toLowerCase();
    const cleanPattern = pattern.trim().toLowerCase();

    switch (matchType) {
      case 'exact':
        return cleanText === cleanPattern;
      case 'starts_with':
        return cleanText.startsWith(cleanPattern);
      case 'regex':
        try {
          const re = new RegExp(pattern, 'i');
          return re.test(text);
        } catch {
          return false;
        }
      case 'contains':
      default:
        return cleanText.includes(cleanPattern);
    }
  }

  /**
   * Processes an incoming event against all active automation rules
   */
  static async handleEvent(
    event: AutomationTriggerEvent,
    client?: WhatsAppClient,
    onStartWorkflow?: (workflowId: string, contactId: string) => Promise<void>
  ): Promise<number> {
    // Prevent duplicate processing of the same event
    if (eventDeduplication.isDuplicate(event.id)) {
      return 0;
    }

    // Auto-complete any pending follow-ups with autoCompleteOnReply enabled for this contact
    if (event.trigger === 'MESSAGE_RECEIVED' && event.contactId) {
      try {
        const pendingWithAutoComplete = await db.followUps
          .where('contactId')
          .equals(event.contactId)
          .filter((fu) => !!fu.autoCompleteOnReply && (fu.status === 'PENDING' || fu.status === 'DUE' || fu.status === 'SNOOZED'))
          .toArray();

        for (const fu of pendingWithAutoComplete) {
          await FollowUpService.complete(fu.id, 'Auto-completed on customer reply.');
        }
      } catch (err) {
        console.error('Failed to auto-complete follow-ups on reply:', err);
      }
    }

    const rules = await db.automationRules.where('enabled').equals(1).toArray();
    let triggeredCount = 0;

    for (const rule of rules) {
      if (this.shouldTrigger(rule, event)) {
        await this.executeRuleActions(rule, event, client, onStartWorkflow);
        triggeredCount++;
      }
    }

    return triggeredCount;
  }

  /**
   * Evaluates whether a rule's conditions match the event
   */
  private static shouldTrigger(rule: AutomationRule, event: AutomationTriggerEvent): boolean {
    // 1. Check trigger type
    if (rule.trigger !== event.trigger && rule.trigger !== 'ANY') {
      return false;
    }

    if (rule.conditions && rule.conditions.length > 0) {
      for (const cond of rule.conditions) {
        if (
          cond.field === 'text' ||
          cond.field === 'message' ||
          cond.field === 'body' ||
          cond.field === 'keyword'
        ) {
          const matchType = (cond.operator as any) || 'contains';
          const matched = this.matchKeyword(event.messageText || '', String(cond.value || ''), matchType);
          if (!matched) return false;
        } else if (cond.field === 'stageId' || cond.field === 'toStageId' || cond.field === 'stage') {
          const targetStage = String(cond.value || '').toLowerCase();
          const currentStage = String(event.metadata?.toStageId || '').toLowerCase();
          if (cond.operator === 'equals' && currentStage !== targetStage) return false;
          if (cond.operator === 'not_equals' && currentStage === targetStage) return false;
        } else if (cond.field === 'pipelineId') {
          const targetPipe = String(cond.value || '').toLowerCase();
          const currentPipe = String(event.metadata?.pipelineId || '').toLowerCase();
          if (currentPipe !== targetPipe) return false;
        }
      }
    }

    return true;
  }

  /**
   * Executes all actions defined on the matched automation rule
   */
  private static async executeRuleActions(
    rule: AutomationRule,
    event: AutomationTriggerEvent,
    client?: WhatsAppClient,
    onStartWorkflow?: (workflowId: string, contactId: string) => Promise<void>
  ): Promise<void> {
    for (const action of rule.actions) {
      try {
        switch (action.type) {
          case 'SEND_MESSAGE': {
            const raw = (action.config.text as string) || '';
            const text = SafeTemplate.render(raw, {
              contact: { id: event.contactId },
              message: { text: event.messageText },
            });
            if (client && text) {
              await client.sendText({
                chatId: event.contactId,
                text,
              });
            }
            break;
          }

          case 'MOVE_CONTACT_STAGE': {
            const stageId = action.config.stageId as string;
            const pipelineId = action.config.pipelineId as string | undefined;
            if (stageId) {
              await ContactRepository.moveStage(event.contactId, stageId, pipelineId, 'AUTOMATION');
            }
            break;
          }

          case 'ADD_TAG': {
            const tagId = action.config.tagId as string;
            if (tagId) {
              await ContactRepository.addTag(event.contactId, tagId);
            }
            break;
          }

          case 'REMOVE_TAG': {
            const tagId = action.config.tagId as string;
            if (tagId) {
              await ContactRepository.removeTag(event.contactId, tagId);
            }
            break;
          }

          case 'ADD_NOTE': {
            const content = action.config.note as string;
            if (content) {
              await ContactRepository.addNote(event.contactId, content);
            }
            break;
          }

          case 'START_WORKFLOW': {
            const workflowId = action.config.workflowId as string;
            if (workflowId && onStartWorkflow) {
              await onStartWorkflow(workflowId, event.contactId);
            }
            break;
          }

          case 'WEBHOOK': {
            await WebhookDispatcher.dispatch('automation_triggered', {
              ruleId: rule.id,
              ruleName: rule.name,
              contactId: event.contactId,
              event,
            });
            break;
          }

          case 'CREATE_FOLLOW_UP': {
            const title = (action.config.title as string) || 'Follow-up';
            const description = action.config.description as string | undefined;
            const type = (action.config.followUpType as any) || 'GENERAL';
            const priority = (action.config.priority as any) || 'MEDIUM';
            const delayHours = Number(action.config.delayHours) || 24;
            const reminderMinutes = action.config.reminderMinutes !== undefined ? Number(action.config.reminderMinutes) : 30;

            const dueAt = Date.now() + delayHours * 60 * 60 * 1000;

            await FollowUpService.create({
              contactId: event.contactId,
              title,
              description,
              type,
              priority,
              dueAt,
              reminderMinutesBefore: reminderMinutes >= 0 ? reminderMinutes : undefined,
              source: 'AUTOMATION',
            });
            break;
          }

          case 'ENROLL_SEQUENCE': {
            const sequenceId = action.config.sequenceId as string;
            if (sequenceId) {
              await SequenceRepository.enrollContact(sequenceId, event.contactId);
            }
            break;
          }

          case 'UNENROLL_SEQUENCE': {
            const sequenceId = action.config.sequenceId as string;
            if (sequenceId) {
              await SequenceRepository.unenrollContact(sequenceId, event.contactId);
            }
            break;
          }
        }
      } catch (err) {
        console.error(`Failed to execute automation action ${action.type}:`, err);
      }
    }
  }
}
