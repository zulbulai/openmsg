/**
 * Workflow Execution & Audit Log Repository
 */

import { db } from '../db';
import { WorkflowExecution, WorkflowExecutionLog } from '../schemas';

export class WorkflowExecutionRepository {
  static async createExecution(
    execution: Omit<WorkflowExecution, 'startedAt' | 'updatedAt'>
  ): Promise<WorkflowExecution> {
    const now = Date.now();
    const record: WorkflowExecution = {
      ...execution,
      startedAt: now,
      updatedAt: now,
    };
    await db.workflowExecutions.put(record);
    return record;
  }

  static async updateExecution(
    id: string,
    updates: Partial<WorkflowExecution>
  ): Promise<void> {
    await db.workflowExecutions.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  }

  static async getExecution(id: string): Promise<WorkflowExecution | undefined> {
    return db.workflowExecutions.get(id);
  }

  static async getPendingWaitingExecutions(): Promise<WorkflowExecution[]> {
    return db.workflowExecutions
      .where('status')
      .equals('WAITING')
      .toArray();
  }

  static async getExecutionsForContact(contactId: string): Promise<WorkflowExecution[]> {
    return db.workflowExecutions
      .where('contactId')
      .equals(contactId)
      .reverse()
      .sortBy('startedAt');
  }

  static async addLog(
    log: Omit<WorkflowExecutionLog, 'id'>
  ): Promise<WorkflowExecutionLog> {
    const record: WorkflowExecutionLog = {
      ...log,
      id: `${log.executionId}_${log.nodeId}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    };
    await db.executionLogs.put(record);
    return record;
  }

  static async getLogsForExecution(executionId: string): Promise<WorkflowExecutionLog[]> {
    return db.executionLogs
      .where('executionId')
      .equals(executionId)
      .sortBy('startedAt');
  }
}
