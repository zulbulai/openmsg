import { sleep, clamp, digits } from './util.js';
import { renderTemplate } from './variables.js';
import { fileKind, menuText, buttonsMode } from './messages.js';
import { brand } from './brand.js';
export function signHeader(_0x4dfa60) {
  const _0x2dedf5 = [];
  if (_0x4dfa60.identifyAgent && _0x4dfa60.agentName) {
    _0x2dedf5.push('*' + _0x4dfa60.agentName + '*');
  }
  if (_0x4dfa60.signatureEnabled && _0x4dfa60.signatureText) {
    _0x2dedf5.push(_0x4dfa60.signatureText);
  }
  if (_0x2dedf5.length) {
    return _0x2dedf5.join('\n') + '\n';
  } else {
    return '';
  }
}
export function signMessage(_0x55933d, _0x2f04fb, _0x16a665 = {}) {
  if (!_0x55933d || _0x16a665.signature === false) {
    return _0x55933d;
  }
  return signHeader(_0x2f04fb) + _0x55933d;
}
export const typedPrefix = (_0x1b9a20) =>
  _0x1b9a20.signTyped === false ? '' : signHeader(_0x1b9a20);
export const licenseRequired = () =>
  brand() +
  ' needs an active license for the WhatsApp number that is logged in.';
