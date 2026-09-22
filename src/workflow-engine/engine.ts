/**
 * OpenMsg Workflow Execution Engine
 * Executes workflow graphs through modular NodeRegistry.
 * Records step execution logs, safely interpolates variables, and handles delays.
 */

import { Workflow } from '@/storage/schemas';
import { WhatsAppClient } from '@/types/whatsapp';
import { WorkflowExecutionContext, StepResult } from './context';
import { nodeRegistry } from './nodes/registry';
import { NodeExecutionServices } from './nodes/types';
import { SafeTemplate } from '@/core/template/safe-template';
import { ConditionNode } from './nodes/definitions/logic-nodes';
import { WorkflowExecutionRepository } from '@/storage/repositories/workflow-execution.repository';

export interface WorkflowEngineOptions {
  client?: WhatsAppClient;
  onTagContact?: (contactId: string, tagId: string) => Promise<void>;
  onRemoveTag?: (contactId: string, tagId: string) => Promise<void>;
  onAddNote?: (contactId: string, note: string) => Promise<void>;
  onUpdateContact?: (contactId: string, updates: Record<string, unknown>) => Promise<void>;
  onScheduleAlarm?: (name: string, triggerAtMs: number) => Promise<void>;
  invokeWorkflow?: (workflowId: string, contactId: string, vars: Record<string, unknown>) => Promise<void>;
}

export class WorkflowEngine {
  private services: NodeExecutionServices;

  constructor(options: WorkflowEngineOptions = {}) {
    this.services = {
      client: options.client,
      onTagContact: options.onTagContact,
      onRemoveTag: options.onRemoveTag,
      onAddNote: options.onAddNote,
      onUpdateContact: options.onUpdateContact,
      onScheduleAlarm: options.onScheduleAlarm,
      invokeWorkflow: options.invokeWorkflow,
    };
  }

  /**
   * Safely interpolates {{variables}} using SafeTemplate engine
   */
  static interpolate(text: string, variables: Record<string, unknown>): string {
    return SafeTemplate.render(text, { variables });
  }

  /**
   * Safely evaluates conditions using deterministic operators
   */
  static evaluateCondition(
    variableValue: unknown,
    operator: string,
    targetValue: unknown
  ): boolean {
    return ConditionNode.evaluate(variableValue, operator, targetValue);
  }

