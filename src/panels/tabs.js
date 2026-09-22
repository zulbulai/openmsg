import { h, icon, clear } from '../ui/dom.js';
import * as _0x3a5cd8 from '../ui/kit.js';
import { pickChats } from '../ui/pickers.js';
import { debounce } from '../core/util.js';
export function openTabEditor(_0x1d31d6, _0x123899) {
  const _0x5cb6fc = {
    title: '',
    details: '',
    visible: true,
    members: [],
  };
  Object.assign(
    _0x5cb6fc,
    _0x123899 ? JSON.parse(JSON.stringify(_0x123899)) : {},
  );
  const _0x4d8fa4 = _0x3a5cd8.field(
    'Tab title',
    _0x3a5cd8.input({
      value: _0x5cb6fc.title,
      maxLength: 30,
      placeholder: 'Enter tab title',
      onInput: (_0x273951) => {
        _0x5cb6fc.title = _0x273951;
      },
    }),
    {
      required: true,
      hint: 'Up to 30 characters.',
    },
  );
  const _0x5e8c91 = h(
    'span',
    {
      class: 'wc-muted',
    },
    '',
  );
  const _0x2f3412 = () => {
    _0x5e8c91.textContent =
      _0x5cb6fc.members.length +
      ' chat' +
      (_0x5cb6fc.members.length === 1 ? '' : 's') +
      ' in this tab';
  };
  _0x2f3412();
  const _0x4b1780 = _0x3a5cd8.openModal({
    title: _0x123899 ? 'Edit tab' : 'Add tab',
    width: 480,
    body: h(
      'div',
      {
        class: 'wc-form',
      },
      _0x4d8fa4,
      _0x3a5cd8.field(
        'Tab details',
        _0x3a5cd8.textarea({
          value: _0x5cb6fc.details,
          rows: 2,
          placeholder: 'Enter tab details',
          onInput: (_0x2e796a) => {
            _0x5cb6fc.details = _0x2e796a;
          },
        }),
      ),
      _0x3a5cd8.field(
        'Visible in the top bar',
        _0x3a5cd8.toggle(
          _0x5cb6fc.visible,
          (_0x22c98f) => {
            _0x5cb6fc.visible = _0x22c98f;
          },
          'Visible',
        ),
      ),
      h(
        'div',
        {
          class: 'wc-inline',
        },
        _0x3a5cd8.button('Choose chats', {
          icon: 'users',
          onClick: async () => {
            const _0x26cca7 = await pickChats(_0x1d31d6, {
              title: 'Choose chats for this tab',
              selected: _0x5cb6fc.members,
            });
            if (_0x26cca7) {
              _0x5cb6fc.members = _0x26cca7;
              _0x2f3412();
            }
          },
        }),
        _0x5e8c91,
      ),
    ),
    footer: h(
      'div',
      {
        class: 'wc-modal-actions',
      },
      _0x3a5cd8.button('Cancel', {
        variant: 'dark',
        onClick: () => _0x4b1780.close(),
      }),
      _0x3a5cd8.button('Save', {
        variant: 'primary',
        onClick: async () => {
          try {
            await _0x1d31d6.crm.saveTab(_0x5cb6fc);
            _0x4b1780.close();
            _0x3a5cd8.toast('Tab saved', 'success');
          } catch (_0x2d8a7b) {
            _0x4d8fa4.setError(_0x2d8a7b.message);
          }
        },
      }),
    ),
  });
  return _0x4b1780;
}
export default {
  id: 'tabs',
  title: 'Custom Tabs',
  subtitle: 'Group chats your way. Each tab becomes a filter in the top bar.',
  icon: 'folders',
  render(_0x777b33) {
    const { app: _0x2dc72d } = _0x777b33;
    const _0x4e0802 = h('div', {
      class: 'wc-stack',
    });
    function _0x19ba95() {
      clear(_0x4e0802);
      const _0x4c48a9 = _0x2dc72d.crm.tabs();
      if (!_0x4c48a9.length) {
        _0x4e0802.appendChild(
          _0x3a5cd8.emptyState(
            'folders',
            'No tabs yet',
            'Create a tab, choose its chats, and it appears in the top bar.',
            _0x3a5cd8.button('Add tab', {
              icon: 'plus',
              variant: 'primary',
              onClick: () => openTabEditor(_0x2dc72d),
            }),
          ),
        );
        return;
      }
      const _0x4f02cd = h(
        'div',
        {
          class: 'wc-canlist',
        },
        _0x4c48a9.map((_0x158b50) =>
          h(
            'article',
            {
              class: 'wc-card wc-canrow',
              dataset: {
                id: _0x158b50.id,
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
                h('strong', null, _0x158b50.title),
                _0x3a5cd8.chip(
                  (_0x158b50.members || []).length + ' chats',
                  'neutral',
                ),
              ),
              _0x158b50.details
                ? h(
                    'p',
                    {
                      class: 'wc-canpreview',
                    },
                    _0x158b50.details,
                  )
                : null,
            ),
            h(
              'div',
              {
                class: 'wc-row-actions',
              },
              _0x3a5cd8.iconButton(
                _0x158b50.visible === false ? 'eye-off' : 'eye',
                _0x158b50.visible === false
                  ? 'Hidden. Click to show'
                  : 'Visible. Click to hide',
                () =>
                  _0x2dc72d.store.patch('tabs', _0x158b50.id, {
                    visible: _0x158b50.visible === false,
                  }),
              ),
              _0x3a5cd8.iconButton('pencil', 'Edit', () =>
                openTabEditor(_0x2dc72d, _0x158b50),
              ),
              _0x3a5cd8.iconButton(
                'trash-2',
                'Delete',
                async () => {
                  if (
                    await _0x3a5cd8.confirmDialog(
                      'Are you sure you want to delete this tab?',
                      {
                        danger: true,
                        confirmLabel: 'Delete',
                      },
                    )
                  ) {
                    await _0x2dc72d.crm.deleteTab(_0x158b50.id);
                    _0x3a5cd8.toast('Tab deleted', 'success');
                  }
                },
                'is-danger',
              ),
            ),
          ),
        ),
      );
      _0x4e0802.appendChild(_0x4f02cd);
      _0x3a5cd8.makeSortable(_0x4f02cd, {
        itemSelector: '.wc-canrow',
        handleSelector: '.wc-grip',
        onReorder: (_0x5e8527) => _0x2dc72d.crm.reorderTabs(_0x5e8527),
      });
    }
    _0x777b33.setActions([
      _0x3a5cd8.button('Add tab', {
        icon: 'plus',
        variant: 'primary',
        onClick: () => openTabEditor(_0x2dc72d),
      }),
    ]);
    _0x777b33.onDispose(_0x2dc72d.store.on('tabs', debounce(_0x19ba95, 40)));
    _0x19ba95();
    return h(
      'div',
      {
        class: 'wc-screen',
      },
      _0x4e0802,
    );
  },
};
