import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '@/workflow-engine/engine';
import { Workflow } from '@/storage/schemas';
import { MockWhatsAppClient } from '@/content/whatsapp/mock-client';

describe('WorkflowEngine', () => {
  it('should execute START -> TEXT -> CONDITION -> DELAY -> TAG_CONTACT -> END', async () => {
    const mockClient = new MockWhatsAppClient();
    const taggedContacts: Array<{ contactId: string; tagId: string }> = [];

    const engine = new WorkflowEngine({
      client: mockClient,
      onTagContact: async (contactId, tagId) => {
        taggedContacts.push({ contactId, tagId });
      },
    });

    const workflow: Workflow = {
      id: 'wf_lead_flow',
      name: 'Lead Qualified Flow',
      description: 'Test workflow',
      isActive: true,
      triggerType: 'MESSAGE_RECEIVED',
      triggerConfig: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nodes: [
        { id: 'node_start', type: 'START', position: { x: 0, y: 0 }, data: {} },
        {
          id: 'node_msg',
          type: 'TEXT',
          position: { x: 100, y: 0 },
          data: { content: 'Hello {{name}}, thanks for your interest!' },
        },
        {
          id: 'node_condition',
          type: 'CONDITION',
          position: { x: 200, y: 0 },
          data: { variable: 'intent', operator: 'equals', value: 'pricing' },
        },
        {
          id: 'node_delay',
          type: 'DELAY',
          position: { x: 300, y: 0 },
          data: { seconds: 10 },
        },
        {
          id: 'node_tag',
          type: 'TAG_CONTACT',
          position: { x: 400, y: 0 },
          data: { tagId: 'tag_high_intent' },
        },
        { id: 'node_end', type: 'END', position: { x: 500, y: 0 }, data: {} },
      ],
      edges: [
        { id: 'e1', source: 'node_start', target: 'node_msg' },
        { id: 'e2', source: 'node_msg', target: 'node_condition' },
        { id: 'e3', source: 'node_condition', target: 'node_delay', sourceHandle: 'true' },
        { id: 'e4', source: 'node_delay', target: 'node_tag' },
        { id: 'e5', source: 'node_tag', target: 'node_end' },
      ],
    };

    // Initialize context with variables
    const context = engine.createContext(workflow, '15551234567@c.us', {
      name: 'Alice',
      intent: 'pricing',
    });

    // Run until halt (should stop at DELAY node)
    const haltedContext = await engine.runUntilHalt(workflow, context);

    expect(haltedContext.status).toBe('WAITING_DELAY');
    expect(haltedContext.resumeAt).toBeDefined();
    expect(haltedContext.resumeAt).toBeGreaterThan(Date.now());
    expect(haltedContext.currentNodeId).toBe('node_tag'); // next target queued

    // Resume execution after simulated delay
    haltedContext.status = 'RUNNING';
    const finalContext = await engine.runUntilHalt(workflow, haltedContext);

    expect(finalContext.status).toBe('COMPLETED');
    expect(taggedContacts).toContainEqual({
      contactId: '15551234567@c.us',
      tagId: 'tag_high_intent',
    });
  });

  it('should correctly interpolate variables and evaluate conditions', () => {
    const text = 'Welcome {{name}} to {{company}}!';
    const result = WorkflowEngine.interpolate(text, { name: 'Bob', company: 'Acme Corp' });
    expect(result).toBe('Welcome Bob to Acme Corp!');

    expect(WorkflowEngine.evaluateCondition('vip', 'equals', 'vip')).toBe(true);
    expect(WorkflowEngine.evaluateCondition('vip', 'equals', 'lead')).toBe(false);
    expect(WorkflowEngine.evaluateCondition(25, 'gt', 10)).toBe(true);
    expect(WorkflowEngine.evaluateCondition('price_inquiry', 'contains', 'price')).toBe(true);
  });
});
