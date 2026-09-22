import { h, icon, clear } from '../ui/dom.js';
import * as _0x5e4632 from '../ui/kit.js';
import { TAG_COLORS, FIELD_TYPES } from '../core/crm.js';
import { debounce } from '../core/util.js';
function openTagEditor(_0x3c6a04, _0x37426f) {
  const _0x4e2b11 = Object.assign(
    {
      name: '',
      color: TAG_COLORS[0],
    },
    _0x37426f || {},
  );
  const _0x16540f = _0x5e4632.field(
    'Tag name',
    _0x5e4632.input({
      value: _0x4e2b11.name,
      maxLength: 30,
      placeholder: 'e.g. VIP',
      onInput: (_0x5acd70) => {
        _0x4e2b11.name = _0x5acd70;
      },
    }),
    {
      required: true,
    },
  );
  const _0x63d999 = _0x5e4632.openModal({
    title: _0x37426f ? 'Edit tag' : 'Add tag',
    width: 420,
    body: h(
      'div',
      {
        class: 'wc-form',
      },
      _0x16540f,
      _0x5e4632.field(
        'Color',
        _0x5e4632.colorSwatches(TAG_COLORS, _0x4e2b11.color, (_0x107565) => {
          _0x4e2b11.color = _0x107565;
        }),
      ),
    ),
    footer: h(
      'div',
      {
        class: 'wc-modal-actions',
      },
      _0x5e4632.button('Cancel', {
        variant: 'dark',
        onClick: () => _0x63d999.close(),
      }),
      _0x5e4632.button('Save', {
        variant: 'primary',
        onClick: async () => {
          try {
            await _0x3c6a04.crm.saveTag(_0x4e2b11);
            _0x63d999.close();
          } catch (_0x299e62) {
            _0x16540f.setError(_0x299e62.message);
          }
        },
      }),
    ),
  });
}
function openFieldEditor(_0xaea991, _0x445ef4) {
  const _0x18c977 = Object.assign(
    {
      label: '',
      type: 'text',
      options: [],
    },
    _0x445ef4 ? JSON.parse(JSON.stringify(_0x445ef4)) : {},
  );
  const _0x5ecc9f = _0x5e4632.field(
    'Field name',
    _0x5e4632.input({
      value: _0x18c977.label,
      placeholder: 'e.g. Company',
      onInput: (_0x1373fc) => {
        _0x18c977.label = _0x1373fc;
      },
    }),
    {
      required: true,
    },
  );
  const _0x2cde25 = h('div', {
    class: 'wc-stack',
  });
  function _0x3b5d34() {
    clear(_0x2cde25);
    if (_0x18c977.type === 'select' || _0x18c977.type === 'multiselect') {
      _0x2cde25.appendChild(
        _0x5e4632.field(
          'Choices',
          _0x5e4632.tagInput({
            value: _0x18c977.options,
            placeholder: 'Type a choice and press Enter',
            onChange: (_0x24261e) => {
              _0x18c977.options = _0x24261e;
            },
          }),
        ),
      );
    }
  }
  const _0x53421d = _0x5e4632.openModal({
    title: _0x445ef4 ? 'Edit field' : 'Add field',
    width: 460,
    body: h(
      'div',
      {
        class: 'wc-form',
      },
      _0x5ecc9f,
      _0x5e4632.field(
        'Type',
        _0x5e4632.select(
          FIELD_TYPES.map((_0x4b39b1) => ({
            value: _0x4b39b1.id,
            label: _0x4b39b1.label,
          })),
          _0x18c977.type,
          (_0x3a24dd) => {
            _0x18c977.type = _0x3a24dd;
            _0x3b5d34();
          },
          {
            disabled: !!_0x445ef4,
          },
        ),
      ),
      _0x2cde25,
      _0x445ef4
        ? h(
            'div',
            {
              class: 'wc-muted',
            },
            'Variable name: {{' + _0x445ef4.key + '}}',
          )
        : h(
            'div',
            {
              class: 'wc-muted',
            },
            'Its variable name is made from the field name and can be used as {{name}} in messages.',
          ),
    ),
    footer: h(
      'div',
      {
        class: 'wc-modal-actions',
      },
      _0x5e4632.button('Cancel', {
        variant: 'dark',
        onClick: () => _0x53421d.close(),
      }),
      _0x5e4632.button('Save', {
        variant: 'primary',
        onClick: async () => {
          try {
            if (
              (_0x18c977.type === 'select' ||
                _0x18c977.type === 'multiselect') &&
              !_0x18c977.options.length
            ) {
              throw new Error('Add at least one choice.');
            }
            await _0xaea991.crm.saveField(_0x18c977);
            _0x53421d.close();
          } catch (_0x4f68e0) {
            _0x5ecc9f.setError(_0x4f68e0.message);
          }
        },
      }),
    ),
  });
  _0x3b5d34();
}
export default {
  id: 'crm-settings',
  title: 'CRM Settings',
  subtitle: 'Tags and custom fields for your contacts.',
  icon: 'settings-2',
  render(_0x219d1e) {
    const { app: _0x21eb9b } = _0x219d1e;
    let _0x72124d = _0x219d1e.params.tab || 'tags';
    const _0x2a23d1 = h('div', {
      class: 'wc-stack',
    });
    function _0x2127cc() {
      clear(_0x2a23d1);
      if (_0x72124d === 'tags') {
        const _0x55a7dc = _0x21eb9b.crm.tags();
        _0x2a23d1.appendChild(
          h(
            'div',
            {
              class: 'wc-inline wc-between',
            },
            h(
              'span',
              {
                class: 'wc-muted',
              },
              'Tags label your contacts and can be used to pick who gets a broadcast.',
            ),
            _0x5e4632.button('Add tag', {
              icon: 'plus',
              variant: 'primary',
              onClick: () => openTagEditor(_0x21eb9b),
            }),
          ),
        );
        _0x2a23d1.appendChild(
          _0x5e4632.table(
            ['Tag', 'Contacts', ''],
            _0x55a7dc.map((_0x439a33) => [
              _0x5e4632.chip(_0x439a33.name, 'accent', {
                color: _0x439a33.color,
              }),
              String(
                _0x21eb9b.store
                  .all('contacts')
                  .filter((_0x3d9169) =>
                    (_0x3d9169.tagIds || []).includes(_0x439a33.id),
                  ).length,
              ),
              h(
                'div',
                {
                  class: 'wc-row-actions',
                },
                _0x5e4632.iconButton('pencil', 'Edit', () =>
                  openTagEditor(_0x21eb9b, _0x439a33),
                ),
                _0x5e4632.iconButton(
                  'trash-2',
                  'Delete',
                  async () => {
                    if (
                      await _0x5e4632.confirmDialog(
                        'Delete the tag "' +
                          _0x439a33.name +
                          '"? It is removed from every contact.',
                        {
                          danger: true,
                          confirmLabel: 'Delete',
                        },
                      )
                    ) {
                      _0x21eb9b.crm.deleteTag(_0x439a33.id);
                    }
                  },
                  'is-danger',
                ),
              ),
            ]),
            {
              empty: _0x5e4632.emptyState(
                'tags',
                'No tags yet',
                'Add tags such as Lead, Customer or VIP.',
              ),
            },
          ),
        );
      } else {
        const _0x5f4ec6 = _0x21eb9b.crm.fields();
        _0x2a23d1.appendChild(
          h(
            'div',
            {
              class: 'wc-inline wc-between',
            },
            h(
              'span',
              {
                class: 'wc-muted',
              },
              'Custom fields appear on every contact and can be used as {{variables}} in messages.',
            ),
            _0x5e4632.button('Add field', {
              icon: 'plus',
              variant: 'primary',
              onClick: () => openFieldEditor(_0x21eb9b),
            }),
          ),
        );
        _0x2a23d1.appendChild(
          _0x5e4632.table(
            ['Field', 'Type', 'Variable', ''],
            _0x5f4ec6.map((_0x315399) => [
              h('strong', null, _0x315399.label),
              (
                FIELD_TYPES.find(
                  (_0x4d74d3) => _0x4d74d3.id === _0x315399.type,
                ) || {}
              ).label,
              h(
                'span',
                {
                  class: 'wc-mono wc-keyword',
                },
                '{{' + _0x315399.key + '}}',
              ),
              h(
                'div',
                {
                  class: 'wc-row-actions',
                },
                _0x5e4632.iconButton('pencil', 'Edit', () =>
                  openFieldEditor(_0x21eb9b, _0x315399),
                ),
                _0x5e4632.iconButton(
                  'trash-2',
                  'Delete',
                  async () => {
                    if (
                      await _0x5e4632.confirmDialog(
                        'Delete the field "' +
                          _0x315399.label +
                          '"? Saved values stay on contacts but are hidden.',
                        {
                          danger: true,
                          confirmLabel: 'Delete',
                        },
                      )
                    ) {
                      _0x21eb9b.crm.deleteField(_0x315399.id);
                    }
                  },
                  'is-danger',
                ),
              ),
            ]),
            {
              empty: _0x5e4632.emptyState(
                'layers',
                'No custom fields yet',
                'Add fields such as Company, Budget or Source.',
              ),
            },
          ),
        );
      }
    }
    const _0x14c353 = _0x5e4632.tabs(
      [
        {
          id: 'tags',
          label: 'Custom tags',
          icon: 'tags',
        },
        {
          id: 'fields',
          label: 'Custom fields',
          icon: 'layers',
        },
      ],
      _0x72124d,
      (_0xec5a6c) => {
        _0x72124d = _0xec5a6c;
        _0x2127cc();
      },
    );
    for (const _0x2ed107 of ['tags', 'fields', 'contacts']) {
      _0x219d1e.onDispose(
        _0x21eb9b.store.on(_0x2ed107, debounce(_0x2127cc, 40)),
      );
    }
    _0x2127cc();
    return h(
      'div',
      {
        class: 'wc-screen',
      },
      _0x14c353.el,
      _0x2a23d1,
    );
  },
};
