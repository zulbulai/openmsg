import { h, icon, clear } from '../ui/dom.js';
import * as _0x56ecc9 from '../ui/kit.js';
import { messageEditor } from '../ui/message-editor.js';
import { postActionsEditor } from '../ui/pickers.js';
import { newWorkflow, validateWorkflow } from '../core/workflows.js';
import { MATCH_TYPES } from '../core/matcher.js';
import { validateMessage } from '../core/messages.js';
import { WEEKDAYS } from '../core/timecalc.js';
import { hasActions } from '../core/actions.js';
import { fmtDateTime, clone, debounce } from '../core/util.js';
function dayChips(_0x475adc, _0x453521) {
  const _0xc1a72c = h('div', {
    class: 'wc-daychips',
  });
  const _0x5b2550 = () => {
    clear(_0xc1a72c);
    WEEKDAYS.forEach((_0x46634d, _0x4abf70) =>
      _0xc1a72c.appendChild(
        h(
          'button',
          {
            type: 'button',
            class:
              'wc-daychip' + (_0x475adc.includes(_0x4abf70) ? ' is-on' : ''),
            onClick: () => {
              const _0x2e123f = _0x475adc.indexOf(_0x4abf70);
              if (_0x2e123f >= 0) {
                _0x475adc.splice(_0x2e123f, 1);
              } else {
                _0x475adc.push(_0x4abf70);
              }
              _0x475adc.sort();
              _0x5b2550();
              _0x453521(_0x475adc.slice());
            },
          },
          _0x46634d,
        ),
      ),
    );
  };
  _0x5b2550();
  return _0xc1a72c;
}
export function openWorkflowEditor(_0x344ee2, _0x153b09) {
  const _0x3d10d9 = _0x153b09 ? clone(_0x153b09) : newWorkflow();
  const _0x4d12a4 = h('div', {
    class: 'wc-field-error',
  });
  const _0x3bd46b = h('div', {
    class: 'wc-stack',
  });
  const _0x4e03f6 = h('div', {
    class: 'wc-stack',
  });
  const _0x6aa469 = h('div', {
    class: 'wc-stack',
  });
  function _0xa1d156() {
    clear(_0x3bd46b);
    if (_0x3d10d9.target !== 'group') {
      return;
    }
    const _0x5bd5a7 = _0x56ecc9.multiSelect({
      options: [],
      value: _0x3d10d9.groupIds,
      placeholder: 'Select groups',
      onChange: (_0x3b6b49) => {
        _0x3d10d9.groupIds = _0x3b6b49;
      },
    });
    _0x344ee2.wa
      .groups()
      .then((_0x4b97ed) =>
        _0x5bd5a7.setOptions(
          _0x4b97ed.map((_0x17c312) => ({
            value: _0x17c312.id,
            label: _0x17c312.name,
          })),
        ),
      )
      .catch(() => {});
    _0x3bd46b.appendChild(
      _0x56ecc9.checkbox(
        _0x3d10d9.allGroups,
        (_0xeeea7b) => {
          _0x3d10d9.allGroups = _0xeeea7b;
          _0xa1d156();
        },
        'All groups',
      ),
    );
    if (!_0x3d10d9.allGroups) {
      _0x3bd46b.appendChild(_0x56ecc9.field('Selected groups', _0x5bd5a7));
    }
  }
  function _0x56eb6c() {
    clear(_0x4e03f6);
    if (_0x3d10d9.executeOn !== 'keyword') {
      return;
    }
    _0x4e03f6.appendChild(
      _0x56ecc9.field(
        'Keywords',
        _0x56ecc9.tagInput({
          value: _0x3d10d9.keywords,
          placeholder: 'Type a keyword and press Enter',
          onChange: (_0x4bdfae) => {
            _0x3d10d9.keywords = _0x4bdfae;
          },
        }),
      ),
    );
    _0x4e03f6.appendChild(
      _0x56ecc9.field(
        'Match',
        _0x56ecc9.multiSelect({
          options: MATCH_TYPES.map((_0x95a990) => ({
            value: _0x95a990.id,
            label: _0x95a990.label,
          })),
          value: _0x3d10d9.matchTypes,
          placeholder: 'Select match types',
          searchable: false,
          onChange: (_0x53af9c) => {
            _0x3d10d9.matchTypes = _0x53af9c.length ? _0x53af9c : ['contains'];
          },
        }),
        {
          hint: 'A message matches when any of these tests passes.',
        },
      ),
    );
    _0x4e03f6.appendChild(
      _0x56ecc9.checkbox(
        _0x3d10d9.caseSensitive,
        (_0x1fdb2b) => {
          _0x3d10d9.caseSensitive = _0x1fdb2b;
        },
        'Case sensitive',
      ),
    );
  }
  function _0x75eb5a() {
    clear(_0x6aa469);
    const _0x4d3306 = _0x344ee2.store.all('quickReplies');
    _0x6aa469.appendChild(
      _0x56ecc9.tabs(
        [
          {
            id: 'messages',
            label: 'Write messages',
          },
          {
            id: 'quick',
            label: 'Use a canned response',
          },
        ],
        _0x3d10d9.reply.mode,
        (_0xc83463) => {
          _0x3d10d9.reply.mode = _0xc83463;
          _0x75eb5a();
        },
      ).el,
    );
    if (_0x3d10d9.reply.mode === 'quick') {
      _0x6aa469.appendChild(
        _0x56ecc9.field(
          'Canned response',
          _0x56ecc9.select(
            [
              {
                value: '',
                label: _0x4d3306.length
                  ? 'Select a canned response'
                  : 'No canned responses yet',
              },
            ].concat(
              _0x4d3306.map((_0x411e7c) => ({
                value: _0x411e7c.id,
                label:
                  _0x411e7c.title +
                  (_0x411e7c.messages.length > 1 ? ' (funnel)' : ''),
              })),
            ),
            _0x3d10d9.reply.quickReplyId,
            (_0x5e1882) => {
              _0x3d10d9.reply.quickReplyId = _0x5e1882;
            },
          ),
        ),
      );
    } else {
      _0x6aa469.appendChild(
        messageEditor({
          app: _0x344ee2,
          messages: _0x3d10d9.reply.messages,
          allowDelay: true,
          onChange: () => {},
        }),
      );
    }
    const _0x3a228c = _0x3d10d9.options;
    _0x6aa469.appendChild(
      h(
        'div',
        {
          class: 'wc-checklist',
        },
        _0x56ecc9.checkbox(
          _0x3a228c.showTyping,
          (_0x4822bb) => {
            _0x3a228c.showTyping = _0x4822bb;
          },
          'Show "typing..." before replying',
        ),
        _0x56ecc9.checkbox(
          _0x3a228c.markRead,
          (_0x4fa156) => {
            _0x3a228c.markRead = _0x4fa156;
          },
          'Mark the conversation as read before replying',
        ),
        _0x56ecc9.checkbox(
          _0x3a228c.dontSendIfChatOpen,
          (_0x5bbe70) => {
            _0x3a228c.dontSendIfChatOpen = _0x5bbe70;
          },
          'Do not reply while that chat is open on screen',
        ),
        _0x3d10d9.target === 'group'
          ? _0x56ecc9.checkbox(
              _0x3a228c.replyPrivately,
              (_0x5e02bd) => {
                _0x3a228c.replyPrivately = _0x5e02bd;
              },
              'Reply to group messages privately, in a one to one chat',
            )
          : null,
        _0x3d10d9.target === 'group'
          ? _0x56ecc9.checkbox(
              _0x3a228c.mentionAll,
              (_0x1bc265) => {
                _0x3a228c.mentionAll = _0x1bc265;
              },
              'Mention all group participants in the message',
            )
          : null,
      ),
    );
    _0x6aa469.appendChild(
      _0x56ecc9.row(
        _0x56ecc9.field(
          'Wait before replying: minimum seconds',
          _0x56ecc9.input({
            type: 'number',
            min: 0,
            value: _0x3a228c.delayMin,
            onInput: (_0x46b698) => {
              _0x3a228c.delayMin = Number(_0x46b698) || 0;
              if (_0x3a228c.delayMax < _0x3a228c.delayMin) {
                _0x3a228c.delayMax = _0x3a228c.delayMin;
              }
            },
          }),
        ),
        _0x56ecc9.field(
          'Maximum seconds',
          _0x56ecc9.input({
            type: 'number',
            min: 0,
            value: _0x3a228c.delayMax,
            onInput: (_0x4566d1) => {
              _0x3a228c.delayMax = Number(_0x4566d1) || 0;
            },
          }),
        ),
      ),
    );
  }
  const _0x527e22 = _0x56ecc9.openDrawer({
    title: _0x153b09 ? 'Edit message bot' : 'Add message bot',
    width: 660,
    body: h(
      'div',
      {
        class: 'wc-form',
      },
      _0x56ecc9.section('Target', [
        _0x56ecc9.field(
          'Bot name',
          _0x56ecc9.input({
            value: _0x3d10d9.name,
            placeholder: 'e.g. Pricing questions',
            onInput: (_0x59bdda) => {
              _0x3d10d9.name = _0x59bdda;
            },
          }),
          {
            required: true,
          },
        ),
        _0x56ecc9.field(
          'Applies to',
          _0x56ecc9.radioCards(
            'wf-target',
            [
              {
                value: 'individual',
                label: 'One to one chats',
              },
              {
                value: 'group',
                label: 'Groups',
              },
            ],
            _0x3d10d9.target,
            (_0x497a40) => {
              _0x3d10d9.target = _0x497a40;
              _0xa1d156();
              _0x75eb5a();
            },
          ),
        ),
        _0x3bd46b,
        _0x56ecc9.field(
          'Status',
          h(
            'div',
            {
              class: 'wc-inline',
            },
            _0x56ecc9.toggle(
              _0x3d10d9.enabled,
              (_0x3b2d97) => {
                _0x3d10d9.enabled = _0x3b2d97;
              },
              'On',
            ),
            h(
              'span',
              {
                class: 'wc-muted',
              },
              'When on, the bot replies automatically. When off, it is saved but does nothing.',
            ),
          ),
        ),
      ]),
      _0x56ecc9.section('Trigger', [
        _0x56ecc9.field(
          'Execute on',
          _0x56ecc9.radioCards(
            'wf-exec',
            [
              {
                value: 'keyword',
                label: 'Selected keywords',
                hint: 'Only when the message contains your words.',
              },
              {
                value: 'every',
                label: 'Every incoming message',
              },
              {
                value: 'newChat',
                label: 'Every new chat',
                hint: 'Only the first message from someone new.',
              },
            ],
            _0x3d10d9.executeOn,
            (_0x518aef) => {
              _0x3d10d9.executeOn = _0x518aef;
              _0x56eb6c();
            },
          ),
        ),
        _0x4e03f6,
        _0x56ecc9.field(
          'Run only on these days (leave empty for every day)',
          dayChips(_0x3d10d9.days, (_0x4e833c) => {
            _0x3d10d9.days = _0x4e833c;
          }),
        ),
        _0x56ecc9.field(
          'Replies per chat',
          _0x56ecc9.input({
            type: 'number',
            min: 0,
            value: _0x3d10d9.limitPerChat,
            onInput: (_0x1a06a7) => {
              _0x3d10d9.limitPerChat = Math.max(0, Number(_0x1a06a7) || 0);
            },
          }),
          {
            hint: '0 means no limit. For example 1 makes it answer each chat only once.',
          },
        ),
      ]),
      _0x56ecc9.section('Reply', [_0x6aa469]),
      _0x56ecc9.section(
        'Post actions',
        [
          postActionsEditor(_0x344ee2, _0x3d10d9.post, {
            onChange: (_0x2698f5) => {
              _0x3d10d9.post = _0x2698f5;
            },
          }),
        ],
        {
          hint: 'What to do with the chat after replying.',
        },
      ),
      _0x4d12a4,
    ),
    footer: h(
      'div',
      {
        class: 'wc-modal-actions',
      },
      _0x56ecc9.button('Cancel', {
        variant: 'dark',
        onClick: () => _0x527e22.close(),
      }),
      _0x56ecc9.button('Save', {
        variant: 'primary',
        onClick: async () => {
          const _0x5924c5 = validateWorkflow(_0x3d10d9);
          if (!_0x5924c5.length && _0x3d10d9.reply.mode === 'messages') {
            for (const _0x597ace of _0x3d10d9.reply.messages) {
              const _0x291a7a = validateMessage(_0x597ace);
              if (_0x291a7a.length) {
                _0x5924c5.push(_0x291a7a[0]);
              }
            }
          }
          if (_0x5924c5.length) {
            _0x4d12a4.textContent = _0x5924c5[0];
            return;
          }
          await _0x344ee2.store.put(
            'workflows',
            Object.assign({}, _0x3d10d9, {
              name: _0x3d10d9.name.trim(),
              order:
                _0x3d10d9.order !== undefined
                  ? _0x3d10d9.order
                  : _0x344ee2.store.count('workflows'),
            }),
          );
          _0x527e22.close();
          _0x56ecc9.toast('Message bot saved', 'success');
        },
      }),
    ),
  });
  _0xa1d156();
  _0x56eb6c();
  _0x75eb5a();
  return _0x527e22;
}
export default {
  id: 'message-bot',
  title: 'Message Bot',
  subtitle:
    'Answer common questions instantly. The first matching bot, top to bottom, replies.',
  icon: 'bot',
  render(_0x18e2f2) {
    const { app: _0x5c4213 } = _0x18e2f2;
    const _0x26f6c9 = {
      query: '',
      selected: new Set(),
    };
    const _0x3b931d = h('div', {
      class: 'wc-stack',
    });
    function _0x102d7b() {
      clear(_0x3b931d);
      const _0x435723 = _0x5c4213.store.all('workflows');
      const _0x197f4c = _0x435723.filter(
        (_0x37ee12) =>
          !_0x26f6c9.query ||
          (_0x37ee12.name + ' ' + (_0x37ee12.keywords || []).join(' '))
            .toLowerCase()
            .includes(_0x26f6c9.query.toLowerCase()),
      );
      _0x3b931d.appendChild(
        _0x56ecc9.bulkBar(
          _0x26f6c9.selected.size,
          _0x56ecc9.button('Delete (' + _0x26f6c9.selected.size + ')', {
            variant: 'danger',
            size: 'sm',
            icon: 'trash-2',
            onClick: async () => {
              if (
                await _0x56ecc9.confirmDialog(
                  'Delete ' +
                    _0x26f6c9.selected.size +
                    ' selected message bot(s)?',
                  {
                    danger: true,
                    confirmLabel: 'Delete',
                  },
                )
              ) {
                for (const _0x53862b of _0x26f6c9.selected) {
                  await _0x5c4213.store.remove('workflows', _0x53862b);
                }
                _0x26f6c9.selected.clear();
              }
            },
          }),
        ),
      );
      if (!_0x435723.length) {
        _0x3b931d.appendChild(
          _0x56ecc9.emptyState(
            'bot',
            'No message bots yet',
            'Create one to answer keywords automatically.',
            _0x56ecc9.button('Add message bot', {
              icon: 'plus',
              variant: 'primary',
              onClick: () => openWorkflowEditor(_0x5c4213),
            }),
          ),
        );
        return;
      }
      const _0x2538e7 = h(
        'div',
        {
          class: 'wc-canlist',
        },
        _0x197f4c.map((_0xf0b0c3) =>
          h(
            'article',
            {
              class: 'wc-card wc-canrow',
              dataset: {
                id: _0xf0b0c3.id,
              },
            },
            h(
              'span',
              {
                class: 'wc-grip',
                title: 'Drag to change priority',
              },
              icon('grip-vertical', 16),
            ),
            _0x56ecc9.checkbox(
              _0x26f6c9.selected.has(_0xf0b0c3.id),
              (_0x177352) => {
                if (_0x177352) {
                  _0x26f6c9.selected.add(_0xf0b0c3.id);
                } else {
                  _0x26f6c9.selected.delete(_0xf0b0c3.id);
                }
                _0x102d7b();
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
                h('strong', null, _0xf0b0c3.name),
                _0x56ecc9.chip(
                  _0xf0b0c3.target === 'group' ? 'Groups' : 'One to one',
                  'neutral',
                ),
                _0x56ecc9.chip(
                  _0xf0b0c3.executeOn === 'keyword'
                    ? 'Keywords'
                    : _0xf0b0c3.executeOn === 'every'
                      ? 'Every message'
                      : 'New chats',
                  'accent',
                ),
                hasActions(_0xf0b0c3.post)
                  ? _0x56ecc9.chip('Post actions', 'info')
                  : null,
              ),
              h(
                'p',
                {
                  class: 'wc-canpreview',
                },
                _0xf0b0c3.executeOn === 'keyword'
                  ? (_0xf0b0c3.keywords || []).join(', ')
                  : 'Replies to ' +
                      (_0xf0b0c3.executeOn === 'every'
                        ? 'every incoming message'
                        : 'the first message of every new chat'),
              ),
              h(
                'span',
                {
                  class: 'wc-muted wc-small',
                },
                'Modified ' + fmtDateTime(_0xf0b0c3.updatedAt),
              ),
            ),
            h(
              'div',
              {
                class: 'wc-row-actions',
              },
              _0x56ecc9.toggle(
                _0xf0b0c3.enabled !== false,
                (_0x9d0a5d) =>
                  _0x5c4213.store.patch('workflows', _0xf0b0c3.id, {
                    enabled: _0x9d0a5d,
                  }),
                'Active',
              ),
              _0x56ecc9.iconButton('pencil', 'Edit', () =>
                openWorkflowEditor(_0x5c4213, _0xf0b0c3),
              ),
              _0x56ecc9.iconButton('copy', 'Clone', async () => {
                const _0x27acec = clone(_0xf0b0c3);
                delete _0x27acec.id;
                delete _0x27acec.createdAt;
                _0x27acec.name += ' (copy)';
                _0x27acec.enabled = false;
                _0x27acec.order = _0x5c4213.store.count('workflows');
                await _0x5c4213.store.put('workflows', _0x27acec);
              }),
              _0x56ecc9.iconButton(
                'trash-2',
                'Delete',
                async () => {
                  if (
                    await _0x56ecc9.confirmDialog(
                      'Are you sure you want to delete this message bot?',
                      {
                        danger: true,
                        confirmLabel: 'Delete',
                      },
                    )
                  ) {
                    _0x5c4213.store.remove('workflows', _0xf0b0c3.id);
                  }
                },
                'is-danger',
              ),
            ),
          ),
        ),
      );
      _0x3b931d.appendChild(_0x2538e7);
      if (!_0x26f6c9.query) {
        _0x56ecc9.makeSortable(_0x2538e7, {
          itemSelector: '.wc-canrow',
          handleSelector: '.wc-grip',
          onReorder: async (_0x1ede5f) => {
            for (let _0x50dea1 = 0; _0x50dea1 < _0x1ede5f.length; _0x50dea1++) {
              await _0x5c4213.store.patch('workflows', _0x1ede5f[_0x50dea1], {
                order: _0x50dea1,
              });
            }
          },
        });
      }
    }
    _0x18e2f2.setActions([
      _0x56ecc9.button('Add message bot', {
        icon: 'plus',
        variant: 'primary',
        onClick: () => openWorkflowEditor(_0x5c4213),
      }),
    ]);
    _0x18e2f2.onDispose(
      _0x5c4213.store.on('workflows', debounce(_0x102d7b, 30)),
    );
    _0x102d7b();
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
        _0x56ecc9.searchInput('Search bots or keywords', (_0x25dd99) => {
          _0x26f6c9.query = _0x25dd99.trim();
          _0x102d7b();
        }),
      ),
      _0x3b931d,
    );
  },
};
