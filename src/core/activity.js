const MAX_ENTRIES = 300;
export function createActivity({ store: _0x51b0f2 }) {
  return {
    async log(_0x151f90, _0x4f9f35 = {}) {
      const _0xf303fe = await _0x51b0f2.put(
        'activityLog',
        Object.assign(
          {
            type: _0x151f90,
            at: Date.now(),
          },
          _0x4f9f35,
        ),
      );
      const _0x68f92 = _0x51b0f2.all('activityLog');
      if (_0x68f92.length > MAX_ENTRIES + 40) {
        const _0x4af37d = _0x68f92.slice(0, _0x68f92.length - MAX_ENTRIES);
        for (const _0x4fdd1f of _0x4af37d) {
          await _0x51b0f2.remove('activityLog', _0x4fdd1f.id);
        }
      }
      return _0xf303fe;
    },
    recent(_0x46280b = 50) {
      return _0x51b0f2
        .all('activityLog')
        .slice()
        .sort((_0x244330, _0xae1f2e) => _0xae1f2e.at - _0x244330.at)
        .slice(0, _0x46280b);
    },
    async clear() {
      await _0x51b0f2.clear('activityLog');
    },
  };
}
