import { getPath, digits, betterName, looksLikePhone } from './util.js';
const TOKEN = /\{\{\s*([\w.\-]+)\s*\}\}/g;
function lookup(_0x160ecf, _0x5057ce) {
  if (!_0x160ecf) {
    return undefined;
  }
  if (Object.prototype.hasOwnProperty.call(_0x160ecf, _0x5057ce)) {
    return _0x160ecf[_0x5057ce];
  }
  const _0xf21f3a = _0x5057ce.toLowerCase();
  for (const _0x10dfb2 of Object.keys(_0x160ecf)) {
    if (_0x10dfb2.toLowerCase() === _0xf21f3a) {
      return _0x160ecf[_0x10dfb2];
    }
  }
  if (_0x5057ce.includes('.')) {
    return getPath(_0x160ecf, _0x5057ce);
  }
  return undefined;
}
export function renderTemplate(_0x2777d2, _0x420a5e, _0x2c0664 = {}) {
  if (_0x2777d2 == null) {
    return '';
  }
  return String(_0x2777d2).replace(TOKEN, (_0x125da0, _0x16cd32) => {
    const _0x14e2ac = lookup(_0x420a5e, _0x16cd32);
    if (_0x14e2ac === undefined || _0x14e2ac === null) {
      if (_0x2c0664.keepUnknown) {
        return _0x125da0;
      } else {
        return '';
      }
    }
    if (typeof _0x14e2ac === 'object') {
      return JSON.stringify(_0x14e2ac);
    } else {
      return String(_0x14e2ac);
    }
  });
}
export function findVariables(_0x53b1e0) {
  const _0x2a8531 = new Set();
  String(_0x53b1e0 || '').replace(TOKEN, (_0x43c226, _0x573ab4) => {
    _0x2a8531.add(_0x573ab4);
    return '';
  });
  return Array.from(_0x2a8531);
}
export const SYSTEM_VARIABLES = [
  {
    key: 'name',
    label: 'Full name',
  },
  {
    key: 'firstname',
    label: 'First name',
  },
  {
    key: 'lastname',
    label: 'Last name',
  },
  {
    key: 'phone',
    label: 'Phone number',
  },
  {
    key: 'mob_no',
    label: 'Phone number (digits)',
  },
  {
    key: 'email',
    label: 'Email',
  },
  {
    key: 'date',
    label: "Today's date",
  },
  {
    key: 'time',
    label: 'Current time',
  },
  {
    key: 'agent',
    label: 'Agent name',
  },
];
export function buildVars({
  contact: _0x4c7772,
  chat: _0x1725fc,
  fields: _0xd0b296,
  settings: _0x320318,
  extra: _0x47bae0,
} = {}) {
  const _0x4ff628 = _0x4c7772 || {};
  const _0xb3070e = betterName(_0x4ff628.fullName, _0x1725fc && _0x1725fc.name);
  const _0xc5657d = looksLikePhone(_0xb3070e)
    ? []
    : _0xb3070e.split(/\s+/).filter(Boolean);
  const _0x3ddb89 = _0x4ff628.phone || (_0x1725fc && _0x1725fc.phone) || '';
  const _0x5896ad = new Date();
  const _0x289768 = {
    name: _0xb3070e,
    firstname: _0xc5657d[0] || '',
    lastname: _0xc5657d.slice(1).join(' '),
    phone: _0x3ddb89 ? '+' + digits(_0x3ddb89) : '',
    mob_no: digits(_0x3ddb89),
    email: _0x4ff628.email || '',
    date: _0x5896ad.toLocaleDateString(),
    time: _0x5896ad.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    agent: (_0x320318 && _0x320318.agentName) || '',
  };
  if (_0x4ff628.attributes) {
    for (const _0x52c13c of Object.keys(_0x4ff628.attributes)) {
      _0x289768[_0x52c13c] = _0x4ff628.attributes[_0x52c13c];
    }
  }
  if (_0xd0b296) {
    for (const _0x5ccf0d of _0xd0b296) {
      if (
        _0x4ff628.attributes &&
        _0x4ff628.attributes[_0x5ccf0d.key] !== undefined
      ) {
        _0x289768[_0x5ccf0d.key] = _0x4ff628.attributes[_0x5ccf0d.key];
      }
    }
  }
  return Object.assign(_0x289768, _0x47bae0 || {});
}
