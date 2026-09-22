import { pad2, startOfDay } from './util.js';
const DAY = 86400000;
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function hm(_0x5a3032) {
  const [_0x3dee0d, _0x31d0fd] = String(_0x5a3032 || '0:0')
    .split(':')
    .map((_0x551f79) => parseInt(_0x551f79, 10) || 0);
  return _0x3dee0d * 60 + _0x31d0fd;
}
function atMinutes(_0x23a05b, _0x4a7d2e) {
  const _0x1284df = new Date(_0x23a05b);
  _0x1284df.setHours(0, 0, 0, 0);
  _0x1284df.setMinutes(_0x4a7d2e);
  return _0x1284df.getTime();
}
function daysInMonth(_0x1e5607) {
  return new Date(
    _0x1e5607.getFullYear(),
    _0x1e5607.getMonth() + 1,
    0,
  ).getDate();
}
function minutesOfDay(_0x4fb9fa) {
  const _0x1667fb = new Date(_0x4fb9fa);
  return _0x1667fb.getHours() * 60 + _0x1667fb.getMinutes();
}
export function endReached(_0x53698f, _0x401b86) {
  return (
    _0x53698f.endType === 'count' && _0x401b86 >= (_0x53698f.endCount || 1)
  );
}
function matchesDay(_0x5bd47b, _0x1baeec, _0x3712ee) {
  const _0x3cc06b = new Date(_0x3712ee);
  const _0x119bf7 = new Date(_0x1baeec);
  const _0x1716ca = Math.round(
    (startOfDay(_0x119bf7) - startOfDay(_0x3cc06b)) / DAY,
  );
  if (_0x1716ca < 0) {
    return false;
  }
  const _0x3f6a6e = Math.max(1, _0x5bd47b.interval || 1);
  switch (_0x5bd47b.unit) {
    case 'daily':
      return _0x1716ca % _0x3f6a6e === 0;
    case 'weekly': {
      const _0x3a3c89 = Math.floor((_0x1716ca + _0x3cc06b.getDay()) / 7);
      const _0x28a500 =
        _0x5bd47b.daysOfWeek && _0x5bd47b.daysOfWeek.length
          ? _0x5bd47b.daysOfWeek
          : [_0x3cc06b.getDay()];
      return (
        _0x3a3c89 % _0x3f6a6e === 0 && _0x28a500.includes(_0x119bf7.getDay())
      );
    }
    case 'monthly': {
      const _0x34c69a =
        (_0x119bf7.getFullYear() - _0x3cc06b.getFullYear()) * 12 +
        _0x119bf7.getMonth() -
        _0x3cc06b.getMonth();
      if (_0x34c69a < 0 || _0x34c69a % _0x3f6a6e) {
        return false;
      }
      if (_0x5bd47b.lastDayOfMonth) {
        return _0x119bf7.getDate() === daysInMonth(_0x119bf7);
      }
      return (
        _0x119bf7.getDate() ===
        Math.min(_0x3cc06b.getDate(), daysInMonth(_0x119bf7))
      );
    }
    case 'yearly': {
      const _0x1511e7 = _0x119bf7.getFullYear() - _0x3cc06b.getFullYear();
      return (
        _0x1511e7 >= 0 &&
        _0x1511e7 % _0x3f6a6e === 0 &&
        _0x119bf7.getMonth() === _0x3cc06b.getMonth() &&
        _0x119bf7.getDate() ===
          Math.min(_0x3cc06b.getDate(), daysInMonth(_0x119bf7))
      );
    }
    default:
      return false;
  }
}
function nextCalendar(_0x761e65, _0x1c4b90, _0x1e9df9) {
  const _0x2d97cb = (
    _0x761e65.times && _0x761e65.times.length
      ? _0x761e65.times
      : [
          pad2(new Date(_0x1e9df9).getHours()) +
            ':' +
            pad2(new Date(_0x1e9df9).getMinutes()),
        ]
  )
    .map(hm)
    .sort((_0x4002e0, _0x3155dc) => _0x4002e0 - _0x3155dc);
  const _0x16cffc = startOfDay(Math.max(_0x1c4b90, _0x1e9df9));
  for (let _0x3201a9 = 0; _0x3201a9 < 3700; _0x3201a9++) {
    const _0x22198d = new Date(_0x16cffc);
    _0x22198d.setDate(_0x22198d.getDate() + _0x3201a9);
    const _0x358c4e = _0x22198d.getTime();
    if (!matchesDay(_0x761e65, _0x358c4e, _0x1e9df9)) {
      continue;
    }
    for (const _0x39a085 of _0x2d97cb) {
      const _0x5592aa = atMinutes(_0x358c4e, _0x39a085);
      if (_0x5592aa > _0x1c4b90 && _0x5592aa >= _0x1e9df9) {
        return _0x5592aa;
      }
    }
  }
  return null;
}
function nextInterval(_0x537d74, _0x138267, _0x290101) {
  const _0x574d6b =
    Math.max(1, _0x537d74.interval || 1) *
    (_0x537d74.unit === 'minute' ? 60000 : 3600000);
  let _0x26baa8 = Math.max(
    0,
    Math.ceil((_0x138267 + 1 - _0x290101) / _0x574d6b),
  );
  let _0x1d9e45 = _0x290101 + _0x26baa8 * _0x574d6b;
  const _0x594f5b =
    _0x537d74.allowedDays && _0x537d74.allowedDays.length
      ? _0x537d74.allowedDays
      : null;
  const _0x4a3731 =
    _0x537d74.window && _0x537d74.window.from && _0x537d74.window.to
      ? {
          from: hm(_0x537d74.window.from),
          to: hm(_0x537d74.window.to),
        }
      : null;
  for (
    let _0x3be4bb = 0;
    _0x3be4bb < 20000;
    _0x3be4bb++, _0x1d9e45 += _0x574d6b
  ) {
    if (_0x594f5b && !_0x594f5b.includes(new Date(_0x1d9e45).getDay())) {
      continue;
    }
    if (_0x4a3731) {
      const _0x14a6d3 = minutesOfDay(_0x1d9e45);
      const _0x3ee6e1 =
        _0x4a3731.from <= _0x4a3731.to
          ? _0x14a6d3 >= _0x4a3731.from && _0x14a6d3 <= _0x4a3731.to
          : _0x14a6d3 >= _0x4a3731.from || _0x14a6d3 <= _0x4a3731.to;
      if (!_0x3ee6e1) {
        continue;
      }
    }
    return _0x1d9e45;
  }
  return null;
}
export function nextRun(_0x2a39c7, _0x2cd2d1 = Date.now(), _0xe8a1fc = 0) {
  if (!_0x2a39c7) {
    return null;
  }
  if (_0x2a39c7.mode !== 'repeat') {
    if (_0xe8a1fc === 0 && _0x2a39c7.startAt > _0x2cd2d1) {
      return _0x2a39c7.startAt;
    } else {
      return null;
    }
  }
  if (endReached(_0x2a39c7, _0xe8a1fc)) {
    return null;
  }
  const _0x196fe7 = _0x2a39c7.startAt || _0x2cd2d1;
  const _0x36b401 =
    _0x2a39c7.unit === 'minute' || _0x2a39c7.unit === 'hour'
      ? nextInterval(_0x2a39c7, _0x2cd2d1, _0x196fe7)
      : nextCalendar(_0x2a39c7, _0x2cd2d1, _0x196fe7);
  if (_0x36b401 == null) {
    return null;
  }
  if (
    _0x2a39c7.endType === 'date' &&
    _0x2a39c7.endDate &&
    _0x36b401 > _0x2a39c7.endDate
  ) {
    return null;
  }
  return _0x36b401;
}
export function describeRule(_0x137c3c) {
  if (!_0x137c3c) {
    return '';
  }
  if (_0x137c3c.mode !== 'repeat') {
    return 'Once';
  }
  const _0x11aa4c = Math.max(1, _0x137c3c.interval || 1);
  const _0x19ddeb = (_0x55efee) =>
    _0x11aa4c === 1 ? _0x55efee : _0x11aa4c + ' ' + _0x55efee + 's';
  const _0x2fa1d4 = (_0x137c3c.times || []).join(', ');
  let _0x33c4bf;
  switch (_0x137c3c.unit) {
    case 'minute':
      _0x33c4bf = 'Every ' + _0x19ddeb('minute');
      break;
    case 'hour':
      _0x33c4bf = 'Every ' + _0x19ddeb('hour');
      break;
    case 'daily':
      _0x33c4bf = 'Every ' + (_0x11aa4c === 1 ? 'day' : _0x11aa4c + ' days');
      break;
    case 'weekly':
      _0x33c4bf =
        'Every ' +
        (_0x11aa4c === 1 ? 'week' : _0x11aa4c + ' weeks') +
        (_0x137c3c.daysOfWeek && _0x137c3c.daysOfWeek.length
          ? ' on ' +
            _0x137c3c.daysOfWeek.map((_0x59a7a4) => DOW[_0x59a7a4]).join(', ')
          : '');
      break;
    case 'monthly':
      _0x33c4bf =
        'Every ' +
        (_0x11aa4c === 1 ? 'month' : _0x11aa4c + ' months') +
        (_0x137c3c.lastDayOfMonth ? ' on the last day' : '');
      break;
    case 'yearly':
      _0x33c4bf = 'Every ' + (_0x11aa4c === 1 ? 'year' : _0x11aa4c + ' years');
      break;
    default:
      _0x33c4bf = 'Repeats';
  }
  if (_0x2fa1d4 && !['minute', 'hour'].includes(_0x137c3c.unit)) {
    _0x33c4bf += ' at ' + _0x2fa1d4;
  }
  if (_0x137c3c.window && _0x137c3c.window.from) {
    _0x33c4bf +=
      ' between ' + _0x137c3c.window.from + ' and ' + _0x137c3c.window.to;
  }
  if (_0x137c3c.endType === 'count') {
    _0x33c4bf += ', ' + _0x137c3c.endCount + ' times';
  }
  if (_0x137c3c.endType === 'date' && _0x137c3c.endDate) {
    _0x33c4bf += ', until ' + new Date(_0x137c3c.endDate).toLocaleDateString();
  }
  return _0x33c4bf;
}
export const WEEKDAYS = DOW;
