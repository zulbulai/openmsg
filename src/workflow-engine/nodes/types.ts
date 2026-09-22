/**
 * Workflow Engine Node Types & Interfaces
 */

import { WorkflowNode } from '@/storage/schemas';
import { WhatsAppClient } from '@/types/whatsapp';
import { WorkflowExecutionContext } from '../context';

export type NodeCategory =
  | 'trigger'
  | 'messaging'
  | 'logic'
  | 'flow'
  | 'contact'
  | 'integration'
  | 'ai';

export interface NodePort {
  id: string;
  label: string;
}

export interface NodeValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface NodeExecutionServices {
  client?: WhatsAppClient;
  onTagContact?: (contactId: string, tagId: string) => Promise<void>;
  onRemoveTag?: (contactId: string, tagId: string) => Promise<void>;
  onAddNote?: (contactId: string, note: string) => Promise<void>;
  onUpdateContact?: (contactId: string, updates: Record<string, unknown>) => Promise<void>;
  onScheduleAlarm?: (name: string, triggerAtMs: number) => Promise<void>;
  invokeWorkflow?: (workflowId: string, contactId: string, vars: Record<string, unknown>) => Promise<void>;
}

export interface NodeExecutionResult {
  status: 'CONTINUE' | 'WAITING' | 'COMPLETED' | 'FAILED';
  outputHandle?: string; // For branching (e.g. 'true'/'false' or switch cases)
  nextNodeId?: string;
  output?: Record<string, unknown>;
  resumeAt?: number;
  error?: string;
}

export interface NodeDefinition {
  readonly type: string;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly category: NodeCategory;
  readonly configSchema?: Record<string, unknown>;
  readonly inputPorts: NodePort[];
  readonly outputPorts: NodePort[];

  validate(data: Record<string, unknown>): NodeValidationResult;

  execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    services: NodeExecutionServices
  ): Promise<NodeExecutionResult>;
}
