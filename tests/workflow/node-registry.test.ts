import { describe, it, expect } from 'vitest';
import { nodeRegistry } from '@/workflow-engine/nodes/registry';

describe('NodeRegistry', () => {
  it('should register all expected default node definitions', () => {
    const allNodes = nodeRegistry.getAll();
    expect(allNodes.length).toBeGreaterThanOrEqual(18);

    // Triggers
    expect(nodeRegistry.get('START')).toBeDefined();
    expect(nodeRegistry.get('MESSAGE_RECEIVED')).toBeDefined();
    expect(nodeRegistry.get('KEYWORD')).toBeDefined();
    expect(nodeRegistry.get('SCHEDULE')).toBeDefined();
    expect(nodeRegistry.get('MANUAL')).toBeDefined();

    // Messaging
    expect(nodeRegistry.get('SEND_TEXT')).toBeDefined();
    expect(nodeRegistry.get('SEND_IMAGE')).toBeDefined();
    expect(nodeRegistry.get('SEND_VIDEO')).toBeDefined();
    expect(nodeRegistry.get('SEND_AUDIO')).toBeDefined();
    expect(nodeRegistry.get('SEND_DOCUMENT')).toBeDefined();
    expect(nodeRegistry.get('BUTTONS')).toBeDefined();
    expect(nodeRegistry.get('LIST')).toBeDefined();

    // Logic & Flow
    expect(nodeRegistry.get('CONDITION')).toBeDefined();
    expect(nodeRegistry.get('SWITCH')).toBeDefined();
    expect(nodeRegistry.get('DELAY')).toBeDefined();
    expect(nodeRegistry.get('JUMP')).toBeDefined();
    expect(nodeRegistry.get('END')).toBeDefined();

    // Contact & Integration & AI
    expect(nodeRegistry.get('ADD_TAG')).toBeDefined();
    expect(nodeRegistry.get('REMOVE_TAG')).toBeDefined();
    expect(nodeRegistry.get('UPDATE_CONTACT')).toBeDefined();
    expect(nodeRegistry.get('ADD_NOTE')).toBeDefined();
    expect(nodeRegistry.get('WEBHOOK')).toBeDefined();
    expect(nodeRegistry.get('HTTP_REQUEST')).toBeDefined();
    expect(nodeRegistry.get('AI_PROMPT')).toBeDefined();
  });

  it('should retrieve nodes by category', () => {
    const triggerNodes = nodeRegistry.getByCategory('trigger');
    expect(triggerNodes.map((n) => n.type)).toContain('START');

    const messagingNodes = nodeRegistry.getByCategory('messaging');
    expect(messagingNodes.map((n) => n.type)).toContain('SEND_TEXT');

    const logicNodes = nodeRegistry.getByCategory('logic');
    expect(logicNodes.map((n) => n.type)).toContain('CONDITION');
  });

  it('should validate node configuration data correctly', () => {
    const invalidTextNode = {
      id: 'n1',
      type: 'SEND_TEXT',
      position: { x: 0, y: 0 },
      data: {}, // Missing text
    };
    const res1 = nodeRegistry.validateNode(invalidTextNode);
    expect(res1.valid).toBe(false);
    expect(res1.errors).toBeDefined();

    const validTextNode = {
      id: 'n2',
      type: 'SEND_TEXT',
      position: { x: 0, y: 0 },
      data: { text: 'Hello World' },
    };
    const res2 = nodeRegistry.validateNode(validTextNode);
    expect(res2.valid).toBe(true);
  });
});
