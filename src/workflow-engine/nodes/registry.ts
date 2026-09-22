/**
 * Node Registry
 * Central catalog of all workflow node definitions.
 */

import { NodeDefinition, NodeCategory, NodeValidationResult } from './types';
import { WorkflowNode } from '@/storage/schemas';

// Import node classes
import {
  StartNode,
  MessageReceivedTriggerNode,
  KeywordTriggerNode,
  ScheduleTriggerNode,
  ManualTriggerNode,
} from './definitions/trigger-nodes';

import {
  SendTextNode,
  SendImageNode,
  SendVideoNode,
  SendAudioNode,
  SendDocumentNode,
  ButtonsNode,
  ListNode,
} from './definitions/message-nodes';

import {
  ConditionNode,
  SwitchNode,
} from './definitions/logic-nodes';

import {
  DelayNode,
  JumpNode,
  StartWorkflowNode,
  EndNode,
} from './definitions/flow-nodes';

import {
  AddTagNode,
  RemoveTagNode,
  UpdateContactNode,
  AddNoteNode,
  MoveContactStageNode,
} from './definitions/contact-nodes';

import {
  WebhookNode,
  HttpRequestNode,
} from './definitions/integration-nodes';

import {
  AiPromptNode,
} from './definitions/ai-nodes';

export class NodeRegistry {
  private static instance: NodeRegistry;
  private definitions: Map<string, NodeDefinition> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  static getInstance(): NodeRegistry {
    if (!NodeRegistry.instance) {
      NodeRegistry.instance = new NodeRegistry();
    }
    return NodeRegistry.instance;
  }

  private registerDefaults(): void {
    // Triggers
    this.register(new StartNode());
    this.register(new MessageReceivedTriggerNode());
    this.register(new KeywordTriggerNode());
    this.register(new ScheduleTriggerNode());
    this.register(new ManualTriggerNode());

    // Messaging
    this.register(new SendTextNode());
    this.register(new SendImageNode());
    this.register(new SendVideoNode());
    this.register(new SendAudioNode());
    this.register(new SendDocumentNode());
    this.register(new ButtonsNode());
    this.register(new ListNode());

    // Logic
    this.register(new ConditionNode());
    this.register(new SwitchNode());

    // Flow
    this.register(new DelayNode());
    this.register(new JumpNode());
    this.register(new StartWorkflowNode());
    this.register(new EndNode());

    // Contact
    this.register(new AddTagNode());
    this.register(new RemoveTagNode());
    this.register(new UpdateContactNode());
    this.register(new AddNoteNode());
    this.register(new MoveContactStageNode());

    // Integration
    this.register(new WebhookNode());
    this.register(new HttpRequestNode());

    // AI
    this.register(new AiPromptNode());
  }

  register(definition: NodeDefinition): void {
    this.definitions.set(definition.type, definition);
  }

  get(type: string): NodeDefinition | undefined {
    if (type === 'TAG_CONTACT') return this.definitions.get('ADD_TAG');
    if (type === 'TEXT') return this.definitions.get('SEND_TEXT');
    return this.definitions.get(type);
  }

  getAll(): NodeDefinition[] {
    return Array.from(this.definitions.values());
  }

  getByCategory(category: NodeCategory): NodeDefinition[] {
    return this.getAll().filter((d) => d.category === category);
  }

  validateNode(node: WorkflowNode): NodeValidationResult {
    const def = this.get(node.type);
    if (!def) {
      return { valid: false, errors: [`Unrecognized node type "${node.type}"`] };
    }
    return def.validate(node.data);
  }
}

export const nodeRegistry = NodeRegistry.getInstance();
