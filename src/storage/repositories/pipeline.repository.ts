/**
 * OpenMsg CRM Pipeline Repository
 * Manages pipelines, stages, reordering, duplication, archiving, and safe deletions.
 */

import { db } from '../db';
import { CrmPipeline, CrmStage } from '../schemas';
import { crmEvents } from '@/core/events/crm-events';

export const DEFAULT_PIPELINE_ID = 'pipeline_sales_default';

export const DEFAULT_STAGES: Array<Omit<CrmStage, 'id' | 'pipelineId' | 'createdAt' | 'updatedAt'>> = [
  {
    name: 'New Lead',
    description: 'Freshly discovered or inbound prospects',
    color: '#3b82f6', // blue
    icon: 'Sparkles',
    position: 0,
    probability: 10,
    isClosed: false,
    isWon: false,
    isLost: false,
  },
  {
    name: 'Contacted',
    description: 'Initial outreach or conversation started',
    color: '#6366f1', // indigo
    icon: 'MessageSquare',
    position: 1,
    probability: 20,
    isClosed: false,
    isWon: false,
    isLost: false,
  },
  {
    name: 'Qualified',
    description: 'Needs and budget confirmed',
    color: '#8b5cf6', // violet
    icon: 'CheckCircle2',
    position: 2,
    probability: 40,
    isClosed: false,
    isWon: false,
    isLost: false,
  },
  {
    name: 'Interested',
    description: 'Actively engaged with pricing or proposal',
    color: '#ec4899', // pink
    icon: 'Heart',
    position: 3,
    probability: 60,
    isClosed: false,
    isWon: false,
    isLost: false,
  },
  {
    name: 'Follow-up',
    description: 'Awaiting response or scheduled callback',
    color: '#f59e0b', // amber
    icon: 'Clock',
    position: 4,
    probability: 50,
    isClosed: false,
    isWon: false,
    isLost: false,
  },
  {
    name: 'Negotiation',
    description: 'Final deal terms and agreements',
    color: '#f97316', // orange
    icon: 'Briefcase',
    position: 5,
    probability: 80,
    isClosed: false,
    isWon: false,
    isLost: false,
  },
  {
    name: 'Customer',
    description: 'Won deal, active paying customer',
    color: '#10b981', // emerald
    icon: 'Trophy',
    position: 6,
    probability: 100,
    isClosed: true,
    isWon: true,
    isLost: false,
  },
  {
    name: 'Completed',
    description: 'Fulfilled or closed successfully',
    color: '#14b8a6', // teal
    icon: 'CheckCheck',
    position: 7,
    probability: 100,
    isClosed: true,
    isWon: true,
    isLost: false,
  },
  {
    name: 'Lost',
    description: 'Unresponsive or deal closed-lost',
    color: '#ef4444', // red
    icon: 'XCircle',
    position: 8,
    probability: 0,
    isClosed: true,
    isWon: false,
    isLost: true,
  },
];

