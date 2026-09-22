/**
 * OpenMsg AI Assistant Gateway
 * Multi-provider client supporting OpenAI, Google Gemini, Anthropic, and custom OpenAI-compatible APIs.
 * Privacy First: No telemetry, no default external calls, explicit user activation only.
 */

export type AIProvider = 'openai' | 'gemini' | 'anthropic' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl?: string; // For custom OpenAI-compatible endpoints (e.g. Ollama, vLLM)
}

export class AIAssistant {
  private static readonly STORAGE_KEY = 'openmsg_ai_config';
  private static _memoryConfig: AIConfig | null = null;

  /**
   * Loads saved AI configuration from local storage
   */
  static async getConfig(): Promise<AIConfig | null> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const res = await chrome.storage.local.get(this.STORAGE_KEY);
        return res[this.STORAGE_KEY] || null;
      }
      if (typeof localStorage !== 'undefined') {
        const local = localStorage.getItem(this.STORAGE_KEY);
        return local ? JSON.parse(local) : null;
      }
      return this._memoryConfig;
    } catch {
      return null;
    }
  }

  /**
   * Saves AI credentials securely to local storage
   */
  static async saveConfig(config: AIConfig): Promise<void> {
    this._memoryConfig = config;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [this.STORAGE_KEY]: config });
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    }
  }

  /**
   * Clears saved AI configuration
   */
  static async clearConfig(): Promise<void> {
    this._memoryConfig = null;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.remove(this.STORAGE_KEY);
    } else if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Generates a conversational reply to a user message
   */
  static async generateReply(
    incomingMessage: string,
    conversationContext?: string
  ): Promise<string> {
    const config = await this.getConfig();
    if (!config || !config.apiKey) {
      throw new Error('AI Assistant is not configured. Please add an API key in Settings -> AI.');
    }

    const systemPrompt =
      'You are a professional WhatsApp customer service assistant. Keep replies concise, warm, helpful, and natural for WhatsApp chat.';
    const prompt = conversationContext
      ? `Recent Conversation:\n${conversationContext}\n\nLatest Customer Message: "${incomingMessage}"\n\nGenerate a helpful response:`
      : `Customer Message: "${incomingMessage}"\n\nGenerate a helpful response:`;

    return this.completePrompt(config, prompt, systemPrompt);
  }

  /**
   * Rewrites an existing draft in a chosen tone
   */
  static async rewriteMessage(
    draft: string,
    tone: 'formal' | 'friendly' | 'concise'
  ): Promise<string> {
    const config = await this.getConfig();
    if (!config || !config.apiKey) {
      throw new Error('AI Assistant is not configured. Please add an API key in Settings -> AI.');
    }

    const systemPrompt = `Rewrite the user's message to sound ${tone}. Do not add commentary or quotes, return only the rewritten message.`;
    return this.completePrompt(config, draft, systemPrompt);
  }

  /**
   * Summarizes a conversation history into key action items
   */
  static async summarizeConversation(messages: string[]): Promise<string> {
    const config = await this.getConfig();
    if (!config || !config.apiKey) {
      throw new Error('AI Assistant is not configured. Please add an API key in Settings -> AI.');
    }

    const transcript = messages.join('\n');
    const systemPrompt =
      'Summarize this customer conversation in 2-3 bullet points: Customer intent, Key discussion, Next action.';
    return this.completePrompt(config, transcript, systemPrompt);
  }

  /**
   * Internal completion dispatcher based on selected provider
   */
  private static async completePrompt(
    config: AIConfig,
    userPrompt: string,
    systemPrompt: string
  ): Promise<string> {
    switch (config.provider) {
      case 'openai':
      case 'custom': {
        const url = config.baseUrl || 'https://api.openai.com/v1/chat/completions';
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`OpenAI API error (${res.status}): ${err}`);
        }

        const data = await res.json();
        return data.choices?.[0]?.message?.content?.trim() || '';
      }

      case 'gemini': {
        const model = config.model || 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
              },
            ],
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Gemini API error (${res.status}): ${err}`);
        }

        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      }

      case 'anthropic': {
        const url = 'https://api.anthropic.com/v1/messages';
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: config.model || 'claude-3-haiku-20240307',
            max_tokens: 500,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Anthropic API error (${res.status}): ${err}`);
        }

        const data = await res.json();
        return data.content?.[0]?.text?.trim() || '';
      }

      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }
}
