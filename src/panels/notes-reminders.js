import { h, icon, clear } from '../ui/dom.js';
import * as _0xfe7ec9 from '../ui/kit.js';
import {
  openNoteModal,
  openReminderModal,
  reminderChip,
} from '../features/crm-drawer.js';
import { fmtDateTime, relTime, truncate, debounce } from '../core/util.js';
export const notesPanel = {
  id: 'notes',
  title: 'Notes',
  subtitle: 'Everything you have written about your contacts.',
  icon: 'notebook-pen',
  render(_0x1cb3a7) {
    const { app: _0x1e2fee, shell: _0xf239ba } = _0x1cb3a7;
    const _0x301602 = {
      query: '',
      selected: new Set(),
      page: 0,
      size: 10,
    };
    const _0x3eef40 = h('div', {
      class: 'wc-stack',
    });
    function _0x3780d3() {
      clear(_0x3eef40);
      const _0x386c99 = _0x1e2fee.crm.notes();
      const _0x1f7017 = _0x386c99.filter(
        (_0x35ce5a) =>
          !_0x301602.query ||
          (
            _0x35ce5a.title +
            ' ' +
            _0x35ce5a.text +
            ' ' +
            _0x1e2fee.crm.displayName(_0x35ce5a.chatId)
          )
            .toLowerCase()
            .includes(_0x301602.query.toLowerCase()),
      );
      const _0x437903 = _0x1f7017.slice(
        _0x301602.page * _0x301602.size,
        (_0x301602.page + 1) * _0x301602.size,
      );
      _0x3eef40.appendChild(
        _0xfe7ec9.bulkBar(
          _0x301602.selected.size,
          _0xfe7ec9.button(
            'Delete selected (' + _0x301602.selected.size + ')',
            {
              variant: 'danger',
              size: 'sm',
              icon: 'trash-2',
              onClick: async () => {
                if (
                  await _0xfe7ec9.confirmDialog(
                    'Delete ' + _0x301602.selected.size + ' notes?',
                    {
                      danger: true,
                      confirmLabel: 'Delete',
                    },
                  )
                ) {
                  await _0x1e2fee.crm.deleteNotes(
                    Array.from(_0x301602.selected),
                  );
                  _0x301602.selected.clear();
                }
              },
            },
          ),
        ),
      );
      _0x3eef40.appendChild(
        _0xfe7ec9.table(
          ['', 'Note for', 'Title', 'Note', 'Modified', ''],
          _0x437903.map((_0x5a308f) => [
            _0xfe7ec9.checkbox(
              _0x301602.selected.has(_0x5a308f.id),
              (_0x1624a5) => {
                if (_0x1624a5) {
                  _0x301602.selected.add(_0x5a308f.id);
                } else {
                  _0x301602.selected.delete(_0x5a308f.id);
                }
                _0x3780d3();
              },
            ),
            h(
              'div',
              {
                class: 'wc-inline',
              },
              _0xfe7ec9.avatar(_0x1e2fee.crm.displayName(_0x5a308f.chatId), 26),
              h(
                'button',
                {
                  type: 'button',
                  class: 'wc-link',
                  onClick: () => _0xf239ba.openCrm(_0x5a308f.chatId, 'notes'),
                },
                _0x1e2fee.crm.displayName(_0x5a308f.chatId),
              ),
            ),
            h('strong', null, _0x5a308f.title),
            h(
              'span',
              {
                class: 'wc-cell-clip',
              },
              truncate(_0x5a308f.text, 80),
            ),
            fmtDateTime(_0x5a308f.updatedAt),
            h(
              'div',
              {
                class: 'wc-row-actions',
              },
              _0xfe7ec9.iconButton('pencil', 'Edit', () =>
                openNoteModal(_0x1e2fee, {
                  chatId: _0x5a308f.chatId,
                  note: _0x5a308f,
                }),
              ),
              _0xfe7ec9.iconButton(
                'trash-2',
                'Delete',
                async () => {
                  if (
                    await _0xfe7ec9.confirmDialog('Delete this note?', {
                      danger: true,
                      confirmLabel: 'Delete',
                    })
                  ) {
                    _0x1e2fee.crm.deleteNotes(_0x5a308f.id);
                  }
                },
                'is-danger',
              ),
            ),
          ]),
          {
            empty: _0xfe7ec9.emptyState(
              'notebook-pen',
              'No notes yet',
              'Add notes from any contact, or here.',
              _0xfe7ec9.button('Add note', {
                icon: 'plus',
                variant: 'primary',
                onClick: () => openNoteModal(_0x1e2fee, {}),
              }),
            ),
          },
        ),
      );
      if (_0x1f7017.length > 10) {
        _0x3eef40.appendChild(
          _0xfe7ec9.pager({
            page: _0x301602.page,
            pageSize: _0x301602.size,
            total: _0x1f7017.length,
            onPage: (_0x339147) => {
              _0x301602.page = _0x339147;
              _0x3780d3();
            },
            onSize: (_0x5c937b) => {
              _0x301602.size = _0x5c937b;
              _0x301602.page = 0;
              _0x3780d3();
            },
          }),
        );
      }
    }
    _0x1cb3a7.setActions([
      _0xfe7ec9.button('Add note', {
        icon: 'plus',
        variant: 'primary',
        onClick: () => openNoteModal(_0x1e2fee, {}),
      }),
    ]);
    _0x1cb3a7.onDispose(_0x1e2fee.store.on('notes', debounce(_0x3780d3, 40)));
    _0x3780d3();
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
        _0xfe7ec9.searchInput('Search notes', (_0x286a06) => {
          _0x301602.query = _0x286a06.trim();
          _0x301602.page = 0;
          _0x3780d3();
        }),
      ),
      _0x3eef40,
    );
  },
};
export const remindersPanel = {
  id: 'reminders',
  title: 'Reminders',
  subtitle:
    'Follow-ups you set for your contacts. You get a notification when they are due.',
  icon: 'bell-ring',
  render(_0x2126d3) {
    const { app: _0x38234c, shell: _0x17957f } = _0x2126d3;
    const _0x54b6ab = {
      query: '',
      status: 'all',
      sort: 'date',
      selected: new Set(),
    };
    const _0x265721 = h('div', {
      class: 'wc-stack',
    });
    function _0x4a003f() {
      clear(_0x265721);
      let _0x3a02e9 = _0x38234c.crm
        .reminders()
        .filter(
          (_0x49d249) =>
            _0x54b6ab.status === 'all' || _0x49d249.status === _0x54b6ab.status,
        )
        .filter(
          (_0x114f33) =>
            !_0x54b6ab.query ||
            (
              _0x114f33.title +
              ' ' +
              _0x38234c.crm.displayName(_0x114f33.chatId)
            )
              .toLowerCase()
              .includes(_0x54b6ab.query.toLowerCase()),
        );
      if (_0x54b6ab.sort === 'name') {
        _0x3a02e9 = _0x3a02e9.sort((_0x12c52b, _0x5c1aac) =>
          _0x12c52b.title.localeCompare(_0x5c1aac.title),
        );
      }
      _0x265721.appendChild(
        _0xfe7ec9.bulkBar(
          _0x54b6ab.selected.size,
          _0xfe7ec9.button(
            'Delete selected (' + _0x54b6ab.selected.size + ')',
            {
              variant: 'danger',
              size: 'sm',
              icon: 'trash-2',
              onClick: async () => {
                if (
                  await _0xfe7ec9.confirmDialog(
                    'Delete ' + _0x54b6ab.selected.size + ' reminders?',
                    {
                      danger: true,
                      confirmLabel: 'Delete',
                    },
                  )
                ) {
                  await _0x38234c.crm.deleteReminders(
                    Array.from(_0x54b6ab.selected),
                  );
                  _0x54b6ab.selected.clear();
                }
              },
            },
          ),
        ),
      );
      _0x265721.appendChild(
        _0xfe7ec9.table(
          ['', 'Reminder for', 'Name', 'Reminder date', 'Status', ''],
          _0x3a02e9.map((_0x135d10) => [
            _0xfe7ec9.checkbox(
              _0x54b6ab.selected.has(_0x135d10.id),
              (_0x39404d) => {
                if (_0x39404d) {
                  _0x54b6ab.selected.add(_0x135d10.id);
                } else {
                  _0x54b6ab.selected.delete(_0x135d10.id);
                }
                _0x4a003f();
              },
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'wc-link',
                onClick: () => _0x17957f.openCrm(_0x135d10.chatId, 'reminders'),
              },
              _0x38234c.crm.displayName(_0x135d10.chatId),
            ),
            h(
              'div',
              {
                class: 'wc-cell-main',
              },
              h('strong', null, _0x135d10.title),
              _0x135d10.details
                ? h('span', null, truncate(_0x135d10.details, 60))
                : null,
            ),
            h(
              'span',
              null,
              fmtDateTime(_0x135d10.at),
              h('br'),
              h(
                'span',
                {
                  class: 'wc-muted wc-small',
                },
                relTime(_0x135d10.at),
              ),
            ),
            reminderChip(_0x135d10.status),
            h(
              'div',
              {
                class: 'wc-row-actions',
              },
              _0x135d10.status !== 'read'
                ? _0xfe7ec9.iconButton('check', 'Mark as read', () =>
                    _0x38234c.crm.markReminder(_0x135d10.id, 'read'),
                  )
                : null,
              _0xfe7ec9.iconButton('copy', 'Duplicate', () =>
                _0x38234c.store.put(
                  'reminders',
                  Object.assign({}, _0x135d10, {
                    id: undefined,
                    createdAt: undefined,
                    title: _0x135d10.title + ' (copy)',
                    status: 'pending',
                    notified: false,
                    at: Math.max(_0x135d10.at, Date.now()) + 86400000,
                  }),
                ),
              ),
              _0xfe7ec9.iconButton('pencil', 'Edit', () =>
                openReminderModal(_0x38234c, {
                  chatId: _0x135d10.chatId,
                  reminder: _0x135d10,
                }),
              ),
              _0xfe7ec9.iconButton(
                'trash-2',
                'Delete',
                async () => {
                  if (
                    await _0xfe7ec9.confirmDialog('Delete this reminder?', {
                      danger: true,
                      confirmLabel: 'Delete',
                    })
                  ) {
                    _0x38234c.crm.deleteReminders(_0x135d10.id);
                  }
                },
                'is-danger',
              ),
            ),
          ]),
          {
            empty: _0xfe7ec9.emptyState(
              'bell-ring',
              'No reminders yet',
              'Set one on a contact, or here.',
              _0xfe7ec9.button('Add reminder', {
                icon: 'plus',
                variant: 'primary',
                onClick: () => openReminderModal(_0x38234c, {}),
              }),
            ),
          },
        ),
      );
    }
    _0x2126d3.setActions([
      _0xfe7ec9.button('Add reminder', {
        icon: 'plus',
        variant: 'primary',
        onClick: () => openReminderModal(_0x38234c, {}),
      }),
    ]);
    _0x2126d3.onDispose(
      _0x38234c.store.on('reminders', debounce(_0x4a003f, 40)),
    );
    _0x4a003f();
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
        _0xfe7ec9.searchInput('Search reminders', (_0x4facad) => {
          _0x54b6ab.query = _0x4facad.trim();
          _0x4a003f();
        }),
        _0xfe7ec9.select(
          [
            {
              value: 'all',
              label: 'All statuses',
            },
            {
              value: 'pending',
              label: 'Pending',
            },
            {
              value: 'unread',
              label: 'Unread',
            },
            {
              value: 'missed',
              label: 'Missed',
            },
            {
              value: 'read',
              label: 'Read',
            },
          ],
          'all',
          (_0x4ffa28) => {
            _0x54b6ab.status = _0x4ffa28;
            _0x4a003f();
          },
        ),
        _0xfe7ec9.select(
          [
            {
              value: 'date',
              label: 'Sort by date',
            },
            {
              value: 'name',
              label: 'Sort by name',
            },
          ],
          'date',
          (_0x4dfaee) => {
            _0x54b6ab.sort = _0x4dfaee;
            _0x4a003f();
          },
        ),
      ),
      _0x265721,
    );
  },
};
