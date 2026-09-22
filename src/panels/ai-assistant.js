import { h, icon, clear } from '../ui/dom.js';
import * as _0x54a420 from '../ui/kit.js';
import { AI_PROVIDERS } from '../core/ai.js';
import { buildSystemPrompt } from '../core/assistant.js';
import { WEEKDAYS } from '../core/timecalc.js';
import { clone } from '../core/util.js';
function daysEditor(_0x54b17b, _0x413a03) {
  const _0x4d13ab = h('div', {
    class: 'wc-daychips',
  });
  const _0x485ae8 = () => {
    clear(_0x4d13ab);
    WEEKDAYS.forEach((_0x22e08e, _0x2c7b06) =>
      _0x4d13ab.appendChild(
        h(
          'button',
          {
            type: 'button',
            class:
              'wc-daychip' + (_0x54b17b.includes(_0x2c7b06) ? ' is-on' : ''),
            onClick: () => {
              const _0x138147 = _0x54b17b.indexOf(_0x2c7b06);
              if (_0x138147 >= 0) {
                _0x54b17b.splice(_0x138147, 1);
              } else {
                _0x54b17b.push(_0x2c7b06);
              }
              _0x54b17b.sort();
              _0x485ae8();
              _0x413a03(_0x54b17b.slice());
            },
          },
          _0x22e08e,
        ),
      ),
    );
  };
  _0x485ae8();
  return _0x4d13ab;
}
export default {
  id: 'ai',
  title: 'AI Assistant',
  subtitle:
    'Let an AI answer common questions for you, within the rules you set.',
  icon: 'sparkles',
  render(_0x31aeaa) {
    const { app: _0x3ed8e8 } = _0x31aeaa;
    const _0x10df5b = clone(_0x3ed8e8.assistant.config());
    const _0x59ce2d = Object.assign(
      {
        openai: '',
        gemini: '',
        anthropic: '',
      },
      _0x3ed8e8.store.setting('aiKeys'),
    );
    const _0x3ddb72 = Object.assign({}, _0x3ed8e8.store.setting('aiModels'));
    const _0x5c46d8 = {
      provider: _0x3ed8e8.store.setting('aiProvider') || 'openai',
      strap: _0x3ed8e8.store.setting('aiStrapEnabled') !== false,
      dirty: false,
    };
    const _0x1004ae = () => {
      _0x5c46d8.dirty = true;
    };
    const _0x75725 = h('div', {
      class: 'wc-screen wc-form wc-narrow',
    });
    const _0x4225b7 = h('div', {
      class: 'wc-stack',
    });
    const _0x37a8a6 = h('div', {
      class: 'wc-stack',
    });
    function _0x26f287() {
      clear(_0x4225b7);
      const _0x5a7101 = AI_PROVIDERS[_0x5c46d8.provider];
      const _0x5c0ea7 = _0x54a420.input({
        type: 'password',
        value: _0x59ce2d[_0x5c46d8.provider],
        placeholder: 'Paste your API key',
        onInput: (_0x3dd1a2) => {
          _0x59ce2d[_0x5c46d8.provider] = _0x3dd1a2.trim();
          _0x1004ae();
        },
      });
      const _0x3e01cc = h('input', {
        class: 'wc-input',
        list: 'wc-models',
        value: _0x3ddb72[_0x5c46d8.provider] || _0x5a7101.models[0],
        onInput: (_0x1afbb4) => {
          _0x3ddb72[_0x5c46d8.provider] = _0x1afbb4.target.value.trim();
          _0x1004ae();
        },
      });
      _0x4225b7.appendChild(
        _0x54a420.field(
          'AI service',
          _0x54a420.select(
            Object.keys(AI_PROVIDERS).map((_0x5d152e) => ({
              value: _0x5d152e,
              label: AI_PROVIDERS[_0x5d152e].label,
            })),
            _0x5c46d8.provider,
            (_0x13517d) => {
              _0x5c46d8.provider = _0x13517d;
              _0x1004ae();
              _0x26f287();
            },
          ),
        ),
      );
      _0x4225b7.appendChild(
        _0x54a420.field('API key', _0x5c0ea7, {
          hint:
            'Create one at ' +
            _0x5a7101.keyUrl +
            '. It is stored only in this browser.',
        }),
      );
      _0x4225b7.appendChild(
        _0x54a420.field(
          'Model',
          h(
            'div',
            null,
            _0x3e01cc,
            h(
              'datalist',
              {
                id: 'wc-models',
              },
              _0x5a7101.models.map((_0x3aff49) =>
                h('option', {
                  value: _0x3aff49,
                }),
              ),
            ),
          ),
          {
            hint: 'Leave the default unless you know you need another model.',
          },
        ),
      );
      _0x4225b7.appendChild(
        h(
          'div',
          {
            class: 'wc-inline',
          },
          _0x54a420.button(
            'Allow access to ' + _0x5a7101.origin.replace('https://', ''),
            {
              icon: 'shield-check',
              size: 'sm',
              onClick: () => _0x3ed8e8.http.grant(_0x5a7101.origin),
            },
          ),
          _0x54a420.button('Test connection', {
            icon: 'play',
            size: 'sm',
            onClick: _0x81d3c1,
          }),
        ),
      );
    }
    async function _0x81d3c1() {
      await _0x32b9f4(true);
      clear(_0x37a8a6);
      _0x37a8a6.appendChild(
        h(
          'span',
          {
            class: 'wc-muted',
          },
          'Testing...',
        ),
      );
      try {
        const _0x2a8312 = await _0x3ed8e8.ai.complete({
          system: 'Reply with the single word OK.',
          messages: [
            {
              role: 'user',
              content: 'Ping',
            },
          ],
          maxTokens: 8,
        });
        clear(_0x37a8a6);
        _0x37a8a6.appendChild(
          _0x54a420.banner(
            'Connected. The AI answered: ' + _0x2a8312.slice(0, 60),
            'info',
            'circle-check',
          ),
        );
      } catch (_0x4a9317) {
        clear(_0x37a8a6);
        _0x37a8a6.appendChild(_0x54a420.banner(_0x4a9317.message, 'danger'));
        if (_0x4a9317 && _0x4a9317.name === 'PermissionError') {
          _0x37a8a6.appendChild(
            _0x54a420.button('Allow access to ' + _0x4a9317.origin, {
              variant: 'primary',
              onClick: () => _0x3ed8e8.http.grant(_0x4a9317.origin),
            }),
          );
        }
      }
    }
    async function _0x32b9f4(_0x9d4945) {
      await _0x3ed8e8.store.setSettings({
        aiProvider: _0x5c46d8.provider,
        aiKeys: _0x59ce2d,
        aiModels: _0x3ddb72,
        aiStrapEnabled: _0x5c46d8.strap,
      });
      await _0x3ed8e8.assistant.saveConfig(_0x10df5b);
      _0x5c46d8.dirty = false;
      if (!_0x9d4945) {
        _0x54a420.toast('AI Assistant saved', 'success');
      }
    }
    const _0x3949df = _0x54a420.input({
      placeholder: 'Type a message a customer might send',
      value: 'What are your opening hours?',
    });
    async function _0x1800d0() {
      await _0x32b9f4(true);
      clear(_0x37a8a6);
      _0x37a8a6.appendChild(
        h(
          'span',
          {
            class: 'wc-muted',
          },
          'Thinking...',
        ),
      );
      try {
        const _0x33304f = await _0x3ed8e8.ai.complete({
          system: buildSystemPrompt(_0x10df5b),
          messages: [
            {
              role: 'user',
              content: _0x3949df.value,
            },
          ],
          maxTokens: 300,
          temperature: 0.4,
        });
        clear(_0x37a8a6);
        _0x37a8a6.appendChild(
          h(
            'div',
            {
              class: 'wc-bubble-row is-them',
            },
            h(
              'div',
              {
                class: 'wc-msgbubble',
              },
              h(
                'span',
                {
                  class: 'wc-prewrap',
                },
                (_0x10df5b.name ? '*' + _0x10df5b.name + ':* ' : '') +
                  _0x33304f,
              ),
            ),
          ),
        );
      } catch (_0xab42b6) {
        clear(_0x37a8a6);
        _0x37a8a6.appendChild(_0x54a420.banner(_0xab42b6.message, 'danger'));
        if (_0xab42b6 && _0xab42b6.name === 'PermissionError') {
          _0x37a8a6.appendChild(
            _0x54a420.button('Allow access to ' + _0xab42b6.origin, {
              variant: 'primary',
              onClick: () => _0x3ed8e8.http.grant(_0xab42b6.origin),
            }),
          );
        }
      }
    }
    const _0x5d9c13 = _0x54a420.multiSelect({
      options: [],
      value: _0x10df5b.labelBlockIds,
      placeholder: 'Choose labels',
      onChange: (_0x371658) => {
        _0x10df5b.labelBlockIds = _0x371658;
        _0x1004ae();
      },
    });
    _0x3ed8e8.wa
      .labels()
      .then((_0x3476ee) =>
        _0x5d9c13.setOptions(
          _0x3476ee.map((_0x1ee4e4) => ({
            value: _0x1ee4e4.id,
            label: _0x1ee4e4.name,
            color: _0x1ee4e4.color,
          })),
        ),
      )
      .catch(() => {});
    _0x75725.appendChild(
      _0x54a420.section(
        'Service',
        [
          h(
            'div',
            {
              class: 'wc-inline',
            },
            _0x54a420.toggle(
              _0x10df5b.enabled,
              (_0x4b0242) => {
                _0x10df5b.enabled = _0x4b0242;
                _0x1004ae();
              },
              'Enable AI Assistant',
            ),
            h(
              'div',
              null,
              h('strong', null, 'Enable AI Assistant'),
              h(
                'div',
                {
                  class: 'wc-muted',
                },
                'Replies to customers when no chatbot or message bot answers first.',
              ),
            ),
          ),
          _0x4225b7,
          _0x37a8a6,
        ],
        {
          card: true,
        },
      ),
    );
    _0x26f287();
    _0x75725.appendChild(
      _0x54a420.section(
        'What the assistant knows',
        [
          _0x54a420.field(
            'Name shown before each reply',
            _0x54a420.input({
              value: _0x10df5b.name,
              placeholder: 'Assistant',
              onInput: (_0x2220e3) => {
                _0x10df5b.name = _0x2220e3;
                _0x1004ae();
              },
            }),
            {
              hint: 'Appears in bold at the start of each message. Leave empty to hide it.',
            },
          ),
          _0x54a420.field(
            'About your business',
            _0x54a420.textarea({
              value: _0x10df5b.business,
              rows: 8,
              placeholder:
                'Opening hours, prices, address, delivery times, refund policy, frequently asked questions...',
              onInput: (_0x1f5ae9) => {
                _0x10df5b.business = _0x1f5ae9;
                _0x1004ae();
              },
            }),
            {
              hint: 'The assistant only answers from this and what the customer says. The more it knows, the better it helps.',
            },
          ),
          _0x54a420.field(
            'Extra instructions (optional)',
            _0x54a420.textarea({
              value: _0x10df5b.instructions,
              rows: 3,
              placeholder:
                'For example: always answer in Hindi. Never promise discounts.',
              onInput: (_0x9712b6) => {
                _0x10df5b.instructions = _0x9712b6;
                _0x1004ae();
              },
            }),
          ),
          h(
            'div',
            {
              class: 'wc-subcard wc-stack',
            },
            h('strong', null, 'Try it'),
            h(
              'div',
              {
                class: 'wc-form-row',
              },
              _0x3949df,
              _0x54a420.button('Ask', {
                icon: 'send',
                onClick: _0x1800d0,
              }),
            ),
            h(
              'span',
              {
                class: 'wc-muted',
              },
              'Sends one test question with your settings. Nothing goes to WhatsApp.',
            ),
          ),
        ],
        {
          card: true,
        },
      ),
    );
    _0x75725.appendChild(
      _0x54a420.section(
        'Welcome message',
        [
          _0x54a420.checkbox(
            _0x10df5b.useWelcome,
            (_0x51ce53) => {
              _0x10df5b.useWelcome = _0x51ce53;
              _0x1004ae();
            },
            'Send a welcome message when a new customer says hello',
          ),
          _0x54a420.field(
            'Message',
            _0x54a420.textarea({
              value: _0x10df5b.welcomeMessage,
              rows: 2,
              onInput: (_0x3e07a6) => {
                _0x10df5b.welcomeMessage = _0x3e07a6;
                _0x1004ae();
              },
            }),
          ),
        ],
        {
          card: true,
        },
      ),
    );
    let _0x45c154;
    _0x75725.appendChild(
      _0x54a420.section(
        'Where and when',
        [
          _0x54a420.checkbox(
            _0x10df5b.includeGroups,
            (_0x6eefba) => {
              _0x10df5b.includeGroups = _0x6eefba;
              _0x1004ae();
            },
            'Also reply in groups',
          ),
          _0x54a420.field(
            'Operating hours',
            h(
              'div',
              {
                class: 'wc-stack',
              },
              _0x54a420.checkbox(
                _0x10df5b.hours.fullDay,
                (_0x90fb7b) => {
                  _0x10df5b.hours.fullDay = _0x90fb7b;
                  _0x1004ae();
                  _0x583536();
                },
                'Reply 24 hours a day',
              ),
              h('div', {
                class: 'wc-stack',
                ref: (_0x448409) => {
                  _0x45c154 = _0x448409;
                },
              }),
            ),
          ),
          _0x54a420.field(
            'Days',
            daysEditor(_0x10df5b.hours.days, (_0x3254a4) => {
              _0x10df5b.hours.days = _0x3254a4;
              _0x1004ae();
            }),
          ),
          _0x54a420.field(
            'Do not reply to chats with these labels (WhatsApp Business)',
            _0x5d9c13,
          ),
        ],
        {
          card: true,
        },
      ),
    );
    function _0x583536() {
      clear(_0x45c154);
      if (!_0x10df5b.hours.fullDay) {
        _0x45c154.appendChild(
          _0x54a420.row(
            _0x54a420.field(
              'From',
              h('input', {
                class: 'wc-input',
                type: 'time',
                value: _0x10df5b.hours.from,
                onInput: (_0x494ec7) => {
                  _0x10df5b.hours.from = _0x494ec7.target.value;
                  _0x1004ae();
                },
              }),
            ),
            _0x54a420.field(
              'Until',
              h('input', {
                class: 'wc-input',
                type: 'time',
                value: _0x10df5b.hours.until,
                onInput: (_0x3628ca) => {
                  _0x10df5b.hours.until = _0x3628ca.target.value;
                  _0x1004ae();
                },
              }),
            ),
          ),
        );
      }
    }
    _0x583536();
    _0x75725.appendChild(
      _0x54a420.section(
        'Timing',
        [
          _0x54a420.row(
            _0x54a420.field(
              'Wait before replying: minimum seconds',
              _0x54a420.input({
                type: 'number',
                min: 0,
                value: _0x10df5b.delayMin,
                onInput: (_0xd0fd90) => {
                  _0x10df5b.delayMin = Number(_0xd0fd90) || 0;
                  if (_0x10df5b.delayMax < _0x10df5b.delayMin) {
                    _0x10df5b.delayMax = _0x10df5b.delayMin;
                  }
                  _0x1004ae();
                },
              }),
            ),
            _0x54a420.field(
              'Maximum seconds',
              _0x54a420.input({
                type: 'number',
                min: 0,
                value: _0x10df5b.delayMax,
                onInput: (_0x56198a) => {
                  _0x10df5b.delayMax = Number(_0x56198a) || 0;
                  _0x1004ae();
                },
              }),
            ),
          ),
          h(
            'span',
            {
              class: 'wc-muted',
            },
            'If the customer keeps typing during this time, the assistant answers once, after their last message.',
          ),
          _0x54a420.checkbox(
            _0x10df5b.dontSendIfChatOpen,
            (_0x3be98d) => {
              _0x10df5b.dontSendIfChatOpen = _0x3be98d;
              _0x1004ae();
            },
            'Do not reply if the conversation is open on screen',
          ),
          _0x54a420.row(
            _0x54a420.field(
              'Pause after a person replies (minutes)',
              _0x54a420.input({
                type: 'number',
                min: 0,
                value: _0x10df5b.humanPauseMinutes,
                onInput: (_0x56e231) => {
                  _0x10df5b.humanPauseMinutes = Number(_0x56e231) || 0;
                  _0x1004ae();
                },
              }),
              {
                hint: 'When you type in a chat yourself, the assistant stays quiet there.',
              },
            ),
            _0x54a420.field(
              'Messages of history it reads',
              _0x54a420.input({
                type: 'number',
                min: 2,
                max: 30,
                value: _0x10df5b.historyDepth,
                onInput: (_0x3a27ef) => {
                  _0x10df5b.historyDepth = Math.min(
                    30,
                    Math.max(2, Number(_0x3a27ef) || 10),
                  );
                  _0x1004ae();
                },
              }),
            ),
          ),
        ],
        {
          card: true,
        },
      ),
    );
    _0x75725.appendChild(
      _0x54a420.section(
        'Hand over to a person',
        [
          _0x54a420.field(
            'When the customer says any of these words',
            _0x54a420.tagInput({
              value: _0x10df5b.handoff.keywords,
              placeholder: 'e.g. human',
              onChange: (_0x470310) => {
                _0x10df5b.handoff.keywords = _0x470310;
                _0x1004ae();
              },
            }),
            {
              hint: 'The assistant also hands over by itself when it cannot help.',
            },
          ),
          _0x54a420.field(
            'Message to the customer',
            _0x54a420.input({
              value: _0x10df5b.handoff.customerMessage,
              onInput: (_0x3f24f4) => {
                _0x10df5b.handoff.customerMessage = _0x3f24f4;
                _0x1004ae();
              },
            }),
          ),
          _0x54a420.field(
            'Tell a teammate on WhatsApp (optional)',
            _0x54a420.input({
              value: _0x10df5b.handoff.phone,
              placeholder: '+1 555 010 0999',
              onInput: (_0x4d79cb) => {
                _0x10df5b.handoff.phone = _0x4d79cb;
                _0x1004ae();
              },
            }),
          ),
          _0x54a420.field(
            'Message to the teammate',
            _0x54a420.input({
              value: _0x10df5b.handoff.notifyMessage,
              onInput: (_0x58336d) => {
                _0x10df5b.handoff.notifyMessage = _0x58336d;
                _0x1004ae();
              },
            }),
            {
              hint: "Use {{mob_no}} for the customer's number.",
            },
          ),
          _0x54a420.field(
            'Reply when the AI does not understand',
            _0x54a420.input({
              value: _0x10df5b.fallbackReply,
              onInput: (_0x20c719) => {
                _0x10df5b.fallbackReply = _0x20c719;
                _0x1004ae();
              },
            }),
          ),
        ],
        {
          card: true,
        },
      ),
    );
    _0x75725.appendChild(
      _0x54a420.section(
        'Writing help in the message box',
        [
          _0x54a420.checkbox(
            _0x5c46d8.strap,
            (_0x3a3059) => {
              _0x5c46d8.strap = _0x3a3059;
              _0x1004ae();
            },
            'Show the AI row above the message box (spelling, translate, tone, summarize)',
          ),
        ],
        {
          card: true,
        },
      ),
    );
    _0x75725.appendChild(
      h(
        'div',
        {
          class: 'wc-savebar',
        },
        _0x54a420.button('Save', {
          variant: 'primary',
          icon: 'save',
          onClick: () => _0x32b9f4(false),
        }),
      ),
    );
    _0x31aeaa.setActions([
      _0x54a420.button('Save', {
        variant: 'primary',
        icon: 'save',
        onClick: () => _0x32b9f4(false),
      }),
    ]);
    return _0x75725;
  },
};
