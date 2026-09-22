import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { CRMDataTransfer } from '@/core/crm/import-export';
import { db } from '@/storage/db';
import { Contact } from '@/storage/schemas';

describe('CRMDataTransfer', () => {
  beforeEach(async () => {
    await db.contacts.clear();
  });

  it('should export contacts to valid JSON and CSV', () => {
    const contacts: Contact[] = [
      {
        id: '15551234567@c.us',
        phone: '15551234567',
        name: 'Alice Johnson',
        isGroup: false,
        customFields: { company: 'TechCorp' },
        createdAt: 1700000000,
        updatedAt: 1700000000,
        lastInteractionAt: 1700000000,
      },
    ];

    const jsonStr = CRMDataTransfer.exportToJSON(contacts);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.type).toBe('openmsg_contacts_export');
    expect(parsed.data.length).toBe(1);
    expect(parsed.data[0].name).toBe('Alice Johnson');

    const csvStr = CRMDataTransfer.exportToCSV(contacts);
    expect(csvStr).toContain('Alice Johnson');
    expect(csvStr).toContain('15551234567');
  });

  it('should import contacts from valid JSON', async () => {
    const json = JSON.stringify([
      {
        id: '15559876543@c.us',
        phone: '15559876543',
        name: 'Bob Martin',
      },
    ]);

    const res = await CRMDataTransfer.importFromJSON(json);
    expect(res.imported).toBe(1);
    expect(res.failed).toBe(0);

    const saved = await db.contacts.get('15559876543@c.us');
    expect(saved).toBeDefined();
    expect(saved?.name).toBe('Bob Martin');
  });

  it('should import contacts from valid CSV', async () => {
    const csv = 'Name,Phone\nCharlie Brown,15553334444\nDiana Prince,15556667777';
    const res = await CRMDataTransfer.importFromCSV(csv);
    expect(res.imported).toBe(2);
    expect(res.failed).toBe(0);

    const charlie = await db.contacts.get('15553334444@c.us');
    expect(charlie?.name).toBe('Charlie Brown');
  });
});
