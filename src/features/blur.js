export const BLUR_DEFAULTS = {
  enabled: false,
  messages: true,
  names: true,
  photos: true,
  conversation: false,
  hover: true,
  everything: false,
  strength: 'medium',
};
export const BLUR_STRENGTH = {
  light: 3,
  medium: 6,
  strong: 10,
};
export function blurConfig(_0x5e1636) {
  const _0x73a847 = _0x5e1636.setting('blur', {}) || {};
  return Object.assign({}, BLUR_DEFAULTS, _0x73a847);
}
export function blurCss(_0x501cd9) {
  if (!_0x501cd9 || !_0x501cd9.enabled) {
    return '';
  }
  const _0x4baeda = BLUR_STRENGTH[_0x501cd9.strength] || BLUR_STRENGTH.medium;
  const _0x4ee85d = 'filter: blur(' + _0x4baeda + 'px) !important;';
  const _0x3e8d0b = [];
  const _0x4a4291 = [];
  if (_0x501cd9.messages) {
    _0x4a4291.push('[data-wc-blur~="preview"]');
  }
  if (_0x501cd9.names) {
    _0x4a4291.push('[data-wc-blur~="name"]');
  }
  if (_0x501cd9.photos) {
    _0x4a4291.push('[data-wc-blur~="photo"]');
  }
  if (_0x501cd9.conversation) {
    _0x4a4291.push('[data-wc-blur~="message"]');
  }
  if (_0x4a4291.length) {
    _0x3e8d0b.push(
      _0x4a4291.join(',\n') +
        ' { ' +
        _0x4ee85d +
        ' transition: filter 0.12s; }',
    );
  }
  if (_0x501cd9.conversation && _0x501cd9.hover) {
    _0x3e8d0b.push(
      '[data-wc-row]:hover [data-wc-blur~="message"] { filter: none !important; }',
    );
  }
  if (_0x501cd9.everything) {
    _0x3e8d0b.push('#side, #main { ' + _0x4ee85d + ' }');
  }
  return _0x3e8d0b.join('\n');
}
const TEXT = 'span[title], span[dir="auto"], span[dir="ltr"]';
const ROWS =
  '[role="listitem"], [role="row"], [data-testid="cell-frame-container"]';
const DEFAULT_AVATAR = '[data-icon^="default-"], [data-testid^="default-"]';
const AUTHOR =
  '[data-testid="author"], span[dir="auto"][role="button"], span[dir="auto"][role="link"]';
const INFO_PANELS =
  '[data-testid="chat-info-drawer"], [data-testid="drawer-right"], [data-testid="contact-info-drawer"]';
const MESSAGE_ID = /^(true|false)_/;
const list = (_0x20b4cd, _0x356a40) =>
  Array.from(_0x20b4cd.querySelectorAll(_0x356a40));
const hasText = (_0x4f2574) => (_0x4f2574.textContent || '').trim().length > 0;
const outermost = (_0x999c8d) =>
  _0x999c8d.filter(
    (_0x4e203f) =>
      !_0x999c8d.some(
        (_0x223ccc) => _0x223ccc !== _0x4e203f && _0x223ccc.contains(_0x4e203f),
      ),
  );
const innermost = (_0x4cc8b7) =>
  _0x4cc8b7.filter(
    (_0x51263c) =>
      !_0x4cc8b7.some(
        (_0x2b50af) => _0x2b50af !== _0x51263c && _0x51263c.contains(_0x2b50af),
      ),
  );
const textSpans = (_0x42b8cb) =>
  outermost(list(_0x42b8cb, TEXT).filter(hasText));
const pictures = (_0x3fd1da) =>
  list(_0x3fd1da, 'img').filter(
    (_0x3f5945) =>
      !_0x3f5945.closest(TEXT) &&
      !_0x3f5945.matches('.emoji, [data-plain-text]'),
  );
const avatars = (_0x4ed4a2) =>
  pictures(_0x4ed4a2).concat(list(_0x4ed4a2, DEFAULT_AVATAR));
