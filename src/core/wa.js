import { uid, digits, sleep, betterName, looksLikePhone } from './util.js';
import { createBus } from './events.js';
export const LABELS_NEED_BUSINESS =
  'WhatsApp did not accept that label change. Chat labels only exist on WhatsApp Business accounts.';
export function windowTransport(_0x5c81ba = window) {
  const _0x102eaa = new Map();
  const _0x4b2f54 = new Set();
  _0x5c81ba.addEventListener('message', (_0xa60bfa) => {
    if (_0xa60bfa.source !== _0x5c81ba) {
      return;
    }
    const _0x10b964 = _0xa60bfa.data;
    if (!_0x10b964 || _0x10b964.source !== 'wacrm-main') {
      return;
    }
    if (_0x10b964.event) {
      for (const _0x39f015 of _0x4b2f54) {
        _0x39f015(_0x10b964.event, _0x10b964.data);
      }
      return;
    }
    const _0x1bc00d = _0x102eaa.get(_0x10b964.id);
    if (!_0x1bc00d) {
      return;
    }
    _0x102eaa.delete(_0x10b964.id);
    clearTimeout(_0x1bc00d.timer);
    if (_0x10b964.ok) {
      _0x1bc00d.resolve(_0x10b964.result);
    } else {
      _0x1bc00d.reject(new Error(_0x10b964.error || 'WhatsApp bridge error'));
    }
  });
  return {
    request(_0x33c77b, _0x4f51c4, _0x199db4 = 30000) {
      return new Promise((_0x583035, _0x3cc306) => {
        const _0x2479ba = uid('r');
        const _0x4c4ac4 = setTimeout(() => {
          _0x102eaa.delete(_0x2479ba);
          _0x3cc306(
            new Error('WhatsApp did not answer in time (' + _0x33c77b + ')'),
          );
        }, _0x199db4);
        _0x102eaa.set(_0x2479ba, {
          resolve: _0x583035,
          reject: _0x3cc306,
          timer: _0x4c4ac4,
        });
        _0x5c81ba.postMessage(
          {
            source: 'wacrm-iso',
            id: _0x2479ba,
            method: _0x33c77b,
            args: _0x4f51c4,
          },
          _0x5c81ba.location.origin,
        );
      });
    },
    onEvent(_0x1a8c39) {
      _0x4b2f54.add(_0x1a8c39);
      return () => _0x4b2f54.delete(_0x1a8c39);
    },
  };
}
export function createWa(_0x5aa6ac) {
  const _0x8f0f95 = createBus();
  const _0x382445 = {
    ready: false,
    status: null,
    activeChat: null,
  };
  const _0x407547 = new Map();
  const _0x308ce3 = new Map();
  function _0x4db2d4(_0x1c28b1) {
    if (!_0x1c28b1 || !_0x1c28b1.id) {
      return _0x1c28b1;
    }
    const _0x24c2df = _0x407547.get(_0x1c28b1.id);
    const _0x91afe2 = _0x24c2df ? _0x24c2df.name : '';
    const _0x22f93c = Object.assign(_0x24c2df || {}, _0x1c28b1);
    if (_0x24c2df) {
      _0x22f93c.name = betterName(_0x1c28b1.name, _0x91afe2);
    }
    _0x407547.set(_0x1c28b1.id, _0x22f93c);
    if (_0x1c28b1.phone) {
      _0x308ce3.set(_0x1c28b1.phone, _0x1c28b1.id);
    }
    return _0x407547.get(_0x1c28b1.id);
  }
  _0x5aa6ac.onEvent((_0x4620bb, _0x1f4261) => {
    switch (_0x4620bb) {
      case 'ready':
        _0x382445.ready = !!_0x1f4261 && !!_0x1f4261.ready;
        _0x382445.status = _0x1f4261 && _0x1f4261.status;
        _0x8f0f95.emit('ready', _0x382445.ready, _0x382445.status);
        break;
      case 'chat.new_message':
        if (
          _0x1f4261 &&
          !_0x1f4261.fromMe &&
          !_0x1f4261.isGroup &&
          _0x1f4261.name &&
          !looksLikePhone(_0x1f4261.name)
        ) {
          const _0x880ba4 = _0x407547.get(_0x1f4261.chatId);
          if (_0x880ba4 && looksLikePhone(_0x880ba4.name)) {
            _0x880ba4.name = _0x1f4261.name;
          }
        }
        _0x8f0f95.emit('message', _0x1f4261);
        break;
      case 'chat.msg_revoke':
        _0x8f0f95.emit('revoke', _0x1f4261);
        break;
      case 'chat.active_chat':
        _0x382445.activeChat = _0x1f4261 ? _0x4db2d4(_0x1f4261) : null;
        _0x8f0f95.emit('active_chat', _0x382445.activeChat);
        break;
      case 'chat.new_chat':
        if (_0x1f4261) {
          _0x8f0f95.emit('chat', _0x4db2d4(_0x1f4261));
        }
        break;
      case 'chat.unread_count_changed':
        if (_0x1f4261) {
          _0x8f0f95.emit('unread', _0x4db2d4(_0x1f4261));
        }
        break;
      case 'chat.update_label':
        _0x8f0f95.emit('labels');
        break;
      case 'conn.logout':
        _0x382445.ready = false;
        _0x8f0f95.emit('logout');
        break;
      default:
        break;
    }
  });
  const _0x5d079c = (_0x6a2e8, ..._0x31bf92) =>
    _0x5aa6ac.request(_0x6a2e8, _0x31bf92);
  const _0x20eec4 = (_0x52a575, ..._0x2e308a) =>
    _0x5aa6ac.request(_0x52a575, _0x2e308a, 180000);
  const _0x6f65f = {
    bus: _0x8f0f95,
    state: _0x382445,
    on: (_0x505625, _0x6f8a51) => _0x8f0f95.on(_0x505625, _0x6f8a51),
    call: _0x5d079c,
    isReady: () => _0x382445.ready,
    async whenReady(_0x561c06 = 60000) {
      if (_0x382445.ready) {
        return true;
      }
      return new Promise((_0x199fbe) => {
        const _0x637436 = setTimeout(() => {
          _0x14c55a();
          _0x199fbe(false);
        }, _0x561c06);
        const _0x14c55a = _0x8f0f95.on('ready', (_0x2df155) => {
          if (_0x2df155) {
            clearTimeout(_0x637436);
            _0x14c55a();
            _0x199fbe(true);
          }
        });
      });
    },
    startWatching(_0x3e3969 = 3000) {
      if (_0x6f65f._watch) {
        return;
      }
      const _0x3d8123 = async () => {
        try {
          const _0x9697d1 = await _0x5aa6ac.request('status', [], 5000);
          const _0xbbc6bd = !!_0x9697d1 && !!_0x9697d1.fullReady;
          _0x382445.status = _0x9697d1;
          if (_0xbbc6bd !== _0x382445.ready) {
            _0x382445.ready = _0xbbc6bd;
            _0x8f0f95.emit('ready', _0xbbc6bd, _0x9697d1);
          }
        } catch (_0x1a01b6) {}
      };
      _0x6f65f._watch = setInterval(_0x3d8123, _0x3e3969);
      _0x3d8123();
    },
    stopWatching() {
      if (_0x6f65f._watch) {
        clearInterval(_0x6f65f._watch);
        _0x6f65f._watch = null;
      }
    },
    async status() {
      try {
        const _0x4d6d8f = await _0x5d079c('status');
        _0x382445.status = _0x4d6d8f;
        return _0x4d6d8f;
      } catch (_0xc41cd5) {
        return {
          injected: false,
          error: _0xc41cd5.message,
        };
      }
    },
    async listChats(_0x57eee8) {
      const _0x2ba2fc = await _0x5d079c('chat.list', _0x57eee8);
      _0x2ba2fc.forEach(_0x4db2d4);
      return _0x2ba2fc;
    },
    async getChat(_0xc3b176) {
      const _0x400ad7 = await _0x5d079c('chat.get', _0xc3b176);
      if (_0x400ad7) {
        return _0x4db2d4(_0x400ad7);
      } else {
        return null;
      }
    },
    chatById(_0x37583f) {
      return _0x407547.get(_0x37583f) || null;
    },
    chatName(_0x32a7b0) {
      const _0x450c58 = _0x407547.get(_0x32a7b0);
      if (_0x450c58) {
        return _0x450c58.name;
      } else {
        return String(_0x32a7b0 || '').split('@')[0];
      }
    },
    async activeChat() {
      const _0x2fa865 = await _0x5d079c('chat.active');
      _0x382445.activeChat = _0x2fa865 ? _0x4db2d4(_0x2fa865) : null;
      return _0x382445.activeChat;
    },
    openChat: (_0xd45c00) => _0x5d079c('chat.open', _0xd45c00),
    setFilter: (_0xf83305, _0x26b350) =>
      _0x5d079c('chat.setFilter', _0xf83305, _0x26b350),
    markRead: (_0x58f254) => _0x5d079c('chat.markRead', _0x58f254),
    setTyping: (_0x3d0606, _0x425781, _0x554576) =>
      _0x5d079c('chat.typing', _0x3d0606, _0x425781, _0x554576),
    archive: (_0x2eef96, _0x45f554 = true) =>
      _0x5d079c('chat.archive', _0x2eef96, _0x45f554),
    async messages(_0x54cb9f, _0x2e1463) {
      return _0x5d079c(
        'chat.messages',
        _0x54cb9f,
        _0x2e1463 || {
          count: 30,
        },
      );
    },
    setInput: (_0x1474e1, _0x486f9d) =>
      _0x5d079c('chat.setInput', _0x1474e1, _0x486f9d),
    setSignature: (_0x5810ee) => _0x5d079c('sign.set', _0x5810ee),
    signatureStatus: () => _0x5d079c('sign.status'),
    sendText: (_0xdb55df, _0x7b9469, _0x30b3df) =>
      _0x5d079c('send.text', _0xdb55df, _0x7b9469, _0x30b3df),
    sendFile: (_0x1a9969, _0x37f460, _0x9db7d8) =>
      _0x20eec4('send.file', _0x1a9969, _0x37f460, _0x9db7d8),
    sendPoll: (_0x1d39df, _0x40fc12, _0x241aaf, _0x5c6477) =>
      _0x5d079c('send.poll', _0x1d39df, _0x40fc12, _0x241aaf, _0x5c6477),
    sendVCard: (_0x34e0cf, _0x121bde, _0x333231) =>
      _0x5d079c('send.vcard', _0x34e0cf, _0x121bde, _0x333231),
    sendList: (_0x37f582, _0xe2e5aa, _0x3144aa) =>
      _0x5d079c('send.list', _0x37f582, _0xe2e5aa, _0x3144aa),
    statusText: (_0x516dc8, _0xac0746) =>
      _0x5d079c('status.text', _0x516dc8, _0xac0746),
    statusImage: (_0x320c6f, _0x45b1a3) =>
      _0x20eec4('status.image', _0x320c6f, _0x45b1a3),
    statusVideo: (_0x384d6f, _0xd3e5d6) =>
      _0x20eec4('status.video', _0x384d6f, _0xd3e5d6),
    exists: (_0x32fe8c) => _0x5d079c('contact.exists', digits(_0x32fe8c)),
    contacts: () => _0x20eec4('contact.list'),
    block: (_0x473ff9) => _0x5d079c('block', _0x473ff9),
    unblock: (_0x3bd274) => _0x5d079c('unblock', _0x3bd274),
    async groups() {
      const _0x11a38c = await _0x20eec4('group.list');
      _0x11a38c.forEach(_0x4db2d4);
      return _0x11a38c;
    },
    participants: (_0x6a7c48) => _0x20eec4('group.participants', _0x6a7c48),
    groupAdd: (_0x257043, _0x4b15e3) =>
      _0x5d079c('group.add', _0x257043, [].concat(_0x4b15e3)),
    groupRemove: (_0x5601d1, _0x370d78) =>
      _0x5d079c('group.remove', _0x5601d1, [].concat(_0x370d78)),
    createGroup: (_0x1fe046, _0x45c3f9) =>
      _0x20eec4('group.create', _0x1fe046, [].concat(_0x45c3f9)),
    iAmAdmin: (_0x316356) => _0x5d079c('group.iAmAdmin', _0x316356),
    labels: () => _0x5d079c('labels.list'),
    async setLabel(_0x493702, _0x331de4, _0x48fa77) {
      try {
        return await _0x5d079c(
          'labels.set',
          [].concat(_0x493702),
          _0x331de4,
          _0x48fa77,
        );
      } catch (_0x24be67) {
        if (/not a business/i.test((_0x24be67 && _0x24be67.message) || '')) {
          throw new Error(LABELS_NEED_BUSINESS);
        }
        throw _0x24be67;
      }
    },
    downloadMedia: (_0x5d7829) => _0x20eec4('media.download', _0x5d7829),
    async resolveTarget(_0x66b213) {
      const _0x2a630c = String(_0x66b213 || '').trim();
      if (/@(c\.us|g\.us|lid)$/.test(_0x2a630c)) {
        return _0x2a630c;
      }
      const _0xc9597a = digits(_0x2a630c);
      if (!_0xc9597a) {
        return null;
      }
      if (_0x308ce3.has(_0xc9597a)) {
        return _0x308ce3.get(_0xc9597a);
      }
      try {
        const _0x5ab133 = await _0x6f65f.exists(_0xc9597a);
        if (_0x5ab133 && _0x5ab133.id) {
          _0x308ce3.set(_0xc9597a, _0x5ab133.id);
          return _0x5ab133.id;
        }
        return null;
      } catch (_0xa4b08f) {
        return _0xc9597a + '@c.us';
      }
    },
    async chatsForPicker(_0x480a8d = false) {
      if (
        !_0x480a8d &&
        _0x6f65f._pickerCache &&
        Date.now() - _0x6f65f._pickerCache.at < 60000
      ) {
        return _0x6f65f._pickerCache.list;
      }
      const _0x69cb8e = await _0x6f65f.listChats({});
      _0x6f65f._pickerCache = {
        at: Date.now(),
        list: _0x69cb8e,
      };
      return _0x69cb8e;
    },
    sleep: sleep,
  };
  return _0x6f65f;
}
