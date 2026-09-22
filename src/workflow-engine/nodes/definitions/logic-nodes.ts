/**
 * Logic Node Definitions
 * CONDITION, SWITCH
 */

import { NodeDefinition, NodeValidationResult, NodeExecutionResult } from '../types';
import { WorkflowNode } from '@/storage/schemas';
import { WorkflowExecutionContext } from '../../context';

export class ConditionNode implements NodeDefinition {
  readonly type = 'CONDITION';
  readonly label = 'Condition';
  readonly description = 'Branch execution based on rules and variable values';
  readonly icon = 'GitBranch';
  readonly category = 'logic';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [
    { id: 'true', label: 'True' },
    { id: 'false', label: 'False' },
  ];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.variable) {
      return { valid: false, errors: ['Variable name is required for condition'] };
    }
    return { valid: true };
  }

  static evaluate(leftVal: unknown, operator: string, rightVal: unknown): boolean {
    const leftStr = leftVal !== undefined && leftVal !== null ? String(leftVal).toLowerCase().trim() : '';
    const rightStr = rightVal !== undefined && rightVal !== null ? String(rightVal).toLowerCase().trim() : '';

    switch (operator) {
      case 'equals':
        return leftStr === rightStr;
      case 'not_equals':
        return leftStr !== rightStr;
      case 'contains':
        return leftStr.includes(rightStr);
      case 'not_contains':
        return !leftStr.includes(rightStr);
      case 'starts_with':
        return leftStr.startsWith(rightStr);
      case 'ends_with':
        return leftStr.endsWith(rightStr);
      case 'greater_than':
      case 'gt':
        return Number(leftVal) > Number(rightVal);
      case 'less_than':
      case 'lt':
        return Number(leftVal) < Number(rightVal);
      case 'exists':
        return leftVal !== undefined && leftVal !== null && leftStr !== '';
      case 'does_not_exist':
        return leftVal === undefined || leftVal === null || leftStr === '';
      case 'regex': {
        try {
          const re = new RegExp(String(rightVal), 'i');
          return re.test(String(leftVal || ''));
        } catch {
          return false;
        }
      }
      default:
        return false;
    }
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext
  ): Promise<NodeExecutionResult> {
    const variableName = (node.data.variable as string) || '';
    const operator = (node.data.operator as string) || 'equals';
    const targetValue = node.data.value;

    const val = context.variables[variableName];
    const passed = ConditionNode.evaluate(val, operator, targetValue);

    context.logs.push(`Evaluated Condition [${variableName} ${operator} "${targetValue}"] => ${passed}`);
    return {
      status: 'CONTINUE',
      outputHandle: passed ? 'true' : 'false',
      output: { passed },
    };
  }
}

export class SwitchNode implements NodeDefinition {
  readonly type = 'SWITCH';
  readonly label = 'Switch / Multi-Branch';
  readonly description = 'Routes execution to one of multiple paths matching a variable';
  readonly icon = 'Split';
  readonly category = 'logic';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [
    { id: 'case_1', label: 'Case 1' },
    { id: 'case_2', label: 'Case 2' },
    { id: 'default', label: 'Default' },
  ];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.variable) {
      return { valid: false, errors: ['Variable name is required for switch'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext
  ): Promise<NodeExecutionResult> {
    const variableName = (node.data.variable as string) || '';
    const val = context.variables[variableName];
    const cases = (node.data.cases as Array<{ id: string; value: string }>) || [];

    const matched = cases.find((c) => String(c.value).toLowerCase() === String(val).toLowerCase());
    const branch = matched ? matched.id : 'default';

    context.logs.push(`Switch routed to [${branch}] (value: ${val})`);
    return {
      status: 'CONTINUE',
      outputHandle: branch,
      output: { selectedBranch: branch },
    };
  }
}