function collect(_0x5cc3d5) {
  const _0x325a0c = new Map();
  const _0x4c70e3 = new Set();
  const _0x33042e = (_0x27c478, _0x4964f1) => {
    if (!_0x325a0c.has(_0x27c478)) {
      _0x325a0c.set(_0x27c478, new Set());
    }
    _0x325a0c.get(_0x27c478).add(_0x4964f1);
  };
  const _0x449c2d =
    _0x5cc3d5.getElementById('side') || _0x5cc3d5.getElementById('pane-side');
  if (_0x449c2d) {
    for (const _0x4632e0 of avatars(
      _0x449c2d.querySelector('header') || _0x5cc3d5.createElement('div'),
    )) {
      _0x33042e(_0x4632e0, 'photo');
    }
    for (const _0x2eaead of innermost(list(_0x449c2d, ROWS))) {
      const _0x3a46e8 = textSpans(_0x2eaead);
      const _0x4a9ac8 =
        _0x3a46e8.find((_0x5b4a6f) => _0x5b4a6f.hasAttribute('title')) ||
        _0x3a46e8[0];
      for (const _0x418d61 of _0x3a46e8) {
        _0x33042e(_0x418d61, _0x418d61 === _0x4a9ac8 ? 'name' : 'preview');
      }
      for (const _0x9ee97a of avatars(_0x2eaead)) {
        _0x33042e(_0x9ee97a, 'photo');
      }
    }
  }
  const _0x5e0f6a = _0x5cc3d5.getElementById('main');
  if (_0x5e0f6a) {
    const _0x451949 = _0x5e0f6a.querySelector('header');
    if (_0x451949) {
      for (const _0x3c4011 of textSpans(_0x451949)) {
        _0x33042e(_0x3c4011, 'name');
      }
      for (const _0x29c05f of avatars(_0x451949)) {
        _0x33042e(_0x29c05f, 'photo');
      }
    }
    const _0x5ec0d2 = outermost(
      list(_0x5e0f6a, '[data-id]').filter((_0x1c4d16) =>
        MESSAGE_ID.test(_0x1c4d16.getAttribute('data-id') || ''),
      ),
    );
    for (const _0x4c7a90 of _0x5ec0d2) {
      _0x4c70e3.add(_0x4c7a90);
      const _0xfbb1f3 = list(_0x4c7a90, AUTHOR).filter(hasText);
      for (const _0x3b441d of _0xfbb1f3) {
        _0x33042e(_0x3b441d, 'name');
      }
      for (const _0x25a52f of textSpans(_0x4c7a90)) {
        if (
          _0xfbb1f3.some(
            (_0x1ab6f0) =>
              _0x1ab6f0 === _0x25a52f ||
              _0x1ab6f0.contains(_0x25a52f) ||
              _0x25a52f.contains(_0x1ab6f0),
          )
        ) {
          continue;
        }
        _0x33042e(_0x25a52f, 'message');
      }
      for (const _0x58cbf2 of list(_0x4c7a90, 'img, video, canvas')) {
        if (
          !_0x58cbf2.closest(TEXT) &&
          !_0x58cbf2.matches('.emoji, [data-plain-text]')
        ) {
          _0x33042e(_0x58cbf2, 'message');
        }
      }
    }
  }
  for (const _0x151707 of list(_0x5cc3d5, INFO_PANELS)) {
    for (const _0x52fd75 of textSpans(_0x151707)) {
      _0x33042e(_0x52fd75, 'name');
    }
    for (const _0x4586b1 of avatars(_0x151707)) {
      _0x33042e(_0x4586b1, 'photo');
    }
  }
  return {
    wanted: _0x325a0c,
    rows: _0x4c70e3,
  };
}
export function tagPrivateElements(_0x59d698) {
  const { wanted: _0x4f7d1d, rows: _0x576f72 } = collect(_0x59d698);
  for (const _0x58a38c of list(_0x59d698, '[data-wc-blur]')) {
    if (!_0x4f7d1d.has(_0x58a38c)) {
      _0x58a38c.removeAttribute('data-wc-blur');
    }
  }
  for (const _0x5e76c9 of list(_0x59d698, '[data-wc-row]')) {
    if (!_0x576f72.has(_0x5e76c9)) {
      _0x5e76c9.removeAttribute('data-wc-row');
    }
  }
  for (const [_0x4a414d, _0x401e50] of _0x4f7d1d) {
    const _0xf793b7 = Array.from(_0x401e50).sort().join(' ');
    if (_0x4a414d.getAttribute('data-wc-blur') !== _0xf793b7) {
      _0x4a414d.setAttribute('data-wc-blur', _0xf793b7);
    }
  }
  for (const _0x144338 of _0x576f72) {
    if (!_0x144338.hasAttribute('data-wc-row')) {
      _0x144338.setAttribute('data-wc-row', '');
    }
  }
  return _0x4f7d1d.size;
}
export function clearBlurTags(_0x11bab4) {
  for (const _0x32d183 of list(_0x11bab4, '[data-wc-blur]')) {
    _0x32d183.removeAttribute('data-wc-blur');
  }
  for (const _0x567a76 of list(_0x11bab4, '[data-wc-row]')) {
    _0x567a76.removeAttribute('data-wc-row');
  }
}
export function installBlur(_0x13b145, _0x3ab63b = document) {
  let _0x5e47bc = null;
  let _0x5ee53e = null;
  if (
    'adoptedStyleSheets' in _0x3ab63b &&
    typeof CSSStyleSheet !== 'undefined' &&
    CSSStyleSheet.prototype.replaceSync
  ) {
    _0x5e47bc = new CSSStyleSheet();
    _0x3ab63b.adoptedStyleSheets = Array.from(
      _0x3ab63b.adoptedStyleSheets,
    ).concat([_0x5e47bc]);
  } else {
    _0x5ee53e = _0x3ab63b.createElement('style');
    (_0x3ab63b.head || _0x3ab63b.documentElement).appendChild(_0x5ee53e);
  }
  let _0x525e3c = null;
  let _0xe280b7 = 0;
  let _0x1f96ca = blurConfig(_0x13b145.store);
  const _0xf23b84 = () =>
    _0x1f96ca.enabled &&
    (_0x1f96ca.messages ||
      _0x1f96ca.names ||
      _0x1f96ca.photos ||
      _0x1f96ca.conversation);
  const _0x490cde = () => {
    if (_0xe280b7) {
      return;
    }
    _0xe280b7 = setTimeout(() => {
      _0xe280b7 = 0;
      if (_0xf23b84()) {
        tagPrivateElements(_0x3ab63b);
      }
    }, 250);
  };
  const _0x24caae = () => {
    if (
      _0x525e3c ||
      !_0x3ab63b.body ||
      typeof MutationObserver === 'undefined'
    ) {
      return;
    }
    _0x525e3c = new MutationObserver(_0x490cde);
    _0x525e3c.observe(_0x3ab63b.body, {
      childList: true,
      subtree: true,
    });
  };
  const _0x5bca8d = () => {
    if (_0x525e3c) {
      _0x525e3c.disconnect();
      _0x525e3c = null;
    }
    if (_0xe280b7) {
      clearTimeout(_0xe280b7);
      _0xe280b7 = 0;
    }
  };
  function _0x5e9c76() {
    _0x1f96ca = blurConfig(_0x13b145.store);
    if (!_0x13b145.license.isActive()) {
      _0x1f96ca = Object.assign({}, _0x1f96ca, {
        enabled: false,
      });
    }
    const _0x3f3413 = blurCss(_0x1f96ca);
    if (_0x5e47bc) {
      _0x5e47bc.replaceSync(_0x3f3413);
    } else {
      _0x5ee53e.textContent = _0x3f3413;
    }
    if (_0xf23b84()) {
      tagPrivateElements(_0x3ab63b);
      _0x24caae();
    } else {
      _0x5bca8d();
      clearBlurTags(_0x3ab63b);
    }
  }
  const _0x4d1496 = _0x13b145.store.on('settings', _0x5e9c76);
  const _0x2bb297 = _0x13b145.license.on(_0x5e9c76);
  _0x5e9c76();
  return {
    config: () => blurConfig(_0x13b145.store),
    set: (_0x1bb5e2) =>
      _0x13b145.store.setSetting(
        'blur',
        Object.assign(blurConfig(_0x13b145.store), _0x1bb5e2),
      ),
    toggle: () => {
      const _0xe57d64 = !blurConfig(_0x13b145.store).enabled;
      return _0x13b145.store
        .setSetting(
          'blur',
          Object.assign(blurConfig(_0x13b145.store), {
            enabled: _0xe57d64,
          }),
        )
        .then(() => _0xe57d64);
    },
    refresh: _0x5e9c76,
    dispose() {
      _0x4d1496();
      _0x2bb297();
      _0x5bca8d();
      clearBlurTags(_0x3ab63b);
      if (_0x5e47bc) {
        _0x3ab63b.adoptedStyleSheets = Array.from(
          _0x3ab63b.adoptedStyleSheets,
        ).filter((_0x43812e) => _0x43812e !== _0x5e47bc);
      } else {
        _0x5ee53e.remove();
      }
    },
  };
}
