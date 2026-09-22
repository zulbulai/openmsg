export function createBus() {
  const _0x21e529 = new Map();
  return {
    on(_0x453953, _0x2401fe) {
      if (!_0x21e529.has(_0x453953)) {
        _0x21e529.set(_0x453953, new Set());
      }
      _0x21e529.get(_0x453953).add(_0x2401fe);
      return () =>
        _0x21e529.get(_0x453953) && _0x21e529.get(_0x453953).delete(_0x2401fe);
    },
    once(_0x3ac9eb, _0x4d8aab) {
      const _0x58d789 = this.on(_0x3ac9eb, (..._0xf27c5c) => {
        _0x58d789();
        _0x4d8aab(..._0xf27c5c);
      });
      return _0x58d789;
    },
    emit(_0x504542, ..._0x406594) {
      const _0x5c446f = _0x21e529.get(_0x504542);
      if (!_0x5c446f) {
        return;
      }
      for (const _0x2a40a6 of Array.from(_0x5c446f)) {
        try {
          _0x2a40a6(..._0x406594);
        } catch (_0x2026aa) {
          console.error(
            '[WACRM] handler for "' + _0x504542 + '" failed',
            _0x2026aa,
          );
        }
      }
    },
  };
}
export const bus = createBus();
