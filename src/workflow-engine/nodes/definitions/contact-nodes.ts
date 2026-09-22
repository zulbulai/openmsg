/**
 * Contact CRM Node Definitions
 * ADD_TAG, REMOVE_TAG, UPDATE_CONTACT, ADD_NOTE
 */

import { NodeDefinition, NodeValidationResult, NodeExecutionResult, NodeExecutionServices } from '../types';
import { WorkflowNode } from '@/storage/schemas';
import { WorkflowExecutionContext } from '../../context';
import { SafeTemplate } from '@/core/template/safe-template';

export class AddTagNode implements NodeDefinition {
  readonly type = 'ADD_TAG';
  readonly label = 'Add Tag';
  readonly description = 'Assigns a tag to the contact';
  readonly icon = 'Tag';
  readonly category = 'contact';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.tagId && !data.tagName) {
      return { valid: false, errors: ['Tag name or ID is required'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    services: NodeExecutionServices
  ): Promise<NodeExecutionResult> {
    const tag = (node.data.tagId || node.data.tagName) as string;
    if (services.onTagContact && tag) {
      await services.onTagContact(context.contactId, tag);
    }
    context.logs.push(`Added tag "${tag}" to contact ${context.contactId}`);
    return { status: 'CONTINUE', output: { tag } };
  }
}

export class RemoveTagNode implements NodeDefinition {
  readonly type = 'REMOVE_TAG';
  readonly label = 'Remove Tag';
  readonly description = 'Removes a tag from the contact';
  readonly icon = 'XCircle';
  readonly category = 'contact';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.tagId && !data.tagName) {
      return { valid: false, errors: ['Tag name or ID is required'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    services: NodeExecutionServices
  ): Promise<NodeExecutionResult> {
    const tag = (node.data.tagId || node.data.tagName) as string;
    if (services.onRemoveTag && tag) {
      await services.onRemoveTag(context.contactId, tag);
    }
    context.logs.push(`Removed tag "${tag}" from contact ${context.contactId}`);
    return { status: 'CONTINUE', output: { tag } };
  }
}

export class UpdateContactNode implements NodeDefinition {
  readonly type = 'UPDATE_CONTACT';
  readonly label = 'Update Contact';
  readonly description = 'Updates contact custom fields or stage';
  readonly icon = 'UserCheck';
  readonly category = 'contact';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.updates || typeof data.updates !== 'object') {
      return { valid: false, errors: ['Field updates mapping is required'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    services: NodeExecutionServices
  ): Promise<NodeExecutionResult> {
    const rawUpdates = (node.data.updates as Record<string, unknown>) || {};
    const processedUpdates: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(rawUpdates)) {
      if (typeof v === 'string') {
        processedUpdates[k] = SafeTemplate.render(v, { variables: context.variables });
      } else {
        processedUpdates[k] = v;
      }
    }

    if (services.onUpdateContact) {
      await services.onUpdateContact(context.contactId, processedUpdates);
    }

    context.logs.push(`Updated contact ${context.contactId} fields: ${JSON.stringify(processedUpdates)}`);
    return { status: 'CONTINUE', output: processedUpdates };
  }
}

export class AddNoteNode implements NodeDefinition {
  readonly type = 'ADD_NOTE';
  readonly label = 'Add Note';
  readonly description = 'Appends an internal note to the contact timeline';
  readonly icon = 'FileEdit';
  readonly category = 'contact';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.content) {
      return { valid: false, errors: ['Note content is required'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    services: NodeExecutionServices
  ): Promise<NodeExecutionResult> {
    const raw = (node.data.content as string) || '';
    const rendered = SafeTemplate.render(raw, {
      variables: context.variables,
      contact: { id: context.contactId },
    });

    if (services.onAddNote) {
      await services.onAddNote(context.contactId, rendered);
    }

    context.logs.push(`Added CRM note to contact ${context.contactId}`);
    return { status: 'CONTINUE', output: { note: rendered } };
  }
}

export class MoveContactStageNode implements NodeDefinition {
  readonly type = 'MOVE_CONTACT_STAGE';
  readonly label = 'Move Contact Stage';
  readonly description = 'Moves contact to a specific CRM pipeline stage';
  readonly icon = 'Kanban';
  readonly category = 'contact';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.stageId && !data.stage) {
      return { valid: false, errors: ['Target stage is required'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext
  ): Promise<NodeExecutionResult> {
    const stageId = String(node.data.stageId || node.data.stage || '');
    const pipelineId = node.data.pipelineId ? String(node.data.pipelineId) : undefined;

    const { ContactRepository } = await import('@/storage/repositories/contact.repository');
    await ContactRepository.moveStage(context.contactId, stageId, pipelineId, 'WORKFLOW');

    context.logs.push(`Moved contact ${context.contactId} to stage ${stageId}`);
    return { status: 'CONTINUE', output: { stageId, pipelineId } };
  }
}

export class EnrollSequenceNode implements NodeDefinition {
  readonly type = 'ENROLL_SEQUENCE';
  readonly label = 'Enroll in Sequence';
  readonly description = 'Starts a drip campaign sequence for the contact';
  readonly icon = 'PlayCircle';
  readonly category = 'contact';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.sequenceId) {
      return { valid: false, errors: ['Target sequence ID is required'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext
  ): Promise<NodeExecutionResult> {
    const sequenceId = String(node.data.sequenceId);

    const { SequenceRepository } = await import('@/storage/repositories/sequence.repository');
    try {
      await SequenceRepository.enrollContact(sequenceId, context.contactId);
      context.logs.push(`Enrolled contact ${context.contactId} in sequence ${sequenceId}`);
      return { status: 'CONTINUE', output: { sequenceId } };
    } catch (err: any) {
      return { status: 'FAILED', error: err.message };
    }
  }
}

export class UnenrollSequenceNode implements NodeDefinition {
  readonly type = 'UNENROLL_SEQUENCE';
  readonly label = 'Unenroll from Sequence';
  readonly description = 'Cancels an active drip campaign sequence for the contact';
  readonly icon = 'StopCircle';
  readonly category = 'contact';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.sequenceId) {
      return { valid: false, errors: ['Target sequence ID is required'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext
  ): Promise<NodeExecutionResult> {
    const sequenceId = String(node.data.sequenceId);

    const { SequenceRepository } = await import('@/storage/repositories/sequence.repository');
    await SequenceRepository.unenrollContact(sequenceId, context.contactId);

    context.logs.push(`Unenrolled contact ${context.contactId} from sequence ${sequenceId}`);
    return { status: 'CONTINUE', output: { sequenceId } };
  }
}
