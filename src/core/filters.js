const isPerson = (_0x1f064f) =>
  !!_0x1f064f.isUser &&
  !_0x1f064f.isGroup &&
  !_0x1f064f.isBroadcast &&
  !_0x1f064f.isNewsletter;
export const SYSTEM_FILTERS = [
  {
    id: 'all',
    label: 'All',
    icon: 'inbox',
    native: 'all',
  },
  {
    id: 'unread',
    label: 'Unread',
    icon: 'mail',
    native: 'unread',
  },
  {
    id: 'favorites',
    label: 'Favourites',
    icon: 'star',
    native: 'favorites',
  },
  {
    id: 'personal',
    label: 'One to One',
    icon: 'user-round',
    pick: (_0x2145fc) => isPerson(_0x2145fc),
  },
  {
    id: 'group',
    label: 'Groups',
    icon: 'users',
    native: 'group',
  },
  {
    id: 'unsaved',
    label: 'Unsaved',
    icon: 'user-plus',
    pick: (_0x5c412e) => isPerson(_0x5c412e) && !_0x5c412e.isMyContact,
  },
  {
    id: 'business',
    label: 'Business',
    icon: 'building-2',
    pick: (_0x17fa16) => isPerson(_0x17fa16) && !!_0x17fa16.isBusiness,
  },
  {
    id: 'awaiting',
    label: 'Awaiting reply',
    icon: 'clock',
    pick: (_0x1df840) => isPerson(_0x1df840) && _0x1df840.lastFromMe === false,
  },
];
export function createFilters({
  wa: _0x24b4ab,
  crm: _0x175bb8,
  store: _0xd4bb56,
}) {
  let _0x3cf9dc = {
    kind: 'system',
    id: 'all',
  };
  let _0x2dc002 = null;
  const _0x54e441 = {
    system: SYSTEM_FILTERS,
    current: () => _0x3cf9dc,
    async awaitingIds() {
      const _0x11f98a = SYSTEM_FILTERS.find(
        (_0x3f2698) => _0x3f2698.id === 'awaiting',
      ).pick;
      const _0xed6879 = await _0x24b4ab.listChats({
        onlyUsers: true,
      });
      return _0xed6879
        .filter((_0x4bc4ff) => _0x11f98a(_0x4bc4ff) && !_0x4bc4ff.archived)
        .map((_0x277e59) => _0x277e59.id);
    },
    async apply(_0x5153a8) {
      _0x3cf9dc = _0x5153a8;
      _0x2dc002 = null;
      if (_0x5153a8.kind === 'system') {
        const _0x31b0e5 = SYSTEM_FILTERS.find(
          (_0x4474fb) => _0x4474fb.id === _0x5153a8.id,
        );
        if (!_0x31b0e5) {
          return;
        }
        if (_0x31b0e5.native) {
          return _0x24b4ab.setFilter(_0x31b0e5.native, []);
        }
        const _0x51d962 = await _0x24b4ab.listChats({
          onlyUsers: true,
        });
        const _0x18d21d = _0x51d962
          .filter(
            (_0x4c1360) => _0x31b0e5.pick(_0x4c1360) && !_0x4c1360.archived,
          )
          .map((_0x160a6b) => _0x160a6b.id);
        _0x2dc002 = {
          pick: _0x31b0e5.pick,
          ids: new Set(_0x18d21d),
        };
        return _0x24b4ab.setFilter('custom', _0x18d21d);
      }
      if (_0x5153a8.kind === 'tab') {
        const _0x488a64 = _0xd4bb56.get('tabs', _0x5153a8.id);
        return _0x24b4ab.setFilter(
          'custom',
          _0x488a64 ? _0x488a64.members || [] : [],
        );
      }
      if (_0x5153a8.kind === 'label') {
        const _0x13b282 = await _0x24b4ab.listChats({});
        return _0x24b4ab.setFilter(
          'custom',
          _0x13b282
            .filter((_0x2d96d9) =>
              (_0x2d96d9.labels || []).includes(_0x5153a8.id),
            )
            .map((_0x2cc06) => _0x2cc06.id),
        );
      }
      return _0x24b4ab.setFilter('all', []);
    },
    async onMessage(_0x3be618) {
      if (
        !_0x2dc002 ||
        !_0x3be618 ||
        !_0x3be618.chatId ||
        _0x2dc002.ids.has(_0x3be618.chatId)
      ) {
        return false;
      }
      const _0x1f3759 =
        _0x24b4ab.chatById(_0x3be618.chatId) ||
        (await _0x24b4ab.getChat(_0x3be618.chatId).catch(() => null));
      if (!_0x1f3759 || _0x1f3759.archived || !_0x2dc002.pick(_0x1f3759)) {
        return false;
      }
      _0x2dc002.ids.add(_0x1f3759.id);
      await _0x24b4ab.setFilter('custom', Array.from(_0x2dc002.ids));
      return true;
    },
    async counts() {
      const _0x5d6c3c = {};
      try {
        const _0xca0def = await _0x24b4ab.listChats({
          onlyWithUnreadMessage: true,
        });
        _0x5d6c3c.unread = _0xca0def.length;
        _0x5d6c3c.awaiting = (await _0x54e441.awaitingIds()).length;
      } catch (_0x1cd853) {}
      return _0x5d6c3c;
    },
    pills(_0x1ad188 = true) {
      const _0x2f5caa = _0x175bb8
        .tabs()
        .filter((_0x271eed) => _0x271eed.visible !== false)
        .map((_0x4501a5) => ({
          kind: 'tab',
          id: _0x4501a5.id,
          label: _0x4501a5.title,
          icon: 'folders',
        }));
      const _0xfaa66d = _0x1ad188
        ? SYSTEM_FILTERS.map((_0x227235) => ({
            kind: 'system',
            id: _0x227235.id,
            label: _0x227235.label,
            icon: _0x227235.icon,
          }))
        : [];
      return _0xfaa66d.concat(_0x2f5caa);
    },
  };
  return _0x54e441;
}
