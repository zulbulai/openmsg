/**
 * AI Assistant Workflow Node
 * AI_PROMPT
 */

import { NodeDefinition, NodeValidationResult, NodeExecutionResult } from '../types';
import { WorkflowNode } from '@/storage/schemas';
import { WorkflowExecutionContext } from '../../context';
import { SafeTemplate } from '@/core/template/safe-template';

export class AiPromptNode implements NodeDefinition {
  readonly type = 'AI_PROMPT';
  readonly label = 'AI Assistant';
  readonly description = 'Generates AI text or analysis and saves to a variable';
  readonly icon = 'Sparkles';
  readonly category = 'ai';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    if (!data.prompt) {
      return { valid: false, errors: ['Prompt template is required'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext
  ): Promise<NodeExecutionResult> {
    const rawPrompt = (node.data.prompt as string) || '';
    const renderedPrompt = SafeTemplate.render(rawPrompt, {
      variables: context.variables,
      contact: { id: context.contactId },
    });
    const outputVar = (node.data.outputVariable as string) || 'aiResponse';

    // Mock/Simulated or stored response for local execution
    const response = `[AI Reply for: "${renderedPrompt}"]`;
    context.variables[outputVar] = response;
    context.logs.push(`AI node generated output for prompt and stored in variables.${outputVar}`);

    return {
      status: 'CONTINUE',
      output: { [outputVar]: response },
    };
  }
}