  /**
   * Initializes a new execution context for a workflow
   */
  createContext(
    workflow: Workflow,
    contactId: string,
    initialVariables: Record<string, unknown> = {}
  ): WorkflowExecutionContext {
    const startNode = workflow.nodes.find(
      (n) => n.type === 'START' || n.type === 'MESSAGE_RECEIVED' || n.type === 'KEYWORD' || n.type === 'MANUAL'
    ) || workflow.nodes[0];

    if (!startNode) {
      throw new Error(`Workflow ${workflow.id} has no valid starting node.`);
    }

    return {
      executionId: `wf_exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      workflowId: workflow.id,
      contactId,
      variables: { ...initialVariables },
      currentNodeId: startNode.id,
      status: 'RUNNING',
      logs: [`Started workflow "${workflow.name}" at node ${startNode.id}`],
    };
  }

  /**
   * Executes a single node step
   */
  async executeStep(
    workflow: Workflow,
    context: WorkflowExecutionContext
  ): Promise<StepResult> {
    const node = workflow.nodes.find((n) => n.id === context.currentNodeId);
    if (!node) {
      context.status = 'FAILED';
      context.error = `Node ${context.currentNodeId} not found in workflow.`;
      return { status: 'FAILED', error: context.error };
    }

    const startedAt = Date.now();
    context.logs.push(`Executing [${node.type}] (Node: ${node.id})`);

    // Look up definition in registry
    // Normalize type (e.g. TEXT -> SEND_TEXT)
    const normalizedType = node.type === 'TEXT' ? 'SEND_TEXT' : node.type;
    const def = nodeRegistry.get(normalizedType);

    try {
      let result;
      if (def) {
        result = await def.execute(node, context, this.services);
      } else {
        // Fallback for SET_VARIABLE or legacy types
        if (node.type === 'SET_VARIABLE') {
          const key = node.data.variable as string;
          if (key) {
            context.variables[key] = node.data.value;
            context.logs.push(`Set variable ${key} = ${JSON.stringify(node.data.value)}`);
          }
          result = { status: 'CONTINUE' as const };
        } else {
          context.logs.push(`Unknown node type ${node.type}, advancing`);
          result = { status: 'CONTINUE' as const };
        }
      }

      // Record step audit log in background repository safely
      try {
        await WorkflowExecutionRepository.addLog({
          executionId: context.executionId,
          nodeId: node.id,
          nodeType: node.type,
          status: result.status === 'FAILED' ? 'FAILED' : 'SUCCESS',
          startedAt,
          completedAt: Date.now(),
          input: node.data,
          output: result.output,
          error: result.error,
        });
      } catch {
        // Ignore local storage error during isolated testing
      }

      if (result.status === 'COMPLETED') {
        context.status = 'COMPLETED';
        return { status: 'COMPLETED' };
      }

      if (result.status === 'WAITING') {
        context.status = 'WAITING_DELAY';
        context.resumeAt = result.resumeAt;

        // Find next target node for when delay finishes
        const nextEdge = workflow.edges.find((e) => e.source === node.id);
        if (nextEdge) {
          context.currentNodeId = nextEdge.target;
        }

        return {
          status: 'WAITING_DELAY',
          resumeAt: result.resumeAt,
          nextNodeId: nextEdge?.target,
        };
      }

      if (result.status === 'FAILED') {
        context.status = 'FAILED';
        context.error = result.error || 'Node execution failed';
        return { status: 'FAILED', error: context.error };
      }

      // Branching: match edge sourceHandle
      let nextEdge;
      if (result.outputHandle) {
        nextEdge = workflow.edges.find(
          (e) => e.source === node.id && e.sourceHandle === result.outputHandle
        );
      }
      if (!nextEdge) {
        nextEdge = workflow.edges.find((e) => e.source === node.id);
      }

      if (!nextEdge) {
        context.status = 'COMPLETED';
        return { status: 'COMPLETED' };
      }

      context.currentNodeId = nextEdge.target;
      return { status: 'CONTINUE', nextNodeId: nextEdge.target };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      context.status = 'FAILED';
      context.error = msg;
      context.logs.push(`Error executing [${node.type}]: ${msg}`);

      try {
        await WorkflowExecutionRepository.addLog({
          executionId: context.executionId,
          nodeId: node.id,
          nodeType: node.type,
          status: 'FAILED',
          startedAt,
          completedAt: Date.now(),
          input: node.data,
          error: msg,
        });
      } catch {
        // Ignore local storage error during isolated testing
      }

      return { status: 'FAILED', error: msg };
    }
  }

  /**
   * Runs the workflow continuously until it hits DELAY, WAITING, COMPLETED, or FAILED
   */
  async runUntilHalt(
    workflow: Workflow,
    context: WorkflowExecutionContext,
    maxSteps = 50
  ): Promise<WorkflowExecutionContext> {
    let steps = 0;
    while (steps < maxSteps) {
      if (context.status !== 'RUNNING') break;

      const result = await this.executeStep(workflow, context);
      if (
        result.status === 'WAITING' ||
        result.status === 'WAITING_DELAY' ||
        result.status === 'WAITING_INPUT' ||
        result.status === 'COMPLETED' ||
        result.status === 'FAILED'
      ) {
        break;
      }
      steps++;
    }

    if (steps >= maxSteps) {
      context.status = 'FAILED';
      context.error = 'Max execution steps exceeded (infinite loop safeguard).';
    }

    return context;
  }
}
