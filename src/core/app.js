import { createStore } from './store.js';
import { createBus } from './events.js';
import { createWa } from './wa.js';
import { createCrm } from './crm.js';
import { createActivity } from './activity.js';
import { createHttp } from './http.js';
import { createWebhooks } from './webhooks.js';
import { createSender, typedPrefix } from './sender.js';
import { createActions } from './actions.js';
import { createAi } from './ai.js';
import { createChatbotEngine } from './chatbot.js';
import { createAssistant } from './assistant.js';
import { createAutomation } from './automation.js';
import { createScheduler } from './scheduler.js';
import { createReminders } from './reminders.js';
import { createFilters } from './filters.js';
import { createLicense, memoryLicenseStorage } from './license.js';
import {
  LICENSE_SERVER,
  LICENSE_PUBLIC_KEY,
  BUILD_ID,
} from './license-config.js';
import { debounce } from './util.js';
export async function createApp({
  backend: _0x14e19c,
  transport: _0x2da8b9,
  http: _0x9f796f,
  send: _0xe4f3ab,
  notify: _0x13c774,
  setAlarms: _0x1a00d8,
  tickMs = 5000,
  now: _0x5af2ac,
  sleepFn: _0x914d77,
  storeOptions: _0x3ab51f,
  license: _0x161dfc,
  licenseStorage: _0x4c5d62,
  licenseConfig: _0x475415,
  deviceInfo: _0x5b7cfc,
} = {}) {
  const _0x1dd5fa = await createStore(_0x14e19c, _0x3ab51f).init();
  const _0x1bad87 = createBus();
  const _0x31034a = (_0x1938cc, _0x56eef) =>
    _0x1bad87.emit(_0x1938cc, _0x56eef);
  const _0x155d2a = createWa(_0x2da8b9);
  const _0x58dba9 = createCrm({
    store: _0x1dd5fa,
    wa: _0x155d2a,
    emit: _0x31034a,
  });
  const _0x19bc27 = createActivity({
    store: _0x1dd5fa,
  });
  const _0x3d78fe =
    _0x9f796f ||
    createHttp({
      send: _0xe4f3ab,
    });
  const _0x3a4d8e =
    _0x161dfc ||
    createLicense({
      wa: _0x155d2a,
      http: _0x3d78fe,
      storage: _0x4c5d62 || memoryLicenseStorage(),
      config: _0x475415 || {
        server: LICENSE_SERVER,
        publicKey: LICENSE_PUBLIC_KEY,
        buildId: BUILD_ID,
      },
      deviceInfo: _0x5b7cfc,
      now: _0x5af2ac,
    });
  const _0x5132fb = () => _0x3a4d8e.isActive();
  const _0x57b638 = createWebhooks({
    store: _0x1dd5fa,
    http: _0x3d78fe,
    sleepFn: _0x914d77,
  });
  const _0x5c0164 = createSender({
    wa: _0x155d2a,
    store: _0x1dd5fa,
    emit: _0x31034a,
    now: _0x5af2ac,
    sleepFn: _0x914d77,
    licensed: _0x5132fb,
    resolveVars: (_0x129c8e) => _0x58dba9.vars(_0x129c8e),
  });
  const _0x53143b = createActions({
    wa: _0x155d2a,
    crm: _0x58dba9,
    webhooks: _0x57b638,
    activity: _0x19bc27,
  });
  const _0x2dc08f = createAi({
    store: _0x1dd5fa,
    http: _0x3d78fe,
  });
  const _0x15213d = createChatbotEngine({
    store: _0x1dd5fa,
    sender: _0x5c0164,
    crm: _0x58dba9,
    wa: _0x155d2a,
    http: _0x3d78fe,
    activity: _0x19bc27,
    webhooks: _0x57b638,
    actions: _0x53143b,
    emit: _0x31034a,
    now: _0x5af2ac,
    sleepFn: _0x914d77,
  });
  const _0xd1e639 = createAssistant({
    store: _0x1dd5fa,
    wa: _0x155d2a,
    ai: _0x2dc08f,
    sender: _0x5c0164,
    crm: _0x58dba9,
    webhooks: _0x57b638,
    activity: _0x19bc27,
    emit: _0x31034a,
    now: _0x5af2ac,
    sleepFn: _0x914d77,
  });
  const _0x17f437 = createAutomation({
    store: _0x1dd5fa,
    wa: _0x155d2a,
    sender: _0x5c0164,
    crm: _0x58dba9,
    actions: _0x53143b,
    webhooks: _0x57b638,
    activity: _0x19bc27,
    chatbots: _0x15213d,
    assistant: _0xd1e639,
    emit: _0x31034a,
    now: _0x5af2ac,
    sleepFn: _0x914d77,
    licensed: _0x5132fb,
  });
  const _0x4cb2f7 = createScheduler({
    store: _0x1dd5fa,
    wa: _0x155d2a,
    sender: _0x5c0164,
    crm: _0x58dba9,
    actions: _0x53143b,
    webhooks: _0x57b638,
    activity: _0x19bc27,
    emit: _0x31034a,
    now: _0x5af2ac,
    sleepFn: _0x914d77,
  });
  const _0x14979b = createReminders({
    store: _0x1dd5fa,
    crm: _0x58dba9,
    webhooks: _0x57b638,
    emit: _0x31034a,
    now: _0x5af2ac,
    notify: (_0x3f9ced) => {
      _0x31034a('notify', _0x3f9ced);
      if (_0x13c774) {
        _0x13c774(_0x3f9ced);
      }
    },
  });
  const _0x2a30e5 = createFilters({
    wa: _0x155d2a,
    crm: _0x58dba9,
    store: _0x1dd5fa,
  });
  let _0x346065 = null;
  let _0x364ea7 = false;
  async function _0x5c1eae() {
    if (_0x364ea7) {
      return;
    }
    _0x364ea7 = true;
    try {
      if (!_0x5132fb()) {
        return;
      }
      await _0x14979b.tick();
      if (_0x155d2a.isReady()) {
        await _0x15213d.tick();
        await _0x4cb2f7.tick();
      }
    } catch (_0x179794) {
      console.error('[WACRM] tick failed', _0x179794);
    } finally {
      _0x364ea7 = false;
    }
  }
  const _0x2e9979 = debounce(() => {
    if (!_0x1a00d8) {
      return;
    }
    try {
      _0x1a00d8(_0x14979b.upcoming().concat(_0x4cb2f7.upcoming()));
    } catch (_0x5cff07) {}
  }, 800);
  let _0x249007 = false;
  function _0x304228() {
    if (_0x249007) {
      return;
    }
    _0x249007 = true;
    _0x1bad87.on(
      'crm:stage',
      ({ chatId: _0xc153cf, stage: _0x2f2c28, previous: _0x34b80b }) =>
        _0x57b638.emit('stage_changed', {
          chatId: _0xc153cf,
          name: _0x58dba9.displayName(_0xc153cf),
          stage: _0x2f2c28 && _0x2f2c28.name,
          dashboard: _0x2f2c28 ? _0x58dba9.dashboardName(_0x2f2c28) : '',
          previousStageId: _0x34b80b,
        }),
    );
    _0x1bad87.on('crm:tag_added', ({ chatId: _0xeae6f5, tag: _0x54185c }) =>
      _0x57b638.emit('tag_added', {
        chatId: _0xeae6f5,
        name: _0x58dba9.displayName(_0xeae6f5),
        tag: _0x54185c && _0x54185c.name,
      }),
    );
    _0x1bad87.on('crm:note', ({ note: _0x28d32a }) =>
      _0x57b638.emit('note_added', {
        chatId: _0x28d32a.chatId,
        name: _0x58dba9.displayName(_0x28d32a.chatId),
        title: _0x28d32a.title,
      }),
    );
  }
  const _0x1308ea = {
    store: _0x1dd5fa,
    bus: _0x1bad87,
    emit: _0x31034a,
    wa: _0x155d2a,
    license: _0x3a4d8e,
    crm: _0x58dba9,
    activity: _0x19bc27,
    http: _0x3d78fe,
    webhooks: _0x57b638,
    sender: _0x5c0164,
    actions: _0x53143b,
    ai: _0x2dc08f,
    chatbots: _0x15213d,
    assistant: _0xd1e639,
    automation: _0x17f437,
    scheduler: _0x4cb2f7,
    reminders: _0x14979b,
    filters: _0x2a30e5,
    tick: _0x5c1eae,
    syncAlarms: _0x2e9979,
    async start() {
      await _0x58dba9.ensureDefaults();
      _0x155d2a.startWatching();
      _0x3a4d8e.start();
      _0x17f437.start();
      _0x1bad87.on('sender:sent', ({ chatId: _0x1a5fdc, message: _0x2bd3cb }) =>
        _0x57b638.emit('message_sent', {
          chatId: _0x1a5fdc,
          name: _0x58dba9.displayName(_0x1a5fdc),
          kind: _0x2bd3cb.kind,
          text: String(_0x2bd3cb.text || '').slice(0, 300),
        }),
      );
      _0x304228();
      _0x1bad87.on('message:in', (_0x2b3f08) =>
        _0x4cb2f7.onIncoming(_0x2b3f08.chatId),
      );
      for (const _0x55b5db of [
        'reminders',
        'appointments',
        'campaigns',
        'statusPosts',
      ]) {
        _0x1dd5fa.on(_0x55b5db, _0x2e9979);
      }
      _0x155d2a.whenReady(120000).then((_0x227e3c) => {
        if (_0x227e3c) {
          _0x4cb2f7.resumeOnBoot();
        }
      });
      const _0x2b11f6 = () =>
        _0x155d2a
          .setSignature(
            _0x5132fb() ? typedPrefix(_0x1dd5fa.settings() || {}) : '',
          )
          .catch(() => {});
      _0x155d2a.whenReady(120000).then((_0x144838) => {
        if (_0x144838) {
          _0x2b11f6();
        }
      });
      _0x1dd5fa.on('settings', _0x2b11f6);
      _0x3a4d8e.on(_0x2b11f6);
      _0x346065 = setInterval(_0x5c1eae, tickMs);
      setTimeout(_0x5c1eae, 1500);
      _0x2e9979();
      return _0x1308ea;
    },
    async startViewer() {
      await _0x58dba9.ensureDashboards();
      _0x155d2a.startWatching();
      _0x3a4d8e.start();
      _0x304228();
      return _0x1308ea;
    },
    stop() {
      if (_0x346065) {
        clearInterval(_0x346065);
      }
      _0x155d2a.stopWatching();
      _0x3a4d8e.stop();
      _0x17f437.stop();
    },
    async diagnostics() {
      const _0x3412e4 = await _0x155d2a.status();
      return {
        whatsapp: _0x3412e4,
        license: _0x3a4d8e.snapshot(),
        automationPaused: !!_0x1dd5fa.setting('automationPaused'),
        sentLastHour: _0x5c0164.sentLastHour(),
        typedSigning: {
          on: !!typedPrefix(_0x1dd5fa.settings() || {}),
          status: await _0x155d2a.signatureStatus().catch(() => null),
        },
        hourlyCap: _0x1dd5fa.setting('maxSendsPerHour'),
        activeChatbotSessions: _0x15213d.activeSessions().length,
        counts: {
          contacts: _0x1dd5fa.count('contacts'),
          notes: _0x1dd5fa.count('notes'),
          reminders: _0x1dd5fa.count('reminders'),
          appointments: _0x1dd5fa.count('appointments'),
          quickReplies: _0x1dd5fa.count('quickReplies'),
          messageBots: _0x1dd5fa.count('workflows'),
          chatbots: _0x1dd5fa.count('chatbots'),
          campaigns: _0x1dd5fa.count('campaigns'),
          webhooks: _0x1dd5fa.count('webhooks'),
        },
      };
    },
  };
  return _0x1308ea;
}
