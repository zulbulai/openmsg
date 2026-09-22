import { digits } from './util.js';
function detectDelimiter(_0x4399e5) {
  const _0x294fc4 = _0x4399e5.split(/\r?\n/, 1)[0] || '';
  let _0x282510 = ',';
  let _0x2eafbd = 0;
  for (const _0x5f24c8 of [',', ';', '\t']) {
    let _0x48a9e6 = 0;
    let _0x51c3d2 = false;
    for (const _0x53786c of _0x294fc4) {
      if (_0x53786c === '"') {
        _0x51c3d2 = !_0x51c3d2;
      } else if (_0x53786c === _0x5f24c8 && !_0x51c3d2) {
        _0x48a9e6++;
      }
    }
    if (_0x48a9e6 > _0x2eafbd) {
      _0x282510 = _0x5f24c8;
      _0x2eafbd = _0x48a9e6;
    }
  }
  return _0x282510;
}
export function parseCsv(_0x249bb0, _0x18d29f = {}) {
  const _0x4476fc = [];
  let _0x49d228 = [];
  let _0x52bf96 = '';
  let _0x1b2faf = false;
  const _0x3d952c = String(_0x249bb0 || '').replace(/^﻿/, '');
  const _0x28ab62 = _0x18d29f.delimiter || detectDelimiter(_0x3d952c);
  const _0x2daf03 = (_0x1519bc) =>
    _0x28ab62 === 'any'
      ? _0x1519bc === ',' || _0x1519bc === ';' || _0x1519bc === '\t'
      : _0x1519bc === _0x28ab62;
  for (let _0x5a667a = 0; _0x5a667a < _0x3d952c.length; _0x5a667a++) {
    const _0x2004a9 = _0x3d952c[_0x5a667a];
    if (_0x1b2faf) {
      if (_0x2004a9 === '"') {
        if (_0x3d952c[_0x5a667a + 1] === '"') {
          _0x52bf96 += '"';
          _0x5a667a++;
        } else {
          _0x1b2faf = false;
        }
      } else {
        _0x52bf96 += _0x2004a9;
      }
    } else if (_0x2004a9 === '"') {
      _0x1b2faf = true;
    } else if (_0x2daf03(_0x2004a9)) {
      _0x49d228.push(_0x52bf96);
      _0x52bf96 = '';
    } else if (_0x2004a9 === '\n') {
      _0x49d228.push(_0x52bf96);
      _0x4476fc.push(_0x49d228);
      _0x49d228 = [];
      _0x52bf96 = '';
    } else if (_0x2004a9 !== '\r') {
      _0x52bf96 += _0x2004a9;
    }
  }
  if (_0x52bf96 !== '' || _0x49d228.length) {
    _0x49d228.push(_0x52bf96);
    _0x4476fc.push(_0x49d228);
  }
  return _0x4476fc.filter((_0x2eab97) =>
    _0x2eab97.some((_0x1afc73) => _0x1afc73.trim() !== ''),
  );
}
export function toCsv(_0x2ee99b) {
  const _0xcd25a6 = (_0x8c2b52) => {
    const _0x26d366 =
      _0x8c2b52 === null || _0x8c2b52 === undefined ? '' : String(_0x8c2b52);
    if (/[",\n\r;]/.test(_0x26d366)) {
      return '"' + _0x26d366.replace(/"/g, '""') + '"';
    } else {
      return _0x26d366;
    }
  };
  return _0x2ee99b
    .map((_0x485baa) => _0x485baa.map(_0xcd25a6).join(','))
    .join('\r\n');
}
export function parseNumbers(_0x2fba2c) {
  const _0x126b65 = [];
  const _0x1967ae = new Set();
  const _0x27d92b = parseCsv(_0x2fba2c, {
    delimiter: 'any',
  });
  for (const _0x5d4719 of _0x27d92b) {
    let _0x5918c3 = '';
    let _0x3bc0ea = '';
    for (const _0x31db1b of _0x5d4719) {
      const _0x369c5 = digits(_0x31db1b);
      if (
        !_0x5918c3 &&
        _0x369c5.length >= 7 &&
        _0x369c5.length <= 15 &&
        /^[\s+\d()\-.]+$/.test(_0x31db1b.trim())
      ) {
        _0x5918c3 = _0x369c5;
      } else if (
        !_0x3bc0ea &&
        _0x31db1b.trim() &&
        !/^[\s+\d()\-.]+$/.test(_0x31db1b.trim())
      ) {
        _0x3bc0ea = _0x31db1b.trim();
      }
    }
    if (!_0x5918c3 && _0x5d4719.length === 1) {
      for (const _0x3c2880 of String(_0x5d4719[0]).match(
        /\+?\d[\d\s\-()]{6,17}\d/g,
      ) || []) {
        const _0x5db0a6 = digits(_0x3c2880);
        if (
          _0x5db0a6.length >= 7 &&
          _0x5db0a6.length <= 15 &&
          !_0x1967ae.has(_0x5db0a6)
        ) {
          _0x1967ae.add(_0x5db0a6);
          _0x126b65.push({
            phone: _0x5db0a6,
            name: '',
          });
        }
      }
      continue;
    }
    if (_0x5918c3 && !_0x1967ae.has(_0x5918c3)) {
      _0x1967ae.add(_0x5918c3);
      _0x126b65.push({
        phone: _0x5918c3,
        name: _0x3bc0ea,
      });
    }
  }
  return _0x126b65;
}
