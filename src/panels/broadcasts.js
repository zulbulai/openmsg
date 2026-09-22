import { h, icon, clear } from '../ui/dom.js';
import * as _0x2b2504 from '../ui/kit.js';
import { messageEditor } from '../ui/message-editor.js';
import { numbersEditor, postActionsEditor, chatSelect } from '../ui/pickers.js';
import { scheduleEditor } from '../ui/schedule-editor.js';
import {
  newCampaign,
  validateCampaign,
  CAMPAIGN_STATUS,
} from '../core/scheduler.js';
import {
  validateMessage,
  summarizeMessage,
  newMessage,
} from '../core/messages.js';
import { describeRule } from '../core/timecalc.js';
import { toCsv } from '../core/csv.js';
import {
  fmtDateTime,
  download,
  clone,
  debounce,
  plural,
} from '../core/util.js';
const STATUS_TONE = {
  compose: 'neutral',
  pending: 'info',
  running: 'accent',
  paused: 'warn',
  completed: 'ok',
  discarded: 'neutral',
  missed: 'danger',
};
export function openProgress(_0x3acfa3, _0x47daa2) {
  const _0x15082f = h('div', {
    class: 'wc-stack',
  });
  const _0x56f556 = _0x2b2504.openModal({
    title: 'Sending progress',
    width: 620,
    body: _0x15082f,
    onClose: () => {
      _0x2a26bb();
      clearInterval(_0x46623b);
    },
  });
  function _0x360e2d() {
    const _0x21019b = _0x3acfa3.store.get('campaigns', _0x47daa2);
    clear(_0x15082f);
    if (!_0x21019b) {
      _0x15082f.appendChild(
        h(
          'div',
          {
            class: 'wc-muted',
          },
          'This campaign was deleted.',
        ),
      );
      return;
    }
    const _0xe0193d = _0x21019b.run;
    const _0x4c8b75 = _0xe0193d ? _0xe0193d.total : 0;
    const _0x3d0147 = _0xe0193d ? _0xe0193d.sent + _0xe0193d.failed : 0;
    _0x15082f.appendChild(
      h(
        'div',
        {
          class: 'wc-inline wc-between',
        },
        h('strong', null, _0x21019b.name),
        _0x2b2504.chip(
          CAMPAIGN_STATUS[_0x21019b.status],
          STATUS_TONE[_0x21019b.status],
        ),
      ),
    );
    if (!_0xe0193d) {
      _0x15082f.appendChild(
        _0x2b2504.banner('Nothing has been sent yet.', 'info'),
      );
      return;
    }
    _0x15082f.appendChild(
      _0x2b2504.progress(
        _0x4c8b75 ? Math.round((_0x3d0147 / _0x4c8b75) * 100) : 0,
      ),
    );
    _0x15082f.appendChild(
      h(
        'div',
        {
          class: 'wc-stats',
        },
        h(
          'div',
          null,
          h('strong', null, String(_0x4c8b75)),
          h('span', null, 'Total'),
        ),
        h(
          'div',
          null,
          h('strong', null, String(_0xe0193d.sent)),
          h('span', null, 'Sent'),
        ),
        h(
          'div',
          null,
          h('strong', null, String(_0xe0193d.failed)),
          h('span', null, 'Failed'),
        ),
        h(
          'div',
          null,
          h('strong', null, String(_0xe0193d.pending.length)),
          h('span', null, 'Pending'),
        ),
      ),
    );
    const _0x5c39fd = _0xe0193d.results.slice(-40).reverse();
    _0x15082f.appendChild(
      _0x2b2504.table(
        ['Contact', 'Result', 'Detail'],
        _0x5c39fd.map((_0x13d88f) => [
          _0x13d88f.name || _0x3acfa3.wa.chatName(_0x13d88f.chatId),
          _0x2b2504.chip(
            _0x13d88f.ok ? 'Sent' : 'Failed',
            _0x13d88f.ok ? 'ok' : 'danger',
          ),
          _0x13d88f.error || '',
        ]),
        {
          empty: h(
            'div',
            {
              class: 'wc-muted wc-pad',
            },
            'No messages sent yet.',
          ),
        },
      ),
    );
    const _0x4acf0e = h('div', {
      class: 'wc-inline',
    });
    if (_0x21019b.status === 'running') {
      _0x4acf0e.appendChild(
        _0x2b2504.button('Pause', {
          icon: 'pause',
          onClick: () => _0x3acfa3.scheduler.pause(_0x47daa2),
        }),
      );
    }
    if (_0x21019b.status === 'paused') {
      _0x4acf0e.appendChild(
        _0x2b2504.button('Resume', {
          icon: 'play',
          variant: 'primary',
          onClick: () => _0x3acfa3.scheduler.resume(_0x47daa2),
        }),
      );
    }
    if (['running', 'paused', 'pending'].includes(_0x21019b.status)) {
      _0x4acf0e.appendChild(
        _0x2b2504.button('Discard', {
          icon: 'ban',
          variant: 'danger',
          onClick: async () => {
            if (
              await _0x2b2504.confirmDialog(
                'Discard this broadcast? The people who have not received it yet will be skipped.',
                {
                  danger: true,
                  confirmLabel: 'Discard',
                },
              )
            ) {
              _0x3acfa3.scheduler.discard(_0x47daa2);
            }
          },
        }),
      );
    }
    _0x4acf0e.appendChild(
      _0x2b2504.button('Download report', {
        icon: 'file-down',
        onClick: () => downloadReport(_0x3acfa3, _0x21019b),
      }),
    );
    _0x15082f.appendChild(_0x4acf0e);
  }
  const _0x2a26bb = _0x3acfa3.bus.on('campaign:progress', (_0xa7547) => {
    if (_0xa7547.id === _0x47daa2) {
      _0x360e2d();
    }
  });
  const _0x53c04b = _0x3acfa3.store.on('campaigns', debounce(_0x360e2d, 60));
  const _0x46623b = setInterval(_0x360e2d, 2000);
  _0x360e2d();
  return _0x56f556;
}
export function announceStarted(_0x9ea18d, _0xd5b5e5) {
  if (!_0xd5b5e5) {
    return;
  }
  if (_0xd5b5e5.status !== 'running') {
    openProgress(_0x9ea18d, _0xd5b5e5.id);
    return;
  }
  _0x2b2504.toast(
    'Sending to ' +
      plural(_0xd5b5e5.run ? _0xd5b5e5.run.total : 0, 'chat') +
      ' in the background. You can keep using WhatsApp.',
    'success',
    {
      ttl: 7000,
      action: {
        label: 'View progress',
        onClick: () => openProgress(_0x9ea18d, _0xd5b5e5.id),
      },
    },
  );
}
export function downloadReport(_0x2a9398, _0x514802) {
  const _0x3e30e8 = _0x2a9398.scheduler.report(_0x514802.id);
  download(
    _0x514802.name.replace(/\W+/g, '-') + '-report.csv',
    toCsv(
      [['Name', 'Chat', 'Status', 'Detail', 'Time']].concat(
        _0x3e30e8.map((_0x31c3f4) => [
          _0x31c3f4.name,
          _0x31c3f4.chat,
          _0x31c3f4.status,
          _0x31c3f4.detail,
          _0x31c3f4.time,
        ]),
      ),
    ),
    'text/csv',
  );
}
export function stepTarget(_0x11cf5f, _0x45e679, _0xae087 = {}) {
  const _0x147a28 = h('div', {
    class: 'wc-form',
  });
  const _0xcee7bb = _0x45e679.targets;
  const _0x49b0e2 = _0x2b2504.multiSelect({
    options: [],
    value: _0xcee7bb.groupIds,
    placeholder: 'Select groups',
    onChange: (_0x598c36) => {
      _0xcee7bb.groupIds = _0x598c36;
    },
  });
  _0x11cf5f.wa
    .groups()
    .then((_0x180d92) =>
      _0x49b0e2.setOptions(
        _0x180d92.map((_0x596e14) => ({
          value: _0x596e14.id,
          label: _0x596e14.name,
        })),
      ),
    )
    .catch(() => {});
  const _0x4686d8 = _0x2b2504.multiSelect({
    options: [],
    value: _0xcee7bb.labelIds,
    placeholder: 'Select labels',
    onChange: (_0x17cfbd) => {
      _0xcee7bb.labelIds = _0x17cfbd;
    },
  });
  _0x11cf5f.wa
    .labels()
    .then((_0x5e9301) =>
      _0x4686d8.setOptions(
        _0x5e9301.map((_0x126ba8) => ({
          value: _0x126ba8.id,
          label: _0x126ba8.name,
          color: _0x126ba8.color,
        })),
      ),
    )
    .catch(() => {});
  const _0x3656eb = h(
    'span',
    {
      class: 'wc-muted',
    },
    '',
  );
  const _0x12bc2f = _0x2b2504.input({
    value: _0x45e679.name,
    placeholder:
      _0x45e679.kind === 'schedule'
        ? 'Enter schedule name'
        : 'Enter broadcast name',
    onInput: (_0x39b598) => {
      _0x45e679.name = _0x39b598;
    },
  });
  _0x147a28.appendChild(
    _0x2b2504.field(
      _0x45e679.kind === 'schedule' ? 'Schedule name' : 'Broadcast name',
      _0x12bc2f,
      {
        required: true,
      },
    ),
  );
  if (_0x45e679.kind === 'schedule') {
    const _0x6597f2 =
      (_0xcee7bb.individuals[0] && _0xcee7bb.individuals[0].chatId) ||
      _0xae087.chatId ||
      '';
    if (_0x6597f2 && !_0xcee7bb.individuals.length) {
      _0xcee7bb.individuals = [
        {
          chatId: _0x6597f2,
          name: _0x11cf5f.crm.displayName(_0x6597f2),
        },
      ];
    }
    _0x147a28.appendChild(
      _0x2b2504.field(
        'Schedule for',
        chatSelect(_0x11cf5f, {
          value: _0x6597f2,
          placeholder: 'Select a chat',
          onChange: (_0x20013e) => {
            _0xcee7bb.individuals = _0x20013e
              ? [
                  {
                    chatId: _0x20013e,
                    name: _0x11cf5f.crm.displayName(_0x20013e),
                  },
                ]
              : [];
            if (_0x20013e && !_0x45e679.name.trim()) {
              _0x45e679.name =
                'Schedule for ' + _0x11cf5f.crm.displayName(_0x20013e);
              _0x12bc2f.value = _0x45e679.name;
            }
          },
        }),
        {
          required: true,
        },
      ),
    );
    return _0x147a28;
  }
  _0x147a28.appendChild(
    _0x2b2504.field(
      'Individual contacts',
      numbersEditor(_0x11cf5f, {
        value: _0xcee7bb.individuals,
        onChange: (_0x473a2d) => {
          _0xcee7bb.individuals = _0x473a2d;
        },
      }),
      {
        hint: 'Phone numbers with country code. Message to individual chats.',
      },
    ),
  );
  _0x147a28.appendChild(
    _0x2b2504.row(
      _0x2b2504.field('Groups', _0x49b0e2, {
        hint: 'Message to groups.',
      }),
      _0x2b2504.field(
        'Custom tabs',
        _0x2b2504.multiSelect({
          options: _0x11cf5f.crm.tabs().map((_0x1bac24) => ({
            value: _0x1bac24.id,
            label: _0x1bac24.title,
          })),
          value: _0xcee7bb.tabIds,
          placeholder: 'Select tabs',
          onChange: (_0x3720e3) => {
            _0xcee7bb.tabIds = _0x3720e3;
          },
        }),
        {
          hint: 'Message to the chats in those tabs.',
        },
      ),
    ),
  );
  _0x147a28.appendChild(
    _0x2b2504.row(
      _0x2b2504.field(
        'Kanban boards',
        _0x2b2504.multiSelect({
          options: _0x11cf5f.crm.stageOptions(),
          value: _0xcee7bb.stageIds,
          placeholder: 'Select boards',
          onChange: (_0x57e517) => {
            _0xcee7bb.stageIds = _0x57e517;
          },
        }),
      ),
      _0x2b2504.field(
        'CRM tags',
        _0x2b2504.multiSelect({
          options: _0x11cf5f.crm.tags().map((_0x5e7e6e) => ({
            value: _0x5e7e6e.id,
            label: _0x5e7e6e.name,
            color: _0x5e7e6e.color,
          })),
          value: _0xcee7bb.tagIds,
          placeholder: 'Select tags',
          onChange: (_0x339fcd) => {
            _0xcee7bb.tagIds = _0x339fcd;
          },
        }),
      ),
    ),
  );
  _0x147a28.appendChild(
    _0x2b2504.field('WhatsApp labels (Business)', _0x4686d8),
  );
  _0x147a28.appendChild(
    h(
      'div',
      {
        class: 'wc-inline',
      },
      _0x2b2504.checkbox(
        _0xcee7bb.allowDuplicates,
        (_0xddc00a) => {
          _0xcee7bb.allowDuplicates = _0xddc00a;
        },
        'Allow duplicate numbers',
      ),
      _0x2b2504.button('Count recipients', {
        size: 'sm',
        icon: 'users',
        onClick: async () => {
          _0x3656eb.textContent = 'Counting...';
          try {
            const _0x205de1 =
              await _0x11cf5f.scheduler.resolveRecipients(_0x45e679);
            _0x3656eb.textContent =
              '' +
              plural(_0x205de1.recipients.length, 'recipient') +
              (_0x205de1.failed.length
                ? ', ' + _0x205de1.failed.length + ' not on WhatsApp'
                : '');
          } catch (_0x197c9b) {
            _0x3656eb.textContent = _0x197c9b.message;
          }
        },
      }),
      _0x3656eb,
    ),
  );
  return _0x147a28;
}
export function stepMessage(_0x4aaf53, _0x10f35d) {
  const _0x1dbcf4 = h('div', {
    class: 'wc-form',
  });
  const _0x8c1021 = h(
    'span',
    {
      class: 'wc-field-hint wc-warn-text',
    },
    '',
  );
  const _0x1fa86a = () => {
    _0x8c1021.textContent =
      _0x10f35d.delay.min < 3
        ? 'Sending faster than one message every 3 seconds may cause WhatsApp to flag your number.'
        : '';
  };
  if (!_0x10f35d.messages.length) {
    _0x10f35d.messages.push(newMessage('none'));
  }
  _0x1dbcf4.appendChild(
    messageEditor({
      app: _0x4aaf53,
      messages: _0x10f35d.messages,
      allowDelay: false,
      onChange: () => {},
    }),
  );
  if (_0x10f35d.kind === 'broadcast') {
    _0x1dbcf4.appendChild(
      _0x2b2504.checkbox(
        _0x10f35d.sendRandom,
        (_0x2f21ca) => {
          _0x10f35d.sendRandom = _0x2f21ca;
        },
        'Send one random message from the list to each person (helps avoid identical messages)',
      ),
    );
  }
  _0x1dbcf4.appendChild(
    h(
      'div',
      {
        class: 'wc-section-title',
      },
      'Sending delay',
    ),
  );
  _0x1dbcf4.appendChild(
    _0x2b2504.row(
      _0x2b2504.field(
        'Wait between people: minimum seconds',
        _0x2b2504.input({
          type: 'number',
          min: 0,
          value: _0x10f35d.delay.min,
          onInput: (_0x1ba00f) => {
            _0x10f35d.delay.min = Number(_0x1ba00f) || 0;
            if (_0x10f35d.delay.max < _0x10f35d.delay.min) {
              _0x10f35d.delay.max = _0x10f35d.delay.min;
            }
            _0x1fa86a();
          },
        }),
      ),
      _0x2b2504.field(
        'Maximum seconds',
        _0x2b2504.input({
          type: 'number',
          min: 0,
          value: _0x10f35d.delay.max,
          onInput: (_0x4d6190) => {
            _0x10f35d.delay.max = Number(_0x4d6190) || 0;
            _0x1fa86a();
          },
        }),
      ),
    ),
  );
  _0x1dbcf4.appendChild(_0x8c1021);
  _0x1fa86a();
  if (_0x10f35d.kind === 'broadcast') {
    _0x1dbcf4.appendChild(
      _0x2b2504.checkbox(
        _0x10f35d.pause.enabled,
        (_0x3d276b) => {
          _0x10f35d.pause.enabled = _0x3d276b;
          _0x3cc587.hidden = !_0x3d276b;
        },
        'Take a longer break every few contacts',
      ),
    );
    const _0x3cc587 = _0x2b2504.row(
      _0x2b2504.field(
        'After this many contacts',
        _0x2b2504.input({
          type: 'number',
          min: 1,
          value: _0x10f35d.pause.afterContacts,
          onInput: (_0x5deb18) => {
            _0x10f35d.pause.afterContacts = Math.max(1, Number(_0x5deb18) || 1);
          },
        }),
      ),
      _0x2b2504.field(
        'Pause for (seconds)',
        _0x2b2504.input({
          type: 'number',
          min: 1,
          value: _0x10f35d.pause.seconds,
          onInput: (_0x21e967) => {
            _0x10f35d.pause.seconds = Math.max(1, Number(_0x21e967) || 1);
          },
        }),
      ),
    );
    _0x3cc587.hidden = !_0x10f35d.pause.enabled;
    _0x1dbcf4.appendChild(_0x3cc587);
  }
  return _0x1dbcf4;
}
export function stepSchedule(_0x22e81d, _0x26fb9f) {
  const _0x278d46 = h('div', {
    class: 'wc-form',
  });
  const _0x4d34f2 = h('div', null);
  function _0x736444() {
    clear(_0x4d34f2);
    if (_0x26fb9f.startMode === 'schedule') {
      if (!_0x26fb9f.schedule.startAt) {
        _0x26fb9f.schedule.startAt = Date.now() + 3600000;
      }
      _0x4d34f2.appendChild(
        scheduleEditor({
          value: _0x26fb9f.schedule,
          allowRepeat: true,
          onChange: () => {},
        }),
      );
    }
  }
  _0x278d46.appendChild(
    _0x2b2504.field(
      'What should happen',
      _0x2b2504.radioCards(
        'cw-start',
        [
          {
            value: 'now',
            label: 'Start immediately',
            hint: 'Begins as soon as you submit.',
          },
          {
            value: 'schedule',
            label: 'Schedule',
            hint: 'Pick a date and time, or repeat. WhatsApp Web must be open then.',
          },
          {
            value: 'compose',
            label: 'Save as draft',
            hint: 'Keep it for later without sending anything.',
          },
        ],
        _0x26fb9f.startMode,
        (_0x122325) => {
          _0x26fb9f.startMode = _0x122325;
          _0x736444();
        },
      ),
    ),
  );
  _0x278d46.appendChild(_0x4d34f2);
  _0x736444();
  const _0x849b8d = _0x26fb9f.options;
  _0x278d46.appendChild(
    h(
      'div',
      {
        class: 'wc-checklist',
      },
      _0x2b2504.checkbox(
        _0x849b8d.resumeIfReload,
        (_0x564297) => {
          _0x849b8d.resumeIfReload = _0x564297;
        },
        'Resume if the window reloads',
      ),
      _0x2b2504.checkbox(
        _0x849b8d.autoSendIfMissed,
        (_0x599fae) => {
          _0x849b8d.autoSendIfMissed = _0x599fae;
        },
        'Send automatically even if the scheduled time has passed',
      ),
      _0x26fb9f.kind === 'broadcast'
        ? _0x2b2504.checkbox(
            _0x849b8d.mentionAll,
            (_0x403e38) => {
              _0x849b8d.mentionAll = _0x403e38;
            },
            'Mention all group participants in group messages',
          )
        : null,
      _0x26fb9f.kind === 'schedule'
        ? _0x2b2504.checkbox(
            _0x849b8d.discardOnReply,
            (_0x5c97c2) => {
              _0x849b8d.discardOnReply = _0x5c97c2;
            },
            'Discard if the recipient replies before it is sent',
          )
        : null,
    ),
  );
  _0x278d46.appendChild(
    h(
      'details',
      {
        class: 'wc-details',
      },
      h('summary', null, 'Actions after sending'),
      postActionsEditor(_0x22e81d, _0x26fb9f.post, {
        onChange: (_0xc88217) => {
          _0x26fb9f.post = _0xc88217;
        },
      }),
    ),
  );
  return _0x278d46;
}
export function targetSummary(_0x49af86) {
  const _0x1627cf = [];
  if (_0x49af86.individuals.length) {
    _0x1627cf.push(plural(_0x49af86.individuals.length, 'contact'));
  }
  if (_0x49af86.groupIds.length) {
    _0x1627cf.push(plural(_0x49af86.groupIds.length, 'group'));
  }
  if (_0x49af86.tabIds.length) {
    _0x1627cf.push(plural(_0x49af86.tabIds.length, 'tab'));
  }
  if (_0x49af86.stageIds.length) {
    _0x1627cf.push(plural(_0x49af86.stageIds.length, 'board'));
  }
  if (_0x49af86.tagIds.length) {
    _0x1627cf.push(plural(_0x49af86.tagIds.length, 'tag'));
  }
  if (_0x49af86.labelIds.length) {
    _0x1627cf.push(plural(_0x49af86.labelIds.length, 'label'));
  }
  return _0x1627cf.join(', ');
}
function stepReview(_0x22e6ce, _0x502f9b) {
  const _0xb19662 =
    _0x502f9b.startMode === 'now'
      ? 'Immediately'
      : _0x502f9b.startMode === 'compose'
        ? 'Saved as a draft'
        : fmtDateTime(_0x502f9b.schedule.startAt) +
          ' · ' +
          describeRule(_0x502f9b.schedule);
  const _0x4e83b4 = (_0x2d1954, _0x48f63c) =>
    h(
      'div',
      {
        class: 'wc-kv-row',
      },
      h(
        'span',
        {
          class: 'wc-kv-k',
        },
        _0x2d1954,
      ),
      h(
        'span',
        {
          class: 'wc-kv-v',
        },
        _0x48f63c,
      ),
    );
  const _0x3b09fb = Number(_0x22e6ce.store.setting('maxSendsPerHour')) || 0;
  return h(
    'div',
    {
      class: 'wc-form',
    },
    h(
      'div',
      {
        class: 'wc-kv',
      },
      _0x4e83b4('Name', _0x502f9b.name || '(no name)'),
      _0x4e83b4(
        _0x502f9b.kind === 'schedule' ? 'Chat' : 'Recipients',
        targetSummary(_0x502f9b.targets) || 'None chosen',
      ),
      _0x4e83b4('When', _0xb19662),
      _0x4e83b4(
        'Wait between people',
        _0x502f9b.delay.min + ' to ' + _0x502f9b.delay.max + ' seconds',
      ),
    ),
    _0x502f9b.startMode !== 'compose' && _0x3b09fb
      ? _0x2b2504.banner(
          'Your safety limit is ' +
            _0x3b09fb +
            ' automatic messages per hour. Bigger lists pause automatically and continue.',
          'info',
        )
      : null,
    h(
      'div',
      {
        class: 'wc-section-title',
      },
      'Messages',
    ),
    _0x502f9b.messages.map((_0x15e313) =>
      h(
        'div',
        {
          class: 'wc-bubble-preview',
        },
        h(
          'div',
          {
            class: 'wc-bubble',
          },
          h(
            'span',
            {
              class: 'wc-prewrap',
            },
            summarizeMessage(_0x15e313),
          ),
        ),
      ),
    ),
  );
}
export function openCampaignWizard(_0x11fa13, _0x18305f, _0x11929e = {}) {
  const _0x366c4d = _0x11929e.kind || 'broadcast';
  const _0x5d2533 = !!_0x11929e.campaign && !!_0x11929e.campaign.id;
  const _0x599d2a = _0x5d2533
    ? clone(_0x11929e.campaign)
    : Object.assign(newCampaign(_0x366c4d), _0x11929e.preset || {});
  if (!_0x599d2a.messages.length) {
    _0x599d2a.messages.push(newMessage('none'));
  }
  if (_0x599d2a.startMode === 'compose' && !_0x5d2533) {
    _0x599d2a.startMode = _0x366c4d === 'schedule' ? 'schedule' : 'now';
  }
  const _0x20c960 = [
    {
      id: 'target',
      label: _0x366c4d === 'schedule' ? 'Choose chat' : 'Choose target',
      build: () => stepTarget(_0x11fa13, _0x599d2a, _0x11929e),
    },
    {
      id: 'message',
      label: 'Message and delay',
      build: () => stepMessage(_0x11fa13, _0x599d2a),
    },
    {
      id: 'schedule',
      label: 'Scheduling and action',
      build: () => stepSchedule(_0x11fa13, _0x599d2a),
    },
    {
      id: 'review',
      label: 'Preview and submit',
      build: () => stepReview(_0x11fa13, _0x599d2a),
    },
  ];
  let _0x3662eb = 0;
  const _0x43837d = h('ol', {
    class: 'wc-stepper',
  });
  const _0xec078d = h('div', {
    class: 'wc-wizard-body',
  });
  const _0x3e4da9 = h('div', {
    class: 'wc-field-error',
  });
  const _0x21e0dc = h('div', {
    class: 'wc-modal-actions',
  });
  function _0x2e2c63(_0x153818) {
    if (_0x153818 === 0) {
      const _0x53dccb = validateCampaign(
        Object.assign({}, _0x599d2a, {
          messages: [{}],
          startMode: 'compose',
        }),
      ).filter((_0x1359ba) => /name|contact/i.test(_0x1359ba));
      return _0x53dccb[0] || '';
    }
    if (_0x153818 === 1) {
      if (!_0x599d2a.messages.length) {
        return 'Add at least one message.';
      }
      for (const _0x2ce8a1 of _0x599d2a.messages) {
        const _0x37ccf7 = validateMessage(_0x2ce8a1);
        if (_0x37ccf7.length) {
          return _0x37ccf7[0];
        }
      }
      if (_0x599d2a.delay.max < _0x599d2a.delay.min) {
        return 'The maximum delay must be at least the minimum.';
      }
      return '';
    }
    if (
      _0x153818 === 2 &&
      _0x599d2a.startMode === 'schedule' &&
      !_0x599d2a.schedule.startAt
    ) {
      return 'Pick a date and time.';
    }
    return '';
  }
  function _0x172863() {
    clear(_0x43837d);
    clear(_0xec078d);
    clear(_0x21e0dc);
    _0x3e4da9.textContent = '';
    _0x20c960.forEach((_0x572c3b, _0x3ea09d) =>
      _0x43837d.appendChild(
        h(
          'li',
          {
            class:
              'wc-step' +
              (_0x3ea09d === _0x3662eb ? ' is-active' : '') +
              (_0x3ea09d < _0x3662eb ? ' is-done' : ''),
          },
          h(
            'span',
            {
              class: 'wc-step-num',
            },
            _0x3ea09d < _0x3662eb ? icon('check', 14) : String(_0x3ea09d + 1),
          ),
          h(
            'span',
            {
              class: 'wc-step-label',
            },
            _0x572c3b.label,
          ),
        ),
      ),
    );
    _0xec078d.appendChild(_0x20c960[_0x3662eb].build());
    _0x21e0dc.appendChild(
      _0x2b2504.button(_0x3662eb === 0 ? 'Cancel' : 'Back', {
        variant: 'dark',
        onClick: () => {
          if (_0x3662eb === 0) {
            _0x56bc28.close();
          } else {
            _0x3662eb--;
            _0x172863();
          }
        },
      }),
    );
    const _0x3358d7 = _0x3662eb === _0x20c960.length - 1;
    _0x21e0dc.appendChild(
      _0x2b2504.button(
        _0x3358d7
          ? _0x599d2a.startMode === 'now'
            ? 'Send now'
            : _0x599d2a.startMode === 'compose'
              ? 'Save draft'
              : 'Schedule'
          : 'Next',
        {
          variant: 'primary',
          onClick: async () => {
            const _0x303a74 = _0x2e2c63(_0x3662eb);
            if (_0x303a74) {
              _0x3e4da9.textContent = _0x303a74;
              return;
            }
            if (!_0x3358d7) {
              _0x3662eb++;
              _0x172863();
              return;
            }
            try {
              const _0x45c53c = validateCampaign(
                Object.assign({}, _0x599d2a, {
                  startMode: _0x599d2a.startMode,
                }),
              );
              if (_0x599d2a.startMode !== 'compose' && _0x45c53c.length) {
                _0x3e4da9.textContent = _0x45c53c[0];
                return;
              }
              const _0x6ffe4a = await _0x11fa13.scheduler.save(_0x599d2a);
              _0x56bc28.close();
              if (_0x599d2a.startMode === 'now') {
                announceStarted(
                  _0x11fa13,
                  await _0x11fa13.scheduler.startNow(_0x6ffe4a.id),
                );
              } else {
                _0x2b2504.toast(
                  _0x599d2a.startMode === 'compose'
                    ? 'Draft saved'
                    : 'Scheduled for ' + fmtDateTime(_0x6ffe4a.nextRunAt),
                  'success',
                );
              }
              if (_0x11929e.onSaved) {
                _0x11929e.onSaved(_0x6ffe4a);
              }
            } catch (_0x3df2b9) {
              _0x3e4da9.textContent = _0x3df2b9.message;
            }
          },
        },
      ),
    );
  }
  const _0x56bc28 = _0x2b2504.openDrawer({
    title: _0x5d2533
      ? 'Edit ' + (_0x366c4d === 'schedule' ? 'schedule' : 'broadcast')
      : _0x366c4d === 'schedule'
        ? 'Add schedule'
        : 'Add scheduled broadcast',
    width: 720,
    body: h('div', null, _0x43837d, _0xec078d, _0x3e4da9),
    footer: _0x21e0dc,
  });
  _0x172863();
  return _0x56bc28;
}
export function campaignList(
  _0x8872cc,
  _0x4a5a92,
  _0x3e68e0,
  _0x229a12 = (_0x23a8a7) => _0x23a8a7.kind === _0x4a5a92,
) {
  const { app: _0x2853e4, shell: _0x7934d6 } = _0x8872cc;
  const _0x1a1abb = {
    tab: 'upcoming',
    query: '',
    selected: new Set(),
    page: 0,
    size: 10,
  };
  const _0x325b3a = h('div', {
    class: 'wc-stack',
  });
  const _0x1538f5 = ['compose', 'pending', 'running', 'paused'];
  function _0x1ad4ec() {
    clear(_0x325b3a);
    const _0x440b28 = _0x2853e4.store.filter('campaigns', _0x229a12);
    const _0x155ce4 = _0x440b28
      .filter((_0xb4dd2e) =>
        _0x1a1abb.tab === 'upcoming'
          ? _0x1538f5.includes(_0xb4dd2e.status)
          : !_0x1538f5.includes(_0xb4dd2e.status),
      )
      .filter(
        (_0x59db01) =>
          !_0x1a1abb.query ||
          _0x59db01.name.toLowerCase().includes(_0x1a1abb.query.toLowerCase()),
      )
      .sort(
        (_0x55ba07, _0x49e52b) => _0x49e52b.updatedAt - _0x55ba07.updatedAt,
      );
    const _0x220367 = _0x155ce4.slice(
      _0x1a1abb.page * _0x1a1abb.size,
      (_0x1a1abb.page + 1) * _0x1a1abb.size,
    );
    _0x325b3a.appendChild(
      _0x2b2504.bulkBar(
        _0x1a1abb.selected.size,
        _0x2b2504.button('Delete (' + _0x1a1abb.selected.size + ')', {
          variant: 'danger',
          size: 'sm',
          icon: 'trash-2',
          onClick: async () => {
            if (
              await _0x2b2504.confirmDialog('Delete the selected items?', {
                danger: true,
                confirmLabel: 'Delete',
              })
            ) {
              for (const _0x45d4d5 of _0x1a1abb.selected) {
                await _0x2853e4.scheduler.remove(_0x45d4d5);
              }
              _0x1a1abb.selected.clear();
            }
          },
        }),
      ),
    );
    _0x325b3a.appendChild(
      _0x2b2504.table(
        ['', 'Name', 'Status', 'When', 'Progress', ''],
        _0x220367.map((_0x277572) => {
          const _0x5d6818 = _0x277572.run;
          const _0x3f9fdb =
            _0x5d6818 && _0x5d6818.total
              ? Math.round(
                  ((_0x5d6818.sent + _0x5d6818.failed) / _0x5d6818.total) * 100,
                )
              : 0;
          const _0x38e72c = [];
          if (_0x277572.status === 'running' || _0x5d6818) {
            _0x38e72c.push(
              _0x2b2504.iconButton('history', 'View progress', () =>
                openProgress(_0x2853e4, _0x277572.id),
              ),
            );
          }
          if (['compose', 'pending'].includes(_0x277572.status)) {
            _0x38e72c.push(
              _0x2b2504.iconButton('play', 'Start now', async () => {
                try {
                  announceStarted(
                    _0x2853e4,
                    await _0x2853e4.scheduler.startNow(_0x277572.id),
                  );
                } catch (_0x138041) {
                  _0x2b2504.toast(_0x138041.message, 'error');
                }
              }),
            );
          }
          if (_0x277572.status === 'running') {
            _0x38e72c.push(
              _0x2b2504.iconButton('pause', 'Pause', () =>
                _0x2853e4.scheduler.pause(_0x277572.id),
              ),
            );
          }
          if (_0x277572.status === 'paused') {
            _0x38e72c.push(
              _0x2b2504.iconButton('play', 'Resume', () =>
                _0x2853e4.scheduler.resume(_0x277572.id),
              ),
            );
          }
          if (['compose', 'pending', 'paused'].includes(_0x277572.status)) {
            _0x38e72c.push(
              _0x2b2504.iconButton('pencil', 'Edit', () =>
                openCampaignWizard(_0x2853e4, _0x7934d6, {
                  kind: _0x277572.kind,
                  campaign: _0x277572,
                }),
              ),
            );
          }
          if (['pending', 'running', 'paused'].includes(_0x277572.status)) {
            _0x38e72c.push(
              _0x2b2504.iconButton('ban', 'Discard', async () => {
                if (
                  await _0x2b2504.confirmDialog(
                    'Discard this one? Remaining recipients will be skipped.',
                    {
                      danger: true,
                      confirmLabel: 'Discard',
                    },
                  )
                ) {
                  _0x2853e4.scheduler.discard(_0x277572.id);
                }
              }),
            );
          }
          _0x38e72c.push(
            _0x2b2504.iconButton('copy', 'Duplicate', () =>
              _0x2853e4.scheduler.duplicate(_0x277572.id),
            ),
          );
          if (_0x5d6818) {
            _0x38e72c.push(
              _0x2b2504.iconButton('file-down', 'Download report', () =>
                downloadReport(_0x2853e4, _0x277572),
              ),
            );
          }
          _0x38e72c.push(
            _0x2b2504.iconButton(
              'trash-2',
              'Delete',
              async () => {
                if (
                  await _0x2b2504.confirmDialog('Delete this item?', {
                    danger: true,
                    confirmLabel: 'Delete',
                  })
                ) {
                  _0x2853e4.scheduler.remove(_0x277572.id);
                }
              },
              'is-danger',
            ),
          );
          return [
            _0x2b2504.checkbox(
              _0x1a1abb.selected.has(_0x277572.id),
              (_0x1a094c) => {
                if (_0x1a094c) {
                  _0x1a1abb.selected.add(_0x277572.id);
                } else {
                  _0x1a1abb.selected.delete(_0x277572.id);
                }
                _0x1ad4ec();
              },
            ),
            h(
              'div',
              {
                class: 'wc-cell-main',
              },
              h('strong', null, _0x277572.name),
              h(
                'span',
                null,
                _0x277572.kind === 'schedule'
                  ? _0x277572.targets.individuals[0]
                    ? _0x277572.targets.individuals[0].name || ''
                    : ''
                  : [
                      targetSummary(_0x277572.targets),
                      _0x277572.messages.length
                        ? summarizeMessage(_0x277572.messages[0])
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' · '),
              ),
            ),
            _0x2b2504.chip(
              CAMPAIGN_STATUS[_0x277572.status],
              STATUS_TONE[_0x277572.status],
            ),
            _0x277572.nextRunAt
              ? fmtDateTime(_0x277572.nextRunAt)
              : _0x277572.lastRunAt
                ? 'Last: ' + fmtDateTime(_0x277572.lastRunAt)
                : '-',
            _0x5d6818
              ? h(
                  'div',
                  {
                    class: 'wc-cell-progress',
                  },
                  _0x2b2504.progress(_0x3f9fdb),
                  h('span', null, _0x3f9fdb + '%'),
                )
              : h(
                  'span',
                  {
                    class: 'wc-muted',
                  },
                  '-',
                ),
            h(
              'div',
              {
                class: 'wc-row-actions',
              },
              _0x38e72c,
            ),
          ];
        }),
        {
          empty: _0x2b2504.emptyState(
            _0x4a5a92 === 'schedule' ? 'calendar-clock' : 'megaphone',
            _0x3e68e0,
            _0x1a1abb.tab === 'upcoming'
              ? 'Create one to see it here.'
              : 'Finished and discarded items appear here.',
          ),
        },
      ),
    );
    if (_0x155ce4.length > 10) {
      _0x325b3a.appendChild(
        _0x2b2504.pager({
          page: _0x1a1abb.page,
          pageSize: _0x1a1abb.size,
          total: _0x155ce4.length,
          onPage: (_0x41c151) => {
            _0x1a1abb.page = _0x41c151;
            _0x1ad4ec();
          },
          onSize: (_0xb11497) => {
            _0x1a1abb.size = _0xb11497;
            _0x1a1abb.page = 0;
            _0x1ad4ec();
          },
        }),
      );
    }
  }
  _0x8872cc.onDispose(_0x2853e4.store.on('campaigns', debounce(_0x1ad4ec, 80)));
  _0x1ad4ec();
  const _0x23dbfb = _0x2b2504.tabs(
    [
      {
        id: 'upcoming',
        label: 'Upcoming',
      },
      {
        id: 'history',
        label: 'History',
      },
    ],
    _0x1a1abb.tab,
    (_0x3534fc) => {
      _0x1a1abb.tab = _0x3534fc;
      _0x1a1abb.page = 0;
      _0x1a1abb.selected.clear();
      _0x1ad4ec();
    },
  );
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
      _0x23dbfb.el,
      _0x2b2504.searchInput('Search', (_0x4fef49) => {
        _0x1a1abb.query = _0x4fef49.trim();
        _0x1a1abb.page = 0;
        _0x1ad4ec();
      }),
    ),
    _0x325b3a,
  );
}
export default {
  id: 'broadcasts',
  title: 'Schedule Broadcast',
  subtitle: 'Send one message to many chats, safely paced.',
  icon: 'megaphone',
  render(_0x503bc8) {
    _0x503bc8.setActions([
      _0x2b2504.button('Add scheduled broadcast', {
        icon: 'plus',
        variant: 'primary',
        onClick: () =>
          openCampaignWizard(_0x503bc8.app, _0x503bc8.shell, {
            kind: 'broadcast',
          }),
      }),
    ]);
    if (_0x503bc8.params.create) {
      setTimeout(
        () =>
          openCampaignWizard(_0x503bc8.app, _0x503bc8.shell, {
            kind: 'broadcast',
          }),
        50,
      );
    }
    return campaignList(_0x503bc8, 'broadcast', 'No scheduled broadcasts yet');
  },
};
