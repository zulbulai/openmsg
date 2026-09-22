import { uid, sleep, rand, digits } from './util.js';
import { nextRun } from './timecalc.js';
import { emptyActions } from './actions.js';
export const CAMPAIGN_STATUS = {
  compose: 'Draft',
  pending: 'Scheduled',
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  discarded: 'Discarded',
  missed: 'Missed',
};
export function isScheduled(_0x5bb169) {
  return (
    _0x5bb169.kind === 'schedule' ||
    (_0x5bb169.kind === 'broadcast' && _0x5bb169.startMode === 'schedule')
  );
}
export function reachesChat(_0x221e7a, _0x19dafe) {
  const _0x304aba = _0x221e7a.targets || {};
  const _0x3dc1d0 = /@c\.us$/.test(_0x19dafe) ? digits(_0x19dafe) : '';
  return (
    (_0x304aba.individuals || []).some(
      (_0x2bf164) =>
        _0x2bf164.chatId === _0x19dafe ||
        (_0x3dc1d0 && _0x2bf164.phone && digits(_0x2bf164.phone) === _0x3dc1d0),
    ) || (_0x304aba.groupIds || []).includes(_0x19dafe)
  );
}
export function newCampaign(_0x43c056 = 'broadcast') {
  return {
    kind: _0x43c056,
    name: '',
    targets: {
      individuals: [],
      groupIds: [],
      tabIds: [],
      stageIds: [],
      tagIds: [],
      labelIds: [],
      allowDuplicates: false,
    },
    messages: [],
    sendRandom: false,
    delay: {
      min: 5,
      max: 12,
    },
    pause: {
      enabled: false,
      afterContacts: 20,
      seconds: 60,
    },
    post: emptyActions(),
    options: {
      mentionAll: false,
      resumeIfReload: true,
      autoSendIfMissed: false,
      discardOnReply: false,
    },
    schedule: {
      mode: 'once',
      startAt: 0,
    },
    startMode: 'schedule',
    status: 'compose',
    nextRunAt: 0,
    runCount: 0,
    run: null,
  };
}
export function validateCampaign(_0x3d5492) {
  const _0xefdc4c = [];
  if (!String(_0x3d5492.name || '').trim()) {
    _0xefdc4c.push('Give it a name.');
  }
  const _0x578e8a = _0x3d5492.targets || {};
  const _0x10c06a =
    (_0x578e8a.individuals || []).length +
    (_0x578e8a.groupIds || []).length +
    (_0x578e8a.tabIds || []).length +
    (_0x578e8a.stageIds || []).length +
    (_0x578e8a.tagIds || []).length +
    (_0x578e8a.labelIds || []).length;
  if (!_0x10c06a) {
    _0xefdc4c.push('Choose at least one contact or group.');
  }
  if (!(_0x3d5492.messages || []).length) {
    _0xefdc4c.push('Add at least one message.');
  }
  if (
    _0x3d5492.startMode === 'schedule' &&
    (!_0x3d5492.schedule || !_0x3d5492.schedule.startAt)
  ) {
    _0xefdc4c.push('Pick a date and time.');
  }
  if (_0x3d5492.delay && _0x3d5492.delay.max < _0x3d5492.delay.min) {
    _0xefdc4c.push('The maximum delay must be at least the minimum.');
  }
  return _0xefdc4c;
}
const GRACE_MS = 120000;
export function createScheduler({
  store: _0x3f0a51,
  wa: _0x34bf1f,
  sender: _0x2fa622,
  crm: _0x59153a,
  actions: _0x1f51fd,
  webhooks: _0x19b0f1,
  activity: _0x511302,
  emit: _0x4c9e4c,
  now = Date.now,
  sleepFn = sleep,
  random = Math.random,
}) {
  const _0x144783 = new Map();
  let _0x4a400f = false;
  const _0x317dba = (_0x12e9c4, _0x5acf74) => {
    if (_0x4c9e4c) {
      _0x4c9e4c(_0x12e9c4, _0x5acf74);
    }
  };
  async function _0x4c3677(_0x9a4297) {
    const _0x1a8dd5 = [];
    const _0xef20f = [];
    const _0x5a3d30 = _0x9a4297.targets || {};
    for (const _0x1c0533 of _0x5a3d30.individuals || []) {
      const _0x30277d =
        _0x1c0533.chatId || (await _0x34bf1f.resolveTarget(_0x1c0533.phone));
      if (_0x30277d) {
        _0x1a8dd5.push({
          chatId: _0x30277d,
          name: _0x1c0533.name || _0x34bf1f.chatName(_0x30277d),
        });
      } else {
        _0xef20f.push({
          chatId: digits(_0x1c0533.phone) || String(_0x1c0533.phone),
          name: _0x1c0533.name || '',
          error: 'Not on WhatsApp',
        });
      }
    }
    for (const _0x575a2c of _0x5a3d30.groupIds || []) {
      _0x1a8dd5.push({
        chatId: _0x575a2c,
        name: _0x34bf1f.chatName(_0x575a2c),
      });
    }
    for (const _0x42900e of _0x5a3d30.tabIds || []) {
      const _0x18e0e3 = _0x3f0a51.get('tabs', _0x42900e);
      if (_0x18e0e3) {
        for (const _0x17aba3 of _0x18e0e3.members || []) {
          _0x1a8dd5.push({
            chatId: _0x17aba3,
            name: _0x59153a.displayName(_0x17aba3),
          });
        }
      }
    }
    for (const _0x3381a2 of _0x5a3d30.stageIds || []) {
      for (const _0x5e50a7 of _0x59153a.cards(_0x3381a2)) {
        _0x1a8dd5.push({
          chatId: _0x5e50a7.chatId,
          name: _0x5e50a7.name,
        });
      }
    }
    for (const _0x3b588b of _0x5a3d30.tagIds || []) {
      for (const _0x109996 of _0x3f0a51.all('contacts')) {
        if ((_0x109996.tagIds || []).includes(_0x3b588b)) {
          _0x1a8dd5.push({
            chatId: _0x109996.chatId,
            name: _0x59153a.displayName(_0x109996.chatId),
          });
        }
      }
    }
    if ((_0x5a3d30.labelIds || []).length) {
      const _0x7d1472 = await _0x34bf1f.listChats({});
      for (const _0x21273e of _0x7d1472) {
        if (
          (_0x21273e.labels || []).some((_0x544295) =>
            _0x5a3d30.labelIds.includes(_0x544295),
          )
        ) {
          _0x1a8dd5.push({
            chatId: _0x21273e.id,
            name: _0x21273e.name,
          });
        }
      }
    }
    if (_0x5a3d30.allowDuplicates) {
      return {
        recipients: _0x1a8dd5,
        failed: _0xef20f,
      };
    }
    const _0x35f5af = new Set();
    return {
      recipients: _0x1a8dd5.filter((_0x47cbbc) =>
        _0x35f5af.has(_0x47cbbc.chatId)
          ? false
          : (_0x35f5af.add(_0x47cbbc.chatId), true),
      ),
      failed: _0xef20f,
    };
  }
  function _0x615a7b(_0xfbd4, _0x2f8f9b) {
    if (_0xfbd4.schedule && _0xfbd4.schedule.mode === 'repeat') {
      return nextRun(_0xfbd4.schedule, _0x2f8f9b, _0xfbd4.runCount || 0);
    }
    if (_0xfbd4.runCount) {
      return null;
    } else if (_0xfbd4.schedule && _0xfbd4.schedule.startAt > _0x2f8f9b) {
      return _0xfbd4.schedule.startAt;
    } else {
      return null;
    }
  }
  async function _0x4c3832(_0x81159c, _0x315ef1) {
    const _0x5930fb = _0x3f0a51.get('campaigns', _0x81159c);
    if (!_0x5930fb) {
      return;
    }
    const _0x4ee9e2 =
      (_0x5930fb.runCount || 0) + (_0x315ef1 === 'completed' ? 1 : 0);
    const _0x501b77 =
      _0x315ef1 === 'completed'
        ? _0x615a7b(
            Object.assign({}, _0x5930fb, {
              runCount: _0x4ee9e2,
            }),
            now(),
          )
        : null;
    const _0xf82e7e = {
      status: _0x501b77 ? 'pending' : _0x315ef1,
      nextRunAt: _0x501b77 || 0,
      lastRunAt: now(),
    };
    if (_0x315ef1 === 'completed') {
      _0xf82e7e.runCount = _0x4ee9e2;
    }
    const _0x3d90d3 = await _0x3f0a51.patch('campaigns', _0x81159c, _0xf82e7e);
    if (_0x315ef1 === 'completed') {
      if (_0x511302) {
        await _0x511302.log('campaign_done', {
          text:
            '"' +
            _0x5930fb.name +
            '" finished: ' +
            _0x5930fb.run.sent +
            ' sent, ' +
            _0x5930fb.run.failed +
            ' failed',
        });
      }
      if (_0x19b0f1) {
        _0x19b0f1.emit('campaign_completed', {
          name: _0x5930fb.name,
          sent: _0x5930fb.run.sent,
          failed: _0x5930fb.run.failed,
          total: _0x5930fb.run.total,
        });
      }
      _0x317dba('campaign:done', _0x3d90d3);
    }
    return _0x3d90d3;
  }
  async function _0x491a80(_0x1f6198) {
    let _0x1de7b9 = _0x3f0a51.get('campaigns', _0x1f6198);
    if (!_0x1de7b9 || !_0x1de7b9.run) {
      return;
    }
    const _0x420bb4 = _0x144783.get(_0x1f6198) || {
      aborted: false,
    };
    _0x144783.set(_0x1f6198, _0x420bb4);
    _0x4a400f = true;
    try {
      while (_0x1de7b9.run.pending.length) {
        _0x1de7b9 = _0x3f0a51.get('campaigns', _0x1f6198);
        if (!_0x1de7b9 || _0x420bb4.aborted || _0x1de7b9.status !== 'running') {
          return;
        }
        const _0x15493d = _0x1de7b9.run.pending[0];
        let _0x18eda5 = _0x1de7b9.messages;
        if (_0x1de7b9.sendRandom && _0x18eda5.length) {
          _0x18eda5 = [_0x18eda5[Math.floor(random() * _0x18eda5.length)]];
        }
        const _0x1bb5f5 = await _0x2fa622.send(_0x15493d.chatId, _0x18eda5, {
          automated: true,
          mentionAll:
            !!_0x1de7b9.options &&
            !!_0x1de7b9.options.mentionAll &&
            /@g\.us$/.test(_0x15493d.chatId),
          signal: _0x420bb4,
          delay:
            _0x1de7b9.delay && _0x1de7b9.delay.max > 0
              ? {
                  min: Math.min(2, _0x1de7b9.delay.min),
                  max: Math.min(5, Math.max(2, _0x1de7b9.delay.max)),
                }
              : undefined,
          vars: {
            campaign: _0x1de7b9.name,
          },
        });
        if (_0x420bb4.aborted && !_0x1bb5f5.sent) {
          return;
        }
        _0x1de7b9 = _0x3f0a51.get('campaigns', _0x1f6198);
        if (!_0x1de7b9) {
          return;
        }
        const _0x210949 =
          _0x1bb5f5.sent > 0 && _0x1bb5f5.failed === 0 && !_0x1bb5f5.aborted;
        const _0x30490e = _0x210949
          ? ''
          : (_0x1bb5f5.errors[0] && _0x1bb5f5.errors[0].error) ||
            (_0x1bb5f5.aborted
              ? 'Stopped before every message was sent'
              : 'Not sent');
        const _0x37fb38 = Object.assign({}, _0x1de7b9.run, {
          pending: _0x1de7b9.run.pending.slice(1),
          sent: _0x1de7b9.run.sent + (_0x210949 ? 1 : 0),
          failed: _0x1de7b9.run.failed + (_0x210949 ? 0 : 1),
          results: _0x1de7b9.run.results.concat([
            {
              chatId: _0x15493d.chatId,
              name: _0x15493d.name,
              ok: _0x210949,
              error: _0x30490e,
              at: now(),
            },
          ]),
        });
        await _0x3f0a51.patch('campaigns', _0x1f6198, {
          run: _0x37fb38,
        });
        if (_0x210949) {
          await _0x1f51fd.run(_0x15493d.chatId, _0x1de7b9.post, {
            source: 'broadcast',
            campaign: _0x1de7b9.name,
          });
        }
        _0x317dba('campaign:progress', {
          id: _0x1f6198,
          run: _0x37fb38,
        });
        if (_0x420bb4.aborted || !_0x37fb38.pending.length) {
          if (_0x420bb4.aborted) {
            return;
          }
          break;
        }
        const _0xa3eba7 = _0x1de7b9.pause;
        const _0x589700 = _0x37fb38.results.length;
        if (
          _0xa3eba7 &&
          _0xa3eba7.enabled &&
          _0xa3eba7.afterContacts > 0 &&
          _0x589700 % _0xa3eba7.afterContacts === 0
        ) {
          await sleepFn(_0xa3eba7.seconds * 1000);
        } else if (_0x1de7b9.delay) {
          await sleepFn(
            rand(
              _0x1de7b9.delay.min,
              Math.max(_0x1de7b9.delay.min, _0x1de7b9.delay.max),
            ) * 1000,
          );
        }
      }
      _0x1de7b9 = _0x3f0a51.get('campaigns', _0x1f6198);
      if (_0x1de7b9 && _0x1de7b9.status === 'running') {
        await _0x4c3832(_0x1f6198, 'completed');
      }
    } finally {
      _0x4a400f = false;
      _0x144783.delete(_0x1f6198);
    }
  }
  const _0x244232 = {
    busy: () => _0x4a400f,
    resolveRecipients: _0x4c3677,
    async save(_0x4e151a) {
      const _0x33a275 = validateCampaign(_0x4e151a);
      if (_0x4e151a.startMode !== 'compose' && _0x33a275.length) {
        throw new Error(_0x33a275[0]);
      }
      const _0x12d83c = Object.assign({}, _0x4e151a);
      if (_0x12d83c.startMode === 'compose') {
        _0x12d83c.status = 'compose';
        _0x12d83c.nextRunAt = 0;
      } else if (_0x12d83c.startMode === 'now') {
        _0x12d83c.status = 'pending';
        _0x12d83c.nextRunAt = now();
        _0x12d83c.schedule = Object.assign(
          {
            mode: 'once',
          },
          _0x12d83c.schedule,
          {
            startAt: now(),
          },
        );
      } else {
        _0x12d83c.status = 'pending';
        _0x12d83c.nextRunAt =
          _0x615a7b(
            Object.assign({}, _0x12d83c, {
              runCount: 0,
            }),
            now() - 1,
          ) || _0x12d83c.schedule.startAt;
      }
      return _0x3f0a51.put('campaigns', _0x12d83c);
    },
    async startNow(_0x39e350) {
      const _0xeb530 = _0x3f0a51.get('campaigns', _0x39e350);
      if (!_0xeb530) {
        throw new Error('Campaign not found.');
      }
      if (_0xeb530.status === 'running') {
        return _0xeb530;
      }
      const { recipients: _0x4d8870, failed: _0x3ddb0b } =
        await _0x4c3677(_0xeb530);
      if (!_0x4d8870.length && !_0x3ddb0b.length) {
        throw new Error('This campaign has no recipients.');
      }
      const _0x3f31dc = {
        id: uid('run'),
        startedAt: now(),
        total: _0x4d8870.length + _0x3ddb0b.length,
        sent: 0,
        failed: _0x3ddb0b.length,
        pending: _0x4d8870,
        results: _0x3ddb0b.map((_0x1116e3) =>
          Object.assign(
            {
              ok: false,
              at: now(),
            },
            _0x1116e3,
          ),
        ),
      };
      await _0x3f0a51.patch('campaigns', _0x39e350, {
        status: 'running',
        run: _0x3f31dc,
        nextRunAt: 0,
      });
      _0x317dba('campaign:start', _0x3f0a51.get('campaigns', _0x39e350));
      if (!_0x4d8870.length) {
        await _0x4c3832(_0x39e350, 'completed');
        return _0x3f0a51.get('campaigns', _0x39e350);
      }
      _0x491a80(_0x39e350).catch((_0xb7be2c) => {
        console.error('[WACRM] campaign', _0xb7be2c);
      });
      return _0x3f0a51.get('campaigns', _0x39e350);
    },
    async pause(_0x26602a) {
      const _0x4eb89c = _0x144783.get(_0x26602a);
      if (_0x4eb89c) {
        _0x4eb89c.aborted = true;
      }
      const _0x4b696a = _0x3f0a51.get('campaigns', _0x26602a);
      if (_0x4b696a && _0x4b696a.status === 'running') {
        await _0x3f0a51.patch('campaigns', _0x26602a, {
          status: 'paused',
        });
      }
    },
    async resume(_0x3c21ac) {
      const _0x3c6e80 = _0x3f0a51.get('campaigns', _0x3c21ac);
      if (!_0x3c6e80 || _0x3c6e80.status !== 'paused' || !_0x3c6e80.run) {
        return;
      }
      await _0x3f0a51.patch('campaigns', _0x3c21ac, {
        status: 'running',
      });
      _0x491a80(_0x3c21ac).catch((_0x4518a6) => {
        console.error('[WACRM] campaign', _0x4518a6);
      });
    },
    async discard(_0x3f1195) {
      const _0x1c8d69 = _0x144783.get(_0x3f1195);
      if (_0x1c8d69) {
        _0x1c8d69.aborted = true;
      }
      const _0x2b20f0 = _0x3f0a51.get('campaigns', _0x3f1195);
      if (_0x2b20f0) {
        await _0x3f0a51.patch('campaigns', _0x3f1195, {
          status: 'discarded',
          nextRunAt: 0,
        });
      }
    },
    async remove(_0x4b5d66) {
      const _0x50fd57 = _0x144783.get(_0x4b5d66);
      if (_0x50fd57) {
        _0x50fd57.aborted = true;
      }
      await _0x3f0a51.remove('campaigns', _0x4b5d66);
    },
    async duplicate(_0x6648a6) {
      const _0x3d488d = _0x3f0a51.get('campaigns', _0x6648a6);
      if (!_0x3d488d) {
        return null;
      }
      const _0x1288af = Object.assign(JSON.parse(JSON.stringify(_0x3d488d)), {
        id: undefined,
        createdAt: undefined,
        name: _0x3d488d.name + ' (copy)',
        status: 'compose',
        run: null,
        runCount: 0,
        nextRunAt: 0,
        startMode: 'compose',
      });
      delete _0x1288af.id;
      delete _0x1288af.createdAt;
      return _0x3f0a51.put('campaigns', _0x1288af);
    },
    async onIncoming(_0x41432b) {
      for (const _0x2b98e4 of _0x3f0a51.filter(
        'campaigns',
        (_0x59b027) =>
          _0x59b027.kind === 'schedule' &&
          _0x59b027.status === 'pending' &&
          _0x59b027.options &&
          _0x59b027.options.discardOnReply,
      )) {
        const _0x133ba6 = [].concat(
          (_0x2b98e4.targets.individuals || [])
            .map((_0x395be7) => _0x395be7.chatId)
            .filter(Boolean),
        );
        if (_0x133ba6.includes(_0x41432b)) {
          await _0x244232.discard(_0x2b98e4.id);
        }
      }
    },
    async tick() {
      const _0xe9d77c = now();
      if (!_0x4a400f) {
        const _0x16083b = _0x3f0a51
          .filter(
            'campaigns',
            (_0x4fdcd0) =>
              _0x4fdcd0.status === 'pending' &&
              _0x4fdcd0.nextRunAt &&
              _0x4fdcd0.nextRunAt <= _0xe9d77c,
          )
          .sort(
            (_0x2c1c75, _0x5295dd) => _0x2c1c75.nextRunAt - _0x5295dd.nextRunAt,
          )[0];
        if (_0x16083b) {
          if (
            _0xe9d77c - _0x16083b.nextRunAt > GRACE_MS &&
            (!_0x16083b.options || !_0x16083b.options.autoSendIfMissed)
          ) {
            const _0xdfd16d =
              _0x16083b.schedule && _0x16083b.schedule.mode === 'repeat'
                ? nextRun(
                    _0x16083b.schedule,
                    _0xe9d77c,
                    _0x16083b.runCount || 0,
                  )
                : null;
            await _0x3f0a51.patch(
              'campaigns',
              _0x16083b.id,
              _0xdfd16d
                ? {
                    nextRunAt: _0xdfd16d,
                  }
                : {
                    status: 'missed',
                    nextRunAt: 0,
                  },
            );
            if (_0x511302) {
              await _0x511302.log('campaign_missed', {
                text:
                  '"' +
                  _0x16083b.name +
                  '" was due while WhatsApp Web was closed.',
              });
            }
          } else {
            await _0x244232.startNow(_0x16083b.id).catch(
              (_0x13912b) =>
                _0x511302 &&
                _0x511302.log('campaign_error', {
                  text: '"' + _0x16083b.name + '": ' + _0x13912b.message,
                }),
            );
          }
        }
      }
      await _0x244232.tickStatuses();
    },
    async tickStatuses() {
      const _0x3cd04b = now();
      for (const _0x3270d5 of _0x3f0a51.filter(
        'statusPosts',
        (_0x284911) =>
          _0x284911.status === 'pending' &&
          _0x284911.nextRunAt &&
          _0x284911.nextRunAt <= _0x3cd04b,
      )) {
        if (
          _0x3cd04b - _0x3270d5.nextRunAt > GRACE_MS &&
          !_0x3270d5.autoPostIfMissed
        ) {
          await _0x3f0a51.patch('statusPosts', _0x3270d5.id, {
            status: 'missed',
          });
          continue;
        }
        try {
          if (_0x3270d5.kind === 'text') {
            await _0x34bf1f.statusText(
              _0x3270d5.text,
              _0x3270d5.backgroundColor
                ? {
                    backgroundColor: _0x3270d5.backgroundColor,
                  }
                : {},
            );
          } else {
            const _0x5702ed = await _0x3f0a51.getBlob(_0x3270d5.blobId);
            if (!_0x5702ed) {
              throw new Error('The media file is missing.');
            }
            if (_0x3270d5.kind === 'image') {
              await _0x34bf1f.statusImage(_0x5702ed.dataUrl, {
                caption: _0x3270d5.caption || '',
              });
            } else {
              await _0x34bf1f.statusVideo(_0x5702ed.dataUrl, {
                caption: _0x3270d5.caption || '',
              });
            }
          }
          const _0x11a88f =
            _0x3270d5.schedule && _0x3270d5.schedule.mode === 'repeat'
              ? nextRun(
                  _0x3270d5.schedule,
                  _0x3cd04b,
                  (_0x3270d5.runCount || 0) + 1,
                )
              : null;
          await _0x3f0a51.patch(
            'statusPosts',
            _0x3270d5.id,
            _0x11a88f
              ? {
                  runCount: (_0x3270d5.runCount || 0) + 1,
                  nextRunAt: _0x11a88f,
                  lastError: '',
                }
              : {
                  status: 'posted',
                  runCount: (_0x3270d5.runCount || 0) + 1,
                  nextRunAt: 0,
                  postedAt: _0x3cd04b,
                  lastError: '',
                },
          );
          if (_0x511302) {
            await _0x511302.log('status_posted', {
              text: 'Posted a Status update',
            });
          }
        } catch (_0x31ba11) {
          await _0x3f0a51.patch('statusPosts', _0x3270d5.id, {
            status: 'failed',
            lastError: (_0x31ba11 && _0x31ba11.message) || String(_0x31ba11),
          });
        }
      }
    },
    async resumeOnBoot() {
      for (const _0x18b973 of _0x3f0a51.filter(
        'campaigns',
        (_0x56f227) => _0x56f227.status === 'running',
      )) {
        if (
          _0x18b973.options &&
          _0x18b973.options.resumeIfReload !== false &&
          _0x18b973.run &&
          _0x18b973.run.pending.length
        ) {
          _0x491a80(_0x18b973.id).catch(() => {});
        } else {
          await _0x3f0a51.patch('campaigns', _0x18b973.id, {
            status: 'paused',
          });
        }
      }
    },
    report(_0x262d3b) {
      const _0x5ea9d6 = _0x3f0a51.get('campaigns', _0x262d3b);
      if (!_0x5ea9d6 || !_0x5ea9d6.run) {
        return [];
      }
      return _0x5ea9d6.run.results
        .map((_0x3c6c92) => ({
          name: _0x3c6c92.name || '',
          chat: _0x3c6c92.chatId,
          status: _0x3c6c92.ok ? 'Sent' : 'Failed',
          detail: _0x3c6c92.error || '',
          time: _0x3c6c92.at ? new Date(_0x3c6c92.at).toISOString() : '',
        }))
        .concat(
          _0x5ea9d6.run.pending.map((_0x164d44) => ({
            name: _0x164d44.name || '',
            chat: _0x164d44.chatId,
            status: 'Pending',
            detail: '',
            time: '',
          })),
        );
    },
    upcoming() {
      const _0x35b301 = [];
      for (const _0x472d52 of _0x3f0a51.filter(
        'campaigns',
        (_0xf3e059) => _0xf3e059.status === 'pending' && _0xf3e059.nextRunAt,
      )) {
        _0x35b301.push({
          at: _0x472d52.nextRunAt,
          title: 'Scheduled broadcast',
          message:
            '"' + _0x472d52.name + '" is due. Open WhatsApp Web to send it.',
          key: 'c:' + _0x472d52.id,
        });
      }
      for (const _0x5fdff4 of _0x3f0a51.filter(
        'statusPosts',
        (_0x4b9d5c) => _0x4b9d5c.status === 'pending' && _0x4b9d5c.nextRunAt,
      )) {
        _0x35b301.push({
          at: _0x5fdff4.nextRunAt,
          title: 'Scheduled Status',
          message: 'A Status update is due. Open WhatsApp Web to post it.',
          key: 's:' + _0x5fdff4.id,
        });
      }
      return _0x35b301;
    },
  };
  return _0x244232;
}
