/**
 * AI & Rule-Based Autoresponder Engine
 * Integrates keyword rules (contains, exact, startswith, endswith, regex) + Spintax
 * Multi-turn Google Gemini & OpenAI HTTP completion with timeout safety
 */

const { parseSpintax, replaceVariables } = require('../shared/utils/spintax');

class AiEngine {
  constructor(database) {
    this.db = database;
  }

  /**
   * Evaluate incoming text against all active keyword rules
   * Supports: contains, exact, startswith, endswith, regex
   * Automatically resolves Spintax {A|B} and dynamic variables {{phone}}, {{time}}, {{date}}
   */
  evaluateRules(incomingText, context = {}) {
    const rules = (this.db.getRules() || []).filter(r => r.isActive);
    const cleanText = (incomingText || '').trim();
    const cleanLower = cleanText.toLowerCase();

    for (const rule of rules) {
      const trigger = (rule.trigger || '').trim();
      if (!trigger) continue;
      const triggerLower = trigger.toLowerCase();

      let matched = false;
      const matchType = (rule.matchType || 'contains').toLowerCase();

      switch (matchType) {
        case 'exact':
          matched = cleanLower === triggerLower;
          break;

        case 'contains':
          matched = cleanLower.includes(triggerLower);
          break;

        case 'startswith':
          matched = cleanLower.startsWith(triggerLower);
          break;

        case 'endswith':
          matched = cleanLower.endsWith(triggerLower);
          break;

        case 'regex':
          try {
            const rx = new RegExp(rule.trigger, 'i');
            matched = rx.test(cleanText);
          } catch (e) {
            console.error('[AiEngine] Invalid regex pattern:', rule.trigger, e.message);
          }
          break;

        default:
          matched = cleanLower.includes(triggerLower);
          break;
      }

      if (matched) {
        // Resolve dynamic variables and Spintax in rule response
        const rendered = this.renderResponse(rule.response, context);
        return {
          type: 'rule',
          ruleId: rule.id,
          trigger: rule.trigger,
          matchType: rule.matchType,
          rawResponse: rule.response,
          response: rendered
        };
      }
    }

    return null;
  }

  /**
   * Test a string against active rules without executing side effects
   */
  testRuleMatch(text, context = {}) {
    const match = this.evaluateRules(text, context);
    if (match) {
      return {
        matched: true,
        ruleId: match.ruleId,
        trigger: match.trigger,
        matchType: match.matchType,
        rawResponse: match.rawResponse,
        renderedResponse: match.response
      };
    }
    return { matched: false };
  }

  /**
   * Render dynamic variables and Spintax for a response
   */
  renderResponse(template, context = {}) {
    if (!template) return '';
    const now = new Date();

    const data = {
      phone: context.senderPhone || context.phone || '',
      senderPhone: context.senderPhone || context.phone || '',
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString(),
      day: now.toLocaleDateString([], { weekday: 'long' }),
      ...(context.variables || {})
    };

    const withVars = replaceVariables(template, data);
    return parseSpintax(withVars);
  }

  /**
   * Get intelligent AI completion from Google Gemini or OpenAI with multi-turn chat history
   */
  async getAiResponse(userMessage, chatHistory = [], overrideConfig = null) {
    const config = overrideConfig || this.db.getAiConfig() || {};
    if (!config.enabled && !overrideConfig) {
      return null;
    }
    if (!config.apiKey) {
      console.warn('[AiEngine] AI enabled but no API key configured');
      return null;
    }

    try {
      if (config.provider === 'openai') {
        return await this._callOpenAi(userMessage, chatHistory, config);
      } else {
        return await this._callGemini(userMessage, chatHistory, config);
      }
    } catch (err) {
      console.error('[AiEngine] Error requesting AI response:', err.message || err);
      throw err;
    }
  }

  async _callOpenAi(userMessage, chatHistory, config) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);

    try {
      const messages = [
        {
          role: 'system',
          content: config.systemPrompt || 'You are a helpful customer support agent for WhatsApp. Provide clear, professional, and concise answers.'
        }
      ];

      for (const h of chatHistory) {
        messages.push({
          role: h.role === 'assistant' || h.fromMe ? 'assistant' : 'user',
          content: h.text || ''
        });
      }

      messages.push({ role: 'user', content: userMessage });

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages,
          max_tokens: parseInt(config.maxTokens, 10) || 300,
          temperature: typeof config.temperature === 'number' ? config.temperature : 0.7
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || null;
    } finally {
      clearTimeout(timeout);
    }
  }

  async _callGemini(userMessage, chatHistory, config) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);

    try {
      const model = config.model || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${config.apiKey}`;

      const contents = [];

      // Priming / system prompt instruction
      if (config.systemPrompt) {
        contents.push({
          role: 'user',
          parts: [{ text: `System Instruction: ${config.systemPrompt}` }]
        });
        contents.push({
          role: 'model',
          parts: [{ text: 'Understood. I will follow these instructions in all responses.' }]
        });
      }

      // Append multi-turn history
      for (const h of chatHistory) {
        contents.push({
          role: h.role === 'assistant' || h.fromMe ? 'model' : 'user',
          parts: [{ text: h.text || '' }]
        });
      }

      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: parseInt(config.maxTokens, 10) || 300,
            temperature: typeof config.temperature === 'number' ? config.temperature : 0.7
          }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    } finally {
      clearTimeout(timeout);
    }
  }
}

module.exports = { AiEngine };
