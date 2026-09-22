export const uid = (_0x494947 = '') =>
  _0x494947 + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const sleep = (_0x4a60c3) =>
  new Promise((_0x5d8803) => setTimeout(_0x5d8803, _0x4a60c3));
export const rand = (_0x1d28f4, _0x12e84b) =>
  _0x1d28f4 + Math.random() * (_0x12e84b - _0x1d28f4);
export const randInt = (_0x8802e, _0x3d9698) =>
  Math.floor(rand(_0x8802e, _0x3d9698 + 1));
export const clamp = (_0x2add6a, _0x4d2c1b, _0x3d5c89) =>
  Math.min(_0x3d5c89, Math.max(_0x4d2c1b, _0x2add6a));
export const clone = (_0x1e556a) =>
  _0x1e556a === undefined ? undefined : JSON.parse(JSON.stringify(_0x1e556a));
export const isObject = (_0x69d5f9) =>
  _0x69d5f9 !== null &&
  typeof _0x69d5f9 === 'object' &&
  !Array.isArray(_0x69d5f9);
export function looksLikePhone(_0x9d04eb) {
  const _0x3c017a = String(_0x9d04eb || '').trim();
  return (
    !!_0x3c017a &&
    /^[+\d\s().-]+$/.test(_0x3c017a) &&
    _0x3c017a.replace(/\D/g, '').length >= 5
  );
}
export function betterName(..._0x11de3c) {
  const _0x3a79cb = _0x11de3c
    .map((_0x2d4c45) => String(_0x2d4c45 || '').trim())
    .filter(Boolean);
  return (
    _0x3a79cb.find((_0xd26ce1) => !looksLikePhone(_0xd26ce1)) ||
    _0x3a79cb[0] ||
    ''
  );
}
export function debounce(_0x5040f4, _0x48fdd7) {
  let _0x188132 = null;
  const _0x5367b9 = (..._0x530332) => {
    clearTimeout(_0x188132);
    _0x188132 = setTimeout(() => {
      _0x188132 = null;
      _0x5040f4(..._0x530332);
    }, _0x48fdd7);
  };
  _0x5367b9.flush = (..._0x5933e3) => {
    clearTimeout(_0x188132);
    _0x188132 = null;
    _0x5040f4(..._0x5933e3);
  };
  _0x5367b9.cancel = () => {
    clearTimeout(_0x188132);
    _0x188132 = null;
  };
  return _0x5367b9;
}
export function throttle(_0x559d86, _0x5408e7) {
  let _0x3b5a09 = 0;
  let _0x172742 = null;
  let _0x23f146 = null;
  return (..._0x17aab4) => {
    const _0x596c85 = Date.now();
    _0x23f146 = _0x17aab4;
    if (_0x596c85 - _0x3b5a09 >= _0x5408e7) {
      _0x3b5a09 = _0x596c85;
      _0x559d86(..._0x23f146);
      _0x23f146 = null;
      return;
    }
    if (!_0x172742) {
      _0x172742 = setTimeout(
        () => {
          _0x172742 = null;
          _0x3b5a09 = Date.now();
          if (_0x23f146) {
            _0x559d86(..._0x23f146);
          }
          _0x23f146 = null;
        },
        _0x5408e7 - (_0x596c85 - _0x3b5a09),
      );
    }
  };
}
export const pad2 = (_0x2c5400) => String(_0x2c5400).padStart(2, '0');
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
export const monthName = (_0x1fa347) => MONTHS[_0x1fa347];
export function fmtDate(_0x38fa4e) {
  if (!_0x38fa4e) {
    return '';
  }
  const _0x21f98d = new Date(_0x38fa4e);
  return (
    MONTHS[_0x21f98d.getMonth()] +
    ' ' +
    pad2(_0x21f98d.getDate()) +
    ', ' +
    _0x21f98d.getFullYear()
  );
}
export function fmtTime(_0x706523) {
  if (!_0x706523) {
    return '';
  }
  const _0x55f8d3 = new Date(_0x706523);
  return pad2(_0x55f8d3.getHours()) + ':' + pad2(_0x55f8d3.getMinutes());
}
export const fmtDateTime = (_0x351b64) =>
  _0x351b64 ? fmtDate(_0x351b64) + ', ' + fmtTime(_0x351b64) : '';
