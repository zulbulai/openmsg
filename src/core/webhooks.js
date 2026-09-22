import { uid } from './util.js';
import { brand } from './brand.js';
export const WEBHOOK_EVENTS = [
  {
    id: 'message_received',
    label: 'Message received',
  },
  {
    id: 'message_sent',
    label: 'Message sent by automation',
  },
  {
    id: 'chat_new',
    label: 'New chat',
  },
  {
    id: 'stage_changed',
    label: 'Kanban stage changed',
  },
  {
    id: 'tag_added',
    label: 'Tag added to a contact',
  },
  {
    id: 'note_added',
    label: 'Note added',
  },
  {
    id: 'appointment_created',
    label: 'Appointment created',
  },
  {
    id: 'reminder_due',
    label: 'Reminder due',
  },
  {
    id: 'chatbot_completed',
    label: 'Chatbot finished',
  },
  {
    id: 'handoff',
    label: 'Handed to a human',
  },
  {
    id: 'campaign_completed',
    label: 'Broadcast finished',
  },
];
const MAX_LOG = 300;
async function sign(_0x596196, _0x8fec0e) {
  if (!_0x8fec0e || !globalThis.crypto || !globalThis.crypto.subtle) {
    return '';
  }
  const _0x556121 = new TextEncoder();
  const _0x5b290f = await globalThis.crypto.subtle.importKey(
    'raw',
    _0x556121.encode(_0x8fec0e),
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  );
  const _0x1734b6 = await globalThis.crypto.subtle.sign(
    'HMAC',
    _0x5b290f,
    _0x556121.encode(_0x596196),
  );
  return Array.from(new Uint8Array(_0x1734b6))
    .map((_0x28652a) => _0x28652a.toString(16).padStart(2, '0'))
    .join('');
}
export function createWebhooks({
  store: _0x5357be,
  http: _0xf8d8a1,
  sleepFn: _0x57e30a,
}) {
  const _0x4e5408 =
    _0x57e30a ||
    ((_0x1dce15) =>
      new Promise((_0xe4a91c) => setTimeout(_0xe4a91c, _0x1dce15)));
  async function _0x2d3931() {
    const _0x24292f = _0x5357be.all('webhookLog');
    if (_0x24292f.length > MAX_LOG + 40) {
      for (const _0x9736f1 of _0x24292f.slice(0, _0x24292f.length - MAX_LOG)) {
        await _0x5357be.remove('webhookLog', _0x9736f1.id);
      }
    }
  }
  async function _0xeb002b(_0x342fad, _0x14e3a7, _0x43ba32) {
    const _0x406252 = {
      event: _0x14e3a7,
      at: new Date().toISOString(),
      data: _0x43ba32,
    };
    const _0x1dd157 = JSON.stringify(_0x406252);
    const _0x3c6ec1 = {
      'Content-Type': 'application/json',
      'X-WACRM-Event': _0x14e3a7,
    };
    for (const _0x54972a of _0x342fad.headers || []) {
      if (_0x54972a.name) {
        _0x3c6ec1[_0x54972a.name] = _0x54972a.value || '';
      }
    }
    const _0x364f5a = await sign(_0x1dd157, _0x342fad.secret);
    if (_0x364f5a) {
      _0x3c6ec1['X-WACRM-Signature'] = 'sha256=' + _0x364f5a;
    }
    const _0x1fc4dc = Date.now();
    let _0x462c9c = {
      ok: false,
      status: 0,
      error: '',
    };
    for (let _0x5a7188 = 0; _0x5a7188 < 2; _0x5a7188++) {
      try {
        const _0x433309 = await _0xf8d8a1.request({
          url: _0x342fad.url,
          method: _0x342fad.method || 'POST',
          headers: _0x3c6ec1,
          body: _0x1dd157,
          timeoutMs: 15000,
        });
        _0x462c9c = {
          ok: _0x433309.ok,
          status: _0x433309.status,
          error: _0x433309.ok ? '' : _0x433309.text.slice(0, 200),
        };
        break;
      } catch (_0x3d9ddc) {
        _0x462c9c = {
          ok: false,
          status: 0,
          error: (_0x3d9ddc && _0x3d9ddc.message) || String(_0x3d9ddc),
        };
        if (_0x3d9ddc && _0x3d9ddc.name === 'PermissionError') {
          break;
        }
        if (_0x5a7188 === 0) {
          await _0x4e5408(1500);
        }
      }
    }
    const _0x4e2cb7 = await _0x5357be.put('webhookLog', {
      id: uid('wl'),
      webhookId: _0x342fad.id,
      webhookName: _0x342fad.name,
      event: _0x14e3a7,
      ok: _0x462c9c.ok,
      status: _0x462c9c.status,
      error: _0x462c9c.error,
      ms: Date.now() - _0x1fc4dc,
      payload: _0x406252,
    });
    await _0x2d3931();
    await _0x5357be.patch('webhooks', _0x342fad.id, {
      lastAt: Date.now(),
      lastOk: _0x462c9c.ok,
      lastStatus: _0x462c9c.status,
    });
    return _0x4e2cb7;
  }
  return {
    events: WEBHOOK_EVENTS,
    async emit(_0x1db8fd, _0x3568c7) {
      const _0xae388b = _0x5357be.filter(
        'webhooks',
        (_0x97b72a) =>
          _0x97b72a.enabled !== false &&
          (_0x97b72a.events || []).includes(_0x1db8fd) &&
          _0x97b72a.url,
      );
      return Promise.all(
        _0xae388b.map((_0x3d51cf) =>
          _0xeb002b(_0x3d51cf, _0x1db8fd, _0x3568c7),
        ),
      );
    },
    async emitTo(_0x49f580, _0x207f90, _0x1ef4e1) {
      const _0x3505e6 = []
        .concat(_0x49f580 || [])
        .map((_0xcdeee5) => _0x5357be.get('webhooks', _0xcdeee5))
        .filter((_0x30f543) => _0x30f543 && _0x30f543.url);
      return Promise.all(
        _0x3505e6.map((_0x3a5914) =>
          _0xeb002b(_0x3a5914, _0x207f90, _0x1ef4e1),
        ),
      );
    },
    async test(_0xc6d74d) {
      const _0x48afb6 = _0x5357be.get('webhooks', _0xc6d74d);
      if (!_0x48afb6) {
        throw new Error('Webhook not found.');
      }
      return _0xeb002b(_0x48afb6, 'test', {
        message: 'This is a test from ' + brand() + '.',
        sample: true,
      });
    },
    async resend(_0x40107a) {
      const _0x4a3c66 = _0x5357be.get('webhookLog', _0x40107a);
      const _0xde2a2a =
        _0x4a3c66 && _0x5357be.get('webhooks', _0x4a3c66.webhookId);
      if (!_0x4a3c66 || !_0xde2a2a) {
        throw new Error('That delivery can no longer be resent.');
      }
      return _0xeb002b(
        _0xde2a2a,
        _0x4a3c66.event,
        _0x4a3c66.payload && _0x4a3c66.payload.data,
      );
    },
    logFor(_0x5abc39) {
      return _0x5357be
        .filter(
          'webhookLog',
          (_0x4c2620) => !_0x5abc39 || _0x4c2620.webhookId === _0x5abc39,
        )
        .sort(
          (_0x2a69fa, _0x3f03c7) => _0x3f03c7.createdAt - _0x2a69fa.createdAt,
        );
    },
  };
}
