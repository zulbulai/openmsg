import { brand } from './brand.js';
export class PermissionError extends Error {
  constructor(_0x117894) {
    super('Allow ' + brand() + ' to reach ' + _0x117894 + ' to continue.');
    this.name = 'PermissionError';
    this.origin = _0x117894;
  }
}
export function createHttp({ send: _0x557993, fetchImpl: _0x599b8c } = {}) {
  async function _0x55ea6c(_0x404686) {
    const _0xc1a33d = new AbortController();
    const _0x3a7862 = setTimeout(
      () => _0xc1a33d.abort(),
      _0x404686.timeoutMs || 20000,
    );
    try {
      const _0x11356e = await _0x599b8c(_0x404686.url, {
        method: _0x404686.method,
        headers: _0x404686.headers,
        body: _0x404686.body,
        signal: _0xc1a33d.signal,
      });
      const _0x121700 = await _0x11356e.text();
      return {
        ok: _0x11356e.ok,
        status: _0x11356e.status,
        headers: {},
        text: _0x121700,
      };
    } finally {
      clearTimeout(_0x3a7862);
    }
  }
  const _0x30c7a7 = {
    async request(_0x28eeca) {
      const _0x3fb321 = Object.assign(
        {
          method: 'GET',
          headers: {},
          timeoutMs: 20000,
        },
        _0x28eeca,
      );
      _0x3fb321.method = String(_0x3fb321.method).toUpperCase();
      _0x3fb321.headers = Object.assign({}, _0x3fb321.headers);
      if (_0x3fb321.json !== undefined) {
        _0x3fb321.body = JSON.stringify(_0x3fb321.json);
        if (
          !Object.keys(_0x3fb321.headers).some(
            (_0x2ecd00) => _0x2ecd00.toLowerCase() === 'content-type',
          )
        ) {
          _0x3fb321.headers['Content-Type'] = 'application/json';
        }
      }
      if (_0x3fb321.method === 'GET' || _0x3fb321.method === 'HEAD') {
        delete _0x3fb321.body;
      }
      let _0x590982;
      if (_0x599b8c) {
        _0x590982 = await _0x55ea6c(_0x3fb321);
      } else {
        _0x590982 = await _0x557993({
          type: 'http',
          url: _0x3fb321.url,
          method: _0x3fb321.method,
          headers: _0x3fb321.headers,
          body: _0x3fb321.body,
          timeoutMs: _0x3fb321.timeoutMs,
        });
        if (_0x590982 && _0x590982.needsPermission) {
          throw new PermissionError(_0x590982.origin);
        }
        if (!_0x590982 || _0x590982.error) {
          throw new Error(
            (_0x590982 && _0x590982.error) || 'The request failed.',
          );
        }
      }
      return {
        ok: _0x590982.ok,
        status: _0x590982.status,
        text: _0x590982.text || '',
        json() {
          try {
            return JSON.parse(_0x590982.text);
          } catch (_0x19b41d) {
            return null;
          }
        },
      };
    },
    async grant(_0x22d5a7) {
      if (!_0x557993) {
        return true;
      }
      return _0x557993({
        type: 'grant',
        origins: [].concat(_0x22d5a7),
      });
    },
    async hasAccess(_0x4acd85) {
      if (_0x599b8c || !_0x557993) {
        return true;
      }
      const _0xf74d93 = await _0x557993({
        type: 'has-access',
        url: _0x4acd85,
      });
      return !!_0xf74d93 && !!_0xf74d93.ok;
    },
    originOf(_0x128600) {
      try {
        return new URL(_0x128600).origin;
      } catch (_0xe2d9e3) {
        return '';
      }
    },
  };
  return _0x30c7a7;
}
