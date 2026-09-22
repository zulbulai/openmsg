import { describe, it, expect, beforeEach } from 'vitest';
import { AIAssistant } from '@/core/ai/client';

describe('AI Assistant Gateway Unit Tests', () => {
  beforeEach(async () => {
    await AIAssistant.clearConfig();
  });

  it('throws a helpful configuration error when AI key is missing', async () => {
    await expect(AIAssistant.generateReply('Hello')).rejects.toThrow(
      'AI Assistant is not configured. Please add an API key in Settings -> AI.'
    );
  });

  it('persists and retrieves AI configuration', async () => {
    await AIAssistant.saveConfig({
      provider: 'openai',
      apiKey: 'sk-test-key-12345',
      model: 'gpt-4o-mini',
    });

    const cfg = await AIAssistant.getConfig();
    expect(cfg).not.toBeNull();
    expect(cfg?.provider).toBe('openai');
    expect(cfg?.apiKey).toBe('sk-test-key-12345');
    expect(cfg?.model).toBe('gpt-4o-mini');
  });

  it('correctly clears configuration', async () => {
    await AIAssistant.saveConfig({
      provider: 'gemini',
      apiKey: 'test-gemini-key',
      model: 'gemini-1.5-flash',
    });

    await AIAssistant.clearConfig();
    const cfg = await AIAssistant.getConfig();
    expect(cfg).toBeNull();
  });
});