export function toLocalInput(_0x261f45) {
  const _0x1132ec = new Date(_0x261f45 || Date.now());
  return (
    _0x1132ec.getFullYear() +
    '-' +
    pad2(_0x1132ec.getMonth() + 1) +
    '-' +
    pad2(_0x1132ec.getDate()) +
    'T' +
    pad2(_0x1132ec.getHours()) +
    ':' +
    pad2(_0x1132ec.getMinutes())
  );
}
export function fromLocalInput(_0x55ce02) {
  if (!_0x55ce02) {
    return 0;
  }
  const _0x1a55e5 = new Date(_0x55ce02).getTime();
  if (Number.isNaN(_0x1a55e5)) {
    return 0;
  } else {
    return _0x1a55e5;
  }
}
export function toDateInput(_0x3c36b9) {
  return toLocalInput(_0x3c36b9).slice(0, 10);
}
export function toTimeInput(_0x2202ad) {
  return toLocalInput(_0x2202ad).slice(11, 16);
}
export function startOfDay(_0x323aa7) {
  const _0x5ad394 = new Date(_0x323aa7);
  _0x5ad394.setHours(0, 0, 0, 0);
  return _0x5ad394.getTime();
}
export function addDays(_0x396b34, _0x559683) {
  const _0x2aa7a1 = new Date(_0x396b34);
  _0x2aa7a1.setDate(_0x2aa7a1.getDate() + _0x559683);
  return _0x2aa7a1.getTime();
}
export function sameDay(_0x3369c7, _0x53a35d) {
  return startOfDay(_0x3369c7) === startOfDay(_0x53a35d);
}
export function relTime(_0x267dd4, _0x28674c = Date.now()) {
  const _0x430423 = _0x267dd4 - _0x28674c;
  const _0x37cc60 = Math.abs(_0x430423);
  const _0x4e650f = Math.round(_0x37cc60 / 60000);
  let _0x4165df;
  if (_0x4e650f < 1) {
    _0x4165df = 'a moment';
  } else if (_0x4e650f < 60) {
    _0x4165df = _0x4e650f + ' min';
  } else if (_0x4e650f < 1440) {
    _0x4165df = Math.round(_0x4e650f / 60) + ' h';
  } else {
    _0x4165df = Math.round(_0x4e650f / 1440) + ' d';
  }
  if (_0x430423 >= 0) {
    return 'in ' + _0x4165df;
  } else {
    return _0x4165df + ' ago';
  }
}
export const digits = (_0x385508) =>
  String(_0x385508 == null ? '' : _0x385508).replace(/\D+/g, '');
export const escapeRegExp = (_0x2a8756) =>
  String(_0x2a8756).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const truncate = (_0x5d4cf4, _0x2e973e) => {
  _0x5d4cf4 = String(_0x5d4cf4 == null ? '' : _0x5d4cf4);
  if (_0x5d4cf4.length > _0x2e973e) {
    return _0x5d4cf4.slice(0, Math.max(0, _0x2e973e - 1)) + '…';
  } else {
    return _0x5d4cf4;
  }
};
export const plural = (_0x5cb0bf, _0x24cc26, _0x5b5a2b) =>
  _0x5cb0bf +
  ' ' +
  (_0x5cb0bf === 1 ? _0x24cc26 : _0x5b5a2b || _0x24cc26 + 's');
