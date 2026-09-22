/**
 * Flow Node Definitions
 * DELAY, JUMP, START_WORKFLOW, END
 */

import { NodeDefinition, NodeValidationResult, NodeExecutionResult, NodeExecutionServices } from '../types';
import { WorkflowNode } from '@/storage/schemas';
import { WorkflowExecutionContext } from '../../context';

export class DelayNode implements NodeDefinition {
  readonly type = 'DELAY';
  readonly label = 'Delay';
  readonly description = 'Waits for a specified duration before continuing (survives restarts)';
  readonly icon = 'Clock';
  readonly category = 'flow';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    const seconds = Number(data.seconds);
    if (isNaN(seconds) || seconds <= 0) {
      return { valid: false, errors: ['Delay must be a positive number of seconds'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    services: NodeExecutionServices
  ): Promise<NodeExecutionResult> {
    const seconds = Number(node.data.seconds) || 10;
    const resumeAt = Date.now() + seconds * 1000;

    // Schedule persistent Chrome Alarm to wake the service worker if suspended
    const alarmName = `wf_delay_${context.executionId}_${node.id}`;
    if (services.onScheduleAlarm) {
      await services.onScheduleAlarm(alarmName, resumeAt);
    }

    context.logs.push(`Delaying execution for ${seconds}s until ${new Date(resumeAt).toISOString()}`);
    return {
      status: 'WAITING',
      resumeAt,
      output: { resumeAt, seconds },
    };
  }
}

export class JumpNode implements NodeDefinition {
  readonly type = 'JUMP';
  readonly label = 'Jump To Node';
  readonly description = 'Jumps directly to another node in this workflow';
  readonly icon = 'CornerDownRight';
  readonly category = 'flow';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.targetNodeId) {
      return { valid: false, errors: ['Target node ID is required'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext
  ): Promise<NodeExecutionResult> {
    const targetNodeId = node.data.targetNodeId as string;
    context.logs.push(`Jumped to node [${targetNodeId}]`);
    return {
      status: 'CONTINUE',
      nextNodeId: targetNodeId,
    };
  }
}

export class StartWorkflowNode implements NodeDefinition {
  readonly type = 'START_WORKFLOW';
  readonly label = 'Start Workflow';
  readonly description = 'Triggers another workflow as a sub-routine';
  readonly icon = 'ExternalLink';
  readonly category = 'flow';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.workflowId) {
      return { valid: false, errors: ['Target workflow ID is required'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext,
    services: NodeExecutionServices
  ): Promise<NodeExecutionResult> {
    const targetId = node.data.workflowId as string;
    if (services.invokeWorkflow) {
      await services.invokeWorkflow(targetId, context.contactId, context.variables);
    }
    context.logs.push(`Invoked sub-workflow [${targetId}]`);
    return { status: 'CONTINUE' };
  }
}

export class EndNode implements NodeDefinition {
  readonly type = 'END';
  readonly label = 'End';
  readonly description = 'Terminates workflow execution cleanly';
  readonly icon = 'CheckCircle2';
  readonly category = 'flow';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [];

  validate(): NodeValidationResult {
    return { valid: true };
  }

  async execute(
    _node: WorkflowNode,
    context: WorkflowExecutionContext
  ): Promise<NodeExecutionResult> {
    context.logs.push('Workflow completed at END node.');
    return { status: 'COMPLETED' };
  }
}