export class PipelineRepository {
  /**
   * Generates a unique ID
   */
  private static generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  /**
   * Initializes or returns the default sales pipeline
   */
  static async getDefaultPipeline(): Promise<CrmPipeline> {
    const existingDefault = await db.pipelines.where('isDefault').equals(1).first();
    if (existingDefault) {
      return existingDefault;
    }

    const anyPipeline = await db.pipelines.toCollection().first();
    if (anyPipeline) {
      anyPipeline.isDefault = true;
      await db.pipelines.put(anyPipeline);
      return anyPipeline;
    }

    // Create default sales pipeline
    const now = Date.now();
    const pipelineId = DEFAULT_PIPELINE_ID;

    const stages: CrmStage[] = DEFAULT_STAGES.map((s, idx) => ({
      ...s,
      id: `stage_${pipelineId}_${idx}`,
      pipelineId,
      position: idx,
      createdAt: now,
      updatedAt: now,
    }));

    const defaultPipeline: CrmPipeline = {
      id: pipelineId,
      name: 'Sales Pipeline',
      description: 'Default sales and business development pipeline',
      stages,
      isDefault: true,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.pipelines.put(defaultPipeline);
    return defaultPipeline;
  }

  /**
   * List all pipelines, optionally including archived ones
   */
  static async listPipelines(includeArchived = false): Promise<CrmPipeline[]> {
    await this.getDefaultPipeline(); // Ensure default exists
    const list = await db.pipelines.toArray();
    const filtered = includeArchived ? list : list.filter((p) => !p.isArchived);
    return filtered.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0) || a.name.localeCompare(b.name));
  }

  /**
   * Get pipeline by ID
   */
  static async getById(id: string): Promise<CrmPipeline | undefined> {
    return db.pipelines.get(id);
  }

  /**
   * Create a new pipeline with customizable stages
   */
  static async createPipeline(data: {
    name: string;
    description?: string;
    stages?: Array<Partial<CrmStage> & { name: string }>;
  }): Promise<CrmPipeline> {
    const now = Date.now();
    const id = this.generateId('pipe');

    const stagesInput = data.stages && data.stages.length > 0 ? data.stages : DEFAULT_STAGES;

    const stages: CrmStage[] = stagesInput.map((s, idx) => ({
      id: ('id' in s && typeof s.id === 'string' && s.id) ? s.id : `stage_${id}_${idx}`,
      pipelineId: id,
      name: s.name,
      description: s.description || '',
      color: s.color || '#3b82f6',
      icon: s.icon || 'Circle',
      position: idx,
      probability: typeof s.probability === 'number' ? s.probability : 50,
      isClosed: Boolean(s.isClosed),
      isWon: Boolean(s.isWon),
      isLost: Boolean(s.isLost),
      wipLimit: s.wipLimit,
      wipLimitAction: s.wipLimitAction || 'WARN',
      createdAt: now,
      updatedAt: now,
    }));

    const pipeline: CrmPipeline = {
      id,
      name: data.name.trim() || 'Untitled Pipeline',
      description: data.description?.trim() || '',
      stages,
      isDefault: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.pipelines.put(pipeline);
    await crmEvents.emit('PIPELINE_UPDATED', { pipelineId: id });
    return pipeline;
  }

  /**
   * Update pipeline details
   */
  static async updatePipeline(id: string, updates: Partial<CrmPipeline>): Promise<CrmPipeline> {
    const existing = await db.pipelines.get(id);
    if (!existing) {
      throw new Error(`Pipeline ${id} not found`);
    }

    const updated: CrmPipeline = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    // If making this default, unset previous default
    if (updates.isDefault) {
      const currentDefaults = await db.pipelines.where('isDefault').equals(1).toArray();
      for (const p of currentDefaults) {
        if (p.id !== id) {
          p.isDefault = false;
          await db.pipelines.put(p);
        }
      }
    }

    await db.pipelines.put(updated);
    await crmEvents.emit('PIPELINE_UPDATED', { pipelineId: id });
    return updated;
  }

  /**
   * Duplicates pipeline configuration and stages
   * DO NOT duplicate contacts, follow-ups, or conversations
   */
  static async duplicatePipeline(id: string, newName?: string): Promise<CrmPipeline> {
    const original = await db.pipelines.get(id);
    if (!original) {
      throw new Error(`Pipeline ${id} not found`);
    }

    const now = Date.now();
    const newId = this.generateId('pipe');

    const duplicatedStages: CrmStage[] = original.stages.map((s, idx) => ({
      ...s,
      id: `stage_${newId}_${idx}`,
      pipelineId: newId,
      position: idx,
      createdAt: now,
      updatedAt: now,
    }));

    const duplicated: CrmPipeline = {
      id: newId,
      name: newName || `${original.name} (Copy)`,
      description: original.description,
      stages: duplicatedStages,
      isDefault: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.pipelines.put(duplicated);
    await crmEvents.emit('PIPELINE_UPDATED', { pipelineId: newId });
    return duplicated;
  }

  /**
   * Archive pipeline (hidden from normal selector)
   */
  static async archivePipeline(id: string): Promise<void> {
    const pipeline = await db.pipelines.get(id);
    if (!pipeline) throw new Error(`Pipeline ${id} not found`);
    if (pipeline.isDefault) {
      throw new Error('Default pipeline cannot be archived. Set another pipeline as default first.');
    }

    pipeline.isArchived = true;
    pipeline.updatedAt = Date.now();
    await db.pipelines.put(pipeline);
    await crmEvents.emit('PIPELINE_UPDATED', { pipelineId: id });
  }

  /**
   * Restore archived pipeline
   */
  static async unarchivePipeline(id: string): Promise<void> {
    const pipeline = await db.pipelines.get(id);
    if (!pipeline) throw new Error(`Pipeline ${id} not found`);
    pipeline.isArchived = false;
    pipeline.updatedAt = Date.now();
    await db.pipelines.put(pipeline);
    await crmEvents.emit('PIPELINE_UPDATED', { pipelineId: id });
  }

  /**
   * Safe pipeline deletion:
   * Migrates all associated contacts to targetPipelineId's first stage.
   * If targetPipelineId is missing and contacts exist, deletion is rejected!
   */
  static async deletePipeline(id: string, targetPipelineId?: string): Promise<{ migratedCount: number }> {
    const pipeline = await db.pipelines.get(id);
    if (!pipeline) throw new Error(`Pipeline ${id} not found`);
    if (pipeline.isDefault) {
      throw new Error('Cannot delete the default pipeline');
    }

    // Find contacts assigned to this pipeline
    const contactsInPipeline = await db.contacts.filter((c) => c.pipelineId === id).toArray();

    if (contactsInPipeline.length > 0) {
      if (!targetPipelineId) {
        throw new Error(
          `Cannot delete pipeline with ${contactsInPipeline.length} contacts without a migration target pipeline.`
        );
      }
      const targetPipeline = await db.pipelines.get(targetPipelineId);
      if (!targetPipeline || targetPipeline.stages.length === 0) {
        throw new Error('Target pipeline for migration does not exist or has no stages.');
      }

      const destStageId = targetPipeline.stages[0].id;
      const now = Date.now();

      // Transactional migration
      await db.transaction('rw', [db.contacts, db.stageHistory], async () => {
        for (const contact of contactsInPipeline) {
          const oldStageId = contact.stageId;
          contact.pipelineId = targetPipelineId;
          contact.stageId = destStageId;
          contact.stageChangedAt = now;
          contact.updatedAt = now;
          await db.contacts.put(contact);

          await db.stageHistory.put({
            id: `hist_${now}_${Math.random().toString(36).substring(2, 6)}`,
            contactId: contact.id,
            pipelineId: targetPipelineId,
            fromStageId: oldStageId,
            toStageId: destStageId,
            changedAt: now,
            source: 'SYSTEM',
          });
        }
      });
    }

    await db.pipelines.delete(id);
    await crmEvents.emit('PIPELINE_UPDATED', { pipelineId: id });
    return { migratedCount: contactsInPipeline.length };
  }

  /**
   * Add a stage to pipeline
   */
  static async addStage(
    pipelineId: string,
    stageData: Omit<CrmStage, 'id' | 'pipelineId' | 'position' | 'createdAt' | 'updatedAt'>
  ): Promise<CrmStage> {
    const pipeline = await db.pipelines.get(pipelineId);
    if (!pipeline) throw new Error(`Pipeline ${pipelineId} not found`);

    const now = Date.now();
    const stageId = `stage_${pipelineId}_${Date.now()}`;
    const newStage: CrmStage = {
      ...stageData,
      id: stageId,
      pipelineId,
      position: pipeline.stages.length,
      createdAt: now,
      updatedAt: now,
    };

    pipeline.stages.push(newStage);
    pipeline.updatedAt = now;
    await db.pipelines.put(pipeline);
    await crmEvents.emit('STAGE_UPDATED', { pipelineId, stageId });
    return newStage;
  }

  /**
   * Update a stage
   */
  static async updateStage(
    pipelineId: string,
    stageId: string,
    stageData: Partial<CrmStage>
  ): Promise<CrmStage> {
    const pipeline = await db.pipelines.get(pipelineId);
    if (!pipeline) throw new Error(`Pipeline ${pipelineId} not found`);

    const idx = pipeline.stages.findIndex((s) => s.id === stageId);
    if (idx === -1) throw new Error(`Stage ${stageId} not found in pipeline ${pipelineId}`);

    const now = Date.now();
    const updatedStage: CrmStage = {
      ...pipeline.stages[idx],
      ...stageData,
      updatedAt: now,
    };

    pipeline.stages[idx] = updatedStage;
    pipeline.updatedAt = now;
    await db.pipelines.put(pipeline);
    await crmEvents.emit('STAGE_UPDATED', { pipelineId, stageId });
    return updatedStage;
  }

  /**
   * Reorder stages by list of stage IDs
   */
  static async reorderStages(pipelineId: string, stageIdsInOrder: string[]): Promise<CrmStage[]> {
    const pipeline = await db.pipelines.get(pipelineId);
    if (!pipeline) throw new Error(`Pipeline ${pipelineId} not found`);

    const stageMap = new Map(pipeline.stages.map((s) => [s.id, s]));
    const reordered: CrmStage[] = [];

    stageIdsInOrder.forEach((id, idx) => {
      const s = stageMap.get(id);
      if (s) {
        s.position = idx;
        s.updatedAt = Date.now();
        reordered.push(s);
      }
    });

    pipeline.stages = reordered;
    pipeline.updatedAt = Date.now();
    await db.pipelines.put(pipeline);
    await crmEvents.emit('STAGE_UPDATED', { pipelineId, stageId: 'reordered' });
    return reordered;
  }

  /**
   * Safe stage deletion:
   * Migrates all contacts from stageId to migrationStageId.
   * Prevents leaving contacts pointing to nonexistent stages.
   */
  static async deleteStage(
    pipelineId: string,
    stageId: string,
    migrationStageId: string
  ): Promise<{ migratedCount: number }> {
    const pipeline = await db.pipelines.get(pipelineId);
    if (!pipeline) throw new Error(`Pipeline ${pipelineId} not found`);

    if (stageId === migrationStageId) {
      throw new Error('Destination migration stage cannot be the same as the deleted stage');
    }

    const targetStage = pipeline.stages.find((s) => s.id === migrationStageId);
    if (!targetStage) {
      throw new Error(`Migration destination stage ${migrationStageId} does not exist`);
    }

    if (pipeline.stages.length <= 1) {
      throw new Error('A pipeline must contain at least one stage');
    }

    // Find contacts currently in this stage
    const contactsInStage = await db.contacts.filter((c) => c.stageId === stageId).toArray();
    const now = Date.now();

    // Migrate contacts and delete stage transactionally
    await db.transaction('rw', [db.contacts, db.stageHistory, db.pipelines], async () => {
      for (const contact of contactsInStage) {
        contact.stageId = migrationStageId;
        contact.stageChangedAt = now;
        contact.updatedAt = now;
        await db.contacts.put(contact);

        await db.stageHistory.put({
          id: `hist_${now}_${Math.random().toString(36).substring(2, 6)}`,
          contactId: contact.id,
          pipelineId,
          fromStageId: stageId,
          toStageId: migrationStageId,
          changedAt: now,
          source: 'SYSTEM',
        });
      }

      pipeline.stages = pipeline.stages
        .filter((s) => s.id !== stageId)
        .map((s, idx) => ({ ...s, position: idx }));
      pipeline.updatedAt = now;
      await db.pipelines.put(pipeline);
    });

    await crmEvents.emit('STAGE_UPDATED', { pipelineId, stageId });
    return { migratedCount: contactsInStage.length };
  }
}
