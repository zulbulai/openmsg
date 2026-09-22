import { h, icon, clear } from '../ui/dom.js';
import * as _0x27e38f from '../ui/kit.js';
import { pickChats } from '../ui/pickers.js';
import { openChatModal } from '../features/chat-modal.js';
import { openNoteModal, openReminderModal } from '../features/crm-drawer.js';
import { truncate, betterName } from '../core/util.js';
import { brand } from '../core/brand.js';
const STAGE_COLORS = [
  '#7dd3fc',
  '#ff4d4f',
  '#c4b5fd',
  '#86efac',
  '#f9a8d4',
  '#fdba74',
  '#fca5a5',
  '#5eead4',
  '#e2e8f0',
];
function textColorFor(_0x259818) {
  const _0xd57613 = /^#?([0-9a-f]{6})$/i.exec(_0x259818 || '');
  if (!_0xd57613) {
    return '#1a1400';
  }
  const _0x50c666 = parseInt(_0xd57613[1], 16);
  const _0x250415 =
    ((_0x50c666 >> 16) * 0.299 +
      ((_0x50c666 >> 8) & 255) * 0.587 +
      (_0x50c666 & 255) * 0.114) /
    255;
  if (_0x250415 > 0.6) {
    return '#14110a';
  } else {
    return '#ffffff';
  }
}
function editStage(_0x5db0c5, _0x1de494, _0x4ca2e7) {
  const _0x49fd75 = Object.assign(
    {
      name: '',
      color: STAGE_COLORS[1],
      textColor: '',
    },
    _0x1de494 || {},
  );
  const _0x27172e = _0x27e38f.input({
    value: _0x49fd75.name,
    maxLength: 20,
    placeholder: 'Board name',
    onInput: (_0x21c897) => {
      _0x49fd75.name = _0x21c897;
    },
  });
  const _0x245ca8 = _0x27e38f.field('Board name', _0x27172e, {
    hint: 'Up to 20 characters.',
    required: true,
  });
  const _0x12127d = _0x27e38f.openModal({
    title: _0x1de494 ? 'Edit board' : 'Add board',
    width: 440,
    body: h(
      'div',
      {
        class: 'wc-form',
      },
      _0x245ca8,
      _0x27e38f.field(
        'Fill color',
        _0x27e38f.colorSwatches(STAGE_COLORS, _0x49fd75.color, (_0x23ad24) => {
          _0x49fd75.color = _0x23ad24;
        }),
      ),
      _0x27e38f.field(
        'Text color',
        _0x27e38f.colorSwatches(
          ['#14110a', '#ffffff'],
          _0x49fd75.textColor || textColorFor(_0x49fd75.color),
          (_0x46ee0a) => {
            _0x49fd75.textColor = _0x46ee0a;
          },
        ),
        {
          hint: 'Used for the board title.',
        },
      ),
    ),
    footer: h(
      'div',
      {
        class: 'wc-modal-actions',
      },
      _0x27e38f.button('Cancel', {
        variant: 'dark',
        onClick: () => _0x12127d.close(),
      }),
      _0x27e38f.button('Save', {
        variant: 'primary',
        onClick: async () => {
          try {
            await _0x5db0c5.crm.saveStage(
              Object.assign(
                {},
                _0x1de494 || {},
                {
                  name: _0x49fd75.name,
                  color: _0x49fd75.color,
                  textColor:
                    _0x49fd75.textColor || textColorFor(_0x49fd75.color),
                },
                _0x4ca2e7 && !_0x1de494
                  ? {
                      dashboardId: _0x4ca2e7,
                    }
                  : {},
              ),
            );
            _0x12127d.close();
          } catch (_0x22e3c8) {
            _0x245ca8.setError(_0x22e3c8.message);
          }
        },
      }),
    ),
  });
  _0x27172e.focus();
}
function openDashboardEditor(
  _0x3dbea9,
  { existing: _0x1c8674, copyFrom: _0x2c0f97, onSaved: _0x548346 },
) {
  const _0x46d3f5 = {
    name: _0x1c8674 ? _0x1c8674.name : '',
    start: 'standard',
  };
  const _0x44ab1f = _0x27e38f.input({
    value: _0x46d3f5.name,
    maxLength: 30,
    placeholder: 'e.g. Support tickets',
    onInput: (_0x192d5e) => {
      _0x46d3f5.name = _0x192d5e;
    },
  });
  const _0x58a3be = _0x27e38f.field('Dashboard name', _0x44ab1f, {
    required: true,
    hint: 'Up to 30 characters.',
  });
  const _0x49d1c7 = [
    {
      value: 'standard',
      label: 'The standard boards',
      hint: 'New lead, Contacted, Negotiation and Won.',
    },
  ];
  if (_0x2c0f97) {
    _0x49d1c7.push({
      value: 'copy',
      label: 'A copy of "' + _0x2c0f97.name + '"',
      hint: 'The same boards, with no chats on them yet.',
    });
  }
  _0x49d1c7.push({
    value: 'empty',
    label: 'Empty',
    hint: 'Start with no boards and add your own.',
  });
  const _0x33b59c = _0x27e38f.openModal({
    title: _0x1c8674 ? 'Rename dashboard' : 'New dashboard',
    width: 480,
    subtitle: _0x1c8674
      ? ''
      : 'A dashboard is its own set of boards. The same chat can be on a board in each dashboard.',
    body: h(
      'div',
      {
        class: 'wc-form',
      },
      _0x58a3be,
      _0x1c8674
        ? null
        : _0x27e38f.field(
            'Start with',
            _0x27e38f.radioCards(
              'dash-start',
              _0x49d1c7,
              _0x46d3f5.start,
              (_0x5c004a) => {
                _0x46d3f5.start = _0x5c004a;
              },
            ),
          ),
    ),
    footer: h(
      'div',
      {
        class: 'wc-modal-actions',
      },
      _0x27e38f.button('Cancel', {
        variant: 'dark',
        onClick: () => _0x33b59c.close(),
      }),
      _0x27e38f.button(_0x1c8674 ? 'Save' : 'Create dashboard', {
        variant: 'primary',
        onClick: async () => {
          try {
            const _0x1a6e16 = _0x1c8674
              ? await _0x3dbea9.crm.renameDashboard(
                  _0x1c8674.id,
                  _0x46d3f5.name,
                )
              : await _0x3dbea9.crm.createDashboard(
                  _0x46d3f5.name,
                  _0x46d3f5.start === 'copy'
                    ? {
                        copyFrom: _0x2c0f97.id,
                      }
                    : {
                        boards: _0x46d3f5.start,
                      },
                );
            _0x33b59c.close();
            if (_0x548346) {
              _0x548346(_0x1a6e16);
            }
          } catch (_0x3daddb) {
            _0x58a3be.setError(_0x3daddb.message);
          }
        },
      }),
    ),
  });
  _0x44ab1f.focus();
}
export default {
  id: 'kanban',
  title: 'Kanban',
  subtitle: 'Move every conversation from first hello to closed deal.',
  icon: 'square-kanban',
  render(_0x3b96df) {
    const { app: _0x31415a, shell: _0x15c5a8 } = _0x3b96df;
    const _0x19afa3 = _0x31415a.store;
    let _0x3cce23 = '';
    let _0x3a29e4 = [];
    let _0x27018b = true;
    let _0x26c835 = '';
    const _0x396854 = {
      v: false,
    };
    const _0x3301ed = () => {
      const _0x46b5bc = _0x31415a.crm.dashboards();
      return (
        _0x46b5bc.find(
          (_0x4f5185) => _0x4f5185.id === _0x19afa3.setting('kanbanDashboard'),
        ) ||
        _0x46b5bc[0] || {
          id: _0x31415a.crm.mainDashboardId(),
          name: 'Main',
        }
      );
    };
    let _0x190ec5 = '';
    const _0x1de81c = h('div', {
      class: 'wc-screen wc-kanban-screen',
    });
    const _0x44dc2c = h('div', {
      class: 'wc-kanban-host',
    });
    async function _0x1109fd() {
      _0x27018b = true;
      _0x26c835 = '';
      try {
        const _0x4b9f74 = Number(_0x19afa3.setting('inboxCount', 30)) || 30;
        _0x3a29e4 = (
          await _0x31415a.wa.listChats({
            count: _0x4b9f74 + 40,
          })
        ).filter(
          (_0x4abdaa) => !_0x4abdaa.isBroadcast && !_0x4abdaa.isNewsletter,
        );
      } catch (_0x5e230a) {
        _0x26c835 = _0x5e230a.message;
      }
      _0x27018b = false;
      _0x2953c5();
    }
    function _0x316d33(_0x6f1b3a) {
      if (!_0x3cce23) {
        return true;
      }
      const _0xe32c13 = _0x3cce23.toLowerCase();
      return (
        String(_0x6f1b3a.name || '')
          .toLowerCase()
          .includes(_0xe32c13) ||
        String(_0x6f1b3a.phone || '').includes(_0xe32c13) ||
        String(_0x6f1b3a.note || _0x6f1b3a.lastBody || '')
          .toLowerCase()
          .includes(_0xe32c13)
      );
    }
    function _0x22a012(_0x2b49c2, _0x4db2ea = {}) {
      const _0x3f1e83 = _0x2b49c2.chatId || _0x2b49c2.id;
      const _0x570da3 = _0x31415a.wa.chatById(_0x3f1e83) || {};
      const _0x178101 = _0x31415a.crm.contact(_0x3f1e83);
      const _0x4b8228 = _0x31415a.crm.notes(_0x3f1e83).length;
      const _0x3ac494 = _0x31415a.crm
        .reminders(_0x3f1e83)
        .filter(
          (_0x45f04a) =>
            _0x45f04a.status === 'pending' || _0x45f04a.status === 'unread',
        ).length;
      const _0x49d600 = _0x31415a.crm.tagsOf(_0x3f1e83);
      const _0xd56b01 = betterName(
        _0x31415a.crm.displayName(_0x3f1e83),
        _0x2b49c2.name,
        _0x570da3.name,
      );
      const _0x325167 = _0x31415a.crm.stageOf(_0x3f1e83, _0x3301ed().id);
      const _0x168805 = h(
        'article',
        {
          class: 'wc-kcard',
          draggable: 'true',
          dataset: {
            chat: _0x3f1e83,
          },
          onMousedown: (_0x5693bc) => {
            _0x168805.draggable = !_0x5693bc.target.closest(
              'button, a, input, select, textarea',
            );
          },
          onDragstart: (_0x26e4ac) => {
            _0x26e4ac.dataTransfer.setData('text/plain', _0x3f1e83);
            _0x26e4ac.dataTransfer.effectAllowed = 'move';
            _0x168805.classList.add('is-dragging');
          },
          onDragend: () => _0x168805.classList.remove('is-dragging'),
        },
        h(
          'div',
          {
            class: 'wc-kcard-top',
          },
          _0x27e38f.avatar(_0xd56b01, 34),
          h(
            'div',
            {
              class: 'wc-kcard-who',
            },
            h(
              'div',
              {
                class: 'wc-kcard-name',
              },
              _0xd56b01,
            ),
            h(
              'div',
              {
                class: 'wc-kcard-phone',
              },
              _0x570da3.isGroup
                ? 'Group'
                : _0x570da3.phone
                  ? '+' + _0x570da3.phone
                  : _0x2b49c2.phone
                    ? '+' + _0x2b49c2.phone
                    : '',
            ),
          ),
          _0x570da3.unread
            ? h(
                'span',
                {
                  class: 'wc-unread',
                },
                String(_0x570da3.unread),
              )
            : null,
          _0x27e38f.iconButton('ellipsis', 'More actions', (_0xd8a73c) =>
            _0x27e38f.openMenu(
              _0xd8a73c.currentTarget,
              [
                {
                  label: 'Open CRM profile',
                  icon: 'contact-round',
                  onClick: () => _0x15c5a8.openCrm(_0x3f1e83),
                },
                {
                  label: 'Add note',
                  icon: 'notebook-pen',
                  onClick: () =>
                    openNoteModal(_0x31415a, {
                      chatId: _0x3f1e83,
                    }),
                },
                {
                  label: 'Add reminder',
                  icon: 'bell-plus',
                  onClick: () =>
                    openReminderModal(_0x31415a, {
                      chatId: _0x3f1e83,
                    }),
                },
                {
                  label: 'Open chat in WhatsApp',
                  icon: 'message-circle',
                  onClick: () =>
                    _0x31415a.wa
                      .openChat(_0x3f1e83)
                      .catch((_0x3a72bd) =>
                        _0x27e38f.toast(_0x3a72bd.message, 'error'),
                      ),
                },
                _0x4db2ea.removable
                  ? {
                      divider: true,
                    }
                  : null,
                _0x4db2ea.removable
                  ? {
                      label: 'Remove from board',
                      icon: 'trash-2',
                      danger: true,
                      onClick: () =>
                        _0x31415a.crm.unassign(_0x3f1e83, _0x3301ed().id),
                    }
                  : null,
              ].filter(Boolean),
            ),
          ),
        ),
        _0x570da3.lastBody || _0x178101.lastIncomingText
          ? h(
              'p',
              {
                class: 'wc-kcard-note',
              },
              truncate(_0x570da3.lastBody || _0x178101.lastIncomingText, 110),
            )
          : null,
        _0x49d600.length
          ? h(
              'div',
              {
                class: 'wc-tags',
              },
              _0x49d600.slice(0, 4).map((_0x15554a) =>
                _0x27e38f.chip(_0x15554a.name, 'accent', {
                  color: _0x15554a.color,
                }),
              ),
            )
          : null,
        h(
          'div',
          {
            class: 'wc-kcard-actions',
          },
          _0x27e38f.iconButton('message-circle', 'Chat with ' + _0xd56b01, () =>
            openChatModal(_0x31415a, _0x3f1e83),
          ),
          h(
            'span',
            {
              class: 'wc-kact',
            },
            _0x27e38f.iconButton('sticky-note', 'Notes', () =>
              _0x15c5a8.openCrm(_0x3f1e83, 'notes'),
            ),
            _0x4b8228 ? h('b', null, String(_0x4b8228)) : null,
          ),
          h(
            'span',
            {
              class: 'wc-kact',
            },
            _0x27e38f.iconButton('bell', 'Reminders', () =>
              _0x15c5a8.openCrm(_0x3f1e83, 'reminders'),
            ),
            _0x3ac494 ? h('b', null, String(_0x3ac494)) : null,
          ),
          _0x27e38f.iconButton('calendar-clock', 'Schedule a message', () =>
            _0x15c5a8.openPanel('schedules', {
              chatId: _0x3f1e83,
            }),
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'wc-kboard',
              title: 'Select board',
              'aria-label': 'Select board',
              onClick: (_0x496edb) =>
                _0x57f953(_0x496edb.currentTarget, _0x3f1e83),
            },
            _0x325167
              ? h('span', {
                  class: 'wc-dot',
                  style: {
                    background: _0x325167.color,
                  },
                })
              : null,
            h('span', null, _0x325167 ? _0x325167.name : 'Select board'),
            icon('chevron-down', 13),
          ),
        ),
      );
      return _0x168805;
    }
    function _0x57f953(_0x499fcb, _0x322f11) {
      const _0xc7220e = _0x3301ed();
      const _0x4557e2 = _0x31415a.crm.stageOf(_0x322f11, _0xc7220e.id);
      const _0x670b72 = _0x31415a.crm.stages(_0xc7220e.id);
      const _0x592650 = [
        {
          header: h(
            'div',
            {
              class: 'wc-menu-group',
            },
            'Select board',
          ),
        },
      ];
      if (!_0x670b72.length) {
        _0x592650.push({
          label: 'No boards yet. Use Add board first.',
          disabled: true,
        });
      }
      for (const _0xcfd0fd of _0x670b72) {
        const _0x4b76d0 = !!_0x4557e2 && _0x4557e2.id === _0xcfd0fd.id;
        _0x592650.push({
          label: _0xcfd0fd.name,
          icon: _0x4b76d0 ? 'check' : undefined,
          active: _0x4b76d0,
          onClick: () => {
            if (!_0x4b76d0) {
              _0x31415a.crm
                .assign(_0x322f11, _0xcfd0fd.id)
                .catch((_0x35c60b) =>
                  _0x27e38f.toast(_0x35c60b.message, 'error'),
                );
            }
          },
        });
      }
      _0x592650.push(
        {
          divider: true,
        },
        {
          label: 'Clear board',
          icon: 'circle-x',
          disabled: !_0x4557e2,
          onClick: () => _0x31415a.crm.unassign(_0x322f11, _0xc7220e.id),
        },
      );
      _0x27e38f.openMenu(_0x499fcb, _0x592650, {
        align: 'start',
        width: 240,
      });
    }
    function _0x337f3d(_0x4b626e, _0x4c2652) {
      const _0x47e735 = Array.from(
        _0x4b626e.querySelectorAll('.wc-kcard:not(.is-dragging)'),
      );
      for (let _0x50b6ca = 0; _0x50b6ca < _0x47e735.length; _0x50b6ca++) {
        const _0x4834b5 = _0x47e735[_0x50b6ca].getBoundingClientRect();
        if (_0x4c2652 < _0x4834b5.top + _0x4834b5.height / 2) {
          return _0x50b6ca;
        }
      }
      return _0x47e735.length;
    }
    function _0x4f07e8(_0x29c576, _0x2ec803) {
      _0x29c576.addEventListener('dragover', (_0x42978) => {
        _0x42978.preventDefault();
        _0x29c576.classList.add('is-over');
      });
      _0x29c576.addEventListener('dragleave', (_0x48c9d4) => {
        if (!_0x29c576.contains(_0x48c9d4.relatedTarget)) {
          _0x29c576.classList.remove('is-over');
        }
      });
      _0x29c576.addEventListener('drop', (_0x172ec5) => {
        _0x172ec5.preventDefault();
        _0x29c576.classList.remove('is-over');
        const _0x3849a1 = _0x172ec5.dataTransfer.getData('text/plain');
        if (_0x3849a1) {
          _0x2ec803(_0x3849a1, _0x337f3d(_0x29c576, _0x172ec5.clientY));
        }
      });
    }
    function _0x5ab6ae() {
      const _0x2be2ee = new Set(
        _0x31415a.crm
          .stages(_0x3301ed().id)
          .flatMap((_0x383594) => _0x31415a.crm.cards(_0x383594.id))
          .map((_0x5694d9) => _0x5694d9.chatId),
      );
      const _0x3d8b12 = Number(_0x19afa3.setting('inboxCount', 30)) || 30;
      const _0x5f0263 = _0x3a29e4
        .filter((_0x297e75) => !_0x2be2ee.has(_0x297e75.id))
        .filter(_0x316d33)
        .slice(0, _0x3d8b12);
      const _0x25b438 = h('div', {
        class: 'wc-kcol-body',
      });
      if (_0x27018b) {
        _0x25b438.appendChild(
          h(
            'div',
            {
              class: 'wc-muted wc-pad',
            },
            'Loading chats...',
          ),
        );
      } else if (_0x26c835) {
        _0x25b438.appendChild(
          h(
            'div',
            {
              class: 'wc-muted wc-pad',
            },
            'Could not load chats: ' + _0x26c835,
          ),
        );
      } else if (!_0x5f0263.length) {
        _0x25b438.appendChild(
          h(
            'div',
            {
              class: 'wc-muted wc-pad',
            },
            'No chats to show.',
          ),
        );
      } else {
        _0x5f0263.forEach((_0x9cdb08) =>
          _0x25b438.appendChild(_0x22a012(_0x9cdb08)),
        );
      }
      _0x4f07e8(_0x25b438, async (_0x4098c4) => {
        const _0x4c78f5 = _0x3301ed();
        if (_0x31415a.crm.cardFor(_0x4098c4, _0x4c78f5.id)) {
          await _0x31415a.crm.unassign(_0x4098c4, _0x4c78f5.id);
        }
      });
      return h(
        'section',
        {
          class: 'wc-kcol wc-kcol-inbox',
        },
        h(
          'header',
          {
            class: 'wc-kcol-head',
          },
          icon('inbox', 16),
          h(
            'span',
            {
              class: 'wc-kcol-name',
            },
            'Inbox',
          ),
          h(
            'span',
            {
              class: 'wc-kcol-sub',
            },
            'Recent ' + _0x3d8b12,
          ),
          h(
            'span',
            {
              class: 'wc-kcol-count',
            },
            String(_0x5f0263.length),
          ),
          _0x27e38f.iconButton(
            'lock',
            'Cards in Inbox cannot be removed',
            () => {},
          ),
        ),
        _0x25b438,
      );
    }
    function _0x442157(_0x480a1f) {
      const _0x45ee70 = _0x31415a.crm.cards(_0x480a1f.id).filter(_0x316d33);
      const _0x39dd66 = h('div', {
        class: 'wc-kcol-body',
      });
      if (!_0x480a1f.collapsed) {
        if (!_0x45ee70.length) {
          _0x39dd66.appendChild(
            h(
              'div',
              {
                class: 'wc-muted wc-pad wc-kempty',
              },
              'No chats in this board',
            ),
          );
        }
        _0x45ee70.forEach((_0x144aca) =>
          _0x39dd66.appendChild(
            _0x22a012(_0x144aca, {
              removable: true,
            }),
          ),
        );
      }
      _0x4f07e8(_0x39dd66, async (_0xe54094, _0x19c664) => {
        try {
          if (_0x31415a.crm.cardFor(_0xe54094, _0x3301ed().id)) {
            await _0x31415a.crm.moveCard(_0xe54094, _0x480a1f.id, _0x19c664);
          } else {
            await _0x31415a.crm.assign(_0xe54094, _0x480a1f.id, _0x19c664);
          }
        } catch (_0x347e16) {
          _0x27e38f.toast(_0x347e16.message, 'error');
        }
      });
      const _0x8bc0db = h(
        'section',
        {
          class: 'wc-kcol' + (_0x480a1f.collapsed ? ' is-collapsed' : ''),
          dataset: {
            id: _0x480a1f.id,
          },
        },
        h(
          'header',
          {
            class: 'wc-kcol-head',
            style: {
              background: _0x480a1f.color,
              color: _0x480a1f.textColor || textColorFor(_0x480a1f.color),
            },
          },
          h(
            'span',
            {
              class: 'wc-grip',
              title: 'Drag to reorder board',
            },
            icon('grip-vertical', 14),
          ),
          h(
            'span',
            {
              class: 'wc-kcol-name',
            },
            _0x480a1f.name,
          ),
          h(
            'span',
            {
              class: 'wc-kcol-count',
            },
            String(_0x31415a.crm.cards(_0x480a1f.id).length),
          ),
          _0x27e38f.iconButton(
            _0x480a1f.collapsed ? 'chevron-right' : 'chevron-down',
            _0x480a1f.collapsed ? 'Expand board' : 'Collapse board',
            () =>
              _0x19afa3.patch('kanbanStages', _0x480a1f.id, {
                collapsed: !_0x480a1f.collapsed,
              }),
          ),
          _0x27e38f.iconButton('ellipsis', 'Board options', (_0x1fafb3) =>
            _0x27e38f.openMenu(_0x1fafb3.currentTarget, [
              {
                label: 'Add chats',
                icon: 'user-plus',
                onClick: async () => {
                  const _0x4483fd = await pickChats(_0x31415a, {
                    title: 'Add chats to ' + _0x480a1f.name,
                    selected: _0x31415a.crm
                      .cards(_0x480a1f.id)
                      .map((_0x1a5a52) => _0x1a5a52.chatId),
                  });
                  if (_0x4483fd) {
                    for (const _0x433d03 of _0x4483fd) {
                      if (
                        !_0x31415a.crm.cardFor(_0x433d03, _0x3301ed().id) ||
                        _0x31415a.crm.cardFor(_0x433d03, _0x3301ed().id)
                          .stageId !== _0x480a1f.id
                      ) {
                        await _0x31415a.crm.assign(_0x433d03, _0x480a1f.id);
                      }
                    }
                  }
                },
              },
              {
                label: 'Edit board',
                icon: 'pencil',
                onClick: () => editStage(_0x31415a, _0x480a1f),
              },
              {
                divider: true,
              },
              {
                label: 'Delete board',
                icon: 'trash-2',
                danger: true,
                onClick: async () => {
                  if (
                    await _0x27e38f.confirmDialog(
                      'Delete "' +
                        _0x480a1f.name +
                        '"? Its chats go back to the Inbox.',
                      {
                        danger: true,
                        confirmLabel: 'Delete',
                      },
                    )
                  ) {
                    _0x31415a.crm.deleteStage(_0x480a1f.id);
                  }
                },
              },
            ]),
          ),
        ),
        _0x39dd66,
      );
      return _0x8bc0db;
    }
    const _0x541823 = h('button', {
      type: 'button',
      class: 'wc-dashpick',
      'aria-haspopup': 'menu',
      title: 'Switch dashboard',
      onClick: (_0x48a140) => _0x188fc8(_0x48a140.currentTarget),
    });
    function _0x18ff49() {
      clear(_0x541823);
      _0x541823.appendChild(icon('layout-dashboard', 16));
      _0x541823.appendChild(
        h(
          'span',
          {
            class: 'wc-dashpick-cap',
          },
          'Dashboard',
        ),
      );
      _0x541823.appendChild(h('strong', null, _0x3301ed().name));
      _0x541823.appendChild(icon('chevron-down', 14));
    }
    async function _0x2c743e(_0x433cc9) {
      await _0x19afa3.setSetting('kanbanDashboard', _0x433cc9);
      _0x2953c5();
    }
    function _0x188fc8(_0x261c25) {
      const _0x45c319 = _0x31415a.crm.dashboards();
      const _0x5a2249 = _0x3301ed();
      const _0x57fb97 = [
        {
          header: h(
            'div',
            {
              class: 'wc-menu-group',
            },
            'Dashboards',
          ),
        },
      ];
      for (const _0x35c028 of _0x45c319) {
        const _0x1189c3 = _0x35c028.id === _0x5a2249.id;
        const _0x53566d = _0x31415a.crm.stages(_0x35c028.id).length;
        _0x57fb97.push({
          label: _0x35c028.name,
          icon: _0x1189c3 ? 'check' : undefined,
          active: _0x1189c3,
          meta: _0x53566d === 1 ? '1 board' : _0x53566d + ' boards',
          onClick: () => {
            if (!_0x1189c3) {
              _0x2c743e(_0x35c028.id);
            }
          },
        });
      }
      _0x57fb97.push(
        {
          divider: true,
        },
        {
          label: 'New dashboard',
          icon: 'plus',
          onClick: () =>
            openDashboardEditor(_0x31415a, {
              copyFrom: _0x5a2249,
              onSaved: (_0x5b222b) => _0x2c743e(_0x5b222b.id),
            }),
        },
        {
          label: 'Rename dashboard',
          icon: 'pencil',
          onClick: () =>
            openDashboardEditor(_0x31415a, {
              existing: _0x5a2249,
              onSaved: () => _0x2953c5(),
            }),
        },
        {
          label: 'Delete dashboard',
          icon: 'trash-2',
          danger: true,
          disabled: _0x45c319.length <= 1,
          onClick: async () => {
            if (
              !(await _0x27e38f.confirmDialog(
                'Delete "' +
                  _0x5a2249.name +
                  '"? Its boards and the cards on them are removed from ' +
                  brand() +
                  '. Your WhatsApp chats are not touched.',
                {
                  danger: true,
                  confirmLabel: 'Delete dashboard',
                },
              ))
            ) {
              return;
            }
            try {
              await _0x31415a.crm.deleteDashboard(_0x5a2249.id);
              await _0x19afa3.setSetting(
                'kanbanDashboard',
                _0x31415a.crm.dashboards()[0].id,
              );
              _0x2953c5();
              _0x27e38f.toast('Dashboard deleted', 'success');
            } catch (_0x5f269c) {
              _0x27e38f.toast(_0x5f269c.message, 'error');
            }
          },
        },
      );
      _0x27e38f.openMenu(_0x261c25, _0x57fb97, {
        align: 'start',
        width: 290,
      });
    }
    function _0x2953c5() {
      const _0x5cf909 = _0x44dc2c.querySelector('.wc-kanban');
      const _0x19f240 = _0x5cf909 ? _0x5cf909.scrollLeft : 0;
      clear(_0x44dc2c);
      const _0xa23a67 = _0x3301ed();
      _0x190ec5 = _0xa23a67.id;
      _0x18ff49();
      const _0x22588e = _0x31415a.crm.stages(_0xa23a67.id);
      const _0x2737a2 = h(
        'div',
        {
          class: 'wc-kanban',
        },
        _0x5ab6ae(),
        _0x22588e.map(_0x442157),
        h(
          'button',
          {
            type: 'button',
            class: 'wc-kcol wc-kcol-add',
            onClick: () => editStage(_0x31415a, undefined, _0xa23a67.id),
          },
          icon('plus', 20),
          h('strong', null, 'Add board'),
        ),
      );
      _0x44dc2c.appendChild(_0x2737a2);
      _0x2737a2.scrollLeft = _0x19f240;
      _0x27e38f.makeSortable(_0x2737a2, {
        itemSelector: '.wc-kcol[data-id]',
        handleSelector: '.wc-grip',
        horizontal: true,
        onReorder: (_0x5452ac) => _0x31415a.crm.reorderStages(_0x5452ac),
      });
    }
    _0x1de81c.appendChild(
      h(
        'div',
        {
          class: 'wc-toolbar',
        },
        _0x541823,
        _0x27e38f.searchInput('Search chats', (_0x119b7d) => {
          _0x3cce23 = _0x119b7d.trim();
          _0x2953c5();
        }),
        _0x27e38f.button('Refresh', {
          icon: 'refresh-cw',
          size: 'sm',
          onClick: _0x1109fd,
        }),
      ),
    );
    _0x1de81c.appendChild(_0x44dc2c);
    _0x3b96df.setActions([
      _0x15c5a8.isWorkspace
        ? null
        : _0x27e38f.button('Full screen', {
            icon: 'expand',
            onClick: () => _0x15c5a8.openWorkspace('kanban'),
          }),
      _0x27e38f.button('Add board', {
        icon: 'plus',
        variant: 'primary',
        onClick: () => editStage(_0x31415a, undefined, _0x3301ed().id),
      }),
    ]);
    const _0x15200e = () => _0x2953c5();
    [
      'kanbanDashboards',
      'kanbanStages',
      'kanbanCards',
      'tags',
      'notes',
      'reminders',
      'contacts',
    ].forEach((_0x17a1cf) =>
      _0x3b96df.onDispose(_0x19afa3.on(_0x17a1cf, _0x15200e)),
    );
    _0x3b96df.onDispose(
      _0x19afa3.on('settings', () => {
        if (_0x3301ed().id !== _0x190ec5) {
          _0x2953c5();
        }
      }),
    );
    _0x3b96df.onDispose(
      _0x31415a.wa.on('message', () => {
        clearTimeout(_0x1de81c._t);
        _0x1de81c._t = setTimeout(_0x1109fd, 1500);
      }),
    );
    _0x3b96df.onDispose(
      _0x31415a.wa.on('ready', (_0x50f4ef) => {
        if (_0x50f4ef) {
          _0x1109fd();
        }
      }),
    );
    _0x3b96df.onDispose(() => clearTimeout(_0x1de81c._t));
    _0x2953c5();
    _0x1109fd();
    return _0x1de81c;
  },
};
