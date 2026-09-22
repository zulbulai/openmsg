/**
 * Integration Node Definitions
 * WEBHOOK, HTTP_REQUEST
 * Enforces SSRF Guard to prevent local/private network probing.
 */

import { NodeDefinition, NodeValidationResult, NodeExecutionResult } from '../types';
import { WorkflowNode } from '@/storage/schemas';
import { WorkflowExecutionContext } from '../../context';
import { SSRFGuard } from '@/core/security/ssrf';
import { SafeTemplate } from '@/core/template/safe-template';

export class WebhookNode implements NodeDefinition {
  readonly type = 'WEBHOOK';
  readonly label = 'Outgoing Webhook';
  readonly description = 'Posts event data to an external API endpoint';
  readonly icon = 'Radio';
  readonly category = 'integration';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    const url = data.url as string;
    if (!url) return { valid: false, errors: ['Webhook URL is required'] };
    const ssrfCheck = SSRFGuard.validateUrl(url);
    if (!ssrfCheck.allowed) {
      return { valid: false, errors: [ssrfCheck.reason || 'Invalid or forbidden URL'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext
  ): Promise<NodeExecutionResult> {
    const rawUrl = (node.data.url as string) || '';
    const url = SafeTemplate.render(rawUrl, { variables: context.variables });

    const ssrfCheck = SSRFGuard.validateUrl(url);
    if (!ssrfCheck.allowed) {
      throw new Error(`Webhook blocked by SSRF protection: ${ssrfCheck.reason}`);
    }

    const payload = {
      event: 'workflow_node_executed',
      workflowId: context.workflowId,
      executionId: context.executionId,
      contactId: context.contactId,
      variables: context.variables,
      timestamp: Date.now(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'OpenMsg-Webhook/0.1.0',
    };

    const secret = node.data.secret as string;
    if (secret) {
      // Add signature header
      headers['X-OpenMsg-Signature'] = `sha256=${encodeURIComponent(secret)}`;
    }

    const res = await SSRFGuard.safeFetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    context.logs.push(`Webhook delivered to ${url} (HTTP ${res.status})`);
    return { status: 'CONTINUE', output: { httpStatus: res.status } };
  }
}

export class HttpRequestNode implements NodeDefinition {
  readonly type = 'HTTP_REQUEST';
  readonly label = 'HTTP Request';
  readonly description = 'Executes an API request and parses JSON response into variables';
  readonly icon = 'Globe';
  readonly category = 'integration';
  readonly inputPorts = [{ id: 'input', label: 'In' }];
  readonly outputPorts = [{ id: 'output', label: 'Next' }];

  validate(data: Record<string, unknown>): NodeValidationResult {
    const url = data.url as string;
    if (!url) return { valid: false, errors: ['Request URL is required'] };
    const ssrfCheck = SSRFGuard.validateUrl(url);
    if (!ssrfCheck.allowed) {
      return { valid: false, errors: [ssrfCheck.reason || 'Invalid or forbidden URL'] };
    }
    return { valid: true };
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowExecutionContext
  ): Promise<NodeExecutionResult> {
    const rawUrl = (node.data.url as string) || '';
    const url = SafeTemplate.render(rawUrl, { variables: context.variables });

    const ssrfCheck = SSRFGuard.validateUrl(url);
    if (!ssrfCheck.allowed) {
      throw new Error(`HTTP Request blocked by SSRF protection: ${ssrfCheck.reason}`);
    }

    const method = ((node.data.method as string) || 'GET').toUpperCase();
    const rawBody = node.data.body as string;
    const body = rawBody ? SafeTemplate.render(rawBody, { variables: context.variables }) : undefined;
    const variableName = (node.data.outputVariable as string) || 'httpResponse';

    const res = await SSRFGuard.safeFetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OpenMsg-Client/0.1.0',
      },
      body: method !== 'GET' && body ? body : undefined,
    });

    let data: unknown;
    try {
      data = JSON.parse(res.data);
    } catch {
      data = res.data;
    }

    context.variables[variableName] = data;
    context.logs.push(`HTTP ${method} to ${url} succeeded (stored in variables.${variableName})`);

    return {
      status: 'CONTINUE',
      output: { variableName, data },
    };
  }
}
