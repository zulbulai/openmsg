import { h, icon, clear } from '../ui/dom.js';
import * as _0x4e52f3 from '../ui/kit.js';
import { chatSelect } from '../ui/pickers.js';
import {
  fmtDate,
  fmtTime,
  fmtDateTime,
  pad2,
  startOfDay,
  addDays,
  sameDay,
  monthName,
} from '../core/util.js';
import {
  APPOINTMENT_STATUS,
  REMINDER_OPTIONS,
  DEFAULT_CUSTOMER_REMINDER,
} from '../core/reminders.js';
const STATUS_TONE = {
  scheduled: 'info',
  completed: 'ok',
  cancelled: 'neutral',
  'no-show': 'danger',
};
const STATUS_COLOR = {
  scheduled: '#ffc72c',
  completed: '#86efac',
  cancelled: '#94a3b8',
  'no-show': '#fca5a5',
};
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function openAppointmentDrawer(_0x39fab3, _0x1f6a68, _0x329607 = {}) {
  const _0xeb15f4 = !!_0x329607.id;
  const _0x371528 = _0xeb15f4
    ? _0x329607
    : (() => {
        const _0x4830a4 =
          _0x329607.start ||
          (() => {
            const _0x1866f8 = new Date();
            _0x1866f8.setMinutes(0, 0, 0);
            _0x1866f8.setHours(_0x1866f8.getHours() + 1);
            return _0x1866f8.getTime();
          })();
        return Object.assign(
          {
            customerName: '',
            customerPhone: '',
            customerEmail: '',
            title: '',
            description: '',
            start: _0x4830a4,
            end: _0x329607.end || _0x4830a4 + 1800000,
            status: 'scheduled',
            reminderMinutes: 60,
            reminderMessage: DEFAULT_CUSTOMER_REMINDER,
          },
          _0x329607,
        );
      })();
  const _0x455991 = Object.assign({}, _0x371528);
  const _0x4fee6c = h('div', {
    class: 'wc-field-error',
  });
  const _0x4868b0 = _0x4e52f3.input({
    value: _0x455991.customerName,
    placeholder: 'Customer name',
    onInput: (_0x1c7bf0) => {
      _0x455991.customerName = _0x1c7bf0;
    },
  });
  const _0x93fbae = _0x4e52f3.input({
    value: _0x455991.customerPhone,
    placeholder: '+1 555 010 0101',
    onInput: (_0x18bb9c) => {
      _0x455991.customerPhone = _0x18bb9c;
    },
  });
  const _0x1b64de = chatSelect(_0x39fab3, {
    value: _0x455991.chatId || '',
    placeholder: 'Select a saved contact',
    groups: false,
    onChange: (_0x1296fa) => {
      _0x455991.chatId = _0x1296fa;
      const _0x1a3463 = _0x39fab3.wa.chatById(_0x1296fa);
      if (_0x1a3463) {
        _0x455991.customerName = _0x39fab3.crm.displayName(_0x1296fa);
        _0x455991.customerPhone = _0x1a3463.phone ? '+' + _0x1a3463.phone : '';
        _0x4868b0.value = _0x455991.customerName;
        _0x93fbae.value = _0x455991.customerPhone;
      }
    },
  });
  const _0x6a69ed = h('div', {
    class: 'wc-callout',
  });
  const _0x474da6 = _0x4e52f3.textarea({
    value: _0x455991.reminderMessage || DEFAULT_CUSTOMER_REMINDER,
    rows: 3,
    onInput: (_0x308555) => {
      _0x455991.reminderMessage = _0x308555;
      _0x18d8f7();
    },
  });
  function _0x18d8f7() {
    clear(_0x6a69ed);
    _0x6a69ed.appendChild(icon('message-square-text', 16));
    _0x6a69ed.appendChild(
      h(
        'span',
        null,
        _0x39fab3.reminders.customerMessage(Object.assign({}, _0x455991)),
      ),
    );
  }
  _0x18d8f7();
  const _0x522d62 = _0x4e52f3.openDrawer({
    title: _0xeb15f4 ? 'Edit appointment' : 'New appointment',
    width: 540,
    body: h(
      'div',
      {
        class: 'wc-form',
      },
      h(
        'div',
        {
          class: 'wc-section-title',
        },
        'Customer',
      ),
      _0x4e52f3.field('Select customer', _0x1b64de, {
        hint: 'Pick a saved contact to fill this in, or type the details yourself.',
      }),
      _0x4e52f3.row(
        _0x4e52f3.field('Customer name', _0x4868b0, {
          required: true,
        }),
        _0x4e52f3.field('Customer phone', _0x93fbae, {
          required: true,
        }),
      ),
      _0x4e52f3.field(
        'Customer email',
        _0x4e52f3.input({
          type: 'email',
          value: _0x455991.customerEmail,
          placeholder: 'name@example.com',
          onInput: (_0x459182) => {
            _0x455991.customerEmail = _0x459182;
          },
        }),
      ),
      h(
        'div',
        {
          class: 'wc-section-title',
        },
        'Appointment',
      ),
      _0x4e52f3.field(
        'Title',
        _0x4e52f3.input({
          value: _0x455991.title,
          placeholder: 'e.g. Product demo',
          onInput: (_0x3cddfd) => {
            _0x455991.title = _0x3cddfd;
          },
        }),
        {
          required: true,
        },
      ),
      _0x4e52f3.field(
        'Description',
        _0x4e52f3.textarea({
          value: _0x455991.description,
          rows: 3,
          onInput: (_0xd31b7d) => {
            _0x455991.description = _0xd31b7d;
          },
        }),
      ),
      _0x4e52f3.row(
        _0x4e52f3.field(
          'Start',
          _0x4e52f3.datetimeInput(_0x455991.start, (_0xb73d1) => {
            const _0xc21531 = _0x455991.end - _0x455991.start;
            _0x455991.start = _0xb73d1;
            if (_0x455991.end <= _0xb73d1) {
              _0x455991.end = _0xb73d1 + (_0xc21531 > 0 ? _0xc21531 : 1800000);
            }
            _0x18d8f7();
          }),
          {
            required: true,
          },
        ),
        _0x4e52f3.field(
          'End',
          _0x4e52f3.datetimeInput(_0x455991.end, (_0xab0c4e) => {
            _0x455991.end = _0xab0c4e;
          }),
          {
            required: true,
          },
        ),
      ),
      _0x4e52f3.field(
        'Status',
        _0x4e52f3.select(
          APPOINTMENT_STATUS.map((_0x2781d4) => ({
            value: _0x2781d4.id,
            label: _0x2781d4.label,
          })),
          _0x455991.status,
          (_0x404417) => {
            _0x455991.status = _0x404417;
          },
        ),
      ),
      h(
        'div',
        {
          class: 'wc-section-title',
        },
        'Reminder',
      ),
      _0x4e52f3.field(
        'Notify me',
        _0x4e52f3.select(
          REMINDER_OPTIONS.map((_0x51ec8f) => ({
            value: _0x51ec8f.minutes,
            label: _0x51ec8f.label,
          })),
          _0x455991.reminderMinutes,
          (_0x13c834) => {
            _0x455991.reminderMinutes = Number(_0x13c834);
          },
        ),
        {
          hint: 'You get a notification. From it you can draft the message to your customer.',
        },
      ),
      _0x4e52f3.field('Message to the customer', _0x474da6, {
        hint: 'Placeholders: {{customer_name}}, {{title}}, {{date}}, {{start_time}}, {{end_time}}',
      }),
      _0x6a69ed,
      _0x4fee6c,
    ),
    footer: h(
      'div',
      {
        class: 'wc-modal-actions',
      },
      _0xeb15f4
        ? _0x4e52f3.button('Delete', {
            variant: 'danger',
            icon: 'trash-2',
            onClick: async () => {
              if (
                await _0x4e52f3.confirmDialog('Delete this appointment?', {
                  danger: true,
                  confirmLabel: 'Delete',
                })
              ) {
                await _0x39fab3.reminders.deleteAppointments(_0x329607.id);
                _0x522d62.close();
                _0x4e52f3.toast('Appointment deleted', 'success');
              }
            },
          })
        : null,
      _0x4e52f3.button('Cancel', {
        variant: 'dark',
        onClick: () => _0x522d62.close(),
      }),
      _0x4e52f3.button('Save', {
        variant: 'primary',
        onClick: async () => {
          try {
            await _0x39fab3.reminders.saveAppointment(
              Object.assign({}, _0x455991),
            );
            _0x522d62.close();
            _0x4e52f3.toast('Appointment saved', 'success');
          } catch (_0x17e2a9) {
            _0x4fee6c.textContent = _0x17e2a9.message;
          }
        },
      }),
    ),
  });
  return _0x522d62;
}
function eventChip(_0xf25753, _0x520b2c, _0x434423) {
  return h(
    'button',
    {
      type: 'button',
      class: 'wc-cal-event' + (_0x434423 ? ' is-compact' : ''),
      style: {
        '--ev': STATUS_COLOR[_0xf25753.status] || '#ffc72c',
      },
      title:
        _0xf25753.title +
        ' - ' +
        _0xf25753.customerName +
        '\n' +
        fmtDateTime(_0xf25753.start),
      onClick: (_0x32f50b) => {
        _0x32f50b.stopPropagation();
        _0x520b2c(_0xf25753);
      },
    },
    h('b', null, fmtTime(_0xf25753.start)),
    h('span', null, _0xf25753.title),
  );
}
export const calendarPanel = {
  id: 'calendar',
  title: 'Calendar',
  subtitle: 'Your appointments by month, week and day.',
  icon: 'calendar-days',
  render(_0x6ebc66) {
    const { app: _0x413912, shell: _0x1f9138 } = _0x6ebc66;
    const _0x58a4cb = {
      view: _0x6ebc66.params.view || 'month',
      cursor: startOfDay(Date.now()),
    };
    const _0x3c5dd8 = h('div', {
      class: 'wc-screen wc-calendar-screen',
    });
    const _0x4d20cd = h('div', {
      class: 'wc-calbody',
    });
    const _0x13e183 = h('strong', {
      class: 'wc-cal-title',
    });
    function _0x47f156(_0x371867, _0x848055) {
      return _0x413912.reminders
        .appointments()
        .filter(
          (_0x388fd0) =>
            (_0x388fd0.start < _0x848055 &&
              _0x388fd0.end > _0x371867 &&
              _0x388fd0.status !== 'cancelled') ||
            (_0x388fd0.status === 'cancelled' &&
              _0x388fd0.start >= _0x371867 &&
              _0x388fd0.start < _0x848055),
        );
    }
    const _0x2534d6 = (_0x401570) => _0x1f9138.openAppointment(_0x401570);
    function _0x59cbf2() {
      const _0x9f6f07 = new Date(_0x58a4cb.cursor);
      const _0x50d2ff = new Date(
        _0x9f6f07.getFullYear(),
        _0x9f6f07.getMonth(),
        1,
      );
      const _0x5c67ca = addDays(_0x50d2ff.getTime(), -_0x50d2ff.getDay());
      const _0x5349fb = _0x47f156(_0x5c67ca, addDays(_0x5c67ca, 42));
      const _0x5496b0 = h(
        'div',
        {
          class: 'wc-month',
        },
        DAYS.map((_0x489d7b) =>
          h(
            'div',
            {
              class: 'wc-month-dow',
            },
            _0x489d7b,
          ),
        ),
      );
      for (let _0x3bca30 = 0; _0x3bca30 < 42; _0x3bca30++) {
        const _0x594e93 = addDays(_0x5c67ca, _0x3bca30);
        const _0x1fab8a =
          new Date(_0x594e93).getMonth() === _0x9f6f07.getMonth();
        const _0x26ae77 = _0x5349fb.filter((_0x1d9cc3) =>
          sameDay(_0x1d9cc3.start, _0x594e93),
        );
        _0x5496b0.appendChild(
          h(
            'div',
            {
              class:
                'wc-month-cell' +
                (_0x1fab8a ? '' : ' is-out') +
                (sameDay(_0x594e93, Date.now()) ? ' is-today' : ''),
              onClick: () => {
                const _0x5a47a9 = new Date(_0x594e93);
                _0x5a47a9.setHours(10, 0, 0, 0);
                _0x2534d6({
                  start: _0x5a47a9.getTime(),
                });
              },
            },
            h(
              'span',
              {
                class: 'wc-month-num',
              },
              String(new Date(_0x594e93).getDate()),
            ),
            _0x26ae77
              .slice(0, 3)
              .map((_0x408092) => eventChip(_0x408092, _0x2534d6, true)),
            _0x26ae77.length > 3
              ? h(
                  'span',
                  {
                    class: 'wc-muted wc-more',
                  },
                  '+' + (_0x26ae77.length - 3) + ' more',
                )
              : null,
          ),
        );
      }
      return _0x5496b0;
    }
    function _0x4ba810(_0x7cf170) {
      const _0x4c896a = 7;
      const _0x31b70b = 21;
      const _0x15f1ec = 52;
      const _0xe016bd = _0x47f156(
        _0x7cf170[0],
        addDays(_0x7cf170[_0x7cf170.length - 1], 1),
      );
      const _0xa36ad4 = h(
        'div',
        {
          class: 'wc-tg-head',
        },
        h('div', {
          class: 'wc-tg-gutter',
        }),
        _0x7cf170.map((_0xb5f101) =>
          h(
            'div',
            {
              class:
                'wc-tg-day' +
                (sameDay(_0xb5f101, Date.now()) ? ' is-today' : ''),
            },
            DAYS[new Date(_0xb5f101).getDay()],
            h('b', null, String(new Date(_0xb5f101).getDate())),
          ),
        ),
      );
      const _0x4444dc = h(
        'div',
        {
          class: 'wc-tg-gutter',
        },
        Array.from(
          {
            length: _0x31b70b - _0x4c896a,
          },
          (_0x5685fb, _0x55ada0) =>
            h(
              'div',
              {
                class: 'wc-tg-hour',
                style: {
                  height: _0x15f1ec + 'px',
                },
              },
              pad2(_0x4c896a + _0x55ada0) + ':00',
            ),
        ),
      );
      const _0x36e768 = _0x7cf170.map((_0x5cd9e1) => {
        const _0x183a44 = h(
          'div',
          {
            class: 'wc-tg-col',
          },
          Array.from(
            {
              length: _0x31b70b - _0x4c896a,
            },
            (_0x10f244, _0xead19d) =>
              h('div', {
                class: 'wc-tg-slot',
                style: {
                  height: _0x15f1ec + 'px',
                },
                onClick: () => {
                  const _0x196bd8 = new Date(_0x5cd9e1);
                  _0x196bd8.setHours(_0x4c896a + _0xead19d, 0, 0, 0);
                  _0x2534d6({
                    start: _0x196bd8.getTime(),
                  });
                },
              }),
          ),
        );
        for (const _0x787a88 of _0xe016bd.filter((_0x5cf0f0) =>
          sameDay(_0x5cf0f0.start, _0x5cd9e1),
        )) {
          const _0x4e6e02 = new Date(_0x787a88.start);
          const _0x124ae8 =
            (_0x4e6e02.getHours() + _0x4e6e02.getMinutes() / 60 - _0x4c896a) *
            _0x15f1ec;
          const _0x354e46 = Math.max(
            38,
            ((_0x787a88.end - _0x787a88.start) / 3600000) * _0x15f1ec,
          );
          if (
            _0x124ae8 + _0x354e46 < 0 ||
            _0x124ae8 > (_0x31b70b - _0x4c896a) * _0x15f1ec
          ) {
            continue;
          }
          _0x183a44.appendChild(
            h(
              'button',
              {
                type: 'button',
                class: 'wc-tg-event',
                style: {
                  top: Math.max(0, _0x124ae8) + 'px',
                  height: _0x354e46 + 'px',
                  '--ev': STATUS_COLOR[_0x787a88.status] || '#ffc72c',
                },
                onClick: (_0x4207e4) => {
                  _0x4207e4.stopPropagation();
                  _0x2534d6(_0x787a88);
                },
              },
              h('b', null, fmtTime(_0x787a88.start)),
              h('span', null, _0x787a88.title),
              h('small', null, _0x787a88.customerName),
            ),
          );
        }
        return _0x183a44;
      });
      return h(
        'div',
        {
          class: 'wc-tg',
        },
        _0xa36ad4,
        h(
          'div',
          {
            class: 'wc-tg-body',
          },
          _0x4444dc,
          _0x36e768,
        ),
      );
    }
    function _0xd3d968() {
      clear(_0x4d20cd);
      const _0x1344c6 = new Date(_0x58a4cb.cursor);
      if (_0x58a4cb.view === 'month') {
        _0x13e183.textContent =
          monthName(_0x1344c6.getMonth()) + ' ' + _0x1344c6.getFullYear();
        _0x4d20cd.appendChild(_0x59cbf2());
      } else if (_0x58a4cb.view === 'week') {
        const _0x2aec39 = addDays(_0x58a4cb.cursor, -_0x1344c6.getDay());
        const _0x5cd128 = Array.from(
          {
            length: 7,
          },
          (_0x998f08, _0x2e30a6) => addDays(_0x2aec39, _0x2e30a6),
        );
        _0x13e183.textContent =
          fmtDate(_0x5cd128[0]) + ' - ' + fmtDate(_0x5cd128[6]);
        _0x4d20cd.appendChild(_0x4ba810(_0x5cd128));
      } else {
        _0x13e183.textContent = fmtDate(_0x58a4cb.cursor);
        _0x4d20cd.appendChild(_0x4ba810([_0x58a4cb.cursor]));
      }
    }
    function _0x1e64e1(_0x2a8f9b) {
      const _0x2fd00d = new Date(_0x58a4cb.cursor);
      if (_0x58a4cb.view === 'month') {
        _0x58a4cb.cursor = new Date(
          _0x2fd00d.getFullYear(),
          _0x2fd00d.getMonth() + _0x2a8f9b,
          1,
        ).getTime();
      } else {
        _0x58a4cb.cursor = addDays(
          _0x58a4cb.cursor,
          _0x2a8f9b * (_0x58a4cb.view === 'week' ? 7 : 1),
        );
      }
      _0xd3d968();
    }
    const _0xe2d64f = _0x4e52f3.tabs(
      [
        {
          id: 'month',
          label: 'Month',
        },
        {
          id: 'week',
          label: 'Week',
        },
        {
          id: 'day',
          label: 'Day',
        },
      ],
      _0x58a4cb.view,
      (_0x86c68) => {
        _0x58a4cb.view = _0x86c68;
        _0xd3d968();
      },
    );
    _0x3c5dd8.appendChild(
      h(
        'div',
        {
          class: 'wc-toolbar',
        },
        _0x4e52f3.iconButton('chevron-left', 'Previous', () => _0x1e64e1(-1)),
        _0x4e52f3.button('Today', {
          size: 'sm',
          onClick: () => {
            _0x58a4cb.cursor = startOfDay(Date.now());
            _0xd3d968();
          },
        }),
        _0x4e52f3.iconButton('chevron-right', 'Next', () => _0x1e64e1(1)),
        _0x13e183,
        h('span', {
          class: 'wc-spacer',
        }),
        _0xe2d64f.el,
      ),
    );
    _0x3c5dd8.appendChild(_0x4d20cd);
    _0x6ebc66.setActions([
      _0x4e52f3.button('Create appointment', {
        icon: 'plus',
        variant: 'primary',
        onClick: () => _0x1f9138.openAppointment({}),
      }),
      _0x4e52f3.button('Appointments list', {
        icon: 'list',
        onClick: () => _0x1f9138.openPanel('appointments'),
      }),
    ]);
    _0x6ebc66.onDispose(_0x413912.store.on('appointments', _0xd3d968));
    _0xd3d968();
    return _0x3c5dd8;
  },
};
export const appointmentsPanel = {
  id: 'appointments',
  title: 'Appointments',
  subtitle: 'Bookings, reminders and who is coming.',
  icon: 'calendar-check',
  render(_0x431ec2) {
    const { app: _0x2655fa, shell: _0x64f53b } = _0x431ec2;
    const _0x92489c = {
      query: '',
      status: 'all',
      page: 0,
      size: 10,
      selected: new Set(),
    };
    const _0x24d273 = h('div', {
      class: 'wc-stack',
    });
    function _0x31a855() {
      clear(_0x24d273);
      let _0x586a3b = _0x2655fa.reminders
        .appointments()
        .reverse()
        .filter(
          (_0x36ef5c) =>
            _0x92489c.status === 'all' || _0x36ef5c.status === _0x92489c.status,
        )
        .filter(
          (_0x591327) =>
            !_0x92489c.query ||
            (
              _0x591327.customerName +
              ' ' +
              _0x591327.title +
              ' ' +
              _0x591327.customerPhone
            )
              .toLowerCase()
              .includes(_0x92489c.query.toLowerCase()),
        );
      const _0x2b257d = _0x586a3b.length;
      const _0x4bf73e = _0x586a3b.slice(
        _0x92489c.page * _0x92489c.size,
        (_0x92489c.page + 1) * _0x92489c.size,
      );
      _0x24d273.appendChild(
        _0x4e52f3.bulkBar(
          _0x92489c.selected.size,
          _0x4e52f3.button(
            'Delete selected (' + _0x92489c.selected.size + ')',
            {
              variant: 'danger',
              size: 'sm',
              icon: 'trash-2',
              onClick: async () => {
                if (
                  await _0x4e52f3.confirmDialog(
                    'Delete ' + _0x92489c.selected.size + ' appointment(s)?',
                    {
                      danger: true,
                      confirmLabel: 'Delete',
                    },
                  )
                ) {
                  await _0x2655fa.reminders.deleteAppointments(
                    Array.from(_0x92489c.selected),
                  );
                  _0x92489c.selected.clear();
                }
              },
            },
          ),
        ),
      );
      _0x24d273.appendChild(
        _0x4e52f3.table(
          ['', 'Customer', 'Title', 'Date', 'Status', ''],
          _0x4bf73e.map((_0x1ac861) => [
            _0x4e52f3.checkbox(
              _0x92489c.selected.has(_0x1ac861.id),
              (_0x41ec5c) => {
                if (_0x41ec5c) {
                  _0x92489c.selected.add(_0x1ac861.id);
                } else {
                  _0x92489c.selected.delete(_0x1ac861.id);
                }
                _0x31a855();
              },
            ),
            h(
              'div',
              {
                class: 'wc-cell-main',
              },
              h('strong', null, _0x1ac861.customerName),
              h('span', null, _0x1ac861.customerPhone),
            ),
            _0x1ac861.title,
            fmtDateTime(_0x1ac861.start) + ' - ' + fmtTime(_0x1ac861.end),
            _0x4e52f3.chip(
              _0x1ac861.status,
              STATUS_TONE[_0x1ac861.status] || 'neutral',
            ),
            h(
              'div',
              {
                class: 'wc-row-actions',
              },
              _0x4e52f3.iconButton('pencil', 'Edit', () =>
                _0x64f53b.openAppointment(_0x1ac861),
              ),
              _0x4e52f3.iconButton(
                'message-circle',
                'Draft reminder message',
                () => _0x1dde0e(_0x1ac861),
              ),
              _0x4e52f3.iconButton(
                'trash-2',
                'Delete',
                async () => {
                  if (
                    await _0x4e52f3.confirmDialog('Delete this appointment?', {
                      danger: true,
                      confirmLabel: 'Delete',
                    })
                  ) {
                    _0x2655fa.reminders.deleteAppointments(_0x1ac861.id);
                  }
                },
                'is-danger',
              ),
            ),
          ]),
          {
            empty: _0x4e52f3.emptyState(
              'calendar-check',
              'No appointments yet',
              'Create one to see it here and on the calendar.',
              _0x4e52f3.button('Create appointment', {
                variant: 'primary',
                icon: 'plus',
                onClick: () => _0x64f53b.openAppointment({}),
              }),
            ),
          },
        ),
      );
      if (_0x2b257d > 10) {
        _0x24d273.appendChild(
          _0x4e52f3.pager({
            page: _0x92489c.page,
            pageSize: _0x92489c.size,
            total: _0x2b257d,
            onPage: (_0x718dd4) => {
              _0x92489c.page = _0x718dd4;
              _0x31a855();
            },
            onSize: (_0x1e0aa9) => {
              _0x92489c.size = _0x1e0aa9;
              _0x92489c.page = 0;
              _0x31a855();
            },
          }),
        );
      }
    }
    async function _0x1dde0e(_0x144dfe) {
      const _0x435d93 =
        _0x144dfe.chatId ||
        (await _0x2655fa.wa.resolveTarget(_0x144dfe.customerPhone));
      if (!_0x435d93) {
        _0x4e52f3.toast('That phone number is not on WhatsApp.', 'error');
        return;
      }
      try {
        await _0x2655fa.wa.openChat(_0x435d93);
        await _0x2655fa.wa.setInput(
          _0x2655fa.reminders.customerMessage(_0x144dfe),
          _0x435d93,
        );
        _0x4e52f3.toast(
          'Message drafted in the chat. Review it and press send.',
          'success',
        );
      } catch (_0x22c661) {
        _0x4e52f3.toast(_0x22c661.message, 'error');
      }
    }
    _0x431ec2.setActions([
      _0x4e52f3.button('Create appointment', {
        icon: 'plus',
        variant: 'primary',
        onClick: () => _0x64f53b.openAppointment({}),
      }),
      _0x4e52f3.button('Calendar', {
        icon: 'calendar-days',
        onClick: () => _0x64f53b.openPanel('calendar'),
      }),
    ]);
    _0x431ec2.onDispose(_0x2655fa.store.on('appointments', _0x31a855));
    const _0x30ca5e = _0x4e52f3.select(
      [
        {
          value: 'all',
          label: 'All statuses',
        },
      ].concat(
        APPOINTMENT_STATUS.map((_0x852ec2) => ({
          value: _0x852ec2.id,
          label: _0x852ec2.label,
        })),
      ),
      'all',
      (_0x454c65) => {
        _0x92489c.status = _0x454c65;
        _0x92489c.page = 0;
        _0x31a855();
      },
    );
    _0x31a855();
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
        _0x4e52f3.searchInput('Search appointments', (_0xb4c561) => {
          _0x92489c.query = _0xb4c561.trim();
          _0x92489c.page = 0;
          _0x31a855();
        }),
        _0x30ca5e,
      ),
      _0x24d273,
    );
  },
};