export function createSender({
  wa: _0x483045,
  store: _0x242d4c,
  resolveVars: _0xe91059,
  emit: _0x550348,
  licensed: _0x1668ee,
  sleepFn = sleep,
  now = Date.now,
  random = Math.random,
} = {}) {
  let _0x4327ab = Promise.resolve();
  const _0x24d7e6 = [];
  const _0x487fd7 = new Set();
  const _0x403ff1 = new Map();
  const _0x18e060 = new Map();
  const _0x2e656c = (_0x45219b, _0x20bcaa) =>
    _0x20bcaa > _0x45219b
      ? _0x45219b + random() * (_0x20bcaa - _0x45219b)
      : _0x45219b;
  const _0x3872f2 = () => _0x242d4c.settings() || {};
  const _0x420273 = (_0x598fb0, _0x50fc5d) => {
    if (_0x550348) {
      _0x550348(_0x598fb0, _0x50fc5d);
    }
  };
  const _0x3d6b86 = (_0x3f069c, _0x551bde) =>
    signMessage(_0x3f069c, _0x3872f2(), _0x551bde);
  function _0x1b5d52() {
    const _0x45372b = now() - 3600000;
    while (_0x24d7e6.length && _0x24d7e6[0] < _0x45372b) {
      _0x24d7e6.shift();
    }
  }
  async function _0x2a1901(_0x2ad2b3) {
    const _0x5a4863 = Number(_0x3872f2().maxSendsPerHour) || 0;
    if (!_0x5a4863 || !_0x2ad2b3.automated) {
      return;
    }
    while (true) {
      _0x1b5d52();
      if (_0x24d7e6.length < _0x5a4863) {
        return;
      }
      if (_0x2ad2b3.signal && _0x2ad2b3.signal.aborted) {
        return;
      }
      _0x420273('sender:throttled', {
        cap: _0x5a4863,
        resumeAt: _0x24d7e6[0] + 3600000,
      });
      await sleepFn(
        Math.min(30000, Math.max(1000, _0x24d7e6[0] + 3600000 - now())),
      );
    }
  }
  async function _0xa84b8d(_0x35c5f7, _0x39258a, _0x1234b2) {
    const _0xeb109a =
      _0x1234b2.typing === undefined
        ? _0x3872f2().showTyping !== false
        : _0x1234b2.typing;
    if (!_0xeb109a || !_0x39258a) {
      return;
    }
    const _0x19ded1 = clamp(
      _0x1234b2.typingMs || String(_0x39258a).length * 28,
      500,
      4000,
    );
    try {
      await _0x483045.setTyping(_0x35c5f7, true, _0x19ded1);
    } catch (_0x5a3697) {
      return;
    }
    await sleepFn(_0x19ded1);
    try {
      await _0x483045.setTyping(_0x35c5f7, false);
    } catch (_0x542a8d) {}
  }
  async function _0x5ad8e1(_0x3933c1, _0x268350, _0x1e45ee) {
    if (!_0x1e45ee.mentionAll || !/@g\.us$/.test(_0x3933c1)) {
      return {
        text: _0x268350,
        opts: {},
      };
    }
    try {
      const _0x57afa0 = await _0x483045.participants(_0x3933c1);
      const _0x98eb9e = _0x57afa0.filter((_0x5d9db0) => _0x5d9db0.phone);
      if (!_0x98eb9e.length) {
        return {
          text: _0x268350,
          opts: {},
        };
      }
      return {
        text:
          _0x268350 +
          '\n' +
          _0x98eb9e.map((_0x446bfc) => '@' + _0x446bfc.phone).join(' '),
        opts: {
          mentionedList: _0x98eb9e.map((_0x481878) => _0x481878.id),
        },
      };
    } catch (_0x5b26d3) {
      return {
        text: _0x268350,
        opts: {},
      };
    }
  }
  async function _0x3514c8(
    _0x4c0204,
    _0x1eb481,
    _0x439628,
    _0x2e51b9,
    _0x4d4a3f,
  ) {
    const _0x3497aa = [];
    const _0x976d87 = _0x1eb481.list.sections
      .map((_0x2ec2e2, _0x152afd) => ({
        title: renderTemplate(_0x2ec2e2.title || 'Options', _0x439628),
        rows: _0x2ec2e2.rows
          .filter((_0x5dca4f) => _0x5dca4f.title.trim())
          .map((_0x2f3392, _0x43fe24) => {
            _0x3497aa.push(renderTemplate(_0x2f3392.title, _0x439628));
            return {
              rowId: 's' + _0x152afd + 'r' + _0x43fe24,
              title: renderTemplate(_0x2f3392.title, _0x439628),
              description: renderTemplate(
                _0x2f3392.description || '',
                _0x439628,
              ),
            };
          }),
      }))
      .filter((_0x4f28ad) => _0x4f28ad.rows.length);
    const _0x109f15 =
      _0x4d4a3f || renderTemplate(_0x1eb481.list.description, _0x439628);
    if (!/@g\.us$/.test(_0x4c0204)) {
      try {
        await _0x483045.sendList(_0x4c0204, {
          title: renderTemplate(_0x1eb481.list.title, _0x439628),
          description: _0x109f15,
          buttonText: _0x1eb481.list.buttonText,
          footer: renderTemplate(_0x1eb481.list.footer, _0x439628),
          sections: _0x976d87,
        });
        return;
      } catch (_0x3e6f75) {}
    }
    await _0x483045.sendText(
      _0x4c0204,
      menuText(_0x109f15, _0x3497aa, _0x1eb481.list.footer),
    );
  }
  async function _0x2c25a9(
    _0x3e19af,
    _0x4a995b,
    _0x116571,
    _0x50022d,
    _0x506c0d,
    _0x46fac0,
  ) {
    const _0x2cf4e0 = _0x4a995b.buttons.items.filter((_0x268514) =>
      _0x268514.text.trim(),
    );
    const _0x40efea = renderTemplate(_0x4a995b.buttons.footer, _0x116571);
    const _0x311daa = _0x2cf4e0.filter(
      (_0x16c52a) => _0x16c52a.type === 'reply',
    );
    const _0x2036ab = _0x2cf4e0.filter(
      (_0x15ba96) => _0x15ba96.type !== 'reply',
    );
    const _0x4a525e = (_0xdcfe79) =>
      renderTemplate(_0xdcfe79.text, _0x116571) +
      ': ' +
      renderTemplate(_0xdcfe79.value || '', _0x116571);
    const _0x95177a = (_0x426795) =>
      _0x426795.length
        ? _0x506c0d.text + '\n\n' + _0x426795.map(_0x4a525e).join('\n')
        : _0x506c0d.text;
    const _0x11b300 = buttonsMode(_0x3872f2().buttonsMode);
    const _0x54d8a1 = !/@g\.us$/.test(_0x3e19af);
    await _0xa84b8d(_0x3e19af, _0x506c0d.text, _0x50022d);
    const _0x50956c = [];
    const _0x3fd492 = _0x311daa.length ? _0x311daa : _0x2036ab;
    if (
      _0x54d8a1 &&
      _0x11b300 === 'native' &&
      _0x3fd492.length >= 1 &&
      _0x3fd492.length <= 3
    ) {
      _0x50956c.push(() => {
        const _0x547fdf = _0x3fd492.map((_0x11d49a) => {
          const _0x282550 = renderTemplate(_0x11d49a.text, _0x116571);
          const _0x3ce0ad = renderTemplate(
            _0x11d49a.value || '',
            _0x116571,
          ).trim();
          if (_0x11d49a.type === 'url') {
            return {
              url: /^https?:\/\//i.test(_0x3ce0ad)
                ? _0x3ce0ad
                : 'https://' + _0x3ce0ad,
              text: _0x282550,
            };
          }
          if (_0x11d49a.type === 'call') {
            return {
              phoneNumber: digits(_0x3ce0ad)
                ? '+' + digits(_0x3ce0ad)
                : _0x3ce0ad,
              text: _0x282550,
            };
          }
          if (_0x11d49a.type === 'copy') {
            return {
              code: _0x3ce0ad,
              text: _0x282550,
            };
          }
          return {
            id: 'b' + _0x311daa.indexOf(_0x11d49a),
            text: _0x282550,
          };
        });
        return _0x483045.sendText(
          _0x3e19af,
          _0x95177a(_0x311daa.length ? _0x2036ab : []),
          Object.assign(
            {},
            _0x46fac0,
            {
              buttons: _0x547fdf,
            },
            _0x40efea
              ? {
                  footer: _0x40efea,
                }
              : {},
          ),
        );
      });
    }
    if (
      _0x54d8a1 &&
      _0x11b300 !== 'text' &&
      _0x311daa.length >= 1 &&
      _0x311daa.length <= 10
    ) {
      _0x50956c.push(() =>
        _0x483045.sendList(
          _0x3e19af,
          {
            title: '',
            description: _0x95177a(_0x2036ab),
            buttonText: 'Choose an option',
            footer: _0x40efea,
            sections: [
              {
                title: 'Options',
                rows: _0x311daa.map((_0x22a645, _0x110dcf) => ({
                  rowId: 'b' + _0x110dcf,
                  title: renderTemplate(_0x22a645.text, _0x116571)
                    .slice(0, 24)
                    .trim(),
                  description: '',
                })),
              },
            ],
          },
          _0x46fac0,
        ),
      );
    }
    for (const _0x2eea89 of _0x50956c) {
      try {
        await _0x2eea89();
        return;
      } catch (_0x2b8b1f) {}
    }
    let _0x123ed1 = menuText(
      _0x506c0d.text,
      _0x311daa.map((_0x87c702) => renderTemplate(_0x87c702.text, _0x116571)),
      _0x40efea,
    );
    if (_0x2036ab.length) {
      _0x123ed1 += '\n\n' + _0x2036ab.map(_0x4a525e).join('\n');
    }
    await _0x483045.sendText(_0x3e19af, _0x123ed1, _0x46fac0);
  }
  async function _0x313b17(_0x422bbe, _0x3b3fda, _0x269bf2, _0x1e71e0) {
    const _0x224ed0 = renderTemplate(_0x3b3fda.text, _0x1e71e0);
    const _0x28fb70 = {};
    if (_0x269bf2.quotedMsg) {
      _0x28fb70.quotedMsg = _0x269bf2.quotedMsg;
    }
    const _0x3dcd1b = _0x3d6b86(_0x224ed0, _0x269bf2);
    const _0x3fa740 = await _0x5ad8e1(_0x422bbe, _0x3dcd1b, _0x269bf2);
    Object.assign(_0x28fb70, _0x3fa740.opts);
    switch (_0x3b3fda.kind) {
      case 'none': {
        if (!_0x3fa740.text.trim()) {
          return;
        }
        await _0xa84b8d(_0x422bbe, _0x3fa740.text, _0x269bf2);
        await _0x483045.sendText(_0x422bbe, _0x3fa740.text, _0x28fb70);
        return;
      }
      case 'media':
      case 'document':
      case 'audio': {
        let _0x3bff1b = true;
        for (const _0x32fe65 of _0x3b3fda.files) {
          const _0x590d2c = await _0x242d4c.getBlob(_0x32fe65.blobId);
          if (!_0x590d2c) {
            throw new Error(
              'The file "' + _0x32fe65.name + '" is missing. Attach it again.',
            );
          }
          const _0x1c613a =
            _0x32fe65.kind || fileKind(_0x32fe65.mime || _0x590d2c.mime);
          const _0x475cea = renderTemplate(
            _0x32fe65.caption || (_0x3bff1b ? _0x3b3fda.text : ''),
            _0x1e71e0,
          );
          const _0x4b5e28 = Object.assign(
            {
              type: _0x1c613a,
              filename: _0x32fe65.name,
              mimetype: _0x32fe65.mime || _0x590d2c.mime,
            },
            _0x28fb70,
          );
          if (_0x1c613a !== 'audio') {
            _0x4b5e28.caption = _0x3bff1b
              ? _0x3d6b86(_0x475cea, _0x269bf2)
              : _0x475cea;
          }
          if (_0x32fe65.ptt) {
            _0x4b5e28.isPtt = true;
          }
          await _0x483045.sendFile(_0x422bbe, _0x590d2c.dataUrl, _0x4b5e28);
          if (_0x1c613a === 'audio' && _0x3bff1b && _0x224ed0.trim()) {
            await _0x483045.sendText(
              _0x422bbe,
              _0x3d6b86(_0x224ed0, _0x269bf2),
              _0x28fb70,
            );
          }
          _0x3bff1b = false;
          if (_0x3b3fda.files.length > 1) {
            await sleepFn(_0x2e656c(500, 1200));
          }
        }
        return;
      }
      case 'contact': {
        if (_0x224ed0.trim()) {
          await _0x483045.sendText(_0x422bbe, _0x3fa740.text, _0x28fb70);
        }
        await _0x483045.sendVCard(
          _0x422bbe,
          _0x3b3fda.contacts.map((_0x3af7ca) => ({
            id: digits(_0x3af7ca.phone) + '@c.us',
            name: renderTemplate(
              _0x3af7ca.name || digits(_0x3af7ca.phone),
              _0x1e71e0,
            ),
          })),
          _0x28fb70,
        );
        return;
      }
      case 'poll': {
        if (_0x224ed0.trim()) {
          await _0x483045.sendText(_0x422bbe, _0x3fa740.text, _0x28fb70);
        }
        const _0x2fc226 = _0x3b3fda.poll.options
          .map((_0x58d0c8) => renderTemplate(_0x58d0c8, _0x1e71e0).trim())
          .filter(Boolean);
        await _0x483045.sendPoll(
          _0x422bbe,
          renderTemplate(_0x3b3fda.poll.question, _0x1e71e0),
          _0x2fc226,
          Object.assign(
            {
              multi: !!_0x3b3fda.poll.multi,
            },
            _0x28fb70,
          ),
        );
        return;
      }
      case 'list': {
        await _0x3514c8(
          _0x422bbe,
          _0x3b3fda,
          _0x1e71e0,
          _0x269bf2,
          _0x3fa740.text.trim(),
        );
        return;
      }
      case 'buttons': {
        await _0x2c25a9(
          _0x422bbe,
          _0x3b3fda,
          _0x1e71e0,
          _0x269bf2,
          _0x3fa740,
          _0x28fb70,
        );
        return;
      }
      default:
        return;
    }
  }
  async function _0x4d060a(_0x7219c, _0x46b03c, _0x457805 = {}) {
    const _0x518f7a = {
      ok: true,
      sent: 0,
      failed: 0,
      errors: [],
      aborted: false,
    };
    if (_0x1668ee && !_0x1668ee()) {
      return Object.assign(_0x518f7a, {
        ok: false,
        failed: _0x46b03c.length,
        errors: [
          {
            index: 0,
            error: licenseRequired(),
          },
        ],
      });
    }
    const _0x1ad309 = _0x3872f2();
    if (_0x457805.automated && _0x1ad309.automationPaused) {
      return Object.assign(_0x518f7a, {
        ok: false,
        failed: _0x46b03c.length,
        errors: [
          {
            index: 0,
            error: 'Automation is paused in Settings.',
          },
        ],
      });
    }
    const _0x1f2e45 = _0x457805.signal || {
      aborted: false,
    };
    _0x487fd7.add(_0x1f2e45);
    _0x403ff1.set(_0x7219c, (_0x403ff1.get(_0x7219c) || 0) + 1);
    try {
      const _0x152ac6 = _0xe91059 ? _0xe91059(_0x7219c) : {};
      const _0x5aa404 = Object.assign({}, _0x152ac6, _0x457805.vars || {});
      if (_0x457805.markRead) {
        try {
          await _0x483045.markRead(_0x7219c);
        } catch (_0x10db2c) {}
      }
      for (let _0x1beddb = 0; _0x1beddb < _0x46b03c.length; _0x1beddb++) {
        if (_0x1f2e45.aborted) {
          _0x518f7a.aborted = true;
          break;
        }
        const _0x56f24d = _0x46b03c[_0x1beddb];
        const _0x47cd07 =
          _0x56f24d.delay && _0x56f24d.delay.max > 0 ? _0x56f24d.delay : null;
        const _0x4a39bd =
          _0x1beddb > 0 && _0x457805.delay ? _0x457805.delay : null;
        const _0x393c59 = _0x47cd07
          ? _0x2e656c(_0x47cd07.min, _0x47cd07.max)
          : _0x4a39bd
            ? _0x2e656c(_0x4a39bd.min, _0x4a39bd.max)
            : 0;
        if (_0x393c59 > 0) {
          await sleepFn(_0x393c59 * 1000);
        }
        if (_0x1f2e45.aborted) {
          _0x518f7a.aborted = true;
          break;
        }
        await _0x2a1901(
          Object.assign(
            {
              signal: _0x1f2e45,
            },
            _0x457805,
          ),
        );
        try {
          await _0x313b17(_0x7219c, _0x56f24d, _0x457805, _0x5aa404);
          _0x518f7a.sent++;
          _0x24d7e6.push(now());
          _0x18e060.set(_0x7219c, now());
          _0x420273('sender:sent', {
            chatId: _0x7219c,
            message: _0x56f24d,
          });
        } catch (_0x440c69) {
          _0x518f7a.failed++;
          _0x518f7a.errors.push({
            index: _0x1beddb,
            error: (_0x440c69 && _0x440c69.message) || String(_0x440c69),
          });
          _0x420273('sender:failed', {
            chatId: _0x7219c,
            message: _0x56f24d,
            error: _0x440c69,
          });
          if (_0x457805.stopOnError) {
            break;
          }
        }
        if (_0x457805.onProgress) {
          _0x457805.onProgress(_0x1beddb + 1, _0x46b03c.length, _0x518f7a);
        }
      }
      _0x518f7a.ok = _0x518f7a.failed === 0 && !_0x518f7a.aborted;
      return _0x518f7a;
    } finally {
      _0x487fd7.delete(_0x1f2e45);
      _0x403ff1.set(_0x7219c, Math.max(0, (_0x403ff1.get(_0x7219c) || 1) - 1));
      _0x18e060.set(_0x7219c, now());
    }
  }
  function _0x517fa4(_0x2e671d) {
    const _0x1cd016 = _0x4327ab.then(_0x2e671d, _0x2e671d);
    _0x4327ab = _0x1cd016.catch(() => {});
    return _0x1cd016;
  }
  return {
    send: (_0x24542a, _0x9a00ca, _0x532d6a) =>
      _0x517fa4(() =>
        _0x4d060a(_0x24542a, [].concat(_0x9a00ca), _0x532d6a || {}),
      ),
    sendNow: (_0x11b07b, _0x147d0c, _0x5a3987) =>
      _0x4d060a(_0x11b07b, [].concat(_0x147d0c), _0x5a3987 || {}),
    enqueue: _0x517fa4,
    isOurs(_0x5b70e1, _0x4ca61d = 6000) {
      return (
        (_0x403ff1.get(_0x5b70e1) || 0) > 0 ||
        now() - (_0x18e060.get(_0x5b70e1) || 0) < _0x4ca61d
      );
    },
    sentLastHour() {
      _0x1b5d52();
      return _0x24d7e6.length;
    },
    abortAll() {
      for (const _0x5f09b5 of _0x487fd7) {
        _0x5f09b5.aborted = true;
      }
    },
    decorate: _0x3d6b86,
    _sentTimes: _0x24d7e6,
  };
}
