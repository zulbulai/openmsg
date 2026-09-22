import { h, icon, clear } from '../ui/dom.js';
import * as _0x1fdf2d from '../ui/kit.js';
import { chatSelect } from '../ui/pickers.js';
import {
  fmtDateTime,
  relTime,
  download,
  digits,
  betterName,
} from '../core/util.js';
import {
  CAMPAIGN_STATUS,
  isScheduled,
  reachesChat,
} from '../core/scheduler.js';
export function openNoteModal(
  _0x5c8528,
  { chatId: _0x3bb368, note: _0x3c0e9e },
) {
  const _0x2055dc = Object.assign(
    {
      chatId: _0x3bb368 || '',
      title: '',
      text: '',
    },
    _0x3c0e9e || {},
  );
  const _0x3fd576 = _0x1fdf2d.input({
    value: _0x2055dc.title,
    placeholder: 'Enter note title',
    onInput: (_0x3c7dfd) => {
      _0x2055dc.title = _0x3c7dfd;
    },
  });
  const _0x12b7d9 = _0x1fdf2d.textarea({
    value: _0x2055dc.text,
    rows: 6,
    placeholder: 'Enter note content',
    onInput: (_0x38d189) => {
      _0x2055dc.text = _0x38d189;
    },
  });
  const _0x3de7aa = _0x3bb368
    ? null
    : chatSelect(_0x5c8528, {
        value: _0x2055dc.chatId,
        placeholder: 'Select a contact',
        onChange: (_0x3e93b5) => {
          _0x2055dc.chatId = _0x3e93b5;
        },
      });
  const _0x5c008a = h('div', {
    class: 'wc-field-error',
  });
  const _0x15dfe6 = _0x1fdf2d.openModal({
    title: _0x3c0e9e ? 'Edit note' : 'Add note',
    width: 520,
    body: h(
      'div',
      {
        class: 'wc-form',
      },
      _0x3de7aa
        ? _0x1fdf2d.field('Add note for', _0x3de7aa, {
            required: true,
          })
        : null,
      _0x1fdf2d.field('Title', _0x3fd576, {
        required: true,
      }),
      _0x1fdf2d.field('Notes', _0x12b7d9, {
        required: true,
      }),
      _0x5c008a,
    ),
    footer: h(
      'div',
      {
        class: 'wc-modal-actions',
      },
      _0x1fdf2d.button('Cancel', {
        variant: 'dark',
        onClick: () => _0x15dfe6.close(),
      }),
      _0x1fdf2d.button('Save', {
        variant: 'primary',
        onClick: async () => {
          try {
            await _0x5c8528.crm.saveNote(_0x2055dc);
            _0x15dfe6.close();
            _0x1fdf2d.toast('Note saved', 'success');
          } catch (_0x4de14f) {
            _0x5c008a.textContent = _0x4de14f.message;
          }
        },
      }),
    ),
  });
  _0x3fd576.focus();
  return _0x15dfe6;
}
export function openReminderModal(
  _0x2036b5,
  { chatId: _0x302b0f, reminder: _0xcb329a },
) {
  const _0x1e208b = Object.assign(
    {
      chatId: _0x302b0f || '',
      title: '',
      details: '',
      at: Date.now() + 3600000,
    },
    _0xcb329a || {},
  );
  if (!_0xcb329a && _0x302b0f) {
    _0x1e208b.title = 'Reminder for ' + _0x2036b5.crm.displayName(_0x302b0f);
  }
  const _0x5b12e1 = _0x302b0f
    ? null
    : chatSelect(_0x2036b5, {
        value: _0x1e208b.chatId,
        onChange: (_0x407984) => {
          _0x1e208b.chatId = _0x407984;
        },
      });
  const _0x54f425 = h('div', {
    class: 'wc-field-error',
  });
  const _0x54fd56 = _0x1fdf2d.openModal({
    title: _0xcb329a ? 'Edit reminder' : 'Add reminder',
    width: 520,
    body: h(
      'div',
      {
        class: 'wc-form',
      },
      _0x5b12e1
        ? _0x1fdf2d.field('Reminder for', _0x5b12e1, {
            required: true,
          })
        : null,
      _0x1fdf2d.field(
        'Title',
        _0x1fdf2d.input({
          value: _0x1e208b.title,
          placeholder: 'Enter reminder title',
          onInput: (_0x528bc0) => {
            _0x1e208b.title = _0x528bc0;
          },
        }),
        {
          required: true,
        },
      ),
      _0x1fdf2d.field(
        'Details',
        _0x1fdf2d.textarea({
          value: _0x1e208b.details,
          rows: 3,
          placeholder: 'Enter details (optional)',
          onInput: (_0x26be2b) => {
            _0x1e208b.details = _0x26be2b;
          },
        }),
      ),
      _0x1fdf2d.field(
        'Remind me on',
        _0x1fdf2d.datetimeInput(_0x1e208b.at, (_0x4a7f2b) => {
          _0x1e208b.at = _0x4a7f2b;
        }),
        {
          required: true,
        },
      ),
      _0x54f425,
    ),
    footer: h(
      'div',
      {
        class: 'wc-modal-actions',
      },
      _0x1fdf2d.button('Discard', {
        variant: 'dark',
        onClick: () => _0x54fd56.close(),
      }),
      _0x1fdf2d.button('Save', {
        variant: 'primary',
        onClick: async () => {
          try {
            await _0x2036b5.crm.saveReminder(
              Object.assign(
                {},
                _0x1e208b,
                _0xcb329a && _0xcb329a.at !== _0x1e208b.at
                  ? {
                      status: undefined,
                      notified: false,
                    }
                  : {},
              ),
            );
            _0x54fd56.close();
            _0x1fdf2d.toast('Reminder saved', 'success');
          } catch (_0x26f150) {
            _0x54f425.textContent = _0x26f150.message;
          }
        },
      }),
    ),
  });
  return _0x54fd56;
}
const REMINDER_TONE = {
  pending: 'neutral',
  unread: 'warn',
  missed: 'danger',
  read: 'ok',
};
export function reminderChip(_0x2dda16) {
  return _0x1fdf2d.chip(
    _0x2dda16.charAt(0).toUpperCase() + _0x2dda16.slice(1),
    REMINDER_TONE[_0x2dda16] || 'neutral',
  );
}
export function createCrmDrawer(_0x118457, _0x1ab5c3) {
  const _0x2bddc3 = _0x1ab5c3.elements.crm;
  let _0x55d58f = null;
  let _0x55cf33 = 'profile';
  let _0x3b667a = [];
  function _0xc88172() {
    _0x2bddc3.hidden = true;
    _0x3b667a.forEach((_0x1ae5fa) => _0x1ae5fa());
    _0x3b667a = [];
    _0x1ab5c3.crmChanged(false);
  }
  function _0x1e2ca0(_0x1fa16f) {
    const _0x4b19a1 = _0x118457.wa.chatById(_0x1fa16f) || {};
    const _0x386b12 = _0x118457.crm.displayName(_0x1fa16f);
    const _0x3d8edd = _0x118457.chatbots.sessionFor(_0x1fa16f);
    const _0x566e08 = _0x118457.crm.contact(_0x1fa16f);
    const _0x54f84c = /@g\.us$/.test(_0x1fa16f);
    return h(
      'header',
      {
        class: 'wc-drawer-head',
      },
      _0x1fdf2d.avatar(_0x386b12, 44),
      h(
        'div',
        {
          class: 'wc-drawer-who',
        },
        h('strong', null, _0x386b12),
        h(
          'span',
          {
            class: 'wc-inline',
          },
          _0x54f84c ? 'Group' : _0x4b19a1.phone ? '+' + _0x4b19a1.phone : '',
          _0x4b19a1.phone
            ? _0x1fdf2d.iconButton('copy', 'Copy phone number', () => {
                navigator.clipboard
                  .writeText('+' + _0x4b19a1.phone)
                  .then(() =>
                    _0x1fdf2d.toast('Phone number copied', 'success'),
                  );
              })
            : null,
        ),
      ),
      _0x1fdf2d.iconButton('sliders-horizontal', 'Chat tools', (_0xa0e5b4) =>
        _0x1fdf2d.openMenu(_0xa0e5b4.currentTarget, [
          _0x3d8edd
            ? {
                label: 'Stop chatbot for this chat',
                icon: 'circle-stop',
                onClick: async () => {
                  await _0x118457.chatbots.stop(_0x1fa16f);
                  _0x1fdf2d.toast('Chatbot stopped', 'success');
                  _0x515f89();
                },
              }
            : {
                label: 'Start a chatbot in this chat',
                icon: 'bot',
                disabled: _0x54f84c,
                onClick: () => _0x298598(_0xa0e5b4.currentTarget),
              },
          {
            label: _0x566e08.aiOff
              ? 'Turn AI Assistant on for this chat'
              : 'Turn AI Assistant off for this chat',
            icon: 'sparkles',
            onClick: async () => {
              await _0x118457.assistant.setChatEnabled(
                _0x1fa16f,
                !!_0x566e08.aiOff,
              );
              _0x515f89();
            },
          },
          {
            label: _0x566e08.botPaused
              ? 'Resume bots for this chat'
              : 'Pause all bots for this chat',
            icon: _0x566e08.botPaused ? 'play' : 'pause',
            onClick: async () => {
              await _0x118457.crm.saveContact(_0x1fa16f, {
                botPaused: !_0x566e08.botPaused,
              });
              _0x515f89();
            },
          },
          {
            divider: true,
          },
          {
            label: 'Open chat in WhatsApp',
            icon: 'message-circle',
            onClick: () =>
              _0x118457.wa
                .openChat(_0x1fa16f)
                .catch((_0x128f68) =>
                  _0x1fdf2d.toast(_0x128f68.message, 'error'),
                ),
          },
          {
            label: 'Export chat as text',
            icon: 'file-down',
            onClick: () => _0x400f1d(_0x1fa16f, _0x386b12),
          },
        ]),
      ),
      _0x1fdf2d.iconButton('x', 'Close', _0xc88172),
    );
  }
  async function _0x400f1d(_0x5e9957, _0x2edc38) {
    try {
      const _0x388a47 = await _0x118457.wa.messages(_0x5e9957, {
        count: 500,
      });
      const _0x15e510 = _0x388a47.map(
        (_0x3622d4) =>
          '[' +
          new Date(_0x3622d4.t * 1000).toLocaleString() +
          '] ' +
          (_0x3622d4.fromMe ? 'Me' : _0x3622d4.name || _0x2edc38) +
          ': ' +
          (_0x3622d4.body || '[' + _0x3622d4.type + ']'),
      );
      download(
        'chat-' +
          (digits(_0x2edc38) || _0x2edc38.replace(/\W+/g, '-')) +
          '.txt',
        _0x15e510.join('\n'),
      );
    } catch (_0x1f6432) {
      _0x1fdf2d.toast('Could not export: ' + _0x1f6432.message, 'error');
    }
  }
  function _0x298598(_0x647ace) {
    const _0x38b363 = _0x118457.store
      .all('chatbots')
      .filter((_0x2486ae) => _0x2486ae.published);
    if (!_0x38b363.length) {
      _0x1fdf2d.toast('Publish a chatbot first in Chatbot Flows.', 'info');
      return;
    }
    _0x1fdf2d.openMenu(
      _0x647ace,
      _0x38b363.map((_0x2fe361) => ({
        label: _0x2fe361.name,
        icon: 'bot',
        onClick: async () => {
          await _0x118457.chatbots.start(_0x2fe361, _0x55d58f, {
            body: 'manual',
            chatId: _0x55d58f,
          });
          _0x1fdf2d.toast('"' + _0x2fe361.name + '" started', 'success');
          _0x515f89();
        },
      })),
      {
        align: 'start',
      },
    );
  }
  function _0x2e35e0() {
    const _0x21de5f = _0x118457.crm.contact(_0x55d58f);
    const _0x58be1d = _0x118457.wa.chatById(_0x55d58f) || {};
    const _0x3a2244 = {
      fullName: betterName(_0x21de5f.fullName, _0x58be1d.name),
      email: _0x21de5f.email || '',
      gender: _0x21de5f.gender || '',
      birthDate: _0x21de5f.birthDate || '',
      details: _0x21de5f.details || '',
      address: _0x21de5f.address || '',
      tagIds: (_0x21de5f.tagIds || []).slice(),
      attributes: Object.assign({}, _0x21de5f.attributes),
    };
    const _0xc03437 = _0x118457.crm.dashboards();
    const _0x54ebbe = _0xc03437.map((_0x3c1b81) => {
      const _0x557ba5 =
        (_0x118457.crm.cardFor(_0x55d58f, _0x3c1b81.id) || {}).stageId || '';
      const _0x8dd1d = _0x1fdf2d.select(
        [
          {
            value: '',
            label: 'Not on a board',
          },
        ].concat(
          _0x118457.crm.stages(_0x3c1b81.id).map((_0x45f553) => ({
            value: _0x45f553.id,
            label: _0x45f553.name,
          })),
        ),
        _0x557ba5,
        async (_0x7ed228) => {
          try {
            if (_0x7ed228) {
              await _0x118457.crm.assign(_0x55d58f, _0x7ed228);
            } else {
              await _0x118457.crm.unassign(_0x55d58f, _0x3c1b81.id);
            }
            _0x1fdf2d.toast('Board updated', 'success');
          } catch (_0x3b1686) {
            _0x1fdf2d.toast(_0x3b1686.message, 'error');
          }
        },
      );
      return _0x1fdf2d.field(
        _0xc03437.length > 1 ? 'Board: ' + _0x3c1b81.name : 'Board',
        _0x8dd1d,
      );
    });
    const _0x1312e6 = _0x1fdf2d.multiSelect({
      options: _0x118457.crm.tags().map((_0x240570) => ({
        value: _0x240570.id,
        label: _0x240570.name,
        color: _0x240570.color,
      })),
      value: _0x3a2244.tagIds,
      placeholder: 'Select tags',
      onChange: (_0x4fbde9) => {
        _0x3a2244.tagIds = _0x4fbde9;
      },
    });
    const _0x17ace9 = _0x118457.crm.fields().map((_0x21c24c) => {
      const _0x4b3c9a = _0x3a2244.attributes[_0x21c24c.key];
      let _0x3413db;
      if (_0x21c24c.type === 'number') {
        _0x3413db = _0x1fdf2d.input({
          type: 'number',
          value: _0x4b3c9a === undefined ? '' : _0x4b3c9a,
          onInput: (_0x47624d) => {
            _0x3a2244.attributes[_0x21c24c.key] = _0x47624d;
          },
        });
      } else if (_0x21c24c.type === 'date') {
        _0x3413db = _0x1fdf2d.input({
          type: 'date',
          value: _0x4b3c9a || '',
          onInput: (_0x529ee3) => {
            _0x3a2244.attributes[_0x21c24c.key] = _0x529ee3;
          },
        });
      } else if (_0x21c24c.type === 'select') {
        _0x3413db = _0x1fdf2d.select(
          [
            {
              value: '',
              label: 'Select...',
            },
          ].concat(
            (_0x21c24c.options || []).map((_0x407053) => ({
              value: _0x407053,
              label: _0x407053,
            })),
          ),
          _0x4b3c9a || '',
          (_0x3947ca) => {
            _0x3a2244.attributes[_0x21c24c.key] = _0x3947ca;
          },
        );
      } else if (_0x21c24c.type === 'multiselect') {
        _0x3413db = _0x1fdf2d.multiSelect({
          options: (_0x21c24c.options || []).map((_0x4a958d) => ({
            value: _0x4a958d,
            label: _0x4a958d,
          })),
          value: Array.isArray(_0x4b3c9a) ? _0x4b3c9a : [],
          placeholder: 'Select',
          onChange: (_0xd6acd) => {
            _0x3a2244.attributes[_0x21c24c.key] = _0xd6acd;
          },
        });
      } else {
        _0x3413db = _0x1fdf2d.input({
          value: _0x4b3c9a || '',
          onInput: (_0x11526c) => {
            _0x3a2244.attributes[_0x21c24c.key] = _0x11526c;
          },
        });
      }
      return _0x1fdf2d.field(_0x21c24c.label, _0x3413db);
    });
    return h(
      'div',
      {
        class: 'wc-form',
      },
      _0x1fdf2d.field(
        'Full name',
        _0x1fdf2d.input({
          value: _0x3a2244.fullName,
          placeholder: 'Enter name',
          onInput: (_0x179197) => {
            _0x3a2244.fullName = _0x179197;
          },
        }),
      ),
      _0x1fdf2d.row(
        _0x1fdf2d.field(
          'Email',
          _0x1fdf2d.input({
            type: 'email',
            value: _0x3a2244.email,
            placeholder: 'Enter email',
            onInput: (_0x479bfb) => {
              _0x3a2244.email = _0x479bfb;
            },
          }),
        ),
        _0x1fdf2d.field(
          'Phone',
          _0x1fdf2d.input({
            value: _0x58be1d.phone ? '+' + _0x58be1d.phone : '',
            disabled: true,
          }),
        ),
      ),
      _0x1fdf2d.row(
        _0x1fdf2d.field(
          'Gender',
          _0x1fdf2d.select(
            [
              {
                value: '',
                label: 'Not set',
              },
              {
                value: 'male',
                label: 'Male',
              },
              {
                value: 'female',
                label: 'Female',
              },
              {
                value: 'other',
                label: 'Other',
              },
            ],
            _0x3a2244.gender,
            (_0xa7c92e) => {
              _0x3a2244.gender = _0xa7c92e;
            },
          ),
        ),
        _0x1fdf2d.field(
          'Birth date',
          _0x1fdf2d.input({
            type: 'date',
            value: _0x3a2244.birthDate,
            onInput: (_0xede141) => {
              _0x3a2244.birthDate = _0xede141;
            },
          }),
        ),
      ),
      _0x54ebbe,
      _0x1fdf2d.field('Tags', _0x1312e6),
      _0x1fdf2d.field(
        'Details',
        _0x1fdf2d.textarea({
          value: _0x3a2244.details,
          rows: 3,
          onInput: (_0x3481f2) => {
            _0x3a2244.details = _0x3481f2;
          },
        }),
      ),
      _0x1fdf2d.field(
        'Address',
        _0x1fdf2d.textarea({
          value: _0x3a2244.address,
          rows: 2,
          onInput: (_0xbc02df) => {
            _0x3a2244.address = _0xbc02df;
          },
        }),
      ),
      _0x17ace9.length
        ? h(
            'div',
            {
              class: 'wc-stack',
            },
            h(
              'div',
              {
                class: 'wc-section-title',
              },
              'Custom fields',
            ),
            _0x17ace9,
          )
        : null,
      h(
        'div',
        {
          class: 'wc-inline',
        },
        _0x1fdf2d.button('Save profile', {
          variant: 'primary',
          icon: 'save',
          onClick: async () => {
            const _0x51c433 = new Set(_0x21de5f.tagIds || []);
            await _0x118457.crm.saveContact(_0x55d58f, {
              fullName: _0x3a2244.fullName,
              email: _0x3a2244.email,
              gender: _0x3a2244.gender,
              birthDate: _0x3a2244.birthDate,
              details: _0x3a2244.details,
              address: _0x3a2244.address,
              attributes: _0x3a2244.attributes,
            });
            const _0x38a971 = _0x3a2244.tagIds.filter(
              (_0x18e4e2) => !_0x51c433.has(_0x18e4e2),
            );
            const _0x4dd793 = Array.from(_0x51c433).filter(
              (_0x47ef88) => !_0x3a2244.tagIds.includes(_0x47ef88),
            );
            if (_0x38a971.length) {
              await _0x118457.crm.addTags(_0x55d58f, _0x38a971);
            }
            if (_0x4dd793.length) {
              await _0x118457.crm.removeTags(_0x55d58f, _0x4dd793);
            }
            _0x1fdf2d.toast('Profile saved', 'success');
          },
        }),
        _0x1fdf2d.button('Manage tags and fields', {
          icon: 'settings-2',
          onClick: () => _0x1ab5c3.openPanel('crm-settings'),
        }),
      ),
    );
  }
  function _0x48cd95() {
    const _0x3d4b85 = _0x118457.crm.tabs();
    if (!_0x3d4b85.length) {
      return _0x1fdf2d.emptyState(
        'folders',
        'No tabs yet',
        'Create custom tabs to group chats.',
        _0x1fdf2d.button('Create a tab', {
          variant: 'primary',
          onClick: () => _0x1ab5c3.openPanel('tabs'),
        }),
      );
    }
    return h(
      'div',
      {
        class: 'wc-stack',
      },
      h(
        'div',
        {
          class: 'wc-list wc-card wc-card-flush',
        },
        _0x3d4b85.map((_0x3364dc) => {
          const _0x3a30a9 = (_0x3364dc.members || []).includes(_0x55d58f);
          return h(
            'div',
            {
              class: 'wc-list-row',
            },
            h(
              'div',
              {
                class: 'wc-list-main',
              },
              h('strong', null, _0x3364dc.title),
              _0x3364dc.details ? h('span', null, _0x3364dc.details) : null,
            ),
            _0x1fdf2d.toggle(
              _0x3a30a9,
              async (_0x3d72cc) => {
                if (_0x3d72cc) {
                  await _0x118457.crm.addToTabs([_0x3364dc.id], [_0x55d58f]);
                } else {
                  await _0x118457.crm.removeFromTabs(
                    [_0x3364dc.id],
                    [_0x55d58f],
                  );
                }
              },
              'In ' + _0x3364dc.title,
            ),
          );
        }),
      ),
      _0x1fdf2d.button('Manage tabs', {
        icon: 'settings-2',
        onClick: () => _0x1ab5c3.openPanel('tabs'),
      }),
    );
  }
  function _0x38279a() {
    const _0x5f414b = _0x118457.store.filter(
      'campaigns',
      (_0x2fd186) =>
        isScheduled(_0x2fd186) && reachesChat(_0x2fd186, _0x55d58f),
    );
    return h(
      'div',
      {
        class: 'wc-stack',
      },
      _0x1fdf2d.button('Add schedule', {
        icon: 'plus',
        variant: 'primary',
        onClick: () =>
          _0x1ab5c3.openPanel('schedules', {
            chatId: _0x55d58f,
            create: true,
          }),
      }),
      _0x5f414b.length
        ? h(
            'div',
            {
              class: 'wc-card wc-card-flush wc-list',
            },
            _0x5f414b.map((_0xf386cc) =>
              h(
                'div',
                {
                  class: 'wc-list-row',
                },
                h(
                  'div',
                  {
                    class: 'wc-list-main',
                  },
                  h('strong', null, _0xf386cc.name),
                  h(
                    'span',
                    null,
                    (_0xf386cc.kind === 'broadcast' ? 'Broadcast · ' : '') +
                      (_0xf386cc.nextRunAt
                        ? fmtDateTime(_0xf386cc.nextRunAt)
                        : CAMPAIGN_STATUS[_0xf386cc.status]),
                  ),
                ),
                _0x1fdf2d.chip(
                  CAMPAIGN_STATUS[_0xf386cc.status],
                  _0xf386cc.status === 'pending' ? 'info' : 'neutral',
                ),
              ),
            ),
          )
        : _0x1fdf2d.emptyState(
            'calendar-clock',
            'No schedules yet',
            'Schedule a message to this chat.',
          ),
    );
  }
  function _0xec59fd() {
    const _0x57f963 = _0x118457.crm.notes(_0x55d58f);
    return h(
      'div',
      {
        class: 'wc-stack',
      },
      _0x1fdf2d.button('Add note', {
        icon: 'plus',
        variant: 'primary',
        onClick: () =>
          openNoteModal(_0x118457, {
            chatId: _0x55d58f,
          }),
      }),
      _0x57f963.length
        ? _0x57f963.map((_0x10abe4) =>
            h(
              'article',
              {
                class: 'wc-note wc-card',
              },
              h(
                'div',
                {
                  class: 'wc-note-head',
                },
                h(
                  'div',
                  null,
                  h('strong', null, _0x10abe4.title),
                  h('span', null, fmtDateTime(_0x10abe4.updatedAt)),
                ),
                h(
                  'div',
                  {
                    class: 'wc-row-actions',
                  },
                  _0x1fdf2d.iconButton('pencil', 'Edit', () =>
                    openNoteModal(_0x118457, {
                      chatId: _0x55d58f,
                      note: _0x10abe4,
                    }),
                  ),
                  _0x1fdf2d.iconButton(
                    'trash-2',
                    'Delete',
                    async () => {
                      if (
                        await _0x1fdf2d.confirmDialog('Delete this note?', {
                          danger: true,
                          confirmLabel: 'Delete',
                        })
                      ) {
                        _0x118457.crm.deleteNotes(_0x10abe4.id);
                      }
                    },
                    'is-danger',
                  ),
                ),
              ),
              h('p', null, _0x10abe4.text),
            ),
          )
        : _0x1fdf2d.emptyState('notebook-pen', 'No notes yet'),
    );
  }
  function _0x3da5aa() {
    const _0x9f4edd = _0x118457.crm.reminders(_0x55d58f);
    return h(
      'div',
      {
        class: 'wc-stack',
      },
      _0x1fdf2d.button('Add reminder', {
        icon: 'plus',
        variant: 'primary',
        onClick: () =>
          openReminderModal(_0x118457, {
            chatId: _0x55d58f,
          }),
      }),
      _0x9f4edd.length
        ? h(
            'div',
            {
              class: 'wc-card wc-card-flush wc-list',
            },
            _0x9f4edd.map((_0x23c984) =>
              h(
                'div',
                {
                  class: 'wc-list-row',
                },
                h(
                  'span',
                  {
                    class: 'wc-list-icon',
                  },
                  icon('bell', 16),
                ),
                h(
                  'div',
                  {
                    class: 'wc-list-main',
                  },
                  h('strong', null, _0x23c984.title),
                  h(
                    'span',
                    null,
                    fmtDateTime(_0x23c984.at) + ' · ' + relTime(_0x23c984.at),
                  ),
                ),
                reminderChip(_0x23c984.status),
                h(
                  'div',
                  {
                    class: 'wc-row-actions',
                  },
                  _0x23c984.status !== 'read'
                    ? _0x1fdf2d.iconButton('check', 'Mark as read', () =>
                        _0x118457.crm.markReminder(_0x23c984.id, 'read'),
                      )
                    : null,
                  _0x1fdf2d.iconButton('pencil', 'Edit', () =>
                    openReminderModal(_0x118457, {
                      chatId: _0x55d58f,
                      reminder: _0x23c984,
                    }),
                  ),
                  _0x1fdf2d.iconButton(
                    'trash-2',
                    'Delete',
                    () => _0x118457.crm.deleteReminders(_0x23c984.id),
                    'is-danger',
                  ),
                ),
              ),
            ),
          )
        : _0x1fdf2d.emptyState('bell-ring', 'No reminders yet'),
    );
  }
  function _0x111d07() {
    const _0x1bb65d = _0x118457.wa.chatById(_0x55d58f) || {};
    const _0x5e296a = _0x1bb65d.phone || '';
    const _0x7cd502 = _0x118457.reminders
      .appointments()
      .filter(
        (_0x589952) =>
          _0x589952.chatId === _0x55d58f ||
          (_0x5e296a && digits(_0x589952.customerPhone) === digits(_0x5e296a)),
      );
    return h(
      'div',
      {
        class: 'wc-stack',
      },
      _0x1fdf2d.button('Create appointment', {
        icon: 'plus',
        variant: 'primary',
        onClick: () =>
          _0x1ab5c3.openAppointment({
            chatId: _0x55d58f,
            customerName: _0x118457.crm.displayName(_0x55d58f),
            customerPhone: _0x5e296a ? '+' + _0x5e296a : '',
          }),
      }),
      _0x7cd502.length
        ? h(
            'div',
            {
              class: 'wc-card wc-card-flush wc-list',
            },
            _0x7cd502.map((_0x3d89a1) =>
              h(
                'div',
                {
                  class: 'wc-list-row',
                },
                h(
                  'span',
                  {
                    class: 'wc-list-icon',
                  },
                  icon('calendar-check', 16),
                ),
                h(
                  'div',
                  {
                    class: 'wc-list-main',
                  },
                  h('strong', null, _0x3d89a1.title),
                  h('span', null, fmtDateTime(_0x3d89a1.start)),
                ),
                _0x1fdf2d.chip(
                  _0x3d89a1.status,
                  _0x3d89a1.status === 'scheduled' ? 'info' : 'neutral',
                ),
                _0x1fdf2d.iconButton('pencil', 'Edit', () =>
                  _0x1ab5c3.openAppointment(_0x3d89a1),
                ),
              ),
            ),
          )
        : _0x1fdf2d.emptyState('calendar-check', 'No appointments yet'),
    );
  }
  const _0xbd2b91 = [
    {
      id: 'profile',
      label: 'Profile',
      icon: 'user-round',
      render: _0x2e35e0,
    },
    {
      id: 'tabs',
      label: 'Tabs',
      icon: 'folders',
      render: _0x48cd95,
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: 'calendar-clock',
      render: _0x38279a,
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: 'notebook-pen',
      render: _0xec59fd,
    },
    {
      id: 'reminders',
      label: 'Reminder',
      icon: 'bell',
      render: _0x3da5aa,
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: 'calendar-check',
      render: _0x111d07,
    },
  ];
  function _0x515f89() {
    if (!_0x55d58f) {
      return;
    }
    const _0xd3eacd = h('div', {
      class: 'wc-drawer-body',
    });
    const _0x3e106b =
      _0xbd2b91.find((_0x47889b) => _0x47889b.id === _0x55cf33) || _0xbd2b91[0];
    _0xd3eacd.appendChild(_0x3e106b.render());
    const _0x1730de = {
      notes: _0x118457.crm.notes(_0x55d58f).length,
      reminders: _0x118457.crm.reminders(_0x55d58f).length,
    };
    const _0x4494d8 = _0x1fdf2d.tabs(
      _0xbd2b91.map((_0x186839) => ({
        id: _0x186839.id,
        label: _0x186839.label,
        icon: _0x186839.icon,
        count: _0x1730de[_0x186839.id],
      })),
      _0x3e106b.id,
      (_0x2cb403) => {
        _0x55cf33 = _0x2cb403;
        _0x515f89();
      },
      'wc-tabs-scroll',
    );
    const _0x42706e = _0x2bddc3.querySelector('.wc-drawer-body');
    const _0x1f622d = _0x42706e ? _0x42706e.scrollTop : 0;
    clear(_0x2bddc3);
    _0x2bddc3.appendChild(_0x1e2ca0(_0x55d58f));
    _0x2bddc3.appendChild(
      h(
        'div',
        {
          class: 'wc-drawer-tabs',
        },
        _0x4494d8.el,
      ),
    );
    _0x2bddc3.appendChild(_0xd3eacd);
    if (_0x1f622d && _0x55cf33 === _0x3e106b.id) {
      _0xd3eacd.scrollTop = _0x1f622d;
    }
  }
  return {
    open(_0x46ef69, _0x2f8d2d) {
      _0x55d58f = _0x46ef69;
      if (_0x2f8d2d) {
        _0x55cf33 = _0x2f8d2d;
      }
      _0x3b667a.forEach((_0x2b325b) => _0x2b325b());
      const _0x2ad1e1 = () => {
        const _0x47e2b2 = _0x2bddc3.getRootNode().activeElement;
        return (
          _0x55cf33 === 'profile' &&
          _0x47e2b2 &&
          _0x2bddc3.contains(_0x47e2b2) &&
          /INPUT|TEXTAREA|SELECT/.test(_0x47e2b2.tagName)
        );
      };
      _0x3b667a = [
        'contacts',
        'notes',
        'reminders',
        'tabs',
        'kanbanCards',
        'tags',
        'fields',
        'appointments',
        'campaigns',
      ].map((_0x3f1383) =>
        _0x118457.store.on(_0x3f1383, () => {
          if (!_0x2bddc3.hidden && !_0x2ad1e1()) {
            _0x515f89();
          }
        }),
      );
      _0x2bddc3.hidden = false;
      _0x515f89();
      _0x1ab5c3.crmChanged(true);
    },
    close: _0xc88172,
    isOpen: () => !_0x2bddc3.hidden,
    chatId: () => _0x55d58f,
    refresh: _0x515f89,
  };
}
