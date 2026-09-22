import { h, icon, clear } from '../ui/dom.js';
import * as _0x50a892 from '../ui/kit.js';
import { messageEditor } from '../ui/message-editor.js';
import {
  newMessage,
  validateMessage,
  kindLabel,
  summarizeMessage,
} from '../core/messages.js';
import { clone, debounce } from '../core/util.js';
function openEditor(_0x32c84c, _0xc52dd9) {
  const _0x4eaee2 = _0xc52dd9
    ? clone(_0xc52dd9)
    : {
        title: '',
        message: newMessage('none'),
      };
  const _0x39339f = h('div', {
    class: 'wc-field-error',
  });
  const _0x10a5d0 = _0x50a892.openDrawer({
    title: _0xc52dd9 ? 'Edit template' : 'Add template',
    width: 620,
    body: h(
      'div',
      {
        class: 'wc-form',
      },
      _0x50a892.field(
        'Template name',
        _0x50a892.input({
          value: _0x4eaee2.title,
          placeholder: 'e.g. Welcome message',
          onInput: (_0x48d7fe) => {
            _0x4eaee2.title = _0x48d7fe;
          },
        }),
        {
          required: true,
        },
      ),
      messageEditor({
        app: _0x32c84c,
        messages: [_0x4eaee2.message],
        single: true,
        templates: false,
        onChange: (_0x4f3c04) => {
          _0x4eaee2.message = _0x4f3c04[0];
        },
      }),
      _0x39339f,
    ),
    footer: h(
      'div',
      {
        class: 'wc-modal-actions',
      },
      _0x50a892.button('Cancel', {
        variant: 'dark',
        onClick: () => _0x10a5d0.close(),
      }),
      _0x50a892.button('Save', {
        variant: 'primary',
        onClick: async () => {
          if (!_0x4eaee2.title.trim()) {
            _0x39339f.textContent = 'Give the template a name.';
            return;
          }
          const _0xbee017 = validateMessage(_0x4eaee2.message);
          if (_0xbee017.length) {
            _0x39339f.textContent = _0xbee017[0];
            return;
          }
          await _0x32c84c.store.put(
            'templates',
            Object.assign({}, _0x4eaee2, {
              title: _0x4eaee2.title.trim(),
              order:
                _0x4eaee2.order !== undefined
                  ? _0x4eaee2.order
                  : _0x32c84c.store.count('templates'),
            }),
          );
          _0x10a5d0.close();
          _0x50a892.toast('Template saved', 'success');
        },
      }),
    ),
  });
}
export default {
  id: 'templates',
  title: 'Templates',
  subtitle:
    'Save messages once and reuse them in broadcasts, bots and canned responses.',
  icon: 'layout-template',
  render(_0xc57ea5) {
    const { app: _0x9d087 } = _0xc57ea5;
    const _0x2d2178 = {
      query: '',
    };
    const _0x1efb41 = h('div', {
      class: 'wc-stack',
    });
    function _0xd9d1bc() {
      clear(_0x1efb41);
      const _0x45dbd2 = _0x9d087.store.all('templates');
      const _0x33e85b = _0x45dbd2.filter(
        (_0x5df6bd) =>
          !_0x2d2178.query ||
          _0x5df6bd.title.toLowerCase().includes(_0x2d2178.query.toLowerCase()),
      );
      if (!_0x45dbd2.length) {
        _0x1efb41.appendChild(
          _0x50a892.emptyState(
            'layout-template',
            'No templates yet',
            'Create one, then pick it from "Use a template" wherever you write a message.',
            _0x50a892.button('Add template', {
              icon: 'plus',
              variant: 'primary',
              onClick: () => openEditor(_0x9d087),
            }),
          ),
        );
        return;
      }
      _0x1efb41.appendChild(
        h(
          'div',
          {
            class: 'wc-grid wc-grid-2',
          },
          _0x33e85b.map((_0x3313f) =>
            h(
              'article',
              {
                class: 'wc-card wc-template',
              },
              h(
                'div',
                {
                  class: 'wc-card-head',
                },
                h(
                  'div',
                  null,
                  h(
                    'h3',
                    {
                      class: 'wc-card-title',
                    },
                    _0x3313f.title,
                  ),
                  h(
                    'div',
                    {
                      class: 'wc-inline',
                    },
                    _0x50a892.chip(kindLabel(_0x3313f.message.kind), 'neutral'),
                  ),
                ),
                h(
                  'div',
                  {
                    class: 'wc-row-actions',
                  },
                  _0x50a892.iconButton('copy', 'Clone', () => {
                    const _0x229641 = clone(_0x3313f);
                    delete _0x229641.id;
                    delete _0x229641.createdAt;
                    _0x229641.title += ' (copy)';
                    _0x9d087.store.put('templates', _0x229641);
                  }),
                  _0x50a892.iconButton('pencil', 'Edit', () =>
                    openEditor(_0x9d087, _0x3313f),
                  ),
                  _0x50a892.iconButton(
                    'trash-2',
                    'Delete',
                    async () => {
                      if (
                        await _0x50a892.confirmDialog('Delete this template?', {
                          danger: true,
                          confirmLabel: 'Delete',
                        })
                      ) {
                        _0x9d087.store.remove('templates', _0x3313f.id);
                      }
                    },
                    'is-danger',
                  ),
                ),
              ),
              h(
                'p',
                {
                  class: 'wc-template-text',
                },
                summarizeMessage(_0x3313f.message),
              ),
            ),
          ),
        ),
      );
      if (!_0x33e85b.length) {
        _0x1efb41.appendChild(
          h(
            'div',
            {
              class: 'wc-muted wc-pad',
            },
            'No templates match your search.',
          ),
        );
      }
    }
    _0xc57ea5.setActions([
      _0x50a892.button('Add template', {
        icon: 'plus',
        variant: 'primary',
        onClick: () => openEditor(_0x9d087),
      }),
    ]);
    _0xc57ea5.onDispose(
      _0x9d087.store.on('templates', debounce(_0xd9d1bc, 40)),
    );
    _0xd9d1bc();
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
        _0x50a892.searchInput('Search templates', (_0x45930d) => {
          _0x2d2178.query = _0x45930d.trim();
          _0xd9d1bc();
        }),
      ),
      _0x1efb41,
    );
  },
};
