/**
 * Trigger Node Definitions
 * START, MESSAGE_RECEIVED, KEYWORD, SCHEDULE, MANUAL
 */

import { NodeDefinition, NodeValidationResult, NodeExecutionResult } from '../types';

export class StartNode implements NodeDefinition {
  readonly type = 'START';
  readonly label = 'Start';
  readonly description = 'Workflow entry point';
  readonly icon = 'Play';
  readonly category = 'trigger';
  readonly inputPorts = [];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(): NodeValidationResult {
    return { valid: true };
  }

  async execute(): Promise<NodeExecutionResult> {
    return { status: 'CONTINUE' };
  }
}

export class MessageReceivedTriggerNode implements NodeDefinition {
  readonly type = 'MESSAGE_RECEIVED';
  readonly label = 'Message Received';
  readonly description = 'Triggers on any incoming message from a contact';
  readonly icon = 'MessageSquare';
  readonly category = 'trigger';
  readonly inputPorts = [];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(): NodeValidationResult {
    return { valid: true };
  }

  async execute(): Promise<NodeExecutionResult> {
    return { status: 'CONTINUE' };
  }
}

export class KeywordTriggerNode implements NodeDefinition {
  readonly type = 'KEYWORD';
  readonly label = 'Keyword Trigger';
  readonly description = 'Triggers when an incoming message matches specific keywords';
  readonly icon = 'Key';
  readonly category = 'trigger';
  readonly inputPorts = [];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    const keywords = data.keywords;
    if (!keywords || (Array.isArray(keywords) && keywords.length === 0)) {
      return { valid: false, errors: ['At least one keyword is required'] };
    }
    return { valid: true };
  }

  async execute(): Promise<NodeExecutionResult> {
    return { status: 'CONTINUE' };
  }
}

export class ScheduleTriggerNode implements NodeDefinition {
  readonly type = 'SCHEDULE';
  readonly label = 'Schedule Trigger';
  readonly description = 'Triggers based on a scheduled time or recurring cron';
  readonly icon = 'Calendar';
  readonly category = 'trigger';
  readonly inputPorts = [];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.scheduleTime && !data.cron) {
      return { valid: false, errors: ['Schedule time or cron expression is required'] };
    }
    return { valid: true };
  }

  async execute(): Promise<NodeExecutionResult> {
    return { status: 'CONTINUE' };
  }
}

export class ManualTriggerNode implements NodeDefinition {
  readonly type = 'MANUAL';
  readonly label = 'Manual Trigger';
  readonly description = 'Triggers manually from the CRM or contact profile';
  readonly icon = 'UserCheck';
  readonly category = 'trigger';
  readonly inputPorts = [];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(): NodeValidationResult {
    return { valid: true };
  }

  async execute(): Promise<NodeExecutionResult> {
    return { status: 'CONTINUE' };
  }
}
