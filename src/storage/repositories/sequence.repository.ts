import { db } from '../db';
import { Sequence, SequenceEnrollment } from '../schemas';

export class SequenceRepository {
  /**
   * Retrieves a sequence by its ID
   */
  static async getById(id: string): Promise<Sequence | undefined> {
    return db.sequences.get(id);
  }

  /**
   * Retrieves all sequences
   */
  static async listAll(): Promise<Sequence[]> {
    return db.sequences.orderBy('createdAt').reverse().toArray();
  }

  /**
   * Creates a new sequence
   */
  static async create(data: Partial<Sequence>): Promise<Sequence> {
    const sequence: Sequence = {
      id: `seq_${Date.now()}`,
      name: data.name || 'New Sequence',
      description: data.description || '',
      isActive: data.isActive ?? true,
      steps: data.steps || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.sequences.add(sequence);
    return sequence;
  }

  /**
   * Updates an existing sequence
   */
  static async update(id: string, updates: Partial<Sequence>): Promise<void> {
    await db.sequences.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  }

  /**
   * Deletes a sequence and cancels all its active enrollments
   */
  static async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.sequences, db.sequenceEnrollments], async () => {
      await db.sequences.delete(id);
      const enrollments = await db.sequenceEnrollments.where('sequenceId').equals(id).toArray();
      for (const enr of enrollments) {
        if (enr.status === 'ACTIVE' || enr.status === 'PAUSED') {
          enr.status = 'CANCELLED';
          enr.nextStepAt = undefined;
          await db.sequenceEnrollments.put(enr);
        }
      }
    });
  }

  /**
   * Enrolls a contact in a sequence
   */
  static async enrollContact(sequenceId: string, contactId: string): Promise<SequenceEnrollment> {
    const id = `${contactId}:${sequenceId}`;
    
    // Check if sequence exists
    const sequence = await db.sequences.get(sequenceId);
    if (!sequence) throw new Error('Sequence not found');
    if (!sequence.isActive) throw new Error('Cannot enroll in an inactive sequence');

    return await db.transaction('rw', [db.sequenceEnrollments], async () => {
      const existing = await db.sequenceEnrollments.get(id);
      if (existing) {
        if (existing.status === 'ACTIVE') {
          return existing; // Already actively enrolled
        }
        // If it was cancelled or completed, we re-enroll by resetting state
        existing.status = 'ACTIVE';
        existing.currentStepIndex = 0;
        existing.nextStepAt = sequence.steps.length > 0 
          ? Date.now() + sequence.steps[0].delayMinutes * 60000 
          : undefined;
        existing.error = undefined;
        existing.completedAt = undefined;
        await db.sequenceEnrollments.put(existing);
        return existing;
      }

      const enrollment: SequenceEnrollment = {
        id,
        sequenceId,
        contactId,
        status: 'ACTIVE',
        currentStepIndex: 0,
        nextStepAt: sequence.steps.length > 0 
          ? Date.now() + sequence.steps[0].delayMinutes * 60000 
          : undefined,
      };
      await db.sequenceEnrollments.add(enrollment);
      return enrollment;
    });
  }

  /**
   * Unenrolls a contact from a sequence (cancels it)
   */
  static async unenrollContact(sequenceId: string, contactId: string): Promise<void> {
    const id = `${contactId}:${sequenceId}`;
    const enrollment = await db.sequenceEnrollments.get(id);
    if (enrollment && enrollment.status !== 'CANCELLED' && enrollment.status !== 'COMPLETED') {
      enrollment.status = 'CANCELLED';
      enrollment.nextStepAt = undefined;
      await db.sequenceEnrollments.put(enrollment);
    }
  }

  /**
   * Pauses an active enrollment
   */
  static async pauseEnrollment(sequenceId: string, contactId: string): Promise<void> {
    const id = `${contactId}:${sequenceId}`;
    const enrollment = await db.sequenceEnrollments.get(id);
    if (enrollment && enrollment.status === 'ACTIVE') {
      enrollment.status = 'PAUSED';
      // keep nextStepAt so we know when it was supposed to run, 
      // but the engine will ignore it while PAUSED
      await db.sequenceEnrollments.put(enrollment);
    }
  }

  /**
   * Resumes a paused enrollment
   */
  static async resumeEnrollment(sequenceId: string, contactId: string): Promise<void> {
    const id = `${contactId}:${sequenceId}`;
    const enrollment = await db.sequenceEnrollments.get(id);
    if (enrollment && enrollment.status === 'PAUSED') {
      enrollment.status = 'ACTIVE';
      // If the nextStepAt is in the past, reset it to now so it triggers immediately
      if (enrollment.nextStepAt && enrollment.nextStepAt < Date.now()) {
        enrollment.nextStepAt = Date.now();
      }
      await db.sequenceEnrollments.put(enrollment);
    }
  }

  /**
   * Gets all enrollments for a contact
   */
  static async getContactEnrollments(contactId: string): Promise<SequenceEnrollment[]> {
    return db.sequenceEnrollments.where('contactId').equals(contactId).toArray();
  }

  /**
   * Gets all active enrollments for a specific sequence
   */
  static async getSequenceEnrollments(sequenceId: string): Promise<SequenceEnrollment[]> {
    return db.sequenceEnrollments.where('sequenceId').equals(sequenceId).toArray();
  }
}
