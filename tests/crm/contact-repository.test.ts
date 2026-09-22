import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { ContactRepository } from '@/storage/repositories/contact.repository';
import { db } from '@/storage/db';

describe('ContactRepository (Dexie / IndexedDB)', () => {
  beforeEach(async () => {
    await db.contacts.clear();
    await db.contactTags.clear();
    await db.tags.clear();
  });

  it('should create, update, and find contacts', async () => {
    const contact = await ContactRepository.upsert({
      id: '15550009999@c.us',
      phone: '15550009999',
      name: 'Dr. Jane Smith',
      stageId: 'lead',
    });

    expect(contact.id).toBe('15550009999@c.us');
    expect(contact.name).toBe('Dr. Jane Smith');

    const found = await ContactRepository.findById('15550009999@c.us');
    expect(found).toBeDefined();
    expect(found?.phone).toBe('15550009999');

    // Update
    await ContactRepository.upsert({
      id: '15550009999@c.us',
      phone: '15550009999',
      name: 'Dr. Jane Smith (VIP)',
      stageId: 'customer',
    });

    const updated = await ContactRepository.findById('15550009999@c.us');
    expect(updated?.name).toBe('Dr. Jane Smith (VIP)');
    expect(updated?.stageId).toBe('customer');
  });

  it('should assign and retrieve tags for a contact', async () => {
    const contactId = '15558887777@c.us';
    await ContactRepository.upsert({
      id: contactId,
      phone: '15558887777',
      name: 'Michael Scott',
    });

    await db.tags.put({ id: 'tag_urgent', name: 'Urgent', color: '#ef4444' });

    await ContactRepository.assignTag(contactId, 'tag_urgent');
    const tags = await ContactRepository.getTagsForContact(contactId);

    expect(tags.length).toBe(1);
    expect(tags[0].name).toBe('Urgent');

    // Remove tag
    await ContactRepository.removeTag(contactId, 'tag_urgent');
    const tagsAfter = await ContactRepository.getTagsForContact(contactId);
    expect(tagsAfter.length).toBe(0);
  });

  it('should search contacts by name or phone query', async () => {
    await ContactRepository.upsert({
      id: '15551111111@c.us',
      phone: '15551111111',
      name: 'Alice Wonder',
    });

    await ContactRepository.upsert({
      id: '15552222222@c.us',
      phone: '15552222222',
      name: 'Bob Builder',
    });

    const resultsName = await ContactRepository.search('Alice');
    expect(resultsName.length).toBe(1);
    expect(resultsName[0].name).toBe('Alice Wonder');

    const resultsPhone = await ContactRepository.search('2222');
    expect(resultsPhone.length).toBe(1);
    expect(resultsPhone[0].name).toBe('Bob Builder');
  });
});
