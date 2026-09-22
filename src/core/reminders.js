import { fmtDateTime, fmtTime, fmtDate } from './util.js';
import { renderTemplate } from './variables.js';
export const APPOINTMENT_STATUS = [
  {
    id: 'scheduled',
    label: 'Scheduled',
  },
  {
    id: 'completed',
    label: 'Completed',
  },
  {
    id: 'cancelled',
    label: 'Cancelled',
  },
  {
    id: 'no-show',
    label: 'No-show',
  },
];
export const REMINDER_OPTIONS = [
  {
    minutes: 0,
    label: 'No reminder',
  },
  {
    minutes: 15,
    label: '15 minutes before',
  },
  {
    minutes: 30,
    label: '30 minutes before',
  },
  {
    minutes: 60,
    label: '1 hour before',
  },
  {
    minutes: 120,
    label: '2 hours before',
  },
  {
    minutes: 1440,
    label: '1 day before',
  },
];
export const DEFAULT_CUSTOMER_REMINDER =
  'Hi {{customer_name}}, this is a reminder for your appointment: {{title}} on {{date}} at {{start_time}}.';
const MISSED_AFTER_MS = 600000;
export function appointmentVars(_0x3216b7) {
  return {
    customer_name: _0x3216b7.customerName || '',
    title: _0x3216b7.title || '',
    date: fmtDate(_0x3216b7.start),
    start_time: fmtTime(_0x3216b7.start),
    end_time: fmtTime(_0x3216b7.end),
    customer_phone: _0x3216b7.customerPhone || '',
  };
}
export function createReminders({
  store: _0x1ea2b7,
  crm: _0x52416d,
  notify: _0x749807,
  webhooks: _0x5a7005,
  emit: _0x579146,
  now = Date.now,
}) {
  const _0x2b7436 = (_0x49fbd2, _0x3b112a) => {
    if (_0x579146) {
      _0x579146(_0x49fbd2, _0x3b112a);
    }
  };
  const _0x2579c9 = (_0x52bebc) => {
    if (_0x1ea2b7.setting('reminderNotify') !== false && _0x749807) {
      _0x749807(_0x52bebc);
    }
  };
  const _0x54f5a7 = {
    appointments() {
      return _0x1ea2b7
        .all('appointments')
        .slice()
        .sort((_0x436ad9, _0x3d0da0) => _0x436ad9.start - _0x3d0da0.start);
    },
    overlap(_0x22b3f3, _0x44a024, _0xf2fcb) {
      return _0x1ea2b7.find(
        'appointments',
        (_0x1d4e76) =>
          _0x1d4e76.id !== _0xf2fcb &&
          _0x1d4e76.status !== 'cancelled' &&
          _0x1d4e76.start < _0x44a024 &&
          _0x22b3f3 < _0x1d4e76.end,
      );
    },
    async saveAppointment(_0x318098) {
      const _0x20a369 = [];
      if (!String(_0x318098.customerName || '').trim()) {
        _0x20a369.push('Customer name is required.');
      }
      if (!String(_0x318098.customerPhone || '').trim()) {
        _0x20a369.push('Customer phone is required.');
      } else if (!/^\+?[\d\s\-()]+$/.test(_0x318098.customerPhone)) {
        _0x20a369.push('Customer phone can only contain numbers.');
      }
      if (
        _0x318098.customerEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(_0x318098.customerEmail)
      ) {
        _0x20a369.push('Please enter a valid email.');
      }
      if (!String(_0x318098.title || '').trim()) {
        _0x20a369.push('Title is required.');
      }
      if (!_0x318098.start) {
        _0x20a369.push('Start time is required.');
      }
      if (!_0x318098.end) {
        _0x20a369.push('End time is required.');
      } else if (_0x318098.end <= _0x318098.start) {
        _0x20a369.push('End must be after start.');
      }
      if (_0x20a369.length) {
        throw new Error(_0x20a369[0]);
      }
      const _0xe5955 = _0x54f5a7.overlap(
        _0x318098.start,
        _0x318098.end,
        _0x318098.id,
      );
      if (_0xe5955 && _0x318098.status !== 'cancelled') {
        throw new Error(
          'Time slot unavailable: "' +
            _0xe5955.title +
            '" is already booked then.',
        );
      }
      const _0x2dbe1c = !_0x318098.id;
      const _0x378673 = _0x318098.id
        ? _0x1ea2b7.get('appointments', _0x318098.id)
        : null;
      const _0x460e09 = !_0x378673 || _0x378673.start !== _0x318098.start;
      const _0x1f46c7 = await _0x1ea2b7.put(
        'appointments',
        Object.assign(
          {
            status: 'scheduled',
            reminderMinutes: 0,
          },
          _0x318098,
          _0x460e09
            ? {
                reminded: false,
              }
            : {},
        ),
      );
      if (_0x2dbe1c && _0x5a7005) {
        _0x5a7005.emit('appointment_created', {
          title: _0x1f46c7.title,
          customer: _0x1f46c7.customerName,
          phone: _0x1f46c7.customerPhone,
          start: _0x1f46c7.start,
          end: _0x1f46c7.end,
        });
      }
      return _0x1f46c7;
    },
    async deleteAppointments(_0x5751d8) {
      for (const _0x165cc9 of [].concat(_0x5751d8)) {
        await _0x1ea2b7.remove('appointments', _0x165cc9);
      }
    },
    customerMessage(_0x585ee1) {
      return renderTemplate(
        _0x585ee1.reminderMessage || DEFAULT_CUSTOMER_REMINDER,
        appointmentVars(_0x585ee1),
      );
    },
    async tick() {
      const _0x13ca96 = now();
      for (const _0xdc5020 of _0x1ea2b7.filter(
        'reminders',
        (_0x3baecd) =>
          _0x3baecd.status === 'pending' && _0x3baecd.at <= _0x13ca96,
      )) {
        if (_0x13ca96 - _0xdc5020.at > MISSED_AFTER_MS && !_0xdc5020.notified) {
          await _0x1ea2b7.patch('reminders', _0xdc5020.id, {
            status: 'missed',
          });
          continue;
        }
        await _0x1ea2b7.patch('reminders', _0xdc5020.id, {
          status: 'unread',
          notified: true,
        });
        const _0x307014 = _0x52416d.displayName(_0xdc5020.chatId);
        _0x2579c9({
          id: 'reminder:' + _0xdc5020.id,
          title: 'Reminder: ' + _0xdc5020.title,
          message:
            '' +
            _0x307014 +
            (_0xdc5020.details ? ' - ' + _0xdc5020.details : ''),
          data: {
            kind: 'reminder',
            chatId: _0xdc5020.chatId,
            id: _0xdc5020.id,
          },
        });
        if (_0x5a7005) {
          _0x5a7005.emit('reminder_due', {
            title: _0xdc5020.title,
            chatId: _0xdc5020.chatId,
            name: _0x307014,
            at: _0xdc5020.at,
          });
        }
        _0x2b7436('reminder:due', _0xdc5020);
      }
      for (const _0x1732b8 of _0x1ea2b7.filter(
        'appointments',
        (_0x5d65fa) =>
          _0x5d65fa.status === 'scheduled' &&
          _0x5d65fa.reminderMinutes > 0 &&
          !_0x5d65fa.reminded,
      )) {
        const _0x2d2917 = _0x1732b8.start - _0x1732b8.reminderMinutes * 60000;
        if (_0x2d2917 > _0x13ca96) {
          continue;
        }
        await _0x1ea2b7.patch('appointments', _0x1732b8.id, {
          reminded: true,
        });
        if (_0x1732b8.start + MISSED_AFTER_MS < _0x13ca96) {
          continue;
        }
        _0x2579c9({
          id: 'appointment:' + _0x1732b8.id,
          title: 'Appointment: ' + _0x1732b8.title,
          message:
            _0x1732b8.customerName + ' at ' + fmtDateTime(_0x1732b8.start),
          data: {
            kind: 'appointment',
            id: _0x1732b8.id,
            phone: _0x1732b8.customerPhone,
          },
        });
        _0x2b7436('appointment:due', _0x1732b8);
      }
    },
    upcoming() {
      const _0x18bfce = [];
      for (const _0xaeaf18 of _0x1ea2b7.filter(
        'reminders',
        (_0x28e849) => _0x28e849.status === 'pending',
      )) {
        _0x18bfce.push({
          at: _0xaeaf18.at,
          title: 'Reminder: ' + _0xaeaf18.title,
          message: _0x52416d.displayName(_0xaeaf18.chatId),
          key: 'r:' + _0xaeaf18.id,
        });
      }
      for (const _0x5ebcd2 of _0x1ea2b7.filter(
        'appointments',
        (_0x4135b7) =>
          _0x4135b7.status === 'scheduled' &&
          _0x4135b7.reminderMinutes > 0 &&
          !_0x4135b7.reminded,
      )) {
        _0x18bfce.push({
          at: _0x5ebcd2.start - _0x5ebcd2.reminderMinutes * 60000,
          title: 'Appointment: ' + _0x5ebcd2.title,
          message:
            _0x5ebcd2.customerName + ' at ' + fmtDateTime(_0x5ebcd2.start),
          key: 'a:' + _0x5ebcd2.id,
        });
      }
      return _0x18bfce.filter(
        (_0x2fa507) => _0x2fa507.at > now() - MISSED_AFTER_MS,
      );
    },
  };
  return _0x54f5a7;
}
