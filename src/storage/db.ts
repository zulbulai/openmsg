import Dexie, { type Table } from 'dexie';
import {
  Contact,
  Tag,
  ContactTag,
  Note,
  Conversation,
  MessageRecord,
  Workflow,
  WorkflowExecution,
  AutomationRule,
  BroadcastCampaign,
  BroadcastRecipient,
  ScheduledMessage,
  MessageTemplate,
  WebhookConfig,
  AuditLog,
  WorkflowExecutionLog,
  CrmPipeline,
  ContactStageHistory,
  SavedFilter,
  FollowUp,
  FollowUpActivity,
  FollowUpSettings,
  Sequence,
  SequenceEnrollment,
} from './schemas';

export class OpenMsgDatabase extends Dexie {
  contacts!: Table<Contact, string>;
  tags!: Table<Tag, string>;
  contactTags!: Table<ContactTag, string>;
  notes!: Table<Note, string>;
  conversations!: Table<Conversation, string>;
  messages!: Table<MessageRecord, string>;
  workflows!: Table<Workflow, string>;
  workflowExecutions!: Table<WorkflowExecution, string>;
  executionLogs!: Table<WorkflowExecutionLog, string>;
  automationRules!: Table<AutomationRule, string>;
  broadcastCampaigns!: Table<BroadcastCampaign, string>;
  broadcastRecipients!: Table<BroadcastRecipient, string>;
  scheduledMessages!: Table<ScheduledMessage, string>;
  templates!: Table<MessageTemplate, string>;
  webhooks!: Table<WebhookConfig, string>;
  auditLogs!: Table<AuditLog, string>;
  pipelines!: Table<CrmPipeline, string>;
  stageHistory!: Table<ContactStageHistory, string>;
  savedFilters!: Table<SavedFilter, string>;
  followUps!: Table<FollowUp, string>;
  followUpActivities!: Table<FollowUpActivity, string>;
  followUpSettings!: Table<FollowUpSettings, string>;
  sequences!: Table<Sequence, string>;
  sequenceEnrollments!: Table<SequenceEnrollment, string>;

  constructor() {
    super('OpenMsgDB');

    this.version(1).stores({
      contacts: '&id, phone, name, stageId, updatedAt, lastInteractionAt',
      tags: '&id, name',
      contactTags: '&id, contactId, tagId',
      notes: '&id, contactId, createdAt',
      conversations: '&id, contactId, unreadCount, pinned, archived, lastMessageTimestamp',
      messages: '&id, chatId, timestamp, status',
      workflows: '&id, name, isActive, triggerType, updatedAt',
      workflowExecutions: '&id, workflowId, contactId, status, resumeAt, startedAt',
      executionLogs: '&id, executionId, nodeId, status, startedAt',
      automationRules: '&id, name, enabled, trigger',
      broadcastCampaigns: '&id, status, scheduledAt, createdAt',
      broadcastRecipients: '&id, campaignId, contactId, status',
      scheduledMessages: '&id, contactId, triggerAt, status',
      templates: '&id, category, title',
      webhooks: '&id, enabled, name',
      auditLogs: '&id, timestamp, eventType, actor',
    });

    this.version(2).stores({
      contacts: '&id, phone, name, stageId, pipelineId, priority, isArchived, updatedAt, lastInteractionAt',
      pipelines: '&id, isDefault, isArchived, createdAt',
      stageHistory: '&id, contactId, pipelineId, changedAt',
      savedFilters: '&id, name, createdAt',
    });

    this.version(3).stores({
      followUps: '&id, contactId, conversationId, status, priority, type, dueAt, reminderAt, snoozedUntil, createdAt',
      followUpActivities: '&id, followUpId, contactId, action, timestamp',
      followUpSettings: '&id',
    });

    this.version(4).stores({
      sequences: '&id, isActive',
      sequenceEnrollments: '&id, sequenceId, contactId, status, nextStepAt',
    });
  }
}

export const db = new OpenMsgDatabase();

