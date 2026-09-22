import { h, icon, clear } from '../ui/dom.js';
import * as _0x232098 from '../ui/kit.js';
import { newMessage, fileKind } from '../core/messages.js';
import { fmtTime, fileToDataUrl, bytesToSize } from '../core/util.js';
export function openChatModal(_0x56426a, _0x41a0df) {
  const _0xd401ef = _0x56426a.crm.displayName(_0x41a0df);
  const _0x31689c = h(
    'div',
    {
      class: 'wc-chatlog',
    },
    h(
      'div',
      {
        class: 'wc-muted wc-pad',
      },
      'Loading messages...',
    ),
  );
  let _0x4186f6 = null;
  const _0x5acbd4 = h('div', {
    class: 'wc-attach-chip',
  });
  const _0x55cf62 = _0x232098.textarea({
    rows: 2,
    placeholder: 'Type a message. Enter to send, Shift+Enter for a new line.',
  });
  function _0x1035ce(_0x35317a) {
    const _0x2da78c =
      _0x35317a.type === 'chat'
        ? _0x35317a.body
        : _0x35317a.body
          ? _0x35317a.body
          : '[' + (_0x35317a.type || 'message') + ']';
    return h(
      'div',
      {
        class: 'wc-bubble-row ' + (_0x35317a.fromMe ? 'is-me' : 'is-them'),
      },
      h(
        'div',
        {
          class: 'wc-msgbubble',
        },
        h('span', null, _0x2da78c || '(no text)'),
        h('small', null, fmtTime(_0x35317a.t * 1000)),
      ),
    );
  }
  const _0xe51b53 = (_0x1f7be2, _0x244a92) =>
    Promise.race([
      _0x1f7be2,
      new Promise((_0x4b9b1a, _0x22bd29) =>
        setTimeout(
          () => _0x22bd29(new Error('WhatsApp took too long to answer.')),
          _0x244a92,
        ),
      ),
    ]);
  async function _0x36655b() {
    try {
      const _0x2b12d1 = await _0xe51b53(
        _0x56426a.wa.messages(_0x41a0df, {
          count: 30,
        }),
        15000,
      );
      clear(_0x31689c);
      if (!_0x2b12d1.length) {
        _0x31689c.appendChild(
          h(
            'div',
            {
              class: 'wc-muted wc-pad',
            },
            'No messages found.',
          ),
        );
      }
      _0x2b12d1.forEach((_0x2159c5) =>
        _0x31689c.appendChild(_0x1035ce(_0x2159c5)),
      );
      _0x31689c.scrollTop = _0x31689c.scrollHeight;
    } catch (_0x4236f3) {
      clear(_0x31689c);
      _0x31689c.appendChild(
        h(
          'div',
          {
            class: 'wc-stack wc-pad',
          },
          h(
            'span',
            {
              class: 'wc-muted',
            },
            'Could not load messages: ' + _0x4236f3.message,
          ),
          _0x232098.button('Try again', {
            size: 'sm',
            icon: 'refresh-cw',
            onClick: () => {
              clear(_0x31689c);
              _0x31689c.appendChild(
                h(
                  'div',
                  {
                    class: 'wc-muted wc-pad',
                  },
                  'Loading messages...',
                ),
              );
              _0x36655b();
            },
          }),
        ),
      );
    }
  }
  function _0x490c1e() {
    clear(_0x5acbd4);
    if (_0x4186f6) {
      _0x5acbd4.appendChild(
        h(
          'span',
          null,
          icon('paperclip', 14),
          ' ' + _0x4186f6.name + ' (' + bytesToSize(_0x4186f6.size) + ')',
          _0x232098.iconButton('x', 'Remove attachment', () => {
            _0x4186f6 = null;
            _0x490c1e();
          }),
        ),
      );
    }
  }
  async function _0x1061f2() {
    const _0xa6acbd = _0x55cf62.value.trim();
    if (!_0xa6acbd && !_0x4186f6) {
      return;
    }
    const _0x4d0ecc = newMessage(
      _0x4186f6
        ? _0x4186f6.kind === 'document'
          ? 'document'
          : _0x4186f6.kind === 'audio'
            ? 'audio'
            : 'media'
        : 'none',
    );
    _0x4d0ecc.text = _0xa6acbd;
    if (_0x4186f6) {
      _0x4d0ecc.files = [_0x4186f6];
    }
    _0x119242.disabled = true;
    try {
      const _0x526606 = await _0x56426a.sender.sendNow(_0x41a0df, _0x4d0ecc, {
        typing: false,
        signature: true,
      });
      if (!_0x526606.ok) {
        throw new Error(
          (_0x526606.errors[0] && _0x526606.errors[0].error) || 'Not sent',
        );
      }
      _0x55cf62.value = '';
      _0x4186f6 = null;
      _0x490c1e();
      await _0x36655b();
    } catch (_0x9488b2) {
      _0x232098.toast('Failed to send: ' + _0x9488b2.message, 'error');
    } finally {
      _0x119242.disabled = false;
    }
  }
  const _0x119242 = _0x232098.button('Send', {
    icon: 'send',
    variant: 'primary',
    onClick: _0x1061f2,
  });
  _0x55cf62.addEventListener('keydown', (_0x2383ba) => {
    if (_0x2383ba.key === 'Enter' && !_0x2383ba.shiftKey) {
      _0x2383ba.preventDefault();
      _0x1061f2();
    }
  });
  const _0x19b48c = _0x232098.openModal({
    title: 'Chat with ' + _0xd401ef,
    width: 560,
    body: h(
      'div',
      {
        class: 'wc-stack',
      },
      _0x31689c,
      _0x5acbd4,
      _0x55cf62,
    ),
    footer: h(
      'div',
      {
        class: 'wc-modal-actions',
      },
      _0x232098.button('Attach', {
        icon: 'paperclip',
        onClick: async () => {
          const [_0x3aeb01] = await _0x232098.pickFiles('', false);
          if (!_0x3aeb01) {
            return;
          }
          const _0x4a7293 = await fileToDataUrl(_0x3aeb01);
          const _0x413b20 = await _0x56426a.store.putBlob(_0x4a7293, {
            name: _0x3aeb01.name,
            mime: _0x3aeb01.type,
            size: _0x3aeb01.size,
          });
          _0x4186f6 = {
            blobId: _0x413b20,
            name: _0x3aeb01.name,
            mime: _0x3aeb01.type,
            size: _0x3aeb01.size,
            kind: fileKind(_0x3aeb01.type),
            caption: '',
          };
          _0x490c1e();
        },
      }),
      _0x232098.button('Open in WhatsApp', {
        icon: 'external-link',
        onClick: () => {
          _0x56426a.wa.openChat(_0x41a0df).catch(() => {});
          _0x19b48c.close();
        },
      }),
      _0x119242,
    ),
  });
  _0x36655b();
  _0x55cf62.focus();
  return _0x19b48c;
}
