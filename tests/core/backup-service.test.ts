import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { BackupService } from '@/core/backup/backup-service';
import { db } from '@/storage/db';

describe('BackupService', () => {
  beforeEach(async () => {
    await db.contacts.clear();
    await db.tags.clear();
  });

  it('should create a valid versioned backup payload', async () => {
    await db.contacts.put({
      id: '15551112222@c.us',
      name: 'Backup Test Contact',
      phone: '15551112222',
      isGroup: false,
      customFields: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastInteractionAt: Date.now(),
    });

    const jsonStr = await BackupService.createBackup();
    const preview = BackupService.previewBackup(jsonStr);

    expect(preview.valid).toBe(true);
    expect(preview.schemaVersion).toBe(4);
    expect(preview.counts.contacts).toBe(1);
  });

  it('should reject invalid or future schema backups', () => {
    const invalidJson = '{ not valid json ';
    expect(BackupService.previewBackup(invalidJson).valid).toBe(false);

    const futureBackup = JSON.stringify({
      schemaVersion: 999,
      data: {},
    });
    expect(BackupService.previewBackup(futureBackup).valid).toBe(false);
  });

  it('should restore data into IndexedDB safely', async () => {
    const testBackup = JSON.stringify({
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      appVersion: '0.1.0',
      data: {
        contacts: [
          {
            id: '15559998888@c.us',
            name: 'Restored User',
            phone: '15559998888',
            isGroup: false,
            customFields: {},
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastInteractionAt: Date.now(),
          },
        ],
        tags: [
          { id: 'tag_vip', name: 'VIP Customer', color: '#10b981' },
        ],
      },
    });

    const res = await BackupService.restoreBackup(testBackup);
    expect(res.success).toBe(true);
    expect(res.restoredCounts.contacts).toBe(1);

    const restoredContact = await db.contacts.get('15559998888@c.us');
    expect(restoredContact?.name).toBe('Restored User');

    const restoredTag = await db.tags.get('tag_vip');
    expect(restoredTag?.name).toBe('VIP Customer');
  });
});
