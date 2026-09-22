/**
 * OpenMsg Storage Entity Schemas
 */

export interface Contact {
  id: string; // WhatsApp wid (e.g. '1234567890@c.us')
  phone: string;
  name: string;
  pushName?: string;
  avatarUrl?: string;
  isGroup: boolean;
  pipelineId?: string;
  stageId?: string;
  stageChangedAt?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  leadValue?: number;
  leadCurrency?: string;
  assignedUserId?: string;
  nextFollowUp?: number;
  isArchived?: boolean;
  customFields: Record<string, string | number | boolean>;
  createdAt: number;
  updatedAt: number;
  lastInteractionAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface ContactTag {
  id: string; // `${contactId}:${tagId}`
  contactId: string;
  tagId: string;
  assignedAt: number;
}

export interface Note {
  id: string;
  contactId: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface Conversation {
  id: string; // chatId
  contactId: string;
  unreadCount: number;
  pinned: boolean;
  archived: boolean;
  lastMessageText?: string;
  lastMessageTimestamp?: number;
}

export interface MessageRecord {
  id: string; // message id
  chatId: string;
  sender: string;
  fromMe: boolean;
  body: string;
  type: string;
  timestamp: number;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  mediaUrl?: string;
  caption?: string;
  filename?: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  triggerType: 'KEYWORD' | 'MESSAGE_RECEIVED' | 'MANUAL' | 'WEBHOOK' | 'TAG_ADDED';
  triggerConfig: Record<string, unknown>;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  contactId: string;
  conversationId?: string;
  currentNodeId: string;
  status: 'PENDING' | 'RUNNING' | 'WAITING' | 'WAITING_DELAY' | 'WAITING_INPUT' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  variables: Record<string, unknown>;
  resumeAt?: number;
  startedAt: number;
  updatedAt: number;
  completedAt?: number;
  error?: string;
}

export interface WorkflowExecutionLog {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  startedAt: number;
  completedAt: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: string;
  conditions: Array<{ field: string; operator: string; value: unknown }>;
  actions: Array<{ type: string; config: Record<string, unknown> }>;
  createdAt: number;
}

export interface BroadcastCampaign {
  id: string;
  name: string;
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  templateId?: string;
  messageText: string;
  recipientFilter: { tags?: string[]; stageId?: string; customFilter?: string };
  scheduledAt?: number;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: number;
}

export interface BroadcastRecipient {
  id: string; // `${campaignId}:${contactId}`
  campaignId: string;
  contactId: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: number;
  error?: string;
}

export interface ScheduledMessage {
  id: string;
  contactId: string;
  messageText: string;
  mediaUrl?: string;
  triggerAt: number;
  status: 'pending' | 'sent' | 'failed' | 'cancelled' | 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  recurrence?: 'once' | 'daily' | 'weekly' | 'custom';
  recurrenceConfig?: {
    timeOfDay?: string; // "09:00"
    daysOfWeek?: number[]; // [1, 2, 3, 4, 5]
    endDate?: number;
  };
  createdAt: number;
}

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  variables: string[];
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  enabled: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  eventType: string;
  actor: 'USER' | 'AUTOMATION' | 'WORKFLOW' | 'SYSTEM';
  description: string;
  details?: Record<string, unknown>;
}

export interface CrmStage {
  id: string;
  pipelineId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  position: number;
  probability?: number;
  isClosed?: boolean;
  isWon?: boolean;
  isLost?: boolean;
  wipLimit?: number;
  wipLimitAction?: 'WARN' | 'PREVENT';
  createdAt: number;
  updatedAt: number;
}

export interface CrmPipeline {
  id: string;
  name: string;
  description?: string;
  stages: CrmStage[];
  isDefault?: boolean;
  isArchived?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ContactStageHistory {
  id: string;
  contactId: string;
  pipelineId: string;
  fromStageId?: string;
  toStageId: string;
  changedAt: number;
  source: 'MANUAL' | 'AUTOMATION' | 'WORKFLOW' | 'IMPORT' | 'SYSTEM';
}

export interface SavedFilter {
  id: string;
  name: string;
  filter: Record<string, unknown>;
  createdAt: number;
}

// ─── Follow-up & Reminders ───────────────────────────────────────────────────

export type FollowUpType =
  | 'CALL'
  | 'WHATSAPP'
  | 'MEETING'
  | 'PAYMENT'
  | 'QUOTE'
  | 'ORDER'
  | 'GENERAL'
  | 'CUSTOM';

export type FollowUpStatus =
  | 'PENDING'
  | 'DUE'
  | 'OVERDUE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'SNOOZED';

export type FollowUpPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type FollowUpSource =
  | 'MANUAL'
  | 'INBOX'
  | 'CRM'
  | 'WORKFLOW'
  | 'AUTOMATION';

export interface FollowUpRecurrence {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  interval: number; // e.g. every 2 weeks → frequency=WEEKLY, interval=2
  daysOfWeek?: number[]; // 0=Sun .. 6=Sat
  endDate?: number; // stop recurrence after this timestamp
  maxOccurrences?: number; // stop after N occurrences
  currentOccurrence: number; // tracks how many have fired
}

export interface FollowUp {
  id: string;
  contactId: string;
  conversationId?: string;
  title: string;
  description?: string;
  type: FollowUpType;
  status: FollowUpStatus;
  priority: FollowUpPriority;
  dueAt: number; // Unix ms
  reminderMinutesBefore?: number; // minutes before dueAt, 0 = at due time
  reminderAt?: number; // computed: dueAt - reminderMinutesBefore*60000
  reminderStatus?: 'PENDING' | 'TRIGGERED' | 'SNOOZED' | 'DISMISSED' | 'COMPLETED' | 'CANCELLED';
  completedAt?: number;
  completionNote?: string;
  cancelledAt?: number;
  cancellationReason?: string;
  snoozedUntil?: number;
  notes?: string;
  source: FollowUpSource;
  relatedMessageId?: string;
  relatedWorkflowId?: string;
  autoCompleteOnReply?: boolean;
  recurrence?: FollowUpRecurrence;
  createdAt: number;
  updatedAt: number;
}

export type FollowUpActivityAction =
  | 'CREATED'
  | 'REMINDER_TRIGGERED'
  | 'OPENED'
  | 'SNOOZED'
  | 'RESCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'AUTO_COMPLETED'
  | 'EDITED';

export interface FollowUpActivity {
  id: string;
  followUpId: string;
  contactId: string;
  action: FollowUpActivityAction;
  details?: string;
  timestamp: number;
}

export interface FollowUpSettings {
  id: string; // singleton key, e.g. 'default'
  enableNotifications: boolean;
  defaultReminderMinutes: number; // default reminder offset
  defaultPriority: FollowUpPriority;
  workingDays: number[]; // 0=Sun .. 6=Sat, e.g. [1,2,3,4,5]
  businessHoursStart: string; // "09:00"
  businessHoursEnd: string; // "18:00"
  outsideHoursBehavior: 'NOTIFY_ANYWAY' | 'MOVE_TO_NEXT_BUSINESS_HOUR';
  holidays: number[]; // array of dates as Unix ms midnight timestamps
}

// ─── Sequences (Drip Campaigns) ───────────────────────────────────────────────

export interface SequenceStep {
  id: string; // e.g. "step_1"
  sequenceId: string;
  position: number; // 0, 1, 2...
  delayMinutes: number; // delay before this step executes
  messageTemplateId?: string;
  messageText?: string;
  mediaUrl?: string;
}

export interface Sequence {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  steps: SequenceStep[];
  createdAt: number;
  updatedAt: number;
}

export interface SequenceEnrollment {
  id: string; // `${contactId}:${sequenceId}`
  sequenceId: string;
  contactId: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  currentStepIndex: number;
  nextStepAt?: number; // Unix ms
  completedAt?: number;
  error?: string;
}
