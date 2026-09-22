import { sleep, rand, uid } from './util.js';
import { renderTemplate } from './variables.js';
import { matchAny, isGreeting } from './matcher.js';
import { newMessage } from './messages.js';
import { HANDOFF_TOKEN } from './ai.js';
export const DEFAULT_ASSISTANT = {
  enabled: false,
  name: 'Assistant',
  business: '',
  instructions: '',
  useWelcome: true,
  welcomeMessage: 'Hello! How can I help you today?',
  includeGroups: false,
  hours: {
    fullDay: true,
    days: [0, 1, 2, 3, 4, 5, 6],
    from: '09:00',
    until: '18:00',
  },
  delayMin: 3,
  delayMax: 8,
  dontSendIfChatOpen: false,
  historyDepth: 10,
  humanPauseMinutes: 60,
  fallbackReply:
    "I'm sorry, I didn't understand that. Could you please rephrase?",
  handoff: {
    keywords: ['human', 'agent', 'real person', 'talk to someone'],
    phone: '',
    notifyMessage: 'Customer {{mob_no}} needs to speak with a human agent.',
    customerMessage: 'Please wait, connecting you to a human agent shortly.',
  },
  labelBlockIds: [],
};
function mergeDeep(_0x43befa, _0x34bf39) {
  const _0x2572c5 = Array.isArray(_0x43befa)
    ? _0x43befa.slice()
    : Object.assign({}, _0x43befa);
  if (!_0x34bf39 || typeof _0x34bf39 !== 'object') {
    return _0x2572c5;
  }
  for (const _0x474d03 of Object.keys(_0x34bf39)) {
    const _0x5cadf8 = _0x34bf39[_0x474d03];
    _0x2572c5[_0x474d03] =
      _0x5cadf8 &&
      typeof _0x5cadf8 === 'object' &&
      !Array.isArray(_0x5cadf8) &&
      _0x43befa &&
      typeof _0x43befa[_0x474d03] === 'object' &&
      !Array.isArray(_0x43befa[_0x474d03])
        ? mergeDeep(_0x43befa[_0x474d03], _0x5cadf8)
        : _0x5cadf8;
  }
  return _0x2572c5;
}
function minutes(_0x2a574c) {
  const [_0x12171d, _0xb67235] = String(_0x2a574c || '0:0')
    .split(':')
    .map((_0x2d598d) => parseInt(_0x2d598d, 10) || 0);
  return _0x12171d * 60 + _0xb67235;
}
export function withinHours(_0x3ddc71, _0x997f84) {
  const _0x173a18 = new Date(_0x997f84);
  const _0x323891 = _0x3ddc71.hours || {};
  if (
    _0x323891.days &&
    _0x323891.days.length &&
    !_0x323891.days.includes(_0x173a18.getDay())
  ) {
    return false;
  }
  if (_0x323891.fullDay) {
    return true;
  }
  const _0x1447e2 = _0x173a18.getHours() * 60 + _0x173a18.getMinutes();
  const _0x212317 = minutes(_0x323891.from);
  const _0x482aa5 = minutes(_0x323891.until);
  if (_0x212317 <= _0x482aa5) {
    return _0x1447e2 >= _0x212317 && _0x1447e2 <= _0x482aa5;
  } else {
    return _0x1447e2 >= _0x212317 || _0x1447e2 <= _0x482aa5;
  }
}
export function buildSystemPrompt(_0x112fa1) {
  return [
    'You are ' +
      (_0x112fa1.name || 'Assistant') +
      ', a helpful assistant replying to customers on WhatsApp for a business.',
    _0x112fa1.business
      ? 'Business information:\n' + _0x112fa1.business.trim()
      : '',
    'Rules:',
    "- Reply in the customer's language, in a short, friendly WhatsApp style. No markdown headings.",
    '- Only rely on the business information above and what the customer said. If you do not know, say so and offer to connect a person.',
    '- If the customer asks for a human, or you cannot help, reply with exactly ' +
      HANDOFF_TOKEN +
      ' and nothing else.',
    _0x112fa1.instructions ? _0x112fa1.instructions.trim() : '',
  ]
    .filter(Boolean)
    .join('\n');
}
export function toTurns(_0x1f7ecf) {
  const _0x370fe1 = [];
  for (const _0x12ff7a of _0x1f7ecf) {
    const _0x189105 = String(_0x12ff7a.body || '').trim();
    if (
      !_0x189105 ||
      !['chat', 'image', 'video', 'document'].includes(_0x12ff7a.type)
    ) {
      continue;
    }
    const _0x5d1c66 = _0x12ff7a.fromMe ? 'assistant' : 'user';
    if (
      _0x370fe1.length &&
      _0x370fe1[_0x370fe1.length - 1].role === _0x5d1c66
    ) {
      _0x370fe1[_0x370fe1.length - 1].content += '\n' + _0x189105;
    } else {
      _0x370fe1.push({
        role: _0x5d1c66,
        content: _0x189105,
      });
    }
  }
  while (_0x370fe1.length && _0x370fe1[0].role !== 'user') {
    _0x370fe1.shift();
  }
  return _0x370fe1;
}
export function createAssistant({
  store: _0x568990,
  wa: _0x3707fd,
  ai: _0x295baa,
  sender: _0x4df2b2,
  crm: _0x5a952a,
  webhooks: _0x42f112,
  activity: _0x4c29af,
  emit: _0x5511e4,
  now = Date.now,
  sleepFn = sleep,
  random = Math.random,
}) {
  const _0x23a76a = new Map();
  const _0xa6f1ac = new Set();
  const _0x1ded4a = {
    at: 0,
  };
  const _0x1e1d2a = (_0x43534e, _0x51a974) => {
    if (_0x5511e4) {
      _0x5511e4(_0x43534e, _0x51a974);
    }
  };
  const _0x10a92e = {
    config() {
      return mergeDeep(DEFAULT_ASSISTANT, _0x568990.setting('assistant', {}));
    },
    async saveConfig(_0x24ab3a) {
      return _0x568990.setSetting(
        'assistant',
        mergeDeep(_0x10a92e.config(), _0x24ab3a),
      );
    },
    skipReason(_0x4b0b6c, _0x334f4d = {}) {
      const _0x15aa60 = _0x10a92e.config();
      if (!_0x15aa60.enabled) {
        return 'off';
      }
      const _0x5ba6f9 = _0x5a952a.contact(_0x4b0b6c.chatId);
      if (_0x5ba6f9.aiOff || _0x5ba6f9.botPaused) {
        return 'paused for this chat';
      }
      if (
        _0x5ba6f9.humanAt &&
        now() - _0x5ba6f9.humanAt < _0x15aa60.humanPauseMinutes * 60000
      ) {
        return 'a person replied recently';
      }
      if (_0x4b0b6c.isGroup && !_0x15aa60.includeGroups) {
        return 'groups are off';
      }
      if (!withinHours(_0x15aa60, now())) {
        return 'outside operating hours';
      }
      if (
        _0x15aa60.dontSendIfChatOpen &&
        _0x334f4d.activeChatId === _0x4b0b6c.chatId
      ) {
        return 'chat is open';
      }
      const _0x578283 = _0x3707fd.chatById(_0x4b0b6c.chatId);
      if (
        _0x578283 &&
        (_0x578283.labels || []).some((_0x2d4c40) =>
          (_0x15aa60.labelBlockIds || []).includes(_0x2d4c40),
        )
      ) {
        return 'chat has a blocked label';
      }
      return null;
    },
    async handoff(_0x7e9b64, _0x54bad0, _0x15e17c = 'assistant') {
      await _0x5a952a.saveContact(_0x7e9b64, {
        aiOff: true,
        humanRequestedAt: now(),
      });
      await _0x4df2b2.send(
        _0x7e9b64,
        Object.assign(newMessage('none'), {
          text: _0x54bad0.handoff.customerMessage,
        }),
        {
          automated: true,
        },
      );
      if (String(_0x54bad0.handoff.phone || '').trim()) {
        try {
          const _0x374981 = await _0x3707fd.resolveTarget(
            _0x54bad0.handoff.phone,
          );
          if (_0x374981) {
            await _0x4df2b2.send(
              _0x374981,
              Object.assign(newMessage('none'), {
                text: renderTemplate(
                  _0x54bad0.handoff.notifyMessage,
                  _0x5a952a.vars(_0x7e9b64),
                ),
              }),
              {
                automated: true,
                typing: false,
              },
            );
          }
        } catch (_0x265cae) {}
      }
      if (_0x4c29af) {
        await _0x4c29af.log('handoff', {
          chatId: _0x7e9b64,
          text: 'Handed ' + _0x5a952a.displayName(_0x7e9b64) + ' to a person',
        });
      }
      if (_0x42f112) {
        _0x42f112.emit('handoff', {
          chatId: _0x7e9b64,
          name: _0x5a952a.displayName(_0x7e9b64),
          source: _0x15e17c,
        });
      }
      _0x1e1d2a('handoff', {
        chatId: _0x7e9b64,
        source: _0x15e17c,
      });
    },
    async respond(_0x31b621) {
      const _0x4a6acf = _0x10a92e.config();
      let _0x3fe2db;
      try {
        const _0x4b1cfc = await _0x3707fd.messages(_0x31b621, {
          count: _0x4a6acf.historyDepth,
        });
        _0x3fe2db = toTurns(_0x4b1cfc);
      } catch (_0x1800d4) {
        _0x3fe2db = [];
      }
      if (!_0x3fe2db.length) {
        return;
      }
      let _0x48432b;
      try {
        _0x48432b = await _0x295baa.complete({
          system: buildSystemPrompt(_0x4a6acf),
          messages: _0x3fe2db,
          maxTokens: 350,
          temperature: 0.4,
        });
      } catch (_0xd56f6c) {
        if (now() - _0x1ded4a.at > 600000 && _0x4c29af) {
          _0x1ded4a.at = now();
          await _0x4c29af.log('assistant_error', {
            chatId: _0x31b621,
            text: (_0xd56f6c && _0xd56f6c.message) || String(_0xd56f6c),
          });
        }
        _0x1e1d2a('assistant:error', _0xd56f6c);
        return;
      }
      if (_0x48432b.includes(HANDOFF_TOKEN)) {
        await _0x10a92e.handoff(_0x31b621, _0x4a6acf);
        return;
      }
      if (!_0x48432b) {
        _0x48432b = _0x4a6acf.fallbackReply;
      }
      const _0x3bb82d = _0x4a6acf.name
        ? '*' + _0x4a6acf.name + ':* ' + _0x48432b
        : _0x48432b;
      await _0x4df2b2.send(
        _0x31b621,
        Object.assign(newMessage('none'), {
          text: _0x3bb82d,
        }),
        {
          automated: true,
          typing: true,
          signature: false,
        },
      );
      if (_0x4c29af) {
        await _0x4c29af.log('assistant_reply', {
          chatId: _0x31b621,
          text: _0x48432b.slice(0, 120),
        });
      }
    },
    async handle(_0x3c928d, _0x566c87 = {}) {
      const _0x3aae6e = _0x10a92e.skipReason(_0x3c928d, _0x566c87);
      if (_0x3aae6e) {
        return false;
      }
      const _0x1579b6 = _0x10a92e.config();
      const _0x5afcea = String(_0x3c928d.body || '').trim();
      if (!_0x5afcea) {
        return false;
      }
      const _0x46e0a1 = _0x3c928d.chatId;
      if (matchAny(_0x5afcea, _0x1579b6.handoff.keywords, 'contains', false)) {
        const _0x89874f = _0x10a92e.handoff(_0x46e0a1, _0x1579b6, 'keyword');
        _0xa6f1ac.add(_0x89874f);
        _0x89874f.finally(() => _0xa6f1ac.delete(_0x89874f));
        return true;
      }
      const _0x4d2c1e = _0x568990.get('chatMemory', _0x46e0a1) || {
        id: _0x46e0a1,
        optOut: false,
        runs: {},
      };
      if (_0x1579b6.useWelcome && !_0x4d2c1e.welcomed) {
        await _0x568990.put(
          'chatMemory',
          Object.assign({}, _0x4d2c1e, {
            welcomed: true,
          }),
        );
        if (isGreeting(_0x5afcea)) {
          const _0x333bd4 = (async () => {
            await sleepFn(
              rand(
                _0x1579b6.delayMin,
                Math.max(_0x1579b6.delayMin, _0x1579b6.delayMax),
              ) * 1000,
            );
            await _0x4df2b2.send(
              _0x46e0a1,
              Object.assign(newMessage('none'), {
                text: _0x1579b6.welcomeMessage,
              }),
              {
                automated: true,
                typing: true,
              },
            );
          })();
          _0xa6f1ac.add(_0x333bd4);
          _0x333bd4.finally(() => _0xa6f1ac.delete(_0x333bd4));
          return true;
        }
      }
      const _0x1da8ff = _0x23a76a.get(_0x46e0a1) || {
        token: 0,
      };
      _0x1da8ff.token++;
      _0x23a76a.set(_0x46e0a1, _0x1da8ff);
      const _0x151924 = _0x1da8ff.token;
      const _0x4fc1c8 = (async () => {
        await sleepFn(
          rand(
            _0x1579b6.delayMin,
            Math.max(_0x1579b6.delayMin, _0x1579b6.delayMax),
          ) * 1000,
        );
        const _0x1ca88b = _0x23a76a.get(_0x46e0a1);
        if (!_0x1ca88b || _0x1ca88b.token !== _0x151924) {
          return;
        }
        _0x23a76a.delete(_0x46e0a1);
        if (_0x10a92e.skipReason(_0x3c928d, _0x566c87)) {
          return;
        }
        await _0x10a92e.respond(_0x46e0a1);
      })();
      _0xa6f1ac.add(_0x4fc1c8);
      _0x4fc1c8.finally(() => _0xa6f1ac.delete(_0x4fc1c8));
      return true;
    },
    async idle() {
      while (_0xa6f1ac.size) {
        await Promise.all(Array.from(_0xa6f1ac));
      }
    },
    cancelPending(_0xe4dab5) {
      _0x23a76a.delete(_0xe4dab5);
    },
    async noteHumanReply(_0x1c22aa) {
      _0x23a76a.delete(_0x1c22aa);
      await _0x5a952a.saveContact(_0x1c22aa, {
        humanAt: now(),
      });
    },
    async setChatEnabled(_0x4ff22a, _0x4caf83) {
      await _0x5a952a.saveContact(_0x4ff22a, {
        aiOff: !_0x4caf83,
        humanAt: 0,
      });
    },
    newId: uid,
  };
  return _0x10a92e;
}
