/**
 * OpenMsg Backup & Restore Service
 * Creates versioned full backups and restores them safely with integrity validation.
 */

import { db } from '@/storage/db';

export interface BackupPayload {
  schemaVersion: number;
  createdAt: string;
  appVersion: string;
  data: {
    contacts: unknown[];
    tags: unknown[];
    contactTags: unknown[];
    notes: unknown[];
    conversations: unknown[];
    messages: unknown[];
    workflows: unknown[];
    workflowExecutions: unknown[];
    automationRules: unknown[];
    broadcastCampaigns: unknown[];
    broadcastRecipients: unknown[];
    scheduledMessages: unknown[];
    templates: unknown[];
    webhooks: unknown[];
    pipelines?: unknown[];
    stageHistory?: unknown[];
    savedFilters?: unknown[];
  };
}

export interface RestorePreview {
  valid: boolean;
  error?: string;
  schemaVersion?: number;
  createdAt?: string;
  counts: Record<string, number>;
}

export class BackupService {
  private static readonly CURRENT_SCHEMA_VERSION = 2;
  private static readonly APP_VERSION = '0.1.0';

  /**
   * Exports all IndexedDB tables into a single versioned JSON payload
   */
  static async createBackup(): Promise<string> {
    const backup: BackupPayload = {
      schemaVersion: this.CURRENT_SCHEMA_VERSION,
      createdAt: new Date().toISOString(),
      appVersion: this.APP_VERSION,
      data: {
        contacts: await db.contacts.toArray(),
        tags: await db.tags.toArray(),
        contactTags: await db.contactTags.toArray(),
        notes: await db.notes.toArray(),
        conversations: await db.conversations.toArray(),
        messages: await db.messages.toArray(),
        workflows: await db.workflows.toArray(),
        workflowExecutions: await db.workflowExecutions.toArray(),
        automationRules: await db.automationRules.toArray(),
        broadcastCampaigns: await db.broadcastCampaigns.toArray(),
        broadcastRecipients: await db.broadcastRecipients.toArray(),
        scheduledMessages: await db.scheduledMessages.toArray(),
        templates: await db.templates.toArray(),
        webhooks: await db.webhooks.toArray(),
        pipelines: await db.pipelines.toArray(),
        stageHistory: await db.stageHistory.toArray(),
        savedFilters: await db.savedFilters.toArray(),
      },
    };

    return JSON.stringify(backup, null, 2);
  }

  /**
   * Inspects and validates a raw backup file before restoration
   */
  static previewBackup(rawJson: string): RestorePreview {
    try {
      const parsed = JSON.parse(rawJson);
      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'Backup content is not a valid JSON object', counts: {} };
      }

      if (!parsed.schemaVersion || typeof parsed.schemaVersion !== 'number') {
        return { valid: false, error: 'Missing or invalid schemaVersion', counts: {} };
      }

      if (parsed.schemaVersion > this.CURRENT_SCHEMA_VERSION) {
        return {
          valid: false,
          error: `Backup schema version (${parsed.schemaVersion}) is newer than supported version (${this.CURRENT_SCHEMA_VERSION})`,
          counts: {},
        };
      }

      const data = parsed.data || {};
      const counts: Record<string, number> = {};

      for (const [key, items] of Object.entries(data)) {
        if (Array.isArray(items)) {
          counts[key] = items.length;
        }
      }

      return {
        valid: true,
        schemaVersion: parsed.schemaVersion,
        createdAt: parsed.createdAt,
        counts,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: `JSON parse error: ${err.message || String(err)}`,
        counts: {},
      };
    }
  }

  /**
   * Restores tables from backup payload
   */
  static async restoreBackup(rawJson: string): Promise<{ success: boolean; restoredCounts: Record<string, number> }> {
    const preview = this.previewBackup(rawJson);
    if (!preview.valid) {
      throw new Error(`Cannot restore backup: ${preview.error}`);
    }

    const parsed: BackupPayload = JSON.parse(rawJson);
    const data = parsed.data;

    // Use transaction for atomic restore
    await db.transaction('rw', [
      db.contacts,
      db.tags,
      db.contactTags,
      db.notes,
      db.conversations,
      db.messages,
      db.workflows,
      db.workflowExecutions,
      db.automationRules,
      db.broadcastCampaigns,
      db.broadcastRecipients,
      db.scheduledMessages,
      db.templates,
      db.webhooks,
    ], async () => {
      if (Array.isArray(data.contacts)) await db.contacts.bulkPut(data.contacts as any);
      if (Array.isArray(data.tags)) await db.tags.bulkPut(data.tags as any);
      if (Array.isArray(data.contactTags)) await db.contactTags.bulkPut(data.contactTags as any);
      if (Array.isArray(data.notes)) await db.notes.bulkPut(data.notes as any);
      if (Array.isArray(data.conversations)) await db.conversations.bulkPut(data.conversations as any);
      if (Array.isArray(data.messages)) await db.messages.bulkPut(data.messages as any);
      if (Array.isArray(data.workflows)) await db.workflows.bulkPut(data.workflows as any);
      if (Array.isArray(data.workflowExecutions)) await db.workflowExecutions.bulkPut(data.workflowExecutions as any);
      if (Array.isArray(data.automationRules)) await db.automationRules.bulkPut(data.automationRules as any);
      if (Array.isArray(data.broadcastCampaigns)) await db.broadcastCampaigns.bulkPut(data.broadcastCampaigns as any);
      if (Array.isArray(data.broadcastRecipients)) await db.broadcastRecipients.bulkPut(data.broadcastRecipients as any);
      if (Array.isArray(data.scheduledMessages)) await db.scheduledMessages.bulkPut(data.scheduledMessages as any);
      if (Array.isArray(data.templates)) await db.templates.bulkPut(data.templates as any);
      if (Array.isArray(data.webhooks)) await db.webhooks.bulkPut(data.webhooks as any);
    });

    return {
      success: true,
      restoredCounts: preview.counts,
    };
  }
}
