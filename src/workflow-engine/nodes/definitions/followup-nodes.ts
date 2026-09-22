/**
 * Follow-up Workflow Node Definitions
 * CREATE_FOLLOW_UP — Creates a follow-up for the current contact in the workflow.
 */

import { NodeDefinition, NodeValidationResult, NodeExecutionResult, NodeExecutionServices } from '../types';
import { WorkflowNode } from '@/storage/schemas';
import { WorkflowExecutionContext } from '../../context';
import { FollowUpService } from '@/core/crm/followup.service';
import type { FollowUpType, FollowUpPriority } from '@/storage/schemas';

export class CreateFollowUpNode implements NodeDefinition {
  readonly type = 'CREATE_FOLLOW_UP';
  readonly label = 'Create Follow-up';
  readonly description = 'Creates a CRM follow-up reminder for the contact';
  readonly icon = 'Bell';
  readonly category = 'contact';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
      return { valid: false, errors: ['Follow-up title is required'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    _services: NodeExecutionServices
  ): Promise<NodeExecutionResult> {
    const title = (node.data.title as string) || 'Follow-up';
    const description = (node.data.description as string) || undefined;
    const type = (node.data.followUpType as FollowUpType) || 'GENERAL';
    const priority = (node.data.priority as FollowUpPriority) || 'MEDIUM';
    const delayHours = (node.data.delayHours as number) || 24;
    const reminderMinutes = (node.data.reminderMinutes as number) ?? 30;

    const dueAt = Date.now() + delayHours * 60 * 60 * 1000;

    const followUp = await FollowUpService.create({
      contactId: context.contactId,
      title,
      description,
      type,
      priority,
      dueAt,
      reminderMinutesBefore: reminderMinutes >= 0 ? reminderMinutes : undefined,
      source: 'WORKFLOW',
      relatedWorkflowId: context.workflowId,
    });

    context.logs.push(`Created follow-up "${title}" for contact ${context.contactId}, due at ${new Date(dueAt).toISOString()}`);

    return {
      status: 'CONTINUE',
      output: {
        followUpId: followUp.id,
        dueAt: followUp.dueAt,
        title: followUp.title,
      },
    };
  }
}
