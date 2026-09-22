export function browserDeviceInfo() {
  const _0x857e69 =
    (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  const _0x2a8b35 =
    (navigator.userAgentData && navigator.userAgentData.brands) || [];
  const _0x5d7a32 = _0x2a8b35.find((_0x234290) =>
    /Edge|Opera|Brave/i.test(_0x234290.brand),
  );
  const _0x364206 = /Edg\//.test(_0x857e69)
    ? 'Edge'
    : /OPR\//.test(_0x857e69)
      ? 'Opera'
      : _0x5d7a32
        ? _0x5d7a32.brand.replace(/^Microsoft /, '')
        : /Chrome\//.test(_0x857e69)
          ? 'Chrome'
          : 'Browser';
  const _0x4c9f42 =
    (/(?:Chrome|Edg|OPR)\/(\d+)/.exec(_0x857e69) || [])[1] || '';
  const _0x436ba5 = /Windows NT 1[01]/.test(_0x857e69)
    ? 'Windows'
    : /Windows/.test(_0x857e69)
      ? 'Windows'
      : /Mac OS X/.test(_0x857e69)
        ? 'macOS'
        : /CrOS/.test(_0x857e69)
          ? 'ChromeOS'
          : /Android/.test(_0x857e69)
            ? 'Android'
            : /Linux/.test(_0x857e69)
              ? 'Linux'
              : '';
  let _0x2bb15e = '';
  try {
    _0x2bb15e = chrome.runtime.getManifest().version || '';
  } catch (_0x1491f1) {}
  return {
    device_name: _0x436ba5 ? _0x364206 + ' on ' + _0x436ba5 : _0x364206,
    browser: _0x364206,
    browser_version: _0x4c9f42,
    os: _0x436ba5,
    extension_version: _0x2bb15e,
  };
}
