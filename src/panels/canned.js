import { h, icon, clear } from '../ui/dom.js';
import * as _0x1ec593 from '../ui/kit.js';
import { messageEditor } from '../ui/message-editor.js';
import { postActionsEditor } from '../ui/pickers.js';
import {
  newQuickReply,
  validateQuickReply,
  sendCanned,
  quickReplySummary,
} from '../features/canned.js';
import { kindLabel, validateMessage } from '../core/messages.js';
import { hasActions } from '../core/actions.js';
import { clone, debounce } from '../core/util.js';
export function openQuickReplyEditor(_0x360d6a, _0x5e20d6) {
  const _0x5044dd = _0x5e20d6 ? clone(_0x5e20d6) : newQuickReply();
  const _0x1f358c = h('div', {
    class: 'wc-field-error',
  });
  const _0x36bd5a = h('div', null);
  function _0x4f9c28() {
    clear(_0x36bd5a);
    if (!_0x5044dd.funnel && _0x5044dd.messages.length > 1) {
      _0x5044dd.messages = _0x5044dd.messages.slice(0, 1);
    }
    _0x36bd5a.appendChild(
      messageEditor({
        app: _0x360d6a,
        messages: _0x5044dd.messages,
        single: !_0x5044dd.funnel,
        allowDelay: _0x5044dd.funnel,
        onChange: () => {},
      }),
    );
    if (_0x5044dd.funnel) {
      _0x36bd5a.appendChild(
        h(
          'div',
          {
            class: 'wc-form-row wc-delay',
          },
          _0x1ec593.field(
            'Default wait between messages: minimum seconds',
            _0x1ec593.input({
              type: 'number',
              min: 0,
              value: _0x5044dd.delay.min,
              onInput: (_0x40c4e2) => {
                _0x5044dd.delay.min = Number(_0x40c4e2) || 0;
                if (_0x5044dd.delay.max < _0x5044dd.delay.min) {
                  _0x5044dd.delay.max = _0x5044dd.delay.min;
                }
              },
            }),
          ),
          _0x1ec593.field(
            'Maximum seconds',
            _0x1ec593.input({
              type: 'number',
              min: 0,
              value: _0x5044dd.delay.max,
              onInput: (_0x379da5) => {
                _0x5044dd.delay.max = Number(_0x379da5) || 0;
              },
            }),
          ),
        ),
      );
    }
  }
  const _0x6ecd2f = _0x1ec593.checkbox(
    _0x5044dd.editBeforeSend,
    (_0x51c687) => {
      _0x5044dd.editBeforeSend = _0x51c687;
    },
    'Edit before sending (puts the text in the message box instead of sending)',
  );
  const _0x3cf121 = _0x1ec593.openDrawer({
    title: _0x5e20d6 ? 'Edit canned response' : 'Add canned response',
    width: 640,
    body: h(
      'div',
      {
        class: 'wc-form',
      },
      _0x1ec593.field(
        'Canned response name',
        _0x1ec593.input({
          value: _0x5044dd.title,
          placeholder: 'e.g. Pricing sheet',
          onInput: (_0x5a5edf) => {
            _0x5044dd.title = _0x5a5edf;
          },
        }),
        {
          required: true,
        },
      ),
      _0x1ec593.field(
        'Shortcut',
        h(
          'div',
          {
            class: 'wc-shortcut',
          },
          h('span', null, '/'),
          _0x1ec593.input({
            value: _0x5044dd.shortcut,
            placeholder: 'pricing',
            maxLength: 24,
            onInput: (_0x3cb4e0) => {
              _0x5044dd.shortcut = _0x3cb4e0.replace(/^\/+/, '');
            },
          }),
        ),
        {
          hint: 'Type / and the shortcut in a chat to use it.',
        },
      ),
      h(
        'div',
        {
          class: 'wc-checklist',
        },
        _0x1ec593.checkbox(
          _0x5044dd.pinned,
          (_0x3eae4e) => {
            _0x5044dd.pinned = _0x3eae4e;
          },
          'Pin to the shortcut bar above the message box',
        ),
        _0x6ecd2f,
        _0x1ec593.checkbox(
          _0x5044dd.confirmBeforeSend,
          (_0x264073) => {
            _0x5044dd.confirmBeforeSend = _0x264073;
          },
          'Ask me to confirm before sending',
        ),
        _0x1ec593.checkbox(
          _0x5044dd.mentionAll,
          (_0x276493) => {
            _0x5044dd.mentionAll = _0x276493;
          },
          'Mention all group participants in the message',
        ),
        _0x1ec593.checkbox(
          _0x5044dd.funnel,
          (_0x30fb85) => {
            _0x5044dd.funnel = _0x30fb85;
            _0x4f9c28();
          },
          'Create funnel (send several messages in a row)',
        ),
      ),
      _0x1ec593.field(
        'Status',
        h(
          'div',
          {
            class: 'wc-inline',
          },
          _0x1ec593.toggle(
            _0x5044dd.enabled,
            (_0x1d3a4a) => {
              _0x5044dd.enabled = _0x1d3a4a;
            },
            'On',
          ),
          h(
            'span',
            {
              class: 'wc-muted',
            },
            'When on, it is available to use. When off, it is saved but hidden.',
          ),
        ),
      ),
      _0x36bd5a,
      h(
        'details',
        {
          class: 'wc-details',
          open: hasActions(_0x5044dd.post),
        },
        h('summary', null, 'Post actions'),
        postActionsEditor(_0x360d6a, _0x5044dd.post || {}, {
          onChange: (_0x274753) => {
            _0x5044dd.post = _0x274753;
          },
        }),
      ),
      _0x1f358c,
    ),
    footer: h(
      'div',
      {
        class: 'wc-modal-actions',
      },
      _0x1ec593.button('Cancel', {
        variant: 'dark',
        onClick: () => _0x3cf121.close(),
      }),
      _0x1ec593.button('Save', {
        variant: 'primary',
        onClick: async () => {
          const _0xb31df4 = validateQuickReply(
            _0x5044dd,
            _0x360d6a.store.all('quickReplies'),
          );
          if (_0xb31df4) {
            _0x1f358c.textContent = _0xb31df4;
            return;
          }
          for (const _0x1a0b39 of _0x5044dd.messages) {
            const _0x38634f = validateMessage(_0x1a0b39);
            if (_0x38634f.length) {
              _0x1f358c.textContent = _0x38634f[0];
              return;
            }
          }
          await _0x360d6a.store.put(
            'quickReplies',
            Object.assign({}, _0x5044dd, {
              shortcut: String(_0x5044dd.shortcut || '').trim(),
              title: _0x5044dd.title.trim(),
              order:
                _0x5044dd.order !== undefined
                  ? _0x5044dd.order
                  : _0x360d6a.store.count('quickReplies'),
            }),
          );
          _0x3cf121.close();
          _0x1ec593.toast('Canned response saved', 'success');
        },
      }),
    ),
  });
  _0x4f9c28();
  return _0x3cf121;
}
export default {
  id: 'canned',
  title: 'Canned Responses',
  subtitle: 'Save your best replies and send them with a click or a /shortcut.',
  icon: 'message-square-text',
  render(_0x588e2f) {
    const { app: _0x57a707, shell: _0x28f28e } = _0x588e2f;
    const _0xc5ddae = {
      query: '',
      selected: new Set(),
    };
    const _0x17b3bf = h('div', {
      class: 'wc-stack',
    });
    function _0x119c5f() {
      clear(_0x17b3bf);
      const _0x33d386 = _0x57a707.store.all('quickReplies');
      const _0x174592 = _0x33d386.filter(
        (_0x5ad670) =>
          !_0xc5ddae.query ||
          (_0x5ad670.title + ' ' + (_0x5ad670.shortcut || ''))
            .toLowerCase()
            .includes(_0xc5ddae.query.toLowerCase()),
      );
      _0x17b3bf.appendChild(
        _0x1ec593.bulkBar(
          _0xc5ddae.selected.size,
          _0x1ec593.button(
            'Delete selected (' + _0xc5ddae.selected.size + ')',
            {
              variant: 'danger',
              size: 'sm',
              icon: 'trash-2',
              onClick: async () => {
                if (
                  await _0x1ec593.confirmDialog(
                    'Delete ' +
                      _0xc5ddae.selected.size +
                      ' selected responses?',
                    {
                      danger: true,
                      confirmLabel: 'Delete',
                    },
                  )
                ) {
                  for (const _0x21ec89 of _0xc5ddae.selected) {
                    await _0x57a707.store.remove('quickReplies', _0x21ec89);
                  }
                  _0xc5ddae.selected.clear();
                }
              },
            },
          ),
        ),
      );
      if (!_0x33d386.length) {
        _0x17b3bf.appendChild(
          _0x1ec593.emptyState(
            'message-square-text',
            'No canned responses yet',
            'Create one, then type / in any chat to use it.',
            _0x1ec593.button('Add canned response', {
              icon: 'plus',
              variant: 'primary',
              onClick: () => openQuickReplyEditor(_0x57a707),
            }),
          ),
        );
        return;
      }
      const _0x1766f = h(
        'div',
        {
          class: 'wc-canlist',
        },
        _0x174592.map((_0x1b6c18) =>
          h(
            'article',
            {
              class: 'wc-card wc-canrow',
              dataset: {
                id: _0x1b6c18.id,
              },
            },
            h(
              'span',
              {
                class: 'wc-grip',
                title: 'Drag to reorder',
              },
              icon('grip-vertical', 16),
            ),
            _0x1ec593.checkbox(
              _0xc5ddae.selected.has(_0x1b6c18.id),
              (_0x4b7751) => {
                if (_0x4b7751) {
                  _0xc5ddae.selected.add(_0x1b6c18.id);
                } else {
                  _0xc5ddae.selected.delete(_0x1b6c18.id);
                }
                _0x119c5f();
              },
            ),
            h(
              'div',
              {
                class: 'wc-canmain',
              },
              h(
                'div',
                {
                  class: 'wc-inline',
                },
                h('strong', null, _0x1b6c18.title || 'Untitled'),
                _0x1b6c18.shortcut
                  ? h(
                      'span',
                      {
                        class: 'wc-mono wc-keyword',
                      },
                      '/' + _0x1b6c18.shortcut,
                    )
                  : null,
                _0x1b6c18.messages.length > 1
                  ? _0x1ec593.chip('Funnel', 'accent')
                  : _0x1ec593.chip(
                      kindLabel(_0x1b6c18.messages[0].kind),
                      'neutral',
                    ),
                hasActions(_0x1b6c18.post)
                  ? _0x1ec593.chip('Post actions', 'info')
                  : null,
              ),
              h(
                'p',
                {
                  class: 'wc-canpreview',
                },
                quickReplySummary(_0x1b6c18),
              ),
            ),
            h(
              'div',
              {
                class: 'wc-row-actions',
              },
              _0x1ec593.iconButton(
                _0x1b6c18.pinned ? 'pin' : 'pin',
                _0x1b6c18.pinned
                  ? 'Unpin from shortcut bar'
                  : 'Pin to shortcut bar',
                () =>
                  _0x57a707.store.patch('quickReplies', _0x1b6c18.id, {
                    pinned: !_0x1b6c18.pinned,
                  }),
                _0x1b6c18.pinned ? 'is-on' : '',
              ),
              _0x1ec593.toggle(
                _0x1b6c18.enabled !== false,
                (_0x4fb2f0) =>
                  _0x57a707.store.patch('quickReplies', _0x1b6c18.id, {
                    enabled: _0x4fb2f0,
                  }),
                'Enabled',
              ),
              _0x1ec593.iconButton(
                'send',
                'Send to the open chat',
                async () => {
                  const _0x167fbc = _0x57a707.wa.state.activeChat;
                  if (!_0x167fbc) {
                    _0x1ec593.toast('Open a chat in WhatsApp first.', 'info');
                    return;
                  }
                  await sendCanned(_0x57a707, _0x1b6c18, _0x167fbc.id);
                },
              ),
              _0x1ec593.iconButton('pencil', 'Edit', () =>
                openQuickReplyEditor(_0x57a707, _0x1b6c18),
              ),
              _0x1ec593.iconButton('copy', 'Clone', async () => {
                const _0x520ef9 = clone(_0x1b6c18);
                delete _0x520ef9.id;
                delete _0x520ef9.createdAt;
                _0x520ef9.title += ' (copy)';
                _0x520ef9.shortcut = '';
                _0x520ef9.order = _0x57a707.store.count('quickReplies');
                await _0x57a707.store.put('quickReplies', _0x520ef9);
              }),
              _0x1ec593.iconButton(
                'trash-2',
                'Delete',
                async () => {
                  if (
                    await _0x1ec593.confirmDialog(
                      'Delete this canned response?',
                      {
                        danger: true,
                        confirmLabel: 'Delete',
                      },
                    )
                  ) {
                    _0x57a707.store.remove('quickReplies', _0x1b6c18.id);
                  }
                },
                'is-danger',
              ),
            ),
          ),
        ),
      );
      _0x17b3bf.appendChild(_0x1766f);
      if (!_0xc5ddae.query) {
        _0x1ec593.makeSortable(_0x1766f, {
          itemSelector: '.wc-canrow',
          handleSelector: '.wc-grip',
          onReorder: async (_0x4efe7d) => {
            for (let _0x1b20a9 = 0; _0x1b20a9 < _0x4efe7d.length; _0x1b20a9++) {
              await _0x57a707.store.patch(
                'quickReplies',
                _0x4efe7d[_0x1b20a9],
                {
                  order: _0x1b20a9,
                },
              );
            }
          },
        });
      }
    }
    _0x588e2f.setActions([
      _0x1ec593.button('Add canned response', {
        icon: 'plus',
        variant: 'primary',
        onClick: () => openQuickReplyEditor(_0x57a707),
      }),
    ]);
    _0x588e2f.onDispose(
      _0x57a707.store.on('quickReplies', debounce(_0x119c5f, 30)),
    );
    _0x119c5f();
    return h(
      'div',
      {
        class: 'wc-screen',
      },
      h(
        'div',
        {
          class: 'wc-toolbar',
        },
        _0x1ec593.searchInput('Search here', (_0x6e0e60) => {
          _0xc5ddae.query = _0x6e0e60.trim();
          _0x119c5f();
        }),
      ),
      _0x17b3bf,
    );
  },
};
