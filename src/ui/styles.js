export async function loadStyles(_0x25d9d6, _0x555c9f) {
  const _0x569d24 = chrome.runtime.getURL('src/styles/wacrm.css');
  try {
    const _0x5a17fd = await fetch(_0x569d24);
    const _0x2266ac = await _0x5a17fd.text();
    if (
      'adoptedStyleSheets' in _0x25d9d6 &&
      typeof CSSStyleSheet !== 'undefined' &&
      CSSStyleSheet.prototype.replaceSync
    ) {
      const _0x3f6378 = new CSSStyleSheet();
      _0x3f6378.replaceSync(_0x2266ac);
      _0x25d9d6.adoptedStyleSheets = [_0x3f6378];
    } else {
      const _0x3bf640 = document.createElement('style');
      _0x3bf640.textContent = _0x2266ac;
      _0x25d9d6.insertBefore(_0x3bf640, _0x555c9f);
    }
  } catch (_0x57fd51) {
    const _0x2b67f2 = document.createElement('link');
    _0x2b67f2.rel = 'stylesheet';
    _0x2b67f2.href = _0x569d24;
    _0x25d9d6.insertBefore(_0x2b67f2, _0x555c9f);
  }
}
