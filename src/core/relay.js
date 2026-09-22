import { brand } from './brand.js';
const WA_MATCH = 'https://web.whatsapp.com/*';
const HEARTBEAT_MS = 20000;
const LISTEN_MS = 60000;
export const NO_TAB =
  'WhatsApp Web is not open. Open it in another Chrome tab, then try again.';
export const RELOAD_TAB =
  brand() +
  ' cannot reach the WhatsApp Web tab. Reload that tab, then try again.';
export function relayTransport(
  _0x40025a = globalThis.chrome,
  { heartbeatMs = HEARTBEAT_MS } = {},
) {
  const _0x2b2755 = new Set();
  let _0x4e5f90 = null;
  _0x40025a.runtime.onMessage.addListener((_0x58a371) => {
    if (_0x58a371 && _0x58a371.type === 'wa-event') {
      for (const _0x9b4474 of _0x2b2755) {
        _0x9b4474(_0x58a371.name, _0x58a371.data);
      }
    }
  });
  async function _0x4542b6() {
    const _0x404ce5 = await _0x40025a.tabs.query({
      url: WA_MATCH,
    });
    const _0x477ebc =
      _0x404ce5.find((_0x27610e) => _0x27610e.active) || _0x404ce5[0] || null;
    _0x4e5f90 = _0x477ebc ? _0x477ebc.id : null;
    return _0x477ebc;
  }
  async function _0x3f49e0(_0x48efec) {
    if (_0x4e5f90 === null && !(await _0x4542b6())) {
      throw new Error(NO_TAB);
    }
    try {
      return await _0x40025a.tabs.sendMessage(_0x4e5f90, _0x48efec);
    } catch (_0x3e0b72) {
      if (!(await _0x4542b6())) {
        throw new Error(NO_TAB);
      }
      try {
        return await _0x40025a.tabs.sendMessage(_0x4e5f90, _0x48efec);
      } catch (_0x1d473e) {
        throw new Error(RELOAD_TAB);
      }
    }
  }
  async function _0x58f05d() {
    try {
      await _0x40025a.tabs.update(_0x4e5f90, {
        active: true,
      });
      const _0x2733b6 = await _0x40025a.tabs.get(_0x4e5f90);
      if (_0x2733b6 && _0x2733b6.windowId !== undefined) {
        await _0x40025a.windows.update(_0x2733b6.windowId, {
          focused: true,
        });
      }
    } catch (_0x153135) {}
  }
  const _0x30d0fb = () =>
    _0x3f49e0({
      type: 'wa-listen',
    }).catch(() => {});
  if (heartbeatMs) {
    setInterval(_0x30d0fb, heartbeatMs);
  }
  _0x30d0fb();
  return {
    async request(_0x4495ff, _0x2a314f, _0x57de1d) {
      const _0x13a2dd = await _0x3f49e0({
        type: 'wa-relay',
        method: _0x4495ff,
        args: _0x2a314f || [],
        timeoutMs: _0x57de1d,
      });
      if (!_0x13a2dd) {
        throw new Error(RELOAD_TAB);
      }
      if (!_0x13a2dd.ok) {
        throw new Error(_0x13a2dd.error || 'WhatsApp did not answer.');
      }
      if (_0x4495ff === 'chat.open') {
        _0x58f05d();
      }
      return _0x13a2dd.result;
    },
    onEvent(_0x20b1d4) {
      _0x2b2755.add(_0x20b1d4);
      return () => _0x2b2755.delete(_0x20b1d4);
    },
  };
}
export function serveRelay(
  _0x50124e,
  _0x3b0fbd = globalThis.chrome,
  { now = () => Date.now() } = {},
) {
  let _0x270d9e = 0;
  const _0x285c7f = () => {
    _0x270d9e = now() + LISTEN_MS;
  };
  _0x50124e.onEvent((_0x2cb1b1, _0x12e5d6) => {
    if (now() < _0x270d9e) {
      _0x3b0fbd.runtime
        .sendMessage({
          type: 'wa-event',
          name: _0x2cb1b1,
          data: _0x12e5d6,
        })
        .catch(() => {});
    }
  });
  _0x3b0fbd.runtime.onMessage.addListener((_0x45d8a9, _0x2c585e, _0xc424ee) => {
    if (
      !_0x45d8a9 ||
      (_0x45d8a9.type !== 'wa-relay' && _0x45d8a9.type !== 'wa-listen')
    ) {
      return false;
    }
    if (
      _0x2c585e &&
      _0x2c585e.id !== undefined &&
      _0x3b0fbd.runtime.id !== undefined &&
      _0x2c585e.id !== _0x3b0fbd.runtime.id
    ) {
      return false;
    }
    _0x285c7f();
    if (_0x45d8a9.type === 'wa-listen') {
      _0xc424ee({
        ok: true,
      });
      return false;
    }
    _0x50124e
      .request(
        _0x45d8a9.method,
        _0x45d8a9.args || [],
        _0x45d8a9.timeoutMs || 30000,
      )
      .then(
        (_0x473fba) =>
          _0xc424ee({
            ok: true,
            result: _0x473fba,
          }),
        (_0x20c8dd) =>
          _0xc424ee({
            ok: false,
            error: String((_0x20c8dd && _0x20c8dd.message) || _0x20c8dd),
          }),
      );
    return true;
  });
}
