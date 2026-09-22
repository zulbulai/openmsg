# OpenMsg Storage Architecture

## 1. Storage Strategy: Dexie (IndexedDB) + Chrome Storage

OpenMsg uses a **hybrid local-first storage design**:

1. **IndexedDB via Dexie (`src/storage/db.ts`)**:
   - Primary database for all high-volume relational, searchable, and transactional data.
   - Fast B-Tree indexing on primary keys, compound indexes (e.g., `chatId + timestamp`), and full-text search fields.
   - ACID transaction support to prevent database corruption during concurrent background executions.
2. **Chrome Extension Storage (`chrome.storage.local`)**:
   - Reserved strictly for lightweight user preferences, feature toggles, API key references, and UI settings.
   - Synchronized seamlessly between background service workers and extension UI panels.

---

## 2. Core Dexie Entity Schemas

```ts
// 1. Contacts
export interface Contact {
  id: string; // WhatsApp wid (e.g. '1234567890@c.us')
  phone: string;
  name: string;
  pushName?: string;
  avatarUrl?: string;
  isGroup: boolean;
  stageId?: string;
  customFields: Record<string, string | number | boolean>;
  createdAt: number;
  updatedAt: number;
  lastInteractionAt: number;
}

// 2. Tags & Contact Associations
export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface ContactTag {
  id: string; // composite `${contactId}:${tagId}`
  contactId: string;
  tagId: string;
  assignedAt: number;
}

// 3. Notes & Reminders
export interface Note {
  id: string;
  contactId: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

// 4. Conversations & Messages
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
  id: string; // WhatsApp message ID
  chatId: string;
  sender: string;
  fromMe: boolean;
  body: string;
  type: string;
  timestamp: number;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
}

// 5. Workflows & Visual Flows
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

export interface WorkflowNode {
  id: string;
  type: string; // 'START' | 'TEXT' | 'CONDITION' | 'DELAY' | 'WEBHOOK' | 'END' etc.
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

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  contactId: string;
  currentNodeId: string;
  status: 'RUNNING' | 'WAITING_DELAY' | 'WAITING_INPUT' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  variables: Record<string, unknown>;
  resumeAt?: number;
  startedAt: number;
  updatedAt: number;
  error?: string;
}

// 6. Automation Rules
export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: string;
  conditions: Array<{ field: string; operator: string; value: unknown }>;
  actions: Array<{ type: string; config: Record<string, unknown> }>;
  createdAt: number;
}

// 7. Broadcast Campaigns
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

// 8. Scheduled Messages
export interface ScheduledMessage {
  id: string;
  contactId: string;
  messageText: string;
  mediaUrl?: string;
  triggerAt: number;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  createdAt: number;
}

// 9. Templates, Webhooks & Logs
export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  variables: string[]; // e.g. ['name', 'phone', 'order_id']
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
```

---

## 3. The Repository Pattern

To prevent React components from embedding raw Dexie queries, all data operations are strictly encapsulated in typed repository classes:

- `ContactRepository`: `findById`, `findByPhone`, `search`, `save`, `assignTag`, `removeTag`, `updateCustomFields`.
- `ConversationRepository`: `listRecent`, `getChat`, `updateLastMessage`, `markRead`.
- `WorkflowRepository`: `listAll`, `getActiveWorkflowsByTrigger`, `saveFlow`, `deleteFlow`.
- `WorkflowExecutionRepository`: `createExecution`, `updateState`, `getDueExecutions`.
- `CampaignRepository`: `createCampaign`, `updateProgress`, `getPendingRecipients`.
- `AuditLogRepository`: `logEvent`, `queryLogs`.

---

## 4. Backup & Export Schema (`openmsg-backup.json`)

```json
{
  "$schema": "https://openmsg.dev/schemas/v1/backup.json",
  "version": 1,
  "exportedAt": "2026-09-22T06:00:00.000Z",
  "meta": {
    "app": "OpenMsg",
    "version": "0.1.0"
  },
  "data": {
    "contacts": [],
    "tags": [],
    "contactTags": [],
    "notes": [],
    "workflows": [],
    "automationRules": [],
    "templates": [],
    "webhooks": [],
    "settings": {}
  }
}
```
Validation ensures backwards compatibility and prevents corrupt imports from overwriting live databases.
