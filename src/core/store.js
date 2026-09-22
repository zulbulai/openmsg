import { uid, clone } from './util.js';
import { createBus } from './events.js';
import { brand } from './brand.js';
export const COLLECTIONS = [
  'settings',
  'contacts',
  'tags',
  'fields',
  'notes',
  'reminders',
  'appointments',
  'tabs',
  'kanbanDashboards',
  'kanbanStages',
  'kanbanCards',
  'quickReplies',
  'templates',
  'workflows',
  'chatbots',
  'chatSessions',
  'chatMemory',
  'schedules',
  'campaigns',
  'statusPosts',
  'webhooks',
  'webhookLog',
  'activityLog',
  'counters',
];
export const DEFAULT_SETTINGS = {
  automationPaused: false,
  delayMin: 3,
  delayMax: 8,
  maxSendsPerHour: 250,
  showTyping: true,
  signatureEnabled: false,
  signatureText: '',
  identifyAgent: false,
  signTyped: true,
  agentName: '',
  deviceName: 'This browser',
  theme: 'auto',
  aiProvider: 'openai',
  aiKeys: {
    openai: '',
    gemini: '',
    anthropic: '',
  },
  aiModels: {
    openai: 'gpt-4o-mini',
    gemini: 'gemini-2.0-flash',
    anthropic: 'claude-haiku-4-5-20251001',
  },
  aiStrapEnabled: true,
  strapEnabled: true,
  reminderNotify: true,
  inboxCount: 30,
  boardMode: 'stages',
  kanbanOpen: 'tab',
  buttonsMode: 'list',
  useLabelsForBusiness: false,
};
const PREFIX_COL = 'wacrm:col:';
const PREFIX_BLOB = 'wacrm:blob:';
export function memoryBackend() {
  const _0x9bc6b = {};
  const _0x2052c5 = new Set();
  return {
    kind: 'memory',
    async get(_0x3e8c97) {
      const _0x283b80 = {};
      for (const _0x4bfcf8 of [].concat(_0x3e8c97)) {
        if (Object.prototype.hasOwnProperty.call(_0x9bc6b, _0x4bfcf8)) {
          _0x283b80[_0x4bfcf8] = clone(_0x9bc6b[_0x4bfcf8]);
        }
      }
      return _0x283b80;
    },
    async set(_0x2dde50) {
      const _0x18d01a = {};
      for (const _0x55fdd8 of Object.keys(_0x2dde50)) {
        _0x18d01a[_0x55fdd8] = {
          oldValue: _0x9bc6b[_0x55fdd8],
          newValue: clone(_0x2dde50[_0x55fdd8]),
        };
        _0x9bc6b[_0x55fdd8] = clone(_0x2dde50[_0x55fdd8]);
      }
      for (const _0x3251a5 of _0x2052c5) {
        _0x3251a5(_0x18d01a);
      }
    },
    async remove(_0x182a3b) {
      for (const _0x1284e8 of [].concat(_0x182a3b)) {
        delete _0x9bc6b[_0x1284e8];
      }
    },
    async keys() {
      return Object.keys(_0x9bc6b);
    },
    onChanged(_0x52510c) {
      _0x2052c5.add(_0x52510c);
      return () => _0x2052c5.delete(_0x52510c);
    },
    _data: _0x9bc6b,
  };
}
export function chromeBackend() {
  const _0x1fb4c9 = chrome.storage.local;
  return {
    kind: 'chrome',
    get: (_0x231c2c) => _0x1fb4c9.get(_0x231c2c),
    set: (_0x518871) => _0x1fb4c9.set(_0x518871),
    remove: (_0x16de13) => _0x1fb4c9.remove(_0x16de13),
    async keys() {
      return Object.keys(await _0x1fb4c9.get(null));
    },
    onChanged(_0x523e3e) {
      const _0x260632 = (_0x3c743b, _0x3f91ea) => {
        if (_0x3f91ea === 'local') {
          _0x523e3e(_0x3c743b);
        }
      };
      chrome.storage.onChanged.addListener(_0x260632);
      return () => chrome.storage.onChanged.removeListener(_0x260632);
    },
  };
}
export function createStore(_0x2d85d6, _0x445620 = {}) {
  const _0x17e6e2 = uid('w');
  const _0x1052ef = createBus();
  const _0x374668 = new Map();
  const _0x3470e7 = new Map();
  const _0x5e06bc = new Map();
  const _0x3917e8 = (_0x1d07be) => {
    if (!_0x5e06bc.has(_0x1d07be)) {
      _0x5e06bc.set(_0x1d07be, {
        put: new Set(),
        del: new Set(),
        whole: false,
      });
    }
    return _0x5e06bc.get(_0x1d07be);
  };
  const _0xa9de6d =
    _0x445620.writeDelay === undefined ? 100 : _0x445620.writeDelay;
  let _0x3b8cec = false;
  const _0x1846d0 = (_0x11c38d) => PREFIX_COL + _0x11c38d;
  const _0x253b1f = (_0x240ee3) => {
    if (!_0x374668.has(_0x240ee3)) {
      _0x374668.set(_0x240ee3, new Map());
    }
    return _0x374668.get(_0x240ee3);
  };
  function _0x7402f9(_0x47f12a, _0x1db5a2) {
    _0x1052ef.emit(_0x47f12a, _0x1db5a2);
    _0x1052ef.emit(
      '*',
      Object.assign(
        {
          col: _0x47f12a,
        },
        _0x1db5a2,
      ),
    );
  }
  async function _0x5506ff(_0x219760) {
    clearTimeout(_0x3470e7.get(_0x219760));
    _0x3470e7.delete(_0x219760);
    _0x5e06bc.delete(_0x219760);
    const _0x3ea3bb = {};
    for (const [_0x3cf6df, _0x40ffb4] of _0x253b1f(_0x219760)) {
      _0x3ea3bb[_0x3cf6df] = _0x40ffb4;
    }
    await _0x2d85d6.set({
      [_0x1846d0(_0x219760)]: {
        __w: _0x17e6e2,
        items: _0x3ea3bb,
      },
    });
  }
  function _0x129a00(_0x383018) {
    if (_0xa9de6d === 0) {
      _0x5506ff(_0x383018);
      return;
    }
    if (_0x3470e7.has(_0x383018)) {
      return;
    }
    _0x3470e7.set(
      _0x383018,
      setTimeout(() => _0x5506ff(_0x383018), _0xa9de6d),
    );
  }
  const _0x9cb683 = {
    writer: _0x17e6e2,
    get ready() {
      return _0x3b8cec;
    },
    async init() {
      const _0x168014 = await _0x2d85d6.get(COLLECTIONS.map(_0x1846d0));
      for (const _0x143ad5 of COLLECTIONS) {
        const _0x6aad21 = _0x168014[_0x1846d0(_0x143ad5)];
        const _0x3c492f = new Map();
        if (_0x6aad21 && _0x6aad21.items) {
          for (const _0x376443 of Object.keys(_0x6aad21.items)) {
            _0x3c492f.set(_0x376443, _0x6aad21.items[_0x376443]);
          }
        }
        _0x374668.set(_0x143ad5, _0x3c492f);
      }
      if (!_0x253b1f('settings').has('app')) {
        _0x253b1f('settings').set(
          'app',
          Object.assign(
            {
              id: 'app',
            },
            clone(DEFAULT_SETTINGS),
          ),
        );
      }
      _0x2d85d6.onChanged((_0x1a8524) => {
        for (const _0x2c742e of Object.keys(_0x1a8524)) {
          if (!_0x2c742e.startsWith(PREFIX_COL)) {
            continue;
          }
          const _0x187bf4 = _0x2c742e.slice(PREFIX_COL.length);
          const _0x23c5f0 = _0x1a8524[_0x2c742e].newValue;
          if (!_0x23c5f0 || _0x23c5f0.__w === _0x17e6e2) {
            continue;
          }
          const _0x2f8a77 = _0x5e06bc.get(_0x187bf4);
          if (_0x2f8a77 && _0x2f8a77.whole) {
            continue;
          }
          const _0x25faff = new Map();
          for (const _0x44c0f6 of Object.keys(_0x23c5f0.items || {})) {
            _0x25faff.set(_0x44c0f6, _0x23c5f0.items[_0x44c0f6]);
          }
          if (_0x2f8a77) {
            for (const _0x3406d2 of _0x2f8a77.put) {
              const _0x556cb5 = _0x253b1f(_0x187bf4).get(_0x3406d2);
              if (_0x556cb5) {
                _0x25faff.set(_0x3406d2, _0x556cb5);
              }
            }
            for (const _0x3a52de of _0x2f8a77.del) {
              _0x25faff.delete(_0x3a52de);
            }
          }
          _0x374668.set(_0x187bf4, _0x25faff);
          _0x7402f9(_0x187bf4, {
            type: 'replace',
            remote: true,
          });
        }
      });
      _0x3b8cec = true;
      return _0x9cb683;
    },
    all(_0x4819ec) {
      const _0x3501a5 = Array.from(_0x253b1f(_0x4819ec).values());
      const _0x1fc877 = _0x3501a5.some(
        (_0x3095a0) => typeof _0x3095a0.order === 'number',
      );
      return _0x3501a5.sort((_0x1dbf74, _0x5f55fc) => {
        if (_0x1fc877) {
          const _0x50de8c =
            (_0x1dbf74.order ?? 1000000000000) -
            (_0x5f55fc.order ?? 1000000000000);
          if (_0x50de8c) {
            return _0x50de8c;
          }
        }
        return (_0x1dbf74.createdAt || 0) - (_0x5f55fc.createdAt || 0);
      });
    },
    get(_0x5ccf75, _0x3d1d50) {
      return _0x253b1f(_0x5ccf75).get(_0x3d1d50) || null;
    },
    find(_0x2d324d, _0x587a4e) {
      return this.all(_0x2d324d).find(_0x587a4e) || null;
    },
    filter(_0x2fb450, _0x43f1dd) {
      return this.all(_0x2fb450).filter(_0x43f1dd);
    },
    count(_0x1fab99) {
      return _0x253b1f(_0x1fab99).size;
    },
    async put(_0x5a74f4, _0x558f85) {
      const _0xc5458c = Date.now();
      const _0x4cc2bb = _0x558f85.id
        ? _0x253b1f(_0x5a74f4).get(_0x558f85.id)
        : null;
      const _0x3ca126 = Object.assign({}, _0x4cc2bb || {}, _0x558f85);
      if (!_0x3ca126.id) {
        _0x3ca126.id = uid(_0x5a74f4.slice(0, 2));
      }
      if (!_0x3ca126.createdAt) {
        _0x3ca126.createdAt = _0xc5458c;
      }
      _0x3ca126.updatedAt = _0xc5458c;
      _0x253b1f(_0x5a74f4).set(_0x3ca126.id, _0x3ca126);
      const _0x404628 = _0x3917e8(_0x5a74f4);
      _0x404628.put.add(_0x3ca126.id);
      _0x404628.del.delete(_0x3ca126.id);
      _0x129a00(_0x5a74f4);
      _0x7402f9(_0x5a74f4, {
        type: 'put',
        id: _0x3ca126.id,
      });
      return _0x3ca126;
    },
    async patch(_0x4c360e, _0x530b5b, _0x58a983) {
      const _0x72dfc9 = _0x253b1f(_0x4c360e).get(_0x530b5b);
      if (!_0x72dfc9) {
        return null;
      }
      return this.put(
        _0x4c360e,
        Object.assign({}, _0x72dfc9, _0x58a983, {
          id: _0x530b5b,
        }),
      );
    },
    async remove(_0x1f9f16, _0x4cbe8d) {
      if (!_0x253b1f(_0x1f9f16).delete(_0x4cbe8d)) {
        return false;
      }
      const _0x3d9e03 = _0x3917e8(_0x1f9f16);
      _0x3d9e03.del.add(_0x4cbe8d);
      _0x3d9e03.put.delete(_0x4cbe8d);
      _0x129a00(_0x1f9f16);
      _0x7402f9(_0x1f9f16, {
        type: 'remove',
        id: _0x4cbe8d,
      });
      return true;
    },
    async removeWhere(_0x4b20ed, _0x5762ef) {
      const _0x5d514e = this.all(_0x4b20ed)
        .filter(_0x5762ef)
        .map((_0x55c056) => _0x55c056.id);
      for (const _0x3dc3cd of _0x5d514e) {
        _0x253b1f(_0x4b20ed).delete(_0x3dc3cd);
        const _0x447df2 = _0x3917e8(_0x4b20ed);
        _0x447df2.del.add(_0x3dc3cd);
        _0x447df2.put.delete(_0x3dc3cd);
      }
      if (_0x5d514e.length) {
        _0x129a00(_0x4b20ed);
        _0x7402f9(_0x4b20ed, {
          type: 'remove',
          ids: _0x5d514e,
        });
      }
      return _0x5d514e.length;
    },
    async clear(_0x175207) {
      _0x253b1f(_0x175207).clear();
      _0x3917e8(_0x175207).whole = true;
      _0x129a00(_0x175207);
      _0x7402f9(_0x175207, {
        type: 'replace',
      });
    },
    async replaceAll(_0x4ed057, _0x169916) {
      const _0x118ec5 = new Map();
      for (const _0x5f1a5c of _0x169916) {
        _0x118ec5.set((_0x5f1a5c.id ||= uid(_0x4ed057.slice(0, 2))), _0x5f1a5c);
      }
      _0x374668.set(_0x4ed057, _0x118ec5);
      _0x3917e8(_0x4ed057).whole = true;
      _0x129a00(_0x4ed057);
      _0x7402f9(_0x4ed057, {
        type: 'replace',
      });
    },
    on(_0x436095, _0x106c15) {
      return _0x1052ef.on(_0x436095, _0x106c15);
    },
    settings() {
      return _0x253b1f('settings').get('app');
    },
    setting(_0x72c1b7, _0x1b690c) {
      const _0x3dc7d5 = _0x253b1f('settings').get('app');
      if (_0x3dc7d5 && _0x3dc7d5[_0x72c1b7] !== undefined) {
        return _0x3dc7d5[_0x72c1b7];
      } else if (_0x1b690c !== undefined) {
        return _0x1b690c;
      } else {
        return DEFAULT_SETTINGS[_0x72c1b7];
      }
    },
    async setSetting(_0xb1f386, _0x518f1c) {
      const _0xc27a4 = _0x253b1f('settings').get('app') || {
        id: 'app',
      };
      return this.put(
        'settings',
        Object.assign({}, _0xc27a4, {
          [_0xb1f386]: _0x518f1c,
        }),
      );
    },
    async setSettings(_0x419dbd) {
      const _0x2a8f06 = _0x253b1f('settings').get('app') || {
        id: 'app',
      };
      return this.put('settings', Object.assign({}, _0x2a8f06, _0x419dbd));
    },
    async putBlob(_0x42d6e0, _0x70121 = {}) {
      const _0x2cfdc6 = uid('b');
      await _0x2d85d6.set({
        [PREFIX_BLOB + _0x2cfdc6]: {
          dataUrl: _0x42d6e0,
          name: _0x70121.name || 'file',
          mime: _0x70121.mime || 'application/octet-stream',
          size: _0x70121.size || 0,
        },
      });
      return _0x2cfdc6;
    },
    async getBlob(_0xd207d2) {
      if (!_0xd207d2) {
        return null;
      }
      const _0xa199ed = await _0x2d85d6.get([PREFIX_BLOB + _0xd207d2]);
      return _0xa199ed[PREFIX_BLOB + _0xd207d2] || null;
    },
    async removeBlob(_0x46c5f0) {
      if (_0x46c5f0) {
        await _0x2d85d6.remove([PREFIX_BLOB + _0x46c5f0]);
      }
    },
    async exportAll(_0x5461a6 = false) {
      const _0x5d1535 = {
        app: 'WACRM',
        version: 1,
        exportedAt: Date.now(),
        collections: {},
        blobs: {},
      };
      const _0x1fa194 = new Set();
      for (const _0x4d2406 of COLLECTIONS) {
        if (_0x4d2406 === 'counters') {
          continue;
        }
        _0x5d1535.collections[_0x4d2406] = this.all(_0x4d2406);
      }
      if (_0x5461a6) {
        const _0x3165c1 = JSON.stringify(_0x5d1535.collections);
        const _0x285d0a = /"(b[a-z0-9]{8,})"/g;
        let _0x10ecf0;
        while ((_0x10ecf0 = _0x285d0a.exec(_0x3165c1))) {
          _0x1fa194.add(_0x10ecf0[1]);
        }
        for (const _0x1ab55c of _0x1fa194) {
          const _0x555238 = await this.getBlob(_0x1ab55c);
          if (_0x555238) {
            _0x5d1535.blobs[_0x1ab55c] = _0x555238;
          }
        }
      }
      return _0x5d1535;
    },
    async importAll(_0x8110e, _0x28fb8e = 'merge') {
      if (!_0x8110e || _0x8110e.app !== 'WACRM' || !_0x8110e.collections) {
        throw new Error('This file is not a ' + brand() + ' backup.');
      }
      for (const _0x5da58c of COLLECTIONS) {
        const _0x5ede29 = _0x8110e.collections[_0x5da58c];
        if (!Array.isArray(_0x5ede29)) {
          continue;
        }
        if (_0x5da58c === 'settings') {
          if (_0x28fb8e === 'replace') {
            await this.replaceAll(_0x5da58c, _0x5ede29);
          }
          continue;
        }
        if (_0x28fb8e === 'replace') {
          await this.replaceAll(_0x5da58c, _0x5ede29);
        } else {
          for (const _0x3515af of _0x5ede29) {
            await this.put(_0x5da58c, _0x3515af);
          }
        }
      }
      for (const _0x713c8f of Object.keys(_0x8110e.blobs || {})) {
        await _0x2d85d6.set({
          [PREFIX_BLOB + _0x713c8f]: _0x8110e.blobs[_0x713c8f],
        });
      }
    },
    async flush() {
      await Promise.all(
        Array.from(_0x3470e7.keys()).map((_0x3043c3) => _0x5506ff(_0x3043c3)),
      );
    },
  };
  return _0x9cb683;
}
