import { escapeRegExp } from './util.js';
export const MATCH_TYPES = [
  {
    id: 'contains',
    label: 'Contains the words',
  },
  {
    id: 'full',
    label: 'Whole message is the words',
  },
  {
    id: 'start',
    label: 'Starts with the words',
  },
  {
    id: 'end',
    label: 'Ends with the words',
  },
  {
    id: 'word',
    label: 'Contains as a whole word',
  },
  {
    id: 'regex',
    label: 'Regular expression',
  },
];
function norm(_0xb453a4, _0x40fbd3) {
  const _0x1b8a21 = String(_0xb453a4 == null ? '' : _0xb453a4).trim();
  if (_0x40fbd3) {
    return _0x1b8a21;
  } else {
    return _0x1b8a21.toLowerCase();
  }
}
export function matchKeyword(
  _0x47cb9d,
  _0x18b6b8,
  _0x35ad1c = 'contains',
  _0x3a6954 = false,
) {
  const _0x353b0b = norm(_0x47cb9d, _0x3a6954);
  const _0x51d8b3 = norm(_0x18b6b8, _0x3a6954);
  if (!_0x51d8b3) {
    return false;
  }
  switch (_0x35ad1c) {
    case 'full':
      return _0x353b0b === _0x51d8b3;
    case 'start':
      return _0x353b0b.startsWith(_0x51d8b3);
    case 'end':
      return _0x353b0b.endsWith(_0x51d8b3);
    case 'word':
      return new RegExp(
        '(^|[^\\p{L}\\p{N}_])' +
          escapeRegExp(_0x51d8b3) +
          '($|[^\\p{L}\\p{N}_])',
        'u',
      ).test(_0x353b0b);
    case 'regex':
      try {
        return new RegExp(String(_0x18b6b8), _0x3a6954 ? '' : 'i').test(
          String(_0x47cb9d || ''),
        );
      } catch (_0x161e1b) {
        return false;
      }
    case 'contains':
    default:
      return _0x353b0b.includes(_0x51d8b3);
  }
}
export function matchAny(
  _0x5b9ae0,
  _0x107c85,
  _0x352b20 = 'contains',
  _0x2973b4 = false,
) {
  const _0x36425b = [].concat(
    _0x352b20 && _0x352b20.length ? _0x352b20 : 'contains',
  );
  for (const _0x11e64d of _0x107c85 || []) {
    for (const _0x15ba24 of _0x36425b) {
      if (matchKeyword(_0x5b9ae0, _0x11e64d, _0x15ba24, _0x2973b4)) {
        return _0x11e64d;
      }
    }
  }
  return null;
}
const GREETINGS = [
  'hi',
  'hii',
  'hello',
  'hey',
  'hola',
  'namaste',
  'good morning',
  'good afternoon',
  'good evening',
  'salam',
  'ola',
];
export function isGreeting(_0x12eca1) {
  const _0x129de7 = norm(_0x12eca1, false).replace(/[!.,?]+$/g, '');
  return GREETINGS.some(
    (_0x53da06) =>
      _0x129de7 === _0x53da06 || _0x129de7.startsWith(_0x53da06 + ' '),
  );
}
