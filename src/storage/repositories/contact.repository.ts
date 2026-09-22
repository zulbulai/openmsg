import { db } from '../db';
import { Contact, Tag, ContactStageHistory } from '../schemas';
import { crmEvents } from '@/core/events/crm-events';
import { PipelineRepository } from './pipeline.repository';

export class ContactRepository {
  static async findById(id: string): Promise<Contact | undefined> {
    return db.contacts.get(id);
  }

  static async findByPhone(phone: string): Promise<Contact | undefined> {
    const cleanPhone = phone.replace(/\D/g, '');
    return db.contacts.where('phone').equals(cleanPhone).first();
  }

  static async listAll(limit = 100): Promise<Contact[]> {
    return db.contacts.orderBy('lastInteractionAt').reverse().limit(limit).toArray();
  }

  static async search(query: string, limit = 50): Promise<Contact[]> {
    const q = query.trim().toLowerCase();
    if (!q) return this.listAll(limit);

    return db.contacts
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .limit(limit)
      .toArray();
  }

  static async upsert(contactData: Partial<Contact> & { id: string; phone: string; name: string }): Promise<Contact> {
    const now = Date.now();
    const existing = await db.contacts.get(contactData.id);

    const contact: Contact = {
      id: contactData.id,
      phone: contactData.phone.replace(/\D/g, ''),
      name: contactData.name || 'Unknown',
      pushName: contactData.pushName ?? existing?.pushName,
      avatarUrl: contactData.avatarUrl ?? existing?.avatarUrl,
      isGroup: contactData.isGroup ?? existing?.isGroup ?? false,
      pipelineId: contactData.pipelineId ?? existing?.pipelineId,
      stageId: contactData.stageId ?? existing?.stageId,
      stageChangedAt: contactData.stageChangedAt ?? existing?.stageChangedAt,
      priority: contactData.priority ?? existing?.priority ?? 'medium',
      leadValue: contactData.leadValue ?? existing?.leadValue,
      leadCurrency: contactData.leadCurrency ?? existing?.leadCurrency ?? 'INR',
      assignedUserId: contactData.assignedUserId ?? existing?.assignedUserId,
      nextFollowUp: contactData.nextFollowUp ?? existing?.nextFollowUp,
      isArchived: contactData.isArchived ?? existing?.isArchived ?? false,
      customFields: contactData.customFields ?? existing?.customFields ?? {},
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      lastInteractionAt: contactData.lastInteractionAt ?? existing?.lastInteractionAt ?? now,
    };

    await db.contacts.put(contact);
    return contact;
  }

  static async assignTag(contactId: string, tagId: string): Promise<void> {
    const id = `${contactId}:${tagId}`;
    await db.contactTags.put({
      id,
      contactId,
      tagId,
      assignedAt: Date.now(),
    });
  }

  static async removeTag(contactId: string, tagId: string): Promise<void> {
    const id = `${contactId}:${tagId}`;
    await db.contactTags.delete(id);
  }

  static async getTagsForContact(contactId: string): Promise<Tag[]> {
    const links = await db.contactTags.where('contactId').equals(contactId).toArray();
    const tagIds = links.map((l) => l.tagId);
    return db.tags.where('id').anyOf(tagIds).toArray();
  }

  static async getById(id: string): Promise<Contact | undefined> {
    return this.findById(id);
  }

  static async addTag(contactId: string, tagId: string): Promise<void> {
    return this.assignTag(contactId, tagId);
  }

  static async getTags(contactId: string): Promise<Tag[]> {
    return this.getTagsForContact(contactId);
  }

