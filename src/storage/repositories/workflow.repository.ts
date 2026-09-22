import { db } from '../db';
import { Workflow, WorkflowExecution } from '../schemas';

export class WorkflowRepository {
  static async getById(id: string): Promise<Workflow | undefined> {
    return db.workflows.get(id);
  }

  static async listAll(): Promise<Workflow[]> {
    return db.workflows.orderBy('updatedAt').reverse().toArray();
  }

  static async listActiveByTrigger(triggerType: Workflow['triggerType']): Promise<Workflow[]> {
    return db.workflows
      .where('triggerType')
      .equals(triggerType)
      .filter((w) => w.isActive)
      .toArray();
  }

  static async save(workflow: Workflow): Promise<Workflow> {
    workflow.updatedAt = Date.now();
    await db.workflows.put(workflow);
    return workflow;
  }

  static async delete(id: string): Promise<void> {
    await db.transaction('rw', db.workflows, db.workflowExecutions, async () => {
      await db.workflows.delete(id);
      await db.workflowExecutions.where('workflowId').equals(id).delete();
    });
  }

  // Execution state management
  static async createExecution(execution: WorkflowExecution): Promise<void> {
    await db.workflowExecutions.put(execution);
  }

  static async getExecution(id: string): Promise<WorkflowExecution | undefined> {
    return db.workflowExecutions.get(id);
  }

  static async updateExecution(
    id: string,
    updates: Partial<WorkflowExecution>
  ): Promise<void> {
    const existing = await db.workflowExecutions.get(id);
    if (existing) {
      Object.assign(existing, updates, { updatedAt: Date.now() });
      await db.workflowExecutions.put(existing);
    }
  }

  static async getDueExecutions(now = Date.now()): Promise<WorkflowExecution[]> {
    return db.workflowExecutions
      .where('status')
      .equals('WAITING_DELAY')
      .filter((e) => (e.resumeAt ?? 0) <= now)
      .toArray();
  }
}