export function initials(_0x260181) {
  return (
    String(_0x260181 || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((_0xcfc740) => _0xcfc740[0].toUpperCase())
      .join('') || '?'
  );
}
export function safeJson(_0x3acf0a, _0x3ff72d = null) {
  try {
    return JSON.parse(_0x3acf0a);
  } catch (_0x2782cd) {
    return _0x3ff72d;
  }
}
export function moveItem(_0x25fcb7, _0x514401, _0xf71bd5) {
  const _0x249940 = _0x25fcb7.slice();
  if (_0x514401 < 0 || _0x514401 >= _0x249940.length) {
    return _0x249940;
  }
  const [_0x3d0009] = _0x249940.splice(_0x514401, 1);
  _0x249940.splice(clamp(_0xf71bd5, 0, _0x249940.length), 0, _0x3d0009);
  return _0x249940;
}
export function groupBy(_0x506f79, _0x28c797) {
  const _0x4b6631 = {};
  for (const _0xa73b0e of _0x506f79) {
    const _0x4d9166 = _0x28c797(_0xa73b0e);
    (_0x4b6631[_0x4d9166] = _0x4b6631[_0x4d9166] || []).push(_0xa73b0e);
  }
  return _0x4b6631;
}
export function uniq(_0x347e31) {
  return Array.from(new Set(_0x347e31));
}
export function bytesToSize(_0x2521dd) {
  if (!_0x2521dd) {
    return '0 B';
  }
  const _0x43b135 = ['B', 'KB', 'MB', 'GB'];
  const _0x25c3ac = Math.min(
    _0x43b135.length - 1,
    Math.floor(Math.log(_0x2521dd) / Math.log(1024)),
  );
  return (
    (_0x2521dd / Math.pow(1024, _0x25c3ac)).toFixed(_0x25c3ac ? 1 : 0) +
    ' ' +
    _0x43b135[_0x25c3ac]
  );
}
export function dataUrlBytes(_0x65a8) {
  const _0x5a633d = String(_0x65a8).indexOf(',');
  if (_0x5a633d < 0) {
    return 0;
  }
  const _0x3ed94b = _0x65a8.slice(_0x5a633d + 1);
  return (
    Math.floor((_0x3ed94b.length * 3) / 4) -
    (_0x3ed94b.endsWith('==') ? 2 : _0x3ed94b.endsWith('=') ? 1 : 0)
  );
}
export function fileToDataUrl(_0x2b209c) {
  return new Promise((_0x3c818a, _0x291ad1) => {
    const _0x2611d6 = new FileReader();
    _0x2611d6.onload = () => _0x3c818a(String(_0x2611d6.result));
    _0x2611d6.onerror = () =>
      _0x291ad1(_0x2611d6.error || new Error('Could not read the file'));
    _0x2611d6.readAsDataURL(_0x2b209c);
  });
}
export function download(_0x620fbc, _0x568e52, _0x247539 = 'text/plain') {
  const _0x352fbb =
    _0x568e52 instanceof Blob
      ? _0x568e52
      : new Blob([_0x568e52], {
          type: _0x247539 + ';charset=utf-8',
        });
  const _0x187ad8 = URL.createObjectURL(_0x352fbb);
  const _0x4a5181 = document.createElement('a');
  _0x4a5181.href = _0x187ad8;
  _0x4a5181.download = _0x620fbc;
  document.body.appendChild(_0x4a5181);
  _0x4a5181.click();
  _0x4a5181.remove();
  setTimeout(() => URL.revokeObjectURL(_0x187ad8), 2000);
}
export function getPath(_0x5e52a7, _0x33ce42) {
  if (!_0x33ce42) {
    return _0x5e52a7;
  }
  return String(_0x33ce42)
    .split('.')
    .reduce(
      (_0x4c3bff, _0x13c1bb) =>
        _0x4c3bff == null ? undefined : _0x4c3bff[_0x13c1bb],
      _0x5e52a7,
    );
}
export function hashString(_0x585b87) {
  let _0x3e2fb5 = 0;
  for (let _0x2aba66 = 0; _0x2aba66 < _0x585b87.length; _0x2aba66++) {
    _0x3e2fb5 = (_0x3e2fb5 * 31 + _0x585b87.charCodeAt(_0x2aba66)) | 0;
  }
  return Math.abs(_0x3e2fb5);
}