  static async addNote(contactId: string, content: string): Promise<void> {
    const id = `note_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const now = Date.now();
    await db.notes.put({
      id,
      contactId,
      content,
      createdAt: now,
      updatedAt: now,
    });
  }

  static async getNotes(contactId: string) {
    return db.notes.where('contactId').equals(contactId).reverse().sortBy('createdAt');
  }

  static async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.contacts, db.contactTags, db.notes, db.stageHistory], async () => {
      await db.contacts.delete(id);
      await db.contactTags.where('contactId').equals(id).delete();
      await db.notes.where('contactId').equals(id).delete();
      await db.stageHistory.where('contactId').equals(id).delete();
    });
  }

  /**
   * Move a contact to a new pipeline stage with full validation and audit history
   */
  static async moveStage(
    contactId: string,
    toStageId: string,
    pipelineId?: string,
    source: ContactStageHistory['source'] = 'MANUAL'
  ): Promise<Contact> {
    const contact = await db.contacts.get(contactId);
    if (!contact) {
      throw new Error(`Contact ${contactId} not found`);
    }

    if (contact.isArchived) {
      throw new Error(`Cannot move archived contact ${contactId}`);
    }

    // Resolve pipeline
    let resolvedPipelineId = pipelineId || contact.pipelineId;
    if (!resolvedPipelineId) {
      const def = await PipelineRepository.getDefaultPipeline();
      resolvedPipelineId = def.id;
    }

    const pipeline = await db.pipelines.get(resolvedPipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${resolvedPipelineId} not found`);
    }

    const targetStage = pipeline.stages.find((s) => s.id === toStageId);
    if (!targetStage) {
      throw new Error(`Stage ${toStageId} not found in pipeline ${resolvedPipelineId}`);
    }

    // Check WIP limits if configured
    if (targetStage.wipLimit && targetStage.wipLimit > 0) {
      const countInStage = await db.contacts.filter((c) => c.stageId === toStageId && c.id !== contactId).count();
      if (countInStage >= targetStage.wipLimit) {
        if (targetStage.wipLimitAction === 'PREVENT') {
          throw new Error(
            `Stage "${targetStage.name}" has reached its maximum WIP limit of ${targetStage.wipLimit} contacts.`
          );
        }
      }
    }

    const fromStageId = contact.stageId;
    const now = Date.now();

    const historyRecord: ContactStageHistory = {
      id: `hist_${now}_${Math.random().toString(36).substring(2, 6)}`,
      contactId,
      pipelineId: resolvedPipelineId,
      fromStageId,
      toStageId,
      changedAt: now,
      source,
    };

    contact.pipelineId = resolvedPipelineId;
    contact.stageId = toStageId;
    contact.stageChangedAt = now;
    contact.updatedAt = now;

    await db.transaction('rw', [db.contacts, db.stageHistory], async () => {
      await db.contacts.put(contact);
      await db.stageHistory.put(historyRecord);
    });

    // Emit event for automation, workflows, and timeline
    await crmEvents.emit('CONTACT_STAGE_CHANGED', {
      ...historyRecord,
      contactName: contact.name,
      phone: contact.phone,
    });

    return contact;
  }

  /**
   * Bulk move multiple contacts to a new stage
   */
  static async bulkMoveStage(
    contactIds: string[],
    toStageId: string,
    pipelineId?: string,
    source: ContactStageHistory['source'] = 'MANUAL'
  ): Promise<{ succeeded: string[]; failed: Array<{ id: string; error: string }> }> {
    const succeeded: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const id of contactIds) {
      try {
        await this.moveStage(id, toStageId, pipelineId, source);
        succeeded.push(id);
      } catch (err: any) {
        failed.push({ id, error: err.message || String(err) });
      }
    }

    return { succeeded, failed };
  }

  /**
   * Retrieve stage movement history for a contact
   */
  static async getStageHistory(contactId: string): Promise<ContactStageHistory[]> {
    const history = await db.stageHistory.where('contactId').equals(contactId).toArray();
    return history.sort((a, b) => b.changedAt - a.changedAt);
  }

  /**
   * Update contact details
   */
  static async update(id: string, updates: Partial<Contact>): Promise<Contact> {
    const existing = await db.contacts.get(id);
    if (!existing) throw new Error(`Contact ${id} not found`);

    const updated: Contact = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    await db.contacts.put(updated);
    await crmEvents.emit('CONTACT_UPDATED', { contactId: id });
    return updated;
  }

  /**
   * Archive a contact
   */
  static async archive(id: string): Promise<void> {
    await this.update(id, { isArchived: true });
  }

  /**
   * Unarchive a contact
   */
  static async unarchive(id: string): Promise<void> {
    await this.update(id, { isArchived: false });
  }
}
