import { h, icon, clear } from './dom.js';
import * as _0x2fcf40 from './kit.js';
import { emptyActions } from '../core/actions.js';
import { parseNumbers } from '../core/csv.js';
export function pickChats(_0xf1e762, _0x1942b8 = {}) {
  return new Promise((_0x52d18c) => {
    const _0x4aa7cd = new Set(_0x1942b8.selected || []);
    let _0x2fcb2a =
      _0x1942b8.groups === false
        ? 'chats'
        : _0x1942b8.users === false
          ? 'groups'
          : 'chats';
    let _0x3f65bc = 'contain';
    let _0x243f7b = '';
    let _0x4a66a8 = [];
    const _0x3b923d = h(
      'div',
      {
        class: 'wc-picklist',
      },
      h(
        'div',
        {
          class: 'wc-muted wc-pad',
        },
        'Loading your chats...',
      ),
    );
    const _0x5c6970 = h(
      'span',
      {
        class: 'wc-muted',
      },
      '',
    );
    const _0x2e15a3 = () =>
      _0x4a66a8
        .filter((_0x3637e5) =>
          _0x2fcb2a === 'groups'
            ? _0x3637e5.isGroup
            : !_0x3637e5.isGroup &&
              !_0x3637e5.isBroadcast &&
              !_0x3637e5.isNewsletter,
        )
        .filter((_0x552142) => {
          if (!_0x243f7b) {
            return true;
          }
          const _0x1c24f2 = String(_0x552142.name || '').toLowerCase();
          const _0x3eb71e = String(_0x552142.phone || '');
          const _0x4ae18b = _0x243f7b.toLowerCase();
          if (_0x3f65bc === 'start') {
            return (
              _0x1c24f2.startsWith(_0x4ae18b) || _0x3eb71e.startsWith(_0x4ae18b)
            );
          } else if (_0x3f65bc === 'end') {
            return (
              _0x1c24f2.endsWith(_0x4ae18b) || _0x3eb71e.endsWith(_0x4ae18b)
            );
          } else {
            return (
              _0x1c24f2.includes(_0x4ae18b) || _0x3eb71e.includes(_0x4ae18b)
            );
          }
        });
    function _0x2b0eb4() {
      clear(_0x3b923d);
      const _0x1da1ed = _0x2e15a3();
      _0x5c6970.textContent = 'Selected (' + _0x4aa7cd.size + ')';
      if (!_0x1da1ed.length) {
        _0x3b923d.appendChild(
          h(
            'div',
            {
              class: 'wc-muted wc-pad',
            },
            _0x4a66a8.length
              ? 'No chats match your search.'
              : 'No chats found. Open WhatsApp Web and try again.',
          ),
        );
        return;
      }
      for (const _0x4f157a of _0x1da1ed.slice(0, 400)) {
        const _0x314173 = _0x4aa7cd.has(_0x4f157a.id);
        _0x3b923d.appendChild(
          h(
            'button',
            {
              type: 'button',
              class: 'wc-pickrow' + (_0x314173 ? ' is-on' : ''),
              onClick: () => {
                if (_0x1942b8.single) {
                  _0x4aa7cd.clear();
                  _0x4aa7cd.add(_0x4f157a.id);
                  _0x2b0eb4();
                  return;
                }
                if (_0x314173) {
                  _0x4aa7cd.delete(_0x4f157a.id);
                } else {
                  _0x4aa7cd.add(_0x4f157a.id);
                }
                _0x2b0eb4();
              },
            },
            h(
              'span',
              {
                class: 'wc-msel-box',
              },
              _0x314173 ? icon('check', 12) : null,
            ),
            _0x2fcf40.avatar(_0x4f157a.name, 30),
            h(
              'span',
              {
                class: 'wc-msel-text',
              },
              h('span', null, _0x4f157a.name || _0x4f157a.phone),
              h(
                'small',
                null,
                _0x4f157a.isGroup
                  ? 'Group'
                  : _0x4f157a.phone
                    ? '+' + _0x4f157a.phone
                    : '',
              ),
            ),
            _0x4f157a.isGroup ? _0x2fcf40.chip('Group', 'neutral') : null,
          ),
        );
      }
      if (_0x1da1ed.length > 400) {
        _0x3b923d.appendChild(
          h(
            'div',
            {
              class: 'wc-muted wc-pad',
            },
            'Showing 400 of ' +
              _0x1da1ed.length +
              '. Search to narrow the list.',
          ),
        );
      }
    }
    const _0x1f0228 = _0x2fcf40.searchInput(
      'Search by name or number',
      (_0x47b2d4) => {
        _0x243f7b = _0x47b2d4.trim();
        _0x2b0eb4();
      },
    );
    const _0x50d189 = _0x2fcf40.select(
      [
        {
          value: 'contain',
          label: 'Contains',
        },
        {
          value: 'start',
          label: 'Starts with',
        },
        {
          value: 'end',
          label: 'Ends with',
        },
      ],
      _0x3f65bc,
      (_0x136f95) => {
        _0x3f65bc = _0x136f95;
        _0x2b0eb4();
      },
    );
    const _0x164322 =
      _0x1942b8.groups === false || _0x1942b8.users === false
        ? null
        : _0x2fcf40.tabs(
            [
              {
                id: 'chats',
                label: 'Chats',
              },
              {
                id: 'groups',
                label: 'Groups',
              },
            ],
            _0x2fcb2a,
            (_0x4c579e) => {
              _0x2fcb2a = _0x4c579e;
              _0x2b0eb4();
            },
          );
    const _0x2041c0 = _0x2fcf40.openModal({
      title: _0x1942b8.title || 'Select chats',
      width: 560,
      onClose: () => _0x52d18c(null),
      body: h(
        'div',
        {
          class: 'wc-stack',
        },
        _0x164322 ? _0x164322.el : null,
        h(
          'div',
          {
            class: 'wc-toolbar',
          },
          _0x1f0228,
          _0x50d189,
        ),
        h(
          'div',
          {
            class: 'wc-inline',
          },
          _0x5c6970,
          _0x1942b8.single
            ? null
            : _0x2fcf40.button('Select all shown', {
                size: 'sm',
                onClick: () => {
                  _0x2e15a3().forEach((_0x26c345) =>
                    _0x4aa7cd.add(_0x26c345.id),
                  );
                  _0x2b0eb4();
                },
              }),
          _0x1942b8.single
            ? null
            : _0x2fcf40.button('Unselect shown', {
                size: 'sm',
                onClick: () => {
                  _0x2e15a3().forEach((_0x497c2c) =>
                    _0x4aa7cd.delete(_0x497c2c.id),
                  );
                  _0x2b0eb4();
                },
              }),
        ),
        _0x3b923d,
      ),
      footer: h(
        'div',
        {
          class: 'wc-modal-actions',
        },
        _0x2fcf40.button('Cancel', {
          variant: 'dark',
          onClick: () => _0x2041c0.close(),
        }),
        _0x2fcf40.button('Save', {
          variant: 'primary',
          onClick: () => {
            _0x52d18c(Array.from(_0x4aa7cd));
            _0x2041c0.close();
          },
        }),
      ),
    });
    _0xf1e762.wa
      .chatsForPicker()
      .then((_0x584cc5) => {
        _0x4a66a8 = _0x584cc5;
        _0x2b0eb4();
      })
      .catch((_0x2929eb) => {
        clear(_0x3b923d);
        _0x3b923d.appendChild(
          h(
            'div',
            {
              class: 'wc-muted wc-pad',
            },
            'Could not load chats: ' + _0x2929eb.message,
          ),
        );
      });
  });
}
export function numbersEditor(
  _0x4d1b45,
  { value: _0x47e4c9, onChange: _0x54282a, placeholder: _0x5e0583 },
) {
  let _0x10e32f = (_0x47e4c9 || []).slice();
  const _0x40dbe7 = _0x2fcf40.textarea({
    rows: 5,
    placeholder:
      _0x5e0583 ||
      'One number per line, with country code.\nOptional name after a comma, for example:\n+1 555 010 0101, Riya Kapoor',
  });
  const _0xf23b88 = h(
    'span',
    {
      class: 'wc-muted',
    },
    '',
  );
  const _0x52f6b8 = h('div', {
    class: 'wc-taglist',
  });
  function _0x54f347() {
    return _0x10e32f
      .filter((_0x335ed1) => !_0x335ed1.chatId || _0x335ed1.phone)
      .map(
        (_0x1b9a9e) =>
          _0x1b9a9e.phone + (_0x1b9a9e.name ? ', ' + _0x1b9a9e.name : ''),
      )
      .join('\n');
  }
  function _0x1c8bab() {
    const _0x23883d = _0x10e32f.filter(
      (_0x1cae1b) => _0x1cae1b.chatId && !_0x1cae1b.phone,
    );
    const _0x1354cf = parseNumbers(_0x40dbe7.value);
    _0x10e32f = _0x23883d.concat(_0x1354cf);
    _0xf23b88.textContent = _0x10e32f.length
      ? _0x10e32f.length + ' recipient' + (_0x10e32f.length === 1 ? '' : 's')
      : '';
    _0x54282a(_0x10e32f.slice());
  }
  function _0x56360b() {
    clear(_0x52f6b8);
    _0x10e32f
      .filter((_0x1e8251) => _0x1e8251.chatId && !_0x1e8251.phone)
      .forEach((_0x21ea3c) =>
        _0x52f6b8.appendChild(
          h(
            'span',
            {
              class: 'wc-tagchip',
            },
            _0x21ea3c.name || _0x21ea3c.chatId,
            h(
              'button',
              {
                type: 'button',
                'aria-label': 'Remove',
                onClick: () => {
                  _0x10e32f = _0x10e32f.filter(
                    (_0x236eed) => _0x236eed !== _0x21ea3c,
                  );
                  _0x56360b();
                  _0x1c8bab();
                },
              },
              icon('x', 12),
            ),
          ),
        ),
      );
  }
  _0x40dbe7.value = _0x54f347();
  _0x40dbe7.addEventListener('input', _0x1c8bab);
  _0xf23b88.textContent = _0x10e32f.length
    ? _0x10e32f.length + ' recipient' + (_0x10e32f.length === 1 ? '' : 's')
    : '';
  _0x56360b();
  const _0x423007 = h(
    'div',
    {
      class: 'wc-stack',
    },
    _0x40dbe7,
    _0x52f6b8,
    h(
      'div',
      {
        class: 'wc-inline',
      },
      _0x2fcf40.button('Pick from my chats', {
        icon: 'users',
        size: 'sm',
        onClick: async () => {
          const _0x1c82df = await pickChats(_0x4d1b45, {
            title: 'Add recipients',
            groups: false,
            selected: _0x10e32f
              .filter((_0x53599e) => _0x53599e.chatId)
              .map((_0x1fbbe5) => _0x1fbbe5.chatId),
          });
          if (!_0x1c82df) {
            return;
          }
          const _0x50767e = _0x10e32f.filter((_0x1f8546) => !_0x1f8546.chatId);
          const _0x990151 = _0x1c82df
            .map((_0x148a17) => _0x4d1b45.wa.chatById(_0x148a17))
            .filter(Boolean);
          _0x10e32f = _0x50767e.concat(
            _0x990151.map((_0xd851fd) =>
              _0xd851fd.phone
                ? {
                    phone: _0xd851fd.phone,
                    name: _0xd851fd.name,
                    chatId: _0xd851fd.id,
                  }
                : {
                    chatId: _0xd851fd.id,
                    name: _0xd851fd.name,
                    phone: '',
                  },
            ),
          );
          _0x40dbe7.value = _0x54f347();
          _0x56360b();
          _0x1c8bab();
        },
      }),
      _0x2fcf40.button('Upload CSV or text file', {
        icon: 'file-up',
        size: 'sm',
        onClick: async () => {
          const [_0x575294] = await _0x2fcf40.pickFiles(
            '.csv,.txt,text/csv,text/plain',
            false,
          );
          if (!_0x575294) {
            return;
          }
          const _0x268ae9 = await _0x575294.text();
          const _0x445df3 = parseNumbers(_0x268ae9);
          if (!_0x445df3.length) {
            _0x2fcf40.toast('No phone numbers found in that file.', 'error');
            return;
          }
          _0x40dbe7.value =
            (_0x40dbe7.value ? _0x40dbe7.value.trim() + '\n' : '') +
            _0x445df3
              .map(
                (_0x4fd689) =>
                  _0x4fd689.phone +
                  (_0x4fd689.name ? ', ' + _0x4fd689.name : ''),
              )
              .join('\n');
          _0x1c8bab();
          _0x2fcf40.toast(
            'Imported ' +
              _0x445df3.length +
              ' number' +
              (_0x445df3.length === 1 ? '' : 's') +
              '.',
            'success',
          );
        },
      }),
      _0xf23b88,
    ),
  );
  _0x423007.getValue = () => _0x10e32f.slice();
  return _0x423007;
}
export function postActionsEditor(_0x2cf107, _0x10fcc8, _0x542a98 = {}) {
  const _0x509bbb = Object.assign(emptyActions(), _0x10fcc8 || {});
  const _0x3d3b91 = () => _0x542a98.onChange && _0x542a98.onChange(_0x509bbb);
  const _0x18ce92 = _0x2cf107.crm.tags().map((_0x2d5f5e) => ({
    value: _0x2d5f5e.id,
    label: _0x2d5f5e.name,
    color: _0x2d5f5e.color,
  }));
  const _0x47eb45 = _0x2cf107.crm.tabs().map((_0x37610f) => ({
    value: _0x37610f.id,
    label: _0x37610f.title,
  }));
  const _0x21a819 = _0x2cf107.crm.stageOptions();
  const _0x3e9aa9 = _0x2cf107.store.all('webhooks').map((_0x5261a0) => ({
    value: _0x5261a0.id,
    label: _0x5261a0.name,
  }));
  const _0x6ab072 = _0x2fcf40.multiSelect({
    options: [],
    value: _0x509bbb.groupAdd,
    placeholder: 'Loading groups...',
    onChange: (_0x5404fc) => {
      _0x509bbb.groupAdd = _0x5404fc;
      _0x3d3b91();
    },
  });
  const _0x22fc4c = _0x2fcf40.multiSelect({
    options: [],
    value: _0x509bbb.groupRemove,
    placeholder: 'Loading groups...',
    onChange: (_0x386fdb) => {
      _0x509bbb.groupRemove = _0x386fdb;
      _0x3d3b91();
    },
  });
  const _0x3ae5d4 = _0x2fcf40.multiSelect({
    options: [],
    value: _0x509bbb.labelAdd,
    placeholder: 'Loading labels...',
    onChange: (_0x6ef884) => {
      _0x509bbb.labelAdd = _0x6ef884;
      _0x3d3b91();
    },
  });
  const _0x40979e = _0x2fcf40.multiSelect({
    options: [],
    value: _0x509bbb.labelRemove,
    placeholder: 'Loading labels...',
    onChange: (_0x553f34) => {
      _0x509bbb.labelRemove = _0x553f34;
      _0x3d3b91();
    },
  });
  if (_0x542a98.groups !== false) {
    _0x2cf107.wa
      .groups()
      .then((_0x49823e) => {
        const _0x3e85ee = _0x49823e.map((_0x3d242e) => ({
          value: _0x3d242e.id,
          label: _0x3d242e.name,
        }));
        _0x6ab072.setOptions(_0x3e85ee);
        _0x22fc4c.setOptions(_0x3e85ee);
      })
      .catch(() => {
        _0x6ab072.setOptions([]);
        _0x22fc4c.setOptions([]);
      });
  }
  if (_0x542a98.labels !== false) {
    _0x2cf107.wa
      .labels()
      .then((_0x4df875) => {
        const _0x5cdcf6 = _0x4df875.map((_0x2e6614) => ({
          value: _0x2e6614.id,
          label: _0x2e6614.name,
          color: _0x2e6614.color,
        }));
        _0x3ae5d4.setOptions(_0x5cdcf6);
        _0x40979e.setOptions(_0x5cdcf6);
      })
      .catch(() => {
        _0x3ae5d4.setOptions([]);
        _0x40979e.setOptions([]);
      });
  }
  const _0x1f652c = (_0x2c0372, _0x741e45, _0x17376f) =>
    _0x2fcf40.multiSelect({
      options: _0x2c0372,
      value: _0x509bbb[_0x741e45],
      placeholder: _0x17376f,
      onChange: (_0x57a50c) => {
        _0x509bbb[_0x741e45] = _0x57a50c;
        _0x3d3b91();
      },
    });
  const _0x118166 = (_0x77a65a, _0x6dcd31) =>
    _0x2fcf40.multiSelect({
      single: true,
      options: [
        {
          value: '',
          label: 'Do nothing',
        },
      ].concat(_0x21a819),
      value: _0x509bbb[_0x77a65a],
      placeholder: _0x6dcd31,
      onChange: (_0x592f28) => {
        _0x509bbb[_0x77a65a] = _0x592f28;
        _0x3d3b91();
      },
    });
  const _0x161aa0 = [
    _0x2fcf40.section('CRM tags', [
      _0x2fcf40.row(
        _0x2fcf40.field(
          'Add tags',
          _0x1f652c(_0x18ce92, 'tagAdd', 'Select tags'),
        ),
        _0x2fcf40.field(
          'Remove tags',
          _0x1f652c(_0x18ce92, 'tagRemove', 'Select tags'),
        ),
      ),
    ]),
    _0x2fcf40.section('Custom tabs', [
      _0x2fcf40.row(
        _0x2fcf40.field(
          'Add chat to tabs',
          _0x1f652c(_0x47eb45, 'tabAdd', 'Select tabs'),
        ),
        _0x2fcf40.field(
          'Remove chat from tabs',
          _0x1f652c(_0x47eb45, 'tabRemove', 'Select tabs'),
        ),
      ),
    ]),
  ];
  if (_0x542a98.kanban !== false) {
    _0x161aa0.push(
      _0x2fcf40.section('Kanban', [
        _0x2fcf40.row(
          _0x2fcf40.field(
            'Move to board',
            _0x118166('kanbanAdd', 'Pick a board'),
          ),
          _0x2fcf40.field(
            'Remove from board',
            _0x118166('kanbanRemove', 'Pick a board'),
          ),
        ),
      ]),
    );
  }
  if (_0x542a98.groups !== false) {
    _0x161aa0.push(
      _0x2fcf40.section('Groups', [
        _0x2fcf40.banner(
          'You must be an admin of a group to add or remove people.',
          'info',
        ),
        _0x2fcf40.row(
          _0x2fcf40.field('Add contact to groups', _0x6ab072),
          _0x2fcf40.field('Remove contact from groups', _0x22fc4c),
        ),
      ]),
    );
  }
  if (_0x542a98.labels !== false) {
    _0x161aa0.push(
      _0x2fcf40.section('WhatsApp labels', [
        _0x2fcf40.banner('Labels are available on WhatsApp Business.', 'info'),
        _0x2fcf40.row(
          _0x2fcf40.field('Add labels', _0x3ae5d4),
          _0x2fcf40.field('Remove labels', _0x40979e),
        ),
      ]),
    );
  }
  _0x161aa0.push(
    _0x2fcf40.section('Chat', [
      _0x2fcf40.row(
        _0x2fcf40.field(
          'Archive',
          _0x2fcf40.select(
            [
              {
                value: '',
                label: 'Leave as it is',
              },
              {
                value: 'archive',
                label: 'Archive the chat',
              },
              {
                value: 'unarchive',
                label: 'Unarchive the chat',
              },
            ],
            _0x509bbb.archive,
            (_0x3dd2be) => {
              _0x509bbb.archive = _0x3dd2be;
              _0x3d3b91();
            },
          ),
        ),
        _0x2fcf40.field(
          'Block',
          h(
            'div',
            {
              class: 'wc-field-pad',
            },
            _0x2fcf40.toggle(
              _0x509bbb.block,
              (_0x55dd83) => {
                _0x509bbb.block = _0x55dd83;
                _0x3d3b91();
              },
              'Block the contact',
            ),
          ),
        ),
      ),
    ]),
  );
  if (_0x542a98.webhooks !== false) {
    _0x161aa0.push(
      _0x2fcf40.section('Webhooks', [
        _0x2fcf40.field(
          'Send to these webhooks',
          _0x1f652c(
            _0x3e9aa9,
            'webhooks',
            _0x3e9aa9.length ? 'Select webhooks' : 'No webhooks yet',
          ),
        ),
      ]),
    );
  }
  return h(
    'div',
    {
      class: 'wc-stack wc-post',
    },
    _0x161aa0,
  );
}
export function chatSelect(
  _0x3ab030,
  {
    value: _0x41f89e,
    onChange: _0x2a7a0a,
    placeholder: _0xbfce69,
    groups = true,
    extra = [],
  },
) {
  const _0x4c7054 = _0x2fcf40.multiSelect({
    single: true,
    value: _0x41f89e || '',
    placeholder: _0xbfce69 || 'Select a contact',
    options: extra.slice(),
    onChange: _0x2a7a0a,
  });
  _0x3ab030.wa
    .chatsForPicker()
    .then((_0x50b2c1) => {
      const _0x50220c = _0x50b2c1
        .filter(
          (_0x5e71a2) =>
            !_0x5e71a2.isBroadcast &&
            !_0x5e71a2.isNewsletter &&
            (groups || !_0x5e71a2.isGroup),
        )
        .map((_0x2e45be) => ({
          value: _0x2e45be.id,
          label: _0x2e45be.name || _0x2e45be.phone,
          hint: _0x2e45be.isGroup
            ? 'Group'
            : _0x2e45be.phone
              ? '+' + _0x2e45be.phone
              : '',
        }));
      const _0x38a0e2 = new Set(_0x50220c.map((_0x341883) => _0x341883.value));
      _0x4c7054.setOptions(
        extra
          .filter((_0x3b02e0) => !_0x38a0e2.has(_0x3b02e0.value))
          .concat(_0x50220c),
      );
    })
    .catch(() => {});
  return _0x4c7054;
}
