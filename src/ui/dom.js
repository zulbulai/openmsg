import { ICON_DATA } from './icons.js';
const SVG_NS = 'http://www.w3.org/2000/svg';
function appendChildren(_0x469f04, _0x3e15fa) {
  for (const _0x47acb6 of _0x3e15fa) {
    if (_0x47acb6 === null || _0x47acb6 === undefined || _0x47acb6 === false) {
      continue;
    }
    if (Array.isArray(_0x47acb6)) {
      appendChildren(_0x469f04, _0x47acb6);
    } else if (_0x47acb6 instanceof Node) {
      _0x469f04.appendChild(_0x47acb6);
    } else {
      _0x469f04.appendChild(document.createTextNode(String(_0x47acb6)));
    }
  }
}
export function h(_0x224fe5, _0x226770, ..._0x35530d) {
  const _0x1f5700 = document.createElement(_0x224fe5);
  if (_0x226770) {
    for (const _0xc8a40a of Object.keys(_0x226770)) {
      const _0x93771c = _0x226770[_0xc8a40a];
      if (
        _0x93771c === null ||
        _0x93771c === undefined ||
        _0x93771c === false
      ) {
        continue;
      }
      if (_0xc8a40a === 'class') {
        _0x1f5700.className = _0x93771c;
      } else if (_0xc8a40a === 'style' && typeof _0x93771c === 'object') {
        Object.assign(_0x1f5700.style, _0x93771c);
      } else if (_0xc8a40a === 'dataset') {
        Object.assign(_0x1f5700.dataset, _0x93771c);
      } else if (_0xc8a40a === 'value') {
        _0x1f5700.value = _0x93771c;
      } else if (_0xc8a40a === 'checked') {
        _0x1f5700.checked = !!_0x93771c;
      } else if (_0xc8a40a === 'ref' && typeof _0x93771c === 'function') {
        _0x93771c(_0x1f5700);
      } else if (
        _0xc8a40a.length > 2 &&
        _0xc8a40a.startsWith('on') &&
        typeof _0x93771c === 'function'
      ) {
        _0x1f5700.addEventListener(_0xc8a40a.slice(2).toLowerCase(), _0x93771c);
      } else if (_0x93771c === true) {
        _0x1f5700.setAttribute(_0xc8a40a, '');
      } else {
        _0x1f5700.setAttribute(_0xc8a40a, String(_0x93771c));
      }
    }
  }
  appendChildren(_0x1f5700, _0x35530d);
  return _0x1f5700;
}
export function clear(_0x2da2cb) {
  while (_0x2da2cb.firstChild) {
    _0x2da2cb.removeChild(_0x2da2cb.firstChild);
  }
  return _0x2da2cb;
}
export function replaceChildren(_0x2643f3, ..._0x1289b7) {
  clear(_0x2643f3);
  appendChildren(_0x2643f3, _0x1289b7);
  return _0x2643f3;
}
export function svgEl(_0x42dcf1, _0xb91e16) {
  const _0x4b9fe1 = document.createElementNS(SVG_NS, _0x42dcf1);
  for (const _0x1aa324 of Object.keys(_0xb91e16 || {})) {
    _0x4b9fe1.setAttribute(_0x1aa324, _0xb91e16[_0x1aa324]);
  }
  return _0x4b9fe1;
}
export function icon(_0x24750b, _0x15ccd9, _0x55cdbe) {
  const _0x5911ac = svgEl('svg', {
    viewBox: '0 0 24 24',
    width: _0x15ccd9 || 18,
    height: _0x15ccd9 || 18,
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  _0x5911ac.setAttribute(
    'class',
    'wc-icon' + (_0x55cdbe ? ' ' + _0x55cdbe : ''),
  );
  const _0xa34efc = ICON_DATA[_0x24750b];
  if (!_0xa34efc) {
    console.warn('[WACRM] unknown icon:', _0x24750b);
  }
  for (const _0x22b60d of _0xa34efc || []) {
    _0x5911ac.appendChild(svgEl(_0x22b60d[0], _0x22b60d[1]));
  }
  return _0x5911ac;
}
export function hasIcon(_0x5adcb0) {
  return !!ICON_DATA[_0x5adcb0];
}
function manifestIconUrl(_0x2a2b95) {
  try {
    const _0x34e47f = chrome.runtime.getManifest().icons || {};
    const _0x49ef66 = Object.keys(_0x34e47f)
      .map(Number)
      .sort((_0x5a5de7, _0xb5bd07) => _0x5a5de7 - _0xb5bd07);
    const _0x244920 =
      _0x49ef66.find((_0x20fd00) => _0x20fd00 >= _0x2a2b95 * 2) ||
      _0x49ef66[_0x49ef66.length - 1];
    if (_0x244920) {
      return chrome.runtime.getURL(_0x34e47f[_0x244920]);
    } else {
      return null;
    }
  } catch (_0x1c6e22) {
    return null;
  }
}
export function logo(_0x1c55d6 = 28) {
  const _0x17df1d = manifestIconUrl(_0x1c55d6);
  if (!_0x17df1d) {
    return drawnLogo(_0x1c55d6);
  }
  const _0xe46f59 = document.createElement('img');
  _0xe46f59.src = _0x17df1d;
  _0xe46f59.width = _0x1c55d6;
  _0xe46f59.height = _0x1c55d6;
  _0xe46f59.alt = '';
  _0xe46f59.draggable = false;
  _0xe46f59.style.cssText =
    'display:block;flex:none;border-radius:' +
    Math.round(_0x1c55d6 * 0.23) +
    'px';
  _0xe46f59.addEventListener(
    'error',
    () => _0xe46f59.replaceWith(drawnLogo(_0x1c55d6)),
    {
      once: true,
    },
  );
  return _0xe46f59;
}
function drawnLogo(_0x3fe8e8) {
  const _0xbda53a = svgEl('svg', {
    viewBox: '0 0 128 128',
    width: _0x3fe8e8,
    height: _0x3fe8e8,
    'aria-hidden': 'true',
  });
  _0xbda53a.appendChild(
    svgEl('rect', {
      width: 128,
      height: 128,
      rx: 30,
      fill: '#ffc72c',
    }),
  );
  _0xbda53a.appendChild(
    svgEl('path', {
      d: 'M34 24h60a14 14 0 0 1 14 14v38a14 14 0 0 1-14 14H64L44 110V90h-10a14 14 0 0 1-14-14V38a14 14 0 0 1 14-14z',
      fill: '#1B1C1E',
    }),
  );
  _0xbda53a.appendChild(
    svgEl('rect', {
      x: 36,
      y: 40,
      width: 14,
      height: 34,
      rx: 5,
      fill: '#ffc72c',
    }),
  );
  _0xbda53a.appendChild(
    svgEl('rect', {
      x: 57,
      y: 40,
      width: 14,
      height: 22,
      rx: 5,
      fill: '#ffc72c',
    }),
  );
  _0xbda53a.appendChild(
    svgEl('rect', {
      x: 78,
      y: 40,
      width: 14,
      height: 28,
      rx: 5,
      fill: '#ffc72c',
    }),
  );
  return _0xbda53a;
}
