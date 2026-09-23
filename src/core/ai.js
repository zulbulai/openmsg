export const AI_PROVIDERS = {
  openai: {
    label: 'ChatGPT (OpenAI)',
    origin: 'https://api.openai.com',
    keyUrl: 'platform.openai.com/api-keys',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
  },
  gemini: {
    label: 'Gemini (Google)',
    origin: 'https://generativelanguage.googleapis.com',
    keyUrl: 'aistudio.google.com/app/apikey',
    models: ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  },
  anthropic: {
    label: 'Claude (Anthropic)',
    origin: 'https://api.anthropic.com',
    keyUrl: 'console.anthropic.com/settings/keys',
    models: ['claude-haiku-4-5-20251001', 'claude-sonnet-5', 'claude-opus-5'],
  },
};
export const STRAP_ACTIONS = [
  {
    id: 'spelling',
    label: 'Spelling',
    icon: 'spell-check',
    prompt:
      'Fix spelling, grammar and punctuation only. Keep the meaning, tone and language. Return only the corrected text.',
  },
  {
    id: 'translate',
    label: 'Translate',
    icon: 'languages',
    prompt: 'Translate the message into {lang}. Return only the translation.',
  },
  {
    id: 'summarize',
    label: 'Summarize',
    icon: 'text-quote',
    prompt:
      'Summarize the message in one or two short sentences. Return only the summary.',
  },
  {
    id: 'enlarge',
    label: 'Enlarge',
    icon: 'expand',
    prompt:
      'Expand the message with a little more helpful detail while keeping it natural and polite. Return only the new message.',
  },
  {
    id: 'friendly',
    label: 'Friendly',
    icon: 'smile',
    prompt:
      'Rewrite the message in a warm, friendly tone. Keep the meaning and language. Return only the message.',
  },
  {
    id: 'formal',
    label: 'Formal',
    icon: 'briefcase',
    prompt:
      'Rewrite the message in a formal, professional tone. Keep the meaning and language. Return only the message.',
  },
  {
    id: 'ask',
    label: 'Ask AI',
    icon: 'sparkles',
    prompt:
      'Answer the question or request in the message briefly and clearly, as a message ready to send. Return only the answer.',
  },
];
export const STRAP_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'Portuguese',
  'German',
  'Hindi',
  'Arabic',
  'Italian',
];
export const HANDOFF_TOKEN = '[[HANDOFF]]';
function errorText(_0x49dda1, _0x515415) {
  const _0x8eceea = _0x49dda1.json();
  const _0x360afa =
    (_0x8eceea &&
      _0x8eceea.error &&
      (_0x8eceea.error.message || _0x8eceea.error)) ||
    (_0x8eceea && _0x8eceea.message) ||
    _0x49dda1.text.slice(0, 160);
  return (
    AI_PROVIDERS[_0x515415].label +
    ' error (' +
    _0x49dda1.status +
    '): ' +
    (typeof _0x360afa === 'string' ? _0x360afa : JSON.stringify(_0x360afa))
  );
}
export function createAi({ store: _0xa03581, http: _0x51edd8 }) {
  const _0x59eb26 = {
    providers: AI_PROVIDERS,
    provider() {
      return _0xa03581.setting('aiProvider', 'openai');
    },
    keyFor(_0x2f38cc) {
      return (
        (_0xa03581.setting('aiKeys', {}) || {})[
          _0x2f38cc || _0x59eb26.provider()
        ] || ''
      );
    },
    modelFor(_0x46fe6e) {
      const _0xprov = _0x46fe6e || _0x59eb26.provider();
      const _0xsaved = (_0xa03581.setting('aiModels', {}) || {})[_0xprov];
      if (_0xprov === 'gemini' && (!_0xsaved || _0xsaved === 'gemini-2.0-flash')) {
        return 'gemini-3.6-flash';
      }
      return _0xsaved || AI_PROVIDERS[_0xprov].models[0];
    },
    isConfigured(_0x171ab4) {
      return !!_0x59eb26.keyFor(_0x171ab4);
    },
    async complete({
      system = '',
      messages: _0x45a19a,
      provider: _0x38459b,
      model: _0x4871a5,
      maxTokens = 400,
      temperature = 0.5,
    }) {
      const _0x4a0102 = _0x38459b || _0x59eb26.provider();
      const _0x2cfdab = _0x59eb26.keyFor(_0x4a0102);
      if (!_0x2cfdab) {
        throw new Error(
          'Add your ' +
            AI_PROVIDERS[_0x4a0102].label +
            ' API key in Settings first.',
        );
      }
      let _0x3f4e9f = _0x4871a5 || _0x59eb26.modelFor(_0x4a0102);
      if (_0x4a0102 === 'gemini' && (!_0x3f4e9f || _0x3f4e9f === 'gemini-2.0-flash')) {
        _0x3f4e9f = 'gemini-3.6-flash';
      }
      let _0x50f2c1;
      if (_0x4a0102 === 'openai') {
        _0x50f2c1 = await _0x51edd8.request({
          url: 'https://api.openai.com/v1/chat/completions',
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + _0x2cfdab,
          },
          timeoutMs: 45000,
          json: {
            model: _0x3f4e9f,
            temperature: temperature,
            max_tokens: maxTokens,
            messages: (system
              ? [
                  {
                    role: 'system',
                    content: system,
                  },
                ]
              : []
            ).concat(_0x45a19a),
          },
        });
        if (!_0x50f2c1.ok) {
          throw new Error(errorText(_0x50f2c1, _0x4a0102));
        }
        const _0x86d6f6 = _0x50f2c1.json();
        return String(
          (_0x86d6f6 &&
            _0x86d6f6.choices &&
            _0x86d6f6.choices[0] &&
            _0x86d6f6.choices[0].message &&
            _0x86d6f6.choices[0].message.content) ||
            '',
        ).trim();
      }
      if (_0x4a0102 === 'gemini') {
        _0x50f2c1 = await _0x51edd8.request({
          url:
            'https://generativelanguage.googleapis.com/v1beta/models/' +
            encodeURIComponent(_0x3f4e9f) +
            ':generateContent?key=' +
            encodeURIComponent(_0x2cfdab),
          method: 'POST',
          timeoutMs: 45000,
          json: {
            systemInstruction: system
              ? {
                  parts: [
                    {
                      text: system,
                    },
                  ],
                }
              : undefined,
            contents: _0x45a19a.map((_0x329e5d) => ({
              role: _0x329e5d.role === 'assistant' ? 'model' : 'user',
              parts: [
                {
                  text: _0x329e5d.content,
                },
              ],
            })),
            generationConfig: {
              temperature: temperature,
              maxOutputTokens: maxTokens,
            },
          },
        });
        if (!_0x50f2c1.ok) {
          throw new Error(errorText(_0x50f2c1, _0x4a0102));
        }
        const _0x474d27 = _0x50f2c1.json();
        const _0x4cc2e4 =
          (_0x474d27 &&
            _0x474d27.candidates &&
            _0x474d27.candidates[0] &&
            _0x474d27.candidates[0].content &&
            _0x474d27.candidates[0].content.parts) ||
          [];
        return _0x4cc2e4
          .map((_0xa95d46) => _0xa95d46.text || '')
          .join('')
          .trim();
      }
      if (_0x4a0102 === 'anthropic') {
        _0x50f2c1 = await _0x51edd8.request({
          url: 'https://api.anthropic.com/v1/messages',
          method: 'POST',
          timeoutMs: 45000,
          headers: {
            'x-api-key': _0x2cfdab,
            'anthropic-version': '2023-06-01',
          },
          json: {
            model: _0x3f4e9f,
            max_tokens: maxTokens,
            temperature: temperature,
            system: system || undefined,
            messages: _0x45a19a,
          },
        });
        if (!_0x50f2c1.ok) {
          throw new Error(errorText(_0x50f2c1, _0x4a0102));
        }
        const _0x4e3a65 = _0x50f2c1.json();
        return ((_0x4e3a65 && _0x4e3a65.content) || [])
          .map((_0x501e53) => _0x501e53.text || '')
          .join('')
          .trim();
      }
      throw new Error('Unknown AI provider.');
    },
    async rewrite(_0x3558d8, _0x58cf05, _0xb67cfd = 'English') {
      const _0x1fc952 = STRAP_ACTIONS.find(
        (_0x20d486) => _0x20d486.id === _0x3558d8,
      );
      if (!_0x1fc952) {
        throw new Error('Unknown AI action.');
      }
      if (!String(_0x58cf05 || '').trim()) {
        throw new Error('Type a message first.');
      }
      const _0x1566cc = await _0x59eb26.complete({
        system: _0x1fc952.prompt.replace('{lang}', _0xb67cfd),
        messages: [
          {
            role: 'user',
            content: _0x58cf05,
          },
        ],
        maxTokens: 500,
        temperature: 0.4,
      });
      if (!_0x1566cc) {
        throw new Error('The AI returned an empty answer.');
      }
      return _0x1566cc;
    },
  };
  return _0x59eb26;
}
