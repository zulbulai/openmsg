import { sleep, rand } from './util.js';
import { workflowMatches, replyMessages } from './workflows.js';
const IGNORED_CHATS = /^(status@broadcast|.*@newsletter|.*@broadcast)$/;
const TEXTY_TYPES = new Set([
  'chat',
  'image',
  'video',
  'document',
  'audio',
  'ptt',
  'list_response',
  'buttons_response',
  'template_button_reply',
]);
export function createAutomation({
  store: _0x18b4f3,
  wa: _0x43a105,
  sender: _0xd5c4a2,
  crm: _0x2c90cc,
  actions: _0x39def5,
  webhooks: _0x143b42,
  activity: _0x530d74,
  chatbots: _0x2f5afb,
  assistant: _0x4ed3de,
  emit: _0x2e01d2,
  licensed: _0x20396b,
  now = Date.now,
  sleepFn = sleep,
  random = Math.random,
}) {
  const _0x59dcfd = now();
  const _0x48a9d9 = new Set();
  const _0x5516b0 = [];
  let _0x4cc114 = null;
  const _0x2e776b = (_0x5ebc22, _0x30a4fe) => {
    if (_0x2e01d2) {
      _0x2e01d2(_0x5ebc22, _0x30a4fe);
    }
  };
  function _0x362eaa(_0x3df0d7) {
    _0x48a9d9.add(_0x3df0d7);
    _0x5516b0.push(_0x3df0d7);
    if (_0x5516b0.length > 2000) {
      _0x48a9d9.delete(_0x5516b0.shift());
    }
  }
  function _0x3175ef(_0x474526) {
    if (!_0x474526 || !_0x474526.id || !_0x474526.chatId) {
      return false;
    }
    if (IGNORED_CHATS.test(_0x474526.chatId)) {
      return false;
    }
    if (
      !TEXTY_TYPES.has(_0x474526.type) &&
      !/(response|reply)$/.test(String(_0x474526.type || ''))
    ) {
      return false;
    }
    if (_0x474526.isNew === false) {
      return false;
    }
    if ((_0x474526.t || 0) * 1000 < _0x59dcfd - 90000) {
      return false;
    }
    return true;
  }
  async function _0x3ab2d0(_0x5790b3) {
    if (_0x5790b3.isGroup) {
      return false;
    }
    const _0x443a7c = _0x18b4f3.get('chatMemory', _0x5790b3.chatId);
    if (_0x443a7c && _0x443a7c.seen) {
      return false;
    }
    let _0x3334e3 = 2;
    try {
      _0x3334e3 = (
        await _0x43a105.messages(_0x5790b3.chatId, {
          count: 3,
        })
      ).length;
    } catch (_0x46634a) {}
    await _0x18b4f3.put(
      'chatMemory',
      Object.assign(
        {
          id: _0x5790b3.chatId,
          optOut: false,
          runs: {},
        },
        _0x443a7c || {},
        {
          seen: true,
          firstSeen: now(),
        },
      ),
    );
    return _0x3334e3 <= 1;
  }
  async function _0x39e97b(_0x51c4a7, _0x183d62) {
    const _0x1dc8fc = _0x18b4f3.get(
      'counters',
      'wf:' + _0x51c4a7.id + ':' + _0x183d62,
    );
    if (_0x1dc8fc) {
      return _0x1dc8fc.n;
    } else {
      return 0;
    }
  }
  async function _0x30a399(_0x3b6c50, _0x28d7f4) {
    const _0x396683 = 'wf:' + _0x3b6c50.id + ':' + _0x28d7f4;
    const _0x5230c7 = _0x18b4f3.get('counters', _0x396683);
    await _0x18b4f3.put('counters', {
      id: _0x396683,
      n: (_0x5230c7 ? _0x5230c7.n : 0) + 1,
    });
  }
  async function _0x177cd9(_0xcbf425, _0x3050d7) {
    const _0x3cbb89 = _0xcbf425.options || {};
    let _0x5384de = _0x3050d7.chatId;
    if (_0x3050d7.isGroup && _0x3cbb89.replyPrivately) {
      _0x5384de = _0x3050d7.author || _0x3050d7.sender;
      if (!_0x5384de) {
        return false;
      }
    }
    const _0x3c57b0 = replyMessages(_0xcbf425, _0x18b4f3);
    if (_0x3c57b0.length) {
      const _0x4fac0d = Number(_0x3cbb89.delayMin) || 0;
      const _0x33c011 = Number(_0x3cbb89.delayMax) || 0;
      if (_0x33c011 > 0) {
        await sleepFn(rand(_0x4fac0d, Math.max(_0x4fac0d, _0x33c011)) * 1000);
      }
      const _0x1df5da = await _0xd5c4a2.send(_0x5384de, _0x3c57b0, {
        automated: true,
        typing: _0x3cbb89.showTyping !== false,
        markRead: !!_0x3cbb89.markRead,
        mentionAll:
          !!_0x3cbb89.mentionAll &&
          _0x3050d7.isGroup &&
          !_0x3cbb89.replyPrivately,
        delay:
          _0x33c011 > 0
            ? {
                min: _0x4fac0d,
                max: _0x33c011,
              }
            : undefined,
        vars: {
          last_message: _0x3050d7.body,
        },
      });
      if (_0x530d74) {
        await _0x530d74.log('workflow_reply', {
          chatId: _0x5384de,
          text:
            _0xcbf425.name +
            ': ' +
            _0x1df5da.sent +
            ' sent' +
            (_0x1df5da.failed ? ', ' + _0x1df5da.failed + ' failed' : ''),
        });
      }
      if (!_0x1df5da.sent) {
        return false;
      }
    }
    await _0x30a399(_0xcbf425, _0x3050d7.chatId);
    await _0x39def5.run(_0x3050d7.chatId, _0xcbf425.post, {
      source: 'message bot',
      workflow: _0xcbf425.name,
    });
    return true;
  }
  const _0x51c6b6 = {
    async handle(_0x2fbb41) {
      if (_0x2fbb41.fromMe) {
        return _0x51c6b6.handleOutgoing(_0x2fbb41);
      }
      if (!_0x3175ef(_0x2fbb41) || _0x48a9d9.has(_0x2fbb41.id)) {
        return 'ignored';
      }
      _0x362eaa(_0x2fbb41.id);
      if (!_0x43a105.chatById(_0x2fbb41.chatId)) {
        await _0x43a105.getChat(_0x2fbb41.chatId).catch(() => null);
      }
      const _0x11167c = {
        now: now(),
        activeChatId:
          _0x43a105.state && _0x43a105.state.activeChat
            ? _0x43a105.state.activeChat.id
            : null,
        isNewChat: await _0x3ab2d0(_0x2fbb41),
      };
      if (!_0x2fbb41.isGroup) {
        await _0x2c90cc.saveContact(_0x2fbb41.chatId, {
          lastIncomingAt: now(),
          lastIncomingText: String(_0x2fbb41.body || '').slice(0, 200),
        });
      }
      if (_0x11167c.isNewChat) {
        _0x2e776b('chat:new', _0x2fbb41);
        if (_0x143b42) {
          _0x143b42.emit('chat_new', {
            chatId: _0x2fbb41.chatId,
            name: _0x2c90cc.displayName(_0x2fbb41.chatId),
          });
        }
      }
      if (_0x143b42) {
        _0x143b42.emit('message_received', {
          chatId: _0x2fbb41.chatId,
          name: _0x2fbb41.name || _0x2c90cc.displayName(_0x2fbb41.chatId),
          body: _0x2fbb41.body,
          type: _0x2fbb41.type,
          isGroup: _0x2fbb41.isGroup,
          at: _0x2fbb41.t,
        });
      }
      _0x2e776b('message:in', _0x2fbb41);
      if (_0x18b4f3.setting('automationPaused')) {
        return 'paused';
      }
      if (_0x20396b && !_0x20396b()) {
        return 'unlicensed';
      }
      if (!_0x2fbb41.isGroup) {
        if (await _0x2f5afb.handleIncoming(_0x2fbb41)) {
          return 'chatbot-session';
        }
        if (_0x2c90cc.contact(_0x2fbb41.chatId).botPaused) {
          return 'bot-paused';
        }
        const _0x34bc01 = _0x2f5afb.findTrigger(_0x2fbb41, _0x11167c);
        if (_0x34bc01) {
          await _0x2f5afb.start(_0x34bc01, _0x2fbb41.chatId, _0x2fbb41);
          return 'chatbot-start';
        }
      }
      for (const _0x42be8b of _0x18b4f3.all('workflows')) {
        const _0x11419a =
          _0x42be8b.limitPerChat > 0
            ? await _0x39e97b(_0x42be8b, _0x2fbb41.chatId)
            : 0;
        if (
          !workflowMatches(
            _0x42be8b,
            _0x2fbb41,
            Object.assign(
              {
                count: _0x11419a,
              },
              _0x11167c,
            ),
          )
        ) {
          continue;
        }
        if (
          !_0x2fbb41.isGroup &&
          _0x2c90cc.contact(_0x2fbb41.chatId).botPaused
        ) {
          break;
        }
        if (await _0x177cd9(_0x42be8b, _0x2fbb41)) {
          return 'workflow:' + _0x42be8b.id;
        }
      }
      if (_0x4ed3de && (await _0x4ed3de.handle(_0x2fbb41, _0x11167c))) {
        return 'assistant';
      }
      return 'unhandled';
    },
    async handleOutgoing(_0x321bee) {
      if (!_0x321bee.chatId || IGNORED_CHATS.test(_0x321bee.chatId)) {
        return 'ignored';
      }
      if (_0xd5c4a2.isOurs(_0x321bee.chatId)) {
        return 'ours';
      }
      if (!_0x321bee.isNew) {
        return 'ignored';
      }
      if ((_0x321bee.t || 0) * 1000 < _0x59dcfd - 5000) {
        return 'ignored';
      }
      if (_0x4ed3de) {
        await _0x4ed3de.noteHumanReply(_0x321bee.chatId);
      }
      if (!_0x321bee.isGroup) {
        await _0x2c90cc.saveContact(_0x321bee.chatId, {
          lastOutgoingAt: now(),
        });
      }
      return 'human';
    },
    start() {
      if (_0x4cc114) {
        return;
      }
      _0x4cc114 = _0x43a105.on('message', (_0x1ee794) => {
        _0x51c6b6
          .handle(_0x1ee794)
          .catch((_0x17c0f7) => console.error('[WACRM] automation', _0x17c0f7));
      });
    },
    stop() {
      if (_0x4cc114) {
        _0x4cc114();
        _0x4cc114 = null;
      }
    },
  };
  return _0x51c6b6;
}
